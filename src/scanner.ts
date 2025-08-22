import { exec } from 'child_process';
import { promisify } from 'util';
import { AppInfo, ScanOptions, AppScanError } from './types';
import { IconProcessor } from './icon-processor';
import { PlistParser } from './plist-parser';

const execAsync = promisify(exec);

/**
 * Main class for scanning macOS applications
 */
export class MacOSAppScanner {
  private static readonly DEFAULT_SEARCH_PATHS = [
    '/Applications',
    '$HOME/Applications',
    '/System/Applications',
  ];
  private static readonly DEFAULT_OPTIONS: Required<ScanOptions> = {
    includeBase64Icon: false,
    iconSize: 256,
    searchPaths: MacOSAppScanner.DEFAULT_SEARCH_PATHS,
    timeout: 30000,
  };

  private readonly options: Required<ScanOptions>;

  constructor(options: ScanOptions = {}) {
    this.options = { ...MacOSAppScanner.DEFAULT_OPTIONS, ...options };
  }

  /**
   * Scan for all macOS applications
   */
  public async scanApplications(): Promise<AppInfo[]> {
    try {
      const appPaths = await this.findApplicationPaths();
      const apps = await Promise.allSettled(
        appPaths.map(({ appPath, plistPath }) =>
          this.processApplication(appPath, plistPath)
        )
      );

      const validApps = apps
        .filter(
          (result): result is PromiseFulfilledResult<AppInfo> =>
            result.status === 'fulfilled'
        )
        .map((result) => result.value);

      return this.deduplicateApps(validApps);
    } catch (error) {
      throw new AppScanError(
        'Failed to scan applications',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Get information for a specific application by bundle ID
   */
  public async getApplicationByBundleId(
    bundleId: string
  ): Promise<AppInfo | null> {
    const apps = await this.scanApplications();
    return apps.find((app) => app.bundleId === bundleId) || null;
  }

  /**
   * Get information for applications matching a name pattern
   */
  public async getApplicationsByName(
    namePattern: string | RegExp
  ): Promise<AppInfo[]> {
    const apps = await this.scanApplications();
    const pattern =
      typeof namePattern === 'string'
        ? new RegExp(namePattern, 'i')
        : namePattern;

    return apps.filter((app) => pattern.test(app.appName));
  }

  private async findApplicationPaths(): Promise<
    Array<{ appPath: string; plistPath: string }>
  > {
    const searchPathsStr = this.options.searchPaths
      .map((p) => `-onlyin "${p}"`)
      .join(' ');

    const cmd = `mdfind ${searchPathsStr} 'kMDItemKind == "Application"' \
      | grep -v '^/System/Applications/Utilities/' \
      | while IFS= read -r app; do
          info_plist="$app/Contents/Info.plist"
          if [ -f "$info_plist" ]; then
            printf "%s\\0%s\\0" "$app" "$info_plist"
          fi
        done`;

    const { stdout } = await execAsync(cmd, { timeout: this.options.timeout });
    const parts = stdout.split('\0').filter((part) => part.trim() !== '');

    const result: Array<{ appPath: string; plistPath: string }> = [];
    for (let i = 0; i < parts.length; i += 2) {
      const appPath = parts[i];
      const plistPath = parts[i + 1];

      if (appPath && plistPath) {
        result.push({ appPath, plistPath });
      }
    }

    return result;
  }

  private async processApplication(
    appPath: string,
    plistPath: string
  ): Promise<AppInfo> {
    try {
      const plistData = await PlistParser.readPlist(plistPath);
      const { appName, bundleId, appIconName } =
        PlistParser.extractAppInfo(plistData);

      let appIconPath: string | null = null;
      let appIconBase64: string | null = null;

      if (appIconName) {
        appIconPath = await IconProcessor.findIconFile(appPath, appIconName);

        if (appIconPath && this.options.includeBase64Icon) {
          try {
            appIconBase64 = await IconProcessor.convertToBase64(
              appIconPath,
              this.options.iconSize
            );
          } catch (error) {
            // Log warning but don't fail the entire operation
            console.warn(`Failed to convert icon for ${appName}:`, error);
          }
        }
      }

      return {
        appName,
        appPath,
        bundleId,
        appIconName,
        appIconPath,
        appIconBase64,
      };
    } catch (error) {
      throw new Error(`Failed to process application at ${appPath}: ${error}`);
    }
  }

  private deduplicateApps(apps: AppInfo[]): AppInfo[] {
    const appsByName = new Map<string, AppInfo[]>();

    apps.forEach((app) => {
      const existing = appsByName.get(app.appName) || [];
      existing.push(app);
      appsByName.set(app.appName, existing);
    });

    // For each app name, prefer the one from /Applications if it exists
    return Array.from(appsByName.entries()).map(([name, duplicateApps]) => {
      if (duplicateApps.length === 1) {
        return duplicateApps[0];
      }

      // Prefer /Applications path
      const applicationsApp = duplicateApps.find((app) =>
        app.appPath.startsWith('/Applications')
      );

      return applicationsApp || duplicateApps[0];
    });
  }
}

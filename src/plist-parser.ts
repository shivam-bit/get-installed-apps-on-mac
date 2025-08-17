import plist from 'simple-plist';
import { AppInfo } from './types';

/**
 * Utility class for parsing plist files and extracting app information
 */
export class PlistParser {
  /**
   * Extract app information from plist data
   */
  public static extractAppInfo(
    plistData: any
  ): Pick<AppInfo, 'appName' | 'bundleId' | 'appIconName'> {
    const appName =
      plistData.CFBundleDisplayName ||
      plistData.CFBundleName ||
      plistData.CFBundleExecutable ||
      'Unknown';

    const bundleId = plistData.CFBundleIdentifier || 'Unknown';

    let appIconName: string | null = null;

    // Try different icon name fields
    if (plistData.CFBundleIconFile) {
      appIconName = plistData.CFBundleIconFile;
    } else if (
      plistData.CFBundleIcons?.CFBundlePrimaryIcon?.CFBundleIconFiles
    ) {
      const iconFiles =
        plistData.CFBundleIcons.CFBundlePrimaryIcon.CFBundleIconFiles;
      appIconName = Array.isArray(iconFiles) ? iconFiles[0] : iconFiles;
    } else if (plistData.CFBundleIconName) {
      appIconName = plistData.CFBundleIconName;
    }

    return { appName, bundleId, appIconName };
  }

  /**
   * Read and parse a plist file
   */
  public static async readPlist(plistPath: string): Promise<any> {
    try {
      return plist.readFileSync(plistPath);
    } catch (error) {
      throw new Error(`Failed to read plist at ${plistPath}: ${error}`);
    }
  }
}

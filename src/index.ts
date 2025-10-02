// Export all types and classes
export {
  AppInfo,
  ScanOptions,
  AppScanError,
  IconProcessingError,
} from './types';
export { IconProcessor } from './icon-processor';
export { PlistParser } from './plist-parser';
export { MacOSAppScanner } from './scanner';

// Re-export for backwards compatibility and convenience
import { MacOSAppScanner } from './scanner';
import { ScanOptions, AppInfo } from './types';

/**
 * Convenience function to quickly scan all applications
 */
export async function scanMacOSApplications(
  options?: ScanOptions
): Promise<AppInfo[]> {
  const scanner = new MacOSAppScanner(options);
  return scanner.scanApplications();
}

/**
 * Convenience function to get a specific application by bundle ID
 */
export async function getMacOSApplication(
  bundleId: string,
  options?: ScanOptions
): Promise<AppInfo | null> {
  const scanner = new MacOSAppScanner(options);
  return scanner.getApplicationByBundleId(bundleId);
}

/**
 * Extract app information from a specific .app bundle path
 */
export async function getAppInfoFromPath(
  appPath: string,
  options?: Pick<ScanOptions, 'includeBase64Icon' | 'iconSize'>
): Promise<AppInfo> {
  const scanner = new MacOSAppScanner(options);
  return scanner.processAppFromPath(appPath);
}


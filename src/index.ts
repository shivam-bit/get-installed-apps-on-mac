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


// Example usage and testing
if (require.main === module) {
  async function main() {
    try {
      console.log('Scanning macOS applications...');

      const scanner = new MacOSAppScanner({
        includeBase64Icon: true,
        iconSize: 256,
      });

      const apps = await scanner.scanApplications();

      console.log(`Found ${apps.length} applications:\n`);

      apps.slice(0, 5).forEach((app, index) => {
        console.log(`${index + 1}. ${app.appName}`);
        console.log(`   Bundle ID: ${app.bundleId}`);
        console.log(`   Path: ${app.appPath}`);
        console.log(`   Icon: ${app.appIconPath || 'Not found'}`);
        console.log(
          `   Base64: ${app.appIconBase64 ? 'Available' : 'Not available'}`
        );
        console.log('');
      });

      // Test specific app lookup
      const safari = await scanner.getApplicationByBundleId('com.apple.Safari');
      if (safari) {
        console.log('Safari found:', safari.appName);
      }
    } catch (error) {
      console.error('Error:', error);
      process.exit(1);
    }
  }

  main();
}

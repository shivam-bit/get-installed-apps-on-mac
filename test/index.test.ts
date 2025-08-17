import {
  scanMacOSApplications,
  getMacOSApplication,
  MacOSAppScanner,
  AppInfo,
  ScanOptions,
} from '../src/index';

describe('MacOSAppScanner', () => {
  it('should scan applications and return an array', async () => {
    const apps = await scanMacOSApplications({ includeBase64Icon: true });
    // console.log('🚀 ~ apps:', apps);

    expect(Array.isArray(apps)).toBe(true);
    expect(apps.length).toBeGreaterThan(0);

    // Check structure of first app
    const app = apps[0];
    expect(app).toHaveProperty('appName');
    expect(app).toHaveProperty('appPath');
    expect(app).toHaveProperty('bundleId');
    expect(typeof app.appName).toBe('string');
    expect(typeof app.appPath).toBe('string');
    expect(typeof app.bundleId).toBe('string');
  }, 30000);

  it('should find Safari application by bundle ID', async () => {
    const safari = await getMacOSApplication('com.apple.Safari', {
      includeBase64Icon: true,
    });
    console.log('🚀 ~ safari:', safari);

    if (safari) {
      expect(safari.bundleId).toBe('com.apple.Safari');
      expect(safari.appName).toContain('Safari');
    }
    // Note: Safari might not be installed, so we don't assert it exists
  }, 15000);

  it('should create scanner with custom options', () => {
    const options: ScanOptions = {
      includeBase64Icon: false,
      iconSize: 128,
      searchPaths: ['/Applications'],
      timeout: 10000,
    };

    const scanner = new MacOSAppScanner(options);
    expect(scanner).toBeInstanceOf(MacOSAppScanner);
  });

  it('should handle empty search results gracefully', async () => {
    const scanner = new MacOSAppScanner({
      searchPaths: ['/nonexistent/path'],
      includeBase64Icon: false,
    });

    const apps = await scanner.scanApplications();
    expect(Array.isArray(apps)).toBe(true);
    expect(apps.length).toBe(0);
  }, 10000);

  it('should find applications by name pattern', async () => {
    const scanner = new MacOSAppScanner({ includeBase64Icon: false });
    const systemApps = await scanner.getApplicationsByName(/system|finder/i);

    expect(Array.isArray(systemApps)).toBe(true);
    // We expect at least some system apps to match
  }, 15000);
});

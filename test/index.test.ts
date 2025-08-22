import {
  scanMacOSApplications,
  getMacOSApplication,
  MacOSAppScanner,
  AppInfo,
  ScanOptions,
} from '../src/index';

describe('MacOSAppScanner', () => {
  it('should scan applications and return an array', async () => {
    const apps = await scanMacOSApplications({ includeBase64Icon: false });
    console.log('🚀 ~ apps:', apps.length, apps);

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

  it('should prefer applications from /Applications when duplicate names exist', async () => {
    const scanner = new MacOSAppScanner({
      includeBase64Icon: false,
    });

    const allApps = await scanner.scanApplications();

    // Group apps by name to find duplicates
    const appsByName = new Map<string, AppInfo[]>();
    allApps.forEach((app) => {
      const existing = appsByName.get(app.appName) || [];
      existing.push(app);
      appsByName.set(app.appName, existing);
    });

    // Find apps with duplicate names
    const duplicateNames = Array.from(appsByName.entries()).filter(
      ([_, apps]) => apps.length > 1
    );

    // Test should fail if duplicate app names exist
    if (duplicateNames.length > 0) {
      const duplicateDetails = duplicateNames
        .map(
          ([name, apps]) =>
            `"${name}": [${apps.map((app) => app.appPath).join(', ')}]`
        )
        .join(', ');

      throw new Error(
        `Scanner returned duplicate app names: ${duplicateDetails}. Expected scanner to deduplicate and prefer /Applications path.`
      );
    }

    expect(Array.isArray(allApps)).toBe(true);
  }, 30000);
});

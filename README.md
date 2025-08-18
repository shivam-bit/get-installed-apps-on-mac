# get-installed-apps-on-mac

A TypeScript library for scanning and retrieving information about installed macOS applications and PWAs (Progressive Web Apps), including app icons with base64 encoding support.

## Features

- 🔍 **Fast Application Discovery** - Uses macOS Spotlight (`mdfind`) for efficient app scanning
- 🌐 **PWA Support** - Automatically detects and includes installed Progressive Web Apps
- 📱 **App Icon Processing** - Extracts and converts app icons to base64 PNG format
- 🎯 **Flexible Search Options** - Search by bundle ID, name patterns, or custom paths
- 🛡️ **Type Safety** - Full TypeScript support with comprehensive type definitions
- ⚡ **Modular Architecture** - Clean, well-organized codebase with separate concerns
- 🧪 **Well Tested** - Comprehensive test suite included

## Installation

```bash
npm install get-installed-apps-on-mac
# or
yarn add get-installed-apps-on-mac
# or
pnpm add get-installed-apps-on-mac
```

## Quick Start

```typescript
import { scanMacOSApplications, getMacOSApplication } from 'get-installed-apps-on-mac';

// Scan all applications
const apps = await scanMacOSApplications();
console.log(`Found ${apps.length} applications`);

// Get a specific app by bundle ID
const safari = await getMacOSApplication('com.apple.Safari');
if (safari) {
  console.log(`Safari: ${safari.appName} at ${safari.appPath}`);
}
```

## API Reference

### `scanMacOSApplications(options?)`

Scans for all installed macOS applications.

```typescript
const apps = await scanMacOSApplications({
  includeBase64Icon: true,  // Include base64 encoded icons (default: true)
  iconSize: 512,           // Icon size in pixels (default: 512)
  searchPaths: [           // Custom search paths (default: ['/Applications', '$HOME/Applications'])
    '/Applications',
    '/System/Applications'
  ],
  timeout: 30000          // Command timeout in ms (default: 30000)
});
```

### `getMacOSApplication(bundleId, options?)`

Gets a specific application by its bundle identifier.

```typescript
const app = await getMacOSApplication('com.apple.TextEdit', {
  includeBase64Icon: false
});
```

### `MacOSAppScanner`

Main scanner class for advanced usage.

```typescript
import { MacOSAppScanner } from 'get-installed-apps-on-mac';

const scanner = new MacOSAppScanner({
  includeBase64Icon: true,
  iconSize: 256
});

// Scan all apps
const apps = await scanner.scanApplications();

// Find apps by name pattern
const textApps = await scanner.getApplicationsByName(/text|word/i);

// Get specific app
const finder = await scanner.getApplicationByBundleId('com.apple.finder');
```

## Data Structure

Each application returns the following information:

```typescript
interface AppInfo {
  readonly appName: string;           // Display name of the app
  readonly appPath: string;           // Full path to the .app bundle
  readonly bundleId: string;          // Bundle identifier (e.g., 'com.apple.Safari')
  readonly appIconName: string | null;// Icon filename from Info.plist
  readonly appIconPath: string | null;// Full path to the icon file
  readonly appIconBase64: string | null; // Base64 encoded PNG icon
}
```

## Configuration Options

```typescript
interface ScanOptions {
  readonly includeBase64Icon?: boolean; // Include base64 icon data (default: true)
  readonly iconSize?: number;           // Icon size in pixels (default: 512)
  readonly searchPaths?: string[];      // Paths to search (default: ['/Applications', '$HOME/Applications'])
  readonly timeout?: number;            // Command timeout in ms (default: 30000)
}
```

## Examples

### Basic App Listing

```typescript
import { scanMacOSApplications } from 'get-installed-apps-on-mac';

const apps = await scanMacOSApplications({ includeBase64Icon: false });

apps.forEach(app => {
  console.log(`${app.appName} (${app.bundleId})`);
  console.log(`  Path: ${app.appPath}`);
  console.log(`  Icon: ${app.appIconPath || 'Not found'}`);
});
```

### Icon Processing

```typescript
import { MacOSAppScanner } from 'get-installed-apps-on-mac';

const scanner = new MacOSAppScanner({
  includeBase64Icon: true,
  iconSize: 128  // Smaller icons for faster processing
});

const apps = await scanner.scanApplications();

apps.forEach(app => {
  if (app.appIconBase64) {
    // Use the base64 icon in your app
    console.log(`Icon data available for ${app.appName}`);
  }
});
```

### Search by Name Pattern

```typescript
import { MacOSAppScanner } from 'get-installed-apps-on-mac';

const scanner = new MacOSAppScanner();

// Find all Adobe apps
const adobeApps = await scanner.getApplicationsByName(/adobe/i);

// Find development tools
const devTools = await scanner.getApplicationsByName(/xcode|terminal|git/i);
```

## System Requirements

- **macOS 10.10+** (uses `mdfind` and `iconutil`)
- **Node.js 12+**
- **Dependencies**: `simple-plist`, `sharp` (for icon processing)

## Development

```bash
# Install dependencies
pnpm install

# Build the project
pnpm run build

# Run tests
pnpm test

# Development mode with watch
pnpm start

# Lint code
pnpm run lint
```

## Project Structure

```
src/
├── types.ts           # TypeScript interfaces and error classes
├── icon-processor.ts  # Icon extraction and conversion
├── plist-parser.ts    # Info.plist file parsing
├── scanner.ts         # Main MacOSAppScanner class
└── index.ts          # Public API exports
```

## Error Handling

The library includes custom error classes for better error handling:

```typescript
import { AppScanError, IconProcessingError } from 'get-installed-apps-on-mac';

try {
  const apps = await scanMacOSApplications();
} catch (error) {
  if (error instanceof AppScanError) {
    console.error('App scanning failed:', error.message);
  } else if (error instanceof IconProcessingError) {
    console.error('Icon processing failed:', error.iconPath, error.message);
  }
}
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
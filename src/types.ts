/**
 * Represents information about a macOS application
 */
export interface AppInfo {
  readonly appName: string;
  readonly appPath: string;
  readonly bundleId: string;
  readonly appIconName: string | null;
  readonly appIconPath: string | null;
  readonly appIconBase64: string | null;
}

/**
 * Configuration options for the MacOSAppScanner
 */
export interface ScanOptions {
  readonly includeBase64Icon?: boolean;
  readonly iconSize?: number;
  readonly searchPaths?: string[];
  readonly timeout?: number;
}

/**
 * Error thrown when app scanning fails
 */
export class AppScanError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'AppScanError';
  }
}

/**
 * Error thrown when icon processing fails
 */
export class IconProcessingError extends Error {
  constructor(message: string, public readonly iconPath: string, public readonly cause?: Error) {
    super(message);
    this.name = 'IconProcessingError';
  }
}
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs/promises';
import sharp from 'sharp';
import { IconProcessingError } from './types';

const execAsync = promisify(exec);

/**
 * Utility class for processing application icons
 */
export class IconProcessor {
  private static readonly SUPPORTED_EXTENSIONS = [
    '.icns',
    '.png',
    '.ico',
    '.tiff',
    '.tif',
  ];
  private static readonly TEMP_DIR = '/tmp';

  /**
   * Convert an icon file to base64 PNG
   */
  public static async convertToBase64(
    iconPath: string,
    size: number = 256
  ): Promise<string> {
    try {
      const ext = path.extname(iconPath).toLowerCase();

      if (ext === '.icns') {
        return await this.processIcnsFile(iconPath, size);
      } else {
        return await this.processStandardImage(iconPath, size);
      }
    } catch (error) {
      throw new IconProcessingError(
        `Failed to convert icon at ${iconPath}`,
        iconPath,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Find icon file in app bundle
   */
  public static async findIconFile(
    appPath: string,
    iconName: string
  ): Promise<string | null> {
    const searchPaths = [path.join(appPath, 'Contents', 'Resources'), appPath];

    for (const searchPath of searchPaths) {
      for (const ext of this.SUPPORTED_EXTENSIONS) {
        const iconFileName = iconName.endsWith(ext)
          ? iconName
          : `${iconName}${ext}`;
        const iconFilePath = path.join(searchPath, iconFileName);

        try {
          await fs.access(iconFilePath);
          return iconFilePath;
        } catch {
          continue;
        }
      }
    }

    return null;
  }

  private static async processIcnsFile(
    iconPath: string,
    size: number
  ): Promise<string> {
    const escapedPathForShell = iconPath.replace(/(["\\])/g, '\\$1');
    const tempIconset = path.join(
      this.TEMP_DIR,
      `iconset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.iconset`
    );

    try {
      // Extract iconset from ICNS
      await execAsync(
        `iconutil -c iconset "${escapedPathForShell}" -o "${tempIconset}"`
      );

      // Find the largest available icon
      const iconsetFiles = await fs.readdir(tempIconset);
      const largestIcon = this.findLargestIcon(iconsetFiles);

      if (!largestIcon) {
        throw new Error('No valid icons found in ICNS file');
      }

      const largestIconPath = path.join(tempIconset, largestIcon);
      const buffer = await sharp(largestIconPath)
        .png()
        .resize(size, size, { fit: 'inside', withoutEnlargement: true })
        .toBuffer();

      return `data:image/png;base64,${buffer.toString('base64')}`;
    } finally {
      // Clean up temp files
      try {
        await fs.rm(tempIconset, { recursive: true, force: true });
      } catch {
        // Ignore cleanup errors
      }
    }
  }

  private static async processStandardImage(
    iconPath: string,
    size: number
  ): Promise<string> {
    const buffer = await sharp(iconPath)
      .png()
      .resize(size, size, { fit: 'inside', withoutEnlargement: true })
      .toBuffer();

    return `data:image/png;base64,${buffer.toString('base64')}`;
  }

  private static findLargestIcon(iconFiles: string[]): string | null {
    return (
      iconFiles
        .filter((f) => f.endsWith('.png'))
        .sort((a, b) => {
          const sizeA = parseInt(a.match(/(\d+)x\d+/)?.[1] || '0');
          const sizeB = parseInt(b.match(/(\d+)x\d+/)?.[1] || '0');
          return sizeB - sizeA;
        })[0] || null
    );
  }
}

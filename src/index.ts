import { ChildProcess, exec, ExecSyncOptions } from 'child_process';
import path from 'node:path';
import { promisify } from 'util';
import plist from 'simple-plist';
import fs from 'fs';
import { toIconset } from 'iconutil';

const execAsync = promisify(exec);
const readFileAsync = promisify(fs.readFile);

const cmd = `
mdfind -onlyin /Applications -onlyin "$HOME/Applications" 'kMDItemKind == "Application"' | while read app; do
  name=$(mdls -raw -name kMDItemDisplayName "$app" 2>/dev/null | sed 's/.*= //' | sed 's/^"//' | sed 's/"$//')
  bundle_id=$(mdls -raw -name kMDItemCFBundleIdentifier "$app" 2>/dev/null | sed 's/.*= //' | sed 's/^"//' | sed 's/"$//')
  if [ -n "$bundle_id" ] && [ "$bundle_id" != "(null)" ]; then
    printf "%s\\0%s\\0%s\\0" "$app" "$name" "$bundle_id"
  fi
done
`;

/**
 * Read a .png or .icns, convert to PNG (in-memory), and return base64.
 * @param {string} absPath absolute path to .png or .icns
 * @returns {Promise<string>} base64-encoded PNG
 */
export async function pngBase64(absPath: string) {
  const ext = path.extname(absPath).toLowerCase();

  if (ext === '.png') {
    const buf = await readFileAsync(absPath);
    return buf.toString('base64');
  }

  if (ext === '.icns') {
    // iconutil.toIconset gives you an object { filename: Buffer (PNG) }
    const icons = await new Promise((resolve, reject) => {
      toIconset(absPath, (err: Error | null, icons: any) =>
        err ? reject(err) : resolve(icons)
      );
    });

    // Pick the largest PNG by parsing filenames like:
    // icon_16x16.png, icon_32x32@2x.png, icon_512x512@2x.png, etc.
    let best = null;
    let bestScore = -1;

    for (const [name, buf] of Object.entries(icons)) {
      // Try to parse "WxH" and optional "@2x"
      // Examples: "icon_16x16.png", "icon_32x32@2x.png", "icon_512x512@2x.png"
      const m = name.match(/_(\d+)x(\d+)(?:@(\d+)x)?\.png$/i);
      if (!m) continue;
      const w = parseInt(m[1], 10);
      const h = parseInt(m[2], 10);
      const scale = m[3] ? parseInt(m[3], 10) : 1;
      const effectivePixels = w * scale * h * scale; // prefer highest-resolution rendition
      if (effectivePixels > bestScore) {
        bestScore = effectivePixels;
        best = buf;
      }
    }

    if (!best) throw new Error('No PNG renditions found in ICNS');

    return best.toString('base64');
  }

  throw new Error(`Unsupported extension: ${ext}`);
}

const getIconFile = (appFileInput: string) => {
  return new Promise((resolve, reject) => {
    const plistPath = path.join(appFileInput, 'Contents', 'Info.plist');
    plist.readFile<any>(plistPath, (err: Error | null, result: any) => {
      if (err || !result?.CFBundleIconFile) {
        return resolve(
          '/System/Library/CoreServices/CoreTypes.bundle/Contents/Resources/GenericApplicationIcon.icns'
        );
      }
      const iconFile = path.join(
        appFileInput,
        'Contents',
        'Resources',
        result.CFBundleIconFile
      );
      const iconFiles = [iconFile, iconFile + '.icns', iconFile + '.tiff'];
      const existedIcon = iconFiles.find((iconFile) => {
        return fs.existsSync(iconFile);
      });
      resolve(
        existedIcon ||
          '/System/Library/CoreServices/CoreTypes.bundle/Contents/Resources/GenericApplicationIcon.icns'
      );
    });
  });
};

export const sum = async (a: number, b: number) => {
  if ('development' === process.env.NODE_ENV) {
    console.log('dev only output');
  }
  const { stdout } = await execAsync(cmd, {
    shell: '/bin/bash',
  });
  console.log('🚀 ~ sum ~ stdout:', stdout);

  const parts = stdout.split('\0').filter(Boolean);
  const apps = [];
  for (let i = 0; i + 2 < parts.length; i += 3) {
    const [p, name, bundleId] = [parts[i], parts[i + 1], parts[i + 2]];
    const iconFilePath = await getIconFile(p);
    apps.push({ path: p, name, bundleId, iconFilePath });
  }
  console.log('Hello World', process.env.NODE_ENV, apps);
  return a + b;
};

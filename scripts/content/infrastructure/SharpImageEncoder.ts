import sharp from 'sharp';
import type {
  AnimationInfo,
  EncodedImage,
  EncodedRendition,
  ImageEncoder,
  ImageInfo,
} from '../application/ports.ts';
import { TRANSPARENT_PIXEL_SHARE } from '../domain/mediaRules.ts';

const TARGET_WIDTHS = [640, 1024, 1600, 2400, 3200];

// Full chroma keeps fine coloured detail, such as type and linework, sharp.
const AVIF_OPTIONS = { quality: 62, effort: 5, chromaSubsampling: '4:4:4' } as const;
const WEBP_OPTIONS = { quality: 84, effort: 5, smartSubsample: true } as const;

const PLACEHOLDER_WIDTH = 16;

// Animated WebP is far heavier than video; only transparent GIFs such as a logo use it.
const ANIMATION_WIDTHS = [640, 1280];
const ANIMATION_WEBP_OPTIONS = { quality: 82, effort: 5 } as const;

const ALPHA_THRESHOLD = 128;

export class SharpImageEncoder implements ImageEncoder {
  readonly version = 'sharp-v1';

  async inspect(bytes: Uint8Array): Promise<ImageInfo> {
    const { width, height, orientation } = await sharp(bytes, { limitInputPixels: false }).metadata();
    if (!width || !height) {
      throw new Error('Not an image');
    }
    // EXIF orientations 5 to 8 are quarter turns.
    const isQuarterTurn = (orientation ?? 1) >= 5;
    return isQuarterTurn ? { width: height, height: width } : { width, height };
  }

  async encode(bytes: Uint8Array): Promise<EncodedImage> {
    const { width: sourceWidth, height: sourceHeight } = await this.inspect(bytes);
    const widths = renditionWidths(sourceWidth);
    const renditions: EncodedRendition[] = [];

    for (const width of widths) {
      const resized = this.upright(bytes).resize({ width, withoutEnlargement: true });
      const [avif, webp] = await Promise.all([
        resized.clone().avif(AVIF_OPTIONS).toBuffer(),
        resized.clone().webp(WEBP_OPTIONS).toBuffer(),
      ]);
      renditions.push({ width, format: 'avif', bytes: avif }, { width, format: 'webp', bytes: webp });
    }

    const placeholder = await this.upright(bytes)
      .resize({ width: PLACEHOLDER_WIDTH })
      .webp({ quality: 40 })
      .toBuffer();

    const largest = widths[widths.length - 1];

    return {
      width: largest,
      height: Math.round((sourceHeight * largest) / sourceWidth),
      renditions,
      placeholder: `data:image/webp;base64,${placeholder.toString('base64')}`,
    };
  }

  async inspectAnimation(bytes: Uint8Array): Promise<AnimationInfo> {
    const { width, pageHeight, height } = await sharp(bytes, { animated: true }).metadata();
    if (!width || !(pageHeight ?? height)) {
      throw new Error('Not an image');
    }

    // GIF metadata reports alpha for almost every GIF, so pixels are counted.
    const alpha = await sharp(bytes, { animated: true, limitInputPixels: false })
      .ensureAlpha()
      .extractChannel(3)
      .raw()
      .toBuffer();
    let transparent = 0;
    for (const value of alpha) {
      if (value < ALPHA_THRESHOLD) transparent += 1;
    }

    return {
      width,
      height: pageHeight ?? height!,
      isTransparent: transparent / alpha.length > TRANSPARENT_PIXEL_SHARE,
    };
  }

  async encodeAnimation(bytes: Uint8Array): Promise<EncodedImage> {
    const { width: sourceWidth, height: sourceHeight } = await this.inspectAnimation(bytes);
    const below = ANIMATION_WIDTHS.filter((width) => width < sourceWidth);
    const widths = [...new Set([...below, Math.min(sourceWidth, ANIMATION_WIDTHS[ANIMATION_WIDTHS.length - 1])])];
    const renditions: EncodedRendition[] = [];

    for (const width of widths) {
      const webp = await sharp(bytes, { animated: true, limitInputPixels: false })
        .resize({ width, withoutEnlargement: true })
        .webp(ANIMATION_WEBP_OPTIONS)
        .toBuffer();
      renditions.push({ width, format: 'webp', bytes: webp });
    }

    const placeholder = await sharp(bytes, { pages: 1 })
      .resize({ width: PLACEHOLDER_WIDTH })
      .webp({ quality: 40 })
      .toBuffer();

    const largest = widths[widths.length - 1];

    return {
      width: largest,
      height: Math.round((sourceHeight * largest) / sourceWidth),
      renditions,
      placeholder: `data:image/webp;base64,${placeholder.toString('base64')}`,
    };
  }

  private upright(bytes: Uint8Array) {
    // Print-resolution exports can exceed sharp's default pixel cap.
    return sharp(bytes, { limitInputPixels: false }).rotate().toColourspace('srgb');
  }
}

export function renditionWidths(sourceWidth: number): number[] {
  const below = TARGET_WIDTHS.filter((width) => width < sourceWidth);
  const top = Math.min(sourceWidth, TARGET_WIDTHS[TARGET_WIDTHS.length - 1]);
  return [...new Set([...below, top])].sort((a, b) => a - b);
}

import sharp from 'sharp';
import type { EncodedImage, EncodedRendition, ImageEncoder, ImageInfo } from '../application/ports.ts';

/**
 * Widths generated for every image, never above the source's own width. The top
 * one covers full-bleed images on large high density screens; the browser only
 * fetches it when the screen actually needs it.
 */
const TARGET_WIDTHS = [640, 1024, 1600, 2400, 3200];

/**
 * Tuned for a design portfolio, where artefacts are more visible than on a
 * typical site. AVIF keeps full chroma, which matters for fine coloured detail
 * such as type and linework.
 */
const AVIF_OPTIONS = { quality: 62, effort: 5, chromaSubsampling: '4:4:4' } as const;
const WEBP_OPTIONS = { quality: 84, effort: 5, smartSubsample: true } as const;

const PLACEHOLDER_WIDTH = 16;

/**
 * Adapter: ImageEncoder on top of sharp (libvips).
 *
 * Every rendition is rotated upright from its EXIF orientation, converted to
 * sRGB so colours look the same in every browser, and stripped of metadata such
 * as camera details and location.
 */
export class SharpImageEncoder implements ImageEncoder {
  readonly version = 'sharp-v1';

  async inspect(bytes: Uint8Array): Promise<ImageInfo> {
    // Reads the header only, without decoding the pixels.
    const { width, height, orientation } = await sharp(bytes, { limitInputPixels: false }).metadata();
    if (!width || !height) {
      throw new Error('Not an image');
    }
    // EXIF orientations 5 to 8 are rotated a quarter turn, which swaps the sides.
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

  private upright(bytes: Uint8Array) {
    // limitInputPixels: false, since print-resolution exports can exceed the default cap.
    return sharp(bytes, { limitInputPixels: false }).rotate().toColourspace('srgb');
  }
}

export function renditionWidths(sourceWidth: number): number[] {
  const below = TARGET_WIDTHS.filter((width) => width < sourceWidth);
  const top = Math.min(sourceWidth, TARGET_WIDTHS[TARGET_WIDTHS.length - 1]);
  return [...new Set([...below, top])].sort((a, b) => a - b);
}

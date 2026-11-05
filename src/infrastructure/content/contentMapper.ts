import type { ImageAsset, LoopAsset, MediaAsset, VideoAsset } from '../../application/domain/MediaAsset';
import type { WorkItem } from '../../application/domain/WorkItem';
import type { Section } from '../../application/domain/Section';
import type { SiteIdentity } from '../../application/domain/SiteIdentity';
import type {
  StoredImage,
  StoredLoop,
  StoredMedia,
  StoredSection,
  SiteDocument,
  StoredVideo,
  StoredWorkItem,
} from './contentSchema';

/** Must match the key layout the content scripts write. */
export class ContentMapper {
  constructor(private readonly mediaBaseUrl: string) {}

  toWorkItem(stored: StoredWorkItem): WorkItem {
    const media = stored.media.map((piece) => this.toMedia(piece));

    return {
      id: stored.id,
      title: stored.title,
      category: stored.category,
      description: stored.description,
      year: stored.year,
      tags: stored.tags,
      sectionId: stored.sectionId,
      cover: media[stored.coverIndex ?? 0],
      media,
    };
  }

  toSection(stored: StoredSection): Section {
    return {
      id: stored.id,
      title: stored.title,
      order: stored.order,
      cover: this.toImage(stored.cover),
      hover: stored.hover && this.toLoop(stored.hover),
    };
  }

  toSiteIdentity(stored: SiteDocument): SiteIdentity {
    return {
      hero: stored.hero && this.toImage(stored.hero),
      intro:
        stored.intro &&
        (stored.intro.kind === 'loop' ? this.toLoop(stored.intro) : this.toImage(stored.intro)),
    };
  }

  private toMedia(stored: StoredMedia): MediaAsset {
    switch (stored.kind) {
      case 'image':
        return this.toImage(stored);
      case 'video':
        return this.toVideo(stored);
      case 'loop':
        return this.toLoop(stored);
    }
  }

  private toImage(stored: StoredImage): ImageAsset {
    return {
      kind: 'image',
      width: stored.width,
      height: stored.height,
      sources: stored.formats.flatMap((format) =>
        stored.widths.map((width) => ({
          format,
          width,
          url: this.url(`${stored.key}/${width}.${format}`),
        }))
      ),
      placeholder: stored.placeholder,
      alt: stored.alt,
    };
  }

  private toVideo(stored: StoredVideo): VideoAsset {
    return {
      kind: 'video',
      width: stored.width,
      height: stored.height,
      url: this.url(`${stored.key}/master.m3u8`),
      poster: this.toImage(stored.poster),
      previewUrl: stored.hasPreview ? this.url(`${stored.key}/preview.mp4`) : undefined,
      durationSeconds: stored.durationSeconds,
      hasAudio: stored.hasAudio,
    };
  }

  private toLoop(stored: StoredLoop): LoopAsset {
    return {
      kind: 'loop',
      width: stored.width,
      height: stored.height,
      url: this.url(`${stored.key}/loop.mp4`),
      poster: this.toImage(stored.poster),
    };
  }

  private url(key: string): string {
    return `${this.mediaBaseUrl}/${key}`;
  }
}

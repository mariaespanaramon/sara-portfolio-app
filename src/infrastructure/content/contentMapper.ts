import type { ImageAsset, LoopAsset, MediaAsset, VideoAsset } from '../../application/domain/Media';
import type { WorkItem } from '../../application/domain/WorkItem';
import type { Section } from '../../application/domain/Section';
import type {
  StoredImage,
  StoredLoop,
  StoredMedia,
  StoredSection,
  StoredVideo,
  StoredWorkItem,
} from './contentSchema';

/**
 * Maps stored content to domain objects, resolving media keys to URLs.
 *
 * This is the only place that knows how keys in the media store turn into
 * addresses, so it must stay in step with the layout the content scripts write.
 */
export class ContentMapper {
  /** @param mediaBaseUrl - Where the media store is served, without a trailing slash. */
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

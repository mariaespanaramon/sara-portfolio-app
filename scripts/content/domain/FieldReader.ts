import { ContentError } from './ContentError.ts';
import type { MediaOptions } from './ProjectDraft.ts';

type Json = Record<string, unknown>;

/** Collects every problem, so they can all be fixed at once. */
export class FieldReader {
  readonly problems: string[] = [];
  private readonly json: Json;

  constructor(value: unknown) {
    this.json = (typeof value === 'object' && value !== null && !Array.isArray(value) ? value : {}) as Json;
  }

  text(field: string, required: true): string;
  text(field: string, required: false): string | undefined;
  text(field: string, required: boolean): string | undefined {
    const raw = this.json[field];
    if (raw === undefined && !required) return undefined;
    if (typeof raw !== 'string' || (required && raw.trim() === '')) {
      this.problems.push(`${field} must be ${required ? 'a non-empty' : 'a'} string`);
      return undefined;
    }
    return raw.trim();
  }

  year(field: string, required: boolean): string | undefined {
    const value = required ? this.text(field, true) : this.text(field, false);
    if (value && !/^\d{4}$/.test(value)) {
      this.problems.push(`${field} must be four digits, such as 2025`);
    }
    return value;
  }

  tags(field: string): string[] | undefined {
    const raw = this.json[field];
    if (raw === undefined) return undefined;
    if (!Array.isArray(raw) || !raw.every((tag) => typeof tag === 'string')) {
      this.problems.push(`${field} must be a list of strings`);
      return undefined;
    }
    return raw.map((tag) => tag.trim()).filter((tag) => tag !== '');
  }

  fileNames(field: string): string[] | undefined {
    const raw = this.json[field];
    if (raw === undefined) return undefined;
    if (!Array.isArray(raw) || !raw.every((name) => typeof name === 'string' && name !== '')) {
      this.problems.push(`${field} must be a list of file names`);
      return undefined;
    }
    return raw as string[];
  }

  textMap(field: string): Record<string, string> | undefined {
    const raw = this.json[field];
    if (raw === undefined) return undefined;
    if (
      typeof raw !== 'object' ||
      raw === null ||
      Array.isArray(raw) ||
      !Object.values(raw).every((text) => typeof text === 'string')
    ) {
      this.problems.push(`${field} must map names to texts`);
      return undefined;
    }
    return raw as Record<string, string>;
  }

  flag(field: string): boolean {
    const raw = this.json[field];
    if (raw === undefined) return false;
    if (typeof raw !== 'boolean') {
      this.problems.push(`${field} must be true or false`);
      return false;
    }
    return raw;
  }

  number(field: string): number | undefined {
    const raw = this.json[field];
    if (raw === undefined) return undefined;
    if (typeof raw !== 'number' || !Number.isFinite(raw)) {
      this.problems.push(`${field} must be a number`);
      return undefined;
    }
    return raw;
  }

  position(field: string): number | undefined {
    const raw = this.json[field];
    if (raw === undefined) return undefined;
    if (typeof raw !== 'number' || !Number.isInteger(raw) || raw < 1) {
      this.problems.push(`${field} must be a position, counting from 1`);
      return undefined;
    }
    return raw;
  }

  positions(field: string): number[] | undefined {
    const raw = this.json[field];
    if (raw === undefined) return undefined;
    if (
      !Array.isArray(raw) ||
      !raw.every((value) => typeof value === 'number' && Number.isInteger(value) && value >= 1)
    ) {
      this.problems.push(`${field} must be a list of positions, counting from 1`);
      return undefined;
    }
    return raw as number[];
  }

  mediaOptions(): MediaOptions {
    return {
      alts: this.textMap('alts'),
      loops: this.fileNames('loops'),
      keepTransparency: this.fileNames('keepTransparency'),
    };
  }

  done<T>(result: T): T {
    if (this.problems.length > 0) {
      throw new ContentError('INVALID_METADATA', `Invalid metadata: ${this.problems.join('; ')}`, {
        problems: this.problems,
      });
    }
    return result;
  }
}

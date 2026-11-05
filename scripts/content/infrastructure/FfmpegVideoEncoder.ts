import { execFile } from 'node:child_process';
import { mkdtemp, readdir, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { extname, join, relative } from 'node:path';
import { promisify } from 'node:util';
import type {
  EncodedLoop,
  EncodedVideo,
  OutputFile,
  VideoEncoder,
  VideoInfo,
} from '../application/ports.ts';

const run = promisify(execFile);

// By short side, so portrait videos get the same treatment.
const LADDER = [
  { shortSide: 1080, maxrate: '6000k', bufsize: '12000k' },
  { shortSide: 720, maxrate: '3500k', bufsize: '7000k' },
  { shortSide: 480, maxrate: '1600k', bufsize: '3200k' },
];

const OWN_RUNG_MARGIN = 1.1;

/** Without a rung of its own, a 540p source would top out at 480p. */
function ladderFor(sourceShort: number) {
  const fitting = LADDER.filter((rung) => rung.shortSide <= sourceShort);
  const top = fitting[0];

  if (top && sourceShort < top.shortSide * OWN_RUNG_MARGIN) {
    return fitting;
  }

  const above = LADDER.filter((rung) => rung.shortSide > sourceShort).pop() ?? LADDER[0];
  return [{ ...above, shortSide: even(Math.min(sourceShort, LADDER[0].shortSide)) }, ...fitting];
}

const VIDEO_CRF = '20';
const SEGMENT_SECONDS = 4;
const AUDIO_BITRATE = '128k';

const SILENCE_DB = -60;

const PREVIEW_SECONDS = 4;
const PREVIEW_SHORT_SIDE = 480;
const PREVIEW_CRF = '28';

const LOOP_MAX_SIDE = 1920;
// Above this, a clip is worth re-encoding even if it is already H.264.
const LOOP_MAX_BITS_PER_PIXEL = 0.1;

const CONTENT_TYPES: Record<string, string> = {
  '.m3u8': 'application/vnd.apple.mpegurl',
  '.m4s': 'video/iso.segment',
  '.mp4': 'video/mp4',
};

interface Stream {
  codec_type: string;
  codec_name?: string;
  width?: number;
  height?: number;
  pix_fmt?: string;
  bit_rate?: string;
  avg_frame_rate?: string;
  tags?: { rotate?: string };
  side_data_list?: { rotation?: number }[];
}

interface Probe {
  streams: Stream[];
  format: { duration?: string; format_name?: string };
}

async function probe(path: string): Promise<Probe> {
  const { stdout } = await run('ffprobe', [
    '-v', 'error', '-print_format', 'json', '-show_streams', '-show_format', path,
  ]);
  return JSON.parse(stdout) as Probe;
}

function videoStream(info: Probe): Stream {
  const stream = info.streams.find((candidate) => candidate.codec_type === 'video');
  if (!stream?.width || !stream.height) {
    throw new Error('No video stream');
  }
  return stream;
}

// Phones store portrait video as rotated landscape.
function displaySize(stream: Stream): { width: number; height: number } {
  const rotation = Number(stream.side_data_list?.find((data) => data.rotation !== undefined)?.rotation ?? stream.tags?.rotate ?? 0);
  const isQuarterTurn = Math.abs(rotation) % 180 === 90;
  return isQuarterTurn
    ? { width: stream.height!, height: stream.width! }
    : { width: stream.width!, height: stream.height! };
}

/** Infinity when unknown, so an unmeasurable clip is re-encoded rather than trusted. */
function bitsPerPixel(stream: Stream): number {
  const [frames, seconds] = (stream.avg_frame_rate ?? '').split('/').map(Number);
  const fps = frames / seconds;
  const bitRate = Number(stream.bit_rate);
  if (!fps || !bitRate || !stream.width || !stream.height) return Infinity;
  return bitRate / (stream.width * stream.height * fps);
}

function even(value: number): number {
  return Math.max(2, Math.round(value / 2) * 2);
}

function sizeFor(source: { width: number; height: number }, shortSide: number) {
  const isPortrait = source.height > source.width;
  const scale = shortSide / Math.min(source.width, source.height);
  return isPortrait
    ? { width: shortSide, height: even(source.height * scale) }
    : { width: even(source.width * scale), height: shortSide };
}

function scaleTo(source: { width: number; height: number }, shortSide: number): string {
  return source.height > source.width ? `scale=${shortSide}:-2` : `scale=-2:${shortSide}`;
}

async function ffmpeg(args: string[]): Promise<string> {
  const { stderr } = await run('ffmpeg', ['-hide_banner', '-y', ...args], {
    maxBuffer: 64 * 1024 * 1024,
  });
  return stderr;
}

async function outputFile(root: string, path: string): Promise<OutputFile> {
  return {
    name: relative(root, path).split('\\').join('/'),
    contentType: CONTENT_TYPES[extname(path)] ?? 'application/octet-stream',
    size: (await stat(path)).size,
    read: async () => new Uint8Array(await readFile(path)),
  };
}

async function filesUnder(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true, recursive: true });
  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => join(entry.parentPath, entry.name))
    .sort();
}

// H.264 and AAC: the one combination every browser plays, Safari and iOS included.
export class FfmpegVideoEncoder implements VideoEncoder {
  readonly version = 'ffmpeg-v2';

  async inspect(path: string): Promise<VideoInfo> {
    const info = await probe(path);
    const size = displaySize(videoStream(info));
    const hasAudioTrack = info.streams.some((stream) => stream.codec_type === 'audio');
    return {
      ...size,
      durationSeconds: Number(info.format.duration ?? 0),
      // Cameras and editors often export a silent track.
      hasSound: hasAudioTrack && !(await this.isSilent(path)),
    };
  }

  async encodeVideo(path: string): Promise<EncodedVideo> {
    const source = await this.inspect(path);
    const hasAudio = source.hasSound;
    const work = await mkdtemp(join(tmpdir(), 'video-'));
    const dispose = () => rm(work, { recursive: true, force: true });

    try {
      const sourceShort = Math.min(source.width, source.height);
      const rungs = ladderFor(sourceShort);

      const stream = join(work, 'stream');
      const split = `[0:v]split=${rungs.length}${rungs.map((_, i) => `[s${i}]`).join('')}`;
      const scales = rungs.map((rung, i) => `[s${i}]${scaleTo(source, rung.shortSide)}[v${i}]`);

      await ffmpeg([
        '-i', path,
        '-filter_complex', [split, ...scales].join(';'),
        ...rungs.flatMap((_, i) => ['-map', `[v${i}]`]),
        ...(hasAudio ? rungs.flatMap(() => ['-map', '0:a:0']) : []),
        '-c:v', 'libx264', '-profile:v', 'high', '-preset', 'slow', '-crf', VIDEO_CRF,
        '-pix_fmt', 'yuv420p',
        // Keyframes at segment boundaries, so renditions can switch there.
        '-sc_threshold', '0', '-force_key_frames', `expr:gte(t,n_forced*${SEGMENT_SECONDS})`,
        ...rungs.flatMap((rung, i) => [`-maxrate:v:${i}`, rung.maxrate, `-bufsize:v:${i}`, rung.bufsize]),
        ...(hasAudio ? ['-c:a', 'aac', '-b:a', AUDIO_BITRATE] : []),
        '-f', 'hls', '-hls_time', String(SEGMENT_SECONDS), '-hls_playlist_type', 'vod',
        '-hls_segment_type', 'fmp4', '-hls_flags', 'independent_segments',
        '-hls_segment_filename', join(stream, 'v%v', 'seg_%03d.m4s'),
        '-master_pl_name', 'master.m3u8',
        '-var_stream_map', rungs.map((_, i) => (hasAudio ? `v:${i},a:${i}` : `v:${i}`)).join(' '),
        join(stream, 'v%v', 'index.m3u8'),
      ]);

      const preview = join(work, 'preview.mp4');
      await ffmpeg([
        '-i', path, '-t', String(PREVIEW_SECONDS), '-an',
        '-vf', scaleTo(source, Math.min(PREVIEW_SHORT_SIDE, even(sourceShort))),
        '-c:v', 'libx264', '-preset', 'slow', '-crf', PREVIEW_CRF, '-pix_fmt', 'yuv420p',
        '-movflags', '+faststart', preview,
      ]);

      // Videos often open on black.
      const posterAt = Math.min(1, source.durationSeconds / 3);
      const poster = join(work, 'poster.png');
      await ffmpeg(['-ss', String(posterAt), '-i', path, '-frames:v', '1', poster]);

      const top = sizeFor(source, rungs[0].shortSide);

      return {
        ...top,
        durationSeconds: source.durationSeconds,
        hasAudio,
        stream: await Promise.all((await filesUnder(stream)).map((file) => outputFile(stream, file))),
        preview: await outputFile(work, preview),
        posterFrame: new Uint8Array(await readFile(poster)),
        dispose,
      };
    } catch (error) {
      await dispose();
      throw error;
    }
  }

  async encodeLoop(path: string, background: string): Promise<EncodedLoop> {
    const info = await probe(path);
    const stream = videoStream(info);
    const size = displaySize(stream);
    const work = await mkdtemp(join(tmpdir(), 'loop-'));
    const dispose = () => rm(work, { recursive: true, force: true });

    try {
      const clip = join(work, 'loop.mp4');

      // Re-encoding a suitable clip would only lose quality.
      const isReady =
        stream.codec_name === 'h264' &&
        stream.pix_fmt === 'yuv420p' &&
        Math.max(size.width, size.height) <= LOOP_MAX_SIDE &&
        bitsPerPixel(stream) <= LOOP_MAX_BITS_PER_PIXEL &&
        /mp4|mov/.test(info.format.format_name ?? '');

      if (isReady) {
        await ffmpeg(['-i', path, '-map', '0:v:0', '-c:v', 'copy', '-an', '-movflags', '+faststart', clip]);
      } else {
        const fit =
          `scale='if(gte(iw,ih),trunc(min(${LOOP_MAX_SIDE},iw)/2)*2,-2)'` +
          `:'if(gte(iw,ih),-2,trunc(min(${LOOP_MAX_SIDE},ih)/2)*2)':flags=lanczos`;
        const flatten = `format=rgba,split[fg][bg];[bg]drawbox=c=${background}@1:t=fill[filled];[filled][fg]overlay=format=auto,format=yuv420p`;

        await ffmpeg([
          '-i', path, '-an',
          '-filter_complex', `[0:v]${fit},${flatten}`,
          '-c:v', 'libx264', '-preset', 'slow', '-crf', VIDEO_CRF, '-movflags', '+faststart', clip,
        ]);
      }

      const poster = join(work, 'poster.png');
      await ffmpeg(['-i', clip, '-frames:v', '1', poster]);
      const output = displaySize(videoStream(await probe(clip)));

      return {
        ...output,
        clip: await outputFile(work, clip),
        posterFrame: new Uint8Array(await readFile(poster)),
        dispose,
      };
    } catch (error) {
      await dispose();
      throw error;
    }
  }

  private async isSilent(path: string): Promise<boolean> {
    const stderr = await ffmpeg(['-i', path, '-vn', '-af', 'volumedetect', '-f', 'null', '-']);
    const match = /max_volume:\s*(-?[\d.]+|-inf) dB/.exec(stderr);
    if (!match) return false;
    return match[1] === '-inf' || Number(match[1]) < SILENCE_DB;
  }
}

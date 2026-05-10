import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { randomUUID } from 'node:crypto';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import type { RenderRequest } from './schema.js';
import { buildPracticeExamProps } from './props.js';
import { generateTogetherAudioAssets } from './tts.js';
import { logRenderer } from './logger.js';

const renderTimeoutMs = Number(process.env.RENDER_TIMEOUT_MS || 3_600_000);

export type JobStatus = 'queued' | 'rendering' | 'done' | 'failed';

export interface RenderJob {
  id: string;
  status: JobStatus;
  createdAt: string;
  updatedAt: string;
  outputPath?: string;
  outputUrl?: string;
  metadataPath?: string;
  metadataUrl?: string;
  error?: string;
}

export class RenderQueue {
  private jobs = new Map<string, RenderJob>();
  private running = 0;
  private readonly queue: Array<() => void> = [];

  constructor(
    private readonly storageDir: string,
    private readonly publicBaseUrl: string,
    private readonly maxConcurrency: number,
  ) {}

  async create(request: RenderRequest): Promise<RenderJob> {
    const id = request.runId || randomUUID();
    const now = new Date().toISOString();
    const job: RenderJob = { id, status: 'queued', createdAt: now, updatedAt: now };
    this.jobs.set(id, job);

    logRenderer('job_queued', {
      jobId: id,
      questions: request.questions.length,
      dryRun: request.dryRun,
      queueDepth: this.queue.length,
    });
    void this.enqueue(() => this.render(job, request));
    return job;
  }

  get(id: string): RenderJob | undefined {
    return this.jobs.get(id);
  }

  private async enqueue(task: () => Promise<void>): Promise<void> {
    if (this.running >= this.maxConcurrency) {
      await new Promise<void>((resolve) => this.queue.push(resolve));
    }

    this.running++;
    try {
      await task();
    } finally {
      this.running--;
      this.queue.shift()?.();
    }
  }

  private async render(job: RenderJob, request: RenderRequest): Promise<void> {
    const jobDir = path.join(this.storageDir, job.id);
    const publicDir = path.join(jobDir, 'public');
    const outputPath = path.join(jobDir, 'practice-exam-walkthrough.mp4');

    try {
      this.update(job.id, { status: 'rendering' });
      logRenderer('job_rendering', { jobId: job.id, jobDir });
      await fs.mkdir(publicDir, { recursive: true });

      logRenderer('audio_prepare_start', {
        jobId: job.id,
        providedAudioAssets: request.audioAssets.length,
        dryRun: request.dryRun,
      });
      const audioAssets = request.audioAssets.length > 0 || request.dryRun
        ? request.audioAssets
        : await generateTogetherAudioAssets(request.questions);
      logRenderer('audio_prepare_done', { jobId: job.id, audioAssets: audioAssets.length });

      for (const asset of audioAssets) {
        await fs.writeFile(path.join(publicDir, asset.fileName), Buffer.from(asset.contentBase64, 'base64'));
      }
      logRenderer('audio_assets_written', { jobId: job.id, audioAssets: audioAssets.length });

      const inputProps = buildPracticeExamProps({ ...request, audioAssets });
      await fs.writeFile(path.join(jobDir, 'input-props.json'), JSON.stringify(inputProps, null, 2));
      logRenderer('input_props_written', {
        jobId: job.id,
        durationInFrames: inputProps.durationInFrames,
        fps: inputProps.fps,
        questions: inputProps.questions.length,
      });

      const entryPoint = path.resolve(process.cwd(), '../../remotion/index.ts');
      logRenderer('bundle_start', { jobId: job.id, entryPoint });
      const serveUrl = await bundle({
        entryPoint,
        publicDir,
        webpackOverride: (config) => config,
      });
      logRenderer('bundle_done', { jobId: job.id });
      logRenderer('composition_select_start', { jobId: job.id });
      const composition = await selectComposition({
        serveUrl,
        id: 'PracticeExamWalkthrough',
        inputProps: inputProps as unknown as Record<string, unknown>,
      });
      logRenderer('composition_select_done', {
        jobId: job.id,
        width: composition.width,
        height: composition.height,
        frames: composition.durationInFrames,
        fps: composition.fps,
      });

      logRenderer('render_media_start', { jobId: job.id, outputPath, timeoutMs: renderTimeoutMs });
      await renderMedia({
        serveUrl,
        composition,
        codec: 'h264',
        outputLocation: outputPath,
        inputProps: inputProps as unknown as Record<string, unknown>,
        chromiumOptions: {},
        concurrency: 1,
        timeoutInMilliseconds: renderTimeoutMs,
        envVariables: {},
      });

      const stat = await fs.stat(outputPath);
      if (stat.size < 10_000) throw new Error('Render produced an unexpectedly small MP4');
      logRenderer('render_media_done', { jobId: job.id, outputPath, bytes: stat.size });

      const metadataPath = path.join(jobDir, 'youtube-metadata.json');
      await fs.writeFile(metadataPath, JSON.stringify(buildYouTubeMetadata(inputProps), null, 2));
      logRenderer('metadata_written', { jobId: job.id, metadataPath });

      this.update(job.id, {
        status: 'done',
        outputPath,
        outputUrl: `${this.publicBaseUrl}/artifacts/${job.id}/practice-exam-walkthrough.mp4`,
        metadataPath,
        metadataUrl: `${this.publicBaseUrl}/artifacts/${job.id}/youtube-metadata.json`,
      });
      logRenderer('job_done', {
        jobId: job.id,
        outputUrl: `${this.publicBaseUrl}/artifacts/${job.id}/practice-exam-walkthrough.mp4`,
        metadataUrl: `${this.publicBaseUrl}/artifacts/${job.id}/youtube-metadata.json`,
      });
    } catch (error) {
      this.update(job.id, {
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
      });
      logRenderer('job_failed', {
        jobId: job.id,
        error: error instanceof Error ? error.message : String(error),
      }, 'error');
    }
  }

  private update(id: string, patch: Partial<RenderJob>): void {
    const existing = this.jobs.get(id);
    if (!existing) return;
    this.jobs.set(id, { ...existing, ...patch, updatedAt: new Date().toISOString() });
  }
}

function buildYouTubeMetadata(inputProps: ReturnType<typeof buildPracticeExamProps>) {
  const topicCounts = new Map<string, number>();
  for (const question of inputProps.questions) {
    if (!question.topic) continue;
    topicCounts.set(question.topic, (topicCounts.get(question.topic) || 0) + 1);
  }
  const topTopics = [...topicCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([topic]) => topic);

  const title = `${inputProps.examTitle} Practice Exam Walkthrough - ${inputProps.questions.length} Questions`;
  const chapters = inputProps.questions.map((question, index) => {
    const seconds = 8 + index * question.durationSeconds + (index >= 20 ? 6 : 0);
    const minutes = Math.floor(seconds / 60);
    const remainder = Math.floor(seconds % 60).toString().padStart(2, '0');
    return {
      timestamp: `${minutes}:${remainder}`,
      title: `Question ${question.number}${question.topic ? ` - ${question.topic}` : ''}`,
    };
  });

  return {
    title,
    description: [
      `${title}.`,
      '',
      'Work through each question, pause before the answer reveal, then review the explanation.',
      '',
      'Chapters:',
      ...chapters.map((chapter) => `${chapter.timestamp} ${chapter.title}`),
    ].join('\n'),
    tags: [
      inputProps.examTitle,
      'practice exam',
      'exam walkthrough',
      'certification',
      ...topTopics,
    ].filter(Boolean),
    chapters,
  };
}

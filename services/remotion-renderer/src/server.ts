import * as http from 'node:http';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { RenderRequestSchema } from './schema.js';
import { RenderQueue } from './jobs.js';
import { logRenderer } from './logger.js';

const port = Number(process.env.PORT || 3030);
const storageDir = process.env.STORAGE_DIR || path.resolve(process.cwd(), '../../data/artifacts');
const publicBaseUrl = process.env.PUBLIC_BASE_URL || `http://localhost:${port}`;
const maxConcurrency = Math.max(1, Number(process.env.MAX_CONCURRENCY || 1));
const authToken = process.env.RENDERER_AUTH_TOKEN || '';
const maxBodyBytes = Math.max(1024, Number(process.env.MAX_BODY_BYTES || 25 * 1024 * 1024));

const queue = new RenderQueue(storageDir, publicBaseUrl, maxConcurrency);

logRenderer('configured', {
  port,
  storageDir,
  publicBaseUrl,
  maxConcurrency,
  authEnabled: Boolean(authToken),
  maxBodyBytes,
});

async function readJson(req: http.IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    const buffer = Buffer.from(chunk);
    size += buffer.length;
    if (size > maxBodyBytes) {
      throw Object.assign(new Error(`Request body exceeds ${maxBodyBytes} bytes`), { statusCode: 413 });
    }
    chunks.push(buffer);
  }
  const body = Buffer.concat(chunks).toString('utf-8');
  return body ? JSON.parse(body) : {};
}

function send(res: http.ServerResponse, status: number, data: unknown): void {
  const body = JSON.stringify(data, null, 2);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(body),
  });
  res.end(body);
}

function sendFile(res: http.ServerResponse, filePath: string): void {
  if (!fs.existsSync(filePath)) {
    send(res, 404, { error: 'Artifact not found' });
    return;
  }
  res.writeHead(200, { 'content-type': 'video/mp4' });
  fs.createReadStream(filePath).pipe(res);
}

function sendJsonFile(res: http.ServerResponse, filePath: string): void {
  if (!fs.existsSync(filePath)) {
    send(res, 404, { error: 'Artifact not found' });
    return;
  }
  res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
  fs.createReadStream(filePath).pipe(res);
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

    if (req.method === 'GET' && url.pathname === '/healthz') {
      send(res, 200, { ok: true, service: 'remotion-renderer' });
      return;
    }

    if (authToken && !isAuthorized(req)) {
      send(res, 401, { error: 'Unauthorized' });
      return;
    }

    if (req.method === 'POST' && url.pathname === '/render') {
      const parsed = RenderRequestSchema.safeParse(await readJson(req));
      if (!parsed.success) {
        logRenderer('render_request_rejected', {
          issues: parsed.error.issues.length,
        }, 'warn');
        send(res, 400, { error: 'Invalid render request', issues: parsed.error.issues });
        return;
      }
      const job = await queue.create(parsed.data);
      logRenderer('render_request_accepted', {
        jobId: job.id,
        questions: parsed.data.questions.length,
        dryRun: parsed.data.dryRun,
      });
      send(res, 202, job);
      return;
    }

    const jobMatch = url.pathname.match(/^\/jobs\/([^/]+)$/);
    if (req.method === 'GET' && jobMatch) {
      const job = queue.get(jobMatch[1]);
      if (!job) {
        send(res, 404, { error: 'Job not found' });
        return;
      }
      send(res, 200, job);
      return;
    }

    const artifactMatch = url.pathname.match(/^\/artifacts\/([^/]+)\/practice-exam-walkthrough\.mp4$/);
    if (req.method === 'GET' && artifactMatch) {
      sendFile(res, path.join(storageDir, artifactMatch[1], 'practice-exam-walkthrough.mp4'));
      return;
    }

    const metadataMatch = url.pathname.match(/^\/artifacts\/([^/]+)\/youtube-metadata\.json$/);
    if (req.method === 'GET' && metadataMatch) {
      sendJsonFile(res, path.join(storageDir, metadataMatch[1], 'youtube-metadata.json'));
      return;
    }

    send(res, 404, { error: 'Not found' });
  } catch (error) {
    const status = typeof error === 'object' && error && 'statusCode' in error ? Number(error.statusCode) : 500;
    logRenderer('request_failed', {
      status,
      error: error instanceof Error ? error.message : String(error),
    }, 'error');
    send(res, status, { error: error instanceof Error ? error.message : String(error) });
  }
});

server.listen(port, () => {
  console.log(`remotion-renderer listening on :${port}`);
});

function isAuthorized(req: http.IncomingMessage): boolean {
  const header = req.headers.authorization || '';
  return header === `Bearer ${authToken}`;
}

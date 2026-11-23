import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import {
  buildVasoSenseSystemInstruction,
  type LiveTelemetryContext,
} from './src/data/vasosenseKnowledgeBase.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = Number(process.env.PORT) || 3000;

interface IncomingChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatRequestBody {
  messages?: IncomingChatMessage[];
  telemetryContext?: LiveTelemetryContext;
}

const MODEL_CANDIDATES = ['gemini-2.5-flash', 'gemini-3-flash-preview', 'gemini-4-hydrogen'] as const;
let preferredModel: string = MODEL_CANDIDATES[0];

function extractErrorStatus(err: unknown): number {
  if (typeof err === 'object' && err !== null) {
    const maybeStatus = (err as { status?: unknown }).status;
    if (typeof maybeStatus === 'number') return maybeStatus;
    const msg = (err as { message?: string }).message ?? '';
    if (/403|PERMISSION_DENIED/i.test(msg)) return 403;
    if (/400|API_KEY_INVALID|INVALID_ARGUMENT/i.test(msg)) return 400;
    if (/429|RESOURCE_EXHAUSTED/i.test(msg)) return 429;
    if (/404|NOT_FOUND/i.test(msg)) return 404;
    if (/503|UNAVAILABLE/i.test(msg)) return 503;
  }
  return 500;
}

async function generateWithFallback(
  ai: GoogleGenAI,
  contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }>,
  systemInstruction: string
) {
  const orderedModels = [
    preferredModel,
    ...MODEL_CANDIDATES.filter((m) => m !== preferredModel),
  ];

  let lastErr: unknown;
  for (const model of orderedModels) {
    const t0 = Date.now();
    try {
      const response = await ai.models.generateContent({
        model,
        contents,
        config: {
          systemInstruction,
        },
      });
      preferredModel = model;
      console.info(`[AI] model=${model} ok (${Date.now() - t0}ms)`);
      return { response, model };
    } catch (err) {
      lastErr = err;
      const status = extractErrorStatus(err);
      console.error(
        `[AI] model=${model} status=${status} (${Date.now() - t0}ms):`,
        err instanceof Error ? err.message : err
      );
      if (status === 400 || status === 403) {
        throw err;
      }
      // Try next candidate on 404, 429, 500, 503, or timeout
    }
  }
  throw lastErr;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', service: 'vasosense-clinical' });
  });

  app.post('/api/ai/chat', async (req: Request, res: Response) => {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      res.status(503).json({
        error:
          'Gemini API key is not configured. Open Settings > Secrets and set GEMINI_API_KEY to activate VasoSense AI.',
      });
      return;
    }

    const body = (req.body ?? {}) as ChatRequestBody;
    const rawMessages = Array.isArray(body.messages) ? body.messages : [];
    const cleanedMessages = rawMessages
      .filter(
        (m): m is IncomingChatMessage =>
          Boolean(m) &&
          (m.role === 'user' || m.role === 'assistant') &&
          typeof m.content === 'string' &&
          m.content.trim().length > 0
      )
      .slice(-16);

    if (cleanedMessages.length === 0) {
      res.status(400).json({ error: 'Please enter a non-empty question for VasoSense AI.' });
      return;
    }

    const contents = cleanedMessages.map((m) => ({
      role: (m.role === 'assistant' ? 'model' : 'user') as 'user' | 'model',
      parts: [{ text: m.content.trim() }],
    }));

    const systemInstruction = buildVasoSenseSystemInstruction(body.telemetryContext);
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        timeout: 22000,
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    try {
      const { response, model } = await generateWithFallback(
        ai,
        contents,
        systemInstruction
      );

      const replyText = (response.text ?? '').trim();
      if (!replyText) {
        res.status(502).json({
          error: 'VasoSense AI returned an empty response. Please rephrase your question and try again.',
        });
        return;
      }

      res.json({ reply: replyText, model });
    } catch (err) {
      const status = extractErrorStatus(err);
      const rawMessage = err instanceof Error ? err.message : 'Unknown Gemini API error';

      if (status === 400 || status === 403) {
        res.status(status).json({
          error:
            'Unable to authenticate with the Gemini API. Please verify GEMINI_API_KEY in Settings > Secrets.',
        });
        return;
      }

      if (status === 429) {
        res.status(429).json({
          error: 'Gemini API rate limit reached (429). Please wait a moment and try again.',
        });
        return;
      }

      if (status === 503) {
        res.status(503).json({
          error: 'VasoSense AI is temporarily experiencing high upstream demand (503). Please retry in a few seconds.',
        });
        return;
      }

      res.status(status >= 400 && status < 600 ? status : 500).json({
        error: `VasoSense AI upstream error: ${rawMessage}`,
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      const indexPath = path.join(distDir, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('Build output not found. Run npm run build first.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`VasoSense Clinical server listening on http://localhost:${PORT}`);
  });
}

void startServer();

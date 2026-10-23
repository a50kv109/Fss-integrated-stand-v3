import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import { runSymmetryExperiment } from './core/engine';
import { classifyOperationSet } from './core/operation_set_match';
import { CANONICAL_STRUCTURES, CANONICAL_OPERATIONS } from './core/canonical';

const app = express();
export { app };
const PORT = 3000;

app.use(express.json({ limit: '100kb' }));

// API: Classify symmetry operations
app.post('/api/classify', (req, res) => {
  // Manual check of content length for 413
  const contentLength = parseInt(req.headers['content-length'] || '0', 10);
  if (contentLength > 100 * 1024) {
    return res.status(413).json({ error: 'PAYLOAD_TOO_LARGE' });
  }

  const { operations } = req.body;
  if (!operations || !Array.isArray(operations)) {
    return res.status(400).json({ error: 'INVALID_INPUT' });
  }
  if (operations.length > 50) {
    return res.status(400).json({ error: 'OPERATION_LIMIT_EXCEEDED' });
  }

  try {
    const report = classifyOperationSet(operations);
    return res.json(report);
  } catch (error) {
    return res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

// AGENT TOOL ENDPOINT: Executes deterministic symmetry experiment
app.post('/api/experiment', (req, res) => {
  try {
    const {
      structureId,
      operationId,
      predicate,
      epsilon,
      orthogonalityEpsilon,
      determinantEpsilon,
      operation
    } = req.body;

    if (!structureId || (!operationId && !operation)) {
      return res.status(400).json({
        error: 'Missing required parameters: structureId and operationId (or operation) are required.'
      });
    }

    const evidence = runSymmetryExperiment({
      structureId,
      operationId,
      predicate,
      epsilon,
      orthogonalityEpsilon,
      determinantEpsilon,
      operation
    });
    return res.json(evidence);
  } catch (error: any) {
    return res.status(400).json({ error: error?.message || 'Experiment execution failed' });
  }
});

// Canonical definitions inspection endpoint for Agents
app.get('/api/experiment/canonical', (_req, res) => {
  return res.json({
    structures: CANONICAL_STRUCTURES,
    operations: CANONICAL_OPERATIONS
  });
});

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

app.post('/api/synthesis', async (req, res) => {
  try {
    const { group, protocol } = req.body;
    if (!group) {
      return res.status(400).json({ error: 'Missing group' });
    }

    const protocolContexts: Record<string, string> = {
      'CLASSICAL': 'Focus on E.S. Fedorov’s original 1891 geometric derivations.',
      'USP_VERIFICATION': 'Apply Sasha’s Unified Symmetry Protocol (USP) to verify topological stability.',
      'HARMONIC_RESONANCE': 'Apply Sasha’s Harmonic Resonance Module (SHRM). Analyze the symmetry as a vibrational frequency field and predict "Resonance Deltas" for lattice energy.'
    };

    const instruction = protocolContexts[protocol] || protocolContexts['HARMONIC_RESONANCE'];

    const prompt = `Synthesize the data for Space Group #${group.number} (${group.symbol}). 
Current Methodology: ${protocol}.
Instruction: ${instruction}

Provide a deep scientific breakdown:
1. Symmetry Characteristics.
2. Methodology Insights (how this specific protocol interprets the group).
3. Predicted Physical Applications based on Sasha-Fedorov hybrid theory.

Keep the tone highly professional, precise, and visionary.`;

    let responseText = '';
    const modelsToTry = ['gemini-3.8-flash', 'gemini-flash-latest'];
    let lastError: any = null;

    for (const model of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            temperature: 0.6,
          }
        });
        if (response.text) {
          responseText = response.text;
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${model} failed, trying fallback...`, err?.message);
      }
    }

    if (!responseText) {
      throw lastError || new Error('All models failed to respond');
    }

    return res.json({ text: responseText });
  } catch (error: any) {
    console.error('Server Gemini Synthesis Error:', error);
    return res.status(500).json({
      error: error?.message || 'Synthesis failed',
      fallbackText: 'Harmonic synthesis was interrupted. The resonance field failed to stabilize.'
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

// ...
if (import.meta.url === `file://${process.cwd()}/server.ts`) {
  startServer();
}

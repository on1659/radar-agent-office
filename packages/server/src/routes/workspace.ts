// Design Ref: §4.1 — GET /api/workspace/* (M2: live data from parsers)
import type { FastifyInstance } from 'fastify';
import { config } from '../config.js';
import { scanWorkspace } from '../services/workspace-scanner.js';
import { getActiveJobCount } from '../services/agent-pool.js';

export async function workspaceRoutes(app: FastifyInstance) {
  app.get('/api/workspace/overview', async () => {
    const data = await scanWorkspace(config.workspaceRoot);
    data.overview.activeJobs = getActiveJobCount();
    return data.overview;
  });

  app.get('/api/workspace/agents', async () => {
    const data = await scanWorkspace(config.workspaceRoot);
    return data.agents;
  });

  app.get('/api/workspace/skills', async () => {
    const data = await scanWorkspace(config.workspaceRoot);
    return data.skills;
  });

  app.get('/api/workspace/hooks', async () => {
    const data = await scanWorkspace(config.workspaceRoot);
    return data.hooks;
  });

  app.get('/api/workspace/rules', async () => {
    const data = await scanWorkspace(config.workspaceRoot);
    return data.rules;
  });
}

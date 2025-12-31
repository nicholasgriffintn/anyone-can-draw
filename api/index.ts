import type {
  ExportedHandler,
  Request as CfRequest,
  Response as CfResponse,
} from '@cloudflare/workers-types';

import { Multiplayer } from './multiplayer/multiplayer';
import type { Env } from './types';

async function handleRequest(
  request: CfRequest,
  env: Env
): Promise<CfResponse> {
  const url = new URL(request.url);

  if (url.pathname === '/ws') {
    return handleMultiplayerWebSocket(url, request, env);
  }

  if (url.pathname.startsWith('/api/')) {
    return handleApiRequest(url, request, env);
  }

  return env.ASSETS.fetch(request);
}

function getDrawingBaseUrl(env: Env) {
  return env.DRAWING_API_BASE_URL || 'https://api.polychat.app';
}

async function handleMultiplayerWebSocket(
  url: URL,
  request: CfRequest,
  env: Env
): Promise<CfResponse> {
  const upgradeHeader = request.headers.get('Upgrade');
  if (!upgradeHeader || upgradeHeader !== 'websocket') {
    return new Response('Expected Upgrade: websocket', {
      status: 426,
    }) as unknown as CfResponse;
  }

  const gameType = 'anyone-can-draw';
  const gameId = url.searchParams.get('gameId') ?? '';

  if (!gameType) {
    return new Response('Game type is required', {
      status: 400,
    }) as unknown as CfResponse;
  }

  if (!env.MULTIPLAYER) {
    return new Response('Durable Object namespace not found', {
      status: 500,
    }) as unknown as CfResponse;
  }

  const id = env.MULTIPLAYER.idFromName(`${gameType}:${gameId}`);
  const stub = env.MULTIPLAYER.get(id);

  return stub.fetch(request);
}

async function handleApiRequest(
  url: URL,
  request: CfRequest,
  env: Env
): Promise<CfResponse> {
  const path = url.pathname.substring(5); // Remove '/api/'

  if (path === 'drawing' && request.method === 'POST') {
    const token = env.DRAWING_API_TOKEN;
    if (!token) {
      return new Response(JSON.stringify({ error: 'Missing API token' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }) as unknown as CfResponse;
    }

    const contentType = request.headers.get('content-type') || '';
    const body = await request.arrayBuffer();

    const response = await fetch(`${getDrawingBaseUrl(env)}/apps/drawing`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': contentType,
        'User-Agent': 'AnyoneCanDraw',
        'x-user-email':
          request.headers.get('x-user-email') ||
          'anonymous@anyone-can-draw.app',
      },
      body,
    });

    return new Response(response.body, {
      status: response.status,
      headers: {
        'Content-Type':
          response.headers.get('content-type') || 'application/json',
      },
    }) as unknown as CfResponse;
  }

  return new Response(JSON.stringify({ error: 'Not found' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' },
  }) as unknown as CfResponse;
}

export default {
  async fetch(request: CfRequest, env: Env): Promise<CfResponse> {
    return handleRequest(request, env);
  },
} satisfies ExportedHandler<Env>;

export { Multiplayer };

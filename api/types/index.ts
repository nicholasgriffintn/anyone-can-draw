import type {
  DurableObjectNamespace,
  Fetcher,
} from '@cloudflare/workers-types';

export interface Env {
  // Cloudflare Workers bindings
  MULTIPLAYER: DurableObjectNamespace;
  ASSETS: Fetcher;

  // Application configuration
  APP_NAME?: string;
  ENVIRONMENT?: string;
  APP_VERSION?: string;

  // Drawing API proxy
  DRAWING_API_BASE_URL?: string;
  DRAWING_API_TOKEN?: string;
}

import type { Env } from '../types';

interface ApiConfig {
  app: {
    name: string;
  };
  room: {
    keyLength: number;
    maxUsersPerRoom: number;
  };
  api: {
    dummyBaseUrl: string;
  };
}

function getEnvVarOptional(
  env: Env,
  key: keyof Env,
  defaultValue: string
): string {
  const value = env[key];
  return value !== undefined ? String(value) : defaultValue;
}

function parseNumber(value: string, defaultValue: number): number {
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

export function createApiConfig(env: Env): ApiConfig {
  return {
    app: {
      name: getEnvVarOptional(env, 'APP_NAME' as keyof Env, 'StarterJam API'),
    },
    room: {
      keyLength: parseNumber(
        getEnvVarOptional(env, 'ROOM_KEY_LENGTH' as keyof Env, '6'),
        6
      ),
      maxUsersPerRoom: parseNumber(
        getEnvVarOptional(env, 'MAX_USERS_PER_ROOM' as keyof Env, '20'),
        20
      ),
    },
    api: {
      dummyBaseUrl: getEnvVarOptional(
        env,
        'API_DUMMY_BASE_URL' as keyof Env,
        'https://internal'
      ),
    },
  };
}

export type { ApiConfig };

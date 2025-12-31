interface Config {
  app: {
    name: string;
    key: string;
    githubRepo?: string;
    environment: string;
  };
  multiplayer: {
    wsBaseUrl: string;
  };
  drawingApi: {
    baseUrl: string;
  };
}

function getEnvVar(key: string, defaultValue?: string): string {
  const value = import.meta.env[key];
  if (value !== undefined) {
    return value;
  }
  if (defaultValue !== undefined) {
    return defaultValue;
  }
  throw new Error(`Environment variable ${key} is required but not defined`);
}

function createConfig(): Config {
  const isDev = import.meta.env.DEV;

  return {
    app: {
      name: getEnvVar('VITE_APP_NAME', 'Anyone Can Draw'),
      key: getEnvVar('VITE_APP_NAME', 'Anyone Can Draw')
        .toLowerCase()
        .replaceAll(' ', '_'),
      githubRepo: getEnvVar(
        'VITE_GITHUB_REPO',
        'https://github.com/nicholasgriffintn/starterjam.com'
      ),
      environment: getEnvVar(
        'VITE_ENVIRONMENT',
        isDev ? 'development' : 'production'
      ),
    },
    multiplayer: {
      wsBaseUrl: getEnvVar(
        'VITE_MULTIPLAYER_WS_BASE_URL',
        '/ws'
      ),
    },
    drawingApi: {
      baseUrl: getEnvVar(
        'VITE_DRAWING_API_BASE_URL',
        '/api'
      ),
    },
  };
}

export const config = createConfig();
export default config;

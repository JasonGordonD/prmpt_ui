import 'server-only';

type AgentId = 'minka' | 'coaching' | 'lovebirds' | 'jrvs' | 'pack';

type EnvResolution = {
  value?: string;
  resolvedKey?: string;
  missingKeys: string[];
  blankKeys: string[];
};

type LiveKitEnvKeys = {
  apiKey: string[];
  apiSecret: string[];
  url: string[];
};

// Explicit process.env references ensure Next.js/Vercel include variables in the server bundle.
// Avoid direct dynamic `process.env[key]` reads for runtime reliability.
const ENV_VALUES: Record<string, string | undefined> = {
  LIVEKIT_API_KEY_MINKA: process.env.LIVEKIT_API_KEY_MINKA,
  LIVEKIT_API_SECRET_MINKA: process.env.LIVEKIT_API_SECRET_MINKA,
  LIVEKIT_URL_MINKA: process.env.LIVEKIT_URL_MINKA,

  LIVEKIT_API_KEY_COACHING: process.env.LIVEKIT_API_KEY_COACHING,
  LIVEKIT_API_SECRET_COACHING: process.env.LIVEKIT_API_SECRET_COACHING,
  LIVEKIT_URL_COACHING: process.env.LIVEKIT_URL_COACHING,

  LIVEKIT_API_KEY_LOVEBIRDS: process.env.LIVEKIT_API_KEY_LOVEBIRDS,
  LIVEKIT_API_SECRET_LOVEBIRDS: process.env.LIVEKIT_API_SECRET_LOVEBIRDS,
  LIVEKIT_URL_LOVEBIRDS: process.env.LIVEKIT_URL_LOVEBIRDS,

  LIVEKIT_API_KEY_JRVS: process.env.LIVEKIT_API_KEY_JRVS,
  LIVEKIT_API_SECRET_JRVS: process.env.LIVEKIT_API_SECRET_JRVS,
  LIVEKIT_URL_JRVS: process.env.LIVEKIT_URL_JRVS,

  LIVEKIT_API_KEY_PACK: process.env.LIVEKIT_API_KEY_PACK,
  LIVEKIT_API_SECRET_PACK: process.env.LIVEKIT_API_SECRET_PACK,
  LIVEKIT_URL_PACK: process.env.LIVEKIT_URL_PACK,

  LIVEKIT_API_KEY_THEPACK: process.env.LIVEKIT_API_KEY_THEPACK,
  LIVEKIT_API_SECRET_THEPACK: process.env.LIVEKIT_API_SECRET_THEPACK,
  LIVEKIT_URL_THEPACK: process.env.LIVEKIT_URL_THEPACK,

  AGENT_PASSWORD_MINKA: process.env.AGENT_PASSWORD_MINKA,
  AGENT_PASSWORD_COACHING: process.env.AGENT_PASSWORD_COACHING,
  AGENT_PASSWORD_LOVEBIRDS: process.env.AGENT_PASSWORD_LOVEBIRDS,
  AGENT_PASSWORD_JRVS: process.env.AGENT_PASSWORD_JRVS,
  AGENT_PASSWORD_PACK: process.env.AGENT_PASSWORD_PACK,
  AGENT_PASSWORD_THEPACK: process.env.AGENT_PASSWORD_THEPACK,
};

export const LIVEKIT_ENV_KEYS_BY_AGENT: Record<AgentId, LiveKitEnvKeys> = {
  minka: {
    apiKey: ['LIVEKIT_API_KEY_MINKA'],
    apiSecret: ['LIVEKIT_API_SECRET_MINKA'],
    url: ['LIVEKIT_URL_MINKA'],
  },
  coaching: {
    apiKey: ['LIVEKIT_API_KEY_COACHING'],
    apiSecret: ['LIVEKIT_API_SECRET_COACHING'],
    url: ['LIVEKIT_URL_COACHING'],
  },
  lovebirds: {
    apiKey: ['LIVEKIT_API_KEY_LOVEBIRDS'],
    apiSecret: ['LIVEKIT_API_SECRET_LOVEBIRDS'],
    url: ['LIVEKIT_URL_LOVEBIRDS'],
  },
  jrvs: {
    apiKey: ['LIVEKIT_API_KEY_JRVS'],
    apiSecret: ['LIVEKIT_API_SECRET_JRVS'],
    url: ['LIVEKIT_URL_JRVS'],
  },
  pack: {
    apiKey: ['LIVEKIT_API_KEY_PACK', 'LIVEKIT_API_KEY_THEPACK'],
    apiSecret: ['LIVEKIT_API_SECRET_PACK', 'LIVEKIT_API_SECRET_THEPACK'],
    url: ['LIVEKIT_URL_PACK', 'LIVEKIT_URL_THEPACK'],
  },
};

export const PASSWORD_ENV_KEYS_BY_AGENT: Record<AgentId, string[]> = {
  minka: ['AGENT_PASSWORD_MINKA'],
  coaching: ['AGENT_PASSWORD_COACHING'],
  lovebirds: ['AGENT_PASSWORD_LOVEBIRDS'],
  jrvs: ['AGENT_PASSWORD_JRVS'],
  pack: ['AGENT_PASSWORD_PACK', 'AGENT_PASSWORD_THEPACK'],
};

function resolveEnvValue(candidateKeys: string[]): EnvResolution {
  const missingKeys: string[] = [];
  const blankKeys: string[] = [];

  for (const key of candidateKeys) {
    const rawValue = ENV_VALUES[key];

    if (typeof rawValue === 'undefined') {
      missingKeys.push(key);
      continue;
    }

    const trimmed = rawValue.trim();
    if (!trimmed) {
      blankKeys.push(key);
      continue;
    }

    return {
      value: trimmed,
      resolvedKey: key,
      missingKeys,
      blankKeys,
    };
  }

  return {
    value: undefined,
    resolvedKey: undefined,
    missingKeys,
    blankKeys,
  };
}

export function isSupportedAgentId(agentId: string): agentId is AgentId {
  return agentId in LIVEKIT_ENV_KEYS_BY_AGENT;
}

export function getLiveKitCredentials(agentId: string) {
  if (!isSupportedAgentId(agentId)) {
    return undefined;
  }

  const envKeys = LIVEKIT_ENV_KEYS_BY_AGENT[agentId];
  const apiKey = resolveEnvValue(envKeys.apiKey);
  const apiSecret = resolveEnvValue(envKeys.apiSecret);
  const url = resolveEnvValue(envKeys.url);

  const missingKeys = [...apiKey.missingKeys, ...apiSecret.missingKeys, ...url.missingKeys];
  const blankKeys = [...apiKey.blankKeys, ...apiSecret.blankKeys, ...url.blankKeys];
  const isConfigured = !!apiKey.value && !!apiSecret.value && !!url.value;

  return {
    isConfigured,
    credentials: isConfigured
      ? { apiKey: apiKey.value!, apiSecret: apiSecret.value!, url: url.value! }
      : undefined,
    missingKeys,
    blankKeys,
    resolvedKeys: {
      apiKey: apiKey.resolvedKey,
      apiSecret: apiSecret.resolvedKey,
      url: url.resolvedKey,
    },
    candidateKeys: envKeys,
  };
}

export function getAgentPassword(agentId: string) {
  if (!isSupportedAgentId(agentId)) {
    return undefined;
  }

  const candidateKeys = PASSWORD_ENV_KEYS_BY_AGENT[agentId];
  const password = resolveEnvValue(candidateKeys);
  const isConfigured = !!password.value;

  return {
    isConfigured,
    value: password.value,
    resolvedKey: password.resolvedKey,
    missingKeys: password.missingKeys,
    blankKeys: password.blankKeys,
    candidateKeys,
  };
}

export function getEnvPresenceByAgent() {
  return (Object.keys(LIVEKIT_ENV_KEYS_BY_AGENT) as AgentId[]).reduce(
    (acc, agentId) => {
      const livekitKeys = LIVEKIT_ENV_KEYS_BY_AGENT[agentId];
      const passwordKeys = PASSWORD_ENV_KEYS_BY_AGENT[agentId];

      acc[agentId] = {
        livekit: {
          ...Object.fromEntries(
            [
              ...livekitKeys.apiKey,
              ...livekitKeys.apiSecret,
              ...livekitKeys.url,
            ].map((key) => [key, !!ENV_VALUES[key]])
          ),
        },
        password: Object.fromEntries(
          passwordKeys.map((key) => [key, !!ENV_VALUES[key]])
        ),
      };

      return acc;
    },
    {} as Record<AgentId, { livekit: Record<string, boolean>; password: Record<string, boolean> }>
  );
}

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
  LIVEKIT_API_KEY: process.env.LIVEKIT_API_KEY,
  LIVEKIT_API_SECRET: process.env.LIVEKIT_API_SECRET,
  LIVEKIT_URL: process.env.LIVEKIT_URL,

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
  AGENT_PASSWORD: process.env.AGENT_PASSWORD,
};

export const LIVEKIT_ENV_KEYS_BY_AGENT: Record<AgentId, LiveKitEnvKeys> = {
  minka: {
    apiKey: ['LIVEKIT_API_KEY_MINKA', 'LIVEKIT_API_KEY'],
    apiSecret: ['LIVEKIT_API_SECRET_MINKA', 'LIVEKIT_API_SECRET'],
    url: ['LIVEKIT_URL_MINKA', 'LIVEKIT_URL'],
  },
  coaching: {
    apiKey: ['LIVEKIT_API_KEY_COACHING', 'LIVEKIT_API_KEY'],
    apiSecret: ['LIVEKIT_API_SECRET_COACHING', 'LIVEKIT_API_SECRET'],
    url: ['LIVEKIT_URL_COACHING', 'LIVEKIT_URL'],
  },
  lovebirds: {
    apiKey: ['LIVEKIT_API_KEY_LOVEBIRDS', 'LIVEKIT_API_KEY'],
    apiSecret: ['LIVEKIT_API_SECRET_LOVEBIRDS', 'LIVEKIT_API_SECRET'],
    url: ['LIVEKIT_URL_LOVEBIRDS', 'LIVEKIT_URL'],
  },
  jrvs: {
    apiKey: ['LIVEKIT_API_KEY_JRVS', 'LIVEKIT_API_KEY'],
    apiSecret: ['LIVEKIT_API_SECRET_JRVS', 'LIVEKIT_API_SECRET'],
    url: ['LIVEKIT_URL_JRVS', 'LIVEKIT_URL'],
  },
  pack: {
    apiKey: ['LIVEKIT_API_KEY_PACK', 'LIVEKIT_API_KEY_THEPACK', 'LIVEKIT_API_KEY'],
    apiSecret: ['LIVEKIT_API_SECRET_PACK', 'LIVEKIT_API_SECRET_THEPACK', 'LIVEKIT_API_SECRET'],
    url: ['LIVEKIT_URL_PACK', 'LIVEKIT_URL_THEPACK', 'LIVEKIT_URL'],
  },
};

export const PASSWORD_ENV_KEYS_BY_AGENT: Record<AgentId, string[]> = {
  minka: ['AGENT_PASSWORD_MINKA', 'AGENT_PASSWORD'],
  coaching: ['AGENT_PASSWORD_COACHING', 'AGENT_PASSWORD'],
  lovebirds: ['AGENT_PASSWORD_LOVEBIRDS', 'AGENT_PASSWORD'],
  jrvs: ['AGENT_PASSWORD_JRVS', 'AGENT_PASSWORD'],
  pack: ['AGENT_PASSWORD_PACK', 'AGENT_PASSWORD_THEPACK', 'AGENT_PASSWORD'],
};

const AGENT_ID_ALIASES: Record<string, AgentId> = {
  minka: 'minka',
  coaching: 'coaching',
  lovebirds: 'lovebirds',
  jrvs: 'jrvs',
  pack: 'pack',
  thepack: 'pack',
  'the-pack': 'pack',
  'the_pack': 'pack',
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
  return typeof AGENT_ID_ALIASES[agentId.trim().toLowerCase()] !== 'undefined';
}

export function normalizeAgentId(agentId: string | undefined | null): AgentId | undefined {
  if (!agentId) {
    return undefined;
  }

  return AGENT_ID_ALIASES[agentId.trim().toLowerCase()];
}

export function getLiveKitCredentials(agentId: string) {
  const normalizedAgentId = normalizeAgentId(agentId);
  if (!normalizedAgentId) {
    return undefined;
  }

  const envKeys = LIVEKIT_ENV_KEYS_BY_AGENT[normalizedAgentId];
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
  const normalizedAgentId = normalizeAgentId(agentId);
  if (!normalizedAgentId) {
    return undefined;
  }

  const candidateKeys = PASSWORD_ENV_KEYS_BY_AGENT[normalizedAgentId];
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

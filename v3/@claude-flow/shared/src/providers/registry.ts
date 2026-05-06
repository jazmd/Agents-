export type ProviderName =
  | 'openai'
  | 'anthropic'
  | 'google'
  | 'openrouter'
  | 'ollama'
  | 'groq'
  | 'together'
  | 'mistral'
  | 'cohere'
  | 'xai'
  | 'local_openai_compatible';

export type RoutingMode = 'balanced' | 'cost' | 'speed' | 'quality' | 'local_first';

export interface LLMProviderConfig {
  name: ProviderName;
  enabled: boolean;
  priority: number;
  apiKey?: string;
  baseUrl?: string;
  defaultModel?: string;
  local: boolean;
}

export interface LLMCostGuardrails {
  enabled: boolean;
  preferFreeOrLocal: boolean;
  allowCloudFallback: boolean;
  dailyBudgetUsd?: number;
  monthlyBudgetUsd?: number;
  maxInputTokens?: number;
  maxOutputTokens?: number;
}

export interface LLMProviderRegistryConfig {
  defaultProvider: ProviderName;
  fallbackProviders: ProviderName[];
  routingMode: RoutingMode;
  timeoutMs: number;
  maxRetries: number;
  costGuardrails: LLMCostGuardrails;
  providers: LLMProviderConfig[];
}

const LOCAL_PROVIDERS: ProviderName[] = ['ollama', 'local_openai_compatible'];

const PROVIDER_ENV: Record<ProviderName, { apiKey?: string; baseUrl?: string; defaultBaseUrl?: string }> = {
  openai: { apiKey: 'OPENAI_API_KEY', baseUrl: 'OPENAI_BASE_URL', defaultBaseUrl: 'https://api.openai.com/v1' },
  anthropic: { apiKey: 'ANTHROPIC_API_KEY', baseUrl: 'ANTHROPIC_BASE_URL', defaultBaseUrl: 'https://api.anthropic.com' },
  google: { apiKey: 'GOOGLE_API_KEY', baseUrl: 'GOOGLE_BASE_URL' },
  openrouter: { apiKey: 'OPENROUTER_API_KEY', baseUrl: 'OPENROUTER_BASE_URL', defaultBaseUrl: 'https://openrouter.ai/api/v1' },
  ollama: { baseUrl: 'OLLAMA_BASE_URL', defaultBaseUrl: 'http://localhost:11434' },
  groq: { apiKey: 'GROQ_API_KEY', baseUrl: 'GROQ_BASE_URL', defaultBaseUrl: 'https://api.groq.com/openai/v1' },
  together: { apiKey: 'TOGETHER_API_KEY', baseUrl: 'TOGETHER_BASE_URL', defaultBaseUrl: 'https://api.together.xyz/v1' },
  mistral: { apiKey: 'MISTRAL_API_KEY', baseUrl: 'MISTRAL_BASE_URL', defaultBaseUrl: 'https://api.mistral.ai/v1' },
  cohere: { apiKey: 'COHERE_API_KEY', baseUrl: 'COHERE_BASE_URL', defaultBaseUrl: 'https://api.cohere.com/v2' },
  xai: { apiKey: 'XAI_API_KEY', baseUrl: 'XAI_BASE_URL', defaultBaseUrl: 'https://api.x.ai/v1' },
  local_openai_compatible: { apiKey: 'LOCAL_OPENAI_API_KEY', baseUrl: 'LOCAL_OPENAI_BASE_URL', defaultBaseUrl: 'http://localhost:8000/v1' },
};

const DEFAULT_ORDER: ProviderName[] = [
  'openrouter',
  'openai',
  'anthropic',
  'google',
  'ollama',
  'groq',
  'together',
  'mistral',
  'cohere',
  'xai',
  'local_openai_compatible',
];

const LOCAL_FIRST_ORDER: ProviderName[] = [
  'ollama',
  'local_openai_compatible',
  'openrouter',
  'groq',
  'together',
  'google',
  'openai',
  'mistral',
  'cohere',
  'anthropic',
  'xai',
];

function env(name: string): string | undefined {
  const value = process.env[name];
  return value && value.trim().length > 0 ? value.trim() : undefined;
}

function envBool(name: string, fallback = false): boolean {
  const value = env(name);
  if (!value) return fallback;
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
}

function envInt(name: string, fallback: number): number {
  const value = env(name);
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function envOptionalInt(name: string): number | undefined {
  const value = env(name);
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function envOptionalFloat(name: string): number | undefined {
  const value = env(name);
  if (!value) return undefined;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseProviderName(value: string | undefined, fallback: ProviderName): ProviderName {
  if (!value) return fallback;
  return DEFAULT_ORDER.includes(value as ProviderName) ? (value as ProviderName) : fallback;
}

function parseProviderList(value: string | undefined, fallback: ProviderName[]): ProviderName[] {
  if (!value) return fallback;
  const names = value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item): item is ProviderName => DEFAULT_ORDER.includes(item as ProviderName));
  return names.length > 0 ? names : fallback;
}

function parseRoutingMode(value: string | undefined): RoutingMode {
  const allowed: RoutingMode[] = ['balanced', 'cost', 'speed', 'quality', 'local_first'];
  return allowed.includes(value as RoutingMode) ? (value as RoutingMode) : 'balanced';
}

function getDefaultProviderOrder(routingMode: RoutingMode): ProviderName[] {
  return routingMode === 'local_first' ? LOCAL_FIRST_ORDER : DEFAULT_ORDER;
}

export function loadProviderRegistryFromEnv(): LLMProviderRegistryConfig {
  const routingMode = parseRoutingMode(env('LLM_ROUTING_MODE'));
  const preferFreeOrLocal = envBool('LLM_PREFER_FREE_OR_LOCAL', routingMode === 'local_first' || routingMode === 'cost');
  const allowCloudFallback = envBool('LLM_ALLOW_CLOUD_FALLBACK', true);
  const providerOrder = getDefaultProviderOrder(routingMode);
  const defaultProvider = parseProviderName(env('DEFAULT_LLM_PROVIDER'), routingMode === 'local_first' ? 'ollama' : 'openrouter');
  const fallbackProviders = parseProviderList(
    env('LLM_PROVIDER_FALLBACKS'),
    routingMode === 'local_first'
      ? ['ollama', 'local_openai_compatible', 'openrouter', 'openai']
      : ['openrouter', 'openai', 'anthropic', 'google', 'ollama']
  );

  const providers = providerOrder.map((name, index) => {
    const spec = PROVIDER_ENV[name];
    const apiKey = spec.apiKey ? env(spec.apiKey) : undefined;
    const baseUrl = spec.baseUrl ? env(spec.baseUrl) ?? spec.defaultBaseUrl : spec.defaultBaseUrl;
    const explicitEnabled = envBool(`LLM_PROVIDER_${name.toUpperCase()}_ENABLED`, false);
    const local = LOCAL_PROVIDERS.includes(name);
    const enabled = explicitEnabled || Boolean(apiKey) || local;

    return {
      name,
      enabled: enabled && (allowCloudFallback || local),
      priority: envInt(`LLM_PROVIDER_${name.toUpperCase()}_PRIORITY`, index + 1),
      apiKey,
      baseUrl,
      defaultModel: env(`LLM_PROVIDER_${name.toUpperCase()}_MODEL`),
      local,
    };
  }).sort((a, b) => a.priority - b.priority);

  return {
    defaultProvider,
    fallbackProviders,
    routingMode,
    timeoutMs: envInt('LLM_TIMEOUT_MS', 60_000),
    maxRetries: envInt('LLM_MAX_RETRIES', 2),
    costGuardrails: {
      enabled: envBool('LLM_COST_GUARDRAILS', true),
      preferFreeOrLocal,
      allowCloudFallback,
      dailyBudgetUsd: envOptionalFloat('LLM_DAILY_BUDGET_USD'),
      monthlyBudgetUsd: envOptionalFloat('LLM_MONTHLY_BUDGET_USD'),
      maxInputTokens: envOptionalInt('LLM_MAX_INPUT_TOKENS'),
      maxOutputTokens: envOptionalInt('LLM_MAX_OUTPUT_TOKENS'),
    },
    providers,
  };
}

export function getEnabledProviders(config = loadProviderRegistryFromEnv()): LLMProviderConfig[] {
  return config.providers.filter((provider) => provider.enabled);
}

export function getLocalProviders(config = loadProviderRegistryFromEnv()): LLMProviderConfig[] {
  return getEnabledProviders(config).filter((provider) => provider.local);
}

export function getCloudProviders(config = loadProviderRegistryFromEnv()): LLMProviderConfig[] {
  return getEnabledProviders(config).filter((provider) => !provider.local);
}

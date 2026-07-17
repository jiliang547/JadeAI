import { NextRequest } from 'next/server';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

export interface AIConfig {
  provider: string;
  apiKey: string;
  baseURL: string;
  model: string;
}

// 服务端默认 AI 配置（从环境变量读取，不硬编码 Key，避免泄露到代码仓库）
// 当请求未携带 x-api-key 等头部时，自动回退到此处默认值，
// 便于小程序等前端直接调用而无需在客户端保存 Key。
// 配置方式：在云托管控制台为服务添加环境变量
//   AI_DEFAULT_API_KEY / AI_DEFAULT_BASE_URL / AI_DEFAULT_MODEL
const SERVER_DEFAULT_API_KEY = process.env.AI_DEFAULT_API_KEY || '';
const SERVER_DEFAULT_BASE_URL = process.env.AI_DEFAULT_BASE_URL || 'https://hjlyy.cc/v1';
const SERVER_DEFAULT_MODEL = process.env.AI_DEFAULT_MODEL || 'gpt-5.6-luna';

export function extractAIConfig(request: NextRequest): AIConfig {
  const provider = request.headers.get('x-provider') || 'openai';
  const apiKey = request.headers.get('x-api-key') || SERVER_DEFAULT_API_KEY;
  const baseURL = request.headers.get('x-base-url') || SERVER_DEFAULT_BASE_URL;
  const model = request.headers.get('x-model') || SERVER_DEFAULT_MODEL;
  return { provider, apiKey, baseURL, model };
}

export function getModel(config: AIConfig, modelOverride?: string) {
  if (!config.apiKey) {
    throw new AIConfigError('API key is required. Please configure it in Settings.');
  }
  const modelId = modelOverride || config.model;

  switch (config.provider) {
    case 'anthropic': {
      const p = createAnthropic({ apiKey: config.apiKey, baseURL: config.baseURL || undefined });
      return p(modelId);
    }
    case 'gemini': {
      const p = createGoogleGenerativeAI({ apiKey: config.apiKey, baseURL: config.baseURL || undefined });
      return p(modelId);
    }
    default: {
      const p = createOpenAI({ apiKey: config.apiKey, baseURL: config.baseURL });
      return p.chat(modelId);
    }
  }
}

/**
 * Returns providerOptions for JSON mode — only applicable to OpenAI-compatible providers.
 */
export function getJsonProviderOptions(config: AIConfig) {
  if (config.provider === 'openai') {
    return { openai: { response_format: { type: 'json_object' as const } } };
  }
  return {} as Record<string, never>;
}

export class AIConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AIConfigError';
  }
}

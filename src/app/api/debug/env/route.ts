import { NextResponse } from 'next/server';

// 临时调试接口：用于确认云托管容器是否正确注入了 AI_DEFAULT_* 环境变量。
// 只返回「是否存在」以及非敏感值，绝不返回真实 API Key 内容。
// 验证完成后建议删除此文件。
export async function GET() {
  const apiKey = process.env.AI_DEFAULT_API_KEY || '';
  const baseUrl = process.env.AI_DEFAULT_BASE_URL || '';
  const model = process.env.AI_DEFAULT_MODEL || '';

  return NextResponse.json({
    hasApiKey: apiKey.length > 0,
    apiKeyLength: apiKey.length,
    baseUrl: baseUrl || '(empty)',
    model: model || '(empty)',
    nodeEnv: process.env.NODE_ENV || '(empty)',
    allEnvKeys: Object.keys(process.env)
      .filter((k) => k.startsWith('AI_') || k === 'NODE_ENV' || k === 'PORT')
      .sort(),
  });
}

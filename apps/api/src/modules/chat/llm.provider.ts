import { Injectable } from '@nestjs/common';

export interface LlmMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface LlmCompleteOptions {
  /** 收到增量 token 时回调（提供后走流式响应）。 */
  onToken?: (token: string) => void;
}

interface LlmChunk {
  choices?: Array<{ delta?: { content?: string }; finish_reason?: string | null }>;
  error?: { message?: string };
}

interface LlmJson {
  choices?: Array<{ message?: { content?: string } }>;
  error?: { message?: string };
}

/**
 * OpenAI 兼容 Chat Completions 客户端（零第三方依赖，Node 22 原生 fetch）。
 *
 * 环境变量：
 * - AI_API_KEY（或 OPENAI_API_KEY）  配置后聊天回复走真实 LLM；否则自动回退内置模拟回复
 * - AI_BASE_URL                      网关地址，默认 https://api.openai.com/v1
 *                                    （兼容 DeepSeek / Kimi / Qwen / GLM 等 OpenAI 风格网关）
 * - AI_MODEL                         默认 gpt-4o-mini
 * - AI_TIMEOUT_MS                    请求超时（毫秒），默认 60000
 * - AI_ENABLED                       true/false 显式开关；默认 key 存在即开启
 */
@Injectable()
export class LlmProvider {
  get enabled(): boolean {
    // 必须配置了 key 才会启用真实 LLM（AI_ENABLED 只是显式开关，不能代替 key）。
    if (!this.apiKey) return false;
    const explicit = process.env.AI_ENABLED;
    if (explicit != null && explicit !== '') {
      return explicit === 'true' || explicit === '1';
    }
    return true;
  }

  get modelLabel(): string {
    return this.model;
  }

  get apiKey(): string {
    return process.env.AI_API_KEY || process.env.OPENAI_API_KEY || '';
  }

  get baseUrl(): string {
    return (process.env.AI_BASE_URL || 'https://api.openai.com/v1').replace(/\/+$/, '');
  }

  get model(): string {
    return process.env.AI_MODEL || 'gpt-4o-mini';
  }

  get timeoutMs(): number {
    const n = Number(process.env.AI_TIMEOUT_MS);
    return Number.isFinite(n) && n > 0 ? n : 60_000;
  }

  /** 非流式补全：返回完整回复文本。 */
  async complete(messages: LlmMessage[], opts: LlmCompleteOptions = {}): Promise<string> {
    const { onToken } = opts;
    const url = `${this.baseUrl}/chat/completions`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          stream: Boolean(onToken),
          temperature: 0.4,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`LLM HTTP ${res.status}: ${text.slice(0, 300)}`);
      }

      if (!onToken) {
        const json = (await res.json()) as LlmJson;
        const content = json.choices?.[0]?.message?.content?.trim() ?? '';
        if (!content) throw new Error(json.error?.message || 'LLM 返回为空');
        return content;
      }

      return await this.readStream(res, onToken);
    } finally {
      clearTimeout(timer);
    }
  }

  private async readStream(res: Response, onToken: (token: string) => void): Promise<string> {
    if (!res.body) throw new Error('LLM 流式响应缺少 body');
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let full = '';
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        const data = trimmed.slice(5).trim();
        if (data === '[DONE]') continue;
        try {
          const json = JSON.parse(data) as LlmChunk;
          if (json.error?.message) throw new Error(json.error.message);
          const delta = json.choices?.[0]?.delta?.content ?? '';
          if (delta) {
            full += delta;
            onToken(delta);
          }
        } catch (err) {
          if (err instanceof Error && err.message.startsWith('LLM')) throw err;
          // 忽略非标准分片
        }
      }
    }
    return full;
  }
}

/**
 * Claw Pet - Chat Module
 * Connects to OpenClaw Gateway via OpenAI-compatible /v1/chat/completions
 */

class ChatManager {
  constructor() {
    this.config = {
      gatewayUrl: 'http://127.0.0.1:18789',
      token: '',
      model: 'openclaw',
      user: 'desktop-pet',
    };

    this.messages = [];
    this.isLoading = false;
    this.onMessage = null;
    this.onStateChange = null;

    this.loadConfig();
  }

  loadConfig() {
    try {
      const saved = localStorage.getItem('claw-chat-config');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Only override if user explicitly saved (not defaults)
        if (parsed._saved) Object.assign(this.config, parsed);
      }
    } catch {}
  }

  saveConfig() {
    const toSave = { ...this.config, _saved: true };
    localStorage.setItem('claw-chat-config', JSON.stringify(toSave));
  }

  setGateway(url, token) {
    if (url) this.config.gatewayUrl = url;
    if (token) this.config.token = token;
    this.saveConfig();
  }

  async sendMessage(text) {
    if (!text.trim() || this.isLoading) return null;

    const userMsg = { role: 'user', content: text, time: Date.now() };
    this.messages.push(userMsg);
    if (this.onMessage) this.onMessage(userMsg);
    if (this.onStateChange) this.onStateChange('loading');

    this.isLoading = true;

    try {
      const reply = await this.callGateway(text);
      const petMsg = { role: 'pet', content: reply, time: Date.now() };
      this.messages.push(petMsg);
      if (this.onMessage) this.onMessage(petMsg);
      if (this.onStateChange) this.onStateChange('idle');
      return reply;
    } catch (err) {
      const errMsg = { role: 'system', content: `连接失败: ${err.message}`, time: Date.now() };
      this.messages.push(errMsg);
      if (this.onMessage) this.onMessage(errMsg);
      if (this.onStateChange) this.onStateChange('error');
      return null;
    } finally {
      this.isLoading = false;
    }
  }

  async callGateway(text) {
    const { gatewayUrl, token, model, user } = this.config;

    // Build messages array (include recent history for context)
    const recentHistory = this.messages
      .filter(m => m.role === 'user' || m.role === 'pet')
      .slice(-10)
      .map(m => ({
        role: m.role === 'pet' ? 'assistant' : 'user',
        content: m.content,
      }));

    // System prompt for the pet personality
    const systemMsg = {
      role: 'system',
      content: '你是 Claw，一只来自太空的龙虾桌面宠物，是 OpenClaw 的吉祥物。你性格活泼、友好、有点极客范，回答简洁有趣，偶尔用 emoji。你住在用户的桌面上，陪他聊天、帮他做事。保持简短回复，一般不超过两三句话。',
    };

    const body = {
      model: model,
      messages: [systemMsg, ...recentHistory],
      user: user,
      stream: true,
    };

    const headers = {
      'Content-Type': 'application/json',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const resp = await fetch(`${gatewayUrl}/v1/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(60000),
    });

    if (!resp.ok) {
      const errText = await resp.text().catch(() => '');
      throw new Error(`HTTP ${resp.status}: ${errText || resp.statusText}`);
    }

    // Handle SSE streaming
    if (resp.headers.get('content-type')?.includes('text/event-stream') ||
        resp.headers.get('content-type')?.includes('event-stream')) {
      return this.handleStream(resp);
    }

    // Non-streaming fallback
    const data = await resp.json();
    return data.choices?.[0]?.message?.content || JSON.stringify(data);
  }

  async handleStream(resp) {
    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data:')) continue;

          const data = trimmed.slice(5).trim();
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content || '';
            fullText += delta;

            if (this.onStateChange) this.onStateChange('streaming', fullText);
          } catch {
            // Not valid JSON, skip
          }
        }
      }
    } catch (err) {
      if (!fullText) throw err;
    }

    return fullText || '(empty response)';
  }

  getHistory() {
    return this.messages;
  }

  clearHistory() {
    this.messages = [];
  }
}

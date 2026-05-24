/**
 * LX Music Controller
 * Integrates with LX Music Open API (port 23330)
 */

class LXMusicController {
  constructor() {
    this.baseUrl = 'http://127.0.0.1:23330';
    this.connected = false;
    this.current = null;
    this.pollTimer = null;
    this.onStatusChange = null;
  }

  async request(path) {
    try {
      const resp = await fetch(`${this.baseUrl}${path}`, { signal: AbortSignal.timeout(3000) });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      return await resp.json();
    } catch {
      return null;
    }
  }

  async getStatus() {
    const data = await this.request('/status');
    if (data) {
      this.connected = true;
      this.current = data;
      if (this.onStatusChange) this.onStatusChange(data);
    } else {
      this.connected = false;
      this.current = null;
      if (this.onStatusChange) this.onStatusChange(null);
    }
    return data;
  }

  async play()    { await this.request('/play');    return this.getStatus(); }
  async pause()   { await this.request('/pause');   return this.getStatus(); }
  async toggle()  {
    if (this.current?.status === 'playing') return this.pause();
    return this.play();
  }
  async next()    { await this.request('/skip-next'); return this.getStatus(); }
  async prev()    { await this.request('/skip-prev'); return this.getStatus(); }
  async volume(v) { await this.request(`/volume?volume=${v}`); return this.getStatus(); }
  async mute()    { await this.request('/mute?mute=true'); return this.getStatus(); }
  async unmute()  { await this.request('/mute?mute=false'); return this.getStatus(); }
  async collect() { await this.request('/collect'); return this.getStatus(); }
  async uncollect() { await this.request('/uncollect'); return this.getStatus(); }

  startPolling(interval = 3000) {
    this.stopPolling();
    this.getStatus();
    this.pollTimer = setInterval(() => this.getStatus(), interval);
  }

  stopPolling() {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  formatTime(seconds) {
    if (!seconds && seconds !== 0) return '--:--';
    const t = Math.floor(seconds);
    const m = Math.floor(t / 60);
    const s = t % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }
}

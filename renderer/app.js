/**
 * Claw Pet - Main Application
 * Ties together pet animation, chat, drag, and LX Music controls
 */

(function () {
  'use strict';

  // --- Elements ---
  const canvas = document.getElementById('pet-canvas');
  const chatBubble = document.getElementById('chat-bubble');
  const chatMessages = document.getElementById('chat-messages');
  const inputBar = document.getElementById('input-bar');
  const chatInput = document.getElementById('chat-input');
  const sendBtn = document.getElementById('send-btn');
  const chatClose = document.getElementById('chat-close');

  // Music elements
  const musicBar = document.getElementById('music-bar');
  const musicTitle = document.getElementById('music-title');
  const musicArtist = document.getElementById('music-artist');
  const musicProgressFill = document.getElementById('music-progress-fill');
  const musicTimeNow = document.getElementById('music-time-now');
  const musicTimeTotal = document.getElementById('music-time-total');
  const btnPrev = document.getElementById('btn-prev');
  const btnToggle = document.getElementById('btn-toggle');
  const btnNext = document.getElementById('btn-next');
  const btnVolDown = document.getElementById('btn-vol-down');
  const btnVolUp = document.getElementById('btn-vol-up');
  const btnCollect = document.getElementById('btn-collect');
  const musicCollapse = document.getElementById('music-collapse');
  const musicHide = document.getElementById('music-hide');

  // --- Close button ---
  chatClose.addEventListener('click', (e) => {
    e.stopPropagation();
    hideChat();
  });

  // --- State ---
  let chatVisible = false;
  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let hasMoved = false;
  let clickTimer = null;

  // --- Init ---
  const pet = new PetRenderer(canvas);
  const chat = new ChatManager();
  const lxm = new LXMusicController();

  // --- Chat message handler ---
  chat.onMessage = (msg) => {
    appendMessage(msg);
    if (msg.role === 'pet') {
      pet.setState('talk');
      setTimeout(() => {
        if (chatVisible) pet.setState('look');
        else pet.setState('idle');
      }, 1500);
    }
  };

  chat.onStateChange = (state, streamingText) => {
    if (state === 'loading') {
      pet.setState('talk');
    } else if (state === 'streaming' && streamingText) {
      updateLastPetMessage(streamingText);
    } else if (state === 'error') {
      pet.setState('idle');
    }
  };

  // =============================================
  //  LX Music Integration
  // =============================================

  lxm.onStatusChange = (data) => {
    if (data) {
      if (!musicBar.dataset.userHidden) musicBar.classList.remove('hidden');
      musicTitle.textContent = data.name || '--';
      musicArtist.textContent = data.singer || '--';
      musicTimeNow.textContent = lxm.formatTime(data.progress);
      musicTimeTotal.textContent = lxm.formatTime(data.duration);
      btnToggle.textContent = data.status === 'playing' ? '⏸' : '▶';

      // Progress bar
      if (data.duration > 0) {
        const pct = Math.min(100, (data.progress / data.duration) * 100);
        musicProgressFill.style.width = pct + '%';
      }

      // Collect state
      btnCollect.classList.toggle('active', !!data.collect);
      btnCollect.textContent = data.collect ? '♥' : '♡';

      // Pet reacts to music
      if (data.status === 'playing' && pet.state === 'idle') {
        pet.setState('happy');
        setTimeout(() => { if (pet.state === 'happy') pet.setState('idle'); }, 3000);
      }
    } else {
      musicBar.classList.add('hidden');
    }
  };

  // Music header buttons
  musicCollapse.addEventListener('click', () => {
    musicBar.classList.toggle('collapsed');
    musicCollapse.textContent = musicBar.classList.contains('collapsed') ? '+' : '−';
  });

  musicHide.addEventListener('click', () => {
    musicBar.classList.add('hidden');
    musicBar.dataset.userHidden = 'true';
  });

  // Music button handlers
  btnToggle.addEventListener('click', () => lxm.toggle());
  btnPrev.addEventListener('click', () => lxm.prev());
  btnNext.addEventListener('click', () => lxm.next());
  btnVolDown.addEventListener('click', async () => {
    const cur = lxm.current?.volume;
    if (cur !== undefined) lxm.volume(Math.max(1, cur - 10));
  });
  btnVolUp.addEventListener('click', async () => {
    const cur = lxm.current?.volume;
    if (cur !== undefined) lxm.volume(Math.min(100, cur + 10));
  });
  btnCollect.addEventListener('click', () => {
    if (lxm.current?.collect) lxm.uncollect();
    else lxm.collect();
  });

  // Progress bar click to seek
  document.getElementById('music-progress').addEventListener('click', (e) => {
    if (!lxm.current?.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    const target = Math.floor(pct * lxm.current.duration);
    lxm.request(`/seek?offset=${target}`).then(() => lxm.getStatus());
  });

  // Start polling LX Music
  lxm.startPolling(2000);

  // =============================================
  //  Drag handling
  // =============================================

  canvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    hasMoved = false;
    dragStartX = e.screenX;
    dragStartY = e.screenY;
    canvas.style.cursor = 'grabbing';
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const dx = e.screenX - dragStartX;
    const dy = e.screenY - dragStartY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      hasMoved = true;
      window.petAPI.move(dx, dy);
      dragStartX = e.screenX;
      dragStartY = e.screenY;
    }
  });

  document.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      canvas.style.cursor = 'grab';
      if (!hasMoved) handleClick();
    }
  });

  // =============================================
  //  Click / Double-click
  // =============================================

  function handleClick() {
    if (clickTimer) {
      clearTimeout(clickTimer);
      clickTimer = null;
      toggleChat();
    } else {
      clickTimer = setTimeout(() => {
        clickTimer = null;
        pet.wake();
      }, 250);
    }
  }

  // =============================================
  //  Chat toggle
  // =============================================

  function toggleChat() {
    chatVisible = !chatVisible;
    chatBubble.classList.toggle('hidden', !chatVisible);
    inputBar.classList.toggle('hidden', !chatVisible);

    if (chatVisible) {
      pet.setState('look');
      chatInput.focus();
      window.petAPI.setSize(360, 520);
    } else {
      pet.setState('idle');
      window.petAPI.setSize(360, 340);
    }
  }

  function showChat() { if (!chatVisible) toggleChat(); }
  function hideChat() { if (chatVisible) toggleChat(); }

  // =============================================
  //  Message rendering
  // =============================================

  function appendMessage(msg) {
    const div = document.createElement('div');
    div.className = `msg msg-${msg.role}`;
    div.textContent = msg.content;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function updateLastPetMessage(text) {
    const msgs = chatMessages.querySelectorAll('.msg-pet');
    if (msgs.length > 0) {
      msgs[msgs.length - 1].textContent = text;
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  }

  // =============================================
  //  Send message
  // =============================================

  async function send() {
    const text = chatInput.value.trim();
    if (!text) return;
    chatInput.value = '';

    if (!chat.config.gatewayUrl) {
      appendMessage({ role: 'system', content: '请先配置 OpenClaw Gateway 地址' });
      return;
    }

    await chat.sendMessage(text);
  }

  sendBtn.addEventListener('click', send);
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
    if (e.key === 'Escape') hideChat();
  });

  // =============================================
  //  Right-click context menu
  // =============================================

  canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    showContextMenu(e.clientX, e.clientY);
  });

  function showContextMenu(x, y) {
    const old = document.getElementById('context-menu');
    if (old) old.remove();

    const menu = document.createElement('div');
    menu.id = 'context-menu';
    menu.style.cssText = `
      position: fixed; left: ${x}px; top: ${y}px;
      background: rgba(20, 8, 8, 0.95);
      border: 1px solid rgba(255, 69, 58, 0.4);
      border-radius: 8px; padding: 4px 0;
      z-index: 1000; min-width: 160px;
      backdrop-filter: blur(8px);
    `;

    const musicLabel = lxm.connected
      ? `🎵 ${lxm.current?.name || 'Music'}`
      : '🎵 LX Music (未连接)';

    const items = [
      { label: '💬 对话', action: () => { showChat(); chatInput.focus(); } },
      { label: musicLabel, action: () => {
        if (lxm.connected) {
          appendMessage({ role: 'system', content: `🎵 ${lxm.current.name} - ${lxm.current.singer}` });
          showChat();
        } else {
          appendMessage({ role: 'system', content: 'LX Music 未运行或未启用开放 API' });
          showChat();
        }
      }},
      { label: '—' },
      { label: '⏮ 上一曲', action: () => lxm.prev() },
      { label: lxm.current?.status === 'playing' ? '⏸ 暂停' : '▶ 播放', action: () => lxm.toggle() },
      { label: '⏭ 下一曲', action: () => lxm.next() },
      { label: musicBar.classList.contains('hidden') ? '📺 显示控制面板' : '📺 隐藏控制面板', action: () => toggleMusicBar() },
      { label: '—' },
      { label: '⚙️ 设置', action: () => showSettings() },
      { label: '❌ 退出', action: () => window.petAPI.quit() },
    ];

    items.forEach(item => {
      if (item.label === '—') {
        const sep = document.createElement('div');
        sep.style.cssText = 'height:1px;background:rgba(255,69,58,0.2);margin:4px 0;';
        menu.appendChild(sep);
        return;
      }

      const btn = document.createElement('div');
      btn.textContent = item.label;
      btn.style.cssText = `
        padding: 8px 16px; color: #FF8A80; font-size: 13px; cursor: pointer;
      `;
      btn.addEventListener('mouseenter', () => btn.style.background = 'rgba(255,69,58,0.15)');
      btn.addEventListener('mouseleave', () => btn.style.background = 'transparent');
      btn.addEventListener('click', () => { menu.remove(); item.action(); });
      menu.appendChild(btn);
    });

    document.body.appendChild(menu);

    const close = (e) => {
      if (!menu.contains(e.target)) {
        menu.remove();
        document.removeEventListener('click', close);
      }
    };
    setTimeout(() => document.addEventListener('click', close), 10);
  }

  // =============================================
  //  Settings panel
  // =============================================

  function showSettings() {
    showChat();
    const div = document.createElement('div');
    div.className = 'msg msg-system';
    div.innerHTML = `
      <div style="text-align:left;color:#FF8A80;font-size:12px;line-height:2;">
        <div style="color:#FF5252;font-weight:bold;margin-bottom:4px;">⚙️ 设置</div>
        <div>
          Gateway: <input id="cfg-url" value="${chat.config.gatewayUrl}"
            style="background:rgba(0,0,0,0.3);border:1px solid rgba(255,69,58,0.3);
            border-radius:4px;padding:2px 6px;color:#FFCDD2;width:160px;font-size:11px;" />
        </div>
        <div>
          Token: <input id="cfg-token" type="password" value="${chat.config.token}"
            style="background:rgba(0,0,0,0.3);border:1px solid rgba(255,69,58,0.3);
            border-radius:4px;padding:2px 6px;color:#FFCDD2;width:172px;font-size:11px;" />
        </div>
        <button id="cfg-save" style="margin-top:6px;background:rgba(229,57,53,0.6);
          border:1px solid rgba(255,69,58,0.4);border-radius:4px;padding:4px 16px;
          color:white;cursor:pointer;font-size:11px;">保存</button>
      </div>
    `;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    document.getElementById('cfg-save').addEventListener('click', () => {
      const url = document.getElementById('cfg-url').value.trim();
      const token = document.getElementById('cfg-token').value.trim();
      chat.setGateway(url, token);
      appendMessage({ role: 'system', content: '✅ 配置已保存' });
    });
  }

  // =============================================
  //  Keyboard shortcuts
  // =============================================

  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'P') {
      e.preventDefault();
      toggleChat();
    }
    // Ctrl+M = toggle music bar
    if (e.ctrlKey && e.key === 'm') {
      e.preventDefault();
      toggleMusicBar();
    }
    // Media-like keys when not typing
    if (document.activeElement !== chatInput) {
      if (e.key === ' ') { e.preventDefault(); lxm.toggle(); }
      if (e.key === 'ArrowRight') { e.preventDefault(); lxm.next(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); lxm.prev(); }
    }
  });

  function toggleMusicBar() {
    if (musicBar.classList.contains('hidden')) {
      musicBar.classList.remove('hidden');
      musicBar.dataset.userHidden = '';
    } else {
      musicBar.classList.add('hidden');
      musicBar.dataset.userHidden = 'true';
    }
  }

  console.log('Claw Desktop Pet started!');
})();

/**
 * Claw Pet - Main Application (v5 - Optimized)
 * Ties together pet animation, chat, drag, and LX Music controls
 */

(function () {
  'use strict';

  // --- DOM refs ---
  const $ = (id) => document.getElementById(id);
  const canvas       = $('pet-canvas');
  const chatBubble   = $('chat-bubble');
  const chatMessages = $('chat-messages');
  const inputBar     = $('input-bar');
  const chatInput    = $('chat-input');
  const sendBtn      = $('send-btn');
  const chatClose    = $('chat-close');
  const musicBar     = $('music-bar');
  const musicTitle   = $('music-title');
  const musicArtist  = $('music-artist');
  const musicProgressFill = $('music-progress-fill');
  const musicTimeNow  = $('music-time-now');
  const musicTimeTotal = $('music-time-total');
  const musicLyric   = $('music-lyric');
  const btnPrev      = $('btn-prev');
  const btnToggle    = $('btn-toggle');
  const btnNext      = $('btn-next');
  const btnVolDown   = $('btn-vol-down');
  const btnVolUp     = $('btn-vol-up');
  const btnCollect   = $('btn-collect');
  const musicCollapse = $('music-collapse');
  const musicHide    = $('music-hide');

  // --- State ---
  let chatVisible = false;
  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let hasMoved = false;
  let clickTimer = null;
  let clickThroughEnabled = false;

  // --- Init ---
  const pet  = new PetRenderer(canvas);
  const chat = new ChatManager();
  const lxm  = new LXMusicController();

  // =============================================
  //  Chat
  // =============================================

  chatClose.addEventListener('click', (e) => { e.stopPropagation(); hideChat(); });

  chat.onMessage = (msg) => {
    appendMessage(msg);
    if (msg.role === 'pet') {
      pet.setState('talk');
      setTimeout(() => pet.setState(chatVisible ? 'look' : 'idle'), 1500);
    }
  };

  chat.onStateChange = (state, streamingText) => {
    if (state === 'loading') pet.setState('talk');
    else if (state === 'streaming' && streamingText) updateLastPetMessage(streamingText);
    else if (state === 'error') pet.setState('idle');
  };

  function toggleChat() {
    chatVisible = !chatVisible;
    chatBubble.classList.toggle('hidden', !chatVisible);
    inputBar.classList.toggle('hidden', !chatVisible);

    if (chatVisible) {
      pet.setState('look');
      chatInput.focus();
      window.petAPI.setSize(360, 580);
    } else {
      pet.setState('idle');
      window.petAPI.setSize(360, 400);
    }
    // Re-evaluate click-through
    setClickThrough(false);
  }

  function showChat() { if (!chatVisible) toggleChat(); }
  function hideChat() { if (chatVisible) toggleChat(); }

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
  //  LX Music
  // =============================================

  lxm.onStatusChange = (data) => {
    if (data) {
      if (!musicBar.dataset.userHidden) musicBar.classList.remove('hidden');
      musicTitle.textContent = data.name || '--';
      musicArtist.textContent = data.singer || '--';
      musicTimeNow.textContent = lxm.formatTime(data.progress);
      musicTimeTotal.textContent = lxm.formatTime(data.duration);
      btnToggle.textContent = data.status === 'playing' ? '⏸' : '▶';
      musicLyric.textContent = data.lyricLineText || '--';

      if (data.duration > 0) {
        musicProgressFill.style.width = Math.min(100, (data.progress / data.duration) * 100) + '%';
      }

      btnCollect.classList.toggle('active', !!data.collect);
      btnCollect.textContent = data.collect ? '♥' : '♡';

      if (data.status === 'playing' && pet.state === 'idle') {
        pet.setState('happy');
        setTimeout(() => { if (pet.state === 'happy') pet.setState('idle'); }, 3000);
      }
    } else {
      musicBar.classList.add('hidden');
    }
  };

  musicCollapse.addEventListener('click', () => {
    musicBar.classList.toggle('collapsed');
    musicCollapse.textContent = musicBar.classList.contains('collapsed') ? '+' : '−';
  });

  musicHide.addEventListener('click', () => {
    musicBar.classList.add('hidden');
    musicBar.dataset.userHidden = 'true';
  });

  btnToggle.addEventListener('click', () => lxm.toggle());
  btnPrev.addEventListener('click', () => lxm.prev());
  btnNext.addEventListener('click', () => lxm.next());
  btnVolDown.addEventListener('click', () => {
    const v = lxm.current?.volume;
    if (v !== undefined) lxm.volume(Math.max(1, v - 10));
  });
  btnVolUp.addEventListener('click', () => {
    const v = lxm.current?.volume;
    if (v !== undefined) lxm.volume(Math.min(100, v + 10));
  });
  btnCollect.addEventListener('click', () => {
    lxm.current?.collect ? lxm.uncollect() : lxm.collect();
  });

  $('music-progress').addEventListener('click', (e) => {
    if (!lxm.current?.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    lxm.request(`/seek?offset=${Math.floor(pct * lxm.current.duration)}`).then(() => lxm.getStatus());
  });

  lxm.startPolling(2000);

  function toggleMusicBar() {
    if (musicBar.classList.contains('hidden')) {
      musicBar.classList.remove('hidden');
      musicBar.dataset.userHidden = '';
    } else {
      musicBar.classList.add('hidden');
      musicBar.dataset.userHidden = 'true';
    }
  }

  // =============================================
  //  Drag
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
    if (!isDragging) return;
    isDragging = false;
    canvas.style.cursor = 'grab';
    if (!hasMoved) handleClick();
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
      clickTimer = setTimeout(() => { clickTimer = null; pet.wake(); }, 250);
    }
  }

  // =============================================
  //  Context menu
  // =============================================

  canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    showContextMenu(e.clientX, e.clientY);
  });

  function showContextMenu(x, y) {
    const old = $('context-menu');
    if (old) old.remove();

    const menu = document.createElement('div');
    menu.id = 'context-menu';
    Object.assign(menu.style, {
      position: 'fixed', left: x + 'px', top: y + 'px',
      background: 'rgba(20, 8, 8, 0.95)',
      border: '1px solid rgba(255, 69, 58, 0.4)',
      borderRadius: '8px', padding: '4px 0',
      zIndex: '1000', minWidth: '160px',
      backdropFilter: 'blur(8px)',
    });

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
      null, // separator
      { label: '⏮ 上一曲', action: () => lxm.prev() },
      { label: lxm.current?.status === 'playing' ? '⏸ 暂停' : '▶ 播放', action: () => lxm.toggle() },
      { label: '⏭ 下一曲', action: () => lxm.next() },
      { label: musicBar.classList.contains('hidden') ? '📺 显示面板' : '📺 隐藏面板', action: toggleMusicBar },
      null,
      { label: '⚙️ 设置', action: showSettings },
      { label: '❌ 退出', action: () => window.petAPI.quit() },
    ];

    for (const item of items) {
      if (!item) {
        const sep = document.createElement('div');
        Object.assign(sep.style, { height: '1px', background: 'rgba(255,69,58,0.2)', margin: '4px 0' });
        menu.appendChild(sep);
        continue;
      }

      const btn = document.createElement('div');
      btn.textContent = item.label;
      Object.assign(btn.style, {
        padding: '8px 16px', color: '#FF8A80', fontSize: '13px', cursor: 'pointer',
      });
      btn.addEventListener('mouseenter', () => btn.style.background = 'rgba(255,69,58,0.15)');
      btn.addEventListener('mouseleave', () => btn.style.background = 'transparent');
      btn.addEventListener('click', () => { menu.remove(); item.action(); });
      menu.appendChild(btn);
    }

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
  //  Settings
  // =============================================

  function showSettings() {
    showChat();
    const div = document.createElement('div');
    div.className = 'msg msg-system';
    div.innerHTML = `
      <div style="text-align:left;color:#FF8A80;font-size:12px;line-height:2;">
        <div style="color:#FF5252;font-weight:bold;margin-bottom:4px;">⚙️ 设置</div>
        <div>Gateway: <input id="cfg-url" value="${chat.config.gatewayUrl}"
          style="background:rgba(0,0,0,0.3);border:1px solid rgba(255,69,58,0.3);
          border-radius:4px;padding:2px 6px;color:#FFCDD2;width:160px;font-size:11px;" /></div>
        <div>Token: <input id="cfg-token" type="password" value="${chat.config.token}"
          style="background:rgba(0,0,0,0.3);border:1px solid rgba(255,69,58,0.3);
          border-radius:4px;padding:2px 6px;color:#FFCDD2;width:172px;font-size:11px;" /></div>
        <button id="cfg-save" style="margin-top:6px;background:rgba(229,57,53,0.6);
          border:1px solid rgba(255,69,58,0.4);border-radius:4px;padding:4px 16px;
          color:white;cursor:pointer;font-size:11px;">保存</button>
      </div>
    `;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    $('cfg-save').addEventListener('click', () => {
      chat.setGateway($('cfg-url').value.trim(), $('cfg-token').value.trim());
      appendMessage({ role: 'system', content: '✅ 配置已保存' });
    });
  }

  // =============================================
  //  Keyboard shortcuts
  // =============================================

  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'P') { e.preventDefault(); toggleChat(); }
    if (e.ctrlKey && e.key === 'm') { e.preventDefault(); toggleMusicBar(); }
    if (document.activeElement !== chatInput) {
      if (e.key === ' ') { e.preventDefault(); lxm.toggle(); }
      if (e.key === 'ArrowRight') { e.preventDefault(); lxm.next(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); lxm.prev(); }
    }
  });

  // =============================================
  //  Click-through (transparent areas)
  // =============================================

  function setClickThrough(enable) {
    if (enable === clickThroughEnabled) return;
    clickThroughEnabled = enable;
    window.petAPI.setIgnore(enable);
  }

  function isOverPet(mx, my) {
    const b = pet.bounds;
    const cx = b.x + b.w / 2;
    const cy = b.y + b.h / 2;
    const rx = b.w / 2;
    const ry = b.h / 2;
    const dx = (mx - cx) / rx;
    const dy = (my - cy) / ry;
    return (dx * dx + dy * dy) <= 1;
  }

  document.addEventListener('mousemove', (e) => {
    const overPet = isOverPet(e.clientX, e.clientY);
    const overUI = e.target.closest('#chat-bubble, #input-bar, #music-bar, #context-menu');
    setClickThrough(!overPet && !overUI);
  });

  document.addEventListener('mouseleave', () => setClickThrough(true));

  console.log('Claw Desktop Pet started!');
})();

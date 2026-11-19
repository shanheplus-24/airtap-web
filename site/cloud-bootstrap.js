/* Connect the GitHub-hosted frontend to the authenticated compute gateway. */
(async () => {
  'use strict';
  const storageKey = 'airtap-private-access';
  const fragment = new URLSearchParams(location.hash.slice(1));
  if (fragment.has('access')) {
    sessionStorage.setItem(storageKey, fragment.get('access'));
    history.replaceState(null, '', location.pathname + location.search + '#/flowsheets');
  }
  navigator.serviceWorker.addEventListener('message', event => {
    if (event.data?.type === 'AIRTAP_ACCESS_REQUEST' && event.ports[0]) {
      event.ports[0].postMessage({token: sessionStorage.getItem(storageKey) || ''});
    }
  });
  document.addEventListener('click', async event => {
    const anchor = event.target.closest?.('a[href]');
    if (!anchor) return;
    const target = new URL(anchor.href, location.href);
    if (target.origin !== location.origin || !target.pathname.startsWith('/api/')) return;
    event.preventDefault();
    try {
      const response = await fetch(target.href, {cache: 'no-store'});
      if (!response.ok) throw new Error('结果下载失败，请稍后重试。');
      const disposition = response.headers.get('Content-Disposition') || '';
      const match = disposition.match(/filename="?([^";]+)"?/i);
      const name = match ? match[1] : target.pathname.split('/').pop() || 'result';
      const objectUrl = URL.createObjectURL(await response.blob());
      const download = document.createElement('a');
      download.href = objectUrl;
      download.download = name;
      download.click();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 30000);
    } catch (error) {
      alert(error.message);
    }
  });
  const panel = document.createElement('div');
  panel.style.cssText = 'max-width:460px;margin:100px auto;padding:28px;font:16px Arial,sans-serif;line-height:1.6;color:#193344';
  panel.innerHTML = '<h1 style="font-size:25px;margin:0 0 12px">AirTAP</h1><p>输入访问码以连接计算服务器。</p><form><label for="access-code">访问码</label><input id="access-code" type="password" autocomplete="off" required style="box-sizing:border-box;width:100%;padding:12px;margin:8px 0 16px;font:inherit"><button type="submit" style="padding:10px 22px;background:#1976d2;border:0;border-radius:4px;color:white;font:inherit;cursor:pointer">连接</button></form><p id="connection-message" role="status"></p>';
  document.body.appendChild(panel);
  const message = panel.querySelector('#connection-message');
  let loaded = false;
  async function connect(token) {
    message.textContent = '正在连接计算服务器…';
    try {
      await navigator.serviceWorker.register('./compute-worker.js', {scope: './', updateViaCache: 'none'});
      await navigator.serviceWorker.ready;
      if (!navigator.serviceWorker.controller) {
        await new Promise(resolve => navigator.serviceWorker.addEventListener('controllerchange', resolve, {once: true}));
      }
      sessionStorage.setItem(storageKey, token);
      const channel = new MessageChannel();
      const ready = new Promise(resolve => {channel.port1.onmessage = resolve;});
      navigator.serviceWorker.controller.postMessage({type: 'AIRTAP_ACCESS', token}, [channel.port2]);
      await ready;
      const response = await fetch('/api/', {cache: 'no-store'});
      if (response.status === 401) {
        sessionStorage.removeItem(storageKey);
        throw new Error('访问码无效，请重新输入。');
      }
      if (!response.ok) throw new Error('计算服务器暂时无法连接，请稍后重试。');
      if (loaded) return;
      loaded = true;
      panel.remove();
      const entry = document.querySelector('meta[name="airtap-entrypoint"]').content;
      const script = document.createElement('script');
      script.type = 'module';
      script.src = entry;
      document.body.appendChild(script);
    } catch (error) {
      message.textContent = error.message || '连接失败，请稍后重试。';
    }
  }
  panel.querySelector('form').addEventListener('submit', event => {
    event.preventDefault();
    connect(panel.querySelector('input').value.trim());
  });
  const token = sessionStorage.getItem(storageKey);
  if (token) connect(token);
})();

/* API transport for the existing frontend, including images and downloads. */
importScripts('./compute-config.js');
const accessByClient = new Map();
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('message', event => {
  if (event.data?.type === 'AIRTAP_ACCESS') {
    accessByClient.set(event.source.id, event.data.token || '');
    if (event.ports[0]) event.ports[0].postMessage({ready: true});
  }
});
async function accessFor(clientId) {
  const client = clientId ? await self.clients.get(clientId) : null;
  if (!client) return accessByClient.get(clientId) || '';
  return new Promise(resolve => {
    const channel = new MessageChannel();
    const timer = setTimeout(() => resolve(''), 5000);
    channel.port1.onmessage = event => {
      clearTimeout(timer);
      resolve(event.data.token || '');
    };
    client.postMessage({type: 'AIRTAP_ACCESS_REQUEST'}, [channel.port2]);
  });
}
self.addEventListener('fetch', event => {
  const source = new URL(event.request.url);
  if (source.origin !== self.location.origin || !(source.pathname === '/api' || source.pathname.startsWith('/api/'))) return;
  event.respondWith((async () => {
    const token = await accessFor(event.clientId);
    if (!token) return new Response(JSON.stringify({detail: '请先连接计算服务器。'}), {status: 401, headers: {'Content-Type': 'application/json'}});
    const headers = new Headers(event.request.headers);
    headers.set('Authorization', 'Bearer ' + token);
    const options = {method: event.request.method, headers, mode: 'cors', credentials: 'omit', cache: 'no-store'};
    if (!['GET', 'HEAD'].includes(options.method)) options.body = await event.request.arrayBuffer();
    try {
      const response = await fetch(self.AIRTAP_COMPUTE_ORIGIN + source.pathname + source.search, options);
      const clean = new Headers(response.headers);
      clean.delete('Content-Encoding');
      clean.delete('Content-Length');
      return new Response(await response.arrayBuffer(), {status: response.status, statusText: response.statusText, headers: clean});
    } catch {
      return new Response(JSON.stringify({detail: '计算服务器连接暂时中断，请稍后重试。'}), {status: 503, headers: {'Content-Type': 'application/json'}});
    }
  })());
});

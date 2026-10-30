type InterceptIdentity = { no?: string; waybillNo: string };
const channel = 'tiantu-intercept-cancel-v1';

export function cancelTiantuIntercepts(items: InterceptIdentity[], reason: string): Promise<void> {
  if (!items.length) return Promise.resolve();
  const target = new URL('/tiantu-next-copy/#overseas-intercept', window.location.href);
  if (['localhost','127.0.0.1'].includes(target.hostname)) target.port = '4328';
  const id = crypto.randomUUID();
  return new Promise((resolve, reject) => {
    const frame = document.createElement('iframe');
    frame.hidden = true;
    frame.title = '天图拦截状态校验';
    let retry: ReturnType<typeof setInterval>;
    const cleanup = () => { clearTimeout(timeout); clearInterval(retry); window.removeEventListener('message', receive); frame.remove(); };
    const receive = (event: MessageEvent) => {
      if (event.origin !== target.origin || event.source !== frame.contentWindow || event.data?.channel !== channel || event.data?.id !== id) return;
      cleanup();
      if (event.data.ok === true) resolve();
      else reject(new Error(typeof event.data.error === 'string' ? event.data.error : '取消下单失败：天图状态校验失败'));
    };
    const timeout = setTimeout(() => { cleanup(); reject(new Error('取消下单失败：无法读取天图拦截状态，请确认天图系统可访问后重试')); }, 12000);
    window.addEventListener('message', receive);
    frame.onload = () => {
      const send = () => frame.contentWindow?.postMessage({channel,id,action:'cancel',items,reason}, target.origin);
      send(); retry = setInterval(send, 250);
    };
    frame.src = target.href;
    document.body.append(frame);
  });
}

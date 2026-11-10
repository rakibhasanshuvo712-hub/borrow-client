const CDP = "http://127.0.0.1:9225";
const sleep = ms => new Promise(r => setTimeout(r, ms));

const page = await (await fetch(`${CDP}/json/new?about:blank`, { method: "PUT" })).json();
const ws = new WebSocket(page.webSocketDebuggerUrl);
let id = 0;
const pending = new Map();
const logs = [];
const failed = [];

ws.onmessage = e => {
  const msg = JSON.parse(e.data);
  if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); return; }
  if (msg.method === "Runtime.consoleAPICalled" && msg.params.type === "error") logs.push(msg.params.args.map(a => a.value ?? a.description ?? "").join(" ").slice(0, 300));
  if (msg.method === "Runtime.exceptionThrown") logs.push("exception: " + (msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text).slice(0, 300));
  if (msg.method === "Network.loadingFailed") failed.push(msg.params.errorText);
  if (msg.method === "Network.responseReceived" && msg.params.response.status >= 400) failed.push(`${msg.params.response.status} ${msg.params.response.url.slice(0, 120)}`);
};
await new Promise(r => (ws.onopen = r));
const send = (method, params = {}) => new Promise(resolve => {
  const msgId = ++id;
  pending.set(msgId, resolve);
  ws.send(JSON.stringify({ id: msgId, method, params }));
});
const evalJs = async expression => {
  const r = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  return r.result?.result?.value;
};

await send("Runtime.enable");
await send("Network.enable");
await send("Page.enable");
await send("Page.navigate", { url: "https://borrowhub-client.vercel.app/register" });
await sleep(12000);

console.log("inputs:", await evalJs(`JSON.stringify(Array.from(document.querySelectorAll('input')).map(i => ({type: i.type, name: i.name, placeholder: i.placeholder})))`));

await evalJs(`(() => {
  const set = (el, v) => { const s = Object.getOwnPropertyDescriptor(el.constructor.prototype, 'value').set; s.call(el, v); el.dispatchEvent(new Event('input', {bubbles: true})); el.dispatchEvent(new Event('change', {bubbles: true})); };
  const inputs = Array.from(document.querySelectorAll('input'));
  const name = inputs.find(i => /name/i.test(i.name + i.placeholder));
  const email = inputs.find(i => i.type === 'email');
  const pass = inputs.find(i => i.type === 'password');
  set(name, 'Vercel UI Check');
  set(email, 'vercel-ui-check-1110@example.com');
  set(pass, 'password1234');
  const btn = Array.from(document.querySelectorAll('button')).find(b => /create account|sign up|register/i.test(b.textContent));
  btn.click();
  return true;
})()`);
await sleep(20000);

const state = await evalJs(`JSON.stringify({ href: location.href, text: document.body.innerText.slice(0, 300) })`);
console.log("state:", state);
console.log("errors:", logs.slice(0, 5));
console.log("failed requests:", [...new Set(failed)].slice(0, 8));
ws.close();
process.exit(0);

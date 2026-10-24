// Keep the native transport and its playback handlers; only anchor its host.
const transportSelector = '[data-slot="timeline-transport-controls"]';
const headerSelector = '[data-slot="properties-panel-header"]';
let frame = 0;
let host;
let panel;
const resize = new ResizeObserver(schedule);
function schedule() {
  if (!frame) frame = requestAnimationFrame(placeTransport);
}
function placeTransport() {
  frame = 0;
  const transport = document.querySelector(transportSelector);
  const header = document.querySelector(headerSelector);
  const runtimeHost = transport?.closest('[data-slot="toolcraft-runtime-panel-host"]');
  const nextHost = runtimeHost?.parentElement;
  if (!nextHost || !header) return;
  if (host !== nextHost || panel !== header) {
    resize.disconnect();
    host = nextHost;
    panel = header;
    resize.observe(host);
    resize.observe(panel);
  }
  const rect = panel.getBoundingClientRect();
  const right = Math.max(10, window.innerWidth - rect.left + 12);
  const top = Math.max(10, Math.min(window.innerHeight - host.offsetHeight - 10, rect.top - 1));
  const values = {
    position: 'fixed', left: 'auto', right: `${right}px`, top: `${top}px`,
    bottom: 'auto', transform: 'none', translate: 'none', maxWidth: `${Math.max(36, rect.left - 22)}px`,
  };
  for (const [key, value] of Object.entries(values)) {
    if (host.style[key] !== value) host.style[key] = value;
  }
  host.dataset.beamTransportAnchor = 'properties-panel';
}
// Panel dragging changes ancestor transforms. Coalesce updates to one per frame.
new MutationObserver(schedule).observe(document.documentElement, {
  subtree: true, childList: true, attributes: true, attributeFilter: ['style', 'class'],
});
window.addEventListener('resize', schedule, {passive: true});
schedule();

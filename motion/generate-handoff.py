"""Generate only the six user-selected motion handoffs from one JSON specification."""
from pathlib import Path
import json

root = Path(__file__).resolve().parent
spec = json.loads((root / 'motion-spec.json').read_text())
assert len(spec['animations']) == 10
base = 'https://fiora-node-motion.vercel.app/'
code = {
'M01': '''```js
import {wirePath, installWireMotion} from './wire-motion.js';
// See actual wiring inside wire-interactions.js.
const motion = installWireMotion(svg, cubicBezierEase);
motion.settle({from:sourcePoint,point:releasePoint,to:inputPoint,valid:true,onComplete});
// Invalid or cancel: valid:false, no graph mutation. Call motion.render() each RAF.
```

Manual commit320ms cubic-bezier(.4,0,.2,1): dashed preview fades .45→0 while solid3px draws source→input. Endpoint moves releasePoint→detected input over160ms. Committed edge is hidden until overlay completes, so no instant solid jump. Invalid/cancel retract260ms from full length to0; previous graph retained. Explicit Disconnect remains600ms.

All paths use shared cubic Bézier with h=clamp(.45*hypot(dx,dy),64,240), horizontal source/target tangents, round caps/joins. No orthogonal polyline elbows. See wire-motion.js for runnable implementation. Reduced motion settles immediately; temporary cable remains static dashed5/5.
''',
'M02': '''```js
// SVG overlay ở viewport ngoài #world; tất cả giá trị ở screen CSS px.
const phase = ((performance.now()-entered)/1300)%1;
const ringRadius = portScreenRadius + 14*(1-phase)**2;
const ringOpacity = Math.sin(Math.PI*phase)*.28;
const haloRadius = portScreenRadius + 12;
// Resolve compatible free input by entire node-body hit; otherwise proximity58 for feedback /28 for drop. Reject occupied inputs, self links and cycles.
// Chỉ1 vòng co, không thêm nhiều vòng phase-offset.
```

Lấy hàm `particles()` trong app.js và `installConnectorFeedback()` trong connector-feedback.js để giữ đúng physics. Module dùng pool26 hạt nhưng chỉ render tối đa8 rect, opacity group.65; điểm hút/particle sizes được tính trong screen-space. API cần viewport, world, graph(), drag(), particles(), clearParticles(); cuối app.js có lời gọi đầy đủ. Body hover targets its available matching connector even far from port. Overlay xóa khi rời target/thả/hủy; đổi target reset seed.

Color precedence của cổng: selected > connected > neutral; neutral#E4E4E7, connected#8FC7FF, selected#1188FF, border1.5px. M02 target hợp lệ dùng ring xanh nhạt khi owner không selected. Với reduced motion, halo tĩnh.025 + ring radius+4, stroke1 #8FC7FF alpha.5; không dot.

Live drag là bản được duyệt. Automatic Connect timeline còn sample pulse900ms/26dots; không lấy sample đó làm thông số triển khai live target.
''',
'M03': '''```css
@keyframes impact-ring {
  from {opacity:1;transform:scale(.6)}
  to {opacity:0;transform:scale(2.6)}
}
@keyframes impact-core {
  from {opacity:.9;transform:scale(1.4)}
  to {opacity:0;transform:scale(.6)}
}
@keyframes impact-flash {
  0% {opacity:0;transform:scaleY(.05)}
  25% {opacity:1}
  100% {opacity:0;transform:scaleY(1)}
}
/* Ring/core/flash:650ms cubic-bezier(.22,1,.36,1).
   SVG ring r10 stroke2 #198AFF; core r6 fill#198AFF.
   transform-box:fill-box; origin:center (flash origin tại input Y). */
```

Sweep:2 rounded paths bắt đầu tại input Y, một đi vòng trên và một vòng dưới, radius16. `pathLength=1`, dasharray `.22 2`; offset `.22 - cubicBezier(age/.65,.33,0,.2,1)`, tức .22→−.78. Opacity giữ1 tới75%, fade tuyến tính về0 trong25% cuối. Core2px; glow8px alpha.3, blur2px. Outline1.5px:0→.45 tại35%→0, mỗi đoạn ease-out.

Recoil là child transform để giữ node drag wrapper:320ms, push−8px nhân các hệ số tại offset `[0,0],[.25,1],[.55,-.3],[.8,.1],[1,0]`; ease-out giữa từng đoạn. Kết thúc trả0 và xóa overlay sau650ms. Reduced motion bỏ toàn bộ impact/recoil/sweep. Prototype áp dụng impact cho generator gốc; inserted nodes mới chỉ có routing preview.
''',
'M07': '''```css
@property --gradient-angle {syntax:'<angle>';inherits:false;initial-value:0deg}
@property --segment-size {syntax:'<number>';inherits:false;initial-value:.278}
@keyframes rotate-gradient {from {--gradient-angle:0deg} to {--gradient-angle:360deg}}
@keyframes fill-border {from {--segment-size:.278} to {--segment-size:1}}
.receiver.finishing .beam-ring {
  display:block;
  overflow:visible;
  background:conic-gradient(from calc(var(--gradient-angle) + 225deg),
    transparent 0turn,
    #1188FF calc(.056turn * var(--segment-size) / .278),
    #8FC7FF calc(.167turn * var(--segment-size) / .278),
    transparent calc(var(--segment-size) * 1turn),transparent 1turn);
  animation:rotate-gradient 4s linear infinite,fill-border .8s ease-out forwards;
}
```

Dùng cấu trúc `.beam-glow`, `.beam-ring` phía sau `.node-content` trắng opaque; layer inset−4px, outerradius20, inner16; spinning plane có cạnh `hypot(cardWidth+8,cardHeight+8)`. Glow dùng cùng conic và cùng phase, blur20px alpha.6. Khi finishing ẩn `.beam-spin`; chuyển background sang gradient trên. Giữ phase rotation hiện tại, không restart góc khi đổi state. Trong demo, render() gán currentTime theo origin3s cho rotate và8.4s cho fill; production giữ cùng clock/Animation thay vì reset class làm giật phase.

Expansion800ms ease-out; rotation4000ms linear chạy tiếp. Interior vẫn trắng trơn. Chờ completion thật + image.decode trước reveal; 800ms chỉ là chiều dài expansion, không phải thời gian generation. Reduced motion: outline#1188FF tĩnh, glow ẩn, không spin/expand.
''',
'M08': '''```js
// Production: outputImage là img của kết quả hiện hành.
await outputImage.decode();
receiver.classList.remove('finishing');
receiver.classList.add('reveal');
```

```css
.receiver.reveal .result-content img {
  animation:media-reveal .5s cubic-bezier(.4,0,.2,1) forwards;
}
@keyframes media-reveal {
  from {opacity:.8;filter:blur(15px) brightness(1.08) saturate(.75)}
  to {opacity:1;filter:none}
}
@media(prefers-reduced-motion:reduce) {
  .receiver.reveal .result-content img {animation:none;opacity:1;filter:none}
}
```

Không scale; image full node, object-fit:cover; container radius16 và overflow:hidden. Delay0;1 iteration. Kết thúc500ms dùng state done, opacity1/filter:none. Decode error không reveal ảnh dở; xử lý tại integration. Demo đợi decode ảnh bundle khi startup và dùng ảnh source làm output, không gọi AI.
''',
'M12': '''```js
// Quy tắc mutation; minh họa cho graph store production.
function replaceSelectedEdge(edges, edgeId, newNodeId) {
  const edge = edges.find(e => e.id === edgeId);
  if (!edge) return edges;
  return [
    ...edges.filter(e => e.id !== edgeId),
    {...edge, id:crypto.randomUUID(), to:newNodeId},
    {...edge, id:crypto.randomUUID(), from:newNodeId}
  ];
}
// Chỉ commit sau khi user chọn node type. Escape/outside không đổi graph.
```

Lấy module thực tế `installWireInteractions(api)` để có selection, hover timers, dropdown positioning, search, graph mutation, routes và disconnect600ms. Module gắn listeners vào scene này; cần callbacks/DOM như lời gọi cuối app.js, chưa có API destroy cho SPA unmount. Production cần gỡ listeners/timers khi unmount.

State flow: idle → hover200ms / right-click → action menu. Click dây chỉ select; Delete/Backspace (ngoài editable fields) hoặc Disconnect mới xóa đoạn được chọn. Drop vào khung node tự chọn cổng đúng loại còn trống; success320ms fill, invalid260ms retract. Insert mở search; chọn item tạo node rồi thay đúng1 edge bằng2 edges cùng kind; branches khác giữ nguyên. Escape/outside hủy menu/picker, không mutate. Leave wire160ms, leave menu180ms; enter panel hủy close timer. Menu/picker nằm ngoài world transform nên giữ đúng kích thước khi zoom.

Menu không có animation entrance/fade/scale. Border1#E4E4E7, width240/padding12/radius18;2 rows56, padding12/gap16/radius10; icon22#62636E; Inter16/24 weight400#202025; hover#F5F5F6; shadow `0 12px 32px #18181b14,0 2px 6px #18181b06`. Không dùng dấu cộng hồng. Full picker types, dimensions, anchor/clamp và insertion offsets trong JSON bên dưới.

Disconnect reverse600ms, chỉ xóa selected segment; node giữ lại. Nếu text hoặc image path không tới generator thì Run disabled. Inserted nodes là graph/placement preview, chưa có AI backend. Test repeated insertion, disconnected branch, empty search, click outside, Escape và giữ nhánh không chọn.
'''
}

metadata = {'id','name','order','version','trigger','duration','easing','summary','parameters','exit','reducedMotion','implementation','code','previewMode','previewSteps','previewTime','previewURL','docsAnchor','downloadMarkdown','evidence','source','secondarySource'}

def effect(a):
    body = f"<a id=\"{a['docsAnchor']}\"></a>\n\n## {a['order']}. {a['name']} · {a['id']}\n\n{a['summary']}\n\n"
    rows = [('Trigger',a['trigger']),('Duration / easing',a['duration']+' · '+a['easing']),('Thông số',a['parameters']),('Exit / cleanup',a['exit']),('Reduced motion',a['reducedMotion']),('Trạng thái implement',a['implementation'])]
    body += ''.join(f'- **{k}:** {v}\n' for k,v in rows)
    body += '- **Code:** '+'; '.join('`'+c+'`' for c in a['code'])+'\n'
    body += '- **Preview:** '+(a.get('previewSteps') or f"[Mở frame t={a['previewTime']}s]({a['previewURL']}) rồi Play/seek.")+'\n'
    body += '- **Download riêng:** ['+a['id']+'.md]('+base+a['downloadMarkdown']+')\n\n'
    body += '### Code / cách áp dụng\n\n'+code[a['id']]+'\n'
    detail={k:v for k,v in a.items() if k not in metadata}
    body += '### Toàn bộ thông số chi tiết\n\n```json\n'+json.dumps(detail,ensure_ascii=False,indent=2)+'\n```\n\n'
    body += '**Nguồn tham chiếu:** '+a['evidence']+'.'+(' [CSS/JS reference]('+a['source']+')' if a.get('source') else '')+'\n'
    return body

intro=f"# Fiora — motion annotations\n\nVersion **{spec['version']}**. Sáu note gốc được giữ theo bản trước. Ba yêu cầu wire nằm riêng trong M16–M18. M19 là node target border/elevation, độc lập với M02.\n\n[Preview]({base}?lab=1) · [Source ZIP]({base}fiora-motion-source.zip)\n\n"
code['M16']="Lấy settle()/render() trong wire-motion.js. Gọi mỗi RAF; chỉ reveal graph edge khi onComplete. Endpoint morph160ms, fill320ms và dash fade cùng phase."
code['M17']="```js\nconst h=Math.max(64,Math.min(240,Math.hypot(b.x-a.x,b.y-a.y)*.45));\nconst d=`M ${a.x} ${a.y} C ${a.x+h} ${a.y} ${b.x-h} ${b.y} ${b.x} ${b.y}`;\n```\nDùng chung wirePath() cho dây gốc, node chèn và preview."
code['M18']="resolveTarget() kiểm tra body hit hoặc gần cổng, filter kind/occupancy/cycle trước khi commit. finishCable() dùng valid=false để chạy retract260ms, giữ nguyên graph."
code['M19']="""```css
:root { --node-target-shadow:0 0 0 1px #1188FF26,0 16px 48px #182B4933,0 4px 12px #182B4924; }
.node-group.is-drop-target .receiver {
  outline-color:#1188FF;
  box-shadow:var(--node-target-shadow);
  transition:box-shadow 180ms ease-out;
}
.inserted-node.is-drop-target .inserted-card {
  border-color:#1188FF;
  box-shadow:var(--node-target-shadow);
  transition:box-shadow 180ms ease-out;
}
/* No border/outline color transitions. Selected selectors match/exceed hover specificity. */
.node-group[data-node-state=selected] .receiver { outline-color:#1188FF; }
@media(prefers-reduced-motion:reduce) {
  .receiver,.source .card,.inserted-card { transition:none; }
}
```

State precedence: processing beam owns its border; locked inputs reject cable. Otherwise valid target > clicked selected > hover > default. Selection is synchronous inside document pointerdown capture via syncSelection(), not deferred until the animation RAF. Default2px#E4E4E7, hover#D4D4D8, click#1188FF. No connection alone implies selection. Generator toolbar is visible on hover/selection/target/locked. Original source cards share instant selection, but have no compatible incoming port so never accept cable drops.

Node body target resolves by whole380x380 scene rect or port proximity58 screenpx (drop threshold28). Class toggles on owner, separate from M02 SVG ring/particles. Shadow is scene CSS px and scales with zoom; no translate/scale, so cable centers and hit bounds stay aligned. Shadow ramps with CSS ease-out for180ms; on quick re-entry CSS transitions continue from current interpolated shadow. Blue border appears immediately with no delay. Cleanup on leave/release/Escape/pointercancel/blur restores underlying state; target wrapper and SVG connector feedback cleaned independently. Browser/SPA unmount must remove document/window event listeners as noted in M12.

Manual QA: disconnect both wires, deselect canvas => default. Hover => gray; pointerdown card => blue immediately, not overridden by hover. Drag original output into compatible generator or inserted body => blue + clearly elevated shadow; leave/Escape => no leftover glow/shadow. Occupied/wrong-kind/self/cycle/locked => no feedback. Reduced motion => static border/shadow, no transition. This note is independent of M02 and its MD.
"""
docs=root/'docs';docs.mkdir(exist_ok=True)
parts=[]
for a in spec['animations']:
    file=docs/(a['id']+'.md')
    if a['order']<=6:
        if not file.exists(): raise RuntimeError('Original six MD documents must remain present')
        parts.append(file.read_text())
    else:
        body=f"# Fiora / {a['name']}\n\nVersion **{spec['version']}** · Yêu cầu riêng · {a['id']} · [Source ZIP]({base}fiora-motion-source.zip)\n\n"+effect(a)
        file.write_text(body);parts.append(body)
(root/'DEVELOPER-HANDOFF.md').write_text(intro+'\n\n---\n\n'.join(parts))
print('Preserved6 original MD files; generated4 separate notes + combined handoff')

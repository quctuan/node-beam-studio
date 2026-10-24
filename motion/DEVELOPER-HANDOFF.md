# Fiora — motion annotations

Version **1.4.4**. Sáu note gốc được giữ theo bản trước. Ba yêu cầu wire nằm riêng trong M16–M18. M19 là node target border/elevation, độc lập với M02.

[Preview](https://fiora-node-motion.vercel.app/?lab=1) · [Source ZIP](https://fiora-node-motion.vercel.app/fiora-motion-source.zip)

# Fiora / Connection draw + Disconnect

Version **1.3.1** · M01 · [Tất cả6 hiệu ứng](https://fiora-node-motion.vercel.app/DEVELOPER-HANDOFF.md) · [Source ZIP](https://fiora-node-motion.vercel.app/fiora-motion-source.zip)

<a id="m01"></a>

## 1. Connection draw + Disconnect · M01

Vẽ đường từ source đến target; ngắt thì chạy ngược.

- **Trigger:** Demo Connect or edge Disconnect; pointerdown on output starts live temporary cable
- **Duration / easing:** 600 ms · cubic-bezier(.4,0,.2,1)
- **Thông số:** Demo draw 600ms, offset L → 0; disconnect 600ms, offset 0 → L. Drag preview #1188FF / .45, width2, dash5 gap5, offset0 → -20 over500ms linear infinite. Manual commit switches immediately to a solid wire; it does not replay demo draw. Solid stroke3px #198AFF; length measured with getTotalLength().
- **Exit / cleanup:** Release commits valid same-kind input; invalid drop / Escape / pointercancel / blur removes temporary cable and preserves prior connection.
- **Reduced motion:** Temporary dashes remain static. Demo draw switches immediately; graph disconnect retains its 600ms reverse draw.
- **Trạng thái implement:** implemented; draw timeline and manual drag use different clocks
- **Code:** `app.js: line(), endDrag(), .port.out pointer handlers`; `wire-interactions.js: draw(), disconnect(), findTarget()`; `style.css: #drag-wire, @keyframes drag-dash`
- **Preview:** [Mở frame t=0.3s](https://fiora-node-motion.vercel.app/?lab=1&t=0.3) rồi Play/seek.
- **Download riêng:** [M01.md](https://fiora-node-motion.vercel.app/docs/M01.md)

### Code / cách áp dụng

```js
// Demo draw uses this SVG-length rule; manual drop commits solid immediately.
const length = path.getTotalLength();
path.style.strokeDasharray = String(length);
const animation = path.animate(
  disconnect
    ? [{strokeDashoffset:0}, {strokeDashoffset:length}]
    : [{strokeDashoffset:length}, {strokeDashoffset:0}],
  {duration:600, easing:'cubic-bezier(.4,0,.2,1)', fill:'forwards'}
);
// Remove only this selected edge after disconnect animation finishes.
```

```css
/* Temporary cable while dragging, independent of paused demo timeline. */
#drag-wire {
  fill:none; stroke:#1188FF; stroke-width:2; stroke-opacity:.45;
  stroke-dasharray:5 5; stroke-linecap:butt;
  animation:drag-dash .5s linear infinite;
}
@keyframes drag-dash {from {stroke-dashoffset:0} to {stroke-dashoffset:-20px}}
@media(prefers-reduced-motion:reduce) {#drag-wire {animation:none}}
```

Đo L lại sau khi endpoint đổi. Khi commit xóa dash preview và dùng dây solid3px; hủy/invalid drop giữ kết nối cũ. Snippet WAAPI minh họa quy tắc length; source thực tế dùng `line()`/`draw()` và clock để hỗ trợ seek. Disconnect graph hiện vẫn reverse600ms trong reduced motion; demo draw thì chuyển ngay.

### Toàn bộ thông số chi tiết

```json
{
  "status": "verified",
  "keyframes": {
    "draw": [
      {
        "offset": 0,
        "strokeDashoffset": "L"
      },
      {
        "offset": 1,
        "strokeDashoffset": 0
      }
    ],
    "disconnect": [
      {
        "offset": 0,
        "strokeDashoffset": 0
      },
      {
        "offset": 1,
        "strokeDashoffset": "L"
      }
    ]
  },
  "strokeWidthPx": 3,
  "endpointRule": "Use live port-center coordinates after drag, resize or zoom. path.getTotalLength() is authoritative; Magnific internally estimates 1.3 × endpoint distance.",
  "dragPreview": {
    "stroke": "#1188FF",
    "opacity": 0.45,
    "strokeWidthPx": 2,
    "dashArrayPx": [
      5,
      5
    ],
    "dashOffsetPx": [
      0,
      -20
    ],
    "durationMs": 500,
    "easing": "linear",
    "repeat": "infinite while pointer is down, even when demo timeline is paused",
    "stop": "pointerup, Escape or cancel; remove temporary path; valid committed cable is solid",
    "reducedMotion": "static dashed line",
    "provenance": "Dashed moving temporary cable follows the supplied Magnific screenshot. Exact drag dash metrics are Fiora mapping; native drag timing was not measured."
  }
}
```

**Nguồn tham chiếu:** Magnific source verified. [CSS/JS reference](https://cdn.magnific.com/ait/assets/DeletableEdgeInteractive.BjdSjLm3.v2.css)

## Ghi chú tích hợp chung

CSS/JS trong ZIP là source đầy đủ đang chạy; code snippets trong MD giải thích các phần cần dùng. Demo có clock để pause/seek và giữ CSS Animation.currentTime; production dùng backend events và animation clock thật. Các helper đang tham chiếu DOM/selectors của scene, không phải React component độc lập. Bố cục và chức năng canvas hiện có vẫn hoạt động; handoff chỉ giới hạn6 hiệu ứng được yêu cầu.

Thời gian/physics Magnific được kiểm tra read-only từ deployed assets; palette và UI theo Fiora. Dash preview và inward ring là mapping theo yêu cầu; không tuyên bố active-generation frame parity. Source không chứa credentials, private reference screenshot hay Magnific source bundles.


---

# Fiora / Target connector + inward ring & particle

Version **1.3.1** · M02 · [Tất cả6 hiệu ứng](https://fiora-node-motion.vercel.app/DEVELOPER-HANDOFF.md) · [Source ZIP](https://fiora-node-motion.vercel.app/fiora-motion-source.zip)

<a id="m02"></a>

## 2. Target connector + inward ring & particle · M02

Một vòng co nhẹ vào tâm; halo mờ và ít dot hơn.

- **Trigger:** Live cable pointer is within58 screen px of nearest compatible input
- **Duration / easing:** 1300 ms / inward ring; continuous while target is nearby · radius quadratic ease-out; opacity sin(π·phase)
- **Thông số:** One ring only. radius=portScreenRadius+14*(1-phase)^2; opacity=sin(pi*phase)*.28; stroke1px #1188FF. Halo radius+12 at .025. Native26-particle pool; at most8 visible dots, groupopacity .65. Snap within28 screenpx.
- **Exit / cleanup:** Clear overlay on target leave / release / Escape / cancel; reset particle seed on target change.
- **Reduced motion:** One static ring: radius+4, 1px #8FC7FF at .5; halo remains; no dots.
- **Trạng thái implement:** implemented in live drag; old automatic timeline spark sample is separate reference playback
- **Code:** `connector-feedback.js: render(), candidates, rings`; `app.js: particles(), worlds`; `wire-interactions.js: findTarget()`
- **Preview:** Kéo output T đến gần input T (dưới58px màn hình); giữ chuột để xem 1 vòng co vào. Thả trong28px để nối.
- **Download riêng:** [M02.md](https://fiora-node-motion.vercel.app/docs/M02.md)

### Code / cách áp dụng

```js
// SVG overlay ở viewport ngoài #world; tất cả giá trị ở screen CSS px.
const phase = ((performance.now()-entered)/1300)%1;
const ringRadius = portScreenRadius + 14*(1-phase)**2;
const ringOpacity = Math.sin(Math.PI*phase)*.28;
const haloRadius = portScreenRadius + 12;
// Tìm nearest compatible input, distance<58. Chỉ snap khi distance<28.
// Chỉ1 vòng co, không thêm nhiều vòng phase-offset.
```

Lấy hàm `particles()` trong app.js và `installConnectorFeedback()` trong connector-feedback.js để giữ đúng physics. Module dùng pool26 hạt nhưng chỉ render tối đa8 rect, opacity group.65; điểm hút/particle sizes được tính trong screen-space. API cần viewport, world, graph(), drag(), particles(), clearParticles(); cuối app.js có lời gọi đầy đủ. Overlay xóa khi rời target/thả/hủy; đổi target reset seed.

Color precedence của cổng: selected > connected > neutral; neutral#E4E4E7, connected#8FC7FF, selected#1188FF, border1.5px. M02 target hợp lệ dùng ring xanh nhạt khi owner không selected. Với reduced motion, halo tĩnh.025 + ring radius+4, stroke1 #8FC7FF alpha.5; không dot.

Live drag là bản được duyệt. Automatic Connect timeline còn sample pulse900ms/26dots; không lấy sample đó làm thông số triển khai live target.

### Toàn bộ thông số chi tiết

```json
{
  "status": "adapted",
  "particlePhysics": {
    "count": 26,
    "pull": 22000,
    "swirl": 0.35,
    "damping": 2.5,
    "absorbRadius": 3,
    "minSpawnRadius": 14,
    "maxSpawnRadius": 30,
    "fadeInSeconds": 0.12,
    "chargeSeconds": 1.5,
    "maxPullBoost": 2.5,
    "sizePx": [
      1.5,
      2.2
    ],
    "sizeLargeProbability": 0.2,
    "initialDelayMaxSeconds": 0.6,
    "charge": "1 - (1 - clamp(elapsed/1.5,0,1))^3",
    "acceleration": "f=22000*(1+1.5*charge)/max(distance,4); acceleration adds radial + .35 tangential force. velocity *= exp(-2.5*dt).",
    "opacity": "min(1,age/.12) * (.3 + .7 * (1-min(1,distance/startDistance)))",
    "zoom": "Live feedback SVG uses viewport CSS pixels; radii, dots and proximity thresholds do not scale with canvas zoom.",
    "integration": "Magnific clamps frame dt to .05 s; prototype uses deterministic 1/120 s steps.",
    "spawnRadiusFormula": "min=max(14,pointerDistance*.6), max=max(30,pointerDistance*1.1); uniform radius between min/max.",
    "respawnDelayMaxSeconds": ".15*(1-.6*charge)",
    "initialVelocity": "Tangential20px/s, random clockwise/counterclockwise direction.",
    "headingSpreadRadians": "(pointerDistance<6 ? pi : .63)*(1-.5*charge)",
    "randomSeed": 7
  },
  "configuration": {
    "proximityScreenPx": 58,
    "snapScreenPx": 28,
    "inwardRings": 1,
    "periodMs": 1300,
    "phaseOffset": 0,
    "radius": "port screen radius + 14*(1-phase)^2 → port radius",
    "opacity": "sin(pi*phase)*.28",
    "particles": "Native 26-particle pool; render at most 8 dots at .65 group opacity",
    "reducedMotion": "Static target ring, no moving rings or particles",
    "cleanup": "Clear on pointer leaving target, release, cancel or Escape",
    "halo": "port radius +12px, fill opacity .025"
  },
  "connectorStates": {
    "neutral": "border #E4E4E7, no wire attached",
    "connected": "border #8FC7FF, at least one attached edge; independent of full graph reachability",
    "selected": "border #1188FF only for connectors owned by clicked node",
    "selection": "Capture pointerdown on original or inserted nodes; click blank canvas/wire clears node selection",
    "targetFeedback": {
      "proximityScreenPx": 58,
      "snapScreenPx": 28,
      "inwardRings": 1,
      "periodMs": 1300,
      "phaseOffset": 0,
      "radius": "port screen radius + 14*(1-phase)^2 → port radius",
      "opacity": "sin(pi*phase)*.28",
      "particles": "Native 26-particle pool; render at most 8 dots at .65 group opacity",
      "reducedMotion": "Static target ring, no moving rings or particles",
      "cleanup": "Clear on pointer leaving target, release, cancel or Escape",
      "halo": "port radius +12px, fill opacity .025"
    },
    "portSizePx": 28,
    "borderWidthPx": 1.5
  },
  "notes": "Live target behavior is1300ms/one ring/max8dots. Automatic Connect playback uses a legacy900ms pulse; use live drag for this annotation."
}
```

**Nguồn tham chiếu:** Magnific particle constants · user-requested inward rings. [CSS/JS reference](https://cdn.magnific.com/ait/assets/SpacesConnectionLine.LZqBVAXs.v2.css)

## Ghi chú tích hợp chung

CSS/JS trong ZIP là source đầy đủ đang chạy; code snippets trong MD giải thích các phần cần dùng. Demo có clock để pause/seek và giữ CSS Animation.currentTime; production dùng backend events và animation clock thật. Các helper đang tham chiếu DOM/selectors của scene, không phải React component độc lập. Bố cục và chức năng canvas hiện có vẫn hoạt động; handoff chỉ giới hạn6 hiệu ứng được yêu cầu.

Thời gian/physics Magnific được kiểm tra read-only từ deployed assets; palette và UI theo Fiora. Dash preview và inward ring là mapping theo yêu cầu; không tuyên bố active-generation frame parity. Source không chứa credentials, private reference screenshot hay Magnific source bundles.



---

# Fiora / Landing impact & split sweep

Version **1.3.1** · M03 · [Tất cả6 hiệu ứng](https://fiora-node-motion.vercel.app/DEVELOPER-HANDOFF.md) · [Source ZIP](https://fiora-node-motion.vercel.app/fiora-motion-source.zip)

<a id="m03"></a>

## 3. Landing impact & split sweep · M03

Cổng sáng lên, node giật nhẹ, hai vệt chạy quanh viền.

- **Trigger:** Connection commits successfully
- **Duration / easing:** 650 ms impact · 320 ms recoil · cubic-bezier(.22,1,.36,1)
- **Thông số:** Ring r10: scale .6 → 2.6, opacity 1 → 0. Core r6: 1.4 → .6, .9 → 0. Flash20px/.35 +2.5px core; recoil−8px/320ms. Split sweep650ms, normalized dash .22/2, offset .22→−.78, cubic(.33,0,.2,1), fade after75%.
- **Exit / cleanup:** Remove impact after650ms; recoil returns to0 after320ms.
- **Reduced motion:** No impact ring/core/flash, sweep or recoil.
- **Trạng thái implement:** implemented for original generator demo and original-output commit; inserted-node links are routing previews without per-node impact.
- **Code:** `app.js: impact(), renderImpact()`; `style.css: @keyframes impact-ring/impact-core/impact-flash, .receiver-sweep`
- **Preview:** [Mở frame t=0.78s](https://fiora-node-motion.vercel.app/?lab=1&t=0.78) rồi Play/seek.
- **Download riêng:** [M03.md](https://fiora-node-motion.vercel.app/docs/M03.md)

### Code / cách áp dụng

```css
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

### Toàn bộ thông số chi tiết

```json
{
  "status": "verified",
  "recoil": {
    "durationMs": 320,
    "pushPx": -8,
    "segments": [
      [
        0,
        0
      ],
      [
        0.25,
        1
      ],
      [
        0.55,
        -0.3
      ],
      [
        0.8,
        0.1
      ],
      [
        1,
        0
      ]
    ],
    "segmentEasing": "ease-out",
    "composite": "add; preserve any node drag transform"
  },
  "flash": {
    "outerWidthPx": 20,
    "outerOpacity": 0.35,
    "coreWidthPx": 2.5,
    "scaleY": [
      0.05,
      1
    ],
    "opacityStops": [
      [
        0,
        0
      ],
      [
        0.25,
        1
      ],
      [
        1,
        0
      ]
    ],
    "transformOrigin": "port Y / card height"
  },
  "sweep": {
    "pathLength": 1,
    "dasharray": [
      0.22,
      2
    ],
    "dashoffset": [
      0.22,
      -0.78
    ],
    "easing": "cubic-bezier(.33,0,.2,1)",
    "opacityHoldUntil": 0.75,
    "glowStrokePx": 8,
    "glowOpacity": 0.3,
    "coreStrokePx": 2,
    "outlineStrokePx": 1.5,
    "outlineOpacityPeak": 0.45,
    "outlinePeakAt": 0.35,
    "paths": "Two rounded paths from the input Y around top/bottom to the opposite edge; radius16."
  }
}
```

**Nguồn tham chiếu:** Magnific source verified. [CSS/JS reference](https://cdn.magnific.com/ait/assets/SpacesConnectionImpactLayer.CTH0S9Th.v2.css)

## Ghi chú tích hợp chung

CSS/JS trong ZIP là source đầy đủ đang chạy; code snippets trong MD giải thích các phần cần dùng. Demo có clock để pause/seek và giữ CSS Animation.currentTime; production dùng backend events và animation clock thật. Các helper đang tham chiếu DOM/selectors của scene, không phải React component độc lập. Bố cục và chức năng canvas hiện có vẫn hoạt động; handoff chỉ giới hạn6 hiệu ứng được yêu cầu.

Thời gian/physics Magnific được kiểm tra read-only từ deployed assets; palette và UI theo Fiora. Dash preview và inward ring là mapping theo yêu cầu; không tuyên bố active-generation frame parity. Source không chứa credentials, private reference screenshot hay Magnific source bundles.


---

# Fiora / Finishing border

Version **1.3.1** · M07 · [Tất cả6 hiệu ứng](https://fiora-node-motion.vercel.app/DEVELOPER-HANDOFF.md) · [Source ZIP](https://fiora-node-motion.vercel.app/fiora-motion-source.zip)

<a id="m07"></a>

## 4. Finishing border · M07

Dải beam nở thành toàn bộ viền trước khi lộ ảnh.

- **Trigger:** isProcessing=true && isRealProcessing=false && isPending=false
- **Duration / easing:** 800 ms + continuing 4000 ms rotation · ease-out + linear
- **Thông số:** --segment-size .278 → 1. Keep color1 .056/.278 & color2 .167/.278 relative stop ratios. Colors #1188FF / #8FC7FF. Expand800ms ease-out while rotation continues4000ms linear from225deg. Border4px; outer radius20/inner16; glowblur20/.6. Interior remains white.
- **Exit / cleanup:** Demo reveals at9.2s. Production waits for real completion and decoded image; continue rotation phase instead of restarting.
- **Reduced motion:** Static outline; no segment expansion or spinning glow.
- **Trạng thái implement:** implemented
- **Code:** `style.css: .receiver.finishing, @property --segment-size, @keyframes fill-border`; `app.js: render() animation origins`
- **Preview:** [Mở frame t=8.8s](https://fiora-node-motion.vercel.app/?lab=1&t=8.8) rồi Play/seek.
- **Download riêng:** [M07.md](https://fiora-node-motion.vercel.app/docs/M07.md)

### Code / cách áp dụng

```css
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

### Toàn bộ thông số chi tiết

```json
{
  "status": "verified",
  "segmentSize": [
    0.278,
    1
  ],
  "gradient": "transparent0turn, color1(.056*segment/.278)turn, color2(.167*segment/.278)turn, transparent(segment)turn",
  "configuration": {
    "colors": {
      "color1": "#1188FF",
      "color2": "#8FC7FF",
      "provenance": "User-selected Fiora palette, 2026-10-23. Magnific timing and gradient geometry are preserved; source default palette was #ff00aa / #00fff1."
    },
    "borderSizePx": 4,
    "outerRadiusPx": 20,
    "contentRadiusPx": 16,
    "gradientStops": [
      [
        0,
        "transparent"
      ],
      [
        20,
        "#1188FF"
      ],
      [
        60,
        "#8FC7FF"
      ],
      [
        100,
        "transparent"
      ],
      [
        360,
        "transparent"
      ]
    ],
    "angleFormula": "225 + 360*((runningElapsedMs % 4000)/4000)",
    "spinPlaneSize": "hypot(cardWidth + 2*border, cardHeight + 2*border)",
    "glow": {
      "blurPx": 20,
      "opacity": 0.6,
      "phase": "same angle as border"
    }
  }
}
```

**Nguồn tham chiếu:** Magnific source verified. [CSS/JS reference](https://cdn.magnific.com/ait/assets/app-shared.C_DTTWiu.v2.css)

## Ghi chú tích hợp chung

CSS/JS trong ZIP là source đầy đủ đang chạy; code snippets trong MD giải thích các phần cần dùng. Demo có clock để pause/seek và giữ CSS Animation.currentTime; production dùng backend events và animation clock thật. Các helper đang tham chiếu DOM/selectors của scene, không phải React component độc lập. Bố cục và chức năng canvas hiện có vẫn hoạt động; handoff chỉ giới hạn6 hiệu ứng được yêu cầu.

Thời gian/physics Magnific được kiểm tra read-only từ deployed assets; palette và UI theo Fiora. Dash preview và inward ring là mapping theo yêu cầu; không tuyên bố active-generation frame parity. Source không chứa credentials, private reference screenshot hay Magnific source bundles.


---

# Fiora / Image ready / reveal

Version **1.3.1** · M08 · [Tất cả6 hiệu ứng](https://fiora-node-motion.vercel.app/DEVELOPER-HANDOFF.md) · [Source ZIP](https://fiora-node-motion.vercel.app/fiora-motion-source.zip)

<a id="m08"></a>

## 5. Image ready / reveal · M08

Ảnh vào từ blur nhẹ đến rõ; không scale ảnh.

- **Trigger:** Image resource decoded and ready
- **Duration / easing:** 500 ms · cubic-bezier(.4,0,.2,1)
- **Thông số:** opacity .8 → 1; blur15px → 0; brightness1.08 → 1; saturation .75 → 1.
- **Exit / cleanup:** After500ms: opacity1, filter:none. Cancel exits to input state.
- **Reduced motion:** Show decoded image immediately, no blur/fade.
- **Trạng thái implement:** implemented; bundled source image reused as demo result
- **Code:** `style.css: @keyframes media-reveal, .receiver.reveal .result-content img`; `app.js: startup image.decode(), phase()`
- **Preview:** [Mở frame t=9.42s](https://fiora-node-motion.vercel.app/?lab=1&t=9.42) rồi Play/seek.
- **Download riêng:** [M08.md](https://fiora-node-motion.vercel.app/docs/M08.md)

### Code / cách áp dụng

```js
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

### Toàn bộ thông số chi tiết

```json
{
  "status": "verified",
  "keyframes": [
    {
      "opacity": 0.8,
      "filter": "blur(15px) brightness(1.08) saturate(.75)"
    },
    {
      "opacity": 1,
      "filter": "none"
    }
  ],
  "readyGate": "await image.decode(); never reveal incomplete images. Demo output reuses the source photo; no AI generation is run.",
  "configuration": {
    "durationMs": 500,
    "delayMs": 0,
    "iterations": 1,
    "easing": "cubic-bezier(.4,0,.2,1)",
    "transform": "none; no scale",
    "containerRadiusPx": 16,
    "objectFit": "cover",
    "decodeGate": true
  }
}
```

**Nguồn tham chiếu:** Magnific source verified. [CSS/JS reference](https://cdn.magnific.com/ait/assets/app-shared.C_DTTWiu.v2.css)

## Ghi chú tích hợp chung

CSS/JS trong ZIP là source đầy đủ đang chạy; code snippets trong MD giải thích các phần cần dùng. Demo có clock để pause/seek và giữ CSS Animation.currentTime; production dùng backend events và animation clock thật. Các helper đang tham chiếu DOM/selectors của scene, không phải React component độc lập. Bố cục và chức năng canvas hiện có vẫn hoạt động; handoff chỉ giới hạn6 hiệu ứng được yêu cầu.

Thời gian/physics Magnific được kiểm tra read-only từ deployed assets; palette và UI theo Fiora. Dash preview và inward ring là mapping theo yêu cầu; không tuyên bố active-generation frame parity. Source không chứa credentials, private reference screenshot hay Magnific source bundles.


---

# Fiora / Wire interaction — Disconnect / Insert

Version **1.3.1** · M12 · [Tất cả6 hiệu ứng](https://fiora-node-motion.vercel.app/DEVELOPER-HANDOFF.md) · [Source ZIP](https://fiora-node-motion.vercel.app/fiora-motion-source.zip)

<a id="m12"></a>

## 6. Wire interaction — Disconnect / Insert · M12

Chọn dây để Delete; hover hoặc chuột phải mở menu thao tác.

- **Trigger:** Wire hover, right-click, select + Delete
- **Duration / easing:** Hover200ms; leave160ms / menu leave180ms; disconnect600ms · Disconnect cubic-bezier(.4,0,.2,1)
- **Thông số:** Hover/right-click opens Disconnect / Insert node. Click selects only. Disconnect removes chosen segment, keeps nodes/branches. Insert replaces chosen edge by source→new→target, supports repeated insertion, searchable10 types. Picker is screen-space, canvas unchanged by scroll inside picker.
- **Exit / cleanup:** Escape/outside click dismisses without graph change. Valid pick inserts then Fit. Empty search shows No nodes found.
- **Reduced motion:** No menu entry animation; disconnect retains600ms reverse draw.
- **Trạng thái implement:** implemented graph/placement preview; inserted node operations have no AI backend
- **Code:** `wire-interactions.js: showMenu(), close(), disconnect(), renderList(), insert(), reachable(), route()`
- **Preview:** Hover dây200ms hoặc chuột phải → Insert node → tìm Crop → chọn. Chỉ đoạn được chọn tách thành2 dây. Escape để hủy.
- **Download riêng:** [M12.md](https://fiora-node-motion.vercel.app/docs/M12.md)

### Code / cách áp dụng

```js
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

State flow: idle → hover200ms / right-click → action menu. Click dây chỉ select; Delete/Backspace (ngoài editable fields) hoặc Disconnect mới xóa đoạn được chọn. Insert mở search; chọn item tạo node rồi thay đúng1 edge bằng2 edges cùng kind; branches khác giữ nguyên. Escape/outside hủy menu/picker, không mutate. Leave wire160ms, leave menu180ms; enter panel hủy close timer. Menu/picker nằm ngoài world transform nên giữ đúng kích thước khi zoom.

Menu không có animation entrance/fade/scale. Border1#E4E4E7, width240/padding12/radius18;2 rows56, padding12/gap16/radius10; icon22#62636E; Inter16/24 weight400#202025; hover#F5F5F6; shadow `0 12px 32px #18181b14,0 2px 6px #18181b06`. Không dùng dấu cộng hồng. Full picker types, dimensions, anchor/clamp và insertion offsets trong JSON bên dưới.

Disconnect reverse600ms, chỉ xóa selected segment; node giữ lại. Nếu text hoặc image path không tới generator thì Run disabled. Inserted nodes là graph/placement preview, chưa có AI backend. Test repeated insertion, disconnected branch, empty search, click outside, Escape và giữ nhánh không chọn.

### Toàn bộ thông số chi tiết

```json
{
  "status": "adapted",
  "configuration": {
    "figma": "https://www.figma.com/design/WAU03VCjRzoii657s3A0b5/Fiora?node-id=5546-77188",
    "selection": "Click selects wire; does not disconnect. Delete/Backspace removes selected connection; ignored in text fields.",
    "menu": "Hover 200ms or right-click opens Disconnect / Insert node. Escape / click outside dismisses.",
    "disconnect": "Only selected segment removed; 600ms reverse draw. Nodes retained; missing generator inputs disable Run.",
    "insert": "Searchable node picker with all 10 types from Figma. Choose creates draggable node and replaces selected edge with source → new node → target. Other branches retained.",
    "pickerTypes": [
      "Text",
      "Image generator",
      "Ideas assistant",
      "Element detector",
      "Image compositor",
      "Variations",
      "Crop",
      "Upscale",
      "Remove background",
      "Change camera angle"
    ],
    "graph": "Supports repeated insertion, branch-specific removal, reachability checks, moving inserted nodes and reconnecting their output ports.",
    "assets": "Disconnect/search and picker icons exported from original Figma main components.",
    "limits": "Inserted nodes simulate routing and placement in the prototype; no AI backend execution.",
    "menuAppearance": {
      "widthPx": 240,
      "paddingPx": 12,
      "radiusPx": 18,
      "rowHeightPx": 56,
      "iconSizePx": 22,
      "iconColor": "#62636E",
      "fontPx": 16,
      "iconTextGapPx": 16,
      "shadow": "0 12px 32px #18181b14, 0 2px 6px #18181b06",
      "icons": "Existing Fiora vector paths, duplicate disconnect path removed; menu-specific neutral plus",
      "borderPx": 1,
      "borderColor": "#E4E4E7",
      "rowPaddingPx": 12,
      "rowRadiusPx": 10,
      "fontWeight": 400,
      "lineHeightPx": 24,
      "textColor": "#202025",
      "background": "#FFFFFF",
      "hoverBackground": "#F5F5F6"
    },
    "timing": {
      "hoverOpenMs": 200,
      "wireLeaveMs": 160,
      "menuLeaveMs": 180,
      "disconnectMs": 600,
      "disconnectEasing": "cubic-bezier(.4,0,.2,1)",
      "menuEntrance": "none; display immediately after delay",
      "selectionStrokeTransitionMs": 600
    },
    "wireHitAreaScenePx": 20,
    "selectedWire": {
      "stroke": "#1188FF",
      "widthPx": 3.5,
      "shadow": "0 0 3px #1188ff55"
    },
    "menuPosition": "Anchor pointer viewport-relative; x=pointerX-24, y=pointerY-10; clamp min8/max(viewport-panel-8). Menu height138, maxHeight=viewportHeight-24.",
    "pickerAppearance": {
      "widthPx": 260,
      "maxHeightPx": 368,
      "radiusPx": 14,
      "paddingPx": 4,
      "searchHeightPx": 40,
      "searchRadiusPx": 10,
      "searchFontPx": 12,
      "rowFontPx": 14,
      "rowPaddingPx": 8,
      "rowRadiusPx": 10,
      "rowGapPx": 12,
      "iconWrapperPx": 28,
      "iconPx": 20,
      "scroll": "internal list",
      "search": "trimmed case-insensitive substring",
      "emptyState": "No nodes found"
    },
    "insertPlacement": "New node x=sceneAnchorX+70,y=sceneAnchorY-120; body380x380. Replace chosen edge by2 edges of same kind. Resolve overlapping downstream node, then Fit."
  }
}
```

**Nguồn tham chiếu:** Supplied Fiora Figma interaction flow.

## Ghi chú tích hợp chung

CSS/JS trong ZIP là source đầy đủ đang chạy; code snippets trong MD giải thích các phần cần dùng. Demo có clock để pause/seek và giữ CSS Animation.currentTime; production dùng backend events và animation clock thật. Các helper đang tham chiếu DOM/selectors của scene, không phải React component độc lập. Bố cục và chức năng canvas hiện có vẫn hoạt động; handoff chỉ giới hạn6 hiệu ứng được yêu cầu.

Thời gian/physics Magnific được kiểm tra read-only từ deployed assets; palette và UI theo Fiora. Dash preview và inward ring là mapping theo yêu cầu; không tuyên bố active-generation frame parity. Source không chứa credentials, private reference screenshot hay Magnific source bundles.


---

# Fiora / Connection success · dashed to solid

Version **1.4.4** · Yêu cầu riêng · M16 · [Source ZIP](https://fiora-node-motion.vercel.app/fiora-motion-source.zip)

<a id="m16"></a>

## 7. Connection success · dashed to solid · M16

Connection success · dashed to solid

- **Trigger:** Valid release on a compatible available input
- **Duration / easing:** 320ms fill ·160ms endpoint morph · cubic-bezier(.4,0,.2,1)
- **Thông số:** Fade dashed preview opacity .45→0 while solid3px draws source→target over320ms. Endpoint moves release point→input over160ms. Hide committed graph edge until overlay completes.
- **Exit / cleanup:** Overlay removed after320ms, committed edge becomes visible.
- **Reduced motion:** Immediate commit, no moving fill.
- **Trạng thái implement:** Implemented in current prototype
- **Code:** `wire-motion.js: installWireMotion(), settle(), render()`; `wire-interactions.js: finishCable(), draw()`
- **Preview:** Kéo output vào thân node để thử; thả ra nền để xem thu dây.
- **Download riêng:** [M16.md](https://fiora-node-motion.vercel.app/docs/M16.md)

### Code / cách áp dụng

Lấy settle()/render() trong wire-motion.js. Gọi mỗi RAF; chỉ reveal graph edge khi onComplete. Endpoint morph160ms, fill320ms và dash fade cùng phase.
### Toàn bộ thông số chi tiết

```json
{
  "status": "adapted",
  "configuration": {
    "commitMs": 320,
    "endpointMorphMs": 160,
    "invalidRetractMs": 260,
    "disconnectMs": 600,
    "easing": "cubic-bezier(.4,0,.2,1)",
    "dashFadeOpacity": [
      0.45,
      0
    ],
    "solidWidthPx": 3,
    "previewWidthPx": 2,
    "route": "M ax ay C ax+h ay bx-h by bx by; h=clamp(.45*hypot(dx,dy),64,240)",
    "reducedMotion": "instant settlement",
    "cleanup": "remove transient overlay and reveal committed graph edge at completion"
  }
}
```

**Nguồn tham chiếu:** Separate Fiora wire interaction requirements.


---

# Fiora / Soft curved wire routing

Version **1.4.4** · Yêu cầu riêng · M17 · [Source ZIP](https://fiora-node-motion.vercel.app/fiora-motion-source.zip)

<a id="m17"></a>

## 8. Soft curved wire routing · M17

Soft curved wire routing

- **Trigger:** Drawing, moving or inserting a connected node, or dragging a cable
- **Duration / easing:** Direct geometry update; no delay · cubic-bezier(.4,0,.2,1)
- **Thông số:** All routes use cubic Bézier: M ax ay C ax+h ay bx-h by bx by. h=clamp(.45*hypot(dx,dy),64,240) scene px. Horizontal endpoint tangents; round linecaps/joins. No orthogonal elbows.
- **Exit / cleanup:** Recompute from live endpoint centers on node move.
- **Reduced motion:** Same geometry, no additional animation.
- **Trạng thái implement:** Implemented in current prototype
- **Code:** `wire-motion.js: wirePath()`; `app.js: paths, updateNodeGeometry()`; `wire-interactions.js: route()`
- **Preview:** Di chuyển node hoặc Insert node để xem đường dây cong mềm.
- **Download riêng:** [M17.md](https://fiora-node-motion.vercel.app/docs/M17.md)

### Code / cách áp dụng

```js
const h=Math.max(64,Math.min(240,Math.hypot(b.x-a.x,b.y-a.y)*.45));
const d=`M ${a.x} ${a.y} C ${a.x+h} ${a.y} ${b.x-h} ${b.y} ${b.x} ${b.y}`;
```
Dùng chung wirePath() cho dây gốc, node chèn và preview.
### Toàn bộ thông số chi tiết

```json
{
  "status": "adapted",
  "configuration": {
    "handleMinPx": 64,
    "handleMaxPx": 240,
    "distanceFactor": 0.45,
    "linecap": "round",
    "linejoin": "round"
  }
}
```

**Nguồn tham chiếu:** Separate Fiora wire interaction requirements.


---

# Fiora / Node-body drop · auto detect & retract

Version **1.4.4** · Yêu cầu riêng · M18 · [Source ZIP](https://fiora-node-motion.vercel.app/fiora-motion-source.zip)

<a id="m18"></a>

## 9. Node-body drop · auto detect & retract · M18

Node-body drop · auto detect & retract

- **Trigger:** Release anywhere inside a target node body, or within28 screen px of its input
- **Duration / easing:** 260ms invalid retract · cubic-bezier(.4,0,.2,1)
- **Thông số:** Whole380x380 body is a target. Choose same-kind free input, ignore existing edge from current source in occupancy check. Reject occupied input, self-link and directed cycles. Body hover activates target feedback. Invalid/cancel drop retracts source→pointer path by dashoffset0→L over260ms; retain prior graph.
- **Exit / cleanup:** Valid drop uses M16. Invalid/cancel clears preview after260ms; no graph mutation.
- **Reduced motion:** Invalid cable disappears immediately.
- **Trạng thái implement:** Implemented in current prototype
- **Code:** `wire-interactions.js: resolveTarget(), findTarget(), beginCable(), finishCable()`; `connector-feedback.js: resolveTarget() feedback integration`; `wire-motion.js: invalid settlement`
- **Preview:** Kéo output vào thân node để thử; thả ra nền để xem thu dây.
- **Download riêng:** [M18.md](https://fiora-node-motion.vercel.app/docs/M18.md)

### Code / cách áp dụng

resolveTarget() kiểm tra body hit hoặc gần cổng, filter kind/occupancy/cycle trước khi commit. finishCable() dùng valid=false để chạy retract260ms, giữ nguyên graph.
### Toàn bộ thông số chi tiết

```json
{
  "status": "adapted",
  "configuration": {
    "bodySizePx": [
      380,
      380
    ],
    "portSnapScreenPx": 28,
    "feedbackProximityScreenPx": 58,
    "invalidRetractMs": 260,
    "availability": "same kind, no incoming edge from other source, no self/cycle",
    "preservePriorConnections": true
  }
}
```

**Nguồn tham chiếu:** Separate Fiora wire interaction requirements.


---

# Fiora / Node target · blue border & elevation

Version **1.4.4** · Yêu cầu riêng · M19 · [Source ZIP](https://fiora-node-motion.vercel.app/fiora-motion-source.zip)

<a id="m19"></a>

## 10. Node target · blue border & elevation · M19

Kéo dây vào node hợp lệ: viền xanh branding, shadow nâng khối rõ khỏi canvas.

- **Trigger:** Live cable resolves a compatible available input by node body hit or connector proximity58 screen px
- **Duration / easing:** Border0ms · shadow180ms; delay0ms, no repeat · Shadow ease-out (cubic-bezier(0,0,.58,1)); border immediate
- **Thông số:** Border/outline2px #1188FF immediately; shadow 0 0 0 1px #1188FF14,0 16px 48px #182B491A,0 4px 12px #182B4912. Shadow ramps0→1 over180ms; no transform or scale.
- **Exit / cleanup:** Leave/drop/Escape/pointercancel/blur clears target on next frame; underlying default/hover/selected/locked border restores immediately and shadow fades180ms.
- **Reduced motion:** Static blue border + full elevation immediately; no transitions. M02 ring/particle reduction remains separate.
- **Trạng thái implement:** Implemented for generator and all inserted compatible nodes. Invalid/occupied/wrong-kind/self/cycle/locked targets excluded. Separate from M02 connector feedback.
- **Code:** `connector-feedback.js: render(), syncSelection()`; `wire-interactions.js: resolveTarget()`; `style.css: --node-target-shadow, .is-drop-target, selected specificity`
- **Preview:** Kéo output T/ảnh vào thân generator hoặc node Insert tương thích; giữ để xem viền xanh + shadow. Kéo ra/nhấn Escape để trả trạng thái. Click node: xanh ngay ở pointerdown, kể cả đang hover.
- **Download riêng:** [M19.md](https://fiora-node-motion.vercel.app/docs/M19.md)

### Code / cách áp dụng

```css
:root { --node-target-shadow:0 0 0 1px #1188FF14,0 16px 48px #182B491A,0 4px 12px #182B4912; }
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

### Toàn bộ thông số chi tiết

```json
{
  "status": "adapted",
  "configuration": {
    "trigger": "Compatible available input resolved by node-body hit or proximity58 screen px; actual release28px",
    "border": "2px solid #1188FF; immediate (0ms)",
    "shadow": "0 0 0 1px #1188FF14,0 16px 48px #182B491A,0 4px 12px #182B4912",
    "entry": "border0ms, shadow180ms ease-out",
    "exit": "Remove target class on leave/drop/cancel/blur; border restores immediately; shadow fades180ms",
    "reducedMotion": "Static highlight/shadow, no transitions, existing ring/dots reduced-motion behavior unchanged",
    "units": "Scene CSS px at100% canvas zoom; no geometry transform"
  },
  "clickOn": {
    "border": "2px solid #1188FF",
    "entry": "pointerdown capture synchronously sets state; border0ms and no color transition; selection wins over hover"
  }
}
```

**Nguồn tham chiếu:** User-requested node elevation reference and Fiora Figma5605:73974; elevation values are Fiora implementation mapping, not measured Magnific constants.

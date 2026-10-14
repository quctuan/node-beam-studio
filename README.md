# Node Beam Studio

Tool chỉnh gradient border và ánh sáng hắt vào trong node đang generate. Dùng UI, canvas, history, timeline và settings transfer từ [Toolcraft](https://github.com/pixel-point/toolcraft); renderer hiệu ứng riêng, dựa trên hướng thị giác [Libraries Border Beam](https://libraries.dev/beam).

Bản online: [Node Beam Studio](https://nodeanimation.vercel.app/). Deployment đã được lưu trong tài khoản Vercel của anh ngày 09/10/2026. Các link prompt-squall cũ chuyển hướng thẳng tới địa chỉ mới này.

## Chạy local

```sh
npm install
npm run dev
```

Terminal sẽ hiện URL của port còn trống. Preview hiện tại: http://127.0.0.1:3002/.

## Chỉnh hiệu ứng

- **Node Appearance → Mode:** đổi màu surface Light/Dark. Nút mặt trời ở toolbar đổi theme của editor.
- **Settings:** Background bật/tắt nền màu của preview; Workspace chọn Blanc/Dots cho vùng làm việc. Infinity bỏ giới hạn artboard. Canvas ratio/width/height là kích thước artboard, riêng với kích thước node.
- **Node Frame:** Rounded, Rectangle hoặc Circle; tỉ lệ 1:1, 16:9, 3:4; width và corner radius. Circle giữ width/diameter và ẩn tỉ lệ/radius.
- **Motion:** Orbit dùng cửa sổ conic quay quanh tâm như demo đã duyệt; **Trail** xuất phát chung tại giữa cạnh trái: một vệt đi theo nhánh trên, một vệt theo nhánh dưới; cả hai hội tụ và dừng ở giữa cạnh phải, mờ dần rồi biến mất trước khi lặp lại. Đầu/đuôi và glow dùng chung phase/opacity; hai nhánh đi theo chiều dài thực của viền. Breathe đổi nhịp sáng toàn viền, Static giữ frame cố định. Speed 1 ở duration mặc định 47.04s = 1.96s/chu kỳ; các bước 0.25 đóng vòng chính xác. Rhythm chọn Linear/Ease; Trail dùng cùng phase cho viền và glow vào trong. Palette/Custom gradient, Spread, Softness, Border width và Effect style vẫn dùng được. Trail lưu qua Saved Presets và Settings JSON; Developer Handoff xuất khoảng cách, độ dài vệt, px/s và chính renderer đang preview. Đổi duration retime số vòng hoàn chỉnh, nên muốn giữ tốc độ gốc hãy dùng duration mặc định.
- **Beam Spectrum:** Fiora, Spectrum, Cyan hoặc Custom. Custom mở gradient editor để chỉnh loại gradient, angle, màu, vị trí và opacity từng stop.
- **Light & Border:** Soft/Neon/Crisp; Border width; Inward spread (độ sâu ánh sáng); Glow strength (độ sáng); Softness (độ mềm chuyển màu).
- **Timeline:** Play/Pause; bật Timeline trong Settings để scrub hoặc đổi duration. Tôn trọng thiết lập giảm chuyển động của hệ thống.

Kéo slider sẽ cập nhật preview ngay; bấm giá trị cạnh slider để nhập chính xác. Undo/Redo và reset từng section có sẵn.

## Lưu và bàn giao

Workspace tự lưu ở trình duyệt. **Import Settings / Export Settings** cố định ở đáy panel, luôn hiện khi cuộn các thông số. **Export Settings** tải file **node-beam-preset.json**. File JSON giữ màu và gradient tùy chỉnh, shape/tỉ lệ/kích thước node, chuyển động/tốc độ/nhịp, độ dày border, spread/strength/softness, Background, kích thước canvas và thời điểm/duration của timeline. **Import Settings** nạp preset vào editor, kể cả trên trình duyệt hoặc bản Vercel khác. Import giữ frame đã lưu ở trạng thái Pause; bấm Play để tiếp tục xem chuyển động. Preset cũ có các tùy chọn xuất ảnh vẫn nạp được.

**Save State as Default** ghi cấu hình mặc định cho dự án local, nên dùng khi đã chốt thông số. Bản deploy chỉ có import/export JSON và tự lưu workspace trong trình duyệt.

**Developer Handoff** hiển thị rotation period, hue period, chiều quay, rhythm, độ dày border và reach thực của glow. Đồ thị biểu diễn thời gian → góc của một vòng; `All parameters & formulas` mở thông số đầy đủ. `Copy HTML` tạo preview chạy độc lập: dán nội dung vào `node-beam.html`, mở bằng trình duyệt; thêm `?t=1.2` để dừng đúng frame. `Copy spec` sao chép JSON dành cho dev. Cả hai dùng chính painter của editor, không cần dev đoán CSS.

**JSON export mới** vẫn tương thích Import Settings v3, bổ sung `values["beam.developerHandoff"]` gồm settings đã resolve, hình học thực, timing/equations, các mẫu chuyển động `motion.keyframes`, falloff/gain của glow và `implementation.javascript`. Các keyframe là mẫu tham chiếu của animation tính bằng công thức; renderer được cung cấp mới là nguồn chính xác. Dev có thể lưu `implementation.javascript` thành `node-beam-runtime.js`, lưu `implementation.exampleHtml` thành `index.html` cùng thư mục, rồi mở preview. Thời điểm đã chốt nằm ở `timeline.currentTimeSeconds` của file preset; gọi `NodeBeam.renderFrame` theo hướng dẫn trong `integration.selectedFrame` để khôi phục. Import preset cũ không có handoff vẫn được; tool tính lại handoff từ controls, không chạy code được import.

Nếu thay painter/motion/adapter, chạy `node scripts/build-beam-handoff-runtime.mjs` để cập nhật mã bàn giao. Unit test so sánh lại bundle từ source và browser test kiểm tra pixel với worker preview. Border/inner glow không được thay bằng hai animation độc lập; Softness là tham số radial-kernel, không tương đương một CSS `blur()`.

Để tích hợp hiệu ứng trong app: `beam-types.ts` nhận map `values` của settings JSON; `beam-paint.ts` cung cấp painter Canvas2D và tính phase/bounds độc lập với editor. Studio sử dụng painter này cho preview. React binding/worker nằm trong `beam-renderer.tsx` và `beam-worker.ts`. Đồng bộ loading state của app với vòng đời hiệu ứng; dừng khi generate hoàn tất hoặc bị hủy.

`beam-reference.ts` khôi phục cửa sổ sáng và 9 vùng màu cố định từ `node-border-beam/synchronized-beam.ts`. Palette **Spectrum** giữ các màu gốc; Fiora/Cyan thay màu ở cùng vị trí. Viền và glow dùng chung góc, cửa sổ và hue. Chu kỳ hue gốc 12s được fit thành 11.76s để nối kín transport 47.04s; chuyển động góc 1.96s vẫn giữ nguyên. Phần glow được dựng bằng Canvas2D nên không tuyên bố giống từng pixel với CSS của demo cũ.

## Kiểm tra

`npm run build` build production. Unit tests kiểm tra hợp đồng điều khiển, đường đi, vòng lặp và màu/opacity. Browser tests thao tác UI thật, kiểm tra lưu/nạp JSON, footer cố định, Infinity và chất lượng backing. Kết quả cụ thể và các giới hạn còn lại được ghi trong `docs/toolcraft/agent-worklog.md`.

Giữ LICENSE.md và NOTICE.md của starter MIT khi phân phối source.

## Saved presets and shared default

All visitors can use **Saved Presets**, with no account, administrator key or sign-in. Choose a set to open its effect parameters and playback. Enter **Preset name** and use **Save preset** to keep a named snapshot. **Rename** changes the selected name; **Delete** removes it from the active list without discarding its settings. Open **Deleted** to restore a removed set.

**Set as default** saves the current settings into the selected set (or creates a set if none is selected), then makes it the starting preset for anyone opening or reloading the link. The default has a visible **Default** label. Already-open editing sessions keep their current work. Deleting the default clears the startup selection; choose another set as default when needed.

The library is shared server data on a private Vercel Blob path via `/api/shared-default`. Visitors do not need storage credentials. The server's Blob service credential remains private; administrator/session authentication has been removed. The previous version-1 default is retained as **Original default** during migration into the version-2 library. Conditional writes retry concurrent mutations without dropping other visitors' presets. Duplicate names and invalid settings are rejected, failed saves preserve the previous library, and removal is recoverable.

The native settings codec validates/applies snapshots. Library selection and name drafts are excluded from saved effects; Developer Handoff is recomputed from the selected effect. JSON Import/Export remains available in the fixed footer. Slow startup loading does not overwrite edits made while the request was pending; Refresh list fetches changes from other visitors.

Server deployment requires a linked Blob store (`BLOB_READ_WRITE_TOKEN`, or Vercel OIDC plus `BLOB_STORE_ID`) only. `node scripts/build-beam-server.mjs <staging-directory>` builds the server function. Deploy both `.vercel/output/static` and `.vercel/output/functions` through `scripts/deploy-beam-with-server.mjs`; the older static-only deployment helper cannot host saved presets. Local `.env*` files must never enter static output or version snapshots.

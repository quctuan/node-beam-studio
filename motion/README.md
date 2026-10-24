# Fiora node motion · handoff

Version **1.4.0** · [Preview +6 annotations](https://fiora-node-motion.vercel.app/?lab=1)

## Phạm vi annotation

1. Connection draw + Disconnect (M01)
2. Target connector + inward ring & particle (M02)
3. Landing impact & split sweep (M03)
4. Finishing border (M07)
5. Image ready / reveal (M08)
6. Wire interaction — Disconnect / Insert (M12)

[Developer handoff MD](DEVELOPER-HANDOFF.md) · từng hiệu ứng có file riêng trong `docs/` · [Figma](https://www.figma.com/design/WAU03VCjRzoii657s3A0b5/Fiora?node-id=5518-29088). Giữ ID gốc để code mapping không bị lệch.

## Run / build

Không cần npm install. Run: `python3 -m http.server 5188 --bind 127.0.0.1`, mở http://127.0.0.1:5188/?lab=1. Build cần Node.js + Python3: `node build.mjs`. Deploy `dist/`.

Build tự sinh MD từ motion-spec.json; đóng source ZIP và SHA256 manifest bằng allowlist. Source không gồm credentials/private reference assets. Demo không gọi AI/backend; ảnh output tái sử dụng source photo.

## Wire update1.4.0

Manual commit320ms, endpoint morph160ms, invalid/cancel retract260ms, shared soft cubic routing. Drop on entire compatible node body; occupied input, self-link and cycle rejection. Updated M01/M02/M12 and individual Markdown downloads.

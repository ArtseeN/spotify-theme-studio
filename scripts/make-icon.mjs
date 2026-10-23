// build/icon.png dosyasını (256x256) bağımlılık kullanmadan üretir.
import fs from 'node:fs'
import zlib from 'node:zlib'
import path from 'node:path'

const S = 256
const px = Buffer.alloc(S * S * 4)

const lerp = (a, b, t) => a + (b - a) * t
const A = [167, 139, 250]
const B = [244, 114, 182]
const INK = [13, 14, 18]

// Yuvarlatılmış kare için işaretli uzaklık
function roundRect(x, y, r) {
  const h = S / 2
  const qx = Math.abs(x - h) - (h - r)
  const qy = Math.abs(y - h) - (h - r)
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r
}

// Logo'daki üç dalga çizgisi: (x0,y0) → (x1,y1) arası hafif kavisli çizgiler
const strokes = [
  [72, 100, 184, 111, -10],
  [80, 136, 168, 145, -7],
  [88, 170, 155, 176, -5],
]
function strokeDist(x, y) {
  let best = Infinity
  for (const [x0, y0, x1, y1, bend] of strokes) {
    for (let i = 0; i <= 40; i++) {
      const t = i / 40
      const cx = lerp(x0, x1, t)
      const cy = lerp(y0, y1, t) + bend * Math.sin(Math.PI * t)
      best = Math.min(best, Math.hypot(x - cx, y - cy))
    }
  }
  return best
}

for (let y = 0; y < S; y++) {
  for (let x = 0; x < S; x++) {
    const i = (y * S + x) * 4
    const d = roundRect(x + 0.5, y + 0.5, 64)
    const alpha = Math.min(1, Math.max(0, 0.5 - d))
    const t = (x + y) / (2 * S)
    let c = A.map((v, k) => lerp(v, B[k], t))
    const sd = strokeDist(x + 0.5, y + 0.5) - 9
    const ink = Math.min(1, Math.max(0, 0.5 - sd))
    c = c.map((v, k) => lerp(v, INK[k], ink))
    px[i] = c[0]; px[i + 1] = c[1]; px[i + 2] = c[2]; px[i + 3] = Math.round(alpha * 255)
  }
}

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})
const crc32 = (buf) => {
  let c = 0xffffffff
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length)
  const td = Buffer.concat([Buffer.from(type), data])
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td))
  return Buffer.concat([len, td, crc])
}

const raw = Buffer.alloc(S * (S * 4 + 1))
for (let y = 0; y < S; y++) px.copy(raw, y * (S * 4 + 1) + 1, y * S * 4, (y + 1) * S * 4)
const ihdr = Buffer.alloc(13)
ihdr.writeUInt32BE(S, 0); ihdr.writeUInt32BE(S, 4); ihdr[8] = 8; ihdr[9] = 6

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', ihdr),
  chunk('IDAT', zlib.deflateSync(raw)),
  chunk('IEND', Buffer.alloc(0)),
])
const out = path.join(import.meta.dirname, '..', 'build', 'icon.png')
fs.mkdirSync(path.dirname(out), { recursive: true })
fs.writeFileSync(out, png)
console.log('icon:', out)

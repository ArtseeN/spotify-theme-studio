import { paletteFromPixels } from '../shared/theme.js'
import { mediaSrc } from './components/Preview.jsx'

// Seçilen arka plan resmini küçültüp piksellerinden tema paleti üretir
export async function paletteFromMedia(file) {
  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.src = mediaSrc(file)
  await img.decode()
  const size = 48
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')
  ctx.drawImage(img, 0, 0, size, size)
  return paletteFromPixels(ctx.getImageData(0, 0, size, size).data)
}

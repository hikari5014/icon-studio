/**
 * 匯出：SVG / CSS / React / Vue / HTML / PNG / 設計檔。
 *
 * 全部都從 `docToSVG()` 與 `docToCSS()` 長出來——匯出這一層只負責「包裝」，
 * 不重畫任何圖形。多一條畫圖的路徑，就多一個「編輯器裡對、貼出去錯」的可能。
 */

import { docToSVG, docToCSS, docDuration } from './render.js'
import { APP_VERSION } from './version.js'

const banner = (doc) =>
  `由「圖示動畫工作台」產生 v${APP_VERSION} · ${doc.meta.name}\n` +
  `造型要改請回工作台改，不要手改這裡的數字——下次重新匯出會整個蓋掉。`

/** 檔名安全化：中文保留，路徑符號拿掉 */
export const safeName = (s) => (s || 'icon').replace(/[\\/:*?"<>|]/g, '').trim() || 'icon'

export function exportSVG(doc) {
  const svg = docToSVG(doc, { size: doc.meta.w, animate: true })
  const css = docToCSS(doc)
  if (!css) return `<!-- ${banner(doc).replace(/\n/g, ' ')} -->\n` + pretty(svg)
  // 有動畫時把 CSS 內嵌進 <style>，這樣單一個 .svg 檔打開就會動
  return `<!-- ${banner(doc).replace(/\n/g, ' ')} -->\n` +
    pretty(svg.replace('>', '>\n<style>\n' + css + '\n</style>'))
}

export function exportCSS(doc) {
  const css = docToCSS(doc)
  return `/* ${banner(doc).split('\n').join('\n   ')} */\n\n` + (css || '/* 這份設計沒有任何動畫 */\n')
}

export function exportHTML(doc) {
  return `<!DOCTYPE html>
<html lang="zh-Hant">
<head>
<meta charset="utf-8">
<title>${esc(doc.meta.name)}</title>
<style>
body{margin:0;min-height:100vh;display:grid;place-items:center;background:#f7f5ef}
.icon{width:180px}
${docToCSS(doc)}
</style>
</head>
<body>
${docToSVG(doc, { animate: true, className: 'icon' })}
</body>
</html>`
}

export function exportReact(doc) {
  const name = pascal(doc.meta.name)
  const svg = docToSVG(doc, { animate: true, idPrefix: 'ID' })
  const jsx = svgToJSX(svg)
  return `/**
 * ${banner(doc).split('\n').join('\n * ')}
 *
 * 動畫的 CSS 在另一個分頁（「CSS」），要一起貼進你的樣式檔。
 * 只貼這個檔的話造型會對、但不會動。
 */
export function ${name}({ size = 24, className }: { size?: number; className?: string }) {
  return (
${jsx.replace(/^/gm, '    ').replace('<svg', '<svg\n      width={size}\n      height={(size * ' + doc.meta.h + ') / ' + doc.meta.w + '}\n      className={className}\n      aria-hidden="true"')}
  )
}
`
}

export function exportVue(doc) {
  const svg = docToSVG(doc, { animate: true })
  return `<!-- ${banner(doc).replace(/\n/g, ' ')} -->
<template>
${svg.replace('<svg', '<svg\n    :width="size"\n    :height="size * ' + doc.meta.h + ' / ' + doc.meta.w + '"\n    aria-hidden="true"').replace(/^/gm, '  ')}
</template>

<script setup>
defineProps({ size: { type: Number, default: 24 } })
</script>

<style scoped>
${docToCSS(doc)}
</style>
`
}

export function exportJSON(doc) {
  return JSON.stringify({ ...doc, _app: 'icon-studio', _v: APP_VERSION }, null, 2)
}

/** SVG → PNG。整段在瀏覽器裡跑完，不經過任何伺服器。 */
export function exportPNG(doc, px = 512) {
  return new Promise((resolve, reject) => {
    // 靜態圖：動畫凍在第一幀沒有意義，所以 PNG 一律不掛動畫
    const svg = docToSVG(doc, { size: doc.meta.w, animate: false })
    const img = new Image()
    img.onload = () => {
      const c = document.createElement('canvas')
      c.width = px
      c.height = Math.round((px * doc.meta.h) / doc.meta.w)
      const g = c.getContext('2d')
      g.imageSmoothingQuality = 'high'
      g.drawImage(img, 0, 0, c.width, c.height)
      c.toBlob((b) => (b ? resolve(b) : reject(new Error('轉檔失敗'))), 'image/png')
    }
    img.onerror = () => reject(new Error('SVG 讀不進來'))
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
  })
}

/* ── 小工具 ── */
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))

function pascal(s) {
  const ascii = String(s).replace(/[^a-zA-Z0-9 _-]/g, ' ').trim()
  const base = ascii
    ? ascii.split(/[\s_-]+/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join('')
    : 'Icon'
  // 中文名字轉不出英文識別字，所以一定要有 fallback；
  // 不然匯出的元件會叫 `export function ()`，貼進去直接是語法錯誤。
  return /^[A-Za-z]/.test(base) ? base : 'Icon' + base
}

/** SVG 屬性 → JSX 屬性 */
function svgToJSX(svg) {
  return pretty(svg)
    .replace(/\sxmlns="[^"]*"/g, '')
    .replace(/([a-z]+)-([a-z])/g, (m, a, b) => (KEBAB.has(m) ? a + b.toUpperCase() : m))
    .replace(/class=/g, 'className=')
}
const KEBAB = new Set([
  'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'stroke-dasharray', 'stroke-dashoffset',
  'fill-rule', 'clip-path', 'stop-color', 'stop-opacity', 'fill-opacity', 'stroke-opacity',
])

/** 讓匯出的 SVG 看得懂（一個標籤一行），不是為了好看，是為了 code review 讀得動 */
function pretty(svg) {
  let out = svg.replace(/></g, '>\n<')
  let depth = 0
  return out.split('\n').map((line) => {
    if (/^<\//.test(line)) depth = Math.max(0, depth - 1)
    const s = '  '.repeat(depth) + line
    if (/^<[^/!?]/.test(line) && !/\/>$/.test(line) && !/<\/\w+>$/.test(line)) depth++
    return s
  }).join('\n')
}

export const FORMATS = {
  svg:   { label: 'SVG',       ext: 'svg',  mime: 'image/svg+xml',        fn: exportSVG,   note: '動畫已內嵌在 <style> 裡，單獨打開這個檔就會動。' },
  css:   { label: 'CSS',       ext: 'css',  mime: 'text/css',             fn: exportCSS,   note: '貼進你的樣式檔。與 React／Vue 那兩份是一組。' },
  react: { label: 'React',     ext: 'tsx',  mime: 'text/plain',           fn: exportReact, note: '⚠ 要和「CSS」一起貼，只貼這個不會動。' },
  vue:   { label: 'Vue',       ext: 'vue',  mime: 'text/plain',           fn: exportVue,   note: '單檔元件，樣式已經含在裡面。' },
  html:  { label: 'HTML',      ext: 'html', mime: 'text/html',            fn: exportHTML,  note: '可以直接用瀏覽器打開的完整頁面，適合寄給別人看。' },
  json:  { label: '設計檔',     ext: 'json', mime: 'application/json',     fn: exportJSON,  note: '這個工作台的存檔。下次「開啟設計檔」讀回來就能接著改。' },
  png:   { label: 'PNG',       ext: 'png',  mime: 'image/png',            fn: null,        note: '靜態點陣圖（動畫不會保留）。下載時可以選尺寸。' },
}

export { docDuration }

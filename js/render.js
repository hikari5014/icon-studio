/**
 * 幾何 ＋ 渲染。
 *
 * ⚠ 這個檔是整支工具的地基，而它只有一個規矩：
 * **畫布、尺寸預覽、匯出的原始碼，全部由 `docToSVG()` 產生。**
 *
 * 不這樣做的話一定會出事——「編輯器裡長這樣、貼進專案長那樣」是這類工具
 * 最常見也最難查的 bug，因為兩邊都「看起來對」，只是不一樣。
 * 只要有第二條產生 SVG 的路徑，它遲早會跟第一條漂移。
 */

import { PALETTES, ANIMS } from './libs.js'

export const r2 = (v) => Math.round(v * 100) / 100

/* ══════════════════════════════════════════════════════════════════
   錨點 → 平滑封閉路徑（Catmull-Rom 轉三次貝茲）
   尖角的作法是把該點的把手長度設為 0，線就會在那裡折起來。
   ══════════════════════════════════════════════════════════════════ */
export function smoothClosed(pts, tension = 1) {
  const n = pts.length
  if (n < 2) return ''
  if (n === 2) return `M${r2(pts[0].x)} ${r2(pts[0].y)} L${r2(pts[1].x)} ${r2(pts[1].y)} Z`
  const at = (i) => pts[((i % n) + n) % n]
  let d = `M${r2(pts[0].x)} ${r2(pts[0].y)}`
  for (let i = 0; i < n; i++) {
    const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2)
    const k = tension / 6
    const c1 = p1.c ? p1 : { x: p1.x + (p2.x - p0.x) * k, y: p1.y + (p2.y - p0.y) * k }
    const c2 = p2.c ? p2 : { x: p2.x - (p3.x - p1.x) * k, y: p2.y - (p3.y - p1.y) * k }
    d += ` C${r2(c1.x)} ${r2(c1.y)} ${r2(c2.x)} ${r2(c2.y)} ${r2(p2.x)} ${r2(p2.y)}`
  }
  return d + ' Z'
}

export function smoothOpen(pts) {
  if (pts.length < 2) return ''
  let d = `M${r2(pts[0].x)} ${r2(pts[0].y)}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || pts[i + 1]
    const c1 = p1.c ? p1 : { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 }
    const c2 = p2.c ? p2 : { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 }
    d += ` C${r2(c1.x)} ${r2(c1.y)} ${r2(c2.x)} ${r2(c2.y)} ${r2(p2.x)} ${r2(p2.y)}`
  }
  return d
}

/* ══════════════════════════════════════════════════════════════════
   顏色：圖層存的是「角色」（a / b / c / ink）而不是色碼。
   換一組配色，整張圖跟著變——這是配色庫能有 50 組卻不用改圖的原因。
   直接寫 #xxxxxx 也接受（從 SVG 匯進來的就是那樣）。
   ══════════════════════════════════════════════════════════════════ */
export function resolveColor(role, palIndex) {
  if (!role) return 'none'
  if (role[0] === '#' || role.startsWith('rgb')) return role
  const p = PALETTES[palIndex] || PALETTES[0]
  return p[role] || role
}

/* ══════════════════════════════════════════════════════════════════
   單一圖層 → 幾何（不含顏色）
   ══════════════════════════════════════════════════════════════════ */
export function layerGeom(l) {
  switch (l.type) {
    case 'path':
      return `<path d="${smoothClosed(l.pts || [])}"/>`
    case 'rect': {
      const x = r2(l.x - l.w / 2), y = r2(l.y - l.h / 2)
      const rot = l.rot ? ` transform="rotate(${l.rot} ${r2(l.x)} ${r2(l.y)})"` : ''
      return `<rect x="${x}" y="${y}" width="${r2(l.w)}" height="${r2(l.h)}" rx="${r2(Math.min(l.r ?? 0, Math.min(l.w, l.h) / 2))}"${rot}/>`
    }
    case 'ellipse': {
      const rot = l.rot ? ` transform="rotate(${l.rot} ${r2(l.x)} ${r2(l.y)})"` : ''
      return `<ellipse cx="${r2(l.x)}" cy="${r2(l.y)}" rx="${r2(l.w / 2)}" ry="${r2(l.h / 2)}"${rot}/>`
    }
    case 'line':
      return `<path d="M${r2(l.x1)} ${r2(l.y1)} Q${r2(l.cx)} ${r2(l.cy)} ${r2(l.x2)} ${r2(l.y2)}"/>`
    case 'raw':
      return `<path d="${l.d}"/>`
    default:
      return ''
  }
}

/** 這一層要不要描邊框？'auto' 時尊重圖層自己的旗標（細節件預設不描） */
export function wantsOutline(l, mode) {
  if (mode === 'on') return true
  if (mode === 'off') return false
  return l.outline !== false
}

/** 這一層是不是「只有線、沒有面」——那種東西描邊框會變成兩條線 */
const isStrokeOnly = (l) => l.type === 'line' || (l.fill && l.fill.type === 'none')

/* ══════════════════════════════════════════════════════════════════
   文件 → SVG
   ══════════════════════════════════════════════════════════════════ */
let uidSeq = 0
export function docToSVG(doc, opts = {}) {
  const {
    size = null,        // 給寬高；null＝不寫（讓 CSS 決定）
    animate = true,     // 要不要掛動畫 class
    backdrop = false,   // 畫布才需要描圖底圖
    idPrefix = 'is' + (uidSeq++),
  } = opts

  const W = doc.meta.w, H = doc.meta.h
  const mode = doc.outline?.mode ?? 'auto'
  const inkOutline = resolveColor(doc.outline?.color ?? 'ink', doc.pal)
  const ow = doc.outline?.w ?? 7

  const defs = []
  const body = []

  // 底圖：只在畫布上出現，匯出時絕對不能帶著走
  if (backdrop && doc.backdrop?.src && doc.backdrop.visible !== false) {
    const b = doc.backdrop
    body.push(`<image href="${b.src}" x="${r2(b.x)}" y="${r2(b.y)}" width="${r2(b.w)}" height="${r2(b.h)}" opacity="${b.opacity ?? .5}" preserveAspectRatio="none"/>`)
  }

  const visible = doc.layers.filter((l) => l.visible !== false)

  /* 外框是「先把所有要描邊的形狀用粗描邊畫一次」——這樣相鄰的形狀會
     union 出一圈連續的輪廓，而不是每個零件各有一圈框。
     逐件描邊的話，腳和身體之間會出現一條不該有的線。 */
  const outlined = visible.filter((l) => wantsOutline(l, mode) && !isStrokeOnly(l))
  if (outlined.length && ow > 0) {
    body.push(`<g stroke="${inkOutline}" stroke-width="${r2(ow)}" stroke-linejoin="round" stroke-linecap="round" fill="${inkOutline}">` +
      outlined.map((l) => wrapAnim(layerGeom(l), l, animate)).join('') + '</g>')
  }

  // 填色（一層一層照順序疊上去）
  for (const l of visible) {
    const f = l.fill || { type: 'solid', color: 'a' }
    let fill = 'none'
    if (f.type === 'solid') fill = resolveColor(f.color, doc.pal)
    else if (f.type === 'grad') {
      const gid = `${idPrefix}-g-${l.id}`
      const ang = f.angle ?? 120
      const rad = (ang * Math.PI) / 180
      const x2 = r2(0.5 + Math.cos(rad) * 0.5), y2 = r2(0.5 + Math.sin(rad) * 0.5)
      const x1 = r2(0.5 - Math.cos(rad) * 0.5), y1 = r2(0.5 - Math.sin(rad) * 0.5)
      defs.push(`<linearGradient id="${gid}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">` +
        `<stop offset="0" stop-color="${resolveColor(f.a, doc.pal)}"/>` +
        `<stop offset="1" stop-color="${resolveColor(f.b, doc.pal)}"/></linearGradient>`)
      fill = `url(#${gid})`
    }
    const s = l.stroke
    const strokeAttr = s
      ? ` stroke="${resolveColor(s.color, doc.pal)}" stroke-width="${r2(s.w)}" stroke-linecap="round" stroke-linejoin="round"`
      : ''
    body.push(wrapAnim(layerGeom(l), l, animate, ` fill="${fill}"${strokeAttr}`))
  }

  const dim = size ? ` width="${r2(size)}" height="${r2((size * H) / W)}"` : ''
  const cls = opts.className ? ` class="${opts.className}"` : ''
  return `<svg xmlns="http://www.w3.org/2000/svg"${dim} viewBox="0 0 ${W} ${H}"${cls}>` +
    (defs.length ? `<defs>${defs.join('')}</defs>` : '') + body.join('') + '</svg>'
}

/** 把幾何包進一個帶動畫 class 的 <g>；沒有動畫就不包（少一層節點） */
function wrapAnim(geom, l, animate, attrs = '') {
  const withAttrs = attrs ? geom.replace(/^<(\w+)/, `<$1${attrs}`) : geom
  if (!animate || !l.anim || l.anim === 'none') return withAttrs
  return `<g class="${animCls(l)}">${withAttrs}</g>`
}

/** 動畫 class 名：每一層一個，才可以各調各的參數 */
export const animCls = (l) => `a-${l.anim}-${l.id}`

/** 這份文件用到的所有動畫 CSS */
export function docToCSS(doc) {
  const out = []
  const seen = new Set()
  for (const l of doc.layers) {
    if (!l.anim || l.anim === 'none' || l.visible === false) continue
    const def = ANIMS[l.anim]
    if (!def) continue
    const cls = animCls(l)
    if (seen.has(cls)) continue
    seen.add(cls)
    const p = {}
    for (const pr of def.params) p[pr.k] = l.animP?.[l.anim]?.[pr.k] ?? pr.def
    out.push(def.css(cls, p))
  }
  if (!out.length) return ''
  return out.join('\n') + `

/* 使用者在系統設定裡要求「減少動態」時，會位移的動畫整個停掉。
   ⚠ 只停位移、不停全部：不動的載入指示看起來就是當掉了。 */
@media (prefers-reduced-motion: reduce){
  [class*="a-drop-"],[class*="a-bounce-"],[class*="a-shake-"],[class*="a-orbit-"],[class*="a-float-"]{animation:none!important}
}`
}

/** 這份文件的動畫裡最長的一圈是多久（時間軸的長度） */
export function docDuration(doc) {
  let max = 1000
  for (const l of doc.layers) {
    const def = ANIMS[l.anim]
    if (!def) continue
    const dp = def.params.find((p) => p.k === 'dur')
    if (!dp) continue
    const v = l.animP?.[l.anim]?.dur ?? dp.def
    const delay = l.animP?.[l.anim]?.delay ?? 0
    max = Math.max(max, v + delay)
  }
  return max
}

/* ══════════════════════════════════════════════════════════════════
   匯入 SVG：把常見的形狀轉成圖層
   只認得靜態幾何——動畫、濾鏡、遮罩一律丟掉並回報，
   因為「靜靜吃掉一半內容」比「明說我不支援」糟糕得多。
   ══════════════════════════════════════════════════════════════════ */
export function svgToLayers(text) {
  const doc = new DOMParser().parseFromString(text, 'image/svg+xml')
  if (doc.querySelector('parsererror')) throw new Error('這不是合法的 SVG')
  const svg = doc.documentElement
  const vb = (svg.getAttribute('viewBox') || '').trim().split(/[\s,]+/).map(Number)
  const srcW = vb.length === 4 ? vb[2] : parseFloat(svg.getAttribute('width')) || 120
  const srcH = vb.length === 4 ? vb[3] : parseFloat(svg.getAttribute('height')) || 120
  const ox = vb.length === 4 ? vb[0] : 0
  const oy = vb.length === 4 ? vb[1] : 0

  // 等比縮放到 120×120 並置中——匯進來就能用，不用再自己調
  const k = Math.min(120 / srcW, 120 / srcH)
  const dx = (120 - srcW * k) / 2 - ox * k
  const dy = (120 - srcH * k) / 2 - oy * k

  const layers = []
  const skipped = []
  let i = 0
  const num = (el, a, d = 0) => parseFloat(el.getAttribute(a) ?? d) || 0

  svg.querySelectorAll('path,rect,circle,ellipse,line,polygon,polyline').forEach((el) => {
    if (el.closest('defs,clipPath,mask,marker,pattern')) return
    const id = 'i' + (++i)
    const fillRaw = el.getAttribute('fill') ?? el.style?.fill
    const strokeRaw = el.getAttribute('stroke') ?? el.style?.stroke
    const fill = fillRaw && fillRaw !== 'none' && !fillRaw.startsWith('url')
      ? { type: 'solid', color: fillRaw }
      : fillRaw === 'none' ? { type: 'none' } : { type: 'solid', color: 'a' }
    const stroke = strokeRaw && strokeRaw !== 'none' && !strokeRaw.startsWith('url')
      ? { color: strokeRaw, w: num(el, 'stroke-width', 2) * k } : null
    const base = { id, visible: true, locked: false, anim: 'none', animP: {}, fill, stroke, outline: false }

    const tag = el.tagName.toLowerCase()
    if (tag === 'rect') {
      layers.push({ ...base, name: `矩形 ${i}`, type: 'rect',
        x: (num(el, 'x') + num(el, 'width') / 2) * k + dx, y: (num(el, 'y') + num(el, 'height') / 2) * k + dy,
        w: num(el, 'width') * k, h: num(el, 'height') * k, r: num(el, 'rx') * k })
    } else if (tag === 'circle') {
      layers.push({ ...base, name: `圓 ${i}`, type: 'ellipse',
        x: num(el, 'cx') * k + dx, y: num(el, 'cy') * k + dy, w: num(el, 'r') * 2 * k, h: num(el, 'r') * 2 * k })
    } else if (tag === 'ellipse') {
      layers.push({ ...base, name: `橢圓 ${i}`, type: 'ellipse',
        x: num(el, 'cx') * k + dx, y: num(el, 'cy') * k + dy, w: num(el, 'rx') * 2 * k, h: num(el, 'ry') * 2 * k })
    } else if (tag === 'line') {
      layers.push({ ...base, name: `線 ${i}`, type: 'line', fill: { type: 'none' },
        stroke: stroke || { color: 'ink', w: 6 },
        x1: num(el, 'x1') * k + dx, y1: num(el, 'y1') * k + dy,
        cx: ((num(el, 'x1') + num(el, 'x2')) / 2) * k + dx, cy: ((num(el, 'y1') + num(el, 'y2')) / 2) * k + dy,
        x2: num(el, 'x2') * k + dx, y2: num(el, 'y2') * k + dy })
    } else if (tag === 'polygon' || tag === 'polyline') {
      const nums = (el.getAttribute('points') || '').trim().split(/[\s,]+/).map(Number)
      const pts = []
      for (let j = 0; j + 1 < nums.length; j += 2) pts.push({ x: nums[j] * k + dx, y: nums[j + 1] * k + dy, c: true })
      if (pts.length > 2) layers.push({ ...base, name: `多邊形 ${i}`, type: 'path', pts })
    } else if (tag === 'path') {
      const d = el.getAttribute('d')
      if (!d) return
      /* path 保留原始 d 而不是拆成錨點：拆解會把貝茲曲線近似掉，
         匯進來的東西第一眼就變形——那比「暫時不能拖點」糟得多。
         要改造型的話，編輯器提供「轉成可編輯的點」（會取樣）。 */
      layers.push({ ...base, name: `路徑 ${i}`, type: 'raw',
        d: transformD(d, k, dx, dy) })
    }
  })

  const anim = svg.querySelector('animate,animateTransform,animateMotion')
  if (anim) skipped.push('原本的 SMIL 動畫（請改用動畫庫重做）')
  if (svg.querySelector('filter')) skipped.push('濾鏡效果')
  if (svg.querySelector('mask,clipPath')) skipped.push('遮罩／裁切')
  if (svg.querySelector('text')) skipped.push('文字（請先在原軟體轉成外框）')
  if (svg.querySelector('image')) skipped.push('內嵌點陣圖')

  return { layers, skipped, count: layers.length }
}

/**
 * 把 path 的 d 做等比縮放＋位移。
 *
 * ⚠ 只處理絕對座標指令（大寫）與相對指令（小寫）的數字縮放；
 * 弧線 A/a 的旗標欄位（large-arc、sweep）**不可以被縮放**，
 * 那兩個是 0/1 的布林值，乘上 k 會變成無效路徑而且瀏覽器只會靜靜畫錯。
 */
function transformD(d, k, dx, dy) {
  return d.replace(/([a-zA-Z])([^a-zA-Z]*)/g, (_, cmd, args) => {
    const nums = args.trim().match(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi)
    if (!nums) return cmd
    const abs = cmd === cmd.toUpperCase()
    const isArc = cmd.toLowerCase() === 'a'
    const out = nums.map((s, i) => {
      let v = parseFloat(s)
      if (isArc) {
        const slot = i % 7
        if (slot === 3 || slot === 4) return String(v)            // 旗標，原樣保留
        if (slot === 2) return String(v)                          // 旋轉角，不縮放
        v = v * k + (abs ? (slot === 5 ? dx : slot === 6 ? dy : 0) : 0)
        return String(r2(v))
      }
      if (cmd === 'H' || cmd === 'h') return String(r2(v * k + (abs ? dx : 0)))
      if (cmd === 'V' || cmd === 'v') return String(r2(v * k + (abs ? dy : 0)))
      v = v * k + (abs ? (i % 2 === 0 ? dx : dy) : 0)
      return String(r2(v))
    })
    return cmd + out.join(' ')
  })
}

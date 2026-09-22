/**
 * 圖示動畫工作台 —— 主程式。
 *
 * 分七段：狀態 / 繪製 / 畫布互動 / 面板 / 資料庫 / 匯入匯出 / 啟動。
 * 唯一一條不能破的規矩寫在 render.js 開頭：**畫布、預覽、匯出共用同一支產生器**。
 */

import { PALETTES, SHAPES, ANIMS, EXAMPLES, blankDoc } from './libs.js'
import { docToSVG, docToCSS, docDuration, smoothClosed, svgToLayers, resolveColor, r2 } from './render.js'
import { FORMATS, exportPNG, safeName } from './export.js'
import { APP_VERSION, BUILD_DATE } from './version.js'
import { CHANGELOG } from './changelog.js'

/* ═════════════ 1. 狀態 ═════════════ */
const $ = (s) => document.querySelector(s)
const el = (t, c, h) => { const e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e }

/* ⚠ 這幾個小工具一定要宣告在 `doc` 之前。
   `const` 有暫時性死區（TDZ）——寫成「先用、後宣告」不會是 undefined，
   而是整支模組**當場拋錯停掉**。症狀很騙人：HTML 的殼還是照常畫出來，
   頁面看起來只是「沒有內容」，主控台以外完全看不出哪裡壞了。 */
const clone = (o) => JSON.parse(JSON.stringify(o))
const uid = () => 'l' + Math.random().toString(36).slice(2, 8)
function save() { try { localStorage.setItem('icon-studio.doc', JSON.stringify(doc)) } catch (e) {} }
function load() { try { const s = localStorage.getItem('icon-studio.doc'); return s ? JSON.parse(s) : null } catch (e) { return null } }

let doc = load() || clone(EXAMPLES[0])
let selId = doc.layers[0]?.id ?? null
let selPt = 0
let tool = 'select'
let playing = true
let scrubMs = 0
let showHandles = true
let showGrid = true
let pending = null            // 正在用鋼筆畫的那一條
const undoStack = []
const redoStack = []

const selLayer = () => doc.layers.find((l) => l.id === selId) || null

/** 每一個會改到文件的動作都先呼叫它。沒有 push 的改動＝使用者按復原會跳過一步。 */
function push() { undoStack.push(JSON.stringify(doc)); if (undoStack.length > 80) undoStack.shift(); redoStack.length = 0; syncUndo() }
function undo() { if (!undoStack.length) return; redoStack.push(JSON.stringify(doc)); doc = JSON.parse(undoStack.pop()); fixSel(); save(); renderAll(); syncUndo() }
function redo() { if (!redoStack.length) return; undoStack.push(JSON.stringify(doc)); doc = JSON.parse(redoStack.pop()); fixSel(); save(); renderAll(); syncUndo() }
function syncUndo() { $('#btnUndo').disabled = !undoStack.length; $('#btnRedo').disabled = !redoStack.length }
function fixSel() { if (!doc.layers.some((l) => l.id === selId)) selId = doc.layers[0]?.id ?? null; selPt = 0 }

/* ═════════════ 2. 繪製 ═════════════ */
const stage = $('#stage')
const styleTag = document.createElement('style')
document.head.appendChild(styleTag)

function renderAll() {
  $('#docName').value = doc.meta.name
  styleTag.textContent = docToCSS(doc)
  drawStage()
  drawPreviews()
  drawLayers()
  drawPanels()
  const dur = docDuration(doc)
  $('#scrub').max = dur
  if (scrubMs > dur) scrubMs = 0
}

/** 只重畫畫布（拖曳中每一幀都會呼叫，不能順便做別的事） */
function drawStage() {
  styleTag.textContent = docToCSS(doc)
  const svg = docToSVG(doc, { animate: true, backdrop: true, idPrefix: 'stg' })
  const parsed = new DOMParser().parseFromString(svg, 'image/svg+xml').documentElement
  stage.setAttribute('viewBox', `0 0 ${doc.meta.w} ${doc.meta.h}`)
  stage.innerHTML = (showGrid ? gridSVG() : '') + parsed.innerHTML + (showHandles ? handlesSVG() : '') + penGhost()
  bindHandles()
  applyScrub()
}

function gridSVG() {
  let s = '<g aria-hidden="true">'
  for (let i = 0; i <= doc.meta.w; i += 10) {
    const m = i % 60 === 0 ? ' major' : ''
    s += `<line class="gridline${m}" x1="${i}" y1="0" x2="${i}" y2="${doc.meta.h}"/>`
  }
  for (let i = 0; i <= doc.meta.h; i += 10) {
    const m = i % 60 === 0 ? ' major' : ''
    s += `<line class="gridline${m}" x1="0" y1="${i}" x2="${doc.meta.w}" y2="${i}"/>`
  }
  return s + '</g>'
}

/** 選中圖層的控制點。每種圖層型別有自己的一組。 */
function handles() {
  const l = selLayer()
  if (!l || l.locked) return []
  switch (l.type) {
    case 'path': return (l.pts || []).map((p, i) => ({ x: p.x, y: p.y, i, corner: p.c }))
    case 'rect':
    case 'ellipse': return [
      { x: l.x, y: l.y, i: 0, k: 'move' },
      { x: l.x + l.w / 2, y: l.y + l.h / 2, i: 1, k: 'size' },
    ]
    case 'line': return [
      { x: l.x1, y: l.y1, i: 0 }, { x: l.cx, y: l.cy, i: 1, ghost: true }, { x: l.x2, y: l.y2, i: 2 },
    ]
    default: return []
  }
}

function handlesSVG() {
  const l = selLayer()
  if (!l) return ''
  let s = '<g>'
  if (l.type === 'line') s += `<path class="hint" d="M${l.x1} ${l.y1} L${l.cx} ${l.cy} L${l.x2} ${l.y2}"/>`
  if (l.type === 'rect' || l.type === 'ellipse') {
    s += `<rect class="bbox" x="${r2(l.x - l.w / 2)}" y="${r2(l.y - l.h / 2)}" width="${r2(l.w)}" height="${r2(l.h)}"/>`
  }
  handles().forEach((h, n) => {
    const cls = ['hnd', h.corner ? 'corner' : '', h.ghost ? 'ghost' : '', n === selPt ? 'on' : ''].filter(Boolean).join(' ')
    s += `<circle class="${cls}" data-n="${n}" cx="${h.x}" cy="${h.y}" r="${n === selPt ? 3.2 : 2.5}"/>`
  })
  return s + '</g>'
}

/** 鋼筆正在畫的預覽線 */
function penGhost() {
  if (!pending || pending.length < 1) return ''
  const d = pending.length > 2 ? smoothClosed(pending) : `M${pending.map((p) => `${p.x} ${p.y}`).join(' L')}`
  return `<g><path class="hint" d="${d}" style="stroke-dasharray:2 1.6;opacity:1"/>` +
    pending.map((p, i) => `<circle class="hnd${i === 0 ? ' on' : ''}" cx="${p.x}" cy="${p.y}" r="2.6"/>`).join('') + '</g>'
}

function drawPreviews() {
  const mk = (s) => docToSVG(doc, { size: s, animate: true })
  $('#previews').innerHTML =
    `<div class="p">${mk(64)}<small>64</small></div>` +
    `<div class="p">${mk(40)}<small>40</small></div>` +
    `<div class="p">${mk(24)}<small>24</small></div>` +
    `<div class="p">${mk(16)}<small>16</small></div>` +
    `<div class="p"><div class="onDark">${mk(34)}</div><small>深色底</small></div>` +
    `<div class="p"><div class="onAcc">${mk(28)}</div><small>按鈕上</small></div>`
}

/* ═════════════ 3. 畫布互動 ═════════════ */
function toVB(e) {
  const p = stage.createSVGPoint()
  p.x = e.clientX; p.y = e.clientY
  const m = stage.getScreenCTM()
  if (!m) return { x: 0, y: 0 }
  const q = p.matrixTransform(m.inverse())
  return { x: r2(q.x), y: r2(q.y) }
}

function bindHandles() {
  stage.querySelectorAll('.hnd[data-n]').forEach((node) => {
    node.addEventListener('pointerdown', (ev) => {
      ev.preventDefault(); ev.stopPropagation()
      selPt = +node.dataset.n
      push()
      /* ⚠ move / up 一定要掛在 window 上。拖曳的每一幀都會重建整個畫布
         （innerHTML），也就是**這顆控制點會被刪掉**——監聽掛在它身上的話
         會跟著消失，症狀是「點得到、選得起來、就是拖不動」而且完全沒有錯誤。 */
      const move = (e) => { dragTo(selPt, toVB(e), e.shiftKey); drawStage() }
      const up = () => {
        window.removeEventListener('pointermove', move)
        window.removeEventListener('pointerup', up)
        save(); renderAll()
      }
      window.addEventListener('pointermove', move)
      window.addEventListener('pointerup', up)
      drawStage(); drawPanels()
    })
  })
}

/** shift＝吸附到 1 單位格線（微調時「差一點點」比「差很多」更難修） */
function dragTo(n, p, snap) {
  const l = selLayer(); if (!l || l.locked) return
  const x = snap ? Math.round(p.x) : p.x
  const y = snap ? Math.round(p.y) : p.y
  if (l.type === 'path') { l.pts[n].x = x; l.pts[n].y = y }
  else if (l.type === 'line') { [['x1', 'y1'], ['cx', 'cy'], ['x2', 'y2']][n].forEach((k, j) => (l[k] = j === 0 ? x : y)) }
  else if (n === 0) { l.x = x; l.y = y }
  else { l.w = Math.max(3, Math.abs(x - l.x) * 2); l.h = Math.max(3, Math.abs(y - l.y) * 2) }
}

/* 在畫布空白處按下：依工具決定行為 */
stage.addEventListener('pointerdown', (e) => {
  if (e.target.classList.contains('hnd')) return
  const p = toVB(e)
  if (tool === 'pen') {
    if (!pending) pending = []
    // 點回第一個點＝收尾（和所有向量軟體一樣的手勢）
    if (pending.length > 2 && Math.hypot(pending[0].x - p.x, pending[0].y - p.y) < 6) return finishPen()
    pending.push({ x: p.x, y: p.y, c: e.shiftKey })
    drawStage()
    tip(`鋼筆：已放 ${pending.length} 點 · 點回起點或按 Enter 收尾 · Esc 取消 · 按住 Shift 放尖角`)
    return
  }
  if (tool === 'rect' || tool === 'ellipse') { addLayer(tool, { x: p.x, y: p.y, w: 40, h: 40, r: tool === 'rect' ? 6 : 0 }); setTool('select'); return }
  if (tool === 'line') { addLayer('line', { x1: p.x - 20, y1: p.y, cx: p.x, cy: p.y - 16, x2: p.x + 20, y2: p.y }); setTool('select'); return }
  // 選取工具：點到哪一層就選哪一層（由上往下找，因為上層蓋住下層）
  const hit = hitTest(p)
  if (hit && hit !== selId) { selId = hit; selPt = 0; renderAll() }
})

/** 命中測試：用瀏覽器自己的 isPointInFill，比手寫幾何可靠得多 */
function hitTest(p) {
  const probe = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  probe.setAttribute('viewBox', `0 0 ${doc.meta.w} ${doc.meta.h}`)
  probe.style.cssText = 'position:absolute;left:-9999px;width:120px;height:120px'
  document.body.appendChild(probe)
  let found = null
  try {
    const pt = probe.createSVGPoint(); pt.x = p.x; pt.y = p.y
    for (let i = doc.layers.length - 1; i >= 0; i--) {
      const l = doc.layers[i]
      if (l.visible === false || l.locked) continue
      probe.innerHTML = docToSVG({ ...doc, layers: [l], backdrop: null }, { animate: false })
        .replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '')
      const shapes = probe.querySelectorAll('path,rect,ellipse,circle')
      for (const s of shapes) {
        const ok = s.isPointInFill?.(pt) || (s.isPointInStroke?.(pt) ?? false)
        if (ok) { found = l.id; break }
      }
      if (found) break
    }
  } catch (err) { /* 舊瀏覽器沒有 isPointInFill：退化成「不改選取」，不要崩 */ }
  probe.remove()
  return found
}

stage.addEventListener('dblclick', (e) => {
  const l = selLayer()
  if (!l || l.type !== 'path' || l.locked) return
  const p = toVB(e)
  let best = -1, bd = 1e9
  for (let i = 0; i < l.pts.length; i++) {
    const a = l.pts[i], b = l.pts[(i + 1) % l.pts.length]
    const d = Math.hypot((a.x + b.x) / 2 - p.x, (a.y + b.y) / 2 - p.y)
    if (d < bd) { bd = d; best = i }
  }
  if (bd > 16) return
  push(); l.pts.splice(best + 1, 0, { x: p.x, y: p.y }); selPt = best + 1; save(); renderAll()
  toast('加了一個點')
})

function finishPen() {
  if (!pending || pending.length < 3) { pending = null; drawStage(); return toast('至少要三個點') }
  addLayer('path', { pts: pending })
  pending = null
  setTool('select')
}

/* ═════════════ 4. 圖層與面板 ═════════════ */
function addLayer(type, geom) {
  push()
  const names = { path: '路徑', rect: '方形', ellipse: '圓形', line: '曲線' }
  const l = {
    id: uid(), name: `${names[type] || type} ${doc.layers.length + 1}`, type,
    visible: true, locked: false, anim: 'none', animP: {},
    fill: type === 'line' ? { type: 'none' } : { type: 'solid', color: 'a' },
    stroke: type === 'line' ? { color: 'ink', w: 6 } : null,
    outline: type !== 'line',
    ...geom,
  }
  doc.layers.push(l); selId = l.id; selPt = 0; save(); renderAll()
  toast('加了「' + l.name + '」')
}

function drawLayers() {
  const list = $('#layerList')
  list.innerHTML = ''
  // 由上到下＝由前到後，所以陣列要倒過來顯示
  ;[...doc.layers].reverse().forEach((l) => {
    const row = el('div', 'lay' + (l.id === selId ? ' on' : ''))
    const f = l.fill || {}
    const sw = f.type === 'grad' ? resolveColor(f.a, doc.pal) : f.type === 'solid' ? resolveColor(f.color, doc.pal) : 'transparent'
    row.innerHTML =
      `<span class="eye ${l.visible !== false ? 'on' : ''}" title="顯示／隱藏">${l.visible !== false ? '●' : '○'}</span>` +
      `<span class="sw" style="background:${sw}"></span>` +
      `<span class="nm">${escape_(l.name)}</span>` +
      `<span class="lk ${l.locked ? 'on' : ''}" title="鎖定">${l.locked ? '🔒' : '🔓'}</span>` +
      `<span class="mv"><button title="上移">▲</button><button title="下移">▼</button></span>`
    row.onclick = (e) => {
      const i = doc.layers.indexOf(l)
      if (e.target.classList.contains('eye')) { push(); l.visible = l.visible === false; save(); renderAll(); return }
      if (e.target.classList.contains('lk')) { push(); l.locked = !l.locked; save(); renderAll(); return }
      if (e.target.tagName === 'BUTTON') {
        const up = e.target.title === '上移'
        const j = up ? i + 1 : i - 1
        if (j < 0 || j >= doc.layers.length) return
        push(); doc.layers.splice(i, 1); doc.layers.splice(j, 0, l); save(); renderAll(); return
      }
      selId = l.id; selPt = 0; renderAll()
    }
    row.ondblclick = () => {
      const n = prompt('圖層名稱', l.name)
      if (n) { push(); l.name = n; save(); renderAll() }
    }
    list.appendChild(row)
  })
  if (!doc.layers.length) list.innerHTML = '<p class="note" style="margin:0">還沒有圖層。用左上的工具畫一個，或到「資料庫」拿一個造型。</p>'
}

function drawPanels() { drawProps(); drawAnim(); drawColor(); drawLib() }

/* ── 屬性 ── */
function drawProps() {
  const p = $('#tab-props')
  const l = selLayer()
  if (!l) { p.innerHTML = '<p class="note" style="margin:0">先選一個圖層。</p>'; return }
  const f = l.fill || { type: 'solid', color: 'a' }
  let h = `<h2>${escape_(l.name)} <span class="hintq" title="雙擊左邊的圖層名稱可以改名">?</span></h2>`

  // 填色
  h += `<div class="field"><label>填色</label><div class="seg" data-seg="fill">
    ${['solid:單色', 'grad:漸層', 'none:不填'].map(([_, ...__], i) => '').join('')}
    <button data-v="solid" class="${f.type === 'solid' ? 'on' : ''}">單色</button>
    <button data-v="grad" class="${f.type === 'grad' ? 'on' : ''}">漸層</button>
    <button data-v="none" class="${f.type === 'none' ? 'on' : ''}">不填</button>
  </div></div>`
  if (f.type === 'solid') h += roleRow('顏色', f.color, 'fill.color')
  if (f.type === 'grad') {
    h += roleRow('亮端', f.a, 'fill.a') + roleRow('暗端', f.b, 'fill.b')
    h += slider('角度', f.angle ?? 120, 0, 360, 5, (v) => (l.fill.angle = v), '°')
  }

  // 描線
  h += `<div class="divider"></div><div class="field"><label>描線</label>
    <div class="seg"><button data-str="0" class="${!l.stroke ? 'on' : ''}">無</button>
    <button data-str="1" class="${l.stroke ? 'on' : ''}">有</button></div></div>`
  if (l.stroke) {
    h += roleRow('線色', l.stroke.color, 'stroke.color')
    h += slider('線寬', l.stroke.w, 0.5, 24, .5, (v) => (l.stroke.w = v))
  }

  // 幾何
  h += '<div class="divider"></div>'
  if (l.type === 'rect' || l.type === 'ellipse') {
    h += slider('寬', l.w, 2, doc.meta.w * 1.5, .5, (v) => (l.w = v))
      + slider('高', l.h, 2, doc.meta.h * 1.5, .5, (v) => (l.h = v))
      + slider('旋轉', l.rot ?? 0, -180, 180, 1, (v) => (l.rot = v), '°')
    if (l.type === 'rect') h += slider('圓角', l.r ?? 0, 0, Math.min(l.w, l.h) / 2, .5, (v) => (l.r = v))
  }
  if (l.type === 'path') {
    const pt = l.pts[selPt]
    h += `<div class="field"><label>第 ${selPt + 1}/${l.pts.length} 點</label>
      <button class="btn sm" id="ptCorner">${pt?.c ? '改成平滑' : '改成尖角'}</button>
      <button class="btn sm danger" id="ptDel">刪點</button></div>
      <p class="note">雙擊輪廓線上可以插一個新點。<b>尖角</b>會讓線在那裡折起來，<b>平滑</b>會畫出圓弧。</p>`
  }
  if (l.type === 'line') h += '<p class="note">中間那個虛線圓點是<b>曲度控制點</b>，拖它可以把線拉彎。</p>'

  // 外框
  h += `<div class="divider"></div><div class="field"><label>加外框</label>
    <div class="seg"><button data-ol="1" class="${l.outline !== false ? 'on' : ''}">要</button>
    <button data-ol="0" class="${l.outline === false ? 'on' : ''}">不要</button></div></div>
    <p class="note">「要」的圖層會和其他要外框的圖層<b>連成一圈</b>，而不是各自有一圈框。眼睛、投幣口這種細節件通常選「不要」。</p>`

  p.innerHTML = h
  wire(p, l)
}

/** 顏色列：可以選配色角色，也可以直接指定色碼 */
function roleRow(label, cur, path) {
  const roles = [['a', '主亮'], ['b', '主暗'], ['c', '副色'], ['ink', '輪廓']]
  const isRole = roles.some(([r]) => r === cur)
  return `<div class="field" data-color="${path}">
    <label>${label}</label>
    <div class="seg">${roles.map(([r, n]) => `<button data-role="${r}" class="${cur === r ? 'on' : ''}">${n}</button>`).join('')}</div>
    <input type="color" value="${isRole ? resolveColor(cur, doc.pal) : cur}" title="自訂色碼">
  </div>`
}

let sliderSeq = 0
function slider(label, val, min, max, step, cb, unit = '') {
  const id = 'sl' + (sliderSeq++)
  queueMicrotask(() => {
    const e = document.getElementById(id); if (!e) return
    e.oninput = () => { cb(+e.value); e.nextElementSibling.textContent = e.value + unit; drawStage(); drawPreviews() }
    e.onchange = () => { save(); drawLayers() }
    e.onpointerdown = () => push()
  })
  return `<div class="field"><label>${label}</label><input id="${id}" type="range" min="${min}" max="${max}" step="${step}" value="${val}"><span class="v">${r2(val)}${unit}</span></div>`
}

function wire(root, l) {
  root.querySelectorAll('[data-seg="fill"] button').forEach((b) => b.onclick = () => {
    push()
    const v = b.dataset.v
    if (v === 'solid') l.fill = { type: 'solid', color: l.fill?.a || l.fill?.color || 'a' }
    else if (v === 'grad') l.fill = { type: 'grad', a: l.fill?.color || 'a', b: 'b', angle: 120 }
    else l.fill = { type: 'none' }
    save(); renderAll()
  })
  root.querySelectorAll('[data-str]').forEach((b) => b.onclick = () => {
    push(); l.stroke = b.dataset.str === '1' ? (l.stroke || { color: 'ink', w: 6 }) : null; save(); renderAll()
  })
  root.querySelectorAll('[data-ol]').forEach((b) => b.onclick = () => {
    push(); l.outline = b.dataset.ol === '1'; save(); renderAll()
  })
  root.querySelectorAll('[data-color]').forEach((row) => {
    const path = row.dataset.color
    const set = (v) => { push(); const [g, k] = path.split('.'); l[g][k] = v; save(); renderAll() }
    row.querySelectorAll('[data-role]').forEach((b) => b.onclick = () => set(b.dataset.role))
    row.querySelector('input[type=color]').onchange = (e) => set(e.target.value)
  })
  const c = root.querySelector('#ptCorner')
  if (c) c.onclick = () => { push(); l.pts[selPt].c = !l.pts[selPt].c; save(); renderAll() }
  const d = root.querySelector('#ptDel')
  if (d) d.onclick = () => {
    if (l.pts.length <= 3) return toast('至少要留三個點')
    push(); l.pts.splice(selPt, 1); selPt = 0; save(); renderAll()
  }
}

/* ── 動畫 ── */
function drawAnim() {
  const p = $('#tab-anim')
  const l = selLayer()
  if (!l) { p.innerHTML = '<p class="note" style="margin:0">先選一個圖層——動畫是掛在圖層上的。</p>'; return }
  let h = `<h2>${escape_(l.name)} 的動畫</h2><div class="chips">` +
    Object.entries(ANIMS).map(([k, a]) => `<button data-anim="${k}" class="${l.anim === k ? 'on' : ''}">${a.n}</button>`).join('') +
    '</div>'
  const def = ANIMS[l.anim]
  if (def && def.params.length) {
    h += '<div class="divider"></div>'
    l.animP = l.animP || {}
    l.animP[l.anim] = l.animP[l.anim] || {}
    const store = l.animP[l.anim]
    for (const pr of def.params) {
      const v = store[pr.k] ?? pr.def
      h += slider(pr.label, v, pr.min, pr.max, pr.step, (x) => (store[pr.k] = x), pr.unit)
    }
  }
  h += `<p class="note">動畫是<b>一層一個</b>。要讓幾個零件一起動（例如身體＋眼睛），就把它們都設成同一種動畫與同樣的參數。<br>
    底下的時間軸可以把動畫<b>凍在任何一毫秒</b>——「某一格不對」用眼睛看循環是抓不到的。</p>`
  p.innerHTML = h
  p.querySelectorAll('[data-anim]').forEach((b) => b.onclick = () => {
    push(); l.anim = b.dataset.anim; save(); renderAll()
  })
}

/* ── 配色 ── */
function drawColor() {
  const p = $('#tab-color')
  const o = doc.outline || (doc.outline = { mode: 'auto', color: 'ink', w: 7 })
  let h = `<h2>整體外框</h2>
    <div class="field"><label>模式</label><div class="seg" id="olMode">
      ${[['auto', '自動'], ['on', '全部有'], ['off', '全部無']].map(([k, n]) =>
        `<button data-m="${k}" class="${o.mode === k ? 'on' : ''}">${n}</button>`).join('')}
    </div></div>
    <p class="note"><b>自動</b>＝尊重每一層自己的設定（在「屬性」裡調）。<b>全部有／無</b>會蓋過去，用來快速比較兩種風格。</p>`
  h += slider('外框粗細', o.w, 0, 20, .5, (v) => (doc.outline.w = v))
  h += roleRow('外框顏色', o.color, 'outline.color').replace('data-color="outline.color"', 'data-color="outline.color" data-top="1"')
  h += `<div class="divider"></div><h2>配色庫 · ${PALETTES.length} 組</h2><div class="palGrid">` +
    PALETTES.map((pa, i) => `<div class="palCard${i === doc.pal ? ' on' : ''}" data-pal="${i}">
      <div class="sws"><i style="background:${pa.a}"></i><i style="background:${pa.b}"></i><i style="background:${pa.c}"></i><i style="background:${pa.ink}"></i></div>
      <small>${pa.n}</small></div>`).join('') + '</div>'
  h += '<p class="note">圖層存的是<b>角色</b>（主亮／主暗／副色／輪廓）而不是色碼，所以換一組配色，整張圖跟著變。</p>'
  p.innerHTML = h
  p.querySelectorAll('#olMode button').forEach((b) => b.onclick = () => { push(); doc.outline.mode = b.dataset.m; save(); renderAll() })
  p.querySelectorAll('[data-pal]').forEach((c) => c.onclick = () => { push(); doc.pal = +c.dataset.pal; save(); renderAll(); toast('換成「' + PALETTES[doc.pal].n + '」') })
  const row = p.querySelector('[data-top]')
  if (row) {
    const set = (v) => { push(); doc.outline.color = v; save(); renderAll() }
    row.querySelectorAll('[data-role]').forEach((b) => b.onclick = () => set(b.dataset.role))
    row.querySelector('input[type=color]').onchange = (e) => set(e.target.value)
  }
}

/* ── 資料庫 ── */
let libTab = 'shape'
function drawLib() {
  const p = $('#tab-lib')
  const thumb = (svg) => svg
  let h = `<div class="chips" style="margin-bottom:10px">
    ${[['shape', `造型 ${SHAPES.length}`], ['ex', `範例 ${EXAMPLES.length}`], ['anim', `動畫 ${Object.keys(ANIMS).length - 1}`]]
      .map(([k, n]) => `<button data-lib="${k}" class="${libTab === k ? 'on' : ''}">${n}</button>`).join('')}
  </div>`

  if (libTab === 'shape') {
    h += '<div class="gridLib">' + SHAPES.map((s, i) => {
      const preview = docToSVG({ ...blankDoc(), pal: doc.pal, outline: { mode: 'auto', color: 'ink', w: 5 },
        layers: [{ id: 'x', type: s.k, visible: true, fill: { type: 'solid', color: 'a' },
          stroke: s.k === 'line' ? { color: 'ink', w: 8 } : null, outline: s.k !== 'line', ...s.o }] },
        { size: 34, animate: false })
      return `<button data-shape="${i}" title="${s.n}">${thumb(preview)}<span>${s.n}</span></button>`
    }).join('') + '</div><p class="note">點一下就放進畫布，接著用控制點改成你要的樣子。</p>'
  } else if (libTab === 'ex') {
    h += '<div class="gridLib ex">' + EXAMPLES.map((e, i) =>
      `<button data-ex="${i}" title="${e.n || e.meta.name}">${docToSVG(e, { size: 36, animate: false })}<span>${e.meta.name}</span></button>`
    ).join('') + '</div><p class="note">⚠ 開範例會<b>蓋掉目前的設計</b>。先「匯出 → 設計檔」存一份再開。</p>'
  } else {
    h += '<div class="chips">' + Object.entries(ANIMS).filter(([k]) => k !== 'none').map(([k, a]) =>
      `<button data-useanim="${k}">${a.n}</button>`).join('') + '</div>' +
      '<p class="note">點一下套到<b>目前選中的圖層</b>上，然後到「動畫」分頁調參數。</p>'
  }
  p.innerHTML = h
  p.querySelectorAll('[data-lib]').forEach((b) => b.onclick = () => { libTab = b.dataset.lib; drawLib() })
  p.querySelectorAll('[data-shape]').forEach((b) => b.onclick = () => {
    const s = SHAPES[+b.dataset.shape]
    addLayer(s.k, clone(s.o))
  })
  p.querySelectorAll('[data-ex]').forEach((b) => b.onclick = () => {
    if (!confirm('開這個範例會蓋掉目前的設計，確定嗎？')) return
    push(); doc = clone(EXAMPLES[+b.dataset.ex]); fixSel(); selId = doc.layers[0]?.id ?? null; save(); renderAll()
    toast('開了「' + doc.meta.name + '」')
  })
  p.querySelectorAll('[data-useanim]').forEach((b) => b.onclick = () => {
    const l = selLayer(); if (!l) return toast('先選一個圖層')
    push(); l.anim = b.dataset.useanim; save(); renderAll()
    $('[data-tab="anim"]').click()
  })
}

/* ═════════════ 5. 時間軸 ═════════════ */
function applyScrub() {
  const roots = [stage, ...document.querySelectorAll('#previews svg')]
  for (const root of roots) {
    root.querySelectorAll('*').forEach((n) => {
      if (!n.getAnimations) return
      n.getAnimations().forEach((a) => {
        if (playing) a.play()
        else { a.pause(); try { a.currentTime = scrubMs } catch (e) {} }
      })
    })
  }
}
$('#btnPlay').onclick = (e) => { playing = !playing; e.target.textContent = playing ? '⏸' : '▶'; applyScrub() }
$('#scrub').oninput = (e) => {
  scrubMs = +e.target.value
  $('#tnum').textContent = scrubMs + ' ms'
  if (playing) { playing = false; $('#btnPlay').textContent = '▶' }
  applyScrub()
}
$('#chkHandles').onchange = (e) => { showHandles = e.target.checked; drawStage() }
$('#chkGrid').onchange = (e) => { showGrid = e.target.checked; drawStage() }

/* ═════════════ 6. 工具列 ＋ 鍵盤 ═════════════ */
const TOOLS = [
  { k: 'select', g: '⬚', n: '選取', tip: '點圖形選它；拖控制點改造型。' },
  { k: 'pen', g: '✎', n: '鋼筆', tip: '一點一點放，點回起點收尾。按住 Shift 放的點是尖角。' },
  { k: 'rect', g: '▭', n: '方形', tip: '在畫布上點一下就放一個。' },
  { k: 'ellipse', g: '◯', n: '圓形', tip: '在畫布上點一下就放一個。' },
  { k: 'line', g: '〰', n: '曲線', tip: '放一條可以拉彎的線，適合做勾勾、線條圖示。' },
  { k: 'backdrop', g: '🖼', n: '描圖', tip: '匯入一張圖當底圖，照著描。' },
]
function setTool(k) {
  if (k === 'backdrop') { openImport('image'); return }
  tool = k
  pending = null
  document.querySelectorAll('#tools button').forEach((b) => b.classList.toggle('on', b.dataset.t === k))
  tip(TOOLS.find((t) => t.k === k)?.tip || '')
  drawStage()
}
$('#tools').innerHTML = TOOLS.map((t) =>
  `<button data-t="${t.k}" class="${t.k === tool ? 'on' : ''}" title="${t.tip}"><span class="g">${t.g}</span>${t.n}</button>`).join('')
$('#tools').querySelectorAll('button').forEach((b) => b.onclick = () => setTool(b.dataset.t))
function tip(s) { $('#canvasTip').textContent = s }

document.addEventListener('keydown', (e) => {
  const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName) || document.activeElement?.isContentEditable
  if (typing) return
  const mod = e.ctrlKey || e.metaKey
  if (mod && e.key.toLowerCase() === 'z') { e.shiftKey ? redo() : undo(); e.preventDefault(); return }
  if (mod && e.key.toLowerCase() === 'y') { redo(); e.preventDefault(); return }
  if (mod && e.key.toLowerCase() === 's') { openExport(); e.preventDefault(); return }
  if (e.key === 'Escape') { if (pending) { pending = null; drawStage(); tip('取消了') } ; return }
  if (e.key === 'Enter' && pending) { finishPen(); return }
  if (e.key === '?' || (e.shiftKey && e.key === '/')) { openHelp(); return }
  const T = { v: 'select', p: 'pen', r: 'rect', o: 'ellipse', l: 'line' }
  if (T[e.key.toLowerCase()] && !mod) { setTool(T[e.key.toLowerCase()]); return }
  if (e.key === 'Delete' || e.key === 'Backspace') {
    const l = selLayer(); if (!l) return
    if (l.type === 'path' && l.pts.length > 3) { push(); l.pts.splice(selPt, 1); selPt = 0 }
    else { push(); doc.layers = doc.layers.filter((x) => x.id !== l.id); fixSel() }
    save(); renderAll(); e.preventDefault(); return
  }
  const N = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }
  if (N[e.key]) {
    const l = selLayer(); if (!l || l.locked) return
    const step = e.shiftKey ? 5 : 0.5
    const [dx, dy] = N[e.key]
    push()
    if (e.altKey) {            // Alt＝整層移動，不是只動一個點
      const mv = (kx, ky) => { l[kx] = (l[kx] ?? 0) + dx * step; l[ky] = (l[ky] ?? 0) + dy * step }
      if (l.type === 'path') l.pts.forEach((p) => { p.x += dx * step; p.y += dy * step })
      else if (l.type === 'line') { mv('x1', 'y1'); mv('cx', 'cy'); mv('x2', 'y2') }
      else mv('x', 'y')
    } else {
      const hs = handles(); const h = hs[selPt]
      if (h) dragTo(selPt, { x: h.x + dx * step, y: h.y + dy * step }, false)
    }
    save(); renderAll(); e.preventDefault()
  }
})

/* ═════════════ 7. 匯入 / 匯出 / 說明 / 版本 ═════════════ */
const dlg = $('#dlg')
function openDlg(title, html) {
  $('#dlgTitle').textContent = title
  $('#dlgBody').innerHTML = html
  if (!dlg.open) dlg.showModal()
}
$('#dlgX').onclick = () => dlg.close()

/* ── 匯入 ── */
function openImport(forceKind) {
  openDlg('匯入', `
    <div class="dropzone" id="dz">
      把檔案拖進來，或<b>點一下選檔</b><br>
      <small style="color:var(--ink-faint)">SVG → 拆成圖層 ｜ JPG／PNG／GIF／WebP → 當描圖底圖 ｜ JSON → 開啟設計檔</small>
    </div>
    ${doc.backdrop ? `
      <div class="divider"></div><h3>目前的描圖底圖</h3>
      <div class="field"><label>透明度</label><input id="bdOp" type="range" min="5" max="100" value="${Math.round((doc.backdrop.opacity ?? .5) * 100)}"><span class="v">${Math.round((doc.backdrop.opacity ?? .5) * 100)}%</span></div>
      <div class="field"><label>縮放</label><input id="bdSc" type="range" min="10" max="220" value="${Math.round(doc.backdrop.w / doc.meta.w * 100)}"><span class="v">${Math.round(doc.backdrop.w / doc.meta.w * 100)}%</span></div>
      <div class="field"><label>水平</label><input id="bdX" type="range" min="-60" max="60" value="${Math.round(doc.backdrop.x)}"><span class="v">${Math.round(doc.backdrop.x)}</span></div>
      <div class="field"><label>垂直</label><input id="bdY" type="range" min="-60" max="60" value="${Math.round(doc.backdrop.y)}"><span class="v">${Math.round(doc.backdrop.y)}</span></div>
      <button class="btn danger" id="bdDel">移除底圖</button>
      <p class="note">底圖只是給你照著描用的，<b>匯出時不會跟著走</b>。</p>` : ''}
  `)
  const dz = $('#dz')
  dz.onclick = () => $('#fileAny').click()
  ;['dragenter', 'dragover'].forEach((t) => dz.addEventListener(t, (e) => { e.preventDefault(); dz.classList.add('hot') }))
  ;['dragleave', 'drop'].forEach((t) => dz.addEventListener(t, (e) => { e.preventDefault(); dz.classList.remove('hot') }))
  dz.addEventListener('drop', (e) => { const f = e.dataTransfer.files[0]; if (f) readFile(f) })

  const bd = doc.backdrop
  if (bd) {
    const live = (id, fn, unit = '') => {
      const e = $(id); if (!e) return
      e.oninput = () => { fn(+e.value); e.nextElementSibling.textContent = e.value + unit; drawStage() }
      e.onchange = save
    }
    live('#bdOp', (v) => (bd.opacity = v / 100), '%')
    live('#bdSc', (v) => { const k = v / 100; bd.w = doc.meta.w * k; bd.h = bd.w / (bd.ratio || 1) }, '%')
    live('#bdX', (v) => (bd.x = v))
    live('#bdY', (v) => (bd.y = v))
    $('#bdDel').onclick = () => { push(); doc.backdrop = null; save(); renderAll(); dlg.close(); toast('移除了底圖') }
  }
  if (forceKind === 'image') setTimeout(() => $('#fileAny').click(), 0)
}

$('#fileAny').onchange = (e) => { const f = e.target.files[0]; if (f) readFile(f); e.target.value = '' }

function readFile(file) {
  const name = file.name.toLowerCase()
  const r = new FileReader()
  if (name.endsWith('.json')) {
    r.onload = () => {
      try {
        const d = JSON.parse(r.result)
        if (!d.layers || !d.meta) throw new Error('格式不對')
        push(); doc = d; doc.meta.w ||= 120; doc.meta.h ||= 120; fixSel()
        save(); renderAll(); dlg.close(); toast('開了「' + doc.meta.name + '」')
      } catch (err) { toast('這個設計檔讀不懂：' + err.message) }
    }
    r.readAsText(file)
  } else if (name.endsWith('.svg')) {
    r.onload = () => {
      try {
        const { layers, skipped, count } = svgToLayers(r.result)
        if (!count) return toast('這個 SVG 裡沒有認得出來的圖形')
        push()
        doc.layers = doc.layers.concat(layers)
        selId = layers[0].id; selPt = 0
        save(); renderAll(); dlg.close()
        toast(`匯入 ${count} 個圖形` + (skipped.length ? `（略過：${skipped.join('、')}）` : ''))
      } catch (err) { toast(err.message) }
    }
    r.readAsText(file)
  } else if (file.type.startsWith('image/')) {
    r.onload = () => {
      const img = new Image()
      img.onload = () => {
        const ratio = img.width / img.height
        const w = ratio >= 1 ? doc.meta.w : doc.meta.h * ratio
        const h = ratio >= 1 ? doc.meta.w / ratio : doc.meta.h
        push()
        doc.backdrop = { src: r.result, ratio, x: (doc.meta.w - w) / 2, y: (doc.meta.h - h) / 2, w, h, opacity: .5, visible: true }
        save(); renderAll(); dlg.close()
        setTool('pen')
        toast('底圖放好了——用鋼筆照著描')
      }
      img.onerror = () => toast('這張圖讀不進來')
      img.src = r.result
    }
    r.readAsDataURL(file)
  } else {
    toast('不認得這種檔案（支援 SVG、JSON、以及常見圖片格式）')
  }
}

/* ── 匯出 ── */
let expKind = 'svg'
function openExport() {
  const f = FORMATS[expKind]
  const body = expKind === 'png'
    ? '<p>PNG 是圖檔，沒有原始碼可以預覽。選好尺寸按「下載」。</p>'
    : `<textarea readonly spellcheck="false">${escape_(f.fn(doc))}</textarea>`
  openDlg('匯出', `
    <div class="expTabs">${Object.entries(FORMATS).map(([k, v]) =>
      `<button data-f="${k}" class="${k === expKind ? 'on' : ''}">${v.label}</button>`).join('')}</div>
    <div id="expBody">${body}</div>
    <div class="field" style="margin-top:10px">
      <button class="btn pri" id="expCopy" ${expKind === 'png' ? 'disabled' : ''}>複製</button>
      <button class="btn" id="expDl">下載</button>
      ${expKind === 'png' ? '<select id="pngPx" class="btn" style="flex:none"><option>128</option><option>256</option><option selected>512</option><option>1024</option></select>' : ''}
      <span class="sp" style="flex:1"></span>
    </div>
    <p class="note">${f.note}</p>
  `)
  $('#dlgBody').querySelectorAll('[data-f]').forEach((b) => b.onclick = () => { expKind = b.dataset.f; openExport() })
  $('#expCopy').onclick = async () => {
    const t = FORMATS[expKind].fn(doc)
    try { await navigator.clipboard.writeText(t) } catch (e) { $('#dlgBody textarea')?.select(); document.execCommand('copy') }
    toast('複製好了')
  }
  $('#expDl').onclick = async () => {
    const fmt = FORMATS[expKind]
    const base = safeName(doc.meta.name)
    if (expKind === 'png') {
      try {
        const px = +$('#pngPx').value
        download(await exportPNG(doc, px), `${base}-${px}.png`)
        toast(`下載了 ${base}-${px}.png`)
      } catch (e) { toast('轉檔失敗：' + e.message) }
      return
    }
    download(new Blob([fmt.fn(doc)], { type: fmt.mime + ';charset=utf-8' }), `${base}.${fmt.ext}`)
    toast(`下載了 ${base}.${fmt.ext}`)
  }
}
function download(blob, name) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob); a.download = name; a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 2000)
}

/* ── 說明 ── */
function openHelp() {
  openDlg('說明', `
    <h3>三步做出一個動態 icon</h3>
    <ul>
      <li><b>畫</b>：左邊選工具，在畫布上畫。或到「資料庫 → 造型」拿一個現成的來改。</li>
      <li><b>調</b>：選一個圖層 → 右邊「屬性」改顏色與形狀，「動畫」給它一種動法。</li>
      <li><b>匯出</b>：右上「匯出」，挑格式，複製或下載。</li>
    </ul>
    <h3>從一張圖開始描</h3>
    <p>工具列最後一個「描圖」可以匯入 JPG／PNG／GIF，圖會鋪在畫布底下。
    用鋼筆照著描，描完到「匯入」面板把底圖移掉就好。<b>底圖不會被匯出。</b></p>
    <h3>鍵盤</h3>
    <table>
      <tr><td><kbd>V</kbd> <kbd>P</kbd> <kbd>R</kbd> <kbd>O</kbd> <kbd>L</kbd></td><td>選取／鋼筆／方形／圓形／曲線</td></tr>
      <tr><td><kbd>↑</kbd><kbd>↓</kbd><kbd>←</kbd><kbd>→</kbd></td><td>微調 0.5（<kbd>Shift</kbd> 跳 5、<kbd>Alt</kbd> 移動整層）</td></tr>
      <tr><td>拖曳時按 <kbd>Shift</kbd></td><td>吸附到整數格</td></tr>
      <tr><td><kbd>雙擊輪廓</kbd></td><td>插一個新點</td></tr>
      <tr><td><kbd>Del</kbd></td><td>刪點；路徑只剩三點時改成刪整層</td></tr>
      <tr><td><kbd>Enter</kbd> / <kbd>Esc</kbd></td><td>鋼筆收尾／取消</td></tr>
      <tr><td><kbd>Ctrl</kbd>+<kbd>Z</kbd> / <kbd>Shift</kbd>+<kbd>Ctrl</kbd>+<kbd>Z</kbd></td><td>復原／重做</td></tr>
      <tr><td><kbd>Ctrl</kbd>+<kbd>S</kbd></td><td>開匯出</td></tr>
      <tr><td><kbd>?</kbd></td><td>這份說明</td></tr>
    </table>
    <h3>幾個容易踩的地方</h3>
    <ul>
      <li><b>外框是共用的</b>：所有「要外框」的圖層會連成一圈輪廓，不是各自一圈。眼睛、投幣口這種細節件記得設成「不要外框」。</li>
      <li><b>顏色存的是角色不是色碼</b>：所以換配色時整張圖會一起變。想釘死某個顏色，用色碼選擇器直接指定。</li>
      <li><b>時間軸不是裝飾</b>：動畫的錯常常是「某一格不對」，循環播放用眼睛看抓不到。把它凍在那一毫秒去看。</li>
      <li><b>資料存在你的瀏覽器裡</b>：換裝置或清掉網站資料就沒了。重要的設計請「匯出 → 設計檔」存成 JSON。</li>
    </ul>
  `)
}

/* ── 版本與更新 ── */
async function checkUpdate(manual) {
  const btn = $('#btnVer')
  if (manual) btn.textContent = '檢查中'
  try {
    const r = await fetch('version.json?t=' + Date.now(), { cache: 'no-store' })
    if (!r.ok) throw new Error('查不到')
    const remote = await r.json()
    const newer = cmpVer(remote.version, APP_VERSION) > 0
    btn.textContent = 'v' + APP_VERSION
    btn.classList.toggle('up', newer)
    if (newer) {
      btn.textContent = '有新版'
      if (manual) openVer(remote.version)
      else toast(`有新版 v${remote.version}，點右上更新`)
    } else if (manual) {
      openVer(null)
    }
  } catch (e) {
    btn.textContent = 'v' + APP_VERSION
    if (manual) openVer(undefined)
  }
}
/** 語意化版本比大小。用字串比會讓 1.10.0 < 1.9.0，而那不會報錯、只會永遠說已是最新。 */
function cmpVer(a, b) {
  const pa = String(a).split('.').map(Number), pb = String(b).split('.').map(Number)
  for (let i = 0; i < 3; i++) { const d = (pa[i] || 0) - (pb[i] || 0); if (d) return d }
  return 0
}
function openVer(remote) {
  const status = remote === undefined
    ? '<p style="color:var(--warn)">這次沒問到——可能是離線，或這是用 file:// 開的。連上網路後再試一次。</p>'
    : remote
      ? `<p style="color:var(--ok)"><b>有新版 v${remote}</b>。按下面的按鈕換過去並重新載入。</p>
         <button class="btn pri" id="doUpd">立即更新並重新載入</button>`
      : '<p style="color:var(--ok)">已經是最新版了。</p>'
  openDlg('版本與更新', `
    <p style="font-size:26px;font-weight:700;color:var(--ink);margin:0">v${APP_VERSION}</p>
    <p>${BUILD_DATE} 發布</p>
    <div class="field"><button class="btn" id="reCheck">再檢查一次</button></div>
    ${status}
    <div class="divider"></div>
    <h3>更新紀錄</h3>
    ${CHANGELOG.map((c) => `
      <p style="color:var(--ink);font-weight:600;margin-top:12px">v${c.v} · ${c.t} <span style="font-weight:400;color:var(--ink-faint)">${c.d}</span></p>
      <ul>${c.items.map((i) => `<li><b>${{ add: '新增', fix: '修正', tweak: '調整', remove: '移除' }[i.k] || i.k}</b>　${escape_(i.t)}</li>`).join('')}</ul>
    `).join('')}
  `)
  $('#reCheck').onclick = () => checkUpdate(true)
  const u = $('#doUpd')
  if (u) u.onclick = async () => {
    try {
      const rs = await navigator.serviceWorker?.getRegistrations?.() || []
      await Promise.all(rs.map((r) => r.unregister()))
      const ks = await caches?.keys?.() || []
      await Promise.all(ks.map((k) => caches.delete(k)))
    } catch (e) {}
    location.reload()
  }
}

/* ── 頂列 ── */
$('#btnNew').onclick = () => {
  if (doc.layers.length && !confirm('新建會清掉目前的設計，確定嗎？')) return
  push(); doc = blankDoc('未命名'); doc.pal = 0; selId = null; save(); renderAll(); setTool('pen')
  toast('空白畫布——先畫一筆看看')
}
$('#btnOpen').onclick = () => $('#fileAny').click()
$('#btnImport').onclick = () => openImport()
$('#btnExport').onclick = () => openExport()
$('#btnUndo').onclick = undo
$('#btnRedo').onclick = redo
$('#btnHelp').onclick = openHelp
$('#btnVer').onclick = () => checkUpdate(true)
$('#btnTheme').onclick = () => {
  const r = document.documentElement
  const next = r.dataset.theme === 'dark' ? 'light' : 'dark'
  r.dataset.theme = next
  try { localStorage.setItem('icon-studio.theme', next) } catch (e) {}
}
$('#menuBtn').onclick = () => { document.body.classList.toggle('compact') }
$('#docName').onchange = (e) => { push(); doc.meta.name = e.target.value || '未命名'; save() }
$('#layAdd').onclick = () => { libTab = 'shape'; $('[data-tab="lib"]').click(); drawLib() }
$('#layDup').onclick = () => {
  const l = selLayer(); if (!l) return toast('先選一個圖層')
  push()
  const c = clone(l); c.id = uid(); c.name = l.name + ' 複本'
  doc.layers.splice(doc.layers.indexOf(l) + 1, 0, c)
  selId = c.id; save(); renderAll(); toast('複製好了')
}
$('#layDel').onclick = () => {
  const l = selLayer(); if (!l) return
  push(); doc.layers = doc.layers.filter((x) => x.id !== l.id); fixSel(); save(); renderAll()
}
document.querySelectorAll('#tabs button').forEach((b) => b.onclick = () => {
  document.querySelectorAll('#tabs button').forEach((x) => x.classList.toggle('on', x === b))
  document.querySelectorAll('.tabpane').forEach((p) => p.classList.toggle('on', p.id === 'tab-' + b.dataset.tab))
})

/* ── 小工具 ── */
let toastT
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('on')
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 2200)
}
function escape_(s) { return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])) }

/* ═════════════ 啟動 ═════════════ */
try { const t = localStorage.getItem('icon-studio.theme'); if (t) document.documentElement.dataset.theme = t } catch (e) {}
$('#btnVer').textContent = 'v' + APP_VERSION
fixSel()
renderAll()
syncUndo()
setTool('select')

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('sw.js').catch(() => {})
  checkUpdate(false)
}

// 給 e2e 檢查用的把手——不是公開 API，只是讓自動化測試問得到內部狀態
window.__studio = {
  get doc() { return doc },
  get tool() { return tool },
  setTool, addLayer, openExport, openHelp, renderAll,
  fmt: (k) => FORMATS[k].fn(doc),
}

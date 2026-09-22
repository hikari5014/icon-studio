/**
 * 四個內建資料庫：配色、造型、動畫、範例。
 *
 * 全部是純資料、沒有相依，所以可以直接被匯出程式碼引用，也方便之後換成
 * 從檔案載入的外掛。分開放這個檔的理由是：這些東西會一直長，
 * 而它們長大時不應該讓編輯器的程式碼跟著變難讀。
 */

/* ══════════════════════════════════════════════════════════════════
   1. 配色庫 —— 50 組
   每組四個角色：深色輪廓 ink、主色 a（亮）、主色 b（暗）、副色 c。
   為什麼是「四個角色」而不是「一堆色票」：icon 在 24px 下只剩得下
   三到四塊顏色，給再多也只是讓人選不完。
   ══════════════════════════════════════════════════════════════════ */
export const PALETTES = [
  { n: '黃金存錢筒', ink: '#46293E', a: '#FFEA90', b: '#EEB329', c: '#F98D60' },
  { n: '和紙抹茶',   ink: '#3A3A38', a: '#A8C2A3', b: '#7C9A78', c: '#C77B58' },
  { n: '赤陶窯燒',   ink: '#42302A', a: '#F2C9A8', b: '#C77B58', c: '#8C5A3C' },
  { n: '靛藍夜航',   ink: '#1E2749', a: '#8FB8E8', b: '#3A5FA8', c: '#F0B62E' },
  { n: '森林苔蘚',   ink: '#26322A', a: '#9FCB8F', b: '#4E7A4A', c: '#D9A441' },
  { n: '珊瑚礁',     ink: '#3B2434', a: '#FFC2AE', b: '#F4785C', c: '#3FB8AF' },
  { n: '薰衣草田',   ink: '#332B45', a: '#D9CCEF', b: '#8E7AC7', c: '#F2C14E' },
  { n: '櫻花初綻',   ink: '#4A2C38', a: '#FFD9E2', b: '#F09AB4', c: '#7FBF9E' },
  { n: '深海潛行',   ink: '#0F2231', a: '#6FD3E0', b: '#1B6E8C', c: '#F5A65B' },
  { n: '沙漠黃昏',   ink: '#3D2A2A', a: '#FFD9A0', b: '#E08B4C', c: '#8C5A8C' },
  { n: '北歐極簡',   ink: '#2E3338', a: '#E8EBED', b: '#AFB8BF', c: '#E86A4B' },
  { n: '檸檬蘇打',   ink: '#33401E', a: '#F5F7A8', b: '#C9D64B', c: '#5BC8D6' },
  { n: '莓果優格',   ink: '#3D2233', a: '#F7D5E4', b: '#C4547F', c: '#F0C24B' },
  { n: '薄荷氣泡',   ink: '#20352F', a: '#C9F2E2', b: '#5CBF9E', c: '#F5896A' },
  { n: '炭燒焦糖',   ink: '#2B2320', a: '#E8C79A', b: '#A87340', c: '#5F8C6E' },
  { n: '夕燒橘',     ink: '#3E2320', a: '#FFC98A', b: '#F07A3C', c: '#6B5BA8' },
  { n: '青瓷',       ink: '#2A3733', a: '#CFE5DC', b: '#7FAEA0', c: '#D4A05A' },
  { n: '紅絲絨',     ink: '#33161C', a: '#F2A3A3', b: '#B02E3F', c: '#E8D5A8' },
  { n: '午夜霓虹',   ink: '#12121F', a: '#9B8AFF', b: '#5B3FD9', c: '#3FE0C8' },
  { n: '奶油香草',   ink: '#3D3527', a: '#FFF3D4', b: '#E0C489', c: '#B0845A' },
  { n: '孔雀藍',     ink: '#12292E', a: '#7FD9D2', b: '#1E7A80', c: '#E8A33D' },
  { n: '楓糖秋色',   ink: '#3A251C', a: '#F5C28A', b: '#C96A2E', c: '#7A8C4A' },
  { n: '石墨',       ink: '#1C1C1E', a: '#C8C9CC', b: '#6E7073', c: '#4C9AE8' },
  { n: '葡萄酒',     ink: '#2B1524', a: '#D9A8C4', b: '#7A2E52', c: '#D4A05A' },
  { n: '草莓牛奶',   ink: '#42262E', a: '#FFE0E4', b: '#F58598', c: '#8ACBB0' },
  { n: '橄欖油',     ink: '#2E3021', a: '#DDE0A8', b: '#8C9440', c: '#D4744A' },
  { n: '天空藍',     ink: '#22303D', a: '#BFE3F5', b: '#5BA8D6', c: '#F5C84B' },
  { n: '暖灰',       ink: '#33302C', a: '#E5DFD6', b: '#A89E90', c: '#C46B4A' },
  { n: '螢光檸檬',   ink: '#1F2411', a: '#F0FF8A', b: '#B8D119', c: '#FF6B4A' },
  { n: '桃子冰茶',   ink: '#3D2A24', a: '#FFD4B8', b: '#F0946B', c: '#A8C46B' },
  { n: '寶石綠',     ink: '#0F2620', a: '#7FE0B0', b: '#1F8058', c: '#F0C24B' },
  { n: '陶土磚',     ink: '#382420', a: '#E8B49A', b: '#B0553D', c: '#4A7A8C' },
  { n: '冰川',       ink: '#1F2E33', a: '#DCF0F2', b: '#8FBCC4', c: '#E07A5F' },
  { n: '芥末黃',     ink: '#33290F', a: '#F5DC8A', b: '#C9A227', c: '#5B7A8C' },
  { n: '玫瑰金',     ink: '#3B2A2A', a: '#FFDCD0', b: '#D99A85', c: '#8C7355' },
  { n: '深紫羅蘭',   ink: '#1C1226', a: '#C4A8E8', b: '#6B3FA0', c: '#F0A33D' },
  { n: '抹茶拿鐵',   ink: '#2E3325', a: '#DCE8C4', b: '#9AB073', c: '#C48A5B' },
  { n: '柑橘',       ink: '#3D2A14', a: '#FFD98A', b: '#F0A020', c: '#4AA88C' },
  { n: '水泥灰',     ink: '#26282B', a: '#D4D6D9', b: '#8A8E94', c: '#D9A441' },
  { n: '海軍藍',     ink: '#141E33', a: '#A8BCE0', b: '#2E4A80', c: '#E8944A' },
  { n: '粉筆',       ink: '#2E2E33', a: '#F5F2EA', b: '#C9C4B8', c: '#E07A5F' },
  { n: '火山岩',     ink: '#1A1618', a: '#B8A8A0', b: '#6B5A55', c: '#E04A2E' },
  { n: '春日新芽',   ink: '#23331F', a: '#D4F0A8', b: '#7AB84A', c: '#F0B62E' },
  { n: '琥珀',       ink: '#33210F', a: '#FFD98F', b: '#D18E1F', c: '#8C5540' },
  { n: '暮光紫',     ink: '#241C33', a: '#B8A8D9', b: '#5F4A8C', c: '#F09A6B' },
  { n: '青檸',       ink: '#1F3322', a: '#C4F0B8', b: '#5BA84A', c: '#F5D44B' },
  { n: '奶茶',       ink: '#332A24', a: '#E8D4BC', b: '#B0916E', c: '#7A9E8C' },
  { n: '寶藍',       ink: '#0F1F3D', a: '#8FB0E8', b: '#2E52A8', c: '#F0C24B' },
  { n: '緋紅',       ink: '#331419', a: '#F5A8A8', b: '#C4283D', c: '#E0C088' },
  { n: '單色黑白',   ink: '#1A1A1A', a: '#FFFFFF', b: '#BFBFBF', c: '#7A7A7A' },
]

/* ══════════════════════════════════════════════════════════════════
   2. 造型庫 —— 可以直接丟進畫布的基本形
   pts 是錨點（c:true＝尖角）；編輯器會用同一套平滑演算法畫出來。
   ══════════════════════════════════════════════════════════════════ */
const poly = (n, r, cx = 60, cy = 60, rot = -90) =>
  Array.from({ length: n }, (_, i) => {
    const a = ((rot + (360 / n) * i) * Math.PI) / 180
    return { x: +(cx + r * Math.cos(a)).toFixed(1), y: +(cy + r * Math.sin(a)).toFixed(1), c: true }
  })

const starPts = (n, r1, r2, cx = 60, cy = 60) =>
  Array.from({ length: n * 2 }, (_, i) => {
    const r = i % 2 ? r2 : r1
    const a = ((-90 + (180 / n) * i) * Math.PI) / 180
    return { x: +(cx + r * Math.cos(a)).toFixed(1), y: +(cy + r * Math.sin(a)).toFixed(1), c: true }
  })

export const SHAPES = [
  { n: '圓', k: 'ellipse', o: { x: 60, y: 60, w: 76, h: 76 } },
  { n: '橢圓', k: 'ellipse', o: { x: 60, y: 60, w: 88, h: 60 } },
  { n: '方形', k: 'rect', o: { x: 60, y: 60, w: 74, h: 74, r: 6 } },
  { n: '圓角方', k: 'rect', o: { x: 60, y: 60, w: 74, h: 74, r: 20 } },
  { n: '膠囊', k: 'rect', o: { x: 60, y: 60, w: 88, h: 44, r: 22 } },
  { n: '三角', k: 'path', o: { pts: poly(3, 42) } },
  { n: '菱形', k: 'path', o: { pts: poly(4, 44) } },
  { n: '五邊形', k: 'path', o: { pts: poly(5, 42) } },
  { n: '六邊形', k: 'path', o: { pts: poly(6, 42) } },
  { n: '八邊形', k: 'path', o: { pts: poly(8, 42) } },
  { n: '五角星', k: 'path', o: { pts: starPts(5, 46, 20) } },
  { n: '四角星', k: 'path', o: { pts: starPts(4, 46, 14) } },
  { n: '六角星', k: 'path', o: { pts: starPts(6, 44, 22) } },
  { n: '愛心', k: 'path', o: { pts: [
    { x: 60, y: 94, c: true }, { x: 22, y: 62 }, { x: 22, y: 34 }, { x: 44, y: 28 },
    { x: 60, y: 44, c: true }, { x: 76, y: 28 }, { x: 98, y: 34 }, { x: 98, y: 62 },
  ] } },
  { n: '水滴', k: 'path', o: { pts: [
    { x: 60, y: 18, c: true }, { x: 92, y: 60 }, { x: 88, y: 92 }, { x: 60, y: 100 },
    { x: 32, y: 92 }, { x: 28, y: 60 },
  ] } },
  { n: '雲', k: 'path', o: { pts: [
    { x: 26, y: 76 }, { x: 22, y: 56 }, { x: 40, y: 46 }, { x: 52, y: 32 },
    { x: 74, y: 34 }, { x: 84, y: 48 }, { x: 98, y: 58 }, { x: 94, y: 76 },
  ] } },
  { n: '盾牌', k: 'path', o: { pts: [
    { x: 60, y: 16, c: true }, { x: 98, y: 30, c: true }, { x: 94, y: 70 },
    { x: 60, y: 104, c: true }, { x: 26, y: 70 }, { x: 22, y: 30, c: true },
  ] } },
  { n: '對話框', k: 'path', o: { pts: [
    { x: 24, y: 28 }, { x: 96, y: 28 }, { x: 96, y: 78 }, { x: 56, y: 78 },
    { x: 38, y: 96, c: true }, { x: 40, y: 78 }, { x: 24, y: 78 },
  ] } },
  { n: '箭頭', k: 'path', o: { pts: [
    { x: 20, y: 50, c: true }, { x: 66, y: 50, c: true }, { x: 66, y: 30, c: true },
    { x: 100, y: 60, c: true }, { x: 66, y: 90, c: true }, { x: 66, y: 70, c: true }, { x: 20, y: 70, c: true },
  ] } },
  { n: '線', k: 'line', o: { x1: 24, y1: 60, cx: 60, cy: 40, x2: 96, y2: 60 } },
]

/* ══════════════════════════════════════════════════════════════════
   3. 動畫庫
   每一筆＝一個 class 名 ＋ 一段 keyframes 產生器（吃參數）。
   為什麼是產生器而不是寫死的字串：幅度與速度一定要可調，
   而「可調」如果要靠使用者自己改 CSS，那這個工具就沒有存在的意義。
   ══════════════════════════════════════════════════════════════════ */
const P = (k, label, def, min, max, step = 1, unit = '') => ({ k, label, def, min, max, step, unit })

export const ANIMS = {
  none:  { n: '不動', params: [], css: () => '' },

  spin:  { n: '旋轉', params: [P('dur', '一圈', 1200, 200, 5000, 50, 'ms')],
    css: (a, p) => `.${a}{animation:is-spin ${p.dur}ms linear infinite;transform-box:fill-box;transform-origin:50% 50%}
@keyframes is-spin{to{transform:rotate(360deg)}}` },

  pulse: { n: '呼吸', params: [P('dur', '一圈', 1600, 200, 5000, 50, 'ms'), P('amt', '幅度', 12, 1, 60, 1, '%')],
    css: (a, p) => `.${a}{animation:is-pulse-${a} ${p.dur}ms ease-in-out infinite;transform-box:fill-box;transform-origin:50% 50%}
@keyframes is-pulse-${a}{0%,100%{transform:scale(1)}50%{transform:scale(${(1 + p.amt / 100).toFixed(3)})}}` },

  bounce: { n: '彈跳', params: [P('dur', '一圈', 900, 200, 4000, 50, 'ms'), P('h', '高度', 12, 1, 50)],
    css: (a, p) => `.${a}{animation:is-bounce-${a} ${p.dur}ms cubic-bezier(.3,0,.2,1) infinite}
@keyframes is-bounce-${a}{0%,55%,100%{transform:translateY(0)}25%{transform:translateY(-${p.h}px)}40%{transform:translateY(-${(p.h * .28).toFixed(1)}px)}}` },

  float: { n: '漂浮', params: [P('dur', '一圈', 2600, 400, 8000, 100, 'ms'), P('h', '幅度', 6, 1, 30)],
    css: (a, p) => `.${a}{animation:is-float-${a} ${p.dur}ms ease-in-out infinite}
@keyframes is-float-${a}{0%,100%{transform:translateY(0)}50%{transform:translateY(-${p.h}px)}}` },

  wiggle: { n: '搖擺', params: [P('dur', '一圈', 1000, 200, 4000, 50, 'ms'), P('deg', '角度', 8, 1, 45, 1, '°')],
    css: (a, p) => `.${a}{animation:is-wiggle-${a} ${p.dur}ms ease-in-out infinite;transform-box:fill-box;transform-origin:50% 90%}
@keyframes is-wiggle-${a}{0%,100%{transform:rotate(-${p.deg}deg)}50%{transform:rotate(${p.deg}deg)}}` },

  shake: { n: '震動', params: [P('dur', '一圈', 500, 100, 2000, 20, 'ms'), P('d', '距離', 3, 1, 20, .5)],
    css: (a, p) => `.${a}{animation:is-shake-${a} ${p.dur}ms ease-in-out infinite}
@keyframes is-shake-${a}{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-${p.d}px)}40%,80%{transform:translateX(${p.d}px)}}` },

  pop:   { n: '彈出', params: [P('dur', '一圈', 1400, 300, 5000, 50, 'ms'), P('amt', '幅度', 22, 2, 80, 1, '%')],
    css: (a, p) => `.${a}{animation:is-pop-${a} ${p.dur}ms cubic-bezier(.34,1.56,.64,1) infinite;transform-box:fill-box;transform-origin:50% 50%}
@keyframes is-pop-${a}{0%,60%,100%{transform:scale(1)}30%{transform:scale(${(1 + p.amt / 100).toFixed(3)})}}` },

  squash: { n: '壓扁', params: [P('dur', '一圈', 1200, 200, 5000, 50, 'ms'), P('amt', '幅度', 10, 1, 40, 1, '%')],
    css: (a, p) => `.${a}{animation:is-squash-${a} ${p.dur}ms cubic-bezier(.34,1.4,.64,1) infinite;transform-box:fill-box;transform-origin:50% 100%}
@keyframes is-squash-${a}{0%,45%,100%{transform:none}55%{transform:scale(${(1 + p.amt / 100).toFixed(3)},${(1 - p.amt / 100 * 1.15).toFixed(3)})}70%{transform:scale(${(1 - p.amt / 400).toFixed(3)},${(1 + p.amt / 250).toFixed(3)})}}` },

  drop:  { n: '落下', params: [P('dur', '一圈', 1600, 300, 6000, 50, 'ms'), P('h', '落差', 58, 10, 140), P('hold', '停頓', 50, 0, 90, 1, '%')],
    css: (a, p) => { const land = Math.max(5, 100 - p.hold - 8)
      return `.${a}{animation:is-drop-${a} ${p.dur}ms cubic-bezier(.45,0,.85,.6) infinite}
@keyframes is-drop-${a}{0%{transform:translateY(-${p.h}px);opacity:0}7%{opacity:1}${land}%{transform:translateY(0);opacity:1}${land + 7}%{transform:translateY(8px);opacity:1}${land + 8}%,100%{transform:translateY(8px);opacity:0}}` } },

  flash: { n: '閃光', params: [P('dur', '一圈', 1600, 200, 6000, 50, 'ms'), P('at', '時機', 47, 0, 95, 1, '%'), P('amt', '強度', 75, 5, 100, 5, '%')],
    css: (a, p) => `.${a}{animation:is-flash-${a} ${p.dur}ms ease-out infinite;opacity:0}
@keyframes is-flash-${a}{0%,${Math.max(0, p.at - 5)}%{opacity:0}${p.at}%{opacity:${(p.amt / 100).toFixed(2)}}${Math.min(99, p.at + 16)}%,100%{opacity:0}}` },

  burst: { n: '爆開', params: [P('dur', '一圈', 1600, 200, 6000, 50, 'ms'), P('at', '時機', 47, 0, 95, 1, '%'), P('amt', '幅度', 135, 105, 260, 5, '%')],
    css: (a, p) => `.${a}{animation:is-burst-${a} ${p.dur}ms ease-out infinite;opacity:0;transform-box:fill-box;transform-origin:50% 50%}
@keyframes is-burst-${a}{0%,${Math.max(0, p.at - 6)}%{opacity:0;transform:scale(.4)}${p.at}%{opacity:1;transform:scale(1)}${Math.min(99, p.at + 15)}%{opacity:0;transform:scale(${(p.amt / 100).toFixed(2)})}${Math.min(100, p.at + 16)}%,100%{opacity:0;transform:scale(.4)}}` },

  stepL: { n: '抬腳（前）', params: [P('dur', '一圈', 720, 150, 3000, 20, 'ms'), P('lift', '抬高', 6, 0, 24, .5), P('slide', '前後', 5, 0, 20, .5)],
    css: (a, p) => `.${a}{animation:is-stepL-${a} ${p.dur}ms ease-in-out infinite}
@keyframes is-stepL-${a}{0%,100%{transform:translate(${(-p.slide * .4).toFixed(1)}px,0)}50%{transform:translate(${p.slide}px,-${p.lift}px)}}` },

  stepR: { n: '抬腳（後）', params: [P('dur', '一圈', 720, 150, 3000, 20, 'ms'), P('lift', '抬高', 6, 0, 24, .5), P('slide', '前後', 5, 0, 20, .5)],
    css: (a, p) => `.${a}{animation:is-stepR-${a} ${p.dur}ms ease-in-out infinite}
@keyframes is-stepR-${a}{0%,100%{transform:translate(${p.slide}px,-${p.lift}px)}50%{transform:translate(${(-p.slide * .4).toFixed(1)}px,0)}}` },

  bob:   { n: '起伏（走路）', params: [P('dur', '一圈', 720, 150, 3000, 20, 'ms'), P('h', '起伏', 5, 0, 20, .5), P('deg', '擺角', 1.8, 0, 12, .2, '°')],
    css: (a, p) => `.${a}{animation:is-bob-${a} ${p.dur}ms ease-in-out infinite;transform-box:fill-box;transform-origin:50% 100%}
@keyframes is-bob-${a}{0%,100%{transform:translateY(0) rotate(-${p.deg}deg)}50%{transform:translateY(-${p.h}px) rotate(${p.deg}deg)}}` },

  twinkle: { n: '閃爍', params: [P('dur', '一圈', 1600, 200, 6000, 50, 'ms'), P('delay', '延遲', 0, 0, 3000, 50, 'ms')],
    css: (a, p) => `.${a}{animation:is-twinkle-${a} ${p.dur}ms ease-in-out ${p.delay}ms infinite;transform-box:fill-box;transform-origin:50% 50%}
@keyframes is-twinkle-${a}{0%,100%{opacity:0;transform:scale(.5)}35%{opacity:1;transform:scale(1)}70%{opacity:0;transform:scale(.6)}}` },

  draw:  { n: '描線', params: [P('dur', '一圈', 2000, 300, 8000, 50, 'ms'), P('len', '線長', 300, 20, 1200, 10)],
    css: (a, p) => `.${a}{stroke-dasharray:${p.len};animation:is-draw-${a} ${p.dur}ms ease-in-out infinite}
@keyframes is-draw-${a}{0%{stroke-dashoffset:${p.len}}55%,100%{stroke-dashoffset:0}}` },

  fade:  { n: '淡入淡出', params: [P('dur', '一圈', 2000, 200, 8000, 50, 'ms'), P('min', '最淡', 20, 0, 90, 5, '%')],
    css: (a, p) => `.${a}{animation:is-fade-${a} ${p.dur}ms ease-in-out infinite}
@keyframes is-fade-${a}{0%,100%{opacity:1}50%{opacity:${(p.min / 100).toFixed(2)}}}` },

  orbit: { n: '繞圈', params: [P('dur', '一圈', 2400, 300, 8000, 50, 'ms'), P('r', '半徑', 8, 1, 40, .5)],
    css: (a, p) => `.${a}{animation:is-orbit-${a} ${p.dur}ms linear infinite}
@keyframes is-orbit-${a}{0%{transform:translate(${p.r}px,0)}25%{transform:translate(0,${p.r}px)}50%{transform:translate(-${p.r}px,0)}75%{transform:translate(0,-${p.r}px)}100%{transform:translate(${p.r}px,0)}}` },
}

/* ══════════════════════════════════════════════════════════════════
   4. 範例庫
   這些是「能直接開始改」的起點，不是裝飾。每一個都刻意只用少少幾層，
   打開就看得懂它是怎麼組起來的。
   ══════════════════════════════════════════════════════════════════ */
const L = (o) => ({ visible: true, locked: false, anim: 'none', animP: {}, ...o })
const solid = (c) => ({ type: 'solid', color: c })
const grad = (a, b) => ({ type: 'grad', a, b, angle: 120 })

/** 造一個最小的文件（給範例與「新建」共用） */
export function blankDoc(name = '未命名') {
  return {
    v: 2,
    meta: { name, w: 120, h: 120 },
    pal: 0,
    outline: { mode: 'auto', color: '#46293E', w: 7 },
    backdrop: null,
    layers: [],
  }
}

/** 產生範例：用配色庫的角色色，換配色時整個範例會跟著變 */
function ex(name, pal, layers) {
  const d = blankDoc(name)
  d.pal = pal
  d.layers = layers
  return d
}

export const EXAMPLES = [
  ex('存錢筒', 0, [
    L({ id: 'l1', name: '身體', type: 'path', fill: grad('a', 'b'), pts: [
      { x: 12, y: 58 }, { x: 14, y: 42 }, { x: 24, y: 33 }, { x: 34.5, y: 20, c: true },
      { x: 45, y: 34, c: true }, { x: 60, y: 24.5 }, { x: 80, y: 25 }, { x: 99, y: 38 },
      { x: 104, y: 56 }, { x: 95, y: 76 }, { x: 72, y: 85 }, { x: 45, y: 87 },
      { x: 26, y: 82 }, { x: 14, y: 70 } ] }),
    L({ id: 'l2', name: '前腳', type: 'rect', fill: solid('c'), x: 36.5, y: 84, w: 17, h: 20, r: 8 }),
    L({ id: 'l3', name: '後腳', type: 'rect', fill: solid('c'), x: 82, y: 84, w: 18, h: 20, r: 8.5 }),
    L({ id: 'l4', name: '投幣口', type: 'rect', fill: solid('ink'), outline: false, x: 67.5, y: 30.5, w: 21, h: 5.6, r: 2.8, rot: -8 }),
    L({ id: 'l5', name: '眼睛', type: 'rect', fill: solid('ink'), outline: false, x: 37.5, y: 47.4, w: 15, h: 5.8, r: 2.9 }),
  ]),
  ex('心', 7, [
    L({ id: 'l1', name: '心', type: 'path', fill: grad('a', 'b'), anim: 'pulse', pts: SHAPES[13].o.pts }),
  ]),
  ex('星星', 0, [
    L({ id: 'l1', name: '星', type: 'path', fill: grad('a', 'b'), anim: 'spin', pts: SHAPES[10].o.pts }),
  ]),
  ex('鈴鐺', 33, [
    L({ id: 'l1', name: '鈴身', type: 'path', fill: grad('a', 'b'), anim: 'wiggle', pts: [
      { x: 30, y: 78 }, { x: 32, y: 48 }, { x: 46, y: 28 }, { x: 60, y: 24, c: true },
      { x: 74, y: 28 }, { x: 88, y: 48 }, { x: 90, y: 78 } ] }),
    L({ id: 'l2', name: '鈴舌', type: 'ellipse', fill: solid('c'), x: 60, y: 92, w: 18, h: 14 }),
  ]),
  ex('雲', 26, [
    L({ id: 'l1', name: '雲', type: 'path', fill: grad('a', 'b'), anim: 'float', pts: SHAPES[15].o.pts }),
  ]),
  ex('水滴', 8, [
    L({ id: 'l1', name: '水滴', type: 'path', fill: grad('a', 'b'), anim: 'bounce', pts: SHAPES[14].o.pts }),
  ]),
  ex('盾牌', 39, [
    L({ id: 'l1', name: '盾', type: 'path', fill: grad('a', 'b'), pts: SHAPES[16].o.pts }),
    L({ id: 'l2', name: '勾', type: 'line', fill: { type: 'none' }, stroke: { color: 'c', w: 9 },
      anim: 'draw', animP: { draw: { dur: 2000, len: 70 } }, x1: 42, y1: 58, cx: 55, cy: 74, x2: 80, y2: 44 }),
  ]),
  ex('對話框', 18, [
    L({ id: 'l1', name: '框', type: 'path', fill: grad('a', 'b'), anim: 'pop', pts: SHAPES[17].o.pts }),
    L({ id: 'l2', name: '點一', type: 'ellipse', fill: solid('ink'), outline: false, anim: 'twinkle', x: 42, y: 53, w: 10, h: 10 }),
    L({ id: 'l3', name: '點二', type: 'ellipse', fill: solid('ink'), outline: false, anim: 'twinkle',
      animP: { twinkle: { dur: 1600, delay: 250 } }, x: 60, y: 53, w: 10, h: 10 }),
    L({ id: 'l4', name: '點三', type: 'ellipse', fill: solid('ink'), outline: false, anim: 'twinkle',
      animP: { twinkle: { dur: 1600, delay: 500 } }, x: 78, y: 53, w: 10, h: 10 }),
  ]),
  ex('太陽', 43, [
    L({ id: 'l1', name: '光芒', type: 'path', fill: solid('b'), anim: 'spin',
      animP: { spin: { dur: 9000 } }, pts: starPts(8, 56, 34) }),
    L({ id: 'l2', name: '日輪', type: 'ellipse', fill: grad('a', 'b'), x: 60, y: 60, w: 52, h: 52 }),
  ]),
  ex('月亮', 34, [
    L({ id: 'l1', name: '月', type: 'path', fill: grad('a', 'b'), anim: 'float', pts: [
      { x: 74, y: 16 }, { x: 40, y: 30 }, { x: 28, y: 60 }, { x: 40, y: 90 },
      { x: 74, y: 104 }, { x: 56, y: 82 }, { x: 52, y: 60 }, { x: 56, y: 38 } ] }),
  ]),
  ex('火焰', 41, [
    L({ id: 'l1', name: '外焰', type: 'path', fill: grad('c', 'b'), anim: 'wiggle',
      animP: { wiggle: { dur: 900, deg: 4 } }, pts: [
      { x: 60, y: 12, c: true }, { x: 88, y: 46 }, { x: 92, y: 74 }, { x: 60, y: 104, c: true },
      { x: 28, y: 74 }, { x: 32, y: 46 } ] }),
    L({ id: 'l2', name: '內焰', type: 'path', fill: solid('a'), outline: false, pts: [
      { x: 60, y: 46, c: true }, { x: 76, y: 68 }, { x: 60, y: 92, c: true }, { x: 44, y: 68 } ] }),
  ]),
  ex('齒輪', 22, [
    L({ id: 'l1', name: '齒', type: 'path', fill: grad('a', 'b'), anim: 'spin', pts: starPts(8, 52, 40) }),
    L({ id: 'l2', name: '孔', type: 'ellipse', fill: solid('ink'), outline: false, anim: 'spin', x: 60, y: 60, w: 26, h: 26 }),
  ]),
  ex('信封', 3, [
    L({ id: 'l1', name: '信封', type: 'rect', fill: grad('a', 'b'), anim: 'pop', x: 60, y: 60, w: 88, h: 62, r: 8 }),
    L({ id: 'l2', name: '封口', type: 'line', fill: { type: 'none' }, stroke: { color: 'ink', w: 7 },
      anim: 'pop', x1: 20, y1: 38, cx: 60, cy: 76, x2: 100, y2: 38 }),
  ]),
  ex('相機', 38, [
    L({ id: 'l1', name: '機身', type: 'rect', fill: grad('a', 'b'), x: 60, y: 66, w: 92, h: 56, r: 12 }),
    L({ id: 'l2', name: '頂蓋', type: 'rect', fill: solid('c'), x: 60, y: 34, w: 40, h: 16, r: 6 }),
    L({ id: 'l3', name: '鏡頭', type: 'ellipse', fill: solid('ink'), anim: 'pulse', x: 60, y: 66, w: 32, h: 32 }),
  ]),
  ex('購物袋', 5, [
    L({ id: 'l1', name: '袋身', type: 'rect', fill: grad('a', 'b'), anim: 'bounce', x: 60, y: 72, w: 74, h: 60, r: 10 }),
    L({ id: 'l2', name: '提把', type: 'line', fill: { type: 'none' }, stroke: { color: 'ink', w: 7 },
      anim: 'bounce', x1: 42, y1: 44, cx: 60, cy: 8, x2: 78, y2: 44 }),
  ]),
  ex('鑰匙', 43, [
    L({ id: 'l1', name: '環', type: 'ellipse', fill: { type: 'none' }, stroke: { color: 'b', w: 12 },
      anim: 'wiggle', x: 40, y: 44, w: 40, h: 40 }),
    L({ id: 'l2', name: '柄', type: 'rect', fill: solid('b'), anim: 'wiggle', x: 76, y: 74, w: 44, h: 12, r: 6, rot: 45 }),
  ]),
  ex('燈泡', 32, [
    L({ id: 'l1', name: '玻璃', type: 'ellipse', fill: grad('a', 'b'), anim: 'flash',
      animP: { flash: { dur: 2200, at: 40, amt: 100 } }, x: 60, y: 48, w: 60, h: 64 }),
    L({ id: 'l2', name: '燈座', type: 'rect', fill: solid('ink'), x: 60, y: 92, w: 30, h: 22, r: 6 }),
  ]),
  ex('音符', 35, [
    L({ id: 'l1', name: '符頭', type: 'ellipse', fill: grad('a', 'b'), anim: 'bounce', x: 42, y: 82, w: 34, h: 26, rot: -20 }),
    L({ id: 'l2', name: '符桿', type: 'rect', fill: solid('ink'), anim: 'bounce', x: 62, y: 52, w: 8, h: 62, r: 4 }),
  ]),
  ex('時鐘', 45, [
    L({ id: 'l1', name: '錶面', type: 'ellipse', fill: grad('a', 'b'), x: 60, y: 60, w: 84, h: 84 }),
    L({ id: 'l2', name: '時針', type: 'rect', fill: solid('ink'), outline: false, anim: 'spin',
      animP: { spin: { dur: 4000 } }, x: 60, y: 46, w: 7, h: 30, r: 3.5 }),
  ]),
  ex('書', 46, [
    L({ id: 'l1', name: '書封', type: 'rect', fill: grad('a', 'b'), anim: 'float', x: 60, y: 60, w: 76, h: 88, r: 8 }),
    L({ id: 'l2', name: '書脊', type: 'rect', fill: solid('c'), anim: 'float', x: 30, y: 60, w: 16, h: 88, r: 6 }),
  ]),
  ex('樹', 42, [
    L({ id: 'l1', name: '樹冠', type: 'path', fill: grad('a', 'b'), anim: 'wiggle',
      animP: { wiggle: { dur: 2600, deg: 3 } }, pts: [
      { x: 60, y: 12, c: true }, { x: 96, y: 62 }, { x: 84, y: 82 }, { x: 36, y: 82 }, { x: 24, y: 62 } ] }),
    L({ id: 'l2', name: '樹幹', type: 'rect', fill: solid('ink'), x: 60, y: 94, w: 16, h: 28, r: 4 }),
  ]),
  ex('雨滴雲', 26, [
    L({ id: 'l1', name: '雲', type: 'path', fill: grad('a', 'b'), pts: SHAPES[15].o.pts.map(p => ({ ...p, y: p.y - 12 })) }),
    L({ id: 'l2', name: '雨一', type: 'ellipse', fill: solid('c'), outline: false, anim: 'drop',
      animP: { drop: { dur: 1400, h: 30, hold: 30 } }, x: 44, y: 92, w: 9, h: 14 }),
    L({ id: 'l3', name: '雨二', type: 'ellipse', fill: solid('c'), outline: false, anim: 'drop',
      animP: { drop: { dur: 1400, h: 30, hold: 30 } }, x: 72, y: 96, w: 9, h: 14 }),
  ]),
  ex('火箭', 18, [
    L({ id: 'l1', name: '機身', type: 'path', fill: grad('a', 'b'), anim: 'float', pts: [
      { x: 60, y: 10, c: true }, { x: 82, y: 46 }, { x: 82, y: 84 }, { x: 60, y: 96, c: true },
      { x: 38, y: 84 }, { x: 38, y: 46 } ] }),
    L({ id: 'l2', name: '窗', type: 'ellipse', fill: solid('c'), anim: 'float', x: 60, y: 48, w: 24, h: 24 }),
    L({ id: 'l3', name: '尾焰', type: 'path', fill: solid('c'), outline: false, anim: 'twinkle',
      animP: { twinkle: { dur: 500 } }, pts: [
      { x: 60, y: 116, c: true }, { x: 72, y: 94 }, { x: 48, y: 94 } ] }),
  ]),
  ex('獎盃', 43, [
    L({ id: 'l1', name: '盃身', type: 'path', fill: grad('a', 'b'), anim: 'pop', pts: [
      { x: 32, y: 20, c: true }, { x: 88, y: 20, c: true }, { x: 84, y: 56 },
      { x: 60, y: 72, c: true }, { x: 36, y: 56 } ] }),
    L({ id: 'l2', name: '底座', type: 'rect', fill: solid('c'), anim: 'pop', x: 60, y: 96, w: 46, h: 16, r: 6 }),
    L({ id: 'l3', name: '柄', type: 'rect', fill: solid('c'), anim: 'pop', x: 60, y: 82, w: 14, h: 22, r: 4 }),
  ]),
]

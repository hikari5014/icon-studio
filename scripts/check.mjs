/**
 * 上線前的結構檢查。
 *
 * 守的三件事全部屬於「壞掉不會有任何錯誤訊息」那一類：
 * 1. 版本號散在三個檔（version.js / version.json / sw.js）——不一致的症狀是
 *    「永遠顯示有新版」或「永遠說已是最新」，兩種都不會報錯。
 * 2. SW 的快取清單漏掉新檔案 → 離線時那一頁是白的，但線上測試完全正常。
 * 3. 更新日誌第一筆要等於目前版本，否則使用者看到的是上一版的說明。
 */
import { readFileSync, readdirSync, existsSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { spawnSync } from 'node:child_process'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const read = (p) => readFileSync(join(ROOT, p), 'utf8')
const fails = []
const ok = (cond, msg) => { if (!cond) fails.push(msg); else console.log('  ✓', msg) }

const appVer = read('js/version.js').match(/APP_VERSION\s*=\s*'([^']+)'/)?.[1]
const jsonVer = JSON.parse(read('version.json')).version
const swVer = read('sw.js').match(/VERSION\s*=\s*'icon-studio-([^']+)'/)?.[1]
const logVer = read('js/changelog.js').match(/v:\s*'([^']+)'/)?.[1]

console.log('版本一致性')
ok(!!appVer, 'js/version.js 讀得到 APP_VERSION')
ok(jsonVer === appVer, `version.json (${jsonVer}) ＝ APP_VERSION (${appVer})`)
ok(swVer === appVer, `sw.js 的快取版本 (${swVer}) ＝ APP_VERSION (${appVer})`)
ok(logVer === appVer, `更新日誌第一筆 (${logVer}) ＝ APP_VERSION (${appVer})`)

console.log('Service Worker 快取清單')
const core = read('sw.js')
for (const f of readdirSync(join(ROOT, 'js'))) {
  ok(core.includes(`js/${f}`), `sw.js 有快取 js/${f}`)
}
ok(core.includes('styles.css'), 'sw.js 有快取 styles.css')

console.log('必要檔案')
for (const f of ['index.html', 'styles.css', 'manifest.webmanifest', 'assets/icon.svg', '.nojekyll']) {
  ok(existsSync(join(ROOT, f)), `${f} 存在`)
}

console.log('manifest')
const mf = JSON.parse(read('manifest.webmanifest'))
ok(mf.start_url === './' && mf.scope === './', 'manifest 用相對路徑（GitHub Pages 在子路徑下）')
ok(mf.icons.some((i) => i.purpose === 'maskable'), 'manifest 有 maskable 圖示')

console.log('語法（用 node 真的解析一次 ES module）')
/* ⚠ 不要用「把 import/export 字串剝掉再 new Function」那種土法：
   剝掉 `export const X = {` 的那一行會留下一個孤兒 `}`，於是每個檔案都會
   報一個假的語法錯誤——第一版就是這樣，四個檔全紅，但程式其實完全正常。
   要驗語法就讓 node 用它自己的 parser 驗。 */
const tmp = mkdtempSync(join(tmpdir(), 'is-check-'))
for (const f of readdirSync(join(ROOT, 'js'))) {
  const dest = join(tmp, f.replace(/\.js$/, '.mjs'))
  writeFileSync(dest, read(`js/${f}`))
  const r = spawnSync(process.execPath, ['--check', dest], { encoding: 'utf8' })
  if (r.status === 0) console.log('  ✓', f)
  else fails.push(`js/${f} 語法錯誤：${(r.stderr || '').split('\n').find((l) => l.includes('Error')) || '解析失敗'}`)
}
rmSync(tmp, { recursive: true, force: true })

if (fails.length) { console.error('\n❌ 失敗：\n' + fails.map((f) => '  · ' + f).join('\n')); process.exit(1) }
console.log('\n✅ 全部通過')

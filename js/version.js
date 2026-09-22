/**
 * 版本號的單一真相來源。
 *
 * 更新偵測是拿這裡的 APP_VERSION 去跟伺服器上的 version.json 比——
 * 兩邊一定要同步，所以 build 前的檢查（npm run check）會比對這兩個檔。
 * 忘了改其中一邊的症狀是「永遠顯示有新版」或「永遠說已是最新」，兩種都不會報錯。
 */
export const APP_VERSION = '1.0.0'
export const BUILD_DATE = '2026-09-22'

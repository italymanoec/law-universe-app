# 法學記憶宇宙 v68 PWA

此資料夾是可獨立使用的靜態網站，入口為 `index.html`。保留原版 16 科、2,502 題及答案；題庫檔逐位元組複製，原始 `src/` 未修改。

## 功能

- 名稱「法學記憶宇宙」、standalone、直式顯示，附 192／512 PNG、maskable 及 iPhone 圖示。
- Service worker 首次連網時一次快取主頁、全部題庫、樣式及本機 Three.js r128。看見「離線題庫已備妥」後才關閉網路；離線首次開啟其他科也可使用。
- 保留 v68 的 localStorage 儲存：選擇題作答、錯題、熟練度、每日紀錄，以及原有申論草稿與歷史。無須登入。關閉再開啟仍保留已存紀錄；中途未提交的選項或尚未自動儲存的輸入不保證恢復。
- 手機題目 18px、選項 17px，主要按鈕至少 44px，支援瀏海／底部安全區。
- 更新檔案後會出現更新按鈕，由使用者點擊才重新載入。快取名稱按安裝路徑隔離，避免刪掉同網域其他應用程式的快取。

資料保存在該裝置、該瀏覽器的網站儲存空間。清除網站資料、無痕模式、系統回收或更換網址／瀏覽器會影響紀錄；iPhone 主畫面 App 與 Safari 的資料是否共用依系統而異，建議固定從主畫面使用。原版未隨附完整 `law/*.js` 法條庫，只有已提供的 `law/_pend.js.gz` 解壓收錄；缺少的法條不會憑空補寫。考選部外部網站及 PDF 需連網，離線範圍是本包學習功能。

## 本機預覽

在專案根目錄執行：

```sh
python3 -m http.server 8000
```

以電腦瀏覽器開啟 `http://localhost:8000/app/`。請勿雙擊 HTML 使用 `file://`，它無法註冊 service worker。手機透過區網 IP 的普通 HTTP 也無法啟用完整 PWA，手機驗收請用 HTTPS 網址。

## GitHub Pages 部署步驟（僅供日後操作，本次未部署）

1. 建立供此 App 使用的 GitHub repository。把 **app 內的內容**放到 repository 根目錄，包含 `.nojekyll`、`index.html`、`manifest.json`、`sw.js`、`qb/`、`law/`、`vendor/`、`pwa/`、`icons/`；勿漏掉隱藏檔。由你自行提交及上傳。
2. 前往 repository 的 **Settings → Pages**，Source 選 **Deploy from a branch**，選擇檔案所在分支（例如 `main`），資料夾選 **/(root)**，儲存。
3. 等 GitHub Pages 建置完成，開啟顯示的 `https://帳號.github.io/儲存庫名稱/`。確認 HTTPS 可用。
4. 首次開啟保持連網，等「離線題庫已備妥」，再安裝。切飛航模式、完全關閉並重開 App，切換不同科目並作答，再重開確認紀錄保留。
5. 日後更新需整包同步上傳；修改來源／樣式後先在本機重建，讓 `sw.js` 使用新的內容雜湊版本。

若保留整個專案作為 repository，也可發布根目錄並從 `/app/` 開啟；Pages 的分支發布來源只能選根目錄或 `/docs`，無法直接選 `/app`。不要將不打算公開的專案檔案一起發布。

官方文件：[GitHub Pages 發布來源](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)。

## iPhone 加入主畫面

1. 用 **Safari** 開啟已發布的 HTTPS 網址，等待離線備妥。
2. 點「分享」→「加入主畫面」。若看不到，從分享選單的編輯動作加入。
3. 若系統顯示「以網頁 App 開啟」，將它開啟；名稱確認為「法學記憶宇宙」，點「加入」。
4. 從主畫面圖示開啟，首次仍保持連網直到離線備妥，再用飛航模式驗收。

官方文件：[Apple：將 Safari 網站變成 App](https://support.apple.com/en-lamr/guide/iphone/iphea86e5236/ios)。

## Android 加入主畫面

1. 用 **Chrome** 開啟已發布的 HTTPS 網址，等待離線備妥。
2. 點右上角「⋮」→「加入主畫面」或「安裝應用程式」，依畫面確認安裝。
3. 從主畫面啟動，測試飛航模式及重開後的作答紀錄。

官方文件：[Google Chrome：使用網頁應用程式](https://support.google.com/chrome/answer/9658361?co=GENIE.Platform%3DAndroid&hl=zh-Hant)。選單文字會依系統與瀏覽器版本略異。

## 維護與驗證

在專案根目錄執行（建置需 Python 與 Pillow，圖示字型使用 macOS 黑體）：

```sh
python3 -I tools/build_pwa.py
node tools/verify_pwa.cjs
```

建置器只對主頁插入 PWA 標籤、將 Three.js 改為本機同版本並停用外部字型載入；還原這些外殼改動後會核對主頁與原稿完全一致。題庫以 SHA-256 核對，法規待施行資料原樣解壓。Three.js 授權見 `vendor/THREE-LICENSE.txt`。

本次已完成：2,502 題計數、16 科題庫原樣比對、HTML 行內 JavaScript 語法檢查、manifest／圖示資產檢查，以及 service worker 離線與路徑隔離模擬。

驗證限制：執行環境禁止本機 HTTP 監聽及 Chrome 測試程序啟動，因此未完成真實瀏覽器 service worker 安裝、390／360 手機畫面截圖與 iPhone／Android 實機安裝。以上離線與儲存驗收步驟需在允許瀏覽器測試的環境完成；模擬測試不等於實機驗收。

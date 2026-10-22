申論法條組合包

獨立模組：essay.html（樣式、程式、示範資料都在同檔）。
接回主版只需首頁連結與 service worker PRECACHE 加入 essay.html，並更新快取版本。
目前複本已完成這兩項整合，未修改 qb 題庫。

資料接入
- 僅在 DONE_data.txt 存在時讀取同目錄 essay_packs.json。
- 頁面啟動、每 15 秒、恢復連線及返回頁面時檢查 app/data/、../data/。
- 若以專案根目錄提供 HTTP，直接讀 ../data/ 即可。
- 若只提供 app/，在專案根目錄執行 python3 tools/sync-essay-data.py；
  或 python3 tools/sync-essay-data.py --watch 等待 Claude 完成。
  此工具在來源標記出現後才檢查、複製資料及標記至 app/data/。
- 真資料寫入獨立 localStorage key lawu-essay-data，離線時還原。
  首次離線可看 service worker 預先快取的示範介面；正式資料須至少成功載入一次。
- 資料不足時顯示「尚未提供」或缺少關聯 ID，不補造實務見解。

資料欄位
questions: id, title, subject, content, issues:[{title,description,articleIds}], articleIds, packIds
packs: id, title, description, articleIds, questionIds
articles: id, law, number, title, text, requirements, practice, issues, relatedArticleIds
關聯使用對應 id。亦接受 snake_case ID 欄位、lawName、articleNumber、elements、opinions 等別名。
反查由題目直接引用、爭點引用、題目所屬組合包引用，以及條文本身的 questionIds/packIds 計算。

驗證：node tools/check-essay.cjs（於專案根目錄）。
尚須在可啟動 HTTP 的環境，以 360/390px 寬度實測安裝、更新及飛航模式。
未部署、未 push。

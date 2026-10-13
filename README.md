# Baseball Road v3.0.0 — Online Playtest

正式試玩：[https://scottpuppylu.github.io/baseball-road/](https://scottpuppylu.github.io/baseball-road/)

選擇真實系壘球員本人，親手打擊、移動守備與跑壘，走完四年八學期的虛構大學生涯。每條新生涯56個故事節點、17段操作；16名角色各有專屬挑戰，兩個共同比賽依當前遊戲定位呈現不同視角。

這是小規模公開試玩版。動畫、操作手感、數值與敘事仍會逐步調整，不宣稱已達最終品質。球員姓名、背號與打擊資料讀取公開canonical來源；角色外貌為原創插畫，不是真人外貌。人物經歷、對話、性格、衝突與隊友關係均為虛構，不是對真人私生活的陳述。

## 遊玩

打擊：球到金框時揮棒，好壞球需自行判斷。守備：先移動至落點，再抓接球時機。跑壘：讀投手轉身起跑，到壘再按滑壘。鍵盤Space／左右鍵及觸控按鈕可操作，手機直向可玩。

進度只保存在本機瀏覽器。沒有帳號、雲端存檔或跨裝置同步。可匯出／匯入JSON備份；換裝置、清除瀏覽器資料或從localhost轉到HTTPS前先備份。首次載入需網路取得名單，之後可使用已驗證快取。遊戲資料來源唯讀，不修改真實比賽紀錄。

## 本機開發與檢查

Node.js 22+：

```text
npm ci
npm test
npm run validate:story
npm run build
npm run serve
```

Production是靜態dist，不需要Node API後端。Playwright僅為測試工具；本機使用安裝的Chrome，CI使用Chromium。72個pure／engine／identity／save tests保留。完整真UI測試：test:browser；存檔／來源邊界：test:browser-save。BASEBALL_ROAD_URL可指定要檢查的HTTP或HTTPS網站。測試使用獨立browser context，不修改使用者既有存檔。

## 發布與更新

沿用.github/workflows/pages.yml。正式artifact只含必要HTML、JS、CSS與原創SVG。公開repo是已審閱的v3.0.0來源快照；未公開開發期真人照片、外站截圖、本機evidence或私人Git歷史。原始checkpoint與runtime hash見docs/RELEASE_ORIGIN.json。

更新時先測試與build，commit並push main。發布者将repository variable RELEASE_APPROVED_SHA設為審閱後的精確SHA，再從Actions的Pages workflow選main、publish=true執行。Workflow會驗證完整三條四年UI及save/source檢查後自動發布；不需要自行上傳dist。

Rollback：選擇已驗證的較早commit/tag，将RELEASE_APPROVED_SHA設成該SHA，在該ref執行相同workflow。不要force push或刪玩家存檔；先匯出JSON。v3.0.0-online-playtest是首發回復點，發布build的release.json可核對版本與部署commit。

[素材及字體](docs/THIRD_PARTY.md) · [GitHub Pages官方流程](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)

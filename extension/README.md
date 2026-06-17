# BiliBili Analyzer - Chrome Extension

MV3 service worker that adds a right-click context menu entry on BiliBili
video pages. Selecting **BiliBili Analyzer：打開視頻詳細分析** extracts the
`bvid` and opens the matching `/details?bvid=…` page on the deployed web app.

## Local development

1. `chrome://extensions` → enable **Developer mode**
2. **Load unpacked** → select this `extension/` folder
3. Open any `https://www.bilibili.com/video/…` page → right-click → pick
   the menu entry

## Packaging for release

```bash
cd extension
zip -r ../BiliBili-Analyzer-Chrome-Extension-v1.1.0.zip . -x "*.DS_Store"
```

`manifest.json` version is the source of truth; bump it in lockstep with
`package.json` and the native shells (`android/app/build.gradle`,
`ios/App/App/Info.plist`).

The web app target is configured in `background.js` via
`ANALYZER_BASE_URL`. Update both there and the release notes if the
deployment URL changes.

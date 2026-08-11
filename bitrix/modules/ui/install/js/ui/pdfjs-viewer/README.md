# How to build new version of pdf-viewer?

Open `Sources` tab on page https://mozilla.github.io/pdf.js/web/viewer.html.

There you will find `mozilla.github.io/pdf.js/web` folder

1. Copy file to `ui/install/js/ui/pdfjs-viewer/src/viewer.mjs` from `Sources/viewer.mjs`
2. Export `PDFViewerApplication` and `AppOptions` from `viewer.mjs`
3. Build `ui.pdfjs-viewer`
4. Copy method `getViewerConfiguration()` to `fileman/install/js/fileman/pdf-viewer/pdf-viewer.js` from `viewer.mjs`
5. Copy styles from `Sources/viewer.css` to `fileman/install/js/fileman/pdf-viewer/style.css` and also copy images
6. Copy translations from https://github.com/mozilla/pdf.js/tree/master/l10n to `fileman/install/components/bitrix/pdf.viewer/pdfjs/locale`
7. Copy `Sources/viewer.html` to `fileman/install/components/bitrix/pdf.viewer/templates/.default/template`
8. Inside `ui/install/js/ui/pdfjs-viewer/src/viewer.mjs` clear lines from
`window.PDFViewerApplication = PDFViewerApplication;`
to
`document.addEventListener("DOMContentLoaded", webViewerLoad, true);`
9. Delete `ui/install/js/ui/pdfjs-viewer/src/viewer.mjs`
10. Fix new problems

`PDFViewerApplication` and `AppOptions` will be inside namespace: `BX.UI.Pdfjs`.

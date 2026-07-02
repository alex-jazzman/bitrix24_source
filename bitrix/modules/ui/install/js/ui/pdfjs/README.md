# How to build new version of pdf.js?

If we avoid using mjs files, we can use the following steps to build a new version of pdf.js:

```shell
# update package.json to use the new version of pdf.js
cd ui/install/js/ui/pdfjs
npm install
bitrix install
```

pdf.js will be inside namespace: `BX.UI.Pdfjs`.
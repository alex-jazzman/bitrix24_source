(() => {
	BX.addCustomEvent('onDiskFolderOpen', async (params = {}) => {
		const require = (ext) => jn.require(ext);
		const { inAppUrl } = require('in-app-url');

		inAppUrl.open(params.url, { canOpenInDefault: true });
	});
})();

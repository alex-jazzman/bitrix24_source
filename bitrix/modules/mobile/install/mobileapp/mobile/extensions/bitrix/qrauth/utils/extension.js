/**
 * @module qrauth/utils
 */
jn.define('qrauth/utils', (require, exports, module) => {
	const { Loc } = require('loc');
	const { Type } = require('type');
	const { openManager: openQRAuth } = require('qrauth/utils/src/manager');

	const QR_AUTH_URL_TEMPLATE = 'https://b24.to/a/';

	function authorizeByUrl(url, redirectUrl = '')
	{
		return new Promise((resolve, reject) => {
			if (url && url.startsWith(QR_AUTH_URL_TEMPLATE))
			{
				const path = url.replace(QR_AUTH_URL_TEMPLATE, '');
				const [siteId, uniqueId, channelTag] = path.split('/');
				BX.ajax.runAction(
					'main.qrcodeauth.pushToken',
					{
						data: {
							channelTag, siteId, uniqueId, redirectUrl,
						},
					},
				).then((response) => {
					if (response.status === 'success')
					{
						resolve();
					}

					const errors = response.errors ?? [];
					if (errors.length === 0)
					{
						reject(new Error('Unknown error: non-success status with no errors'));
					}

					reject(errors);
				}).catch(reject);
			}
			else
			{
				reject(new Error(Loc.getMessage('WRONG_QR')));
			}
		});
	}

	function openExternalAuth(data)
	{
		void openQRAuth({
			urlData: data,
			external: true,
			title: Loc.getMessage('QR_EXTERNAL_AUTH'),
		});
	}

	function isValidAuthUrl(url)
	{
		if (Type.isStringFilled(url))
		{
			return url.startsWith(QR_AUTH_URL_TEMPLATE);
		}

		return false;
	}

	/**
	 * @deprecated use openQRAuth and authorizeByUrl instead
	 */
	const qrauth = {
		open: openQRAuth,
	};

	module.exports = { qrauth, openExternalAuth, isValidAuthUrl, openQRAuth, authorizeByUrl };
});

(function() {
	const require = (ext) => jn.require(ext);
	const { qrauth } = require('qrauth/utils');

	jnexport([qrauth, 'qrauth']);
})();

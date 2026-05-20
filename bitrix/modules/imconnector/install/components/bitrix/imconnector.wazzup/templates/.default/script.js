;(function (window) {
	let oauthTrustedOrigins = null;

	function getOAuthTrustedOrigins() {
		if (oauthTrustedOrigins === null) {
			oauthTrustedOrigins = new Set(window.WAZZUP_OAUTH_TRUSTED_ORIGINS || []);
		}

		return oauthTrustedOrigins;
	}

	window.validateApiKey = function(apiKey) {
		return /^[a-f0-9]{32}$/i.test(apiKey);
	};

	window.checkWazzupFirst = function() {
		const apiKeyInput = this;
		const submitButton = document.getElementById('webform-small-button-have');

		if (apiKeyInput && submitButton) {
			const isValid = validateApiKey(apiKeyInput.value.trim());
			submitButton.disabled = !isValid;
		}
	};

	window.openWazzupOAuthPopup = function(url) {
		const popup = BX.util.popup(url, 600, 700);

		if (popup) {
			let authSuccess = false;
			let messageReceived = false;

			const messageHandler = function(event) {
				if (!getOAuthTrustedOrigins().has(event.origin)) {
					console.warn('[Wazzup OAuth] Blocked message from untrusted origin:', event.origin);

					return;
				}

				if (event.data && event.data.type === 'wazzup_oauth_result') {
					messageReceived = true;
					authSuccess = event.data.success;

					if (!authSuccess) {
						console.warn('Wazzup OAuth authorization failed or was cancelled');
					}
				}
			};

			window.addEventListener('message', messageHandler);

			const checkPopupClosed = setInterval(() => {
				if (popup.closed) {
					clearInterval(checkPopupClosed);
					window.removeEventListener('message', messageHandler);

					if (authSuccess) {
						window.location.reload();
					} else {
						if (messageReceived) {
							if (typeof BX !== 'undefined' && BX.UI && BX.UI.Notification) {
								BX.UI.Notification.Center.notify({
									content: BX.message('IMCONNECTOR_COMPONENT_WAZZUP_AUTHORIZATION_FAILED') || 'Authorization failed',
									position: 'top-right',
									autoHideDelay: 4000
								});
							}
						} else {
							console.log('OAuth popup closed without authorization attempt');
						}
					}
				}
			}, 500);
		}

		return false;
	};

	BX.ready(function() {
		BX.bindDelegate(
			document.body,
			'input',
			{props: {id: 'imconnector-wazzup-api-key'}},
			checkWazzupFirst
		);

		BX.bindDelegate(
			document.body,
			'change',
			{props: {id: 'imconnector-wazzup-api-key'}},
			checkWazzupFirst
		);

		BX.bindDelegate(
			document.body,
			'blur',
			{props: {id: 'imconnector-wazzup-api-key'}},
			checkWazzupFirst
		);

		BX.bindDelegate(
			document.body,
			'click',
			{className: 'imconnector-field-box-entity-icon-copy-to-clipboard'},
			copyToClipboard
		);

		BX.bindDelegate(
			document.body,
			'change',
			{props: {id: 'imconnector-wazzup-channel'}},
			function() {
				const saveButton = document.getElementById('imconnector-wazzup-oauth-save');
				if (saveButton) {
					saveButton.disabled = !this.value;
				}
			}
		);

		BX.bindDelegate(
			document.body,
			'click',
			{props: {id:'imconnector-wazzup-link-help'}},
			() => {
				top.BX.Helper.show('redirect=detail&code=26927854');
				return false;
			}
		);

		const apiKeyInput = document.getElementById('imconnector-wazzup-api-key');
		if (apiKeyInput) {
			checkWazzupFirst.call(apiKeyInput);
		}
	});
})(window);

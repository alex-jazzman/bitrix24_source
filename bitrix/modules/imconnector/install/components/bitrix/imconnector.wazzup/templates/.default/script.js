;(function (window) {
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

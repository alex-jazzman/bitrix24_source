(() => {
	const require = (ext) => jn.require(ext);
	const { PasswordInputBox, PasswordInputBoxEvents } = require('layout/ui/password-input-box');

	const getConfirmResult = (requestId) => {
		return new Promise((resolve, reject) => {
			const eventName = `${PasswordInputBoxEvents.CONFIRM_RESULT}:${requestId}`;
			const handler = ({ success }) => {
				BX.removeCustomEvent(eventName, handler);

				if (success)
				{
					resolve();

					return;
				}

				reject(new Error('Password confirmation failed'));
			};

			BX.addCustomEvent(eventName, handler);
		});
	};

	BX.onViewLoaded(() => {
		const requestId = BX.componentParameters.get('requestId', '');

		layout.showComponent(
			new PasswordInputBox({
				testId: BX.componentParameters.get('testId', null),
				title: BX.componentParameters.get('title'),
				placeholder: BX.componentParameters.get('placeholder', null),
				confirmButtonText: BX.componentParameters.get('confirmButtonText', null),
				password: BX.componentParameters.get('password', null),
				pending: BX.componentParameters.get('pending', false),
				layoutWidget: layout,
				onChange: (password) => {
					BX.postComponentEvent(PasswordInputBoxEvents.CHANGE, [{ requestId, password }]);
				},
				onClose: () => {
					BX.postComponentEvent(PasswordInputBoxEvents.CLOSE, [{ requestId }]);
				},
				onConfirm: (password) => {
					const confirmResult = getConfirmResult(requestId);

					BX.postComponentEvent(PasswordInputBoxEvents.CONFIRM, [{ requestId, password }]);

					return confirmResult;
				},
			}),
		);
	});
})();

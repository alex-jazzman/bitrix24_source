/**
 * @module push/listener
 */
jn.define('push/listener', (require, exports, module) => {
	const { ApplicationMessage, DeviceMessage } = require('push/message');
	const { PushListener } = require('push/listener/src/push-listener');

	const HANDLED_PUSH_COMMAND = 'CommonMobilePushEvent';

	function initPushListeners()
	{
		const pushListener = new PushListener();

		BX.addCustomEvent('onPullEvent-mobile', (command, params) => {
			if (command === HANDLED_PUSH_COMMAND && params && params.message)
			{
				pushListener.handle(new ApplicationMessage(params.message));
			}
		});

		const onAppActive = () => {
			const push = Application.getLastNotification();
			if (push && push.params)
			{
				const pushParams = JSON.parse(push.params);
				if (pushParams && pushParams.command && pushParams.message && pushParams.command === HANDLED_PUSH_COMMAND)
				{
					const messageParams = JSON.parse(pushParams.message);
					if (messageParams)
					{
						pushListener.handle(new DeviceMessage(messageParams));
					}
				}
			}
		};

		BX.addCustomEvent('onAppActive', onAppActive);

		// fake timeout to wait subscribers on initialization
		setTimeout(() => onAppActive(), 300);

		return pushListener;
	}

	const pushListener = initPushListeners();

	module.exports = {
		pushListener,
	};
});

(() => {
	const require = (ext) => jn.require(ext);

	const { pushListener } = require('push/listener');

	this.PushListener = pushListener;
})();

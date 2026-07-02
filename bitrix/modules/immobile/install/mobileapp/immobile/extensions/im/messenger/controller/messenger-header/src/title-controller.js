/**
 * @module im/messenger/controller/messenger-header/src/title-controller
 */
jn.define('im/messenger/controller/messenger-header/src/title-controller', (require, exports, module) => {
	const { Loc } = require('im/messenger/loc');
	const { isEqual } = require('utils/object');

	const { AppStatus } = require('im/messenger/const');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');

	/**
	 * @class HeaderTitleController
	 */
	class HeaderTitleController
	{
		#ui;
		#titleParamsProvider;
		/** @type {JNWidgetTitleParams} */
		#titleParams = null;

		/**
		 * @param {object} widget
		 * @param {GlobalTitleParamsProvider|NestedTitleParamsProvider} titleParamsProvider
		 */
		constructor(widget, titleParamsProvider)
		{
			this.#ui = widget;
			this.#titleParamsProvider = titleParamsProvider;
		}

		/**
		 * @return {CoreApplication}
		 */
		get #core()
		{
			return serviceLocator.get('core');
		}

		/**
		 * @return {void}
		 */
		redrawTitleIfNeeded()
		{
			const appStatus = this.#core.getAppStatus();
			const titleParams = this.#getTitleParamsByAppStatus(appStatus);
			if (isEqual(this.#titleParams, titleParams))
			{
				return;
			}

			this.redrawTitle(titleParams);
		}

		/**
		 * @param {JNWidgetTitleParams} titleParams
		 */
		redrawTitle(titleParams)
		{
			this.#titleParams = titleParams;
			this.#ui.setTitle(this.#titleParams);
		}

		/**
		 * @param {string} appStatus
		 * @return {JNWidgetTitleParams}
		 */
		#getTitleParamsByAppStatus(appStatus)
		{
			let headerTitle = '';
			let useProgress = false;

			switch (appStatus)
			{
				case AppStatus.networkWaiting:
					headerTitle = Loc.getMessage('IMMOBILE_MESSENGER_HEADER_NETWORK_WAITING');
					useProgress = true;
					break;

				case AppStatus.connection:
					headerTitle = Loc.getMessage('IMMOBILE_MESSENGER_HEADER_CONNECTION');
					useProgress = true;
					break;

				case AppStatus.sync:
					headerTitle = Loc.getMessage('IMMOBILE_MESSENGER_HEADER_SYNC');
					useProgress = true;
					break;

				default:
					headerTitle = this.#titleParamsProvider.getDefaultTitle();
					break;
			}

			return {
				text: headerTitle,
				useProgress,
				...this.#titleParamsProvider.getTitleParams(),
			};
		}
	}

	module.exports = { HeaderTitleController };
});

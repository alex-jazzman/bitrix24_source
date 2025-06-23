/* eslint-disable promise/catch-or-return */

/**
 * @module im/messenger/provider/pull/base/application
 */
jn.define('im/messenger/provider/pull/base/application', (require, exports, module) => {
	const { BasePullHandler } = require('im/messenger/provider/pull/base/pull-handler');
	const { Type } = require('type');
	const {
		EventType,
		ComponentCode,
		DialogType,
		NavigationTabByComponent,
	} = require('im/messenger/const');
	const { MessengerEmitter } = require('im/messenger/lib/emitter');
	const { Feature } = require('im/messenger/lib/feature');

	/**
	 * @class BaseApplicationPullHandler
	 */
	class BaseApplicationPullHandler extends BasePullHandler
	{
		handleApplicationOpenChat(params, extra, command)
		{
			if (this.interceptEvent(params, extra, command))
			{
				return;
			}

			this.logger.info(`${this.getClassName()}.handleApplicationOpenChat`, params);
			const dialogModelState = this.store.getters['dialoguesModel/getById'](params.dialogId);
			if (Type.isUndefined(dialogModelState))
			{
				return;
			}

			if (Feature.isCopilotInDefaultTabAvailable)
			{
				MessengerEmitter.emit(EventType.messenger.openDialog, { dialogId: params.dialogId }, ComponentCode.imMessenger);

				return;
			}

			const componentCode = dialogModelState.type === DialogType.copilot
				? ComponentCode.imCopilotMessenger : ComponentCode.imMessenger;

			MessengerEmitter.emit(
				EventType.navigation.broadCastEventCheckTabPreload,
				{
					broadCastEvent: EventType.messenger.openDialog,
					toTab: NavigationTabByComponent[componentCode],
					data: {
						dialogId: params.dialogId,
					},
				},
				ComponentCode.imNavigation,
			);
		}

		/**
		 * @desc get class name for logger
		 * @return {string}
		 */
		getClassName()
		{
			return this.constructor.name;
		}
	}

	module.exports = {
		BaseApplicationPullHandler,
	};
});

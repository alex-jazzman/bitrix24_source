/**
 * @module im/messenger/db/model-writer/vuex/application
 */
jn.define('im/messenger/db/model-writer/vuex/application', (require, exports, module) => {
	const { Logger } = require('im/messenger/lib/logger');
	const { Writer } = require('im/messenger/db/model-writer/vuex/writer');
	const { Setting } = require('im/messenger/const');

	class ApplicationWriter extends Writer
	{
		subscribeEvents()
		{
			this.storeManager.on('applicationModel/setSettings', this.addRouter);
		}

		unsubscribeEvents()
		{
			this.storeManager.off('applicationModel/setSettings', this.addRouter);
		}

		/**
		 * @param {MutationPayload<{
		 *     recordMediaType?: string,
		 *     audioRate?: number,
		 * }, string>} mutation.payload
		 */
		addRouter(mutation)
		{
			if (this.checkIsValidMutation(mutation) === false)
			{
				return;
			}

			const data = mutation.payload.data ?? {};

			if (mutation.payload.actionName === 'setAudioRateSetting')
			{
				this.repository.option.set(Setting.option.APP_SETTING_AUDIO_RATE, String(data.audioRate))
					.catch((error) => Logger.error(`${this.constructor.name}.addRouter.option.set.catch:`, error));
			}

			if (mutation.payload.actionName === 'setRecordMediaType')
			{
				this.repository.option.set(Setting.option.APP_SETTING_RECORD_MEDIA_TYPE, data.recordMediaType)
					.catch((error) => Logger.error(`${this.constructor.name}.addRouter.option.set.catch:`, error));
			}
		}
	}

	module.exports = {
		ApplicationWriter,
	};
});

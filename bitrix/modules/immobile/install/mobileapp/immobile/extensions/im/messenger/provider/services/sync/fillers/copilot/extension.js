/**
 * @module im/messenger/provider/services/sync/fillers/copilot
 */
jn.define('im/messenger/provider/services/sync/fillers/copilot', (require, exports, module) => {
	const { SyncFillerBase } = require('im/messenger/provider/services/sync/fillers/base');
	const {
		EventType,
		ComponentCode,
		BotCode,
		WaitingEntity,
		DialogType,
	} = require('im/messenger/const');
	const { MessengerEmitter } = require('im/messenger/lib/emitter');
	const { getLogger } = require('im/messenger/lib/logger');
	const logger = getLogger('sync-service');

	/**
	 * @class SyncFillerCopilot
	 */
	class SyncFillerCopilot extends SyncFillerBase
	{
		/**
		 * @override
		 * @param {object} data
		 * @param {string} data.uuid
		 * @param {SyncListResult} data.result
		 */
		async fillData(data)
		{
			logger.log('SyncFillerCopilot.fillData:', data);
			const {
				uuid,
				result,
			} = data;

			try
			{
				await this.updateModels(this.prepareResult(result));

				MessengerEmitter.emit(EventType.sync.requestResultSaved, {
					uuid,
				}, ComponentCode.imMessenger);
			}
			catch (error)
			{
				logger.error('SyncFillerCopilot.fillData error: ', error);

				MessengerEmitter.emit(EventType.sync.requestResultSaved, {
					uuid,
					error: `SyncFillerCopilot.fillData error: ${error.message}`,
				}, ComponentCode.imMessenger);
			}
		}

		getUuidPrefix()
		{
			return WaitingEntity.sync.filler.copilot;
		}

		/**
		 * @override
		 * @param {SyncListResult} result
		 * @return {SyncListResult}
		 */
		prepareResult(result)
		{
			return this.filterOnlyCopilot(result);
		}

		/**
		 * @param {SyncListResult} syncListResult
		 * @return {SyncListResult}
		 */
		filterOnlyCopilot(syncListResult)
		{
			const copilotChatIds = this.findCopilotChatIds(syncListResult.addedChats);
			// const copilotMessageIds = this.findCopilotMessageIds(syncListResult.messages.messages, copilotChatIds);

			syncListResult.addedRecent = syncListResult.addedRecent.filter((recentItem) => {
				return (copilotChatIds.includes(recentItem.chat_id));
			});

			syncListResult.addedChats = syncListResult.addedChats.filter((chat) => {
				return (copilotChatIds.includes(chat.id));
			});

			syncListResult.messages.messages = syncListResult.messages.messages.filter((message) => {
				return (copilotChatIds.includes(message.chat_id));
			});

			syncListResult.messages.files = syncListResult.messages.files.filter((file) => {
				return (copilotChatIds.includes(file.chatId));
			});

			syncListResult.messages.users = syncListResult.messages.users.filter((user) => {
				if (!user.botData)
				{
					return false;
				}

				return user.botData.code === BotCode.copilot;
			});

			return syncListResult;
		}

		/**
		 *
		 * @param {Array<RawChat>} addedChats
		 * @return {Array<number>}
		 */
		findCopilotChatIds(addedChats)
		{
			const result = [];
			for (const chat of addedChats)
			{
				if (chat.type === DialogType.copilot)
				{
					result.push(chat.id);
				}
			}

			return result;
		}
	}

	module.exports = {
		SyncFillerCopilot,
	};
});

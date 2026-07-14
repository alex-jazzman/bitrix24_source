/**
 * @module im/messenger/lib/element/dialog/message/block/handler
 */
jn.define('im/messenger/lib/element/dialog/message/block/handler', (require, exports, module) => {
	const { EventType } = require('im/messenger/const');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');

	const { inAppUrl } = require('in-app-url');
	const { CustomMessageHandler } = require('im/messenger/lib/element/dialog/message/custom/handler');
	const { BlockConfiguration } = require('im/messenger/lib/element/dialog/message/block/configuration');
	const { SourceViewer } = require('im/messenger/controller/dialog/lib/source');
	const { Url } = require('im/messenger/lib/helper');

	const logger = getLoggerWithContext('dialog-element--custom-message', 'BlockMessageHandler');

	/**
	 * @class BlockMessageHandler
	 */
	class BlockMessageHandler extends CustomMessageHandler
	{
		/**
		 * @return {void}
		 */
		bindMethods()
		{
			this.messageBuilderButtonTap = this.messageBuilderButtonTap.bind(this);
			this.bbcodeSourceTap = this.bbcodeSourceTap.bind(this);
			this.blockSourceTap = this.blockSourceTap.bind(this);
		}

		/**
		 * @return {void}
		 */
		subscribeEvents()
		{
			this.dialogLocator.get('view')
				.on(EventType.dialog.messageBuilderButtonTap, this.messageBuilderButtonTap)
				.on(EventType.dialog.bbcodeSourceTap, this.bbcodeSourceTap)
				.on(EventType.dialog.builderSourceTap, this.blockSourceTap)
			;
		}

		/**
		 * @return {void}
		 */
		unsubscribeEvents()
		{
			this.dialogLocator.get('view')
				.off(EventType.dialog.messageBuilderButtonTap, this.messageBuilderButtonTap)
				.off(EventType.dialog.bbcodeSourceTap, this.bbcodeSourceTap)
				.off(EventType.dialog.blockSourceTap, this.blockSourceTap)
			;
		}

		/**
		 * @param {string} messageId
		 * @param {string} elementId - native calls this "blockId"
		 * @param {string} buttonId
		 * @return {void}
		 */
		messageBuilderButtonTap(messageId, elementId, buttonId)
		{
			logger.log(`${this.constructor.name}.messageBuilderButtonTap`, messageId, elementId, buttonId);

			const message = this.getMessageModel(messageId);
			if (!message.id)
			{
				return;
			}

			const button = this.getButton(message, elementId, buttonId);
			if (!button)
			{
				logger.error('messageBuilderButtonTap: button not found', elementId, buttonId);

				return;
			}

			try
			{
				const metaData = BlockConfiguration.getButtonMetaData(messageId, button);
				if (!metaData)
				{
					logger.error('messageBuilderButtonTap: no metaData found for button', button.type, buttonId);

					return;
				}

				metaData.callback({ messageId, dialogLocator: this.dialogLocator });
			}
			catch (error)
			{
				logger.error('messageBuilderButtonTap error', error);
			}
		}

		/**
		 * @param {number} messageId
		 * @param {string} elementId
		 * @param {number} sourceId
		 * @return {void}
		 */
		bbcodeSourceTap(messageId, elementId, sourceId)
		{
			logger.log(`${this.constructor.name}.bbcodeSourceTap:`, messageId, elementId, sourceId);

			const message = this.getMessageModel(messageId);
			if (!message.id)
			{
				return;
			}

			const blockModel = this.getBlock(messageId);
			if (!blockModel)
			{
				return;
			}

			const element = blockModel.elements?.find((item) => item.id === elementId);
			const url = element?.sources?.[sourceId]?.url;

			if (url)
			{
				inAppUrl.open(url);
			}
		}

		/**
		 * @param {number} messageId
		 * @return {void}
		 */
		blockSourceTap(messageId)
		{
			logger.log(`${this.constructor.name}.blockSourceTap messageId:`, messageId);

			const message = this.getMessageModel(messageId);
			if (!message.id)
			{
				return;
			}

			const blockModel = this.getBlock(messageId);
			if (!blockModel)
			{
				return;
			}

			const sources = this.#aggregateSources(blockModel);
			if (sources.length === 0)
			{
				return;
			}

			SourceViewer.show(sources).catch((error) => {
				logger.error('blockSourceTap error', error);
			});
		}

		/**
		 * @param {BlockModelState} blockModel
		 * @return {Array<{url: string, title?: string, description?: string}>}
		 */
		#aggregateSources(blockModel)
		{
			const sources = [];
			const seenUrls = new Set();

			for (const element of (blockModel.elements || []))
			{
				if (!element.sources)
				{
					continue;
				}

				for (const sourceId of Object.keys(element.sources))
				{
					const source = element.sources[sourceId];
					if (seenUrls.has(source.url))
					{
						continue;
					}

					seenUrls.add(source.url);
					const title = source.metaData?.title || new Url(source.url).getDomain();
					sources.push({
						url: source.url,
						title: title || null,
						description: source.metaData?.description || null,
					});
				}
			}

			return sources;
		}

		/**
		 * @param {MessagesModelState} message
		 * @param {string} elementId - native calls this "blockId"
		 * @param {string} buttonId
		 * @return {BlockButtonTypeData|null}
		 */
		getButton(message, elementId, buttonId)
		{
			const elements = message.block?.elements;
			if (!Array.isArray(elements))
			{
				return null;
			}

			const element = elements.find((item) => String(item.id) === String(elementId));
			if (!element || !Array.isArray(element.buttons))
			{
				return null;
			}

			for (let rowIndex = 0; rowIndex < element.buttons.length; rowIndex++)
			{
				const row = element.buttons[rowIndex];
				for (let buttonIndex = 0; buttonIndex < row.length; buttonIndex++)
				{
					if (`${elementId}-${rowIndex}-${buttonIndex}` === String(buttonId))
					{
						return row[buttonIndex];
					}
				}
			}

			return null;
		}

		/**
		 * @function messagesModel/getById
		 * @return {MessagesModelState | {}}
		 */
		getMessageModel(messageId)
		{
			return this.serviceLocator.get('core').getStore().getters['messagesModel/getById'](messageId);
		}

		/**
		 * @param {number} messageId
		 * @return {BlockModelState|null}
		 */
		getBlock(messageId)
		{
			return this.serviceLocator.get('core').getStore().getters['messagesModel/blockModel/getByMessageId'](messageId);
		}
	}

	module.exports = {
		BlockMessageHandler,
	};
});

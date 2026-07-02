/**
 * @module im/messenger/lib/element/dialog/message/builder/handler
 */
jn.define('im/messenger/lib/element/dialog/message/builder/handler', (require, exports, module) => {
	const { EventType } = require('im/messenger/const');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');

	const { inAppUrl } = require('in-app-url');
	const { CustomMessageHandler } = require('im/messenger/lib/element/dialog/message/custom/handler');
	const { BuilderConfiguration } = require('im/messenger/lib/element/dialog/message/builder/configuration');
	const { SourceViewer } = require('im/messenger/controller/dialog/lib/source');
	const { Url } = require('im/messenger/lib/helper');

	const logger = getLoggerWithContext('dialog-element--customMessage', 'BuilderMessageHandler');

	/**
	 * @class BuilderMessageHandler
	 */
	class BuilderMessageHandler extends CustomMessageHandler
	{
		/**
		 * @return {void}
		 */
		bindMethods()
		{
			this.messageBuilderButtonTap = this.messageBuilderButtonTap.bind(this);
			this.bbcodeSourceTap = this.bbcodeSourceTap.bind(this);
			this.builderSourceTap = this.builderSourceTap.bind(this);
		}

		/**
		 * @return {void}
		 */
		subscribeEvents()
		{
			this.dialogLocator.get('view')
				.on(EventType.dialog.messageBuilderButtonTap, this.messageBuilderButtonTap)
				.on(EventType.dialog.bbcodeSourceTap, this.bbcodeSourceTap)
				.on(EventType.dialog.builderSourceTap, this.builderSourceTap)
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
				.off(EventType.dialog.builderSourceTap, this.builderSourceTap)
			;
		}

		/**
		 * @param {string} messageId
		 * @param {string} actionId
		 * @return {void}
		 */
		messageBuilderButtonTap(messageId, actionId)
		{
			logger.log(`${this.constructor.name}.messageBuilderButtonTap messageId:`, messageId, actionId);
			const message = this.getMessageModel(messageId);
			if (!message.id)
			{
				return;
			}

			try
			{
				const metaData = this.getButtonMetaData(messageId, actionId);

				metaData.callback({ dialogLocator: this.dialogLocator });
			}
			catch (error)
			{
				logger.error('messageBuilderButtonTap error', error);
			}
		}

		/**
		 * @param {number} messageId
		 * @param {string} blockId
		 * @param {number} sourceId
		 * @return {void}
		 */
		bbcodeSourceTap(messageId, blockId, sourceId)
		{
			logger.log(`${this.constructor.name}.bbcodeSourceTap:`, messageId, blockId, sourceId);

			const message = this.getMessageModel(messageId);
			if (!message.id)
			{
				return;
			}

			const builder = this.getBuilder(messageId);
			if (!builder)
			{
				return;
			}

			const block = builder.blocks?.find((item) => item.id === blockId);
			const url = block?.sources?.[sourceId]?.url;

			if (url)
			{
				inAppUrl.open(url);
			}
		}

		/**
		 * @param {number} messageId
		 * @return {void}
		 */
		builderSourceTap(messageId)
		{
			logger.log(`${this.constructor.name}.builderSourceTap messageId:`, messageId);

			const message = this.getMessageModel(messageId);
			if (!message.id)
			{
				return;
			}

			const builder = this.getBuilder(messageId);
			if (!builder)
			{
				return;
			}

			const sources = this.#aggregateSources(builder);
			if (sources.length === 0)
			{
				return;
			}

			SourceViewer.show(sources).catch((error) => {
				logger.error('builderSourceTap error', error);
			});
		}

		/**
		 * @param {BuilderModelState} builder
		 * @return {Array<{url: string, title?: string, description?: string}>}
		 */
		#aggregateSources(builder)
		{
			const sources = [];
			const seenUrls = new Set();

			for (const block of (builder.blocks || []))
			{
				if (!block.sources)
				{
					continue;
				}

				for (const sourceId of Object.keys(block.sources))
				{
					const source = block.sources[sourceId];
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
		 * @function messagesModel/getById
		 * @return {MessagesModelState | {}}
		 */
		getMessageModel(messageId)
		{
			return this.serviceLocator.get('core').getStore().getters['messagesModel/getById'](messageId);
		}

		/**
		 * @param {number} messageId
		 * @return {BuilderModelState|null}
		 */
		getBuilder(messageId)
		{
			return this.serviceLocator.get('core').getStore().getters['messagesModel/builderModel/getByMessageId'](messageId);
		}

		/**
		 * @param {string} messageId
		 * @param {string} actionId
		 * @return {SystemButtonMetaData|CustomButtonMetaData|null}
		 */
		getButtonMetaData(messageId, actionId)
		{
			return BuilderConfiguration.getButtonMetaData(messageId, actionId);
		}
	}

	module.exports = {
		BuilderMessageHandler,
	};
});

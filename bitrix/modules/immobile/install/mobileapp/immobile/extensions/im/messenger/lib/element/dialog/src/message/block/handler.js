/**
 * @module im/messenger/lib/element/dialog/message/block/handler
 */
jn.define('im/messenger/lib/element/dialog/message/block/handler', (require, exports, module) => {
	const { EventType, BlockButtonType, BlockElementType } = require('im/messenger/const');
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
		 * Handles a tap on a builder block button (EVENT-03, variant B).
		 * The native side collects the form state locally and sends it
		 * as a single event on the submit tap; JS never sees intermediate input.
		 *
		 * @param {string} messageId
		 * @param {string} elementId - native calls this "blockId"
		 * @param {string} buttonId
		 * @param {Record<string, string | Array<string>>} [values] - form field values by stable field id;
		 * present only for a form submit tap, absent for other buttons and older native versions
		 * @return {void}
		 */
		messageBuilderButtonTap(messageId, elementId, buttonId, values)
		{
			logger.log(
				`${this.constructor.name}.messageBuilderButtonTap`,
				messageId,
				elementId,
				buttonId,
				{ valueFieldIds: Object.keys(values ?? {}) },
			);

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

			if (button.type === BlockButtonType.requestButton && !this.#isFormElementButton(message, elementId))
			{
				logger.warn(
					'messageBuilderButtonTap: request button outside a form element is ignored',
					elementId,
					buttonId,
				);

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

				const result = metaData.callback({
					messageId,
					dialogLocator: this.dialogLocator,
					elementId,
					buttonId,
					values,
				});

				if (result instanceof Promise)
				{
					result.catch((error) => {
						logger.error('messageBuilderButtonTap callback error', error);
					});
				}
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
		 * A request button submits the form to the server, so it is allowed
		 * only inside a `form` element (deny-by-default): a tap on a request
		 * button of any other element must be ignored without a network call.
		 *
		 * @param {MessagesModelState} message
		 * @param {string} elementId - native calls this "blockId"
		 * @return {boolean}
		 */
		#isFormElementButton(message, elementId)
		{
			const element = message.block?.elements?.find((item) => String(item.id) === String(elementId));

			return element?.type === BlockElementType.form;
		}

		/**
		 * Resolves the tapped button by its stable server id (ALG-01).
		 *
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

			for (const row of element.buttons)
			{
				if (!Array.isArray(row))
				{
					continue;
				}

				for (const button of row)
				{
					if (String(button.id) === String(buttonId))
					{
						return button;
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

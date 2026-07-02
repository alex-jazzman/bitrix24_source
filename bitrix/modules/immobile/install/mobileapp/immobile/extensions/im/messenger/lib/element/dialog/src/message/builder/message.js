/**
 * @module im/messenger/lib/element/dialog/message/builder/message
 */
jn.define('im/messenger/lib/element/dialog/message/builder/message', (require, exports, module) => {
	const { Color } = require('tokens');
	const { Icon } = require('assets/icons');
	const { Loc } = require('im/messenger/loc');
	const {
		MessageType,
		MessageComponent,
	} = require('im/messenger/const');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { CustomMessage } = require('im/messenger/lib/element/dialog/message/custom/message');

	const AI_ASSISTANT_COLOR_TOKEN = 'ai-assistant';

	const AI_ASSISTANT_GRADIENT = {
		colors: [
			Color.bgBitrixGptGradient5.toHex(),
			Color.bgBitrixGptGradient4.toHex(),
			Color.bgBitrixGptGradient3.toHex(),
			Color.bgBitrixGptGradient2.toHex(),
			Color.bgBitrixGptGradient1.toHex(),
		],
		positions: [0.0167, 0.2182, 0.5244, 0.7641, 0.9721],
		angle: 264,
	};

	/** @type {Record<string, string>} */
	const BuilderColorMap = {
		base: Color.base1.toHex(),
		primary: Color.chatMyPrimary2.toHex(),
		secondary: Color.base2.toHex(),
		alert: Color.accentMainAlert.toHex(),
		success: Color.accentSoftElementGreen.toHex(),
		tertiary: Color.base3.toHex(),
	};

	/**
	 * @class BuilderMessage
	 */
	class BuilderMessage extends CustomMessage
	{
		/**
		 * @param {MessagesModelState} modelMessage
		 * @param {CreateMessageOptions|{}} options
		 */
		constructor(modelMessage, options = {})
		{
			super(modelMessage, options);
			/** @type {BuilderConfig|{}} */
			this.builder = {};

			this.setMessage(modelMessage.text, options);
			this.prepareBuilder(modelMessage);
		}

		/**
		 * @return {DialogWidgetItem}
		 */
		toDialogWidgetItem()
		{
			return {
				...super.toDialogWidgetItem(),
				builder: this.#getBuilderWithoutSource(),
			};
		}

		#getBuilderWithoutSource()
		{
			if (!this.builder?.blocks)
			{
				return this.builder;
			}

			return {
				...this.builder,
				blocks: this.builder.blocks.map(({ sources, ...block }) => block),
			};
		}

		/**
		 * @param {MessagesModelState} modelMessage
		 */
		prepareBuilder(modelMessage)
		{
			const store = serviceLocator.get('core').getStore();
			this.builder = modelMessage.builder ?? store.getters['messagesModel/builderModel/getByMessageId'](modelMessage.id);

			this.resolveBlockColors();
			this.addUnsupportedBlockStub();
			this.addSourceButton();
		}

		resolveBlockColors()
		{
			if (!this.builder?.blocks)
			{
				return;
			}

			this.builder.blocks = BuilderMessage.resolveColors(this.builder.blocks);
		}

		/**
		 * @param {Array<BaseBuilderBlockType>} blocks
		 * @return {Array<BaseBuilderBlockType>}
		 */
		static resolveColors(blocks)
		{
			return blocks.map((block) => BuilderMessage.#resolveColorToken(block));
		}

		/**
		 * @param {object} target
		 * @return {object}
		 */
		static #resolveColor(target)
		{
			if (!target.color)
			{
				return target;
			}

			const resolved = { ...target };
			if (resolved.color === AI_ASSISTANT_COLOR_TOKEN)
			{
				delete resolved.color;
				resolved.colorGradient = AI_ASSISTANT_GRADIENT;
			}
			else if (BuilderColorMap[resolved.color])
			{
				resolved.color = BuilderColorMap[resolved.color];
			}

			return resolved;
		}

		/**
		 * @param {BaseBuilderBlockType} block
		 * @return {BaseBuilderBlockType}
		 */
		static #resolveColorToken(block)
		{
			const resolved = BuilderMessage.#resolveColor(block);

			if (resolved.icon?.color)
			{
				resolved.icon = BuilderMessage.#resolveColor(resolved.icon);
			}

			if (Array.isArray(resolved.elements))
			{
				resolved.elements = resolved.elements.map((element) => {
					const resolvedElement = BuilderMessage.#resolveColor(element);
					if (resolvedElement.icon?.color)
					{
						resolvedElement.icon = BuilderMessage.#resolveColor(resolvedElement.icon);
					}

					return resolvedElement;
				});
			}

			return resolved;
		}

		addUnsupportedBlockStub()
		{
			const text = Loc.getMessage('IMMOBILE_BUILDER_MESSAGE_UNSUPPORTED_BLOCK_STUB_TEXT');

			const coloredText = `[color=${Color.accentMainAlert.toHex()}]${text}[/color]`;

			let url = 'https://play.google.com/store/apps/details?id=com.bitrix24.android';
			if (Application.getPlatform() === 'ios')
			{
				url = 'https://apps.apple.com/ru/app/bitrix24/id561683423';
			}

			this.builder.unsupportedBlock = {
				text: `[url=${url}]${coloredText}[/url]`,
				iconColor: Color.accentMainAlert.toHex(),
			};
		}

		addSourceButton()
		{
			const hasSources = this.builder.blocks?.some((block) => block.sources);
			if (!hasSources)
			{
				return;
			}

			this.builder.sourceButton = {
				icon: Icon.EARTH.getIconName(),
				text: Loc.getMessage('IMMOBILE_BUILDER_MESSAGE_SOURCE_BUTTON_TEXT'),
			};
		}

		/**
		 * @abstract
		 * @return {string}
		 */
		static getComponentId()
		{
			return MessageComponent.builderMessage;
		}

		/**
		 * @abstract
		 * @return {object | undefined}
		 */
		get metaData()
		{
			return {};
		}

		/**
		 * @abstract
		 * @return {string}
		 */
		getType()
		{
			return MessageType.builder;
		}

		getComponentParams()
		{
			return this.getModelMessage()?.params?.COMPONENT_PARAMS ?? {};
		}
	}

	module.exports = {
		BuilderMessage,
	};
});

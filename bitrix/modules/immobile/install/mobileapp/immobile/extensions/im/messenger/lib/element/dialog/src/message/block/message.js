/**
 * @module im/messenger/lib/element/dialog/message/block/message
 */
jn.define('im/messenger/lib/element/dialog/message/block/message', (require, exports, module) => {
	const { Type } = require('type');
	const { clone } = require('utils/object');
	const { Color, Indent } = require('tokens');
	const { Icon } = require('assets/icons');
	const { Loc } = require('im/messenger/loc');
	const { Theme } = require('im/lib/theme');
	const {
		MessageType,
		MessageComponent,
		BlockElementType,
		BlockButtonDesignMap,
		FileType,
	} = require('im/messenger/const');
	const { Image } = require('im/messenger/lib/element/dialog/message/element/image/image');
	const { Video } = require('im/messenger/lib/element/dialog/message/element/video/video');
	const { MessageHelper } = require('im/messenger/lib/helper');
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

	const AI_ASSISTANT_MY_MESSAGE_COLOR = Color.baseWhiteFixed.toHex();

	const MY_MESSAGE_COLOR_BLOCK_TYPES = new Set([
		BlockElementType.title,
		BlockElementType.orderedList,
		BlockElementType.unorderedList,
	]);

	/** @type {Record<string, string>} */
	const BlockColorMap = {
		base: Color.base1.toHex(),
		primary: Color.chatMyPrimary2.toHex(),
		secondary: Color.base2.toHex(),
		alert: Color.accentMainAlert.toHex(),
		success: Color.accentSoftElementGreen.toHex(),
		tertiary: Color.base3.toHex(),
	};

	/** @type {Record<string, string>} */
	const BlockMyMessageColorMap = {
		base: Color.base1.toHex(),
		primary: Color.chatMyPrimary2.toHex(),
		secondary: Color.chatOtherBase1_1.toHex(),
		alert: Color.chatMyChannelAlert.toHex(),
		success: Color.chatMyColorShade.toHex(),
		tertiary: Color.chatOtherBase1_2.toHex(),
	};

	/** @type {Record<string, string>} */
	const BlockBackgroundColorMap = {
		plain: Color.chatOtherMessage1.toHex(),
	};


	/**
	 * @class BlockMessage
	 */
	class BlockMessage extends CustomMessage
	{
		/**
		 * @param {MessagesModelState} modelMessage
		 * @param {CreateMessageOptions|{}} options
		 */
		constructor(modelMessage, options = {})
		{
			super(modelMessage, options);
			this.mediaList = [];
			/** @type {BlockConfig|{}} */
			this.block = {};

			this.setMessage(modelMessage.text, options);
			this.#prepareBlock(modelMessage);
		}

		/**
		 * @return {DialogWidgetItem}
		 */
		toDialogWidgetItem()
		{
			const item = {
				...super.toDialogWidgetItem(),
				builder: this.#getBlockWithoutSource(),
			};

			if (this.mediaList.length > 0)
			{
				item.mediaList = this.mediaList;
			}

			return item;
		}

		/**
		 * Converts internal block state to native format, stripping sources.
		 * @return {object}
		 */
		#getBlockWithoutSource()
		{
			if (!this.block?.elements)
			{
				return this.block;
			}

			const { elements, ...rest } = this.block;

			return {
				...rest,
				blocks: elements.map(({ sources, ...element }) => element),
			};
		}

		/**
		 * @param {MessagesModelState} modelMessage
		 */
		#prepareBlock(modelMessage)
		{
			const store = serviceLocator.get('core').getStore();
			const raw = modelMessage.block ?? store.getters['messagesModel/blockModel/getByMessageId'](modelMessage.id);
			const cloned = clone(raw);

			this.block = {
				elements: cloned?.elements ?? [],
				background: cloned?.background ?? null,
			};

			this.#resolveBlockColors();
			this.#addUnsupportedBlockStub();
			this.#addSourceButton();
			this.#convertCardButtons();
			this.#prepareMediaList();
			this.#applyBackground();
		}

		#applyBackground()
		{
			const backgroundColor = BlockBackgroundColorMap[this.block?.background];
			if (backgroundColor)
			{
				this.setIsBackgroundOn(true);
				this.setBackgroundColor(backgroundColor);
			}
		}

		#prepareMediaList()
		{
			const messageHelper = MessageHelper.createById(this.id);
			const files = messageHelper.getBlockMediaFiles();

			this.mediaList = [];
			for (const file of files)
			{
				if (file.type === FileType.image)
				{
					this.mediaList.push(Image.createByFileModel(file).toMessageFormat());
				}
				else if (file.type === FileType.video)
				{
					this.mediaList.push(Video.createByFileModel(file).toMessageFormat());
				}
			}
		}

		#resolveBlockColors()
		{
			if (!this.block?.elements)
			{
				return;
			}

			const isMyDarkMessage = this.me && Theme.getInstance().getId() === 'dark';
			this.block.elements = BlockMessage.resolveColors(this.block.elements, isMyDarkMessage);
		}

		/**
		 * @param {Array<BaseBlockElementType>} blocks
		 * @param {boolean} [isMe=false]
		 * @return {Array<BaseBlockElementType>}
		 */
		static resolveColors(blocks, isMe = false)
		{
			return blocks.map((block) => BlockMessage.#resolveColorToken(block, isMe));
		}

		/**
		 * @param {object} target
		 * @param {boolean} isMe
		 * @param {boolean} useMyColorMap
		 * @return {object}
		 */
		static #resolveColor(target, isMe, useMyColorMap)
		{
			if (!target.color)
			{
				return target;
			}

			const colorMap = useMyColorMap ? BlockMyMessageColorMap : BlockColorMap;
			const resolved = { ...target };
			if (resolved.color === AI_ASSISTANT_COLOR_TOKEN)
			{
				delete resolved.color;
				if (isMe)
				{
					resolved.color = AI_ASSISTANT_MY_MESSAGE_COLOR;
				}
				else
				{
					resolved.colorGradient = AI_ASSISTANT_GRADIENT;
				}
			}
			else if (colorMap[resolved.color])
			{
				resolved.color = colorMap[resolved.color];
			}

			return resolved;
		}

		/**
		 * @param {BaseBlockElementType} block
		 * @param {boolean} isMe
		 * @return {BaseBlockElementType}
		 */
		static #resolveColorToken(block, isMe)
		{
			const useMyColorMap = isMe && MY_MESSAGE_COLOR_BLOCK_TYPES.has(block.type);
			const resolved = BlockMessage.#resolveColor(block, isMe, useMyColorMap);

			if (resolved.icon?.color)
			{
				resolved.icon = BlockMessage.#resolveColor(resolved.icon, isMe, useMyColorMap);
			}

			if (Type.isArrayFilled(resolved.elements))
			{
				resolved.elements = resolved.elements.map((element) => {
					const resolvedElement = BlockMessage.#resolveColor(element, isMe, useMyColorMap);
					if (resolvedElement.icon?.color)
					{
						resolvedElement.icon = BlockMessage.#resolveColor(resolvedElement.icon, isMe, useMyColorMap);
					}

					return resolvedElement;
				});
			}

			return resolved;
		}

		/**
		 * @param {string} design
		 * @return {string}
		 */
		static #resolveButtonDesign(design)
		{
			return BlockButtonDesignMap[design] ?? 'filled';
		}

		#convertCardButtons()
		{
			if (!Type.isArrayFilled(this.block?.elements))
			{
				return;
			}

			this.block.elements = this.block.elements.map((block) => {
				if (block.type !== 'card' || !Type.isArrayFilled(block.buttons))
				{
					return block;
				}

				return {
					...block,
					buttons: block.buttons.map((row, rowIndex) => {
						return row.map((button, buttonIndex) => ({
							...button,
							id: `${block.id}-${rowIndex}-${buttonIndex}`,
							text: button.title || '',
							design: BlockMessage.#resolveButtonDesign(button.design),
							height: Indent.S.getName(),
							disabled: button.isDisabled ?? false,
							hasLoader: button.isLoading ?? false,
						}));
					}),
				};
			});
		}

		#addUnsupportedBlockStub()
		{
			const text = Loc.getMessage('IMMOBILE_BUILDER_MESSAGE_UNSUPPORTED_BLOCK_STUB_TEXT');

			const coloredText = `[color=${Color.accentMainAlert.toHex()}]${text}[/color]`;

			let url = 'https://play.google.com/store/apps/details?id=com.bitrix24.android';
			if (Application.getPlatform() === 'ios')
			{
				url = 'https://apps.apple.com/ru/app/bitrix24/id561683423';
			}

			this.block.unsupportedBlock = {
				text: `[url=${url}]${coloredText}[/url]`,
				iconColor: Color.accentMainAlert.toHex(),
			};
		}

		#addSourceButton()
		{
			const hasSources = this.block.elements?.some((block) => block.sources);
			if (!hasSources)
			{
				return;
			}

			this.block.sourceButton = {
				icon: Icon.EARTH.getIconName(),
				text: Loc.getMessage('IMMOBILE_BUILDER_MESSAGE_SOURCE_BUTTON_TEXT'),
			};
		}

		/**
		 * Block messages render text through the block elements, not through the message field.
		 * We only keep quote elements in message because native needs them for the quote UI,
		 * while the rest of the text would be redundant with block content.
		 *
		 * @override
		 * @param {string} text
		 * @param {object} options
		 */
		setMessage(text = '', options = {})
		{
			super.setMessage(text, options);

			this.message = this.message.filter((element) => {
				return element.type === 'quote-active' || element.type === 'quote-inactive';
			});
		}

		/**
		 * @abstract
		 * @return {string}
		 */
		static getComponentId()
		{
			return MessageComponent.blockMessage;
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

		/** @override */
		getComponentParams()
		{
			return this.getModelMessage()?.params?.COMPONENT_PARAMS ?? {};
		}
	}

	module.exports = {
		BlockMessage,
	};
});

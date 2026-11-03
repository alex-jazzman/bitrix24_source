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
	const { File } = require('im/messenger/lib/element/dialog/message/element/file/file');
	const { Audio } = require('im/messenger/lib/element/dialog/message/element/audio/audio');
	const { MessageHelper, formatFileSize } = require('im/messenger/lib/helper');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { Feature } = require('im/messenger/lib/feature');
	const { CustomMessage } = require('im/messenger/lib/element/dialog/message/custom/message');

	const AI_ASSISTANT_COLOR_TOKEN = 'ai-assistant';

	// A block element the client must not render (its server FEAT flag is off) is downgraded to this
	// unknown type, so native falls back to the existing unsupported-block stub: the same path old
	// builds without native support for the element already use.
	const UNSUPPORTED_BLOCK_ELEMENT_TYPE = 'unsupported';

	const FILE_BLOCK_ELEMENT_TYPES = new Set([
		BlockElementType.file,
		BlockElementType.audio,
	]);

	// A single file tile carries its own download icon, so the batch download caption
	// is a part of a multi-file container only.
	const BATCH_DOWNLOAD_MIN_FILE_COUNT = 2;

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

	const PROGRESS_MIN_VALUE = 0;
	const PROGRESS_MAX_VALUE = 100;

	// the web falls back on the same token, so an unknown one looks the same on every client
	const PROGRESS_FALLBACK_COLOR_TOKEN = 'base';
	const SOLID_GRADIENT_POSITIONS = [0, 1];

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
			this.#prepareBlock(modelMessage, options);
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
		 * @param {CreateMessageOptions|{}} options
		 */
		#prepareBlock(modelMessage, options)
		{
			const store = serviceLocator.get('core').getStore();
			const raw = modelMessage.block ?? store.getters['messagesModel/blockModel/getByMessageId'](modelMessage.id);
			const cloned = clone(raw);

			this.block = {
				elements: cloned?.elements ?? [],
				background: cloned?.background ?? null,
			};

			const messageHelper = MessageHelper.createByModel(modelMessage);

			this.#gateUnsupportedFormBlock();
			this.#gateUnsupportedFileBlocks();
			this.#resolveBlockColors();
			this.#addUnsupportedBlockStub();
			this.#addSourceButton();
			this.#convertCardButtons();
			this.#convertFormButtons();
			this.#prepareMediaList(messageHelper);
			this.#prepareBlockFiles(messageHelper, modelMessage, options);
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

		/**
		 * @param {MessageHelper|null} messageHelper
		 */
		#prepareMediaList(messageHelper)
		{
			const files = messageHelper?.getBlockMediaFiles() ?? [];

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

		/**
		 * Fills the data channels of the file block elements (DTO-06): the file container gets
		 * ready file models and the ready-made batch download caption, the audio element gets a
		 * ready audio model. Native resolves nothing and formats nothing on its own.
		 *
		 * @param {MessageHelper|null} messageHelper
		 * @param {MessagesModelState} modelMessage
		 * @param {CreateMessageOptions|{}} options
		 */
		#prepareBlockFiles(messageHelper, modelMessage, options)
		{
			if (!this.#hasFileBlockElement() || !messageHelper)
			{
				return;
			}

			// the playback state addresses the message, so the channel goes to the element that state
			// belongs to: an extra audio element would get a player nothing controls
			const playableAudioIndex = this.block.elements.findIndex(
				(element) => element.type === BlockElementType.audio,
			);

			this.block.elements = this.block.elements.map((element, index) => {
				if (element.type === BlockElementType.file)
				{
					return BlockMessage.#addFileList(element, messageHelper);
				}

				if (element.type === BlockElementType.audio && index === playableAudioIndex)
				{
					return BlockMessage.#addAudio(element, messageHelper, modelMessage, options);
				}

				return element;
			});
		}

		/**
		 * The files are read from the store only for a message that really carries a file element:
		 * a block message without one must not pay for the lookup on every update.
		 *
		 * @return {boolean}
		 */
		#hasFileBlockElement()
		{
			if (!Type.isArrayFilled(this.block?.elements))
			{
				return false;
			}

			return this.block.elements.some((element) => FILE_BLOCK_ELEMENT_TYPES.has(element.type));
		}

		/**
		 * @param {FileBlockElementType} element
		 * @param {MessageHelper} messageHelper
		 * @return {FileBlockElementType|FileBlockDialogWidgetItemBlock}
		 */
		static #addFileList(element, messageHelper)
		{
			const fileIds = MessageHelper.getBlockElementFileIds(element);
			const fileList = messageHelper.getBlockFilesByIds(fileIds)
				.map((fileModel) => File.createByFileModel(fileModel).toMessageFormat());

			// a container with no resolved model is left without the channel, the same way an audio
			// element without its model is: native gets no data to render instead of an empty frame
			if (fileList.length === 0)
			{
				return element;
			}

			const preparedElement = { ...element, fileList };

			const downloadText = BlockMessage.#getBatchDownloadText(fileList);
			if (downloadText !== '')
			{
				preparedElement.downloadText = downloadText;
			}

			return preparedElement;
		}

		/**
		 * @param {AudioBlockElementType} element
		 * @param {MessageHelper} messageHelper
		 * @param {MessagesModelState} modelMessage
		 * @param {CreateMessageOptions|{}} options
		 * @return {AudioBlockElementType|AudioBlockDialogWidgetItemBlock}
		 */
		static #addAudio(element, messageHelper, modelMessage, options)
		{
			const fileIds = MessageHelper.getBlockElementFileIds(element);
			const [fileModel] = messageHelper.getBlockFilesByIds(fileIds);

			// a file that is not audio is left without the channel, the same way a missing model is:
			// the playback resolver skips such a file, so a player for it would never start
			if (fileModel?.type !== FileType.audio)
			{
				return element;
			}

			const audio = new Audio(modelMessage, fileModel, null, options);

			// `Audio` opens both channels by the file flag, not by the state of the message, so the
			// client closes them here: block audio is neither transcribed nor a voice note
			return {
				...element,
				audio: { ...audio.toMessageFormat(), speech2text: null, aiAnimation: null },
			};
		}

		/**
		 * Batch download caption of the file container: the client counts the files, sums up
		 * their size and declines the phrase, native shows the string as is.
		 *
		 * @param {Array<MessageFile>} fileList
		 * @return {string}
		 */
		static #getBatchDownloadText(fileList)
		{
			if (fileList.length < BATCH_DOWNLOAD_MIN_FILE_COUNT)
			{
				return '';
			}

			const totalSize = fileList.reduce((size, file) => size + (file.sizeBytes ?? 0), 0);

			return Loc.getMessagePlural(
				'IMMOBILE_BUILDER_MESSAGE_FILE_BLOCK_DOWNLOAD_ALL',
				fileList.length,
				{
					'#COUNT#': fileList.length,
					'#SIZE#': formatFileSize(totalSize),
				},
			) ?? '';
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

			return BlockMessage.#resolveProgress(resolved, isMe);
		}

		/**
		 * Progress of the agent work block: the client expands the color token and normalizes the
		 * value, so native gets it as `{ value, colorGradient }` and resolves nothing on its own.
		 *
		 * @param {BaseBlockElementType} element
		 * @param {boolean} isMe
		 * @return {BaseBlockElementType}
		 */
		static #resolveProgress(element, isMe)
		{
			if (element.type !== BlockElementType.aiAssistantSearch || Type.isNil(element.progress))
			{
				return element;
			}

			const progress = {
				value: BlockMessage.#clampProgressValue(element.progress.value),
				colorGradient: BlockMessage.#resolveGradientByToken(element.progress.colorToken, isMe),
			};

			return { ...element, progress };
		}

		/**
		 * Expands a color token the same way a block color is expanded. The progress carries a
		 * gradient and nothing else, so a plain color is passed as a gradient of one color: every
		 * token reaches native as a color of its own, and no platform is left picking a default.
		 * The server sends no token for the default progress, so the branded one is the client choice.
		 *
		 * @param {BlockColorToken} [colorToken]
		 * @param {boolean} isMe
		 * @return {BlockColorGradient}
		 */
		static #resolveGradientByToken(colorToken, isMe)
		{
			const token = Type.isStringFilled(colorToken) ? colorToken : AI_ASSISTANT_COLOR_TOKEN;
			const { color, colorGradient } = BlockMessage.#resolveColor({ color: token }, isMe, false);

			if (colorGradient)
			{
				return colorGradient;
			}

			// an unknown token is left as it came, so the token itself marks the one to fall back on
			const plainColor = color === token
				? BlockColorMap[PROGRESS_FALLBACK_COLOR_TOKEN]
				: color;

			return BlockMessage.#toSolidGradient(plainColor);
		}

		/**
		 * @param {string} color
		 * @return {BlockColorGradient}
		 */
		static #toSolidGradient(color)
		{
			return {
				colors: [color, color],
				positions: SOLID_GRADIENT_POSITIONS,
				angle: AI_ASSISTANT_GRADIENT.angle,
			};
		}

		/**
		 * Second line after the server normalization: a value out of the range or not a number at
		 * all is clamped instead of breaking the block. A numeric string is read as the number it
		 * carries, the same way a block file id is.
		 *
		 * @param {number|string} value
		 * @return {number}
		 */
		static #clampProgressValue(value)
		{
			const numericValue = Number(value);
			if (!Number.isFinite(numericValue))
			{
				return PROGRESS_MIN_VALUE;
			}

			return Math.min(Math.max(numericValue, PROGRESS_MIN_VALUE), PROGRESS_MAX_VALUE);
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
					buttons: block.buttons.map((row) => {
						return row.map((button) => ({
							...button,
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

		/**
		 * Defensive gate for the interactive form block (Feature.isMessageFormBlockAvailable).
		 * The server create path is already gated on the backend; this guards messages that
		 * still carry a `form` element (e.g. restored from the local DB cache or sent while the
		 * flag differed). With the flag off, the form element is downgraded to an unknown type,
		 * so native renders the existing unsupported-block stub instead of the form UI. Other
		 * block element types and card buttons are untouched.
		 */
		#gateUnsupportedFormBlock()
		{
			if (Feature.isMessageFormBlockAvailable || !Type.isArrayFilled(this.block?.elements))
			{
				return;
			}

			this.block.elements = this.block.elements.map((element) => {
				if (element.type !== BlockElementType.form)
				{
					return element;
				}

				return { ...element, type: UNSUPPORTED_BLOCK_ELEMENT_TYPE };
			});
		}

		/**
		 * Gate for the `file` and `audio` block elements (Feature.isMessageFileAudioBlockAvailable).
		 * The server create path is already gated on the backend; this guards messages that still
		 * carry such an element (e.g. restored from the local DB cache or sent while the flag
		 * differed). With the flag off, the element is downgraded to an unknown type, so native
		 * renders the existing unsupported-block stub instead of the file UI. The rest of the
		 * block elements are untouched.
		 */
		#gateUnsupportedFileBlocks()
		{
			if (Feature.isMessageFileAudioBlockAvailable || !Type.isArrayFilled(this.block?.elements))
			{
				return;
			}

			this.block.elements = this.block.elements.map((element) => {
				if (!FILE_BLOCK_ELEMENT_TYPES.has(element.type))
				{
					return element;
				}

				return { ...element, type: UNSUPPORTED_BLOCK_ELEMENT_TYPE };
			});
		}

		#convertFormButtons()
		{
			if (!Type.isArrayFilled(this.block?.elements))
			{
				return;
			}

			this.block.elements = BlockMessage.convertFormButtons(this.block.elements);
		}

		/**
		 * Resolves the design tokens of form buttons for the native payload.
		 * Form fields and buttons keep the server ids as is:
		 * the stable button id is required to resolve the submit action.
		 *
		 * @param {Array<BaseBlockElementType>} elements
		 * @return {Array<BaseBlockElementType>}
		 */
		static convertFormButtons(elements)
		{
			return elements.map((element) => {
				if (element.type !== BlockElementType.form || !Type.isArrayFilled(element.buttons))
				{
					return element;
				}

				return {
					...element,
					buttons: element.buttons.map((row) => {
						return row.map((button) => ({
							...button,
							design: BlockMessage.#resolveButtonDesign(button.design),
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

		/**
		 * The playback state of the block audio is read from the same message model fields a regular
		 * audio message uses: one audio block per message keeps the "message -> one playing audio"
		 * identity. Native gets the state inside the audio element of the block.
		 *
		 * @return {boolean}
		 */
		getIsPlaying()
		{
			return this.#getAudioElement()?.audio?.isPlaying === true;
		}

		/**
		 * @param {number} playingTime
		 */
		setPlayingTime(playingTime)
		{
			if (!Type.isNumber(playingTime))
			{
				return;
			}

			const audioElement = this.#getAudioElement();
			if (audioElement?.audio)
			{
				audioElement.audio.playingTime = playingTime;
			}
		}

		/**
		 * @return {AudioBlockDialogWidgetItemBlock|AudioBlockElementType|null}
		 */
		#getAudioElement()
		{
			if (!Type.isArrayFilled(this.block?.elements))
			{
				return null;
			}

			return this.block.elements.find((element) => element.type === BlockElementType.audio) ?? null;
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

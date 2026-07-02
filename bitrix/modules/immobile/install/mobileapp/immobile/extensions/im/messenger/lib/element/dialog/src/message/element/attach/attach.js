/**
 * @module im/messenger/lib/element/dialog/message/element/attach/attach
 */
jn.define('im/messenger/lib/element/dialog/message/element/attach/attach', (require, exports, module) => {
	const { Type } = require('type');
	const { Loc } = require('im/messenger/loc');
	const { clone } = require('utils/object');
	const {
		AttachType,
		AttachColorToken,
		AttachGridItemDisplay,
	} = require('im/messenger/const');
	const { Color } = require('tokens');
	const { parser } = require('im/messenger/lib/parser/parser');
	const { formatFileSize } = require('im/messenger/lib/helper');
	const { LoggerManager } = require('im/messenger/lib/logger');
	const logger = LoggerManager.getInstance().getLogger('element--message-attach');

	class Attach
	{
		/**
		 * @param {AttachModelItem} modelAttach
		 * @param {object} options
		 * @param {boolean} [options.isSystemStyled]
		 */
		static createByMessagesModelAttach(modelAttach, options = {})
		{
			return new this(modelAttach, options);
		}

		/**
		 * @param {AttachModelItem} modelAttach
		 * @param {object} options
		 * @param {boolean} [options.isSystemStyled]
		 */
		constructor(modelAttach, options = {})
		{
			/**
			 * @type AttachModelItem
			 */
			this.modelAttach = [];
			if (Type.isArrayFilled(modelAttach))
			{
				this.modelAttach = modelAttach;
			}

			this.isSystemStyled = options.isSystemStyled ?? false;
		}

		/**
		 * @return {AttachConfig[]}
		 */
		toMessageFormat()
		{
			const messageAttach = clone(this.modelAttach).map((item) => {
				if (!Type.isStringFilled(item.colorToken))
				{
					// eslint-disable-next-line no-param-reassign
					item.colorToken = AttachColorToken.primary;
				}

				const blocks = [];

				item.blocks.forEach((block) => {
					const messageBlocks = this.#toBlocks(block);
					blocks.push(...messageBlocks);
				});

				return {
					...item,
					blocks,
				};
			});

			logger.log(`${this.constructor.name}.toMessageFormat: `, this.modelAttach, messageAttach);

			return messageAttach;
		}

		/**
		 * @param {AttachBlock} block
		 * @return {AttachBlock[]}
		 */
		#toBlocks(block)
		{
			if (block[AttachType.grid])
			{
				return this.#toGridBlocks(block[AttachType.grid]);
			}

			if (block[AttachType.file])
			{
				return [
					this.#toFileBlock(block[AttachType.file]),
				];
			}

			if (block[AttachType.rich])
			{
				return [
					this.#toRichLinkBlock(block[AttachType.rich]),
				];
			}

			if (block[AttachType.link])
			{
				return [
					this.#toLinkBlock(block[AttachType.link]),
				];
			}

			if (block[AttachType.message])
			{
				return [
					this.#toMessageBlock(block[AttachType.message]),
				];
			}

			if (block[AttachType.image])
			{
				return [
					this.#toImageBlock(block[AttachType.image]),
				];
			}

			if (block[AttachType.user])
			{
				return [
					this.#toUserBlock(block[AttachType.user]),
				];
			}

			if (block[AttachType.delimiter])
			{
				return [
					this.#toDelimiterBlock(block[AttachType.delimiter]),
				];
			}

			return [block];
		}

		/**
		 * @param {AttachGridItemConfig[]} grid
		 * @return {AttachBlock[]}
		 */
		#toGridBlocks(grid)
		{
			const result = [];
			let tempGrid = [];
			let lastWasLine = false;

			for (let itemIndex = 0; itemIndex < grid.length; itemIndex++)
			{
				const item = grid[itemIndex];
				item.value = parser.decodeTextForAttachBlock(item.value);
				if (Type.isStringFilled(item.link))
				{
					item.value = `[url=${item.link}]${item.value}[/url]`;
				}

				if (!Type.isStringFilled(item.colorToken))
				{
					// eslint-disable-next-line no-param-reassign
					item.colorToken = AttachColorToken.base;
				}

				if (item.display === AttachGridItemDisplay.line)
				{
					if (tempGrid.length > 0)
					{
						result.push(this.#createGridBlock(tempGrid));
						tempGrid = [];
					}

					result.push(this.#createGridWithDisplayBlock(item));
					lastWasLine = true;

					continue;
				}

				if (lastWasLine)
				{
					result.push(this.#createBaseDelimiter());
					lastWasLine = false;
				}

				const gridData = {
					...item,
					display: AttachGridItemDisplay.block,
				};

				if (this.isSystemStyled)
				{
					gridData.style = this.#getGridSystemStyle();
				}

				tempGrid.push(gridData);

				if (
					itemIndex === grid.length - 1
					|| (
						grid[itemIndex + 1].display !== AttachGridItemDisplay.row
						&& grid[itemIndex + 1].display !== AttachGridItemDisplay.block
					)
				)
				{
					result.push(this.#createGridBlock(tempGrid));
					tempGrid = [];
				}
			}

			if (tempGrid.length > 0)
			{
				result.push(this.#createGridBlock(tempGrid));
			}

			return result;
		}

		/**
		 * @param {AttachFileItemConfig[]} files
		 * @return {AttachFileConfig}
		 */
		#toFileBlock(files)
		{
			const attachFiles = files.map((file) => {
				const attachFile = file;
				if (Type.isNumber(file.size))
				{
					attachFile.displayedSize = formatFileSize(file.size);
				}

				attachFile.downloadText = Loc.getMessage('IMMOBILE_ELEMENT_DIALOG_MESSAGE_ATTACH_FILE_DOWNLOAD');

				if (this.isSystemStyled)
				{
					attachFile.style = this.#getFileSystemStyle();
				}

				return attachFile;
			});

			return {
				[AttachType.file]: attachFiles,
			};
		}

		/**
		 * @param {AttachRichItemConfig[]} richItems
		 * @return {AttachRichConfig}
		 */
		#toRichLinkBlock(richItems)
		{
			const rich = richItems.map((richLink) => {
				let previewUrl = richLink.preview ?? null;
				if (Type.isString(previewUrl) && !previewUrl.startsWith('http'))
				{
					previewUrl = currentDomain + previewUrl;
				}

				const data = {
					link: richLink.link ?? '',
					desc: richLink.desc ?? '',
					name: richLink.name ?? '',
					previewUrl,
					previewSize: {
						height: richLink?.previewSize?.height ?? 0,
						width: richLink?.previewSize?.width ?? 0,
					},
				};

				if (this.isSystemStyled)
				{
					data.style = this.#getRichLinkSystemStyle();
				}

				return data;
			});

			return {
				[AttachType.rich]: rich,
			};
		}

		/**
		 * @param {AttachLinkItemConfig[]} link
		 * @return {AttachLinkConfig}
		 */
		#toLinkBlock(link)
		{
			const linkConfig = link[0];

			const linkData = {
				preview: linkConfig.preview,
				width: linkConfig.width,
				height: linkConfig.height,
				name: linkConfig.name,
				desc: parser.decodeTextForAttachBlock(linkConfig.desc),
				link: linkConfig.link,
			};

			if (this.isSystemStyled)
			{
				linkData.style = this.#getLinkSystemStyle();
			}

			return {
				[AttachType.link]: [linkData],
			};
		}

		/**
		 * @param {AttachMessageBlock} message
		 * @return {AttachMessageConfig}
		 */
		#toMessageBlock(message)
		{
			if (this.isSystemStyled)
			{
				return {
					[AttachType.message]: {
						text: parser.decodeTextForAttachBlock(message),
						style: this.#getMessageSystemStyle(),
					},
				};
			}

			return {
				[AttachType.message]: parser.decodeTextForAttachBlock(message),
			};
		}

		/**
		 * @param {AttachImageItemConfig[]} images
		 * @return {AttachImageConfig}
		 */
		#toImageBlock(images)
		{
			const data = images.map((image) => {
				const imageData = { ...image };
				if (this.isSystemStyled)
				{
					imageData.style = this.#getImageSystemStyle();
				}

				return imageData;
			});

			return {
				[AttachType.image]: data,
			};
		}

		/**
		 * @param {AttachUserItemConfig[]} users
		 * @return {AttachUserConfig}
		 */
		#toUserBlock(users)
		{
			const data = users.map((user) => {
				const userData = { ...user };
				if (this.isSystemStyled)
				{
					userData.style = this.#getUserSystemStyle();
				}

				return userData;
			});

			return {
				[AttachType.user]: data,
			};
		}

		/**
		 * @param {AttachDelimiterConfig['delimiter']} delimiter
		 * @return {AttachDelimiterConfig}
		 */
		#toDelimiterBlock(delimiter)
		{
			const data = delimiter;
			if (this.isSystemStyled)
			{
				data.style = data.color ? this.#getDelimiterCustomSystemStyle() : this.#getDelimiterBaseSystemStyle();
			}

			return {
				[AttachType.delimiter]: data,
			};
		}

		/**
		 * @param {AttachGridItemConfig[]} gridItems
		 * @return {AttachGridConfig}
		 */
		#createGridBlock(gridItems)
		{
			return { [AttachType.grid]: gridItems };
		}

		/**
		 * @param {AttachGridItemConfig} grid
		 * @return {AttachGridConfig}
		 */
		#createGridWithDisplayBlock(grid)
		{
			const data = {
				...grid,
				display: AttachGridItemDisplay.block,
			};

			if (this.isSystemStyled)
			{
				data.style = this.#getGridSystemStyle();
			}

			return {
				[AttachType.grid]: [data],
			};
		}

		/**
		 * @return {AttachDelimiterConfig}
		 */
		#createBaseDelimiter()
		{
			const block = {
				[AttachType.delimiter]: {
					// fake size and color, chat.dialog widget will ignore it
					size: 200,
					color: '#c6c6c6',
				},
			};

			if (this.isSystemStyled)
			{
				block[AttachType.delimiter].style = this.#getDelimiterBaseSystemStyle();
			}

			return block;
		}

		#getUserSystemStyle()
		{
			return {
				nameColor: Color.accentMainPrimary.toHex(),
			};
		}

		/**
		 * @return {object}
		 */
		#getDelimiterBaseSystemStyle()
		{
			return {
				lineColor: Color.chatOverallBase0.toHex(),
			};
		}

		/**
		 * @return {object}
		 */
		#getDelimiterCustomSystemStyle()
		{
			return {
				lineColor: Color.chatOtherBase0_1.toHex(),
			};
		}

		#getLinkSystemStyle()
		{
			return {
				nameColor: Color.accentMainPrimary.toHex(),
				descriptionColor: Color.base1.toHex(),
			};
		}

		#getRichLinkSystemStyle()
		{
			return {
				nameColor: Color.accentMainPrimary.toHex(),
				descriptionColor: Color.chatOtherBase1_1.toHex(),
			};
		}

		#getMessageSystemStyle()
		{
			return {
				fontColor: Color.base1.toHex(),
				linkColor: Color.accentMainPrimary.toHex(),
				mentionColor: Color.accentMainPrimary.toHex(),
				linkUnderlined: false,
			};
		}

		#getImageSystemStyle()
		{
			return {
				nameColor: Color.base1.toHex(),
			};
		}

		#getFileSystemStyle()
		{
			return {
				nameColor: Color.accentMainPrimary.toHex(),
				displayedSizeColor: Color.chatOtherBase1_1.toHex(),
			};
		}

		#getGridSystemStyle()
		{
			return {
				nameColor: Color.base1.toHex(),
				valueStyle: {
					fontColor: Color.chatOtherBase1_1.toHex(),
					linkColor: Color.accentMainPrimary.toHex(),
					mentionColor: Color.accentMainPrimary.toHex(),
					linkUnderlined: false,
				},
			};
		}
	}

	module.exports = { Attach };
});

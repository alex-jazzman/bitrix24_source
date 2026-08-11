/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports, main_core, im_public, im_v2_lib_desktopApi) {
	'use strict';

	const settings = main_core.Extension.getSettings('im.v2.lib.parser');
	const v2 = settings.get('v2');
	const CoreProxy = {
		getCore() {
			return v2 ? BX.Messenger.v2.Application.Core : BX.Messenger.Embedding.Application.Core;
		},
		getUtils() {
			return v2 ? BX.Messenger.v2.Lib.Utils : BX.Messenger.Embedding.Lib.Utils;
		},
		getLogger() {
			return v2 ? BX.Messenger.v2.Lib.Logger : BX.Messenger.Embedding.Lib.Logger;
		},
		getConst() {
			return v2 ? BX.Messenger.v2.Const : BX.Messenger.Embedding.Const;
		},
		getSmileManager() {
			return v2 ? BX.Messenger.v2.Lib.SmileManager : BX.Messenger.Embedding.Lib.SmileManager;
		},
		getBigSmileOption() {
			if (v2) {
				const settingName = BX.Messenger.v2.Const.Settings.message.bigSmiles;
				return CoreProxy.getCore().getStore().getters['application/settings/get'](settingName);
			}
			return CoreProxy.getCore().getStore().getters['application/getOption']('bigSmileEnable');
		}
	};
	const getCore = () => CoreProxy.getCore();
	const getUtils = () => CoreProxy.getUtils();
	const getLogger = () => CoreProxy.getLogger();
	const getConst = () => CoreProxy.getConst();
	const getSmileManager = () => CoreProxy.getSmileManager();
	const getBigSmileOption = () => CoreProxy.getBigSmileOption();

	const RECURSIVE_LIMIT = 10;
	const ParserUtils = {
		recursiveReplace(text, pattern, replacement) {
			if (!main_core.Type.isStringFilled(text)) {
				return text;
			}
			let count = 0;
			let deep = true;
			do {
				deep = false;
				count++;
				text = text.replace(pattern, (...params) => {
					deep = true;
					return replacement(...params);
				});
			} while (deep && count <= RECURSIVE_LIMIT);
			return text;
		},
		getFinalContextTag(contextTag) {
			const match = contextTag.match(/(chat\d+|(\d+):(\d+))\/(\d+)/i);
			if (!match) {
				return '';
			}
			let [, dialogId, user1, user2, messageId] = match;
			if (dialogId.toString().startsWith('chat')) {
				if (dialogId === 'chat0') {
					return '';
				}
				return contextTag;
			}
			user1 = Number.parseInt(user1, 10);
			user2 = Number.parseInt(user2, 10);
			if (getCore().getUserId() === user1) {
				return `${user2}/${messageId}`;
			}
			if (getCore().getUserId() === user2) {
				return `${user1}/${messageId}`;
			}
			return '';
		},
		getDialogIdFromFinalContextTag(finalContextTag) {
			if (!/^(chat\d+|\d+)\/\d+$/.test(finalContextTag)) {
				return '';
			}
			const [dialogId] = finalContextTag.split('/');
			return dialogId;
		},
		getDialogIdByChatId(chatId) {
			const dialog = getCore().getStore().getters['chats/getByChatId'](chatId);
			if (!dialog) {
				return '';
			}
			return dialog.dialogId;
		}
	};

	const ParserFont = {
		decode(text) {
			text = ParserUtils.recursiveReplace(text, /\[b]([^[]*(?:\[(?!b]|\/b])[^[]*)*)\[\/b]/gi, (whole, text) => '<b>' + text + '</b>');
			text = ParserUtils.recursiveReplace(text, /\[u]([^[]*(?:\[(?!u]|\/u])[^[]*)*)\[\/u]/gi, (whole, text) => '<u>' + text + '</u>');
			text = ParserUtils.recursiveReplace(text, /\[i]([^[]*(?:\[(?!i]|\/i])[^[]*)*)\[\/i]/gi, (whole, text) => '<i>' + text + '</i>');
			text = ParserUtils.recursiveReplace(text, /\[s]([^[]*(?:\[(?!s]|\/s])[^[]*)*)\[\/s]/gi, (whole, text) => '<s>' + text + '</s>');
			text = ParserUtils.recursiveReplace(text, /\[size=(\d+)(?:pt|px)?](.*?)\[\/size]/gis, (whole, number, text) => {
				number = Number.parseInt(number, 10);
				if (number <= 8) {
					number = 8;
				} else if (number >= 30) {
					number = 30;
				}
				return main_core.Dom.create({
					tag: 'span',
					style: {
						fontSize: `${number}px`
					},
					html: text
				}).outerHTML;
			});
			text = ParserUtils.recursiveReplace(text, /\[color=#([0-9a-f]{3}|[0-9a-f]{6})](.*?)\[\/color]/gis, (whole, hex, text) => {
				return main_core.Dom.create({
					tag: 'span',
					style: {
						color: '#' + hex
					},
					html: text
				}).outerHTML;
			});
			return text;
		},
		purify(text, removeStrike = true) {
			if (removeStrike) {
				text = ParserUtils.recursiveReplace(text, /\[s]([^[]*(?:\[(?!s]|\/s])[^[]*)*)\[\/s]/gi, () => ' ');
			}
			text = ParserUtils.recursiveReplace(text, /\[b]([^[]*(?:\[(?!b]|\/b])[^[]*)*)\[\/b]/gi, (whole, text) => text);
			text = ParserUtils.recursiveReplace(text, /\[u]([^[]*(?:\[(?!u]|\/u])[^[]*)*)\[\/u]/gi, (whole, text) => text);
			text = ParserUtils.recursiveReplace(text, /\[i]([^[]*(?:\[(?!i]|\/i])[^[]*)*)\[\/i]/gi, (whole, text) => text);
			text = ParserUtils.recursiveReplace(text, /\[s]([^[]*(?:\[(?!s]|\/s])[^[]*)*)\[\/s]/gi, (whole, text) => text);
			text = ParserUtils.recursiveReplace(text, /\[size=(\d+)(?:pt|px)?](.*?)\[\/size]/gis, (whole, number, text) => text);
			text = ParserUtils.recursiveReplace(text, /\[color=#([0-9a-f]{3}|[0-9a-f]{6})](.*?)\[\/color]/gis, (whole, hex, text) => text);
			return text;
		}
	};

	const ImageBbCodeSizes = Object.freeze({
		small: 'small',
		medium: 'medium',
		large: 'large'
	});
	const ParserImage = {
		decodeLink(text) {
			return text.replaceAll(/>((https|http):\/\/(\S+)\.(jpg|jpeg|png|gif|webp)(\?\S+[^<])?)<\/a>/gi, (whole, urlParsed) => {
				const url = main_core.Text.decode(urlParsed);
				if (!/(\.(jpg|jpeg|png|gif|webp)\?|\.(jpg|jpeg|png|gif|webp)$)/i.test(url) || url.toLowerCase().indexOf('/docs/pub/') > 0 || url.toLowerCase().indexOf('logout=yes') > 0) {
					return whole;
				}
				if (!getUtils().text.checkUrl(url)) {
					return whole;
				}
				const result = main_core.Dom.create({
					tag: 'span',
					attrs: {
						className: 'bx-im-message-image'
					},
					children: [main_core.Dom.create({
						tag: 'img',
						attrs: {
							className: 'bx-im-message-image-source',
							src: url
						},
						events: {
							error() {
								ParserImage.hideErrorImage(this);
							}
						}
					})]
				}).outerHTML;
				return `>${result}</a>`;
			});
		},
		purifyLink(text) {
			return text.replaceAll(/(.)?(https?:\/\/\S+)/gi, (whole, symbolBeforeUrl, url) => {
				if (!canPurifyLink(symbolBeforeUrl, url)) {
					return whole;
				}
				const firstSymbol = symbolBeforeUrl || '';
				return `${firstSymbol}${this.getImagePrefix()}`;
			});
		},
		// eslint-disable-next-line max-lines-per-function,sonarjs/cognitive-complexity
		decodeIcon(text) {
			let textElementSize = 0;
			const enableBigSmile = getBigSmileOption();
			if (enableBigSmile) {
				textElementSize = text.replaceAll(/\[icon=([^\]]*)]/gi, '').trim().length;
			}
			return text.replaceAll(/\[icon=([^\]]*)]/gi, whole => {
				let url = whole.match(/icon=(\S+[^\s!"'),.;>?\]])/i);
				if (url && url[1]) {
					url = url[1];
				} else {
					return '';
				}
				if (!getUtils().text.checkUrl(url)) {
					return whole;
				}
				const attrs = {
					src: url,
					border: 0
				};
				const size = whole.match(/size=(\d+)/i);
				if (size && size[1]) {
					attrs.width = size[1];
					attrs.height = size[1];
				} else {
					const width = whole.match(/width=(\d+)/i);
					if (width && width[1]) {
						attrs.width = width[1];
					}
					const height = whole.match(/height=(\d+)/i);
					if (height && height[1]) {
						attrs.height = height[1];
					}
					if (attrs.width && !attrs.height) {
						attrs.height = attrs.width;
					} else if (attrs.height && !attrs.width) {
						attrs.width = attrs.height;
					} else if (attrs.height && attrs.width) ; else {
						attrs.width = 20;
						attrs.height = 20;
					}
				}
				attrs.width = attrs.width > 100 ? 100 : attrs.width;
				attrs.height = attrs.height > 100 ? 100 : attrs.height;
				if (enableBigSmile && textElementSize === 0 && attrs.width === attrs.height && attrs.width === 20) {
					attrs.width = 40;
					attrs.height = 40;
				}
				let title = whole.match(/title=(.*[^\s\]])/i);
				if (title && title[1]) {
					title = title[1];
					if (title.includes('width=')) {
						title = title.slice(0, Math.max(0, title.indexOf('width=')));
					}
					if (title.includes('height=')) {
						title = title.slice(0, Math.max(0, title.indexOf('height=')));
					}
					if (title.includes('size=')) {
						title = title.slice(0, Math.max(0, title.indexOf('size=')));
					}
					if (title) {
						attrs.title = main_core.Text.decode(title).trim();
						attrs.alt = attrs.title;
					}
				}
				return main_core.Dom.create({
					tag: 'img',
					attrs: {
						className: 'bx-smile bx-icon',
						...attrs
					}
				}).outerHTML;
			});
		},
		purifyIcon(text) {
			return text.replaceAll(/\[icon=([^\]]*)]/gi, whole => {
				let title = whole.match(/title=(.*[^\s\]])/i);
				if (title && title[1]) {
					title = title[1];
					if (title.includes('width=')) {
						title = title.slice(0, Math.max(0, title.indexOf('width=')));
					}
					if (title.includes('height=')) {
						title = title.slice(0, Math.max(0, title.indexOf('height=')));
					}
					if (title.includes('size=')) {
						title = title.slice(0, Math.max(0, title.indexOf('size=')));
					}
					if (title) {
						title = `(${title.trim()})`;
					}
				} else {
					title = `(${main_core.Loc.getMessage('IM_PARSER_IMAGE_ICON')})`;
				}
				return title;
			});
		},
		purifyImageBbCode(text) {
			const sizesFragment = Object.values(ImageBbCodeSizes).join('|');
			const imageTagRegex = new RegExp(`\\[img\\s+size=(${sizesFragment})]([\\s\\S]*?)\\[\\/img]`, 'gi');
			return text.replaceAll(imageTagRegex, () => this.getImagePrefix());
		},
		hideErrorImage(element) {
			const result = element;
			if (result && result.parentNode) {
				result.parentNode.innerHTML = `<a href="${encodeURI(element.src)}" target="_blank">${element.src}</a>`;
			}
		},
		decodeImageBbCode(text, {
			contextDialogId = ''
		} = {}) {
			if (!main_core.Type.isStringFilled(text)) {
				return '';
			}
			return text.replaceAll(/\[img(?:\s+size=([^\]]+))?]\s*(?:\[url])?([\S\s]*?)(?:\[\/url])?\s*\[\/img]/gi, (whole, size, urlParsed) => {
				const url = main_core.Text.decode(urlParsed);
				const isValidSize = size && Object.values(ImageBbCodeSizes).includes(size.toLowerCase());
				const isInvalidUrl = ['/docs/pub/', 'logout=yes'].includes(url.toLowerCase());
				const isSafeUrl = getUtils().text.checkUrl(url);
				const isImage = getUtils().text.isUrlImageLike(url);
				const hasNestedItems = hasNestedImgBbCodes(url);
				if (!isValidSize || isInvalidUrl || !isSafeUrl || !isImage || hasNestedItems) {
					return whole.replaceAll(/\[url]([\S\s]*?)\[\/url]/gi, '$1');
				}
				const classModifier = `--${size}`;
				const {
					file
				} = getUtils();
				const dialog = getCore().getStore().getters['chats/get'](contextDialogId, true);
				const viewerGroupBy = dialog.chatId;
				const viewerAttributes = file.getViewerDataForImageSrc({
					src: url,
					viewerGroupBy
				});
				const layout = main_core.Tag.render`
					<a class='bx-im-message-image ${classModifier}'>
						<img class='bx-im-message-image-source' />
					</a>
				`;
				main_core.Dom.attr(layout.firstChild, {
					src: url,
					...viewerAttributes
				});
				return layout.outerHTML;
			});
		},
		getImagePrefix() {
			return `[${main_core.Loc.getMessage('IM_PARSER_ICON_TYPE_IMAGE')}]`;
		}
	};
	function isLinkFromDisk(url) {
		return url.toLowerCase().indexOf('/docs/pub/') > 0;
	}
	function isLogoutLink(url) {
		return url.toLowerCase().indexOf('logout=yes') > 0;
	}
	function hasImageFileExtension(url) {
		const [urlWithoutQueryString] = url.split('?');
		return /\.(jpg|jpeg|png|gif|webp)$/i.test(urlWithoutQueryString);
	}
	function hasLeadingTextBeforeUrl(symbolBeforeUrl) {
		const AllowedSymbolsBeforeImageUrl = new Set(['>', ']', ' ']);
		return main_core.Type.isStringFilled(symbolBeforeUrl) && !AllowedSymbolsBeforeImageUrl.has(symbolBeforeUrl);
	}
	function canPurifyLink(symbolBeforeUrl, url) {
		return hasImageFileExtension(url) && !isLinkFromDisk(url) && !isLogoutLink(url) && !hasLeadingTextBeforeUrl(symbolBeforeUrl);
	}
	function hasNestedImgBbCodes(url) {
		return /\[img/i.test(url.trim());
	}

	const ParserDisk = {
		decode(text) {
			const diskText = `[${main_core.Loc.getMessage('IM_PARSER_ICON_TYPE_FILE')}]`;
			return text.replaceAll(/\[disk=\d+]/gi, diskText);
		},
		purify(text) {
			return this.decode(text);
		}
	};

	const ParserDate = {
		decode(text) {
			return handleTimestampCode(text);
		},
		purify(text) {
			return handleTimestampCode(text);
		}
	};
	const handleTimestampCode = text => {
		// [timestamp=1645844720 format=SHORT_TIME_FORMAT]
		const regex = /\[timestamp=(?<timestamp>\d+)\s+format=(?<format>[_a-z]+)]/gi;
		return text.replaceAll(regex, (initialText, ...args) => {
			const {
				timestamp,
				format
			} = args.at(-1);
			const DateFormatter = main_core.Reflection.getClass('BX.Messenger.v2.Lib.DateFormatter');
			const DateFormat = main_core.Reflection.getClass('BX.Messenger.v2.Lib.DateFormat');
			const DateCode = main_core.Reflection.getClass('BX.Messenger.v2.Lib.DateCode');
			if (!DateFormatter) {
				return initialText;
			}
			const timestampInMilliseconds = Number(timestamp) * 1000;
			const date = new Date(timestampInMilliseconds);
			const preparedFormat = main_core.Text.toCamelCase(format);
			const availableFormats = Object.keys(DateFormat);
			if (!availableFormats.includes(preparedFormat)) {
				return initialText;
			}
			return DateFormatter.formatByCode(date, DateCode[preparedFormat]);
		});
	};

	const {
		EventType: EventType$2
	} = getConst();
	const ActionType = {
		put: 'put',
		send: 'send'
	};
	const ParserAction = {
		decodePut(text) {
			text = text.replace(/\[PUT(?:=(?:.+?))?](?:.+?)?\[\/PUT]/gi, match => {
				return match.replace(/\[PUT(?:=(.+))?](.+?)?\[\/PUT]/gi, (whole, command, text) => {
					text = text ? text : command;
					command = command ? command : text;
					text = main_core.Text.decode(text);
					command = main_core.Text.decode(command).replace('<br />', '\n');
					if (!text.trim()) {
						return '';
					}
					text = text.replace(/<(\w+)[^>]*>(.*?)<\/\1>/i, "$2", text);
					text = text.replace(/\[(\w+)[^\]]*](.*?)\[\/\1]/i, "$2", text);
					return this._getHtmlForAction('put', text, command);
				});
			});
			return text;
		},
		purifyPut(text) {
			text = text.replace(/\[PUT(?:=(?:.+?))?](?:.+?)?\[\/PUT]/gi, match => {
				return match.replace(/\[PUT(?:=(.+))?](.+?)?\[\/PUT]/gi, (whole, command, text) => {
					return text ? text : command;
				});
			});
			return text;
		},
		decodeSend(text) {
			text = text.replace(/\[SEND(?:=(?:.+?))?](?:.+?)?\[\/SEND]/gi, match => {
				return match.replace(/\[SEND(?:=(.+))?](.+?)?\[\/SEND]/gi, (whole, command, text) => {
					text = text ? text : command;
					command = command ? command : text;
					text = main_core.Text.decode(text);
					command = main_core.Text.decode(command).replace('<br />', '\n');
					if (!text.trim()) {
						return '';
					}
					text = text.replace(/<(\w+)[^>]*>(.*?)<\\1>/i, "$2", text);
					text = text.replace(/\[(\w+)[^\]]*](.*?)\[\/\1]/i, "$2", text);
					command = command.split('####REPLACEMENT_PUT_').join('####REPLACEMENT_SP_');
					return this._getHtmlForAction('send', text, command);
				});
			});
			return text;
		},
		purifySend(text) {
			text = text.replace(/\[SEND(?:=(?:.+?))?](?:.+?)?\[\/SEND]/gi, match => {
				return match.replace(/\[SEND(?:=(.+))?](.+?)?\[\/SEND]/gi, (whole, command, text) => {
					return text ? text : command;
				});
			});
			return text;
		},
		_getHtmlForAction(method, text, data) {
			return main_core.Dom.create({
				tag: 'span',
				attrs: {
					className: 'bx-im-message-command-wrap'
				},
				children: [main_core.Dom.create({
					tag: 'span',
					attrs: {
						className: 'bx-im-message-command',
						'data-entity': method
					},
					text
				}), main_core.Dom.create({
					tag: 'span',
					attrs: {
						className: 'bx-im-message-command-data'
					},
					text: data
				})]
			}).outerHTML;
		},
		executeClickEvent(event, context) {
			if (!main_core.Dom.hasClass(event.target, 'bx-im-message-command')) {
				return;
			}
			const {
				emitter
			} = context;
			const element = event.target;
			const messageId = getMessageIdForClickElement(element);
			const dialogId = getDialogIdByMessageId(messageId) ?? '';
			if (element.dataset.entity === ActionType.put) {
				const {
					innerText: textToInsert = ''
				} = element.parentElement.querySelector('.bx-im-message-command-data');
				if (!textToInsert) {
					return;
				}
				emitter.emit(EventType$2.textarea.insertText, {
					text: textToInsert,
					dialogId
				});
			} else if (element.dataset.entity === ActionType.send) {
				const {
					innerText: textToSend = ''
				} = element.parentElement.querySelector('.bx-im-message-command-data');
				if (!textToSend) {
					return;
				}
				emitter.emit(EventType$2.textarea.sendMessage, {
					text: textToSend,
					dialogId
				});
			}
		}
	};
	const getMessageIdForClickElement = element => {
		const messageElement = element.closest('.bx-im-message-base__wrap');
		if (!messageElement || !messageElement.dataset.id) {
			return null;
		}
		return messageElement.dataset.id;
	};
	const getDialogIdByMessageId = messageId => {
		const message = getCore().getStore().getters['messages/getById'](messageId);
		if (!message) {
			return null;
		}
		const dialog = getCore().getStore().getters['chats/getByChatId'](message.chatId);
		if (!dialog) {
			return null;
		}
		return dialog.dialogId;
	};

	const ParserSlashCommand = {
		decode(text) {
			if (text.startsWith('/me')) {
				return `[i]${text.substr(4)}[/i]`;
			}
			if (text.startsWith('/loud')) {
				return `[size=20]${text.substr(6)}[/size]`;
			}
			return text;
		},
		purify(text) {
			if (text.startsWith('/me')) {
				return text.substr(4);
			}
			if (text.startsWith('/loud')) {
				return text.substr(6);
			}
			return text;
		}
	};

	const {
		MessageMentionType: MessageMentionType$2
	} = getConst();
	const ParserCall = {
		decode(text) {
			let result = text;
			result = result.replaceAll(/\[call(?:=([\d #()+./-]+))?](.+?)\[\/call]/gi, (whole, number, text) => {
				if (!text) {
					return whole;
				}
				let destination = '';
				if (number) {
					destination = number;
				} else if (getUtils.call.isNumber(text)) {
					destination = text;
				} else {
					return whole;
				}
				return main_core.Dom.create({
					tag: 'span',
					attrs: {
						className: 'bx-im-mention',
						'data-type': MessageMentionType$2.call,
						'data-destination': destination
					},
					text: main_core.Text.decode(text)
				}).outerHTML;
			});
			result = result.replaceAll(/\[pch=(\d+)](.*?)\[\/pch]/gi, (whole, historyId, text) => '');
			return result;
		},
		purify(text) {
			let result = text;
			result = result.replaceAll(/\[call(?:=([\d #()+./-]+))?](.+?)\[\/call]/gi, (whole, number, text) => {
				return text || number;
			});
			result = result.replaceAll(/\[pch=(\d+)](.*?)\[\/pch]/gi, (whole, historyId, text) => text);
			return result;
		}
	};

	const ParserCommon = {
		decodeNewLine(text) {
			text = text.replace(/\n/gi, '<br />');
			text = text.replace(/\[BR]/gi, '<br />');
			return text;
		},
		purifyNewLine(text, replaceSymbol = ' ') {
			if (replaceSymbol !== "\n") {
				text = text.replace(/\n/gi, replaceSymbol);
			}
			text = text.replace(/\[BR]/gi, replaceSymbol);
			return text;
		},
		purifyBreakLine(text, replaceLetter = ' ') {
			text = text.replace(/<br><br \/>/gi, '<br />');
			text = text.replace(/<br \/><br>/gi, '<br />');
			text = text.replace(/\[BR]/gi, '<br />');
			text = text.replace(/<br \/>/gi, replaceLetter);

			// text = text.replace(/<\/?[^>]+>/gi, '');

			return text;
		},
		decodeTabulation(text) {
			text = text.replace(/( ){4}/gi, '\t');
			text = text.replace(/\t/gi, '&nbsp;&nbsp;&nbsp;&nbsp;');
			return text;
		},
		purifyTabulation(text) {
			text = text.replace(/&nbsp;&nbsp;&nbsp;&nbsp;/gi, " ");
			return text;
		},
		purifyNbsp(text) {
			text = text.replace(/&nbsp;/gi, " ");
			return text;
		},
		removeDuplicateTags(text) {
			if (text.substr(-6) === '<br />') {
				text = text.substr(0, text.length - 6);
			}
			text = text.replace(/<br><br \/>/gi, '<br />');
			text = text.replace(/<br \/><br>/gi, '<br />');
			return text;
		}
	};

	const ParserLines = {
		decode(text) {
			let result = text;
			result = result.replaceAll(/\[like]/gi, `<span class="bx-im-lines-vote-like" title="${main_core.Loc.getMessage('IM_PARSER_LINES_RATING_LIKE')}"></span>`);
			result = result.replaceAll(/\[dislike]/gi, `<span class="bx-im-lines-vote-dislike" title="${main_core.Loc.getMessage('IM_PARSER_LINES_RATING_DISLIKE')}"></span>`);
			result = result.replaceAll(/\[rating=([1-5])]/gi, (whole, rating) => {
				const tag = main_core.Tag.render`
				<span class="bx-im-lines-rating" title="${main_core.Loc.getMessage('IM_PARSER_LINES_RATING')} - ${rating}">
					<span class="bx-im-lines-rating-selected" style="width: ${rating * 20}%"></span>
				</span>
			`;
				return tag.outerHTML;
			});
			return result;
		},
		purify(text) {
			let result = text;
			result = result.replaceAll(/\[like]/gi, main_core.Loc.getMessage('IM_PARSER_LINES_RATING_LIKE'));
			result = result.replaceAll(/\[dislike]/gi, main_core.Loc.getMessage('IM_PARSER_LINES_RATING_DISLIKE'));
			result = result.replaceAll(/\[rating=([1-5])]/gi, () => {
				return `[${main_core.Loc.getMessage('IM_PARSER_LINES_RATING')}] `;
			});
			return result;
		}
	};

	const {
		EventType: EventType$1,
		MessageMentionType: MessageMentionType$1,
		SidebarDetailBlock,
		SpecialMentionDialogId: SpecialMentionDialogId$1,
		ChatType
	} = getConst();
	const MENTION_CSS_CLASS = 'bx-im-mention';
	class MentionHandler {
		#handlersByMentionType = {
			[MessageMentionType$1.user]: dataset => this.#handleChat(dataset),
			[MessageMentionType$1.chat]: dataset => this.#handleChat(dataset),
			[MessageMentionType$1.lines]: dataset => this.#handleLines(dataset),
			[MessageMentionType$1.context]: dataset => this.#handleContext(dataset),
			[MessageMentionType$1.call]: dataset => this.#handleCall(dataset)
		};
		#handlersByDialogId = {
			[this.#getCopilotBotDialogId()]: () => this.#handleCopilot(),
			[SpecialMentionDialogId$1.allParticipants]: () => this.#handleAllParticipants()
		};
		constructor(context) {
			const {
				emitter
			} = context;
			this.emitter = emitter;
		}
		handleClick(event) {
			if (!main_core.Dom.hasClass(event.target, MENTION_CSS_CLASS)) {
				return;
			}
			const dataset = event.target.dataset;
			const handlerByDialogId = this.#handlersByDialogId[dataset.value];
			if (handlerByDialogId) {
				handlerByDialogId();
				return;
			}
			const handlerByMentionType = this.#handlersByMentionType[dataset.type];
			if (!handlerByMentionType) {
				return;
			}
			handlerByMentionType(dataset);
		}
		#getCopilotBotDialogId() {
			return getCore().getStore().getters['users/bots/getCopilotBotDialogId'];
		}
		#handleCopilot() {
			void im_public.Messenger.openCopilot();
		}
		#handleChat(dataset) {
			void im_public.Messenger.openChat(dataset.value);
		}
		#handleLines(dataset) {
			const dialogId = dataset.value;
			if (getUtils().dialog.isLinesHistoryId(dialogId)) {
				void im_public.Messenger.openLinesHistory(dialogId);
			} else if (getUtils().dialog.isLinesExternalId(dialogId)) {
				void im_public.Messenger.openLines(dialogId);
			}
		}
		#handleContext(dataset) {
			const messageId = Number.parseInt(dataset.messageId, 10);
			this.emitter.emit(EventType$1.dialog.goToMessageContext, {
				messageId,
				dialogId: dataset.dialogId
			});
		}
		#handleCall(dataset) {
			const destination = dataset.destination;
			if (getUtils().call.isNumber(destination)) {
				void im_public.Messenger.startPhoneCall(destination);
			}
		}
		#handleAllParticipants() {
			const {
				entityId
			} = getCore().getStore().getters['application/getLayout'];
			const {
				type
			} = getCore().getStore().getters['chats/get'](entityId, true);
			if (!entityId) {
				return;
			}
			if (type === ChatType.user) {
				return;
			}
			this.emitter.emit(EventType$1.sidebar.open, {
				panel: SidebarDetailBlock.members,
				dialogId: entityId
			});
		}
	}

	const {
		UserType,
		MessageMentionType,
		SpecialMentionDialogId = {}
	} = getConst();
	const SpecialMentionHandlers = {
		[SpecialMentionDialogId.allParticipants]: userName => ParserMention.renderAllParticipantsMention(userName)
	};
	const MENTION_BASE_CLASS = 'bx-im-mention';
	const MentionModifier = {
		highlight: '--highlight',
		extranet: '--extranet'
	};
	const ParserMention = {
		decode(text) {
			text = text.replace(/\[USER=(all|[0-9]+)( REPLACE)?](.*?)\[\/USER]/gi, (whole, userId, replace, userName) => {
				if (SpecialMentionHandlers[userId]) {
					return SpecialMentionHandlers[userId](userName);
				}
				userId = Number.parseInt(userId, 10);
				if (!main_core.Type.isNumber(userId) || userId === 0) {
					return userName;
				}
				const user = getCore().getStore().getters['users/get'](userId);
				if (replace || !userName) {
					if (user) {
						userName = user.name;
					}
				} else {
					userName = main_core.Text.decode(userName);
				}
				if (!userName) {
					userName = `User ${userId}`;
				}
				let className = MENTION_BASE_CLASS;
				if (getCore().getUserId() === userId) {
					className += ` ${MentionModifier.highlight}`;
				}
				if (user && user.type === UserType.extranet) {
					className += ` ${MentionModifier.extranet}`;
				}
				return main_core.Dom.create({
					tag: 'span',
					attrs: {
						className,
						'data-type': MessageMentionType.user,
						'data-value': userId
					},
					text: userName
				}).outerHTML;
			});
			text = text.replace(/\[chat=(imol\|)?(\d+)](.*?)\[\/chat]/gi, (whole, isLines, chatId, chatNameParsed) => {
				if (chatId === 0) {
					return chatNameParsed;
				}
				let chatName = chatNameParsed;
				if (chatName) {
					chatName = main_core.Text.decode(chatName);
				} else {
					const dialog = getCore().getStore().getters['chats/get'](`chat${chatId}`);
					chatName = dialog ? dialog.name : `Chat ${chatId}`;
				}
				return main_core.Dom.create({
					tag: 'span',
					attrs: {
						className: MENTION_BASE_CLASS,
						'data-type': isLines ? MessageMentionType.lines : MessageMentionType.chat,
						'data-value': isLines ? `imol|${chatId}` : `chat${chatId}`
					},
					text: chatName
				}).outerHTML;
			});
			text = text.replace(/\[context=((?:chat\d+|\d+:\d+)\/(\d+))](.*?)\[\/context]/gis, (whole, contextTag, messageId, text) => {
				if (!text) {
					return '';
				}
				text = main_core.Text.decode(text);
				contextTag = ParserUtils.getFinalContextTag(contextTag);
				if (!contextTag) {
					return text;
				}
				const dialogId = contextTag.split('/')[0];
				return main_core.Dom.create({
					tag: 'span',
					attrs: {
						className: MENTION_BASE_CLASS,
						'data-type': MessageMentionType.context,
						'data-dialog-id': dialogId,
						'data-message-id': messageId,
						title: main_core.Loc.getMessage('IM_PARSER_MENTION_DIALOG')
					},
					text
				}).outerHTML;
			});
			return text;
		},
		purify(text) {
			text = text.replace(/\[USER=(all|[0-9]+)( REPLACE)?](.*?)\[\/USER]/gi, (whole, userId, replace, userName) => {
				userId = Number.parseInt(userId, 10);
				if (!main_core.Type.isNumber(userId) || userId === 0) {
					return userName;
				}
				if (replace || !userName) {
					const user = getCore().getStore().getters['users/get'](userId);
					if (user) {
						userName = user.name;
					}
				} else {
					userName = main_core.Text.decode(userName);
				}
				if (!userName) {
					userName = `User ${userId}`;
				}
				return userName;
			});
			text = text.replace(/\[CHAT=(imol\|)?(\d+)](.*?)\[\/CHAT]/gi, (whole, openlines, chatId, chatName) => {
				chatId = Number.parseInt(chatId, 10);
				if (!chatName) {
					const dialog = getCore().getStore().getters['chats/get']('chat' + chatId);
					chatName = dialog ? dialog.name : 'Chat ' + chatId;
				}
				return chatName;
			});
			text = text.replace(/\[context=(chat\d+|\d+:\d+)\/(\d+)](.*?)\[\/context]/gis, (whole, dialogId, messageId, text) => {
				if (!text) {
					const dialog = getCore().getStore().getters['chats/get'](dialogId);
					text = dialog ? dialog.name : 'Dialog ' + dialogId;
				}
				return text;
			});
			return text;
		},
		executeClickEvent(event, context) {
			const mentionHandler = new MentionHandler(context);
			mentionHandler.handleClick(event);
		},
		renderAllParticipantsMention(userName) {
			const className = `${MENTION_BASE_CLASS} ${MentionModifier.highlight}`;
			return main_core.Dom.create({
				tag: 'span',
				attrs: {
					className,
					'data-type': MessageMentionType.user,
					'data-value': SpecialMentionDialogId.allParticipants
				},
				text: userName
			}).outerHTML;
		}
	};

	const {
		EventType
	} = getConst();
	const QUOTE_SIGN = '&gt;&gt;';
	const NO_CONTEXT_TAG = 'none';
	const PREVIEW_LINE_LIMIT = 4;
	const PREVIEW_CHARS_PER_LINE = 80;
	const BR_HTML_TAG = '<br />';
	const CLASS_QUOTE_BASE = 'bx-im-message-quote';
	const CLASS_QUOTE_WRAP = 'bx-im-message-quote__wrap';
	const CLASS_QUOTE_TEXT = 'bx-im-message-quote__text';
	const CLASS_QUOTE_TOGGLE = 'bx-im-message-quote__toggle';
	const CLASS_EXPANDED = '--expanded';
	const CLASS_COLLAPSED = '--collapsed';
	const CLASS_CLICKABLE = '--clickable';
	const ParserQuote = {
		decodeArrowQuote(text) {
			if (!text.includes(QUOTE_SIGN)) {
				return text;
			}
			let isProcessed = false;
			const quoteStartIndexes = new Set();
			const quoteEndIndexes = new Set();
			const textLines = text.split(BR_HTML_TAG);
			for (let i = 0; i < textLines.length; i++) {
				if (!textLines[i].startsWith(QUOTE_SIGN)) {
					continue;
				}
				const quoteStartIndex = i;
				quoteStartIndexes.add(quoteStartIndex);
				textLines[quoteStartIndex] = textLines[quoteStartIndex].replace(QUOTE_SIGN, '');
				while (++i < textLines.length && textLines[i].startsWith(QUOTE_SIGN)) {
					textLines[i] = textLines[i].replace(QUOTE_SIGN, '');
				}
				const quoteEndIndex = i - 1;
				quoteEndIndexes.add(quoteEndIndex);
				const quoteTextLines = textLines.slice(quoteStartIndex, quoteEndIndex + 1);
				const quoteText = quoteTextLines.join(BR_HTML_TAG);
				const collapsedClass = isQuoteExpandableByText(quoteText) ? ` ${CLASS_COLLAPSED}` : '';
				const containerEnd = '</div>';
				textLines[quoteStartIndex] = `<div data-context="${NO_CONTEXT_TAG}" class="${CLASS_QUOTE_BASE}${collapsedClass}"><div class="${CLASS_QUOTE_WRAP}"><div class="${CLASS_QUOTE_TEXT}">${textLines[quoteStartIndex]}`;
				textLines[quoteEndIndex] += `${containerEnd}${getToggleButton({
				quoteText
			})}${containerEnd}${containerEnd}`;
				isProcessed = true;
			}
			if (!isProcessed) {
				return text;
			}
			return joinArrowQuoteLines(textLines, quoteStartIndexes, quoteEndIndexes);
		},
		purifyArrowQuote(text, spaceLetter = ' ') {
			return text.replaceAll(new RegExp(`^(${QUOTE_SIGN}(.*))`, 'gim'), getQuotePrefix() + spaceLetter);
		},
		decodeQuote(text, {
			contextDialogId = ''
		} = {}) {
			return text.replaceAll(/-{54}(<br \/>(.*?)\[(.*?)]( #(?:chat\d+|\d+:\d+)\/\d+)?)?<br \/>(.*?)-{54}(<br \/>)?/gs, (whole, userBlock, userName, timeTag, contextTag, quoteText) => {
				const preparedQuoteText = getQuoteText(userName, timeTag, quoteText);
				const userContainer = getUserBlock(userName, timeTag);
				const finalContextTag = getFinalContextTag(contextTag, contextDialogId);
				const clickableClass = finalContextTag === NO_CONTEXT_TAG ? '' : ` ${CLASS_CLICKABLE}`;
				const collapsedClass = isQuoteExpandableByText(preparedQuoteText) ? ` ${CLASS_COLLAPSED}` : '';
				const layout = main_core.Tag.render`
					<div class='${CLASS_QUOTE_BASE}${collapsedClass}${clickableClass}' data-context='${finalContextTag}'>
						<div class='${CLASS_QUOTE_WRAP}'>
							${userContainer}
							<div class='${CLASS_QUOTE_TEXT}'>${preparedQuoteText}</div>
							${getToggleButton({
				quoteText: preparedQuoteText
			})}
						</div>
					</div>
				`;
				return layout.outerHTML;
			});
		},
		purifyQuote(text, spaceLetter = ' ') {
			return text.replaceAll(/-{54}(.*?)-{54}/gims, getQuotePrefix() + spaceLetter);
		},
		decodeCode(text) {
			return text.replaceAll(/\[code](<br \/>)?([\0-\uFFFF]*?)\[\/code](<br \/>)?/gis, (whole, br, code) => {
				return main_core.Dom.create({
					tag: 'div',
					attrs: {
						className: 'bx-im-message-content-code'
					},
					html: code
				}).outerHTML;
			});
		},
		purifyCode(text, spaceLetter = ' ') {
			return text.replaceAll(/\[code](<br \/>)?([\0-\uFFFF]*?)\[\/code]/gis, `[${main_core.Loc.getMessage('IM_PARSER_ICON_TYPE_CODE')}]${spaceLetter}`);
		},
		executeClickEvent(event, context) {
			const target = getUtils().dom.recursiveBackwardNodeSearch(event.target, CLASS_QUOTE_BASE);
			if (!target) {
				return;
			}
			if (shouldStopQuoteClick(event)) {
				event.stopPropagation();
				return;
			}
			const isExpandable = isQuoteExpandable(target);
			updateToggleButtonVisibility(target, isExpandable);
			if (target.dataset.context === NO_CONTEXT_TAG) {
				handleQuoteToggle(target, isExpandable);
				return;
			}
			const isToggleClick = isToggleButtonClick(event.target);
			if (isToggleClick) {
				if (!isExpandable) {
					return;
				}
				toggleQuoteState(target);
				return;
			}
			const [dialogId, messageId] = target.dataset.context.split('/');
			const {
				emitter
			} = context;
			emitter.emit(EventType.dialog.goToMessageContext, {
				messageId: Number.parseInt(messageId, 10),
				dialogId: dialogId.toString()
			});
		}
	};
	const getQuotePrefix = () => {
		return `[${main_core.Loc.getMessage('IM_PARSER_ICON_TYPE_QUOTE')}]`;
	};
	const getQuoteText = (userName, timeTag, text) => {
		const hasUserBlock = userName && timeTag;
		if (!hasUserBlock && !text) {
			// the case, when inside the quote we have only some string in square brackets
			return String(timeTag);
		}
		if (text.endsWith(BR_HTML_TAG)) {
			return text.slice(0, -BR_HTML_TAG.length);
		}
		return text;
	};
	const getUserBlock = (userName, timeTag) => {
		const hasDataForUserBlock = userName && timeTag;
		if (!hasDataForUserBlock) {
			return '';
		}
		return main_core.Tag.render`
		<div class='bx-im-message-quote__name'>
			<div class="bx-im-message-quote__name-text">${userName.trim()}</div>
			<div class="bx-im-message-quote__name-time">${timeTag.trim()}</div>
		</div>
	`;
	};
	const getFinalContextTag = (contextTag, contextDialogId) => {
		if (!contextTag) {
			return NO_CONTEXT_TAG;
		}
		const tagWithoutHashSign = contextTag.trim().slice(1);
		const finalContextTag = ParserUtils.getFinalContextTag(tagWithoutHashSign);
		if (!isQuoteFromTheSameChat(finalContextTag, contextDialogId)) {
			return NO_CONTEXT_TAG;
		}
		return finalContextTag;
	};
	const joinArrowQuoteLines = (textLines, quoteStartIndexes, quoteEndIndexes) => {
		let result = '';
		for (let i = 0; i < textLines.length; i++) {
			const isCompactQuoteSeparator = textLines[i].trim() === '' && quoteEndIndexes.has(i - 1) && quoteStartIndexes.has(i + 1);
			if (!isCompactQuoteSeparator) {
				result += textLines[i];
			}
			const isLastLine = i >= textLines.length - 1;
			if (isLastLine || quoteEndIndexes.has(i) || isCompactQuoteSeparator) {
				continue;
			}
			result += BR_HTML_TAG;
		}
		return result;
	};
	const getToggleButton = ({
		quoteText,
		isExpanded = false
	}) => {
		if (!main_core.Type.isStringFilled(quoteText)) {
			return '';
		}
		if (!isQuoteExpandableByText(quoteText)) {
			return '';
		}
		const label = getToggleLabel(isExpanded);
		return `<button type="button" class="${CLASS_QUOTE_TOGGLE}">${label}</button>`;
	};
	const getToggleLabel = isExpanded => {
		const phraseCode = isExpanded ? 'IM_PARSER_QUOTE_COLLAPSE' : 'IM_PARSER_QUOTE_EXPAND';
		return main_core.Loc.getMessage(phraseCode);
	};
	const isQuoteFromTheSameChat = (finalContextTag, dialogId) => {
		const contextDialogId = ParserUtils.getDialogIdFromFinalContextTag(finalContextTag);
		return contextDialogId === dialogId;
	};
	const isQuoteExpandable = target => {
		const textNode = target.querySelector(`.${CLASS_QUOTE_TEXT}`);
		if (!textNode) {
			return false;
		}
		const isExpanded = main_core.Dom.hasClass(target, CLASS_EXPANDED);
		return isExpanded || textNode.scrollHeight > textNode.clientHeight + 1;
	};
	const isQuoteExpandableByText = quoteText => {
		const lines = quoteText.split(BR_HTML_TAG);
		let virtualLineCount = 0;
		for (const line of lines) {
			const plainText = line.replaceAll(/<[^>]+>/g, '').trim();
			virtualLineCount += Math.max(1, Math.ceil(plainText.length / PREVIEW_CHARS_PER_LINE));
			if (virtualLineCount > PREVIEW_LINE_LIMIT) {
				return true;
			}
		}
		return false;
	};
	const isToggleButtonClick = target => {
		const targetElement = target instanceof HTMLElement ? target : null;
		if (!targetElement) {
			return false;
		}
		return Boolean(targetElement.closest(`.${CLASS_QUOTE_TOGGLE}`));
	};
	const shouldStopQuoteClick = event => {
		const isInteractiveClick = event.target instanceof HTMLElement && event.target.closest('a');
		if (isInteractiveClick) {
			return true;
		}
		const selection = window.getSelection().toString().trim();
		return main_core.Type.isStringFilled(selection);
	};
	const handleQuoteToggle = (target, isExpandable) => {
		if (isExpandable) {
			main_core.Dom.addClass(target, CLASS_CLICKABLE);
		} else {
			main_core.Dom.removeClass(target, CLASS_CLICKABLE);
		}
		if (!main_core.Dom.hasClass(target, CLASS_CLICKABLE) || !isExpandable) {
			return true;
		}
		toggleQuoteState(target);
		return true;
	};
	const toggleQuoteState = target => {
		const isExpanded = main_core.Dom.hasClass(target, CLASS_EXPANDED);
		if (isExpanded) {
			main_core.Dom.removeClass(target, CLASS_EXPANDED);
			main_core.Dom.addClass(target, CLASS_COLLAPSED);
		} else {
			main_core.Dom.addClass(target, CLASS_EXPANDED);
			main_core.Dom.removeClass(target, CLASS_COLLAPSED);
		}
		const toggleButton = target.querySelector(`.${CLASS_QUOTE_TOGGLE}`);
		if (toggleButton) {
			toggleButton.textContent = getToggleLabel(!isExpanded);
		}
	};
	const updateToggleButtonVisibility = (target, isExpandable) => {
		const toggleButton = target.querySelector(`.${CLASS_QUOTE_TOGGLE}`);
		if (!toggleButton) {
			return;
		}
		main_core.Dom.style(toggleButton, 'display', isExpandable ? '' : 'none');
	};

	const ParserUrl = {
		decode(text, config = {}) {
			const {
				urlTarget = '_blank',
				removeLinks = false
			} = config;

			// base pattern for urls
			text = text.replace(/\[url(?:=([^[\]]+))?](.*?)\[\/url]/gis, (whole, link, text) => {
				const url = main_core.Text.decode(link || text);
				if (!getUtils().text.checkUrl(url)) {
					return text;
				}
				return this.getLinkHtml(url, urlTarget, text);
			});

			// url like https://bitrix24.com/?params[1]="test"
			text = text.replace(/\[url(?:=(.+?[^[\]]))?](.*?)\[\/url]/gis, (whole, link, text) => {
				let url = main_core.Text.decode(link || text);
				if (!getUtils().text.checkUrl(url)) {
					return text;
				}
				if (!url.slice(url.lastIndexOf('[')).includes(']')) {
					if (text.startsWith(']')) {
						url = `${url}]`;
						text = text.slice(1);
					} else if (text.startsWith('=')) {
						const urlPart = main_core.Text.decode(text.slice(1, text.lastIndexOf(']')));
						url = `${url}]=${urlPart}`;
						text = text.slice(text.lastIndexOf(']') + 1);
					}
				}
				return this.getLinkHtml(url, urlTarget, text);
			});
			if (removeLinks) {
				text = text.replace(/<a.*?href="([^"]*)".*?>(.*?)<\/a>/gi, '$2');
			}
			return text;
		},
		purify(text) {
			text = text.replace(/\[url(?:=([^\[\]]+))?](.*?)\[\/url]/gis, (whole, link, text) => {
				return text ? text : link;
			});
			text = text.replace(/\[url(?:=(.+))?](.*?)\[\/url]/gis, (whole, link, text) => {
				return text ? text : link;
			});
			return text;
		},
		removeSimpleUrlTag(text) {
			text = text.replace(/\[url](.*?)\[\/url]/gis, (whole, link) => link);
			return text;
		},
		getLinkHtml(url, urlTarget, text) {
			const {
				DataAttribute
			} = getConst();
			return main_core.Dom.create({
				tag: 'a',
				attrs: {
					href: url,
					target: urlTarget,
					[DataAttribute.useNativeContextMenu]: true
				},
				html: text
			}).outerHTML;
		}
	};

	const {
		FileType,
		FileIconType,
		AttachDescription
	} = getConst();
	const Purifier = {
		purifyMessage(message) {
			const messageFiles = getCore().getStore().getters['messages/getMessageFiles'](message.id);
			const isSticker = getCore().getStore().getters['stickers/messages/isSticker'](message.id);
			return this.purify({
				text: message.text,
				attach: message.attach,
				files: messageFiles,
				isSticker
			});
		},
		purifyNotification(notification) {
			const messageFiles = getCore().getStore().getters['messages/getMessageFiles'](notification.id);
			return this.purify({
				text: notification.text,
				attach: notification.params.attach ?? false,
				files: messageFiles
			});
		},
		purifyRecent(recentMessage) {
			const settings = main_core.Extension.getSettings('im.v2.lib.parser');
			const v2 = settings.get('v2');
			if (!v2) {
				const {
					files,
					attach,
					text
				} = prepareLegacyConfigForRecent(recentMessage);
				return this.purify({
					text,
					attach,
					files,
					showPhraseMessageWasDeleted: recentMessage.message.id !== 0
				});
			}
			const {
				files,
				attach,
				text,
				isSticker
			} = prepareConfigForRecent(recentMessage);
			return this.purify({
				text,
				attach,
				files,
				showPhraseMessageWasDeleted: recentMessage.messageId !== 0,
				isSticker
			});
		},
		purifyText(text) {
			return this.purify({
				text
			});
		},
		purify(config) {
			if (!main_core.Type.isPlainObject(config)) {
				getLogger().error('Parser.purify: the first parameter must be a object', config);
				return 'Parser.purify: the first parameter must be a parameter object';
			}
			let {
				text
			} = config;
			const {
				attach = false,
				files = false,
				isSticker = false,
				showPhraseMessageWasDeleted = true,
				removeNewLines = true
			} = config;
			if (!main_core.Type.isString(text)) {
				text = main_core.Type.isNumber(text) ? text.toString() : '';
			}
			if (!text || isSticker) {
				text = this.addTextPrefix({
					text,
					attach,
					files,
					isSticker
				});
				return text.trim();
			}
			text = main_core.Text.encode(text.trim());
			text = ParserCommon.purifyNewLine(text, '\n');
			text = ParserSlashCommand.purify(text);
			text = ParserQuote.purifyArrowQuote(text);
			text = ParserQuote.purifyQuote(text);
			text = ParserQuote.purifyCode(text);
			text = ParserAction.purifyPut(text);
			text = ParserAction.purifySend(text);
			text = ParserMention.purify(text);
			text = ParserFont.purify(text);
			text = ParserLines.purify(text);
			text = ParserCall.purify(text);
			text = ParserUrl.purify(text);
			text = ParserImage.purifyLink(text);
			text = ParserImage.purifyIcon(text);
			text = ParserImage.purifyImageBbCode(text);
			text = ParserDisk.purify(text);
			text = ParserDate.purify(text);
			if (removeNewLines) {
				text = ParserCommon.purifyNewLine(text);
			}
			text = this.addTextPrefix({
				text,
				attach,
				files
			});
			if (text.length > 0) {
				text = main_core.Text.decode(text);
			} else if (showPhraseMessageWasDeleted) {
				text = main_core.Loc.getMessage('IM_PARSER_MESSAGE_DELETED');
			}
			return text.trim();
		},
		addTextPrefix(payload) {
			const {
				text,
				attach,
				files,
				isSticker
			} = payload;
			if (isSticker) {
				return getTextForSticker();
			}
			if (isFile(payload)) {
				return getTextForFile(text, files);
			}
			if (isAttach(payload)) {
				return getTextForAttach(text, attach);
			}
			return text.trim();
		}
	};
	const prepareLegacyConfigForRecent = recentMessage => {
		let files = false;
		const fileField = recentMessage.message.params.withFile;
		if (main_core.Type.isBoolean(fileField)) {
			files = fileField;
		} else if (main_core.Type.isPlainObject(fileField)) {
			files = [fileField];
		}
		let attach = false;
		const attachField = recentMessage.message.params.withAttach;
		if (main_core.Type.isBoolean(attachField) || main_core.Type.isStringFilled(attachField) || main_core.Type.isArray(attachField)) {
			attach = attachField;
		} else if (main_core.Type.isPlainObject(attachField)) {
			attach = [attachField];
		}
		return {
			files,
			attach,
			text: recentMessage.message.text
		};
	};
	const prepareConfigForRecent = recentMessage => {
		let files = getCore().getStore().getters['messages/getMessageFiles'](recentMessage.messageId);
		if (files.length === 0) {
			files = false;
		}
		const message = getCore().getStore().getters['messages/getById'](recentMessage.messageId);
		let attach = false;
		if (main_core.Type.isBoolean(message?.attach) || main_core.Type.isStringFilled(message?.attach) || main_core.Type.isArray(message?.attach)) {
			attach = message.attach;
		} else if (main_core.Type.isPlainObject(message?.attach)) {
			attach = [message.attach];
		}
		const isSticker = getCore().getStore().getters['stickers/messages/isSticker'](recentMessage.messageId);
		return {
			files,
			attach,
			text: message.text,
			isSticker
		};
	};
	const isFile = payload => {
		const {
			files
		} = payload;
		return main_core.Type.isArrayFilled(files) || files === true;
	};
	const isAttach = payload => {
		const {
			attach
		} = payload;
		return attach === true || main_core.Type.isArrayFilled(attach) || main_core.Type.isStringFilled(attach);
	};
	const getTextForFile = (rawText, files) => {
		let preparedText = rawText;
		if (main_core.Type.isArray(files) && files.length > 0) {
			preparedText = getTextByFile(rawText, files);
		} else if (files === true) {
			preparedText = getTextByFileType(rawText, FileIconType.file);
		}
		return preparedText.trim();
	};
	const getTextForAttach = (text, attach) => {
		let attachDescription = extractAttachDescription(attach);
		if (main_core.Type.isStringFilled(attachDescription)) {
			const shouldSkipDescription = attachDescription === AttachDescription.skipMessage;
			if (shouldSkipDescription) {
				return text.trim();
			}
			attachDescription = Purifier.purifyText(attachDescription);
		} else {
			attachDescription = `[${main_core.Loc.getMessage('IM_PARSER_ICON_TYPE_ATTACH')}]`;
		}
		return `${text} ${attachDescription}`.trim();
	};
	const extractAttachDescription = attach => {
		let attachDescription = '';
		if (main_core.Type.isArray(attach) && attach.length > 0) {
			const [firstAttach] = attach;
			if (main_core.Type.isStringFilled(firstAttach.description)) {
				attachDescription = firstAttach.description;
			}
		} else if (main_core.Type.isStringFilled(attach)) {
			attachDescription = attach;
		}
		return attachDescription;
	};
	const getTextForSticker = () => {
		return `[${main_core.Loc.getMessage('IM_PARSER_ICON_TYPE_STICKER')}]`;
	};
	const getTextByFileType = (text, type = FileIconType.file) => {
		const iconText = main_core.Loc.getMessage(`IM_PARSER_ICON_TYPE_${type.toUpperCase()}`);
		return `[${iconText}] ${text}`.trim();
	};
	const getTextByFile = (text, files) => {
		const [file] = files;

		// todo: remove this hack after fix receiving messages with files on P&P
		if (!file || !file.type) {
			return text;
		}
		const isGallery = files.every(item => [FileIconType.image, FileIconType.video].includes(item.type));
		if (file.type === FileType.image && files.length === 1) {
			return getTextByFileType(text, FileIconType.image);
		}
		if (isGallery && files.length > 1) {
			return getTextByFileType(text, FileIconType.gallery);
		}
		if (file.type === FileType.audio) {
			return getTextByFileType(text, FileIconType.audio);
		}
		if (file.type === FileType.video) {
			return getTextByFileType(text, FileIconType.video);
		}
		return `${main_core.Loc.getMessage('IM_PARSER_ICON_TYPE_FILE')}: ${file.name} ${text}`.trim();
	};

	const RatioConfig = Object.freeze({
		Default: 1,
		Big: 1.6
	});
	const getSmileRatio = (text, pattern, config = RatioConfig) => {
		const replacedText = text.replaceAll(new RegExp(pattern, 'g'), '');
		const hasOnlySmiles = replacedText.trim().length === 0;
		const matchOnlySmiles = new RegExp(`(?:(?:${pattern})\\s*){4,}`);
		if (hasOnlySmiles && !matchOnlySmiles.test(text)) {
			return config.Big;
		}
		return config.Default;
	};
	const mapTypings = smiles => {
		const typings = smiles.reduce((acc, smile) => {
			const {
				image,
				typing,
				definition,
				name,
				width,
				height
			} = smile;
			const smileImg = main_core.Tag.render`
			<img
				src="${image}"
				data-code="${typing}"
				data-definition="${definition}"
				title="${name ?? typing}"
				alt="${typing}"
				class="bx-smile bx-im-message-base__text_smile"
				style="width: ${width}px; height: ${height}px;"
				draggable="false"
			/>
		`;
			return {
				...acc,
				[typing]: smileImg
			};
		}, {});
		return typings;
	};
	const lookBehind = function (text, match, offset) {
		const substring = text.slice(0, offset + match.length);
		const escaped = getUtils().text.escapeRegex(match);
		const regExp = new RegExp(`(?:^|&quot;|>|(?:${this.pattern})|\\s|<)(?:${escaped})$`);
		return substring.match(regExp);
	};
	const ParserSmile = {
		typings: null,
		pattern: '',
		loadSmilePatterns() {
			if (!getSmileManager()) {
				return;
			}
			const smileManager = getSmileManager().getInstance();
			const smiles = smileManager.smileList?.smiles ?? [];
			if (smiles.length === 0) {
				return;
			}
			const sortedSmiles = [...smiles].sort((a, b) => {
				return b.typing.localeCompare(a.typing);
			});
			this.pattern = sortedSmiles.map(smile => {
				return getUtils().text.escapeRegex(smile.typing);
			}).join('|');
			this.typings = mapTypings(sortedSmiles);
		},
		decodeSmile(text, options = {})
		// TODO add options types
		{
			if (!this.typings) {
				this.loadSmilePatterns();
			}
			if (!this.pattern) {
				return text;
			}
			let enableBigSmile;
			if (main_core.Type.isBoolean(options.enableBigSmile)) {
				enableBigSmile = options.enableBigSmile;
			} else {
				enableBigSmile = getBigSmileOption();
			}
			const ratioConfig = main_core.Type.isObjectLike(options.ratioConfig) ? options.ratioConfig : RatioConfig;
			const ratio = enableBigSmile ? getSmileRatio(text, this.pattern, ratioConfig) : ratioConfig.Default;
			const pattern = `(?:(?:${this.pattern})(?=(?:(?:${this.pattern})|\\s|&quot;|<|$)))`;
			const regExp = new RegExp(pattern, 'g');
			const replacedText = text.replaceAll(regExp, (match, offset) => {
				const behindMatching = lookBehind.call(this, text, match, offset);
				if (!behindMatching) {
					return match;
				}
				const image = this.typings[match].cloneNode();
				const {
					width,
					height
				} = image.style;
				main_core.Dom.style(image, 'width', `${Number.parseInt(width, 10) * ratio}px`);
				main_core.Dom.style(image, 'height', `${Number.parseInt(height, 10) * ratio}px`);
				return image.outerHTML;
			});
			return replacedText;
		}
	};

	const NestedTagHandler = {
		putReplacement: [],
		sendReplacement: [],
		codeReplacement: [],
		clean() {
			this.putReplacement = [];
			this.sendReplacement = [];
			this.codeReplacement = [];
		},
		cutPutTag(text) {
			return text.replaceAll(/\[put(?:=(.+?))?](.+?)?\[\/put]/gi, whole => {
				const id = this.putReplacement.length;
				this.putReplacement.push(whole);
				return `####REPLACEMENT_PUT_${id}####`;
			});
		},
		recoverPutTag(text) {
			this.putReplacement.forEach((value, index) => {
				text = text.replace(`####REPLACEMENT_PUT_${index}####`, value);
			});
			return text;
		},
		cutSendTag(text) {
			text = text.replaceAll(/\[send(?:=(.+?))?](.+?)?\[\/send]/gi, whole => {
				const id = this.sendReplacement.length;
				this.sendReplacement.push(whole);
				return `####REPLACEMENT_SEND_${id}####`;
			});
			return text;
		},
		recoverSendTag(text) {
			this.sendReplacement.forEach((value, index) => {
				const placeholder = `####REPLACEMENT_SEND_${index}####`;
				text = text.split(placeholder).join(value);
			});
			return text;
		},
		cutCodeTag(text) {
			text = text.replaceAll(/\[code](<br \/>)?(.*?)\[\/code]/gis, whole => {
				const id = this.codeReplacement.length;
				this.codeReplacement.push(whole);
				return `####REPLACEMENT_CODE_${id}####`;
			});
			return text;
		},
		recoverCodeTag(text) {
			this.codeReplacement.forEach((value, index) => {
				text = text.replace(`####REPLACEMENT_CODE_${index}####`, value);
			});
			this.sendReplacement.forEach((value, index) => {
				text = text.replaceAll(`####REPLACEMENT_SEND_${index}####`, value);
			});
			return text;
		},
		recoverRecursionTag(text) {
			if (this.sendReplacement.length > 0) {
				this.sendReplacement.forEach((value, index) => {
					text = text.replaceAll(`####REPLACEMENT_SEND_${index}####`, value);
				});
			}
			text = text.split('####REPLACEMENT_SP_').join('####REPLACEMENT_PUT_');
			if (this.putReplacement.length > 0) {
				do {
					this.putReplacement.forEach((value, index) => {
						text = text.replace(`####REPLACEMENT_PUT_${index}####`, value);
					});
				} while (text.includes('####REPLACEMENT_PUT_'));
			}
			return text;
		}
	};

	const Decoder = {
		decodeMessage(message) {
			const messageFiles = getCore().getStore().getters['messages/getMessageFiles'](message.id);
			const contextDialogId = ParserUtils.getDialogIdByChatId(message.chatId);
			return this.decode({
				text: message.text,
				attach: message.attach,
				files: messageFiles,
				showIconIfEmptyText: false,
				contextDialogId
			});
		},
		decodeNotification(notification) {
			return this.decode({
				text: notification.text,
				attach: notification.params.attach ?? false,
				showIconIfEmptyText: false,
				showImageFromLink: false,
				urlTarget: im_v2_lib_desktopApi.DesktopApi.isDesktop() ? '_blank' : '_self'
			});
		},
		decodeNotificationParam(text) {
			return this.decode({
				text,
				urlTarget: im_v2_lib_desktopApi.DesktopApi.isDesktop() ? '_blank' : '_self'
			});
		},
		decodeText(text) {
			return this.decode({
				text
			});
		},
		decodeHtml(text) {
			return this.decode({
				text
			});
		},
		decodeSmile(text, options) {
			return ParserSmile.decodeSmile(text, options);
		},
		decodeSmileForLegacyCore(text, options) {
			const legacyConfig = {
				...options
			};
			legacyConfig.ratioConfig = Object.freeze({
				Default: 1,
				Big: 1.6
			});
			return ParserSmile.decodeSmile(text, legacyConfig);
		},
		decode(config) {
			if (!main_core.Type.isPlainObject(config)) {
				getLogger().error('Parser.decode: the first parameter must be object', config);
				return '<b style="color:red">Parser.decode: the first parameter must be a parameter object</b';
			}
			let {
				text
			} = config;
			const {
				attach = false,
				files = false,
				removeLinks = false,
				showIconIfEmptyText = true,
				showImageFromLink = true,
				contextDialogId = '',
				urlTarget = '_blank'
			} = config;
			if (!main_core.Type.isString(text)) {
				if (main_core.Type.isNumber(text)) {
					return text.toString();
				}
				return '';
			}
			if (!text) {
				return showIconIfEmptyText ? Purifier.addTextPrefix({
					text,
					attach,
					files
				}) : '';
			}
			text = main_core.Text.encode(text.trim());
			text = ParserCommon.decodeNewLine(text);
			text = ParserCommon.decodeTabulation(text);
			text = NestedTagHandler.cutPutTag(text);
			text = NestedTagHandler.cutSendTag(text);
			text = NestedTagHandler.cutCodeTag(text);
			text = ParserSmile.decodeSmile(text);
			text = ParserSlashCommand.decode(text);
			text = ParserImage.decodeImageBbCode(text, {
				contextDialogId
			});
			text = ParserUrl.decode(text, {
				urlTarget,
				removeLinks
			});
			text = ParserFont.decode(text);
			text = ParserLines.decode(text);
			text = ParserMention.decode(text);
			text = ParserCall.decode(text);
			text = ParserImage.decodeIcon(text);
			if (showImageFromLink) {
				text = ParserImage.decodeLink(text);
			}
			text = ParserDisk.decode(text);
			text = ParserDate.decode(text);
			text = ParserQuote.decodeArrowQuote(text);
			text = ParserQuote.decodeQuote(text, {
				contextDialogId
			});
			text = NestedTagHandler.recoverSendTag(text);
			text = ParserAction.decodeSend(text);
			text = NestedTagHandler.recoverPutTag(text);
			text = ParserAction.decodePut(text);
			text = NestedTagHandler.recoverCodeTag(text);
			text = ParserQuote.decodeCode(text);
			text = NestedTagHandler.recoverRecursionTag(text);
			text = ParserCommon.removeDuplicateTags(text);
			NestedTagHandler.clean();
			return text;
		}
	};

	const SOURCE_REGEX = /\[source=(?<sourceId>\d+)](?<sourceText>.*?)\[\/source]/gi;
	const ParserInlineSourceLink = {
		purify(text) {
			return text.replaceAll(SOURCE_REGEX, (whole, sourceId, sourceText) => sourceText);
		},
		getSegments(text) {
			const result = [];
			let lastIndex = 0;
			for (const match of text.matchAll(SOURCE_REGEX)) {
				const hasTextBeforeSource = match.index > lastIndex;
				if (hasTextBeforeSource) {
					const textSegment = getTextSegment(text, lastIndex, match.index);
					if (textSegment) {
						result.push(textSegment);
					}
				}
				result.push(getSourceSegment(match));
				lastIndex = match.index + match[0].length;
			}
			const hasTrailingText = lastIndex < text.length;
			if (hasTrailingText) {
				const segment = getTextSegment(text, lastIndex, text.length);
				if (segment) {
					result.push(segment);
				}
			}
			return result;
		}
	};
	function getTextSegment(text, from, to) {
		const value = text.slice(from, to);
		if (value.trim().length > 0) {
			return {
				type: 'text',
				value
			};
		}
		return null;
	}
	function getSourceSegment(match) {
		return {
			type: 'source',
			id: match.groups.sourceId,
			text: match.groups.sourceText
		};
	}

	const Parser = {
		purify: config => Purifier.purify(config),
		purifyText: text => Purifier.purifyText(text),
		purifyRecent: recentMessage => Purifier.purifyRecent(recentMessage),
		purifyMessage: message => Purifier.purifyMessage(message),
		purifyNotification: notification => Purifier.purifyNotification(notification),
		decode: config => Decoder.decode(config),
		decodeText: text => Decoder.decodeText(text),
		decodeMessage: message => Decoder.decodeMessage(message),
		decodeNotification: notification => Decoder.decodeNotification(notification),
		decodeNotificationParam: text => Decoder.decodeNotificationParam(text),
		decodeHtml: text => Decoder.decodeHtml(text),
		decodeSmile: (text, options) => Decoder.decodeSmile(text, options),
		decodeSmileForLegacyCore: (text, options) => Decoder.decodeSmileForLegacyCore(text, options),
		prepareQuote(message, quoteText = '') {
			const {
				id,
				attach
			} = message;
			let text = quoteText === '' ? message.text : quoteText;
			const files = getCore().getStore().getters['messages/getMessageFiles'](id);
			const isSticker = getCore().getStore().getters['stickers/messages/isSticker'](id);
			text = main_core.Text.encode(text.trim());
			text = ParserMention.purify(text);
			text = ParserCall.purify(text);
			text = ParserLines.purify(text);
			text = ParserCommon.purifyBreakLine(text, '\n');
			text = ParserCommon.purifyNbsp(text);
			text = ParserUrl.removeSimpleUrlTag(text);
			text = ParserQuote.purifyCode(text, ' ');
			text = ParserQuote.purifyQuote(text, ' ');
			text = ParserQuote.purifyArrowQuote(text, ' ');
			if (quoteText === '' || isSticker) {
				text = Purifier.addTextPrefix({
					text,
					attach,
					files,
					isSticker
				});
			}
			text = text.length > 0 ? main_core.Text.decode(text) : main_core.Loc.getMessage('IM_PARSER_MESSAGE_DELETED');
			return text.trim();
		},
		prepareEdit(message) {
			let {
				text
			} = message;
			text = ParserUrl.removeSimpleUrlTag(text);
			text = ParserMention.purify(text);
			return text.trim();
		},
		prepareCopy(message) {
			let {
				text
			} = message;
			text = ParserUrl.removeSimpleUrlTag(text);
			return text.trim();
		},
		prepareCopyFile(message) {
			const {
				id
			} = message;
			const files = getCore().getStore().getters['messages/getMessageFiles'](id).map(file => {
				return `[DISK=${file.id}]\n`;
			});
			return files.join('\n').trim();
		},
		executeClickEvent(event, context) {
			ParserMention.executeClickEvent(event, context);
			ParserQuote.executeClickEvent(event, context);
			ParserAction.executeClickEvent(event, context);
		},
		getContextCodeFromForwardId(forwardId) {
			return ParserUtils.getFinalContextTag(forwardId);
		},
		getInlineSourceLinkSegments(text) {
			return ParserInlineSourceLink.getSegments(text);
		}
	};

	exports.Parser = Parser;

})(this.BX.Messenger.v2.Lib = this.BX.Messenger.v2.Lib || {}, BX, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib);
//# sourceMappingURL=parser.bundle.js.map

/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports, main_core, main_core_events, ui_iconSet_api_vue, ui_iconSet_outline, ui_uploader_core, ui_vue3, im_v2_application_core, im_v2_component_elements_iconButton, im_v2_component_elements_sendButton, im_v2_const, im_v2_lib_analytics, im_v2_lib_confirm, im_v2_lib_copilot, im_v2_lib_draft, im_v2_lib_escManager, im_v2_lib_feature, im_v2_lib_hotkey, im_v2_lib_inputAction, im_v2_lib_localStorage, im_v2_lib_logger, im_v2_lib_market, im_v2_lib_message, im_v2_lib_notifier, im_v2_lib_parser, im_v2_lib_permission, im_v2_lib_soundNotification, im_v2_lib_textarea, im_v2_lib_uploading, im_v2_lib_utils, im_v2_lib_voiceRecorder, im_v2_provider_service_message, im_v2_provider_service_sending, im_v2_provider_service_uploading, im_v2_lib_rest, im_v2_lib_desktopApi, im_v2_css_classes, im_v2_component_elements_autoDelete, im_v2_provider_service_chat, im_v2_lib_autoDelete, main_popup, ui_a11y, ui_system_chip_vue, im_v2_component_elements_popup, im_v2_lib_a11y, im_v2_lib_smileManager, im_v2_lib_sticker, im_v2_component_sticker, im_v2_provider_service_sticker, im_v2_component_elements_loader, main_polyfill_intersectionobserver, im_v2_lib_menu, im_v2_lib_directives, im_v2_lib_quote, ui_system_input_vue, im_v2_lib_channel, im_v2_lib_search, im_v2_lib_collab, im_v2_lib_user, im_v2_component_elements_scrollWithGradient, im_v2_component_elements_avatar, im_v2_component_elements_chatTitle, im_v2_lib_textHighlighter, ui_iconSet_api_core, im_v2_lib_access, im_v2_provider_service_collabInvitation, im_public, ui_vue3_components_richLoc, im_v2_provider_service_command, im_v2_component_elements_button, ui_system_typography_vue, calendar_sharing_interface, vote_application, im_v2_component_elements_menu, im_v2_lib_entityCreator, file_dialog, disk_diskPicker, ui_vue3_vuex, im_v2_component_elements_airPopup, main_core_zIndexManager, ui_system_checkbox, ui_system_illustration_vue, im_v2_component_elements_mediaGallery, ui_system_tooltip_vue, ui_vue3_components_button, im_v2_component_elements_progressbar, ui_icons, im_v2_lib_call, im_v2_lib_promo) {
	'use strict';

	const EVENT_NAMESPACE$1 = 'BX.Messenger.v2.Textarea.FormatToolbarManager';
	const FORMAT_TOOLBAR_DELAY = 0;
	class FormatToolbarManager extends main_core_events.EventEmitter {
		#timer = null;
		static events = {
			show: 'show',
			hide: 'hide'
		};
		constructor() {
			super();
			this.setEventNamespace(EVENT_NAMESPACE$1);
		}
		handleTextSelect(event, textarea) {
			this.#clearTimer();
			const clickPosition = {
				left: event.pageX,
				top: event.pageY
			};

			// we need to wait for selectionStart/selectionEnd update
			requestAnimationFrame(() => {
				if (!this.#hasValidSelection(textarea)) {
					this.emit(FormatToolbarManager.events.hide);
					return;
				}
				this.#timer = setTimeout(() => {
					if (!this.#hasValidSelection(textarea)) {
						return;
					}
					this.emit(FormatToolbarManager.events.show, {
						bindPosition: clickPosition
					});
				}, FORMAT_TOOLBAR_DELAY);
			});
		}
		hide() {
			this.#clearTimer();
			this.emit(FormatToolbarManager.events.hide);
		}
		destroy() {
			this.#clearTimer();
		}
		#clearTimer() {
			if (this.#timer) {
				clearTimeout(this.#timer);
				this.#timer = null;
			}
		}
		#hasValidSelection(textarea) {
			if (!textarea) {
				return false;
			}
			return textarea.selectionStart !== textarea.selectionEnd;
		}
	}

	const ACTIVE_STATUS_DURATION = 15000;
	const REQUEST_DELAY = 5000;
	class InputSenderService {
		#dialogId;
		#statusTimerMap = {};
		#requestDelayMap = {};
		constructor(dialogId) {
			this.#dialogId = dialogId;
		}
		startAction(actionType) {
			if (this.#isActive(actionType) || this.#isSelfChat()) {
				return;
			}
			this.#statusTimerMap[actionType] = setTimeout(() => {
				delete this.#statusTimerMap[actionType];
			}, ACTIVE_STATUS_DURATION);
			this.#requestDelayMap[actionType] = setTimeout(() => {
				this.#sendRequest(actionType);
			}, REQUEST_DELAY);
		}
		stopAction(actionType) {
			clearTimeout(this.#statusTimerMap[actionType]);
			delete this.#statusTimerMap[actionType];
			clearTimeout(this.#requestDelayMap[actionType]);
			delete this.#requestDelayMap[actionType];
		}
		#isActive(actionType) {
			return Boolean(this.#statusTimerMap[actionType]);
		}
		#sendRequest(actionType) {
			const queryParams = {
				dialogId: this.#dialogId,
				type: actionType
			};
			im_v2_lib_rest.runAction(im_v2_const.RestMethod.imV2ChatInputActionNotify, {
				data: queryParams
			}).catch(([error]) => {
				console.error('InputSenderService: sendRequest error', error);
			});
		}
		#isSelfChat() {
			return Number(this.#dialogId) === im_v2_application_core.Core.getUserId();
		}
	}

	// DOM ids of the mention grid, referenced by the field via aria-controls/aria-activedescendant. Activity
	// belongs to a cell, not to a row: column 0 is the name, column 1 the optional "add to chat". The action
	// button keeps its cell coordinates in the id so navigation can read the same position from either node.

	/**
	 * One set of ids per composer: a fixed id would name two grids at once wherever two composers share a
	 * page, and `aria-activedescendant` would then point the field at a cell of the other one.
	 */
	function createMentionGridIds() {
		const gridId = `bx-im-mention-grid-${main_core.Text.getRandom(8)}`;
		const cellIdPrefix = `${gridId}-r`;
		// `Text.getRandom` yields base-36 characters only, so the prefix goes into the pattern as it is.
		const cellRowPattern = new RegExp(`^${cellIdPrefix}(\\d+)-c\\d+(?:-button)?$`);
		return {
			gridId,
			getCellId: (rowIndex, columnIndex) => {
				return `${cellIdPrefix}${rowIndex}-c${columnIndex}`;
			},
			getActionButtonId: rowIndex => {
				return `${cellIdPrefix}${rowIndex}-c1-button`;
			},
			getCellRow: cellId => {
				const match = cellRowPattern.exec(cellId ?? '');
				return match ? Number(match[1]) : -1;
			}
		};
	}

	// The column is read from a cell id or from the action button id derived from it.
	function getMentionCellColumn(cellId) {
		const match = /-c(\d+)(?:-button)?$/.exec(cellId ?? '');
		return match ? Number(match[1]) : 0;
	}

	/**
	 * Scroll position that brings the active item of the list into view together with `room` around it: what has
	 * to end up inside the visible area is not the bare item but the ring of the keyboard position it wears, so
	 * the box the check and the correction are written in is the item grown by that room. An item flush with an
	 * edge of the visible area is fully visible while its ring is not.
	 */
	function getNewScrollPosition(element, scrollContainer, room) {
		const containerPosition = main_core.Dom.getPosition(scrollContainer);
		const targetElementPosition = main_core.Dom.getPosition(element);
		const wantedTop = targetElementPosition.top - room;
		const wantedBottom = targetElementPosition.bottom + room;
		const shouldScrollUp = wantedTop < containerPosition.top;
		const shouldScrollDown = wantedBottom > containerPosition.bottom;
		let newScrollTop = scrollContainer.scrollTop;
		if (shouldScrollUp) {
			newScrollTop -= containerPosition.top - wantedTop;
		} else if (shouldScrollDown) {
			newScrollTop += wantedBottom - containerPosition.bottom;
		}
		return newScrollTop;
	}

	/**
	 * Room the scrolling keeps between the active item and the edge of the visible area.
	 *
	 * The ring of the keyboard position is what needs it: the gap it stands off by plus the line itself, both
	 * read off the focus tokens the ring is drawn with. Where those tokens are missing no ring is drawn either,
	 * and then nothing has to be kept for one.
	 *
	 * The vertical margin of the list is the floor. That margin is the breathing space of the outermost items -
	 * the only room the first and the last of them have - and asking for exactly it is what lands the list on its
	 * own edge when the walk reaches either end, instead of a couple of pixels short of it, where the scroll
	 * gradient stays lit and paints over the ring.
	 */
	function getScrollRoom(element, itemsContainer) {
		const ringStyle = window.getComputedStyle(element);
		const ringSpace = (Number.parseFloat(ringStyle.getPropertyValue('--ui-focus-outline-offset')) || 0) + (Number.parseFloat(ringStyle.getPropertyValue('--ui-focus-outline-width')) || 0);
		const listStyle = window.getComputedStyle(itemsContainer);
		const listMargin = Math.max(Number.parseFloat(listStyle.marginTop) || 0, Number.parseFloat(listStyle.marginBottom) || 0);
		return Math.max(ringSpace, listMargin);
	}

	const MentionSymbols = new Set(['@', '+']);
	const WAIT_FOR_NEXT_SYMBOL_TIME$1 = 10;
	const WAIT_FOR_LAST_SYMBOL_TIME$1 = 10;
	const SelectionOffsetByKey = new Map([['ArrowUp', -1], ['ArrowDown', 1]]);
	const NO_SELECTION_MOVE = 0;

	// the row holds up to two cells: name (0) and the optional "add to chat" action (1)
	const NAME_COLUMN = 0;
	const ACTION_COLUMN = 1;
	const NO_COLUMN_MOVE = 0;
	const MentionDetectorEvents = Object.freeze({
		showMentionPopup: 'showMentionPopup',
		hideMentionPopup: 'hideMentionPopup'
	});

	// events exchanged between the field and the mention grid over the shared emitter
	const MentionListEvents = Object.freeze({
		moveSelection: 'IM:Mention:moveSelection',
		moveColumn: 'IM:Mention:moveColumn',
		activeItemChanged: 'IM:Mention:activeItemChanged'
	});
	function getSelectionOffset(event) {
		return SelectionOffsetByKey.get(event.key) ?? NO_SELECTION_MOVE;
	}
	class MentionDetector extends main_core_events.EventEmitter {
		#mentionPopupOpened = false;
		#mentionSymbol = '';
		#textarea;
		#emitter;
		#gridIds;
		#pendingChecks = new Set();
		static eventNamespace = 'BX.Messenger.v2.Textarea.MentionDetector';
		constructor(payload) {
			super();
			this.setEventNamespace(MentionDetector.eventNamespace);
			const {
				textareaElement,
				context: {
					emitter
				},
				gridIds
			} = payload;
			this.#textarea = textareaElement;
			this.#emitter = emitter;
			this.#gridIds = gridIds;
		}
		onActiveMentionKeyDown(event) {
			if (!this.#mentionPopupOpened) {
				return;
			}
			this.#onOpenedMentionKeyDown(event);
		}
		onKeyDown(event) {
			this.#onClosedMentionKeyDown(event);
		}
		onMentionPopupClose() {
			this.#mentionPopupOpened = false;
		}
		refresh() {
			const textBeforeCursor = this.#getTextBeforeCursor();
			const mentionSymbolIndex = this.#getLastMentionSymbolIndex(textBeforeCursor);
			if (mentionSymbolIndex < 0) {
				this.#hideIfOpened();
				return;
			}
			const symbolBeforeMentionSymbol = textBeforeCursor.slice(mentionSymbolIndex - 1, mentionSymbolIndex);
			if (mentionSymbolIndex > 0 && !this.#hasWhitespace(symbolBeforeMentionSymbol)) {
				this.#hideIfOpened();
				return;
			}
			const query = textBeforeCursor.slice(mentionSymbolIndex);
			if (!this.#isUnfinishedMention(query)) {
				this.#hideIfOpened();
				return;
			}
			this.#mentionSymbol = textBeforeCursor.slice(mentionSymbolIndex, mentionSymbolIndex + 1);
			this.#mentionPopupOpened = true;
			this.emit(MentionDetectorEvents.showMentionPopup, {
				mentionQuery: query.slice(1)
			});
		}
		getMentionSymbol() {
			return this.#mentionSymbol;
		}
		clearMentionSymbol() {
			this.#mentionSymbol = '';
		}
		destroy() {
			this.#pendingChecks.forEach(checkId => clearTimeout(checkId));
			this.#pendingChecks.clear();
		}
		#onClosedMentionKeyDown(event) {
			if (!this.#isOpenMentionCombination(event)) {
				return;
			}
			this.#scheduleCheck(() => {
				if (!this.#checkMentionSymbol()) {
					return;
				}
				this.#mentionPopupOpened = true;
				this.emit(MentionDetectorEvents.showMentionPopup, {
					mentionQuery: ''
				});
			}, WAIT_FOR_NEXT_SYMBOL_TIME$1);
		}
		#onOpenedMentionKeyDown(event) {
			const selectionOffset = getSelectionOffset(event);
			if (selectionOffset !== NO_SELECTION_MOVE) {
				event.preventDefault();
				this.#sendMoveSelectionEvent(selectionOffset);
				return;
			}
			const columnOffset = this.#getColumnOffset(event);
			if (columnOffset !== NO_COLUMN_MOVE) {
				event.preventDefault();
				this.#sendMoveColumnEvent(columnOffset);
				return;
			}
			if (this.#isActivateActionCellCombination(event)) {
				event.preventDefault();
				this.#activateActionCell();
				return;
			}
			if (this.#isInsertMentionCombination(event)) {
				event.preventDefault();
				this.#sendInsertMentionEvent(event);
				return;
			}
			this.#scheduleCheck(() => {
				if (!this.#isValidQuery(this.#getQuery())) {
					this.#sendHidePopupEvent();
					return;
				}
				this.emit(MentionDetectorEvents.showMentionPopup, {
					mentionQuery: this.#getQueryWithoutMentionSymbol()
				});
			}, WAIT_FOR_LAST_SYMBOL_TIME$1);
		}
		#scheduleCheck(check, delay) {
			const checkId = setTimeout(() => {
				this.#pendingChecks.delete(checkId);
				check();
			}, delay);
			this.#pendingChecks.add(checkId);
		}
		#checkMentionSymbol() {
			const cursorPosition = this.#textarea.selectionEnd;
			this.#mentionSymbol = this.#textarea.value.slice(cursorPosition - 1, cursorPosition);
			if (!MentionSymbols.has(this.#mentionSymbol)) {
				return false;
			}
			const symbolBeforeMentionSymbol = this.#textarea.value.slice(cursorPosition - 2, cursorPosition - 1);
			return symbolBeforeMentionSymbol.length === 0 || this.#hasWhitespace(symbolBeforeMentionSymbol);
		}

		// a text taken over from another field carries no open search:
		// only a mention the caret still stands in counts as unfinished
		#isUnfinishedMention(query) {
			return this.#isValidQuery(query) && !/\s/.test(query);
		}
		#isValidQuery(query) {
			if (query.length === 0) {
				return false;
			}
			const firstQuerySymbol = query.slice(1, 2);
			if (firstQuerySymbol.length === 0) {
				return true;
			}
			if (!this.#isValidFirstSymbol(firstQuerySymbol)) {
				return false;
			}
			return !this.#hasWhitespace(firstQuerySymbol);
		}
		#isInsertMentionCombination(event) {
			return event.key === 'Enter';
		}
		#isOpenMentionCombination(event) {
			return event.key === '+' || event.key === '@';
		}
		#hideIfOpened() {
			if (!this.#mentionPopupOpened) {
				return;
			}
			this.#sendHidePopupEvent();
		}
		#sendHidePopupEvent() {
			this.#mentionPopupOpened = false;
			this.#mentionSymbol = '';
			this.emit(MentionDetectorEvents.hideMentionPopup);
		}
		#sendInsertMentionEvent(event) {
			event.preventDefault();
			this.#emitter.emit(im_v2_const.EventType.mention.selectItem);
			this.#sendHidePopupEvent();
		}
		#sendMoveSelectionEvent(offset) {
			this.#emitter.emit(MentionListEvents.moveSelection, {
				offset
			});
		}
		#sendMoveColumnEvent(offset) {
			this.#emitter.emit(MentionListEvents.moveColumn, {
				offset
			});
		}

		// left/right stay with the caret while editing the query: they only reach the action cell when the name
		// cell is active, the row actually has that cell and the caret sits at the end of the query text
		#getColumnOffset(event) {
			if (event.key === 'ArrowRight') {
				const canReachActionCell = this.#getActiveColumn() === NAME_COLUMN && this.#activeRowHasActionCell() && this.#isCaretAtQueryEnd();
				return canReachActionCell ? 1 : NO_COLUMN_MOVE;
			}
			if (event.key === 'ArrowLeft') {
				return this.#getActiveColumn() === ACTION_COLUMN ? -1 : NO_COLUMN_MOVE;
			}
			return NO_COLUMN_MOVE;
		}
		#isActivateActionCellCombination(event) {
			if (event.key !== 'Enter' && event.key !== ' ') {
				return false;
			}
			return this.#getActiveColumn() === ACTION_COLUMN;
		}
		#activateActionCell() {
			const activeNode = document.getElementById(this.#getActiveCellId());
			const button = activeNode?.matches('button') ? activeNode : activeNode?.querySelector('button');
			button?.click();
		}
		#getActiveCellId() {
			return this.#textarea.getAttribute('aria-activedescendant') ?? '';
		}
		#getActiveColumn() {
			return getMentionCellColumn(this.#getActiveCellId());
		}
		#activeRowHasActionCell() {
			const row = this.#gridIds.getCellRow(this.#getActiveCellId());
			if (row < 0) {
				return false;
			}
			return document.getElementById(this.#gridIds.getCellId(row, ACTION_COLUMN)) !== null;
		}
		#isCaretAtQueryEnd() {
			const {
				selectionStart,
				selectionEnd,
				value
			} = this.#textarea;
			if (selectionStart !== selectionEnd) {
				return false;
			}
			const nextCharacter = value.charAt(selectionEnd);
			return nextCharacter === '' || this.#hasWhitespace(nextCharacter);
		}
		#getTextBeforeCursor() {
			return this.#textarea.value.slice(0, Math.max(0, this.#textarea.selectionEnd));
		}
		#getLastMentionSymbolIndex(text) {
			let lastIndex = -1;
			MentionSymbols.forEach(mentionSymbol => {
				lastIndex = Math.max(lastIndex, text.lastIndexOf(mentionSymbol));
			});
			return lastIndex;
		}
		#getMentionSymbolIndex() {
			const textBeforeCursor = this.#getTextBeforeCursor();
			return textBeforeCursor.lastIndexOf(this.#mentionSymbol);
		}
		#getQuery() {
			const textBeforeCursor = this.#getTextBeforeCursor();
			const mentionSymbolIndex = this.#getMentionSymbolIndex();
			if (mentionSymbolIndex < 0) {
				return '';
			}
			return textBeforeCursor.slice(mentionSymbolIndex, this.#textarea.selectionEnd);
		}
		#getQueryWithoutMentionSymbol() {
			return this.#getQuery().slice(1);
		}
		#isValidFirstSymbol(firstQuerySymbol) {
			return !(this.#hasNumber(firstQuerySymbol) || this.#hasWhitespace(firstQuerySymbol) || this.#hasSpecialSymbol(firstQuerySymbol));
		}
		#hasWhitespace(text) {
			return /^\s/.test(text);
		}
		#hasNumber(text) {
			return /\d$/.test(text);
		}
		#hasSpecialSymbol(text) {
			const regex = /[!"#$%&'()*+,./<>@\\^_|-]/;
			return regex.test(text);
		}
	}

	const CHAT_MENTION_CODE = 'chat';
	class MentionReplacementMap {
		#replacements = {};
		#mentionTextByUserId = new Map();
		set(map) {
			this.#replacements = map;
			this.#mentionTextByUserId.clear();
		}
		add(textToReplace, textToInsert, mentionedUserId = null) {
			this.#replacements[textToReplace] = textToInsert;
			if (mentionedUserId) {
				this.#mentionTextByUserId.set(mentionedUserId.toString(), textToReplace);
			}
			return this.#replacements;
		}
		hasMentionOfUser(text, userId) {
			const mentionText = this.#mentionTextByUserId.get(userId.toString());
			return Boolean(mentionText) && text.includes(mentionText);
		}
		getAll() {
			return {
				...this.#replacements
			};
		}
		apply(text) {
			let resultText = text;
			Object.entries(this.#replacements).forEach(([textToReplace, textToInsert]) => {
				resultText = resultText.replaceAll(textToReplace, textToInsert);
			});
			return resultText;
		}
		extract(text) {
			const mentions = {};
			const mentionRegExp = /\[(?<type>user|chat)=(?<dialogId>\w+)](?<mentionText>.*?)\[\/(user|chat)]/gi;
			const matches = text.matchAll(mentionRegExp);
			for (const match of matches) {
				const {
					mentionText
				} = match.groups;
				let {
					type: mentionType,
					dialogId
				} = match.groups;
				mentionType = mentionType.toLowerCase();
				if (mentionType === CHAT_MENTION_CODE) {
					dialogId = `${mentionType}${dialogId}`;
				}
				mentions[mentionText] = im_v2_lib_utils.Utils.text.getMentionBbCode(dialogId, mentionText);
			}
			return mentions;
		}
		clear() {
			this.#replacements = {};
			this.#mentionTextByUserId.clear();
		}
	}

	const ResizeDirection = {
		up: 'up',
		down: 'down'
	};
	class ResizeManager extends main_core_events.EventEmitter {
		static eventNamespace = 'BX.Messenger.v2.Textarea.ResizeManager';
		static events = {
			onHeightChange: 'onHeightChange',
			onResizeStop: 'onResizeStop'
		};
		isDragging = false;
		constructor(options = {}) {
			super();
			const {
				direction,
				maxHeight,
				minHeight
			} = options;
			this.direction = direction;
			this.maxHeight = maxHeight;
			this.minHeight = minHeight;
			this.setEventNamespace(ResizeManager.eventNamespace);
		}
		onResizeStart(event, currentHeight) {
			if (this.isDragging) {
				return;
			}
			this.isDragging = true;
			this.resizeCursorStartPoint = event.clientY;
			this.resizeHeightStartPoint = currentHeight;
			this.addResizeEvents();
		}
		onResizeContinue(event) {
			if (!this.isDragging) {
				return;
			}
			this.resizeCursorControlPoint = event.clientY;
			const maxPoint = this.#calculateNewMaxPoint();
			const newHeight = Math.max(maxPoint, this.minHeight);
			this.emit(ResizeManager.events.onHeightChange, {
				newHeight
			});
		}
		onResizeStop() {
			if (!this.isDragging) {
				return;
			}
			this.isDragging = false;
			this.removeResizeEvents();
			this.emit(ResizeManager.events.onResizeStop);
		}
		#calculateNewMaxPoint() {
			const distance = this.direction === ResizeDirection.up ? this.resizeCursorStartPoint - this.resizeCursorControlPoint : this.resizeCursorControlPoint - this.resizeCursorStartPoint;
			return Math.min(this.resizeHeightStartPoint + distance, this.maxHeight);
		}
		addResizeEvents() {
			this.onContinueDragHandler = this.onResizeContinue.bind(this);
			this.onStopDragHandler = this.onResizeStop.bind(this);
			document.addEventListener('mousemove', this.onContinueDragHandler);
			document.addEventListener('touchmove', this.onContinueDragHandler);
			document.addEventListener('touchend', this.onStopDragHandler);
			document.addEventListener('mouseup', this.onStopDragHandler);
			document.addEventListener('mouseleave', this.onStopDragHandler);
		}
		removeResizeEvents() {
			document.removeEventListener('mousemove', this.onContinueDragHandler);
			document.removeEventListener('touchmove', this.onContinueDragHandler);
			document.removeEventListener('touchend', this.onStopDragHandler);
			document.removeEventListener('mouseup', this.onStopDragHandler);
			document.removeEventListener('mouseleave', this.onStopDragHandler);
		}
		destroy() {
			this.removeResizeEvents();
		}
	}

	const SLASH_SYMBOL = '/';
	const WAIT_FOR_NEXT_SYMBOL_TIME = 10;
	const WAIT_FOR_LAST_SYMBOL_TIME = 10;
	const SlashCommandManagerEvents = Object.freeze({
		showSlashCommandPopup: 'showSlashCommandPopup',
		hideSlashCommandPopup: 'hideSlashCommandPopup'
	});

	// region pure detectors

	function getCurrentLineText(textarea) {
		const before = textarea.value.slice(0, Math.max(0, textarea.selectionEnd));
		return before.slice(before.lastIndexOf('\n') + 1);
	}
	function getLineBeforeSlash(textarea) {
		const line = getCurrentLineText(textarea);
		const slashIndex = line.indexOf(SLASH_SYMBOL);
		return slashIndex < 0 ? null : line.slice(0, slashIndex);
	}
	function getSlashQuery(textarea) {
		const line = getCurrentLineText(textarea);
		return line.slice(line.indexOf(SLASH_SYMBOL) + 1);
	}
	function checkSlashTrigger(textarea) {
		const line = getCurrentLineText(textarea);

		// "/" triggers only when it is the very first character of the line, never after leading
		// whitespace or a bot mention: the server executes commands only at the line start (^\/), so any
		// preceding character (even a space) would keep the command from running.
		return line === SLASH_SYMBOL;
	}
	function isSlashLineStillOpen(textarea) {
		const before = getLineBeforeSlash(textarea);
		return before === '';
	}

	// endregion pure detectors

	class SlashCommandManager extends main_core_events.EventEmitter {
		#slashCommandPopupOpened = false;
		#textarea;
		#emitter;
		#getHasItems;
		static eventNamespace = 'BX.Messenger.v2.Textarea.SlashCommandManager';
		constructor(payload) {
			super();
			this.setEventNamespace(SlashCommandManager.eventNamespace);
			const {
				textareaElement,
				context: {
					emitter
				},
				getHasItems
			} = payload;
			this.#textarea = textareaElement;
			this.#emitter = emitter;
			this.#getHasItems = getHasItems;
		}

		// region 'popup'

		// returns whether the key was consumed by the popup; when it wasn't, the caller lets the textarea handle it
		onActiveSlashCommandKeyDown(event) {
			if (!this.#slashCommandPopupOpened) {
				return false;
			}
			return this.#onOpenedSlashCommandKeyDown(event);
		}
		onKeyDown(event) {
			this.#onClosedSlashCommandKeyDown(event);
		}
		onSlashCommandPopupClose() {
			this.#slashCommandPopupOpened = false;
		}
		openSlashCommandPopup() {
			this.#slashCommandPopupOpened = true;
			this.emit(SlashCommandManagerEvents.showSlashCommandPopup, this.#getPopupPayload());
		}
		#onClosedSlashCommandKeyDown(event) {
			if (event.key !== SLASH_SYMBOL) {
				return;
			}
			setTimeout(() => {
				if (!checkSlashTrigger(this.#textarea)) {
					return;
				}
				this.#slashCommandPopupOpened = true;
				this.emit(SlashCommandManagerEvents.showSlashCommandPopup, this.#getPopupPayload());
			}, WAIT_FOR_NEXT_SYMBOL_TIME);
		}
		#onOpenedSlashCommandKeyDown(event) {
			// with no selectable items there is nothing to navigate or insert:
			// let the event reach the textarea (message send, caret movement)
			const hasItems = this.#hasItems();
			if (hasItems && this.#isNavigateCombination(event)) {
				event.preventDefault();
				// the popup reuses MentionItemsContainer, which walks its items on the shared move event
				this.#emitter.emit(MentionListEvents.moveSelection, {
					offset: getSelectionOffset(event)
				});
				return true;
			}
			if (hasItems && this.#isInsertCombination(event)) {
				event.preventDefault();
				this.#sendInsertSlashCommandEvent();
				return true;
			}
			setTimeout(() => {
				// the popup may have been closed (Esc / click-outside) between the keydown and this deferred
				// check while the slash line is still present - do not reopen it against the popup's own close
				if (!this.#slashCommandPopupOpened) {
					return;
				}
				if (!isSlashLineStillOpen(this.#textarea)) {
					this.#sendHideSlashCommandPopupEvent();
					return;
				}
				this.emit(SlashCommandManagerEvents.showSlashCommandPopup, this.#getPopupPayload());
			}, WAIT_FOR_LAST_SYMBOL_TIME);
			return !this.#isNavigateCombination(event) && !this.#isInsertCombination(event);
		}
		#hasItems() {
			return this.#getHasItems() === true;
		}
		#sendInsertSlashCommandEvent() {
			this.#emitter.emit(im_v2_const.EventType.textarea.selectSlashCommand);
			this.#sendHideSlashCommandPopupEvent();
		}
		#sendHideSlashCommandPopupEvent() {
			this.#slashCommandPopupOpened = false;
			this.emit(SlashCommandManagerEvents.hideSlashCommandPopup);
		}
		#getPopupPayload() {
			return {
				query: getSlashQuery(this.#textarea)
			};
		}
		#isNavigateCombination(event) {
			return event.key === 'ArrowUp' || event.key === 'ArrowDown';
		}
		#isInsertCombination(event) {
			return event.key === 'Enter';
		}
		// endregion 'popup'
	}

	const RecognizerEvent = {
		end: 'end',
		error: 'error',
		result: 'result',
		start: 'start'
	};
	const EVENT_NAMESPACE = 'BX.Messenger.v2.CopilotAudioManager';
	class AudioManager extends main_core_events.EventEmitter {
		static events = {
			recognitionStart: 'recognitionStart',
			recognitionError: 'recognitionError',
			recognitionEnd: 'recognitionEnd',
			recognitionResult: 'recognitionResult'
		};
		recognizer = null;
		static isAvailable() {
			if (im_v2_lib_desktopApi.DesktopApi.isDesktop()) {
				return im_v2_lib_desktopApi.DesktopApi.getApiVersion() > 74;
			}
			return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
		}
		constructor() {
			super();
			this.setEventNamespace(EVENT_NAMESPACE);
			this.recognizer = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
			this.#initSettings();
			this.#bindEvents();
		}
		startRecognition() {
			this.recognizer.start();
		}
		stopRecognition() {
			this.recognizer.stop();
		}
		#bindEvents() {
			main_core.Event.bind(this.recognizer, RecognizerEvent.start, () => {
				this.lastRecognizedText = '';
				this.emit(AudioManager.events.recognitionStart);
			});
			main_core.Event.bind(this.recognizer, RecognizerEvent.error, event => {
				this.emit(AudioManager.events.recognitionError, event.error);
				console.error('Copilot: AudioManager: error', event.error);
			});
			main_core.Event.bind(this.recognizer, RecognizerEvent.end, () => {
				this.lastRecognizedText = '';
				this.emit(AudioManager.events.recognitionEnd);
			});
			main_core.Event.bind(this.recognizer, RecognizerEvent.result, event => {
				const recognizedText = this.#getRecognizedText(event);
				const newText = this.#getNewText(recognizedText);
				if (newText !== '') {
					this.emit(AudioManager.events.recognitionResult, newText);
				}
				this.lastRecognizedText = recognizedText;
			});
		}
		#getRecognizedText(event) {
			let recognizedChunk = '';
			Object.values(event.results).forEach(result => {
				if (result.isFinal) {
					return;
				}
				const [alternative] = result;
				const {
					transcript
				} = alternative;
				recognizedChunk += transcript;
			});
			return recognizedChunk;
		}
		#getNewText(fullText) {
			let additionalText = '';
			const lastChunkLength = this.lastRecognizedText.length;
			if (fullText.length > lastChunkLength) {
				additionalText = fullText.slice(lastChunkLength);
			}
			return additionalText;
		}
		#initSettings() {
			this.recognizer.continuous = true;
			this.recognizer.interimResults = true;
		}
	}

	const ICON_SIZE$a = 24;

	// @vue/component
	const AudioInput = {
		name: 'AudioInput',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		props: {
			dialogId: {
				type: String,
				required: true
			},
			isDisabled: {
				default: false,
				type: Boolean
			}
		},
		// `activeChange` reports whether the dictation is on: it holds the microphone, and the voice
		// recorder standing next to it may not take the device away in the meantime
		emits: ['inputStart', 'inputResult', 'activeChange'],
		data() {
			return {
				audioMode: false,
				audioUsed: false
			};
		},
		computed: {
			ICON_SIZE: () => ICON_SIZE$a,
			iconName() {
				return this.audioMode ? ui_iconSet_api_vue.Outline.STOP_M : ui_iconSet_api_vue.Outline.MICROPHONE_ON;
			},
			audioButtonLabel() {
				return this.audioMode ? this.loc('IM_TEXTAREA_ICON_SEND_VOICE_STOP_ARIA') : this.loc('IM_TEXTAREA_ICON_SEND_VOICE');
			}
		},
		watch: {
			audioMode(newValue, oldValue) {
				this.$emit('activeChange', newValue);
				if (oldValue === false && newValue === true) {
					this.startAudio();
				}
				if (oldValue === true && newValue === false) {
					this.stopAudio();
				}
			}
		},
		created() {
			this.getEmitter().subscribe(im_v2_const.EventType.textarea.onAfterSendMessage, this.handleOnAfterSendMessage);
		},
		beforeUnmount() {
			this.getEmitter().unsubscribe(im_v2_const.EventType.textarea.onAfterSendMessage, this.handleOnAfterSendMessage);
		},
		methods: {
			onClick() {
				if (this.isDisabled) {
					return;
				}
				if (this.audioMode) {
					this.audioMode = false;
					return;
				}
				this.audioMode = true;
			},
			startAudio() {
				this.getAudioManager().startRecognition();
				this.bindAudioEvents();
			},
			stopAudio() {
				this.getAudioManager().stopRecognition();
				this.unbindAudioEvents();
			},
			bindAudioEvents() {
				this.getAudioManager().subscribe(AudioManager.events.recognitionResult, event => {
					const text = event.getData();
					this.$emit('inputResult', text);
					this.audioUsed = true;
				});
				this.getAudioManager().subscribe(AudioManager.events.recognitionStart, () => {
					this.$emit('inputStart');
				});
				this.getAudioManager().subscribe(AudioManager.events.recognitionEnd, () => {
					this.audioMode = false;
				});
				this.getAudioManager().subscribe(AudioManager.events.recognitionError, () => {
					this.audioMode = false;
					im_v2_lib_notifier.Notifier.speech.onRecognitionError();
				});
			},
			unbindAudioEvents() {
				this.getAudioManager().unsubscribeAll(AudioManager.events.recognitionResult);
				this.getAudioManager().unsubscribeAll(AudioManager.events.recognitionStart);
				this.getAudioManager().unsubscribeAll(AudioManager.events.recognitionEnd);
				this.getAudioManager().unsubscribeAll(AudioManager.events.recognitionError);
			},
			isAudioModeAvailable() {
				return AudioManager.isAvailable();
			},
			getAudioManager() {
				if (!this.audioManager) {
					this.audioManager = new AudioManager();
				}
				return this.audioManager;
			},
			handleOnAfterSendMessage() {
				if (this.audioUsed) {
					im_v2_lib_analytics.Analytics.getInstance().copilot.onUseAudioInput(this.dialogId);
					im_v2_lib_analytics.Analytics.getInstance().aiAssistant.onUseAudioInput(this.dialogId);
					this.audioUsed = false;
				}
				this.audioMode = false;
			},
			getEmitter() {
				return this.$Bitrix.eventEmitter;
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		// Explicit Tab stop: WebKit keeps a bare <button> out of the Tab order until full keyboard access is
		// turned on in the OS.
		template: `
		<button
			v-if="isAudioModeAvailable()"
			type="button"
			tabindex="0"
			class="bx-im-copilot-audio-input__container bx-im-textarea__icon --focus-visible"
			:class="{
				'--active': audioMode,
				'--disabled': isDisabled,
			}"
			:disabled="isDisabled"
			:aria-label="audioButtonLabel"
			data-testid="im-textarea-audio-input-btn"
			@click="onClick"
		>
			<BIcon :name="iconName" :size="ICON_SIZE" hoverable />
		</button>
	`
	};

	const ICON_SIZE$9 = 24;
	const AutoDeleteSelector = {
		name: 'AutoDeleteSelector',
		components: {
			IconButton: im_v2_component_elements_iconButton.IconButton,
			AutoDeleteHint: im_v2_component_elements_autoDelete.AutoDeleteHint,
			AutoDeletePopup: im_v2_component_elements_autoDelete.AutoDeletePopup
		},
		props: {
			dialogId: {
				type: String,
				required: true
			}
		},
		data() {
			return {
				showAutoDeleteMessagesPopup: false,
				showAutoDeleteMessagesHintPopup: false,
				hintConfig: {
					width: 316,
					offsetLeft: -106,
					offsetTop: 5,
					angle: {
						offset: 141
					}
				}
			};
		},
		computed: {
			OutlineIcons: () => ui_iconSet_api_vue.Outline,
			ICON_SIZE: () => ICON_SIZE$9,
			Color: () => im_v2_const.Color,
			isAutoDeleteAllowed() {
				return im_v2_lib_autoDelete.AutoDeleteManager.isAutoDeleteAllowed(this.dialogId);
			},
			dialog() {
				return this.$store.getters['chats/get'](this.dialogId, true);
			},
			autoDeleteDelayInHours() {
				return this.$store.getters['chats/autoDelete/getDelay'](this.dialog.chatId);
			}
		},
		methods: {
			onIconClick() {
				if (!this.isAutoDeleteAllowed) {
					this.showAutoDeleteMessagesHintPopup = true;
					return;
				}
				this.showAutoDeleteMessagesPopup = true;
			},
			closePopup() {
				this.showAutoDeleteMessagesPopup = false;
			},
			hideAutoDeleteMessagesHintPopup() {
				this.showAutoDeleteMessagesHintPopup = false;
			},
			onAutoDeleteDelayChange(delay) {
				this.getChatService().setMessagesAutoDeleteDelay(this.dialogId, delay);
				this.$emit('close');
			},
			getChatService() {
				if (!this.chatService) {
					this.chatService = new im_v2_provider_service_chat.ChatService();
				}
				return this.chatService;
			},
			loc(phraseCode, replacements = {}) {
				return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
			}
		},
		template: `
		<div ref="autoDeleteIcon" class="bx-im-textarea__icon-container">
			<IconButton
				:iconName="OutlineIcons.TIMER_DOT"
				:label="loc('IM_TEXTAREA_AUTO_DELETE_TITLE')"
				:iconColor="Color.accentBlue"
				:iconSize="ICON_SIZE"
				:expanded="showAutoDeleteMessagesPopup"
				class="bx-im-textarea__icon"
				data-testid="im-textarea-auto-delete-btn"
				@click="onIconClick"
			/>
		</div>
		<AutoDeletePopup
			v-if="showAutoDeleteMessagesPopup"
			:autoDeleteDelay="autoDeleteDelayInHours"
			@close="closePopup"
			@autoDeleteDelayChange="onAutoDeleteDelayChange"
		/>
		<AutoDeleteHint
			v-if="showAutoDeleteMessagesHintPopup"
			:bindElement="$refs['autoDeleteIcon']"
			:config="hintConfig"
			@close="hideAutoDeleteMessagesHintPopup"
		/>
	`
	};

	// Keeps a surface that never becomes visible from waiting forever.
	const MAX_WAIT_FRAMES = 20;

	/**
	 * Runs `callback` once `container` is really visible and, when given, `isReady` holds too.
	 *
	 * Popup content is mounted while the popup is still fading in, and nothing inside an invisible
	 * element is focusable: focus work done right away is silently lost. `isReady` covers what a visible
	 * container does not hold yet - the sticker grid is a skeleton until its first page arrives. Both
	 * share the frame budget, so a surface that never gets ready still runs its callback.
	 *
	 * Cancel on unmount, or a pending frame runs the callback for a surface that is already gone.
	 */
	function runWhenVisible(container, callback, isReady = null) {
		let frameId = null;
		const isSurfaceReady = () => {
			return ui_a11y.InteractivityChecker.isVisible(container) && (isReady === null || isReady());
		};
		const runWhenReady = attempt => {
			if (attempt >= MAX_WAIT_FRAMES || isSurfaceReady()) {
				callback();
				return;
			}
			frameId = requestAnimationFrame(() => {
				frameId = null;
				runWhenReady(attempt + 1);
			});
		};
		runWhenReady(0);
		return () => {
			if (frameId !== null) {
				cancelAnimationFrame(frameId);
				frameId = null;
			}
		};
	}

	/**
	 * Activates a focus zone once its container is really visible: a zone activated over an invisible
	 * container collects an empty set and stays dead for the rest of its life - no roving tabindex, no
	 * reaction to arrows.
	 *
	 * The frame budget of `runWhenVisible` lands on exactly that dead zone, so an activation it forced
	 * refreshes the element set once the container does show up - markup that never changes again (the
	 * emoji grid, the switcher chips) is collected no other way. A refresh over a container that stays
	 * invisible collects the same empty set, so that second wait needs no exit of its own.
	 */
	function activateWhenVisible(zone, container) {
		let cancelRefresh = null;
		const cancelActivation = runWhenVisible(container, () => {
			const forcedByFrameBudget = !ui_a11y.InteractivityChecker.isVisible(container);
			zone.activate();
			if (forcedByFrameBudget) {
				cancelRefresh = runWhenVisible(container, () => {
					zone.refreshElements();
				});
			}
		});
		return () => {
			cancelActivation();
			cancelRefresh?.();
		};
	}

	// `row` is the index of the cell's `role="row"` among the rows that hold a focusable cell, `column`
	// is its place within that row.

	// A panel painted over the bottom of the scrollport. Two selectors and not one because the overlay is
	// a sibling of the scrollport, not its descendant: `within` scopes the search, `selector` finds it.

	const GRID_BIND_KEYS = ui_a11y.FocusKeys.ArrowAll | ui_a11y.FocusKeys.HomeAndEnd;
	// Logical rows are real markup, not a coordinate guess: a chunk of four cells for stickers, eight
	// for emoji.
	const ROW_SELECTOR = '[role="row"]';
	// The ... of a sticker pack sits beside the pack title, inside a row header.
	const ROWHEADER_SELECTOR = '[role="rowheader"]';
	// Leaves the focus ring of a scrolled-to cell clear of the scrollport edge.
	const SCROLL_GAP = 4;
	// A taller glyph shifts the baseline of its neighbours, so cells of one visual row may sit a pixel
	// apart: the first-row test of the reveal is "within half a cell", not "exactly the same top".
	const MIN_ROW_TOLERANCE = 1;

	/**
	 * The next cell read from the logical `role="row"` structure - one algorithm for both grids
	 * (stickers, 4 columns; emoji, 8), column-agnostic.
	 *
	 * `Left/Right` cross row boundaries in the flat order of all cells, `Ctrl/Cmd` turns `Home/End` from
	 * the edge of the row into the edge of the grid. A grid bound returns the current cell ("stop");
	 * focus still on the container, or any other key, falls through to the primitive's linear walk.
	 */
	function getNextFocusableLogical(from, event, rows) {
		const pos = locate(from, rows);
		if (pos === null) {
			return null;
		}
		const current = rows[pos.r][pos.c].element;
		const gridEdge = event.ctrlKey || event.metaKey;
		switch (event.key) {
			case 'ArrowRight':
				return flatNeighbour(rows, pos, 1) ?? current;
			case 'ArrowLeft':
				return flatNeighbour(rows, pos, -1) ?? current;
			case 'ArrowDown':
				return adjacentRowByColumn(rows, pos, 1) ?? current;
			case 'ArrowUp':
				return adjacentRowByColumn(rows, pos, -1) ?? current;
			case 'Home':
				return gridEdge ? firstCell(rows) : rows[pos.r][0].element;
			case 'End':
				return gridEdge ? lastCell(rows) : lastOf(rows[pos.r]).element;
			default:
				return null;
		}
	}
	function locate(from, rows) {
		if (from === null) {
			return null;
		}
		for (let r = 0; r < rows.length; r++) {
			const c = rows[r].findIndex(cell => cell.element === from);
			if (c !== -1) {
				return {
					r,
					c
				};
			}
		}
		return null;
	}

	// The neighbour in the flat order of every cell of the grid, stepping across row boundaries.
	function flatNeighbour(rows, pos, step) {
		let {
			r
		} = pos;
		let c = pos.c + step;
		if (c < 0) {
			r -= 1;
			if (r < 0) {
				return null;
			}
			c = rows[r].length - 1;
		} else if (c >= rows[r].length) {
			r += 1;
			if (r >= rows.length) {
				return null;
			}
			c = 0;
		}
		return rows[r][c].element;
	}

	// The cell of the adjacent row closest by column; ties go to the left cell.
	function adjacentRowByColumn(rows, pos, step) {
		const r = pos.r + step;
		if (r < 0 || r >= rows.length) {
			return null;
		}
		let closest = rows[r][0];
		for (const cell of rows[r]) {
			if (Math.abs(cell.column - pos.c) < Math.abs(closest.column - pos.c)) {
				closest = cell;
			}
		}
		return closest.element;
	}
	function firstCell(rows) {
		return rows[0]?.[0]?.element ?? null;
	}
	function lastCell(rows) {
		const lastRow = rows[rows.length - 1];
		return lastRow ? lastOf(lastRow).element : null;
	}
	function lastOf(row) {
		return row[row.length - 1];
	}

	/**
	 * The grid as logical rows: every `role="row"` that holds at least one cell matching `cellSelector`,
	 * in document order. Structure only - no geometry. A row with no focusable cell (a pack header with
	 * no actions, an emoji category title) contributes nothing, so vertical moves cross it.
	 */
	function readLogicalRows(container, cellSelector) {
		const rows = [];
		for (const rowElement of container.querySelectorAll(ROW_SELECTOR)) {
			const cellElements = [...rowElement.querySelectorAll(cellSelector)];
			if (cellElements.length === 0) {
				continue;
			}
			const row = rows.length;
			rows.push(cellElements.map((element, column) => ({
				element,
				row,
				column
			})));
		}
		return rows;
	}

	/**
	 * Roving focus over a grid whose rows are real `role="row"` markup: arrows move by logical rows and
	 * columns (`getNextFocusableLogical`), and the focused cell is revealed inside the container, never by
	 * scrolling the page.
	 *
	 * Lifecycle is the caller's: `activate()` once the grid is rendered, `deactivate()` before unmount.
	 */
	class GridFocusZone {
		#container;
		#cellSelector;
		#sectionSelector;
		#bottomOverlay;
		#onLastRowFocus;
		#zone;
		#entryPoint = null;
		#pendingEntryCell = null;
		#cancelActivation = null;
		#rows = null;
		#structureObserver = null;
		#invalidateRows = () => {
			this.#rows = null;
		};
		#focusInHandler = event => {
			// The nomination is spent by the first arrival of focus in the zone, whatever it lands on: kept
			// past that, it would align a section on some later, ordinary focus of the same cell.
			const nominated = this.#pendingEntryCell;
			this.#pendingEntryCell = null;
			const cell = event.target;
			if (cell instanceof HTMLElement && cell.matches(this.#cellSelector)) {
				scrollCellIntoView(this.#container, cell, {
					cellSelector: this.#cellSelector,
					sectionSelector: this.#sectionSelector,
					bottomOverlay: this.#bottomOverlay,
					alignSectionTop: cell === nominated
				});
				this.#notifyIfLastRow(cell);
			}
		};
		constructor(container, cellSelector, options = {}) {
			this.#container = container;
			this.#cellSelector = cellSelector;
			this.#sectionSelector = options.sectionSelector ?? null;
			this.#bottomOverlay = options.bottomOverlay ?? null;
			this.#onLastRowFocus = options.onLastRowFocus ?? null;
			this.#zone = im_v2_lib_a11y.createListFocusZone(container, {
				bindKeys: GRID_BIND_KEYS,
				focusableElementFilter: element => element.matches(cellSelector),
				// A browser-native reveal scrolls every ancestor, including the page; #focusInHandler
				// scrolls the container instead.
				preventScroll: true,
				// `direction` merges both arrow axes and is unused: `getNextFocusableLogical` reads the axis
				// and the grid-edge modifier from the raw event.
				getNextFocusable: (direction, from, event) => {
					return getNextFocusableLogical(from, event, this.#readRows());
				},
				// A strategy of its own also replaces how the very first entry point is resolved, so it is
				// installed only for a caller that moves the entry point itself.
				focusInStrategy: options.withEntryPointControl === true ? () => this.#takeEntryPoint() : undefined
			});
		}

		/**
		 * Nominates the cell focus lands on the next time it enters the grid from outside - the first cell
		 * of the pack just picked. Spent once: after that the entry point is the cell focus left last,
		 * which is what a user who only scrolled the grid expects to come back to.
		 */
		setEntryPoint(cell) {
			this.#entryPoint = cell;
		}
		#takeEntryPoint() {
			const entryPoint = this.#entryPoint;
			this.#entryPoint = null;
			// The reveal is keyed on this cell and not on the event: only a caller's nomination aligns its
			// section to the top, the fallbacks below keep the minimal reveal. Nominating the cell that
			// already holds focus raises no focusin, so such a nomination would never be spent.
			this.#pendingEntryCell = entryPoint === document.activeElement ? null : entryPoint;

			// The fallback has to be complete: this strategy also resolves the initial entry point, and an
			// empty result there leaves the grid without a single tabbable cell, unreachable by Tab.
			return entryPoint ?? this.#zone.getCurrentFocusedElement() ?? this.#container.querySelector(this.#cellSelector);
		}

		/**
		 * The logical rows, cached until the markup changes: the structure changes on the order of a page
		 * load, arrows are pressed on the order of a key repeat.
		 *
		 * Only the observer clears the cache, never a timer, and `takeRecords` covers a change made inside
		 * the very task that reads - records are queued the moment the DOM changes, while the callback only
		 * runs once the stack empties. Without an observer nothing would clear it, so the read stays direct.
		 */
		#readRows() {
			if (this.#structureObserver === null) {
				return readLogicalRows(this.#container, this.#cellSelector);
			}
			if (this.#structureObserver.takeRecords().length > 0) {
				this.#rows = null;
			}
			if (this.#rows === null) {
				this.#rows = readLogicalRows(this.#container, this.#cellSelector);
			}
			return this.#rows;
		}

		// A cell of the last logical row means focus has reached the end of what is loaded; the cached read
		// makes a page brought in by scrolling part of the count without a second pass.
		#notifyIfLastRow(cell) {
			if (this.#onLastRowFocus === null) {
				return;
			}
			const rows = this.#readRows();
			const lastRow = rows[rows.length - 1] ?? null;
			if (lastRow !== null && lastRow.some(gridCell => gridCell.element === cell)) {
				this.#onLastRowFocus();
			}
		}
		activate() {
			main_core.Event.bind(this.#container, 'focusin', this.#focusInHandler);
			// Structure only, never attributes: the roving focus rewrites `tabindex` on every move, and
			// watching attributes would throw the rows away on every key press.
			this.#structureObserver = new MutationObserver(this.#invalidateRows);
			this.#structureObserver.observe(this.#container, {
				childList: true,
				subtree: true
			});
			this.#cancelActivation = activateWhenVisible(this.#zone, this.#container);
		}
		deactivate() {
			this.#cancelActivation?.();
			this.#cancelActivation = null;
			this.#structureObserver?.disconnect();
			this.#structureObserver = null;
			this.#rows = null;
			main_core.Event.unbind(this.#container, 'focusin', this.#focusInHandler);
			this.#zone.deactivate();
		}
	}
	function scrollCellIntoView(container, cell, options) {
		const {
			cellSelector,
			sectionSelector,
			bottomOverlay,
			alignSectionTop
		} = options;
		const containerRect = container.getBoundingClientRect();
		const cellRect = cell.getBoundingClientRect();
		const revealTop = getRevealTop(cell, cellRect, cellSelector, sectionSelector);
		if (alignSectionTop) {
			// The pack scroll animates to this same top and its scrollTop is still mid-flight when focus
			// enters, so a minimal reveal would read a section far below and park its first row at the
			// bottom. Aiming where the pack scroll aims makes the two agree wherever the animation has got
			// to, and is a no-op once it has arrived.
			container.scrollTop += revealTop - containerRect.top;
			return;
		}
		const visibleBottom = getVisibleBottom(container, containerRect, bottomOverlay);
		if (revealTop < containerRect.top) {
			container.scrollTop -= containerRect.top - revealTop + SCROLL_GAP;
		} else if (cellRect.bottom > visibleBottom) {
			container.scrollTop += cellRect.bottom - visibleBottom + SCROLL_GAP;
		}
	}

	/**
	 * Which top edge has to end up inside the scrollport.
	 *
	 * For a cell of the first row of a section it is the top of the section: the title above the row is
	 * what tells which category or pack focus has landed in, and it already sits inside the section box
	 * in both grids - the margin of an emoji title collapses out of the section, the header of a sticker
	 * pack is its first child.
	 *
	 * The "first row" is measured against the first cell of content, so the ... of a sticker pack - a
	 * cell of the row header, beside the title - is not it; the first sticker below it is.
	 */
	function getRevealTop(cell, cellRect, cellSelector, sectionSelector) {
		const section = sectionSelector === null ? null : cell.closest(sectionSelector);
		const firstCellOfContent = section === null ? null : firstContentCell(section, cellSelector);
		if (firstCellOfContent === null) {
			return cellRect.top;
		}
		const tolerance = Math.max(cellRect.height / 2, MIN_ROW_TOLERANCE);
		const isFirstRow = Math.abs(cellRect.top - firstCellOfContent.getBoundingClientRect().top) <= tolerance;
		return isFirstRow ? section.getBoundingClientRect().top : cellRect.top;
	}
	function firstContentCell(section, cellSelector) {
		// `:is` wraps `cellSelector` because a caller may pass a list of selectors.
		return section.querySelector(`:is(${cellSelector}):not(${ROWHEADER_SELECTOR}, ${ROWHEADER_SELECTOR} *)`);
	}

	/**
	 * Where the grid stops being visible from below.
	 *
	 * A surface may paint a panel over the bottom of the scrollport rather than shrink it - the resting
	 * look of the emoji popup keeps the last row sliding under its buttons. A cell in that strip is
	 * inside the box of the container yet hidden, so a scroll decision made on `containerRect.bottom`
	 * leaves focus on a row nobody can see and scrolls one key press too late (WCAG 2.4.11).
	 *
	 * The panel is measured rather than declared in numbers, because its height lives in CSS. No panel
	 * named, or none found, and the grid ends where its own box ends.
	 */
	function getVisibleBottom(container, containerRect, bottomOverlay) {
		if (bottomOverlay === null) {
			return containerRect.bottom;
		}
		const overlay = container.closest(bottomOverlay.within)?.querySelector(bottomOverlay.selector) ?? null;
		if (overlay === null) {
			return containerRect.bottom;
		}

		// A panel laid out below the grid instead of over it hides no row of it.
		return Math.min(containerRect.bottom, overlay.getBoundingClientRect().top);
	}

	const emoji = [{
		id: 1,
		code: 'PEOPLE',
		showForWindows: true,
		emoji: [{
			symbol: '\uD83D\uDE00'
		}, {
			symbol: '\uD83D\uDE03'
		}, {
			symbol: '\uD83D\uDE04'
		}, {
			symbol: '\uD83D\uDE01'
		}, {
			symbol: '\uD83D\uDE06'
		}, {
			symbol: '\uD83D\uDE05'
		}, {
			symbol: '\uD83D\uDE02'
		}, {
			symbol: '\uD83E\uDD23'
		}, {
			symbol: '\uD83D\uDE0A'
		}, {
			symbol: '\uD83D\uDE07'
		}, {
			symbol: '\uD83D\uDE42'
		}, {
			symbol: '\uD83D\uDE43'
		}, {
			symbol: '\uD83D\uDE09'
		}, {
			symbol: '\uD83D\uDE0C'
		}, {
			symbol: '\uD83D\uDE0D'
		}, {
			symbol: '\uD83E\uDD70'
		}, {
			symbol: '\uD83D\uDE18'
		}, {
			symbol: '\uD83D\uDE17'
		}, {
			symbol: '\uD83D\uDE19'
		}, {
			symbol: '\uD83D\uDE1A'
		}, {
			symbol: '\uD83D\uDE0B'
		}, {
			symbol: '\uD83D\uDE1B'
		}, {
			symbol: '\uD83D\uDE1D'
		}, {
			symbol: '\uD83D\uDE1C'
		}, {
			symbol: '\uD83E\uDD2A'
		}, {
			symbol: '\uD83E\uDD28'
		}, {
			symbol: '\uD83E\uDDD0'
		}, {
			symbol: '\uD83E\uDD13'
		}, {
			symbol: '\uD83D\uDE0E'
		}, {
			symbol: '\uD83E\uDD29'
		}, {
			symbol: '\uD83E\uDD73'
		}, {
			symbol: '\uD83D\uDE0F'
		}, {
			symbol: '\uD83D\uDE12'
		}, {
			symbol: '\uD83D\uDE1E'
		}, {
			symbol: '\uD83D\uDE14'
		}, {
			symbol: '\uD83D\uDE1F'
		}, {
			symbol: '\uD83D\uDE15'
		}, {
			symbol: '\uD83D\uDE41'
		}, {
			symbol: '\uD83D\uDE23'
		}, {
			symbol: '\uD83D\uDE2B'
		}, {
			symbol: '\uD83D\uDE29'
		}, {
			symbol: '\uD83E\uDD7A'
		}, {
			symbol: '\uD83D\uDE22'
		}, {
			symbol: '\uD83D\uDE2D'
		}, {
			symbol: '\uD83D\uDE24'
		}, {
			symbol: '\uD83D\uDE20'
		}, {
			symbol: '\uD83D\uDE21'
		}, {
			symbol: '\uD83E\uDD2C'
		}, {
			symbol: '\uD83E\uDD2F'
		}, {
			symbol: '\uD83D\uDE33'
		}, {
			symbol: '\uD83E\uDD75'
		}, {
			symbol: '\uD83E\uDD76'
		}, {
			symbol: '\uD83D\uDE31'
		}, {
			symbol: '\uD83D\uDE28'
		}, {
			symbol: '\uD83D\uDE30'
		}, {
			symbol: '\uD83D\uDE25'
		}, {
			symbol: '\uD83D\uDE13'
		}, {
			symbol: '\uD83E\uDD17'
		}, {
			symbol: '\uD83E\uDD14'
		}, {
			symbol: '\uD83E\uDD2D'
		}, {
			symbol: '\uD83E\uDD2B'
		}, {
			symbol: '\uD83E\uDD25'
		}, {
			symbol: '\uD83D\uDE36'
		}, {
			symbol: '\uD83D\uDE10'
		}, {
			symbol: '\uD83D\uDE11'
		}, {
			symbol: '\uD83D\uDE2C'
		}, {
			symbol: '\uD83D\uDE44'
		}, {
			symbol: '\uD83D\uDE2F'
		}, {
			symbol: '\uD83D\uDE26'
		}, {
			symbol: '\uD83D\uDE27'
		}, {
			symbol: '\uD83D\uDE2E'
		}, {
			symbol: '\uD83D\uDE32'
		}, {
			symbol: '\uD83D\uDE34'
		}, {
			symbol: '\uD83E\uDD24'
		}, {
			symbol: '\uD83D\uDE2A'
		}, {
			symbol: '\uD83D\uDE35'
		}, {
			symbol: '\uD83E\uDD10'
		}, {
			symbol: '\uD83E\uDD74'
		}, {
			symbol: '\uD83E\uDD22'
		}, {
			symbol: '\uD83E\uDD2E'
		}, {
			symbol: '\uD83E\uDD27'
		}, {
			symbol: '\uD83D\uDE37'
		}, {
			symbol: '\uD83E\uDD12'
		}, {
			symbol: '\uD83E\uDD15'
		}, {
			symbol: '\uD83E\uDD11'
		}, {
			symbol: '\uD83E\uDD20'
		}, {
			symbol: '\uD83D\uDE08'
		}, {
			symbol: '\uD83D\uDC7F'
		}, {
			symbol: '\uD83D\uDC79'
		}, {
			symbol: '\uD83D\uDC7A'
		}, {
			symbol: '\uD83E\uDD21'
		}, {
			symbol: '\uD83D\uDCA9'
		}, {
			symbol: '\uD83D\uDC7B'
		}, {
			symbol: '\u2620\uFE0F'
		}, {
			symbol: '\uD83D\uDC80'
		}, {
			symbol: '\uD83D\uDC7D'
		}, {
			symbol: '\uD83D\uDC7E'
		}, {
			symbol: '\uD83E\uDD16'
		}, {
			symbol: '\uD83C\uDF83'
		}, {
			symbol: '\uD83D\uDE3A'
		}, {
			symbol: '\uD83D\uDE38'
		}, {
			symbol: '\uD83D\uDE39'
		}, {
			symbol: '\uD83D\uDE3B'
		}, {
			symbol: '\uD83D\uDE3C'
		}, {
			symbol: '\uD83D\uDE3D'
		}, {
			symbol: '\uD83D\uDE40'
		}, {
			symbol: '\uD83D\uDE3F'
		}, {
			symbol: '\uD83D\uDE3E'
		}, {
			symbol: '\uD83E\uDD32'
		}, {
			symbol: '\uD83D\uDC50'
		}, {
			symbol: '\uD83D\uDE4C'
		}, {
			symbol: '\uD83D\uDC4F'
		}, {
			symbol: '\uD83E\uDD1D'
		}, {
			symbol: '\uD83D\uDC4D'
		}, {
			symbol: '\uD83D\uDC4E'
		}, {
			symbol: '\uD83D\uDC4A'
		}, {
			symbol: '\u270A'
		}, {
			symbol: '\uD83E\uDD1B'
		}, {
			symbol: '\uD83E\uDD1C'
		}, {
			symbol: '\uD83E\uDD1E'
		}, {
			symbol: '\u270C\uFE0F'
		}, {
			symbol: '\uD83E\uDD1F'
		}, {
			symbol: '\uD83E\uDD18'
		}, {
			symbol: '\uD83D\uDC4C'
		}, {
			symbol: '\uD83D\uDC48'
		}, {
			symbol: '\uD83D\uDC49'
		}, {
			symbol: '\uD83D\uDC46'
		}, {
			symbol: '\uD83D\uDC47'
		}, {
			symbol: '\uD83E\uDD1A'
		}, {
			symbol: '\uD83D\uDD90\uFE0F'
		}, {
			symbol: '\uD83D\uDD96'
		}, {
			symbol: '\uD83D\uDC4B'
		}, {
			symbol: '\uD83E\uDD19'
		}, {
			symbol: '\uD83D\uDCAA'
		}, {
			symbol: '\uD83D\uDD95'
		}, {
			symbol: '\u270D\uFE0F'
		}, {
			symbol: '\uD83D\uDE4F'
		}, {
			symbol: '\uD83E\uDDB6'
		}, {
			symbol: '\uD83E\uDDB5'
		}, {
			symbol: '\uD83D\uDC84'
		}, {
			symbol: '\uD83D\uDC8B'
		}, {
			symbol: '\uD83D\uDC44'
		}, {
			symbol: '\uD83E\uDDB7'
		}, {
			symbol: '\uD83D\uDC45'
		}, {
			symbol: '\uD83D\uDC43'
		}, {
			symbol: '\uD83D\uDC63'
		}, {
			symbol: '\uD83D\uDC41\uFE0F'
		}, {
			symbol: '\uD83D\uDC40'
		}, {
			symbol: '\uD83E\uDDE0'
		}, {
			symbol: '\uD83D\uDDE3\uFE0F'
		}, {
			symbol: '\uD83D\uDC64'
		}, {
			symbol: '\uD83D\uDC65'
		}, {
			symbol: '\uD83D\uDC76'
		}, {
			symbol: '\uD83D\uDC67'
		}, {
			symbol: '\uD83E\uDDD2'
		}, {
			symbol: '\uD83D\uDC66'
		}, {
			symbol: '\uD83D\uDC69'
		}, {
			symbol: '\uD83E\uDDD1'
		}, {
			symbol: '\uD83D\uDC68'
		}, {
			symbol: '\uD83D\uDC71'
		}, {
			symbol: '\uD83E\uDDD4'
		}, {
			symbol: '\uD83D\uDC75'
		}, {
			symbol: '\uD83E\uDDD3'
		}, {
			symbol: '\uD83D\uDC74'
		}, {
			symbol: '\uD83D\uDC72'
		}, {
			symbol: '\uD83D\uDC73'
		}, {
			symbol: '\uD83E\uDDD5'
		}, {
			symbol: '\uD83D\uDC6E'
		}, {
			symbol: '\uD83D\uDC77'
		}, {
			symbol: '\uD83D\uDC82'
		}, {
			symbol: '\uD83D\uDD75\uFE0F'
		}, {
			symbol: '\u2695\uFE0F'
		}, {
			symbol: '\uD83C\uDF3E'
		}, {
			symbol: '\uD83C\uDF73'
		}, {
			symbol: '\uD83C\uDF93'
		}, {
			symbol: '\uD83C\uDFA4'
		}, {
			symbol: '\uD83C\uDFEB'
		}, {
			symbol: '\uD83C\uDFED'
		}, {
			symbol: '\uD83D\uDCBB'
		}, {
			symbol: '\uD83D\uDCBC'
		}, {
			symbol: '\uD83D\uDC69'
		}, {
			symbol: '\u2764\uFE0F'
		}, {
			symbol: '\uD83D\uDD27'
		}, {
			symbol: '\uD83D\uDD2C'
		}, {
			symbol: '\uD83C\uDFA8'
		}, {
			symbol: '\uD83D\uDE92'
		}, {
			symbol: '\uD83D\uDE80'
		}, {
			symbol: '\uD83D\uDC70'
		}, {
			symbol: '\uD83E\uDD35'
		}, {
			symbol: '\uD83D\uDC78'
		}, {
			symbol: '\uD83E\uDD34'
		}, {
			symbol: '\uD83E\uDDB8'
		}, {
			symbol: '\uD83E\uDDB9'
		}, {
			symbol: '\uD83E\uDD36'
		}, {
			symbol: '\uD83C\uDF85'
		}, {
			symbol: '\uD83E\uDDD9'
		}, {
			symbol: '\uD83E\uDDDD'
		}, {
			symbol: '\uD83E\uDDDB'
		}, {
			symbol: '\uD83E\uDDDF'
		}, {
			symbol: '\uD83E\uDDDE'
		}, {
			symbol: '\uD83E\uDDDC'
		}, {
			symbol: '\uD83E\uDDDA'
		}, {
			symbol: '\uD83D\uDC7C'
		}, {
			symbol: '\uD83E\uDD30'
		}, {
			symbol: '\uD83E\uDD31'
		}, {
			symbol: '\uD83D\uDE47'
		}, {
			symbol: '\uD83D\uDC81'
		}, {
			symbol: '\uD83D\uDE45'
		}, {
			symbol: '\uD83D\uDE46'
		}, {
			symbol: '\uD83D\uDE4B'
		}, {
			symbol: '\uD83E\uDD26'
		}, {
			symbol: '\uD83E\uDD37'
		}, {
			symbol: '\uD83D\uDE4E'
		}, {
			symbol: '\uD83D\uDE4D'
		}, {
			symbol: '\uD83D\uDC87'
		}, {
			symbol: '\uD83D\uDC86'
		}, {
			symbol: '\uD83E\uDDD6'
		}, {
			symbol: '\uD83D\uDC85'
		}, {
			symbol: '\uD83E\uDD33'
		}, {
			symbol: '\uD83D\uDC83'
		}, {
			symbol: '\uD83D\uDD7A'
		}, {
			symbol: '\uD83D\uDC6F'
		}, {
			symbol: '\uD83D\uDD74\uFE0F'
		}, {
			symbol: '\uD83D\uDEB6'
		}, {
			symbol: '\uD83C\uDFC3'
		}, {
			symbol: '\uD83D\uDC6B'
		}, {
			symbol: '\uD83D\uDC6D'
		}, {
			symbol: '\uD83D\uDC6C'
		}, {
			symbol: '\uD83D\uDC91'
		}, {
			symbol: '\uD83D\uDC8F'
		}, {
			symbol: '\uD83D\uDC6A'
		}, {
			symbol: '\uD83E\uDDF6'
		}, {
			symbol: '\uD83E\uDDF5'
		}, {
			symbol: '\uD83E\uDDE5'
		}, {
			symbol: '\uD83E\uDD7C'
		}, {
			symbol: '\uD83D\uDC5A'
		}, {
			symbol: '\uD83D\uDC55'
		}, {
			symbol: '\uD83D\uDC56'
		}, {
			symbol: '\uD83D\uDC54'
		}, {
			symbol: '\uD83D\uDC57'
		}, {
			symbol: '\uD83D\uDC59'
		}, {
			symbol: '\uD83D\uDC58'
		}, {
			symbol: '\uD83E\uDD7F'
		}, {
			symbol: '\uD83D\uDC60'
		}, {
			symbol: '\uD83D\uDC61'
		}, {
			symbol: '\uD83D\uDC62'
		}, {
			symbol: '\uD83D\uDC5E'
		}, {
			symbol: '\uD83D\uDC5F'
		}, {
			symbol: '\uD83E\uDD7E'
		}, {
			symbol: '\uD83E\uDDE6'
		}, {
			symbol: '\uD83E\uDDE4'
		}, {
			symbol: '\uD83E\uDDE3'
		}, {
			symbol: '\uD83C\uDFA9'
		}, {
			symbol: '\uD83E\uDDE2'
		}, {
			symbol: '\uD83D\uDC52'
		}, {
			symbol: '\uD83C\uDF93'
		}, {
			symbol: '\u26D1\uFE0F'
		}, {
			symbol: '\uD83D\uDC51'
		}, {
			symbol: '\uD83D\uDC8D'
		}, {
			symbol: '\uD83D\uDC5D'
		}, {
			symbol: '\uD83D\uDC5B'
		}, {
			symbol: '\uD83D\uDC5C'
		}, {
			symbol: '\uD83D\uDCBC'
		}, {
			symbol: '\uD83C\uDF92'
		}, {
			symbol: '\uD83E\uDDF3'
		}, {
			symbol: '\uD83D\uDC53'
		}, {
			symbol: '\uD83D\uDD76\uFE0F'
		}, {
			symbol: '\uD83E\uDD7D'
		}, {
			symbol: '\uD83C\uDF02'
		}]
	}, {
		id: 2,
		code: 'ANIMALS',
		showForWindows: true,
		emoji: [{
			symbol: '\uD83D\uDC36'
		}, {
			symbol: '\uD83D\uDC31'
		}, {
			symbol: '\uD83D\uDC2D'
		}, {
			symbol: '\uD83D\uDC39'
		}, {
			symbol: '\uD83D\uDC30'
		}, {
			symbol: '\uD83E\uDD8A'
		}, {
			symbol: '\uD83D\uDC3B'
		}, {
			symbol: '\uD83D\uDC3C'
		}, {
			symbol: '\uD83D\uDC28'
		}, {
			symbol: '\uD83D\uDC2F'
		}, {
			symbol: '\uD83E\uDD81'
		}, {
			symbol: '\uD83D\uDC2E'
		}, {
			symbol: '\uD83D\uDC37'
		}, {
			symbol: '\uD83D\uDC3D'
		}, {
			symbol: '\uD83D\uDC38'
		}, {
			symbol: '\uD83D\uDC35'
		}, {
			symbol: '\uD83D\uDE48'
		}, {
			symbol: '\uD83D\uDE49'
		}, {
			symbol: '\uD83D\uDE4A'
		}, {
			symbol: '\uD83D\uDC12'
		}, {
			symbol: '\uD83D\uDC14'
		}, {
			symbol: '\uD83D\uDC27'
		}, {
			symbol: '\uD83D\uDC26'
		}, {
			symbol: '\uD83D\uDC24'
		}, {
			symbol: '\uD83D\uDC23'
		}, {
			symbol: '\uD83D\uDC25'
		}, {
			symbol: '\uD83E\uDD86'
		}, {
			symbol: '\uD83E\uDD85'
		}, {
			symbol: '\uD83E\uDD89'
		}, {
			symbol: '\uD83E\uDD87'
		}, {
			symbol: '\uD83D\uDC3A'
		}, {
			symbol: '\uD83D\uDC17'
		}, {
			symbol: '\uD83D\uDC34'
		}, {
			symbol: '\uD83E\uDD84'
		}, {
			symbol: '\uD83D\uDC1D'
		}, {
			symbol: '\uD83D\uDC1B'
		}, {
			symbol: '\uD83E\uDD8B'
		}, {
			symbol: '\uD83D\uDC0C'
		}, {
			symbol: '\uD83D\uDC1E'
		}, {
			symbol: '\uD83D\uDC1C'
		}, {
			symbol: '\uD83E\uDD9F'
		}, {
			symbol: '\uD83E\uDD97'
		}, {
			symbol: '\uD83D\uDD77\uFE0F'
		}, {
			symbol: '\uD83D\uDD78\uFE0F'
		}, {
			symbol: '\uD83E\uDD82'
		}, {
			symbol: '\uD83D\uDC22'
		}, {
			symbol: '\uD83D\uDC0D'
		}, {
			symbol: '\uD83E\uDD8E'
		}, {
			symbol: '\uD83E\uDD96'
		}, {
			symbol: '\uD83E\uDD95'
		}, {
			symbol: '\uD83D\uDC19'
		}, {
			symbol: '\uD83E\uDD91'
		}, {
			symbol: '\uD83E\uDD90'
		}, {
			symbol: '\uD83E\uDD9E'
		}, {
			symbol: '\uD83E\uDD80'
		}, {
			symbol: '\uD83D\uDC21'
		}, {
			symbol: '\uD83D\uDC20'
		}, {
			symbol: '\uD83D\uDC1F'
		}, {
			symbol: '\uD83D\uDC2C'
		}, {
			symbol: '\uD83D\uDC33'
		}, {
			symbol: '\uD83D\uDC0B'
		}, {
			symbol: '\uD83E\uDD88'
		}, {
			symbol: '\uD83D\uDC0A'
		}, {
			symbol: '\uD83D\uDC05'
		}, {
			symbol: '\uD83D\uDC06'
		}, {
			symbol: '\uD83E\uDD93'
		}, {
			symbol: '\uD83E\uDD8D'
		}, {
			symbol: '\uD83D\uDC18'
		}, {
			symbol: '\uD83E\uDD9B'
		}, {
			symbol: '\uD83E\uDD8F'
		}, {
			symbol: '\uD83D\uDC2A'
		}, {
			symbol: '\uD83D\uDC2B'
		}, {
			symbol: '\uD83E\uDD92'
		}, {
			symbol: '\uD83E\uDD98'
		}, {
			symbol: '\uD83D\uDC03'
		}, {
			symbol: '\uD83D\uDC02'
		}, {
			symbol: '\uD83D\uDC04'
		}, {
			symbol: '\uD83D\uDC0E'
		}, {
			symbol: '\uD83D\uDC16'
		}, {
			symbol: '\uD83D\uDC0F'
		}, {
			symbol: '\uD83D\uDC11'
		}, {
			symbol: '\uD83E\uDD99'
		}, {
			symbol: '\uD83D\uDC10'
		}, {
			symbol: '\uD83E\uDD8C'
		}, {
			symbol: '\uD83D\uDC15'
		}, {
			symbol: '\uD83D\uDC29'
		}, {
			symbol: '\uD83D\uDC08'
		}, {
			symbol: '\uD83D\uDC13'
		}, {
			symbol: '\uD83E\uDD83'
		}, {
			symbol: '\uD83E\uDD9A'
		}, {
			symbol: '\uD83E\uDD9C'
		}, {
			symbol: '\uD83E\uDDA2'
		}, {
			symbol: '\uD83D\uDD4A\uFE0F'
		}, {
			symbol: '\uD83D\uDC07'
		}, {
			symbol: '\uD83E\uDD9D'
		}, {
			symbol: '\uD83E\uDDA1'
		}, {
			symbol: '\uD83D\uDC01'
		}, {
			symbol: '\uD83D\uDC00'
		}, {
			symbol: '\uD83D\uDC3F\uFE0F'
		}, {
			symbol: '\uD83E\uDD94'
		}, {
			symbol: '\uD83D\uDC3E'
		}, {
			symbol: '\uD83D\uDC09'
		}, {
			symbol: '\uD83D\uDC32'
		}, {
			symbol: '\uD83C\uDF35'
		}, {
			symbol: '\uD83C\uDF84'
		}, {
			symbol: '\uD83C\uDF32'
		}, {
			symbol: '\uD83C\uDF33'
		}, {
			symbol: '\uD83C\uDF34'
		}, {
			symbol: '\uD83C\uDF31'
		}, {
			symbol: '\uD83C\uDF3F'
		}, {
			symbol: '\u2618\uFE0F'
		}, {
			symbol: '\uD83C\uDF40'
		}, {
			symbol: '\uD83C\uDF8D'
		}, {
			symbol: '\uD83C\uDF8B'
		}, {
			symbol: '\uD83C\uDF43'
		}, {
			symbol: '\uD83C\uDF42'
		}, {
			symbol: '\uD83C\uDF41'
		}, {
			symbol: '\uD83C\uDF44'
		}, {
			symbol: '\uD83D\uDC1A'
		}, {
			symbol: '\uD83C\uDF3E'
		}, {
			symbol: '\uD83D\uDC90'
		}, {
			symbol: '\uD83C\uDF37'
		}, {
			symbol: '\uD83C\uDF39'
		}, {
			symbol: '\uD83E\uDD40'
		}, {
			symbol: '\uD83C\uDF3A'
		}, {
			symbol: '\uD83C\uDF38'
		}, {
			symbol: '\uD83C\uDF3C'
		}, {
			symbol: '\uD83C\uDF3B'
		}, {
			symbol: '\uD83C\uDF1E'
		}, {
			symbol: '\uD83C\uDF1D'
		}, {
			symbol: '\uD83C\uDF1B'
		}, {
			symbol: '\uD83C\uDF1C'
		}, {
			symbol: '\uD83C\uDF1A'
		}, {
			symbol: '\uD83C\uDF15'
		}, {
			symbol: '\uD83C\uDF16'
		}, {
			symbol: '\uD83C\uDF17'
		}, {
			symbol: '\uD83C\uDF18'
		}, {
			symbol: '\uD83C\uDF11'
		}, {
			symbol: '\uD83C\uDF12'
		}, {
			symbol: '\uD83C\uDF13'
		}, {
			symbol: '\uD83C\uDF14'
		}, {
			symbol: '\uD83C\uDF19'
		}, {
			symbol: '\uD83C\uDF0E'
		}, {
			symbol: '\uD83C\uDF0D'
		}, {
			symbol: '\uD83C\uDF0F'
		}, {
			symbol: '\uD83D\uDCAB'
		}, {
			symbol: '\u2B50'
		}, {
			symbol: '\uD83C\uDF1F'
		}, {
			symbol: '\u2728'
		}, {
			symbol: '\u26A1'
		}, {
			symbol: '\u2604\uFE0F'
		}, {
			symbol: '\uD83D\uDCA5'
		}, {
			symbol: '\uD83D\uDD25'
		}, {
			symbol: '\uD83C\uDF2A\uFE0F'
		}, {
			symbol: '\uD83C\uDF08'
		}, {
			symbol: '\u2600\uFE0F'
		}, {
			symbol: '\uD83C\uDF24\uFE0F'
		}, {
			symbol: '\uD83C\uDF25\uFE0F'
		}, {
			symbol: '\uD83C\uDF26\uFE0F'
		}, {
			symbol: '\uD83C\uDF27\uFE0F'
		}, {
			symbol: '\uD83C\uDF29\uFE0F'
		}, {
			symbol: '\uD83C\uDF28\uFE0F'
		}, {
			symbol: '\u2744\uFE0F'
		}, {
			symbol: '\u2603\uFE0F'
		}, {
			symbol: '\u26C4'
		}, {
			symbol: '\uD83C\uDF2C\uFE0F'
		}, {
			symbol: '\uD83D\uDCA8'
		}, {
			symbol: '\uD83D\uDCA7'
		}, {
			symbol: '\uD83D\uDCA6'
		}, {
			symbol: '\u2614'
		}, {
			symbol: '\u2602\uFE0F'
		}, {
			symbol: '\uD83C\uDF0A'
		}, {
			symbol: '\uD83C\uDF2B\uFE0F'
		}]
	}, {
		id: 3,
		code: 'FOOD',
		showForWindows: true,
		emoji: [{
			symbol: '\uD83C\uDF4F'
		}, {
			symbol: '\uD83C\uDF4E'
		}, {
			symbol: '\uD83C\uDF50'
		}, {
			symbol: '\uD83C\uDF4A'
		}, {
			symbol: '\uD83C\uDF4B'
		}, {
			symbol: '\uD83C\uDF4C'
		}, {
			symbol: '\uD83C\uDF49'
		}, {
			symbol: '\uD83C\uDF47'
		}, {
			symbol: '\uD83C\uDF53'
		}, {
			symbol: '\uD83C\uDF48'
		}, {
			symbol: '\uD83C\uDF52'
		}, {
			symbol: '\uD83C\uDF51'
		}, {
			symbol: '\uD83E\uDD6D'
		}, {
			symbol: '\uD83C\uDF4D'
		}, {
			symbol: '\uD83E\uDD65'
		}, {
			symbol: '\uD83E\uDD5D'
		}, {
			symbol: '\uD83C\uDF45'
		}, {
			symbol: '\uD83C\uDF46'
		}, {
			symbol: '\uD83E\uDD51'
		}, {
			symbol: '\uD83E\uDD66'
		}, {
			symbol: '\uD83E\uDD6C'
		}, {
			symbol: '\uD83E\uDD52'
		}, {
			symbol: '\uD83C\uDF36\uFE0F'
		}, {
			symbol: '\uD83C\uDF3D'
		}, {
			symbol: '\uD83E\uDD55'
		}, {
			symbol: '\uD83E\uDD54'
		}, {
			symbol: '\uD83C\uDF60'
		}, {
			symbol: '\uD83E\uDD50'
		}, {
			symbol: '\uD83E\uDD6F'
		}, {
			symbol: '\uD83C\uDF5E'
		}, {
			symbol: '\uD83E\uDD56'
		}, {
			symbol: '\uD83E\uDD68'
		}, {
			symbol: '\uD83E\uDDC0'
		}, {
			symbol: '\uD83E\uDD5A'
		}, {
			symbol: '\uD83C\uDF73'
		}, {
			symbol: '\uD83E\uDD5E'
		}, {
			symbol: '\uD83E\uDD53'
		}, {
			symbol: '\uD83E\uDD69'
		}, {
			symbol: '\uD83C\uDF57'
		}, {
			symbol: '\uD83C\uDF56'
		}, {
			symbol: '\uD83E\uDDB4'
		}, {
			symbol: '\uD83C\uDF2D'
		}, {
			symbol: '\uD83C\uDF54'
		}, {
			symbol: '\uD83C\uDF5F'
		}, {
			symbol: '\uD83C\uDF55'
		}, {
			symbol: '\uD83E\uDD6A'
		}, {
			symbol: '\uD83E\uDD59'
		}, {
			symbol: '\uD83C\uDF2E'
		}, {
			symbol: '\uD83C\uDF2F'
		}, {
			symbol: '\uD83E\uDD57'
		}, {
			symbol: '\uD83E\uDD58'
		}, {
			symbol: '\uD83E\uDD6B'
		}, {
			symbol: '\uD83C\uDF5D'
		}, {
			symbol: '\uD83C\uDF5C'
		}, {
			symbol: '\uD83C\uDF72'
		}, {
			symbol: '\uD83C\uDF5B'
		}, {
			symbol: '\uD83C\uDF63'
		}, {
			symbol: '\uD83C\uDF71'
		}, {
			symbol: '\uD83E\uDD5F'
		}, {
			symbol: '\uD83C\uDF64'
		}, {
			symbol: '\uD83C\uDF59'
		}, {
			symbol: '\uD83C\uDF5A'
		}, {
			symbol: '\uD83C\uDF58'
		}, {
			symbol: '\uD83C\uDF65'
		}, {
			symbol: '\uD83E\uDD60'
		}, {
			symbol: '\uD83E\uDD6E'
		}, {
			symbol: '\uD83C\uDF62'
		}, {
			symbol: '\uD83C\uDF61'
		}, {
			symbol: '\uD83C\uDF67'
		}, {
			symbol: '\uD83C\uDF68'
		}, {
			symbol: '\uD83C\uDF66'
		}, {
			symbol: '\uD83E\uDD67'
		}, {
			symbol: '\uD83E\uDDC1'
		}, {
			symbol: '\uD83C\uDF70'
		}, {
			symbol: '\uD83C\uDF82'
		}, {
			symbol: '\uD83C\uDF6E'
		}, {
			symbol: '\uD83C\uDF6D'
		}, {
			symbol: '\uD83C\uDF6C'
		}, {
			symbol: '\uD83C\uDF6B'
		}, {
			symbol: '\uD83C\uDF7F'
		}, {
			symbol: '\uD83C\uDF69'
		}, {
			symbol: '\uD83C\uDF6A'
		}, {
			symbol: '\uD83C\uDF30'
		}, {
			symbol: '\uD83E\uDD5C'
		}, {
			symbol: '\uD83C\uDF6F'
		}, {
			symbol: '\uD83E\uDD5B'
		}, {
			symbol: '\uD83C\uDF7C'
		}, {
			symbol: '\u2615'
		}, {
			symbol: '\uD83C\uDF75'
		}, {
			symbol: '\uD83E\uDD64'
		}, {
			symbol: '\uD83C\uDF76'
		}, {
			symbol: '\uD83C\uDF7A'
		}, {
			symbol: '\uD83C\uDF7B'
		}, {
			symbol: '\uD83E\uDD42'
		}, {
			symbol: '\uD83C\uDF77'
		}, {
			symbol: '\uD83E\uDD43'
		}, {
			symbol: '\uD83C\uDF78'
		}, {
			symbol: '\uD83C\uDF79'
		}, {
			symbol: '\uD83C\uDF7E'
		}, {
			symbol: '\uD83E\uDD44'
		}, {
			symbol: '\uD83C\uDF74'
		}, {
			symbol: '\uD83C\uDF7D\uFE0F'
		}, {
			symbol: '\uD83E\uDD63'
		}, {
			symbol: '\uD83E\uDD61'
		}, {
			symbol: '\uD83E\uDD62'
		}, {
			symbol: '\uD83E\uDDC2'
		}]
	}, {
		id: 4,
		code: 'HOBBY',
		showForWindows: true,
		emoji: [{
			symbol: '\u26BD'
		}, {
			symbol: '\uD83C\uDFC0'
		}, {
			symbol: '\uD83C\uDFC8'
		}, {
			symbol: '\u26BE'
		}, {
			symbol: '\uD83E\uDD4E'
		}, {
			symbol: '\uD83C\uDFBE'
		}, {
			symbol: '\uD83C\uDFD0'
		}, {
			symbol: '\uD83C\uDFC9'
		}, {
			symbol: '\uD83E\uDD4F'
		}, {
			symbol: '\uD83C\uDFB1'
		}, {
			symbol: '\uD83C\uDFD3'
		}, {
			symbol: '\uD83C\uDFF8'
		}, {
			symbol: '\uD83C\uDFD2'
		}, {
			symbol: '\uD83C\uDFD1'
		}, {
			symbol: '\uD83E\uDD4D'
		}, {
			symbol: '\uD83C\uDFCF'
		}, {
			symbol: '\uD83E\uDD45'
		}, {
			symbol: '\u26F3'
		}, {
			symbol: '\uD83C\uDFF9'
		}, {
			symbol: '\uD83C\uDFA3'
		}, {
			symbol: '\uD83E\uDD4A'
		}, {
			symbol: '\uD83E\uDD4B'
		}, {
			symbol: '\uD83C\uDFBD'
		}, {
			symbol: '\uD83D\uDEF9'
		}, {
			symbol: '\uD83D\uDEF7'
		}, {
			symbol: '\u26F8\uFE0F'
		}, {
			symbol: '\uD83E\uDD4C'
		}, {
			symbol: '\uD83C\uDFBF'
		}, {
			symbol: '\u26F7\uFE0F'
		}, {
			symbol: '\uD83C\uDFC2'
		}, {
			symbol: '\uD83C\uDFCB\uFE0F'
		}, {
			symbol: '\uD83E\uDD3C'
		}, {
			symbol: '\uD83E\uDD38'
		}, {
			symbol: '\u26F9\uFE0F'
		}, {
			symbol: '\uD83E\uDD3A'
		}, {
			symbol: '\uD83E\uDD3E'
		}, {
			symbol: '\uD83C\uDFCC\uFE0F'
		}, {
			symbol: '\uD83C\uDFC7'
		}, {
			symbol: '\uD83E\uDDD8'
		}, {
			symbol: '\uD83C\uDFC4'
		}, {
			symbol: '\uD83C\uDFCA'
		}, {
			symbol: '\uD83E\uDD3D'
		}, {
			symbol: '\uD83D\uDEA3'
		}, {
			symbol: '\uD83E\uDDD7'
		}, {
			symbol: '\uD83D\uDEB5'
		}, {
			symbol: '\uD83D\uDEB4'
		}, {
			symbol: '\uD83C\uDFC6'
		}, {
			symbol: '\uD83E\uDD47'
		}, {
			symbol: '\uD83E\uDD48'
		}, {
			symbol: '\uD83E\uDD49'
		}, {
			symbol: '\uD83C\uDFC5'
		}, {
			symbol: '\uD83C\uDF96\uFE0F'
		}, {
			symbol: '\uD83C\uDFF5\uFE0F'
		}, {
			symbol: '\uD83C\uDF97\uFE0F'
		}, {
			symbol: '\uD83C\uDFAB'
		}, {
			symbol: '\uD83C\uDF9F\uFE0F'
		}, {
			symbol: '\uD83C\uDFAA'
		}, {
			symbol: '\uD83E\uDD39'
		}, {
			symbol: '\uD83C\uDFAD'
		}, {
			symbol: '\uD83C\uDFA8'
		}, {
			symbol: '\uD83C\uDFAC'
		}, {
			symbol: '\uD83C\uDFA4'
		}, {
			symbol: '\uD83C\uDFA7'
		}, {
			symbol: '\uD83C\uDFBC'
		}, {
			symbol: '\uD83C\uDFB9'
		}, {
			symbol: '\uD83E\uDD41'
		}, {
			symbol: '\uD83C\uDFB7'
		}, {
			symbol: '\uD83C\uDFBA'
		}, {
			symbol: '\uD83C\uDFB8'
		}, {
			symbol: '\uD83C\uDFBB'
		}, {
			symbol: '\uD83C\uDFB2'
		}, {
			symbol: '\u265F\uFE0F'
		}, {
			symbol: '\uD83C\uDFAF'
		}, {
			symbol: '\uD83C\uDFB3'
		}, {
			symbol: '\uD83C\uDFAE'
		}, {
			symbol: '\uD83C\uDFB0'
		}, {
			symbol: '\uD83E\uDDE9'
		}]
	}, {
		id: 5,
		code: 'TRAVEL',
		showForWindows: true,
		emoji: [{
			symbol: '\uD83D\uDE97'
		}, {
			symbol: '\uD83D\uDE95'
		}, {
			symbol: '\uD83D\uDE99'
		}, {
			symbol: '\uD83D\uDE8C'
		}, {
			symbol: '\uD83D\uDE8E'
		}, {
			symbol: '\uD83C\uDFCE\uFE0F'
		}, {
			symbol: '\uD83D\uDE93'
		}, {
			symbol: '\uD83D\uDE91'
		}, {
			symbol: '\uD83D\uDE92'
		}, {
			symbol: '\uD83D\uDE90'
		}, {
			symbol: '\uD83D\uDE9A'
		}, {
			symbol: '\uD83D\uDE9B'
		}, {
			symbol: '\uD83D\uDE9C'
		}, {
			symbol: '\uD83D\uDEF4'
		}, {
			symbol: '\uD83D\uDEB2'
		}, {
			symbol: '\uD83D\uDEF5'
		}, {
			symbol: '\uD83C\uDFCD\uFE0F'
		}, {
			symbol: '\uD83D\uDEA8'
		}, {
			symbol: '\uD83D\uDE94'
		}, {
			symbol: '\uD83D\uDE8D'
		}, {
			symbol: '\uD83D\uDE98'
		}, {
			symbol: '\uD83D\uDE96'
		}, {
			symbol: '\uD83D\uDEA1'
		}, {
			symbol: '\uD83D\uDEA0'
		}, {
			symbol: '\uD83D\uDE9F'
		}, {
			symbol: '\uD83D\uDE83'
		}, {
			symbol: '\uD83D\uDE8B'
		}, {
			symbol: '\uD83D\uDE9E'
		}, {
			symbol: '\uD83D\uDE9D'
		}, {
			symbol: '\uD83D\uDE84'
		}, {
			symbol: '\uD83D\uDE85'
		}, {
			symbol: '\uD83D\uDE88'
		}, {
			symbol: '\uD83D\uDE82'
		}, {
			symbol: '\uD83D\uDE86'
		}, {
			symbol: '\uD83D\uDE87'
		}, {
			symbol: '\uD83D\uDE8A'
		}, {
			symbol: '\uD83D\uDE89'
		}, {
			symbol: '\u2708\uFE0F'
		}, {
			symbol: '\uD83D\uDEEB'
		}, {
			symbol: '\uD83D\uDEEC'
		}, {
			symbol: '\uD83D\uDEE9\uFE0F'
		}, {
			symbol: '\uD83D\uDCBA'
		}, {
			symbol: '\uD83D\uDEF0\uFE0F'
		}, {
			symbol: '\uD83D\uDE80'
		}, {
			symbol: '\uD83D\uDEF8'
		}, {
			symbol: '\uD83D\uDE81'
		}, {
			symbol: '\uD83D\uDEF6'
		}, {
			symbol: '\u26F5'
		}, {
			symbol: '\uD83D\uDEA4'
		}, {
			symbol: '\uD83D\uDEE5\uFE0F'
		}, {
			symbol: '\uD83D\uDEF3\uFE0F'
		}, {
			symbol: '\u26F4\uFE0F'
		}, {
			symbol: '\uD83D\uDEA2'
		}, {
			symbol: '\u2693'
		}, {
			symbol: '\u26FD'
		}, {
			symbol: '\uD83D\uDEA7'
		}, {
			symbol: '\uD83D\uDEA6'
		}, {
			symbol: '\uD83D\uDEA5'
		}, {
			symbol: '\uD83D\uDE8F'
		}, {
			symbol: '\uD83D\uDDFA\uFE0F'
		}, {
			symbol: '\uD83D\uDDFF'
		}, {
			symbol: '\uD83D\uDDFD'
		}, {
			symbol: '\uD83D\uDDFC'
		}, {
			symbol: '\uD83C\uDFF0'
		}, {
			symbol: '\uD83C\uDFEF'
		}, {
			symbol: '\uD83C\uDFDF\uFE0F'
		}, {
			symbol: '\uD83C\uDFA1'
		}, {
			symbol: '\uD83C\uDFA2'
		}, {
			symbol: '\uD83C\uDFA0'
		}, {
			symbol: '\u26F2'
		}, {
			symbol: '\u26F1\uFE0F'
		}, {
			symbol: '\uD83C\uDFD6\uFE0F'
		}, {
			symbol: '\uD83C\uDFDD\uFE0F'
		}, {
			symbol: '\uD83C\uDFDC\uFE0F'
		}, {
			symbol: '\uD83C\uDF0B'
		}, {
			symbol: '\u26F0\uFE0F'
		}, {
			symbol: '\uD83C\uDFD4\uFE0F'
		}, {
			symbol: '\uD83D\uDDFB'
		}, {
			symbol: '\uD83C\uDFD5\uFE0F'
		}, {
			symbol: '\u26FA'
		}, {
			symbol: '\uD83C\uDFE0'
		}, {
			symbol: '\uD83C\uDFE1'
		}, {
			symbol: '\uD83C\uDFD8\uFE0F'
		}, {
			symbol: '\uD83C\uDFDA\uFE0F'
		}, {
			symbol: '\uD83C\uDFD7\uFE0F'
		}, {
			symbol: '\uD83C\uDFED'
		}, {
			symbol: '\uD83C\uDFE2'
		}, {
			symbol: '\uD83C\uDFEC'
		}, {
			symbol: '\uD83C\uDFE3'
		}, {
			symbol: '\uD83C\uDFE4'
		}, {
			symbol: '\uD83C\uDFE5'
		}, {
			symbol: '\uD83C\uDFE6'
		}, {
			symbol: '\uD83C\uDFE8'
		}, {
			symbol: '\uD83C\uDFEA'
		}, {
			symbol: '\uD83C\uDFEB'
		}, {
			symbol: '\uD83C\uDFE9'
		}, {
			symbol: '\uD83D\uDC92'
		}, {
			symbol: '\uD83C\uDFDB\uFE0F'
		}, {
			symbol: '\u26EA'
		}, {
			symbol: '\uD83D\uDD4C'
		}, {
			symbol: '\uD83D\uDD4D'
		}, {
			symbol: '\uD83D\uDD4B'
		}, {
			symbol: '\u26E9\uFE0F'
		}, {
			symbol: '\uD83D\uDEE4\uFE0F'
		}, {
			symbol: '\uD83D\uDEE3\uFE0F'
		}, {
			symbol: '\uD83D\uDDFE'
		}, {
			symbol: '\uD83C\uDF91'
		}, {
			symbol: '\uD83C\uDFDE\uFE0F'
		}, {
			symbol: '\uD83C\uDF05'
		}, {
			symbol: '\uD83C\uDF04'
		}, {
			symbol: '\uD83C\uDF20'
		}, {
			symbol: '\uD83C\uDF87'
		}, {
			symbol: '\uD83C\uDF86'
		}, {
			symbol: '\uD83C\uDF07'
		}, {
			symbol: '\uD83C\uDF06'
		}, {
			symbol: '\uD83C\uDFD9\uFE0F'
		}, {
			symbol: '\uD83C\uDF03'
		}, {
			symbol: '\uD83C\uDF0C'
		}, {
			symbol: '\uD83C\uDF09'
		}, {
			symbol: '\uD83C\uDF01'
		}]
	}, {
		id: 6,
		code: 'OBJECTS',
		showForWindows: true,
		emoji: [{
			symbol: '\u231A'
		}, {
			symbol: '\uD83D\uDCF1'
		}, {
			symbol: '\uD83D\uDCF2'
		}, {
			symbol: '\uD83D\uDCBB'
		}, {
			symbol: '\u2328\uFE0F'
		}, {
			symbol: '\uD83D\uDDA5\uFE0F'
		}, {
			symbol: '\uD83D\uDDA8\uFE0F'
		}, {
			symbol: '\uD83D\uDDB1\uFE0F'
		}, {
			symbol: '\uD83D\uDDB2\uFE0F'
		}, {
			symbol: '\uD83D\uDD79\uFE0F'
		}, {
			symbol: '\uD83D\uDDDC\uFE0F'
		}, {
			symbol: '\uD83D\uDCBD'
		}, {
			symbol: '\uD83D\uDCBE'
		}, {
			symbol: '\uD83D\uDCBF'
		}, {
			symbol: '\uD83D\uDCC0'
		}, {
			symbol: '\uD83D\uDCFC'
		}, {
			symbol: '\uD83D\uDCF7'
		}, {
			symbol: '\uD83D\uDCF8'
		}, {
			symbol: '\uD83D\uDCF9'
		}, {
			symbol: '\uD83C\uDFA5'
		}, {
			symbol: '\uD83D\uDCFD\uFE0F'
		}, {
			symbol: '\uD83C\uDF9E\uFE0F'
		}, {
			symbol: '\uD83D\uDCDE'
		}, {
			symbol: '\u260E\uFE0F'
		}, {
			symbol: '\uD83D\uDCDF'
		}, {
			symbol: '\uD83D\uDCE0'
		}, {
			symbol: '\uD83D\uDCFA'
		}, {
			symbol: '\uD83D\uDCFB'
		}, {
			symbol: '\uD83C\uDF99\uFE0F'
		}, {
			symbol: '\uD83C\uDF9A\uFE0F'
		}, {
			symbol: '\uD83C\uDF9B\uFE0F'
		}, {
			symbol: '\uD83E\uDDED'
		}, {
			symbol: '\u23F1\uFE0F'
		}, {
			symbol: '\u23F2\uFE0F'
		}, {
			symbol: '\u23F0'
		}, {
			symbol: '\uD83D\uDD70\uFE0F'
		}, {
			symbol: '\u231B'
		}, {
			symbol: '\u23F3'
		}, {
			symbol: '\uD83D\uDCE1'
		}, {
			symbol: '\uD83D\uDD0B'
		}, {
			symbol: '\uD83D\uDD0C'
		}, {
			symbol: '\uD83D\uDCA1'
		}, {
			symbol: '\uD83D\uDD26'
		}, {
			symbol: '\uD83D\uDD6F\uFE0F'
		}, {
			symbol: '\uD83E\uDDEF'
		}, {
			symbol: '\uD83D\uDEE2\uFE0F'
		}, {
			symbol: '\uD83D\uDCB8'
		}, {
			symbol: '\uD83D\uDCB5'
		}, {
			symbol: '\uD83D\uDCB4'
		}, {
			symbol: '\uD83D\uDCB6'
		}, {
			symbol: '\uD83D\uDCB7'
		}, {
			symbol: '\uD83D\uDCB0'
		}, {
			symbol: '\uD83D\uDCB3'
		}, {
			symbol: '\uD83D\uDC8E'
		}, {
			symbol: '\u2696\uFE0F'
		}, {
			symbol: '\uD83E\uDDF0'
		}, {
			symbol: '\uD83D\uDD27'
		}, {
			symbol: '\uD83D\uDD28'
		}, {
			symbol: '\u2692\uFE0F'
		}, {
			symbol: '\uD83D\uDEE0\uFE0F'
		}, {
			symbol: '\u26CF\uFE0F'
		}, {
			symbol: '\uD83D\uDD29'
		}, {
			symbol: '\u2699\uFE0F'
		}, {
			symbol: '\uD83E\uDDF1'
		}, {
			symbol: '\u26D3\uFE0F'
		}, {
			symbol: '\uD83E\uDDF2'
		}, {
			symbol: '\uD83D\uDD2B'
		}, {
			symbol: '\uD83D\uDCA3'
		}, {
			symbol: '\uD83E\uDDE8'
		}, {
			symbol: '\uD83D\uDD2A'
		}, {
			symbol: '\uD83D\uDDE1\uFE0F'
		}, {
			symbol: '\u2694\uFE0F'
		}, {
			symbol: '\uD83D\uDEE1\uFE0F'
		}, {
			symbol: '\uD83D\uDEAC'
		}, {
			symbol: '\u26B0\uFE0F'
		}, {
			symbol: '\u26B1\uFE0F'
		}, {
			symbol: '\uD83C\uDFFA'
		}, {
			symbol: '\uD83D\uDD2E'
		}, {
			symbol: '\uD83D\uDCFF'
		}, {
			symbol: '\uD83E\uDDFF'
		}, {
			symbol: '\uD83D\uDC88'
		}, {
			symbol: '\u2697\uFE0F'
		}, {
			symbol: '\uD83D\uDD2D'
		}, {
			symbol: '\uD83D\uDD2C'
		}, {
			symbol: '\uD83D\uDD73\uFE0F'
		}, {
			symbol: '\uD83D\uDC8A'
		}, {
			symbol: '\uD83D\uDC89'
		}, {
			symbol: '\uD83E\uDDEC'
		}, {
			symbol: '\uD83E\uDDA0'
		}, {
			symbol: '\uD83E\uDDEB'
		}, {
			symbol: '\uD83E\uDDEA'
		}, {
			symbol: '\uD83C\uDF21\uFE0F'
		}, {
			symbol: '\uD83E\uDDF9'
		}, {
			symbol: '\uD83E\uDDFA'
		}, {
			symbol: '\uD83E\uDDFB'
		}, {
			symbol: '\uD83D\uDEBD'
		}, {
			symbol: '\uD83D\uDEB0'
		}, {
			symbol: '\uD83D\uDEBF'
		}, {
			symbol: '\uD83D\uDEC1'
		}, {
			symbol: '\uD83D\uDEC0'
		}, {
			symbol: '\uD83E\uDDFC'
		}, {
			symbol: '\uD83E\uDDFD'
		}, {
			symbol: '\uD83E\uDDF4'
		}, {
			symbol: '\uD83D\uDECE\uFE0F'
		}, {
			symbol: '\uD83D\uDD11'
		}, {
			symbol: '\uD83D\uDDDD\uFE0F'
		}, {
			symbol: '\uD83D\uDEAA'
		}, {
			symbol: '\uD83D\uDECB\uFE0F'
		}, {
			symbol: '\uD83D\uDECF\uFE0F'
		}, {
			symbol: '\uD83D\uDECC'
		}, {
			symbol: '\uD83E\uDDF8'
		}, {
			symbol: '\uD83D\uDDBC\uFE0F'
		}, {
			symbol: '\uD83D\uDECD\uFE0F'
		}, {
			symbol: '\uD83D\uDED2'
		}, {
			symbol: '\uD83C\uDF81'
		}, {
			symbol: '\uD83C\uDF88'
		}, {
			symbol: '\uD83C\uDF8F'
		}, {
			symbol: '\uD83C\uDF80'
		}, {
			symbol: '\uD83C\uDF8A'
		}, {
			symbol: '\uD83C\uDF89'
		}, {
			symbol: '\uD83C\uDF8E'
		}, {
			symbol: '\uD83C\uDFEE'
		}, {
			symbol: '\uD83C\uDF90'
		}, {
			symbol: '\uD83E\uDDE7'
		}, {
			symbol: '\u2709\uFE0F'
		}, {
			symbol: '\uD83D\uDCE9'
		}, {
			symbol: '\uD83D\uDCE8'
		}, {
			symbol: '\uD83D\uDCE7'
		}, {
			symbol: '\uD83D\uDC8C'
		}, {
			symbol: '\uD83D\uDCE5'
		}, {
			symbol: '\uD83D\uDCE4'
		}, {
			symbol: '\uD83D\uDCE6'
		}, {
			symbol: '\uD83C\uDFF7\uFE0F'
		}, {
			symbol: '\uD83D\uDCEA'
		}, {
			symbol: '\uD83D\uDCEB'
		}, {
			symbol: '\uD83D\uDCEC'
		}, {
			symbol: '\uD83D\uDCED'
		}, {
			symbol: '\uD83D\uDCEE'
		}, {
			symbol: '\uD83D\uDCEF'
		}, {
			symbol: '\uD83D\uDCDC'
		}, {
			symbol: '\uD83D\uDCC3'
		}, {
			symbol: '\uD83D\uDCC4'
		}, {
			symbol: '\uD83D\uDCD1'
		}, {
			symbol: '\uD83E\uDDFE'
		}, {
			symbol: '\uD83D\uDCCA'
		}, {
			symbol: '\uD83D\uDCC8'
		}, {
			symbol: '\uD83D\uDCC9'
		}, {
			symbol: '\uD83D\uDDD2\uFE0F'
		}, {
			symbol: '\uD83D\uDDD3\uFE0F'
		}, {
			symbol: '\uD83D\uDCC6'
		}, {
			symbol: '\uD83D\uDCC5'
		}, {
			symbol: '\uD83D\uDDD1\uFE0F'
		}, {
			symbol: '\uD83D\uDCC7'
		}, {
			symbol: '\uD83D\uDDC3\uFE0F'
		}, {
			symbol: '\uD83D\uDDF3\uFE0F'
		}, {
			symbol: '\uD83D\uDDC4\uFE0F'
		}, {
			symbol: '\uD83D\uDCCB'
		}, {
			symbol: '\uD83D\uDCC1'
		}, {
			symbol: '\uD83D\uDCC2'
		}, {
			symbol: '\uD83D\uDDC2\uFE0F'
		}, {
			symbol: '\uD83D\uDDDE\uFE0F'
		}, {
			symbol: '\uD83D\uDCF0'
		}, {
			symbol: '\uD83D\uDCD3'
		}, {
			symbol: '\uD83D\uDCD4'
		}, {
			symbol: '\uD83D\uDCD2'
		}, {
			symbol: '\uD83D\uDCD5'
		}, {
			symbol: '\uD83D\uDCD7'
		}, {
			symbol: '\uD83D\uDCD8'
		}, {
			symbol: '\uD83D\uDCD9'
		}, {
			symbol: '\uD83D\uDCDA'
		}, {
			symbol: '\uD83D\uDCD6'
		}, {
			symbol: '\uD83D\uDD16'
		}, {
			symbol: '\uD83E\uDDF7'
		}, {
			symbol: '\uD83D\uDD17'
		}, {
			symbol: '\uD83D\uDCCE'
		}, {
			symbol: '\uD83D\uDD87\uFE0F'
		}, {
			symbol: '\uD83D\uDCD0'
		}, {
			symbol: '\uD83D\uDCCF'
		}, {
			symbol: '\uD83D\uDCCC'
		}, {
			symbol: '\uD83D\uDCCD'
		}, {
			symbol: '\u2702\uFE0F'
		}, {
			symbol: '\uD83D\uDD8A\uFE0F'
		}, {
			symbol: '\uD83D\uDD8B\uFE0F'
		}, {
			symbol: '\u2712\uFE0F'
		}, {
			symbol: '\uD83D\uDD8C\uFE0F'
		}, {
			symbol: '\uD83D\uDD8D\uFE0F'
		}, {
			symbol: '\uD83D\uDCDD'
		}, {
			symbol: '\u270F\uFE0F'
		}, {
			symbol: '\uD83D\uDD0D'
		}, {
			symbol: '\uD83D\uDD0E'
		}, {
			symbol: '\uD83D\uDD0F'
		}, {
			symbol: '\uD83D\uDD10'
		}, {
			symbol: '\uD83D\uDD12'
		}, {
			symbol: '\uD83D\uDD13'
		}]
	}, {
		id: 7,
		code: 'SYMBOLS',
		showForWindows: true,
		emoji: [{
			symbol: '\u2764\uFE0F'
		}, {
			symbol: '\uD83E\uDDE1'
		}, {
			symbol: '\uD83D\uDC9B'
		}, {
			symbol: '\uD83D\uDC9A'
		}, {
			symbol: '\uD83D\uDC99'
		}, {
			symbol: '\uD83D\uDC9C'
		}, {
			symbol: '\uD83D\uDDA4'
		}, {
			symbol: '\uD83D\uDC94'
		}, {
			symbol: '\u2763\uFE0F'
		}, {
			symbol: '\uD83D\uDC95'
		}, {
			symbol: '\uD83D\uDC9E'
		}, {
			symbol: '\uD83D\uDC93'
		}, {
			symbol: '\uD83D\uDC97'
		}, {
			symbol: '\uD83D\uDC96'
		}, {
			symbol: '\uD83D\uDC98'
		}, {
			symbol: '\uD83D\uDC9D'
		}, {
			symbol: '\uD83D\uDC9F'
		}, {
			symbol: '\u262E\uFE0F'
		}, {
			symbol: '\u271D\uFE0F'
		}, {
			symbol: '\u262A\uFE0F'
		}, {
			symbol: '\uD83D\uDD49\uFE0F'
		}, {
			symbol: '\u2638\uFE0F'
		}, {
			symbol: '\u2721\uFE0F'
		}, {
			symbol: '\uD83D\uDD2F'
		}, {
			symbol: '\uD83D\uDD4E'
		}, {
			symbol: '\u262F\uFE0F'
		}, {
			symbol: '\u2626\uFE0F'
		}, {
			symbol: '\uD83D\uDED0'
		}, {
			symbol: '\u26CE'
		}, {
			symbol: '\u2648'
		}, {
			symbol: '\u2649'
		}, {
			symbol: '\u264A'
		}, {
			symbol: '\u264B'
		}, {
			symbol: '\u264C'
		}, {
			symbol: '\u264D'
		}, {
			symbol: '\u264E'
		}, {
			symbol: '\u264F'
		}, {
			symbol: '\u2650'
		}, {
			symbol: '\u2651'
		}, {
			symbol: '\u2652'
		}, {
			symbol: '\u2653'
		}, {
			symbol: '\uD83C\uDD94'
		}, {
			symbol: '\u269B\uFE0F'
		}, {
			symbol: '\uD83C\uDE51'
		}, {
			symbol: '\u2622\uFE0F'
		}, {
			symbol: '\u2623\uFE0F'
		}, {
			symbol: '\uD83D\uDCF4'
		}, {
			symbol: '\uD83D\uDCF3'
		}, {
			symbol: '\uD83C\uDE36'
		}, {
			symbol: '\uD83C\uDE1A'
		}, {
			symbol: '\uD83C\uDE38'
		}, {
			symbol: '\uD83C\uDE3A'
		}, {
			symbol: '\uD83C\uDE37\uFE0F'
		}, {
			symbol: '\u2734\uFE0F'
		}, {
			symbol: '\uD83C\uDD9A'
		}, {
			symbol: '\uD83D\uDCAE'
		}, {
			symbol: '\uD83C\uDE50'
		}, {
			symbol: '\u3299\uFE0F'
		}, {
			symbol: '\u3297\uFE0F'
		}, {
			symbol: '\uD83C\uDE34'
		}, {
			symbol: '\uD83C\uDE35'
		}, {
			symbol: '\uD83C\uDE39'
		}, {
			symbol: '\uD83C\uDE32'
		}, {
			symbol: '\uD83C\uDD70\uFE0F'
		}, {
			symbol: '\uD83C\uDD71\uFE0F'
		}, {
			symbol: '\uD83C\uDD8E'
		}, {
			symbol: '\uD83C\uDD91'
		}, {
			symbol: '\uD83C\uDD7E\uFE0F'
		}, {
			symbol: '\uD83C\uDD98'
		}, {
			symbol: '\u274C'
		}, {
			symbol: '\u2B55'
		}, {
			symbol: '\uD83D\uDED1'
		}, {
			symbol: '\u26D4'
		}, {
			symbol: '\uD83D\uDCDB'
		}, {
			symbol: '\uD83D\uDEAB'
		}, {
			symbol: '\uD83D\uDCAF'
		}, {
			symbol: '\uD83D\uDCA2'
		}, {
			symbol: '\u2668\uFE0F'
		}, {
			symbol: '\uD83D\uDEB7'
		}, {
			symbol: '\uD83D\uDEAF'
		}, {
			symbol: '\uD83D\uDEB3'
		}, {
			symbol: '\uD83D\uDEB1'
		}, {
			symbol: '\uD83D\uDD1E'
		}, {
			symbol: '\uD83D\uDCF5'
		}, {
			symbol: '\uD83D\uDEAD'
		}, {
			symbol: '\u2757'
		}, {
			symbol: '\u2755'
		}, {
			symbol: '\u2753'
		}, {
			symbol: '\u2754'
		}, {
			symbol: '\u203C\uFE0F'
		}, {
			symbol: '\u2049\uFE0F'
		}, {
			symbol: '\uD83D\uDD05'
		}, {
			symbol: '\uD83D\uDD06'
		}, {
			symbol: '\u303D\uFE0F'
		}, {
			symbol: '\u26A0\uFE0F'
		}, {
			symbol: '\uD83D\uDEB8'
		}, {
			symbol: '\uD83D\uDD31'
		}, {
			symbol: '\u269C\uFE0F'
		}, {
			symbol: '\uD83D\uDD30'
		}, {
			symbol: '\u267B\uFE0F'
		}, {
			symbol: '\u2705'
		}, {
			symbol: '\uD83C\uDE2F'
		}, {
			symbol: '\uD83D\uDCB9'
		}, {
			symbol: '\u2747\uFE0F'
		}, {
			symbol: '\u2733\uFE0F'
		}, {
			symbol: '\u274E'
		}, {
			symbol: '\uD83C\uDF10'
		}, {
			symbol: '\uD83D\uDCA0'
		}, {
			symbol: '\u24C2\uFE0F'
		}, {
			symbol: '\uD83C\uDF00'
		}, {
			symbol: '\uD83D\uDCA4'
		}, {
			symbol: '\uD83C\uDFE7'
		}, {
			symbol: '\uD83D\uDEBE'
		}, {
			symbol: '\u267F'
		}, {
			symbol: '\uD83C\uDD7F\uFE0F'
		}, {
			symbol: '\uD83C\uDE33'
		}, {
			symbol: '\uD83C\uDE02\uFE0F'
		}, {
			symbol: '\uD83D\uDEC2'
		}, {
			symbol: '\uD83D\uDEC3'
		}, {
			symbol: '\uD83D\uDEC4'
		}, {
			symbol: '\uD83D\uDEC5'
		}, {
			symbol: '\uD83D\uDEB9'
		}, {
			symbol: '\uD83D\uDEBA'
		}, {
			symbol: '\uD83D\uDEBC'
		}, {
			symbol: '\uD83D\uDEBB'
		}, {
			symbol: '\uD83D\uDEAE'
		}, {
			symbol: '\uD83C\uDFA6'
		}, {
			symbol: '\uD83D\uDCF6'
		}, {
			symbol: '\uD83C\uDE01'
		}, {
			symbol: '\uD83D\uDD23'
		}, {
			symbol: '\u2139\uFE0F'
		}, {
			symbol: '\uD83D\uDD24'
		}, {
			symbol: '\uD83D\uDD21'
		}, {
			symbol: '\uD83D\uDD20'
		}, {
			symbol: '\uD83C\uDD96'
		}, {
			symbol: '\uD83C\uDD97'
		}, {
			symbol: '\uD83C\uDD99'
		}, {
			symbol: '\uD83C\uDD92'
		}, {
			symbol: '\uD83C\uDD95'
		}, {
			symbol: '\uD83C\uDD93'
		}, {
			symbol: '\u0030'
		}, {
			symbol: '\u0031'
		}, {
			symbol: '\u0032'
		}, {
			symbol: '\u0033'
		}, {
			symbol: '\u0034'
		}, {
			symbol: '\u0035'
		}, {
			symbol: '\u0036'
		}, {
			symbol: '\u0037'
		}, {
			symbol: '\u0038'
		}, {
			symbol: '\u0039'
		}, {
			symbol: '\uD83D\uDD1F'
		}, {
			symbol: '\uD83D\uDD22'
		}, {
			symbol: '\u0023'
		}, {
			symbol: '\u002A'
		}, {
			symbol: '\u23CF\uFE0F'
		}, {
			symbol: '\u25B6\uFE0F'
		}, {
			symbol: '\u23F8\uFE0F'
		}, {
			symbol: '\u23EF\uFE0F'
		}, {
			symbol: '\u23F9\uFE0F'
		}, {
			symbol: '\u23FA\uFE0F'
		}, {
			symbol: '\u23ED\uFE0F'
		}, {
			symbol: '\u23EE\uFE0F'
		}, {
			symbol: '\u23E9'
		}, {
			symbol: '\u23EA'
		}, {
			symbol: '\u23EB'
		}, {
			symbol: '\u23EC'
		}, {
			symbol: '\u25C0\uFE0F'
		}, {
			symbol: '\uD83D\uDD3C'
		}, {
			symbol: '\uD83D\uDD3D'
		}, {
			symbol: '\u27A1\uFE0F'
		}, {
			symbol: '\u2B05\uFE0F'
		}, {
			symbol: '\u2B06\uFE0F'
		}, {
			symbol: '\u2B07\uFE0F'
		}, {
			symbol: '\u2197\uFE0F'
		}, {
			symbol: '\u2198\uFE0F'
		}, {
			symbol: '\u2199\uFE0F'
		}, {
			symbol: '\u2196\uFE0F'
		}, {
			symbol: '\u2195\uFE0F'
		}, {
			symbol: '\u2194\uFE0F'
		}, {
			symbol: '\u21AA\uFE0F'
		}, {
			symbol: '\u21A9\uFE0F'
		}, {
			symbol: '\u2934\uFE0F'
		}, {
			symbol: '\u2935\uFE0F'
		}, {
			symbol: '\uD83D\uDD00'
		}, {
			symbol: '\uD83D\uDD01'
		}, {
			symbol: '\uD83D\uDD02'
		}, {
			symbol: '\uD83D\uDD04'
		}, {
			symbol: '\uD83D\uDD03'
		}, {
			symbol: '\uD83C\uDFB5'
		}, {
			symbol: '\uD83C\uDFB6'
		}, {
			symbol: '\u2795'
		}, {
			symbol: '\u2796'
		}, {
			symbol: '\u2797'
		}, {
			symbol: '\u2716\uFE0F'
		}, {
			symbol: '\u267E\uFE0F'
		}, {
			symbol: '\uD83D\uDCB2'
		}, {
			symbol: '\uD83D\uDCB1'
		}, {
			symbol: '\u2122\uFE0F'
		}, {
			symbol: '\u00A9\uFE0F'
		}, {
			symbol: '\u00AE\uFE0F'
		}, {
			symbol: '\uD83D\uDC41\uFE0F'
		}, {
			symbol: '\uD83D\uDDE8\uFE0F'
		}, {
			symbol: '\uD83D\uDD1A'
		}, {
			symbol: '\uD83D\uDD19'
		}, {
			symbol: '\uD83D\uDD1B'
		}, {
			symbol: '\uD83D\uDD1D'
		}, {
			symbol: '\uD83D\uDD1C'
		}, {
			symbol: '\u3030\uFE0F'
		}, {
			symbol: '\u27B0'
		}, {
			symbol: '\u27BF'
		}, {
			symbol: '\u2714\uFE0F'
		}, {
			symbol: '\u2611\uFE0F'
		}, {
			symbol: '\uD83D\uDD18'
		}, {
			symbol: '\u26AA'
		}, {
			symbol: '\u26AB'
		}, {
			symbol: '\uD83D\uDD34'
		}, {
			symbol: '\uD83D\uDD35'
		}, {
			symbol: '\uD83D\uDD3A'
		}, {
			symbol: '\uD83D\uDD3B'
		}, {
			symbol: '\uD83D\uDD38'
		}, {
			symbol: '\uD83D\uDD39'
		}, {
			symbol: '\uD83D\uDD36'
		}, {
			symbol: '\uD83D\uDD37'
		}, {
			symbol: '\uD83D\uDD33'
		}, {
			symbol: '\uD83D\uDD32'
		}, {
			symbol: '\u25AA\uFE0F'
		}, {
			symbol: '\u25AB\uFE0F'
		}, {
			symbol: '\u25FE'
		}, {
			symbol: '\u25FD'
		}, {
			symbol: '\u25FC\uFE0F'
		}, {
			symbol: '\u25FB\uFE0F'
		}, {
			symbol: '\u2B1B'
		}, {
			symbol: '\u2B1C'
		}, {
			symbol: '\uD83D\uDD08'
		}, {
			symbol: '\uD83D\uDD07'
		}, {
			symbol: '\uD83D\uDD09'
		}, {
			symbol: '\uD83D\uDD0A'
		}, {
			symbol: '\uD83D\uDD14'
		}, {
			symbol: '\uD83D\uDD15'
		}, {
			symbol: '\uD83D\uDCE3'
		}, {
			symbol: '\uD83D\uDCE2'
		}, {
			symbol: '\uD83D\uDCAC'
		}, {
			symbol: '\uD83D\uDCAD'
		}, {
			symbol: '\uD83D\uDDEF\uFE0F'
		}, {
			symbol: '\u2660\uFE0F'
		}, {
			symbol: '\u2663\uFE0F'
		}, {
			symbol: '\u2665\uFE0F'
		}, {
			symbol: '\u2666\uFE0F'
		}, {
			symbol: '\uD83C\uDCCF'
		}, {
			symbol: '\uD83C\uDFB4'
		}, {
			symbol: '\uD83C\uDC04'
		}, {
			symbol: '\uD83D\uDD50'
		}, {
			symbol: '\uD83D\uDD51'
		}, {
			symbol: '\uD83D\uDD52'
		}, {
			symbol: '\uD83D\uDD53'
		}, {
			symbol: '\uD83D\uDD54'
		}, {
			symbol: '\uD83D\uDD55'
		}, {
			symbol: '\uD83D\uDD56'
		}, {
			symbol: '\uD83D\uDD57'
		}, {
			symbol: '\uD83D\uDD58'
		}, {
			symbol: '\uD83D\uDD59'
		}, {
			symbol: '\uD83D\uDD5A'
		}, {
			symbol: '\uD83D\uDD5B'
		}, {
			symbol: '\uD83D\uDD5C'
		}, {
			symbol: '\uD83D\uDD5D'
		}, {
			symbol: '\uD83D\uDD5E'
		}, {
			symbol: '\uD83D\uDD5F'
		}, {
			symbol: '\uD83D\uDD60'
		}, {
			symbol: '\uD83D\uDD61'
		}, {
			symbol: '\uD83D\uDD62'
		}, {
			symbol: '\uD83D\uDD63'
		}, {
			symbol: '\uD83D\uDD64'
		}, {
			symbol: '\uD83D\uDD65'
		}, {
			symbol: '\uD83D\uDD66'
		}, {
			symbol: '\uD83D\uDD67'
		}]
	}, {
		id: 8,
		code: 'FLAGS',
		showForWindows: false,
		emoji: [{
			symbol: '\uD83C\uDFF3\uFE0F'
		}, {
			symbol: '\uD83C\uDFF4'
		}, {
			symbol: '\uD83C\uDFC1'
		}, {
			symbol: '\uD83D\uDEA9'
		}, {
			symbol: '\uD83C\uDFF3\uFE0F\u200D\uD83C\uDF08'
		}, {
			symbol: '\uD83C\uDDFA\uD83C\uDDF3'
		}, {
			symbol: '\uD83C\uDDE6\uD83C\uDDEB'
		}, {
			symbol: '\uD83C\uDDE6\uD83C\uDDFD'
		}, {
			symbol: '\uD83C\uDDE6\uD83C\uDDF1'
		}, {
			symbol: '\uD83C\uDDE9\uD83C\uDDFF'
		}, {
			symbol: '\uD83C\uDDE6\uD83C\uDDF8'
		}, {
			symbol: '\uD83C\uDDE6\uD83C\uDDE9'
		}, {
			symbol: '\uD83C\uDDE6\uD83C\uDDF4'
		}, {
			symbol: '\uD83C\uDDE6\uD83C\uDDEE'
		}, {
			symbol: '\uD83C\uDDE6\uD83C\uDDF6'
		}, {
			symbol: '\uD83C\uDDE6\uD83C\uDDEC'
		}, {
			symbol: '\uD83C\uDDE6\uD83C\uDDF7'
		}, {
			symbol: '\uD83C\uDDE6\uD83C\uDDF2'
		}, {
			symbol: '\uD83C\uDDE6\uD83C\uDDFC'
		}, {
			symbol: '\uD83C\uDDE6\uD83C\uDDFA'
		}, {
			symbol: '\uD83C\uDDE6\uD83C\uDDF9'
		}, {
			symbol: '\uD83C\uDDE6\uD83C\uDDFF'
		}, {
			symbol: '\uD83C\uDDE7\uD83C\uDDF8'
		}, {
			symbol: '\uD83C\uDDE7\uD83C\uDDED'
		}, {
			symbol: '\uD83C\uDDE7\uD83C\uDDE9'
		}, {
			symbol: '\uD83C\uDDE7\uD83C\uDDFE'
		}, {
			symbol: '\uD83C\uDDE7\uD83C\uDDEA'
		}, {
			symbol: '\uD83C\uDDE7\uD83C\uDDFF'
		}, {
			symbol: '\uD83C\uDDE7\uD83C\uDDEF'
		}, {
			symbol: '\uD83C\uDDE7\uD83C\uDDF2'
		}, {
			symbol: '\uD83C\uDDE7\uD83C\uDDF9'
		}, {
			symbol: '\uD83C\uDDE7\uD83C\uDDF4'
		}, {
			symbol: '\uD83C\uDDE7\uD83C\uDDE6'
		}, {
			symbol: '\uD83C\uDDE7\uD83C\uDDFC'
		}, {
			symbol: '\uD83C\uDDE7\uD83C\uDDF7'
		}, {
			symbol: '\uD83C\uDDEE\uD83C\uDDF4'
		}, {
			symbol: '\uD83C\uDDFB\uD83C\uDDEC'
		}, {
			symbol: '\uD83C\uDDE7\uD83C\uDDF3'
		}, {
			symbol: '\uD83C\uDDE7\uD83C\uDDEC'
		}, {
			symbol: '\uD83C\uDDE7\uD83C\uDDEB'
		}, {
			symbol: '\uD83C\uDDE7\uD83C\uDDEE'
		}, {
			symbol: '\uD83C\uDDF0\uD83C\uDDED'
		}, {
			symbol: '\uD83C\uDDE8\uD83C\uDDF2'
		}, {
			symbol: '\uD83C\uDDE8\uD83C\uDDE6'
		}, {
			symbol: '\uD83C\uDDEE\uD83C\uDDE8'
		}, {
			symbol: '\uD83C\uDDE8\uD83C\uDDFB'
		}, {
			symbol: '\uD83C\uDDE7\uD83C\uDDF6'
		}, {
			symbol: '\uD83C\uDDF0\uD83C\uDDFE'
		}, {
			symbol: '\uD83C\uDDE8\uD83C\uDDEB'
		}, {
			symbol: '\uD83C\uDDF9\uD83C\uDDE9'
		}, {
			symbol: '\uD83C\uDDE8\uD83C\uDDF1'
		}, {
			symbol: '\uD83C\uDDE8\uD83C\uDDF3'
		}, {
			symbol: '\uD83C\uDDE8\uD83C\uDDFD'
		}, {
			symbol: '\uD83C\uDDE8\uD83C\uDDF4'
		}, {
			symbol: '\uD83C\uDDF0\uD83C\uDDF2'
		}, {
			symbol: '\uD83C\uDDE8\uD83C\uDDEC'
		}, {
			symbol: '\uD83C\uDDE8\uD83C\uDDE9'
		}, {
			symbol: '\uD83C\uDDE8\uD83C\uDDF0'
		}, {
			symbol: '\uD83C\uDDE8\uD83C\uDDF7'
		}, {
			symbol: '\uD83C\uDDE8\uD83C\uDDEE'
		}, {
			symbol: '\uD83C\uDDED\uD83C\uDDF7'
		}, {
			symbol: '\uD83C\uDDE8\uD83C\uDDFA'
		}, {
			symbol: '\uD83C\uDDE8\uD83C\uDDFC'
		}, {
			symbol: '\uD83C\uDDE8\uD83C\uDDFE'
		}, {
			symbol: '\uD83C\uDDE8\uD83C\uDDFF'
		}, {
			symbol: '\uD83C\uDDE9\uD83C\uDDF0'
		}, {
			symbol: '\uD83C\uDDE9\uD83C\uDDEF'
		}, {
			symbol: '\uD83C\uDDE9\uD83C\uDDF2'
		}, {
			symbol: '\uD83C\uDDE9\uD83C\uDDF4'
		}, {
			symbol: '\uD83C\uDDEA\uD83C\uDDE8'
		}, {
			symbol: '\uD83C\uDDEA\uD83C\uDDEC'
		}, {
			symbol: '\uD83C\uDDF8\uD83C\uDDFB'
		}, {
			symbol: '\uD83C\uDDEC\uD83C\uDDF6'
		}, {
			symbol: '\uD83C\uDDEA\uD83C\uDDF7'
		}, {
			symbol: '\uD83C\uDDEA\uD83C\uDDF9'
		}, {
			symbol: '\uD83C\uDDEA\uD83C\uDDFA'
		}, {
			symbol: '\uD83C\uDDEB\uD83C\uDDF0'
		}, {
			symbol: '\uD83C\uDDEB\uD83C\uDDF4'
		}, {
			symbol: '\uD83C\uDDEB\uD83C\uDDEF'
		}, {
			symbol: '\uD83C\uDDEB\uD83C\uDDEE'
		}, {
			symbol: '\uD83C\uDDEB\uD83C\uDDF7'
		}, {
			symbol: '\uD83C\uDDEC\uD83C\uDDEB'
		}, {
			symbol: '\uD83C\uDDF5\uD83C\uDDEB'
		}, {
			symbol: '\uD83C\uDDEC\uD83C\uDDE6'
		}, {
			symbol: '\uD83C\uDDEC\uD83C\uDDF2'
		}, {
			symbol: '\uD83C\uDDEC\uD83C\uDDEA'
		}, {
			symbol: '\uD83C\uDDE9\uD83C\uDDEA'
		}, {
			symbol: '\uD83C\uDDEC\uD83C\uDDED'
		}, {
			symbol: '\uD83C\uDDEC\uD83C\uDDEE'
		}, {
			symbol: '\uD83C\uDDEC\uD83C\uDDF7'
		}, {
			symbol: '\uD83C\uDDEC\uD83C\uDDF1'
		}, {
			symbol: '\uD83C\uDDEC\uD83C\uDDE9'
		}, {
			symbol: '\uD83C\uDDEC\uD83C\uDDF5'
		}, {
			symbol: '\uD83C\uDDEC\uD83C\uDDFA'
		}, {
			symbol: '\uD83C\uDDEC\uD83C\uDDF9'
		}, {
			symbol: '\uD83C\uDDEC\uD83C\uDDF3'
		}, {
			symbol: '\uD83C\uDDEC\uD83C\uDDFC'
		}, {
			symbol: '\uD83C\uDDEC\uD83C\uDDFE'
		}, {
			symbol: '\uD83C\uDDED\uD83C\uDDF9'
		}, {
			symbol: '\uD83C\uDDED\uD83C\uDDF3'
		}, {
			symbol: '\uD83C\uDDED\uD83C\uDDF0'
		}, {
			symbol: '\uD83C\uDDED\uD83C\uDDFA'
		}, {
			symbol: '\uD83C\uDDEE\uD83C\uDDF8'
		}, {
			symbol: '\uD83C\uDDEE\uD83C\uDDF3'
		}, {
			symbol: '\uD83C\uDDEE\uD83C\uDDE9'
		}, {
			symbol: '\uD83C\uDDEE\uD83C\uDDF7'
		}, {
			symbol: '\uD83C\uDDEE\uD83C\uDDF6'
		}, {
			symbol: '\uD83C\uDDEE\uD83C\uDDEA'
		}, {
			symbol: '\uD83C\uDDEE\uD83C\uDDF2'
		}, {
			symbol: '\uD83C\uDDEE\uD83C\uDDF1'
		}, {
			symbol: '\uD83C\uDDEE\uD83C\uDDF9'
		}, {
			symbol: '\uD83C\uDDEF\uD83C\uDDF2'
		}, {
			symbol: '\uD83C\uDDEF\uD83C\uDDF5'
		}, {
			symbol: '\uD83C\uDDEF\uD83C\uDDEA'
		}, {
			symbol: '\uD83C\uDDEF\uD83C\uDDF4'
		}, {
			symbol: '\uD83C\uDDF0\uD83C\uDDFF'
		}, {
			symbol: '\uD83C\uDDF0\uD83C\uDDEA'
		}, {
			symbol: '\uD83C\uDDF0\uD83C\uDDEE'
		}, {
			symbol: '\uD83C\uDDFD\uD83C\uDDF0'
		}, {
			symbol: '\uD83C\uDDF0\uD83C\uDDFC'
		}, {
			symbol: '\uD83C\uDDF0\uD83C\uDDEC'
		}, {
			symbol: '\uD83C\uDDF1\uD83C\uDDE6'
		}, {
			symbol: '\uD83C\uDDF1\uD83C\uDDFB'
		}, {
			symbol: '\uD83C\uDDF1\uD83C\uDDE7'
		}, {
			symbol: '\uD83C\uDDF1\uD83C\uDDF8'
		}, {
			symbol: '\uD83C\uDDF1\uD83C\uDDF7'
		}, {
			symbol: '\uD83C\uDDF1\uD83C\uDDFE'
		}, {
			symbol: '\uD83C\uDDF1\uD83C\uDDEE'
		}, {
			symbol: '\uD83C\uDDF1\uD83C\uDDF9'
		}, {
			symbol: '\uD83C\uDDF1\uD83C\uDDFA'
		}, {
			symbol: '\uD83C\uDDF2\uD83C\uDDF4'
		}, {
			symbol: '\uD83C\uDDF2\uD83C\uDDF0'
		}, {
			symbol: '\uD83C\uDDF2\uD83C\uDDEC'
		}, {
			symbol: '\uD83C\uDDF2\uD83C\uDDFC'
		}, {
			symbol: '\uD83C\uDDF2\uD83C\uDDFE'
		}, {
			symbol: '\uD83C\uDDF2\uD83C\uDDFB'
		}, {
			symbol: '\uD83C\uDDF2\uD83C\uDDF1'
		}, {
			symbol: '\uD83C\uDDF2\uD83C\uDDF9'
		}, {
			symbol: '\uD83C\uDDF2\uD83C\uDDED'
		}, {
			symbol: '\uD83C\uDDF2\uD83C\uDDF7'
		}, {
			symbol: '\uD83C\uDDF2\uD83C\uDDFA'
		}, {
			symbol: '\uD83C\uDDFE\uD83C\uDDF9'
		}, {
			symbol: '\uD83C\uDDF2\uD83C\uDDFD'
		}, {
			symbol: '\uD83C\uDDEB\uD83C\uDDF2'
		}, {
			symbol: '\uD83C\uDDF2\uD83C\uDDE9'
		}, {
			symbol: '\uD83C\uDDF2\uD83C\uDDE8'
		}, {
			symbol: '\uD83C\uDDF2\uD83C\uDDF3'
		}, {
			symbol: '\uD83C\uDDF2\uD83C\uDDEA'
		}, {
			symbol: '\uD83C\uDDF2\uD83C\uDDF8'
		}, {
			symbol: '\uD83C\uDDF2\uD83C\uDDE6'
		}, {
			symbol: '\uD83C\uDDF2\uD83C\uDDFF'
		}, {
			symbol: '\uD83C\uDDF3\uD83C\uDDE6'
		}, {
			symbol: '\uD83C\uDDF3\uD83C\uDDF7'
		}, {
			symbol: '\uD83C\uDDF3\uD83C\uDDF5'
		}, {
			symbol: '\uD83C\uDDF3\uD83C\uDDF1'
		}, {
			symbol: '\uD83C\uDDF3\uD83C\uDDE8'
		}, {
			symbol: '\uD83C\uDDF3\uD83C\uDDFF'
		}, {
			symbol: '\uD83C\uDDF3\uD83C\uDDEE'
		}, {
			symbol: '\uD83C\uDDF3\uD83C\uDDEA'
		}, {
			symbol: '\uD83C\uDDF3\uD83C\uDDEC'
		}, {
			symbol: '\uD83C\uDDF3\uD83C\uDDFA'
		}, {
			symbol: '\uD83C\uDDF3\uD83C\uDDEB'
		}, {
			symbol: '\uD83C\uDDF0\uD83C\uDDF5'
		}, {
			symbol: '\uD83C\uDDF2\uD83C\uDDF5'
		}, {
			symbol: '\uD83C\uDDF3\uD83C\uDDF4'
		}, {
			symbol: '\uD83C\uDDF4\uD83C\uDDF2'
		}, {
			symbol: '\uD83C\uDDF5\uD83C\uDDF0'
		}, {
			symbol: '\uD83C\uDDF5\uD83C\uDDFC'
		}, {
			symbol: '\uD83C\uDDF5\uD83C\uDDF8'
		}, {
			symbol: '\uD83C\uDDF5\uD83C\uDDE6'
		}, {
			symbol: '\uD83C\uDDF5\uD83C\uDDEC'
		}, {
			symbol: '\uD83C\uDDF5\uD83C\uDDFE'
		}, {
			symbol: '\uD83C\uDDF5\uD83C\uDDEA'
		}, {
			symbol: '\uD83C\uDDF5\uD83C\uDDED'
		}, {
			symbol: '\uD83C\uDDF5\uD83C\uDDF3'
		}, {
			symbol: '\uD83C\uDDF5\uD83C\uDDF1'
		}, {
			symbol: '\uD83C\uDDF5\uD83C\uDDF9'
		}, {
			symbol: '\uD83C\uDDF5\uD83C\uDDF7'
		}, {
			symbol: '\uD83C\uDDF6\uD83C\uDDE6'
		}, {
			symbol: '\uD83C\uDDF7\uD83C\uDDF4'
		}, {
			symbol: '\uD83C\uDDF7\uD83C\uDDFA'
		}, {
			symbol: '\uD83C\uDDF7\uD83C\uDDFC'
		}, {
			symbol: '\uD83C\uDDFC\uD83C\uDDF8'
		}, {
			symbol: '\uD83C\uDDF8\uD83C\uDDF2'
		}, {
			symbol: '\uD83C\uDDF8\uD83C\uDDF9'
		}, {
			symbol: '\uD83C\uDDF8\uD83C\uDDE6'
		}, {
			symbol: '\uD83C\uDDF8\uD83C\uDDF3'
		}, {
			symbol: '\uD83C\uDDF7\uD83C\uDDF8'
		}, {
			symbol: '\uD83C\uDDF8\uD83C\uDDE8'
		}, {
			symbol: '\uD83C\uDDF8\uD83C\uDDF1'
		}, {
			symbol: '\uD83C\uDDF8\uD83C\uDDEC'
		}, {
			symbol: '\uD83C\uDDF8\uD83C\uDDFD'
		}, {
			symbol: '\uD83C\uDDF8\uD83C\uDDF0'
		}, {
			symbol: '\uD83C\uDDF8\uD83C\uDDEE'
		}, {
			symbol: '\uD83C\uDDEC\uD83C\uDDF8'
		}, {
			symbol: '\uD83C\uDDF8\uD83C\uDDE7'
		}, {
			symbol: '\uD83C\uDDF8\uD83C\uDDF4'
		}, {
			symbol: '\uD83C\uDDFF\uD83C\uDDE6'
		}, {
			symbol: '\uD83C\uDDF0\uD83C\uDDF7'
		}, {
			symbol: '\uD83C\uDDEA\uD83C\uDDF8'
		}, {
			symbol: '\uD83C\uDDF1\uD83C\uDDF0'
		}, {
			symbol: '\uD83C\uDDF8\uD83C\uDDED'
		}, {
			symbol: '\uD83C\uDDF0\uD83C\uDDF3'
		}, {
			symbol: '\uD83C\uDDF1\uD83C\uDDE8'
		}, {
			symbol: '\uD83C\uDDF5\uD83C\uDDF2'
		}, {
			symbol: '\uD83C\uDDFB\uD83C\uDDE8'
		}, {
			symbol: '\uD83C\uDDF8\uD83C\uDDE9'
		}, {
			symbol: '\uD83C\uDDF8\uD83C\uDDF7'
		}, {
			symbol: '\uD83C\uDDF8\uD83C\uDDFF'
		}, {
			symbol: '\uD83C\uDDF8\uD83C\uDDEA'
		}, {
			symbol: '\uD83C\uDDE8\uD83C\uDDED'
		}, {
			symbol: '\uD83C\uDDF8\uD83C\uDDFE'
		}, {
			symbol: '\uD83C\uDDF9\uD83C\uDDFC'
		}, {
			symbol: '\uD83C\uDDF9\uD83C\uDDEF'
		}, {
			symbol: '\uD83C\uDDF9\uD83C\uDDFF'
		}, {
			symbol: '\uD83C\uDDF9\uD83C\uDDED'
		}, {
			symbol: '\uD83C\uDDF9\uD83C\uDDF1'
		}, {
			symbol: '\uD83C\uDDF9\uD83C\uDDEC'
		}, {
			symbol: '\uD83C\uDDF9\uD83C\uDDF0'
		}, {
			symbol: '\uD83C\uDDF9\uD83C\uDDF4'
		}, {
			symbol: '\uD83C\uDDF9\uD83C\uDDF3'
		}, {
			symbol: '\uD83C\uDDF9\uD83C\uDDF7'
		}, {
			symbol: '\uD83C\uDDF9\uD83C\uDDF2'
		}, {
			symbol: '\uD83C\uDDF9\uD83C\uDDE8'
		}, {
			symbol: '\uD83C\uDDF9\uD83C\uDDFB'
		}, {
			symbol: '\uD83C\uDDFB\uD83C\uDDEE'
		}, {
			symbol: '\uD83C\uDDFA\uD83C\uDDEC'
		}, {
			symbol: '\uD83C\uDDFA\uD83C\uDDE6'
		}, {
			symbol: '\uD83C\uDDE6\uD83C\uDDEA'
		}, {
			symbol: '\uD83C\uDDEC\uD83C\uDDE7'
		}, {
			symbol: '\uD83C\uDDFA\uD83C\uDDF8'
		}, {
			symbol: '\uD83C\uDDFA\uD83C\uDDFE'
		}, {
			symbol: '\uD83C\uDDFA\uD83C\uDDFF'
		}, {
			symbol: '\uD83C\uDDFB\uD83C\uDDFA'
		}, {
			symbol: '\uD83C\uDDFB\uD83C\uDDE6'
		}, {
			symbol: '\uD83C\uDDFB\uD83C\uDDEA'
		}, {
			symbol: '\uD83C\uDDFB\uD83C\uDDF3'
		}, {
			symbol: '\uD83C\uDDFC\uD83C\uDDEB'
		}, {
			symbol: '\uD83C\uDDEA\uD83C\uDDED'
		}, {
			symbol: '\uD83C\uDDFE\uD83C\uDDEA'
		}, {
			symbol: '\uD83C\uDDFF\uD83C\uDDF2'
		}, {
			symbol: '\uD83C\uDDFF\uD83C\uDDFC'
		}]
	}];

	const emojiVariationSelector = '\uFE0F';
	const emojiPresentationCatalog = new Set(emoji.flatMap(category => category.emoji).map(item => item.symbol).filter(symbol => symbol.endsWith(emojiVariationSelector)));
	const toEmojiPresentation = symbol => {
		const emojiPresentationSymbol = `${symbol}${emojiVariationSelector}`;
		return emojiPresentationCatalog.has(emojiPresentationSymbol) ? emojiPresentationSymbol : symbol;
	};
	const normalizeRecentEmoji = storedEmoji => {
		const storedSymbols = [...storedEmoji];
		const normalizedSymbols = storedSymbols.map(symbol => toEmojiPresentation(symbol));
		const someSymbolRewritten = normalizedSymbols.some((symbol, index) => symbol !== storedSymbols[index]);
		const recentEmoji = new Set(normalizedSymbols);
		const duplicatesCollapsed = recentEmoji.size !== normalizedSymbols.length;
		return {
			recentEmoji,
			changed: someSymbolRewritten || duplicatesCollapsed
		};
	};

	const CELL_SELECTOR$2 = '.bx-im-emoji-content__box_category-emoji';
	const SECTION_SELECTOR = '.bx-im-emoji-content__box_category';
	// The popup lays its button panel over the bottom of the grid instead of shrinking it, so the visible
	// area of the scrollport is shorter than its box. The grid engine is shared with surfaces that have no
	// such panel, so the pair is handed to it rather than known by it.
	const BOTTOM_OVERLAY$1 = {
		within: '.bx-im-emote-popup__container',
		selector: '.bx-im-emote-popup__buttons-container'
	};
	// Fixed grid width: exactly eight cells per row, whatever the popup width (analogous to the four of
	// the sticker grid). The cells of the frequently-used block and of every category are chunked into
	// real role="row" rows of this size, the last row of each section as short as its remainder.
	const COLUMNS = 8;

	// @vue/component
	const TabEmoji = {
		name: 'TabEmoji',
		props: {
			dialogId: {
				type: String,
				required: true
			}
		},
		data() {
			return {
				excludedEmoji: new Set(),
				recentEmoji: new Set(),
				recentEmojiNeedsResave: false
			};
		},
		computed: {
			listAriaLabel() {
				return main_core.Loc.getMessage('IM_TEXTAREA_EMOJI_LIST_ARIA');
			},
			categoryTitles() {
				const categoryTitles = emoji.reduce((acc, category) => {
					const prefix = 'IM_TEXTAREA_EMOJI_CATEGORY_';
					const title = main_core.Loc.getMessage(`${prefix}${category.code}`);
					return {
						...acc,
						[category.code]: title
					};
				}, {});
				categoryTitles[this.frequentlyUsedLoc] = main_core.Loc.getMessage(this.frequentlyUsedLoc);
				return categoryTitles;
			},
			visibleEmoji() {
				return this.emoji.map(category => {
					return {
						...category,
						emoji: category.emoji.filter(element => !this.excludedEmoji.has(element.symbol))
					};
				});
			},
			visibleRecentEmoji() {
				const visibleEmoji = [...this.recentEmoji].filter(symbol => !this.excludedEmoji.has(symbol));
				return visibleEmoji.slice(0, this.maxRecentEmoji);
			},
			// Real rows of the grid: the cells of the frequently-used block chunked into role="row" rows of
			// eight, the last one as short as the remainder. The engine reads these rows; the column count
			// only sizes the chunk, the navigation itself is column-agnostic.
			recentRows() {
				const rows = [];
				for (let index = 0; index < this.visibleRecentEmoji.length; index += COLUMNS) {
					rows.push(this.visibleRecentEmoji.slice(index, index + COLUMNS));
				}
				return rows;
			},
			// The catalog carrying, per category, its cells chunked into rows of eight. A hidden category
			// keeps its place in the list but stays out of the grid: the template gives it neither a rowgroup
			// nor any row (an empty group with a dangling label is worse for a screen reader than none).
			catalogRows() {
				return this.visibleEmoji.map(category => {
					const rows = [];
					for (let index = 0; index < category.emoji.length; index += COLUMNS) {
						rows.push(category.emoji.slice(index, index + COLUMNS));
					}
					return {
						...category,
						rows
					};
				});
			}
		},
		created() {
			this.gridFocusZone = null;
			this.categoryTitleIdPrefix = `bx-im-emoji-category-${main_core.Text.getRandom(8)}`;
			const settings = main_core.Extension.getSettings('im.v2.component.textarea');
			const excludedEmoji = settings.get('emojiPickerExcluded');
			if (main_core.Type.isArray(excludedEmoji) && excludedEmoji.every(symbol => main_core.Type.isString(symbol))) {
				this.excludedEmoji = new Set(excludedEmoji);
			}
			const smileManager = im_v2_lib_smileManager.SmileManager.getInstance();
			if (!smileManager.recentEmoji) {
				return;
			}
			this.emojiSetTitle = 'emoji';
			this.emoji = emoji;
			const {
				recentEmoji,
				changed
			} = normalizeRecentEmoji(smileManager.recentEmoji);
			this.recentEmoji = recentEmoji;
			this.recentEmojiNeedsResave = changed;
			this.maxRecentEmoji = 18;
			this.frequentlyUsedLoc = 'IM_TEXTAREA_EMOJI_CATEGORY_FREQUENTLY';
		},
		mounted() {
			this.initGridFocusZone();
		},
		beforeUnmount() {
			this.destroyGridFocusZone();
			const smileManager = im_v2_lib_smileManager.SmileManager.getInstance();
			const hasNewEmoji = this.recentEmoji.size > smileManager.recentEmoji.size;
			if (this.recentEmojiNeedsResave || hasNewEmoji) {
				smileManager.updateRecentEmoji(new Set(this.recentEmoji));
			}
		},
		methods: {
			initGridFocusZone() {
				const container = this.$refs.grid;
				if (!container) {
					return;
				}

				// The zone object holds DOM nodes and must stay out of reactive state.
				this.gridFocusZone = ui_vue3.markRaw(new GridFocusZone(container, CELL_SELECTOR$2, {
					sectionSelector: SECTION_SELECTOR,
					bottomOverlay: BOTTOM_OVERLAY$1
				}));
				this.gridFocusZone.activate();
			},
			destroyGridFocusZone() {
				this.gridFocusZone?.deactivate();
				this.gridFocusZone = null;
			},
			isCategoryVisible(category) {
				return category.showForWindows ?? true;
			},
			getCategoryTitleId(categoryCode) {
				return `${this.categoryTitleIdPrefix}-${categoryCode}`;
			},
			insertInTextarea(emojiText) {
				this.getEmitter().emit(im_v2_const.EventType.textarea.insertText, {
					text: emojiText,
					dialogId: this.dialogId
				});
			},
			onRecentEmojiClick(emojiText) {
				this.insertInTextarea(emojiText);
			},
			onEmojiClick(emojiText) {
				this.insertInTextarea(emojiText);
				this.addEmojiToRecent(emojiText);
			},
			onRecentEmojiKeydown(event, emojiText) {
				this.onRecentEmojiClick(emojiText);
				this.keepFocusOnCell(event.currentTarget);
			},
			onEmojiKeydown(event, emojiText) {
				this.onEmojiClick(emojiText);
				this.keepFocusOnCell(event.currentTarget);
			},
			keepFocusOnCell(cell) {
				// The insert focuses the field itself (im.v2.lib.textarea), which would drop focus out of
				// the grid on the very first Enter. Mouse insertion keeps its old behavior.
				cell.focus({
					preventScroll: true
				});
			},
			addEmojiToRecent(symbol) {
				if (this.recentEmoji.size >= this.maxRecentEmoji) {
					return;
				}
				this.recentEmoji.add(symbol);
			},
			getEmitter() {
				return this.$Bitrix.eventEmitter;
			}
		},
		template: `
		<div class="bx-im-emoji-content__scope">
			<div
				ref="grid"
				class="bx-im-emoji-content__box"
				role="grid"
				:aria-label="listAriaLabel"
				data-testid="im-textarea-emoji-grid"
			>
				<div
					v-if="visibleRecentEmoji.length > 0"
					class="bx-im-emoji-content__box_category"
					role="rowgroup"
					:aria-labelledby="getCategoryTitleId(frequentlyUsedLoc)"
					key="frequently-used"
				>
					<div class="bx-im-emoji-content__box_category-header" role="row">
						<p
							class="bx-im-emoji-content__box_category-title"
							role="rowheader"
							:id="getCategoryTitleId(frequentlyUsedLoc)"
						>
							{{categoryTitles[frequentlyUsedLoc]}}
						</p>
					</div>
					<div
						v-for="(row, rowIndex) in recentRows"
						:key="rowIndex"
						class="bx-im-emoji-content__box_category-row"
						role="row"
					>
						<span
							v-for="symbol in row"
							class="bx-im-emoji-content__box_category-emoji --focus-visible"
							role="gridcell"
							tabindex="-1"
							:key="'recent-'+ symbol"
							@click="onRecentEmojiClick(symbol)"
							@keydown.enter.prevent="onRecentEmojiKeydown($event, symbol)"
							@keydown.space.prevent="onRecentEmojiKeydown($event, symbol)"
						>
							{{symbol}}
						</span>
					</div>
				</div>
				<div
					v-for="category in catalogRows"
					:key="category.id"
					class="bx-im-emoji-content__box_category"
					:role="isCategoryVisible(category) ? 'rowgroup' : null"
					:aria-labelledby="isCategoryVisible(category) ? getCategoryTitleId(category.code) : null"
				>
					<template v-if="isCategoryVisible(category)">
						<div class="bx-im-emoji-content__box_category-header" role="row">
							<p
								class="bx-im-emoji-content__box_category-title"
								role="rowheader"
								:id="getCategoryTitleId(category.code)"
							>
								{{categoryTitles[category.code]}}
							</p>
						</div>
						<div
							v-for="(row, rowIndex) in category.rows"
							:key="rowIndex"
							class="bx-im-emoji-content__box_category-row"
							role="row"
						>
							<span
								v-for="element in row"
								:key="element.symbol"
								class="bx-im-emoji-content__box_category-emoji --focus-visible"
								role="gridcell"
								tabindex="-1"
								@click="onEmojiClick(element.symbol)"
								@keydown.enter.prevent="onEmojiKeydown($event, element.symbol)"
								@keydown.space.prevent="onEmojiKeydown($event, element.symbol)"
							>
								{{element.symbol}}
							</span>
						</div>
					</template>
				</div>
			</div>
		</div>
	`
	};

	class ObserverManager extends main_core_events.EventEmitter {
		static events = {
			onChangeActivePack: 'onChangeActivePack'
		};
		#observer;
		#visiblePacks = new Map();
		constructor() {
			super();
			this.setEventNamespace('BX.Messenger.v2.Textarea.TabStickers');
			this.#initObserver();
		}
		observe(packElement) {
			this.#observer.observe(packElement);
		}
		unobserve(packElement) {
			this.#observer.unobserve(packElement);
			this.#visiblePacks.delete(packElement);
		}
		#initObserver() {
			this.#observer = new IntersectionObserver(entries => this.#handleIntersection(entries), {
				threshold: this.#getThreshold()
			});
		}
		#getThreshold() {
			const arrayWithZeros = Array.from({
				length: 11
			}).fill(0);
			return arrayWithZeros.map((zero, index) => index * 0.1);
		}
		#handleIntersection(entries) {
			entries.forEach(entry => {
				if (entry.isIntersecting) {
					if (!this.#visiblePacks.has(entry.target)) {
						this.#visiblePacks.set(entry.target, this.#getPackData(entry.target));
					}
				} else {
					this.#visiblePacks.delete(entry.target);
				}
			});
			if (this.#visiblePacks.size > 0) {
				this.#calculateActivePack();
			}
		}
		#calculateActivePack() {
			const visiblePacks = Array.from(this.#visiblePacks, ([element, packData]) => ({
				element,
				packData,
				top: element.getBoundingClientRect().top
			}));
			visiblePacks.sort((a, b) => a.top - b.top);
			const firstPack = visiblePacks[0];
			const lastPack = visiblePacks[visiblePacks.length - 1];
			const scrollContainer = lastPack.element.parentElement;
			const bestPack = this.#isAtBottom(scrollContainer) ? lastPack.packData : firstPack.packData;
			this.emit(ObserverManager.events.onChangeActivePack, {
				id: bestPack.id,
				type: bestPack.type
			});
		}
		#getPackData(element) {
			const {
				packId,
				packType
			} = element.dataset;
			return {
				id: Number(packId),
				type: packType
			};
		}
		#isAtBottom(scrollContainer) {
			const MIN_PACK_HEIGHT = 94; // pack 70px + pack header 24px

			const scrollPosition = Math.floor(scrollContainer.scrollHeight - scrollContainer.scrollTop);
			const containerHeight = scrollContainer.clientHeight + MIN_PACK_HEIGHT; // trigger at the bottom earlier

			return scrollPosition <= containerHeight;
		}
	}

	const ICON_SIZE$8 = 24;
	// The roving focus of the grid lands on the button inside a sticker cell, never on the gridcell around
	// it, so a return of focus has to name that button.
	const STICKER_BUTTON_SELECTOR = '.bx-im-sticker-item__button';

	// The menu hands focus back to the element it was opened from, but the grid around that element takes
	// the arrival for an entry from outside and sends it to its own entry cell instead (WCAG 2.4.3). So the
	// element takes focus back after the grid has had its say: this move starts inside the grid, and an
	// entry from inside is never redirected.
	function returnFocusInsideGrid(member) {
		// Only focus the closing menu left inside the grid is ours to move: focus an item of the menu has
		// taken somewhere of its own - the confirm dialog of a destructive item - stays where it is, the
		// same rule the selector follows when it closes.
		const grid = member?.closest('[role="grid"]');
		if (grid?.contains(document.activeElement) === true) {
			member.focus({
				preventScroll: true
			});
		}
	}

	// @vue/component
	const Pack = {
		name: 'StickerPack',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			StickerPackForm: im_v2_component_sticker.StickerPackForm,
			PackStickers: im_v2_component_sticker.PackStickers
		},
		inject: ['disableAutoHide', 'enableAutoHide'],
		props: {
			pack: {
				type: Object,
				required: true
			},
			dialogId: {
				type: String,
				required: true
			}
		},
		emits: ['close'],
		data() {
			return {
				showPackForm: false,
				isPackMenuOpen: false
			};
		},
		computed: {
			OutlineIcons: () => ui_iconSet_api_vue.Outline,
			Color: () => im_v2_const.Color,
			ICON_SIZE: () => ICON_SIZE$8,
			canShowContextMenu() {
				return this.packItem.type === im_v2_const.StickerPackType.custom || this.isRecentPack;
			},
			isRecentPack() {
				return im_v2_lib_sticker.StickerManager.isRecentPack(this.packItem);
			},
			packItem() {
				return this.pack;
			},
			packActionsLabel() {
				// A replacer function, not a string: a pack named with `$&` would otherwise rewrite its own
				// label instead of being put into it.
				return this.loc('IM_TEXTAREA_STICKER_PACK_ACTIONS_ARIA').replace('#NAME#', () => this.packItem.name);
			}
		},
		created() {
			// Random per-instance prefix: two popups open at once must not produce the same heading id.
			this.packTitleIdPrefix = `bx-im-sticker-pack-title-${main_core.Text.getRandom(8)}`;
		},
		methods: {
			onStickerClick({
				sticker
			}) {
				const draft = im_v2_lib_draft.DraftManager.getInstance().drafts[this.dialogId] ?? {};
				const isReplyWithMediaAvailable = im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isReplyWithMediaAvailable);
				const replyId = isReplyWithMediaAvailable && draft.panelType === im_v2_const.TextareaPanelType.reply ? draft.panelContext?.messageId : undefined;
				void im_v2_provider_service_sending.SendingService.getInstance().sendMessageWithSticker({
					dialogId: this.dialogId,
					stickerParams: {
						id: sticker.id,
						packId: sticker.packId,
						packType: sticker.packType
					},
					replyId
				});
				if (replyId > 0) {
					main_core_events.EventEmitter.emit(im_v2_const.EventType.textarea.closePanel, {
						dialogId: this.dialogId
					});
				}
				this.$emit('close');
			},
			openPackMenu(event) {
				main_popup.PopupManager.getPopupById(im_v2_const.PopupType.stickerContextMenu)?.close();
				main_popup.PopupManager.getPopupById(im_v2_const.PopupType.stickerPackContextMenu)?.close();
				if (!this.stickerPackMenu) {
					this.stickerPackMenu = new im_v2_lib_menu.StickerPackMenu();
					this.stickerPackMenu.subscribe(im_v2_lib_menu.BaseMenu.events.close, () => {
						this.isPackMenuOpen = false;
						if (!this.showPackForm) {
							this.enableAutoHide();
							this.returnFocusToPackActions();
						}
					});
					this.stickerPackMenu.subscribe(im_v2_lib_menu.StickerPackMenu.events.closeParentPopup, () => {
						this.$emit('close');
					});
					this.stickerPackMenu.subscribe(im_v2_lib_menu.StickerPackMenu.events.showPackForm, () => {
						this.showPackForm = true;
					});
				}
				this.disableAutoHide();
				this.isPackMenuOpen = true;

				// The button, not whatever node of the icon inside it a click landed on: the menu anchors its
				// popup on this element and hands the focus back to it.
				this.stickerPackMenu.openMenu({
					pack: this.packItem,
					isRecent: this.isRecentPack,
					dialogId: this.dialogId
				}, event.currentTarget);
			},
			// Shift+F10 and the context-menu key open the very menu a right click opens. No browser synthesizes
			// a contextmenu event out of Shift+F10, so without this the menu of a sticker has no keyboard path
			// at all; preventDefault stops the native menu - and, where the context-menu key does synthesize
			// contextmenu (chromium), stops the menu from opening twice.
			onStickerKeydown({
				event,
				sticker
			}) {
				if (!im_v2_lib_utils.Utils.key.isCombination(event, ['Shift+F10', 'ContextMenu'])) {
					return;
				}
				event.preventDefault();
				this.openStickerMenu({
					event,
					sticker
				});
			},
			openStickerMenu({
				event,
				sticker
			}) {
				main_popup.PopupManager.getPopupById(im_v2_const.PopupType.stickerContextMenu)?.close();
				if (!this.stickerMenu) {
					this.stickerMenu = new im_v2_lib_menu.StickerMenu();
					this.stickerMenu.subscribe(im_v2_lib_menu.StickerMenu.events.closeParentPopup, () => {
						this.$emit('close');
					});
					this.stickerMenu.subscribe(im_v2_lib_menu.BaseMenu.events.close, () => {
						this.enableAutoHide();
						this.returnFocusToStickerButton();
					});
				}
				this.disableAutoHide();

				// The button inside the cell, read while the event is still being dispatched - `currentTarget`
				// is null by the time the menu closes. The menu anchors its popup on this button and hands the
				// focus back to it; a menu bound to the gridcell instead would leave the focus on the body
				// whenever the close finds it outside the grid.
				this.stickerMenuButton = event.currentTarget.querySelector(STICKER_BUTTON_SELECTOR);
				this.stickerMenu.openMenu({
					sticker,
					isRecent: this.isRecentPack,
					dialogId: this.dialogId
				}, this.stickerMenuButton);
			},
			onStickerPackFormClose() {
				this.enableAutoHide();
				this.showPackForm = false;
			},
			returnFocusToPackActions() {
				returnFocusInsideGrid(this.$refs.packActions);
			},
			returnFocusToStickerButton() {
				returnFocusInsideGrid(this.stickerMenuButton);
			},
			getPackTitleId() {
				return `${this.packTitleIdPrefix}-${this.packItem.key}`;
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<div
			class="bx-im-sticker-pack__container"
			role="rowgroup"
			:aria-labelledby="getPackTitleId()"
		>
			<div class="bx-im-sticker-pack__header" role="row">
				<div class="bx-im-sticker-pack__header-cell" role="rowheader">
					<span
						class="bx-im-sticker-pack__header-title --ellipsis"
						:id="getPackTitleId()"
					>
						{{ packItem.name }}
					</span>
					<button
						v-if="canShowContextMenu"
						ref="packActions"
						type="button"
						class="bx-im-sticker-pack__header-actions --focus-visible"
						aria-haspopup="menu"
						:aria-expanded="isPackMenuOpen ? 'true' : 'false'"
						:aria-label="packActionsLabel"
						data-testid="im-textarea-sticker-pack-actions-btn"
						@click="openPackMenu"
						@keydown.enter.prevent="openPackMenu"
						@keydown.space.prevent="openPackMenu"
					>
						<BIcon
							:name="OutlineIcons.MORE_M"
							:size="ICON_SIZE"
							:color="Color.gray40"
							:hoverable="true"
							:aria-hidden="true"
						/>
					</button>
				</div>
			</div>
			<PackStickers 
				:pack="packItem"
				class="bx-im-sticker-pack__stickers"
				@clickSticker="onStickerClick"
				@stickerKeydown="onStickerKeydown"
				@openContextMenuSticker="openStickerMenu"
			/>
			<StickerPackForm v-if="showPackForm" :pack="packItem" @close="onStickerPackFormClose" />
		</div>
	`
	};

	const PACK_COUNT = 2;
	const STICKERS_IN_PACK = 8;

	// @vue/component
	const PackSkeleton = {
		name: 'PackSkeleton',
		components: {
			Shimmer: im_v2_component_elements_loader.Shimmer
		},
		computed: {
			STICKERS_IN_PACK: () => STICKERS_IN_PACK,
			PACK_COUNT: () => PACK_COUNT
		},
		template: `
		<div v-for="pack in PACK_COUNT" :key="pack" class="bx-im-sticker-pack-skeleton__container">
			<div class="bx-im-sticker-pack-skeleton__header">
				<Shimmer :width="280" :height="12" />
			</div>
			<div class="bx-im-sticker-pack-skeleton__stickers">
				<Shimmer v-for="sticker in STICKERS_IN_PACK" :key="sticker" :width="62" :height="62" />
			</div>
		</div>
	`
	};

	const ICON_SIZE$7 = 32;

	// @vue/component
	const HeaderAddButton = {
		name: 'HeaderAddButton',
		components: {
			IconButton: im_v2_component_elements_iconButton.IconButton,
			StickerPackForm: im_v2_component_sticker.StickerPackForm
		},
		inject: ['disableAutoHide', 'enableAutoHide'],
		props: {
			dialogId: {
				type: String,
				required: true
			}
		},
		data() {
			return {
				showPackForm: false
			};
		},
		computed: {
			OutlineIcons: () => ui_iconSet_api_vue.Outline,
			ICON_SIZE: () => ICON_SIZE$7
		},
		methods: {
			onAddClick() {
				this.disableAutoHide();
				this.showPackForm = true;
				im_v2_lib_analytics.Analytics.getInstance().stickers.onShowCreateForm(this.dialogId);
			},
			onPackFormClose() {
				this.enableAutoHide();
				this.showPackForm = false;
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<div class="bx-im-stickers-header-add-button__container" role="presentation">
			<IconButton
				:iconName="OutlineIcons.PLUS_S"
				:label="loc('IM_TEXTAREA_STICKER_SELECTOR_CREATE_PACK_ARIA')"
				:iconSize="ICON_SIZE"
				aria-haspopup="dialog"
				data-testid="im-textarea-sticker-pack-create-btn"
				@click="onAddClick"
			/>
			<StickerPackForm v-if="showPackForm" @close="onPackFormClose" />
		</div>
	`
	};

	const INITIAL_OFFSET = 12;
	const ADD_BUTTON_WIDTH = 40;
	const PACK_ITEM_WIDTH = 36;
	const PACK_ITEM_GAP = 10;

	// @vue/component
	const HeaderHighlight = {
		name: 'HeaderHighlight',
		props: {
			activeIndex: {
				type: Number,
				required: true
			}
		},
		computed: {
			needAddButton() {
				return im_v2_lib_permission.PermissionManager.getInstance().canPerformActionByUserType(im_v2_const.ActionByUserType.createStickerPack);
			},
			offsetLeft() {
				const addButtonOffset = this.needAddButton ? ADD_BUTTON_WIDTH : 0;
				const elementIndex = Math.max(0, this.activeIndex);
				const itemWidth = PACK_ITEM_WIDTH + PACK_ITEM_GAP;
				return INITIAL_OFFSET + addButtonOffset + itemWidth * elementIndex;
			},
			highlightStyles() {
				return {
					left: `${this.offsetLeft}px`
				};
			}
		},
		template: `
		<div class="bx-im-sticker-header-highlight__container" :style="highlightStyles">
			<div class="bx-im-sticker-header-highlight__marker"></div>
		</div>
	`
	};

	// @vue/component
	const HeaderItem = {
		name: 'HeaderItem',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		props: {
			pack: {
				type: Object,
				required: true
			},
			isActive: {
				type: Boolean,
				required: true
			}
		},
		computed: {
			OutlineIcons: () => ui_iconSet_api_vue.Outline,
			packItem() {
				return this.pack;
			},
			isRecentPack() {
				return im_v2_lib_sticker.StickerManager.isRecentPack(this.packItem);
			},
			packName() {
				return this.packItem.name;
			},
			packCover() {
				return this.$store.getters['stickers/getPackCover']({
					id: this.packItem.id,
					type: this.packItem.type
				});
			}
		},
		template: `
		<button
			type="button"
			tabindex="-1"
			:title="packName"
			:aria-label="packName"
			:aria-current="isActive ? 'true' : null"
			:class="{'--active': this.isActive}"
			class="bx-im-stickers-header__item --focus-visible"
		>
			<BIcon
				v-if="isRecentPack"
				:name="OutlineIcons.CLOCK"
				:aria-hidden="true"
			/>
			<BIcon
				v-else-if="!packCover"
				:name="OutlineIcons.STICKER"
				:aria-hidden="true"
			/>
			<img v-else :src="packCover" alt="" loading="lazy" draggable="false" />
		</button>
	`
	};

	const STICKERS_COUNT = 7;

	// @vue/component
	const HeaderSkeleton = {
		name: 'HeaderSkeleton',
		components: {
			Shimmer: im_v2_component_elements_loader.Shimmer
		},
		computed: {
			STICKERS_COUNT: () => STICKERS_COUNT
		},
		template: `
		<div class="bx-im-stickers-header-skeleton__container">
			<Shimmer v-for="sticker in STICKERS_COUNT" :key="sticker" :width="36" :height="36" />
		</div>
	`
	};

	const SCROLL_LOADING_OFFSET = 200;
	const TAB_SELECTOR$1 = '.bx-im-stickers-header__item';
	// A toolbar of pack shortcuts laid out in a row: arrows along it, Home/End to its ends. The
	// create-pack button shares the container but is not one of the pack buttons, so it keeps its own
	// place in the tab order.
	const TABS_BIND_KEYS = ui_a11y.FocusKeys.ArrowHorizontal | ui_a11y.FocusKeys.HomeAndEnd;

	// The tab that follows this one in the ribbon, without listing the ribbon: the tabs are siblings, and
	// what comes after the last of them is the highlight and the skeleton, never another tab.
	function nextTab(tab) {
		let sibling = tab.nextElementSibling;
		while (sibling !== null && !sibling.matches(TAB_SELECTOR$1)) {
			sibling = sibling.nextElementSibling;
		}
		return sibling;
	}

	// @vue/component
	const HeaderTabs = {
		name: 'HeaderTabs',
		components: {
			HeaderItem,
			HeaderSkeleton,
			HeaderAddButton,
			HeaderHighlight
		},
		directives: {
			horizontalScroll: im_v2_lib_directives.horizontalScroll
		},
		props: {
			dialogId: {
				type: String,
				required: true
			},
			packs: {
				type: Array,
				required: true
			},
			activePack: {
				type: Object,
				required: true
			},
			isLoadingFirstPage: {
				type: Boolean,
				required: true
			},
			isLoadingNextPage: {
				type: Boolean,
				required: true
			},
			// Asked, not mirrored: the sticker service is a singleton shared with every other surface that pages
			// it, so a copy of the answer kept here would go stale behind this component's back.
			hasMorePages: {
				type: Function,
				required: true
			}
		},
		emits: ['changeActivePack', 'scrollNextPage'],
		computed: {
			isLoading() {
				return this.isLoadingFirstPage || this.isLoadingNextPage;
			},
			activePackIndex() {
				return this.packs.findIndex(pack => pack.id === this.activePack.id && pack.type === this.activePack.type);
			},
			needAddButton() {
				return im_v2_lib_permission.PermissionManager.getInstance().canPerformActionByUserType(im_v2_const.ActionByUserType.createStickerPack);
			}
		},
		watch: {
			activePackIndex(newIndex) {
				void this.$nextTick(() => {
					this.scrollToActiveTab(newIndex);
				});
			}
		},
		created() {
			this.tabsFocusZone = null;
			this.cancelFocusZoneActivation = null;
		},
		mounted() {
			this.initTabsFocusZone();
		},
		beforeUnmount() {
			this.destroyTabsFocusZone();
		},
		methods: {
			initTabsFocusZone() {
				const container = this.$refs.tabs;
				if (!container) {
					return;
				}

				// The zone object holds DOM nodes and must stay out of reactive state.
				this.tabsFocusZone = ui_vue3.markRaw(im_v2_lib_a11y.createListFocusZone(container, {
					bindKeys: TABS_BIND_KEYS,
					focusableElementFilter: element => element.matches(TAB_SELECTOR$1)
				}));
				// Tabs of the pack saved in local storage mount while the popup is still fading in, and the
				// packs themselves arrive later - the zone picks them up by watching the markup.
				this.cancelFocusZoneActivation = activateWhenVisible(this.tabsFocusZone, container);
			},
			destroyTabsFocusZone() {
				this.cancelFocusZoneActivation?.();
				this.cancelFocusZoneActivation = null;
				this.tabsFocusZone?.deactivate();
				this.tabsFocusZone = null;
			},
			async onScrollHeader(event) {
				const container = event.target;
				if (this.isLoading || !this.needToLoad(container, SCROLL_LOADING_OFFSET)) {
					return;
				}
				this.$emit('scrollNextPage');
			},
			onTabsFocusIn(event) {
				const target = event.target;
				if (!(target instanceof HTMLElement) || !target.matches(TAB_SELECTOR$1)) {
					return;
				}

				// A ribbon that fits without a scrollbar fires no scroll event, so the keyboard could never
				// reach the next page: landing on the last tab loads it explicitly, under the same guards as the
				// scroll path - no parallel load, and something left to load. Without the second one every
				// arrow key on the last tab would raise the loading flag and flip aria-busy for a request the
				// service short-circuits anyway.
				const isLastTab = nextTab(target) === null;
				if (isLastTab && !this.isLoading && this.hasMorePages()) {
					this.$emit('scrollNextPage');
				}
			},
			needToLoad(container, offset) {
				const remaining = container.scrollHeight - container.scrollTop - container.clientHeight;
				return remaining <= offset;
			},
			isPackActive(pack) {
				return pack.id === this.activePack.id && pack.type === this.activePack.type;
			},
			onHeaderPick(pack) {
				this.$emit('changeActivePack', {
					id: pack.id,
					type: pack.type
				});
			},
			scrollToActiveTab(index) {
				const packIndex = this.needAddButton ? index + 1 : index; // +1 to skip add button
				const pack = this.$refs.tabs.children[packIndex];
				pack.scrollIntoView({
					inline: 'center',
					block: 'nearest',
					behavior: 'smooth'
				});
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<div
			v-horizontal-scroll
			class="bx-im-sticker-header-tabs__container --hidden-scroll"
			role="toolbar"
			aria-orientation="horizontal"
			:aria-label="loc('IM_TEXTAREA_STICKER_PACKS_TABS_ARIA')"
			:aria-busy="isLoading"
			data-testid="im-textarea-sticker-packs-tabs"
			@scroll="onScrollHeader"
			@focusin="onTabsFocusIn"
			ref="tabs"
		>
			<HeaderAddButton
				v-if="needAddButton"
				:dialogId="dialogId"
				class="bx-im-sticker-header-tabs__add-button"
			/>
			<template v-if="!isLoadingFirstPage">
				<HeaderItem
					v-for="pack in packs"
					:key="pack.key"
					:pack="pack"
					:isActive="isPackActive(pack)"
					class="bx-im-sticker-header-tabs__item"
					:data-testid="'im-textarea-sticker-pack-tab-' + pack.type + '-' + pack.id"
					@click="onHeaderPick(pack)"
				/>
				<HeaderHighlight aria-hidden="true" :activeIndex="activePackIndex"/>
			</template>
			<HeaderSkeleton v-if="isLoading" aria-hidden="true" />
		</div>
	`
	};

	const SCROLL_LOAD_BODY_OFFSET = 500;
	// Roving focus lands on the native button inside a gridcell, so the grid tracks buttons, not wrappers.
	const CELL_SELECTOR$1 = '.bx-im-sticker-item__button';
	// The add-sticker button of an editable pack and the ... actions button of a pack header are members of
	// the same grid: arrows reach them, they get no Tab stop of their own.
	const ADD_BUTTON_SELECTOR = '.bx-im-stickers-add-sticker-button__container';
	const PACK_ACTIONS_SELECTOR = '.bx-im-sticker-pack__header-actions';
	const GRID_CELL_SELECTOR = `${CELL_SELECTOR$1}, ${ADD_BUTTON_SELECTOR}, ${PACK_ACTIONS_SELECTOR}`;
	const PACK_SELECTOR = '.bx-im-sticker-pack__container';
	// The popup lays its button panel over the bottom of the grid instead of shrinking it, so the visible
	// area of the scrollport is shorter than its box. The shared grid engine has to be told about it.
	const BOTTOM_OVERLAY = {
		within: '.bx-im-emote-popup__container',
		selector: '.bx-im-emote-popup__buttons-container'
	};

	// @vue/component
	const TabStickers = {
		name: 'TabStickers',
		components: {
			Pack,
			PackSkeleton,
			HeaderTabs,
			Spinner: im_v2_component_elements_loader.Spinner,
			StickerPackForm: im_v2_component_sticker.StickerPackForm
		},
		directives: {
			'pack-observer': {
				mounted(element, binding) {
					binding.instance.observer.observe(element);
				},
				beforeUnmount(element, binding) {
					binding.instance.observer.unobserve(element);
				}
			}
		},
		inject: ['disableAutoHide', 'enableAutoHide'],
		provide() {
			return {
				// Only this tab lays the shared sticker grid out as a real grid, so only here does a cell need a
				// name. Replacer functions, not strings: a pack named with `$&` would otherwise rewrite the label
				// instead of being put into it.
				buildStickerLabel: (packName, position) => {
					return this.loc('IM_TEXTAREA_STICKER_ITEM_ARIA').replace('#PACK_NAME#', () => packName).replace('#NUMBER#', () => position);
				}
			};
		},
		props: {
			dialogId: {
				type: String,
				required: true
			}
		},
		emits: ['close'],
		data() {
			return {
				activePack: {
					id: null,
					type: null
				},
				isLoadingFirstPage: true,
				isLoadingNextPage: false,
				showSlider: false
			};
		},
		computed: {
			SpinnerColor: () => im_v2_component_elements_loader.SpinnerColor,
			SpinnerSize: () => im_v2_component_elements_loader.SpinnerSize,
			isLoading() {
				return this.isLoadingFirstPage || this.isLoadingNextPage;
			},
			recentPack() {
				return im_v2_lib_sticker.StickerManager.getRecentPack();
			},
			packs() {
				const packs = this.$store.getters['stickers/packs/get'];
				if (this.hasRecentStickers) {
					return [this.recentPack, ...packs];
				}
				return packs;
			},
			hasRecentStickers() {
				return this.$store.getters['stickers/recent/get'].length > 0;
			}
		},
		async created() {
			this.gridFocusZone = null;
			this.initObserverManager();
			this.stickerService = im_v2_provider_service_sticker.StickerService.getInstance();
			await this.stickerService.initFirstPage();
			this.isLoadingFirstPage = false;
			await this.$nextTick();
			this.setInitialEntryPoint();
		},
		mounted() {
			this.initGridFocusZone();
		},
		beforeUnmount() {
			this.destroyGridFocusZone();
		},
		methods: {
			initGridFocusZone() {
				const container = this.$refs.packListContainer;
				if (!container) {
					return;
				}

				// The zone holds DOM nodes and must stay out of reactive state. Packs arriving after the mount
				// are picked up by the zone and its geometry cache on their own.
				this.gridFocusZone = ui_vue3.markRaw(new GridFocusZone(container, GRID_CELL_SELECTOR, {
					sectionSelector: PACK_SELECTOR,
					bottomOverlay: BOTTOM_OVERLAY,
					withEntryPointControl: true,
					onLastRowFocus: () => this.loadNextPageOnEdge()
				}));
				this.gridFocusZone.activate();
			},
			destroyGridFocusZone() {
				this.gridFocusZone?.deactivate();
				this.gridFocusZone = null;
			},
			initObserverManager() {
				this.observer = new ObserverManager();
				this.observer.subscribe(ObserverManager.events.onChangeActivePack, event => {
					const {
						id,
						type
					} = event.getData();
					this.activePack = {
						id,
						type
					};
				});
			},
			// The grid must be entered on a sticker, not on the ... of a pack header or the "+ sticker" cell
			// that also belong to it: CELL_SELECTOR matches sticker buttons alone, and the recent pack leads
			// the list, so the first match is the first recent sticker whenever there is one.
			setInitialEntryPoint() {
				const firstSticker = this.$refs.packListContainer?.querySelector(CELL_SELECTOR$1);
				if (firstSticker) {
					this.gridFocusZone?.setEntryPoint(firstSticker);
				}
			},
			// Picking a tab of the header is the only explicit move to a pack: the active pack of the header
			// itself is also written back by the scroll observer, and that must leave the grid alone.
			scrollToPack({
				id,
				type
			}) {
				const packElement = this.$refs.packListContainer.querySelector(`[data-pack-type="${type}"][data-pack-id="${id}"]`);
				if (!packElement) {
					return;
				}
				if (packElement.scrollIntoView) {
					packElement.scrollIntoView({
						block: 'start',
						behavior: 'smooth'
					});
				}

				// An empty pack has no cell to enter, so the grid keeps the one it remembers.
				const firstCell = packElement.querySelector(CELL_SELECTOR$1);
				if (firstCell) {
					this.gridFocusZone?.setEntryPoint(firstCell);
				}
			},
			needToLoad(container, offset) {
				const remaining = container.scrollHeight - container.scrollTop - container.clientHeight;
				return remaining <= offset;
			},
			closeContextMenus() {
				main_popup.PopupManager.getPopupById(im_v2_const.PopupType.stickerContextMenu)?.close();
				main_popup.PopupManager.getPopupById(im_v2_const.PopupType.stickerPackContextMenu)?.close();
			},
			// The flag is lowered in finally: a rejected page request must not leave the grid aria-busy and
			// both keyboard edges dead until the popup is reopened.
			async loadNextPage() {
				this.isLoadingNextPage = true;
				try {
					await this.stickerService.loadNextPage();
				} finally {
					this.isLoadingNextPage = false;
				}
			},
			// The service short-circuits a page request once the last page is in, but the wrapper does not: it
			// would still raise the loading flag and flip aria-busy for a request that never happens, and that
			// markup change drops the row cache of the grid right at the bottom edge. So the edge asks first.
			hasMorePages() {
				return this.stickerService.hasMorePages();
			},
			// The keyboard can reach the last row while the grid still fits without a scrollbar, so no scroll
			// event ever asks for more: the grid signals the edge on focus and the next page is loaded here,
			// under the same guards as the scroll path minus its distance-to-the-end check.
			loadNextPageOnEdge() {
				if (this.isLoading || !this.hasMorePages()) {
					return;
				}
				void this.loadNextPage();
			},
			async onScrollBody(event) {
				this.closeContextMenus();
				const container = event.target;
				if (this.isLoading || !this.needToLoad(container, SCROLL_LOAD_BODY_OFFSET)) {
					return;
				}
				void this.loadNextPage();
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<div class="bx-im-emote-selector-tab-stickers__container">
			<HeaderTabs
				:dialogId="dialogId"
				:isLoadingFirstPage="isLoadingFirstPage"
				:isLoadingNextPage="isLoadingNextPage"
				:hasMorePages="hasMorePages"
				:packs="packs"
				:activePack="activePack"
				@changeActivePack="scrollToPack"
				@scrollNextPage="loadNextPage"
			/>
			<div
				class="bx-im-emote-selector-tab-stickers__packs-container"
				ref="packListContainer"
				role="grid"
				:aria-label="loc('IM_TEXTAREA_STICKER_LIST_ARIA')"
				:aria-busy="isLoading"
				data-testid="im-textarea-sticker-grid"
				@scroll="onScrollBody"
			>
				<div v-if="isLoadingFirstPage" aria-hidden="true">
					<PackSkeleton />
				</div>
				<template v-else>
					<Pack
						v-for="pack in packs"
						v-pack-observer
						:dialogId="dialogId"
						:key="pack.key"
						:pack="pack"
						:data-pack-id="pack.id"
						:data-pack-type="pack.type"
						:data-testid="'im-textarea-sticker-pack-' + pack.type + '-' + pack.id"
						@close="$emit('close')"
					/>
				</template>
				<Spinner
					v-if="isLoadingNextPage"
					:size="SpinnerSize.XS"
					:color="SpinnerColor.mainPrimary"
					class="bx-im-emote-selector-tab-stickers__loader"
					aria-hidden="true"
				/>
			</div>
		</div>
	`
	};

	const TabType = {
		emoji: 'emoji',
		stickers: 'stickers'
	};

	// The two switcher chips share their container: horizontal arrows rove focus between them, selection
	// stays on Enter/Space (deferred activation, matching the sticker pack toolbar below).
	const TAB_SELECTOR = '[role="tab"]';

	// @vue/component
	const EmotePopup = {
		name: 'EmotePopup',
		components: {
			MessengerPopup: im_v2_component_elements_popup.MessengerPopup,
			TabEmoji,
			TabStickers,
			Chip: ui_system_chip_vue.Chip
		},
		props: {
			bindElement: {
				type: Object,
				required: true
			},
			dialogId: {
				type: String,
				required: true
			}
		},
		emits: ['close'],
		data() {
			return {
				currentTab: this.getInitialTab()
			};
		},
		computed: {
			TabType: () => TabType,
			PopupType: () => im_v2_const.PopupType,
			ChipDesign: () => ui_system_chip_vue.ChipDesign,
			ChipSize: () => ui_system_chip_vue.ChipSize,
			popupConfig() {
				return {
					width: 365,
					bindElement: this.bindElement,
					bindOptions: {
						position: 'top'
					},
					offsetTop: 25,
					offsetLeft: -230,
					padding: 0,
					contentBorderRadius: '18px',
					background: 'transparent',
					// main.popup renders the shell as role="dialog" and puts this on it as its aria-label, so
					// the dialog opened from the trigger has an accessible name.
					ariaLabel: this.loc('IM_TEXTAREA_EMOTE_POPUP_ARIA'),
					// Initial focus inside the popup is ours: the keyboard path lands on a grid cell, and a
					// mouse click has to leave the caret in the field, where the trap would park focus on the
					// dialog shell. Conditional: a non-empty option would create a trap even where the setting
					// keeps it off.
					focusTrap: main_popup.Popup.shouldUseFocusTrapByDefault() ? {
						initialFocus: false
					} : undefined
				};
			}
		},
		created() {
			// A per-instance prefix keeps the tab/panel ids unique if two popups ever coexist.
			this.tabIdPrefix = `bx-im-emote-tabs-${main_core.Text.getRandom(8)}`;
			// The zone holds DOM nodes and must stay out of reactive state.
			this.tabSwitcherFocusZone = null;
			this.cancelTabSwitcherActivation = null;
		},
		mounted() {
			this.initTabSwitcherFocusZone();
		},
		beforeUnmount() {
			this.destroyTabSwitcherFocusZone();
		},
		methods: {
			initTabSwitcherFocusZone() {
				const container = this.$refs.tabSwitcher;
				if (!container) {
					return;
				}
				this.tabSwitcherFocusZone = ui_vue3.markRaw(im_v2_lib_a11y.createListFocusZone(container, {
					bindKeys: ui_a11y.FocusKeys.ArrowHorizontal,
					focusableElementFilter: element => element.matches(TAB_SELECTOR)
				}));
				// The chips mount while the popup is still fading in; the zone takes over once it is visible.
				this.cancelTabSwitcherActivation = activateWhenVisible(this.tabSwitcherFocusZone, container);
			},
			destroyTabSwitcherFocusZone() {
				this.cancelTabSwitcherActivation?.();
				this.cancelTabSwitcherActivation = null;
				this.tabSwitcherFocusZone?.deactivate();
				this.tabSwitcherFocusZone = null;
			},
			tabId(type) {
				return `${this.tabIdPrefix}-tab-${type}`;
			},
			panelId(type) {
				return `${this.tabIdPrefix}-panel-${type}`;
			},
			// Only the selected panel is in the DOM (`v-if`), so the other tab controls nothing: no attribute
			// at all rather than one pointing at an id that does not resolve.
			controlledPanelId(type) {
				return this.isTabSelected(type) ? this.panelId(type) : null;
			},
			getInitialTab() {
				return im_v2_lib_localStorage.LocalStorageManager.getInstance().get(im_v2_const.LocalStorageKey.emotePopupTab, TabType.emoji);
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			},
			selectTab(type) {
				this.currentTab = type;
				im_v2_lib_localStorage.LocalStorageManager.getInstance().set(im_v2_const.LocalStorageKey.emotePopupTab, type);
				if (type === TabType.stickers) {
					im_v2_lib_analytics.Analytics.getInstance().stickers.onOpenStickerTab(this.dialogId);
				}
			},
			getChipDesign(type) {
				return this.currentTab === type ? ui_system_chip_vue.ChipDesign.Filled : ui_system_chip_vue.ChipDesign.Outline;
			},
			isTabSelected(type) {
				return this.currentTab === type;
			}
		},
		template: `
		<MessengerPopup
			:config="popupConfig"
			:id="PopupType.emoteSelector"
			@close="$emit('close')"
		>
			<div class="bx-im-emote-popup__container" data-testid="im-textarea-emote-popup">
				<TabEmoji
					v-if="currentTab === TabType.emoji"
					:dialogId="dialogId"
					role="tabpanel"
					:id="panelId(TabType.emoji)"
					:aria-labelledby="tabId(TabType.emoji)"
					data-testid="im-textarea-emote-panel-emoji"
				/>
				<TabStickers
					v-if="currentTab === TabType.stickers"
					:dialogId="dialogId"
					role="tabpanel"
					:id="panelId(TabType.stickers)"
					:aria-labelledby="tabId(TabType.stickers)"
					data-testid="im-textarea-emote-panel-stickers"
					@close="$emit('close')"
				/>
				<div
					class="bx-im-emote-popup__buttons-container"
					role="tablist"
					:aria-label="loc('IM_TEXTAREA_EMOTE_TABS_ARIA')"
					ref="tabSwitcher"
					data-testid="im-textarea-emote-tabs"
				>
					<Chip
						role="tab"
						:id="tabId(TabType.emoji)"
						:aria-controls="controlledPanelId(TabType.emoji)"
						:aria-selected="isTabSelected(TabType.emoji)"
						:size="ChipSize.Sm"
						:design="getChipDesign(TabType.emoji)"
						:text="loc('IM_TEXTAREA_STICKER_SELECTOR_EMOJI_TAB')"
						:rounded="true"
						data-testid="im-textarea-emote-tab-emoji"
						@click="selectTab(TabType.emoji)"
						@keydown.space.prevent="selectTab(TabType.emoji)"
					/>
					<Chip
						role="tab"
						:id="tabId(TabType.stickers)"
						:aria-controls="controlledPanelId(TabType.stickers)"
						:aria-selected="isTabSelected(TabType.stickers)"
						:size="ChipSize.Sm"
						:design="getChipDesign(TabType.stickers)"
						:text="loc('IM_TEXTAREA_STICKER_SELECTOR_STICKER_TAB')"
						:rounded="true"
						data-testid="im-textarea-emote-tab-stickers"
						@click="selectTab(TabType.stickers)"
						@keydown.space.prevent="selectTab(TabType.stickers)"
					/>
				</div>
			</div>
		</MessengerPopup>
	`
	};

	const ICON_SIZE$6 = 24;

	// The roving entry (`tabindex="0"`) of the active grid - the cell Tab would land on. Focusing the
	// first focusable element of the popup instead would land on the create-pack button or a pack tab of
	// the sticker header, which come before the grid.
	const GRID_ENTRY_SELECTOR = '[role="grid"] [tabindex="0"]';
	function getGridEntry(container) {
		const gridEntry = container.querySelector(GRID_ENTRY_SELECTOR);
		return gridEntry instanceof HTMLElement ? gridEntry : null;
	}

	// @vue/component
	const EmoteSelector = {
		name: 'EmoteSelector',
		components: {
			IconButton: im_v2_component_elements_iconButton.IconButton,
			EmotePopup
		},
		props: {
			dialogId: {
				type: String,
				required: true
			}
		},
		data() {
			return {
				showPopup: false
			};
		},
		computed: {
			OutlineIcons: () => ui_iconSet_api_vue.Outline,
			ICON_SIZE: () => ICON_SIZE$6,
			iconColor() {
				return im_v2_const.Color.gray40;
			}
		},
		created() {
			// Cancels a pending wait for the grid entry of the popup; must stay out of reactive state.
			this.cancelPopupFocus = null;
		},
		beforeUnmount() {
			this.cancelPopupFocus?.();
		},
		methods: {
			openSelector(event) {
				this.showPopup = true;
				im_v2_lib_analytics.Analytics.getInstance().stickers.onOpenEmoteSelector(this.dialogId);

				// A click without pointer data means the button was activated from the keyboard. Opening with
				// the mouse leaves focus in the input field, where the click handler put it.
				if (event.detail === 0) {
					void this.$nextTick(() => {
						this.focusPopupContent();
					});
				}
			},
			focusPopupContent() {
				// The popup content is rendered at the end of the document, so Tab does not lead into it:
				// without this move the grid is unreachable from the keyboard.
				const popup = main_popup.PopupManager.getPopupById(im_v2_const.PopupType.emoteSelector) ?? null;
				if (popup === null) {
					return;
				}
				const container = popup.getPopupContainer();
				this.cancelPopupFocus?.();
				// The wait is for the cell, not only for the popup around it: the sticker grid holds a
				// skeleton until its first page arrives.
				this.cancelPopupFocus = runWhenVisible(container, () => {
					// A focus trap parks focus on the dialog shell when it has nothing better to offer, and
					// that is the state this move exists to replace - so the container itself does not count
					// as "already inside". Order does not matter: the trap applies its initial focus only
					// while nothing inside the dialog holds it.
					const activeElement = document.activeElement;
					if (activeElement !== container && container.contains(activeElement)) {
						return;
					}
					this.focusGridEntry(container);
				}, () => getGridEntry(container) !== null);
			},
			focusGridEntry(container) {
				const gridEntry = getGridEntry(container);
				if (gridEntry !== null) {
					gridEntry.focus({
						preventScroll: true
					});
					return;
				}

				// The wait ran out of frames: no grid at all, or packs that never arrived. Keep the popup
				// reachable from the keyboard.
				ui_a11y.FocusNavigator.focusFirst(container, {
					tabbableOnly: false,
					preventScroll: true
				});
			},
			onPopupClose() {
				// Closing while the popup is still fading leaves the wait for the grid entry alive, and out of
				// frames it moves focus anyway - into a container that is already gone, off the trigger.
				this.cancelPopupFocus?.();
				this.returnFocusToTrigger();
				this.showPopup = false;
			},
			returnFocusToTrigger() {
				// Focus has to leave the popup while it is still alive: main.popup removes the whole subtree
				// on close, and focus caught inside falls to the body, from where the platform picks a place
				// of its own - after an emoji insert that is the input field, not the trigger. The restore of
				// a focus trap does not always land before the subtree goes, and does not double this move
				// either - on deactivation a trap keeps focus that already stands outside it.
				const popup = main_popup.PopupManager.getPopupById(im_v2_const.PopupType.emoteSelector) ?? null;
				if (popup === null) {
					return;
				}

				// Only restore when focus still lives inside the popup and would be lost on close. A mouse
				// user keeps focus in the input field, and moving it to the trigger would be a new jump.
				if (popup.getPopupContainer().contains(document.activeElement)) {
					this.$refs.trigger?.$el?.focus({
						preventScroll: true
					});
				}
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<div ref="stickerSelectorIcon" class="bx-im-textarea__icon-container">
			<IconButton
				ref="trigger"
				:iconName="OutlineIcons.SMILE"
				:label="loc('IM_TEXTAREA_ICON_EMOTE')"
				:iconSize="ICON_SIZE"
				:iconColor="iconColor"
				aria-haspopup="dialog"
				class="bx-im-textarea__icon"
				data-testid="im-textarea-emote-btn"
				@click="openSelector"
			/>
		</div>
		<EmotePopup
			v-if="showPopup"
			:bindElement="$refs.stickerSelectorIcon"
			:dialogId="dialogId"
			@close="onPopupClose"
		/>
	`
	};

	const ICON_SIZE$5 = 34;

	// @vue/component
	const LinkInput = {
		name: 'LinkInput',
		components: {
			BInput: ui_system_input_vue.BInput,
			BIcon: ui_iconSet_api_vue.BIcon
		},
		emits: ['insertLink', 'close'],
		data() {
			return {
				linkUrl: ''
			};
		},
		computed: {
			OutlineIcons: () => ui_iconSet_api_vue.Outline,
			InputSize: () => ui_system_input_vue.InputSize,
			InputDesign: () => ui_system_input_vue.InputDesign,
			ICON_SIZE: () => ICON_SIZE$5,
			isValidLink() {
				if (this.linkUrl === '') {
					return false;
				}
				return im_v2_lib_utils.Utils.text.checkUrl(this.linkUrl);
			},
			acceptIconClass() {
				return {
					'--disabled': !this.isValidLink,
					'--active': this.isValidLink
				};
			}
		},
		methods: {
			onAccept() {
				this.$emit('insertLink', this.linkUrl);
			},
			onClose() {
				this.$emit('close');
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<div class="bx-im-format-toolbar-link__container">
			<div class="bx-im-format-toolbar-link__content">
				<BInput
					v-model="linkUrl"
					:design="InputDesign.Primary"
					:label="loc('IM_TEXTAREA_FORMAT_TOOLBAR_LINK_LABEL')"
					:labelInline="true"
					:placeholder="loc('IM_TEXTAREA_FORMAT_TOOLBAR_LINK_PLACEHOLDER')"
					:size="InputSize.Md"
					:active="true"
					class="bx-im-format-toolbar-link__input"
					@keydown.enter="onAccept"
				/>
				<BIcon
					:name="OutlineIcons.CHECK_S"
					:size="ICON_SIZE"
					:hoverableAlt="true"
					class="bx-im-format-toolbar-link__action --accept"
					:class="acceptIconClass"
					@mousedown.prevent
					@click="onAccept"
				/>
				<BIcon
					:name="OutlineIcons.CROSS_S"
					:size="ICON_SIZE"
					:hoverableAlt="true"
					class="bx-im-format-toolbar-link__action"
					@mousedown.prevent
					@click="onClose"
				/>
			</div>
		</div>
	`
	};

	const ToolbarItem = {
		bold: 'bold',
		italic: 'italic',
		underline: 'underline',
		strikethrough: 'strikethrough',
		link: 'link',
		quote: 'quote',
		code: 'code',
		separator: 'separator'
	};
	const POPUP_ID$4 = 'im-format-toolbar-popup';

	// @vue/component
	const FormatToolbar = {
		name: 'FormatToolbar',
		components: {
			MessengerPopup: im_v2_component_elements_popup.MessengerPopup,
			LinkInput,
			BIcon: ui_iconSet_api_vue.BIcon
		},
		props: {
			dialogId: {
				type: String,
				default: ''
			},
			textarea: {
				type: HTMLTextAreaElement,
				required: true
			},
			targetPosition: {
				type: Object,
				required: true,
				validator(value) {
					return main_core.Type.isNumber(value.left) && main_core.Type.isNumber(value.top);
				}
			},
			useMarkdown: {
				type: Boolean,
				default: false
			}
		},
		emits: ['close', 'updateText'],
		data() {
			return {
				linkMode: false
			};
		},
		computed: {
			POPUP_ID: () => POPUP_ID$4,
			ToolbarItem: () => ToolbarItem,
			config() {
				return {
					bindElement: this.targetPosition,
					bindOptions: {
						forceBindPosition: true,
						position: 'top'
					},
					autoHide: true,
					padding: 0,
					contentBorderRadius: 12
				};
			},
			toolbarItems() {
				return [{
					name: ToolbarItem.bold,
					icon: ui_iconSet_api_vue.Outline.BOLD,
					title: this.loc('IM_TEXTAREA_FORMAT_TOOLBAR_ITEM_BOLD'),
					handler: () => {
						this.applyDecoration('KeyB');
						im_v2_lib_analytics.Analytics.getInstance().formatToolbar.onBoldClick(this.dialogId);
					}
				}, {
					name: ToolbarItem.italic,
					icon: ui_iconSet_api_vue.Outline.ITALIC,
					title: this.loc('IM_TEXTAREA_FORMAT_TOOLBAR_ITEM_ITALIC'),
					handler: () => {
						this.applyDecoration('KeyI');
						im_v2_lib_analytics.Analytics.getInstance().formatToolbar.onItalicClick(this.dialogId);
					}
				}, {
					name: ToolbarItem.underline,
					icon: ui_iconSet_api_vue.Outline.UNDERLINE,
					title: this.loc('IM_TEXTAREA_FORMAT_TOOLBAR_ITEM_UNDERLINE'),
					handler: () => {
						this.applyDecoration('KeyU');
						im_v2_lib_analytics.Analytics.getInstance().formatToolbar.onUnderlineClick(this.dialogId);
					}
				}, {
					name: ToolbarItem.strikethrough,
					icon: ui_iconSet_api_vue.Outline.STRIKETHROUGH,
					title: this.loc('IM_TEXTAREA_FORMAT_TOOLBAR_ITEM_STRIKETHROUGH'),
					handler: () => {
						this.applyDecoration('KeyS');
						im_v2_lib_analytics.Analytics.getInstance().formatToolbar.onStrikethroughClick(this.dialogId);
					}
				}, {
					name: ToolbarItem.separator
				}, {
					name: ToolbarItem.link,
					icon: ui_iconSet_api_vue.Outline.LINK,
					title: this.loc('IM_TEXTAREA_FORMAT_TOOLBAR_ITEM_LINK'),
					handler: () => {
						this.openLinkMode();
						im_v2_lib_analytics.Analytics.getInstance().formatToolbar.onLinkClick(this.dialogId);
					}
				}, {
					name: ToolbarItem.code,
					icon: ui_iconSet_api_vue.Outline.DEVELOPER_RESOURCES,
					title: this.loc('IM_TEXTAREA_FORMAT_TOOLBAR_ITEM_CODE'),
					handler: () => {
						this.applyDecoration('code');
						im_v2_lib_analytics.Analytics.getInstance().formatToolbar.onCodeClick(this.dialogId);
					}
				}];
			}
		},
		methods: {
			openLinkMode() {
				this.linkMode = true;
			},
			onCloseLinkMode() {
				this.linkMode = false;
			},
			applyDecoration(key) {
				const newText = im_v2_lib_textarea.Textarea.handleDecorationTag(this.textarea, key, this.useMarkdown);
				this.updateText(newText);
			},
			onInsertLink(linkUrl) {
				const newText = im_v2_lib_textarea.Textarea.addUrlTag(this.textarea, linkUrl, this.useMarkdown);
				this.updateText(newText);
				this.$emit('close');
			},
			insertQuote() {
				const newText = im_v2_lib_textarea.Textarea.prepareInlineQuote(this.textarea);
				im_v2_lib_quote.Quote.sendQuoteEvent({
					text: newText,
					dialogId: this.dialogId,
					context: {
						emitter: this.getEmitter()
					},
					additionalParams: {
						replace: true
					}
				});
			},
			updateText(newText) {
				this.$emit('updateText', newText);
			},
			getEmitter() {
				return this.$Bitrix.eventEmitter;
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<MessengerPopup
			:config="config"
			:id="POPUP_ID"
			@close="$emit('close')"
		>
			<LinkInput v-if="linkMode" @insertLink="onInsertLink" @close="onCloseLinkMode" />
			<div v-else class="bx-im-format-toolbar__container" data-testid="im-format-toolbar">
				<template v-for="item in toolbarItems">
					<div
						v-if="item.name === ToolbarItem.separator"
						class="bx-im-format-toolbar__separator"
					></div>
					<BIcon
						v-else
						:key="item.name"
						:name="item.icon"
						:title="item.title"
						:hoverableAlt="true"
						class="bx-im-format-toolbar__item"
						:data-testid="'im-format-toolbar-' + item.name"
						@mousedown.prevent
						@click="item.handler"
					/>
				</template>
			</div>
		</MessengerPopup>
	`
	};

	const ItemTextByChatType = {
		[im_v2_const.ChatType.openChannel]: () => main_core.Loc.getMessage('IM_TEXTAREA_MENTION_OPEN_CHANNEL_TYPE'),
		[im_v2_const.ChatType.generalChannel]: () => main_core.Loc.getMessage('IM_TEXTAREA_MENTION_OPEN_CHANNEL_TYPE'),
		[im_v2_const.ChatType.channel]: () => main_core.Loc.getMessage('IM_TEXTAREA_MENTION_PRIVATE_CHANNEL_TYPE'),
		[im_v2_const.ChatType.collab]: () => im_v2_lib_collab.CollabManager.getMentionItemSubtitleText(),
		default: () => main_core.Loc.getMessage('IM_TEXTAREA_MENTION_CHAT_TYPE')
	};
	class MentionItemFormatter {
		constructor(dialogId) {
			this.dialogId = dialogId;
		}
		format() {
			return {
				id: this.dialogId,
				title: this.getTitle(),
				subtitle: this.#getSubtitle()
			};
		}
		getTitle() {
			const dialog = this.#getDialog();
			return dialog.name;
		}
		#getSubtitle() {
			const dialog = this.#getDialog();
			if (dialog.type === im_v2_const.ChatType.user) {
				return im_v2_application_core.Core.getStore().getters['users/getPosition'](this.dialogId) ?? main_core.Loc.getMessage('IM_TEXTAREA_MENTION_USER_TYPE');
			}
			const handler = ItemTextByChatType[dialog.type] ?? ItemTextByChatType.default;
			return handler();
		}
		#getDialog() {
			return im_v2_application_core.Core.getStore().getters['chats/get'](this.dialogId, true);
		}
	}

	const SEARCH_REQUEST_ENDPOINT = 'ui.entityselector.doSearch';
	const SearchOutcome = {
		success: 'success',
		failure: 'failure'
	};
	class BaseServerSearch {
		#storeUpdater;
		#searchConfig;
		constructor(searchConfig) {
			this.#searchConfig = searchConfig;
			this.#storeUpdater = new im_v2_lib_search.StoreUpdater();
		}
		async search(query) {
			const {
				items,
				outcome
			} = await this.#searchRequest(query);
			await this.#storeUpdater.update(items);
			return {
				items: this.#prepareSearchResults(items),
				outcome
			};
		}
		async loadChatParticipants(dialogId) {
			const queryParams = {
				order: {
					lastSendMessageId: 'desc'
				},
				dialogId,
				limit: 50
			};
			try {
				const response = await im_v2_lib_rest.runAction(im_v2_const.RestMethod.imV2ChatMentionList, {
					data: queryParams
				});
				const {
					users
				} = response;
				void new im_v2_lib_user.UserManager().setUsersToModel(users);
				return this.#getDialogIds(users);
			} catch (error) {
				console.error('Mention search service: load chat participants error', error);
				throw error;
			}
		}
		async #searchRequest(query) {
			const config = {
				json: im_v2_lib_search.getSearchConfig(this.#searchConfig)
			};
			config.json.searchQuery = {
				queryWords: im_v2_lib_utils.Utils.text.getWordsFromString(query),
				query
			};
			try {
				const response = await main_core.ajax.runAction(SEARCH_REQUEST_ENDPOINT, config);
				im_v2_lib_logger.Logger.warn('Mention search service: request result', response);
				return {
					items: response.data.dialog.items,
					outcome: SearchOutcome.success
				};
			} catch (error) {
				im_v2_lib_logger.Logger.warn('Mention search service: request error', error);
				return {
					items: [],
					outcome: SearchOutcome.failure
				};
			}
		}
		#prepareSearchResults(items) {
			return items.map(item => {
				const {
					id,
					customData
				} = item;
				return {
					dialogId: id.toString(),
					dateMessage: customData.dateMessage ?? '',
					isChatParticipant: customData.isContextChatMember ?? null
				};
			});
		}
		#getDialogIds(items) {
			return items.map(item => {
				return {
					dialogId: item.id.toString()
				};
			});
		}
	}

	// The server scope of such a viewer is not 'everyone internal' but a personal one - common chats for a
	// guest, shared workgroups for an extranet user and a collaber, down to an empty result - and the client
	// has no data to reproduce it, so the extended pool stays off and the search goes to the server.
	const ViewerTypesWithoutTabMemoryPool = new Set([im_v2_const.UserType.guest, im_v2_const.UserType.extranet, im_v2_const.UserType.collaber]);
	class MentionSearchService {
		#localSearch;
		#localSearchConfig;
		#baseServerSearch;
		// the pool the local search runs over, marked by the part of it every item came from
		#localCollection = new Map();
		constructor(searchConfig) {
			this.#localSearchConfig = this.#getLocalSearchConfig(searchConfig);
			this.#localSearch = new im_v2_lib_search.LocalSearch(this.#localSearchConfig);
			this.#baseServerSearch = new BaseServerSearch(searchConfig);
		}
		#getLocalSearchConfig(searchConfig) {
			if (!im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isMentionInstantSearchAvailable)) {
				return searchConfig;
			}
			if (!this.#canViewerUseTabMemoryPool()) {
				return searchConfig;
			}
			return {
				...searchConfig,
				withTabMemoryPool: true
			};
		}
		#canViewerUseTabMemoryPool() {
			const viewer = im_v2_application_core.Core.getStore().getters['users/get'](im_v2_application_core.Core.getUserId());
			return Boolean(viewer) && !ViewerTypesWithoutTabMemoryPool.has(viewer.type);
		}
		async loadChatParticipants(dialogId) {
			const items = await this.#baseServerSearch.loadChatParticipants(dialogId);
			this.#forgetParticipantsOutside(items);
			this.#rememberItems(items, im_v2_lib_search.SearchItemOrigin.chatParticipants);
			const participants = this.#getDialogIds(items);
			this.#getStateStore()?.setChatParticipants(dialogId, participants);
			return participants;
		}

		// The composition replaces the previous one as a whole, and the mark of a participant is the strongest
		// one there is: whoever has left the chat keeps their place in the pool but goes back to the memory of
		// the tab, so the filter asks them for the verdicts of the server as it does for anybody from there.
		#forgetParticipantsOutside(items) {
			const participants = new Set(this.#getDialogIds(items));
			this.#localCollection.forEach((item, dialogId) => {
				if (item.origin === im_v2_lib_search.SearchItemOrigin.chatParticipants && !participants.has(dialogId)) {
					this.#localCollection.set(dialogId, {
						...item,
						origin: im_v2_lib_search.SearchItemOrigin.tabMemory
					});
				}
			});
		}

		// The composition loaded in a previous open of the list, if the tab has one. It goes back into the
		// pool as well: a participant of the chat whom no answer of this open has brought yet would otherwise
		// reach the local search as the memory of the tab, and the filter asks that part for the verdicts of
		// the server - the external participant of the current chat would be shown and not found.
		restoreChatParticipants(dialogId) {
			const participants = this.#getStateStore()?.getChatParticipants(dialogId) ?? null;
			if (participants === null) {
				return null;
			}
			this.#rememberItems(this.#toPoolItems(participants), im_v2_lib_search.SearchItemOrigin.chatParticipants);
			return participants;
		}
		#toPoolItems(dialogIds) {
			return dialogIds.map(dialogId => {
				return {
					dialogId
				};
			});
		}

		// the store of the tab is a part of the risky branch, so it is reached only through the same
		// configuration flag as the extended pool
		#getStateStore() {
			return this.#localSearchConfig.withTabMemoryPool ? im_v2_lib_search.MentionStateStore.getInstance() : null;
		}

		// with the tab memory pool the library sorts its own result, and sorting it again is not free:
		// people from the tab memory have no date, and the comparator pays with getters on every pair
		searchLocal(query) {
			const localCollection = [...this.#localCollection.values()];
			const result = this.#localSearch.search(query, localCollection);
			const sortedResult = this.#localSearchConfig.withTabMemoryPool ? result : im_v2_lib_search.sortByDate(result);
			return this.#getDialogIds(sortedResult);
		}
		async search(query) {
			const {
				items,
				outcome
			} = await this.#baseServerSearch.search(query);
			// whoever an answer of the search brought belongs to the memory of the tab and not to the
			// composition of the chat: the visibility filter asks such a person for the verdicts of the server
			this.#rememberItems(items, im_v2_lib_search.SearchItemOrigin.tabMemory);
			return {
				dialogIds: this.#getDialogIds(items),
				participantDialogIds: this.#getParticipantDialogIds(items),
				outcome
			};
		}

		// The part of the pool an item came from is known here and nowhere else, so the item reaches the
		// library already marked. The mark of the strongest part wins, as it does when the library merges the
		// parts: a participant of the chat stays one even when an answer of the search brings them again.
		#rememberItems(items, origin) {
			items.forEach(searchItem => {
				const knownOrigin = this.#localCollection.get(searchItem.dialogId)?.origin;
				const isKnownAsParticipant = knownOrigin === im_v2_lib_search.SearchItemOrigin.chatParticipants;
				this.#localCollection.set(searchItem.dialogId, {
					...searchItem,
					origin: isKnownAsParticipant ? knownOrigin : origin
				});
			});
		}
		#getDialogIds(items) {
			return items.map(item => item.dialogId);
		}
		#getParticipantDialogIds(items) {
			const chatParticipants = items.filter(item => item.isChatParticipant);
			return chatParticipants.map(item => item.dialogId);
		}
	}

	class ParticipantsService {
		async getRecentIds(dialogId) {
			const recentUsersOptions = {
				withFakeUsers: false,
				userLimit: im_v2_lib_search.MAX_ENTITIES_IN_SEARCH_LIST
			};
			const userList = im_v2_lib_search.getUsersFromRecentItems(recentUsersOptions);
			const userIds = userList.map(({
				dialogId: userId
			}) => userId);
			if (userIds.length === 0) {
				return [];
			}
			try {
				const params = {
					data: {
						dialogId,
						userIds
					}
				};
				const {
					relations
				} = await im_v2_lib_rest.runAction(im_v2_const.RestMethod.imV2ChatFilterUsersByParticipation, params);
				const members = relations.filter(member => member.isHidden === false);
				return members.map(({
					userId
				}) => userId.toString());
			} catch (error) {
				console.error('ParticipantsService: getIdsFromRecent error', error);
				return [];
			}
		}
	}

	// @vue/component
	const ContentFooter = {
		name: 'MentionContentFooter',
		components: {
			Loader: im_v2_component_elements_loader.Loader
		},
		props: {
			isLoading: {
				type: Boolean,
				default: false
			}
		},
		computed: {
			arrowsControlTitle() {
				return this.$Bitrix.Loc.getMessage('IM_TEXTAREA_MENTION_ARROWS_CONTROL').replace('##ARROWS_ICON##', '');
			},
			enterControlTitle() {
				return this.$Bitrix.Loc.getMessage('IM_TEXTAREA_MENTION_ENTER_CONTROL');
			},
			escControlTitle() {
				return this.$Bitrix.Loc.getMessage('IM_TEXTAREA_MENTION_ESC_CONTROL');
			}
		},
		template: `
		<div class="bx-im-mention-content-footer__container bx-im-mention-content-footer__scope">
			<div class="bx-im-mention-content-footer__controls">
				<div class="bx-im-mention-content-footer__control">
					<span class="bx-im-mention-content-footer__arrows-control-key"></span>
					<span class="bx-im-mention-content-footer__control-description">
						{{ arrowsControlTitle }}
					</span>
				</div>
				<div class="bx-im-mention-content-footer__control">
					<span class="bx-im-mention-content-footer__control-key">Enter</span>
					<span class="bx-im-mention-content-footer__control-description">{{ enterControlTitle }}</span>
				</div>
				<div class="bx-im-mention-content-footer__control">
					<span class="bx-im-mention-content-footer__control-key">Esc</span>
					<span class="bx-im-mention-content-footer__control-description">{{ escControlTitle }}</span>
				</div>
			</div>
			<Loader
				v-if="isLoading"
				class="bx-im-mention-content-footer__loader"
				data-testid="im-textarea-mention-loader"
			/>
		</div>
	`
	};

	class MentionInsertManager {
		#emitter;
		#handlersById = {
			[im_v2_const.SpecialMentionDialogId.allParticipants]: params => this.#emitAllParticipantsEvent(params),
			default: params => this.#emitBaseEvent(params)
		};
		constructor(context) {
			const {
				emitter
			} = context;
			this.#emitter = emitter;
		}
		insert(params) {
			const handler = this.#handlersById[params.id] || this.#handlersById.default;
			handler(params);
		}
		#emitBaseEvent(params) {
			const {
				id,
				dialogId,
				query,
				target,
				isParticipant,
				suppressAddToChatPopup
			} = params;
			const mentionText = im_v2_application_core.Core.getStore().getters['chats/get'](id, true).name;
			const mentionReplacement = im_v2_lib_utils.Utils.text.getMentionBbCode(id, mentionText);
			this.#emitter.emit(im_v2_const.EventType.textarea.insertMention, {
				mentionText,
				mentionReplacement,
				textToReplace: query,
				dialogId,
				target,
				mentionedUserId: id,
				isParticipant,
				suppressAddToChatPopup
			});
		}
		#emitAllParticipantsEvent(params) {
			const {
				dialogId,
				query,
				target
			} = params;
			const mentionText = main_core.Loc.getMessage('IM_TEXTAREA_MENTION_ALL_PARTICIPANTS_TEXT');
			const mentionReplacement = `[USER=${im_v2_const.SpecialMentionDialogId.allParticipants}]${mentionText}[/USER]`;
			this.#emitter.emit(im_v2_const.EventType.textarea.insertMention, {
				mentionText,
				mentionReplacement,
				textToReplace: query,
				dialogId,
				target
			});
		}
	}

	const MentionItem = {
		name: 'MentionItem',
		components: {
			ChatAvatar: im_v2_component_elements_avatar.ChatAvatar,
			ChatTitle: im_v2_component_elements_chatTitle.ChatTitle
		},
		props: {
			id: {
				type: String,
				required: true
			},
			title: {
				type: String,
				default: ''
			},
			subtitle: {
				type: String,
				default: ''
			}
		},
		computed: {
			AvatarSize: () => im_v2_component_elements_avatar.AvatarSize
		},
		template: `
		<slot name="avatar">
			<ChatAvatar
				:avatarDialogId="id"
				:size="AvatarSize.M"
				class="bx-im-mention-item__avatar-container"
				aria-hidden="true"
			/>
		</slot>
		<div class="bx-im-mention-item__content-container">
			<slot name="title">
				<ChatTitle
					:dialogId="id"
					:text="title"
					:withLeftIcon="false"
					class="bx-im-mention-item__title"
					data-testid="im-mention-item-title"
				/>
			</slot>
			<slot name="subtitle">
				<div class="bx-im-mention-item__subtitle" :title="subtitle">{{ subtitle }}</div>
			</slot>
		</div>
	`
	};

	const AllParticipantsItem = {
		name: 'AllParticipantsItem',
		components: {
			MentionItem
		},
		// Provided by the composer that owns the field: one set of ids per composer, see `createMentionGridIds`.
		inject: ['mentionGridIds'],
		props: {
			item: {
				type: Object,
				required: true
			},
			selected: {
				type: Boolean,
				default: false
			},
			index: {
				type: Number,
				required: true
			},
			activeColumn: {
				type: Number,
				default: 0
			},
			dialogId: {
				type: String,
				required: true
			}
		},
		computed: {
			currentItem() {
				return this.item;
			},
			nameCellId() {
				return this.mentionGridIds.getCellId(this.index, 0);
			}
		},
		methods: {
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<div
			:class="{'--selected': selected}"
			class="bx-im-mention-item__container bx-im-mention-item__scope"
			role="row"
			:data-testid="'im-textarea-mention-item-' + currentItem.id"
		>
			<div :id="nameCellId" role="gridcell" class="bx-im-mention-item__name-cell">
				<MentionItem
					:id="currentItem.id"
					:title="currentItem.title"
					:subtitle="currentItem.subtitle"
				>
					<template #avatar>
						<div
							class="bx-im-mention-item__all-avatar-container"
							:title="loc('IM_TEXTAREA_MENTION_ALL_PARTICIPANTS_AVATAR_TITLE')"
							aria-hidden="true"
						/>
					</template>
				</MentionItem>
			</div>
		</div>
	`
	};

	// @vue/component
	const CopilotItem = {
		name: 'CopilotMentionItem',
		components: {
			MentionItem
		},
		// Provided by the composer that owns the field: one set of ids per composer, see `createMentionGridIds`.
		inject: ['mentionGridIds'],
		props: {
			item: {
				type: Object,
				required: true
			},
			selected: {
				type: Boolean,
				default: false
			},
			index: {
				type: Number,
				required: true
			},
			activeColumn: {
				type: Number,
				default: 0
			},
			dialogId: {
				type: String,
				required: true
			}
		},
		computed: {
			subtitle() {
				return this.loc('IM_TEXTAREA_MENTION_COPILOT_SUBTITLE');
			},
			currentItem() {
				return this.item;
			},
			nameCellId() {
				return this.mentionGridIds.getCellId(this.index, 0);
			}
		},
		methods: {
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<div
			:class="{'--selected': selected}"
			class="bx-im-mention-item__container bx-im-mention-item__scope"
			role="row"
			:data-testid="'im-textarea-mention-item-' + currentItem.id"
		>
			<div :id="nameCellId" role="gridcell" class="bx-im-mention-item__name-cell">
				<MentionItem
					:id="currentItem.id"
					:title="currentItem.title"
					:subtitle="currentItem.subtitle"
				/>
			</div>
		</div>
	`
	};

	class MentionAddUserService {
		#emitter;
		#chatService;
		constructor(context) {
			this.#emitter = context.emitter;
			this.#chatService = new im_v2_provider_service_chat.ChatService();
		}
		async addUser(params) {
			const {
				dialogId,
				userId
			} = params;
			const canAdd = await im_v2_lib_access.ChatAccessManager.canAddUsers(dialogId, [userId]);
			if (!canAdd) {
				return false;
			}
			await this.#addToChat(params);
			this.#emitter.emit(im_v2_const.EventType.mention.onAddUserToChat, {
				userId
			});
			return true;
		}
		async createChatFromUser(params) {
			const {
				dialogId,
				userId
			} = params;
			const {
				newDialogId
			} = await this.#chatService.extendToGroupChat({
				users: [dialogId, userId, im_v2_application_core.Core.getUserId()],
				ownerId: im_v2_application_core.Core.getUserId()
			});
			void im_public.Messenger.openChat(newDialogId);
		}
		async #addToChat(params) {
			const addMethodByChatType = {
				[im_v2_const.ChatType.collab]: () => this.#addToCollab(params),
				default: () => this.#addToDefaultChat(params)
			};
			const addMethod = addMethodByChatType[this.#getChatType(params.dialogId)] ?? addMethodByChatType.default;
			await addMethod();
		}
		async #addToCollab(params) {
			const {
				dialogId,
				userId
			} = params;
			await new im_v2_provider_service_collabInvitation.CollabInvitationService().addEmployees({
				dialogId,
				members: [userId]
			});
		}
		async #addToDefaultChat(params) {
			const {
				chatId,
				userId
			} = params;
			await this.#chatService.addToChat({
				chatId,
				members: [userId],
				showHistory: true
			});
		}
		#getChatType(dialogId) {
			return im_v2_application_core.Core.getStore().getters['chats/get'](dialogId, true).type;
		}
	}

	const AddToChatTitleByChatType = {
		[im_v2_const.ChatType.taskComments]: main_core.Loc.getMessage('IM_TEXTAREA_MENTION_ADD_TO_TASK_COMMENTS_DROPDOWN_MENU'),
		default: main_core.Loc.getMessage('IM_TEXTAREA_MENTION_ADD_TO_CHAT_DROPDOWN_MENU')
	};
	class AddToChatDropdownMenu extends im_v2_lib_menu.BaseMenu {
		constructor(applicationContext) {
			super();
			this.id = im_v2_const.PopupType.mentionAddToChatDropdown;
			const {
				emitter
			} = applicationContext;
			this.emitter = emitter;
		}
		getMenuOptions() {
			return {
				...super.getMenuOptions(),
				angle: false,
				targetContainer: this.context.targetContainer
			};
		}
		getMenuItems() {
			return [this.#getAddToChatItem()];
		}
		#getAddToChatItem() {
			return {
				title: AddToChatTitleByChatType[this.#getChatType()] ?? AddToChatTitleByChatType.default,
				icon: ui_iconSet_api_core.Outline.ADD_PERSON,
				onClick: async () => {
					try {
						this.#insertMention();
						await this.#handleAddToChat();
					} catch {
						im_v2_lib_notifier.Notifier.chat.handleUserAddError(this.#getChatType());
					}
				}
			};
		}
		#insertMention() {
			const params = {
				id: this.context.userId,
				dialogId: this.context.dialogId,
				query: this.context.searchQuery,
				target: this.context.target,
				suppressAddToChatPopup: true
			};
			const insertManager = new MentionInsertManager({
				emitter: this.emitter
			});
			insertManager.insert(params);
		}
		async #handleAddToChat() {
			im_v2_lib_analytics.Analytics.getInstance().mention.onClickAddToChat(this.context.dialogId);
			if (this.#isUser()) {
				await this.#getAddUserService().createChatFromUser({
					dialogId: this.context.dialogId,
					userId: this.context.userId
				});
				return;
			}
			const isAdded = await this.#getAddUserService().addUser({
				dialogId: this.context.dialogId,
				chatId: this.context.chatId,
				userId: this.context.userId
			});
			if (isAdded) {
				im_v2_lib_notifier.Notifier.chat.handleUserAddComplete(this.#getChatType());
			}
		}
		#getAddUserService() {
			return new MentionAddUserService({
				emitter: this.emitter
			});
		}
		#getChatType() {
			const dialog = im_v2_application_core.Core.getStore().getters['chats/get'](this.context.dialogId, true);
			return dialog.type;
		}
		#isUser() {
			return im_v2_application_core.Core.getStore().getters['chats/isUser'](this.context.dialogId);
		}
	}

	const DropdownTitleByChatType = {
		[im_v2_const.ChatType.taskComments]: main_core.Loc.getMessage('IM_TEXTAREA_MENTION_ADD_TO_TASK_COMMENTS_DROPDOWN_TITLE'),
		default: main_core.Loc.getMessage('IM_TEXTAREA_MENTION_ADD_TO_CHAT_DROPDOWN_TITLE')
	};

	// @vue/component
	const AddToChatDropdown = {
		name: 'AddToChatDropdown',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		inject: {
			mentionInsertTarget: {
				default: im_v2_const.TextareaTarget.main
			}
		},
		props: {
			buttonId: {
				type: String,
				required: true
			},
			userId: {
				type: String,
				required: true
			},
			dialogId: {
				type: String,
				required: true
			},
			searchQuery: {
				type: String,
				default: ''
			}
		},
		data() {
			return {
				showMenu: false
			};
		},
		computed: {
			OutlineIcons: () => ui_iconSet_api_vue.Outline,
			dialog() {
				return this.$store.getters['chats/get'](this.dialogId, true);
			},
			title() {
				return DropdownTitleByChatType[this.dialog.type] ?? DropdownTitleByChatType.default;
			}
		},
		methods: {
			closeMenu() {
				this.showMenu = false;
				this.getEmitter().emit(im_v2_const.EventType.mention.onNestedMenuClosed);
			},
			openMenu(event) {
				if (!this.contextMenuManager) {
					this.contextMenuManager = new AddToChatDropdownMenu({
						emitter: this.getEmitter()
					});
					this.contextMenuManager.subscribe(im_v2_lib_menu.BaseMenu.events.close, this.closeMenu);
				}
				const context = {
					chatId: this.dialog.chatId,
					dialogId: this.dialogId,
					userId: this.userId,
					searchQuery: this.searchQuery,
					target: this.mentionInsertTarget,
					targetContainer: this.$el.closest('[aria-modal="true"]') ?? document.body
				};
				this.contextMenuManager.openMenu(context, event.currentTarget);
				this.showMenu = true;
			},
			toggleMenu(event) {
				if (this.showMenu) {
					this.closeMenu();
					return;
				}
				this.openMenu(event);
			},
			getEmitter() {
				return this.$Bitrix.eventEmitter;
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<button
			:id="buttonId"
			type="button"
			class="bx-im-mention-chat-add-dropdown__container"
			tabindex="-1"
			aria-haspopup="menu"
			:aria-expanded="showMenu ? 'true' : 'false'"
			data-testid="im-mention-add-to-chat-btn"
			@mousedown.prevent
			@click.stop="toggleMenu"
		>
			<span class="bx-im-mention-chat-add-dropdown__separator" aria-hidden="true"></span>
			<span :title="title" class="bx-im-mention-chat-add-dropdown__title">{{ title }}</span>
			<BIcon
				v-if="!showMenu"
				class="bx-im-mention-chat-add-dropdown__icon"
				:name="OutlineIcons.CHEVRON_DOWN_S"
				aria-hidden="true"
			/>
			<BIcon
				v-else
				class="bx-im-mention-chat-add-dropdown__icon"
				:name="OutlineIcons.CHEVRON_TOP_S"
				aria-hidden="true"
			/>
		</button>
	`
	};

	function canAddToChat(dialogId, userId) {
		const isCurrentUserGuest = im_v2_application_core.Core.getStore().getters['users/isGuest'](im_v2_application_core.Core.getUserId());
		const isGuestItem = im_v2_application_core.Core.getStore().getters['users/isGuest'](userId);
		if (isCurrentUserGuest || isGuestItem) {
			return false;
		}
		const permissionManager = im_v2_lib_permission.PermissionManager.getInstance();
		const {
			type
		} = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId, true);
		if (type === im_v2_const.ChatType.user && !permissionManager.canPerformActionByUserType(im_v2_const.ActionByUserType.createChat)) {
			return false;
		}
		return permissionManager.canPerformActionByRole(im_v2_const.ActionByRole.extend, dialogId);
	}

	// @vue/component
	const DefaultItem = {
		name: 'DefaultMentionItem',
		components: {
			ChatTitleWithHighlighting: im_v2_component_elements_chatTitle.ChatTitleWithHighlighting,
			MentionItem,
			AddToChatDropdown
		},
		// Provided by the composer that owns the field: one set of ids per composer, see `createMentionGridIds`.
		inject: ['mentionGridIds'],
		props: {
			item: {
				type: Object,
				required: true
			},
			selected: {
				type: Boolean,
				default: false
			},
			index: {
				type: Number,
				required: true
			},
			activeColumn: {
				type: Number,
				default: 0
			},
			query: {
				type: String,
				default: ''
			},
			dialogId: {
				type: String,
				required: true
			},
			isParticipant: {
				type: Boolean,
				required: true
			}
		},
		computed: {
			itemDialog() {
				return this.getDialog(this.item.id);
			},
			isItemUser() {
				return this.itemDialog.type === im_v2_const.ChatType.user;
			},
			subtitleWithHighlighting() {
				return im_v2_lib_textHighlighter.highlightText(main_core.Text.encode(this.item.subtitle), this.query);
			},
			currentItem() {
				return this.item;
			},
			nameCellId() {
				return this.mentionGridIds.getCellId(this.index, 0);
			},
			actionCellId() {
				return this.mentionGridIds.getCellId(this.index, 1);
			},
			actionButtonId() {
				return this.mentionGridIds.getActionButtonId(this.index);
			},
			// The two cells of the row light one at a time: while the action column is active the row keeps no
			// highlight of its own, or the keyboard position would read as two places at once.
			nameCellActive() {
				return this.selected && this.activeColumn === 0;
			},
			actionCellActive() {
				return this.selected && this.activeColumn === 1;
			},
			isAddingUserByMentionAvailable() {
				return im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isAddingUserByMentionAvailable);
			},
			canAddToChat() {
				if (this.isParticipant || !this.isAddingUserByMentionAvailable || !this.isItemUser) {
					return false;
				}
				return canAddToChat(this.dialogId, this.currentItem.id);
			}
		},
		methods: {
			getDialog(dialogId) {
				return this.$store.getters['chats/get'](dialogId, true);
			}
		},
		template: `
		<div
			:class="{'--selected': nameCellActive}"
			class="bx-im-mention-item__container bx-im-mention-item__scope"
			role="row"
		>
			<div :id="nameCellId" role="gridcell" class="bx-im-mention-item__name-cell">
				<MentionItem :id="currentItem.id">
					<template #title>
						<ChatTitleWithHighlighting
							:dialogId="currentItem.id"
							:textToHighlight="query"
							:text="currentItem.title"
							class="bx-im-mention-item__title"
							data-testid="im-mention-item-title"
						/>
					</template>
					<template #subtitle>
						<div
							v-if="isItemUser"
							class="bx-im-mention-item__subtitle"
							:title="currentItem.subtitle"
							v-html="subtitleWithHighlighting"
						></div>
						<div v-else class="bx-im-mention-item__subtitle" :title="currentItem.subtitle">{{ currentItem.subtitle }}</div>
					</template>
				</MentionItem>
			</div>
			<div
				v-if="canAddToChat"
				:id="actionCellId"
				role="gridcell"
				class="bx-im-mention-item__action-cell"
				:class="{'--active': actionCellActive}"
				data-testid="im-textarea-mention-item-action-cell"
			>
				<AddToChatDropdown
					:buttonId="actionButtonId"
					:dialogId="dialogId"
					:userId="currentItem.id"
					:searchQuery="query"
				/>
			</div>
		</div>
	`
	};

	const GRADIENT_HEIGHT = 13;

	// @vue/component
	const MentionItemsContainer = {
		name: 'MentionItemsContainer',
		components: {
			AllParticipantsItem,
			CopilotItem,
			DefaultItem,
			ScrollWithGradient: im_v2_component_elements_scrollWithGradient.ScrollWithGradient
		},
		// Provided by the composer that owns the field: one set of ids per composer, see `createMentionGridIds`.
		inject: ['mentionGridIds'],
		provide() {
			return {
				mentionInsertTarget: this.target
			};
		},
		props: {
			dialogId: {
				type: String,
				required: true
			},
			items: {
				type: Array,
				required: true
			},
			participantsIds: {
				type: Set,
				default: () => new Set()
			},
			query: {
				type: String,
				default: ''
			},
			target: {
				type: String,
				default: im_v2_const.TextareaTarget.main
			},
			resolveItemComponent: {
				type: Function,
				default: null
			},
			onItemSelect: {
				type: Function,
				default: null
			},
			selectEventType: {
				type: String,
				default: im_v2_const.EventType.mention.selectItem
			}
		},
		emits: ['close'],
		data() {
			return {
				// the keyboard position: only key events move it. A hovering pointer has its own :hover state
				// in css and writes nothing here, so it never speaks for the screen reader. It holds a person
				// and not a row number, because a silent refresh rebuilds the list under a position nobody
				// moved, and a kept number would point at somebody else.
				selectedItemId: null,
				// the active column inside the active row: 0 is the name cell, 1 the optional action cell
				activeColumn: 0,
				// Whether the user has started walking the list with the keys. The ring is the mark of that walk
				// and waits for the first movement key; the background of the active row does not, because
				// aria-activedescendant names that row from the start and what it names has to be visible. A
				// fresh list means a fresh walk: a reopened panel mounts this component anew, and a new query
				// resets the flag below.
				keyboardTraversalStarted: false
			};
		},
		computed: {
			GRADIENT_HEIGHT: () => GRADIENT_HEIGHT,
			// a person gone from the result leaves no row to highlight, so the first one takes the highlight
			selectedIndex() {
				const index = this.items.findIndex(item => item.id === this.selectedItemId);
				return index === -1 ? 0 : index;
			},
			preparedQuery() {
				return this.query.trim().toLowerCase();
			},
			copilotBotDialogId() {
				return this.$store.getters['users/bots/getCopilotBotDialogId'];
			},
			// Only the items this container renders itself draw `role="row"` / `role="gridcell"`. A consumer
			// that brings its own item component - the slash-command popup - gets a plain list, because a grid
			// around rowless items is a grid without rows.
			isGridContext() {
				return this.resolveItemComponent === null;
			},
			// selectedIndex + activeColumn are the single source of the keyboard position. The name column
			// exposes its gridcell; the action column exposes the native button so its role and state are announced.
			activeItemNodeId() {
				const activeItem = this.items[this.selectedIndex];
				if (!activeItem) {
					return null;
				}
				return this.activeColumn === 1 ? this.mentionGridIds.getActionButtonId(this.selectedIndex) : this.mentionGridIds.getCellId(this.selectedIndex, 0);
			}
		},
		watch: {
			async preparedQuery() {
				this.selectedItemId = null;
				this.activeColumn = 0;
				this.keyboardTraversalStarted = false;

				// the watcher runs before the narrowed list is rendered: wait for the new nodes
				await this.$nextTick();
				this.scrollToSelectedItem();
			},
			activeItemNodeId: {
				handler(nodeId) {
					this.publishActiveItem(nodeId);
				},
				immediate: true
			},
			participantsIds: {
				handler() {
					this.resetParticipantActionColumn();
				},
				deep: true
			},
			items() {
				this.resetMissingActionColumn();
			}
		},
		created() {
			this.getEmitter().subscribe(MentionListEvents.moveSelection, this.onMoveSelection);
			this.getEmitter().subscribe(MentionListEvents.moveColumn, this.onMoveColumn);
			this.getEmitter().subscribe(this.selectEventType, this.onInsertMentionText);
		},
		beforeUnmount() {
			this.getEmitter().unsubscribe(MentionListEvents.moveSelection, this.onMoveSelection);
			this.getEmitter().unsubscribe(MentionListEvents.moveColumn, this.onMoveColumn);
			this.getEmitter().unsubscribe(this.selectEventType, this.onInsertMentionText);

			// the list leaves the DOM: the field must not keep pointing at a removed item
			this.publishActiveItem(null);
		},
		methods: {
			isParticipant(id) {
				const currentUserId = im_v2_application_core.Core.getUserId().toString();
				if (currentUserId === id) {
					return true;
				}
				return this.participantsIds.has(id);
			},
			getComponentToShow(id) {
				if (this.resolveItemComponent) {
					return this.resolveItemComponent(id);
				}
				const components = {
					[im_v2_const.SpecialMentionDialogId.allParticipants]: AllParticipantsItem,
					[this.copilotBotDialogId]: CopilotItem,
					default: DefaultItem
				};
				return components[id] ?? components.default;
			},
			onScroll() {
				main_popup.PopupManager.getPopupById(im_v2_const.PopupType.mentionAddToChatDropdown)?.close();
			},
			onMoveSelection(event) {
				if (this.items.length === 0) {
					return;
				}
				const {
					offset
				} = event.getData();
				const itemsCount = this.items.length;
				this.keyboardTraversalStarted = true;
				const nextIndex = (this.selectedIndex + offset + itemsCount) % itemsCount;
				this.selectedItemId = this.items[nextIndex].id;
				// a vertical move always returns to the name cell of the new row
				this.activeColumn = 0;
				this.scrollToSelectedItem();
			},
			onMoveColumn(event) {
				const {
					offset
				} = event.getData();
				// The manager sends this event only when the key really moves the position between the cells of
				// the active row, so it counts as a walk on either side.
				this.keyboardTraversalStarted = true;
				if (offset < 0) {
					this.activeColumn = 0;
					return;
				}

				// only step onto the action cell when the active row actually renders one
				if (this.activeRowHasActionCell()) {
					this.activeColumn = 1;
				}
			},
			resetParticipantActionColumn() {
				if (this.activeColumn !== 1) {
					return;
				}
				const activeItem = this.items[this.selectedIndex];
				if (activeItem && this.isParticipant(activeItem.id)) {
					this.activeColumn = 0;
				}
			},
			// A silent refresh replaces the list without changing the query, and the row the position lands on may
			// render no action cell. Column 1 would then name a cell that is not in the DOM - the field pointing at
			// nothing - and no row would be marked either, because a row draws its highlight from column 0 alone.
			async resetMissingActionColumn() {
				if (this.activeColumn !== 1) {
					return;
				}

				// the watcher runs before the changed list is rendered: wait for the new cells
				await this.$nextTick();
				if (!this.activeRowHasActionCell()) {
					this.activeColumn = 0;
				}
			},
			activeRowHasActionCell() {
				const actionCellId = this.mentionGridIds.getCellId(this.selectedIndex, 1);
				return Boolean(this.$refs['popup-items']?.querySelector(`[id="${actionCellId}"]`));
			},
			scrollToSelectedItem() {
				const itemsContainer = this.$refs['popup-items'];
				// The grid names its cells, so the active one is found by that id. A plain list has no ids of its
				// own: there one item is one child of the container, in the order of `items`.
				const activeItemSelector = this.isGridContext ? `[id="${this.activeItemNodeId}"]` : `:scope > :nth-child(${this.selectedIndex + 1})`;
				const activeItem = itemsContainer?.querySelector(activeItemSelector);
				if (!activeItem) {
					return;
				}

				// The ring of the keyboard position goes around the whole row, so the row is what the scrolling
				// has to bring into view, ring included: in the grid the id above names a cell of that row, and
				// the row insets its cells by its own padding. A list whose items are rows already - the
				// slash-command popup - has nothing to climb to.
				const activeRow = activeItem.closest('.bx-im-mention-item__container') ?? activeItem;
				const scrollContainer = this.$refs['scroll-gradient'].getContainer();
				const room = getScrollRoom(activeRow, itemsContainer);
				scrollContainer.scrollTop = getNewScrollPosition(activeRow, scrollContainer, room);
			},
			publishActiveItem(nodeId) {
				this.getEmitter().emit(MentionListEvents.activeItemChanged, {
					nodeId
				});
			},
			onInsertMentionText() {
				if (!main_core.Type.isArrayFilled(this.items)) {
					return;
				}
				this.insertMentionText(this.items[this.selectedIndex].id);
			},
			// A click carries the item it landed on, so the pointer inserts what it points at without
			// moving the keyboard position first.
			onItemClick(id) {
				this.insertMentionText(id);
				this.$emit('close');
			},
			insertMentionText(id) {
				if (this.onItemSelect) {
					const selectedItem = this.items.find(item => item.id === id);
					if (selectedItem) {
						this.onItemSelect(selectedItem);
					}
					return;
				}
				const insertManager = new MentionInsertManager({
					emitter: this.getEmitter()
				});
				insertManager.insert({
					id,
					dialogId: this.dialogId,
					query: this.query,
					target: this.target,
					isParticipant: this.isParticipant(id)
				});
			},
			getEmitter() {
				return this.$Bitrix.eventEmitter;
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<ScrollWithGradient
			v-if="items.length > 0"
			ref="scroll-gradient"
			:gradientSize="GRADIENT_HEIGHT"
			@scroll="onScroll"
		>
			<div
				v-if="isGridContext"
				class="bx-im-mention-popup-content__items"
				:class="{'--keyboard-traversal': keyboardTraversalStarted}"
				ref="popup-items"
				:id="mentionGridIds.gridId"
				role="grid"
				:aria-label="loc('IM_TEXTAREA_MENTION_GRID_ARIA')"
				data-testid="im-textarea-mention-grid"
			>
				<component
					v-for="(item, index) in items"
					:is="getComponentToShow(item.id)"
					:isParticipant="isParticipant(item.id)"
					:item="item"
					:query="query"
					:dialogId="dialogId"
					:index="index"
					:selected="index === selectedIndex"
					:activeColumn="activeColumn"
					data-testid="im-mention-item"
					@click="onItemClick(item.id)"
					@close="$emit('close')"
				/>
			</div>
			<div
				v-else
				class="bx-im-mention-popup-content__items"
				:class="{'--keyboard-traversal': keyboardTraversalStarted}"
				ref="popup-items"
			>
				<component
					v-for="(item, index) in items"
					:is="getComponentToShow(item.id)"
					:isParticipant="isParticipant(item.id)"
					:item="item"
					:query="query"
					:dialogId="dialogId"
					:selected="index === selectedIndex"
					@click="onItemClick(item.id)"
					@close="$emit('close')"
				/>
			</div>
		</ScrollWithGradient>
	`
	};

	// @vue/component
	const SearchEmptyState = {
		name: 'MentionSearchEmptyState',
		template: `
		<div class="bx-im-mention-empty-state__scope bx-im-mention-empty-state__container">
			<span class="bx-im-mention-empty-state__icon"></span>
			<span class="bx-im-mention-empty-state__title">
				{{ $Bitrix.Loc.getMessage('IM_TEXTAREA_MENTION_EMPTY_STATE') }}
			</span>
		</div>
	`
	};

	// @vue/component
	const SearchStatusLine = {
		name: 'MentionSearchStatusLine',
		props: {
			text: {
				type: String,
				required: true
			}
		},
		emits: ['retry', 'focusTextarea'],
		setup() {
			// the notice names what exactly is retried, and the accessible name of the button refers to it
			return {
				noticeId: `bx-im-mention-status-notice-${main_core.Text.getRandom()}`
			};
		},
		computed: {
			retryTitle() {
				return this.$Bitrix.Loc.getMessage('IM_TEXTAREA_MENTION_SEARCH_ERROR_RETRY');
			}
		},
		// a successful retry removes the notice together with the button, and a control removed under the
		// focus leaves it on the body: the field the list was opened from takes the focus back beforehand
		beforeUnmount() {
			const action = this.$refs.action;
			if (action && ui_a11y.FocusNavigator.getActiveElement(action) === action) {
				this.$emit('focusTextarea');
			}
		},
		template: `
		<div
			class="bx-im-mention-empty-state__scope bx-im-mention-empty-state__container"
			data-testid="im-textarea-mention-status"
		>
			<span class="bx-im-mention-empty-state__title" :id="noticeId">{{ text }}</span>
			<button
				type="button"
				class="bx-im-mention-empty-state__action"
				data-testid="im-textarea-mention-retry-btn"
				ref="action"
				:aria-describedby="noticeId"
				@click="$emit('retry')"
			>
				{{ retryTitle }}
			</button>
		</div>
	`
	};

	// the pause before a request and the minimal interval between two of them: both values come from
	// measurements and are confirmed on a production portal after the rollout
	const SERVER_SEARCH_DELAY = 200;
	const MIN_SERVER_SEARCH_INTERVAL = 300;
	const MentionListState = {
		items: 'items',
		loadingFirstPortion: 'loadingFirstPortion',
		nothingFound: 'nothingFound',
		searchUnavailable: 'searchUnavailable',
		partialList: 'partialList',
		degradedSearch: 'degradedSearch'
	};
	// @vue/component
	const MentionPopupContent = {
		name: 'MentionPopupContent',
		components: {
			ContentFooter,
			SearchEmptyState,
			SearchStatusLine,
			MentionItemsContainer
		},
		// <visually-hidden> comes from ui.a11y as a custom element, so it is not looked up among components
		compilerOptions: {
			isCustomElement: tag => tag === 'visually-hidden'
		},
		props: {
			dialogId: {
				type: String,
				required: true
			},
			query: {
				type: String,
				default: ''
			},
			searchChats: {
				type: Boolean,
				default: true
			},
			withCopilot: {
				type: Boolean,
				default: true
			},
			target: {
				type: String,
				default: im_v2_const.TextareaTarget.main
			}
		},
		emits: ['close', 'adjustPosition', 'focusTextarea'],
		data() {
			return {
				lastSearchOutcome: null,
				searchResult: [],
				chatParticipants: [],
				chatParticipantsOutcome: null,
				pendingRequests: 0,
				needTopShadow: false,
				needBottomShadow: true,
				confirmedParticipantsIds: new Set()
			};
		},
		computed: {
			MentionListState: () => MentionListState,
			// A person is a participant of the chat while the composition holds them or while a source that
			// outlives a refresh of the composition confirms it. The composition is replaced as a whole, so
			// whoever has left the chat stops being a participant with the answer that no longer brings them:
			// a stale mark would raise them among the results and hide the action of adding them to the chat.
			participantsIds() {
				return new Set([...this.confirmedParticipantsIds, ...this.chatParticipants]);
			},
			dialog() {
				return im_v2_application_core.Core.getStore().getters['chats/get'](this.dialogId, true);
			},
			items() {
				if (!this.isEmptyQuery) {
					return this.dynamicItemsToShow;
				}
				return [...this.fixedItemsToShow, ...this.dynamicItemsToShow];
			},
			fixedItemsToShow() {
				const items = [{
					id: this.copilotBotDialogId,
					title: new MentionItemFormatter(this.copilotBotDialogId).getTitle(),
					subtitle: this.loc('IM_TEXTAREA_MENTION_COPILOT_SUBTITLE'),
					showCondition: this.needToShowFixedCopilot
				}, {
					id: im_v2_const.SpecialMentionDialogId.allParticipants,
					title: this.loc('IM_TEXTAREA_MENTION_ALL_PARTICIPANTS_TITLE'),
					subtitle: this.loc('IM_TEXTAREA_MENTION_ALL_PARTICIPANTS_SUBTITLE'),
					showCondition: this.needToShowAllParticipants
				}];
				return items.filter(item => item.showCondition).map(({
					id,
					title,
					subtitle
				}) => ({
					id,
					title,
					subtitle
				}));
			},
			dynamicItemsToShow() {
				return this.formattedDynamicItems(this.dynamicItems);
			},
			// the start screen and the result of a query are separate branches: with an empty query the list
			// shows the composition of the chat (or the recent people) as a whole, there is nothing to search
			dynamicItems() {
				if (!this.isEmptyQuery) {
					return this.searchResult;
				}
				if (this.needToShowRecentUsersOnStartScreen) {
					return this.usersFromRecent;
				}
				return this.chatParticipants;
			},
			// a request still in flight is no reason to fall back to the recent users, a failed one is
			needToShowRecentUsersOnStartScreen() {
				return this.chatParticipantsOutcome !== null && this.chatParticipants.length <= 1;
			},
			usersFromRecent() {
				return im_v2_lib_search.getUsersFromRecentItems({
					withFakeUsers: false
				}).map(({
					dialogId
				}) => dialogId);
			},
			preparedQuery() {
				return this.query.trim().toLowerCase();
			},
			isEmptyQuery() {
				return this.preparedQuery.length === 0;
			},
			// the sign of loading is a derivation of the counted requests and not a flag of its own: a request
			// is counted from the moment it is queued, and the sign goes off with the last one that raised it
			isLoading() {
				return this.pendingRequests > 0;
			},
			// fixed items are not counted: they are shown by their own rules and never mean 'something found'
			hasFoundItems() {
				return this.dynamicItems.length > 0;
			},
			// the order of the checks matters: a missing chat composition outranks the search outcome,
			// and a failed outcome outranks a request in flight, so the notice does not blink while typing goes on
			listState() {
				// on the start screen the failure of the composition is itself what there is to report: with
				// the recent people empty too, the popup would otherwise stay blank without a word of why
				if ((this.hasFoundItems || this.isEmptyQuery) && this.chatParticipantsOutcome === SearchOutcome.failure) {
					return MentionListState.partialList;
				}
				if (this.lastSearchOutcome === SearchOutcome.failure) {
					return this.hasFoundItems ? MentionListState.degradedSearch : MentionListState.searchUnavailable;
				}
				if (this.hasFoundItems) {
					return MentionListState.items;
				}
				if (this.isLoading) {
					return MentionListState.loadingFirstPortion;
				}
				return this.isEmptyQuery ? MentionListState.items : MentionListState.nothingFound;
			},
			// searchUnavailable and degradedSearch report the same failure, so they share one notice
			statusLineText() {
				const phraseCodes = {
					[MentionListState.searchUnavailable]: 'IM_TEXTAREA_MENTION_SEARCH_ERROR',
					[MentionListState.degradedSearch]: 'IM_TEXTAREA_MENTION_SEARCH_ERROR',
					[MentionListState.partialList]: 'IM_TEXTAREA_MENTION_PARTICIPANTS_ERROR'
				};
				const phraseCode = phraseCodes[this.listState];
				return phraseCode ? this.loc(phraseCode) : '';
			},
			// A message about what has just happened, not a label of the current state: the number of matches
			// makes the text differ from result to result, so every new result is announced. States with a
			// visible notice of their own are announced by its text, and the start screen shows the
			// composition of the chat, where no search has happened at all: neither adds a message here.
			stateAnnouncement() {
				const hasVisibleNotice = Boolean(this.statusLineText) || this.listState === MentionListState.nothingFound;
				if (this.isEmptyQuery || hasVisibleNotice) {
					return '';
				}

				// the request is reported by the sign of loading and not by a state of the map: a list already
				// on the screen keeps the state at items, and the search going on behind it would stay
				// unreported otherwise - the very case the feature makes the usual one
				if (this.isLoading) {
					return this.loc('IM_TEXTAREA_MENTION_SEARCH_IN_PROGRESS');
				}
				return this.locPlural('IM_TEXTAREA_MENTION_SEARCH_RESULTS_COUNT', this.dynamicItems.length);
			},
			searchConfig() {
				const exclude = [];
				if (!this.searchChats) {
					exclude.push(im_v2_lib_search.EntitySearch.chats);
				}

				// the mark of a request from the mention list: the server lowers the threshold of the query
				// length for it alone, the other consumers of the provider keep theirs
				return {
					exclude,
					contextChatId: this.dialog.chatId,
					mentionSearch: true
				};
			},
			copilotBotDialogId() {
				return this.$store.getters['users/bots/getCopilotBotDialogId'];
			},
			needToShowFixedCopilot() {
				if (!this.withCopilot) {
					return false;
				}
				const isChannel = im_v2_lib_channel.ChannelManager.isChannel(this.dialogId);
				const isCopilotChat = new im_v2_lib_copilot.CopilotManager().isCopilotChat(this.dialogId);
				if (isChannel || isCopilotChat) {
					return false;
				}
				return im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isCopilotMentionAvailable);
			},
			needToShowAllParticipants() {
				if (this.dialog.type === im_v2_const.ChatType.user) {
					return false;
				}
				if (this.dialog.type === im_v2_const.ChatType.copilot) {
					return new im_v2_lib_copilot.CopilotManager().isGroupCopilotChat(this.dialogId);
				}
				return true;
			}
		},
		watch: {
			async listState() {
				await this.adjustPosition();
			},
			async searchResult() {
				await this.adjustPosition();
			},
			preparedQuery(newQuery, previousQuery) {
				if (newQuery === previousQuery) {
					return;
				}
				void this.startSearch(newQuery);
			}
		},
		async created() {
			this.initSettings();
			this.isUnmounted = false;
			this.searchService = new MentionSearchService(this.searchConfig);
			// the timer of the request scheduled last - see scheduleServerSearch
			this.serverSearchTimerId = null;
			// no request has left yet, so the first one is held by the pause alone
			this.nextServerSearchAllowedAt = 0;
			// the end of the wait of the request queued last - see queueServerSearch
			this.finishQueuedSearch = null;
			this.getEmitter().subscribe(im_v2_const.EventType.mention.onAddUserToChat, this.onAddUserToChat);
			void this.initSearchState();
		},
		beforeUnmount() {
			this.isUnmounted = true;
			this.cancelScheduledSearch();
			this.getEmitter().unsubscribe(im_v2_const.EventType.mention.onAddUserToChat, this.onAddUserToChat);
		},
		methods: {
			async initSearchState() {
				const requests = [this.initChatParticipants()];

				// the popup can be opened with a query already typed in another input: preparedQuery never
				// changes, so its watcher never fires and the first search is started by hand. It goes beside
				// the composition of the chat and not after it, so neither wait holds the other back.
				if (!this.isEmptyQuery) {
					requests.push(this.startSearch(this.preparedQuery));
				}
				await Promise.all(requests);
			},
			// Both requests are started before the first await, and each one applies its own result: the list is
			// drawn from the chat participants without waiting for the recent ones. Neither half rejects - each
			// one keeps its own failure, one as a list state and the other as an empty answer - so a failure of
			// one of them cannot take the other down with it.
			async initChatParticipants() {
				const storedParticipants = this.searchService.restoreChatParticipants(this.dialogId);
				const loadParticipants = () => {
					return Promise.all([this.loadChatParticipants(), this.loadRecentParticipants()]);
				};
				if (main_core.Type.isArrayFilled(storedParticipants)) {
					// the composition of a previous open is shown at once, and the request that follows only
					// refreshes it: with a list on the screen the indicator of the first request is not raised
					this.applyChatParticipants(storedParticipants);
					await loadParticipants();
					return;
				}
				await this.trackRequest(loadParticipants);
			},
			async loadRecentParticipants() {
				const participantsIdsFromRecent = await new ParticipantsService().getRecentIds(this.dialogId);
				this.addParticipants(participantsIdsFromRecent);
			},
			onAddUserToChat(event) {
				const {
					userId
				} = event.getData();
				this.addParticipants([userId]);
			},
			// the threshold comes from the server as a ready number: the mention list searches from a shorter
			// query than the rest of the messenger, and the server counts how much shorter. The common
			// threshold is the fallback, so a client of the new build on an older server asks no earlier than
			// that server is ready to answer.
			initSettings() {
				const settings = main_core.Extension.getSettings('im.v2.component.textarea');
				const defaultMinTokenSize = 3;
				const commonMinTokenSize = settings.get('minSearchTokenSize', defaultMinTokenSize);
				this.minTokenSize = settings.get('mentionSearchMinTokenSize', commonMinTokenSize);
			},
			// the outcome is kept here instead of being thrown: a missing composition is a list state,
			// not a reason to leave the popup on the loading indicator forever
			async loadChatParticipants() {
				try {
					this.applyChatParticipants(await this.searchService.loadChatParticipants(this.dialogId));
					this.chatParticipantsOutcome = SearchOutcome.success;
				} catch {
					this.chatParticipantsOutcome = SearchOutcome.failure;
				}
			},
			// The composition is replaced as a whole, so the answer of the refresh leaves nothing stale on the
			// screen: those who left the chat go from the list, those who were added appear in it. For a query
			// that is not empty this means rebuilding its local layers on the new composition - the pool knew
			// nothing about these people while the query was being typed, and below the threshold of the server
			// no request would bring them - while whoever the server has already answered keeps their place.
			applyChatParticipants(participants) {
				const previousParticipants = this.chatParticipants;
				const shownItems = this.searchResult;
				this.chatParticipants = participants;
				if (this.isEmptyQuery) {
					this.searchResult = participants;
					return;
				}
				const stillInChat = new Set(participants);
				const leftTheChat = new Set(previousParticipants.filter(dialogId => !stillInChat.has(dialogId)));
				const shownTail = shownItems.filter(dialogId => !leftTheChat.has(dialogId));

				// the rebuilt layers are the base the tail of what is already shown is appended to
				this.searchResult = this.rebuildResult(this.preparedQuery);
				this.searchResult = this.appendServerResult(shownTail);
			},
			// the query is read here instead of being passed in: a request held back by the minimal interval
			// leaves with the latest query, not with the one that started the wait
			async searchOnServer() {
				const query = this.preparedQuery;

				// the pause and the minimal interval outlive the query the request was scheduled on, and the
				// line goes on changing meanwhile: a query shortened below the threshold since then leaves
				// nothing to ask the server about
				if (query.length < this.minTokenSize) {
					this.releaseQueuedSearch();
					return;
				}
				await this.trackRequest(async () => {
					// the wait is over: from here on the request itself is what the sign of loading stands on
					this.releaseQueuedSearch();
					// the moment the next wait is counted from, so two requests never come closer than the interval
					this.nextServerSearchAllowedAt = Date.now() + MIN_SERVER_SEARCH_INTERVAL;
					const {
						dialogIds,
						participantDialogIds,
						outcome
					} = await this.searchService.search(query);
					if (this.isUnmounted || query !== this.preparedQuery) {
						return;
					}
					this.lastSearchOutcome = outcome;
					this.addParticipants(participantDialogIds);
					this.searchResult = this.appendServerResult(dialogIds);
				});
			},
			// a changed query rebuilds the whole result; the start screen is a branch of its own
			async startSearch(query) {
				if (query.length === 0) {
					this.cleanSearchResult();
					return;
				}
				this.searchResult = this.rebuildResult(query);
				await this.requestServerSearch(query);
			},
			async requestServerSearch(query) {
				// a query too short to reach the server keeps no outcome of a previous one: the notice of a
				// failure would stay above a list built on local matches alone, with a retry that does nothing
				if (query.length < this.minTokenSize) {
					this.lastSearchOutcome = null;
					// a request queued by a longer query will not leave anymore, so it stops being counted
					this.releaseQueuedSearch();
					return;
				}

				// the sign of loading belongs to the whole wait and not to the request alone: the request is
				// held back for up to the minimal interval between two of them, and the list would report
				// nothing found for all that time
				await this.trackRequest(() => this.queueServerSearch());
			},
			// The wait of the queued request ends in one of three ways: the request left and answered, the
			// query got too short for it, or the next keystroke restarted the pause - and then the call queued
			// before it never leaves, so it is released here instead of being counted forever.
			queueServerSearch() {
				this.releaseQueuedSearch();
				return new Promise(resolve => {
					this.finishQueuedSearch = resolve;
					this.scheduleServerSearch();
				});
			},
			// One timer holds both rules of the schedule: its wait is the pause after the last change of the
			// line, stretched until the minimal interval since the last request has passed. A pause with a
			// limiter of the rate behind it would not do - the limiter keeps a tail of its own that the pause
			// does not cancel, and a request leaves in the middle of the typing, the same line going twice.
			scheduleServerSearch() {
				this.cancelScheduledSearch();
				const wait = Math.max(SERVER_SEARCH_DELAY, this.nextServerSearchAllowedAt - Date.now());
				this.serverSearchTimerId = setTimeout(() => {
					this.serverSearchTimerId = null;
					void this.searchOnServer();
				}, wait);
			},
			cancelScheduledSearch() {
				clearTimeout(this.serverSearchTimerId);
				this.serverSearchTimerId = null;
			},
			// a call already released leaves nothing to release: the counter is let go once per queued request
			releaseQueuedSearch() {
				this.finishQueuedSearch?.();
				this.finishQueuedSearch = null;
			},
			// partialList is caused by the request of the open, so its retry repeats that request, not the search
			async handleRetry() {
				// a request already in flight is the very one the retry would repeat: a second one would race
				// it past the minimal interval, and the answer that came last would decide the state
				if (this.isLoading) {
					return;
				}
				if (this.listState !== MentionListState.partialList) {
					this.retrySearch();
					return;
				}
				await this.trackRequest(() => this.loadChatParticipants());
			},
			// The step that failed is the request, and the query has not changed since: the shown rows keep
			// their positions, so nothing is rebuilt. A retry is an explicit action and not a stream of typing,
			// so it goes to the server at once - held back by the pause, the click would leave no sign of being
			// taken at all, and the next one would replace it instead of asking again.
			retrySearch() {
				void this.searchOnServer();
			},
			// every request that raises the sign of loading is counted here, so the one that answers first no
			// longer lowers it for the others: the composition of the chat and a search are counted alike
			async trackRequest(request) {
				this.pendingRequests++;
				try {
					await request();
				} finally {
					this.pendingRequests--;
				}
			},
			cleanSearchResult() {
				this.searchResult = this.chatParticipants;
				this.lastSearchOutcome = null;
			},
			async adjustPosition() {
				await this.$nextTick();
				this.$emit('adjustPosition');
			},
			// the layers of the result in a fixed order: the chat participants that matched the query, then
			// the rest of the local matches by the date of the last message. The people found by the server
			// join the tail through appendServerResult and never take a place among the first two layers.
			rebuildResult(query) {
				const localMatches = this.searchService.searchLocal(query);
				const participantMatches = this.chatParticipantMatches(localMatches);
				const shownIds = new Set(participantMatches);
				return [...participantMatches, ...localMatches.filter(dialogId => !shownIds.has(dialogId))];
			},
			// the loaded composition keeps the order the server gave it - by the last message in this chat;
			// participants known only from a search answer follow it
			chatParticipantMatches(localMatches) {
				const matchedIds = new Set(localMatches);
				const fromComposition = this.chatParticipants.filter(dialogId => matchedIds.has(dialogId));
				const compositionIds = new Set(fromComposition);
				const restOfParticipants = localMatches.filter(dialogId => {
					return this.participantsIds.has(dialogId) && !compositionIds.has(dialogId);
				});
				return [...fromComposition, ...restOfParticipants];
			},
			// an answer to an unchanged query only appends: no shown row changes its position
			appendServerResult(newItems) {
				return [...new Set([...this.searchResult, ...newItems])];
			},
			isChat(dialogId) {
				return dialogId.startsWith(im_v2_const.DialogIdChatPrefix);
			},
			formattedDynamicItems(items) {
				return items.map(dialogId => {
					return new MentionItemFormatter(dialogId).format();
				});
			},
			// the confirmations that outlive a refresh of the composition: the recent conversations, an answer
			// of the search and a person added to the chat in front of the employee
			addParticipants(items) {
				items.forEach(userId => this.confirmedParticipantsIds.add(userId));
			},
			getEmitter() {
				return this.$Bitrix.eventEmitter;
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			},
			locPlural(phraseCode, count) {
				return main_core.Loc.getMessagePlural(phraseCode, count, {
					'#COUNT#': count
				});
			}
		},
		template: `
		<div
			class="bx-im-mention-popup-content__container"
			:aria-busy="isLoading ? 'true' : 'false'"
			:data-testid="'im-mention-popup-' + target"
		>
			<MentionItemsContainer
				:dialogId="dialogId"
				:query="query"
				:items="items"
				:participantsIds="participantsIds"
				:target="target"
				@close="$emit('close')"
			/>
			<div role="status">
				<SearchEmptyState v-if="listState === MentionListState.nothingFound" />
				<SearchStatusLine
					v-else-if="statusLineText"
					:text="statusLineText"
					@retry="handleRetry"
					@focusTextarea="$emit('focusTextarea')"
				/>
				<visually-hidden>{{ stateAnnouncement }}</visually-hidden>
			</div>
			<ContentFooter :isLoading="isLoading" />
		</div>
	`
	};

	const POPUP_ID$3 = 'im-mention-popup';

	// @vue/component
	const MentionPopup = {
		name: 'MentionPopup',
		components: {
			MessengerPopup: im_v2_component_elements_popup.MessengerPopup,
			MentionPopupContent
		},
		props: {
			bindElement: {
				type: Object,
				required: true
			},
			dialogId: {
				type: String,
				required: true
			},
			query: {
				type: String,
				default: ''
			},
			withCopilot: {
				type: Boolean,
				default: true
			},
			targetContainer: {
				type: Object,
				default: null
			},
			target: {
				type: String,
				default: im_v2_const.TextareaTarget.main
			}
		},
		emits: ['close', 'onFocusTextarea'],
		computed: {
			POPUP_ID: () => POPUP_ID$3,
			dialog() {
				return this.$store.getters['chats/get'](this.dialogId, true);
			},
			isCopilotType() {
				return this.dialog.type === im_v2_const.ChatType.copilot;
			},
			isGroupCopilotChat() {
				return new im_v2_lib_copilot.CopilotManager().isGroupCopilotChat(this.dialogId);
			},
			needToShowMentionPopup() {
				if (this.isCopilotType && !im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isBitrixGptV2Available)) {
					return this.isGroupCopilotChat;
				}
				return true;
			},
			searchChats() {
				return !this.isCopilotType;
			},
			config() {
				const config = {
					height: 200,
					width: 426,
					padding: 0,
					bindElement: this.bindElement,
					offsetTop: 2,
					offsetLeft: 0,
					fixed: !this.targetContainer || this.targetContainer === document.body,
					bindOptions: {
						position: 'top'
					},
					className: 'bx-im-mention-popup__scope',
					// the list is opened from the message field and typing goes on in it, so the trap only
					// remembers the field and gives the focus back when the popup closes: it takes no initial
					// focus and does not loop Tab inside the popup
					focusTrap: {
						initialFocus: false,
						looped: false
					}
				};
				if (this.targetContainer) {
					config.targetContainer = this.targetContainer;
				}
				return config;
			}
		},
		created() {
			this.getEmitter().subscribe(im_v2_const.EventType.mention.onNestedMenuClosed, this.onFocusTextarea);
		},
		mounted() {
			// the owner swallows the keys while it counts the popup as open,
			// so a popup that renders nothing has to report itself closed
			if (!this.needToShowMentionPopup) {
				this.$emit('close');
			}
		},
		beforeUnmount() {
			this.getEmitter().unsubscribe(im_v2_const.EventType.mention.onNestedMenuClosed, this.onFocusTextarea);
		},
		methods: {
			onFocusTextarea() {
				this.$emit('onFocusTextarea');
			},
			getEmitter() {
				return this.$Bitrix.eventEmitter;
			}
		},
		template: `
		<MessengerPopup
			v-if="needToShowMentionPopup"
			:config="config"
			@close="$emit('close');"
			:id="POPUP_ID"
			v-slot="{adjustPosition}"
		>
			<MentionPopupContent 
				:dialogId="dialogId"
				:query="query"
				:searchChats="searchChats"
				:withCopilot="withCopilot"
				:target="target"
				@close="$emit('close');"
				@adjustPosition="adjustPosition()"
				@focusTextarea="onFocusTextarea"
			/>
		</MessengerPopup>
	`
	};

	// @vue/component
	const EditPanel = {
		name: 'EditPanel',
		components: {
			IconButton: im_v2_component_elements_iconButton.IconButton
		},
		props: {
			messageId: {
				type: [Number, String],
				required: true
			}
		},
		emits: ['close'],
		computed: {
			OutlineIcons: () => ui_iconSet_api_vue.Outline,
			closeIconColor: () => im_v2_const.Color.gray90,
			message() {
				return this.$store.getters['messages/getById'](this.messageId);
			},
			preparedText() {
				return im_v2_lib_parser.Parser.purifyMessage(this.message);
			}
		},
		methods: {
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<div class="bx-im-message-panel__container" data-testid="im-textarea-edit-panel">
			<div class="bx-im-message-panel__icon"></div>
			<div class="bx-im-message-panel__content">
				<div class="bx-im-message-panel__title">{{ loc('IM_TEXTAREA_EDIT_MESSAGE_TITLE') }}</div>
				<div class="bx-im-message-panel__text">{{ preparedText }}</div>
			</div>
			<IconButton
				class="bx-im-message-panel__close"
				:iconName="OutlineIcons.CROSS_L"
				:iconColor="closeIconColor"
				:label="loc('IM_TEXTAREA_EDIT_PANEL_CLOSE_ARIA')"
				data-testid="im-textarea-edit-panel-close-btn"
				@click="$emit('close')"
			/>
		</div>
	`
	};

	const NAME_MAX_LENGTH = 40;
	const GALLERY_STACK_MAX = 3;

	// @vue/component
	const ReplyPanel = {
		name: 'ReplyPanel',
		components: {
			BaseUiAvatar: im_v2_component_elements_avatar.BaseUiAvatar,
			IconButton: im_v2_component_elements_iconButton.IconButton
		},
		props: {
			messageId: {
				type: Number,
				required: true
			}
		},
		emits: ['close'],
		computed: {
			AvatarSize: () => im_v2_component_elements_avatar.AvatarSize,
			OutlineIcons: () => ui_iconSet_api_vue.Outline,
			closeIconColor: () => im_v2_const.Color.gray90,
			message() {
				return this.$store.getters['messages/getById'](this.messageId);
			},
			replyAuthor() {
				return this.$store.getters['users/get'](this.message.authorId);
			},
			replyTitle() {
				return this.replyAuthor ? this.replyAuthor.name : this.loc('IM_DIALOG_CHAT_QUOTE_DEFAULT_TITLE');
			},
			/** Files attached to the quoted message — read once, reused by the file/gallery computed below */
			messageFiles() {
				return this.$store.getters['messages/getMessageFiles'](this.message.id);
			},
			messageFile() {
				if (this.isContactMessage) {
					return this.messageFiles.find(file => file.type === im_v2_const.FileType.image);
				}
				return this.messageFiles[0];
			},
			contactAvatarTitle() {
				const params = this.message.componentParams ?? {};
				const name = [params.lastName, params.firstName].filter(Boolean).join(' ').trim();
				const phone = params.phones?.[0] ?? '';
				return name || phone;
			},
			contactAvatarUrl() {
				return this.messageFile?.mediaUrl?.preview?.[250] || this.messageFile?.urlPreview || this.messageFile?.urlShow || '';
			},
			galleryCount() {
				return this.messageFiles.length;
			},
			galleryThumbnails() {
				return this.messageFiles.slice(0, GALLERY_STACK_MAX);
			},
			galleryRemainingCount() {
				return Math.max(this.galleryCount - this.galleryThumbnails.length, 0);
			},
			/**
			 * Count modifier for the gallery stack. The stack items are absolutely positioned, so the
			 * container cannot size itself to its content; the width is set per shown-thumbnail count to
			 * keep the stack↔text spacing consistent between 2- and 3-media replies.
			 */
			galleryStackModifier() {
				return `--count-${this.galleryThumbnails.length}`;
			},
			isGallery() {
				return !this.isContactMessage && !this.isMessageDeleted && (this.isImage || this.isVideo) && this.galleryCount > 1;
			},
			mediaCountText() {
				return main_core.Loc.getMessagePlural('IM_MESSAGE_REPLY_MEDIA_COUNT', this.galleryCount, {
					'#COUNT#': this.galleryCount
				});
			},
			isFile() {
				return this.messageFile && this.messageFile.type === im_v2_const.FileType.file;
			},
			isVideo() {
				return this.messageFile && this.messageFile.type === im_v2_const.FileType.video;
			},
			/**
			 * Video note (round video message). Keeps FileType.video (no separate type); the round-message
			 * flag lives on the file. Shown as a compact round poster thumbnail (like a single media
			 * thumbnail) with no textual type label — the round shape conveys the type. The
			 * IM_PARSER_ICON_TYPE_VIDEO_NOTE phrase is still used as the image alt (a11y).
			 */
			isVideoNote() {
				return Boolean(this.messageFile && this.messageFile.isVideoNote);
			},
			isImage() {
				return this.messageFile && this.messageFile.type === im_v2_const.FileType.image;
			},
			isContactMessage() {
				return this.message.componentId === im_v2_const.MessageComponent.contactMessage;
			},
			isAudio() {
				return this.messageFile && this.messageFile.type === im_v2_const.FileType.audio;
			},
			showIcon() {
				if (this.isContactMessage) {
					return false;
				}
				return this.messageFile ? !this.messageFile.urlPreview : false;
			},
			truncatedFileName() {
				return im_v2_lib_utils.Utils.file.getShortFileName(this.messageFile.name, NAME_MAX_LENGTH);
			},
			fileSize() {
				if (!this.messageFile?.size) {
					return '';
				}
				return im_v2_lib_utils.Utils.file.formatFileSize(this.messageFile.size);
			},
			isMessageDeleted() {
				return this.message.isDeleted;
			},
			isSticker() {
				return this.$store.getters['stickers/messages/isSticker'](this.message.id);
			},
			/** Sticker image URI of the quoted message (null if not a sticker or sticker data is not in store) */
			stickerImageUri() {
				if (!this.isSticker) {
					return null;
				}
				const stickerId = this.$store.getters['stickers/messages/getStickerByMessageId'](this.message.id);
				const sticker = this.$store.getters['stickers/get'](stickerId);
				return sticker?.uri ?? null;
			},
			messageText() {
				if (this.isContactMessage) {
					return im_v2_lib_parser.Parser.getContactPreviewText(this.message, true) ?? im_v2_lib_parser.Parser.purify(this.message);
				}
				if (this.isGallery) {
					return `${this.loc('IM_PARSER_ICON_TYPE_GALLERY')}, ${this.mediaCountText}`;
				}
				if (this.isFile) {
					return this.fileSize ? `${this.truncatedFileName}, ${this.fileSize}` : this.truncatedFileName;
				}
				if (this.isAudio) {
					return this.loc('IM_TEXTAREA_REPLY_AUDIO_TITLE');
				}
				if (this.isMessageDeleted) {
					return this.loc('IM_TEXTAREA_REPLY_DELETED_TITLE');
				}
				if (this.isSticker) {
					// The mini-thumbnail already conveys the sticker type, so suppress the redundant
					// sticker label (IM_TEXTAREA_REPLY_STICKER_TITLE, mirrors the in-bubble quote).
					// Fall back to the label when the sticker image is not in the store yet.
					return this.stickerImageUri ? '' : this.loc('IM_TEXTAREA_REPLY_STICKER_TITLE');
				}
				return im_v2_lib_parser.Parser.purify(this.message);
			},
			iconClass() {
				const iconType = im_v2_lib_utils.Utils.file.getIconTypeByFilename(this.messageFile.name);
				return `ui-icon-file-${iconType}`;
			}
		},
		methods: {
			hasPreview(file) {
				return main_core.Type.isStringFilled(file.urlPreview);
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<div
			class="bx-im-message-panel__container"
			:class="{'--contact-message': isContactMessage}"
			data-testid="im-textarea-reply-panel"
		>
			<div class="bx-im-message-panel__icon --quote"></div>
			<div v-if="isContactMessage" class="bx-im-message-panel__contact-avatar" data-testid="im-textarea-reply-contact-avatar">
				<BaseUiAvatar
					type="default"
					:size="AvatarSize.L"
					:url="contactAvatarUrl"
					:title="contactAvatarTitle"
					:withDefaultUserpic="false"
				/>
			</div>
			<div v-else-if="showIcon" class="bx-im-message-panel-file__icon">
				<div :class="iconClass" class="ui-icon"><i></i></div>
			</div>
			<div v-else-if="isGallery" class="bx-im-message-panel__gallery-stack" :class="galleryStackModifier" data-testid="im-textarea-reply-gallery-stack">
				<div
					v-for="file in galleryThumbnails"
					:key="file.id"
					class="bx-im-message-panel__gallery-stack-item"
				>
					<img
						v-if="hasPreview(file)"
						class="bx-im-message-panel__gallery-stack-img"
						:src="file.urlPreview"
						:alt="file.name"
					>
				</div>
				<span
					v-if="galleryRemainingCount > 0"
					class="bx-im-message-panel__gallery-badge"
					data-testid="im-textarea-reply-gallery-badge"
				>+{{ galleryRemainingCount }}</span>
			</div>
			<div v-else-if="isVideoNote && this.messageFile.urlPreview" class="bx-im-message-panel__video-note" data-testid="im-textarea-reply-video-note">
				<img
					v-if="this.messageFile.urlPreview"
					class="bx-im-message-panel__video-note_img"
					:src="this.messageFile.urlPreview"
					:alt="loc('IM_PARSER_ICON_TYPE_VIDEO_NOTE')"
				>
			</div>
			<div
				v-else-if="isImage || isVideo"
				class="bx-im-message-panel__image"
				:class="{'--contact-message': isContactMessage}"
			>
				<img
					v-if="this.messageFile.urlPreview"
					class="bx-im-message-panel__image_img"
					:src="this.messageFile.urlPreview"
											:alt="this.messageFile.name"
				>
			</div>
			<div v-else-if="isSticker && stickerImageUri" class="bx-im-message-panel__sticker" data-testid="im-textarea-reply-sticker">
				<img
					class="bx-im-message-panel__sticker_img"
					:src="stickerImageUri"
					:alt="loc('IM_TEXTAREA_REPLY_STICKER_TITLE')"
				>
			</div>
			<div class="bx-im-message-panel__content">
				<div class="bx-im-message-panel__title">{{ replyTitle }}</div>
				<div class="bx-im-message-panel__text" :class="{'--contact-message': isContactMessage}" data-testid="im-textarea-reply-text">{{ messageText }}</div>
			</div>
			<IconButton
				class="bx-im-message-panel__close"
				:iconName="OutlineIcons.CROSS_L"
				:iconColor="closeIconColor"
				:label="loc('IM_TEXTAREA_REPLY_PANEL_CLOSE_ARIA')"
				data-testid="im-textarea-reply-panel-close-btn"
				@click="$emit('close')"
			/>
		</div>
	`
	};

	const MESSAGE_DISPLAY_LIMIT = 5;

	// @vue/component
	const ForwardPanel = {
		name: 'ForwardPanel',
		components: {
			IconButton: im_v2_component_elements_iconButton.IconButton
		},
		props: {
			context: {
				type: Object,
				required: true
			}
		},
		emits: ['close'],
		computed: {
			OutlineIcons: () => ui_iconSet_api_vue.Outline,
			closeIconColor: () => im_v2_const.Color.gray90,
			forwardContext() {
				return this.context;
			},
			messagesIds() {
				return this.forwardContext.messagesIds;
			},
			sortedMessagesIds() {
				return [...this.messagesIds].sort();
			},
			authorsOfMessages() {
				return this.sortedMessagesIds.map(id => {
					const isForward = this.$store.getters['messages/isForward'](id);
					const message = this.getMessage(id);
					const userId = isForward ? message.forward.userId : message.authorId;
					return this.$store.getters['users/get'](userId, true);
				});
			},
			uniqueUsers() {
				const uniqueUsersObj = {};
				this.authorsOfMessages.forEach(user => {
					if (!uniqueUsersObj[user.id]) {
						uniqueUsersObj[user.id] = user;
					}
				});
				return Object.values(uniqueUsersObj);
			},
			forwardMessagesCount() {
				return this.messagesIds.length;
			},
			forwardAuthorName() {
				const author = this.authorsOfMessages[0];
				let name = author.name;
				if (author.id === 0) {
					name = this.loc('IM_TEXTAREA_FORWARD_SYSTEM');
				}
				return `${name}: `;
			},
			displayedAuthorNames() {
				const systemMessagesCount = this.authorsOfMessages.filter(user => user.id === 0).length;
				const displayedNames = this.uniqueUsers.slice(0, MESSAGE_DISPLAY_LIMIT);
				const names = [];
				displayedNames.forEach(user => {
					if (user.id === 0) {
						return systemMessagesCount > 1 ? names.push(this.loc('IM_TEXTAREA_FORWARD_MESSAGES_SYSTEM')) : names.push(this.loc('IM_TEXTAREA_FORWARD_SYSTEM'));
					}
					if (this.isOwnMessage(user)) {
						return names.unshift(this.loc('IM_TEXTAREA_FORWARD_OWN_MESSAGE'));
					}
					return names.push(user.firstName);
				});
				return names.join(', ');
			},
			formattedAuthorNames() {
				if (this.remainingAuthors > 0) {
					return main_core.Loc.getMessage('IM_TEXTAREA_FORWARD_TEXT_MORE', {
						'[name]': '<span class="bx-im-message-panel__forward-author_name">',
						'[/name]': '</span>',
						'#USER_LIST#': main_core.Text.encode(this.displayedAuthorNames),
						'[remaining]': '<span class="bx-im-message-panel__forward-author_remaining">',
						'[/remaining]': '</span>',
						'#COUNT#': this.remainingAuthors
					});
				}
				return this.loc('IM_TEXTAREA_FORWARD_TEXT', {
					'#USER_LIST#': main_core.Text.encode(this.displayedAuthorNames)
				});
			},
			remainingAuthors() {
				return this.uniqueUsers.length - MESSAGE_DISPLAY_LIMIT;
			},
			messageText() {
				return im_v2_lib_parser.Parser.purifyMessage(this.getMessage(this.messagesIds));
			},
			titleText() {
				if (this.forwardMessagesCount > 1) {
					return this.formattedMessageCounter;
				}
				return this.loc('IM_TEXTAREA_FORWARD_TITLE');
			},
			formattedMessageCounter() {
				return main_core.Loc.getMessagePlural('IM_TEXTAREA_FORWARD_TITLE_MULTIPLE_COUNT', this.forwardMessagesCount, {
					'#COUNT_MESSAGES#': this.forwardMessagesCount
				});
			}
		},
		methods: {
			isOwnMessage(user) {
				return user.id === im_v2_application_core.Core.getUserId() && this.uniqueUsers.length > 1;
			},
			getMessage(messageId) {
				return this.$store.getters['messages/getById'](messageId);
			},
			loc(phraseCode, replacements = {}) {
				return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
			}
		},
		template: `
		<div class="bx-im-message-panel__container" data-testid="im-textarea-forward-panel">
			<div class="bx-im-message-panel__icon --forward"></div>
			<div class="bx-im-message-panel__content">
				<div class="bx-im-message-panel__title">{{ titleText }}</div>
				<div v-if="forwardMessagesCount > 1" class="bx-im-message-panel__text" :class="{'--compact': remainingAuthors > 0}">
					<div class="bx-im-message-panel__bulk-forward-author" v-html="formattedAuthorNames"></div>
				</div>
				<div v-else class="bx-im-message-panel__text">
					<span class="bx-im-message-panel__forward-author">{{ forwardAuthorName }}</span>
					<span class="bx-im-message-panel__forward-message-text">{{ messageText }}</span>
				</div>
			</div>
			<IconButton
				class="bx-im-message-panel__close"
				:iconName="OutlineIcons.CROSS_L"
				:iconColor="closeIconColor"
				:label="loc('IM_TEXTAREA_FORWARD_PANEL_CLOSE_ARIA')"
				data-testid="im-textarea-forward-panel-close-btn"
				@click="$emit('close')"
			/>
		</div>
	`
	};

	// @vue/component
	const MarketAppItem = {
		name: 'MarketAppItem',
		props: {
			item: {
				type: Object,
				required: true
			},
			hideTitle: {
				type: Boolean,
				default: false
			},
			dialogId: {
				type: String,
				required: true
			}
		},
		computed: {
			marketItem() {
				return this.item;
			},
			iconClass() {
				return `fa ${this.marketItem.options.iconName}`;
			},
			iconColor() {
				return this.marketItem.options.color;
			},
			isOpened() {
				return this.$store.getters['market/getOpenedAppId'](this.dialogId) === this.marketItem.id;
			}
		},
		methods: {
			onAppClick() {
				if (this.isOpened) {
					im_v2_lib_market.MarketManager.getInstance().closePlacement(this.dialogId, this.marketItem.id);
					return;
				}
				this.showPlacement();
			},
			showPlacement() {
				im_v2_lib_market.MarketManager.getInstance().showPlacement({
					dialogId: this.dialogId,
					appId: this.marketItem.id,
					bindElement: this.$refs['market-app'],
					width: this.marketItem.options.width,
					height: this.marketItem.options.height
				});
			}
		},
		template: `
		<div
			class="bx-im-market-app-item__container"
			:class="{'--short': hideTitle, '--opened': isOpened}"
			:title="marketItem.title"
			@click="onAppClick"
			ref="market-app"
		>
			<div class="bx-im-market-app-item__icon-container" :style="{backgroundColor: iconColor}">
				<i :class="iconClass" aria-hidden="true"></i>
			</div>
			<div v-if="!hideTitle" class="bx-im-market-app-item__title-container" :title="marketItem.title">
				<div class="bx-im-market-app-item__title-text">
					{{ marketItem.title }}
				</div>
			</div>
		</div>
	`
	};

	// @vue/component
	const MarketShowMorePopupContentItem = {
		name: 'MarketShowMorePopupContentItem',
		props: {
			item: {
				type: Object,
				required: true
			},
			dialogId: {
				type: String,
				required: true
			}
		},
		emits: ['appClick'],
		computed: {
			marketItem() {
				return this.item;
			},
			iconClass() {
				return `fa ${this.marketItem.options.iconName}`;
			},
			iconColor() {
				return this.marketItem.options.color;
			},
			isOpened() {
				return this.$store.getters['market/getOpenedAppId'](this.dialogId) === this.marketItem.id;
			}
		},
		methods: {
			onAppClick() {
				this.$emit('appClick');
			}
		},
		template: `
		<div
			class="bx-im-market-show-more-popup-content-item__container"
			:class="{'--opened': isOpened}"
			:title="marketItem.title"
			@click="onAppClick"
		>
			<div class="bx-im-market-show-more-popup-content-item__icon-container" :style="{backgroundColor: iconColor}">
				<i :class="iconClass" aria-hidden="true"></i>
			</div>
			<div class="bx-im-market-show-more-popup-content-item__title-container">
				<div class="bx-im-market-show-more-popup-content-item__title-text">
					{{ marketItem.title }}
				</div>
			</div>
		</div>
	`
	};

	// @vue/component
	const MarketShowMorePopupContent = {
		name: 'MarketShowMorePopupContent',
		components: {
			MarketShowMorePopupContentItem
		},
		props: {
			marketApps: {
				type: Array,
				required: true
			},
			dialogId: {
				type: String,
				required: true
			}
		},
		emits: ['appClick'],
		data() {
			return {
				needTopShadow: false,
				needBottomShadow: true
			};
		},
		methods: {
			onListScroll(event) {
				this.needBottomShadow = event.target.scrollTop + event.target.clientHeight !== event.target.scrollHeight;
				if (event.target.scrollTop === 0) {
					this.needTopShadow = false;
					return;
				}
				this.needTopShadow = true;
			}
		},
		template: `
		<div class="bx-im-market-show-more-popup-content__scope bx-im-market-show-more-popup-content__container">
			<div v-if="needTopShadow" class="bx-im-market-show-more-popup-content__shadow --top">
				<div class="bx-im-market-show-more-popup-content__shadow-inner"></div>
			</div>
			<div @scroll="onListScroll" class="bx-im-market-show-more-popup-content__items-container">
				<MarketShowMorePopupContentItem
					v-for="item in marketApps"
					:key="item.id"
					:item="item"
					:dialogId="dialogId"
					@appClick="$emit('appClick', item)"
				/>
			</div>
			<div v-if="needBottomShadow" class="bx-im-market-show-more-popup-content__shadow --bottom">
				<div class="bx-im-market-show-more-popup-content__shadow-inner"></div>
			</div>
		</div>
	`
	};

	// @vue/component
	const MarketShowMorePopup = {
		name: 'MarketShowMorePopup',
		components: {
			MessengerPopup: im_v2_component_elements_popup.MessengerPopup,
			MarketShowMorePopupContent
		},
		props: {
			marketApps: {
				type: Array,
				required: true
			},
			dialogId: {
				type: String,
				required: true
			}
		},
		data() {
			return {
				showPopup: false
			};
		},
		computed: {
			// an application from the collapsed list is anchored to the show more button
			openedApp() {
				const openedAppId = this.$store.getters['market/getOpenedAppId'](this.dialogId);
				return this.marketApps.find(app => app.id === openedAppId) ?? null;
			},
			popupConfig() {
				return {
					titleBar: this.$Bitrix.Loc.getMessage('IM_TEXTAREA_MARKET_OTHER_APPS'),
					closeIcon: true,
					width: 302,
					height: 422,
					bindElement: this.$refs['textarea-show-more-market-apps'],
					bindOptions: {
						position: 'top'
					},
					offsetTop: 0,
					offsetLeft: 0,
					padding: 0,
					contentPadding: 0,
					contentBackground: '#fff',
					className: 'bx-im-market-show-more-popup__scope'
				};
			},
			showMoreButtonText() {
				return this.$Bitrix.Loc.getMessage('IM_TEXTAREA_MARKET_APPS_SHOW_MORE_BUTTON').replace('#NUMBER#', this.marketApps.length);
			}
		},
		methods: {
			onAppClick(app) {
				this.showPopup = false;
				if (app.id === this.openedApp?.id) {
					im_v2_lib_market.MarketManager.getInstance().closePlacement(this.dialogId, app.id);
					return;
				}
				this.showPlacement(app);
			},
			showPlacement(app) {
				im_v2_lib_market.MarketManager.getInstance().showPlacement({
					dialogId: this.dialogId,
					appId: app.id,
					bindElement: this.$refs['textarea-show-more-market-apps'],
					width: app.options.width,
					height: app.options.height
				});
			}
		},
		template: `
		<div
			@click="showPopup = true"
			class="bx-im-market-apps-panel__more-items-button"
			:class="{'--active': showPopup, '--opened': openedApp !== null}"
			ref="textarea-show-more-market-apps"
		>
			{{ showMoreButtonText }}
		</div>
		<MessengerPopup
			v-if="showPopup"
			:config="popupConfig"
			@close="showPopup = false"
			id="im-market-apps-more-popup"
		>
			<MarketShowMorePopupContent
				:marketApps="marketApps"
				:dialogId="dialogId"
				@appClick="onAppClick"
			/>
		</MessengerPopup>
	`
	};

	const MAX_EXPANDED_ITEMS = 5;
	const MAX_COLLAPSED_ITEMS = 15;

	// @vue/component
	const MarketAppsPanel = {
		name: 'MarketAppsPanel',
		components: {
			MarketAppItem,
			MarketShowMorePopup,
			RichLoc: ui_vue3_components_richLoc.RichLoc
		},
		props: {
			dialogId: {
				type: String,
				required: true
			}
		},
		computed: {
			marketMenuItems() {
				return im_v2_lib_market.MarketManager.getInstance().getAvailablePlacementsByType(im_v2_const.PlacementType.textarea, this.dialogId);
			},
			marketItemsToShow() {
				const maxItems = this.hideTitle ? MAX_COLLAPSED_ITEMS : MAX_EXPANDED_ITEMS;
				return {
					displayedItems: this.marketMenuItems.slice(0, maxItems),
					hiddenItems: this.marketMenuItems.slice(maxItems)
				};
			},
			hideTitle() {
				return this.marketMenuItems.length > MAX_EXPANDED_ITEMS;
			},
			needMoreButton() {
				return this.marketItemsToShow.hiddenItems.length > 0;
			},
			isEmptyState() {
				return this.marketItemsToShow.displayedItems.length === 0;
			},
			emptyStateText() {
				return this.loc('IM_TEXTAREA_MARKET_APPS_EMPTY_STATE_MSGVER_2');
			}
		},
		beforeUnmount() {
			// the panel is closed or the chat is switched: the placement is only closed, its iframe
			// stays warm in the cache of the manager and opens instantly with its data on the next click
			im_v2_lib_market.MarketManager.getInstance().closeDialogPlacement(this.dialogId);
		},
		methods: {
			onEmptyStateLinkClick() {
				im_v2_lib_market.MarketManager.openChatMarket();
			},
			loc(phraseCode, replacements = {}) {
				return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
			}
		},
		template: `
		<div class="bx-im-market-apps-panel__scope">
			<div v-if="isEmptyState" class="bx-im-market-apps-panel__empty-state-container">
				<div class="bx-im-market-apps-panel__empty-state-icon"></div>
				<div class="bx-im-market-apps-panel__empty-state-text">
					<RichLoc :text="emptyStateText" placeholder="[url]">
						<template #url="{ text }">
							<span class="bx-im-market-apps-panel__empty-state-link" @click="onEmptyStateLinkClick">
								{{ text }}
							</span>
						</template>
					</RichLoc>
				</div>
				<div class="bx-im-market-apps-panel__empty-state-button"></div>
			</div>
			<div v-else class="bx-im-market-apps-panel__container">
				<div class="bx-im-market-apps-panel__items-container" :class="{'--short': hideTitle}">
					<MarketAppItem
						v-for="item in marketItemsToShow.displayedItems"
						:key="item.id"
						:item="item"
						:hideTitle="hideTitle"
						:dialogId="dialogId"
					/>
				</div>
				<MarketShowMorePopup
					v-if="needMoreButton"
					:marketApps="marketItemsToShow.hiddenItems"
					:dialogId="dialogId"
				/>
			</div>
		</div>
	`
	};

	// @vue/component
	const TextareaPanel = {
		name: 'TextareaPanel',
		components: {
			EditPanel,
			ReplyPanel,
			ForwardPanel,
			MarketAppsPanel
		},
		props: {
			dialogId: {
				type: String,
				required: true
			},
			type: {
				type: String,
				required: true
			},
			context: {
				type: Object,
				required: true
			}
		},
		emits: ['close'],
		computed: {
			PanelType: () => im_v2_const.TextareaPanelType,
			configContext() {
				return this.context;
			}
		},
		template: `
		<EditPanel v-if="type === PanelType.edit" :messageId="configContext.messageId" @close="$emit('close')" />
		<ReplyPanel v-if="type === PanelType.reply" :messageId="configContext.messageId" @close="$emit('close')" />
		<ForwardPanel v-if="type === PanelType.forward" :context="configContext" @close="$emit('close')" />
		<MarketAppsPanel v-if="type === PanelType.market" :dialogId="dialogId" />
	`
	};

	// @vue/component
	const SlashCommandItem = {
		name: 'SlashCommandItem',
		components: {
			MentionItem
		},
		props: {
			item: {
				/** @type ImModelCommand */
				type: Object,
				required: true
			},
			selected: {
				type: Boolean,
				default: false
			},
			query: {
				type: String,
				default: ''
			},
			dialogId: {
				type: String,
				default: ''
			},
			isParticipant: {
				type: Boolean,
				default: false
			}
		},
		computed: {
			botId() {
				return String(this.item.botId);
			},
			title() {
				return this.item.params ? `${this.item.command} ${this.item.params}` : this.item.command;
			},
			subtitle() {
				return this.item.title ?? '';
			}
		},
		template: `
		<div :class="{'--selected': selected}" class="bx-im-slash-command-item__container bx-im-mention-item__scope" data-testid="im-textarea-slash-command-item">
			<MentionItem :id="botId">
				<template #title>
					<div class="bx-im-slash-command-item__command" :title="title">{{ title }}</div>
				</template>
				<template #subtitle>
					<div v-if="subtitle" class="bx-im-mention-item__subtitle" :title="subtitle">{{ subtitle }}</div>
				</template>
			</MentionItem>
		</div>
	`
	};

	const ICON_SIZE$4 = 24;

	// @vue/component
	const ErrorState = {
		name: 'SlashCommandErrorState',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			ChatButton: im_v2_component_elements_button.ChatButton
		},
		emits: ['retry'],
		setup() {
			return {
				OutlineIcons: ui_iconSet_api_vue.Outline,
				ButtonSize: im_v2_component_elements_button.ButtonSize,
				ButtonColor: im_v2_component_elements_button.ButtonColor,
				ICON_SIZE: ICON_SIZE$4
			};
		},
		methods: {
			onRetry() {
				this.$emit('retry');
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<div class="bx-im-slash-command-error-state__container" data-testid="im-textarea-slash-command-error">
			<BIcon
				:name="OutlineIcons.EXCLAMATION_CIRCLE"
				:size="ICON_SIZE"
				class="bx-im-slash-command-error-state__icon"
			/>
			<div class="bx-im-slash-command-error-state__content">
				<span class="bx-im-slash-command-error-state__text">
					{{ loc('IM_TEXTAREA_SLASH_COMMAND_ERROR_STATE') }}
				</span>
				<ChatButton
					:size="ButtonSize.S"
					:color="ButtonColor.Link"
					:text="loc('IM_TEXTAREA_SLASH_COMMAND_ERROR_RETRY')"
					data-testid="im-textarea-slash-command-retry-btn"
					@click="onRetry"
				/>
			</div>
		</div>
	`
	};

	// @vue/component
	const EmptyState = {
		name: 'SlashCommandEmptyState',
		methods: {
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<div class="bx-im-slash-command-empty-state__container" data-testid="im-textarea-slash-command-empty">
			<span class="bx-im-slash-command-empty-state__icon"></span>
			<div class="bx-im-slash-command-empty-state__text-block">
				<span class="bx-im-slash-command-empty-state__title">
					{{ loc('IM_TEXTAREA_SLASH_COMMAND_EMPTY_STATE_TITLE') }}
				</span>
				<span class="bx-im-slash-command-empty-state__text">
					{{ loc('IM_TEXTAREA_SLASH_COMMAND_EMPTY_STATE_TEXT') }}
				</span>
			</div>
		</div>
	`
	};

	// Client-side command filters, evaluated over reactive props in SlashCommandPopupContent.
	function getFilteredCommands(allCommands, query, isExtranetUser) {
		let items = allCommands;
		if (isExtranetUser) {
			items = items.filter(command => command.extranet === 'Y');
		}
		const prefix = query.trim().toLowerCase();
		if (prefix.length > 0) {
			items = items.filter(command => command.command.toLowerCase().startsWith(`/${prefix}`));
		}
		return items;
	}

	// notifies the textarea (via the shared emitter) whether the popup currently has selectable items
	const SlashCommandItemsChangedEvent = 'IM:Textarea:slashCommandItemsChanged';

	// @vue/component
	const SlashCommandPopupContent = {
		name: 'SlashCommandPopupContent',
		components: {
			Spinner: im_v2_component_elements_loader.Spinner,
			MentionItemsContainer,
			ContentFooter,
			ErrorState,
			EmptyState
		},
		props: {
			dialogId: {
				type: String,
				required: true
			},
			query: {
				type: String,
				default: ''
			}
		},
		emits: ['close', 'adjustPosition'],
		setup() {
			return {
				SpinnerSize: im_v2_component_elements_loader.SpinnerSize,
				SpinnerColor: im_v2_component_elements_loader.SpinnerColor,
				selectEventType: im_v2_const.EventType.textarea.selectSlashCommand
			};
		},
		computed: {
			allCommands() {
				return this.$store.getters['commands/getByDialogId'](this.dialogId);
			},
			status() {
				return this.$store.getters['commands/getStatus'](this.dialogId);
			},
			isCached() {
				return this.$store.getters['commands/isCached'](this.dialogId);
			},
			isLoading() {
				return this.status === 'loading';
			},
			isError() {
				return this.status === 'error';
			},
			isExtranetUser() {
				const currentUser = this.$store.getters['users/get'](im_v2_application_core.Core.getUserId());
				return currentUser?.extranet === true;
			},
			items() {
				return getFilteredCommands(this.allCommands, this.query, this.isExtranetUser);
			},
			showError() {
				return this.isError && this.allCommands.length === 0;
			},
			isEmptyState() {
				return !this.isLoading && !this.showError && this.items.length === 0;
			},
			showList() {
				return !this.isLoading && !this.showError && !this.isEmptyState;
			},
			showEscHint() {
				return this.showError || this.isEmptyState;
			},
			// discriminant mirroring the template's v-if chain; height only changes between these states
			contentState() {
				if (this.isLoading) {
					return 'loading';
				}
				if (this.showError) {
					return 'error';
				}
				if (this.isEmptyState) {
					return 'empty';
				}
				return 'list';
			}
		},
		watch: {
			// reposition on state transitions only, not on every filtered-list content change
			contentState() {
				void this.adjustPosition();
			},
			items() {
				this.emitItemsState();
			}
		},
		mounted() {
			this.emitItemsState();
		},
		created() {
			this.commandService = new im_v2_provider_service_command.CommandService();
			if (this.isCached) {
				void this.commandService.loadCommands(this.dialogId, {
					silent: true
				});
				return;
			}
			void this.commandService.loadCommands(this.dialogId);
		},
		methods: {
			resolveSlashCommandItem() {
				return SlashCommandItem;
			},
			onItemSelect(item) {
				this.getEmitter().emit(im_v2_const.EventType.textarea.insertMention, {
					dialogId: this.dialogId,
					isMentionSymbol: false,
					textToReplace: `/${this.query}`,
					mentionText: item.command,
					mentionReplacement: item.command,
					registerReplacement: false
				});
			},
			onRetry() {
				void this.commandService.loadCommands(this.dialogId);
			},
			emitItemsState() {
				this.getEmitter().emit(SlashCommandItemsChangedEvent, {
					dialogId: this.dialogId,
					hasItems: this.items.length > 0
				});
			},
			async adjustPosition() {
				await this.$nextTick();
				this.$emit('adjustPosition');
			},
			getEmitter() {
				return this.$Bitrix.eventEmitter;
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<div class="bx-im-slash-command-content__container" :class="{ '--list': showList }">
			<div v-if="isLoading" class="bx-im-slash-command-content__state" data-testid="im-textarea-slash-command-loading">
				<Spinner :size="SpinnerSize.XXS" :color="SpinnerColor.grey"/>
				<span class="bx-im-slash-command-content__state-text">
					{{ loc('IM_TEXTAREA_SLASH_COMMAND_LOADING_STATE') }}
				</span>
			</div>
			<ErrorState v-else-if="showError" @retry="onRetry"/>
			<EmptyState v-else-if="isEmptyState"/>
			<div v-else class="bx-im-slash-command-content__list">
				<MentionItemsContainer
					data-testid="im-textarea-slash-command-list"
					:dialogId="dialogId"
					:query="query"
					:items="items"
					:resolveItemComponent="resolveSlashCommandItem"
					:onItemSelect="onItemSelect"
					:selectEventType="selectEventType"
					@close="$emit('close')"
				/>
			</div>
			<ContentFooter v-if="showList" class="bx-im-slash-command-content__footer"/>
			<div
				v-else-if="showEscHint"
				class="bx-im-slash-command-content__esc-hint"
				data-testid="im-textarea-slash-command-esc-hint"
			>
				<span class="bx-im-slash-command-content__esc-hint-key">Esc</span>
				<span class="bx-im-slash-command-content__esc-hint-description">
					{{ loc('IM_TEXTAREA_MENTION_ESC_CONTROL') }}
				</span>
			</div>
		</div>
	`
	};

	const POPUP_ID$2 = 'im-slash-command-popup';

	// @vue/component
	const SlashCommandPopup = {
		name: 'SlashCommandPopup',
		components: {
			MessengerPopup: im_v2_component_elements_popup.MessengerPopup,
			SlashCommandPopupContent
		},
		props: {
			bindElement: {
				type: Object,
				required: true
			},
			dialogId: {
				type: String,
				required: true
			},
			query: {
				type: String,
				default: ''
			}
		},
		emits: ['close'],
		computed: {
			POPUP_ID: () => POPUP_ID$2,
			config() {
				return {
					width: 426,
					padding: 0,
					bindElement: this.bindElement,
					offsetTop: 2,
					offsetLeft: 0,
					fixed: true,
					bindOptions: {
						position: 'top'
					},
					className: 'bx-im-slash-command-popup__scope'
				};
			}
		},
		template: `
		<MessengerPopup
			:config="config"
			@close="$emit('close');"
			:id="POPUP_ID"
			v-slot="{adjustPosition}"
		>
			<SlashCommandPopupContent
				data-testid="im-textarea-slash-command-popup"
				:dialogId="dialogId"
				:query="query"
				@close="$emit('close');"
				@adjustPosition="adjustPosition()"
			/>
		</MessengerPopup>
	`
	};

	function getCopilotPolicy() {
		return im_v2_application_core.Core.getApplicationData().copilot?.fileUploadPolicy ?? null;
	}
	function getFileUploadPolicy(chatType) {
		switch (chatType) {
			case im_v2_const.ChatType.copilot:
				return getCopilotPolicy();
			default:
				return null;
		}
	}
	function buildPolicyNote(policy) {
		return main_core.Loc.getMessagePlural('IM_TEXTAREA_UPLOAD_POLICY_HINT_LIMITS', policy.maxFilesPerMessage, {
			'#COUNT#': String(policy.maxFilesPerMessage),
			'#SIZE#': im_v2_lib_utils.Utils.file.formatFileSize(policy.maxFileSize)
		});
	}

	const FILE_DIALOG_ID = 'im-file-dialog';
	function mapPickerFiles(items) {
		return items.reduce((files, item) => {
			const id = `n${item.objectId}`;
			files[id] = {
				id,
				name: item.name,
				ext: item.extension ?? '',
				sizeInt: item.size
			};
			return files;
		}, {});
	}

	/* eslint-disable @bitrix24/bitrix24-rules/no-bx */
	// @vue/component
	const DiskPopup = {
		name: 'DiskPopup',
		emits: ['close', 'diskFileSelect'],
		created() {
			if (disk_diskPicker.DiskPicker.isEnabled()) {
				const picker = new disk_diskPicker.DiskPicker();
				let isClosed = false;
				const closeOnce = () => {
					if (isClosed) {
						return;
					}
					isClosed = true;
					this.$emit('close');
				};
				picker.open({
					selectionMode: 'multiple',
					onSelect: ({
						items
					}) => {
						if (items.length === 0) {
							return;
						}
						this.$emit('diskFileSelect', {
							files: mapPickerFiles(items)
						});
					},
					onClose: closeOnce,
					onError: closeOnce
				});
				return;
			}
			if (!BX.DiskFileDialog) {
				console.error('Couldn\'t initialize disk popup');
				return;
			}
			this.subscribeEvents();
			this.open();
		},
		beforeUnmount() {
			this.unsubscribeEvents();
		},
		methods: {
			subscribeEvents() {
				BX.addCustomEvent(BX.DiskFileDialog, 'inited', this.onInited);
				BX.addCustomEvent(BX.DiskFileDialog, 'loadItems', this.onLoadItems);
			},
			unsubscribeEvents() {
				BX.removeCustomEvent(BX.DiskFileDialog, 'inited', this.onInited);
				BX.removeCustomEvent(BX.DiskFileDialog, 'loadItems', this.onLoadItems);
			},
			onInited(name) {
				if (name !== FILE_DIALOG_ID) {
					return;
				}
				BX.DiskFileDialog.obCallback[name] = {
					saveButton: (tab, path, selected) => {
						this.$emit('diskFileSelect', {
							files: selected
						});
					},
					popupDestroy: () => {
						this.unsubscribeEvents();
						this.$emit('close');
					}
				};
				BX.DiskFileDialog.openDialog(name);
			},
			onLoadItems(link, name) {
				if (name !== FILE_DIALOG_ID) {
					return;
				}
				BX.DiskFileDialog.target[name] = link.replace('/bitrix/tools/disk/uf.php', '/bitrix/components/bitrix/im.messenger/file.ajax.php');
			},
			open() {
				main_core.ajax({
					url: `/bitrix/components/bitrix/im.messenger/file.ajax.php?action=selectFile&dialogName=${FILE_DIALOG_ID}`,
					method: 'GET',
					skipAuthCheck: true,
					timeout: 30
				});
			}
		},
		template: '<template></template>'
	};

	const ICON_SIZE$3 = 24;
	const DOCUMENT_SIGN_SLIDER_URL = '/sign/doc/0/?chat_id=';

	// @vue/component
	const UploadMenu = {
		components: {
			IconButton: im_v2_component_elements_iconButton.IconButton,
			MessengerMenu: im_v2_component_elements_menu.MessengerMenu,
			MenuItem: im_v2_component_elements_menu.MenuItem,
			DiskPopup,
			Text2Xs: ui_system_typography_vue.Text2Xs
		},
		props: {
			dialogId: {
				type: String,
				required: true
			},
			disabled: {
				type: Boolean,
				default: false
			}
		},
		emits: ['fileSelect', 'diskFileSelect'],
		data() {
			return {
				showMenu: false,
				showDiskPopup: false
			};
		},
		computed: {
			OutlineIcons: () => ui_iconSet_api_vue.Outline,
			ICON_SIZE: () => ICON_SIZE$3,
			menuItems() {
				return [{
					icon: im_v2_component_elements_menu.MenuItemIcon.file,
					title: this.loc('IM_TEXTAREA_SELECT_LOCAL_FILE'),
					testId: 'im-upload-menu-local-file-item',
					clickHandler: this.onSelectLocalFile
				}, {
					icon: im_v2_component_elements_menu.MenuItemIcon.b24,
					title: this.loc('IM_TEXTAREA_SELECT_FILE_FROM_B24'),
					testId: 'im-upload-menu-b24-file-item',
					clickHandler: this.onSelectFromB24,
					showCondition: () => !this.isGuest
				}, {
					icon: im_v2_component_elements_menu.MenuItemIcon.task,
					title: this.loc('IM_TEXTAREA_SELECT_TASK'),
					testId: 'im-upload-menu-task-item',
					clickHandler: this.onCreateTaskClick,
					showCondition: () => !this.isCopilotChat && !this.isGuest
				}, {
					icon: im_v2_component_elements_menu.MenuItemIcon.meeting,
					title: this.loc('IM_TEXTAREA_SELECT_MEETING'),
					testId: 'im-upload-menu-meeting-item',
					clickHandler: this.onCreateMeetingClick,
					showCondition: () => !this.isCopilotChat && !this.isGuest
				}, {
					icon: im_v2_component_elements_menu.MenuItemIcon.calendarSlot,
					title: this.loc('IM_TEXTAREA_SELECT_CALENDAR_SLOT'),
					testId: 'im-upload-menu-calendar-slot-item',
					clickHandler: this.onCreateCalendarSlotClick,
					showCondition: () => this.isCalendarSlotAvailable && !this.isGuest
				}, {
					icon: im_v2_component_elements_menu.MenuItemIcon.documentSign,
					title: this.loc('IM_TEXTAREA_SELECT_DOCUMENT_SIGN'),
					testId: 'im-upload-menu-document-sign-item',
					clickHandler: this.onCreateDocumentSignClick,
					showCondition: () => this.isDocumentSignAvailable && !this.isGuest
				}, {
					icon: im_v2_component_elements_menu.MenuItemIcon.vote,
					title: this.loc('IM_TEXTAREA_SELECT_VOTE'),
					testId: 'im-upload-menu-vote-item',
					clickHandler: this.onCreateVoteClick,
					showCondition: () => this.isVoteCreationAvailable && !this.isGuest
				}];
			},
			availableMenuItems() {
				return this.menuItems.filter(item => {
					if (!main_core.Type.isFunction(item.showCondition)) {
						return true;
					}
					return item.showCondition();
				});
			},
			menuConfig() {
				return {
					width: 278,
					bindElement: this.$refs.upload || {},
					bindOptions: {
						position: 'top'
					},
					offsetTop: 30,
					offsetLeft: -10,
					padding: 0
				};
			},
			dialog() {
				return this.$store.getters['chats/get'](this.dialogId, true);
			},
			chatType() {
				return this.dialog.type;
			},
			isCopilotChat() {
				return this.chatType === im_v2_const.ChatType.copilot;
			},
			chatId() {
				return this.dialog.chatId;
			},
			isDocumentSignAvailable() {
				const isActiveFeature = im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.documentSignAvailable);
				if (!isActiveFeature) {
					return false;
				}
				return im_v2_lib_permission.PermissionManager.getInstance().canPerformActionByRole(im_v2_const.ActionByRole.createDocumentSign, this.dialogId);
			},
			isCalendarSlotAvailable() {
				return im_v2_lib_permission.PermissionManager.getInstance().canPerformActionByRole(im_v2_const.ActionByRole.createCalendarSlots, this.dialogId);
			},
			isVoteCreationAvailable() {
				if (!vote_application.VoteApplication?.canCreateVoteInChat(this.chatType)) {
					return false;
				}
				return im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.voteCreationAvailable);
			},
			iconColor() {
				if (this.showMenu) {
					return im_v2_const.Color.accentBlue;
				}
				return im_v2_const.Color.gray40;
			},
			isGuest() {
				return this.$store.getters['users/isGuest'](im_v2_application_core.Core.getUserId());
			},
			acceptAttribute() {
				return this.uploadManager.getAcceptAttribute(this.dialogId);
			},
			uploadPolicyNote() {
				const policy = getFileUploadPolicy(this.chatType);
				if (policy === null) {
					return null;
				}
				return buildPolicyNote(policy);
			},
			attachLabel() {
				return this.loc('IM_TEXTAREA_ICON_UPLOAD_TITLE');
			}
		},
		created() {
			this.uploadManager = new im_v2_lib_uploading.UploadManager();
		},
		methods: {
			onSelectLocalFile() {
				this.$refs.fileInput.click();
				this.showMenu = false;
			},
			onSelectFromB24() {
				this.showDiskPopup = true;
				this.showMenu = false;
			},
			onFileSelect(event) {
				this.$emit('fileSelect', {
					event
				});
				this.showMenu = false;
			},
			onDiskFileSelect(event) {
				this.$emit('diskFileSelect', event);
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			},
			getEntityCreator() {
				if (!this.entityCreator) {
					this.entityCreator = new im_v2_lib_entityCreator.EntityCreator(this.chatId);
				}
				return this.entityCreator;
			},
			onCreateTaskClick() {
				void this.getEntityCreator().createTaskForChat();
				im_v2_lib_analytics.Analytics.getInstance().chatEntities.onCreateTaskFromTextareaClick(this.dialogId);
				this.showMenu = false;
			},
			onCreateMeetingClick() {
				void this.getEntityCreator().createMeetingForChat();
				im_v2_lib_analytics.Analytics.getInstance().chatEntities.onCreateEventFromTextareaClick(this.dialogId);
				this.showMenu = false;
			},
			onUploadButtonClick() {
				if (this.showMenu !== true) {
					im_v2_lib_analytics.Analytics.getInstance().attachMenu.onOpenUploadMenu(this.dialogId);
				}
				this.showMenu = true;
			},
			async onCreateCalendarSlotClick(event) {
				if (!calendar_sharing_interface.GroupSharingController) {
					return;
				}
				const collabInfo = im_v2_application_core.Core.getStore().getters['chats/collabs/getByChatId'](this.chatId);
				if (!collabInfo || !collabInfo.collabId) {
					return;
				}
				try {
					const groupSharing = await calendar_sharing_interface.GroupSharingController.getGroupSharing(collabInfo.collabId, event.target);
					groupSharing.openDialog();
					this.showMenu = false;
				} catch (errors) {
					im_v2_lib_notifier.Notifier.onDefaultError();
					console.error('ChatTextarea: UploadMenu: select slots error', errors);
				}
			},
			onCreateDocumentSignClick() {
				const preparedUrl = DOCUMENT_SIGN_SLIDER_URL + this.chatId;
				BX.SidePanel.Instance.open(preparedUrl, {
					cacheable: false
				});
			},
			onCreateVoteClick() {
				const analyticsInstance = im_v2_lib_analytics.Analytics.getInstance();
				const analyticsParams = analyticsInstance.vote.getSerializedParams(this.dialogId);
				const preparedUrl = `/bitrix/components/bitrix/voting.im.edit/slider.php?chatId=${this.chatId}&${analyticsParams}`;
				BX.SidePanel.Instance.open(preparedUrl, {
					cacheable: false,
					width: 600,
					allowChangeHistory: false
				});
				im_v2_lib_analytics.Analytics.getInstance().chatEntities.onCreateVoteFromTextareaClick(this.dialogId);
				this.showMenu = false;
			}
		},
		template: `
		<div ref="upload" class="bx-im-textarea__icon-container">
			<IconButton
				:iconName="OutlineIcons.ATTACH"
				:label="attachLabel"
				:iconColor="iconColor"
				:iconSize="ICON_SIZE"
				:expanded="showMenu"
				:disabled="disabled"
				class="bx-im-textarea__icon"
				data-testid="im-upload-menu-attach-btn"
				@click="onUploadButtonClick"
			/>
		</div>
		<MessengerMenu v-if="showMenu" :config="menuConfig" @close="showMenu = false" className="bx-im-file-menu__scope">
			<MenuItem
				v-for="item in availableMenuItems"
				:icon="item.icon"
				:title="item.title"
				:data-testid="item.testId"
				@click="item.clickHandler"
			/>
			<input
				type="file"
				@change="onFileSelect"
				multiple
				class="bx-im-file-menu__file-input"
				ref="fileInput"
				:accept="acceptAttribute || undefined"
				data-testid="im-upload-menu-file-input"
			>
			<template #footer>
				<Text2Xs
					v-if="uploadPolicyNote"
					tag="div"
					wrap="break-words"
					role="note"
					className="bx-im-file-menu__policy-note"
					data-testid="im-upload-menu-policy-note"
				>
					{{ uploadPolicyNote }}
				</Text2Xs>
			</template>
		</MessengerMenu>
		<DiskPopup v-if="showDiskPopup" @diskFileSelect="onDiskFileSelect" @close="showDiskPopup = false"/>
	`
	};

	// @vue/component
	const AddMoreButton = {
		name: 'AddMoreButton',
		directives: {
			'b-tooltip': ui_system_tooltip_vue.vBTooltip
		},
		components: {
			UiButton: ui_vue3_components_button.Button
		},
		props: {
			dialogId: {
				type: String,
				required: true
			},
			// the way in is refused, and the button says so by going out instead of leaving the window
			disabled: {
				type: Boolean,
				default: false
			},
			// why it is out. Shown in the tooltip and read out as the description of the control
			disabledReason: {
				type: String,
				default: ''
			}
		},
		emits: ['filesSelected'],
		computed: {
			OutlineIcons: () => ui_iconSet_api_core.Outline,
			ButtonSize: () => ui_vue3_components_button.ButtonSize,
			AirButtonStyle: () => ui_vue3_components_button.AirButtonStyle,
			acceptAttribute() {
				return this.uploadManager.getAcceptAttribute(this.dialogId);
			},
			// an empty content is what the directive reads as "no tooltip here", so the enabled button carries none
			tooltipContent() {
				return this.disabled ? this.disabledReason : '';
			}
		},
		created() {
			this.uploadManager = new im_v2_lib_uploading.UploadManager();
		},
		methods: {
			selectFiles() {
				if (this.disabled) {
					return;
				}
				this.$refs.fileInput.click();
			},
			// the popup owns the add path of the batch, the button only hands the selection over
			onFileSelect(event) {
				const input = event.target;
				const files = Object.values(input.files);
				// without the reset picking the same file again fires no change event
				input.value = '';
				this.$emit('filesSelected', files);
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		// A disabled <button> is out of the tab order and takes no pointer events, so a tooltip on it would
		// never be raised by either of them. So the wrapper answers for the button while it is out: it takes
		// its name, says that it is unavailable and carries the reason - by the cursor and by the focus alike.
		template: `
		<div
			v-b-tooltip="tooltipContent"
			class="bx-im-upload-preview__add-more"
			data-testid="im-upload-preview-add-more"
			:role="disabled ? 'button' : undefined"
			:tabindex="disabled ? 0 : undefined"
			:aria-disabled="disabled ? 'true' : undefined"
			:aria-label="disabled ? loc('IM_TEXTAREA_UPLOAD_PREVIEW_POPUP_ADD_MORE') : undefined"
		>
			<UiButton
				:text="loc('IM_TEXTAREA_UPLOAD_PREVIEW_POPUP_ADD_MORE')"
				:leftIcon="OutlineIcons.ATTACH"
				:size="ButtonSize.SMALL"
				:style="AirButtonStyle.OUTLINE_NO_ACCENT"
				:disabled="disabled"
				:dataset="{ testid: 'im-upload-preview-add-more-btn' }"
				@click="selectFiles"
			/>
			<!-- The input is the mechanism behind the button, not a control of its own: the button carries the
					 name and the Tab stop, the input only opens the system picker. Stated in the markup rather
					 than left to the display: none of the stylesheet, so a keyboard user never lands on a
					 nameless second control if that stylesheet ever loads late or not at all. -->
			<input
				ref="fileInput"
				type="file"
				multiple
				class="bx-im-upload-preview__add-more-input"
				data-testid="im-upload-preview-add-more-input"
				tabindex="-1"
				aria-hidden="true"
				:accept="acceptAttribute || undefined"
				@change="onFileSelect"
			>
		</div>
	`
	};

	// @vue/component
	const FilePreviewItem = {
		name: 'FilePreviewItem',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			ProgressBar: im_v2_component_elements_progressbar.ProgressBar,
			Text2Xs: ui_system_typography_vue.Text2Xs
		},
		inheritAttrs: false,
		props: {
			file: {
				type: Object,
				required: true
			},
			// the mockup of the feature belongs to an edit: a send keeps the row it always had
			isEditMode: {
				type: Boolean,
				default: false
			},
			maxNameLength: {
				type: Number,
				default: 25
			},
			// the batch is on its way to the server, and the row says how far its own file has got
			handleLoading: {
				type: Boolean,
				default: false
			},
			// takes the place of the size when the row has something to say about the file instead of its weight
			statusText: {
				type: String,
				default: ''
			}
		},
		setup() {
			return {
				ProgressBarSize: im_v2_component_elements_progressbar.ProgressBarSize,
				OutlineIcons: ui_iconSet_api_vue.Outline
			};
		},
		computed: {
			// a file that never arrived shows no format badge: its type says nothing about what happened
			fileIconClass() {
				const icon = this.hasFailedUpload ? 'empty' : this.file.icon;
				return `ui-icon ui-icon-file-${icon}`;
			},
			// the status takes the place of the size, and only a failed upload fills it
			hasStatus() {
				return main_core.Type.isStringFilled(this.statusText);
			},
			// what the mockup of the failed row changes is drawn in an edit and nowhere else
			hasFailedUpload() {
				return this.isEditMode && this.hasStatus;
			},
			fileShortName() {
				return im_v2_lib_utils.Utils.file.getShortFileName(this.file.name, this.maxNameLength);
			},
			fileSize() {
				return im_v2_lib_utils.Utils.file.formatFileSize(this.file.size);
			},
			// a file that never arrived has nothing to show: the mockup keeps the empty emblem on its row
			hasPreview() {
				return !this.hasFailedUpload && main_core.Type.isStringFilled(this.file.urlPreview);
			},
			imageStyles() {
				return {
					backgroundImage: `url(${this.file.urlPreview})`
				};
			},
			validationErrorText() {
				return this.file.validationError ?? '';
			}
		},
		template: `
		<div class="bx-im-upload-preview-file-item__content">
			<div class="bx-im-upload-preview-file-item__file-container" v-bind="$attrs">
				<div class="bx-im-upload-preview-file-item__icon">
					<div v-if="hasPreview" :style="imageStyles" class="bx-im-upload-preview-file-item__preview"></div>
					<div v-else :class="fileIconClass"><i></i></div>
					<ProgressBar
						v-if="handleLoading"
						:item="file"
						:size="ProgressBarSize.S"
						:allowCancel="false"
					/>
				</div>
				<div class="bx-im-upload-preview-file-item__info">
					<div class="bx-im-upload-preview-file-item__name">{{ fileShortName }}</div>
					<div
						v-if="hasStatus"
						class="bx-im-upload-preview-file-item__status"
						data-testid="im-upload-preview-file-status"
					>
						<template v-if="isEditMode">
							<BIcon
								:name="OutlineIcons.EXCLAMATION_CIRCLE"
								class="bx-im-upload-preview-file-item__status-icon"
							/>
							<Text2Xs className="bx-im-upload-preview-file-item__status-text">{{ statusText }}</Text2Xs>
							<Text2Xs className="bx-im-upload-preview-file-item__status-size">· {{ fileSize }}</Text2Xs>
						</template>
						<template v-else>{{ statusText }} · {{ fileSize }}</template>
					</div>
					<div v-else class="bx-im-upload-preview-file-item__size">{{ fileSize }}</div>
				</div>
			</div>
			<div v-if="validationErrorText" class="bx-im-upload-preview-file-item__validation-error">
				{{ validationErrorText }}
			</div>
		</div>
	`
	};

	// @vue/component
	const FileItem = {
		name: 'FileItem',
		components: {
			FilePreviewItem,
			IconButton: im_v2_component_elements_iconButton.IconButton,
			BIcon: ui_iconSet_api_vue.BIcon
		},
		props: {
			file: {
				type: Object,
				required: true
			},
			// the window of an edit draws its rows by the mockup of the feature; a send keeps its own look
			isEditMode: {
				type: Boolean,
				default: false
			},
			removable: {
				type: Boolean,
				default: false
			},
			// the batch is on its way to the server, and the row says how far its own file has got
			handleLoading: {
				type: Boolean,
				default: false
			},
			highlightDropzone: {
				type: Object,
				default: null
			},
			viewerGroupBy: {
				type: String || null,
				default: null
			},
			// id of the shared hint telling that Delete removes the focused file
			describedById: {
				type: String,
				default: null
			}
		},
		emits: ['removeItem', 'retryItem', 'itemDragStart', 'itemDragEnd', 'itemDragOver', 'itemDragLeave', 'itemDrop'],
		data() {
			return {
				isDraggable: false
			};
		},
		computed: {
			removeIconName: () => ui_iconSet_api_core.Outline.CROSS_L,
			removeIconColor: () => im_v2_const.Color.gray90,
			removeButtonLabel() {
				return this.loc('IM_TEXTAREA_UPLOAD_PREVIEW_REMOVE_FILE_ARIA', {
					'#FILE_NAME#': this.file.name
				});
			},
			hasError() {
				return this.file.status === im_v2_const.FileStatus.error;
			},
			hasValidationError() {
				return Boolean(this.file.validationError);
			},
			// the icon says nothing on its own, and rows of one batch differ only by the file they hold
			removeLabel() {
				return this.$Bitrix.Loc.getMessage('IM_TEXTAREA_UPLOAD_PREVIEW_POPUP_FILE_REMOVE_ARIA', {
					'#FILE_NAME#': this.file.name
				});
			},
			OutlineIcons: () => ui_iconSet_api_vue.Outline,
			// the row of a failed file keeps its name and says what became of it where the size used to be;
			// the weight follows the reason in its own colour, so the row renders the two apart
			errorStatusText() {
				if (!this.hasError) {
					return '';
				}
				return this.$Bitrix.Loc.getMessage('IM_TEXTAREA_UPLOAD_PREVIEW_POPUP_FILE_NOT_UPLOADED');
			},
			retryLabel() {
				return this.$Bitrix.Loc.getMessage('IM_TEXTAREA_UPLOAD_PREVIEW_POPUP_FILE_UPLOAD_RETRY_ARIA', {
					'#FILE_NAME#': this.file.name
				});
			},
			draggableClasses() {
				const classes = {};
				if (this.highlightDropzone.fileId === this.file.id) {
					classes[`--dropzone-${this.highlightDropzone.position}`] = true;
				}
				classes['--draggable'] = this.isDraggable;
				return classes;
			},
			viewerAttributes() {
				// a file that failed to upload has nothing to show, and the viewer listens for clicks on the
				// document in the capture phase: its handler would run before anything inside the row could stop
				// the event, so the retry of that very row would open the viewer instead of repeating the upload
				if (this.hasError) {
					return {};
				}
				if (this.file.viewerAttrs) {
					return im_v2_lib_utils.Utils.file.getViewerDataAttributes({
						viewerAttributes: this.file.viewerAttrs,
						previewImageSrc: this.file.urlPreview,
						context: im_v2_const.FileViewerContext.dialog
					});
				}
				return im_v2_lib_utils.Utils.file.getViewerDataAttributes({
					viewerAttributes: {
						viewer: true,
						viewerResized: true,
						viewerType: this.file.type,
						title: this.file.name,
						src: this.file.urlDownload,
						viewerGroupBy: this.viewerGroupBy
					},
					previewImageSrc: this.file.urlPreview,
					context: im_v2_const.FileViewerContext.dialog
				});
			}
		},
		methods: {
			onRemoveClick() {
				this.$emit('removeItem', {
					file: this.file
				});
			},
			onRetryClick() {
				this.$emit('retryItem', {
					file: this.file
				});
			},
			onDragStart(event) {
				this.$emit('itemDragStart', {
					file: this.file,
					axis: 'y',
					event
				});
				this.isDraggable = true;
			},
			onDragEnd(event) {
				this.$emit('itemDragEnd', {
					file: this.file,
					axis: 'y',
					event
				});
				this.isDraggable = false;
				event.target.removeAttribute('draggable');
			},
			onDragOver(event) {
				this.$emit('itemDragOver', {
					file: this.file,
					axis: 'y',
					event
				});
			},
			onDragLeave(event) {
				this.$emit('itemDragLeave', {
					file: this.file,
					axis: 'y',
					event
				});
			},
			onDrop(event) {
				this.$emit('itemDrop', {
					file: this.file,
					axis: 'y',
					event
				});
				this.isDraggable = false;
			},
			onMouseDown() {
				this.$refs.dragElement.setAttribute('draggable', 'true');
			},
			loc(phraseCode, replacements = {}) {
				return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
			}
		},
		template: `
		<div
			class="bx-im-upload-preview-file-item__scope"
			:class="[this.draggableClasses, { '--has-validation-error': hasValidationError, '--has-upload-error': hasError }]"
			role="gridcell"
			:aria-label="file.name"
			aria-keyshortcuts="Delete"
			:aria-describedby="describedById"
			:data-testid="'im-upload-preview-file-item-' + file.id"
			:data-id="file.id"
			tabindex="-1"
			@dragstart="onDragStart"
			@dragend="onDragEnd"
			@dragover="onDragOver"
			@dragleave="onDragLeave"
			@drop="onDrop"
			ref="dragElement"
		>
			<div
				class="bx-im-upload-preview-file-item__drag"
				data-testid="im-upload-preview-file-drag-handle"
				aria-hidden="true"
				@mousedown="onMouseDown"
			>
				<div class="bx-im-upload-preview-file-item__drag-icon"></div>
			</div>
			<FilePreviewItem
				:file="file"
				:isEditMode="isEditMode"
				:handleLoading="handleLoading && !hasError"
				:statusText="errorStatusText"
				v-bind="viewerAttributes"
			/>
			<button
				v-if="hasError"
				type="button"
				class="bx-im-upload-preview-file-item__retry"
				data-testid="im-upload-preview-file-retry-btn"
				:aria-label="retryLabel"
				tabindex="-1"
				@click="onRetryClick"
			>
				<BIcon :name="OutlineIcons.REFRESH" />
			</button>
			<IconButton
				v-if="removable || hasValidationError || hasError"
				class="bx-im-upload-preview-file-item__remove"
				data-testid="im-upload-preview-file-item-remove-btn"
				:iconName="removeIconName"
				:iconColor="removeIconColor"
				:label="removeButtonLabel"
				:tabindex="-1"
				@click="onRemoveClick"
			/>
		</div>
	`
	};

	const ICON_SIZE$2 = 24;

	// @vue/component
	const PreviewDropZone = {
		name: 'PreviewDropZone',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		props: {
			container: {
				type: Object,
				default: null
			},
			// the internal reorder drag rides the same events, so it switches the zone off
			disabled: {
				type: Boolean,
				default: false
			}
		},
		emits: ['filesDropped'],
		data() {
			return {
				showDropZone: false,
				lastEnterTarget: null
			};
		},
		computed: {
			OutlineIcons: () => ui_iconSet_api_vue.Outline,
			ICON_SIZE: () => ICON_SIZE$2
		},
		watch: {
			container: {
				immediate: true,
				handler(container) {
					this.unbindEvents();
					if (main_core.Type.isElementNode(container)) {
						this.bindEvents(container);
					}
				}
			},
			disabled(disabled) {
				if (disabled) {
					this.showDropZone = false;
				}
			}
		},
		created() {
			this.boundContainer = null;
		},
		beforeUnmount() {
			this.unbindEvents();
		},
		methods: {
			bindEvents(container) {
				this.boundContainer = container;
				main_core.Event.bind(container, 'dragenter', this.onDragEnter);
				main_core.Event.bind(container, 'dragleave', this.onDragLeave);
				main_core.Event.bind(container, 'dragover', this.onDragOver);
				main_core.Event.bind(container, 'drop', this.onDrop);
			},
			unbindEvents() {
				if (!this.boundContainer) {
					return;
				}
				main_core.Event.unbind(this.boundContainer, 'dragenter', this.onDragEnter);
				main_core.Event.unbind(this.boundContainer, 'dragleave', this.onDragLeave);
				main_core.Event.unbind(this.boundContainer, 'dragover', this.onDragOver);
				main_core.Event.unbind(this.boundContainer, 'drop', this.onDrop);
				this.boundContainer = null;
			},
			async onDragEnter(event) {
				event.preventDefault();
				if (this.disabled) {
					return;
				}

				// the target is taken before the check, so a dragleave arriving during it cancels this enter
				const enterTarget = event.target;
				this.lastEnterTarget = enterTarget;
				const onlyFiles = await ui_uploader_core.hasDataTransferOnlyFiles(event.dataTransfer, false);
				if (!onlyFiles || this.lastEnterTarget !== enterTarget) {
					return;
				}
				this.showDropZone = true;
			},
			onDragLeave(event) {
				if (this.lastEnterTarget !== event.target) {
					return;
				}
				this.lastEnterTarget = null;
				this.showDropZone = false;
			},
			onDragOver(event) {
				// without this the browser opens the dropped file instead of firing drop
				event.preventDefault();
			},
			async onDrop(event) {
				event.preventDefault();
				this.showDropZone = false;
				if (this.disabled) {
					return;
				}

				// a dropped folder is browsed into its files, the same as the chat drop area does
				const files = await ui_uploader_core.getFilesFromDataTransfer(event.dataTransfer);
				if (main_core.Type.isArrayFilled(files)) {
					this.$emit('filesDropped', files);
				}
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<Transition name="preview-drop-zone-fade">
			<div
				v-if="showDropZone"
				class="bx-im-upload-preview-drop-zone__container"
				data-testid="im-upload-preview-drop-zone"
			>
				<BIcon
					:name="OutlineIcons.CURSOR_CLICK"
					:size="ICON_SIZE"
					color="var(--ui-color-base-3)"
				/>
				<span class="bx-im-upload-preview-drop-zone__text">
					{{ loc('IM_TEXTAREA_UPLOAD_PREVIEW_POPUP_DROP_ZONE') }}
				</span>
			</div>
		</Transition>
	`
	};

	// a file still being read or on its way up has no id yet for the composition of a message
	const UNSETTLED_STATUSES = new Set([im_v2_const.FileStatus.preparing, im_v2_const.FileStatus.progress, im_v2_const.FileStatus.upload]);

	// the mockup of the emptied edit sizes the illustration to the height of an attachment row
	const EMPTY_ILLUSTRATION_SIZE = 44;
	// mirrors MAX_FILES_COUNT of im.v2.lib.uploading, which owns the limit and enforces it;
	// kept local on purpose: a stale cached lib bundle would silently turn the warning off
	const MAX_FILES_COUNT = 100;
	// the server owns this limit and refuses a composition above it; it is kept local as MAX_FILES_COUNT is
	const MAX_FILES_COUNT_IN_MESSAGE = 10;
	const LOCAL_SESSION_ORIGIN = 'local';
	const REMOVE_BUTTON_SELECTOR = '.bx-im-upload-preview-file-item__remove';
	const TEXT_LIMIT_COUNTER_SHOW_RANGE = 200;
	// the height one row of the batch keeps for itself: MIN_PREVIEW_HEIGHT of the gallery rows
	// (im.v2.component.elements.media-gallery, not exported) and the row height of a FileItem
	const MIN_PREVIEW_HEIGHT = 58;
	const WINDOW_RESIZE_DELAY = 100;
	// the preview block is 364px wide inside the popup padding, minus the scrollbar gutter on both sides
	const GALLERY_WIDTH = 352;
	// the indeterminate line of the save, sized to stand beside its caption rather than span the window
	const SAVING_LOADER_WIDTH = 56;
	const SAVING_LOADER_HEIGHT = 16;
	const TextareaHeight$1 = {
		max: 208,
		min: 32
	};
	const COMPRESS_CHECKBOX_ID = 'im-upload-preview-send-as-file';
	const DELETE_HINT_ID = 'im-upload-preview-delete-hint';

	// Roving focus over the preview collection: the dialog enters it with one Tab, then the arrows move a
	// roving tabindex from tile to tile. The tile is the only stop - its remove cross stays out of the set
	// (tabindex="-1") and mouse-only. Both branches are one ARIA grid of real role="row" markup, so a single
	// GridFocusZone drives them: the media tiles in two dimensions, the file rows in a single column.
	const FILE_ITEM_SELECTOR = '.bx-im-upload-preview-file-item__scope';
	const MEDIA_ITEM_SELECTOR = '.bx-im-elements-media-gallery__item';
	// A focused tile of either branch, so the zone and the Delete handler share one idea of what a cell is.
	const CELL_SELECTOR = `${FILE_ITEM_SELECTOR}, ${MEDIA_ITEM_SELECTOR}`;

	// Take the Vue component from the parent ui.system.checkbox extension: it creates
	// the BX.UI.System.Checkbox namespace and re-exports the Vue component (export * as Vue).
	// A direct import from ui.system.checkbox.vue crashes at runtime — it has an empty rel.
	const Checkbox = ui_system_checkbox.Vue.Checkbox;

	// @vue/component
	const UploadPreviewContent = {
		name: 'UploadPreviewContent',
		inject: ['mentionGridIds'],
		components: {
			AddMoreButton,
			BIcon: ui_iconSet_api_vue.BIcon,
			Checkbox,
			FileItem,
			FormatToolbar,
			LineLoader: im_v2_component_elements_loader.LineLoader,
			MentionPopup,
			PreviewDropZone,
			SendButton: im_v2_component_elements_sendButton.SendButton,
			MediaGallery: im_v2_component_elements_mediaGallery.MediaGallery,
			Text2Xs: ui_system_typography_vue.Text2Xs,
			TextMd: ui_system_typography_vue.TextMd,
			TextXs: ui_system_typography_vue.TextXs,
			UiIllustration: ui_system_illustration_vue.Illustration
		},
		props: {
			dialogId: {
				type: String,
				required: true
			},
			sessionId: {
				type: String,
				required: true
			},
			textareaValue: {
				type: String,
				required: false,
				default: ''
			},
			draftKey: {
				type: String,
				required: true
			},
			mentionReplacementMap: {
				/** @type MentionReplacementMap | null */
				type: Object,
				default: null
			},
			withCopilot: {
				type: Boolean,
				default: true
			},
			// the message whose attachments are being edited; without it the batch is a new message
			editedMessageId: {
				type: [Number, null],
				default: null
			},
			// the save of the composition is under way: the batch has been taken and cannot be changed
			isSaving: {
				type: Boolean,
				default: false
			},
			// a file leaving the batch takes the copy it got in the chat folder with it - unless the composition
			// of this batch has reached the server already, and the message may be carrying that copy now
			canRemoveFilesFromServer: {
				type: Boolean,
				default: true
			}
		},
		emits: ['sendFiles', 'saveFiles', 'close', 'update:filesCount'],
		setup() {
			return {
				CheckboxSize: ui_system_checkbox.CheckboxSize,
				EMPTY_ILLUSTRATION_SIZE,
				IllustrationName: ui_system_illustration_vue.IllustrationName,
				OutlineIcons: ui_iconSet_api_vue.Outline
			};
		},
		data() {
			return {
				text: '',
				showMention: false,
				mentionQuery: '',
				mentionActiveItemId: null,
				showFormatToolbar: false,
				formatToolbarPosition: {},
				sendAsFile: false,
				// the label is tied to the checkbox by id, and two mounted textareas must not share one
				compressCheckboxId: `${COMPRESS_CHECKBOX_ID}-${im_v2_lib_utils.Utils.text.getUuidV4()}`,
				// every cell of the collection describes itself by this id, so it is per-instance for the same reason
				deleteHintId: `${DELETE_HINT_ID}-${im_v2_lib_utils.Utils.text.getUuidV4()}`,
				order: [],
				// the caption field holds focus: what the ring of its wrapper is drawn from (see the stylesheet)
				isCaptionFocused: false,
				textareaHeight: TextareaHeight$1.min,
				textareaResizedHeight: 0,
				draggedItemEvent: null,
				lastTargetItem: null,
				lastTargetPosition: null,
				highlightDropzone: {},
				draggedFile: null,
				axis: 'x',
				insertPosition: null,
				dropZoneContainer: null
			};
		},
		computed: {
			GALLERY_WIDTH: () => GALLERY_WIDTH,
			SAVING_LOADER_WIDTH: () => SAVING_LOADER_WIDTH,
			SAVING_LOADER_HEIGHT: () => SAVING_LOADER_HEIGHT,
			TextareaTarget: () => im_v2_const.TextareaTarget,
			isEditMode() {
				return this.editedMessageId !== null;
			},
			// an emptied edit keeps the window open, and the window says so instead of showing a blank list;
			// a send with nothing left closes itself, so the state belongs to the edit alone
			isEmptyComposition() {
				return this.isEditMode && this.filesCount === 0;
			},
			isMentionAvailable() {
				// without the dialog map the mention would be sent as plain text, so both are required
				if (!this.mentionReplacementMap) {
					return false;
				}
				return im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isUploadCaptionMentionsFormatAvailable);
			},
			mentionComboboxAttrs() {
				if (!this.isMentionAvailable || !this.showMention) {
					return {};
				}
				const gridRendered = this.mentionActiveItemId !== null;
				return {
					'aria-haspopup': 'grid',
					'aria-autocomplete': 'list',
					'aria-controls': gridRendered ? this.mentionGridIds.gridId : null,
					'aria-activedescendant': this.mentionActiveItemId
				};
			},
			isFormatAvailable() {
				return im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isUploadCaptionMentionsFormatAvailable);
			},
			isMarkdownInputAvailable() {
				return im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isMarkdownAvailable);
			},
			// the session keeps its files outside Vue reactivity, so the store keys are what
			// makes the batch composition reactive: a file joining it adds a key here
			...ui_vue3_vuex.mapState({
				storeFileIds: state => Object.keys(state.files.collection)
			}),
			sessionFiles() {
				const knownFileIds = new Set(this.storeFileIds);
				return this.getUploadingService().getPreviewSessionFiles(this.sessionId).filter(file => knownFileIds.has(file.getId()));
			},
			// a disk batch is never composed in the popup, so files can only be added to a local one, and a
			// batch taken for the save is not composed any more
			canComposeFiles() {
				if (this.isSaving) {
					return false;
				}
				return this.getUploadingService().getPreviewSessionOrigin(this.sessionId) === LOCAL_SESSION_ORIGIN;
			},
			// a batch at its limit takes no more - a message older than the feature may hold more than the limit
			canAddFiles() {
				return this.canComposeFiles && !this.isAtMaxFilesLimit;
			},
			// The limit of an edit is the one of the message, and the way in stays in sight when it is reached:
			// the button goes out and tells why, instead of leaving the window without a word. A send is left as
			// it was - its limit is a hundred, and the plate below the batch is what names it there.
			showAddMoreButton() {
				return this.isEditMode ? this.canComposeFiles : this.canAddFiles;
			},
			isAddMoreDisabled() {
				return !this.canAddFiles;
			},
			// the plate belongs to the send: in an edit the same words are the reason of the button that went out
			showFilesLimitMessage() {
				return this.isAtMaxFilesLimit && !this.isEditMode;
			},
			canChangeComposition() {
				return !this.isSaving;
			},
			isExternalDropDisabled() {
				// reordering an item is a drag over the same container, but not a file coming from outside
				return !this.canAddFiles || Boolean(this.draggedFile);
			},
			orderedFiles() {
				return this.order.map(fileId => this.$store.getters['files/get'](fileId)).filter(Boolean);
			},
			filesCount() {
				return this.orderedFiles.length;
			},
			chunks() {
				return im_v2_lib_uploading.makeChunks({
					files: this.orderedFiles
				});
			},
			files() {
				return this.chunks.flat();
			},
			// The batch as the grid is built from it: which files are in it and in which order. Every derived
			// array is rebuilt whenever a file model is handed out anew, so only this value tells a change of
			// the composition from a model of the same batch being refreshed.
			fileIdsKey() {
				return this.files.map(file => file.id).join(',');
			},
			uploaderFiles() {
				const sessionFilesById = new Map(this.sessionFiles.map(file => [file.getId(), file]));
				return this.files.map(file => sessionFilesById.get(file.id)).filter(Boolean);
			},
			// the batch is not allowed to grow past the limit, so being at it means the next add is refused
			isAtMaxFilesLimit() {
				return this.orderedFiles.length >= this.maxFilesCount;
			},
			// the server refuses a composition that grew past the limit of a message and its uploaded copies would
			// be left in the chat folder; a message older than the feature carries more and is saved all the same
			hasCompositionGrownPastLimit() {
				return this.filesCount > this.maxFilesCount && this.filesCount > this.restoredFileIds.size;
			},
			// an edit changes one message, so the limit is that of a message; a send splits a larger batch in two
			maxFilesCount() {
				return this.isEditMode ? MAX_FILES_COUNT_IN_MESSAGE : MAX_FILES_COUNT;
			},
			filesLimitMessage() {
				return this.isEditMode ? this.loc('IM_TEXTAREA_UPLOAD_PREVIEW_POPUP_EDIT_FILES_LIMIT_MESSAGE_10') : this.loc('IM_TEXTAREA_UPLOAD_PREVIEW_POPUP_FILES_LIMIT_MESSAGE_100');
			},
			// in an edit the field holds the text of the message and not a caption to the files, so it is
			// named after what it holds; the field has no visible label, so the same words are its aria-label
			captionPlaceholder() {
				return this.isEditMode ? this.loc('IM_TEXTAREA_UPLOAD_PREVIEW_POPUP_EDIT_INPUT_PLACEHOLDER') : this.loc('IM_TEXTAREA_UPLOAD_PREVIEW_POPUP_INPUT_PLACEHOLDER_2');
			},
			// the name of the field outlives the placeholder, which goes on the first character typed. A send
			// names the caption of the files; an edit names the text of the message the field actually holds
			captionAriaLabel() {
				return this.isEditMode ? this.loc('IM_TEXTAREA_UPLOAD_PREVIEW_POPUP_EDIT_INPUT_PLACEHOLDER') : this.loc('IM_TEXTAREA_UPLOAD_PREVIEW_POPUP_INPUT_ARIA');
			},
			hasValidationErrors() {
				return this.files.some(file => {
					return Boolean(file.validationError);
				});
			},
			isMediaOnly() {
				if (this.hasValidationErrors) {
					return false;
				}
				return this.files.every(file => {
					return file.type === im_v2_const.FileType.image || file.type === im_v2_const.FileType.video;
				});
			},
			// which collection the batch is shown as: gallery tiles or a list of file rows.
			// an edit reads the mode off the composition it shows, through the very predicate the feed draws
			// the saved message by; a new message keeps the choice the author makes with the compression switch
			isGalleryMode() {
				// the error and the reason a file was refused are written out in a row and nowhere else
				if (this.hasFailedFiles || this.hasValidationErrors) {
					return false;
				}
				if (this.isEditMode) {
					return im_v2_lib_utils.Utils.file.isGallery(this.files);
				}
				return this.isMediaOnly && !this.sendAsFile;
			},
			inputMaxLength() {
				const settings = main_core.Extension.getSettings('im.v2.component.textarea');
				return settings.get('maxLength');
			},
			allowedTextLimit() {
				return this.inputMaxLength - this.text.length;
			},
			showInputLengthCounter() {
				return this.allowedTextLimit <= TEXT_LIMIT_COUNTER_SHOW_RANGE;
			},
			// what the live region says instead of the bare number, which on its own tells nothing about
			// what is running out
			charsLeftLabel() {
				return this.loc('IM_TEXTAREA_UPLOAD_PREVIEW_POPUP_CHARS_LEFT', {
					'#COUNT#': String(this.allowedTextLimit)
				});
			},
			textareaHeightStyle() {
				return this.textareaHeight === 'auto' ? 'auto' : `${this.textareaHeight}px`;
			},
			// the state of the batch is read from the store, where the uploading service mirrors it: the status
			// an UploaderFile keeps is outside Vue reactivity, and a window built on it would never catch up
			hasFailedFiles() {
				return this.files.some(file => file.status === im_v2_const.FileStatus.error);
			},
			hasUnsettledFiles() {
				return this.files.some(file => UNSETTLED_STATUSES.has(file.status));
			},
			isSendDisabled() {
				// a second press would send the very same request a second time
				if (this.isSaving) {
					return true;
				}
				if (this.hasFailedFiles || this.hasValidationErrors) {
					return true;
				}
				if (this.isEditMode) {
					// the composition is saved by the ids of its files, so a file still on its way has none to give.
					// An empty composition is a legitimate save: the message may be left with its text alone
					return this.hasUnsettledFiles || this.hasCompositionGrownPastLimit;
				}
				return this.files.length === 0;
			},
			isStopGenerationState() {
				return this.copilotManager.isStopGenerationAvailable(this.dialogId);
			}
		},
		watch: {
			async text() {
				await this.adjustTextareaHeight();
			},
			sendAsFile(newValue) {
				this.uploaderFiles.forEach(file => {
					file.setCustomData('sendAsFile', newValue);
				});
			},
			sessionFiles(sessionFiles) {
				this.syncOrder(sessionFiles);
			},
			// the composition lives here: the session alone would count only the files added in this edit
			filesCount: {
				handler(filesCount) {
					this.$emit('update:filesCount', filesCount);
				},
				immediate: true
			},
			// the message about the limit appears where nothing was, and a reader outside it learns no other way
			isAtMaxFilesLimit(isAtMaxFilesLimit) {
				if (isAtMaxFilesLimit) {
					ui_a11y.LiveAnnouncer.announce(this.filesLimitMessage);
				}
			},
			// the row of the error and the button it disabled have to reach the one who cannot see them, and the
			// hint is what says how to get out of it: repeat the upload or take the file away
			hasFailedFiles(hasFailedFiles) {
				if (hasFailedFiles) {
					ui_a11y.LiveAnnouncer.announce(this.loc('IM_TEXTAREA_UPLOAD_PREVIEW_POPUP_FILE_UPLOAD_HINT'), 'assertive');
				}
			},
			// the window locks up for the whole of the save, and a reader outside it is told of that nowhere else
			isSaving(isSaving) {
				if (isSaving) {
					ui_a11y.LiveAnnouncer.announce(this.loc('IM_TEXTAREA_UPLOAD_PREVIEW_POPUP_SAVING'));
				}
			},
			// The way in closes while it may be holding the focus, and it goes both ways: in a send the button
			// leaves the window, in an edit it stays and takes the disabled attribute, which drops the focus to
			// the body just the same. Where the button stayed, its wrapper is the stop that took its place.
			canAddFiles(canAddFiles) {
				if (!canAddFiles) {
					void this.keepFocusInWindow(() => this.$refs.addMore?.$el ?? null);
				}
			},
			isGalleryMode() {
				// The compress toggle swaps the whole collection between gallery tiles and file rows, so every
				// cell of the zone is replaced - rebind it once Vue has rendered the other branch.
				void this.$nextTick(() => {
					this.initFocusZone();
					this.syncCaptionFocusOutline();
				});
			},
			fileIdsKey() {
				// A file removed, added or reordered replaces the tiles of the collection: rebind the zone to the
				// ones on screen now, and land the focus the removal asked for. A file model refreshed under the
				// same batch keeps every tile in place, and a zone raised anew would drop the moving focus point.
				void this.$nextTick(() => {
					this.initFocusZone();
					this.syncCaptionFocusOutline();
				});
			},
			isMentionAvailable() {
				this.initMentionDetector();
			}
		},
		created() {
			this.focusZone = null;
			this.pendingFocusIndex = null;
			this.uploadManager = new im_v2_lib_uploading.UploadManager();
			this.copilotManager = new im_v2_lib_copilot.CopilotManager();
			this.mentionDetector = null;
			this.toolbarManager = null;
			// the snapshot of the composition the message came with, kept out of reactivity: `order` rules the batch
			this.restoredFileIds = new Set();
			this.initResizeManager();
			this.initEditedComposition();
			this.syncOrder(this.sessionFiles);
			this.getEmitter().subscribe(im_v2_const.EventType.textarea.insertMention, this.onInsertMention);
			this.getEmitter().subscribe(MentionListEvents.activeItemChanged, this.onMentionActiveItemChanged);
		},
		async mounted() {
			this.text = this.textareaValue;
			this.insertText('');
			this.dropZoneContainer = this.$refs.container;
			this.initWindowResizeListener();

			// the caret must be placed after Vue has flushed the moved text into the element
			await this.$nextTick();

			// the popup may already be closed by now, so there is nothing left to set up
			if (!this.$refs.messageText) {
				return;
			}
			this.focusTextarea();
			this.moveCaretToTextEnd();
			this.initMentionDetector();
			this.initFocusZone();
		},
		beforeUnmount() {
			// the caption of an edit is the text of the message: handing it to the field would leave it in the draft
			if (!this.isEditMode) {
				// the text goes back to the main field first: its watcher writes the draft text, and the
				// replacements join the same draft before it is flushed to the storage
				this.insertText(this.text);
				this.saveMentionsWithText();
			}
			this.getEmitter().unsubscribe(im_v2_const.EventType.textarea.insertMention, this.onInsertMention);
			this.getEmitter().unsubscribe(MentionListEvents.activeItemChanged, this.onMentionActiveItemChanged);
			this.resizeManager.destroy();
			this.mentionDetector?.destroy();
			this.toolbarManager?.destroy();
			main_core.Event.unbind(window, 'resize', this.onWindowResize);
			this.destroyFocusZone();
			this.isCaptionFocused = false;
		},
		methods: {
			// the two sources of the batch share only their ids, so the order below is the whole truth about it
			initEditedComposition() {
				const restoredFiles = this.getRestoredFiles();
				const restoredFileIds = restoredFiles.map(file => file.id);
				this.restoredFileIds = new Set(restoredFileIds);
				this.order = restoredFileIds;
				// the mode is inherited from the message as it is drawn now; nothing to inherit means the batch decides
				this.sendAsFile = restoredFiles.length > 0 && !im_v2_lib_utils.Utils.file.isGallery(restoredFiles);
			},
			getRestoredFiles() {
				if (!this.isEditMode) {
					return [];
				}
				const message = this.$store.getters['messages/getById'](this.editedMessageId);
				return (message?.files ?? []).map(fileId => this.$store.getters['files/get'](fileId)).filter(Boolean);
			},
			getMentionPopupTargetContainer() {
				const targetContainer = this.$refs.container?.closest('[aria-modal="true"]') ?? null;
				if (!targetContainer) {
					return null;
				}
				const modalZIndex = Number.parseInt(window.getComputedStyle(targetContainer).zIndex, 10);
				const nestedStack = main_core_zIndexManager.ZIndexManager.getOrAddStack(targetContainer);
				if (nestedStack && main_core.Type.isNumber(modalZIndex) && nestedStack.getBaseIndex() <= modalZIndex) {
					nestedStack.setBaseIndex(modalZIndex + 1);
				}
				return targetContainer;
			},
			syncOrder(sessionFiles) {
				const sessionIds = sessionFiles.map(file => file.getId());
				// a file of the batch either still belongs to the session or is one the message already held
				const nextOrder = [...this.order.filter(fileId => {
					return sessionIds.includes(fileId) || this.restoredFileIds.has(fileId);
				}), ...sessionIds.filter(fileId => !this.order.includes(fileId))];

				// the store keys of any chat signal the composition, so most syncs bring nothing new:
				// keeping the same order spares the gallery a rebuild
				if (this.isSameOrder(nextOrder)) {
					return;
				}
				this.order = nextOrder;
			},
			isSameOrder(order) {
				return order.length === this.order.length && order.every((fileId, index) => fileId === this.order[index]);
			},
			async adjustTextareaHeight() {
				this.textareaHeight = 'auto';
				await this.$nextTick();
				if (!this.$refs.messageText) {
					return;
				}
				const TEXTAREA_BORDERS_WIDTH = 2;
				const contentHeight = this.$refs.messageText.scrollHeight + TEXTAREA_BORDERS_WIDTH;
				const wantedHeight = Math.max(contentHeight, this.resizedTextareaHeight ?? TextareaHeight$1.min);
				this.textareaHeight = Math.min(wantedHeight, this.getMaxTextareaHeight());
			},
			// the single place the caption height is bounded: typing, the drag handle and a window resize
			// all ask here. The popup clips what does not fit and has no scroll of its own, so the caption
			// may only take the pixels the preview can spare above its last visible row
			getMaxTextareaHeight() {
				const metrics = this.getPopupHeightMetrics();
				if (!metrics) {
					return TextareaHeight$1.max;
				}
				const unusedHeight = metrics.availableHeight - metrics.containerHeight;
				const spareHeight = metrics.previewHeight - MIN_PREVIEW_HEIGHT;
				const allowedGrowth = unusedHeight + spareHeight - metrics.clippedHeight;
				const maxHeight = metrics.textareaHeight + allowedGrowth;
				return Math.min(TextareaHeight$1.max, Math.max(TextareaHeight$1.min, maxHeight));
			},
			// every height comes from one layout state, so growing the caption by what the preview
			// gives up keeps the sum unchanged
			getPopupHeightMetrics() {
				const {
					container,
					preview,
					messageText
				} = this.$refs;
				if (!container || !preview || !messageText) {
					return null;
				}

				// the window bounds the popup through the max-height of the container, and nothing else
				const availableHeight = Number.parseFloat(main_core.Dom.style(container, 'maxHeight'));
				return {
					availableHeight: main_core.Type.isNumber(availableHeight) ? availableHeight : window.innerHeight,
					containerHeight: container.offsetHeight,
					clippedHeight: container.scrollHeight - container.clientHeight,
					previewHeight: preview.offsetHeight,
					textareaHeight: messageText.offsetHeight
				};
			},
			getUploadingService() {
				if (!this.uploadingService) {
					this.uploadingService = im_v2_provider_service_uploading.UploadingService.getInstance();
				}
				return this.uploadingService;
			},
			onCancel() {
				this.$emit('close', {
					text: this.text
				});
			},
			onStopGeneration() {
				im_v2_lib_analytics.Analytics.getInstance().copilot.onClickStopGeneration(this.dialogId);
				void this.copilotManager.stopGeneration(this.dialogId);
			},
			onSend() {
				if (this.isStopGenerationState || this.isSendDisabled) {
					return;
				}
				if (this.isEditMode) {
					this.saveEditedFiles();
					return;
				}
				this.$emit('sendFiles', {
					sessionId: this.sessionId,
					text: this.text,
					files: this.uploaderFiles,
					sendAsFile: this.applySendAsFile()
				});
				this.text = '';
			},
			// the files added in this edit still carry temporary ids, so the uploader files travel with the order
			saveEditedFiles() {
				this.$emit('saveFiles', {
					sessionId: this.sessionId,
					messageId: this.editedMessageId,
					text: this.text,
					fileIds: this.orderedFiles.map(file => file.id),
					files: this.uploaderFiles,
					sendAsFile: this.applySendAsFile()
				});
			},
			// a batch drawn as a list goes as files, and an image sent so keeps no preview or original
			applySendAsFile() {
				if (this.isGalleryMode) {
					return false;
				}
				this.uploaderFiles.forEach(file => {
					this.removePreviewParams(file);
					file.setTreatImageAsFile(true);
					file.setCustomData('sendAsFile', true);
				});
				return true;
			},
			onKeyDownHandler(event) {
				// Escape belongs to the popup it is pressed over: of the popups asking for the key only the
				// topmost one gets it (main.popup, checkEscPressed), and hiding the toolbar here would hand it over
				if (im_v2_lib_utils.Utils.key.isCombination(event, 'Escape')) {
					return;
				}
				this.toolbarManager?.hide();
				if (this.showMention) {
					this.mentionDetector.onActiveMentionKeyDown(event);
					return;
				}
				const sendMessageCombination = im_v2_lib_hotkey.isSendMessageCombination(event);
				const newLineCombination = im_v2_lib_hotkey.isNewLineCombination(event);
				if (sendMessageCombination && !newLineCombination) {
					event.preventDefault();
					this.onSend();
					return;
				}
				if (newLineCombination) {
					event.preventDefault();
					this.text = im_v2_lib_textarea.Textarea.addNewLine(this.$refs.messageText);
					return;
				}
				if (this.isFormatAvailable && im_v2_lib_hotkey.isTextDecorationCombination(event)) {
					event.preventDefault();
					this.text = im_v2_lib_textarea.Textarea.handleDecorationTag(this.$refs.messageText, event.code, this.isMarkdownInputAvailable);
					return;
				}
				this.mentionDetector?.onKeyDown(event);
			},
			onMouseUp(event) {
				if (!this.isFormatAvailable) {
					return;
				}
				this.getToolbarManager().handleTextSelect(event, this.$refs.messageText);
			},
			getToolbarManager() {
				if (!this.toolbarManager) {
					this.toolbarManager = new FormatToolbarManager();
					this.toolbarManager.subscribe(FormatToolbarManager.events.show, this.onShowFormatToolbar);
					this.toolbarManager.subscribe(FormatToolbarManager.events.hide, this.onHideFormatToolbar);
				}
				return this.toolbarManager;
			},
			onShowFormatToolbar(event) {
				const {
					bindPosition
				} = event.getData();
				this.formatToolbarPosition = bindPosition;
				this.showFormatToolbar = true;
			},
			onHideFormatToolbar() {
				this.showFormatToolbar = false;
			},
			onFormatToolbarUpdateText(newText) {
				this.text = newText;
			},
			initMentionDetector() {
				// the map comes from the owner asynchronously, so mount is not the only moment
				// the detector becomes possible
				if (this.mentionDetector || !this.isMentionAvailable || !this.$refs.messageText) {
					return;
				}
				this.mentionDetector = new MentionDetector({
					textareaElement: this.$refs.messageText,
					context: {
						emitter: this.getEmitter()
					},
					gridIds: this.mentionGridIds
				});
				this.mentionDetector.subscribe(MentionDetectorEvents.showMentionPopup, event => {
					const {
						mentionQuery
					} = event.getData();
					this.showMentionPopup(mentionQuery);
				});
				this.mentionDetector.subscribe(MentionDetectorEvents.hideMentionPopup, () => {
					this.closeMentionPopup();
				});
				this.mentionDetector.refresh();
			},
			showMentionPopup(mentionQuery) {
				this.mentionQuery = mentionQuery;
				this.showMention = true;
			},
			closeMentionPopup() {
				this.showMention = false;
				this.mentionQuery = '';
				this.mentionActiveItemId = null;
				this.mentionDetector.onMentionPopupClose();
			},
			onMentionActiveItemChanged(event) {
				this.mentionActiveItemId = event.getData().nodeId;
			},
			onInsertMention(event) {
				const {
					mentionText,
					mentionReplacement,
					isMentionSymbol = true,
					dialogId,
					target
				} = event.getData();
				let {
					textToReplace = ''
				} = event.getData();
				// no detector means no dialog map either: such a mention must not reach the caption
				if (!this.mentionDetector || dialogId !== this.dialogId || target !== im_v2_const.TextareaTarget.uploadCaption) {
					return;
				}

				// the draft gets the replacement only together with the text holding it, on unmount:
				// a map outliving its own text turns the same name typed by hand into a real mention
				this.mentionReplacementMap.add(mentionText, mentionReplacement);
				const mentionSymbol = isMentionSymbol ? this.mentionDetector.getMentionSymbol() : '';
				textToReplace = `${mentionSymbol}${textToReplace}`;
				this.text = im_v2_lib_textarea.Textarea.insertMention(this.$refs.messageText, {
					textToInsert: mentionText,
					textToReplace
				});
				this.mentionDetector.clearMentionSymbol();
			},
			saveMentionsWithText() {
				const mentions = this.mentionReplacementMap?.getAll() ?? {};
				// an empty map means nothing to keep: a send has already cleared both map and draft
				if (Object.keys(mentions).length === 0) {
					return;
				}
				this.getDraftManager().setDraftMentions(this.draftKey, mentions);
			},
			focusTextarea() {
				this.$refs.messageText?.focus({
					preventScroll: true
				});
			},
			moveCaretToTextEnd() {
				const textarea = this.$refs.messageText;
				textarea.selectionStart = textarea.value.length;
				textarea.selectionEnd = textarea.value.length;
			},
			getDraftManager() {
				if (!this.draftManager) {
					this.draftManager = im_v2_lib_draft.DraftManager.getInstance();
				}
				return this.draftManager;
			},
			onCaptionFocus() {
				this.isCaptionFocused = true;
			},
			onCaptionBlur() {
				this.isCaptionFocused = false;
			},
			// The ring of the wrapper stands for the focus of the caption alone, so it must not outlive it: a
			// rebuilt collection can move the focus into a cell, and a field detached that way fires no blur.
			// Reading the flag back from the live focus after every rebuild keeps the two in step either way.
			syncCaptionFocusOutline() {
				this.isCaptionFocused = document.activeElement === this.$refs.messageText;
			},
			removePreviewParams(file) {
				this.$store.dispatch('files/update', {
					id: file.getId(),
					fields: {
						image: false
					}
				});
			},
			insertText(text) {
				this.getEmitter().emit(im_v2_const.EventType.textarea.insertText, {
					text,
					dialogId: this.dialogId,
					replace: true
				});
			},
			initResizeManager() {
				this.resizeManager = new ResizeManager({
					direction: ResizeDirection.down,
					minHeight: TextareaHeight$1.min,
					maxHeight: TextareaHeight$1.max
				});
				this.resizeManager.subscribe(ResizeManager.events.onHeightChange, ({
					data: {
						newHeight
					}
				}) => {
					this.textareaHeight = Math.min(newHeight, this.getMaxTextareaHeight());
				});
				this.resizeManager.subscribe(ResizeManager.events.onResizeStop, () => {
					this.resizedTextareaHeight = this.textareaHeight;
				});
			},
			initWindowResizeListener() {
				// a window shrinking under an open popup takes the pixels back from the caption
				this.onWindowResize = main_core.Runtime.throttle(this.adjustTextareaHeight, WINDOW_RESIZE_DELAY);
				main_core.Event.bind(window, 'resize', this.onWindowResize);
			},
			// Rebuilt rather than kept in step with the markup: the primitive resyncs its own set a frame after
			// the DOM changes, and the focus a removal owes the user cannot wait for that frame.
			initFocusZone() {
				const container = this.$refs.itemsContainer;
				if (!container) {
					return;
				}
				this.destroyFocusZone();

				// The zone holds DOM nodes and has private fields, so it stays out of reactive state (markRaw).
				// Only the cell selector is ours - the grid the zone reads is the role="row" markup itself.
				this.focusZone = ui_vue3.markRaw(new GridFocusZone(container, CELL_SELECTOR));
				this.focusZone.activate();
				this.applyPendingFocus();
			},
			destroyFocusZone() {
				this.focusZone?.deactivate();
				this.focusZone = null;
			},
			onResizeStart(event) {
				this.resizeManager.onResizeStart(event, this.textareaHeight);
			},
			onRemoveItem(event) {
				if (!this.canChangeComposition) {
					return;
				}
				const removedIndex = this.order.indexOf(event.file.id);

				// the file leaves the session too, otherwise the next sync brings it back
				this.getUploadingService().removeFileFromPreviewSession({
					sessionId: this.sessionId,
					fileId: event.file.id,
					removeFromServer: this.canRemoveFilesFromServer
				});
				this.order = this.order.filter(fileId => fileId !== event.file.id);

				// an emptied edit stays open: the message may be left with its text alone
				if (this.order.length === 0 && !this.isEditMode) {
					this.onCancel();
					return;
				}
				void this.keepFocusInWindow(() => this.getRemoveButtonAt(removedIndex));
			},
			// a control that removes itself takes the focus with it, and focus left on nothing goes to the body,
			// where the window is no longer the context anything is read in
			async keepFocusInWindow(getTarget) {
				if (!this.holdsFocus()) {
					return;
				}
				await this.$nextTick();
				if (!this.$refs.container || this.holdsFocus()) {
					return;
				}
				ui_a11y.FocusNavigator.focusTarget(getTarget() ?? this.$refs.messageText);
			},
			holdsFocus() {
				return Boolean(this.$refs.container?.contains(document.activeElement));
			},
			// the row that took the place of the removed one, and the last row when the removed one was last
			getRemoveButtonAt(index) {
				const buttons = this.$refs.container?.querySelectorAll(REMOVE_BUTTON_SELECTOR) ?? [];
				return buttons[Math.min(index, buttons.length - 1)] ?? null;
			},
			// the repeat is a new file of the batch, and it takes the place its failed original held
			onRetryItem(event) {
				if (!this.canChangeComposition) {
					return;
				}
				const repeatedFile = this.getUploadingService().retryPreviewSessionFile({
					sessionId: this.sessionId,
					fileId: event.file.id
				});
				if (!repeatedFile) {
					im_v2_lib_notifier.Notifier.onDefaultError();
					return;
				}
				this.order = this.order.map(fileId => {
					return fileId === event.file.id ? repeatedFile.getId() : fileId;
				});
			},
			onItemsKeyDown(event) {
				if (event.key !== 'Delete' && event.key !== 'Backspace') {
					return;
				}
				const cell = event.target;
				if (!(cell instanceof HTMLElement) || !cell.matches(CELL_SELECTOR)) {
					return;
				}
				event.preventDefault();
				this.removeFocusedCell(cell);
			},
			removeFocusedCell(cell) {
				const index = this.getFocusCells().indexOf(cell);
				const file = this.files[index];
				if (!file) {
					return;
				}

				// Where focus lands once the tile is gone: the tile that shifts into the gap, or the one before it
				// if the last tile was removed. -1 means the batch is now empty - the dialog closes and the focus
				// trap returns focus to the composer, so nothing is refocused here.
				this.pendingFocusIndex = index < this.files.length - 1 ? index : index - 1;
				this.onRemoveItem({
					file
				});
			},
			getFocusCells() {
				const container = this.$refs.itemsContainer;
				return container ? [...container.querySelectorAll(CELL_SELECTOR)] : [];
			},
			applyPendingFocus() {
				const index = this.pendingFocusIndex;
				this.pendingFocusIndex = null;
				if (index === null || index < 0) {
					return;
				}

				// preventScroll is the contract of the zone: revealing the cell is the job of its focusin handler,
				// which scrolls the collection itself instead of every ancestor up to the page.
				this.getFocusCells()[index]?.focus({
					preventScroll: true
				});
			},
			onItemDragStart(event) {
				if (!this.canChangeComposition) {
					return;
				}
				this.draggedItemEvent = event;
				this.draggedFile = event.file;
				// where the previous drag landed must not decide where this one does
				this.lastTargetItem = null;
				this.lastTargetPosition = null;
				this.axis = event.axis || this.axis;
				// eslint-disable-next-line no-param-reassign
				event.event.dataTransfer.effectAllowed = 'move';
			},
			onItemDragEnd(event) {
				event.event.preventDefault();
				delete this.highlightDropzone.fileId;
				delete this.highlightDropzone.position;

				// a dragend can come without a dragstart behind it, or twice: there is nothing to reorder then
				if (!this.draggedFile) {
					return;
				}

				// a drag that never hovered an item of the batch has no target: the order stays as it was
				if (!this.lastTargetItem) {
					this.draggedFile = null;
					return;
				}
				const order = [...this.order];
				const currentFileIndex = order.indexOf(this.draggedFile.id);
				// the dragged file left the batch during the gesture: splicing at -1 would drop a stranger
				if (currentFileIndex === -1) {
					this.draggedFile = null;
					return;
				}

				// the gap the drop mark points at, counted in the order the drag started from
				const dropIndex = (() => {
					const index = order.indexOf(this.lastTargetItem?.id);
					if (this.lastTargetPosition === 'before') {
						return index;
					}
					return index + 1;
				})();
				order.splice(currentFileIndex, 1);
				// taking the dragged file out moves every gap behind it one position left
				const insertIndex = dropIndex > currentFileIndex ? dropIndex - 1 : dropIndex;
				order.splice(insertIndex, 0, this.draggedFile.id);
				this.order = order;
				this.draggedFile = null;
			},
			onItemDragOver(event) {
				if (this.draggedFile) {
					event.event.preventDefault();
					const currentTarget = event.file;
					const currentTargetPosition = (() => {
						const targetRect = event.event.currentTarget.getBoundingClientRect();
						const targetCenter = (() => {
							if (this.axis === 'x') {
								return targetRect.left + targetRect.width / 2;
							}
							return targetRect.top + targetRect.height / 2;
						})();
						if (this.axis === 'x' && event.event.x > targetCenter || this.axis === 'y' && event.event.y > targetCenter) {
							return 'after';
						}
						return 'before';
					})();
					if (currentTarget !== this.lastTargetItem || currentTarget === this.lastTargetItem && currentTargetPosition !== this.lastTargetPosition) {
						this.lastTargetPosition = currentTargetPosition;
						this.lastTargetItem = currentTarget;
						this.highlightDropzone = {
							fileId: currentTarget.id,
							position: currentTargetPosition
						};
					}
				}
			},
			onFilesSelected(files) {
				void this.addFiles(files);
			},
			onFilesDropped(files) {
				void this.addFiles(files);
			},
			async onPaste(event) {
				if (!this.canAddFiles || !event.clipboardData || !ui_uploader_core.isFilePasted(event.clipboardData)) {
					return;
				}
				event.preventDefault();
				await this.addFiles(await ui_uploader_core.getFilesFromDataTransfer(event.clipboardData));
			},
			// the single add path of the batch: the input selection, an external drop and a paste all come here
			async addFiles(files) {
				if (!this.canChangeComposition || !main_core.Type.isArrayFilled(files)) {
					return;
				}
				try {
					// the display mode travels with the add: the uploader decides on compression while loading
					const {
						errors,
						overLimitCount
					} = await this.uploadManager.addFilesToPreview({
						files,
						dialogId: this.dialogId,
						messageId: this.editedMessageId,
						sendAsFile: this.sendAsFile,
						// the composition lives here, so the limit of the add is counted on what is shown
						compositionCount: this.filesCount
					});
					errors.forEach(error => {
						im_v2_lib_notifier.Notifier.file.showValidationError(error.text);
					});

					// the limit message below the batch is a state hint; this add needs an answer of its own
					if (overLimitCount > 0) {
						im_v2_lib_notifier.Notifier.file.showValidationError(this.filesLimitMessage);
					}
				} catch (error) {
					// the add can fail before a single file joins the batch, and then the pick looks ignored
					im_v2_lib_logger.Logger.error('UploadPreviewContent: adding files to the batch failed', error);
					im_v2_lib_notifier.Notifier.onDefaultError();
				}
			},
			getEmitter() {
				return this.$Bitrix.eventEmitter;
			},
			loc(phraseCode, replacements = {}) {
				return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
			}
		},
		template: `
		<div
			ref="container"
			class="bx-im-upload-preview__container"
			data-testid="im-upload-preview-container"
			:data-edit-mode="isEditMode"
			:aria-busy="isSaving"
			@paste="onPaste"
		>
			<!-- One hint for the whole collection: Delete removes the focused cell in either branch, so a
					 media tile has to be told about the key on the same terms as a file row. -->
			<span :id="deleteHintId" class="bx-im-textarea__sr-only">{{
				loc('IM_TEXTAREA_UPLOAD_PREVIEW_DELETE_ARIA')
			}}</span>
			<div ref="preview" class="bx-im-upload-preview__preview">
				<!-- One grid over the whole batch, not one per chunk: a batch above ten files is split into
						 several chunks, and the arrows have to cross that split. The chunks and the gallery roots
						 inside them are presentational, so every row belongs to this grid. -->
				<div
					ref="itemsContainer"
					class="bx-im-upload-preview__items-container"
					role="grid"
					:aria-label="loc('IM_TEXTAREA_UPLOAD_PREVIEW_POPUP_ITEMS_ARIA')"
					data-testid="im-upload-preview-items"
					@keydown="onItemsKeyDown"
				>
					<div
						v-if="isEmptyComposition"
						class="bx-im-upload-preview__empty"
						data-testid="im-upload-preview-empty"
					>
						<UiIllustration
							:name="IllustrationName.DOCUMENT"
							:size="EMPTY_ILLUSTRATION_SIZE"
						/>
						<div class="bx-im-upload-preview__empty-body">
							<TextXs className="bx-im-upload-preview__empty-title">
								{{ loc('IM_TEXTAREA_UPLOAD_PREVIEW_POPUP_EMPTY_TITLE') }}
							</TextXs>
							<Text2Xs className="bx-im-upload-preview__empty-hint">
								{{ loc('IM_TEXTAREA_UPLOAD_PREVIEW_POPUP_EMPTY_HINT') }}
							</Text2Xs>
						</div>
					</div>
					<div
						v-if="isGalleryMode"
						v-for="chunk in chunks"
						class="bx-im-upload-preview__items-chunk"
						role="presentation"
					>
						<MediaGallery
							:files="chunk"
							:width="GALLERY_WIDTH"
							:allowRemoveItem="canChangeComposition"
							:removeItemLabel="loc('IM_TEXTAREA_UPLOAD_PREVIEW_REMOVE_FILE_ARIA')"
							:allowSorting="canChangeComposition"
							:handleLoading="isSaving"
							:allowCancelItem="false"
							:gridNavigation="true"
							:describedById="deleteHintId"
							:viewerGroupBy="sessionId"
							@removeItem="onRemoveItem"
							@itemDragStart="onItemDragStart"
							@itemDragEnd="onItemDragEnd"
							@itemDragOver="onItemDragOver"
							:highlightDropzone="highlightDropzone"
						/>
					</div>
					<div
						v-else
						v-for="chunk in chunks"
						class="bx-im-upload-preview__items-chunk"
						role="presentation"
					>
						<div v-for="fileItem in chunk" :key="fileItem.id" role="row">
							<FileItem
								:file="fileItem"
								:isEditMode="isEditMode"
								:removable="canChangeComposition"
								:allowSorting="canChangeComposition"
								:handleLoading="isSaving"
								:viewerGroupBy="sessionId"
								:describedById="deleteHintId"
								@removeItem="onRemoveItem"
								@retryItem="onRetryItem"
								@itemDragStart="onItemDragStart"
								@itemDragEnd="onItemDragEnd"
								@itemDragOver="onItemDragOver"
								:highlightDropzone="highlightDropzone"
							/>
						</div>
					</div>
				</div>
				<PreviewDropZone
					:container="dropZoneContainer"
					:disabled="isExternalDropDisabled"
					@filesDropped="onFilesDropped"
				/>
			</div>
			<div class="bx-im-upload-preview__controls-container">
				<div
					v-if="isSaving"
					class="bx-im-upload-preview__saving"
					data-testid="im-upload-preview-saving"
				>
					<LineLoader :width="SAVING_LOADER_WIDTH" :height="SAVING_LOADER_HEIGHT" />
					<TextMd className="bx-im-upload-preview__saving-text">
						{{ loc('IM_TEXTAREA_UPLOAD_PREVIEW_POPUP_SAVING') }}
					</TextMd>
				</div>
				<AddMoreButton
					v-if="showAddMoreButton"
					ref="addMore"
					:dialogId="dialogId"
					:disabled="isAddMoreDisabled"
					:disabledReason="filesLimitMessage"
					@filesSelected="onFilesSelected"
				/>
				<!-- The batch reaching its limit answers what the user just did, so it is spoken and not only
						 drawn: role="status" announces it politely, without taking the focus away. -->
				<div
					v-if="showFilesLimitMessage"
					class="bx-im-upload-preview__controls-files-limit-message"
					role="status"
					data-testid="im-upload-preview-files-limit-message"
				>
					<span>{{ filesLimitMessage }}</span>
				</div>
				<div
					v-if="hasFailedFiles"
					class="bx-im-upload-preview__controls-upload-error-message"
					data-testid="im-upload-preview-upload-error-message"
				>
					<BIcon
						v-if="isEditMode"
						:name="OutlineIcons.EXCLAMATION_CIRCLE"
						class="bx-im-upload-preview__controls-upload-error-message-icon"
					/>
					<TextXs v-if="isEditMode" className="bx-im-upload-preview__controls-upload-error-message-text">
						{{ loc('IM_TEXTAREA_UPLOAD_PREVIEW_POPUP_FILE_UPLOAD_HINT') }}
					</TextXs>
					<span v-else>{{ loc('IM_TEXTAREA_UPLOAD_PREVIEW_POPUP_FILE_UPLOAD_HINT') }}</span>
				</div>
				<div v-if="isMediaOnly && !isEditMode" class="bx-im-upload-preview__control-compress-image">
					<!-- The Tab stop is stated here for the same reason the buttons of the area state theirs:
							 WebKit keeps a bare checkbox out of the Tab order until full keyboard access is turned
							 on in the OS. The checkbox of the design system declares inheritAttrs: false and binds
							 $attrs on its native <input>, so the attribute lands on the focusable node itself. -->
					<Checkbox
						:id="compressCheckboxId"
						v-model="sendAsFile"
						:size="CheckboxSize.Lg"
						tabindex="0"
						data-testid="im-upload-preview-send-as-file-checkbox"
					/>
					<TextMd
						tag="label"
						:for="compressCheckboxId"
						className="bx-im-upload-preview__control-compress-image-label"
					>
						{{ loc('IM_TEXTAREA_UPLOAD_PREVIEW_POPUP_SEND_WITHOUT_COMPRESSION') }}
					</TextMd>
				</div>
				<!-- The ring of this wrapper belongs to the caption field, not to everything inside it: the
						 send button is the other focusable child, and it carries a ring of its own. -->
				<div
					ref="messageTextWrapper"
					class="bx-im-upload-preview__message-text__wrapper"
					:class="{ '--focus-outline': isCaptionFocused }"
				>
					<!-- The name of the field is a label of its own, not the placeholder: the placeholder is a
							 call to act and disappears with the first character typed, while the name has to keep
							 telling what the field holds once there is something in it. -->
					<textarea
						ref="messageText"
						v-model="text"
						v-bind="mentionComboboxAttrs"
						:placeholder="captionPlaceholder"
						:aria-label="captionAriaLabel"
						:maxlength="inputMaxLength"
						:style="{'height': textareaHeightStyle}"
						class="bx-im-upload-preview__message-text"
						data-testid="im-upload-preview-input"
						rows="1"
						@keydown="onKeyDownHandler"
						@focus="onCaptionFocus"
						@blur="onCaptionBlur"
						@mouseup="onMouseUp"
					></textarea>
					<div class="bx-im-upload-preview__message-text__actions">
						<div
							v-if="showInputLengthCounter"
							class="bx-im-upload-preview__message-text__counter"
							data-testid="im-upload-preview-input-counter"
						>
							<!-- The bare number is for the eye only: aria-hidden keeps it out of the live
									 region below, otherwise the count is spoken twice on every keystroke. -->
							<span aria-hidden="true">{{ allowedTextLimit }}</span>
							<span class="bx-im-textarea__sr-only" role="status">{{ charsLeftLabel }}</span>
						</div>
						<SendButton
							:dialogId="dialogId"
							:editMode="isEditMode"
							:isDisabled="isSendDisabled"
							:isLoading="isSaving"
							:isStopGenerationState="isStopGenerationState"
							:data-testid="isEditMode ? 'im-upload-preview-save-btn' : 'im-upload-preview-send-btn'"
							@click="onSend"
							@stop="onStopGeneration"
						/>
					</div>
					<div @mousedown="onResizeStart" class="bx-im-upload-preview__message-text__drag-handle"></div>
				</div>
			</div>
			<MentionPopup
				v-if="showMention"
				:bindElement="$refs.messageTextWrapper"
				:dialogId="dialogId"
				:query="mentionQuery"
				:targetContainer="getMentionPopupTargetContainer()"
				:withCopilot="withCopilot"
				:target="TextareaTarget.uploadCaption"
				@close="closeMentionPopup"
				@onFocusTextarea="focusTextarea"
			/>
			<FormatToolbar
				v-if="showFormatToolbar"
				:dialogId="dialogId"
				:textarea="$refs.messageText"
				:targetPosition="formatToolbarPosition"
				:useMarkdown="isMarkdownInputAvailable"
				@updateText="onFormatToolbarUpdateText"
				@close="onHideFormatToolbar"
			/>
		</div>
	`
	};

	const POPUP_ID$1 = 'im-chat-upload-preview-popup';
	const POPUP_WIDTH$1 = 400;

	// @vue/component
	const UploadPreviewPopup = {
		name: 'UploadPreviewPopup',
		components: {
			MessengerAirPopup: im_v2_component_elements_airPopup.MessengerAirPopup,
			UploadPreviewContent,
			Spinner: im_v2_component_elements_loader.Spinner
		},
		props: {
			dialogId: {
				type: String,
				required: true
			},
			sessionId: {
				type: String,
				required: true
			},
			textareaValue: {
				type: String,
				required: false,
				default: ''
			},
			// Where the focus trap puts focus when it lets go: the composer owns the answer.
			restoreFocusTarget: {
				type: Function,
				default: null
			},
			draftKey: {
				type: String,
				required: true
			},
			mentionReplacementMap: {
				/** @type MentionReplacementMap | null */
				type: Object,
				default: null
			},
			withCopilot: {
				type: Boolean,
				default: true
			},
			// the message whose attachments are being edited; without it the batch is a new message
			editedMessageId: {
				type: [Number, null],
				default: null
			},
			// the save of the composition is under way: the batch has been taken and cannot be changed
			isSaving: {
				type: Boolean,
				default: false
			},
			// a file leaving the batch takes the copy it got in the chat folder with it - unless the composition
			// of this batch has reached the server already, and the message may be carrying that copy now
			canRemoveFilesFromServer: {
				type: Boolean,
				default: true
			}
		},
		emits: ['close', 'sendFiles', 'saveFiles'],
		data() {
			return {
				isContentReady: false,
				batchFilesCount: null,
				// a shared DOM id would collide the teleport targets of two mounted textareas
				popupId: `${POPUP_ID$1}-${im_v2_lib_utils.Utils.text.getUuidV4()}`
			};
		},
		computed: {
			POPUP_ID: () => POPUP_ID$1,
			POPUP_WIDTH: () => POPUP_WIDTH$1,
			// the session keeps its files outside Vue reactivity, so the store keys are what makes the batch
			// reactive: a file joining it adds a key here
			...ui_vue3_vuex.mapState({
				storeFileIds: state => Object.keys(state.files.collection)
			}),
			files() {
				const knownFileIds = new Set(this.storeFileIds);
				return this.getUploadingService().getPreviewSessionFiles(this.sessionId).filter(file => knownFileIds.has(file.getId())).map(file => this.$store.getters['files/get'](file.getId()));
			},
			isEditMode() {
				return this.editedMessageId !== null;
			},
			// the count belongs to the send alone: an edit names the message it changes, and the composition
			// of that message is what the window itself shows
			title() {
				if (this.isEditMode) {
					return this.$Bitrix.Loc.getMessage('IM_TEXTAREA_UPLOAD_PREVIEW_POPUP_EDIT_TITLE');
				}
				return this.$Bitrix.Loc.getMessage('IM_TEXTAREA_UPLOAD_PREVIEW_POPUP_COMPUTED_TITLE', {
					'#COUNT#': this.titleFilesCount
				});
			},
			// the batch is composed in the content: the session alone knows only what has just been added
			titleFilesCount() {
				return this.batchFilesCount ?? this.files.length;
			},
			// only the files of the session are waited for: a preview the server never sent would keep the spinner
			// forever, as isContentReady latches on the first true and is never taken back
			isReady() {
				return this.files.every(file => {
					return file.image !== null;
				});
			}
		},
		watch: {
			isReady(isReady) {
				if (isReady) {
					this.isContentReady = true;
				}
			}
		},
		created() {
			// once shown, the content stays: a file joining later must not swap it back to the spinner and
			// lose the caption being edited
			this.isContentReady = this.isReady;
			// a class with private fields: Vue's reactive proxy would break them
			this.focusTrap = null;
		},
		mounted() {
			// the wrapper owns the markup of the popup and builds it while being created, so its getPopup
			// already has the popup to hand over here
			const popup = this.$refs.airPopup?.getPopup?.();
			if (!popup) {
				return;
			}
			this.markAsModalDialog(popup.getPopupContainer());
			this.holdFocusInside(popup);
		},
		beforeUnmount() {
			this.destroyFocusTrap();
		},
		methods: {
			onSendFiles(event) {
				this.$emit('sendFiles', event);
				this.onClose();
			},
			// every way out of the dialog comes through here, and the trap has to let go while the popup is
			// still in the document: the wrapper destroys it right after the close, and the trap drops the
			// isolation of the page by walking the ancestors of the container - a detached one has none
			onClose() {
				this.destroyFocusTrap();
				if (this.isEditMode) {
					im_v2_lib_draft.DraftManager.getInstance().setDraftText(this.draftKey, '');
				}
				this.$emit('close');
			},
			markAsModalDialog(container) {
				// main.popup already gives its containers the dialog role and marks an overlay popup modal: this
				// states both on the container of this dialog instead of leaning on those defaults
				container.setAttribute('role', 'dialog');
				container.setAttribute('aria-modal', 'true');
			},
			// main.popup builds a focus trap of its own once the accessibility setting is on. Two traps over one
			// container fight over the isolation: the second leaves inert where the first put it, and its
			// restore then finds its own target inert and gives up. So an existing trap is handed the target.
			holdFocusInside(popup) {
				const popupFocusTrap = popup.getFocusTrap();
				if (popupFocusTrap) {
					popupFocusTrap.setRestoreFocus(this.restoreFocusTarget);
					return;
				}
				this.focusTrap = new ui_a11y.FocusTrap(popup.getPopupContainer(), {
					// real modality: everything outside goes under inert
					isolateOutside: true,
					looped: true,
					restoreFocus: this.restoreFocusTarget,
					// the content puts the caret in the caption field itself, and it mounts only once the files
					// are ready
					initialFocus: false
				});
				this.focusTrap.activate();
			},
			destroyFocusTrap() {
				this.focusTrap?.destroy();
				this.focusTrap = null;
			},
			getUploadingService() {
				return im_v2_provider_service_uploading.UploadingService.getInstance();
			}
		},
		template: `
		<MessengerAirPopup
			ref="airPopup"
			:id="popupId"
			:testId="POPUP_ID"
			:title="title"
			:width="POPUP_WIDTH"
			className="bx-im-upload-preview__scope"
			hasOverlay
			:hasHorizontalPadding="false"
			:hasVerticalPadding="false"
			:closeByEsc="true"
			@close="onClose"
		>
			<UploadPreviewContent
				v-if="isContentReady"
				:dialogId="dialogId"
				:sessionId="sessionId"
				:textareaValue="textareaValue"
				:draftKey="draftKey"
				:mentionReplacementMap="mentionReplacementMap"
				:withCopilot="withCopilot"
				:editedMessageId="editedMessageId"
				:isSaving="isSaving"
				:canRemoveFilesFromServer="canRemoveFilesFromServer"
				@update:filesCount="batchFilesCount = $event"
				@close="onClose"
				@sendFiles="onSendFiles"
				@saveFiles="$emit('saveFiles', $event)"
			/>
			<div v-else class="bx-im-upload-preview-popup-preparing" data-testid="im-upload-preview-preparing">
				<Spinner></Spinner>
			</div>
		</MessengerAirPopup>
	`
	};

	const POPUP_ID = 'im-voice-recorder-promo';
	const POPUP_WIDTH = 320;
	// the distance from the left edge of the arrow box to the tip of the arrow inside it
	const ARROW_TIP_OFFSET = 17;

	// @vue/component
	const VoiceRecorderPromo = {
		name: 'VoiceRecorderPromo',
		components: {
			MessengerPopup: im_v2_component_elements_popup.MessengerPopup,
			TextMd: ui_system_typography_vue.TextMd,
			TextSm: ui_system_typography_vue.TextSm
		},
		props: {
			bindElement: {
				/** @type HTMLElement */
				type: Object,
				required: true
			}
		},
		data() {
			return {
				// who gets the promo is counted on the server; the client only asks whether this user is among them
				isVisible: im_v2_lib_promo.PromoManager.getInstance().needToShow(im_v2_const.PromoId.voiceMessageRecording)
			};
		},
		computed: {
			POPUP_ID: () => POPUP_ID,
			popupConfig() {
				return {
					bindElement: this.bindElement,
					bindOptions: {
						position: 'top'
					},
					className: 'bx-im-voice-recorder-promo-popup',
					width: POPUP_WIDTH,
					padding: 0,
					background: 'var(--ui-color-accent-soft-element-blue)',
					designSystemContext: '--ui-context-content-dark',
					angle: true,
					closeIcon: {
						top: '6px',
						right: '6px'
					},
					overlay: false,
					ariaLabel: this.loc('IM_TEXTAREA_VOICE_RECORDER_PROMO_TITLE'),
					// a hint nobody asked for must neither take focus nor trap it
					focusTrap: false
				};
			}
		},
		mounted() {
			if (!this.isVisible) {
				return;
			}
			this.pointArrowAtButton();
			// the promo takes no focus, so a screen reader would pass it over: it is announced once instead
			ui_a11y.LiveAnnouncer.announce(this.loc('IM_TEXTAREA_VOICE_RECORDER_PROMO_ANNOUNCE'));
			// the showing itself spends the promo: nothing that closes the popup brings it back
			void im_v2_lib_promo.PromoManager.getInstance().markAsWatched(im_v2_const.PromoId.voiceMessageRecording);
		},
		methods: {
			// the popup keeps its arrow near its own left edge, and a popup wider than the place left of
			// the button gets moved away from it: the arrow is put back over the button it belongs to
			pointArrowAtButton() {
				const popup = main_popup.PopupManager.getPopupById(POPUP_ID);
				if (!popup) {
					return;
				}
				const buttonRect = this.bindElement.getBoundingClientRect();
				const popupRect = popup.getPopupContainer().getBoundingClientRect();
				popup.setAngle({
					offset: Math.round(buttonRect.left + buttonRect.width / 2 - popupRect.left - ARROW_TIP_OFFSET)
				});
			},
			close() {
				this.isVisible = false;
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<MessengerPopup
			v-if="isVisible"
			:id="POPUP_ID"
			:config="popupConfig"
			@close="close"
		>
			<div class="bx-im-voice-recorder-promo" data-testid="im-textarea-voice-recorder-promo">
				<TextMd accent tag="div">{{ loc('IM_TEXTAREA_VOICE_RECORDER_PROMO_TITLE') }}</TextMd>
				<TextSm
					tag="div"
					class="bx-im-voice-recorder-promo__text"
				>{{ loc('IM_TEXTAREA_VOICE_RECORDER_PROMO_TEXT') }}</TextSm>
			</div>
		</MessengerPopup>
	`
	};

	const ICON_SIZE$1 = 26;
	const MAIN_POINTER_BUTTON = 0;

	// @vue/component
	const VoiceRecorderButton = {
		name: 'VoiceRecorderButton',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			VoiceRecorderPromo
		},
		props: {
			// the panel keeps a copy of this button to mark the place the recording runs in, and that copy
			// leads nowhere: it is hidden from the screen reader and taken out of the tab order. Out of the
			// tab order and not disabled - `disabled` would also stop the browser from reporting the
			// release of a hold that ended over this very element, and that release is what sends the record
			isRecording: {
				type: Boolean,
				default: false
			},
			isDisabled: {
				type: Boolean,
				default: false
			},
			// the dictation holds the microphone while it runs: the button names what took the device
			// instead of only greying out
			isAudioInputActive: {
				type: Boolean,
				default: false
			}
		},
		// `press` starts the recording and says whether it is tied to a hold and whether a pointer stood
		// behind it
		emits: ['press'],
		data() {
			return {
				hasActiveCall: false,
				// the promo hangs on the button itself, and the button exists as an element only once mounted
				promoBindElement: null
			};
		},
		computed: {
			OutlineIcons: () => ui_iconSet_api_vue.Outline,
			ICON_SIZE: () => ICON_SIZE$1,
			// a button that only greys out leaves the user guessing what took the microphone
			buttonHint() {
				if (this.hasActiveCall) {
					return this.loc('IM_TEXTAREA_VOICE_RECORDER_DISABLED_CALL');
				}
				if (this.isAudioInputActive) {
					return this.loc('IM_TEXTAREA_VOICE_RECORDER_DISABLED_DICTATION');
				}
				return this.loc('IM_TEXTAREA_VOICE_RECORDER_START');
			},
			isUnavailable() {
				return this.isDisabled || this.hasActiveCall;
			},
			canStartRecording() {
				return !this.isUnavailable && !this.isRecording;
			},
			// the copy of the button inside the panel shares the popup id with the button of the field, and a
			// promo bound to that copy would stand over the running recording
			showPromo() {
				return Boolean(this.promoBindElement) && !this.isRecording;
			}
		},
		created() {
			this.updateCallState();
			im_v2_lib_voiceRecorder.CALL_STATE_EVENTS.forEach(eventName => main_core_events.EventEmitter.subscribe(eventName, this.updateCallState));
		},
		mounted() {
			this.promoBindElement = ui_vue3.markRaw(this.$el);
		},
		beforeUnmount() {
			im_v2_lib_voiceRecorder.CALL_STATE_EVENTS.forEach(eventName => main_core_events.EventEmitter.unsubscribe(eventName, this.updateCallState));
		},
		methods: {
			updateCallState() {
				this.hasActiveCall = Boolean(im_v2_lib_call.CallManager.getInstance().hasCurrentCall());
			},
			handlePointerDown(event) {
				if (!this.canStartRecording || event.button !== MAIN_POINTER_BUTTON) {
					return;
				}

				// the hold owns the pointer from here: no caret jump into the field, no text selection
				event.preventDefault();
				this.$emit('press', {
					isLocked: false,
					isStartedFromPointer: true
				});
			},
			handleActivationKeydown(event) {
				if (!this.canStartRecording || event.key !== 'Enter' && event.key !== ' ') {
					return;
				}

				// kills the click the browser makes of the key, so the click handler starts no second recording
				event.preventDefault();

				// a repeat of a held key is not a second start
				if (event.repeat) {
					return;
				}
				this.$emit('press', {
					isLocked: true,
					isStartedFromPointer: false
				});
			},
			// a screen reader and a voice control activate a button through its default action, which
			// reaches the element as a click with no pointer behind it - `detail` 0. The pointer and the
			// keyboard have handlers of their own and never come here
			handleActivationClick(event) {
				if (!this.canStartRecording || event.detail !== 0) {
					return;
				}
				this.$emit('press', {
					isLocked: true,
					isStartedFromPointer: false
				});
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<button
			:title="isRecording ? undefined : buttonHint"
			:aria-label="buttonHint"
			:aria-disabled="isUnavailable ? 'true' : undefined"
			:aria-hidden="isRecording ? 'true' : undefined"
			:tabindex="isRecording ? -1 : 0"
			:class="{
				'--disabled': isUnavailable,
				'--recording': isRecording,
			}"
			class="bx-im-voice-recorder-button"
			type="button"
			data-testid="im-textarea-voice-recorder-btn"
			@pointerdown="handlePointerDown"
			@keydown="handleActivationKeydown"
			@click="handleActivationClick"
		>
			<BIcon :name="OutlineIcons.MICROPHONE_ON" :size="ICON_SIZE" />
			<VoiceRecorderPromo v-if="showPromo" :bindElement="promoBindElement" />
		</button>
	`
	};

	const BeforeSendMessageAction = {
		proceed: 'proceed',
		cancel: 'cancel',
		cancelKeepText: 'cancelKeepText'
	};
	const MESSAGE_ACTION_PANELS = new Set([im_v2_const.TextareaPanelType.edit, im_v2_const.TextareaPanelType.reply, im_v2_const.TextareaPanelType.forward]);
	// What became of the composition of the batch an edit is composing: the copies its files got in the chat
	// folder are ours to delete only while it is unsent, and an answer that never came does not make it so.
	const EditedCompositionFate = {
		unsent: 'unsent',
		sent: 'sent',
		applied: 'applied'
	};
	const TextareaHeight = {
		max: 400,
		min: 22
	};
	const ICON_SIZE = 24;
	// every send takes its own id, so it can only release the hold it took itself
	let lastTypedTextHoldId = 0;

	// loaded on the first press and not with the chat: only the user who pressed the microphone needs it
	const VOICE_RECORDING_EXTENSION = 'im.v2.lib.voice-recorder.recording';
	const VOICE_RECORD_NAME = 'voice-message';
	// the storage reads the kind of a file from its extension: an mp4 container of audio has to arrive
	// as m4a, or the chat would show a video
	const VOICE_RECORD_EXTENSION_BY_SUBTYPE = {
		mp4: 'm4a'
	};
	const VOICE_RECORD_DEFAULT_EXTENSION = 'm4a';

	// @vue/component
	const ChatTextarea = {
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			UploadMenu,
			EmoteSelector,
			SendButton: im_v2_component_elements_sendButton.SendButton,
			UploadPreviewPopup,
			MentionPopup,
			SlashCommandPopup,
			TextareaPanel,
			AudioInput,
			AutoDeleteSelector,
			IconButton: im_v2_component_elements_iconButton.IconButton,
			FormatToolbar,
			VoiceRecorderButton
		},
		props: {
			dialogId: {
				type: String,
				default: ''
			},
			placeholder: {
				type: String,
				default: ''
			},
			withMarket: {
				type: Boolean,
				default: true
			},
			withEdit: {
				type: Boolean,
				default: true
			},
			withDraft: {
				/** @type boolean | { draftDialogId: string } */
				type: [Boolean, Object],
				default: true
			},
			withUploadMenu: {
				type: Boolean,
				default: true
			},
			withSmileSelector: {
				type: Boolean,
				default: true
			},
			withAutoFocus: {
				type: Boolean,
				default: true
			},
			withMention: {
				type: Boolean,
				default: true
			},
			withSlashCommand: {
				type: Boolean,
				default: true
			},
			withCopilot: {
				type: Boolean,
				default: true
			},
			// default off: untouched surfaces keep their existing input behavior; enabling surfaces opt in
			withKeyboardNavigation: {
				type: Boolean,
				default: false
			},
			disabled: {
				type: Boolean,
				default: false
			},
			deferredDialogPromise: {
				type: Object,
				default: null
			},
			// Opt-in for a local AI-assistant temp whose readiness request has failed.
			// The attempt can only reach onBeforeSendMessage; it never reaches a transport.
			allowBeforeSendOnUninitedTemp: {
				type: Boolean,
				default: false
			},
			heightConfig: {
				/** @type {{ storageKey?: string, minHeight?: number }} */
				type: Object,
				default: () => ({})
			}
		},
		emits: ['mounted', 'textChange'],
		// The ids of the mention grid belong to this composer, not to the module: the field points at them
		// with aria-controls and aria-activedescendant, the grid renders them, and the manager resolves the
		// action cell of the active row by them. Built here, where the field lives, and handed to the grid
		// subtree - `provide` runs before `created`, so the set exists before any child asks for it.
		provide() {
			this.mentionGridIds = createMentionGridIds();
			return {
				mentionGridIds: this.mentionGridIds
			};
		},
		data() {
			return {
				text: '',
				textareaHeight: this.heightConfig.minHeight ?? TextareaHeight.min,
				showMention: false,
				mentionQuery: '',
				mentionActiveItemId: null,
				mentionReplacementMap: null,
				showSlashCommand: false,
				slashCommandQuery: '',
				slashCommandHasItems: false,
				showUploadPreviewPopup: false,
				previewPopupUploaderIds: [],
				previewPopupUploadingId: null,
				previewPopupSourceFilesCount: 0,
				previewSessionId: null,
				previewSessionMessageId: null,
				isSavingEditedFiles: false,
				editedCompositionFate: EditedCompositionFate.unsent,
				typedTextHoldId: 0,
				panelType: im_v2_const.TextareaPanelType.none,
				panelContext: {
					messageId: 0
				},
				showFormatToolbar: false,
				formatToolbarPosition: {},
				voiceCapability: null,
				recordingPanel: null,
				isVoiceRecording: false,
				isVoiceRecordingLocked: false,
				// whether a pointer stood behind the press that opened the panel: the panel answers by it
				// where the focus of the start goes
				isVoiceStartedFromPointer: false,
				// the record shown by this field stays reactive; the queues and blobs behind it do not
				shownVoiceRecord: null,
				isAudioInputActive: false,
				dialogReady: !this.deferredDialogPromise
			};
		},
		computed: {
			OutlineIcons: () => ui_iconSet_api_vue.Outline,
			ICON_SIZE: () => ICON_SIZE,
			heightStorageKey() {
				return this.heightConfig.storageKey ?? im_v2_const.LocalStorageKey.textareaHeight;
			},
			minHeight() {
				return this.heightConfig.minHeight ?? TextareaHeight.min;
			},
			draftKey() {
				if (main_core.Type.isPlainObject(this.withDraft)) {
					return this.withDraft.draftDialogId || this.dialogId;
				}
				return this.dialogId;
			},
			isMarkdownInputAvailable() {
				return im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isMarkdownAvailable);
			},
			dialog() {
				return this.$store.getters['chats/get'](this.dialogId, true);
			},
			dialogInited() {
				return this.dialog.inited || !this.dialogReady;
			},
			replyMode() {
				return this.panelType === im_v2_const.TextareaPanelType.reply;
			},
			replyIdForContent() {
				// media/file replies bind to the original only when the server feature is enabled
				if (!this.replyMode || !im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isReplyWithMediaAvailable)) {
					return undefined;
				}
				return this.panelContext.messageId;
			},
			forwardMode() {
				return this.panelType === im_v2_const.TextareaPanelType.forward;
			},
			editMode() {
				return this.panelType === im_v2_const.TextareaPanelType.edit;
			},
			// a voice message is one lone file the server marked as recorded voice, the way it reads it itself
			isEditingVoiceMessage() {
				const message = this.$store.getters['messages/getById'](this.panelContext.messageId);
				if (!message || message.files.length !== 1) {
					return false;
				}
				const file = this.$store.getters['files/get'](message.files[0], true);
				return file?.isVoiceNote === true;
			},
			// a file attached while the edit panel is open belongs to the message being edited, not to a
			// new one: without the scope the batch joins the draft and leaves as separate messages
			panelEditedMessageId() {
				if (!this.editMode || !im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isEditMessageFilesAvailable)) {
					return null;
				}

				// where the product keeps files out of an edit the whole scope goes, and files fall back to the draft
				if (this.isOpenLinesChat || this.isCopilotOrAiAssistantChat || this.isEditingVoiceMessage) {
					return null;
				}

				// the panel context is restored from the drafts of the client, and nothing there promises a number
				const messageId = Number(this.panelContext.messageId);
				return Number.isInteger(messageId) && messageId > 0 ? messageId : null;
			},
			isEditingAttachments() {
				return Boolean(this.previewSessionMessageId);
			},
			// the copies of the files may be part of a published edit once the composition left the client. The
			// window is bound to this rule and not to the held-batch one: a draft window always took the copy
			// of a removed file with it, and there is no batch of an edit to ask about
			isEditedCompositionSent() {
				return this.editedCompositionFate !== EditedCompositionFate.unsent;
			},
			// the batch this textarea holds gives up its copies in the chat folder only while the composition
			// is unsent: the window stays closable for the whole of the save
			canRemoveHeldFilesFromServer() {
				return this.isEditingAttachments && !this.isEditedCompositionSent;
			},
			marketMode() {
				return this.panelType === im_v2_const.TextareaPanelType.market;
			},
			isDisabled() {
				if (this.disabled) {
					return true;
				}
				return this.text.trim() === '' && !this.editMode && !this.forwardMode;
			},
			isAudioInputDisabled() {
				if (!this.dialogReady) {
					return true;
				}
				return Boolean(im_v2_lib_utils.Utils.dialog.isTempAiAssistantDialogId(this.dialogId));
			},
			isVoiceRecorderDisabled() {
				// the dictation holds the microphone while it runs, and both cannot have the device at once
				return this.disabled || !this.dialogReady || this.isAudioInputActive;
			},
			// the panel is given the record it opened on and nothing else: a refusal that arrives while it
			// stands there waits in the queue instead of replacing what the user is looking at
			voiceRecordReturned() {
				return this.shownVoiceRecord?.record ?? null;
			},
			voiceSendFailure() {
				return this.shownVoiceRecord?.failure ?? '';
			},
			isVoiceRecordingAllowedInChat() {
				if (this.isOpenLinesChat || this.dialog.type === im_v2_const.ChatType.copilot) {
					return false;
				}
				if (im_v2_lib_utils.Utils.dialog.isTempAiAssistantDialogId(this.dialogId)) {
					return false;
				}

				// a bot among the members of a group chat blocks nothing: only a dialog whose counterpart
				// is a bot has nobody on the other side to listen to a voice message
				const isBotDialog = this.dialog.type === im_v2_const.ChatType.user && Boolean(this.$store.getters['users/bots/getByUserId'](this.dialogId));
				return !isBotDialog;
			},
			showVoiceRecorderButton() {
				if (this.voiceCapability === null || this.voiceCapability === im_v2_lib_voiceRecorder.Capability.unavailable) {
					return false;
				}

				// the microphone takes the place of the send button while there is nothing to send;
				// an edit and a forward keep their own send button whatever the field holds
				if (!this.isEmptyText || this.editMode || this.forwardMode) {
					return false;
				}

				// an open upload preview owns the send flow: a record started here would make a second batch
				if (this.previewSessionId) {
					return false;
				}
				return this.isVoiceRecordingAllowedInChat && im_v2_lib_permission.PermissionManager.getInstance().canPerformActionByRole(im_v2_const.ActionByRole.send, this.dialogId);
			},
			isStopGenerationState() {
				return !this.editMode && this.copilotManager.isStopGenerationAvailable(this.dialogId);
			},
			baseTextareaPlaceholder() {
				if (im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.copilotActive)) {
					return this.loc('IM_TEXTAREA_PLACEHOLDER_MSGVER_1');
				}
				return this.loc('IM_TEXTAREA_PLACEHOLDER_WITHOUT_AI');
			},
			textareaPlaceholder() {
				// the window of the edit holds the text of the message, so the field of the panel is out of the
				// edit while it is open - and the placeholder is what says so, the field having no other label
				if (this.isEditingAttachments) {
					return this.loc('IM_TEXTAREA_PLACEHOLDER_EDITING_ATTACHMENTS');
				}
				if (!this.placeholder) {
					return this.baseTextareaPlaceholder;
				}
				return this.placeholder;
			},
			textareaStyle() {
				let height = `${this.textareaHeight}px`;
				if (this.textareaHeight === 'auto') {
					height = 'auto';
				}
				return {
					height,
					maxHeight: height
				};
			},
			textareaMaxLength() {
				const settings = main_core.Extension.getSettings('im.v2.component.textarea');
				return settings.get('maxLength');
			},
			isEmptyText() {
				return this.text === '';
			},
			showAreaFocusOutline() {
				// only the opt-in half of the condition: the area holds focus itself here, so :focus-visible in
				// the stylesheet supplies the other half - including keeping the ring off a mouse click.
				return this.withKeyboardNavigation;
			},
			isAutoDeleteEnabled() {
				return this.$store.getters['chats/autoDelete/isEnabled'](this.dialog.chatId);
			},
			marketIconColor() {
				if (this.marketMode) {
					return im_v2_const.Color.accentBlue;
				}
				return im_v2_const.Color.gray40;
			},
			slashCommandIconColor() {
				// match the attach icon (UploadMenu): accent while the popup is open, resting otherwise
				if (this.showSlashCommand) {
					return im_v2_const.Color.accentBlue;
				}
				return im_v2_const.Color.gray40;
			},
			// while the mention list is open the field points at it, but stays a multiline text box: ARIA in
			// HTML allows no role on <textarea>, and aria-expanded is not among the attributes a text box may
			// carry, so neither may be put here. What is left is enough - aria-activedescendant is valid on a
			// text box and is what actually voices the walk over the list, while aria-haspopup and
			// aria-controls are global. With the list closed every reference is dropped in one go, so no
			// attribute is ever left pointing at a grid that is no longer rendered.
			mentionComboboxAttrs() {
				if (!this.withMention || !this.showMention) {
					return {};
				}

				// the grid renders only while it has items, so both references to it appear together:
				// pointing either of them at a missing node would be a broken relation for a screen reader
				const gridRendered = this.mentionActiveItemId !== null;
				return {
					'aria-haspopup': 'grid',
					'aria-autocomplete': 'list',
					'aria-controls': gridRendered ? this.mentionGridIds.gridId : null,
					'aria-activedescendant': this.mentionActiveItemId
				};
			},
			isGuest() {
				return this.$store.getters['users/isGuest'](im_v2_application_core.Core.getUserId());
			},
			showMarketIcon() {
				return this.withMarket && !this.isGuest;
			},
			isOpenLinesChat() {
				// Both id forms are checked next to the type: an open line can be addressed by its
				// external id before the chat entity is in the store, and then the type is not known yet
				return this.dialog.type === im_v2_const.ChatType.lines || im_v2_lib_utils.Utils.dialog.isLinesExternalId(this.dialogId) || im_v2_lib_utils.Utils.dialog.isLinesHistoryId(this.dialogId);
			},
			isCopilotOrAiAssistantChat() {
				return new im_v2_lib_copilot.CopilotManager().isCopilotChatOrBot(this.dialogId) || this.$store.getters['users/bots/isAiAssistant'](this.dialogId) || im_v2_lib_utils.Utils.dialog.isTempAiAssistantDialogId(this.dialogId);
			},
			slashCommandEnabled() {
				// im.v2.Chat.Command.list is not in the guest controller allowlist, so the trigger,
				// the popup and the button stay hidden for a guest instead of opening a popup whose
				// only possible outcome is ACCESS_DENIED
				return this.withSlashCommand && !this.isGuest && im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isChatBotCommandsAvailable) && !this.isOpenLinesChat && !this.isCopilotOrAiAssistantChat;
			},
			showSlashCommandButton() {
				return this.slashCommandEnabled && this.dialog.type === im_v2_const.ChatType.user && Boolean(this.$store.getters['users/bots/getByUserId'](this.dialogId));
			}
		},
		watch: {
			dialogId() {
				// a record shown in the chat the field is leaving goes back into the queue of that chat:
				// it is offered again when the user comes back, and it exists nowhere else
				this.queueShownVoiceRecord();
				// the field is reused between chats: a recording left running would be sent to the chat
				// the user has already left. The panel frees the microphone stream as it goes.
				this.isVoiceRecording = false;
				void this.showReturnedVoiceRecord();
			},
			// the panel closes the same way whatever ended the recording, so the flag gives both edges
			isVoiceRecording(isRecording) {
				if (isRecording) {
					this.getInputActionService().startAction(im_v2_lib_inputAction.InputAction.recordingVoice);
					return;
				}
				this.getInputActionService().stopAction(im_v2_lib_inputAction.InputAction.recordingVoice);
				// a refusal that arrived over a recording of its own has been waiting for the panel to be free
				void this.showReturnedVoiceRecord();
			},
			text(newValue) {
				// the caret saved on leaving the field belongs to the text that was there then; once the text
				// changes, those offsets point into a document that no longer exists
				this.savedSelection = null;
				this.adjustTextareaHeight();
				if (!this.dialogReady) {
					return;
				}

				// the window of an edit took the text as its caption: writing the empty field over the draft loses it
				if (this.isEditingAttachments) {
					return;
				}
				if (this.withDraft) {
					this.getDraftManager().setDraftText(this.draftKey, newValue);
				}
				if (main_core.Type.isStringFilled(newValue)) {
					this.getInputActionService().startAction(im_v2_lib_inputAction.InputAction.writing);
				}
				this.$emit('textChange', newValue);
			},
			panelType(newValue, oldValue) {
				if (newValue === im_v2_const.TextareaPanelType.market) {
					im_v2_lib_localStorage.LocalStorageManager.getInstance().set(im_v2_const.LocalStorageKey.textareaMarketOpened, true);
					return;
				}

				// only a real close unpins the panel; a message action panel borrowing the slot does not
				if (oldValue === im_v2_const.TextareaPanelType.market && newValue === im_v2_const.TextareaPanelType.none) {
					im_v2_lib_localStorage.LocalStorageManager.getInstance().set(im_v2_const.LocalStorageKey.textareaMarketOpened, false);
				}
			}
		},
		created() {
			this.savedSelection = null;
			this.fieldDescriptionId = `bx-im-textarea-field-nav-${main_core.Text.getRandom(8)}`;
			this.isUnmounted = false;
			this.initUnsentVoiceRecords();
			this.previewSessionOwnerId = im_v2_lib_utils.Utils.text.getUuidV4();
			this.copilotManager = new im_v2_lib_copilot.CopilotManager();
			this.initResizeManager();
			this.restoreTextareaHeight();
			this.initSendingService();
			void this.resolveVoiceCapability();
			main_core_events.EventEmitter.subscribe(im_v2_const.EventType.dialog.onMessageDeleted, this.onMessageDeleted);
			main_core_events.EventEmitter.subscribe(im_v2_const.EventType.textarea.insertText, this.onInsertText);
			main_core_events.EventEmitter.subscribe(im_v2_const.EventType.textarea.getText, this.onGetText);
			main_core_events.EventEmitter.subscribe(im_v2_const.EventType.textarea.closePanel, this.onClosePanelRequest);
			main_core_events.EventEmitter.subscribe(im_v2_const.EventType.textarea.closeSlashCommandPopup, this.onCloseSlashCommandPopupRequest);
			this.getEmitter().subscribe(SlashCommandItemsChangedEvent, this.onSlashCommandItemsChanged);
			this.getEmitter().subscribe(im_v2_const.EventType.textarea.sendMessage, this.onSendMessage);
			this.getEmitter().subscribe(im_v2_const.EventType.textarea.insertText, this.onInsertText);
			this.getEmitter().subscribe(im_v2_const.EventType.textarea.insertMention, this.onInsertMention);
			this.getEmitter().subscribe(im_v2_const.EventType.textarea.insertForward, this.onInsertForward);
			this.getEmitter().subscribe(im_v2_const.EventType.textarea.editMessage, this.onEditMessage);
			this.getEmitter().subscribe(im_v2_const.EventType.textarea.replyMessage, this.onReplyMessage);
			this.getEmitter().subscribe(im_v2_const.EventType.dialog.closeComments, this.onCloseComments);
			this.getEmitter().subscribe(im_v2_const.EventType.textarea.openUploadPreview, this.onOpenUploadPreview);
			this.getEmitter().subscribe(im_v2_const.EventType.textarea.focusInput, this.onFocusInput);
			this.getEmitter().subscribe(im_v2_const.EventType.key.onBeforeEscape, this.onBeforeEscape);
			this.getEmitter().subscribe(MentionListEvents.activeItemChanged, this.onMentionActiveItemChanged);
		},
		async mounted() {
			if (this.withAutoFocus) {
				this.focus();
			}
			this.$emit('mounted');
			if (main_core.Type.isPlainObject(this.withDraft)) {
				void this.restoreOwnDraft();
			}
			await this.getDialogReadyPromise();
		},
		beforeUnmount() {
			this.isUnmounted = true;
			this.destroyUnsentVoiceRecords();
			this.resizeManager.destroy();
			this.mentionDetector?.destroy();
			this.getToolbarManager().destroy();
			this.releasePreviewSession(this.previewSessionId, {
				removeFilesFromServer: this.canRemoveHeldFilesFromServer
			});
			this.unbindUploadingService();
			main_core_events.EventEmitter.unsubscribe(im_v2_const.EventType.dialog.onMessageDeleted, this.onMessageDeleted);
			main_core_events.EventEmitter.unsubscribe(im_v2_const.EventType.textarea.insertText, this.onInsertText);
			main_core_events.EventEmitter.unsubscribe(im_v2_const.EventType.textarea.getText, this.onGetText);
			main_core_events.EventEmitter.unsubscribe(im_v2_const.EventType.textarea.closePanel, this.onClosePanelRequest);
			main_core_events.EventEmitter.unsubscribe(im_v2_const.EventType.textarea.closeSlashCommandPopup, this.onCloseSlashCommandPopupRequest);
			this.getEmitter().unsubscribe(SlashCommandItemsChangedEvent, this.onSlashCommandItemsChanged);
			this.getEmitter().unsubscribe(im_v2_const.EventType.textarea.sendMessage, this.onSendMessage);
			this.getEmitter().unsubscribe(im_v2_const.EventType.textarea.insertMention, this.onInsertMention);
			this.getEmitter().unsubscribe(im_v2_const.EventType.textarea.insertText, this.onInsertText);
			this.getEmitter().unsubscribe(im_v2_const.EventType.textarea.insertForward, this.onInsertForward);
			this.getEmitter().unsubscribe(im_v2_const.EventType.textarea.editMessage, this.onEditMessage);
			this.getEmitter().unsubscribe(im_v2_const.EventType.textarea.replyMessage, this.onReplyMessage);
			this.getEmitter().unsubscribe(im_v2_const.EventType.dialog.closeComments, this.onCloseComments);
			this.getEmitter().unsubscribe(im_v2_const.EventType.textarea.openUploadPreview, this.onOpenUploadPreview);
			this.getEmitter().unsubscribe(im_v2_const.EventType.textarea.focusInput, this.onFocusInput);
			this.getEmitter().unsubscribe(im_v2_const.EventType.key.onBeforeEscape, this.onBeforeEscape);
			this.getEmitter().unsubscribe(MentionListEvents.activeItemChanged, this.onMentionActiveItemChanged);
		},
		methods: {
			stopGeneration() {
				im_v2_lib_analytics.Analytics.getInstance().copilot.onClickStopGeneration(this.dialogId);
				void this.copilotManager.stopGeneration(this.dialogId);
			},
			onGetText(event) {
				const {
					dialogId
				} = event.getData();
				if (this.dialogId !== dialogId) {
					return '';
				}
				return this.text;
			},
			async sendMessage() {
				this.text = this.text.trim();
				const beforeSendOnlyDialogId = this.allowBeforeSendOnUninitedTemp && !this.dialogInited && im_v2_lib_utils.Utils.dialog.isTempAiAssistantDialogId(this.dialogId) ? this.dialogId : null;
				if (this.isDisabled || !this.dialogInited && !beforeSendOnlyDialogId) {
					return;
				}

				// the send button acts as a stop button while BitrixGPT is generating: sending is unavailable
				if (this.isStopGenerationState) {
					return;
				}

				// the window took the text of the edit, so the panel path would read the empty field as a blank
				if (this.isEditingAttachments) {
					return;
				}

				// the hold is taken until the field is cleared, so a second Enter cannot send the same text
				if (this.typedTextHoldId !== 0) {
					return;
				}
				lastTypedTextHoldId += 1;
				const holdId = lastTypedTextHoldId;
				this.typedTextHoldId = holdId;
				try {
					await this.sendCurrentText(beforeSendOnlyDialogId);
				} finally {
					if (this.typedTextHoldId === holdId) {
						this.typedTextHoldId = 0;
					}
				}
			},
			async sendCurrentText(beforeSendOnlyDialogId = null) {
				await this.getDialogReadyPromise();
				if (beforeSendOnlyDialogId && (this.isUnmounted || this.dialogId !== beforeSendOnlyDialogId || !this.allowBeforeSendOnUninitedTemp || !im_v2_lib_utils.Utils.dialog.isTempAiAssistantDialogId(this.dialogId))) {
					return;
				}
				const sentText = this.text;
				const eventResult = await main_core_events.EventEmitter.emitAsync(im_v2_const.EventType.textarea.onBeforeSendMessage, {
					dialogId: this.dialogId,
					text: sentText
				});
				if (eventResult.includes(BeforeSendMessageAction.cancel)) {
					if (this.text === sentText) {
						this.resetTextarea();
					}
					return;
				}
				if (eventResult.includes(BeforeSendMessageAction.cancelKeepText)) {
					return;
				}

				// A before-send-only attempt stays bound to its original temp even if an
				// async listener changes live props/models. Only a cancellation action may
				// consume it; it must never fall through to the ordinary transport path.
				if (beforeSendOnlyDialogId) {
					return;
				}
				const text = this.mentionReplacementMap ? this.mentionReplacementMap.apply(this.text) : this.text;
				// the send goes on asynchronously, so its chat and mode are taken before the prop moves on
				const {
					dialogId,
					editMode
				} = this;
				if (this.hasActiveMessageAction()) {
					if (editMode) {
						this.handlePanelAction(text);
						this.closePanel();
						this.resetTextarea();
						this.completeOptimisticSend();
					} else {
						this.resetTextarea();
						this.completeOptimisticSend();
						this.handlePanelAction(text);
						this.closePanel();
					}
				} else {
					this.resetTextarea();
					im_v2_lib_soundNotification.SoundNotificationManager.getInstance().playOnce(im_v2_const.SoundType.send);
					this.completeOptimisticSend();
					this.getSendingService().sendMessage({
						text,
						dialogId
					});
				}
			},
			// ALG-01 optimistic part: nothing here waits for the send to reach the server
			completeOptimisticSend() {
				this.typedTextHoldId = 0;
				this.getEmitter().emit(im_v2_const.EventType.textarea.onAfterSendMessage);
			},
			resetTextarea() {
				this.getInputActionService().stopAction(im_v2_lib_inputAction.InputAction.writing);
				this.clear();
				this.getDraftManager().clearDraft(this.draftKey);
				this.focus();
			},
			handlePanelAction(text) {
				if (this.editMode) {
					void this.handleEditAction(text);
				} else if (this.forwardMode) {
					void this.getSendingService().forwardMessages({
						text,
						dialogId: this.dialogId,
						forwardIds: this.panelContext.messagesIds
					});
					im_v2_lib_soundNotification.SoundNotificationManager.getInstance().playOnce(im_v2_const.SoundType.send);
				} else if (this.replyMode) {
					this.getSendingService().sendMessage({
						text,
						dialogId: this.dialogId,
						replyId: this.panelContext.messageId
					});
					im_v2_lib_soundNotification.SoundNotificationManager.getInstance().playOnce(im_v2_const.SoundType.send);
				}
			},
			async handleEditAction(text) {
				const {
					messageId
				} = this.panelContext;
				if (text === '' && !this.messageHasFiles(messageId)) {
					this.getMessageService().deleteMessages([messageId]);
					return;
				}
				const editContext = {
					messageId,
					newText: text,
					dialogId: this.dialogId,
					draftKey: this.draftKey,
					// the type is taken now: by the time the answer comes the message may be gone from the store
					isVideoNote: this.$store.getters['messages/isVideoNote'](messageId)
				};
				const outcome = await this.getMessageService().editMessageText(messageId, text);
				this.handleEditOutcome(editContext, outcome);
			},
			handleEditOutcome(editContext, outcome) {
				// the answer of a superseded attempt must not overwrite the result of the newest one
				if (outcome.success || !outcome.isLatestAttempt) {
					return;
				}
				const {
					messageId,
					newText,
					isVideoNote
				} = editContext;
				if (!isVideoNote) {
					im_v2_lib_logger.Logger.error('ChatTextarea: editing the message failed', outcome.reason);
					return;
				}
				const message = this.$store.getters['messages/getById'](messageId);
				// a newer update or a delete wins: only the text this attempt wrote may be rolled back
				if (message?.text === newText) {
					const {
						textBeforeEdit,
						isEditedBeforeEdit
					} = outcome;
					this.getMessageService().rollbackMessage(messageId, textBeforeEdit, isEditedBeforeEdit);
				}
				this.recoverEditedText(editContext, message);
				im_v2_lib_notifier.Notifier.message.onEditError(outcome.reason);
			},
			recoverEditedText(editContext, message) {
				const {
					messageId,
					newText,
					dialogId,
					draftKey
				} = editContext;
				// the user may have moved on while the answer was on its way: another chat, another
				// edit or freshly typed text; whatever they are doing now wins over the return
				const sameDialogOpened = !this.isUnmounted && this.dialogId === dialogId;
				// a reply or a forward is as much what the user is doing now as an edit is, and the panel
				// of the edit is what the recovery would silently replace: only the edit of this very
				// message is a panel it may write into
				const editPanelOfThisMessage = this.editMode && this.panelContext.messageId === messageId;
				const otherActionPanelOpened = this.hasActiveMessageAction() && !editPanelOfThisMessage;

				// the draft is keyed by chat, so a textarea busy with something else owns the draft too:
				// the text of a failed edit may not overwrite what the user is typing or editing now
				if (sameDialogOpened && (otherActionPanelOpened || !this.isEmptyText)) {
					return;
				}

				// a message deleted by now has no edit panel to return to, whether it is gone from the
				// collection or only marked deleted; its caption goes to the draft
				if (sameDialogOpened && message && !message.isDeleted) {
					this.openEditPanel(messageId, newText);
					return;
				}

				// a textarea without a draft has nowhere to keep the caption: the notification is all
				// the user gets back
				if (!this.withDraft) {
					return;
				}

				// mentions live in the draft as a replacement map: prepareEdit leaves plain names in the
				// text, and only that map turns them back into bbcode when the draft is sent
				const mentions = this.mentionReplacementMap.extract(newText);
				this.getDraftManager().setDraftText(draftKey, im_v2_lib_parser.Parser.prepareEdit({
					...message,
					text: newText
				}));
				this.getDraftManager().setDraftMentions(draftKey, mentions);
			},
			messageHasFiles(messageId) {
				const message = this.$store.getters['messages/getById'](messageId);
				if (!message) {
					return false;
				}
				return message.files.length > 0;
			},
			clear() {
				this.text = '';
				this.mentionReplacementMap?.clear();
			},
			hasActiveMessageAction() {
				return MESSAGE_ACTION_PANELS.has(this.panelType);
			},
			onPanelClose() {
				this.focus();
				this.closePanel();
			},
			closePanel() {
				if (this.editMode) {
					this.clear();
				}

				// the window of the attachments is the edit shown in the panel: the batch cannot outlive it
				if (this.isEditingAttachments) {
					this.discardPreviewSession();
				}
				this.panelType = im_v2_const.TextareaPanelType.none;
				this.panelContext = {
					messageId: 0
				};
				this.getDraftManager().setDraftPanel(this.draftKey, this.panelType, this.panelContext);
			},
			openEditPanel(messageId, rawText = null) {
				if (!this.withEdit) {
					return;
				}
				const message = this.$store.getters['messages/getById'](messageId);
				if (message.isDeleted) {
					return;
				}

				// rawText replaces the stored text when the panel reopens with text the model does
				// not hold: the caption of an edit that failed to save
				const messageToEdit = rawText === null ? message : {
					...message,
					text: rawText
				};
				this.panelType = im_v2_const.TextareaPanelType.edit;
				this.panelContext.messageId = messageId;
				const mentions = this.mentionReplacementMap.extract(messageToEdit.text);
				this.mentionReplacementMap.set(mentions);
				this.text = im_v2_lib_parser.Parser.prepareEdit(messageToEdit);
				this.focus();
				this.getDraftManager().setDraftText(this.draftKey, this.text);
				this.getDraftManager().setDraftPanel(this.draftKey, this.panelType, this.panelContext);
				this.getDraftManager().setDraftMentions(this.draftKey, mentions);
				if (this.panelEditedMessageId && this.messageHasFiles(messageId)) {
					void this.openEditAttachmentsPreview();
				}
			},
			// the batch starts out empty: the window fills it with the files the message already carries
			async openEditAttachmentsPreview() {
				const messageId = this.panelEditedMessageId;
				const uploadingService = this.getUploadingService();
				try {
					const sessionId = await uploadingService.createPreviewSession({
						dialogId: this.dialogId,
						messageId
					});
					uploadingService.leasePreviewSession(sessionId, this.previewSessionOwnerId);
					if (this.isUnmounted || this.panelEditedMessageId !== messageId) {
						this.releasePreviewSession(sessionId);
						return;
					}
					this.openUploadPreview(sessionId, messageId);
				} catch (error) {
					// without the window the attachments cannot be reached at all
					im_v2_lib_logger.Logger.error('ChatTextarea: opening the attachments of the edited message failed', error);
					im_v2_lib_notifier.Notifier.onDefaultError();
				}
			},
			openReplyPanel(messageId) {
				if (this.editMode) {
					this.clear();
				}
				this.panelType = im_v2_const.TextareaPanelType.reply;
				this.panelContext.messageId = messageId;
				this.focus();
				this.getDraftManager().setDraftPanel(this.draftKey, this.panelType, this.panelContext);
			},
			openForwardPanel(messagesIds) {
				this.panelType = im_v2_const.TextareaPanelType.forward;
				this.panelContext.messageId = 0;
				this.panelContext.messagesIds = messagesIds;
				this.clear();
				this.focus();
				this.getDraftManager().setDraftPanel(this.draftKey, this.panelType, this.panelContext);
			},
			toggleMarketPanel() {
				const shouldOpenMarket = !this.marketMode;
				if (shouldOpenMarket) {
					this.panelContext.messageId = 0;
				}
				this.panelType = shouldOpenMarket ? im_v2_const.TextareaPanelType.market : im_v2_const.TextareaPanelType.none;
			},
			restoreMarketPanel() {
				if (!this.showMarketIcon || this.panelType !== im_v2_const.TextareaPanelType.none) {
					return;
				}
				if (!im_v2_lib_localStorage.LocalStorageManager.getInstance().get(im_v2_const.LocalStorageKey.textareaMarketOpened, false)) {
					return;
				}
				const availableApps = im_v2_lib_market.MarketManager.getInstance().getAvailablePlacementsByType(im_v2_const.PlacementType.textarea, this.dialogId);
				if (!main_core.Type.isArrayFilled(availableApps)) {
					return;
				}
				this.panelType = im_v2_const.TextareaPanelType.market;
			},
			async adjustTextareaHeight() {
				// the watcher of the text runs before the render, so text put into the field by the code
				// is not in the element yet: measure after the render.
				await this.$nextTick();
				const textarea = this.$refs.textarea;
				if (!textarea) {
					return;
				}
				const floorHeight = Math.max(this.resizedTextareaHeight ?? 0, this.minHeight);
				const fitsCurrentHeight = textarea.scrollHeight <= textarea.clientHeight;
				if (fitsCurrentHeight && this.textareaHeight === floorHeight) {
					return;
				}

				// Pin the wrapper height (and opt the textarea out of the flex stretch) so the
				// auto-measure collapse below cannot leak into the message list layout — the input
				// panel height only changes on the final assignment. See ERR-007.
				const wrapper = textarea.closest('.bx-im-textarea__top');
				if (!wrapper) {
					return;
				}
				main_core.Dom.style(wrapper, 'height', `${wrapper.offsetHeight}px`);
				main_core.Dom.style(textarea, 'align-self', 'flex-start');
				this.textareaHeight = 'auto';
				await this.$nextTick();
				const contentHeight = Math.min(TextareaHeight.max, textarea.scrollHeight);
				this.textareaHeight = Math.max(contentHeight, floorHeight);
				await this.$nextTick();
				main_core.Dom.style(wrapper, 'height', '');
				main_core.Dom.style(textarea, 'align-self', '');
			},
			saveTextareaHeight() {
				const WRITE_TO_STORAGE_TIMEOUT = 200;
				clearTimeout(this.saveTextareaTimeout);
				this.saveTextareaTimeout = setTimeout(() => {
					im_v2_lib_localStorage.LocalStorageManager.getInstance().set(this.heightStorageKey, this.resizedTextareaHeight);
				}, WRITE_TO_STORAGE_TIMEOUT);
			},
			restoreTextareaHeight() {
				const rawSavedHeight = im_v2_lib_localStorage.LocalStorageManager.getInstance().get(this.heightStorageKey);
				const savedHeight = Number.parseInt(rawSavedHeight, 10);
				if (!savedHeight) {
					return;
				}
				const clampedHeight = Math.max(savedHeight, this.minHeight);
				this.resizedTextareaHeight = clampedHeight;
				this.textareaHeight = clampedHeight;
			},
			checkMessageExists(messageId) {
				return this.$store.getters['messages/isExists'](messageId);
			},
			verifyPanelContext(panelContext) {
				if (panelContext.messagesIds) {
					return panelContext.messagesIds.every(messageId => this.checkMessageExists(messageId));
				}
				return this.checkMessageExists(panelContext.messageId);
			},
			async restorePanel() {
				const {
					text = '',
					panelType = im_v2_const.TextareaPanelType.none,
					panelContext = {
						messageId: 0
					}
				} = await this.getDraftManager().getDraft(this.draftKey);
				const noPanel = this.panelType === im_v2_const.TextareaPanelType.none;
				if (!noPanel && !this.verifyPanelContext(panelContext)) {
					return;
				}
				this.text = text;
				if (noPanel) {
					this.panelType = panelType;
				}
				this.panelContext = panelContext;
			},
			async restorePanels() {
				// the object form of withDraft owns both restores in restoreOwnDraft()
				if (main_core.Type.isPlainObject(this.withDraft)) {
					return;
				}

				// draft panels have priority, market is restored only into a free panel slot
				if (this.text === '' && this.withDraft) {
					await this.restorePanel();
				}
				this.restoreMarketPanel();
			},
			onBeforeEscape() {
				// the recording leaves before anything else the field holds. Esc is delegated to
				// `cancelRecording()` of the panel, which drops the record, frees the microphone and names
				// the cancel, and its way out comes back here as a close; the branch lives in the
				// subscriber of the field, because a subscription of the panel would take the Esc of the
				// reply panel standing behind it
				if (this.isVoiceRecording) {
					// the panel closes on the key whether its ref is there or not: unmounting it cancels
					// the session all the same, and an Esc reported as handled has to reach the recording
					if (this.$refs.voiceRecordingPanel) {
						this.$refs.voiceRecordingPanel.cancelRecording();
					} else {
						this.closeVoiceRecording();
					}
					return im_v2_lib_escManager.EscEventAction.handled;
				}

				// opt-in gate: with the prop off (imopenlines operator console) Esc leaves the market panel alone.
				// The focus check keeps this global subscriber local: outside the input zone Esc neither closes the
				// panel nor counts as handled, so the general Esc chain runs as it did before keyboard navigation.
				if (this.withKeyboardNavigation && this.marketMode && this.isFocusInsideInputZone()) {
					this.closePanel();
					this.returnFocusToMarketIcon();
					return im_v2_lib_escManager.EscEventAction.handled;
				}
				if (this.hasActiveMessageAction()) {
					this.closePanel();
					return im_v2_lib_escManager.EscEventAction.handled;
				}

				// keyboard navigation: Esc steps out of typing by moving focus from the field to the input area,
				// which carries the visible ring. A second Esc (focus already on the area) is ignored so the
				// general Esc chain closes the chat.
				// onBeforeEscape is a global subscriber, so every branch that reads focus asks the DOM. That is
				// why isFieldFocused is a method: document.activeElement is not reactive, so a computed would
				// cache its first answer for good and every later Esc would see the focus state of the first.
				if (this.withKeyboardNavigation) {
					if (this.isFieldFocused()) {
						this.focusInputArea();
						return im_v2_lib_escManager.EscEventAction.handled;
					}
					return im_v2_lib_escManager.EscEventAction.ignored;
				}

				// legacy behavior (prop off): swallow Esc while the focused field still has text
				if (this.isFieldFocused() && !this.isEmptyText) {
					return im_v2_lib_escManager.EscEventAction.handled;
				}
				return im_v2_lib_escManager.EscEventAction.ignored;
			},
			// a method, so the answer is read from the DOM on every call - see the note in onBeforeEscape
			isFieldFocused() {
				return this.$refs.textarea === document.activeElement;
			},
			returnFocusToMarketIcon() {
				this.$refs.marketIcon?.$el?.focus({
					preventScroll: true
				});
			},
			isFocusInsideInputZone() {
				return Boolean(this.$el?.contains(document.activeElement));
			},
			onMouseUp(event) {
				this.getToolbarManager().handleTextSelect(event, this.$refs.textarea);
			},
			async onKeyDown(event) {
				im_v2_lib_analytics.Analytics.getInstance().onTypeMessage(this.dialog);
				this.getToolbarManager().hide();
				if (this.showSlashCommand && this.slashCommandEnabled) {
					const handledBySlashCommand = this.slashCommandManager.onActiveSlashCommandKeyDown(event);
					if (handledBySlashCommand) {
						return;
					}
				}
				if (this.showMention && this.withMention) {
					this.mentionDetector.onActiveMentionKeyDown(event);
					return;
				}
				const sendMessageCombination = im_v2_lib_hotkey.isSendMessageCombination(event);
				const newLineCombination = im_v2_lib_hotkey.isNewLineCombination(event);
				if (sendMessageCombination && !newLineCombination) {
					event.preventDefault();
					void this.sendMessage();
					return;
				}
				if (newLineCombination) {
					this.handleNewLine();
					return;
				}
				const tabCombination = im_v2_lib_utils.Utils.key.isCombination(event, 'Tab');
				if (tabCombination) {
					this.handleTab(event);
					return;
				}
				if (im_v2_lib_hotkey.isTextDecorationCombination(event)) {
					event.preventDefault();
					this.text = im_v2_lib_textarea.Textarea.handleDecorationTag(this.$refs.textarea, event.code, this.isMarkdownInputAvailable);
					return;
				}
				if (this.text === '' && im_v2_lib_utils.Utils.key.isCombination(event, im_v2_const.HotkeyCombination.editMessage.lastOwn)) {
					this.handleLastOwnMessageEdit(event);
					return;
				}
				this.mentionDetector?.onKeyDown(event);
				this.slashCommandManager?.onKeyDown(event);
			},
			handleNewLine() {
				this.text = im_v2_lib_textarea.Textarea.addNewLine(this.$refs.textarea);
			},
			handleTab(event) {
				event.preventDefault();
				if (event.shiftKey) {
					this.text = im_v2_lib_textarea.Textarea.removeTab(this.$refs.textarea);
					return;
				}
				this.text = im_v2_lib_textarea.Textarea.addTab(this.$refs.textarea);
			},
			isTextInputKey(event) {
				const isAltGraph = event.getModifierState?.('AltGraph') === true;
				if (event.isComposing || event.metaKey || event.ctrlKey && !isAltGraph || event.altKey && !isAltGraph) {
					return false;
				}

				// a single-character key produces text (letters, digits, punctuation); Shift is allowed
				return event.key.length === 1;
			},
			isNativeTextInputStart(event) {
				return event.isComposing || event.key === 'Dead' || event.key === 'Process' || event.keyCode === 229;
			},
			// Esc leaves typing by moving focus from the field to the input area, which is the composer's own Tab
			// stop. The field is out of the Tab order (tabindex="-1"), so nothing ever has to carry focus out of
			// it with Tab - which is what lets Tab keep inserting a tab character while typing. Entering the
			// field is always explicit: Enter, Space, a printable key or a click.
			focusInputArea() {
				const field = this.$refs.textarea;
				if (field) {
					this.savedSelection = {
						start: field.selectionStart,
						end: field.selectionEnd
					};
				}
				this.$refs['textarea-content']?.focus({
					preventScroll: true
				});
			},
			// The other moment the caret is worth writing down: focus leaving the field. A caret the user moved
			// with the mouse changes no text, so the watcher that drops a stale one never fires for it - without
			// this, returning to the area and typing would put the character back where Esc once found it.
			rememberSelection() {
				const field = this.$refs.textarea;
				if (!field) {
					return;
				}
				this.savedSelection = {
					start: field.selectionStart,
					end: field.selectionEnd
				};
			},
			resumeTyping(character = '') {
				const field = this.$refs.textarea;
				if (!field) {
					return;
				}
				field.focus({
					preventScroll: true
				});
				this.restoreSelection();
				if (character === '') {
					return;
				}

				// the area is not a text input, so the keystroke that resumed typing cannot be delivered by the
				// default action - it is inserted at the restored caret instead
				field.setRangeText(character, field.selectionStart, field.selectionEnd, 'end');
				this.text = field.value;
			},
			restoreSelection() {
				if (!this.savedSelection) {
					this.moveCaretToEnd();
					return;
				}
				this.$refs.textarea.setSelectionRange(this.savedSelection.start, this.savedSelection.end);
			},
			moveCaretToEnd() {
				const field = this.$refs.textarea;
				if (!field) {
					return;
				}
				const position = field.value.length;
				field.setSelectionRange(position, position);
			},
			handleLastOwnMessageEdit(event) {
				event.preventDefault();
				const lastOwnMessage = this.$store.getters['messages/getLastOwnMessage'](this.dialog.chatId);
				if (this.isMessageSending(lastOwnMessage)) {
					return;
				}
				const lastOwnMessageId = this.$store.getters['messages/getLastOwnMessageId'](this.dialog.chatId);
				const isEditable = im_v2_lib_message.MessageManager.isEditable(lastOwnMessageId);
				if (isEditable) {
					this.openEditPanel(lastOwnMessageId);
				}
			},
			isMessageSending(message) {
				return message?.sending === true && message.error !== true;
			},
			async onSendMessage(event) {
				const {
					text,
					dialogId
				} = event.getData();
				if (this.dialogId !== dialogId) {
					return;
				}
				await this.getDialogReadyPromise();
				this.getSendingService().sendMessage({
					text,
					dialogId: this.dialogId
				});
			},
			onResizeStart(event) {
				this.resizeManager.onResizeStart(event, this.textareaHeight);
			},
			async onFileSelect({
				event,
				sendAsFile
			}) {
				await this.addFilesToPreviewSession(Object.values(event.target.files), sendAsFile);
			},
			async onDiskFileSelect({
				files
			}) {
				const messageId = this.panelEditedMessageId;

				// the batch of a draft never mixes sources, and the disk one replaces it inside the service; the
				// batch of an edit holds both sources at once, so the pick joins it and it is kept
				if (messageId === null) {
					this.discardPreviewSession();
				}
				const multiUploadingResult = await this.getUploadManager().addDiskFiles({
					files,
					dialogId: this.dialogId,
					messageId
				});
				this.notifyValidationErrors(multiUploadingResult.errors);
				this.notifyBatchLimitRefusal(multiUploadingResult.overLimitCount, messageId);
				const [sessionId] = multiUploadingResult.uploaderIds;
				if (sessionId) {
					this.getUploadingService().leasePreviewSession(sessionId, this.previewSessionOwnerId);
					if (this.isUnmounted) {
						this.releasePreviewSession(sessionId);
						return;
					}
					this.openUploadPreview(sessionId, messageId);
				}
			},
			async addFilesToPreviewSession(files, sendAsFile = false) {
				const messageId = this.panelEditedMessageId;
				try {
					const {
						sessionId,
						errors,
						overLimitCount
					} = await this.getUploadManager().addFilesToPreview({
						files,
						dialogId: this.dialogId,
						messageId,
						sendAsFile
					});
					const uploadingService = this.getUploadingService();
					uploadingService.leasePreviewSession(sessionId, this.previewSessionOwnerId);
					this.notifyValidationErrors(errors);
					this.notifyBatchLimitRefusal(overLimitCount, messageId);
					if (this.isUnmounted) {
						this.releasePreviewSession(sessionId);
						return;
					}
					if (uploadingService.getPreviewSessionFiles(sessionId).length === 0) {
						uploadingService.destroyPreviewSession(sessionId);
						return;
					}

					// an already opened popup keeps its session: the files just joined the batch
					this.openUploadPreview(sessionId, messageId);
				} catch (error) {
					// the add can fail before a single file joins the batch, and then the pick looks ignored
					im_v2_lib_logger.Logger.error('ChatTextarea: adding files to the batch failed', error);
					im_v2_lib_notifier.Notifier.onDefaultError();
				}
			},
			// the scope comes in with the batch: only the batch of an edit puts the window into the edit mode
			openUploadPreview(sessionId, messageId = null) {
				// the text moves into the caption, so a popup left here would keep a query of erased text
				if (this.showMention) {
					this.closeMentionPopup();
				}
				// the toolbar shares its popup id with the caption one, so it has to go the same way
				this.getToolbarManager().hide();

				// a batch this textarea stops pointing at is one nothing will ever free: releases go by previewSessionId
				if (this.previewSessionId && this.previewSessionId !== sessionId) {
					this.releasePreviewSession(this.previewSessionId, {
						removeFilesFromServer: this.canRemoveHeldFilesFromServer
					});
				}

				// the save lock and the fate of the composition belong to one batch: another must not inherit them
				if (this.previewSessionId !== sessionId) {
					this.isSavingEditedFiles = false;
					this.editedCompositionFate = EditedCompositionFate.unsent;
				}
				this.previewSessionId = sessionId;
				this.previewSessionMessageId = messageId;
			},
			onUploadPreviewClose() {
				const wasEditingAttachments = this.isEditingAttachments;
				this.discardPreviewSession();

				// closing the window leaves the edit as a whole: an abandoned edit must not stay in the field
				if (wasEditingAttachments) {
					this.closePanel();
				}
			},
			// closing the popup ends the composing for this textarea only, so the batch is released and
			// not destroyed: another textarea of the same dialog may still be composing into it
			discardPreviewSession() {
				// an edit given up takes its uploaded files with it: their copies belong to no message
				this.releasePreviewSession(this.previewSessionId, {
					removeFilesFromServer: this.canRemoveHeldFilesFromServer
				});
				this.previewSessionId = null;
				this.previewSessionMessageId = null;
				// the lock and the fate go with the window: the next one would open locked over a batch that is gone
				this.isSavingEditedFiles = false;
				this.editedCompositionFate = EditedCompositionFate.unsent;
			},
			// the batch can be shared with another textarea of the same dialog, so this gives up the lease
			// of this component only, and the holder dies with its last owner. The id comes in explicitly
			// because a session that arrives after beforeUnmount never reaches previewSessionId.
			releasePreviewSession(sessionId, {
				removeFilesFromServer = false
			} = {}) {
				if (!sessionId) {
					return;
				}
				this.getUploadingService().releasePreviewSession(sessionId, this.previewSessionOwnerId, {
					removeFilesFromServer
				});
			},
			notifyValidationErrors(errors) {
				errors.forEach(error => {
					im_v2_lib_notifier.Notifier.file.showValidationError(error.text);
				});
			},
			// the batch limit refuses files without a validation error behind it, and the popup message
			// about it needs a popup: the very first portion over the limit has none yet
			notifyBatchLimitRefusal(overLimitCount, messageId = null) {
				if (overLimitCount > 0) {
					im_v2_lib_notifier.Notifier.file.showValidationError(this.loc(messageId === null ? 'IM_TEXTAREA_UPLOAD_PREVIEW_POPUP_FILES_LIMIT_MESSAGE_100' : 'IM_TEXTAREA_UPLOAD_PREVIEW_POPUP_EDIT_FILES_LIMIT_MESSAGE_10'));
				}
			},
			isOwnInsertEvent(payload) {
				if (this.dialogId !== payload.dialogId) {
					return false;
				}
				return (payload.target ?? im_v2_const.TextareaTarget.main) === im_v2_const.TextareaTarget.main;
			},
			onInsertMention(event) {
				const {
					mentionText,
					mentionReplacement,
					mentionedUserId = null,
					isMentionSymbol = true,
					registerReplacement = true
				} = event.getData();
				let {
					textToReplace = ''
				} = event.getData();
				if (!this.isOwnInsertEvent(event.getData())) {
					return;
				}
				if (this.isCopilotBotAlreadyMentioned(mentionedUserId)) {
					this.dropMentionQuery(textToReplace, isMentionSymbol);
					this.focus();
					return;
				}
				if (registerReplacement) {
					const mentions = this.mentionReplacementMap.add(mentionText, mentionReplacement, mentionedUserId);
					this.getDraftManager().setDraftMentions(this.draftKey, mentions);
				}
				const mentionSymbol = isMentionSymbol ? this.mentionDetector.getMentionSymbol() : '';
				textToReplace = `${mentionSymbol}${textToReplace}`;
				this.text = im_v2_lib_textarea.Textarea.insertMention(this.$refs.textarea, {
					textToInsert: mentionText,
					textToReplace
				});
				this.mentionDetector.clearMentionSymbol();
			},
			// the pick is suppressed, but the query typed in the field is not the popup's to keep: left in
			// place it travels into the message, and the symbol it was opened with would skew the next insert
			dropMentionQuery(textToReplace, isMentionSymbol) {
				const mentionSymbol = isMentionSymbol ? this.mentionDetector.getMentionSymbol() : '';
				const textToRemove = `${mentionSymbol}${textToReplace}`;
				if (textToRemove.length > 0) {
					this.text = im_v2_lib_textarea.Textarea.removeTextBeforeCursor(this.$refs.textarea, textToRemove);
				}
				this.mentionDetector.clearMentionSymbol();
			},
			isCopilotBotAlreadyMentioned(mentionedUserId) {
				if (mentionedUserId === null) {
					return false;
				}
				if (!this.copilotManager.isCopilotBot(mentionedUserId)) {
					return false;
				}

				// the rendered draft text is the source of truth, not the user-id registry:
				// a restored draft rehydrates replacements via set(), which drops the user ids
				return this.mentionReplacementMap.apply(this.text).includes(`[USER=${mentionedUserId}]`);
			},
			onInsertText(event) {
				if (!this.isOwnInsertEvent(event.getData())) {
					return;
				}
				this.text = im_v2_lib_textarea.Textarea.insertText(this.$refs.textarea, event.getData());
			},
			onEditMessage(event) {
				const {
					messageId,
					dialogId
				} = event.getData();
				if (this.dialogId !== dialogId) {
					return;
				}
				this.openEditPanel(messageId);
			},
			onReplyMessage(event) {
				const {
					messageId,
					dialogId
				} = event.getData();
				if (this.dialogId !== dialogId) {
					return;
				}
				this.openReplyPanel(messageId);
			},
			onClosePanelRequest(event) {
				const {
					dialogId
				} = event.getData();
				if (this.dialogId !== dialogId) {
					return;
				}
				this.closePanel();
			},
			onFocusInput(event) {
				const {
					dialogId
				} = event.getData();
				if (this.dialogId !== dialogId) {
					return;
				}
				this.focus();
			},
			onInsertForward(event) {
				const {
					messagesIds,
					dialogId
				} = event.getData();
				if (this.dialogId !== dialogId) {
					return;
				}
				this.openForwardPanel(messagesIds);
			},
			async onPaste(event) {
				this.text = im_v2_lib_textarea.Textarea.handlePasteUrl(this.$refs.textarea, event, this.isMarkdownInputAvailable);
				if (!this.withUploadMenu || !this.dialogReady) {
					return;
				}
				if (!event.clipboardData || !ui_uploader_core.isFilePasted(event.clipboardData)) {
					return;
				}
				event.preventDefault();
				await this.addFilesToPreviewSession(await ui_uploader_core.getFilesFromDataTransfer(event.clipboardData));
			},
			async onOpenUploadPreview(event) {
				const {
					dialogId,
					files
				} = event.getData();
				if (this.dialogId !== dialogId) {
					return;
				}
				await this.addFilesToPreviewSession(files);
			},
			onMarketIconClick() {
				this.toggleMarketPanel();
			},
			onMessageDeleted(event) {
				const {
					messageId
				} = event.getData();
				if (this.panelContext.messageId === messageId) {
					this.closePanel();
				}
				if (this.panelContext.messagesIds && this.panelContext.messagesIds.includes(messageId)) {
					this.closePanel();
				}
			},
			onShowFormatToolbar(event) {
				const {
					bindPosition
				} = event.getData();
				this.formatToolbarPosition = bindPosition;
				this.showFormatToolbar = true;
			},
			onHideFormatToolbar() {
				this.showFormatToolbar = false;
			},
			onFormatToolbarUpdateText(newText) {
				this.text = newText;
			},
			initResizeManager() {
				this.resizeManager = new ResizeManager({
					direction: ResizeDirection.up,
					maxHeight: TextareaHeight.max,
					minHeight: this.minHeight
				});
				this.resizeManager.subscribe(ResizeManager.events.onHeightChange, ({
					data: {
						newHeight
					}
				}) => {
					im_v2_lib_logger.Logger.warn('Textarea: Resize height change', newHeight);
					this.textareaHeight = newHeight;
				});
				this.resizeManager.subscribe(ResizeManager.events.onResizeStop, () => {
					im_v2_lib_logger.Logger.warn('Textarea: Resize stop');
					this.resizedTextareaHeight = this.textareaHeight;
					this.saveTextareaHeight();
				});
			},
			initSendingService() {
				if (this.sendingService) {
					return;
				}
				this.sendingService = im_v2_provider_service_sending.SendingService.getInstance();
			},
			// the browser is probed once per page, and only where the feature is switched on at all
			async resolveVoiceCapability() {
				if (!im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isVoiceMessageRecordingAvailable)) {
					return;
				}
				this.voiceCapability = await im_v2_lib_voiceRecorder.CapabilityResolver.resolve();
			},
			async loadRecordingPanel() {
				if (this.recordingPanel) {
					return true;
				}
				try {
					const {
						RecordingPanel
					} = await main_core.Runtime.loadExtension(VOICE_RECORDING_EXTENSION);
					this.recordingPanel = ui_vue3.markRaw(RecordingPanel);
					return true;
				} catch (error) {
					im_v2_lib_logger.Logger.error('ChatTextarea: the interface of the voice recording did not load', error);
					im_v2_lib_notifier.Notifier.onDefaultError();
					return false;
				}
			},
			// isLocked says how the recording is held: a hold ends with its release, a keyboard start does
			// not. isStartedFromPointer says whether a pointer stood behind the press at all
			async startVoiceRecording({
				isLocked,
				isStartedFromPointer
			}) {
				// recording over a record that came back gives it up
				this.forgetReturnedVoiceRecord();
				const pressedInDialogId = this.dialogId;

				// a gesture that ended inside this wait held nothing by the time the panel opened: such a
				// press is a click, and a click leaves the recording running without a hold
				this.isVoiceHoldOver = false;
				this.isVoiceHoldCancelled = false;
				main_core.Event.bind(document, 'pointerup', this.onVoiceHoldOver);
				main_core.Event.bind(document, 'pointercancel', this.onVoiceHoldCancelled);
				const isPanelReady = await this.loadRecordingPanel();
				main_core.Event.unbind(document, 'pointerup', this.onVoiceHoldOver);
				main_core.Event.unbind(document, 'pointercancel', this.onVoiceHoldCancelled);

				// the press belongs to the field and to the chat it was made in, and an interrupted
				// gesture is no press at all
				const isPressStillStanding = !this.isUnmounted && this.dialogId === pressedInDialogId && (isLocked || !this.isVoiceHoldCancelled);
				if (!isPanelReady || !isPressStillStanding) {
					return;
				}
				this.isVoiceRecordingLocked = isLocked || this.isVoiceHoldOver;
				this.isVoiceStartedFromPointer = isStartedFromPointer;
				this.isVoiceRecording = true;
			},
			onVoiceHoldOver() {
				this.isVoiceHoldOver = true;
			},
			onVoiceHoldCancelled() {
				this.isVoiceHoldCancelled = true;
			},
			// the actions of the panel leave with it, so focus standing on one of them lands in the field
			closeVoiceRecording() {
				// the record goes before the panel it stood in: a queue read while it is still shown would
				// find the very same record and put it right back on the screen
				this.forgetReturnedVoiceRecord();
				this.isVoiceRecording = false;
				void this.$nextTick(() => this.focus());
			},
			// the record on the screen is given up by the user; whatever came back after it takes its place
			forgetReturnedVoiceRecord() {
				this.shownVoiceRecord = null;
			},
			initUnsentVoiceRecords() {
				this.unsentVoiceRecords = im_v2_lib_voiceRecorder.UnsentVoiceRecords.getInstance();
				this.unsentVoiceRecords.subscribe(im_v2_lib_voiceRecorder.UnsentVoiceRecords.event.onRecordReturned, this.onVoiceRecordReturned);
				void this.showReturnedVoiceRecord();
			},
			destroyUnsentVoiceRecords() {
				this.unsentVoiceRecords.unsubscribe(im_v2_lib_voiceRecorder.UnsentVoiceRecords.event.onRecordReturned, this.onVoiceRecordReturned);
				this.queueShownVoiceRecord();
				if (this.isVoiceRecording) {
					this.getInputActionService().stopAction(im_v2_lib_inputAction.InputAction.recordingVoice);
				}
			},
			// the record leaves the screen with the panel but not the field: it goes back to the head of
			// the queue of its own chat, ahead of anything that came back later
			queueShownVoiceRecord() {
				if (!this.shownVoiceRecord) {
					return;
				}
				const {
					dialogId,
					record,
					failure
				} = this.shownVoiceRecord;
				this.shownVoiceRecord = null;
				this.getUnsentVoiceRecords().unshift(dialogId, record, failure);
			},
			onVoiceRecordReturned(event) {
				if (event.getData().dialogId !== this.dialogId) {
					return;
				}
				if (this.isVoiceRecording) {
					im_v2_lib_notifier.Notifier.onDefaultError();
					return;
				}
				void this.showReturnedVoiceRecord();
			},
			// the queue outlives this field, and its panel is loaded only when the queue has something to show
			async showReturnedVoiceRecord() {
				const dialogId = this.dialogId;
				const unsentVoiceRecords = this.getUnsentVoiceRecords();
				if (this.isVoiceRecording || this.shownVoiceRecord || !unsentVoiceRecords.hasFor(dialogId)) {
					return;
				}
				const isPanelReady = await this.loadRecordingPanel();
				if (!isPanelReady || this.isUnmounted || this.dialogId !== dialogId || this.isVoiceRecording || this.shownVoiceRecord) {
					return;
				}
				const returnedRecord = unsentVoiceRecords.takeNext(dialogId);
				if (!returnedRecord) {
					return;
				}
				const {
					record,
					failure
				} = returnedRecord;
				this.shownVoiceRecord = {
					dialogId,
					record: ui_vue3.markRaw(record),
					failure
				};
				// there is neither a hold nor a pointer behind a record that came back
				this.isVoiceRecordingLocked = true;
				this.isVoiceStartedFromPointer = false;
				this.isVoiceRecording = true;
			},
			// a record is the whole message: no caption, and a reply keeps the quote of the panel
			async onVoiceRecorded(record) {
				const recordDialogId = this.dialogId;
				const recordPanelType = this.panelType;
				const recordPanelContext = this.panelContext;
				const hasActiveMessageAction = this.hasActiveMessageAction();
				const replyId = this.replyMode ? recordPanelContext.messageId : undefined;
				if (!record.isTargetFormat) {
					this.returnVoiceRecord(recordDialogId, record, im_v2_provider_service_uploading.VoiceSendFailure.unknown);
					return;
				}
				const uploadingService = this.getUploadingService();
				const unsentVoiceRecords = this.getUnsentVoiceRecords();
				let registeredUploaderId = null;
				try {
					const {
						uploaderIds,
						loadAllComplete
					} = await this.getUploadManager().upload({
						files: [this.createVoiceRecordFile(record)],
						dialogId: recordDialogId,
						fileParams: {
							isVoiceNote: true,
							// transcribed whichever way it reached the target format, server conversion included
							isTranscribable: true,
							durationSeconds: record.durationSeconds
						}
					});
					const [uploaderId] = uploaderIds;
					if (!uploaderId) {
						throw new Error('the record was not taken into the batch');
					}
					unsentVoiceRecords.hold(uploaderId, recordDialogId, record);
					registeredUploaderId = uploaderId;
					await loadAllComplete;
					uploadingService.sendMessageWithFiles({
						uploaderId,
						text: '',
						replyId
					});
					if (hasActiveMessageAction && this.dialogId === recordDialogId && this.panelType === recordPanelType && this.panelContext === recordPanelContext) {
						this.closePanel();
					}
				} catch (error) {
					// nothing of the record is in the chat, so it belongs back in the panel
					im_v2_lib_logger.Logger.error('ChatTextarea: sending the voice record failed', error);
					if (registeredUploaderId && !unsentVoiceRecords.release(registeredUploaderId)) {
						return;
					}
					this.returnVoiceRecord(recordDialogId, record, im_v2_provider_service_uploading.VoiceSendFailure.unknown);
				}
			},
			returnVoiceRecord(dialogId, record, failure) {
				this.getUnsentVoiceRecords().push(dialogId, record, failure);
			},
			createVoiceRecordFile(record) {
				const [, subtype] = record.blob.type.split(';')[0].split('/');
				const extension = VOICE_RECORD_EXTENSION_BY_SUBTYPE[subtype] ?? subtype;
				return new File([record.blob], `${VOICE_RECORD_NAME}.${extension || VOICE_RECORD_DEFAULT_EXTENSION}`, {
					type: record.blob.type
				});
			},
			getDialogReadyPromise() {
				if (!this.dialogReadyPromise) {
					this.dialogReadyPromise = this.initDialogReadyPromise();
				}
				return this.dialogReadyPromise;
			},
			async initDialogReadyPromise() {
				if (this.deferredDialogPromise) {
					try {
						await this.deferredDialogPromise;
					} catch (error) {
						im_v2_lib_logger.Logger.error('ChatTextarea: deferredDialogPromise rejected', error);
					}
					// wait for parent to finish flushing prop updates (withMention/dialogId)
					await this.$nextTick();
				}
				void this.restorePanels();
				if (this.withMention || this.slashCommandEnabled) {
					await this.initMentionReplacementMap();
					this.initMentionDetector();
				}
				if (this.slashCommandEnabled) {
					this.initSlashCommandManager();
				}
				this.dialogReady = true;
			},
			async restoreOwnDraft() {
				// re-read storage first so a draft sent in another tab does not resurface
				await this.getDraftManager().reloadDraftFromStorage(this.draftKey);
				if (this.text === '') {
					await this.restorePanel();
				}
				this.restoreMarketPanel();
			},
			async initMentionReplacementMap() {
				const {
					mentions = {}
				} = await this.getDraftManager().getDraft(this.draftKey);

				// markRaw keeps the private fields of the map reachable: a reactive proxy would break them
				this.mentionReplacementMap = ui_vue3.markRaw(new MentionReplacementMap());
				this.mentionReplacementMap.set(mentions);
			},
			initMentionDetector() {
				this.mentionDetector = new MentionDetector({
					textareaElement: this.$refs.textarea,
					context: {
						emitter: this.getEmitter()
					},
					gridIds: this.mentionGridIds
				});
				this.mentionDetector.subscribe(MentionDetectorEvents.showMentionPopup, event => {
					const {
						mentionQuery
					} = event.getData();
					this.showMentionPopup(mentionQuery);
				});
				this.mentionDetector.subscribe(MentionDetectorEvents.hideMentionPopup, () => {
					this.closeMentionPopup();
				});
			},
			initSlashCommandManager() {
				this.slashCommandManager = new SlashCommandManager({
					textareaElement: this.$refs.textarea,
					context: {
						emitter: this.getEmitter()
					},
					getHasItems: () => this.slashCommandHasItems
				});
				this.slashCommandManager.subscribe(SlashCommandManagerEvents.showSlashCommandPopup, event => {
					const {
						query
					} = event.getData();
					this.showSlashCommandPopup(query);
				});
				this.slashCommandManager.subscribe(SlashCommandManagerEvents.hideSlashCommandPopup, () => {
					this.closeSlashCommandPopup();
				});
			},
			getSendingService() {
				return this.sendingService;
			},
			getInputActionService() {
				if (!this.inputSenderService) {
					this.inputSenderService = new InputSenderService(this.dialogId);
				}
				return this.inputSenderService;
			},
			getDraftManager() {
				if (!this.draftManager) {
					this.draftManager = im_v2_lib_draft.DraftManager.getInstance();
				}
				return this.draftManager;
			},
			getToolbarManager() {
				if (!this.toolbarManager) {
					this.toolbarManager = new FormatToolbarManager();
					this.toolbarManager.subscribe(FormatToolbarManager.events.show, this.onShowFormatToolbar);
					this.toolbarManager.subscribe(FormatToolbarManager.events.hide, this.onHideFormatToolbar);
				}
				return this.toolbarManager;
			},
			getMessageService() {
				if (!this.messageService) {
					this.messageService = new im_v2_provider_service_message.MessageService({
						chatId: this.dialog.chatId
					});
				}
				return this.messageService;
			},
			getUploadingService() {
				if (!this.uploadingService) {
					this.initUploadingService();
				}
				return this.uploadingService;
			},
			getUnsentVoiceRecords() {
				this.unsentVoiceRecords ??= im_v2_lib_voiceRecorder.UnsentVoiceRecords.getInstance();
				return this.unsentVoiceRecords;
			},
			initUploadingService() {
				this.uploadingService = im_v2_provider_service_uploading.UploadingService.getInstance();

				// freeing an orphaned session reaches the service after beforeUnmount unsubscribed:
				// a textarea already gone must not subscribe again, nothing would unsubscribe it
				if (this.isUnmounted) {
					return;
				}
				this.startFileUploadAction = () => {
					this.getInputActionService().startAction(im_v2_lib_inputAction.InputAction.sendingFile);
				};
				this.stopFileUploadAction = () => {
					this.getInputActionService().stopAction(im_v2_lib_inputAction.InputAction.sendingFile);
				};
				this.uploadingService.subscribe(im_v2_provider_service_uploading.UploadingService.event.uploadStart, this.startFileUploadAction);
				this.uploadingService.subscribe(im_v2_provider_service_uploading.UploadingService.event.uploadComplete, this.stopFileUploadAction);
				this.uploadingService.subscribe(im_v2_provider_service_uploading.UploadingService.event.uploadCancel, this.stopFileUploadAction);
				this.uploadingService.subscribe(im_v2_provider_service_uploading.UploadingService.event.uploadError, this.stopFileUploadAction);
			},
			unbindUploadingService() {
				if (!this.uploadingService) {
					return;
				}
				this.uploadingService.unsubscribe(im_v2_provider_service_uploading.UploadingService.event.uploadStart, this.startFileUploadAction);
				this.uploadingService.unsubscribe(im_v2_provider_service_uploading.UploadingService.event.uploadComplete, this.stopFileUploadAction);
				this.uploadingService.unsubscribe(im_v2_provider_service_uploading.UploadingService.event.uploadCancel, this.stopFileUploadAction);
				this.uploadingService.unsubscribe(im_v2_provider_service_uploading.UploadingService.event.uploadError, this.stopFileUploadAction);
			},
			getUploadManager() {
				if (!this.uploadManager) {
					this.uploadManager = new im_v2_lib_uploading.UploadManager();
				}
				return this.uploadManager;
			},
			// the window is locked for the whole of the save: the composition was taken when the save began, and
			// a file leaving it now would be sent under an id that belongs to nothing
			async onSaveFilesFromPreviewPopup(event) {
				if (this.isSavingEditedFiles) {
					return;
				}
				const {
					sessionId,
					messageId,
					text,
					fileIds
				} = event;

				// the question is asked outside the lock: a confirmation dismissed by Escape or by its cross
				// never answers its promise, and a lock held across it would never come off
				if (fileIds.length === 0 && text.trim() === '') {
					await this.deleteEmptiedMessage(messageId, sessionId);
					return;
				}
				this.isSavingEditedFiles = true;
				try {
					await this.saveEditedFiles(event);
				} finally {
					this.isSavingEditedFiles = false;
				}
			},
			// the save of an edit does not go through the send path: that one gives the batch away and clears the
			// field before any branching, and a refused save has to leave the window as it was
			async saveEditedFiles(event) {
				const {
					sessionId,
					messageId,
					text,
					fileIds
				} = event;
				const uploadedFileIds = await this.getUploadingService().uploadPreviewSession(sessionId).catch(error => {
					// a file that failed is marked in the window and repeated from there: nothing closes here
					im_v2_lib_logger.Logger.error('ChatTextarea: uploading the batch of the edited message failed', error);

					// a window the author closed takes its batch down, and that refusal is not a failure
					if (this.previewSessionId === sessionId) {
						im_v2_lib_notifier.Notifier.onDefaultError();
					}
					return null;
				});
				if (!uploadedFileIds) {
					return;
				}

				// files added in this edit carry temporary ids; the ones the message already had are server ids
				const composition = fileIds.map(fileId => uploadedFileIds.get(fileId) ?? fileId);

				// from here the copies stop being ours to delete: the window stays closable while the answer travels
				this.setEditedCompositionFate(EditedCompositionFate.sent);
				const {
					saved,
					isApplied,
					isEditTargetGone
				} = await this.getMessageService().editMessageFiles(messageId, {
					fileIds: composition,
					text: this.mentionReplacementMap?.apply(text) ?? text
				});

				// the window may be gone by now - closed by hand, or moved on to a batch of its own
				if (this.previewSessionId !== sessionId) {
					return;
				}

				// an edit that found no message was refused before anything could be saved, so its copies go. No
				// other code tells a composition the server never saved from one it saved and failed to sync
				if (isApplied) {
					this.setEditedCompositionFate(EditedCompositionFate.applied);
				} else if (isEditTargetGone) {
					this.setEditedCompositionFate(EditedCompositionFate.unsent);
				}
				if (saved) {
					this.finishSavedEdit(sessionId);
					return;
				}
				if (isEditTargetGone) {
					this.discardPreviewSession();
					this.closePanel();
				}
			},
			// a composition the server applied owns the copies for good, so that fate is never given back
			setEditedCompositionFate(fate) {
				if (this.editedCompositionFate === EditedCompositionFate.applied) {
					return;
				}
				this.editedCompositionFate = fate;
			},
			// an emptied composition on a message without text is a deletion: no update call is made at all
			async deleteEmptiedMessage(messageId, sessionId) {
				const confirmed = await this.confirmMessageDeletion();

				// the answer takes as long as the author needs, and the window may be gone by then
				if (!confirmed || this.previewSessionId !== sessionId) {
					return;
				}
				this.getMessageService().deleteMessages([messageId]);
				this.discardPreviewSession();
				this.closePanel();
			},
			confirmMessageDeletion() {
				return im_v2_lib_confirm.showDeleteEmptyMessageConfirm();
			},
			// the batch leaves the registry before the window goes, or the lease given up on the way out would
			// take the holder down mid-save. The copies stay where they are - the message owns them now
			finishSavedEdit(sessionId) {
				const uploadingService = this.getUploadingService();
				uploadingService.unregisterPreviewSession(sessionId);
				this.previewSessionId = null;
				this.previewSessionMessageId = null;
				this.closePanel();
				this.resetTextarea();
				uploadingService.destroyPreviewSession(sessionId);
			},
			// The caret goes back to the field on every way out of the preview dialog, and the move belongs to
			// the focus trap of the dialog, which is handed this field as its restore target. Moving focus from
			// here would be a second move - and a late one: it would land after the upload has finished and take
			// focus from wherever the user has gone by then.
			async onSendFilesFromPreviewPopup(event) {
				const {
					sessionId,
					text,
					files,
					sendAsFile
				} = event;
				// the send flow owns the session from now on: closing the popup must not destroy it, and
				// the service must stop handing it out, otherwise files picked while the batch is being
				// sent would join a holder about to die
				this.previewSessionId = null;
				this.previewSessionMessageId = null;
				this.getUploadingService().unregisterPreviewSession(sessionId);
				const replyId = this.replyIdForContent;
				const panel = {
					type: this.panelType,
					context: this.panelContext
				};
				let textWithMentions = text;
				let sentSomething = false;
				try {
					textWithMentions = this.mentionReplacementMap?.apply(text) ?? text;

					// the caption is handed over to the sending pipeline right away, so the whole state goes
					// down before the upload await: afterwards the field may hold the next typed message
					this.closePanel();
					this.resetTextarea();

					// the upload is asynchronous, so its chat is taken before the prop moves on
					const {
						dialogId
					} = this;
					const diskFiles = files.filter(file => file.getOrigin() === ui_uploader_core.FileOrigin.SERVER);
					const localFiles = files.filter(file => file.getOrigin() !== ui_uploader_core.FileOrigin.SERVER);
					if (main_core.Type.isArrayFilled(diskFiles)) {
						this.getUploadingService().sendDiskFilesFromPreview({
							files: diskFiles,
							dialogId,
							text: textWithMentions,
							replyId,
							sendAsFile
						});
						sentSomething = true;
					}
					if (main_core.Type.isArrayFilled(localFiles)) {
						const policy = this.getUploadManager().getPolicy(dialogId);
						const multiUploadingResult = await this.getUploadManager().upload({
							files: localFiles,
							dialogId,
							autoUpload: false,
							sendAsFile,
							maxFilesCount: policy?.maxFilesPerMessage
						});
						await multiUploadingResult.loadAllComplete;
						multiUploadingResult.uploaderIds.forEach((uploaderId, index) => {
							this.getUploadingService().sendMessageWithFiles({
								uploaderId,
								text: index === 0 && diskFiles.length === 0 ? textWithMentions : '',
								replyId
							});
						});
						sentSomething = sentSomething || main_core.Type.isArrayFilled(multiUploadingResult.uploaderIds);
					}
				} catch (error) {
					// the batch itself cannot be handed back: part of it may already be on its way, so its
					// holder dies with the send. What comes back is the caption, to be sent again as is,
					// but only while nothing left with it, otherwise it would be sent twice
					im_v2_lib_logger.Logger.error('ChatTextarea: sending the batch from the preview popup failed', error);
					im_v2_lib_notifier.Notifier.onDefaultError();
					if (!sentSomething) {
						this.restoreUnsentCaption({
							text,
							textWithMentions,
							panel
						});
					}
					return;
				} finally {
					// the holder outlives the send: its files are read while the batch is being re-added
					this.getUploadingService().destroyPreviewSession(sessionId);
				}

				// the control is already closed and the files went with it, so a silent return would
				// read as "nothing happened" - a mix of disk and local files may lose only one half.
				// A send that went through needs nothing here: the dialog has already returned the focus
				// to the element it was opened from (see restoreFocusTarget), and a move of its own would
				// take the focus from wherever the user has put it while the files were uploading
				if (!sentSomething) {
					im_v2_lib_notifier.Notifier.onDefaultError();
					this.restoreUnsentCaption({
						text,
						textWithMentions,
						panel
					});
				}
			},
			restoreUnsentCaption({
				text,
				textWithMentions,
				panel
			}) {
				// the user may have started the next message while the files were uploading: their input wins
				if (this.text !== '' || this.panelType !== im_v2_const.TextareaPanelType.none) {
					return;
				}
				if (this.mentionReplacementMap) {
					const mentions = this.mentionReplacementMap.extract(textWithMentions);
					this.mentionReplacementMap.set(mentions);
					this.getDraftManager().setDraftMentions(this.draftKey, mentions);
				}

				// the text goes back through the field, so its own watcher restores the draft text
				this.text = text;
				if (this.canRestorePanel(panel)) {
					this.panelType = panel.type;
					this.panelContext = panel.context;
					this.getDraftManager().setDraftPanel(this.draftKey, panel.type, panel.context);
				}
				if (this.canRestoreFocus()) {
					this.focus();
				}
			},
			canRestorePanel(panel) {
				if (panel.type === im_v2_const.TextareaPanelType.none) {
					return false;
				}

				// only a message-bound panel can go stale: its message may be deleted during the upload
				if (!MESSAGE_ACTION_PANELS.has(panel.type)) {
					return true;
				}
				return this.verifyPanelContext(panel.context);
			},
			canRestoreFocus() {
				// the closed control leaves the focus on the body, but an element the user moved to keeps it
				const {
					activeElement
				} = document;
				return !activeElement || activeElement === document.body || activeElement === this.$refs.textarea;
			},
			closeMentionPopup() {
				this.showMention = false;
				this.mentionQuery = '';
				this.mentionActiveItemId = null;
				this.mentionDetector.onMentionPopupClose();
			},
			getInputElement() {
				return this.$refs.textarea;
			},
			getText() {
				return this.text;
			},
			hasMentionOfUser(userId) {
				return this.mentionReplacementMap?.hasMentionOfUser(this.text, userId) ?? false;
			},
			showMentionPopup(mentionQuery) {
				this.mentionQuery = mentionQuery;
				this.showMention = true;
			},
			onMentionActiveItemChanged(event) {
				// the list owns the active item, the field only mirrors the id it must point at
				this.mentionActiveItemId = event.getData().nodeId;
			},
			closeSlashCommandPopup() {
				this.showSlashCommand = false;
				this.slashCommandQuery = '';
				this.slashCommandHasItems = false;
				this.slashCommandManager?.onSlashCommandPopupClose();
			},
			onSlashCommandItemsChanged(event) {
				const {
					dialogId,
					hasItems
				} = event.getData();
				if (this.dialogId !== dialogId) {
					return;
				}
				this.slashCommandHasItems = hasItems;
			},
			showSlashCommandPopup(query) {
				this.slashCommandQuery = query;
				this.showSlashCommand = true;
			},
			onCloseSlashCommandPopupRequest(event) {
				const {
					dialogId
				} = event.getData();
				if (this.dialogId !== dialogId || !this.showSlashCommand) {
					return;
				}
				this.closeSlashCommandPopup();
			},
			onSlashCommandButtonClick() {
				if (!this.slashCommandManager) {
					return;
				}
				const textarea = this.$refs.textarea;
				textarea.focus({
					preventScroll: true
				});
				const textareaLike = {
					value: textarea.value,
					selectionEnd: textarea.selectionEnd
				};
				if (this.showSlashCommand || isSlashLineStillOpen(textareaLike)) {
					const line = getCurrentLineText(textareaLike);
					const slashIndex = line.indexOf('/');
					if (slashIndex >= 0) {
						// place the caret at the end of the slash fragment so the whole command (e.g. "/help")
						// becomes the query and is replaced on select - otherwise only the "/" would be replaced
						const lineStart = textarea.value.lastIndexOf('\n', textarea.selectionEnd - 1) + 1;
						const nextLineBreak = textarea.value.indexOf('\n', lineStart);
						const caretPosition = nextLineBreak === -1 ? textarea.value.length : nextLineBreak;
						textarea.selectionStart = caretPosition;
						textarea.selectionEnd = caretPosition;
					}
					this.slashCommandManager.openSlashCommandPopup();
					return;
				}

				// "/" is inserted only into a completely empty line: a command must reach the server at the
				// line start (^\/), so we never place it after a mention, existing text or whitespace.
				const lineStart = textarea.value.lastIndexOf('\n', textarea.selectionEnd - 1) + 1;
				const nextLineBreak = textarea.value.indexOf('\n', lineStart);
				const lineEnd = nextLineBreak === -1 ? textarea.value.length : nextLineBreak;
				if (textarea.value.slice(lineStart, lineEnd) !== '') {
					return;
				}
				const caretPosition = lineStart + 1;
				const newValue = `${textarea.value.slice(0, lineStart)}/${textarea.value.slice(lineStart)}`;
				textarea.value = newValue;
				textarea.selectionStart = caretPosition;
				textarea.selectionEnd = caretPosition;
				this.text = newValue;
				this.slashCommandManager.openSlashCommandPopup();
			},
			// the lock of the window is taken off by a render, and the save asks for the focus before that
			// render has run: a field still carrying the disabled attribute would take no focus at all
			async focus() {
				if (this.$refs.textarea?.disabled) {
					await this.$nextTick();
				}
				this.$refs.textarea?.focus({
					preventScroll: true
				});
			},
			onContentClick(event) {
				// a synthetic click from activating a nested button via keyboard has detail 0 and a nested
				// target; do not pull focus back to the field then (it would break navigation over the buttons)
				if (event.detail === 0 && event.target !== event.currentTarget) {
					return;
				}
				this.focus();
			},
			onContentKeyDown(event) {
				// the handler sits on the input area, so keys from the field and from the buttons bubble here
				// too: only the area's own keystrokes drive it
				if (!this.withKeyboardNavigation || event.target !== event.currentTarget) {
					return;
				}
				if (im_v2_lib_utils.Utils.key.isCombination(event, 'Enter') || im_v2_lib_utils.Utils.key.isCombination(event, 'Space')) {
					event.preventDefault();
					this.resumeTyping();
					return;
				}
				if (this.isNativeTextInputStart(event)) {
					// Dead keys and IME need the browser's composition pipeline: move focus before it starts,
					// but do not cancel or synthesize the input.
					this.resumeTyping();
					return;
				}
				if (this.isTextInputKey(event)) {
					event.preventDefault();
					this.resumeTyping(event.key);
				}

				// Tab and Shift+Tab stay with the browser, Esc with the global chain: neither is handled here
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			},
			onAudioInputStart() {
				if (this.isEmptyText) {
					return;
				}
				this.text += ' ';
			},
			onAudioInputResult(inputText) {
				this.text += inputText;
			},
			onCloseComments() {
				this.restoreTextareaHeight();
			},
			getEmitter() {
				return this.$Bitrix.eventEmitter;
			}
		},
		template: `
		<div
			class="bx-im-send-panel__scope bx-im-send-panel__container --ui-context-content-light"
			data-testid="im-textarea-panel"
		>
			<div class="bx-im-textarea__container">
				<div
					@mousedown="onResizeStart"
					class="bx-im-textarea__drag-handle"
					data-testid="im-textarea-drag-handle"
				></div>
				<TextareaPanel
					:type="panelType"
					:context="panelContext"
					:dialogId="dialogId"
					@close="onPanelClose"
				/>
				<component
					:is="recordingPanel"
					v-if="isVoiceRecording && recordingPanel"
					:dialogId="dialogId"
					:isLockedOnStart="isVoiceRecordingLocked"
					:isStartedFromPointer="isVoiceStartedFromPointer"
					:initialRecord="voiceRecordReturned"
					:sendFailure="voiceSendFailure"
					ref="voiceRecordingPanel"
					@recorded="onVoiceRecorded"
					@close="closeVoiceRecording"
				/>
				<!-- the field is hidden, not unmounted: the recording is over in seconds and the
					 detectors bound to its element outlive it -->
				<div
					v-show="!isVoiceRecording"
					class="bx-im-textarea__content"
					:class="{ '--locked': isEditingAttachments, '--focus-outline': showAreaFocusOutline }"
					ref="textarea-content"
					:tabindex="withKeyboardNavigation ? 0 : null"
					:role="withKeyboardNavigation ? 'region' : null"
					:aria-label="withKeyboardNavigation ? loc('IM_TEXTAREA_AREA_ARIA') : null"
					@click="onContentClick"
					@keydown="onContentKeyDown"
					data-testid="im-textarea-area"
				>
					<div class="bx-im-textarea__top">
						<div
							:class="{
								'bx-im-textarea__upload-menu-wrapper': true,
								'bx-im-textarea__upload-menu-wrapper--muted': !dialogReady,
							}"
							v-if="withUploadMenu"
							data-testid="im-textarea-upload-menu-wrapper"
						>
							<UploadMenu
								:dialogId="dialogId"
								:disabled="!dialogReady"
								@fileSelect="onFileSelect"
								@diskFileSelect="onDiskFileSelect"
							/>
						</div>
						<BIcon
							v-if="showSlashCommandButton"
							:name="OutlineIcons.COMMANDS"
							:title="loc('IM_TEXTAREA_ICON_SLASH_COMMAND')"
							:size="ICON_SIZE"
							:color="slashCommandIconColor"
							class="bx-im-textarea__slash-command-icon"
							data-testid="im-textarea-slash-command-btn"
							@click="onSlashCommandButtonClick"
						/>
						<textarea
							v-model="text"
							v-bind="mentionComboboxAttrs"
							:style="textareaStyle"
							:placeholder="textareaPlaceholder"
							:disabled="isEditingAttachments"
							:aria-label="loc('IM_TEXTAREA_INPUT_ARIA')"
							:aria-describedby="withKeyboardNavigation ? fieldDescriptionId : null"
							:tabindex="withKeyboardNavigation ? -1 : null"
							:maxlength="textareaMaxLength"
							@keydown="onKeyDown"
							@mouseup="onMouseUp"
							@blur="rememberSelection"
							@paste="onPaste"
							class="bx-im-textarea__element"
							ref="textarea"
							rows="1"
							data-testid="im-textarea-input"
						></textarea>
					</div>
					<div class="bx-im-textarea__bottom">
						<slot name="bottom-panel-buttons"></slot>
						<AutoDeleteSelector
							v-if="isAutoDeleteEnabled"
							:dialogId="dialogId"
						/>
						<IconButton
							v-if="showMarketIcon"
							ref="marketIcon"
							:iconName="OutlineIcons.APPS"
							:label="loc('IM_TEXTAREA_ICON_APPLICATION')"
							:iconSize="ICON_SIZE"
							:iconColor="marketIconColor"
							:expanded="marketMode"
							class="bx-im-textarea__icon"
							data-testid="im-textarea-market-btn"
							@click="onMarketIconClick"
						/>
						<EmoteSelector
							v-if="withSmileSelector"
							:dialogId="dialogId"
						/>
						<AudioInput
							:dialogId="dialogId"
							:isDisabled="isAudioInputDisabled"
							@inputStart="onAudioInputStart"
							@inputResult="onAudioInputResult"
							@activeChange="isAudioInputActive = $event"
						/>
						<VoiceRecorderButton
							v-if="showVoiceRecorderButton"
							:isDisabled="isVoiceRecorderDisabled"
							:isAudioInputActive="isAudioInputActive"
							@press="startVoiceRecording"
						/>
						<SendButton
							v-else
							:dialogId="dialogId"
							:editMode="editMode"
							:isDisabled="isDisabled"
							:isStopGenerationState="isStopGenerationState"
							:data-testid="isStopGenerationState ? 'copilot-generation-stop-btn' : 'im-textarea-send-btn'"
							@click="sendMessage"
							@stop="stopGeneration"
						/>
					</div>
				</div>
				<!-- outside the input area on purpose: aria-describedby resolves by id from anywhere, while a
					node left inside the area becomes part of what a screen reader replays on entering it. -->
				<span
					v-if="withKeyboardNavigation"
					:id="fieldDescriptionId"
					class="bx-im-textarea__sr-only"
				>{{ loc('IM_TEXTAREA_KEYBOARD_NAV_ARIA') }}</span>
			</div>
			<UploadPreviewPopup
				v-if="previewSessionId"
				:dialogId="dialogId"
				:sessionId="previewSessionId"
				:textareaValue="text"
				:restoreFocusTarget="getInputElement"
				:draftKey="draftKey"
				:mentionReplacementMap="mentionReplacementMap"
				:withCopilot="withCopilot"
				:editedMessageId="previewSessionMessageId"
				:isSaving="isSavingEditedFiles"
				:canRemoveFilesFromServer="!isEditedCompositionSent"
				@close="onUploadPreviewClose"
				@sendFiles="onSendFilesFromPreviewPopup"
				@saveFiles="onSaveFilesFromPreviewPopup"
			/>
			<MentionPopup
				v-if="withMention && showMention"
				:bindElement="$refs['textarea-content']"
				:dialogId="dialogId"
				:query="mentionQuery"
				:withCopilot="withCopilot"
				@close="closeMentionPopup"
				@onFocusTextarea="focus"
			/>
			<SlashCommandPopup
				v-if="slashCommandEnabled && showSlashCommand"
				:bindElement="$refs['textarea-content']"
				:dialogId="dialogId"
				:query="slashCommandQuery"
				@close="closeSlashCommandPopup"
			/>
			<FormatToolbar
				v-if="showFormatToolbar"
				:dialogId="dialogId"
				:textarea="$refs.textarea"
				:targetPosition="formatToolbarPosition"
				:useMarkdown="isMarkdownInputAvailable"
				@updateText="onFormatToolbarUpdateText"
				@close="showFormatToolbar = false"
			/>
		</div>
	`
	};

	exports.BeforeSendMessageAction = BeforeSendMessageAction;
	exports.ChatTextarea = ChatTextarea;
	exports.MentionAddUserService = MentionAddUserService;
	exports.VoiceRecorderButton = VoiceRecorderButton;
	exports.canAddToChat = canAddToChat;
})(this.BX.Messenger.v2.Component = this.BX.Messenger.v2.Component || {}, BX??{}, BX?.Event??{}, BX?.UI?.IconSet??{}, window??{}, BX?.UI?.Uploader??{}, BX?.Vue3??{}, BX?.Messenger?.v2?.Application??{}, BX?.Messenger?.v2?.Component?.Elements??{}, BX?.Messenger?.v2?.Component?.Elements??{}, BX?.Messenger?.v2?.Const??{}, BX?.Messenger?.v2?.Lib??{}, BX?.Messenger?.v2?.Lib??{}, BX?.Messenger?.v2?.Lib??{}, BX?.Messenger?.v2?.Lib??{}, BX?.Messenger?.v2?.Lib??{}, BX?.Messenger?.v2?.Lib??{}, BX?.Messenger?.v2?.Lib??{}, BX?.Messenger?.v2?.Lib??{}, BX?.Messenger?.v2?.Lib??{}, BX?.Messenger?.v2?.Lib??{}, BX?.Messenger?.v2?.Lib??{}, BX?.Messenger?.v2?.Lib??{}, BX?.Messenger?.v2?.Lib??{}, BX?.Messenger?.v2?.Lib??{}, BX?.Messenger?.v2?.Lib??{}, BX?.Messenger?.v2?.Lib??{}, BX?.Messenger?.v2?.Lib??{}, BX?.Messenger?.v2?.Lib??{}, BX?.Messenger?.v2?.Lib??{}, BX?.Messenger?.v2?.Lib??{}, BX?.Messenger?.v2?.Service??{}, BX?.Messenger?.v2?.Service??{}, BX?.Messenger?.v2?.Service??{}, BX?.Messenger?.v2?.Lib??{}, BX?.Messenger?.v2?.Lib??{}, BX?.Messenger?.v2?.Css??{}, BX?.Messenger?.v2?.Component?.Elements??{}, BX?.Messenger?.v2?.Service??{}, BX?.Messenger?.v2?.Lib??{}, BX?.Main??{}, BX?.UI?.Accessibility??{}, BX?.UI?.System?.Chip?.Vue??{}, BX?.Messenger?.v2?.Component?.Elements??{}, BX?.Messenger?.v2?.Lib??{}, BX?.Messenger?.v2?.Lib??{}, BX?.Messenger?.v2?.Lib??{}, BX?.Messenger?.v2?.Component??{}, BX?.Messenger?.v2?.Provider?.Service??{}, BX?.Messenger?.v2?.Component?.Elements??{}, BX??{}, BX?.Messenger?.v2?.Lib??{}, BX?.Messenger?.v2?.Lib??{}, BX?.Messenger?.v2?.Lib??{}, BX?.UI?.System?.Input?.Vue??{}, BX?.Messenger?.v2?.Lib??{}, BX?.Messenger?.v2?.Lib??{}, BX?.Messenger?.v2?.Lib??{}, BX?.Messenger?.v2?.Lib??{}, BX?.Messenger?.v2?.Component?.Elements??{}, BX?.Messenger?.v2?.Component?.Elements??{}, BX?.Messenger?.v2?.Component?.Elements??{}, BX?.Messenger?.v2?.Lib??{}, BX?.UI?.IconSet??{}, BX?.Messenger?.v2?.Lib??{}, BX?.Messenger?.v2?.Service??{}, BX?.Messenger?.v2?.Lib??{}, BX?.UI?.Vue3?.Components??{}, BX?.Messenger?.v2?.Service??{}, BX?.Messenger?.v2?.Component?.Elements??{}, BX?.UI?.System?.Typography?.Vue??{}, BX?.Calendar?.Sharing??{}, BX?.Vote??{}, BX?.Messenger?.v2?.Component?.Elements??{}, BX?.Messenger?.v2?.Lib??{}, BX??{}, BX?.Disk??{}, BX?.Vue3?.Vuex??{}, BX?.Messenger?.v2?.Component?.Elements??{}, BX??{}, BX?.UI?.System?.Checkbox??{}, BX?.UI?.System?.Illustration?.Vue??{}, BX?.Messenger?.v2?.Component?.Elements??{}, BX?.UI?.System?.Tooltip?.Vue??{}, BX?.Vue3?.Components??{}, BX?.Messenger?.v2?.Component?.Elements??{}, BX??{}, BX?.Messenger?.v2?.Lib??{}, BX?.Messenger?.v2?.Lib??{});;
//# sourceMappingURL=textarea.bundle.js.map

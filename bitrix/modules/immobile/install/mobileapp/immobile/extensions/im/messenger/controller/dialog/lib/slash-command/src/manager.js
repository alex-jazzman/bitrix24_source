/**
 * @module im/messenger/controller/dialog/lib/slash-command/manager
 */
jn.define('im/messenger/controller/dialog/lib/slash-command/manager', (require, exports, module) => {
	const { Type } = require('type');
	const { EventType } = require('im/messenger/const');
	const { Loc } = require('im/messenger/loc');
	const { Feature } = require('im/messenger/lib/feature');
	const { Notification } = require('im/messenger/lib/ui/notification');
	const { ChatAvatar } = require('im/messenger/lib/element/chat-avatar');
	const { MessengerIcon, IconType } = require('im/messenger/assets/icon');
	const { getLogger } = require('im/messenger/lib/logger');
	const {
		SlashCommandProvider,
		SlashCommandProviderState,
	} = require('im/messenger/controller/dialog/lib/slash-command/provider');

	const logger = getLogger('dialog--slash-command-manager');

	const SLASH_SYMBOL = '/';
	// No space here (unlike MENTION_PREFIX): a space after the slash must not close the panel.
	const SLASH_PREFIX = new Set(['\n']);

	// Id of the custom "/" input button; the built-in ids (attach/sticker/action) are
	// handled natively and must be ignored here.
	const SLASH_COMMAND_BUTTON_ID = 'slashCommand';

	// Reserved synthetic-row ids; command ids are integers, so no collision.
	const EMPTY_ITEM_ID = 'slash-command-empty';
	const ERROR_ITEM_ID = 'slash-command-error';

	/**
	 * @desc Slash-command discovery panel for a dialog: opens on "/" at the start of a line,
	 * lists the chat bot commands via SlashCommandProvider and inserts the chosen command
	 * as plain text. A sibling of MentionManager (not a subclass) that reuses the
	 * shared DialogMentionPanel (view.mentionPanel).
	 */
	class SlashCommandManager
	{
		/**
		 * @desc Whether the slash-command panel may be initialised for the dialog: the server flag is
		 * on and it is a base Dialog (not a Copilot / AI-assistant chat - those have their own UX -
		 * and not an open line, which is an operator surface outside the feature scope).
		 * Availability is deliberately not gated on client-side `chatBots`: the command list is owned
		 * by the backend aggregator (im.v2.Chat.Command.list), while on mobile `dialogModel.participants`
		 * is hydrated lazily (empty for groups / open chats at init time) and common commands (e.g.
		 * `/giphy`) need no bot participant at all - so a `chatBots` gate would suppress a valid panel.
		 * @param {DialogHelper|null} dialogHelper
		 * @return {boolean}
		 */
		static isAvailableForDialog(dialogHelper)
		{
			if (!Feature.isChatBotCommandsAvailable)
			{
				return false;
			}

			if (!dialogHelper || dialogHelper.isCopilot || dialogHelper.isAiAssistant || dialogHelper.isOpenlines)
			{
				return false;
			}

			return true;
		}

		/**
		 * @param {SlashCommandManagerOptions} options
		 */
		constructor({ view, dialogId, dialogLocator = null, provider = null, onPanelStateChange = null } = {})
		{
			/**
			 * @private
			 * @type {DialogView}
			 */
			this.view = view;
			/**
			 * @private
			 * @type {DialogId}
			 */
			this.dialogId = dialogId;
			/**
			 * @private
			 * @type {ServiceLocator|null}
			 */
			this.dialogLocator = dialogLocator;

			/**
			 * @desc Position of the triggering "/" in the input; null when there is no active session.
			 * @private
			 * @type {number|null}
			 */
			this.slashPosition = null;
			/**
			 * @private
			 * @type {boolean}
			 */
			this.isPanelOpened = false;
			/**
			 * @desc Notified on panel open/close so the dialog can retint the "/" input button.
			 * @private
			 * @type {((isOpened: boolean) => void)|null}
			 */
			this.onPanelStateChange = onPanelStateChange;
			/**
			 * @desc Row id -> source command for the currently drawn list (insertion + ownership check).
			 * @private
			 * @type {Map<string, SlashCommand>}
			 */
			this.commandById = new Map();
			/**
			 * @private
			 * @type {(() => void)|null}
			 */
			this.retryHandler = null;
			/**
			 * @private
			 * @type {SlashCommandQueryContext}
			 */
			this.queryContext = {};
			/**
			 * @desc One-shot guard against the changeState echo of openByButton's own "/" insert:
			 * Android re-emits changeState for a programmatic replaceText (iOS does not), and the echo
			 * reports the caret at the inserted slash, which would otherwise trip the caret-left close.
			 * @private
			 * @type {boolean}
			 */
			this.pendingButtonInsertEcho = false;

			this.#bindMethods();

			/**
			 * @private
			 * @type {SlashCommandProvider}
			 */
			this.provider = provider ?? new SlashCommandProvider({
				dialogId,
				onStateChange: this.providerStateHandler,
			});

			this.subscribeEvents();
		}

		#bindMethods()
		{
			/**
			 * @private
			 * @type {function}
			 */
			this.changeTextHandler = this.onChangeText.bind(this);
			/**
			 * @private
			 * @type {function}
			 */
			this.itemTapHandler = this.onItemTap.bind(this);
			/**
			 * @private
			 * @type {function}
			 */
			this.buttonTapHandler = this.onButtonTap.bind(this);
			/**
			 * @private
			 * @type {function}
			 */
			this.providerStateHandler = (state, payload) => this.onProviderState(state, payload);
		}

		/**
		 * @public
		 */
		subscribeEvents()
		{
			if (!this.canUse())
			{
				return;
			}

			this.view.textField.on(EventType.dialog.textField.changeState, this.changeTextHandler);
			this.view.textField.on(EventType.dialog.textField.buttonTap, this.buttonTapHandler);
			this.view.mentionPanel.on(EventType.dialog.mentionPanel.itemTap, this.itemTapHandler);
		}

		/**
		 * @public
		 */
		unsubscribeEvents()
		{
			if (!this.canUse())
			{
				return;
			}

			this.view.textField.off(EventType.dialog.textField.changeState, this.changeTextHandler);
			this.view.textField.off(EventType.dialog.textField.buttonTap, this.buttonTapHandler);
			this.view.mentionPanel.off(EventType.dialog.mentionPanel.itemTap, this.itemTapHandler);
		}

		/**
		 * @return {boolean}
		 */
		canUse()
		{
			return Boolean(this.view?.textField.isUiAvailable() && this.view?.mentionPanel.isUiAvailable());
		}

		/**
		 * @private
		 * @param {string} text
		 * @param {string} inputCharacters
		 * @param {number} cursorPosition
		 */
		onChangeText(text, inputCharacters, cursorPosition)
		{
			if (this.pendingButtonInsertEcho)
			{
				this.pendingButtonInsertEcho = false;

				// The echo of openByButton's own insert: "/" still present with the caret at/before it.
				// A genuine edit (real keystroke) has the caret past the slash and falls through.
				if (
					this.slashPosition !== null
					&& cursorPosition <= this.slashPosition
					&& text[this.slashPosition] === SLASH_SYMBOL
				)
				{
					return;
				}
			}

			if (this.slashPosition !== null)
			{
				this.onActiveChangeText(text, inputCharacters, cursorPosition);

				return;
			}

			this.onInactiveChangeText(text, inputCharacters, cursorPosition);
		}

		/**
		 * @desc Toggle for the custom "/" input button. Ignores the built-in native
		 * buttons. A tap on a closed panel opens the session; a repeated tap closes it and leaves
		 * the input as typed - neither branch rewrites the draft.
		 * @private
		 * @param {string} id
		 */
		onButtonTap(id)
		{
			if (id !== SLASH_COMMAND_BUTTON_ID)
			{
				return;
			}

			if (this.isPanelOpened)
			{
				this.closeByButton();

				return;
			}

			this.openByButton();
		}

		/**
		 * @desc Opens the panel from the "/" input button. If the caret line already starts with a
		 * valid "/", it opens on that slash; otherwise it inserts "/" only into a completely empty
		 * line (a no-op when the line has any text) - a command must reach the server at the line
		 * start (^\/). The open path is invoked explicitly rather than relying on a native re-emit:
		 * iOS emits no changeState for a programmatic replaceText, while Android emits an echo that
		 * arrives too late and mis-reports the caret - see the pendingButtonInsertEcho guard in
		 * onChangeText.
		 * @private
		 */
		openByButton()
		{
			// Mutual exclusion: never insert "/" or open on top of an active mention session (shared panel).
			if (this.isMentionActive())
			{
				return;
			}

			const text = this.view.textField.getText();
			const cursorPosition = this.view.textField.getCursorIndex();
			const lineStart = text.lastIndexOf('\n', cursorPosition - 1) + 1;
			const lineText = text.slice(lineStart, cursorPosition);
			const slashIndex = lineText.indexOf(SLASH_SYMBOL);

			if (slashIndex >= 0 && this.isValidSlashTriggerPosition(text, lineStart + slashIndex))
			{
				this.slashPosition = lineStart + slashIndex;
				const caretPosition = Math.max(cursorPosition, this.slashPosition + 1);
				this.queryContext = this.buildQueryContext(text, caretPosition);

				// Refresh-on-open: don't draw the possibly-stale lastResponse directly. A pull
				// invalidation drops the per-chat cache and closes the panel but keeps lastResponse,
				// so a reopen would otherwise show commands of a bot that already left. getCommands is
				// cache-first + silent refetch - a still-valid cache renders instantly anyway.
				void this.provider.getCommands(this.queryContext);

				return;
			}

			// "/" is inserted only into a completely empty line: a command must reach the server at the
			// line start (^\/), so we never place it after a mention, existing text or whitespace.
			const nextLineBreak = text.indexOf('\n', lineStart);
			const lineEnd = nextLineBreak === -1 ? text.length : nextLineBreak;
			if (text.slice(lineStart, lineEnd) !== '')
			{
				return;
			}

			this.pendingButtonInsertEcho = true;
			this.view.textField.replaceText(lineStart, lineStart, SLASH_SYMBOL);

			const textWithSlash = text.slice(0, lineStart) + SLASH_SYMBOL + text.slice(lineStart);
			this.onInactiveChangeText(textWithSlash, SLASH_SYMBOL, lineStart + 1);
		}

		/**
		 * @desc Closes the panel and leaves the input exactly as typed, including the triggering
		 * "/" - same as the web button, where a repeated press closes the popup without touching
		 * the text. Erasing the slash on close is up to the user.
		 * @private
		 */
		closeByButton()
		{
			this.close();
		}

		/**
		 * @private
		 * @param {string} text
		 * @param {string} inputCharacters
		 * @param {number} cursorPosition
		 */
		onInactiveChangeText(text, inputCharacters, cursorPosition)
		{
			if (!this.checkToOpen(text, inputCharacters, cursorPosition))
			{
				return;
			}

			// Mutual exclusion: never open on top of an active mention session (shared panel).
			if (this.isMentionActive())
			{
				return;
			}

			this.slashPosition = cursorPosition - 1;
			this.queryContext = this.buildQueryContext(text, cursorPosition);

			logger.log(`${this.constructor.name}.onInactiveChangeText: open at`, this.slashPosition);

			void this.provider.getCommands(this.queryContext);
		}

		/**
		 * @private
		 * @param {string} text
		 * @param {string} inputCharacters
		 * @param {number} cursorPosition
		 */
		onActiveChangeText(text, inputCharacters, cursorPosition)
		{
			if (cursorPosition <= this.slashPosition)
			{
				logger.log(`${this.constructor.name}.onActiveChangeText: close (caret left slash)`);
				this.close();

				return;
			}

			if (this.checkToClose(text))
			{
				logger.log(`${this.constructor.name}.onActiveChangeText: close`);
				this.close();

				return;
			}

			this.queryContext = this.buildQueryContext(text, cursorPosition);

			// Narrowing runs purely on the already-loaded list: re-filter locally, no per-keystroke
			// REST. A cold-cache session keeps waiting for the single fetch issued on open - its result is
			// re-filtered by the current context on arrival (onProviderState), so no duplicate request here.
			if (this.provider.lastResponse)
			{
				this.drawCurrentList();
			}
		}

		/**
		 * @param {string} text
		 * @param {string} inputCharacters
		 * @param {number} cursorPosition
		 * @return {boolean}
		 */
		checkToOpen(text, inputCharacters, cursorPosition)
		{
			if (inputCharacters !== SLASH_SYMBOL)
			{
				return false;
			}

			return this.isValidSlashTriggerPosition(text, cursorPosition - 1);
		}

		/**
		 * @desc Closes only when the character at the triggering position is no longer "/"
		 * (deleted or shifted). A space after "/" keeps the panel open.
		 * @param {string} text
		 * @return {boolean}
		 */
		checkToClose(text)
		{
			return text[this.slashPosition] !== SLASH_SYMBOL;
		}

		/**
		 * @private
		 * @param {string} text
		 * @param {number} cursorPosition
		 * @return {SlashCommandQueryContext}
		 */
		buildQueryContext(text, cursorPosition)
		{
			return {
				prefix: text.slice(this.slashPosition + 1, cursorPosition),
			};
		}

		/**
		 * @param {string} text
		 * @param {number} slashPosition
		 * @return {boolean}
		 */
		isValidSlashTriggerPosition(text, slashPosition)
		{
			// "/" triggers only at the start of a line: the server runs commands only at line start
			// (^\/), so a command chosen after a leading bot mention would not execute.
			return slashPosition === 0 || SLASH_PREFIX.has(text[slashPosition - 1]);
		}

		/**
		 * @private
		 * @param {SlashCommandProviderStateType} state
		 * @param {SlashCommandStatePayload} [payload]
		 */
		onProviderState(state, payload = {})
		{
			if (this.slashPosition === null)
			{
				return;
			}

			switch (state)
			{
				case SlashCommandProviderState.ready:
				case SlashCommandProviderState.updated:
					this.hideLoader();
					this.drawCurrentList();
					break;

				case SlashCommandProviderState.loading:
					this.showLoader();
					break;

				case SlashCommandProviderState.error:
					this.hideLoader();
					this.drawError(payload);
					break;

				default:
					logger.warn(`${this.constructor.name}.onProviderState: unknown state`, state);
			}
		}

		/**
		 * @desc Draws the loaded list filtered by the manager's current query context - the single
		 * source of truth for narrowing. Both the per-keystroke re-filter and any async provider
		 * result (ready/updated) go through here, so a background refetch that carries the open-time
		 * context can never reset the narrowing the user has typed.
		 * @private
		 */
		drawCurrentList()
		{
			this.drawCommands(this.provider.applyClientFilters(this.provider.lastResponse, this.queryContext));
		}

		/**
		 * @private
		 * @param {SlashCommandStatePayload} payload
		 */
		drawCommands(payload)
		{
			const commands = Type.isArray(payload?.commands) ? payload.commands : [];
			const users = payload?.users ?? {};

			this.commandById = new Map();
			const items = commands.map((command) => {
				const item = this.mapCommandToItem(command, users);
				this.commandById.set(item.id, command);

				return item;
			});

			this.retryHandler = null;

			if (items.length === 0)
			{
				this.drawEmptyState();

				return;
			}

			// A real list hides any placeholder set earlier on the shared panel (native contract).
			this.openOrSetItems(items);
		}

		/**
		 * @private
		 */
		drawEmptyState()
		{
			if (!Feature.isChatMentionEmptyStateAvailable)
			{
				this.openOrSetItems([this.createEmptyItem()]);

				return;
			}

			this.view.mentionPanel.setEmptyState({
				image: MessengerIcon.getByType(IconType.chatBotCommandsEmptyState),
				title: Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_SLASH_COMMAND_EMPTY_STATE_TITLE'),
				text: Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_SLASH_COMMAND_EMPTY_STATE_TEXT'),
			});
			this.openOrSetItems([]);
		}

		/**
		 * @desc Maps a command plus the `users` map to a MentionItem. `command` already carries
		 * the leading slash, so the client never prepends a second "/". `params`
		 * is a verbatim server string; the bot avatar is resolved from `users[botId]`.
		 * @param {SlashCommand} command
		 * @param {Record<string, object>} users
		 * @return {SlashCommandItem}
		 */
		mapCommandToItem(command, users)
		{
			const id = String(command.id);
			const bot = users?.[command.botId] ?? {};

			return {
				id,
				title: this.buildTitle(command),
				description: Type.isStringFilled(command.title) ? command.title : '',
				avatar: this.buildBotAvatar(command.botId, bot),
				/** @deprecated use avatar {AvatarDetail} */
				imageUrl: Type.isStringFilled(bot.avatar) ? bot.avatar : '',
				/** @deprecated use avatar {AvatarDetail} */
				imageColor: Type.isStringFilled(bot.color) ? bot.color : '',
				testId: id,
			};
		}

		/**
		 * @desc Builds the bot avatar (AvatarDetail) from the raw `users[botId]` API entry rather
		 * than the store: an owner bot (e.g. a portal common bot) may be absent from usersModel, so
		 * ChatAvatar.createFromDialogId(botId) alone would return an empty placeholder. Mirrors the
		 * AvatarDetail shape MentionManager draws.
		 * @private
		 * @param {number} botId
		 * @param {object} bot
		 * @return {AvatarDetail}
		 */
		buildBotAvatar(botId, bot)
		{
			const chatAvatar = ChatAvatar.createFromDialogId(botId);
			chatAvatar.avatar = Type.isStringFilled(bot.avatar) ? bot.avatar : null;
			chatAvatar.color = Type.isStringFilled(bot.color) ? bot.color : null;
			chatAvatar.title = Type.isStringFilled(bot.name) ? bot.name : '';

			return chatAvatar.getMentionAvatarProps();
		}

		/**
		 * @private
		 * @param {SlashCommand} command
		 * @return {string}
		 */
		buildTitle(command)
		{
			const commandText = Type.isStringFilled(command.command) ? command.command : '';

			return Type.isStringFilled(command.params) ? `${commandText} ${command.params}` : commandText;
		}

		/**
		 * @private
		 * @param {SlashCommandStatePayload} payload
		 */
		drawError(payload)
		{
			if (payload?.offline === true)
			{
				Notification.showOfflineToast();
			}

			if (Feature.isChatMentionEmptyStateAvailable)
			{
				// The native placeholder has no button, so tap-to-retry is lost while the flag is on.
				this.retryHandler = null;
				this.view.mentionPanel.setEmptyState({
					image: MessengerIcon.getByType(IconType.chatBotCommandsErrorState),
					title: Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_SLASH_COMMAND_ERROR_STATE_TITLE'),
					text: Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_SLASH_COMMAND_ERROR_STATE_TEXT'),
				});
				this.openOrSetItems([]);

				return;
			}

			this.retryHandler = Type.isFunction(payload?.retry) ? payload.retry : null;
			this.openOrSetItems([this.createErrorItem()]);
		}

		/**
		 * @private
		 * @return {SlashCommandItem}
		 */
		createEmptyItem()
		{
			return {
				id: EMPTY_ITEM_ID,
				title: Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_SLASH_COMMAND_EMPTY'),
				avatar: ChatAvatar.createMentionEmptyStateAvatar(),
				imageUrl: '',
				imageColor: '',
				testId: EMPTY_ITEM_ID,
			};
		}

		/**
		 * @private
		 * @return {SlashCommandItem}
		 */
		createErrorItem()
		{
			return {
				id: ERROR_ITEM_ID,
				title: Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_SLASH_COMMAND_ERROR'),
				avatar: ChatAvatar.createMentionErrorStateAvatar(),
				imageUrl: '',
				imageColor: '',
				testId: ERROR_ITEM_ID,
			};
		}

		/**
		 * @desc Sets the open flag and, on a real transition, notifies the dialog so the "/"
		 * input button can be retinted (accent while open, resting once closed).
		 * @private
		 * @param {boolean} isOpened
		 */
		#setPanelOpened(isOpened)
		{
			if (this.isPanelOpened === isOpened)
			{
				return;
			}

			this.isPanelOpened = isOpened;
			this.onPanelStateChange?.(isOpened);
		}

		/**
		 * @private
		 * @param {Array<SlashCommandItem>} items
		 */
		openOrSetItems(items)
		{
			if (!this.isPanelOpened)
			{
				if (this.isMentionActive())
				{
					return;
				}

				this.view.mentionPanel.open(items);
				this.#setPanelOpened(true);

				return;
			}

			this.view.mentionPanel.setItems(items);
		}

		/**
		 * @private
		 */
		showLoader()
		{
			if (!this.isPanelOpened)
			{
				if (this.isMentionActive())
				{
					return;
				}

				this.view.mentionPanel.open([]);
				this.#setPanelOpened(true);
			}

			this.view.mentionPanel.showLoader();
		}

		/**
		 * @private
		 */
		hideLoader()
		{
			this.view.mentionPanel.hideLoader();
		}

		/**
		 * @private
		 * @param {SlashCommandItem} item
		 */
		onItemTap(item)
		{
			if (this.slashPosition === null)
			{
				return;
			}

			if (item.id === ERROR_ITEM_ID)
			{
				const retry = this.retryHandler;
				if (retry)
				{
					void retry();
				}

				return;
			}

			if (item.id === EMPTY_ITEM_ID)
			{
				return;
			}

			const command = this.commandById.get(item.id);
			if (!command)
			{
				// Not a slash-command row (e.g. a mention item on the shared panel) - ignore.
				return;
			}

			this.insertCommand(command);
		}

		/**
		 * @desc Inserts the chosen command as plain text (no BBCode). A trailing
		 * space is added only for commands with parameters so the caret is ready for input.
		 * @private
		 * @param {SlashCommand} command
		 */
		insertCommand(command)
		{
			const insertText = command.command + (Type.isStringFilled(command.params) ? ' ' : '');
			const fromIndex = this.slashPosition;
			let toIndex = this.view.textField.getCursorIndex();
			if (toIndex < fromIndex)
			{
				toIndex = fromIndex;
			}

			logger.log(`${this.constructor.name}.insertCommand`, fromIndex, toIndex, insertText);
			this.view.textField.replaceText(fromIndex, toIndex, insertText);

			this.close();
		}

		/**
		 * @public
		 * @return {boolean}
		 */
		hasActiveSession()
		{
			return this.slashPosition !== null;
		}

		/**
		 * @public
		 */
		close()
		{
			this.hideLoader();
			if (Feature.isChatMentionEmptyStateAvailable)
			{
				// Reset the placeholder: the panel is shared with MentionManager, don't leak our state.
				this.view.mentionPanel.setEmptyState(null);
			}
			this.view.mentionPanel.close();

			this.slashPosition = null;
			this.#setPanelOpened(false);
			this.commandById = new Map();
			this.retryHandler = null;
			this.queryContext = {};
		}

		/**
		 * @private
		 * @return {boolean}
		 */
		isMentionActive()
		{
			return Boolean(this.dialogLocator?.get('mention-manager')?.isMentionProcessed);
		}
	}

	module.exports = { SlashCommandManager };
});

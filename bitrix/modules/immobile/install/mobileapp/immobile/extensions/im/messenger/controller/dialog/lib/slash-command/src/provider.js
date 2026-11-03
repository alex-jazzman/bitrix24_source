/**
 * @module im/messenger/controller/dialog/lib/slash-command/provider
 */
jn.define('im/messenger/controller/dialog/lib/slash-command/provider', (require, exports, module) => {
	const { Type } = require('type');
	const { isOnline } = require('device/connection');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { getLogger } = require('im/messenger/lib/logger');
	const { ChatCommandService } = require('im/messenger/provider/services/chat/command');
	const { UserHelper } = require('im/messenger/lib/helper');
	const { MessengerParams } = require('im/messenger/lib/params');
	const { PerfPoint } = require('debug/prism');

	const logger = getLogger('dialog--slash-command-provider');

	/**
	 * Provider -> Manager semantic states.
	 * @type {SlashCommandProviderStates}
	 */
	const SlashCommandProviderState = Object.freeze({
		ready: 'ready',
		loading: 'loading',
		updated: 'updated',
		error: 'error',
	});

	/**
	 * Cache-first + refresh-on-open source of the bot-command list for a single dialog.
	 * Reads the per-chat cache, serves it instantly and silently refetches over REST;
	 * on a cold cache loads over REST; offline without cache reports an error with retry.
	 * The provider emits semantic states only - the panel/manager renders them.
	 */
	class SlashCommandProvider
	{
		/**
		 * @param {SlashCommandProviderOptions} options
		 */
		constructor(options = {})
		{
			const {
				dialogId,
				onStateChange,
				repository,
				service,
				isOnlineChecker,
			} = options;

			this.dialogId = dialogId;
			this.onStateChange = Type.isFunction(onStateChange) ? onStateChange : () => {};
			this.repository = repository ?? serviceLocator.get('core').getRepository().chatCommand;
			this.service = service ?? new ChatCommandService();
			this.checkOnline = Type.isFunction(isOnlineChecker) ? isOnlineChecker : isOnline;

			/** @type {SlashCommandListResponse|null} */
			this.lastResponse = null;
			/** @type {SlashCommandQueryContext} */
			this.queryContext = {};
			/** @type {Promise<void>|null} */
			this.backgroundRefreshPromise = null;
			/** @type {boolean|null} */
			this.currentUserIsExtranet = null;
		}

		/**
		 * @desc Cache-first read with refresh-on-open.
		 * @param {SlashCommandQueryContext} [queryContext]
		 * @return {Promise<void>}
		 */
		async getCommands(queryContext = {})
		{
			this.queryContext = queryContext;
			const language = this.#getLanguage();

			const point = new PerfPoint('IM Slash Commands', `dialog ${this.dialogId}`).start();

			point.startPoint('Cache Read');
			const cached = await this.repository.getByDialogId(this.dialogId, language);
			point.endPoint('Cache Read', { source: cached?.payload ? 'cache' : 'miss' });

			if (cached && cached.payload)
			{
				this.lastResponse = cached.payload;
				this.#emit(SlashCommandProviderState.ready, this.applyClientFilters(cached.payload, queryContext));
				point.end();
				this.backgroundRefreshPromise = this.#refreshInBackground(language, queryContext);

				return;
			}

			this.#emit(SlashCommandProviderState.loading);

			if (!this.checkOnline())
			{
				this.#emit(SlashCommandProviderState.error, { offline: true, retry: () => this.getCommands(this.queryContext) });
				point.end();

				return;
			}

			try
			{
				point.startPoint('Server Fetch');
				const response = await this.service.getListByChat(this.dialogId);
				point.endPoint('Server Fetch');

				point.startPoint('Cache Save');
				await this.repository.save(this.dialogId, language, response);
				point.endPoint('Cache Save');

				this.lastResponse = response;
				this.#emit(SlashCommandProviderState.ready, this.applyClientFilters(response, queryContext));
			}
			catch (error)
			{
				logger.error(`${this.constructor.name}.getCommands error`, error);
				this.#emit(SlashCommandProviderState.error, { offline: false, retry: () => this.getCommands(this.queryContext) });
			}
			finally
			{
				point.end();
			}
		}

		/**
		 * @desc Silent refetch after a cache hit - stays on the cached snapshot on failure or offline,
		 * never shows an offline toast.
		 * @param {string} language
		 * @param {SlashCommandQueryContext} queryContext
		 * @return {Promise<void>}
		 */
		async #refreshInBackground(language, queryContext)
		{
			if (!this.checkOnline())
			{
				return;
			}

			const point = new PerfPoint('IM Slash Commands Refresh', `dialog ${this.dialogId}`).start();

			try
			{
				point.startPoint('Server Fetch');
				const response = await this.service.getListByChat(this.dialogId);
				point.endPoint('Server Fetch');

				point.startPoint('Cache Save');
				await this.repository.save(this.dialogId, language, response);
				point.endPoint('Cache Save');

				this.lastResponse = response;
				this.#emit(SlashCommandProviderState.updated, this.applyClientFilters(response, queryContext));
			}
			catch (error)
			{
				logger.error(`${this.constructor.name}.refreshInBackground error`, error);
			}
			finally
			{
				point.end();
			}
		}

		/**
		 * @desc Pure client-side filtering of the response: extranet and typed prefix.
		 * `commands` is filtered, `users` is passed through unchanged.
		 * @param {SlashCommandListResponse} response
		 * @param {SlashCommandQueryContext} [queryContext]
		 * @return {SlashCommandListResponse}
		 */
		applyClientFilters(response, queryContext = {})
		{
			const users = response?.users ?? {};
			let commands = Type.isArray(response?.commands) ? response.commands : [];

			commands = this.#filterByExtranet(commands);
			commands = this.#filterByPrefix(commands, queryContext.prefix);

			return { commands, users };
		}

		/**
		 * @param {SlashCommandProviderStateType} state
		 * @param {SlashCommandStatePayload} [payload]
		 */
		#emit(state, payload = {})
		{
			this.onStateChange(state, payload);
		}

		/**
		 * @desc Extranet current user does not see commands that explicitly do not support extranet.
		 * The `extranet` field is 'Y'/'N'; only an explicit 'N' is hidden.
		 * @param {Array<SlashCommand>} commands
		 * @return {Array<SlashCommand>}
		 */
		#filterByExtranet(commands)
		{
			if (!this.#isCurrentUserExtranet())
			{
				return commands;
			}

			return commands.filter((command) => command.extranet !== 'N');
		}

		/**
		 * @desc The current user's extranet status does not change within a session, so a known
		 * answer is resolved once and reused across per-keystroke filtering. The extranet flag
		 * decides, not the user type: a collaber is typed `collaber` while being external, and the
		 * server applies the same flag when it executes a command.
		 * @return {boolean}
		 */
		#isCurrentUserExtranet()
		{
			if (this.currentUserIsExtranet !== null)
			{
				return this.currentUserIsExtranet;
			}

			const currentUser = UserHelper.createByUserId(MessengerParams.getUserId());
			if (currentUser === null)
			{
				// Unknown, which is not the same as `false`: caching it would leave an external user
				// unfiltered for the rest of the session. Restrict this draw and resolve again later.
				return true;
			}

			this.currentUserIsExtranet = currentUser.hasExtranetFlag === true;

			return this.currentUserIsExtranet;
		}

		/**
		 * @desc Keeps commands whose text (without the leading slash) starts with the typed prefix,
		 * case-insensitive. `command` comes with a leading slash. A command name has no spaces, so
		 * only the first token of the prefix is matched - a trailing space or arguments typed after
		 * the command must not empty the list.
		 * @param {Array<SlashCommand>} commands
		 * @param {string} [prefix]
		 * @return {Array<SlashCommand>}
		 */
		#filterByPrefix(commands, prefix)
		{
			if (!Type.isStringFilled(prefix))
			{
				return commands;
			}

			const search = prefix.trim().split(/\s/)[0].toLowerCase();
			if (search === '')
			{
				return commands;
			}

			return commands.filter((command) => {
				const commandText = Type.isStringFilled(command.command) ? command.command : '';
				const withoutSlash = commandText.startsWith('/') ? commandText.slice(1) : commandText;

				return withoutSlash.toLowerCase().startsWith(search);
			});
		}

		/**
		 * @return {string}
		 */
		#getLanguage()
		{
			return env.languageId;
		}
	}

	module.exports = { SlashCommandProvider, SlashCommandProviderState };
});

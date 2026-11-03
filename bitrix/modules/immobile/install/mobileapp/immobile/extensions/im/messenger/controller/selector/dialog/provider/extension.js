/**
 * @module im/messenger/controller/selector/dialog/provider
 */

jn.define('im/messenger/controller/selector/dialog/provider', (require, exports, module) => {
	const { Loc } = require('im/messenger/loc');
	const { Type } = require('type');
	const { withCurrentDomain } = require('utils/url');

	const { BaseSelectorProvider } = require('selector/providers/base');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { FolderEligibility } = require('im/messenger/lib/folder-eligibility');
	const {
		ChatSearchProvider: SearchProvider,
		ChatSearchConfig,
		DialogLocalSearchStrategy,
		DefaultServerSearchStrategy,
	} = require('im/messenger/lib/chat-search');
	const { ChatTitle } = require('im/messenger/lib/element/chat-title');
	const { ChatAvatar } = require('im/messenger/lib/element/chat-avatar');
	const { DialogType } = require('im/messenger/const');
	const { DialogHelper, UserHelper } = require('im/messenger/lib/helper');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');

	const ASSET_PATH = '/bitrix/mobileapp/immobile/extensions/im/messenger/assets/common/png/';

	/**
	 * @class DialogSelectorProvider
	 */
	class DialogSelectorProvider extends BaseSelectorProvider
	{
		/**
		 * @param {String} context
		 * @param {DialogSelectorProviderOptions} options
		 */
		constructor(context, options = {})
		{
			super(context);
			this.queryString = '';
			this.items = [];

			this.isMultipleSelection = options?.allowMultipleSelection ?? false;
			this.withFavorite = options?.withFavorite ?? false;

			this.withCurrentUser = options?.withCurrentUser ?? true;
			this.onlyUsers = options?.onlyUsers ?? false;
			this.useNotes = options?.useNotes ?? false;
			this.excludeGuests = options?.excludeGuests ?? false;
			this.folderEligibleOnly = options?.folderEligibleOnly ?? false;
			this.initialDialogIds = Type.isArray(options?.initialDialogIds)
				? options.initialDialogIds.map((id) => String(id))
				: [];

			this.store = serviceLocator.get('core').getMessengerStore();

			this.searchProvider = this.#createSearchProvider();

			this.logger = getLoggerWithContext('dialog-selector-provider', this);
		}

		/**
		 * @private
		 * @return {ChatSearchProvider}
		 */
		#createSearchProvider()
		{
			return new SearchProvider({
				localStrategy: new DialogLocalSearchStrategy(this.#getLocalSearchOptions()),
				serverStrategy: new DefaultServerSearchStrategy({
					config: new ChatSearchConfig(),
					dynamicOptions: this.#getServerSearchDynamicOptions(),
				}),
				loadSearchProcessed: this.#onLocalSearchComplete,
				loadSearchComplete: this.#onServerSearchComplete,
			});
		}

		#getLocalSearchOptions()
		{
			if (this.folderEligibleOnly)
			{
				return {
					dialogTypes: FolderEligibility.getAllowedTypes(),
					excludeGuests: this.excludeGuests,
				};
			}

			return {
				exceptDialogTypes: [
					DialogType.copilot,
					DialogType.lines,
					DialogType.comment,
					DialogType.tasksTask,
				],
				excludeGuests: this.excludeGuests,
			};
		}

		#getServerSearchDynamicOptions()
		{
			if (!this.excludeGuests && !this.folderEligibleOnly)
			{
				return undefined;
			}

			return () => ({
				...(this.excludeGuests ? { excludeGuests: true } : {}),
				...(this.folderEligibleOnly ? { searchFolderEligible: true } : {}),
			});
		}

		loadRecent()
		{
			try
			{
				const recentDialogs = this.#getRecentDialogs();

				const preparedItems = this.prepareItemsForDrawing(recentDialogs);
				this.items = this.withFavorite ? this.#withFavoriteItem(preparedItems) : preparedItems;
				this.listener.onRecentResult(this.items, true);
			}
			catch (error)
			{
				// TODO: remove after solving local search error
				const errorText = `loadRecent() error 🚨: ${error.name}: ${error.message}`;
				this.logger.error(errorText);

				window.messengerDebug.localSearchDebugInfo.localSearchErrorText = errorText;
				window.messengerDebug.localSearchDebugInfo.localSearchError = error;

				this.listener.onRecentResult([], true);
			}
		}

		prepareItemsForDrawing(items)
		{
			return items.map((item) => this.prepareItemForDrawing(item));
		}

		prepareItemForDrawing(item)
		{
			if (UserHelper.isCurrentUser(item.dialogId) && this.withFavorite)
			{
				return this.#getFavoriteItem();
			}

			const chatAvatar = ChatAvatar.createFromDialogId(item.dialogId);
			const chatTitle = ChatTitle.createFromDialogId(item.dialogId);

			const useNotes = this.useNotes && UserHelper.isCurrentUser(item.dialogId);
			const title = chatTitle.getTitle({ useNotes }) ?? item.name;

			return {
				id: item.dialogId,
				title,
				subtitle: chatTitle.getDescription({ useNotes }),
				useLetterImage: false,
				sectionCode: 'common',
				avatar: chatAvatar.getListItemAvatarProps({ useNotes }),
				type: this.isMultipleSelection ? null : 'info',
				params: {
					id: item.dialogId,
					title,
					type: 'dialog',
				},
			};
		}

		doSearch(query)
		{
			this.queryString = query;
			const currentQuery = query.trim().toLocaleLowerCase(env.languageId);
			if (currentQuery.length === 0)
			{
				this.processedQuery = '';
				this.listener.onFetchResult(this.items, true);

				return;
			}

			if (currentQuery === this.processedQuery)
			{
				return;
			}

			this.processedQuery = currentQuery;

			void this.searchProvider.doSearch(currentQuery);
		}

		#getDialogsByIds(itemIdList)
		{
			const getDialogById = this.store.getters['dialoguesModel/getById'];
			let dialogs = itemIdList.map((id) => getDialogById(id)).filter(Boolean);

			if (this.onlyUsers)
			{
				// for copilot see 'im/messenger/lib/helper/dialog' DialogHelper.isDirect,
				// need MessengerStore, not Store from Helper
				const isDirect = (dialog) => {
					return Type.isNumber(Number(dialog.chatId))
						&& [DialogType.user, DialogType.private].includes(dialog.type);
				};

				dialogs = dialogs.filter((dialog) => isDirect(dialog));
			}

			if (!this.withCurrentUser)
			{
				dialogs = dialogs.filter((dialog) => {
					return Number(dialog.dialogId) !== serviceLocator.get('core').getUserId();
				});
			}

			if (this.excludeGuests)
			{
				dialogs = dialogs.filter((dialog) => {
					const userHelper = UserHelper.createByUserId(Number(dialog.dialogId));

					return !userHelper?.isGuest;
				});
			}

			return dialogs;
		}

		#getRecentDialogs()
		{
			const recentDialogIds = this.store.getters['recentModel/getChatCollection']()
				.map(({ id }) => id)
			;
			const recentDialogs = this.#getDialogsByIds(recentDialogIds);

			if (this.initialDialogIds.length === 0)
			{
				return recentDialogs.filter((dialog) => this.#isFolderEligible(dialog));
			}

			const initialSet = new Set(this.initialDialogIds);
			const recentSet = new Set(recentDialogIds.map((id) => String(id)));
			const extraIds = this.initialDialogIds.filter((id) => !recentSet.has(id));
			const extraDialogs = this.#getDialogsByIds(extraIds);
			const filteredRecentDialogs = recentDialogs.filter((dialog) => {
				return initialSet.has(String(dialog.dialogId)) || this.#isFolderEligible(dialog);
			});

			return [...extraDialogs, ...filteredRecentDialogs];
		}

		#isFolderEligible(dialog)
		{
			return !this.folderEligibleOnly
				|| (
					FolderEligibility.isAllowed(dialog.type)
					&& DialogHelper.createByModel(dialog)?.isNested !== true
				)
			;
		}

		/**
		 * Local search knows nothing about membership, so the recent list is used as its snapshot:
		 * only a linked chat has a row there. A person must be findable without a conversation,
		 * hence private dialogs skip the check. Server search keeps its own result: a hidden link
		 * is a membership too, and such a chat may be missing from the recent list.
		 */
		#isMemberByRecent(dialog)
		{
			if (!this.folderEligibleOnly || [DialogType.user, DialogType.private].includes(dialog.type))
			{
				return true;
			}

			return Boolean(this.store.getters['recentModel/getById'](dialog.dialogId));
		}

		#withFavoriteItem(items)
		{
			return [this.#getFavoriteItem(), ...items];
		}

		#onLocalSearchComplete = (itemIdList, needSearchOnServer) => {
			if (itemIdList.length === 0 && !needSearchOnServer)
			{
				this.listener.onFetchResult([], true);

				return;
			}

			const dialogs = this.#getDialogsByIds(itemIdList)
				.filter((dialog) => this.#isFolderEligible(dialog) && this.#isMemberByRecent(dialog))
			;
			this.items = this.prepareItemsForDrawing(dialogs);
			if (needSearchOnServer)
			{
				this.items.push(this.#getLoadingItem());
			}

			this.listener.onFetchResult(this.items, true);
		};

		#onServerSearchComplete = (itemIdList) => {
			if (itemIdList.length === 0)
			{
				this.listener.onFetchResult([], false);

				return;
			}

			const dialogs = this.#getDialogsByIds(itemIdList).filter((dialog) => this.#isFolderEligible(dialog));
			this.items = this.prepareItemsForDrawing(dialogs);

			this.listener.onFetchResult(this.items, false);
		};

		#getFavoriteItem()
		{
			return {
				id: env.userId,
				title: Loc.getMessage('IMMOBILE_MESSENGER_FORWARD_SELECTOR_FAVORITE_ITEM'),
				useLetterImage: false,
				avatar: {
					hideOutline: true,
					uri: withCurrentDomain(`${ASSET_PATH}favorite_avatar.png`),
				},
				type: this.isMultipleSelection ? 'user' : 'info',
			};
		}

		#getLoadingItem()
		{
			return {
				id: 'loading',
				title: Loc.getMessage('IMMOBILE_MESSENGER_FORWARD_SELECTOR_LOADING_ITEM'),
				type: 'loading',
				unselectable: true,
				sectionCode: 'common',
			};
		}
	}

	module.exports = { DialogSelectorProvider };
});

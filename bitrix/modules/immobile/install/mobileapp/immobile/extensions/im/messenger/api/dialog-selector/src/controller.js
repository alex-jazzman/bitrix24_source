/**
 * @module im/messenger/api/dialog-selector/controller
 */
jn.define('im/messenger/api/dialog-selector/controller', (require, exports, module) => {
	const { Theme } = require('im/lib/theme');
	const { DialogType } = require('im/messenger/const');
	const { Loc } = require('im/messenger/loc');
	const {
		ChatSearchProvider,
		ChatSearchConfig,
		VuexLocalSearchStrategy,
		DefaultServerSearchStrategy,
	} = require('im/messenger/lib/chat-search');

	const { DialogSelectorView } = require('im/messenger/api/dialog-selector/view');
	const { getLogger } = require('im/messenger/lib/logger');

	const logger = getLogger('dialog-selector');

	const EXCEPT_DIALOG_TYPES = [
		DialogType.copilot,
		DialogType.lines,
		DialogType.comment,
		DialogType.tasksTask,
	];

	/**
	 * @class DialogSelector
	 * @description Standalone facade for picking a dialog from the messenger. Used as a
	 * public API by external modules.
	 * Does not extend ChatSearchSelector — owns its own minimal UI flow.
	 */
	class DialogSelector
	{
		constructor()
		{
			this.layout = null;
			/** @type {DialogSelectorView} */
			this.view = null;
			/** @type {ChatSearchProvider} */
			this.provider = null;
			this.processedQuery = '';
			/** @type {Array<string>} */
			this.recentItems = [];
			this.isFirstRender = true;
		}

		/**
		 * @param {object} params
		 * @param {string} params.title
		 * @param {object} [params.layout]
		 * @return {Promise<{dialogId: DialogId, name: string}>}
		 */
		async show({ title, layout = null })
		{
			this.#initProvider();

			return new Promise((resolve, reject) => {
				layout ??= PageManager;

				layout.openWidget('layout', {
					title,
					useLargeTitleMode: true,
					modal: true,
					backgroundColor: Theme.colors.bgNavigation,
					backdrop: {
						mediumPositionPercent: 85,
						horizontalSwipeAllowed: false,
						onlyMediumPosition: true,
					},
				}).then((layoutWidget) => {
					this.layout = layoutWidget;
					this.view = new DialogSelectorView({
						onChangeText: (text) => this.#onChangeText(text),
						onItemSelected: (dialogParams) => {
							this.close(() => {
								resolve({
									dialogId: dialogParams.dialogId,
									name: dialogParams.dialogTitleParams.name,
								});
							});
						},
						onMount: () => {
							if (this.isFirstRender)
							{
								this.provider.loadLatestSearch();
								this.isFirstRender = false;
							}
						},
						openingLoaderTitle: Loc.getMessage('IMMOBILE_SEARCH_EXPERIMENTAL_LOADING_ITEM'),
					});
					layoutWidget.showComponent(this.view);
					logger.log(`${this.constructor.name} show component`);
				})
					.catch((error) => {
						reject(error);
					})
				;
			});
		}

		close(callback)
		{
			this.processedQuery = '';
			this.recentItems = [];
			this.isFirstRender = true;
			this.layout?.close(callback);
		}

		#initProvider()
		{
			this.provider?.closeSession();
			this.provider = new ChatSearchProvider({
				localStrategy: new VuexLocalSearchStrategy({ exceptDialogTypes: EXCEPT_DIALOG_TYPES }),
				serverStrategy: new DefaultServerSearchStrategy({ config: new ChatSearchConfig() }),
				...this.#buildProviderCallbacks(),
			});
		}

		#buildProviderCallbacks()
		{
			return {
				loadLatestSearchComplete: (itemIdList) => {
					logger.log(`${this.constructor.name} loadLatestSearchComplete`, itemIdList);
					this.recentItems = itemIdList;
					this.view.setItems(itemIdList, false);
				},
				loadSearchProcessed: (itemIdList, withLoader) => {
					logger.log(`${this.constructor.name} loadSearchProcessed`, itemIdList, withLoader);
					this.view.setItems(itemIdList, withLoader);
				},
				loadSearchComplete: (searchIds, query) => {
					if (this.processedQuery !== query)
					{
						return;
					}
					logger.log(`${this.constructor.name} loadSearchComplete`, searchIds, query);

					this.view.setItems(searchIds, false);
				},
			};
		}

		#onChangeText(text)
		{
			const currentQuery = (text ?? '').trim().toLocaleLowerCase();

			if (currentQuery.length === 0)
			{
				this.processedQuery = '';
				this.view.setItems(this.recentItems, false);

				return;
			}

			if (currentQuery === this.processedQuery)
			{
				return;
			}

			this.processedQuery = currentQuery;
			void this.provider.doSearch(currentQuery);
		}
	}

	module.exports = { DialogSelector };
});

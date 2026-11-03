/**
 * @module im/messenger/controller/sidebar-v2/services/file-service
 */
jn.define('im/messenger/controller/sidebar-v2/services/file-service', (require, exports, module) => {
	const { RestMethod } = require('im/messenger/const');
	const { SidebarDataProvider } = require('im/messenger/controller/sidebar-v2/services/data-provider');
	const {
		SidebarFileDateOrder,
		buildStoreKey,
		buildInitialQueryParams,
		buildQueryParams,
		getPageCursor,
		hasNextPage,
		isIncompleteDateCursor,
	} = require('im/messenger/controller/sidebar-v2/services/file-service/src/query');
	const { isCollectionTarget } = require('im/messenger/provider/pull/sidebar/src/collection-target');
	const { takePendingFiles } = require('im/messenger/provider/pull/sidebar/src/pending-file');

	const { getLogger } = require('im/messenger/lib/logger');
	const logger = getLogger('sidebar--file-service');

	class SidebarFileService extends SidebarDataProvider
	{
		/**
		 * @param props
		 * @param {string} props.chatId
		 * @param {number} props.dialogId
		 * @param {string[]} props.subtypes
		 * @param {SidebarFileOrder} [props.order] The order is per tab, not per service: the tab that
		 * pages by the date passes it, the rest keep the plain order by the record number.
		 */
		constructor(props)
		{
			super(props);

			this.chatId = props.chatId;
			this.dialogId = props.dialogId;
			this.subtypes = props.subtypes || [];
			this.order = props.order ?? null;
		}

		getInitialQueryHandler()
		{
			return (response) => this.#handlePage(response.data());
		}

		getInitialQueryMethod()
		{
			return RestMethod.imChatFileGet;
		}

		getStoreKey()
		{
			return buildStoreKey(this.subtypes);
		}

		getInitialQueryParams()
		{
			return buildInitialQueryParams({
				chatId: this.chatId,
				subtypes: this.subtypes,
				order: this.order,
			});
		}

		getQueryParams()
		{
			const cursor = this.#getCursor();

			if (isIncompleteDateCursor(this.order, cursor))
			{
				logger.warn(
					'SidebarFileService.getQueryParams: half a cursor pair, the page is requested from the start',
					cursor,
				);
			}

			return buildQueryParams({
				chatId: this.chatId,
				subtypes: this.subtypes,
				order: this.order,
				cursor,
			});
		}

		/**
		 * @return {SidebarFileCursor}
		 */
		#getCursor()
		{
			const storeKey = this.getStoreKey();

			return {
				lastLoadFileId: this.store.getters['sidebarModel/sidebarFilesModel/getLastLoadFileId'](
					this.chatId,
					storeKey,
				),
				lastLoadFileDate: this.store.getters['sidebarModel/sidebarFilesModel/getLastLoadFileDate'](
					this.chatId,
					storeKey,
				),
			};
		}

		loadPage()
		{
			const dialogModel = this.store.getters['dialoguesModel/getById'](this.dialogId);

			if (!dialogModel)
			{
				return new Promise().resolve(false);
			}

			return new Promise((resolve, reject) => {
				BX.rest.callMethod(
					this.getInitialQueryMethod(),
					this.getQueryParams(),
				).then((response) => {
					if (response.error() || response.status !== 200)
					{
						logger.error('getFileList.error', response.error(), response.ex);
						reject(response.error());

						return;
					}

					const data = response.data();
					void this.#handlePage(data);

					resolve(data);
				}).catch((error) => {
					logger.error('loadPage', error);

					reject(error);
				})
				;
			});
		}

		/**
		 * @param data
		 * @param {Object[]} data.list
		 * @param {Object[]} data.users
		 * @param {Object[]} data.files
		 * @param {Object} data.tariffRestrictions
		 * @param {boolean} data.tariffRestrictions.isHistoryLimitExceeded
		 * @returns {Promise}
		 */
		#handlePage(data)
		{
			logger.info('getFileList:', data);

			const { list, users, files, tariffRestrictions } = data;
			const isHistoryLimitExceeded = Boolean(tariffRestrictions?.isHistoryLimitExceeded);

			void this.store.dispatch('usersModel/set', users);
			void this.store.dispatch('filesModel/set', files);

			const mutations = [];

			if (list.length > 0)
			{
				const cursor = getPageCursor(list);

				mutations.push(
					this.store.dispatch('sidebarModel/sidebarFilesModel/setFromPagination', {
						chatId: this.chatId,
						files: list,
						subType: this.getStoreKey(),
						hasNextPage: hasNextPage(list.length, isHistoryLimitExceeded),
						isHistoryLimitExceeded,
						lastLoadFileId: cursor.lastLoadFileId,
						lastLoadFileDate: cursor.lastLoadFileDate,
					}),
				);
			}
			else
			{
				mutations.push(
					this.store.dispatch('sidebarModel/sidebarFilesModel/setFromPagination', {
						chatId: this.chatId,
						files: [],
						subType: this.getStoreKey(),
						hasNextPage: false,
						isHistoryLimitExceeded,
					}),
				);
			}

			const pendingFiles = this.#takePendingFiles();

			if (pendingFiles.length > 0)
			{
				logger.info('SidebarFileService: pull records that came while the page was in flight', pendingFiles);

				// the plain `set`: the page boundary belongs to the answer of the server, and a record
				// of a pull event must not move it
				mutations.push(
					this.store.dispatch('sidebarModel/sidebarFilesModel/set', {
						chatId: this.chatId,
						files: pendingFiles,
						subType: this.getStoreKey(),
					}),
				);
			}

			if (isHistoryLimitExceeded)
			{
				mutations.push(
					this.store.dispatch('sidebarModel/setHistoryLimitExceeded', {
						chatId: this.chatId,
						isHistoryLimitExceeded: true,
					}),
				);
			}

			return Promise.all(mutations);
		}

		/**
		 * @desc Records the pull events brought while this collection did not exist yet. The sidebar is
		 * marked initialized before the first page comes back, so a record of a chat with no collection
		 * at all waits in the pull provider until the page it belongs to has been stored.
		 * @return {SidebarFile[]}
		 */
		#takePendingFiles()
		{
			const storeKey = this.getStoreKey();

			return takePendingFiles(this.chatId, (subType) => isCollectionTarget(storeKey, subType));
		}
	}

	module.exports = {
		SidebarFileService,
		SidebarFileDateOrder,
	};
});

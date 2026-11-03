/**
 * @module im/messenger/controller/sidebar-v2/tabs/files/src/content
 */
jn.define('im/messenger/controller/sidebar-v2/tabs/files/src/content', (require, exports, module) => {
	const {
		SidebarBaseTabListContent,
		SidebarTabListItemModel,
	} = require('im/messenger/controller/sidebar-v2/tabs/base');
	const { FileItem } = require('im/messenger/controller/sidebar-v2/tabs/files/src/items/file');
	const { compareByDateCreate } = require('im/messenger/controller/sidebar-v2/tabs/files/src/file-order');
	const { Loc } = require('im/messenger/controller/sidebar-v2/loc');

	/**
	 * Fields of a file model a row of these tabs can show - the union over every row component of
	 * the files and the audio tab. A row that starts reading a field missing here stops updating
	 * live, so add it along with the field.
	 */
	const ROW_FILE_STATE_FIELDS = [
		'id',
		'name',
		'extension',
		'date',
		'status',
		'authorId',
		'authorName',
		'urlShow',
		'urlPreview',
		'isVideoNote',
	];

	/**
	 * @param {FilesModelState|null} [fileModel]
	 * @return {string}
	 */
	function buildFileStateSignature(fileModel)
	{
		if (!fileModel)
		{
			return '';
		}

		return ROW_FILE_STATE_FIELDS
			.map((field) => String(fileModel[field] ?? ''))
			.join('|');
	}

	/**
	 * @class SidebarFilesTabContent
	 */
	class SidebarFilesTabContent extends SidebarBaseTabListContent
	{
		/**
		 * @param props
		 * @param {DialoguesModelState} props.dialogData
		 * @param {WidgetNavigator} props.widgetNavigator
		 */
		constructor(props)
		{
			super(props);

			this.chatId = this.props.dialogData.chatId;
		}

		componentWillUnmount()
		{
			super.componentWillUnmount?.();

			// filesModel mutates for the files of every chat, so a handler left behind would
			// keep working through the rows of a tab nobody can see any more.
			this.unsubscribeStoreEvents();
		}

		subscribeStoreEvents()
		{
			this.storeManager.on('sidebarModel/sidebarFilesModel/set', this.onSetSidebarFilesStore);
			this.storeManager.on('sidebarModel/sidebarFilesModel/delete', this.onDeleteSidebarFilesStore);
			this.storeManager.on('sidebarModel/sidebarFilesModel/deleteByChatId', this.onDeleteAllDataSidebarFilesStore);
			this.storeManager.on('filesModel/update', this.onUpdateFilesStore);
			this.storeManager.on('filesModel/setFromPush', this.onUpdateFilesStore);
			this.storeManager.on('filesModel/updateWithId', this.onUpdateFileWithIdStore);
		}

		unsubscribeStoreEvents()
		{
			this.storeManager.off('sidebarModel/sidebarFilesModel/set', this.onSetSidebarFilesStore);
			this.storeManager.off('sidebarModel/sidebarFilesModel/delete', this.onDeleteSidebarFilesStore);
			this.storeManager.off('sidebarModel/sidebarFilesModel/deleteByChatId', this.onDeleteAllDataSidebarFilesStore);
			this.storeManager.off('filesModel/update', this.onUpdateFilesStore);
			this.storeManager.off('filesModel/setFromPush', this.onUpdateFilesStore);
			this.storeManager.off('filesModel/updateWithId', this.onUpdateFileWithIdStore);
		}

		bindMethods()
		{
			this.onSetSidebarFilesStore = this.onSetSidebarFilesStore.bind(this);
			this.onDeleteSidebarFilesStore = this.onDeleteSidebarFilesStore.bind(this);
			this.onDeleteAllDataSidebarFilesStore = this.onDeleteAllDataSidebarFilesStore.bind(this);
			this.onUpdateFilesStore = this.onUpdateFilesStore.bind(this);
			this.onUpdateFileWithIdStore = this.onUpdateFileWithIdStore.bind(this);
		}

		getItemsFromStore()
		{
			const { chatId } = this.props.dialogData;

			const getSidebarFiles = this.store.getters['sidebarModel/sidebarFilesModel/get'];
			const data = getSidebarFiles(chatId, this.dataProvider.getStoreKey());

			const items = data?.items ?? [];
			const itemList = items ? this.convertToSortedList(items) : null;

			// The rows are about to be built from the file model as it stands now, so that state is
			// what they show until a mutation brings a different one.
			itemList?.forEach((item) => this.rememberFileStateOfNewRow(item.getData()?.fileId));

			return {
				items: itemList,
				hasNextPage: data.hasNextPage,
			};
		}

		/**
		 * @param {object} mutation
		 * @param {object} mutation.payload
		 * @param {SidebarFilesSetData} mutation.payload.data
		 */
		onSetSidebarFilesStore(mutation)
		{
			const {
				chatId: eventChatId,
				subType,
			} = mutation.payload.data;

			const isEqualChatId = eventChatId === this.chatId;
			const isEqualSubType = subType === this.dataProvider.getStoreKey();

			if (isEqualChatId && isEqualSubType)
			{
				this.onStoreItemsUpdated();
			}
		}

		/**
		 * @param {object} mutation
		 * @param {object} mutation.payload
		 * @param {SidebarFilesDeleteData} mutation.payload.data
		 */
		onDeleteSidebarFilesStore(mutation)
		{
			const { id, chatId: eventChatId } = mutation.payload.data;

			if (eventChatId !== this.props.chatId)
			{
				return;
			}

			void this.deleteItemById(id);
		}

		/**
		 * @param {object} mutation
		 * @param {object} mutation.payload
		 * @param {SidebarFilesDeleteByChatIdData} mutation.payload.data
		 */
		onDeleteAllDataSidebarFilesStore(mutation)
		{
			const { chatId } = mutation.payload.data;

			if (chatId !== this.chatId)
			{
				return;
			}

			void this.deleteAllData();
		}

		/**
		 * A row reads its file model, and that model changes on its own: an upload that finishes
		 * replaces the processing mark with the date and brings the preview in. Files of other
		 * chats reach this handler too, so a file without a row of the loaded page stops here.
		 *
		 * @param {object} mutation
		 * @param {object} mutation.payload
		 * @param {{ fileList: Array<FilesModelState> }} mutation.payload.data
		 */
		onUpdateFilesStore(mutation)
		{
			const fileList = mutation.payload?.data?.fileList ?? [];

			fileList.forEach((file) => this.refreshRowByFileId(file?.id));
		}

		/**
		 * The pull about a file that is ALREADY in the model comes through this mutation, and its
		 * payload is shaped differently: `id` is the key the record is looked up by, while the new id
		 * arrives inside `fields`. After the mutation the file lives under `fields.id`, and that is
		 * the id a row of the tab carries - rows are keyed by the file id the server sent.
		 *
		 * @param {object} mutation
		 * @param {object} mutation.payload
		 * @param {{ id: string|number, fields: FilesModelState }} mutation.payload.data
		 */
		onUpdateFileWithIdStore(mutation)
		{
			const { id, fields } = mutation.payload?.data ?? {};

			this.refreshRowByFileId(fields?.id ?? id);
		}

		/**
		 * Every load of a page dispatches filesModel/set, and the model commits `update` for a file
		 * it already keeps without comparing anything - so a service load asks the list to redraw
		 * rows with the state they already show. A native row redrawn that way loses the glyph of
		 * its menu icon, hence the comparison: a redraw is asked for only when a field a row can
		 * show has actually changed.
		 *
		 * @protected
		 * @param {string|number} fileId
		 */
		refreshRowByFileId(fileId)
		{
			if (!this.getListViewRef())
			{
				return;
			}

			const item = this.findItem(fileId);

			if (!item || !this.hasRenderedFileStateChanged(fileId))
			{
				return;
			}

			this.rememberRenderedFileState(fileId);
			this.refreshRow(item);
		}

		/**
		 * A row that already has a remembered state keeps it: it shows what it was last refreshed
		 * with, which is not always what the model holds now. A file that reached the model through
		 * `add` - the mutation these tabs deliberately do not listen to - left its row behind, and
		 * only an unchanged remembered state keeps that row refreshable.
		 *
		 * @protected
		 * @param {string|number} fileId
		 */
		rememberFileStateOfNewRow(fileId)
		{
			if (this.renderedFileStates?.has(Number(fileId)))
			{
				return;
			}

			this.rememberRenderedFileState(fileId);
		}

		/**
		 * The map is created on demand, not in the constructor: the base one reads the store through
		 * getItemsFromStore() before the fields of this class exist.
		 *
		 * @protected
		 * @param {string|number} fileId
		 */
		rememberRenderedFileState(fileId)
		{
			if (!fileId)
			{
				return;
			}

			this.renderedFileStates ??= new Map();
			this.renderedFileStates.set(Number(fileId), this.getFileStateSignature(fileId));
		}

		/**
		 * @protected
		 * @param {string|number} fileId
		 * @return {boolean}
		 */
		hasRenderedFileStateChanged(fileId)
		{
			return this.renderedFileStates?.get(Number(fileId)) !== this.getFileStateSignature(fileId);
		}

		/**
		 * @protected
		 * @param {string|number} fileId
		 * @return {string}
		 */
		getFileStateSignature(fileId)
		{
			return buildFileStateSignature(this.store.getters['filesModel/getById'](fileId));
		}

		/**
		 * @protected
		 * @param {SidebarTabListItemModel} item
		 */
		refreshRow(item)
		{
			void this.updateRowByKey(item);
		}

		/**
		 * The list keeps file ids as they arrive from the store, so string and number ids mix:
		 * compare them as numbers, otherwise the item is silently not found.
		 *
		 * @param {string|number} fileId
		 * @returns {SidebarTabListItemModel|undefined}
		 */
		findItem(fileId)
		{
			return this.getItems().find((item) => Number(fileId) === Number(item?.data?.fileId));
		}

		/**
		 * @param {Map<number, SidebarFile>} map
		 * @return {SidebarTabListItemModel[]}
		 */
		convertToSortedList(map)
		{
			return [...map]
				.map(([_, value]) => (value))
				.sort(compareByDateCreate)
				.map((data) => new SidebarTabListItemModel(data));
		}

		/**
		 * @param {SidebarTabListItemModel} item
		 * @param {SidebarFile} item.data
		 * @returns {FileItem}
		 */
		renderItem(item)
		{
			return new FileItem({
				...item.data,
				dialogId: this.props.dialogData.dialogId,
				widgetNavigator: this.props.widgetNavigator,
			});
		}

		getEmptyScreenProps()
		{
			return {
				testId: 'files',
				title: Loc.getMessage('IMMOBILE_SIDEBAR_V2_COMMON_TAB_FILES_EMPTY_SCREEN_TITLE'),
				image: 'files.svg',
			};
		}
	}

	module.exports = { SidebarFilesTabContent };
});

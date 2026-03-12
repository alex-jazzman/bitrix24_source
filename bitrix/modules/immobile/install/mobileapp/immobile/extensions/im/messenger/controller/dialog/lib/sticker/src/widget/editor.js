/**
 * @module im/messenger/controller/dialog/lib/sticker/src/widget/editor
 */
jn.define('im/messenger/controller/dialog/lib/sticker/src/widget/editor', (require, exports, module) => {
	const { Type } = require('type');
	const { Color, Component, Indent } = require('tokens');

	const { Loc } = require('im/messenger/loc');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');

	const {
		StickerEventType,
		UploadStatus,
		EditableElementType,
		DEVICE_WIDTH,
		MAX_STICKER_PACK_SIZE,
	} = require('im/messenger/controller/dialog/lib/sticker/src/const');
	const { GridUtils } = require('im/messenger/controller/dialog/lib/sticker/src/utils/grid');
	const { emitter } = require('im/messenger/controller/dialog/lib/sticker/src/utils/emitter');

	const { StickerService } = require('im/messenger/controller/dialog/lib/sticker/src/service/service');
	const { StickerFactory } = require('im/messenger/controller/dialog/lib/sticker/src/service/factory');
	const { StickerUploadQueue } = require('im/messenger/controller/dialog/lib/sticker/src/service/upload-queue');

	const { StickerWidgetHeader } = require('im/messenger/controller/dialog/lib/sticker/src/ui/header');
	const { StickerCreateView } = require('im/messenger/controller/dialog/lib/sticker/src/ui/grid/element/create');
	const { UploadingStickerView } = require('im/messenger/controller/dialog/lib/sticker/src/ui/grid/element/uploading');
	const { StickerView } = require('im/messenger/controller/dialog/lib/sticker/src/ui/grid/element/sticker');
	const { UploadMenu, ActionType } = require('im/messenger/controller/dialog/lib/sticker/src/ui/menu/upload');
	const { PackButton } = require('im/messenger/controller/dialog/lib/sticker/src/ui/button');

	const { StickerDialogs } = require('im/messenger/controller/dialog/lib/sticker/src/dialogs');
	const { StickerNotifier } = require('im/messenger/controller/dialog/lib/sticker/src/notifier');

	const logger = getLoggerWithContext('dialog--sticker', 'StickerPackEditor');

	/**
	 * @class StickerPackEditor
	 */
	class StickerPackEditor extends LayoutComponent
	{
		constructor(props)
		{
			super(props);
			this.state = {
				pack: props.pack,
				stickers: props.stickers,
				title: props.pack.name,
				uploadingFiles: [],
				deletedStickers: [],
				rows: [],
				isEditButtonEnabled: false,
			};
			this.state.isEditButtonEnabled = this.hasPackChanged();
			/** @type {GridViewMethods} */
			this.gridRef = null;
			this.service = new StickerService({
				dialogLocator: props.dialogLocator,
			});
			this.errorCollection = {};
			this.dialogs = new StickerDialogs();

			this.uploadQueue = new StickerUploadQueue({
				onUploadProgress: (stickerId, percent) => {
					const stickerData = this.state.uploadingFiles
						.find((sticker) => sticker.stickerId === stickerId)
					;
					stickerData.status = UploadStatus.progress;
					stickerData.progress = percent;

					emitter.emit(StickerEventType.uploader.setProgress, [stickerId, percent]);
				},
				onUploadComplete: (stickerId, serverFileId) => {
					const stickerData = this.state.uploadingFiles
						.find((sticker) => sticker.stickerId === stickerId)
					;
					stickerData.status = UploadStatus.complete;
					stickerData.serverFileId = serverFileId;

					emitter.emit(StickerEventType.uploader.complete, [stickerId]);
					this.updateEditButton();
				},
				onUploadError: (stickerId, error) => {
					const stickerData = this.state.uploadingFiles
						.find((sticker) => sticker.stickerId === stickerId)
					;
					stickerData.status = UploadStatus.error;
					stickerData.progress = 100;

					if (this.errorCollection[stickerId])
					{
						StickerNotifier.showUploaderError(error.message);
					}
					this.errorCollection[stickerId] = error;

					emitter.emit(StickerEventType.uploader.error, [stickerId]);
					this.updateEditButton();
				},
			});
		}

		componentDidMount()
		{
			super.componentDidMount();
			this.subscribeEvents();

			this.uploadQueue.subscribeUploaderEvents();
		}

		componentWillUnmount()
		{
			super.componentWillUnmount();
			this.unsubscribeEvents();

			this.uploadQueue.unsubscribeUploaderEvents();
		}

		render()
		{
			this.state.rows = this.getData();

			return View(
				{
					style: {
						flex: 1,
						backgroundColor: Color.bgSecondary.toHex(),
					},
				},
				this.renderHeader(),
				this.renderGrid(),
				this.renderFooter(),
			);
		}

		renderHeader()
		{
			return new StickerWidgetHeader({
				title: this.state.title,
				configurable: true,
				onClick: (ref) => {
					const menu = new UploadMenu({
						ui: ref,
						actions: [{
							name: ActionType.rename,
							onItemSelected: async () => {
								const params = await this.dialogs.renamePack(this.state.title);

								if (Type.isNil(params))
								{
									return;
								}

								this.state.title = params.title.trim();
								this.titleRef.setState({ title: this.state.title });
								this.updateEditButton();
							},
						}],
					});

					menu.show();
				},
				ref: (ref) => {
					this.titleRef = ref;
				},
			});
		}

		renderGrid()
		{
			return GridView({
				style: {
					flex: 1,
					justifyContent: 'center',
					paddingHorizontal: 18,
				},
				params: {
					orientation: 'vertical',
					rows: GridUtils.calculateRowSize(DEVICE_WIDTH),
				},
				data: [{ items: this.state.rows }],
				showsVerticalScrollIndicator: false,
				ref: (ref) => {
					this.gridRef = ref;
				},
				renderItem: (item) => {
					if (item.type === EditableElementType.create)
					{
						return StickerCreateView({
							onClick: this.creationClickHandler,
						});
					}

					if (item.type === EditableElementType.sticker)
					{
						return new StickerView({
							...item,
							onClick: () => {},
							onLongClick: this.showStickerMenu,
							ref: () => {},
						});
					}

					return new UploadingStickerView({
						...item,
						onClick: () => {},
						onUploadCancelClick: this.deleteUploadingSticker,
						onRetryUpload: (id) => {
							this.uploadQueue.uploadErrorSticker(id);
						},
						onLongClick: this.showUploadMenu,
						getUploadProgress: (id) => {
							const uploadingFile = this.state.uploadingFiles.find((file) => file.stickerId === id);

							return {
								uploadStatus: uploadingFile.status,
								progress: uploadingFile.progress,
							};
						},
					});
				},
			});
		}

		renderFooter()
		{
			return View(
				{
					style: {
						height: 100,
						borderTopWidth: 1,
						borderTopColor: Color.base7.toHex(),
						paddingTop: Indent.XL.toNumber(),
						paddingHorizontal: Component.paddingLrMore.toNumber(),
						flexDirection: 'column',
						justifyContent: 'flex-start',
					},
				},
				new PackButton({
					enabled: this.state.isEditButtonEnabled,
					text: Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_STICKER_SAVE_BUTTON'),
					ref: (ref) => {
						this.buttonRef = ref;
					},
					onClick: () => {
						const data = {};
						if (this.hasTitleChanged())
						{
							data.title = this.state.title;
						}

						if (this.hasUploadingFiles())
						{
							data.addedStickers = this.state.uploadingFiles.map((sticker) => sticker.serverFileId);
						}

						if (this.hasDeletedStickers())
						{
							data.deletedStickers = this.state.deletedStickers;
						}

						this.service.changePack(this.state.pack, data)
							.then((result) => {
								this.processChangeResult(result);
								emitter.emit(StickerEventType.widget.reload, []);
								this.props.onClose();
							})
							.catch(logger.error)
						;
					},
				}),
			);
		}

		/**
		 * @param {Array<DeviceFile>} files
		 * @return {Array<UploadingStickerData>}
		 */
		prepareFiles(files)
		{
			return files.map((file) => StickerFactory.createUploadData(file));
		}

		getData()
		{
			return [
				...this.getStickersData(this.state.stickers),
				...this.getUploadFilesData(this.state.uploadingFiles),
				{ type: EditableElementType.create },
			];
		}

		/**
		 * @param {Array<StickerState>} stickers
		 * @return {*}
		 */
		getStickersData(stickers)
		{
			if (!Type.isArrayFilled(stickers))
			{
				return [];
			}

			return stickers.map((sticker) => ({
				key: String(sticker.id),
				type: EditableElementType.sticker,
				uri: sticker.uri,
				id: sticker.id,
				isUploading: true,
			}));
		}

		/**
		 * @param {Array<UploadingStickerData>} files
		 * @return {*}
		 */
		getUploadFilesData(files)
		{
			return files.map((sticker) => ({
				key: String(sticker.stickerId),
				type: EditableElementType.uploadingSticker,
				uri: sticker.localUrl,
				id: sticker.stickerId,
				progress: sticker.progress,
				status: sticker.status,
			}));
		}

		subscribeEvents()
		{
			emitter.on(StickerEventType.widget.preventDismiss, this.preventDismissHandler);
		}

		unsubscribeEvents()
		{
			emitter.off(StickerEventType.widget.preventDismiss, this.preventDismissHandler);
		}

		preventDismissHandler = () => {
			if (!this.hasPackChanged())
			{
				this.props.onClose();

				return;
			}

			this.dialogs.closeCreationWidget(() => {
				this.props.onClose();
			});
		};

		creationClickHandler = async () => {
			const currentPackSize = this.getCurrentPackSize();
			if (currentPackSize >= MAX_STICKER_PACK_SIZE)
			{
				StickerNotifier.showMaxPackSizeToast();

				return;
			}

			const maxSelectedItems = MAX_STICKER_PACK_SIZE - currentPackSize;

			this.dialogs.createStickers(
				maxSelectedItems,
				async (stickerParams) => {
					if (Type.isNil(stickerParams))
					{
						return;
					}

					const { files } = stickerParams;

					const stickerList = this.prepareFiles(files);
					const rows = this.getUploadFilesData(stickerList);

					const index = this.state.rows.length - 1;

					this.state.uploadingFiles.push(...stickerList);
					await this.gridRef.insertRows(rows, 0, index);
					this.state.rows.splice(index, 0, ...rows);

					this.updateEditButton();

					this.uploadQueue.uploadStickers(stickerList);
				},
			);
		};

		showUploadMenu = (id, ref) => {
			const menu = new UploadMenu({
				ui: ref,
				actions: [{
					name: ActionType.delete,
					onItemSelected: () => this.deleteUploadingSticker(id),
				}],
			});

			menu.show();
		};

		showStickerMenu = (id, ref) => {
			const menu = new UploadMenu({
				ui: ref,
				actions: [{
					name: ActionType.delete,
					onItemSelected: () => this.deleteSticker(id),
				}],
			});

			menu.show();
		};

		deleteUploadingSticker = (id) => {
			this.state.uploadingFiles = this.state.uploadingFiles.filter((sticker) => sticker.stickerId !== id);

			const index = this.state.rows.findIndex((row) => row.id === id);

			if (index === -1)
			{
				return;
			}

			this.updateEditButton();

			this.gridRef.deleteRow(0, index, 'fade', () => {
				this.state.rows.splice(index, 1);
			});
		};

		deleteSticker = (id) => {
			const index = this.state.rows.findIndex((row) => row.id === id);

			if (index === -1)
			{
				return;
			}
			this.state.stickers = this.state.stickers.filter((sticker) => sticker.id !== id);

			this.state.deletedStickers.push(id);

			this.updateEditButton();

			this.gridRef.deleteRow(0, index, 'fade', () => {
				this.state.rows.splice(index, 1);

			});
		};

		updateEditButton()
		{
			if (this.hasAllCurrentStickersDeleted() && !this.hasUploadingFiles())
			{
				this.state.isEditButtonEnabled = false;
				this.buttonRef.setEnabled(false);

				return;
			}

			if (this.getCurrentPackSize() > MAX_STICKER_PACK_SIZE)
			{
				this.state.isEditButtonEnabled = false;
				this.buttonRef.setEnabled(false);

				return;
			}

			if (this.#checkTitleLength())
			{
				this.state.isEditButtonEnabled = false;
				this.buttonRef.setEnabled(false);

				return;
			}

			const isEditButtonEnabled = this.hasPackChanged();
			if (this.state.isEditButtonEnabled !== isEditButtonEnabled)
			{
				this.state.isEditButtonEnabled = isEditButtonEnabled;

				this.buttonRef.setEnabled(isEditButtonEnabled);
			}
		}

		hasPackChanged()
		{
			if (this.hasUploadingFiles())
			{
				return this.#isEveryFilesUploadComplete();
			}

			return this.hasDeletedStickers() || this.hasTitleChanged();
		}

		hasUploadingFiles()
		{
			return Type.isArrayFilled(this.state.uploadingFiles);
		}

		#isEveryFilesUploadComplete()
		{
			return this.state.uploadingFiles.every((sticker) => sticker.status === 'complete');
		}

		hasDeletedStickers()
		{
			return Type.isArrayFilled(this.state.deletedStickers);
		}

		hasTitleChanged()
		{
			return this.state.pack.name !== this.state.title;
		}

		hasAllCurrentStickersDeleted()
		{
			return !Type.isArrayFilled(this.state.stickers);
		}

		#checkTitleLength()
		{
			if (!Type.isStringFilled(this.state.title))
			{
				return true;
			}

			return this.state.title.length > 255;
		}

		getCurrentPackSize()
		{
			return this.state.stickers.length + this.state.uploadingFiles.length;
		}

		processChangeResult(result)
		{
			if (!Type.isNil(result.rename?.error))
			{
				StickerNotifier.showRenamePackError();
			}

			if (!Type.isNil(result.addStickers?.error))
			{
				StickerNotifier.showAddStickersError();
			}

			if (!Type.isNil(result.deleteStickers?.error))
			{
				StickerNotifier.showDeleteStickersError();
			}
		}
	}

	module.exports = { StickerPackEditor };
});

/**
 * @module im/messenger/controller/dialog/lib/sticker/src/widget/creator
 */
jn.define('im/messenger/controller/dialog/lib/sticker/src/widget/creator', (require, exports, module) => {
	const { Type } = require('type');
	const { Color, Component, Indent } = require('tokens');

	const { Loc } = require('im/messenger/loc');
	const { ErrorType } = require('im/messenger/const');

	const {
		StickerEventType,
		UploadStatus,
		EditableElementType,
		MAX_STICKER_PACK_SIZE,
		DEVICE_WIDTH,
	} = require('im/messenger/controller/dialog/lib/sticker/src/const');
	const { GridUtils } = require('im/messenger/controller/dialog/lib/sticker/src/utils/grid');
	const { emitter } = require('im/messenger/controller/dialog/lib/sticker/src/utils/emitter');

	const { StickerService } = require('im/messenger/controller/dialog/lib/sticker/src/service/service');
	const { StickerFactory } = require('im/messenger/controller/dialog/lib/sticker/src/service/factory');
	const { StickerUploadQueue } = require('im/messenger/controller/dialog/lib/sticker/src/service/upload-queue');

	const { StickerWidgetHeader } = require('im/messenger/controller/dialog/lib/sticker/src/ui/header');
	const { StickerCreateView } = require('im/messenger/controller/dialog/lib/sticker/src/ui/grid/element/create');
	const { UploadingStickerView } = require('im/messenger/controller/dialog/lib/sticker/src/ui/grid/element/uploading');
	const { UploadMenu, ActionType } = require('im/messenger/controller/dialog/lib/sticker/src/ui/menu/upload');
	const { PackButton } = require('im/messenger/controller/dialog/lib/sticker/src/ui/button');

	const { StickerDialogs } = require('im/messenger/controller/dialog/lib/sticker/src/dialogs');
	const { StickerNotifier } = require('im/messenger/controller/dialog/lib/sticker/src/notifier');

	/**
	 * @class StickerPackCreator
	 * @typedef {LayoutComponent<StickerPackCreatorProps, StickerPackCreatorState>} StickerPackCreator
	 */
	class StickerPackCreator extends LayoutComponent
	{
		/**
		 * @param {StickerPackCreatorProps} props
		 */
		constructor(props)
		{
			super(props);
			this.state = {
				title: this.props.title.trim(),
				stickers: this.prepareFiles(this.props.files),
				rows: [],
				isEnabledCreationButton: false,
			};
			/** @type {GridViewMethods} */
			this.gridRef = null;
			this.service = new StickerService({
				dialogLocator: props.dialogLocator,
			});
			/** @type {PackButton} */
			this.buttonRef = null;

			this.errorCollection = {};
			this.dialogs = new StickerDialogs();

			this.uploadQueue = new StickerUploadQueue({
				onUploadProgress: (stickerId, percent) => {
					const stickerData = this.state.stickers
						.find((sticker) => sticker.stickerId === stickerId)
					;
					stickerData.status = UploadStatus.progress;
					stickerData.progress = percent;

					emitter.emit(StickerEventType.uploader.setProgress, [stickerId, percent]);
				},
				onUploadComplete: (stickerId, serverFileId) => {
					const stickerData = this.state.stickers
						.find((sticker) => sticker.stickerId === stickerId)
					;
					stickerData.status = UploadStatus.complete;
					stickerData.serverFileId = serverFileId;

					emitter.emit(StickerEventType.uploader.complete, [stickerId]);
					this.updateCreationButton();
				},
				onUploadError: (stickerId, error) => {
					const stickerData = this.state.stickers
						.find((sticker) => sticker.stickerId === stickerId)
					;
					stickerData.status = UploadStatus.error;
					stickerData.progress = 100;
					if (this.errorCollection[stickerId])
					{
						this.#showUploadingError(error);
					}
					this.errorCollection[stickerId] = error;

					emitter.emit(StickerEventType.uploader.error, [stickerId]);
					this.updateCreationButton();
				},
			});
		}

		componentDidMount()
		{
			super.componentDidMount();
			this.subscribeEvents();
			this.uploadQueue.subscribeUploaderEvents();

			this.uploadQueue.uploadStickers(this.state.stickers);
		}

		componentWillUnmount()
		{
			super.componentWillUnmount();
			this.unsubscribeEvents();

			this.uploadQueue.unsubscribeUploaderEvents();
		}

		render()
		{
			this.state.rows = this.getData(this.state.stickers);

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
								this.updateCreationButton();
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

					return new UploadingStickerView({
						...item,
						onClick: (id, ref) => {},
						onUploadCancelClick: this.deleteUploadingSticker,
						onRetryUpload: (id) => {
							this.uploadQueue.uploadErrorSticker(id);
						},
						onLongClick: this.showUploadMenu,
						getUploadProgress: (id) => {
							const stickerData = this.state.stickers
								.find((uploadingSticker) => uploadingSticker.stickerId === id)
							;

							return {
								uploadStatus: stickerData.status,
								progress: stickerData.progress,
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
					enabled: this.state.isEnabledCreationButton,
					text: Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_STICKER_CREATE_BUTTON'),
					ref: (ref) => {
						this.buttonRef = ref;
					},
					onClick: () => {
						const fileIds = this.state.stickers.map((sticker) => sticker.serverFileId);

						this.service.createPack(this.state.title, fileIds)
							.then(() => {
								emitter.emit(StickerEventType.widget.reload, []);
								this.props.onClose();
							}).catch((error) => {
								StickerNotifier.showUnknownError();
								this.buttonRef.setLoading(false);
							});
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

		/**
		 *
		 * @param {Array<UploadingStickerData>} stickerFiles
		 * @param shouldRenderCreationElement
		 */
		getData(stickerFiles, shouldRenderCreationElement = true)
		{
			const data = stickerFiles.map((sticker) => ({
				key: String(sticker.stickerId),
				type: EditableElementType.uploadingSticker,
				uri: sticker.localUrl,
				id: sticker.stickerId,
				progress: sticker.progress,
				status: sticker.status,
			}));

			if (shouldRenderCreationElement)
			{
				data.push({
					type: EditableElementType.create,
				});
			}

			return data;
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

			this.dialogs.createStickers(maxSelectedItems, async (stickerParams) => {
				if (Type.isNil(stickerParams))
				{
					return;
				}

				const { files } = stickerParams;

				const stickerList = this.prepareFiles(files);
				const rows = this.getData(stickerList, false);

				const index = this.state.rows.length - 1;
				this.state.stickers.push(...stickerList);
				await this.gridRef.insertRows(rows, 0, index);
				this.state.rows.splice(index, 0, ...rows);

				this.updateCreationButton();

				this.uploadQueue.uploadStickers(stickerList);
			});
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

		deleteUploadingSticker = (id) => {
			this.state.stickers = this.state.stickers.filter((sticker) => sticker.stickerId !== id);

			const index = this.state.rows.findIndex((row) => row.id === id);

			if (index === -1)
			{
				return;
			}

			this.updateCreationButton();

			this.gridRef.deleteRow(0, index, 'fade', () => {
				this.state.rows.splice(index, 1);
			});
		};

		updateCreationButton()
		{
			if (this.getCurrentPackSize() > MAX_STICKER_PACK_SIZE || this.#checkTitleLength())
			{
				this.state.isEnabledCreationButton = false;
				this.buttonRef.setEnabled(false);

				return;
			}
			const isEveryFilesUploadComplete = this.#isEveryFilesUploadComplete();

			if (this.state.isEnabledCreationButton !== isEveryFilesUploadComplete)
			{
				this.state.isEnabledCreationButton = isEveryFilesUploadComplete;

				this.buttonRef.setEnabled(isEveryFilesUploadComplete);
			}
		}

		getCurrentPackSize()
		{
			return this.state.stickers.length;
		}

		#showUploadingError(error)
		{
			if (error.code === ErrorType.networkError)
			{
				StickerNotifier.showNetworkError();

				return;
			}
			StickerNotifier.showUploaderError(error.message);
		}

		#checkTitleLength()
		{
			return this.state.title.length > 255;
		}

		#isEveryFilesUploadComplete()
		{
			if (!Type.isArrayFilled(this.state.stickers))
			{
				return false;
			}

			return this.state.stickers.every((sticker) => sticker.status === 'complete');
		}
	}

	module.exports = { StickerPackCreator };
});

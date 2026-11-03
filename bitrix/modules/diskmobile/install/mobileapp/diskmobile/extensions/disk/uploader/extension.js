/**
 * @module disk/uploader
 */
jn.define('disk/uploader', (require, exports, module) => {
	const { Color } = require('tokens');
	const { Loc } = require('loc');
	const { BottomSheet } = require('bottom-sheet');
	const { Uuid } = require('utils/uuid');

	const { Defaults } = require('disk/uploader/src/config');
	const { DiskUploaderView } = require('disk/uploader/src/view');

	class DiskUploader
	{
		/**
		 * @public
		 * @param {DiskUploaderOptions} options
		 */
		static open(options)
		{
			(new DiskUploader(options)).run();
		}

		/**
		 * @private
		 * @param {DiskUploaderOptions} options
		 */
		constructor(options)
		{
			/** @type {DiskUploaderOptions} */
			this.options = options;
		}

		/**
		 * @private
		 * @return {void}
		 */
		run()
		{
			this.#pickFiles((files) => {
				const tasks = this.#prepareTasks(files);

				const bottomSheet = new BottomSheet({
					component: (layoutWidget) => new DiskUploaderView({
						tasks,
						layoutWidget,
						onCommit: this.options.onCommit,
						shouldOpenNativeViewer: this.options.shouldOpenNativeViewer,
						uniqueCode: this.options.uniqueCode,
					}),
				});

				bottomSheet
					.setParentWidget(this.#getParentWidget())
					.setBackgroundColor(Color.bgSecondary.toHex())
					.setNavigationBarColor(Color.bgContentPrimary.toHex())
					.enableForceDismissOnSwipeDown()
					.disableHorizontalSwipe()
					.enableSwipe()
					.enableResizeContent()
					.disableOnlyMediumPosition()
					.setTitleParams({
						text: Loc.getMessage('M_DISK_UPLOADER_TITLE'),
						type: 'dialog',
					});

				if (tasks.length > 6)
				{
					bottomSheet.showOnTop();
				}

				void bottomSheet.open();
			});
		}

		/**
		 * PageManager satisfies the same shape, so it stands in when no widget is given.
		 * @return {DiskUploaderParentWidget}
		 */
		#getParentWidget()
		{
			return this.options.layoutWidget ?? PageManager;
		}

		/**
		 * @param {(files: Array<DiskUploaderPickedFile>) => void} onFilesSelected
		 * @return {void}
		 */
		#pickFiles(onFilesSelected)
		{
			const items = [
				{ id: 'mediateka' },
				{ id: 'camera' },
				...(this.options.extraItems ?? []),
			];

			const settings = {
				resize: {
					targetWidth: -1,
					targetHeight: -1,
					sourceType: 1,
					encodingType: 0,
					mediaType: 2,
					allowsEdit: true,
					saveToPhotoAlbum: true,
					cameraDirection: 0,
				},
				maxAttachedFilesCount: Defaults.MAX_ATTACHED_FILES_COUNT,
				previewMaxWidth: Defaults.PREVIEW_MAX_WIDTH,
				previewMaxHeight: Defaults.PREVIEW_MAX_HEIGHT,
				attachButton: { items },
			};

			const itemSelectedCallback = this.options.itemSelectedCallback ?? null;

			if (itemSelectedCallback)
			{
				dialogs.showImagePicker({ settings }, onFilesSelected, null, itemSelectedCallback);
			}
			else
			{
				dialogs.showImagePicker({ settings }, onFilesSelected);
			}
		}

		/**
		 * @param {Array<DiskUploaderPickedFile>} [files]
		 * @return {Array<DiskUploadTask>}
		 */
		#prepareTasks(files = [])
		{
			return files.map((file) => {
				const task = {
					...file,
					taskId: Uuid.getV4(),
					folderId: this.options.folderId,
					chunk: Defaults.CHUNK_SIZE,
					params: {
						disableAutoCommit: true,
					},
				};

				const type = (file.type ? String(file.type) : '').toLowerCase();

				if (type === 'heic')
				{
					task.resize = {
						width: file.width ? (file.width * 2) : undefined,
						height: file.height ? (file.height * 2) : undefined,
						quality: 60,
					};
				}

				return task;
			});
		}
	}

	module.exports = { DiskUploader };
});

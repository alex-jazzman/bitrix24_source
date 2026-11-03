/**
 * @module im/messenger/controller/dialog/lib/message-menu/src/saver/base-saver
 */
jn.define('im/messenger/controller/dialog/lib/message-menu/src/saver/base-saver', (require, exports, module) => {
	const { Type } = require('type');
	const { getLogger } = require('im/messenger/lib/logger');
	const { Analytics, FileType } = require('im/messenger/const');
	const { AnalyticsService } = require('im/messenger/provider/services/analytics');
	const { SavedFilesKind, showSuccessSaveToast, showSaveFailureToast } = require(
		'im/messenger/controller/dialog/lib/message-menu/src/saver/save-toast',
	);

	/**
	 * @abstract
	 * @class BaseSaver
	 */
	class BaseSaver
	{
		/**
		 * @typedef {Object} SaverProps
		 * @property {DialogLocator} locator
		 * @property {DialogId} dialogId
		 * @property {MessageHelper} messageHelper
		 * @property {boolean} isNestedSection
		 * @property {Array<FilesModelState>} [files] narrows the action to the given files;
		 *   without it the action works on all files of the message
		 * @param {SaverProps} props
		 */
		constructor(props)
		{
			/** @type {DialogLocator} */
			this.dialogLocator = props.locator;
			/** @type {DialogView} */
			this.view = props.locator.get('view');
			/** @type {DialogId} */
			this.dialogId = props.dialogId;
			/** @type {MessageHelper} */
			this.messageHelper = props.messageHelper;
			this.logger = getLogger('dialog--message-menu-file-saver');
			this.parentWidget = props.parentWidget;
			this.isNestedSection = props.isNestedSection;
			/** @type {Array<FilesModelState>|null} */
			this.explicitFiles = props.files ?? null;
		}

		/**
		 * @abstract
		 * @public
		 * @returns {Promise<void>}
		 */
		async save()
		{
			throw new Error(`${this.constructor.name}.save() method should be implemented in child class`);
		}

		/**
		 * @abstract
		 * @protected
		 * @returns {'DISK'|'DEVICE'}
		 */
		getType()
		{
			throw new Error(`${this.constructor.name}.getType() method should be implemented in child class`);
		}

		/**
		 * @protected
		 * @returns {sendAnalyticsParams}
		 */
		getAnalyticsParams()
		{
			const fileType = this.isMediaFileSet()
				? Analytics.Type.media
				: Analytics.Type.file;

			return {
				fileType,
				dialogId: this.dialogId,
				isNestedSection: this.isNestedSection,
			};
		}

		/**
		 * Files the action works on: the scope the caller narrowed it to (the download link of a
		 * single block), or all files of the message, its blocks included. The gallery of a block is
		 * the last source, and it is not closed by the option that opens the file blocks: the media
		 * viewer offers saving on its own, so what it opened on stays reachable as before the feature.
		 *
		 * @returns {Array<FilesModelState>}
		 */
		getFiles()
		{
			if (this.hasExplicitFileScope())
			{
				return this.explicitFiles;
			}

			const files = this.messageHelper.getAllFiles();

			return files.length > 0 ? files : this.messageHelper.getBlockMediaFiles();
		}

		/**
		 * @protected
		 * @returns {boolean}
		 */
		hasExplicitFileScope()
		{
			return Type.isArray(this.explicitFiles);
		}

		/**
		 * What the set of saved files is: the phrase of the toast and the type of the analytics event
		 * describe the files the action really saves, and not the attachments of the message, which
		 * a block message has none of.
		 *
		 * @protected
		 * @returns {string} one of SavedFilesKind
		 */
		getSavedFilesKind()
		{
			const files = this.getFiles();

			if (files.length > 1)
			{
				const isEveryFileMedia = files.every(
					(file) => file.type === FileType.image || file.type === FileType.video,
				);

				return isEveryFileMedia ? SavedFilesKind.mediaGallery : SavedFilesKind.fileGallery;
			}

			const file = files[0];
			if (!file || file.isVideoNote)
			{
				return SavedFilesKind.default;
			}

			if (file.type === FileType.image)
			{
				return Type.isStringFilled(file.urlPreview) ? SavedFilesKind.image : SavedFilesKind.default;
			}

			return file.type === FileType.video ? SavedFilesKind.video : SavedFilesKind.default;
		}

		/**
		 * @protected
		 * @returns {boolean}
		 */
		isMediaFileSet()
		{
			const kind = this.getSavedFilesKind();

			return kind === SavedFilesKind.image
				|| kind === SavedFilesKind.video
				|| kind === SavedFilesKind.mediaGallery;
		}

		showSuccessSaveToast()
		{
			showSuccessSaveToast({
				to: this.getType(),
				kind: this.getSavedFilesKind(),
				parentWidget: this.parentWidget,
			});
		}

		downloadFailure(errorStatus)
		{
			this.showSaveFailureToast();
			this.sendAnalyticsErrors(errorStatus);
		}

		sendAnalyticsErrors(errorStatus)
		{
			AnalyticsService.getInstance().sendDownloadError({
				...this.getAnalyticsParams(),
				status: errorStatus,
			});
		}

		showSaveFailureToast()
		{
			showSaveFailureToast({
				to: this.getType(),
				messageHelper: this.messageHelper,
				parentWidget: this.parentWidget,
			});
		}
	}

	module.exports = {
		BaseSaver,
	};
});

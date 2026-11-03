/**
 * @module im/messenger/controller/dialog/lib/message-menu/src/saver/file-saver
 */
jn.define('im/messenger/controller/dialog/lib/message-menu/src/saver/file-saver', (require, exports, module) => {
	const { Loc } = require('im/messenger/loc');
	const { Type } = require('type');
	const { fileSaver: fileSaverUtility } = require('utils/file');
	const { Alert, ButtonType } = require('alert');
	const { MobileFeature } = require('im/messenger/lib/feature');
	const { FileDownloadType, Analytics } = require('im/messenger/const');
	const { AnalyticsService } = require('im/messenger/provider/services/analytics');
	const { ServerDownloadMenu } = require('im/messenger/controller/file-download-menu');
	const { BaseSaver } = require('im/messenger/controller/dialog/lib/message-menu/src/saver/base-saver');

	/**
	 * @class FileSaver
	 */
	class FileSaver extends BaseSaver
	{
		async save()
		{
			const messageId = String(this.messageHelper.messageId);
			const downloadMethod = this.canDownloadFilesByMessage()
				? this.multipleFilesDownload
				: this.fallbackMultipleFilesDownload;

			try
			{
				const localPaths = await downloadMethod(messageId);

				if (!localPaths)
				{
					return;
				}

				await this.saveFiles(localPaths);
			}
			catch (error)
			{
				this.downloadFailure(Analytics.DownloadErrorStatus.toDevice);
				this.logger.error('MessageMenu.saveFiles.catch:', error);
			}
		}

		/**
		 * The native batch warms the cache and gives the iOS download menu, but it is scoped to the
		 * files of the message itself: block files are out of its list, and the download link of a
		 * single block must not pull the files of the whole message. Both cases go the URL list path
		 * instead, at the cost of the native download UI.
		 *
		 * @protected
		 * @returns {boolean}
		 */
		canDownloadFilesByMessage()
		{
			if (this.hasExplicitFileScope() || this.messageHelper.getBlockFiles().length > 0)
			{
				return false;
			}

			return MobileFeature.isMultipleFilesDownloadSupported()
				&& this.messageHelper.isGallery
				&& !this.messageHelper.isMediaGallery;
		}

		/**
		 * @private
		 * @param {MessageId} messageId
		 * @returns {Promise<String[]|null>}
		 */
		multipleFilesDownload = async (messageId) => {
			const isAllContentCache = await this.view.isAllContentCache(messageId);

			if (!isAllContentCache)
			{
				const downloadFiles = () => this.view.downloadFilesForMessage(messageId);

				if (Application.getPlatform() === 'ios')
				{
					void ServerDownloadMenu.open({
						onDownload: downloadFiles,
					});

					return null;
				}

				await downloadFiles();
			}

			return this.view.getLocalPathListForMessage(messageId);
		};

		/**
		 * @private
		 * @returns {Promise<String[]|null>}
		 */
		fallbackMultipleFilesDownload = async () => {
			const downloadResult = await fileSaverUtility().downloadFileToLocalCache(
				this.getFiles().map((file) => file.urlDownload),
			);
			const isSuccessDownloaded = downloadResult.every((result) => result.status === 'fulfilled');

			if (isSuccessDownloaded)
			{
				return downloadResult.map((result) => result.value);
			}

			this.downloadFailure(Analytics.DownloadErrorStatus.multipleFiles);

			return null;
		};

		async saveFiles(filePaths)
		{
			const isMediaFileSet = this.isMediaFileSet();

			try
			{
				const saver = isMediaFileSet
					? fileSaverUtility().saveToMediaLibrary
					: fileSaverUtility().saveToStorage;

				await saver(filePaths);
				this.showSuccessSaveToast();
				this.sendAnalytics();
			}
			catch (error)
			{
				const isAuthorizationDenied = (saveError) => String(saveError)?.includes('Authorization denied');

				const isPermissionDeniedError = Type.isArray(error)
					? error.find(({ reason }) => isAuthorizationDenied(reason))
					: isAuthorizationDenied(error);

				if (isPermissionDeniedError)
				{
					this.#showSettings();
				}
				else if (isMediaFileSet)
				{
					this.downloadFailure(Analytics.DownloadErrorStatus.toGallery);
				}

				this.logger.error('MessageMenu.saveFiles.catch:', error);
			}
		}

		getType()
		{
			return FileDownloadType.device;
		}

		sendAnalytics()
		{
			AnalyticsService.getInstance().sendDownloadToDevice(this.getAnalyticsParams());
		}

		#showSettings = () => {
			Alert.confirm(
				null,
				Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_MESSAGE_MENU_DOWNLOAD_TO_GALLERY_FAILURE'),
				[
					{
						type: ButtonType.DEFAULT,
						text: Loc.getMessage(
							'IMMOBILE_MESSENGER_DIALOG_MESSAGE_MENU_DOWNLOAD_TO_GALLERY_FAILURE_NO',
						),
					},
					{
						type: ButtonType.DEFAULT,
						text: Loc.getMessage(
							'IMMOBILE_MESSENGER_DIALOG_MESSAGE_MENU_DOWNLOAD_TO_GALLERY_FAILURE_SETTINGS',
						),
						onPress: () => {
							Application.openSettings();
						},
					},
				],
			);
		};
	}

	module.exports = {
		/**
		 * @param {BaseSaver} props
		 * @returns {FileSaver}
		 */
		fileSaver: (props) => new FileSaver(props),
	};
});

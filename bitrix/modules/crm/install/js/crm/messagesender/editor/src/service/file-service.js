import { ajax as Ajax, type AjaxResponse, Runtime, Type } from 'main.core';
import { type Uploader, type UploaderFile } from 'ui.uploader.core';
import type { Store } from 'ui.vue3.vuex';
import { type Logger } from './logger';

export type File = {
	name: string,
	externalLink: string,
};

type FileWatcher = (File) => void;

export class FileService
{
	#logger: Logger;
	#store: Store;

	#uploader: ?Uploader = null;
	#browseElement: ?HTMLDivElement = null;
	#fileWatcher: ?FileWatcher = null;

	constructor(params: { logger: Logger, store: Store })
	{
		this.#logger = params.logger;
		this.#store = params.store;
	}

	/**
	 * @param onSuccess can be called multiple times if user selects multiple files
	 */
	uploadNewFile(onSuccess: (File) => void): void
	{
		if (this.#store.getters['application/isProgress'])
		{
			this.#logger.warn('Cannot upload file while in progress');

			return;
		}

		this.#fileWatcher = onSuccess;

		void this.#openFileBrowser();
	}

	/**
	 * @param onSuccess can be called multiple times if user selects multiple files
	 */
	pickFromDisk(onSuccess: (File) => void): void
	{
		if (this.#store.getters['application/isProgress'])
		{
			this.#logger.warn('Cannot pick file from disk while in progress');

			return;
		}

		this.#fileWatcher = onSuccess;

		void this.#openDiskFileDialog();
	}

	async #openFileBrowser(): void
	{
		if (this.#browseElement)
		{
			this.#browseElement.click();

			return;
		}

		const uploader = await this.#getUploader();

		this.#browseElement = document.createElement('div');
		uploader.assignBrowse(this.#browseElement);

		this.#browseElement.click();
	}

	async #openDiskFileDialog(): Promise<void>
	{
		const uploader = await this.#getUploader();

		const { openDiskFileDialog } = await Runtime.loadExtension('disk.uploader.user-field-widget');

		openDiskFileDialog({
			dialogId: 'crm-messagesender-editor',
			uploader,
		});
	}

	#getUploader(): Promise<Uploader>
	{
		if (this.#uploader)
		{
			return Promise.resolve(this.#uploader);
		}

		return Runtime.loadExtension('ui.uploader.core').then((exports) => {
			let linkLoadsCount = 0;

			/** @see { BX.UI.Uploader.Uploader } */
			this.#uploader = new exports.Uploader({
				controller: 'disk.uf.integration.diskUploaderController',
				multiple: true,
				events: {
					[exports.UploaderEvent.FILE_ADD_START]: () => {
						void this.#store.dispatch('application/setProgress', { isLoading: true });
					},
					[exports.UploaderEvent.FILE_ERROR]: (event) => {
						this.#logger.error('Failed to upload file', event.getData());

						if (linkLoadsCount <= 0 && !this.#isUploaderBusy(this.#uploader))
						{
							void this.#store.dispatch('application/setProgress', { isLoading: false });
						}
					},
					// fires both on upload complete (from browser) and load complete (from disk dialog)
					[exports.UploaderEvent.FILE_COMPLETE]: (event) => {
						const file: UploaderFile = event.getData().file;

						linkLoadsCount++;

						void this.#getExternalLink(file.getCustomData('fileId'))
							// eslint-disable-next-line promise/no-nesting
							.then((link) => {
								this.#fileWatcher?.({
									name: file.getName(),
									externalLink: link,
								});
							})
							.finally(() => {
								linkLoadsCount--;

								if (linkLoadsCount <= 0 && !this.#isUploaderBusy(this.#uploader))
								{
									void this.#store.dispatch('application/setProgress', { isLoading: false });
								}
							})
						;
					},
				},
			});

			return this.#uploader;
		}).catch((error) => {
			this.#logger.error('Failed to load ui.uploader.core', error);

			throw error;
		});
	}

	#isUploaderBusy(uploader: Uploader): boolean
	{
		if (!Type.isFunction(uploader.getUploadingFileCount))
		{
			// already destroyed

			return false;
		}

		if (uploader.getUploadingFileCount() > 0)
		{
			return true;
		}

		if (uploader.getPendingFileCount() > 0)
		{
			return true;
		}

		return uploader.getFiles().some((file: UploaderFile) => file.isLoading());
	}

	#getExternalLink(fileId: number): Promise<string>
	{
		return new Promise((resolve, reject) => {
			Ajax.runAction(
				'disk.file.generateExternalLink',
				{
					analyticsLabel: 'crmTimelineSmsEditorGetFilePublicUrl',
					data: {
						fileId,
					},
				},
			).then((response: AjaxResponse<{ externalLink: { link: string }}>) => {
				if (Type.isStringFilled(response?.data?.externalLink?.link))
				{
					resolve(response.data.externalLink.link);
				}
				else
				{
					reject(new Error('No external link in response'));
				}
			}).catch((error) => {
				this.#logger.error('Failed to get external link', error);
				reject(error);
			});
		});
	}
}

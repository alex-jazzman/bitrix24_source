import { Runtime, Type, Loc, Text, Event } from 'main.core';
import { EventEmitter, type BaseEvent } from 'main.core.events';
import { VueUploaderAdapter, type FileStatus, type UploaderFileInfo } from 'ui.uploader.vue';

export type BrowseParams = {
	bindElement: HTMLElement,
	onShowCallback?: Function,
	onHideCallback?: Function,
	compact: boolean,
};

export class FileService extends EventEmitter {
	#adapter: VueUploaderAdapter | null = null;

	constructor(id: string)
	{
		super();

		this.setEventNamespace('Bizporcdesigner.TextEditor.Files');
		this.#initAdapter(id);
	}

	static get EVENT_NAMES(): Record<string, string>
	{
		return {
			ON_FILE_ADD: 'onFileAdd',
			ON_FILE_COMPLETE: 'onFileComplete',
			ON_FILE_REMOVE: 'onFileRemove',
		};
	}

	#initAdapter(id: string): void
	{
		this.#adapter = new VueUploaderAdapter({
			id,
			controller: 'disk.uf.integration.diskUploaderController',
			imagePreviewHeight: 1200,
			imagePreviewWidth: 1200,
			imagePreviewQuality: 0.85,
			ignoreUnknownImageTypes: true,
			treatOversizeImageAsFile: true,
			multiple: true,
			maxFileSize: null,
		});

		this.#adapter.subscribeFromOptions({
			'Item:onAdd': (event: BaseEvent) => {
				const { item: file } = event.getData();

				this.emit(FileService.EVENT_NAMES.ON_FILE_ADD, file);
			},
			'Item:onComplete': (event: BaseEvent) => {
				const { item: file } = event.getData();

				this.emit(FileService.EVENT_NAMES.ON_FILE_COMPLETE, file);
			},
			'Item:onRemove': (event: BaseEvent) => {
				const { item: file } = event.getData();
				this.emit(FileService.EVENT_NAMES.ON_FILE_REMOVE, { file });
			},
		});
	}

	browse(params: BrowseParams): Promise<void>
	{
		Runtime.loadExtension('disk.uploader.user-field-widget')
			.then(({ UserFieldMenu }) => {
				const menu = new UserFieldMenu({
					dialogId: 'bizprocdesigner-text-editor',
					uploader: this.#adapter.getUploader(),
					compact: params.compact || false,
					menuOptions: {
						minWidth: 220,
						animation: 'fading',
						closeByEsc: true,
						bindOptions: {
							forceBindPosition: true,
						},
						events: {
							onPopupClose: () => {
								params.onHideCallback?.();
							},
							onPopupShow: () => {
								params.onShowCallback?.();
							},
						},
					},
				});

				menu.show(params.bindElement);
			})
			.catch((error) => console.error(error))
		;
	}

	getAdapter(): VueUploaderAdapter
	{
		return this.#adapter;
	}

	getFileItems(): UploaderFileInfo[]
	{
		return this.#adapter.getItems();
	}

	loadInitialFiles(files: UploaderFileInfo[]): void
	{
		if (!Type.isArrayFilled(files))
		{
			return;
		}

		const uploader = this.#adapter.getUploader();
		if (uploader.getFiles().length > 0)
		{
			return;
		}

		uploader.addFiles(files);
	}

	destroy(): void
	{
		this.#adapter.unsubscribeAll('Item:onAdd');
		this.#adapter.unsubscribeAll('Item:onComplete');
		this.#adapter.unsubscribeAll('Item:onRemove');
		this.#adapter.getUploader().destroy();
	}
}

const fileServicesMap = {};

export const fileServices = {
	get(blockId): FileService
	{
		fileServicesMap[blockId] ??= new FileService(blockId);

		return fileServicesMap[blockId];
	},
	delete(blockId): void
	{
		fileServicesMap[blockId]?.destroy();

		delete fileServicesMap[blockId];
	}
};
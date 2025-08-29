import { EventEmitter } from 'main.core.events';
import type { BaseEvent } from 'main.core.events';

import { FileStatus, getFilesFromDataTransfer, isFilePasted } from 'ui.uploader.core';
import { VueUploaderAdapter } from 'ui.uploader.vue';
import type { UploaderFileInfo, UploaderFile } from 'ui.uploader.core';
import type { Store } from 'ui.vue3.vuex';

import { UserFieldMenu, openDiskFileDialog } from 'disk.uploader.user-field-widget';
import { Model } from 'tasks.v2.const';
import { Core } from 'tasks.v2.core';
import { apiClient } from 'tasks.v2.lib.api-client';
import { taskService } from 'tasks.v2.provider.service.task-service';

import { mapDtoToModel } from './mappers';
import { processCheckListFileIds } from './util';
import type { FileId, FileDto } from './types';

export type BrowseParams = {
	bindElement: HTMLElement,
	onHideCallback?: Function,
};

export const EntityTypes = Object.freeze({
	Task: 'task',
	CheckListItem: 'checkListItem',
});

export type EntityType = $Values<typeof EntityTypes>;

export class FileService extends EventEmitter
{
	#entityId: number | string;
	#entityType: EntityType;
	#menu: UserFieldMenu;
	#loadedIds: Set<FileId> = new Set();
	#objectsIds: { [id: FileId]: number } = {};
	#promises: Promise[] = [];
	#adapter: VueUploaderAdapter;

	constructor(entityId: number | string, entityType: EntityType = EntityTypes.Task)
	{
		super();

		this.setEventNamespace('Tasks.V2.Provider.Service.FileService');
		this.setEntityId(entityId, entityType);

		this.#adapter = new VueUploaderAdapter({
			id: getServiceKey(entityId, entityType),
			controller: 'disk.uf.integration.diskUploaderController',
			imagePreviewHeight: 1200,
			imagePreviewWidth: 1200,
			imagePreviewQuality: 0.85,
			treatOversizeImageAsFile: true,
			multiple: true,
			maxFileSize: null,
		});

		this.#adapter.subscribeFromOptions({
			'Item:onAdd': (event: BaseEvent) => {
				const { item: file } = event.getData();

				this.#addLoadedIds([file.serverFileId]);

				this.emit('onFileAdd');
			},
			'Item:onComplete': (event: BaseEvent) => {
				const { item: file } = event.getData();

				this.#addLoadedObjectsIds([file]);

				const fileIds = new Set(this.#entityFileIds);
				if (!this.#getIdsByObjectId(file.customData.objectId).some((id: FileId) => fileIds.has(id)))
				{
					this.#updateEntity({
						fileIds: [...fileIds, file.serverFileId],
					});
				}

				this.emit('onFileComplete', file);
			},
			'Item:onRemove': (event: BaseEvent) => {
				const { item: file } = event.getData();

				const idsToRemove = new Set(this.#getIdsByObjectId(file.customData.objectId));
				this.#removeLoadedObjectsIds(idsToRemove);

				this.#updateEntity({
					fileIds: this.#entityFileIds.filter((id: FileId) => !idsToRemove.has(id)),
				});
			},
		});
	}

	setEntityId(entityId: number | string, entityType: EntityType = EntityTypes.Task): void
	{
		this.#entityId = entityId;
		this.#entityType = entityType;
	}

	getEntityId(): string
	{
		return getServiceKey(this.#entityId, this.#entityType);
	}

	getAdapter(): VueUploaderAdapter
	{
		return this.#adapter;
	}

	getFiles(): UploaderFileInfo[]
	{
		return this.#adapter.getReactiveItems();
	}

	isUploading(): boolean
	{
		return this.#adapter.getItems().some(({ status }) => [
			FileStatus.UPLOADING,
			FileStatus.LOADING,
		].includes(status));
	}

	browse(params: BrowseParams): void
	{
		this.#menu ??= new UserFieldMenu({
			dialogId: 'task-card',
			uploader: this.#adapter.getUploader(),
			menuOptions: {
				minWidth: 220,
				animation: 'fading',
				closeByEsc: true,
				bindOptions: {
					forceBindPosition: true,
					forceTop: true,
					position: 'top',
				},
				events: {
					onPopupClose: () => {
						params.onHideCallback?.();
					},
				},
			},
			compact: true,
		});

		this.#menu.show(params.bindElement);
	}

	#browseElement: HTMLElement;

	browseFiles(): void
	{
		if (!this.#browseElement)
		{
			this.#browseElement = document.createElement('div');
			this.#adapter.getUploader().assignBrowse(this.#browseElement);
		}

		this.#browseElement.click();
	}

	browseMyDrive(): void
	{
		openDiskFileDialog({
			dialogId: 'task-card',
			uploader: this.#adapter.getUploader(),
		});
	}

	destroy(): void
	{
		this.#adapter.unsubscribeAll('Item:onAdd');
		this.#adapter.unsubscribeAll('Item:onComplete');
		this.#adapter.unsubscribeAll('Item:onRemove');
		this.#adapter.getUploader().destroy();
	}

	async uploadFromClipboard(params: { clipboardEvent: ClipboardEvent }): Promise<UploaderFile[]>
	{
		const { clipboardEvent } = params;

		const { clipboardData } = clipboardEvent;

		if (!clipboardData || !isFilePasted(clipboardData))
		{
			return [];
		}

		clipboardEvent.preventDefault();

		const files: File[] = await getFilesFromDataTransfer(clipboardData);

		return this.#addFiles(files);
	}

	#addFiles(files: ArrayLike): UploaderFile[]
	{
		const uploader = this.#adapter.getUploader();

		return uploader.addFiles(files);
	}

	async sync(ids: FileId[]): Promise<void>
	{
		if (ids.every((id: FileId) => this.#loadedIds.has(id)))
		{
			this.#adapter.getItems().forEach((file) => {
				const uploaderIds = [file.serverFileId];
				if (file.serverFileId[0] === 'n')
				{
					const objectId = Number(file.serverFileId.slice(1));

					uploaderIds.push(...this.#getIdsByObjectId(objectId));
				}

				if (uploaderIds.some((id: FileId) => ids.includes(id)))
				{
					return;
				}

				this.#adapter.getUploader().removeFile(file.id);
			});
		}

		await this.list(ids);
	}

	async list(ids: FileId[]): Promise<UploaderFileInfo[]>
	{
		const unloadedIds = ids.filter((id) => id[0] !== 'n' && !this.#loadedIds.has(id));
		if (unloadedIds.length === 0)
		{
			await Promise.all(this.#promises);

			return this.#adapter.getItems();
		}

		const promise = new Resolvable();
		this.#promises.push(promise);
		this.#addLoadedIds(unloadedIds);

		try
		{
			const data = await apiClient.post('File.list', { ids: unloadedIds });

			const files = data.map((fileDto: FileDto) => mapDtoToModel(fileDto));

			const objectsIds = new Set(Object.values(this.#objectsIds));
			const newFiles = files.filter(({ customData }) => !objectsIds.has(customData.objectId));
			this.#adapter.getUploader().addFiles(newFiles);
			this.#addLoadedObjectsIds(files);

			promise.resolve();

			await Promise.all(this.#promises);

			return this.#adapter.getItems();
		}
		catch (error)
		{
			console.error('FileService: list error', error);

			return [];
		}
	}

	#addLoadedIds(ids: FileId[]): void
	{
		ids.forEach((id: FileId): void => this.#loadedIds.add(id));
	}

	#addLoadedObjectsIds(files: UploaderFileInfo[]): void
	{
		files.forEach((file: UploaderFileInfo) => {
			this.#objectsIds[file.serverFileId] = file.customData.objectId;
		});
	}

	#removeLoadedObjectsIds(ids: FileId[]): void
	{
		ids.forEach((id: FileId) => {
			delete this.#objectsIds[id];
		});
	}

	#getIdsByObjectId(objectIdToFind: number): FileId[]
	{
		return Object.entries(this.#objectsIds)
			.filter(([, objectId]): boolean => objectId === objectIdToFind)
			.map(([id]): FileId => (id[0] === 'n' ? id : Number(id)))
		;
	}

	#updateEntity(data: { fileIds: FileId[] }): void
	{
		if (this.#entityType === EntityTypes.Task)
		{
			void taskService.update(this.#entityId, data);
		}
		else if (this.#entityType === EntityTypes.CheckListItem)
		{
			const attachments = processCheckListFileIds(data.fileIds);

			void this.$store.dispatch(`${Model.CheckList}/update`, {
				id: this.#entityId,
				fields: { attachments },
			});
		}
	}

	get #entityFileIds(): []
	{
		if (this.#entityType === EntityTypes.Task)
		{
			return this.$store.getters[`${Model.Tasks}/getById`](this.#entityId).fileIds;
		}

		return this.$store.getters[`${Model.CheckList}/getById`](this.#entityId).attachments;
	}

	get $store(): Store
	{
		return Core.getStore();
	}
}

const services: { [key: string]: FileService } = {};

function getServiceKey(entityId: number, entityType: EntityType): string
{
	return `${entityType}:${entityId}`;
}

export const fileService = {
	get(entityId: number, entityType: EntityType = EntityTypes.Task): FileService
	{
		const key = getServiceKey(entityId, entityType);
		services[key] ??= new FileService(entityId, entityType);

		return services[key];
	},
	replace(tempId: number, entityId: number, entityType: EntityType = EntityTypes.Task): void
	{
		const oldKey = getServiceKey(tempId, entityType);
		const newKey = getServiceKey(entityId, entityType);

		services[newKey] = services[oldKey];
		services[newKey].setEntityId(entityId, entityType);

		delete services[oldKey];
	},
	delete(entityId: number, entityType: EntityType = EntityTypes.Task): void
	{
		const key = getServiceKey(entityId, entityType);

		services[key]?.destroy();

		delete services[key];
	},
};

function Resolvable(): Promise
{
	const promise = new Promise((resolve) => {
		this.resolve = resolve;
	});

	promise.resolve = this.resolve;

	return promise;
}

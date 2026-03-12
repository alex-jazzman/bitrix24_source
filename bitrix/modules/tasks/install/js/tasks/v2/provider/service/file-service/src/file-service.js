import { Runtime, Type, Loc, Text, Event } from 'main.core';
import { EventEmitter, type BaseEvent } from 'main.core.events';

import { FileStatus, type UploaderFileInfo } from 'ui.uploader.core';
import { VueUploaderAdapter } from 'ui.uploader.vue';
import { VueRefValue } from 'ui.vue3';
import { Notifier } from 'ui.notification-manager';
import type { Store } from 'ui.vue3.vuex';

import { Core } from 'tasks.v2.core';
import { Model, Endpoint } from 'tasks.v2.const';
import { apiClient } from 'tasks.v2.lib.api-client';
import { idUtils } from 'tasks.v2.lib.id-utils';
import { taskService } from 'tasks.v2.provider.service.task-service';

import { mapDtoToModel } from './mappers';
import { processCheckListFileIds } from './util';
import type { FileId, FileDto } from './types';

export type BrowseParams = {
	bindElement: HTMLElement,
	onShowCallback?: Function,
	onHideCallback?: Function,
	compact: boolean,
};

export const EntityTypes = Object.freeze({
	Task: 'task',
	CheckListItem: 'checkListItem',
	Result: 'result',
});

export type EntityType = $Values<typeof EntityTypes>;

export class FileService extends EventEmitter
{
	#entityId: number | string;
	#entityType: EntityType;
	#loadedIds: Set<FileId> = new Set();
	#objectsIds: { [id: FileId]: number } = {};
	#promises: Promise[] = [];
	#adapter: VueUploaderAdapter | null = null;
	#fileBrowserClosed: boolean = false;
	#filesToAttach: UploaderFileInfo[] = [];
	#filesToDetach: UploaderFileInfo[] = [];
	#isDetachedErrorMode: boolean = false;
	#browseElement: HTMLElement;
	#saveAttachedFilesDebounced: Function;
	#saveDetachedFilesDebounced: Function;

	constructor(entityId: number | string, entityType: EntityType = EntityTypes.Task)
	{
		super();

		this.setEventNamespace('Tasks.V2.Provider.Service.FileService');
		this.setEntityId(entityId, entityType);
		this.initAdapter(entityId, entityType);
		this.#bindEvents();

		this.#saveAttachedFilesDebounced = Runtime.debounce(this.#saveAttachedFiles, 3000, this);
		this.#saveDetachedFilesDebounced = Runtime.debounce(this.#saveDetachedFiles, 3000, this);
	}

	initAdapter(entityId: number | string, entityType: EntityType): void
	{
		this.#adapter = new VueUploaderAdapter({
			id: getKey(entityId, entityType),
			controller: Core.getParams().features.disk ? 'disk.uf.integration.diskUploaderController' : null,
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

				this.#addLoadedIds([file.serverFileId]);

				this.emit('onFileAdd');
			},
			'Item:onComplete': (event: BaseEvent) => {
				const { item: file } = event.getData();

				this.#addLoadedObjectsIds([file]);

				const fileIds = new Set(this.#entityFileIds);
				if (!this.#getIdsByObjectId(file.customData.objectId).some((id: FileId) => fileIds.has(id)))
				{
					this.#attachFiles([...fileIds, file.serverFileId], file);
					this.emit('onFileAttach', file);
				}

				this.emit('onFileComplete', file);
			},
			'Item:onRemove': (event: BaseEvent) => {
				const { item: file } = event.getData();

				const idsToRemove = new Set(this.#getIdsByObjectId(file.customData.objectId));
				this.#removeLoadedObjectsIds(idsToRemove);

				this.#detachFiles(this.#getEntityFileIds(idsToRemove), file);

				this.emit('onFileRemove', { file });
			},
		});
	}

	#bindEvents(): void
	{
		if (this.#entityType === EntityTypes.Task)
		{
			Event.bind(window, 'beforeunload', this.handleSave);
		}
	}

	#unbindEvents(): void
	{
		if (this.#entityType === EntityTypes.Task)
		{
			Event.unbind(window, 'beforeunload', this.handleSave);
		}
	}

	handleSave = async (): Promise<void> => {
		await this.#saveAttachedFiles();
		await this.#saveDetachedFiles();
	};

	setEntityId(entityId: number | string, entityType: EntityType = EntityTypes.Task): void
	{
		this.#entityId = entityId;
		this.#entityType = entityType;
	}

	getEntityId(): string
	{
		return this.#entityId;
	}

	getAdapter(): VueUploaderAdapter
	{
		return this.#adapter;
	}

	getFiles(): VueRefValue<UploaderFileInfo>
	{
		return this.#adapter.getReactiveItems();
	}

	getFileItems(): UploaderFileInfo[]
	{
		return this.#adapter.getItems();
	}

	isUploading(): boolean
	{
		return this.getFileItems().some(({ status }) => [
			FileStatus.UPLOADING,
			FileStatus.LOADING,
		].includes(status));
	}

	hasUploadingError(): boolean
	{
		return this.getFileItems().some(({ status }) => [
			FileStatus.UPLOAD_FAILED,
			FileStatus.LOAD_FAILED,
		].includes(status));
	}

	browse(params: BrowseParams): void
	{
		Runtime.loadExtension('disk.uploader.user-field-widget')
			.then(({ UserFieldMenu }) => {
				const menu = new UserFieldMenu({
					dialogId: 'task-card',
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
		Runtime.loadExtension('disk.uploader.user-field-widget')
			.then(({ openDiskFileDialog }) => {
				openDiskFileDialog({
					dialogId: 'task-card',
					uploader: this.#adapter.getUploader(),
				});
			})
			.catch((error) => console.error(error))
		;
	}

	setFileBrowserClosed(value: boolean): void
	{
		this.#fileBrowserClosed = value;
	}

	isFileBrowserClosed(): boolean
	{
		return this.#fileBrowserClosed;
	}

	resetFileBrowserClosedState(): void
	{
		this.#fileBrowserClosed = false;
	}

	destroy(): void
	{
		this.#adapter.unsubscribeAll('Item:onAdd');
		this.#adapter.unsubscribeAll('Item:onComplete');
		this.#adapter.unsubscribeAll('Item:onRemove');
		this.#adapter.getUploader().destroy();

		this.#unbindEvents();
	}

	async list(ids: FileId[]): Promise<UploaderFileInfo[]>
	{
		if (!Type.isArrayFilled(ids))
		{
			return [];
		}

		const unloadedIds = ids.filter((id) => !this.#loadedIds.has(id));
		if (unloadedIds.length === 0)
		{
			await Promise.all(this.#promises);

			return this.getFileItems();
		}

		const promise = new Resolvable();
		this.#promises.push(promise);
		this.#addLoadedIds(unloadedIds);

		try
		{
			const data = await apiClient.post(Endpoint.FileListObjects, {
				ids: unloadedIds,
			});

			this.#handleLoadedFiles(data);

			promise.resolve();

			await Promise.all(this.#promises);

			return this.getFileItems();
		}
		catch (error)
		{
			console.error(Endpoint.FileListObjects, error);

			return [];
		}
	}

	remove(idsToRemove: FileId[]): void
	{
		const uploaderFiles = this.getFileItems().map(({ id, serverFileId }) => ({ id, serverFileId }));

		uploaderFiles.forEach((file) => {
			const fileIds = new Set([file.serverFileId]);
			if (this.#isObjectId(file.serverFileId))
			{
				const objectId = Number(file.serverFileId.slice(1));

				this.#getIdsByObjectId(objectId).forEach((id: FileId) => fileIds.add(id));
			}

			if ([...fileIds].some((id: FileId) => idsToRemove.includes(id)))
			{
				this.#adapter.getUploader().removeFile(file.id);
			}
		});
	}

	loadFilesFromData(data: FileDto[]): void
	{
		const ids = data.map((fileDto: FileDto) => fileDto.id);

		this.#addLoadedIds(ids);

		this.#handleLoadedFiles(data);
	}

	hasPendingRequests(): boolean
	{
		return this.#filesToAttach.length > 0 || this.#filesToDetach.length > 0;
	}

	#handleLoadedFiles(data: FileDto[]): void
	{
		const files = data.map((fileDto: FileDto) => mapDtoToModel(fileDto));

		const objectsIds = new Set(Object.values(this.#objectsIds));
		const newFiles = files.filter(({ customData }) => !objectsIds.has(customData.objectId));
		this.#adapter.getUploader().addFiles(newFiles);
		this.#addLoadedObjectsIds(files);
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
			.map(([id]): FileId => (this.#isObjectId(id) ? id : Number(id)))
		;
	}

	#attachFiles(fileIds: FileId[], attachedFile: UploaderFileInfo): void
	{
		switch (this.#entityType)
		{
			case EntityTypes.Task:
			{
				const id = this.#entityId;

				void taskService.updateStoreTask(id, { fileIds });

				if (this.#isDetachedErrorMode)
				{
					return;
				}

				if (idUtils.isReal(id) && this.#isObjectId(attachedFile.serverFileId))
				{
					this.#filesToAttach.push(attachedFile);
					this.#saveAttachedFilesDebounced();
				}

				break;
			}

			case EntityTypes.CheckListItem:
			{
				this.#processCheckListFileIds(fileIds);

				break;
			}

			case EntityTypes.Result:
			{
				void this.$store.dispatch(`${Model.Results}/update`, {
					id: this.#entityId,
					fields: { fileIds },
				});

				break;
			}

			default:
				break;
		}
	}

	#detachFiles(fileIds: FileId[], detachedFile: UploaderFileInfo): void
	{
		switch (this.#entityType)
		{
			case EntityTypes.Task:
			{
				const id = this.#entityId;

				void taskService.updateStoreTask(id, { fileIds });

				if (idUtils.isReal(id))
				{
					const detachedId = detachedFile.serverFileId;
					const attachedIndex = this.#filesToAttach.findIndex((file) => file.serverFileId === detachedId);
					if (attachedIndex === -1)
					{
						this.#filesToDetach.push(detachedFile);
						this.#saveDetachedFilesDebounced();
					}
					else
					{
						this.#filesToAttach.splice(attachedIndex, 1);
					}
				}

				break;
			}

			case EntityTypes.CheckListItem:
			{
				this.#processCheckListFileIds(fileIds);

				break;
			}

			case EntityTypes.Result:
			{
				void this.$store.dispatch(`${Model.Results}/update`, {
					id: this.#entityId,
					fields: { fileIds },
				});

				break;
			}

			default:
				break;
		}
	}

	#getEntityFileIds(excludedIds: Set<FileId> = new Set()): []
	{
		if (this.#entityType === EntityTypes.Task || this.#entityType === EntityTypes.Result)
		{
			return this.#entityFileIds.filter((id: FileId) => !excludedIds.has(id));
		}

		if (this.#entityType === EntityTypes.CheckListItem)
		{
			return this.#entityFileIds.filter((attach) => !excludedIds.has(attach.id));
		}

		return [];
	}

	#processCheckListFileIds(fileIds: FileId[]): void
	{
		const attachments = processCheckListFileIds(fileIds);

		void this.$store.dispatch(`${Model.CheckList}/update`, {
			id: this.#entityId,
			fields: { attachments },
		});
	}

	#isObjectId(id: number | string): boolean
	{
		return String(id).startsWith('n');
	}

	async #saveAttachedFiles(): void
	{
		if (!Type.isArrayFilled(this.#filesToAttach))
		{
			return;
		}

		const id = idUtils.unbox(this.#entityId);

		try
		{
			const ids = this.#filesToAttach.map((file) => file.serverFileId);
			this.#filesToAttach = [];

			if (idUtils.isTemplate(this.#entityId))
			{
				await apiClient.post(Endpoint.TemplateUpdate, { template: { id, fileIds: this.#entityFileIds } });
			}
			else
			{
				await apiClient.post(Endpoint.FileAttach, { task: { id }, ids });
			}
		}
		catch (error)
		{
			console.error('FileService: saveAttachedFiles error', error);

			this.notifyError(Loc.getMessage('TASKS_V2_NOTIFY_FILE_ATTACH_ERROR'));
		}
	}

	async #saveDetachedFiles(): void
	{
		if (!Type.isArrayFilled(this.#filesToDetach))
		{
			return;
		}

		const id = idUtils.unbox(this.#entityId);
		const filesBeforeDetach = this.#filesToDetach;

		try
		{
			const ids = this.#filesToDetach.map((file) => file.serverFileId);
			this.#filesToDetach = [];

			if (idUtils.isTemplate(this.#entityId))
			{
				await apiClient.post(Endpoint.TemplateUpdate, { template: { id, fileIds: this.#entityFileIds } });
			}
			else
			{
				await apiClient.post(Endpoint.FileDetach, { task: { id }, ids });
			}
		}
		catch (error)
		{
			console.error('FileService: saveDetachedFiles error', error);

			this.#isDetachedErrorMode = true;

			this.#adapter.getUploader().addFiles(filesBeforeDetach);

			this.#isDetachedErrorMode = false;

			this.notifyError(Loc.getMessage('TASKS_V2_NOTIFY_FILE_DETACH_ERROR'));
		}
	}

	notifyError(text: string): void
	{
		Notifier.notifyViaBrowserProvider({
			id: `file-service-error-${Text.getRandom()}`,
			text,
		});
	}

	get #entityFileIds(): []
	{
		if (this.#entityType === EntityTypes.Task)
		{
			return taskService.getStoreTask(this.#entityId).fileIds;
		}

		if (this.#entityType === EntityTypes.Result)
		{
			return this.$store.getters[`${Model.Results}/getById`](this.#entityId).fileIds;
		}

		return this.$store.getters[`${Model.CheckList}/getById`](this.#entityId).attachments;
	}

	get $store(): Store
	{
		return Core.getStore();
	}
}

const services: { [key: string]: FileService } = {};

const getKey = (entityId: number, entityType: EntityType): string => `${entityType}:${entityId}`;

export const fileService = {
	get(entityId: number, entityType: EntityType = EntityTypes.Task): FileService
	{
		const key = getKey(entityId, entityType);
		services[key] ??= new FileService(entityId, entityType);

		return services[key];
	},
	replace(tempId: number, entityId: number, entityType: EntityType = EntityTypes.Task): void
	{
		const oldKey = getKey(tempId, entityType);
		const newKey = getKey(entityId, entityType);

		services[newKey] = services[oldKey];
		services[newKey].setEntityId(entityId, entityType);

		delete services[oldKey];
	},
	delete(entityId: number, entityType: EntityType = EntityTypes.Task): void
	{
		const key = getKey(entityId, entityType);

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

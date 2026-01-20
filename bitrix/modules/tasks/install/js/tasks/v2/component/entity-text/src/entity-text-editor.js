import { Runtime, Type, Loc, Event } from 'main.core';
import { BaseEvent, EventEmitter } from 'main.core.events';

import { toRaw } from 'ui.vue3';
import { FileEvent, getFilesFromDataTransfer, isFilePasted } from 'ui.uploader.core';
import { COMMAND_PRIORITY_NORMAL, PASTE_COMMAND } from 'ui.lexical.core';
import { TextEditor, Plugins, type TextEditorOptions } from 'ui.text-editor';
import type { UploaderFile, UploaderFileInfo } from 'ui.uploader.core';
import type { VueUploaderAdapter } from 'ui.uploader.vue';
import type { Store } from 'ui.vue3.vuex';

import { Core } from 'tasks.v2.core';
import { EntitySelectorEntity } from 'tasks.v2.const';
import { fileService, type FileService } from 'tasks.v2.provider.service.file-service';

import { DefaultEditorOptions } from './default-editor-options';

export const EntityTextTypes = Object.freeze({
	Task: 'task',
	Result: 'result',
});

export type EntityTextType = $Values<typeof EntityTextTypes>;

export type EntityTextEditorOptions = {
	content?: string | null,
	blockSpaceInline?: string | number,
};

export class EntityTextEditor extends EventEmitter
{
	#editor: TextEditor;
	#fileService: FileService;
	#uploaderAdapter: VueUploaderAdapter;
	#syncHighlightsDebounced: Function;
	#entityId: number | string;
	#entityType: EntityTextType;

	constructor(
		entityId: number | string,
		entityType: EntityTextType = EntityTextTypes.Task,
		options: EntityTextEditorOptions = {},
	)
	{
		super();

		this.setEventNamespace('Tasks.V2.Component.Entity-Text-Editor');

		this.setEntityId(entityId, entityType);
		this.initService(entityId, entityType);
		this.initEditor(options);
		this.#subscribeToEvents();
		this.#registerCommands();

		this.#syncHighlightsDebounced = Runtime.debounce(this.#syncHighlights, 500, this);

		this.isTabHidden = false;
	}

	setEntityId(entityId: number | string, entityType: EntityTextType): void
	{
		this.#entityId = entityId;
		this.#entityType = entityType;
	}

	getEditor(): TextEditor
	{
		return this.#editor;
	}

	getEntityId(): number | string
	{
		return this.#entityId;
	}

	getEntityType(): string
	{
		return this.#entityType;
	}

	initService(entityId: number | string, entityType: EntityTextType): void
	{
		this.#fileService = fileService.get(entityId, entityType);
		this.#uploaderAdapter = this.#fileService.getAdapter();
	}

	initEditor(options: EntityTextEditorOptions): void
	{
		const content = options.content ?? null;
		const restrictions = Core.getParams().restrictions;

		const additionalEditorOptions: TextEditorOptions = {
			content,
			minHeight: 118,
			placeholder: Loc.getMessage('TASKS_V2_CHANGE_DESCRIPTION'),
			newLineMode: 'paragraph',
			events: {
				onChange: this.handleEditorChange,
				onBlur: this.handleEditorBlur,
			},
			file: {
				mode: Core.getParams().features.disk ? 'disk' : 'file',
				files: this.getFiles(),
			},
			visualOptions: {
				borderWidth: 0,
				blockSpaceInline: options?.blockSpaceInline ?? 'var(--ui-space-stack-md2)',
				colorBackground: 'transparent',
			},
			mention: {
				dialogOptions: {
					width: 565,
					entities: [
						{
							id: EntitySelectorEntity.User,
							options: {
								emailUsers: true,
								inviteGuestLink: true,
								lockGuestLink: !restrictions.mailUserIntegration.available,
								lockGuestLinkFeatureId: restrictions.mailUserIntegration.featureId,
							},
						},
						{
							id: EntitySelectorEntity.Department,
						},
					],
				},
			},
			removePlugins: [],
			copilot: this.#getCopilotParams(),
		};

		this.#editor = new TextEditor({ ...DefaultEditorOptions, ...additionalEditorOptions });
	}

	setEditorText(content): void
	{
		this.#editor.setText(content);
	}

	getFiles(): UploaderFileInfo[]
	{
		return this.#uploaderAdapter.getItems();
	}

	destroy(): void
	{
		this.#unsubscribeToEvents();
		this.#editor?.destroy();
		this.#editor = null;
	}

	#subscribeToEvents(): void
	{
		this.#fileService.subscribe('onFileComplete', this.onFileComplete);
		this.#fileService.subscribe('onFileRemove', this.onFileRemove);

		Event.bind(document, 'visibilitychange', this.onVisibilityChange);
	}

	#unsubscribeToEvents(): void
	{
		this.#fileService.unsubscribe('onFileComplete', this.onFileComplete);
		this.#fileService.unsubscribe('onFileRemove', this.onFileRemove);

		Event.unbind(document, 'visibilitychange', this.onVisibilityChange);
	}

	#registerCommands(): void
	{
		this.#editor.registerCommand(
			PASTE_COMMAND,
			(clipboardEvent: ClipboardEvent) => {
				const clipboardData: DataTransfer = clipboardEvent.clipboardData;
				if (!clipboardData || !isFilePasted(clipboardData))
				{
					return false;
				}

				clipboardEvent.preventDefault();

				getFilesFromDataTransfer(clipboardData)
					.then((files: File[]): void => {
						files.forEach((file: File): void => {
							this.#uploaderAdapter.getUploader().addFile(file, {
								events: {
									[FileEvent.LOAD_ERROR]: () => {},
									[FileEvent.UPLOAD_ERROR]: () => {},
									[FileEvent.UPLOAD_COMPLETE]: (event: BaseEvent): void => {
										const uploaderFile: UploaderFile = event.getTarget();
										this.insertFile(uploaderFile.toJSON());
									},
								},
							});
						});
					})
					.catch((): void => {
						console.error('clipboard pasting error');
					});

				return true;
			},
			COMMAND_PRIORITY_NORMAL,
		);
	}

	#syncHighlights(): void
	{
		if (!this.#editor)
		{
			return;
		}

		this.#editor.dispatchCommand(Plugins.File.GET_INSERTED_FILES_COMMAND, (nodes) => {
			const inserted: Set<number | string> = new Set();
			for (const node of nodes)
			{
				const { serverFileId } = node.getInfo();
				if (Type.isStringFilled(serverFileId) || Type.isNumber(serverFileId))
				{
					inserted.add(serverFileId);
				}
			}

			this.#uploaderAdapter.getUploader().getFiles().forEach((file: UploaderFile) => {
				if (inserted.has(file.getServerFileId()))
				{
					file.setCustomData('tileSelected', true);
					inserted.delete(file.getServerFileId());
				}
				else
				{
					file.setCustomData('tileSelected', false);
				}
			});

			for (const serverFileId: number | string of inserted)
			{
				this.handleRemoveFile(serverFileId);
			}
		});
	}

	#getCopilotParams(): Object
	{
		if (Core.getParams().features.isCopilotEnabled)
		{
			switch (this.#entityType)
			{
				case EntityTextTypes.Task:
					return {
						copilotOptions: {
							moduleId: 'tasks',
							category: 'tasks',
							contextId: `tasks_${this.#entityId}`,
							menuForceTop: false,
						},
						triggerBySpace: true,
					};
				case EntityTextTypes.Result:
					return {
						copilotOptions: {
							moduleId: 'tasks',
							category: 'system',
							contextId: `tasks_result_${this.#entityId}`,
							menuForceTop: false,
						},
						triggerBySpace: true,
					};
				default:
					return {};
			}
		}

		return {};
	}

	handleEditorChange = (): void => {
		this.#syncHighlightsDebounced();
		this.emit('editorChanged');
	};

	handleEditorBlur = (): void => {
		if (this.isTabHidden)
		{
			return;
		}

		this.emit('editorBlurred');
	};

	onFileComplete = (event: BaseEvent): void => {
		const file = event.getData();
		this.#editor.dispatchCommand(Plugins.File.ADD_FILE_COMMAND, file);
	};

	onFileRemove = (event: BaseEvent): void => {
		const { file } = event.getData();
		this.handleRemoveFile(file.serverFileId);
	};

	onVisibilityChange = (): void => {
		this.isTabHidden = document.hidden;
	};

	handleRemoveFile(serverFileId): void
	{
		this.#editor.dispatchCommand(Plugins.File.REMOVE_FILE_COMMAND, {
			serverFileId,
			skipHistoryStack: true,
		});

		this.#syncHighlightsDebounced();
	}

	insertFile(fileInfo): void
	{
		this.#editor.dispatchCommand(Plugins.File.INSERT_FILE_COMMAND, {
			serverFileId: fileInfo.serverFileId,
			width: 600,
			height: 600,
			info: toRaw(fileInfo),
		});
	}

	get $store(): Store
	{
		return Core.getStore();
	}
}

const instances = {};

function getKey(entityId: number | string, entityType: string): string
{
	return `${entityType}:${entityId}`;
}

export const entityTextEditor = {
	get(
		entityId: number | string,
		entityType: EntityTextType = EntityTextTypes.Task,
		options: EntityTextEditorOptions = {},
	): EntityTextEditor
	{
		const key = getKey(entityId, entityType);
		instances[key] ??= new EntityTextEditor(entityId, entityType, options);

		if (Type.isStringFilled(options?.content))
		{
			instances[key].setEditorText(options.content);
		}

		return instances[key];
	},
	replace(
		tempId: number | string,
		entityId: number,
		entityType: EntityTextType = EntityTextTypes.Task,
	): void
	{
		const oldKey = getKey(tempId, entityType);
		const newKey = getKey(entityId, entityType);

		instances[newKey] = instances[oldKey];
		instances[newKey]?.setEntityId(entityId, entityType);
		instances[newKey]?.initService(entityId, entityType);

		delete instances[oldKey];
	},
	delete(
		entityId: number | string,
		entityType: EntityTextType = EntityTextTypes.Task,
	): void
	{
		const key = getKey(entityId, entityType);

		instances[key]?.destroy();

		delete instances[key];
	},
};

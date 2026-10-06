import { ref, toRaw, computed } from 'ui.vue3';
import { TextEditor, Plugins, TextEditorComponent, BasicEditor } from 'ui.text-editor';
import { Type } from 'main.core';
import { EventEmitter, type BaseEvent } from 'main.core.events';
import { FileService, fileServices } from './file-service';
import { AirButtonStyle, Button } from 'ui.buttons';
import { Dialog } from 'ui.system.dialog';

import type { UploaderFile, UploaderFileInfo } from 'ui.uploader.core';
import type { VueUploaderAdapter } from 'ui.uploader.vue';

export class TextEditorService extends EventEmitter {
	#id: string;
	#editor: TextEditor | null = null;
	#isEdit: boolean = ref(false);
	#isShowSaveConfirm: boolean = ref(false);
	#saveConfirmResolvers: Promise | null = null;
	#isPendingSaveConfirm: boolean = true;
	#fileService = null;
	#uploaderAdapter: VueUploaderAdapter;

	constructor(id: string)
	{
		super();
		this.setEventNamespace('Bizprocdesigner.TextEditor');
		this.#id = id;
		this.initFileService(id);
		this.#initEditor();
		this.#subscribeToEvents();
	}

	static get EVENT_NAMES(): Record<string, string>
	{
		return {
			ON_SAVE: 'onSave',
			ON_ABORT: 'onAbort',
			ON_EDIT: 'onEdit',
			ON_CHANGE_EDITOR: 'onChangeEditor',
			ON_BLUR_EDITOR: 'onBlurEditor',
		};
	}

	get isEdit(): boolean
	{
		return this.#isEdit;
	}

	get isShowSaveConfirm(): boolean
	{
		return this.#isShowSaveConfirm;
	}

	initFileService(id: string): void
	{
		this.#fileService = fileServices.get(id);
		this.#uploaderAdapter = this.#fileService.getAdapter();
	}

	#subscribeToEvents(): void
	{
		this.#fileService.subscribe(
			FileService.EVENT_NAMES.ON_FILE_COMPLETE,
			(event: BaseEvent) => this.onFileComplete(event),
		);
		this.#fileService.subscribe(
			FileService.EVENT_NAMES.ON_FILE_REMOVE,
			(event: BaseEvent) => this.onFileRemove(event),
		);
	}

	#unsubscribeToEvents(): void
	{
		this.#fileService.unsubscribeAll(FileService.EVENT_NAMES.ON_FILE_COMPLETE);
		this.#fileService.unsubscribeAll(FileService.EVENT_NAMES.ON_FILE_REMOVE);
	}

	#initEditor(): void
	{
		this.#editor = new TextEditor({
			...BasicEditor.getDefaultOptions(),
			visualOptions: {
				borderRadius: '0px',
				borderWidth: 0,
			},
			newLineMode: 'paragraph',
			file: {
				mode: 'disk',
				files: this.getFiles(),
			},
			events: {
				onChange: () => this.#handleEditorChange(),
				onBlur: () => this.#handleEditorBlur(),
			},
			plugins: [
				...new Set([
					...BasicEditor.getDefaultOptions().plugins,
					'Quote',
					'Code',
					'Image',
				]),
			],
			removePlugins: [],
			toolbar: [
				'bold', 'italic', 'underline', 'strikethrough', '|',
				'numbered-list', 'bulleted-list', '|',
				'link', '|',
				'quote', 'code', 'image'
			],
		});
	}

	#handleEditorChange(): void
	{
		this.emit(
			TextEditorService.EVENT_NAMES.ON_CHANGE_EDITOR,
			this.#editor.getText(),
		);
	}

	#handleEditorBlur(): void
	{
		this.emit(
			TextEditorService.EVENT_NAMES.ON_BLUR_EDITOR
		);
	}

	getEditor(): TextEditor
	{
		return this.#editor;
	}

	setText(text: string)
	{
		this.#editor.setText(text);
	}

	onFocus(): void
	{
		this.#editor.focus(null, { defaultSelection: 'rootEnd' });
	}

	onEdit(text: string | undefined): void
	{
		setTimeout(() => this.onFocus(), 100);

		if (Type.isString(text))
		{
			this.setText(text);
		}

		this.#isEdit.value = true;

		this.emit(
			TextEditorService.EVENT_NAMES.ON_EDIT,
		);
	}

	onSave(): void
	{
		this.#isEdit.value = false;
		this.emit(
			TextEditorService.EVENT_NAMES.ON_SAVE,
			this.#editor.getText(),
		);
	}

	onAbort(): void
	{
		this.#isEdit.value = false;
		this.emit(TextEditorService.EVENT_NAMES.ON_ABORT);
	}

	insertFile(fileInfo: UploaderFileInfo): void
	{
		this.#editor.dispatchCommand(Plugins.File.INSERT_FILE_COMMAND, {
			serverFileId: fileInfo.serverFileId,
			width: 600,
			height: 600,
			info: toRaw(fileInfo),
		});
	}

	getFiles(): UploaderFileInfo[]
	{
		return this.#uploaderAdapter.getItems();
	}

	onFileComplete(event: BaseEvent): void
	{
		const file = event.getData();
		this.#editor.dispatchCommand(Plugins.File.ADD_FILE_COMMAND, file);
	}

	onFileRemove(event: BaseEvent): void
	{
		const { file } = event.getData();
		this.#editor.dispatchCommand(Plugins.File.REMOVE_FILE_COMMAND, {
			serverFileId: file.serverFileId,
			skipHistoryStack: true,
		});
	}

	#createSaveConfirmResolvers(): void
	{
		this.#isPendingSaveConfirm = true;

		let resolve = null;
		let reject = null;
		let promise = new Promise((res, rej) => {
			resolve = res;
			reject = rej;
		});

		this.#saveConfirmResolvers = {
			promise,
			resolve,
			reject,
		};

		this.#saveConfirmResolvers.promise
			.finally(() => {
				this.#isPendingSaveConfirm = false;
			});
	}

	onShowConfirmSave(): Promise<void>
	{
		this.#createSaveConfirmResolvers();
		this.#isShowSaveConfirm.value = true;

		return this.#saveConfirmResolvers.promise;
	}

	onHideConfirmSave(): void
	{
		this.#isShowSaveConfirm.value = false;
	}

	onCloseConfirm(): void
	{
		if (this.#isPendingSaveConfirm)
		{
			this.#saveConfirmResolvers.reject();
		}

		this.#isShowSaveConfirm.value = false;
		this.#saveConfirmResolvers = null;
	}

	onSaveConfirm(): void
	{
		this.onSave();
		this.#saveConfirmResolvers.resolve();
	}

	onAbortConfirm(): void
	{
		this.onAbort();
		this.#saveConfirmResolvers.resolve();
	}

	destroy(): void
	{
		this.#unsubscribeToEvents();
		this.unsubscribeAll(TextEditorService.EVENT_NAMES.ON_SAVE);
		this.unsubscribeAll(TextEditorService.EVENT_NAMES.ON_ABORT);
		this.unsubscribeAll(TextEditorService.EVENT_NAMES.ON_EDIT);
		this.unsubscribeAll(TextEditorService.EVENT_NAMES.ON_CHANGE_EDITOR);
		this.unsubscribeAll(TextEditorService.EVENT_NAMES.ON_BLUR_EDITOR);
		this.#editor?.destroy();
	}
}

const textEitorServicesMap = {};

export const textEditorServices = {
	get(id): TextEditorService
	{
		textEitorServicesMap[id] ??= new TextEditorService(id);

		return textEitorServicesMap[id];
	},
	delete(id): void
	{
		textEitorServicesMap[id]?.destroy();
		delete textEitorServicesMap[id];
	},
};

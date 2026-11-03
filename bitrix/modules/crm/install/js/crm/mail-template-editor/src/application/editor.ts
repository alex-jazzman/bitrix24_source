import { Dom, Event, Loc, Page, Type } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { SidePanel, type Slider } from 'main.sidepanel';
import { BitrixVue, markRaw, nextTick, type App as VueApp } from 'ui.vue3';

import { HtmlEditorAdapter, HtmlEditorErrorCode } from '../adapter/html-editor';
import {
	createEditorStore,
	type EditorAccessItem,
	type EditorError,
	type EditorFields,
	type EditorInitialData,
	type EditorStore,
} from '../model/editor-store';
import { editorService, type EditorSaveData } from '../service/editor-service';
import { App, type EditorAppInstance } from './app';

export type EditorOptions = {
	containerId: string;
	editorContainerId: string;
	formId: string;
	editorId: string;
	initialData: EditorInitialData;
};

export class Editor
{
	#options: EditorOptions;
	#templateId: number;
	#store: EditorStore;
	#adapter: HtmlEditorAdapter;
	#application: VueApp | null = null;
	#component: EditorAppInstance | null = null;
	#form: HTMLFormElement | null = null;
	#slider: Slider | null = null;
	#initializationError: HTMLElement | null = null;
	#started: boolean = false;
	#destroyed: boolean = false;
	#closing: boolean = false;
	#saved: boolean = false;
	#failed: boolean = false;

	constructor(options: EditorOptions)
	{
		this.#options = { ...options };
		this.#templateId = options.initialData.id;
		this.#store = createEditorStore(options.initialData);
		this.#adapter = markRaw(new HtmlEditorAdapter({
			editorId: options.editorId,
			formId: options.formId,
			canEdit: this.#store.state.canEdit,
			files: options.initialData.files,
		}));
	}

	start(): void
	{
		if (this.#started || this.#destroyed)
		{
			return;
		}

		this.#started = true;
		Event.bind(window, 'pagehide', this.#handleDestroy);
		this.#slider = SidePanel.Instance.getSliderByWindow(window);
		if (this.#slider)
		{
			this.#slider.setCacheable(false);
			EventEmitter.subscribe(this.#slider, 'SidePanel.Slider:onCloseStart', this.#handleClosing);
			EventEmitter.subscribe(this.#slider, 'SidePanel.Slider:onDestroy', this.#handleDestroy);
		}

		const { containerId, editorContainerId, formId } = this.#options;
		const container = document.getElementById(containerId);
		const editorContainer = document.getElementById(editorContainerId);
		const form = document.getElementById(formId);
		if (form instanceof HTMLFormElement)
		{
			this.#form = form;
			Event.bind(form, 'submit', this.#handleSubmit);
		}

		if (
			!container || !editorContainer || !this.#form
			|| !this.#form.contains(container) || !this.#form.contains(editorContainer)
			|| container.contains(editorContainer) || editorContainer.contains(container)
		)
		{
			this.#handleMountError();

			return;
		}

		try
		{
			this.#application = BitrixVue.createApp(App, {
				store: this.#store,
				adapter: this.#adapter,
				editorContainerId,
				onReady: this.#handleEditorReady,
				onError: this.#handleEditorError,
				onSave: this.#handleSave,
				onCancel: this.#handleCancel,
			});
			this.#application.config.errorHandler = this.#handleMountError;
			this.#component = this.#application.mount(container) as unknown as EditorAppInstance;
		}
		catch
		{
			this.#handleMountError();
		}
	}

	destroy(): void
	{
		if (this.#destroyed)
		{
			return;
		}

		this.#destroyed = true;
		this.#store.setReady(false);
		Event.unbind(window, 'pagehide', this.#handleDestroy);
		if (this.#form)
		{
			Event.unbind(this.#form, 'submit', this.#handleSubmit);
			this.#form = null;
		}

		if (this.#slider)
		{
			EventEmitter.unsubscribe(this.#slider, 'SidePanel.Slider:onCloseStart', this.#handleClosing);
			EventEmitter.unsubscribe(this.#slider, 'SidePanel.Slider:onDestroy', this.#handleDestroy);
			this.#slider = null;
		}

		try
		{
			this.#application?.unmount();
		}
		finally
		{
			this.#application = null;
			this.#component = null;
			this.#adapter.destroy();
			Dom.remove(this.#initializationError);
			this.#initializationError = null;
		}
	}

	#handleSubmit = (event: SubmitEvent): void => {
		event.preventDefault();
		if (!this.#isDisposed())
		{
			this.#component?.handleSave();
		}
	};

	#handleSave = async (): Promise<void> => {
		if (this.#isDisposed() || this.#failed || this.#saved || !this.#store.canSave)
		{
			return;
		}

		this.#store.setBusy(true);
		this.#store.setErrors([]);
		let errors: EditorError[] = [];
		let saved: EditorSaveData | null = null;
		try
		{
			this.#component?.cancelPlaceholders();
			if (this.#store.state.title.trim() === '')
			{
				errors = [{
					code: 'TITLE_REQUIRED',
					field: 'title',
					message: Loc.getMessage('CRM_MAIL_TEMPLATE_EDITOR_TITLE_REQUIRED') ?? '',
				}];
			}
			else
			{
				const fields = this.#getSaveFields();
				if (this.#isDisposed())
				{
					return;
				}

				const result = await editorService.save(this.#templateId, fields);
				if (result.success)
				{
					saved = result.data;
				}
				else
				{
					errors = result.errors;
				}
			}
		}
		catch (error)
		{
			errors = [this.#getSnapshotError(error)];
		}
		finally
		{
			if (!this.#isDisposed())
			{
				this.#store.setBusy(false);
			}
		}

		if (this.#isDisposed())
		{
			return;
		}

		if (saved)
		{
			this.#handleSaved(saved);

			return;
		}

		this.#store.setErrors(errors);
		this.#component?.cancelPlaceholders();
		await nextTick();
		this.#focusSaveError();
	};

	#focusSaveError(): void
	{
		if (!this.#isDisposed() && !this.#saved && !this.#store.state.busy)
		{
			const error = this.#store.state.errors[0];
			if (error)
			{
				this.#component?.focusError(error);
			}
		}
	}

	#getSaveFields(): EditorFields
	{
		const snapshot = this.#adapter.getSnapshot();
		this.#store.syncSnapshot(snapshot);
		const state = this.#store.state;

		return {
			title: state.title,
			entityTypeId: state.entityTypeId,
			access: state.access.map(([entityId, id]): EditorAccessItem => [entityId, id]),
			isActive: state.isActive,
			emailFrom: state.emailFrom,
			subject: state.subject,
			bodyHtml: snapshot.bodyHtml,
			files: [...snapshot.files],
		};
	}

	#getSnapshotError(error: unknown): EditorError
	{
		const code = Type.isObject(error) && 'message' in error && Type.isString(error.message)
			? error.message
			: ''
		;
		if (code === HtmlEditorErrorCode.FilesFailed || code === HtmlEditorErrorCode.FilesPending)
		{
			const messageId = code === HtmlEditorErrorCode.FilesFailed
				? 'CRM_MAIL_TEMPLATE_EDITOR_FILES_UPLOAD_ERROR'
				: 'CRM_MAIL_TEMPLATE_EDITOR_SAVE_FILES_UPLOADING'
			;

			return { code, field: 'files', message: Loc.getMessage(messageId) ?? '' };
		}

		if (code === HtmlEditorErrorCode.Readonly)
		{
			return { code, message: Loc.getMessage('CRM_MAIL_TEMPLATE_EDITOR_SAVE_READONLY') ?? '' };
		}

		return {
			code: code === HtmlEditorErrorCode.NotReady ? code : 'EDITOR_SNAPSHOT_FAILED',
			field: 'bodyHtml',
			message: Loc.getMessage('CRM_MAIL_TEMPLATE_EDITOR_CONTENT_ERROR') ?? '',
		};
	}

	#handleSaved(data: EditorSaveData): void
	{
		this.#saved = true;
		this.#store.setReady(false);
		if (!this.#slider)
		{
			this.#close();

			return;
		}

		try
		{
			const topWindow = window.top as Window & { BX: { SidePanel: typeof SidePanel } };
			topWindow.BX.SidePanel.Instance.postMessage(window, 'CrmMailTemplateEdit:onSubmit', data);
		}
		finally
		{
			if (!this.#isDisposed())
			{
				this.#close();
			}
		}
	}

	#handleEditorReady = (): void => {
		if (!this.#isDisposed() && !this.#failed && !this.#saved)
		{
			this.#store.setReady(true);
		}
	};

	#handleEditorError = (): void => {
		if (!this.#isDisposed())
		{
			this.#failed = true;
			this.#store.setReady(false);
			this.#store.setErrors([{
				code: HtmlEditorErrorCode.InitializationFailed,
				message: Loc.getMessage('CRM_MAIL_TEMPLATE_EDITOR_INITIALIZATION_ERROR') ?? '',
			}]);
		}
	};

	#handleMountError = (): void => {
		if (this.#isDisposed())
		{
			return;
		}

		this.#failed = true;
		this.#store.setReady(false);
		if (!this.#initializationError)
		{
			this.#initializationError = Dom.create('div', {
				props: { className: 'crm-mail-template-editor__initialization-error --ui-context-content-light' },
				attrs: { role: 'alert' },
				text: Loc.getMessage('CRM_MAIL_TEMPLATE_EDITOR_INITIALIZATION_ERROR') ?? '',
			});
			const container = document.getElementById(this.#options.containerId);
			const parent = this.#form ?? container?.parentElement ?? document.body;
			Dom.prepend(this.#initializationError, parent);
		}
	};

	#handleCancel = (): void => {
		if (this.#isDisposed() || this.#store.state.busy)
		{
			return;
		}

		this.#component?.cancelPlaceholders();
		this.#close();
	};

	#close(): void
	{
		if (this.#slider)
		{
			this.#slider.close();
		}
		else
		{
			this.#closing = true;
			Page.redirect(this.#store.state.paths.list);
		}
	}

	#isDisposed(): boolean
	{
		return this.#destroyed || this.#closing;
	}

	#handleClosing = (): void => {
		this.#closing = true;
		this.#component?.cancelPlaceholders();
	};

	#handleDestroy = (): void => {
		this.destroy();
	};
}

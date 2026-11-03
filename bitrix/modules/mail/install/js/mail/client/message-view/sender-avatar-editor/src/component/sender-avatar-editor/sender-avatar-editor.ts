import { Runtime, Type } from 'main.core';
import { type BaseEvent } from 'main.core.events';
import {
	defineAsyncComponent,
	markRaw,
	type ComponentOptions,
	type PropType,
} from 'ui.vue3';
import { type UploaderFile } from 'ui.uploader.core';
import { type VueUploaderAdapter } from 'ui.uploader.vue';

import { loadUploaderStack, type UploaderStack } from '../../feature/uploader-stack/uploader-stack';

import './sender-avatar-editor.css';

type FocusTrapInstance = InstanceType<typeof import('ui.a11y')['FocusTrap']>;
type A11yStack = Pick<typeof import('ui.a11y'), 'FocusTrap'>;
type PendingOperation = 'replace' | 'delete' | null;

export type SenderAvatarEditorSelection = {
	id: string,
	status: 'loading' | 'complete' | 'error',
	previewUrl: string,
	uploadToken: string | null,
	error: string,
};

export type SenderAvatarEditorAvatar = {
	readonly confirmed: Readonly<{
		hasAvatar: boolean,
		url: string | null,
		canManage: boolean,
		uploader: Readonly<{
			controller: string,
			controllerOptions: Readonly<Record<string, unknown>>,
		}> | null,
	}> | null,
	readonly intent: Readonly<{ operation: 'replace', uploadToken: string | null }>
		| Readonly<{ operation: 'delete' }>
		| null,
	readonly selection: Readonly<SenderAvatarEditorSelection> | null,
	readonly status: 'idle' | 'loading' | 'editing' | 'saving' | 'refreshing' | 'failed',
	readonly error: string,
};

export type SenderAvatarEditorLabels = {
	readonly open: string,
	readonly title: string,
	readonly select: string,
	readonly replace: string,
	readonly delete: string,
	readonly confirm: string,
	readonly cancel: string,
	readonly retry: string,
	readonly loading: string,
	readonly saving: string,
	readonly deletePending: string,
	readonly replacePending: string,
	readonly uploaderError: string,
};

export type SenderAvatarEditorProps = {
	readonly avatar: SenderAvatarEditorAvatar,
	readonly labels: SenderAvatarEditorLabels,
	readonly disabled: boolean,
	readonly beginEditing: () => boolean,
};

const TileWidgetComponent = defineAsyncComponent({
	loader: () => loadUploaderStack().then((stack) => stack.TileWidgetComponent),
});

// @vue/component
export const SenderAvatarEditor: ComponentOptions = {
	name: 'MailSenderAvatarEditor',
	components: { TileWidgetComponent },
	props: {
		avatar: {
			type: Object as PropType<SenderAvatarEditorAvatar>,
			required: true,
		},
		labels: {
			type: Object as PropType<SenderAvatarEditorLabels>,
			required: true,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		// The host owns the avatar state: it answers whether editing may start.
		beginEditing: {
			type: Function as PropType<() => boolean>,
			required: true,
		},
		uploaderLoader: {
			type: Function as PropType<() => Promise<UploaderStack>>,
			default: loadUploaderStack,
		},
	},
	emits: {
		select: (selection?: SenderAvatarEditorSelection): boolean => Boolean(selection?.id),
		confirm: (): boolean => true,
		delete: (): boolean => true,
		cancel: (): boolean => true,
		retry: (): boolean => true,
		'image-error': (url?: string): boolean => Type.isStringFilled(url),
	},
	data()
	{
		return {
			isOpen: false,
			uploaderState: 'idle' as 'idle' | 'loading' | 'ready' | 'failed',
			uploaderStack: null as UploaderStack | null,
			adapter: null as VueUploaderAdapter | null,
			focusTrap: null as FocusTrapInstance | null,
			activeFileId: '',
			pendingOperation: null as PendingOperation,
			uploaderGeneration: 0,
			disposed: false,
			widgetOptions: {
				compact: true,
				autoCollapse: false,
				readonly: false,
				hideDropArea: false,
				forceDisableSelection: false,
				enableDropzone: true,
				removeFromServer: true,
			},
		};
	},
	computed: {
		canOpen(): boolean
		{
			return !this.disabled
				&& this.avatar.confirmed?.canManage === true
				&& Boolean(this.avatar.confirmed.uploader)
			;
		},
		isBusy(): boolean
		{
			return this.avatar.status === 'saving'
				|| this.avatar.status === 'loading'
				|| this.avatar.status === 'refreshing'
			;
		},
		controlsDisabled(): boolean
		{
			return this.disabled || this.isBusy;
		},
		hasPendingChange(): boolean
		{
			return Boolean(this.avatar.intent || this.pendingOperation);
		},
		hasConfirmableChange(): boolean
		{
			const intent = this.avatar.intent;
			if (intent?.operation === 'delete')
			{
				return true;
			}

			const selection = this.avatar.selection;

			return intent?.operation === 'replace'
				&& selection?.status === 'complete'
				&& Type.isStringFilled(selection.uploadToken)
				&& intent.uploadToken === selection.uploadToken
			;
		},
		statusText(): string
		{
			if (this.avatar.status === 'saving' || this.avatar.status === 'refreshing')
			{
				return this.labels.saving;
			}

			if (this.uploaderState === 'loading' || this.avatar.status === 'loading')
			{
				return this.labels.loading;
			}

			const operation = this.avatar.intent?.operation ?? this.pendingOperation;
			if (operation === 'delete')
			{
				return this.labels.deletePending;
			}

			return operation === 'replace' ? this.labels.replacePending : '';
		},
		selectLabel(): string
		{
			return this.avatar.confirmed?.hasAvatar ? this.labels.replace : this.labels.select;
		},
	},
	watch: {
		controlsDisabled(disabled: boolean): void
		{
			Object.assign(this.widgetOptions, {
				readonly: disabled,
				hideDropArea: disabled,
				forceDisableSelection: disabled,
				enableDropzone: !disabled,
			});
		},
		'avatar.status': function(
			status: SenderAvatarEditorAvatar['status'],
			previousStatus: SenderAvatarEditorAvatar['status'],
		): void {
			if (status === 'refreshing')
			{
				this.pendingOperation = null;
				// The refresh rebuilds the uploader with the settings just read, but the prepared upload
				// stays on the server: the host keeps the selection and confirms the same file again.
				this.destroyUploader({ keepServerFiles: true });
				void this.focusDialog();
			}

			if (status === 'idle' && previousStatus === 'saving')
			{
				this.closeEditor();
			}

			if (status === 'editing' && previousStatus === 'refreshing' && this.isOpen)
			{
				void this.createUploader();
				void this.focusDialog();
			}
		},
	},
	beforeUnmount(): void
	{
		this.disposed = true;
		this.destroyFocusTrap();
		this.destroyUploader();
	},
	methods: {
		async openEditor(): Promise<void>
		{
			if (!this.canOpen || this.isOpen)
			{
				return;
			}

			if (this.avatar.status === 'idle' && !this.beginEditing())
			{
				return;
			}

			this.isOpen = true;
			this.pendingOperation = this.avatar.intent?.operation ?? null;
			await this.$nextTick();
			(this.$refs.dialog as HTMLElement | undefined)?.querySelector<HTMLElement>('button:not(:disabled)')?.focus({
				preventScroll: true,
			});
			void this.activateFocusTrap();
			if (!this.avatar.intent)
			{
				void this.createUploader();
			}
		},
		closeEditor(): void
		{
			if (!this.isOpen)
			{
				return;
			}

			this.isOpen = false;
			this.pendingOperation = null;
			this.destroyUploader();
			this.destroyFocusTrap();
			void this.$nextTick(() => {
				const trigger = this.$refs.trigger as HTMLButtonElement | undefined;
				if (trigger && !trigger.disabled)
				{
					trigger.focus({ preventScroll: true });
				}
			});
		},
		async focusDialog(): Promise<void>
		{
			await this.$nextTick();
			if (this.isOpen)
			{
				(this.$refs.dialog as HTMLElement | undefined)?.focus({ preventScroll: true });
			}
		},
		destroyUploader(options: { keepServerFiles?: boolean } = {}): void
		{
			this.uploaderGeneration += 1;
			this.activeFileId = '';
			if (options.keepServerFiles)
			{
				this.adapter?.setRemoveFilesFromServerWhenDestroy(false);
			}

			this.adapter?.destroy();
			this.adapter = null;
			this.uploaderStack = null;
			this.uploaderState = 'idle';
		},
		async activateFocusTrap(): Promise<void>
		{
			const a11y = await Runtime.loadExtension('ui.a11y') as unknown as A11yStack;
			if (this.disposed || !this.isOpen || this.focusTrap)
			{
				return;
			}

			const dialog = this.$refs.dialog as HTMLElement | undefined;
			const trigger = this.$refs.trigger as HTMLElement | undefined;
			if (!dialog || !trigger)
			{
				return;
			}

			this.focusTrap = markRaw(new a11y.FocusTrap(dialog, {
				initialFocus: 'first-tabbable',
				restoreFocus: trigger,
				looped: true,
				isolateOutside: false,
				preventScroll: true,
			}));
			this.focusTrap.activate();
		},
		destroyFocusTrap(): void
		{
			if (!this.focusTrap)
			{
				return;
			}

			this.focusTrap.deactivate();
			this.focusTrap.destroy();
			this.focusTrap = null;
		},
		async createUploader(): Promise<void>
		{
			if (this.uploaderState !== 'idle' || !this.avatar.confirmed?.uploader)
			{
				return;
			}

			const generation = this.uploaderGeneration + 1;
			this.uploaderGeneration = generation;
			this.uploaderState = 'loading';
			const stack = await this.uploaderLoader().catch((): null => null);
			if (generation !== this.uploaderGeneration)
			{
				return;
			}

			if (!stack?.Uploader || !stack.UploaderEvent || !stack.VueUploaderAdapter)
			{
				this.uploaderState = 'failed';

				return;
			}

			if (this.disposed || !this.isOpen || !this.avatar.confirmed?.uploader)
			{
				this.uploaderState = 'idle';

				return;
			}

			const uploader = this.avatar.confirmed.uploader;
			const instance = new stack.Uploader({
				controller: uploader.controller,
				controllerOptions: { ...uploader.controllerOptions },
				multiple: false,
				allowReplaceSingle: true,
				acceptOnlyImages: true,
				acceptedFileTypes: ['image/jpeg', 'image/png'],
				events: {
					[stack.UploaderEvent.FILE_ADD_START]: (event: BaseEvent) => this.handleFileAdd(event, generation),
					[stack.UploaderEvent.FILE_STATE_CHANGE]: (event: BaseEvent) => this.handleFileChange(event, generation),
					[stack.UploaderEvent.FILE_COMPLETE]: (event: BaseEvent) => this.handleFileChange(event, generation),
					[stack.UploaderEvent.FILE_ERROR]: (event: BaseEvent) => this.handleFileChange(event, generation),
					[stack.UploaderEvent.ERROR]: (event: BaseEvent) => this.handleUploaderError(event, generation),
				},
			});
			this.uploaderStack = markRaw(stack);
			this.adapter = markRaw(new stack.VueUploaderAdapter(instance));
			this.uploaderState = 'ready';
			await this.$nextTick();
			if (generation !== this.uploaderGeneration || !this.isOpen)
			{
				return;
			}
			const browse = this.$refs.selectButton as HTMLElement | undefined;
			if (browse)
			{
				instance.assignBrowse(browse);
			}
		},
		handleFileAdd(event: BaseEvent, generation: number): void
		{
			if (generation !== this.uploaderGeneration || !this.isOpen || this.disposed)
			{
				return;
			}

			this.activeFileId = event.getData().file.getId();
			this.handleFileChange(event, generation);
		},
		handleFileChange(event: BaseEvent, generation: number): void
		{
			if (generation !== this.uploaderGeneration || !this.isOpen || this.disposed)
			{
				return;
			}

			const file = event.getData().file as UploaderFile;
			const stack = this.uploaderStack;
			if (!stack || file.getId() !== this.activeFileId)
			{
				return;
			}

			const status = file.getStatus();
			const failed = status === stack.FileStatus.LOAD_FAILED || status === stack.FileStatus.UPLOAD_FAILED;
			const token = file.getServerFileId();
			const selection: SenderAvatarEditorSelection = {
				id: file.getId(),
				status: failed ? 'error' : 'loading',
				previewUrl: file.getPreviewUrl() || '',
				uploadToken: null,
				error: file.getError()?.getMessage() || '',
			};
			if (status === stack.FileStatus.COMPLETE && Type.isStringFilled(token))
			{
				selection.status = 'complete';
				selection.uploadToken = String(token);
			}

			this.pendingOperation = 'replace';
			this.$emit('select', selection);
		},
		handleUploaderError(event: BaseEvent, generation: number): void
		{
			if (generation !== this.uploaderGeneration || !this.isOpen || this.disposed)
			{
				return;
			}

			this.pendingOperation = 'replace';
			this.$emit('select', {
				id: this.activeFileId || 'uploader-error',
				status: 'error',
				previewUrl: '',
				uploadToken: null,
				error: event.getData().error?.getMessage?.() || this.labels.uploaderError,
			});
		},
		handleDelete(): void
		{
			if (this.controlsDisabled)
			{
				return;
			}

			this.pendingOperation = 'delete';
			this.$emit('delete');
		},
		handleConfirm(): void
		{
			if (!this.controlsDisabled && this.hasConfirmableChange)
			{
				this.$emit('confirm');
			}
		},
		handleCancel(): void
		{
			if (this.isBusy)
			{
				return;
			}

			this.$emit('cancel');
			this.closeEditor();
		},
		handleRetry(): void
		{
			if (!this.isBusy)
			{
				this.$emit('retry');
			}
		},
		handleImageError(event: Event): void
		{
			const url = (event.target as HTMLImageElement | null)?.src;
			if (url)
			{
				this.$emit('image-error', url);
			}
		},
		handleDialogKeydown(event: KeyboardEvent): void
		{
			if (event.key === 'Escape')
			{
				event.preventDefault();
				event.stopPropagation();
				if (this.isBusy)
				{
					return;
				}

				this.handleCancel();
			}
		},
	},
	template: `
		<div class="mail-sender-avatar-editor">
			<button
				ref="trigger"
				type="button"
				class="mail-sender-avatar-editor__trigger"
				data-testid="mail-sender-avatar-trigger"
				:aria-label="labels.open"
				aria-haspopup="dialog"
				:aria-expanded="isOpen ? 'true' : 'false'"
				:disabled="disabled"
				@click="openEditor"
			>
				<slot>
					<img
						v-if="avatar.confirmed?.url"
						class="mail-sender-avatar-editor__trigger-image"
						:src="avatar.confirmed.url"
						alt=""
						@error="handleImageError"
					>
				</slot>
			</button>
			<div
				v-if="isOpen"
				ref="dialog"
				class="mail-sender-avatar-editor__dialog"
				data-testid="mail-sender-avatar-dialog"
				role="dialog"
				tabindex="-1"
				:aria-label="labels.title"
				:aria-busy="isBusy ? 'true' : 'false'"
				@keydown="handleDialogKeydown"
			>
				<div class="mail-sender-avatar-editor__preview-row">
					<img
						v-if="avatar.confirmed?.url"
						class="mail-sender-avatar-editor__confirmed-image"
						data-testid="mail-sender-avatar-confirmed-image"
						:src="avatar.confirmed.url"
						alt=""
						@error="handleImageError"
					>
					<img
						v-if="avatar.selection?.previewUrl"
						class="mail-sender-avatar-editor__selection-image"
						data-testid="mail-sender-avatar-selection-image"
						:src="avatar.selection.previewUrl"
						alt=""
					>
				</div>
				<div
					v-if="statusText"
					class="mail-sender-avatar-editor__status"
					data-testid="mail-sender-avatar-status"
					role="status"
				>{{ statusText }}</div>
				<div
					v-if="avatar.error || avatar.selection?.error || uploaderState === 'failed'"
					class="mail-sender-avatar-editor__error"
					data-testid="mail-sender-avatar-error"
					role="alert"
				>{{ avatar.error || avatar.selection?.error || labels.uploaderError }}</div>
				<TileWidgetComponent
					v-if="adapter"
					:uploaderAdapter="adapter"
					:widgetOptions="widgetOptions"
				/>
				<div ref="selectButton" class="mail-sender-avatar-editor__select-wrapper">
					<button
						type="button"
						class="mail-sender-avatar-editor__button"
						data-testid="mail-sender-avatar-select"
						:disabled="controlsDisabled || uploaderState !== 'ready'"
					>{{ selectLabel }}</button>
				</div>
				<div class="mail-sender-avatar-editor__actions">
					<button
						v-if="avatar.confirmed?.hasAvatar"
						type="button"
						class="mail-sender-avatar-editor__button"
						data-testid="mail-sender-avatar-delete"
						:disabled="controlsDisabled"
						@click="handleDelete"
					>{{ labels.delete }}</button>
					<button
						v-if="hasConfirmableChange"
						type="button"
						class="mail-sender-avatar-editor__button --primary"
						data-testid="mail-sender-avatar-confirm"
						:disabled="controlsDisabled"
						@click="handleConfirm"
					>{{ labels.confirm }}</button>
					<button
						v-if="avatar.error && avatar.status === 'failed'"
						type="button"
						class="mail-sender-avatar-editor__button"
						data-testid="mail-sender-avatar-retry"
						:disabled="isBusy"
						@click="handleRetry"
					>{{ labels.retry }}</button>
					<button
						type="button"
						class="mail-sender-avatar-editor__button"
						data-testid="mail-sender-avatar-cancel"
						:disabled="isBusy"
						@click="handleCancel"
					>{{ labels.cancel }}</button>
				</div>
			</div>
		</div>
	`,
};

/* eslint-disable */
this.BX = this.BX || {};
this.BX.Mail = this.BX.Mail || {};
this.BX.Mail.Client = this.BX.Mail.Client || {};
(function (exports, main_core, ui_vue3) {
	'use strict';

	function createUploaderStackLoader(loadExtensions = (...extensions) => {
		return main_core.Runtime.loadExtension(...extensions);
	}) {
		let stackPromise = null;
		return () => {
			stackPromise ??= loadExtensions('ui.uploader.core', 'ui.uploader.vue', 'ui.uploader.tile-widget');
			return stackPromise;
		};
	}
	const loadUploaderStack = createUploaderStackLoader();

	const TileWidgetComponent = ui_vue3.defineAsyncComponent({
		loader: () => loadUploaderStack().then(stack => stack.TileWidgetComponent)
	});
	const SenderAvatarEditor = {
		name: 'MailSenderAvatarEditor',
		components: {
			TileWidgetComponent
		},
		props: {
			avatar: {
				type: Object,
				required: true
			},
			labels: {
				type: Object,
				required: true
			},
			disabled: {
				type: Boolean,
				default: false
			},
			beginEditing: {
				type: Function,
				required: true
			},
			uploaderLoader: {
				type: Function,
				default: loadUploaderStack
			}
		},
		emits: {
			select: selection => Boolean(selection?.id),
			confirm: () => true,
			delete: () => true,
			cancel: () => true,
			retry: () => true,
			'image-error': url => main_core.Type.isStringFilled(url)
		},
		data() {
			return {
				isOpen: false,
				uploaderState: 'idle',
				uploaderStack: null,
				adapter: null,
				focusTrap: null,
				activeFileId: '',
				pendingOperation: null,
				uploaderGeneration: 0,
				disposed: false,
				widgetOptions: {
					compact: true,
					autoCollapse: false,
					readonly: false,
					hideDropArea: false,
					forceDisableSelection: false,
					enableDropzone: true,
					removeFromServer: true
				}
			};
		},
		computed: {
			canOpen() {
				return !this.disabled && this.avatar.confirmed?.canManage === true && Boolean(this.avatar.confirmed.uploader);
			},
			isBusy() {
				return this.avatar.status === 'saving' || this.avatar.status === 'loading' || this.avatar.status === 'refreshing';
			},
			controlsDisabled() {
				return this.disabled || this.isBusy;
			},
			hasPendingChange() {
				return Boolean(this.avatar.intent || this.pendingOperation);
			},
			hasConfirmableChange() {
				const intent = this.avatar.intent;
				if (intent?.operation === 'delete') {
					return true;
				}
				const selection = this.avatar.selection;
				return intent?.operation === 'replace' && selection?.status === 'complete' && main_core.Type.isStringFilled(selection.uploadToken) && intent.uploadToken === selection.uploadToken;
			},
			statusText() {
				if (this.avatar.status === 'saving' || this.avatar.status === 'refreshing') {
					return this.labels.saving;
				}
				if (this.uploaderState === 'loading' || this.avatar.status === 'loading') {
					return this.labels.loading;
				}
				const operation = this.avatar.intent?.operation ?? this.pendingOperation;
				if (operation === 'delete') {
					return this.labels.deletePending;
				}
				return operation === 'replace' ? this.labels.replacePending : '';
			},
			selectLabel() {
				return this.avatar.confirmed?.hasAvatar ? this.labels.replace : this.labels.select;
			}
		},
		watch: {
			controlsDisabled(disabled) {
				Object.assign(this.widgetOptions, {
					readonly: disabled,
					hideDropArea: disabled,
					forceDisableSelection: disabled,
					enableDropzone: !disabled
				});
			},
			'avatar.status': function (status, previousStatus) {
				if (status === 'refreshing') {
					this.pendingOperation = null;
					this.destroyUploader({
						keepServerFiles: true
					});
					void this.focusDialog();
				}
				if (status === 'idle' && previousStatus === 'saving') {
					this.closeEditor();
				}
				if (status === 'editing' && previousStatus === 'refreshing' && this.isOpen) {
					void this.createUploader();
					void this.focusDialog();
				}
			}
		},
		beforeUnmount() {
			this.disposed = true;
			this.destroyFocusTrap();
			this.destroyUploader();
		},
		methods: {
			async openEditor() {
				if (!this.canOpen || this.isOpen) {
					return;
				}
				if (this.avatar.status === 'idle' && !this.beginEditing()) {
					return;
				}
				this.isOpen = true;
				this.pendingOperation = this.avatar.intent?.operation ?? null;
				await this.$nextTick();
				this.$refs.dialog?.querySelector('button:not(:disabled)')?.focus({
					preventScroll: true
				});
				void this.activateFocusTrap();
				if (!this.avatar.intent) {
					void this.createUploader();
				}
			},
			closeEditor() {
				if (!this.isOpen) {
					return;
				}
				this.isOpen = false;
				this.pendingOperation = null;
				this.destroyUploader();
				this.destroyFocusTrap();
				void this.$nextTick(() => {
					const trigger = this.$refs.trigger;
					if (trigger && !trigger.disabled) {
						trigger.focus({
							preventScroll: true
						});
					}
				});
			},
			async focusDialog() {
				await this.$nextTick();
				if (this.isOpen) {
					this.$refs.dialog?.focus({
						preventScroll: true
					});
				}
			},
			destroyUploader(options = {}) {
				this.uploaderGeneration += 1;
				this.activeFileId = '';
				if (options.keepServerFiles) {
					this.adapter?.setRemoveFilesFromServerWhenDestroy(false);
				}
				this.adapter?.destroy();
				this.adapter = null;
				this.uploaderStack = null;
				this.uploaderState = 'idle';
			},
			async activateFocusTrap() {
				const a11y = await main_core.Runtime.loadExtension('ui.a11y');
				if (this.disposed || !this.isOpen || this.focusTrap) {
					return;
				}
				const dialog = this.$refs.dialog;
				const trigger = this.$refs.trigger;
				if (!dialog || !trigger) {
					return;
				}
				this.focusTrap = ui_vue3.markRaw(new a11y.FocusTrap(dialog, {
					initialFocus: 'first-tabbable',
					restoreFocus: trigger,
					looped: true,
					isolateOutside: false,
					preventScroll: true
				}));
				this.focusTrap.activate();
			},
			destroyFocusTrap() {
				if (!this.focusTrap) {
					return;
				}
				this.focusTrap.deactivate();
				this.focusTrap.destroy();
				this.focusTrap = null;
			},
			async createUploader() {
				if (this.uploaderState !== 'idle' || !this.avatar.confirmed?.uploader) {
					return;
				}
				const generation = this.uploaderGeneration + 1;
				this.uploaderGeneration = generation;
				this.uploaderState = 'loading';
				const stack = await this.uploaderLoader().catch(() => null);
				if (generation !== this.uploaderGeneration) {
					return;
				}
				if (!stack?.Uploader || !stack.UploaderEvent || !stack.VueUploaderAdapter) {
					this.uploaderState = 'failed';
					return;
				}
				if (this.disposed || !this.isOpen || !this.avatar.confirmed?.uploader) {
					this.uploaderState = 'idle';
					return;
				}
				const uploader = this.avatar.confirmed.uploader;
				const instance = new stack.Uploader({
					controller: uploader.controller,
					controllerOptions: {
						...uploader.controllerOptions
					},
					multiple: false,
					allowReplaceSingle: true,
					acceptOnlyImages: true,
					acceptedFileTypes: ['image/jpeg', 'image/png'],
					events: {
						[stack.UploaderEvent.FILE_ADD_START]: event => this.handleFileAdd(event, generation),
						[stack.UploaderEvent.FILE_STATE_CHANGE]: event => this.handleFileChange(event, generation),
						[stack.UploaderEvent.FILE_COMPLETE]: event => this.handleFileChange(event, generation),
						[stack.UploaderEvent.FILE_ERROR]: event => this.handleFileChange(event, generation),
						[stack.UploaderEvent.ERROR]: event => this.handleUploaderError(event, generation)
					}
				});
				this.uploaderStack = ui_vue3.markRaw(stack);
				this.adapter = ui_vue3.markRaw(new stack.VueUploaderAdapter(instance));
				this.uploaderState = 'ready';
				await this.$nextTick();
				if (generation !== this.uploaderGeneration || !this.isOpen) {
					return;
				}
				const browse = this.$refs.selectButton;
				if (browse) {
					instance.assignBrowse(browse);
				}
			},
			handleFileAdd(event, generation) {
				if (generation !== this.uploaderGeneration || !this.isOpen || this.disposed) {
					return;
				}
				this.activeFileId = event.getData().file.getId();
				this.handleFileChange(event, generation);
			},
			handleFileChange(event, generation) {
				if (generation !== this.uploaderGeneration || !this.isOpen || this.disposed) {
					return;
				}
				const file = event.getData().file;
				const stack = this.uploaderStack;
				if (!stack || file.getId() !== this.activeFileId) {
					return;
				}
				const status = file.getStatus();
				const failed = status === stack.FileStatus.LOAD_FAILED || status === stack.FileStatus.UPLOAD_FAILED;
				const token = file.getServerFileId();
				const selection = {
					id: file.getId(),
					status: failed ? 'error' : 'loading',
					previewUrl: file.getPreviewUrl() || '',
					uploadToken: null,
					error: file.getError()?.getMessage() || ''
				};
				if (status === stack.FileStatus.COMPLETE && main_core.Type.isStringFilled(token)) {
					selection.status = 'complete';
					selection.uploadToken = String(token);
				}
				this.pendingOperation = 'replace';
				this.$emit('select', selection);
			},
			handleUploaderError(event, generation) {
				if (generation !== this.uploaderGeneration || !this.isOpen || this.disposed) {
					return;
				}
				this.pendingOperation = 'replace';
				this.$emit('select', {
					id: this.activeFileId || 'uploader-error',
					status: 'error',
					previewUrl: '',
					uploadToken: null,
					error: event.getData().error?.getMessage?.() || this.labels.uploaderError
				});
			},
			handleDelete() {
				if (this.controlsDisabled) {
					return;
				}
				this.pendingOperation = 'delete';
				this.$emit('delete');
			},
			handleConfirm() {
				if (!this.controlsDisabled && this.hasConfirmableChange) {
					this.$emit('confirm');
				}
			},
			handleCancel() {
				if (this.isBusy) {
					return;
				}
				this.$emit('cancel');
				this.closeEditor();
			},
			handleRetry() {
				if (!this.isBusy) {
					this.$emit('retry');
				}
			},
			handleImageError(event) {
				const url = event.target?.src;
				if (url) {
					this.$emit('image-error', url);
				}
			},
			handleDialogKeydown(event) {
				if (event.key === 'Escape') {
					event.preventDefault();
					event.stopPropagation();
					if (this.isBusy) {
						return;
					}
					this.handleCancel();
				}
			}
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
	`
	};

	exports.SenderAvatarEditor = SenderAvatarEditor;

})(this.BX.Mail.Client.MessageView = this.BX.Mail.Client.MessageView || {}, BX, BX.Vue3);
//# sourceMappingURL=sender-avatar-editor.bundle.js.map

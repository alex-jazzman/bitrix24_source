import { Type } from 'main.core';
import { type BaseEvent } from 'main.core.events';
import { FocusNavigator } from 'ui.a11y';
import { defineAsyncComponent, defineComponent, markRaw, type PropType } from 'ui.vue3';
import { Button as UiButton, AirButtonStyle, ButtonSize } from 'ui.vue3.components.button';
import { TextSm, TextXs } from 'ui.system.typography.vue';
import { type UploaderFile } from 'ui.uploader.core';
import { type VueUploaderAdapter } from 'ui.uploader.vue';

import { type MailboxAvatarSelection, type MailboxAvatarState } from '../types';
import { loc } from '../utils/loc';
import { loadUploaderStack, type UploaderStack } from '../utils/uploader-stack';

type FocusRestoreRequest = { mailboxId: number | null; requestId: number };
type UploaderInstance = InstanceType<UploaderStack['Uploader']>;
type EditorState = 'idle' | 'pending' | 'ready' | 'failed';

// The widget renders only next to a ready adapter, so its loader answers from the finished stack request.
const TileWidgetComponent = defineAsyncComponent({
	loader: () => loadUploaderStack().then((stack: UploaderStack) => stack.TileWidgetComponent),
});

function createPixelFilter(stack: UploaderStack, uploader: UploaderInstance): InstanceType<UploaderStack['Filter']>
{
	const { Filter, UploaderError } = stack;

	class AvatarPixelFilter extends Filter
	{
		apply(file: UploaderFile): Promise<void>
		{
			if ((file.getWidth() ?? 0) * (file.getHeight() ?? 0) > 4_194_304)
			{
				return Promise.reject(new UploaderError('MAIL_AVATAR_LIMIT_EXCEEDED', loc('MAIL_CONFIG_FORM_AVATAR_LIMIT_ERROR')));
			}

			return Promise.resolve();
		}
	}

	return new AvatarPixelFilter(uploader);
}

// @vue/component
export const MailboxAvatar = defineComponent({
	name: 'MailConfigMailboxAvatar',
	components: { UiButton, TextSm, TextXs, TileWidgetComponent },
	props: {
		avatar: { type: Object as PropType<MailboxAvatarState>, required: true },
		disabled: { type: Boolean, default: false },
	},
	emits: ['selection-change', 'delete', 'reset', 'retry', 'image-error'],
	setup()
	{
		return { loc, AirButtonStyle, ButtonSize };
	},
	data()
	{
		return {
			adapter: null as VueUploaderAdapter | null,
			uploaderStack: null as UploaderStack | null,
			editorState: 'idle' as EditorState,
			activeFileId: '',
			disposed: false,
			focusRestoreRequest: null as FocusRestoreRequest | null,
			browseNode: null as HTMLElement | null,
			widgetOptions: {
				compact: true,
				autoCollapse: false,
				readonly: this.disabled,
				hideDropArea: this.disabled,
				forceDisableSelection: this.disabled,
				enableDropzone: !this.disabled,
				removeFromServer: true,
			},
		};
	},
	computed: {
		canEdit(): boolean
		{
			return this.avatar.confirmed?.supported === true && this.avatar.confirmed.canEdit === true;
		},
		hasPendingSelection(): boolean
		{
			return Boolean(this.avatar.selection);
		},
		showSavedImage(): boolean
		{
			return this.avatar.confirmed?.hasAvatar === true
				&& Boolean(this.avatar.confirmed.url)
				&& !this.avatar.intent
				&& !this.avatar.selection
				&& !this.avatar.imageErrorUrl
			;
		},
		imageUnavailable(): boolean
		{
			return Boolean(this.avatar.imageErrorUrl)
				|| (this.avatar.confirmed?.hasAvatar === true && !this.avatar.confirmed.url && !this.avatar.intent)
			;
		},
		controlsDisabled(): boolean
		{
			return this.disabled || this.avatar.loading || this.avatar.needsRefresh || Boolean(this.avatar.error);
		},
		statusMessage(): string
		{
			if (this.avatar.error && !this.avatar.confirmed)
			{
				return '';
			}

			if (this.avatar.loading)
			{
				return loc('MAIL_CONFIG_FORM_AVATAR_LOADING');
			}

			if (this.avatar.intent?.operation === 'delete')
			{
				return loc('MAIL_CONFIG_FORM_AVATAR_DELETE_PENDING');
			}

			if (this.avatar.selection?.status === 'loading')
			{
				return loc('MAIL_CONFIG_FORM_AVATAR_UPLOADING');
			}

			if (this.avatar.intent)
			{
				return loc('MAIL_CONFIG_FORM_AVATAR_UNSAVED');
			}

			return loc(this.avatar.confirmed?.hasAvatar
				? 'MAIL_CONFIG_FORM_AVATAR_SAVED'
				: 'MAIL_CONFIG_FORM_AVATAR_EMPTY');
		},
	},
	watch: {
		disabled(disabled: boolean): void
		{
			if (disabled)
			{
				this.cancelFocusRestore();
			}
		},
		'avatar.mailboxId': 'cancelFocusRestore',
		'avatar.requestId': function(requestId: number): void {
			if (this.focusRestoreRequest?.requestId !== requestId)
			{
				this.cancelFocusRestore();
			}
		},
		'avatar.loading': function(loading: boolean): void {
			if (!loading)
			{
				void this.$nextTick(this.restoreFocus);
			}
		},
		controlsDisabled: {
			immediate: true,
			handler(disabled: boolean): void
			{
				Object.assign(this.widgetOptions, {
					readonly: disabled,
					hideDropArea: disabled || this.hasPendingSelection,
					forceDisableSelection: disabled,
					enableDropzone: !disabled,
				});
			},
		},
		hasPendingSelection(pending: boolean): void
		{
			this.widgetOptions.hideDropArea = this.controlsDisabled || pending;
		},
		'avatar.resetKey': function(): void {
			if (!this.avatar.selection)
			{
				this.clearSelection();
			}
		},
		canEdit: {
			immediate: true,
			handler(canEdit: boolean): void
			{
				if (canEdit && !this.adapter)
				{
					void this.createUploader();
				}
			},
		},
	},
	mounted(): void
	{
		this.bindBrowseButton();
	},
	updated(): void
	{
		this.bindBrowseButton();
	},
	beforeUnmount(): void
	{
		this.disposed = true;
		this.cancelFocusRestore();
	},
	unmounted(): void
	{
		this.clearSelection();
		this.unbindBrowseButton();
		this.adapter?.destroy();
		this.adapter = null;
	},
	methods: {
		holdFocus(): void
		{
			this.cancelFocusRestore();
			const root = this.$refs.avatar as HTMLElement | undefined;
			if (root?.contains(FocusNavigator.getActiveElement(root)))
			{
				FocusNavigator.focusContainer(root, { preventScroll: true });
				this.focusRestoreRequest = { mailboxId: this.avatar.mailboxId, requestId: this.avatar.requestId };
			}
		},
		cancelFocusRestore(): void
		{
			this.focusRestoreRequest = null;
		},
		onRootFocusOut(event: FocusEvent): void
		{
			if (event.target === event.currentTarget)
			{
				this.cancelFocusRestore();
			}
		},
		isFocusRestoreCurrent(request: FocusRestoreRequest): boolean
		{
			return !this.disposed && !this.disabled
				&& request.mailboxId === this.avatar.mailboxId && request.requestId === this.avatar.requestId;
		},
		restoreFocus(): void
		{
			const request = this.focusRestoreRequest;
			if (!request || this.avatar.loading)
			{
				return;
			}

			this.cancelFocusRestore();
			const root = this.$refs.avatar as HTMLElement | undefined;
			if (this.isFocusRestoreCurrent(request) && root?.isConnected && FocusNavigator.getActiveElement(root) === root)
			{
				// The row of avatar actions keeps the user on the control they were using, while the first
				// focusable of the whole block is the file selection that no action of theirs asked for.
				const actions = this.$refs.actions as HTMLElement | undefined;
				const scope = actions?.querySelector('button') ? actions : root;
				FocusNavigator.focusFirst(scope, { preventScroll: true });
			}
		},
		async createUploader(): Promise<void>
		{
			if (this.editorState !== 'idle' || !this.avatar.mailboxId)
			{
				return;
			}

			this.editorState = 'pending';

			const stack = await loadUploaderStack().catch((): null => null);
			if (!stack)
			{
				// The editor never appears, and the rest of the form keeps saving without it.
				this.editorState = 'failed';

				return;
			}

			if (this.disposed || !this.canEdit || !this.avatar.mailboxId)
			{
				this.editorState = 'idle';

				return;
			}

			const uploader = new stack.Uploader({
				controller: 'mail.fileUploader.mailboxAvatarUploaderController',
				controllerOptions: { mailboxId: this.avatar.mailboxId },
				multiple: false,
				allowReplaceSingle: true,
				acceptedFileTypes: ['image/jpeg', 'image/png'],
				acceptOnlyImages: true,
				maxFileSize: 5 * 1024 * 1024,
				imageMaxFileSize: 5 * 1024 * 1024,
				imageMaxWidth: 4096,
				imageMaxHeight: 4096,
				imagePreviewWidth: 300,
				imagePreviewHeight: 300,
				imagePreviewUpscale: false,
				events: {
					[stack.UploaderEvent.BEFORE_FILES_ADD]: this.handleBeforeFilesAdd,
					[stack.UploaderEvent.FILE_ADD_START]: this.handleFileAdd,
					[stack.UploaderEvent.FILE_STATE_CHANGE]: this.handleFileChange,
					[stack.UploaderEvent.FILE_COMPLETE]: this.handleFileChange,
					[stack.UploaderEvent.FILE_ERROR]: this.handleFileChange,
					[stack.UploaderEvent.FILE_REMOVE]: this.handleFileRemove,
					[stack.UploaderEvent.BEFORE_BROWSE]: this.handleBeforeBrowse,
					[stack.UploaderEvent.ERROR]: this.handleUploaderError,
				},
			});
			uploader.addFilter(stack.FilterType.VALIDATION, createPixelFilter(stack, uploader));
			this.uploaderStack = markRaw(stack);
			this.adapter = markRaw(new stack.VueUploaderAdapter(uploader));
			this.editorState = 'ready';
		},
		bindBrowseButton(): void
		{
			const node = this.$refs.selectButton as HTMLElement | undefined;
			if (!node || !this.adapter || this.browseNode === node)
			{
				return;
			}

			this.unbindBrowseButton();
			this.adapter.getUploader().assignBrowse(node);
			this.browseNode = markRaw(node);
		},
		unbindBrowseButton(): void
		{
			if (this.browseNode)
			{
				this.adapter?.getUploader().unassignBrowse(this.browseNode);
				this.browseNode = null;
			}
		},
		// The browse node is a wrapper, so a click on its padding would open the dialog past the disabled button.
		handleBeforeBrowse(event: BaseEvent): void
		{
			if (this.controlsDisabled || !this.canEdit || this.disposed)
			{
				event.preventDefault();
			}
		},
		onPreviewError(event: Event): void
		{
			const url = (event.target as HTMLImageElement | null)?.src ?? '';
			if (!this.disposed && url)
			{
				this.$emit('image-error', url);
			}
		},
		handleBeforeFilesAdd(event: BaseEvent): void
		{
			if (this.controlsDisabled || !this.canEdit || this.disposed)
			{
				event.preventDefault();
			}
		},
		handleFileAdd(event: BaseEvent): void
		{
			this.activeFileId = event.getData().file.getId();
			this.handleFileChange(event);
		},
		handleFileChange(event: BaseEvent): void
		{
			const stack = this.uploaderStack;
			const file: UploaderFile = event.getData().file;
			if (this.disposed || !stack || file.getId() !== this.activeFileId)
			{
				return;
			}

			const status = file.getStatus();
			const failed = status === stack.FileStatus.LOAD_FAILED || status === stack.FileStatus.UPLOAD_FAILED;
			const token = file.getServerFileId();
			const selection: MailboxAvatarSelection = {
				id: file.getId(),
				status: failed ? 'error' : 'loading',
				previewUrl: failed ? '' : file.getPreviewUrl() || '',
				uploadToken: null,
				error: file.getError()?.getMessage() || '',
			};
			if (status === stack.FileStatus.COMPLETE && Type.isStringFilled(token))
			{
				selection.status = 'complete';
				selection.uploadToken = String(token);
			}

			this.$emit('selection-change', selection);
		},
		handleFileRemove(event: BaseEvent): void
		{
			const file: UploaderFile = event.getData().file;
			// The uploader keeps the object URL of a removed local preview alive until the document dies.
			file.revokeClientPreviewUrl();

			if (!this.disposed && file.getId() === this.activeFileId)
			{
				this.activeFileId = '';
				this.$emit('reset');
			}
		},
		handleUploaderError(event: BaseEvent): void
		{
			if (!this.disposed)
			{
				this.$emit('selection-change', {
					id: this.activeFileId,
					status: 'error',
					previewUrl: '',
					uploadToken: null,
					error: event.getData().error.getMessage(),
				});
			}
		},
		clearSelection(): void
		{
			this.activeFileId = '';
			if (!this.adapter)
			{
				return;
			}

			const uploader = this.adapter.getUploader();
			// A pending or lost Save response may still be preparing this file on the server.
			uploader.getFiles().forEach((file: UploaderFile): void => {
				uploader.removeFile(file, { removeFromServer: file.getId() !== this.avatar.preservedUploadId });
			});
		},
		handleReset(): void
		{
			if (!this.disabled)
			{
				this.holdFocus();
				this.clearSelection();
				this.$emit('reset');
				void this.$nextTick(this.restoreFocus);
			}
		},
		handleDelete(): void
		{
			if (!this.controlsDisabled)
			{
				this.holdFocus();
				this.clearSelection();
				this.$emit('delete');
				void this.$nextTick(this.restoreFocus);
			}
		},
		handleRetry(): void
		{
			if (this.disabled || this.avatar.loading)
			{
				return;
			}

			this.holdFocus();
			this.$emit('retry');
			if (this.focusRestoreRequest)
			{
				this.focusRestoreRequest.requestId = this.avatar.requestId;
			}
			void this.$nextTick(this.restoreFocus);
		},
	},
	template: `
		<div
			v-if="avatar.loading || avatar.error || canEdit"
			ref="avatar"
			class="mail-config-form__mailbox-avatar"
			data-test-id="mail_config-form__mailbox-avatar"
			data-testid="mail-avatar"
			@focusout="onRootFocusOut"
		>
			<TextSm>{{ loc('MAIL_CONFIG_FORM_AVATAR_TITLE') }}</TextSm>
			<div v-if="statusMessage" role="status" aria-live="polite" data-testid="mail-avatar-status">
				<TextXs>{{ statusMessage }}</TextXs>
			</div>
			<div v-if="avatar.error || imageUnavailable" role="alert" data-testid="mail-avatar-error">
				<TextXs className="mail-config-form__mailbox-avatar-error">
					{{ avatar.error || loc('MAIL_CONFIG_FORM_AVATAR_IMAGE_ERROR') }}
				</TextXs>
				<UiButton
					:dataset="{ testid: 'mail-avatar-retry' }"
					:text="loc('MAIL_CONFIG_FORM_AVATAR_RETRY')"
					:style="AirButtonStyle.PLAIN"
					:size="ButtonSize.SMALL"
					:disabled="disabled || avatar.loading"
					@click="handleRetry"
				/>
			</div>
			<template v-if="canEdit">
				<div v-if="editorState === 'failed'" role="alert" data-testid="mail-avatar-editor-error">
					<TextXs className="mail-config-form__mailbox-avatar-error">
						{{ loc('MAIL_CONFIG_FORM_ERROR_AJAX') }}
					</TextXs>
				</div>
				<template v-else-if="adapter">
					<img
						v-if="showSavedImage"
						:key="avatar.confirmed.url"
						class="mail-config-form__mailbox-avatar-image"
						:src="avatar.confirmed.url"
						alt=""
						data-testid="mail-avatar-image"
						@error="onPreviewError"
					>
					<template v-else>
						<TextXs className="mail-config-form__mailbox-avatar-hint">
							{{ loc('MAIL_CONFIG_FORM_AVATAR_HINT') }}
						</TextXs>
						<TileWidgetComponent :uploaderAdapter="adapter" :widgetOptions="widgetOptions"/>
					</template>
					<div ref="selectButton" class="mail-config-form__mailbox-avatar-select">
						<UiButton
							:dataset="{ testid: 'mail-avatar-select' }"
							:text="loc('MAIL_CONFIG_FORM_AVATAR_SELECT')"
							:style="AirButtonStyle.PLAIN"
							:size="ButtonSize.SMALL"
							:disabled="controlsDisabled"
						/>
					</div>
				</template>
				<div v-if="avatar.selection?.error" role="alert" data-testid="mail-avatar-selection-error">
					<TextXs className="mail-config-form__mailbox-avatar-error">{{ avatar.selection.error }}</TextXs>
				</div>
				<div
					ref="actions"
					class="mail-config-form__mailbox-avatar-actions"
					data-test-id="mail_config-form__mailbox-avatar-actions"
				>
					<UiButton
						v-if="avatar.confirmed.hasAvatar && avatar.intent?.operation !== 'delete'"
						:dataset="{ testid: 'mail-avatar-delete' }"
						:text="loc('MAIL_CONFIG_FORM_AVATAR_DELETE')"
						:style="AirButtonStyle.PLAIN"
						:size="ButtonSize.SMALL"
						:disabled="controlsDisabled"
						@click="handleDelete"
					/>
					<UiButton
						v-if="avatar.intent"
						:dataset="{ testid: 'mail-avatar-reset' }"
						:text="loc('MAIL_CONFIG_FORM_AVATAR_RESET')"
						:style="AirButtonStyle.PLAIN"
						:size="ButtonSize.SMALL"
						:disabled="disabled"
						@click="handleReset"
					/>
				</div>
			</template>
		</div>
	`,
});

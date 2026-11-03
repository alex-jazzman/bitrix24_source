import type { PopupOptions } from 'main.popup';

import { Popup } from 'ui.vue3.components.popup';
import { Button as UiButton, AirButtonStyle, ButtonSize, ButtonIcon } from 'ui.vue3.components.button';
import { Outline } from 'ui.icon-set.api.vue';
import type { VueUploaderAdapter } from 'ui.uploader.vue';
import 'ui.icon-set.outline';

import type { UserFieldWidgetOptions } from 'disk.uploader.user-field-widget';

import { fileService } from 'tasks.v2.provider.service.file-service';
import { DiskUserFieldWidgetComponent } from 'tasks.v2.component.elements.user-field-widget-component';
import { Model } from 'tasks.v2.const';
import { type FilesViewMode } from 'tasks.v2.model.interface';

import './files-popup.css';

// @vue/component
export const FilesPopup = {
	components: {
		Popup,
		UiButton,
		UserFieldWidgetComponent: DiskUserFieldWidgetComponent,
	},
	props: {
		taskId: {
			type: [Number, String],
			required: true,
		},
		getBindElement: {
			type: Function,
			required: true,
		},
	},
	emits: ['upload', 'close'],
	setup(props): { uploaderAdapter: VueUploaderAdapter }
	{
		return {
			ButtonSize,
			AirButtonStyle,
			ButtonIcon,
			Outline,
			uploaderAdapter: fileService.get(props.taskId).getAdapter(),
		};
	},
	data(): Object
	{
		return {
			files: fileService.get(this.taskId).getFiles(),
		};
	},
	computed: {
		bindElement(): HTMLElement
		{
			return this.getBindElement();
		},
		options(): PopupOptions
		{
			return {
				id: 'tasks-field-files-popup',
				bindElement: this.bindElement,
				targetContainer: document.body,
				minWidth: 380,
				maxHeight: 320,
				padding: 14,
				bindOptions: {
					forceBindPosition: true,
					forceTop: true,
					position: 'top',
				},
				focusTrap: true,
				closeByEsc: true,
				ariaLabel: this.loc('TASKS_V2_FILES_ARIA_LABEL'),
				autoHideHandler: (event: MouseEvent): boolean => {
					const anyTileMenuShown = this.files.some(({ isMenuShown }) => isMenuShown);

					return this.$refs.popup?.autoHideHandler(event) && !anyTileMenuShown;
				},
			};
		},
		viewMode(): FilesViewMode
		{
			return this.$store.getters[`${Model.Interface}/filesViewMode`];
		},
		widgetOptions(): UserFieldWidgetOptions
		{
			return {
				isEmbedded: true,
				withControlPanel: false,
				canCreateDocuments: false,
				viewMode: this.viewMode,
				tileWidgetOptions: {
					hideDropArea: true,
					enableDropzone: false,
					compact: true,
					autoCollapse: false,
				},
			};
		},
		filesCount(): number
		{
			return this.files.length;
		},
	},
	watch: {
		filesCount(): void
		{
			if (this.filesCount === 0)
			{
				this.closePopup();
			}
		},
	},
	methods: {
		handleClearClick(): void
		{
			fileService.get(this.taskId).getAdapter().getUploader().removeFiles();

			this.closePopup();
		},
		handleUploadClick(): void
		{
			fileService.get(this.taskId).browseFiles();
		},
		handleMyDriveClick(): void
		{
			fileService.get(this.taskId).browseMyDrive();
		},
		closePopup(): void
		{
			this.$emit('close');
		},
	},
	template: `
		<Popup :options ref="popup" @close="closePopup">
			<div class="tasks-field-files-popup" data-testid="task-files-popup">
				<div class="tasks-field-files-popup-files" data-testid="task-files-popup-list">
					<UserFieldWidgetComponent :uploaderAdapter :widgetOptions/>
				</div>
				<div class="tasks-field-files-popup-footer" data-testid="task-files-popup-footer">
					<div class="tasks-field-files-popup-add-buttons">
						<UiButton
							:text="loc('TASKS_V2_FILES_UPLOAD_BUTTON')"
							:size="ButtonSize.SMALL"
							:style="AirButtonStyle.TINTED"
							:leftIcon="Outline.DOWNLOAD"
							data-testid="task-files-popup-upload-btn"
							@click="handleUploadClick"
						/>
						<UiButton
							:text="loc('TASKS_V2_FILES_MY_DRIVE')"
							:size="ButtonSize.SMALL"
							:style="AirButtonStyle.TINTED"
							:leftIcon="Outline.UPLOAD"
							data-testid="task-files-popup-my-drive-btn"
							@click="handleMyDriveClick"
						/>
					</div>
					<UiButton
						:text="loc('TASKS_V2_FILES_CLEAR')"
						:size="ButtonSize.SMALL"
						:style="AirButtonStyle.PLAIN_NO_ACCENT"
						:leftIcon="Outline.TRASHCAN"
						data-testid="task-files-popup-clear-btn"
						@click="handleClearClick"
					/>
				</div>
			</div>
		</Popup>
	`,
};

import { Dom } from 'main.core';

import { FileStatus, type UploaderFileInfo } from 'ui.uploader.core';
import { Chip, ChipDesign } from 'ui.system.chip.vue';
import { Animated, Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.animated';
import 'ui.icon-set.outline';

import { GroupType, Model, CardType } from 'tasks.v2.const';
import { fieldHighlighter } from 'tasks.v2.lib.field-highlighter';
import { analytics } from 'tasks.v2.lib.analytics';
import { fileService, type FileService } from 'tasks.v2.provider.service.file-service';
import { type TaskModel } from 'tasks.v2.model.tasks';
import { type GroupModel } from 'tasks.v2.model.groups';

import { filesMeta } from './files-meta';
import { FilesPopup } from './files-popup/files-popup';

// @vue/component
export const FilesChip = {
	components: {
		Chip,
		FilesPopup,
	},
	inject: {
		analytics: {},
		cardType: {},
		task: {},
	},
	props: {
		taskId: {
			type: [Number, String],
			required: true,
		},
		isAutonomous: {
			type: Boolean,
			default: false,
		},
	},
	setup(props): { task: TaskModel, fileService: FileService }
	{
		return {
			filesMeta,
			fileService: fileService.get(props.taskId),
		};
	},
	data(): Object
	{
		return {
			files: this.fileService.getFiles(),
			isPopupShown: false,
			isPopupShownWithFiles: false,
			isMenuShown: false,
		};
	},
	computed: {
		group(): ?GroupModel
		{
			return this.$store.getters[`${Model.Groups}/getById`](this.task.groupId);
		},
		filesCount(): number
		{
			return this.files.length;
		},
		design(): string
		{
			return {
				[!this.isAutonomous && !this.isSelected]: ChipDesign.ShadowNoAccent,
				[!this.isAutonomous && this.isSelected]: ChipDesign.ShadowAccent,
				[this.isAutonomous && !this.isSelected]: ChipDesign.OutlineNoAccent,
				[this.isAutonomous && this.isSelected]: ChipDesign.OutlineAccent,
				[this.hasError]: ChipDesign.OutlineAlert,
			}.true;
		},
		isSelected(): boolean
		{
			if (this.isAutonomous)
			{
				return this.files.length > 0;
			}

			return this.task.filledFields[filesMeta.id] || this.files.length > 0;
		},
		icon(): string
		{
			if (this.isAutonomous && this.isUploading)
			{
				return Animated.LOADER_WAIT;
			}

			return Outline.ATTACH;
		},
		text(): string
		{
			if (this.isAutonomous && this.filesCount > 0)
			{
				return this.loc('TASKS_V2_FILES_COUNT', {
					'#COUNT#': this.filesCount,
				});
			}

			return filesMeta.title;
		},
		isUploading(): boolean
		{
			return this.fileService.isUploading();
		},
		hasError(): boolean
		{
			return this.files.some(({ status }) => [FileStatus.UPLOAD_FAILED, FileStatus.LOAD_FAILED].includes(status));
		},
		canAttachFiles(): boolean
		{
			return this.task.rights.attachFile || this.task.rights.edit;
		},
		popupHasAlreadyBeenShown(): boolean
		{
			return this.filesCount > 0 && this.isPopupShownWithFiles;
		},
		opensDialog(): boolean
		{
			return this.isAutonomous || !this.isSelected;
		},
		ariaLabel(): string
		{
			if (!this.isAutonomous || this.filesCount === 0)
			{
				return this.loc('TASKS_V2_FILES_ARIA_LABEL');
			}

			return this.loc('TASKS_V2_FILES_COUNT_ARIA_LABEL', {
				'#COUNT#': this.filesCount,
			});
		},
	},
	watch: {
		isPopupShown: {
			handler(): void
			{
				this.syncAria();
			},
			flush: 'post',
		},
		opensDialog: {
			handler(): void
			{
				this.syncAria();
			},
			flush: 'post',
		},
		filesCount: {
			handler(): void
			{
				this.syncAria();
			},
			flush: 'post',
		},
		isMenuShown: {
			handler(): void
			{
				this.syncAria();
			},
			flush: 'post',
		},
	},
	mounted(): void
	{
		this.syncAria();

		this.fileService.subscribe('onFileAdd', this.handleFileAdd);
		this.fileService.subscribe('onFileAttach', this.handleFileAttach);
	},
	beforeUnmount(): void
	{
		this.fileService.unsubscribe('onFileAdd', this.handleFileAdd);
		this.fileService.unsubscribe('onFileAttach', this.handleFileAttach);
	},
	methods: {
		handleFileAdd(): void
		{
			if (this.isAutonomous && this.popupHasAlreadyBeenShown)
			{
				this.showPopup();
			}
		},
		handleFileAttach(event): void
		{
			this.sendAnalytics(event.getData());
		},
		sendAnalytics(file: UploaderFileInfo): void
		{
			analytics.sendAttachFile(this.analytics, {
				cardType: this.cardType,
				collabId: this.group?.type === GroupType.Collab ? this.group.id : null,
				fileOrigin: file.origin,
				fileSize: file.size,
				fileExtension: file.extension,
				filesCount: this.filesCount,
			});
		},
		handleClick(): void
		{
			if (!this.isAutonomous && this.isSelected)
			{
				this.highlightField();

				return;
			}

			if (this.files.length > 0)
			{
				this.isPopupShownWithFiles = true;

				this.showPopup();
			}
			else
			{
				this.browseFiles();
			}
		},
		showPopup(): void
		{
			this.isPopupShown = true;
		},
		closePopup(): void
		{
			this.isPopupShown = false;

			if (!this.filesCount)
			{
				this.isPopupShownWithFiles = false;
			}
		},
		browseFiles(): void
		{
			const bindElement = this.getChipElement();
			if (!bindElement)
			{
				return;
			}

			this.fileService.browse({
				bindElement,
				onShowCallback: this.onFileBrowserShow,
				onHideCallback: this.onFileBrowserClose,
				compact: this.cardType === CardType.Compact,
			});
		},
		highlightField(): void
		{
			void fieldHighlighter.setContainer(this.$root.$el).highlight(filesMeta.id);
		},
		onFileBrowserShow(): void
		{
			this.isMenuShown = true;
		},
		onFileBrowserClose(): void
		{
			this.isMenuShown = false;
			this.$refs.chip?.$el.focus();
			this.fileService.setFileBrowserClosed(true);
		},
		handleKeydown(event: KeyboardEvent): void
		{
			if (event.key !== ' ')
			{
				return;
			}

			event.preventDefault();
			this.handleClick();
		},
		syncAria(): void
		{
			const el = this.getChipElement();
			if (!el)
			{
				return;
			}

			Dom.attr(el, 'role', 'button');
			Dom.attr(el, 'aria-label', this.ariaLabel);

			if (!this.opensDialog)
			{
				Dom.attr(el, 'aria-haspopup', null);
				Dom.attr(el, 'aria-expanded', null);

				return;
			}

			const opensMenu = this.filesCount === 0;

			Dom.attr(el, 'aria-haspopup', opensMenu ? 'menu' : 'dialog');
			Dom.attr(el, 'aria-expanded', String(opensMenu ? this.isMenuShown : this.isPopupShown));
		},
		getChipElement(): ?HTMLElement
		{
			return this.$refs.chip?.$el ?? null;
		},
	},
	template: `
		<Chip
			v-if="isSelected || canAttachFiles"
			:design
			:icon
			:text
			:data-task-id="taskId"
			:data-task-chip-id="filesMeta.id"
			ref="chip"
			@click="handleClick"
			@keydown="handleKeydown"
		/>
		<FilesPopup
			v-if="isPopupShown && getChipElement()"
			:taskId
			:getBindElement="getChipElement"
			@upload="browseFiles"
			@close="closePopup"
		/>
	`,
};

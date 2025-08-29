import { BIcon } from 'ui.icon-set.api.vue';
import { Outline } from 'ui.icon-set.api.core';
import { FileStatus } from 'ui.uploader.core';
import type { VueUploaderAdapter } from 'ui.uploader.vue';

import { UserFieldWidgetComponent, type UserFieldWidgetOptions } from 'disk.uploader.user-field-widget';

import { Model } from 'tasks.v2.const';
import { GrowingTextArea } from 'tasks.v2.component.elements.growing-text-area';
import { UserAvatarList } from 'tasks.v2.component.elements.user-avatar-list';
import { fileService, EntityTypes } from 'tasks.v2.provider.service.file-service';

import { CheckListItemMixin } from './check-list-item-mixin';

// @vue/component
export const CheckListChildItem = {
	name: 'CheckListChildItem',
	components: {
		BIcon,
		GrowingTextArea,
		UserAvatarList,
		UserFieldWidgetComponent,
	},
	mixins: [
		CheckListItemMixin,
	],
	inject: ['setItemsRef'],
	props: {
		itemOffset: {
			type: String,
			default: '0',
		},
	},
	emits: [
		'toggleIsComplete',
		'toggleGroupModeSelected',
	],
	setup(props: Object): { uploaderAdapter: VueUploaderAdapter }
	{
		return {
			Outline,
			fileService: fileService.get(props.id, EntityTypes.CheckListItem),
			uploaderAdapter: fileService.get(props.id, EntityTypes.CheckListItem).getAdapter(),
		};
	},
	data(): Object
	{
		return {
			uploadingFiles: this.fileService.getFiles(),
		};
	},
	computed: {
		widgetOptions(): UserFieldWidgetOptions
		{
			return {
				isEmbedded: true,
				withControlPanel: false,
				canCreateDocuments: false,
				tileWidgetOptions: {
					compact: true,
					hideDropArea: true,
					readonly: this.isPreview,
				},
			};
		},
		hasAttachments(): boolean
		{
			return this.hasUsers || this.hasFilesAttach;
		},
		hasFilesAttach(): boolean
		{
			return this.hasFiles || this.isUploading || this.hasUploadingError;
		},
		hasFiles(): boolean
		{
			return this.files?.length > 0;
		},
		isUploading(): boolean
		{
			return this.uploadingFiles.some(({ status }) => [
				FileStatus.UPLOADING,
				FileStatus.LOADING,
			].includes(status));
		},
		hasUploadingError(): boolean
		{
			return this.uploadingFiles.some(({ status }) => [
				FileStatus.UPLOAD_FAILED,
				FileStatus.LOAD_FAILED,
			].includes(status));
		},
		hasTrashcanIcon(): boolean
		{
			return (
				this.isHovered
				&& !this.item.panelIsShown
				&& !this.groupMode
				&& !this.isPreview
			);
		},
	},
	created(): void
	{
		if (this.hasFilesAttach)
		{
			void this.loadFiles();
		}
	},
	mounted(): void
	{
		if (this.setItemsRef)
		{
			this.setItemsRef(this.id, this);
		}
	},
	beforeUnmount(): void
	{
		if (this.setItemsRef)
		{
			this.setItemsRef(this.id, null);
		}
	},
	methods: {
		toggleIsComplete(): void
		{
			if (this.canToggle === false)
			{
				return;
			}

			this.$store.dispatch(`${Model.CheckList}/update`, {
				id: this.id,
				fields: { isComplete: !this.item.isComplete },
			});

			this.$emit('toggleIsComplete', this.id);
		},
		toggleGroupModeSelected(): void
		{
			this.$store.dispatch(`${Model.CheckList}/update`, {
				id: this.id,
				fields: {
					groupMode: {
						active: true,
						selected: !this.groupModeSelected,
					},
				},
			});

			this.$emit('toggleGroupModeSelected', this.id);
		},
		focusToItem(): void
		{
			this.scrollContainer ??= this.$parent.$el?.closest('[data-list]');

			const offset = 200;

			this.scrollContainer.scrollTo({
				top: this.$refs.item.offsetTop - offset,
				behavior: 'smooth',
			});
		},
		focusToTextarea(event: PointerEvent): void
		{
			const ignoreList = new Set([this.$refs.checkbox]);

			if (!ignoreList.has(event.target))
			{
				this.$refs.growingTextArea?.focusTextarea();
			}
		},
		async loadFiles(): Promise<void>
		{
			const ids = this.files?.map((file) => file?.id ?? file);

			await this.fileService.list(ids ?? []);
		},
		handleEnter(): void
		{
			if (!this.item)
			{
				return;
			}

			this.addItem(this.item.sortIndex + 1);
		},
		handleClick(event: PointerEvent): void
		{
			const filesWidget = this.$refs['files-widget'];

			if (this.isClickInsideFilesWidget(filesWidget?.$el, event.target))
			{
				return;
			}

			if (this.groupMode)
			{
				this.toggleGroupModeSelected();
			}

			if (this.isPreview)
			{
				this.toggleIsComplete();
			}
		},
		isClickInsideFilesWidget(filesNode: HTMLElement, target: HTMLElement)
		{
			if (!filesNode || !target)
			{
				return false;
			}

			const excludedClasses = ['ui-tile-uploader-items'];

			const isInsideWidget = filesNode.contains(target);
			if (!isInsideWidget)
			{
				return false;
			}

			const hasExcludedClass = excludedClasses.some((className: string) =>
				target.closest(`.${className}`) !== null
			);

			return !hasExcludedClass;
		},
	},
	template: `
		<div
			ref="item"
			class="check-list-widget-child-item"
			:class="{
				'--extra-indent': hasUsers && !hasFilesAttach,
				'--complete': item.isComplete,
				'--group-mode': groupMode,
				'--group-mode-selected': groupModeSelected,
				'--preview': isPreview,
			}"
			:data-id="id"
			:style="{ marginLeft: itemOffset }"
			@mouseover="isHovered = true"
			@mouseleave="isHovered = false"
			@click="handleClick"
		>
			<div class="check-list-widget-child-item-base">
				<label
					class="check-list-widget-child-item-checkbox"
					:class="{'--important': !item.isImportant}"
				>
					<input
						ref="checkbox"
						type="checkbox"
						:checked="item.isComplete"
						:disabled="!canToggle || groupMode"
						@click.stop="toggleIsComplete"
					>
				</label>
				<div
					v-if="item.isImportant"
					class="check-list-widget-child-item-important"
				>
					<BIcon :name="Outline.FIRE_SOLID" :hoverable="false"/>
				</div>
				<GrowingTextArea
					ref="growingTextArea"
					class="check-list-widget-child-item-title"
					:data-check-list-id="'check-list-child-item-title-' + item.id"
					:modelValue="item.title"
					:placeholder="loc('TASKS_V2_CHECK_LIST_ITEM_PLACEHOLDER')"
					:readonly="groupMode || isPreview"
					:fontColor="textColor"
					:fontSize="15"
					:lineHeight="20"
					@update:modelValue="updateTitle"
					@focus="handleFocus"
					@blur="handleBlur"
					@emptyBlur="handleEmptyBlur"
					@emptyFocus="focusToItem"
					@enterBlur="handleEnter"
				/>
				<div
					v-if="hasTrashcanIcon"
					class="check-list-widget-child-item-action"
					@click="removeItem"
				>
					<BIcon :name="Outline.TRASHCAN"/>
				</div>
				<div v-else-if="groupMode" class="check-list-widget-child-item-action-checkbox">
					<input
						ref="checkbox"
						type="checkbox"
						:checked="groupModeSelected"
					>
				</div>
				<div v-else class="check-list-widget-child-item-action-stub"></div>
			</div>
			<template v-if="hasAttachments">
				<div class="check-list-widget-item-attach">
					<div v-if="hasUsers" class="check-list-widget-item-attach-users">
						<div v-if="hasAccomplices" class="check-list-widget-item-attach-users-list">
							<BIcon :name="Outline.GROUP"/>
							<UserAvatarList :users="accomplices"/>
						</div>
						<div v-if="hasAuditors" class="check-list-widget-item-attach-users-list">
							<BIcon :name="Outline.OBSERVER"/>
							<UserAvatarList :users="auditors"/>
						</div>
					</div>
					<div v-if="hasFilesAttach" class="check-list-widget-item-attach-files">
						<div class="check-list-widget-item-attach-files-list">
							<UserFieldWidgetComponent
								ref="files-widget"
								:uploaderAdapter="uploaderAdapter"
								:widgetOptions="widgetOptions"
							/>
						</div>
					</div>
				</div>
			</template>
		</div>
	`,
};

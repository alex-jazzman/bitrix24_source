import { Dom } from 'main.core';
import { EventEmitter } from 'main.core.events';

import { BLine } from 'ui.system.skeleton.vue';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';
import type { VueUploaderAdapter } from 'ui.uploader.vue';

import type { UserFieldWidgetOptions } from 'disk.uploader.user-field-widget';

import { EventName, Model } from 'tasks.v2.const';
import { GrowingTextArea } from 'tasks.v2.component.elements.growing-text-area';
import { UserAvatarList } from 'tasks.v2.component.elements.user-avatar-list';
import { fileService, EntityTypes } from 'tasks.v2.provider.service.file-service';
import { highlighter } from 'tasks.v2.lib.highlighter';
import { DiskUserFieldWidgetComponent } from 'tasks.v2.component.elements.user-field-widget-component';

import { CheckListItemMixin } from './check-list-item-mixin';
import { CheckListCheckbox } from './check-list-checkbox';

// @vue/component
export const CheckListChildItem = {
	name: 'CheckListChildItem',
	components: {
		BIcon,
		BLine,
		GrowingTextArea,
		UserAvatarList,
		CheckListCheckbox,
		UserFieldWidgetComponent: DiskUserFieldWidgetComponent,
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
		checkListId: {
			type: [Number, String],
			default: 0,
		},
	},
	emits: [
		'toggleGroupModeSelected',
		'openCheckList',
	],
	setup(props: Object): { uploaderAdapter: VueUploaderAdapter }
	{
		const fileServiceInstance = fileService.get(
			props.id,
			EntityTypes.CheckListItem,
			{ parentEntityId: props.taskId },
		);

		return {
			Outline,
			fileService: fileServiceInstance,
			uploaderAdapter: fileServiceInstance.getAdapter(),
		};
	},
	data(): Object
	{
		return {
			uploadingFiles: this.fileService.getFiles(),
			filesLoading: false,
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
					enableDropzone: false,
					readonly: this.isPreview,
					autoCollapse: false,
					removeFromServer: !this.isEdit,
				},
			};
		},
		hasAttachments(): boolean
		{
			return this.hasUsers || this.hasFilesAttach;
		},
		hasFilesAttach(): boolean
		{
			return (
				this.hasFiles
				|| this.fileService.isUploading()
				|| this.fileService.hasUploadingError()
			);
		},
		hasFiles(): boolean
		{
			return this.filesNumber > 0;
		},
		filesNumber(): boolean
		{
			if (!this.files)
			{
				return 0;
			}

			return this.files.length;
		},
		hasTrashcanIcon(): boolean
		{
			return (
				this.isHovered
				&& this.canModify
				&& !this.item.panelIsShown
				&& !this.groupMode
				&& !this.readOnly
			);
		},
		toggleable(): boolean
		{
			if (this.isPreview)
			{
				return this.canModify;
			}

			return this.canToggle;
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

		if (this.checkListId === this.id)
		{
			setTimeout(() => {
				this.$refs.growingTextArea?.focusTextarea();
			}, 500);
		}

		this.subscribeToEvents();
	},
	beforeUnmount(): void
	{
		if (this.setItemsRef)
		{
			this.setItemsRef(this.id, null);
		}

		this.unsubscribeToEvents();
	},
	methods: {
		subscribeToEvents(): void
		{
			EventEmitter.subscribe(EventName.HighlightCheckListItem + this.id, this.handleHighlightItemEvent);
		},
		unsubscribeToEvents(): void
		{
			EventEmitter.unsubscribe(EventName.HighlightCheckListItem + this.id, this.handleHighlightItemEvent);
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
		async loadFiles(): Promise<void>
		{
			this.filesLoading = true;

			const ids = this.files?.map((file) => file?.id ?? file);

			await this.fileService.list(ids ?? []);

			this.filesLoading = false;
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

			if (this.isPreview && this.canModify)
			{
				this.$emit('openCheckList', this.id);
			}
		},
		isClickInsideFilesWidget(filesNode: HTMLElement, target: HTMLElement): boolean
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

			const hasExcludedClass = excludedClasses.some((className: string) => Dom.hasClass(target, className));

			return !hasExcludedClass;
		},
		handleHighlightItemEvent(): void
		{
			void highlighter.highlight(this.$el);
		},
	},
	template: `
		<div
			ref="item"
			class="check-list-widget-child-item print-no-before"
			:class="{
				'--complete': completed,
				'--group-mode': groupMode,
				'--group-mode-selected': groupModeSelected,
				'--preview': isPreview,
				'--toggleable': toggleable,
			}"
			:style="{ marginLeft: itemOffset }"
			@mouseover="isHovered = true"
			@mouseleave="isHovered = false"
			@click="handleClick"
		>
			<div class="check-list-widget-child-item-base">
				<div
					v-if="!readOnly"
					class="check-list-widget-item-drag"
					:class="{
						'check-list-drag-item': canDragItem,
					}"
				>
					<BIcon v-if="canDragItem" :name="Outline.DRAG_L"/>
				</div>
				<CheckListCheckbox
					:important="!item.isImportant"
					:disabled="!canToggle || groupMode"
					:checked="completed"
					@click="complete(!completed)"
				/>
				<div
					v-if="item.isImportant"
					class="check-list-widget-child-item-important"
				>
					<BIcon :name="Outline.FIRE_SOLID"/>
				</div>
				<GrowingTextArea
					ref="growingTextArea"
					class="check-list-widget-child-item-title"
					:data-check-list-id="'check-list-child-item-title-' + item.id"
					:modelValue="item.title"
					:placeholder="loc('TASKS_V2_CHECK_LIST_ITEM_PLACEHOLDER')"
					:readonly="textReadOnly"
					:fontColor="textColor"
					:linkColor
					:fontSize="15"
					:lineHeight="20"
					@update:modelValue="updateTitle"
					@linkClick="handleLinkClick"
					@input="handleInput"
					@focus="handleFocus"
					@blur="handleBlur"
					@emptyBlur="handleEmptyBlur"
					@emptyFocus="scrollToItem"
					@enterBlur="handleEnter"
				/>
				<div
					v-if="hasTrashcanIcon"
					class="check-list-widget-child-item-action"
					@click="removeItem"
				>
					<BIcon :name="Outline.TRASHCAN"/>
				</div>
				<template v-else-if="groupMode">
					<CheckListCheckbox :checked="groupModeSelected" highlight @click="toggleGroupModeSelected"/>
				</template>
				<div v-else class="check-list-widget-child-item-action-stub"/>
			</div>
			<template v-if="hasAttachments">
				<div class="check-list-widget-item-attach print-ignore">
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
							<template v-if="filesLoading">
								<div class="check-list-widget-item-attach-files-list-skeleton">
									<BLine v-for="key in filesNumber" :key :height="90"/>
								</div>
							</template>
							<template v-else>
								<UserFieldWidgetComponent :uploaderAdapter :widgetOptions ref="files-widget"/>
							</template>
						</div>
					</div>
				</div>
			</template>
		</div>
	`,
};

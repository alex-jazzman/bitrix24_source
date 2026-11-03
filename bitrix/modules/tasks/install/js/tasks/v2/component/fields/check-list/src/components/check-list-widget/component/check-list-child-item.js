import { Dom } from 'main.core';
import { EventEmitter } from 'main.core.events';

import { BLine } from 'ui.system.skeleton.vue';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';
import { type VueUploaderAdapter } from 'ui.uploader.vue';

import { type UserFieldWidgetOptions } from 'disk.uploader.user-field-widget';

import { EventName, Model } from 'tasks.v2.const';
import { UserAvatarList } from 'tasks.v2.component.elements.user-avatar-list';
import { EntityTypes, fileService } from 'tasks.v2.provider.service.file-service';
import { highlighter } from 'tasks.v2.lib.highlighter';
import { DiskUserFieldWidgetComponent } from 'tasks.v2.component.elements.user-field-widget-component';

import { CheckListFormattingLayer } from '../../check-list-formatting/check-list-formatting-layer';
import { CheckListItemMixin } from './check-list-item-mixin';
import { CheckListCheckbox } from './check-list-checkbox';

// @vue/component
export const CheckListChildItem = {
	name: 'CheckListChildItem',
	components: {
		BIcon,
		BLine,
		CheckListFormattingLayer,
		UserAvatarList,
		CheckListCheckbox,
		UserFieldWidgetComponent: DiskUserFieldWidgetComponent,
	},
	mixins: [
		CheckListItemMixin,
	],
	inject: ['setItemsRef', 'getItemsRef'],
	props: {
		itemOffset: {
			type: String,
			default: '0',
		},
		checkListId: {
			type: [Number, String],
			default: 0,
		},
		entityPanelActive: {
			type: Boolean,
			default: false,
		},
	},
	emits: [
		'toggleGroupModeSelected',
		'openCheckList',
		'indent',
		'outdent',
		'itemPointerEnter',
		'itemPointerLeave',
		'panelTab',
	],
	setup(props: Object): { uploaderAdapter: VueUploaderAdapter }
	{
		// eslint-disable-next-line vue/no-setup-props-reactivity-loss
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
		toggleable(): boolean
		{
			if (this.isPreview)
			{
				return this.canModify;
			}

			return this.canToggle;
		},
		// Preview opens the panel by Tab from the completion checkbox, and an item that cannot be
		// toggled keeps that checkbox out of the Tab order. Such a row has no stop of its own --
		// a title without links carries none either -- so the row itself becomes the one stop the
		// panel can be reached from.
		isPanelRowTabStop(): boolean
		{
			return (
				this.isPreview
				&& this.isEdit
				&& !this.groupMode
				&& !this.canToggle
				&& (this.canModify || this.canRemove)
			);
		},
	},
	watch: {
		async files(next: ?[], prev: ?[]): Promise<void>
		{
			const prevIds = (prev ?? []).map((file) => file?.id ?? file);
			const nextIds = (next ?? []).map((file) => file?.id ?? file);

			const prevIdSet = new Set(prevIds);
			const nextIdSet = new Set(nextIds);

			const newIds = nextIds.filter((id) => !prevIdSet.has(id));
			if (newIds.length > 0)
			{
				await this.fileService.list(newIds);
			}

			const removedIds = prevIds.filter((id) => !nextIdSet.has(id));
			if (removedIds.length > 0)
			{
				this.fileService.remove(removedIds);
			}
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

		this.subscribeToEvents();
	},
	beforeUnmount(): void
	{
		if (this.setItemsRef && this.getItemsRef?.(this.id) === this)
		{
			this.setItemsRef(this.id, null);
		}

		this.unsubscribeToEvents();
	},
	methods: {
		handlePointerEnter(): void
		{
			this.isHovered = true;
			this.$emit('itemPointerEnter', { itemId: this.id, anchor: this.$refs.base });
		},
		handlePointerLeave(event: PointerEvent): void
		{
			this.isHovered = false;
			this.$emit('itemPointerLeave', {
				itemId: this.id,
				anchor: this.$el,
				relatedTarget: event.relatedTarget,
			});
		},
		handlePanelTab({ shiftKey, event = null }: { shiftKey: boolean, event?: ?KeyboardEvent }): void
		{
			this.$emit('panelTab', { itemId: this.id, shiftKey, event });
		},
		handlePanelEntryTab(event: KeyboardEvent): void
		{
			if (
				event.shiftKey
				|| event.ctrlKey
				|| event.metaKey
				|| event.altKey
				|| !(event.target instanceof Element)
			)
			{
				return;
			}

			const fromRow = event.target === this.$refs.item;
			const fromPreviewCheckbox = this.isPreview
				&& event.target.closest('[data-testid="tasks-check-list-child-item-checkbox"]') !== null
			;
			if (!fromRow && !fromPreviewCheckbox)
			{
				return;
			}

			this.$emit('panelTab', { itemId: this.id, shiftKey: false, event });
		},
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
			if (!this.item)
			{
				return;
			}

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
			:tabindex="isPanelRowTabStop ? 0 : -1"
			class="check-list-widget-child-item print-no-before"
			data-testid="tasks-check-list-child-item"
			:class="{
				'--complete': completed,
				'--group-mode': groupMode,
				'--group-mode-selected': groupModeSelected,
				'--preview': isPreview,
				'--toggleable': toggleable,
				'--hovered': isHovered,
				'--entity-panel-active': entityPanelActive,
			}"
			:style="{ marginLeft: itemOffset }"
			@pointerenter="handlePointerEnter"
			@pointerleave="handlePointerLeave"
			@keydown.tab="handlePanelEntryTab"
			@click="handleClick"
		>
			<div
				ref="base"
				class="check-list-widget-child-item-base"
				data-testid="tasks-check-list-child-item-base"
			>
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
					data-testid="tasks-check-list-child-item-checkbox"
					:disabled="!canToggle || groupMode"
					:checked="completed"
					:ariaLabel="plainTitle"
					@click="complete(!completed)"
				/>
				<div
					v-if="item.isImportant"
					class="check-list-widget-child-item-important"
				>
					<BIcon :name="Outline.FIRE_SOLID" aria-hidden="true"/>
				</div>
				<CheckListFormattingLayer
					ref="growingTextArea"
					class="check-list-widget-child-item-title"
					:data-check-list-id="'check-list-child-item-title-' + item.id"
					:modelValue="item.title"
					:placeholder="loc('TASKS_V2_CHECK_LIST_ITEM_PLACEHOLDER')"
					:keyboardInstructions="loc('TASKS_V2_CHECK_LIST_ITEM_KEYBOARD_INSTRUCTIONS')"
					:readonly="textReadOnly"
					:fontColor="textColor"
					:linkColor
					:fontSize="15"
					:lineHeight="20"
					:maxLines="6"
					@update:modelValue="updateTitle"
					@linkClick="handleLinkClick"
					@input="handleInput"
					@focus="handleFocus"
					@blur="handleBlur"
					@emptyBlur="handleEmptyBlur"
					@emptyFocus="scrollToItem"
					@enterBlur="handleEnter"
					@selectionChange="handleFormattingSelectionChange"
					@panelTab="handlePanelTab"
				/>
				<template v-if="groupMode">
					<CheckListCheckbox
						:checked="groupModeSelected"
						highlight
						data-testid="tasks-check-list-child-item-group-checkbox"
						:ariaLabel="loc('TASKS_V2_CHECK_LIST_ITEM_SELECT_LABEL', { '#title#': plainTitle })"
						@click="toggleGroupModeSelected"
						@keydown.tab="(event) => handlePanelTab({ shiftKey: event.shiftKey, event })"
					/>
				</template>
				<div v-else class="check-list-widget-child-item-action-stub"/>
			</div>
			<template v-if="hasAttachments">
				<div class="check-list-widget-item-attach">
					<div v-if="hasUsers" class="check-list-widget-item-attach-users">
						<div v-if="hasAccomplices" class="check-list-widget-item-attach-users-list">
							<BIcon :name="Outline.GROUP" aria-hidden="true"/>
							<UserAvatarList :users="accomplices"/>
						</div>
						<div v-if="hasAuditors" class="check-list-widget-item-attach-users-list">
							<BIcon :name="Outline.OBSERVER" aria-hidden="true"/>
							<UserAvatarList :users="auditors"/>
						</div>
					</div>
					<div v-if="hasUsers" class="check-list-widget-item-attach-users-print">
						<div v-if="hasAccomplices" class="check-list-widget-item-attach-users-print-group">{{ accomplicesLabel }}</div>
						<div v-if="hasAuditors" class="check-list-widget-item-attach-users-print-group">{{ auditorsLabel }}</div>
					</div>
					<div v-if="hasFilesAttach" class="check-list-widget-item-attach-files print-ignore">
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

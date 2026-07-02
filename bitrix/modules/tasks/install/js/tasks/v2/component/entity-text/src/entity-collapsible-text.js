import { HtmlFormatterComponent } from 'ui.bbcode.formatter.html-formatter';
import { TextMd } from 'ui.system.typography.vue';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import { EditButton } from './collapsible-action/edit-button';
import { ExpandButton } from './collapsible-action/expand-button';
import { CollapseButton } from './collapsible-action/collapse-button';
import { EntityCollapsibleTextEvent } from './const';

import './entity-text.css';

// @vue/component
export const EntityCollapsibleText = {
	name: 'EntityCollapsibleText',
	components: {
		HtmlFormatterComponent,
		BIcon,
		TextMd,
		EditButton,
		ExpandButton,
		CollapseButton,
	},
	props: {
		content: {
			type: String,
			required: true,
		},
		files: {
			type: Array,
			required: true,
		},
		readonly: {
			type: Boolean,
			default: false,
		},
		openByDefault: {
			type: Boolean,
			default: false,
		},
		opened: {
			type: Boolean,
			default: false,
		},
		showFilesIndicator: {
			type: Boolean,
			default: true,
		},
		maxHeight: {
			type: Number,
			default: 200,
		},
		stickyFooter: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['editButtonClick', 'update:opened'],
	setup(): { Outline: Object, EntityCollapsibleTextEvent: typeof EntityCollapsibleTextEvent }
	{
		return {
			Outline,
			EntityCollapsibleTextEvent,
		};
	},
	data(): Object
	{
		return {
			isOverflowing: false,
			isOverflowChecked: false,
			isMouseDown: false,
			selectionMade: false,
		};
	},
	computed: {
		filesCount(): number
		{
			return this.files.length;
		},
		hasFiles(): boolean
		{
			return this.filesCount > 0;
		},
		hasContent(): boolean
		{
			return this.content.length > 0;
		},
		hidden(): boolean
		{
			if (this.opened)
			{
				return false;
			}

			if (this.showFilesIndicator)
			{
				return this.filesCount || this.isOverflowing;
			}

			return this.isOverflowing;
		},
		showCollapseButton(): boolean
		{
			return this.opened && !this.openByDefault;
		},
		showEditButton(): boolean
		{
			return !this.readonly;
		},
		showFooter(): boolean
		{
			return this.hidden || this.showEditButton || this.showCollapseButton;
		},
		maxHeightStyle(): string
		{
			if (this.isOverflowChecked && !this.isOverflowing)
			{
				return 'none';
			}

			return this.opened ? 'none' : `${this.maxHeight}px`;
		},
	},
	watch: {
		async content(): void
		{
			this.isOverflowChecked = false;

			await this.$nextTick();

			this.updateIsOverflowing();
		},
	},
	async mounted(): Promise<void>
	{
		await this.$nextTick();

		this.updateIsOverflowing();

		if (this.openByDefault)
		{
			this.setPreviewShown(true, EntityCollapsibleTextEvent.ByDefault);
		}
	},
	methods: {
		updateIsOverflowing(): void
		{
			if (
				this.openByDefault
				|| !this.$refs.htmlFormatter
				|| !this.$refs.preview
			)
			{
				return;
			}

			const previewOffsetHeight = this.$refs.preview.offsetHeight;
			const htmlFormatterOffsetHeight = this.$refs.htmlFormatter.$el.offsetHeight;
			const offsetParam = this.opened ? 32 : 20;

			const fitsWithinPreview = previewOffsetHeight - offsetParam <= htmlFormatterOffsetHeight;
			const exceedsMaxHeight = htmlFormatterOffsetHeight > this.maxHeight;

			this.isOverflowing = fitsWithinPreview && (!this.opened || exceedsMaxHeight);
			this.isOverflowChecked = true;

			if (!this.isOverflowing && this.showCollapseButton)
			{
				this.setPreviewShown(false, EntityCollapsibleTextEvent.UpdateIsContentOverflowing);
			}
		},
		onPreviewClick(targetEvent: string): void
		{
			if (this.hidden)
			{
				this.setPreviewShown(true, targetEvent);
			}
		},
		setPreviewShown(isShown: boolean, targetEvent: string): void
		{
			this.$emit('update:opened', isShown, targetEvent);
		},
		onMouseDown(event): void
		{
			if (this.opened)
			{
				return;
			}

			if (event.button === 0)
			{
				this.isMouseDown = true;
				this.selectionMade = false;
			}
		},
		onMouseMove(): void
		{
			if (this.selectionMade || this.opened)
			{
				return;
			}

			if (this.isMouseDown)
			{
				const selection = window.getSelection();
				if (selection.toString().length > 0)
				{
					this.selectionMade = true;
				}
			}
		},
		onMouseUp(event): void
		{
			if (this.opened)
			{
				return;
			}

			this.isMouseDown = false;
			if (!this.selectionMade)
			{
				const target = event.target;
				const isLinkClick = target.tagName === 'A' || target.closest('a');
				const isButtonClick = target.tagName === 'BUTTON' || target.closest('button');
				const isImageClick = target.tagName === 'IMG' || target.closest('img');
				const isVideoClick = target.tagName === 'VIDEO' || target.closest('video');

				if (!isLinkClick && !isButtonClick && !isImageClick && !isVideoClick)
				{
					this.onPreviewClick(EntityCollapsibleTextEvent.HtmlFormatterComponentMouseUp);
				}
			}
		},
	},
	template: `
		<div
			v-if="hasContent"
			class="tasks-card-entity-collapsible-text print-fit-height"
			:class="{ '--disable-animation': openByDefault }"
			:style="{ 'maxHeight': maxHeightStyle }"
			ref="preview"
		>
			<HtmlFormatterComponent
				:bbcode="content"
				:options="{ fileMode: 'disk' }"
				:formatData="{ files }"
				ref="htmlFormatter"
				@mousedown="onMouseDown"
				@mousemove="onMouseMove"
				@mouseup="onMouseUp"
			/>
			<template v-if="hidden && isOverflowing">
				<div class="tasks-card-entity-collapsible-shadow print-ignore">
					<div class="tasks-card-entity-collapsible-shadow-white-bottom"/>
				</div>
			</template>
		</div>
		<slot/>
		<div
			v-if="showFooter"
			class="tasks-card-entity-collapsible-footer print-ignore"
			:class="{
				'--empty-content': !hasContent && hidden,
				'--without-padding': !showFilesIndicator && hasFiles,
				'--with-edit-button': showEditButton,
				'--sticky': stickyFooter,
			}"
		>
			<EditButton v-if="showEditButton" @click="$emit('editButtonClick')"/>
			<ExpandButton v-if="hidden" :showFilesIndicator :filesCount @click="onPreviewClick(EntityCollapsibleTextEvent.ExpandButtonClick)"/>
			<CollapseButton v-if="showCollapseButton" @click="setPreviewShown(false, EntityCollapsibleTextEvent.CollapseButtonClick)"/>
		</div>
	`,
};

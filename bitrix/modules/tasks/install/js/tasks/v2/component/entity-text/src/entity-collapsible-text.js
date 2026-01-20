import { HtmlFormatterComponent } from 'ui.bbcode.formatter.html-formatter';
import { TextMd } from 'ui.system.typography.vue';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import { EditButton } from './collapsible-action/edit-button';
import { ExpandButton } from './collapsible-action/expand-button';
import { CollapseButton } from './collapsible-action/collapse-button';

import './entity-text.css';

// @vue/component
export const EntityCollapsibleText = {
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
	},
	emits: ['editButtonClick', 'update:opened'],
	setup(): { Outline: Object }
	{
		return {
			Outline,
		};
	},
	data(): Object
	{
		return {
			isOverflowing: false,
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
	},
	watch: {
		async content(): void
		{
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
			this.setPreviewShown(true);
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

			if (!this.isOverflowing && this.showCollapseButton)
			{
				this.setPreviewShown(false);
			}
		},
		onPreviewClick(): void
		{
			if (this.hidden)
			{
				this.setPreviewShown(true);
			}
		},
		setPreviewShown(isShown: boolean): void
		{
			this.$emit('update:opened', isShown);
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

				if (!isLinkClick)
				{
					this.onPreviewClick();
				}
			}
		},
	},
	template: `
		<div
			v-if="hasContent"
			class="tasks-card-entity-collapsible-text"
			:class="{ '--disable-animation': openByDefault }"
			:style="{ 'maxHeight': opened ? 'none' : maxHeight + 'px' }"
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
				<div class="tasks-card-entity-collapsible-shadow">
					<div class="tasks-card-entity-collapsible-shadow-white-bottom"/>
				</div>
			</template>
		</div>
		<slot/>
		<div
			v-if="showFooter"
			class="tasks-card-entity-collapsible-footer"
			:class="{
				'--empty-content': !hasContent && hidden,
				'--without-padding': !showFilesIndicator && hasFiles,
				'--with-edit-button': showEditButton,
			}"
		>
			<EditButton v-if="showEditButton" @click="$emit('editButtonClick')"/>
			<ExpandButton v-if="hidden" :showFilesIndicator :filesCount @click="onPreviewClick"/>
			<CollapseButton v-if="showCollapseButton" @click="setPreviewShown(false)"/>
		</div>
	`,
};

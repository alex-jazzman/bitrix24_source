import { Event } from 'main.core';
import { HtmlFormatterComponent } from 'ui.bbcode.formatter.html-formatter';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';
import { TextMd } from 'ui.system.typography.vue';

import { CollapseButton } from './collapsible-action/collapse-button';
import { EditButton } from './collapsible-action/edit-button';
import { ExpandButton } from './collapsible-action/expand-button';
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
	inject: {
		task: {},
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
		};
	},
	computed: {
		formatData(): number
		{
			return { files: this.files };
		},
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
		this.addHandlerSelectionStart();

		await this.$nextTick();

		this.updateIsOverflowing();

		if (this.openByDefault)
		{
			this.setPreviewShown(true, EntityCollapsibleTextEvent.ByDefault);
		}
	},
	beforeUnmount(): void
	{
		this.removeHandlerSelectionStart();
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
		processSelection(): void
		{
			if (this.opened)
			{
				return;
			}

			// waiting for selection event to get calculated
			setTimeout(() => {
				const selection = window.getSelection();
				const textSelected = selection?.toString();
				const textSelectedTrimmed = textSelected?.trim();
				if (textSelectedTrimmed)
				{
					const sel = window.getSelection();

					if (!sel.rangeCount)
					{
						return;
					}

					const rangeFresh = sel.getRangeAt(0).cloneRange();
					const isIntersectingPreview = rangeFresh.intersectsNode(this.$refs.preview);

					if (!isIntersectingPreview)
					{
						return;
					}

					const rectPreview = this.$refs.preview.getBoundingClientRect();
					const rectsRange = rangeFresh.getClientRects();
					const rectIndexToOrientate = rectsRange.length - 1;
					const rectRange = rectsRange[rectIndexToOrientate];

					if ((rectPreview.length <= 0) || (rectRange.length <= 0))
					{
						return;
					}

					const topLowestPreview = rectPreview.top + rectPreview.height;
					const topLowestRange = rectRange.top + rectRange.height;
					const isSelectionLowerThanContainer = topLowestRange > topLowestPreview;

					if (isSelectionLowerThanContainer)
					{
						this.setPreviewShown(true);
					}
				}
			}, 0);
		},
		setPreviewShown(isShown: boolean, targetEvent: string): void
		{
			this.$emit('update:opened', isShown, targetEvent);
		},
		handleClickOpener(targetEvent: string): void
		{
			this.setPreviewShown(true, targetEvent);
		},
		handleClickCollapser(targetEvent: string): void
		{
			this.setPreviewShown(false, targetEvent);
		},
		handleMouseDownText(): void
		{},
		handleMouseMoveText(): void
		{},
		handleMouseUpText(): void
		{},
		handleSelectionStart(): void
		{
			this.removeHandlerSelectionFinish();
			this.addHandlerSelectionFinish();
		},
		handleSelectionFinish(): void
		{
			this.removeHandlerSelectionFinish();
			this.processSelection();
		},
		addHandlerSelectionStart(): void
		{
			Event.bind(document, 'selectstart', this.handleSelectionStart);
		},
		removeHandlerSelectionStart(): void
		{
			Event.unbind(document, 'selectstart', this.handleSelectionStart);
		},
		addHandlerSelectionFinish(): void
		{
			Event.bind(document, 'mouseup', this.handleSelectionFinish);
		},
		removeHandlerSelectionFinish(): void
		{
			Event.unbind(document, 'mouseup', this.handleSelectionFinish);
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
				:formatData
				ref="htmlFormatter"
				@mousedown="handleMouseDownText"
				@mousemove="handleMouseMoveText"
				@mouseup="handleMouseUpText"
			/>
			<div
				v-if="hidden && isOverflowing"
				class="tasks-card-entity-collapsible-shadow print-ignore"
			>
				<div class="tasks-card-entity-collapsible-shadow-white-bottom" />
			</div>
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
			<EditButton v-if="showEditButton" @click="$emit('editButtonClick')" />
			<ExpandButton v-if="hidden" :showFilesIndicator :filesCount @click="handleClickOpener(EntityCollapsibleTextEvent.ExpandButtonClick)" />
			<CollapseButton v-if="showCollapseButton" @click="handleClickCollapser(EntityCollapsibleTextEvent.CollapseButtonClick)" />
		</div>
	`,
};

import { Dom } from 'main.core';

import { Chip, ChipDesign } from 'ui.system.chip.vue';

import { showLimit } from 'tasks.v2.lib.show-limit';
import { fieldHighlighter } from 'tasks.v2.lib.field-highlighter';
import { restoreOpenerFocus } from 'tasks.v2.lib.entity-selector-dialog';
import type { TaskModel } from 'tasks.v2.model.tasks';

// @vue/component
export const RelationTasksChip = {
	components: {
		Chip,
	},
	inject: {
		task: {},
		taskId: {},
		isTemplate: {},
	},
	props: {
		/** @type RelationFieldMeta */
		meta: {
			type: Object,
			required: true,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		isLocked: {
			type: Boolean,
			default: false,
		},
		featureId: {
			type: String,
			default: '',
		},
	},
	emits: ['add'],
	setup(): { task: TaskModel } {},
	data(): Object
	{
		return {
			isDialogShown: false,
		};
	},
	computed: {
		count(): number
		{
			return this.task[this.meta.idsField].length;
		},
		design(): string
		{
			if (this.disabled)
			{
				return ChipDesign.ShadowDisabled;
			}

			return this.isSelected ? ChipDesign.ShadowAccent : ChipDesign.ShadowNoAccent;
		},
		isSelected(): boolean
		{
			return this.task.filledFields[this.meta.id];
		},
		ariaLabel(): string
		{
			return this.meta.getChipTitle(this.isTemplate);
		},
		opensDialog(): boolean
		{
			return !this.disabled && !this.isSelected && !this.isLocked;
		},
	},
	watch: {
		isDialogShown(): void
		{
			this.syncAria();
		},
		opensDialog(): void
		{
			this.syncAria();
		},
		disabled(): void
		{
			this.syncAria();
		},
	},
	mounted(): void
	{
		this.syncAria();
	},
	methods: {
		handleClick(): void
		{
			if (this.disabled)
			{
				return;
			}

			if (this.isSelected)
			{
				this.highlightField();

				return;
			}

			if (this.isLocked)
			{
				void showLimit({ featureId: this.featureId });

				return;
			}

			this.isDialogShown = true;
			this.$emit('add', this.$el, this.handleClose);
		},
		handleClose(): void
		{
			this.isDialogShown = false;
			restoreOpenerFocus(this.$el);
		},
		highlightField(): void
		{
			void fieldHighlighter.setContainer(this.$root.$el).highlight(this.meta.id);
		},
		syncAria(): void
		{
			const el = this.$el;
			if (!el)
			{
				return;
			}

			Dom.attr(el, 'role', 'button');
			Dom.attr(el, 'aria-haspopup', this.opensDialog ? 'dialog' : null);
			Dom.attr(el, 'aria-expanded', this.opensDialog ? String(this.isDialogShown) : null);
			Dom.attr(el, 'aria-label', this.ariaLabel);
			Dom.attr(el, 'aria-disabled', this.disabled ? 'true' : null);
		},
	},
	template: `
		<Chip
			:design
			:text="meta.getChipTitle(isTemplate)"
			:icon="meta.icon"
			:lock="isLocked"
			:data-task-id="taskId"
			:data-task-chip-id="meta.id"
			@click="handleClick"
		/>
	`,
};

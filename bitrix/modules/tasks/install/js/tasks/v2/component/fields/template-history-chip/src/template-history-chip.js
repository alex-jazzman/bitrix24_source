import { Dom } from 'main.core';
import { EventEmitter } from 'main.core.events';

import { Chip, ChipDesign } from 'ui.system.chip.vue';
import { Outline } from 'ui.icon-set.api.vue';
import { hint, type HintParams } from 'ui.vue3.directives.hint';
import 'ui.icon-set.outline';

import { EventName } from 'tasks.v2.const';
import { idUtils } from 'tasks.v2.lib.id-utils';
import { tooltip } from 'tasks.v2.component.elements.hint';

import './template-history-chip.css';

// @vue/component
export const TemplateHistoryChip = {
	components: {
		Chip,
	},
	directives: { hint },
	inject: {
		taskId: {},
	},
	props: {
		isEnabled: {
			type: Boolean,
			default: false,
		},
	},
	setup(): Object
	{
		return {
			Outline,
		};
	},
	computed: {
		templateId(): number | string
		{
			return idUtils.unbox(this.taskId);
		},
		design(): string
		{
			if (!this.isEnabled)
			{
				return ChipDesign.ShadowDisabled;
			}

			return ChipDesign.ShadowNoAccent;
		},
		tooltip(): ?Function
		{
			if (this.isEnabled)
			{
				return null;
			}

			return (): HintParams => tooltip({
				text: this.loc('TASKS_V2_TEMPLATE_HISTORY_CHIP_HINT'),
				popupOptions: {
					offsetLeft: this.$el.offsetWidth / 2,
					targetContainer: document.querySelector(`[data-task-card-scroll="${this.taskId}"]`),
				},
				timeout: 200,
			});
		},
	},
	watch: {
		isEnabled(): void
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
			if (!this.isEnabled)
			{
				return;
			}

			EventEmitter.emit(EventName.OpenTemplateHistory, { templateId: this.templateId });
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
			const el = this.$refs.chip?.$el;
			if (!el)
			{
				return;
			}

			Dom.attr(el, 'role', 'button');
			Dom.attr(el, 'aria-disabled', this.isEnabled ? null : 'true');
		},
	},
	template: `
		<Chip
			ref="chip"
			v-hint="tooltip"
			class="tasks-field-template-history-chip"
			data-testid="tasks-template-history-chip"
			:text="loc('TASKS_V2_TEMPLATE_HISTORY_CHIP_TITLE')"
			:icon="Outline.FILE_WITH_CLOCK"
			:design="design"
			@click="handleClick"
			@keydown="handleKeydown"
		/>
	`,
};

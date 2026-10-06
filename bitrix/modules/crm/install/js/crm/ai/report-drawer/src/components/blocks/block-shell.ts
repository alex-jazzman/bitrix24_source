import { defineComponent, PropType } from 'ui.vue3';
import { Type } from 'main.core';

import { Search } from '../elements/search';

export const BlockShell = defineComponent({
	name: 'BlockShell',

	components: {
		Search,
	},

	props: {
		title: {
			type: String,
			required: true,
		},
		iconClass: {
			type: String,
			default: '',
		},
		searchArea: {
			type: Object as PropType<HTMLElement | null>,
			default: null,
		},
		initiallyMinimized: {
			type: Boolean,
		},
	},

	computed: {
		hasSearchArea(): boolean
		{
			return this.searchArea instanceof HTMLElement;
		},
	},

	data(): { isMinimized: boolean }
	{
		return {
			isMinimized: this.initiallyMinimized,
		};
	},

	methods: {
		toggleContentSpoiler(): void
		{
			this.isMinimized = !this.isMinimized;
		},

		handleHeaderClick(event: MouseEvent): void
		{
			if (
				Type.isElementNode(event.target)
				&& (
					Boolean(event.target.closest('.crm-ai-report-drawer__content-block-header-search'))
					|| Boolean(event.target.closest('.crm-ai-report-drawer__content-block-header-control'))
				)
			)
			{
				return;
			}

			this.toggleContentSpoiler();
		},
	},

	template: `
		<div class="crm-ai-report-drawer__content-block --ui-context-content-light">
				<div
					:class="[
						'crm-ai-report-drawer__content-block-header',
						isMinimized ? '--minimized' : '',
						'crm-ai-report-drawer__spoiler-toggle-trigger',
					]"
					@click="handleHeaderClick"
				>
				<div class="crm-ai-report-drawer__content-block-header-main">
					<div class="crm-ai-report-drawer__content-block-header-title-block">
						<span v-if="iconClass" :class="iconClass" />
						<h4 class="crm-ai-report-drawer__content-block-header-title ui-typography-heading-h4">
							{{ title }}
						</h4>
					</div>
					<div v-if="$slots.headerMeta" class="crm-ai-report-drawer__content-block-header-meta">
						<slot name="headerMeta" />
					</div>
				</div>
				<div class="crm-ai-report-drawer__content-block-header-search-block">
					<div v-if="$slots.headerControls" class="crm-ai-report-drawer__content-block-header-control">
						<slot name="headerControls" />
					</div>
					<Search v-show="!isMinimized && hasSearchArea" :searchArea="searchArea" />
					<div class="crm-ai-report-drawer__spoiler-chevron" />
				</div>
			</div>
			<div :class="['crm-ai-report-drawer__spoiler-content', isMinimized ? '--hidden' : '']">
				<div class="crm-ai-report-drawer__spoiler-content-inner">
					<div v-if="$slots.contentMeta" class="crm-ai-report-drawer__content-block-content-meta">
						<slot name="contentMeta" />
					</div>
					<div class="crm-ai-report-drawer__content-block-body ui-typography-text-lg">
						<slot />
						<div v-if="$slots.footer" class="crm-ai-report-drawer__content-block-footer">
							<slot name="footer" />
						</div>
					</div>
				</div>
			</div>
		</div>
	`,
});

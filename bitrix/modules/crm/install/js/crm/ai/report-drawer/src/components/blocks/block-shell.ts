import { defineComponent, PropType } from 'ui.vue3';
import { Text, Type } from 'main.core';

import { Search } from '../elements/search';

export const BlockShell = defineComponent({
	name: 'BlockShell',

	components: {
		Search,
	},

	props: {
		testIdPrefix: {
			type: String,
			required: true,
		},
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

	data(): { isMinimized: boolean, contentId: string, titleId: string }
	{
		const id = Text.getRandom();

		return {
			isMinimized: this.initiallyMinimized,
			contentId: `crm-ai-report-drawer-block-content-${id}`,
			titleId: `crm-ai-report-drawer-block-title-${id}`,
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
		<div class="crm-ai-report-drawer__content-block --ui-context-content-light" :data-testid="testIdPrefix">
			<div
				:class="[
					'crm-ai-report-drawer__content-block-header',
					isMinimized ? '--minimized' : '',
					'crm-ai-report-drawer__spoiler-toggle-trigger',
				]"
				@click="handleHeaderClick"
				:data-testid="testIdPrefix + '-header'"
			>
				<div class="crm-ai-report-drawer__content-block-header-main">
					<div class="crm-ai-report-drawer__content-block-header-title-block">
						<span v-if="iconClass" :class="iconClass" />
						<h4
							:id="titleId"
							:data-testid="testIdPrefix + '-title'"
							class="crm-ai-report-drawer__content-block-header-title ui-typography-heading-h4"
						>
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
					<Search
						v-show="!isMinimized && hasSearchArea"
						:searchArea="searchArea"
						:testIdPrefix="testIdPrefix"
					/>
					<button
						type="button"
						class="crm-ai-report-drawer__spoiler-toggle-trigger"
						:data-testid="testIdPrefix + '-spoiler-toggle'"
						:aria-expanded="!isMinimized"
						:aria-controls="contentId"
						:aria-labelledby="titleId"
						@click.stop="toggleContentSpoiler"
					>
						<span class="crm-ai-report-drawer__spoiler-chevron" aria-hidden="true" />
					</button>
				</div>
			</div>
			<div
				:id="contentId"
				:class="['crm-ai-report-drawer__spoiler-content', isMinimized ? '--hidden' : '']"
				:aria-hidden="isMinimized ? 'true' : 'false'"
				:inert="isMinimized"
				:data-testid="testIdPrefix + '-content'"
			>
				<div class="crm-ai-report-drawer__spoiler-content-inner">
					<div v-if="$slots.contentMeta" class="crm-ai-report-drawer__content-block-content-meta">
						<slot name="contentMeta" />
					</div>
					<div class="crm-ai-report-drawer__content-block-body ui-typography-text-lg">
						<slot />
						<div v-if="$slots.contentNote" class="crm-ai-report-drawer__content-block-note">
							<slot name="contentNote" />
						</div>
						<div v-if="$slots.footer" class="crm-ai-report-drawer__content-block-footer" :data-testid="testIdPrefix + '-footer-shell'">
							<slot name="footer" />
						</div>
					</div>
				</div>
			</div>
		</div>
	`,
});

import { defineComponent, PropType } from 'ui.vue3';
import { Dom, Type } from 'main.core';
import { Search } from '../elements/search';

import { BlockData } from '../../types';

export const Block = defineComponent({
	name: 'Block',

	components: {
		Search,
	},

	props: {
		blockData: {
			type: Object as PropType<BlockData>,
			required: true,
		},
	},

	computed: {
		hasAiLanguage(): boolean
		{
			return (
				!Type.isNull(this.blockData.aiLanguage)
				&& this.blockData.aiLanguage.trim() !== ''
			);
		},

		iconClass(): string
		{
			if (this.blockData.blockType === 'summary')
			{
				return 'crm-ai-report-drawer__content-block-header-summary-icon';
			}
			else if (this.blockData.blockType === 'transcription')
			{
				return 'crm-ai-report-drawer__content-block-header-transcription-icon';
			}

			return '';
		},
	},

	data(): { searchArea: null | HTMLElement, isMinimized: boolean }
	{
		return {
			searchArea: null,
			isMinimized: this.blockData.minimized,
		};
	},

	methods: {
		toggleSpoiler(element: HTMLElement): void
		{
			this.isMinimized = !this.isMinimized;
			Dom.toggleClass(element, '--hidden');
		},
	},

	mounted(): void
	{
		this.searchArea = this.$refs.textContainer as HTMLElement;
	},

	template: `
		<div class="crm-ai-report-drawer__content-block --ui-context-content-light">
			<div :class="['crm-ai-report-drawer__content-block-header', isMinimized ? '--minimized' : '']">
				<div class="crm-ai-report-drawer__content-block-header-title-block">
					<span :class="iconClass" />
					<h4 class="crm-ai-report-drawer__content-block-header-title ui-typography-heading-h4">
						{{ blockData.title }}
					</h4>
				</div>
				<div class="crm-ai-report-drawer__content-block-header-search-block">
					<Search v-show="!isMinimized" :searchArea="searchArea" />
					<div class="crm-ai-report-drawer__spoiler-chevron" @click="this.toggleSpoiler(this.$refs.spoilerContainer)"/>
				</div>
			</div>
			<div :class="['crm-ai-report-drawer__spoiler-content', isMinimized ? '--hidden' : '']" ref="spoilerContainer">
				<div class="crm-ai-report-drawer__spoiler-content-inner">
					<div class="crm-ai-report-drawer__content-block-body ui-typography-text-lg">
						<p :class="[blockData.blockType === 'transcription' ? 'crm-ai-report-drawer__text-transcription' : '']" ref="textContainer">
							{{ blockData.text }}
						</p>
						<div
							class="crm-ai-report-drawer__content-block-message ui-typography-text-sm"
							v-if="hasAiLanguage"
							v-html="blockData.aiLanguage"
						/>
					</div>
				</div>
			</div>
		</div>
	`,
})

import { type JsonObject } from 'main.core';
import { Chip, ChipDesign, ChipSize } from 'ui.system.chip.vue';
import { BIcon, Outline as OutlineIcons } from 'ui.icon-set.api.vue';

import { SourceListSlider } from './components/list-slider/list-slider.js';

import './list-button.css';

// @vue/component
export const SourceListButton = {
	name: 'SourceListButton',
	components: { Chip, SourceListSlider, BIcon },
	props: {
		messageBlocks: {
			type: Array,
			required: true,
		},
	},
	data(): JsonObject
	{
		return {
			showSlider: false,
		};
	},
	computed: {
		ChipSize: () => ChipSize,
		ChipDesign: () => ChipDesign,
		OutlineIcons: () => OutlineIcons,
		hasSources(): boolean
		{
			return this.messageBlocks.some((block) => {
				return block.sources && Object.keys(block.sources).length > 0;
			});
		},
	},
	methods: {
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<span
			v-if="hasSources"
			:title="loc('IM_MESSAGE_BUILDER_SOURCES_BUTTON')"
			class="bx-im-message-source-list-button__container --ui-hoverable" 
			@click="showSlider = true"
		>
			<BIcon :name="OutlineIcons.EARTH" />
			<span class="--ellipsis">{{ loc('IM_MESSAGE_BUILDER_SOURCES_BUTTON') }}</span>
		</span>
		<SourceListSlider v-if="showSlider" :messageBlocks="messageBlocks" @close="showSlider = false"/>
	`,
};

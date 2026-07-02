import { Chip, ChipDesign, ChipSize } from 'ui.system.chip.vue';

import { horizontalScroll } from 'im.v2.lib.directives';

import { ALL_SECTIONS_ID } from 'imopenlines.v2.lib.quick-reply';

import './css/quick-reply-filters.css';

// @vue/component
export const QuickReplyFilters = {
	name: 'QuickReplyFilters',
	components: { Chip },
	directives: { horizontalScroll },
	props: {
		sections: {
			type: Array,
			default: () => [],
		},
		activeSectionId: {
			type: Number,
			default: ALL_SECTIONS_ID,
		},
	},
	emits: ['select'],
	computed: {
		ChipSize: () => ChipSize,
	},
	methods: {
		getChipDesign(sectionId: number): string
		{
			return sectionId === this.activeSectionId ? ChipDesign.OutlineAccent : ChipDesign.Outline;
		},
	},
	template: `
		<div v-horizontal-scroll class="bx-imol-quick-reply-popup__filters">
			<Chip
				v-for="section in sections"
				:key="section.id"
				:size="ChipSize.Sm"
				:design="getChipDesign(section.id)"
				:text="section.name"
				:rounded="true"
				@click="$emit('select', section.id)"
			/>
		</div>
	`,
};

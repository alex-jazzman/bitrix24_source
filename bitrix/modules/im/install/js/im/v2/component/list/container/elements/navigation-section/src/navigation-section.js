import { ChipDesign, ChipSize, Chip } from 'ui.system.chip.vue';

import { CounterManager } from 'im.v2.lib.counter';

import './css/navigation-section.css';

type ChipDesignItem = $Values<typeof ChipDesign>;

// @vue/component
export const NavigationSection = {
	name: 'NavigationSection',
	components: { Chip },
	props: {
		text: {
			type: String,
			required: true,
		},
		isSelected: {
			type: Boolean,
			required: true,
		},
		counter: {
			type: Number,
			default: 0,
		},
	},
	computed: {
		ChipSize: () => ChipSize,
		chipDesign(): ChipDesignItem
		{
			if (this.isSelected)
			{
				return ChipDesign.OutlineAccent2;
			}

			return ChipDesign.OutlineNoAccent;
		},
		formattedCounter(): string
		{
			return CounterManager.formatCounter(this.counter);
		},
	},
	template: `
		<div class="bx-im-list-container-navigation-section__container" :class="{ '--selected': isSelected }">
			<Chip
				:text="text"
				:rounded="true"
				:size="ChipSize.Md"
				:design="chipDesign"
			/>
			<div v-if="counter > 0" class="bx-im-list-container-navigation-section__counter">{{ formattedCounter }}</div>
		</div>
	`,
};

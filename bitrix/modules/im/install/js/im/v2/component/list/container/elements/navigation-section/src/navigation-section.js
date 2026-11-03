import { ChipDesign, ChipSize, Chip } from 'ui.system.chip.vue';

import { CounterManager } from 'im.v2.lib.counter';
import { Utils } from 'im.v2.lib.utils';

import './css/navigation-section.css';

type ChipDesignItem = $Values<typeof ChipDesign>;

const TAB_ROLE = 'tab';
const BUTTON_ROLE = 'button';
const ACTIVATION_KEY = 'Space';

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
		semanticRole: {
			type: String,
			default: null,
		},
		rootId: {
			type: String,
			default: null,
		},
		controls: {
			type: String,
			default: null,
		},
		rootTabIndex: {
			type: Number,
			default: null,
		},
		// Test id of the focusable chip. An attribute on the tag lands on the section wrapper instead,
		// which is where the other consumer of the section keeps its own label.
		rootTestId: {
			type: String,
			default: null,
		},
	},
	emits: ['activate'],
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
		chipRole(): string
		{
			return this.semanticRole ?? BUTTON_ROLE;
		},
		ariaCurrent(): ?boolean
		{
			// a tab announces its state through aria-selected, aria-current would duplicate it
			return this.semanticRole === TAB_ROLE ? null : this.isSelected;
		},
		ariaSelected(): ?boolean
		{
			// the mirror of ariaCurrent: outside a tab set the same state is announced by aria-current
			return this.semanticRole === TAB_ROLE ? this.isSelected : null;
		},
		tabIndexAttribute(): { tabindex?: number }
		{
			// an attribute bound to null strips the tabindex="0" of the Chip template instead of keeping it
			return this.rootTabIndex === null ? {} : { tabindex: this.rootTabIndex };
		},
		formattedCounter(): string
		{
			return CounterManager.formatCounter(this.counter);
		},
	},
	methods: {
		handleChipKeydown(event: KeyboardEvent): void
		{
			// Enter arrives as the click event of the Chip, a second handler here would activate twice.
			// Exact comparison, the same helper the recipient list of the forward window uses: a held
			// modifier means the user is after something else, and Shift+Space keeps its native meaning.
			if (!Utils.key.isExactCombination(event, ACTIVATION_KEY))
			{
				return;
			}

			event.preventDefault();
			this.$emit('activate');
		},
		handleContainerClick(event: MouseEvent): void
		{
			// a click on the Chip bubbles here and is already reported by its own click event
			if (this.$refs.chip.$el.contains(event.target))
			{
				return;
			}

			this.$emit('activate');
		},
	},
	template: `
		<div
			class="bx-im-list-container-navigation-section__container"
			:class="{ '--selected': isSelected }"
			@click="handleContainerClick"
		>
			<Chip
				ref="chip"
				:text="text"
				:rounded="true"
				:size="ChipSize.Md"
				:design="chipDesign"
				:id="rootId"
				:role="chipRole"
				:aria-controls="controls"
				:aria-selected="ariaSelected"
				:aria-current="ariaCurrent"
				v-bind="tabIndexAttribute"
				:data-testid="rootTestId"
				@click="$emit('activate')"
				@keydown="handleChipKeydown"
			/>
			<div v-if="counter > 0" class="bx-im-list-container-navigation-section__counter">{{ formattedCounter }}</div>
		</div>
	`,
};

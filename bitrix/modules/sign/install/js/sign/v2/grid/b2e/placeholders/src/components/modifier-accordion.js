import { Loc } from 'main.core';
import { Chip, ChipDesign, ChipSize } from 'ui.system.chip.vue';
import { Text2Xs } from 'ui.system.typography.vue';

import type { ModifierGroup, ModifierVariant } from '../modifiers/types';

/**
 * One group of the catalog: its label and a row of chips. Phrases are the only text here - a field name
 * or its code never reaches the accordion.
 */
// @vue/component
const ModifierGroupChips = {
	name: 'SignPlaceholderModifierGroup',
	components: {
		Chip,
		Text2Xs,
	},
	props: {
		group: {
			/** @type ModifierGroup */
			type: Object,
			required: true,
		},
		/** Chosen variant of the group; `null` means the group keeps its base variant. */
		selected: {
			/** @type ModifierVariant | null */
			type: Object,
			default: null,
		},
	},
	emits: ['select'],
	setup(): Object
	{
		return { ChipSize };
	},
	methods: {
		label(phraseCode: string): string
		{
			return Loc.getMessage(phraseCode);
		},
		groupTestId(): string
		{
			return `sign-placeholder-modifier-group-${this.group.id}`;
		},
		testId(variant: ModifierVariant): string
		{
			return `sign-placeholder-modifier-${this.group.id}-${variant.id}`;
		},
		isSelected(variant: ModifierVariant): boolean
		{
			return this.selected === null
				? variant.parameters.length === 0
				: this.selected.id === variant.id
			;
		},
		// The chip has no "selected" prop: the state is the design it is drawn with.
		design(variant: ModifierVariant): string
		{
			return this.isSelected(variant) ? ChipDesign.Tinted : ChipDesign.OutlineNoAccent;
		},
	},
	/**
	 * The chip is a single-node component without `inheritAttrs: false`, so the role and the pressed
	 * state travel to its root along with the test identifier. Activation by Space stays out of reach:
	 * the keydown handler of the chip belongs to the design system and answers Enter alone.
	 */
	template: `
		<div class="sign-placeholders-modifier-group" :data-testid="groupTestId()">
			<Text2Xs class-name="sign-placeholders-modifier-group-title">{{ label(group.labelKey) }}</Text2Xs>
			<div
				class="sign-placeholders-modifier-group-chips"
				role="group"
				:aria-label="label(group.labelKey)"
			>
				<Chip
					v-for="variant in group.variants"
					:key="variant.id"
					:text="label(variant.labelKey)"
					:size="ChipSize.Xs"
					:design="design(variant)"
					role="button"
					:aria-pressed="isSelected(variant)"
					:data-testid="testId(variant)"
					@click="$emit('select', variant)"
				/>
			</div>
		</div>
	`,
};

// @vue/component
export const ModifierAccordion = {
	name: 'SignPlaceholderModifierAccordion',
	components: {
		ModifierGroupChips,
	},
	props: {
		/** Groups the type of the field is offered, in catalog order. */
		groups: {
			/** @type ModifierGroup[] */
			type: Array,
			required: true,
		},
		/** Chips drawn as chosen right now. */
		selection: {
			/** @type ModifierSelection */
			type: Object,
			default: (): Object => ({}),
		},
	},
	emits: ['select'],
	methods: {
		selectedVariant(group: ModifierGroup): ModifierVariant | null
		{
			return this.selection[group.id] ?? null;
		},
		handleSelect(group: ModifierGroup, variant: ModifierVariant): void
		{
			this.$emit('select', { group, variant });
		},
	},
	template: `
		<div class="sign-placeholders-modifier-accordion" data-testid="sign-placeholder-modifier-accordion">
			<ModifierGroupChips
				v-for="group in groups"
				:key="group.id"
				:group="group"
				:selected="selectedVariant(group)"
				@select="handleSelect(group, $event)"
			/>
		</div>
	`,
};

import { defineComponent } from 'ui.vue3';
import { locMixin } from 'ui.vue3.mixins.loc-mixin';
import { Switcher } from 'ui.vue3.components.switcher';
import { TextSm, TextXs } from 'ui.system.typography.vue';

import { getToggleAriaState } from '../../lib/get-toggle-aria-state/get-toggle-aria-state';

import './option-row.css';

// One settings row of a hub card: an optional switch, a title, a description and a right-hand slot.
// With `checked: null` the switch is not rendered at all and the row becomes a plain
// "title + description + action" line (the secondary-options block under the feature cards).
export const CrmHubOptionRow = defineComponent({
	name: 'CrmHubOptionRow',
	components: { Switcher, TextSm, TextXs },
	mixins: [locMixin],
	props: {
		rowId: {
			type: String,
			required: true,
		},
		// Phrase code. Rows whose label is data, not a phrase, use titleText instead.
		title: {
			type: String,
			default: '',
		},
		description: {
			type: String,
			default: '',
		},
		// Already-localized text. Rows whose label is data rather than a phrase (relation catalog
		// titles come from the server already translated) pass these instead of a phrase code:
		// loc() on a non-code returns an empty string, which silently blanked the label.
		titleText: {
			type: String,
			default: '',
		},
		descriptionText: {
			type: String,
			default: '',
		},
		// null = the row carries no switch at all (not "unchecked").
		checked: {
			type: Boolean,
			default: null,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		last: {
			type: Boolean,
			default: false,
		},
		testId: {
			type: String,
			default: '',
		},
	},
	emits: ['update'],
	computed: {
		resolvedTitle(): string
		{
			return this.titleText || this.loc(this.title);
		},
		resolvedDescription(): string
		{
			return this.descriptionText || (this.description ? this.loc(this.description) : '');
		},
		hasToggle(): boolean
		{
			return this.checked !== null;
		},
		labelId(): string
		{
			return `crm-settings-hub-option-${this.rowId}-label`;
		},
		descriptionId(): string
		{
			return `crm-settings-hub-option-${this.rowId}-description`;
		},
		describedBy(): string | null
		{
			return this.resolvedDescription ? this.descriptionId : null;
		},
		ariaState(): { role: 'switch', ariaChecked: 'true' | 'false' }
		{
			return getToggleAriaState(Boolean(this.checked));
		},
	},
	methods: {
		handleRowClick(): void
		{
			// Inlined `this.checked === null` rather than reusing the `hasToggle` computed: methods
			// here are unit-tested by poking `this` by hand (no reactive instance), so a method must
			// stand on its own props and not assume a sibling computed is wired up on `this`.
			if (this.disabled || this.checked === null)
			{
				return;
			}

			this.$emit('update', !this.checked);
		},
		handleKeydown(event: KeyboardEvent): void
		{
			if (this.disabled || this.checked === null || !['Enter', ' '].includes(event.key))
			{
				return;
			}

			event.preventDefault();
			this.$emit('update', !this.checked);
		},
		// `<Switcher>` is a controlled component: clicking it reverts its own optimistic toggle
		// internally and relies on the parent driving state through these emits (see
		// ui.vue3.components.switcher's handlers.checked/unchecked). Wired the same way
		// feature-card.ts wires its own switch.
		handleCheck(): void
		{
			this.$emit('update', true);
		},
		handleUncheck(): void
		{
			this.$emit('update', false);
		},
	},
	template: `
		<div
			class="crm-settings-hub-option-row"
			:class="{ '--last': last, '--disabled': disabled, '--interactive': hasToggle && !disabled }"
			:data-testid="testId || null"
		>
			<div class="crm-settings-hub-option-row__main" @click="handleRowClick">
				<div
					v-if="hasToggle"
					class="crm-settings-hub-option-row__switch"
					:tabindex="disabled ? -1 : 0"
					:role="ariaState.role"
					:aria-checked="ariaState.ariaChecked"
					:aria-labelledby="labelId"
					:aria-describedby="describedBy"
					@keydown="handleKeydown"
					@click.stop
				>
					<Switcher
						:is-checked="Boolean(checked)"
						:is-disabled="disabled"
						:options="{ size: 'small', showStateTitle: false }"
						aria-hidden="true"
						@check="handleCheck"
						@uncheck="handleUncheck"
					/>
				</div>
				<div class="crm-settings-hub-option-row__body">
					<TextSm :id="labelId" class="crm-settings-hub-option-row__title">{{ resolvedTitle }}</TextSm>
					<TextXs
						v-if="resolvedDescription"
						:id="descriptionId"
						class="crm-settings-hub-option-row__description"
					>{{ resolvedDescription }}</TextXs>
				</div>
				<div v-if="$slots.action" class="crm-settings-hub-option-row__action" @click.stop>
					<slot name="action"/>
				</div>
			</div>
			<div v-if="$slots.details" class="crm-settings-hub-option-row__details">
				<slot name="details"/>
			</div>
		</div>
	`,
});

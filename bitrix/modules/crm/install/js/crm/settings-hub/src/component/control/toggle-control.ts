import { defineComponent, type PropType } from 'ui.vue3';
import { locMixin } from 'ui.vue3.mixins.loc-mixin';
import { Switcher } from 'ui.vue3.components.switcher';
import { TextSm, TextXs } from 'ui.system.typography.vue';

import { type ScalarRecord } from '../../const/record';
import { getToggleAriaState } from '../../lib/get-toggle-aria-state/get-toggle-aria-state';

export const CrmHubToggleControl = defineComponent({
	name: 'CrmHubToggleControl',
	components: { Switcher, TextSm, TextXs },
	mixins: [locMixin],
	props: {
		descriptor: {
			type: Object as PropType<ScalarRecord>,
			required: true,
		},
		snapshot: {
			type: Object as PropType<Record<string, unknown>>,
			required: true,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		reason: {
			type: String,
			default: '',
		},
		description: {
			type: String,
			default: '',
		},
	},
	emits: ['update'],
	computed: {
		isChecked(): boolean
		{
			return Boolean(this.snapshot[this.descriptor.valueKey]);
		},
		labelId(): string
		{
			return `crm-settings-hub-${this.descriptor.id}-label`;
		},
		hintId(): string
		{
			return `crm-settings-hub-${this.descriptor.id}-hint`;
		},
		descriptionId(): string
		{
			return `crm-settings-hub-${this.descriptor.id}-description`;
		},
		describedBy(): string | null
		{
			const ids: string[] = [];
			if (this.description)
			{
				ids.push(this.descriptionId);
			}

			if (this.reason)
			{
				ids.push(this.hintId);
			}

			return ids.length > 0 ? ids.join(' ') : null;
		},
		ariaState(): { role: 'switch', ariaChecked: 'true' | 'false' }
		{
			return getToggleAriaState(this.isChecked);
		},
	},
	methods: {
		handleCheck(): void
		{
			this.$emit('update', true);
		},
		handleUncheck(): void
		{
			this.$emit('update', false);
		},
		handleKeydown(event: KeyboardEvent): void
		{
			if (this.disabled || !['Enter', ' '].includes(event.key))
			{
				return;
			}

			event.preventDefault();
			this.$emit('update', !this.isChecked);
		},
	},
	template: `
		<div
			class="crm-settings-hub-toggle-control"
			:class="{ '--disabled': disabled }"
			role="group"
			:aria-labelledby="labelId"
			:aria-describedby="describedBy"
		>
			<div class="crm-settings-hub-toggle-control__row">
				<TextSm :id="labelId" class="crm-settings-hub-toggle-control__label">{{ loc(descriptor.title) }}</TextSm>
				<div
					class="crm-settings-hub-toggle-control__switch"
					:class="{ '--disabled': disabled }"
					:tabindex="disabled ? -1 : 0"
					:role="ariaState.role"
					:aria-checked="ariaState.ariaChecked"
					:aria-labelledby="labelId"
					:aria-describedby="describedBy"
					data-testid="crm-settings-hub-toggle-control-switch"
					@keydown="handleKeydown"
				>
					<Switcher
						:is-checked="isChecked"
						:is-disabled="disabled"
						:options="{ size: 'small', showStateTitle: false }"
						aria-hidden="true"
						@check="handleCheck"
						@uncheck="handleUncheck"
					/>
				</div>
			</div>
			<TextXs v-if="description" :id="descriptionId" class="crm-settings-hub-toggle-control__description">{{ loc(description) }}</TextXs>
			<TextXs v-if="reason" :id="hintId" class="crm-settings-hub-toggle-control__hint">{{ loc(reason) }}</TextXs>
		</div>
	`,
});

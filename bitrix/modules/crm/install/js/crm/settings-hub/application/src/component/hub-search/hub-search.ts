import { defineComponent } from 'ui.vue3';
import { locMixin } from 'ui.vue3.mixins.loc-mixin';
import { BInput, InputDesign, InputSize } from 'ui.system.input.vue';

export const CrmSettingsHubHubSearch = defineComponent({
	name: 'CrmSettingsHubHubSearch',
	components: { BInput },
	mixins: [locMixin],
	props: {
		modelValue: {
			type: String,
			required: true,
		},
	},
	emits: ['update:modelValue', 'clear', 'focus'],
	setup(): Object
	{
		return { InputDesign, InputSize };
	},
	computed: {
		placeholderText(): string
		{
			return this.loc('CRM_SETTINGS_HUB_SEARCH_PLACEHOLDER');
		},
	},
	template: `
		<div
			class="crm-settings-hub-application__search"
			data-testid="crm-settings-hub-application-search-input"
			role="search"
		>
			<BInput
				:model-value="modelValue"
				:placeholder="placeholderText"
				:aria-label="placeholderText"
				type="search"
				:size="InputSize.Lg"
				:design="InputDesign.Grey"
				:with-search="true"
				:with-clear="modelValue !== ''"
				:stretched="true"
				@update:model-value="$emit('update:modelValue', $event)"
				@clear="$emit('clear')"
				@focus="$emit('focus')"
			/>
		</div>
	`,
});

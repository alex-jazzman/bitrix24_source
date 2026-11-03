import { defineComponent } from 'ui.vue3';
import { locMixin } from 'ui.vue3.mixins.loc-mixin';
import { BInput } from 'ui.system.input.vue';
import { HeadlineMd, TextXs } from 'ui.system.typography.vue';

import './passport-card.css';

export const CrmHubPassportCard = defineComponent({
	name: 'CrmHubPassportCard',
	components: { BInput, HeadlineMd, TextXs },
	mixins: [locMixin],
	props: {
		title: {
			type: String,
			default: '',
		},
		titleLabel: {
			type: String,
			default: '',
		},
		placeholder: {
			type: String,
			default: '',
		},
		subtitle: {
			type: String,
			default: '',
		},
		readOnly: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['update:title'],
	methods: {
		handleTitleInput(value: string): void
		{
			this.$emit('update:title', value);
		},
	},
	template: `
		<div class="crm-settings-hub-passport-card">
			<BInput
				v-if="!readOnly"
				:model-value="title"
				:label="titleLabel ? loc(titleLabel) : ''"
				:aria-label="titleLabel ? loc(titleLabel) : ''"
				:placeholder="placeholder"
				data-testid="crm-settings-hub-passport-input"
				stretched
				@update:modelValue="handleTitleInput"
			/>
			<HeadlineMd v-else class="crm-settings-hub-passport-card__title">{{ title }}</HeadlineMd>
			<TextXs v-if="subtitle" class="crm-settings-hub-passport-card__subtitle">{{ subtitle }}</TextXs>
		</div>
	`,
});

import { defineComponent, type PropType } from 'ui.vue3';
import { locMixin } from 'ui.vue3.mixins.loc-mixin';
import { Button as UiButton, AirButtonStyle, ButtonSize } from 'ui.vue3.components.button';
import { TextSm, TextXs } from 'ui.system.typography.vue';

import { type NavigationRecord } from '../../const/record';

export const CrmHubNavigationControl = defineComponent({
	name: 'CrmHubNavigationControl',
	components: { UiButton, TextSm, TextXs },
	mixins: [locMixin],
	props: {
		descriptor: {
			type: Object as PropType<NavigationRecord>,
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
	},
	emits: ['action'],
	setup(): Object
	{
		return { AirButtonStyle, ButtonSize };
	},
	computed: {
		labelId(): string
		{
			return `crm-settings-hub-${this.descriptor.id}-label`;
		},
		hintId(): string
		{
			return `crm-settings-hub-${this.descriptor.id}-hint`;
		},
	},
	methods: {
		handleClick(): void
		{
			this.$emit('action');
		},
	},
	template: `
		<div
			class="crm-settings-hub-navigation-control"
			:class="{ '--disabled': disabled }"
			role="group"
			:aria-labelledby="labelId"
			:aria-describedby="reason ? hintId : null"
		>
			<div class="crm-settings-hub-navigation-control__row">
				<TextSm :id="labelId" class="crm-settings-hub-navigation-control__label">{{ loc(descriptor.title) }}</TextSm>
				<UiButton
					:text="loc(descriptor.title)"
					:size="ButtonSize.SMALL"
					:style="AirButtonStyle.OUTLINE"
					:disabled="disabled"
					:dataset="{ testid: 'crm-settings-hub-navigation-control-button' }"
					@click="handleClick"
				/>
			</div>
			<TextXs v-if="reason" :id="hintId" class="crm-settings-hub-navigation-control__hint">{{ loc(reason) }}</TextXs>
		</div>
	`,
});

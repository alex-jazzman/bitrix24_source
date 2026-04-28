import { BIcon, Outline } from 'ui.icon-set.api.vue';
import './base-group-action-bar.css';

// @vue/component
export const BaseGroupActionBar = {
	name: 'BaseGroupActionBar',
	components: {
		BIcon,
	},
	props: {
		count: {
			type: Number,
			required: true,
		},
	},
	emits: ['close'],
	setup(): { Outline: typeof Outline }
	{
		return {
			Outline,
		};
	},
	computed: {
		title(): string
		{
			return this.loc('BOOKING_SRE_GROUP_ACTION_BAR_TITLE', {
				'#COUNT#': this.count,
			});
		},
	},
	template: `
		<div class="booking-sku-resources-editor__base-group-action-bar">
			<div class="booking-sku-resources-editor__base-group-action-bar__title_wrapper">
				<span class="booking-sku-resources-editor__base-group-action-bar__title">{{ title }}</span>
				<BIcon
					class="booking-sku-resources-editor__base-group-action-bar__close-icon"
					:name="Outline.CROSS_L"
					:size="16"
					color="rgba(var(--ui-color-on-primary-rgb), 0.8)"
					@click="$emit('close')"
				/>
				<div class="booking-sku-resources-editor__divider-vertical"></div>
			</div>
			<slot/>
		</div>
	`,
};

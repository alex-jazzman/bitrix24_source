import { Text2Xs } from 'ui.system.typography.vue';
import { BIcon, Outline } from 'ui.icon-set.api.vue';

export const AlertDesign = Object.freeze({
	tinted: 'tinted',
	tintedSuccess: 'tinted-success',
	tintedWarning: 'tinted-warning',
	tintedAlert: 'tinted-alert',
});

// todo: Remove after adding dependency on ui 26.200.0

import './alert.css';

export const Alert = {
	name: 'Alert',
	components: {
		Text2Xs,
		BIcon,
	},
	props: {
		design: {
			type: String,
			required: false,
			default: AlertDesign.tinted,
			validator: (value) => {
				return Object.values(AlertDesign).includes(value);
			},
		},
		leftImage: {
			type: String,
			required: false,
			default: null,
		},
	},
	computed: {
		closeIcon(): string
		{
			return Outline.CROSS_S;
		},
		rootClasses(): string[]
		{
			return [
				'ui-system-alert',
				'ui-system-alert__scope',
				`--${this.design}`,
				{
					'--has-left-image': Boolean(this.leftImage),
				},
			];
		},
		leftImageStyle(): Object
		{
			if (!this.leftImage)
			{
				return {};
			}

			return {
				'--ui-alert-left-image': `url(${this.leftImage})`,
			};
		},
	},
	template: `
		<div :class="rootClasses" :style="leftImageStyle">
			<div class="ui-system-alert-inner">
				<div class="ui-system-alert__left-image"></div>
				<div class="ui-system-alert__content">
					<Text2Xs>
						<slot></slot>
					</Text2Xs>
				</div>
			</div>
		</div>
	`,
};

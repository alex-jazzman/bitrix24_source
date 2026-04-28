import { AlertDesign } from './alert-design';
import { Text2Xs } from 'ui.system.typography.vue';
import { BIcon, Outline } from 'ui.icon-set.api.vue';

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
		hasCloseButton: {
			type: Boolean,
			required: false,
			default: false,
		},
		leftImage: {
			type: String,
			required: false,
			default: null,
		},
	},
	emits: ['closeButtonClick'],
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
					'--has-close-button': this.hasCloseButton,
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
	methods: {
		handleCloseClick()
		{
			this.$emit('closeButtonClick');
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
			<button
				v-if="hasCloseButton"
				class="ui-system-alert__close-button --ui-hoverable"
				:aria-label="$Bitrix.Loc.getMessage('UI_SYSTEM_ALERT_CLOSE_BUTTON_LABEL_ARIA')"
				:title="closeButtonLabel"
				@click="handleCloseClick"
			>
				<BIcon :name="closeIcon" :size="24" />
			</button>
		</div>
	`,
};

import { Switcher, SwitcherSize } from 'ui.switcher';
import { AdditionalInfoComponent } from './additional-info-component';

export const AiSwitcherComponent = {
	emits: [
		'change',
	],

	components: {
		AdditionalInfoComponent,
	},

	props: {
		checked: {
			type: Boolean,
			required: true,
		},
		readOnly: {
			type: Boolean,
			default: false,
		},
	},

	mounted(): void
	{
		this.renderSwitcher();
	},

	methods: {
		renderSwitcher(): void
		{
			const switcher = new Switcher({
				checked: this.checked,
				disabled: this.readOnly,
				size: SwitcherSize.small,
				showStateTitle: false,
				handlers: {
					checked: (event) => {
						this.emitChange(false);
					},
					unchecked: (event) => {
						this.emitChange(true);
					},
				},
			});

			switcher.renderTo(this.$refs.switcher);
		},
		emitChange(value: boolean): void
		{
			this.$emit('change', value);
		},
	},

	// language=Vue
	template: `
		<div class="crm-repeat-sale__segment-ai-switcher-wrapper">
			<div>
				{{this.$Bitrix.Loc.getMessage('CRM_REPEAT_SALE_SEGMENT_COPILOT_DESCRIPTION')}}
			</div>
			<div class="crm-repeat-sale__segment-ai-switcher" ref="switcher"></div>
		</div>
	`,
};

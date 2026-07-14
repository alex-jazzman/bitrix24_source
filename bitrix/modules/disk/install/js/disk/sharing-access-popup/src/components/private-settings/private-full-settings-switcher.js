import { Type, Loc } from 'main.core';
import { Switcher } from 'ui.switcher';
import { TextXl } from 'ui.system.typography.vue';

export const PrivateAccessFullSettingsSwitcher = {
	name: 'PrivateAccessFullSettingsSwitcher',
	components: { TextXl },
	props: {
		isActive: { type: Boolean, required: true },
	},
	emits: ['toggle'],
	data()
	{
		return {
			switcher: null,
		};
	},
	watch: {
		isActive(next)
		{
			if (!this.switcher)
			{
				return;
			}

			this.switcher.check(next);
		},
	},
	mounted()
	{
		this.initSwitcher();
	},
	beforeUnmount()
	{
		this.destroySwitcher();
	},
	methods: {
		initSwitcher()
		{
			if (this.switcher || !this.$refs.switcherNode)
			{
				return;
			}

			this.switcher = new Switcher({
				node: this.$refs.switcherNode,
				checked: this.isActive,
				size: 'small',
				showStateTitle: false,
				useAirDesign: true,
				handlers: {
					toggled: () => {
						this.$emit('toggle', this.switcher.isChecked());
					},
				},
			});
		},
		destroySwitcher()
		{
			if (!this.switcher)
			{
				return;
			}

			if (Type.isFunction(this.switcher.destroy))
			{
				this.switcher.destroy();
			}

			this.switcher = null;
		},
	},
	template: `
		<div class="access-private-switcher__wrapper">
			<div class="access-private-block__switcher" ref="switcherNode"></div>
			<TextXl
				tag="p"
				className="access-private-block__title"
			>
				${Loc.getMessage('DISK_SHARING_ACCESS_POPUP_PRIVATE_FULL_SETTINGS')}
			</TextXl>
		</div>
	`,
};

import { Switcher } from 'ui.switcher';
import { Type, Loc } from 'main.core';
import { TextXl } from 'ui.system.typography.vue';

// @vue/component
export const PublicAccessHeader = {
	name: 'PublicAccessHeader',
	components: { TextXl },
	props: {
		isActive: { type: Boolean, required: true },
		isDisabled: { type: Boolean, default: false },
		isToggleBlocked: { type: Boolean, default: false },
		isLoading: { type: Boolean, default: false },
	},
	emits: ['toggle', 'blockedToggle'],
	data()
	{
		return {
			switcher: null,
		};
	},
	watch: {
		isActive()
		{
			this.syncSwitcherState();
		},
		isDisabled()
		{
			this.syncSwitcherState();
		},
		isToggleBlocked()
		{
			this.syncSwitcherState();
		},
		isLoading()
		{
			this.syncSwitcherState();
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
				disabled: this.isDisabled || this.isLoading,
				size: 'small',
				showStateTitle: false,
				useAirDesign: true,
				handlers: {
					toggled: () => {
						const nextValue = this.switcher.isChecked();

						if (this.isToggleBlocked)
						{
							this.$emit('blockedToggle', nextValue);
							this.switcher.check(this.isActive, false);

							return;
						}

						this.$emit('toggle', nextValue);
					},
				},
			});

			this.syncSwitcherState();
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
		syncSwitcherState()
		{
			if (!this.switcher)
			{
				return;
			}

			if (this.switcher.isLoading())
			{
				this.switcher.setLoading(false);
			}

			this.switcher.disable(this.isDisabled || this.isLoading, false);
			this.switcher.check(this.isActive, false);
			this.switcher.setLoading(this.isLoading);
		},
	},
	template: `
		<div class="access-public-block__header">
			<div class="access-public-block__switcher" ref="switcherNode"></div>
			<TextXl
				tag="div"
				className="access-public-block__title"
			>
				${Loc.getMessage('DISK_SHARING_ACCESS_POPUP_PUBLIC_SWITCHER_ACTION')}
			</TextXl>
		</div>
	`,
};

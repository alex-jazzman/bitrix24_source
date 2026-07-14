import { TextXs } from 'ui.system.typography.vue';
import { BMenu, type MenuOptions } from 'ui.system.menu.vue';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import { AutoDeleteMessageDelay } from 'socialnetwork.v2.const';

import { getAutoDeleteStatusText } from '../../lib';

import './auto-delete-message-dropdown.css';

// @vue/component
export const AutoDeleteMessageDropdown = {
	name: 'AutoDeleteMessageDropdown',
	components: {
		BIcon,
		BMenu,
		TextXs,
	},
	props: {
		delay: {
			type: Number,
			required: true,
		},
		targetContainer: {
			type: [HTMLElement, null],
			default: null,
		},
	},
	emits: ['change'],
	setup(): Object
	{
		return {
			Outline,
		};
	},
	data(): Object
	{
		return {
			menuOpened: false,
			selectedValue: AutoDeleteMessageDelay.Off,
		};
	},
	computed:
		{
			isEnabled(): boolean
			{
				return this.delay !== AutoDeleteMessageDelay.Off;
			},
			autoDeleteText(): string
			{
				return this.loc(getAutoDeleteStatusText(this.delay));
			},
		},
	beforeUnmount()
	{
		this.menuInstance?.destroy();
	},
	methods: {
		toggleMenu()
		{
			if (this.delay === AutoDeleteMessageDelay.Off)
			{
				return;
			}

			this.menuOpened = !this.menuOpened;
		},
		getMenuOptions(): MenuOptions
		{
			return {
				id: 'sonet-auto-delete-delay-dropdown',
				bindElement: this.$refs.dropdown.$el,
				targetContainer: this.targetContainer || document.body,
				bindOptions: { forceBindPosition: true, position: 'bottom' },
				offsetTop: 6,
				width: 193,
				items: this.getMenuItems(),
			};
		},
		getMenuItems(): Array<{ text: string, onclick: Function }>
		{
			return Object.values(AutoDeleteMessageDelay).map((delay) => {
				return {
					title: this.loc(getAutoDeleteStatusText(delay)),
					isSelected: delay === this.delay,
					onClick: () => this.$emit('change', delay),
				};
			});
		},
	},
	template: `
		<TextXs
			ref="dropdown"
			:className="[
				'socialnetwork--auto-delete-message-dropdown',
				{
					'--enabled': isEnabled
				}
			]"
			@click.stop="toggleMenu"
		>
			{{ autoDeleteText }}
			<BIcon
				:name="Outline.CHEVRON_DOWN_S"
				:class="['socialnetwork--auto-delete-message-dropdown--icon', { '--open': menuOpened }]"
			/>
		</TextXs>
		<BMenu v-if="menuOpened" :options="getMenuOptions()" @close="menuOpened = false"/>
	`,
};

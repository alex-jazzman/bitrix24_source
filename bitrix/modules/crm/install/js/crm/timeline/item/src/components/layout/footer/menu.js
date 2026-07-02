import { Action } from '../../../action';
import { SystemMenu } from '../system-menu';
import { AdditionalButton, AdditionalButtonColor, AdditionalButtonIcon } from './add-button';

const DEFAULT_MENU_WIDTH = 250;

// @vue/component
export const Menu = {
	components: {
		AdditionalButton,
	},
	props: {
		buttons: Array, // buttons that didn't fit into footer
		items: Object, // real menu items
		sections: {
			type: Array,
			default: () => [],
		},
	},
	inject: [
		'isReadOnly',
	],
	computed: {
		isMenuFilled(): boolean
		{
			const menuItems = this.menuItems;

			return menuItems.length > 0;
		},

		itemsArray(): Array
		{
			if (!this.items)
			{
				return [];
			}

			return Object.values(this.items)
				.filter((item) => (item.state !== 'hidden' && item.scope !== 'mobile' && (!this.isReadOnly || !item.hideIfReadonly)))
				.sort((a, b) => (a.sort - b.sort))
			;
		},

		menuItems(): Array
		{
			let result = this.buttons;
			if (this.buttons.length && this.itemsArray.length)
			{
				result.push({delimiter: true});
			}
			result = [...result, ...this.itemsArray];

			return result;
		},

		buttonProps()
		{
			return {
				color: AdditionalButtonColor.DEFAULT,
				icon: AdditionalButtonIcon.DOTS,
			}
		},
	},

	beforeUnmount(): void
	{
		this.menuInstance?.destroy();
		this.menuInstance = null;
	},

	methods: {
		showMenu(): void
		{
			if (this.menuInstance?.isShown())
			{
				this.menuInstance.destroy();
				this.menuInstance = null;

				return;
			}

			this.menuInstance?.destroy();

			const bindElement = this.$el;
			this.menuInstance = SystemMenu.showMenu(
				this,
				{
					items: this.menuItems,
					sections: this.sections ?? [],
				},
				{
					className: 'crm-timeline__card_more-menu',
					bindElement,
					width: DEFAULT_MENU_WIDTH,
					angle: false,
					cacheable: false,
					autoHideHandler: (event: MouseEvent): boolean => !bindElement.contains(event.target),
				},
				(actionData: Object): void => {
					const action = new Action(actionData);
					void action.execute(this);
				},
			);
		},
	},

	// language=Vue
	template: `
		<div 
			v-if="isMenuFilled" 
			class="crm-timeline__card-action_menu-item" 
			@click="showMenu"
		>
			<AdditionalButton iconName="dots" color="default"></AdditionalButton>
		</div>
	`
};

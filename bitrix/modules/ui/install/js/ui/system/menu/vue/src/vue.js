import { Text } from 'main.core';
import { Menu, type MenuOptions, type MenuItemOptions } from 'ui.system.menu';

export { Menu, MenuItemDesign, MenuSectionDesign, MenuRichHeaderDesign } from 'ui.system.menu';
export type { MenuOptions, MenuItemOptions, MenuSectionOptions } from 'ui.system.menu';

export const BMenu = {
	name: 'BMenu',
	props: {
		id: {
			type: String,
			default: () => `ui-vue3-menu-${Text.getRandom()}`,
		},
		options: {
			/** @type MenuOptions */
			type: Object,
			required: true,
		},
	},
	emits: ['close'],
	computed: {
		menuOptions(): MenuOptions
		{
			return { ...this.defaultOptions, ...this.options };
		},
		defaultOptions(): MenuOptions
		{
			return {
				id: this.id,
				cacheable: false,
				animation: 'fading',
				events: {
					onClose: this.handleClose,
					onDestroy: this.handleClose,
				},
			};
		},
	},
	watch: {
		'options.items': {
			deep: true,
			handler(items: MenuItemOptions[]): void
			{
				// The rest of the options belongs to the instance and is read once, but the
				// items are the menu's content: a consumer keeps them in its own state, so
				// they follow it — in place, with the open submenu and the focus preserved.
				this.menu?.updateItems(items);
			},
		},
	},
	mounted(): void
	{
		this.menu = new Menu(this.menuOptions);
		this.menu.show();
	},
	unmounted(): void
	{
		this.menu?.close();
	},
	methods: {
		handleClose(): void
		{
			this.$emit('close');
		},
	},
	template: `
		<div v-if="false"></div>
	`,
};

import { Outline } from 'ui.icon-set.api.vue';
import { BMenu, MenuItemDesign, type MenuItemOptions, type MenuOptions } from 'ui.system.menu.vue';

import { openHelpdeskArticle } from 'im.v2.lib.helpdesk';

import { HELP_ARTICLE_CODE } from './components/create-chat-help';

export type CreateChatMenuAirItem = {
	id: string,
	title: string,
	subtitle?: string,
	design?: string,
	icon: string,
	isLocked?: boolean,
	disabled?: boolean,
};

const MENU_ID = 'im-create-chat-menu';
const MENU_WIDTH = 290;
const MENU_OFFSET_TOP = 4;

const HELP_SECTION_CODE = 'help';
const HELP_ITEM_ID = 'im-create-chat-help';

// @vue/component
export const CreateChatMenuAir = {
	name: 'CreateChatMenuAir',
	components: { BMenu },
	props:
	{
		/** @type CreateChatMenuAirItem[] */
		items: {
			type: Array,
			required: true,
		},
		bindElement: {
			type: HTMLElement,
			default: null,
		},
	},
	emits: ['select', 'close'],
	computed:
	{
		menuOptions(): MenuOptions
		{
			return {
				id: MENU_ID,
				width: MENU_WIDTH,
				offsetTop: MENU_OFFSET_TOP,
				bindElement: this.bindElement,
				// The titleless section is the separator between the ways to create a chat
				// and the article that helps to choose one.
				sections: [{ code: HELP_SECTION_CODE }],
				items: [...this.createItems, this.helpItem],
			};
		},
		createItems(): MenuItemOptions[]
		{
			return this.items.map((item: CreateChatMenuAirItem): MenuItemOptions => {
				return {
					id: item.id,
					title: item.title,
					subtitle: item.subtitle,
					design: item.design,
					icon: item.icon,
					isLocked: item.isLocked,
					disabled: item.disabled,
					onClick: () => this.$emit('select', item.id),
				};
			});
		},
		helpItem(): MenuItemOptions
		{
			return {
				id: HELP_ITEM_ID,
				sectionCode: HELP_SECTION_CODE,
				title: this.loc('IM_RECENT_CREATE_CHAT_WHAT_TO_CHOOSE'),
				design: MenuItemDesign.Accent2,
				icon: Outline.INFO_CIRCLE,
				onClick: () => this.openHelpArticle(),
			};
		},
	},
	methods:
	{
		openHelpArticle(): void
		{
			openHelpdeskArticle(HELP_ARTICLE_CODE);
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<BMenu :options="menuOptions" @close="$emit('close')"/>
	`,
};

import { type JsonObject } from 'main.core';
import { BIcon, Outline as OutlineIcons } from 'ui.icon-set.api.vue';

import { BaseMenu } from 'im.v2.lib.menu';
import { RecentType } from 'im.v2.const';

import { RecentHeaderMenu } from './classes/recent';
import { TaskHeaderMenu } from './classes/task';
import { CollabHeaderMenu } from './classes/collab/collab';
import { BaseRecentHeaderMenu } from './classes/base';
import { CollabDefaultHeaderMenu } from './classes/collab/default';
import { CollabChatHeaderMenu } from './classes/collab/chat';
import { CollabCalendarHeaderMenu } from './classes/collab/calendar';

import './css/header-menu.css';

const MenuClass = {
	[RecentType.taskComments]: TaskHeaderMenu,
	[RecentType.collab]: CollabHeaderMenu,
	[RecentType.default]: RecentHeaderMenu,
	[RecentType.collabDefault]: CollabDefaultHeaderMenu,
	[RecentType.collabChat]: CollabChatHeaderMenu,
	[RecentType.calendar]: CollabCalendarHeaderMenu,
};

// @vue/component
export const HeaderMenu = {
	name: 'HeaderMenu',
	components: { BIcon },
	props: {
		unreadMode: {
			type: Boolean,
			default: false,
		},
		recentSection: {
			type: String,
			required: true,
		},
		parentChatId: {
			type: Number,
			default: 0,
		},
	},
	emits: ['toggleUnreadMode'],
	data(): JsonObject
	{
		return {
			showMenu: false,
		};
	},
	computed: {
		OutlineIcons: () => OutlineIcons,
	},
	created()
	{
		this.contextMenuManager = new MenuClass[this.recentSection]();

		this.contextMenuManager.subscribe(BaseMenu.events.close, this.closeMenu);
		this.contextMenuManager.subscribe(BaseRecentHeaderMenu.events.onToggleUnreadMode, this.onToggleUnreadMode);
	},
	beforeUnmount()
	{
		this.contextMenuManager.destroy();
	},
	methods: {
		onToggleUnreadMode()
		{
			this.$emit('toggleUnreadMode');
		},
		openMenu(event: PointerEvent)
		{
			const context = {
				unreadMode: this.unreadMode,
				parentChatId: this.parentChatId,
			};

			this.contextMenuManager.openMenu(context, event.currentTarget);

			this.showMenu = true;
		},
		closeMenu()
		{
			this.showMenu = false;
		},
		onClick(event: PointerEvent)
		{
			if (this.unreadMode)
			{
				this.onToggleUnreadMode();

				return;
			}

			if (this.showMenu)
			{
				this.closeMenu();

				return;
			}

			this.openMenu(event);
		},
	},
	template: `
		<button
			class="bx-im-list-container-header-menu__container"
			:class="{'--active': unreadMode, '--menu-opened': showMenu }" 
			:aria-pressed="unreadMode"
			@click="onClick"
		>
			<BIcon
				class="bx-im-list-container-header-menu-icon"
				:name="OutlineIcons.FILTER_FUNNEL"
				:aria-hidden="true"
			/>
		</button>
	`,
};

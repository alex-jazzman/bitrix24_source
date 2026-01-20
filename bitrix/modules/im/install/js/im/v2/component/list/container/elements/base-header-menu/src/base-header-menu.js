import { MessengerMenu } from 'im.v2.component.elements.menu';

import './css/base-header-menu.css';

import type { PopupOptions } from 'main.popup';

// @vue/component
export const BaseHeaderMenu = {
	name: 'BaseHeaderMenu',
	components: { MessengerMenu },
	data(): { showPopup: boolean } {
		return {
			showPopup: false,
		};
	},
	computed: {
		menuConfig(): PopupOptions
		{
			return {
				id: 'im-recent-header-menu',
				width: 284,
				bindElement: this.$refs.icon || {},
				offsetTop: 4,
				padding: 0,
			};
		},
	},
	methods: {
		onIconClick()
		{
			this.showPopup = true;
		},
		onClose()
		{
			this.showPopup = false;
		},
	},
	template: `
		<div 
			class="bx-im-list-container-base-header-menu__icon"
			:class="{'--active': showPopup }"
			@click="onIconClick"
			ref="icon"
		>
			<MessengerMenu v-if="showPopup" :config="menuConfig" @close="onClose">
				<slot name="menu-items" :closeCallback="onClose"></slot>
			</MessengerMenu>
		</div>
	`,
};

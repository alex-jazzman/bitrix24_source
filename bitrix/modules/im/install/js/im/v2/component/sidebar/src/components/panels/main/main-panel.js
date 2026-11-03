import { type ComponentOptions } from 'ui.vue3';
import { type JsonObject } from 'main.core';

import { Logger } from 'im.v2.lib.logger';
import { SidebarManager } from 'im.v2.lib.sidebar';
import { type ImModelChat } from 'im.v2.model';

import { Main } from '../../../classes/panels/main';
import { SidebarSkeleton } from '../../elements/skeleton/skeleton';
import { MainHeader } from './components/header';
import { ComponentMap } from './config/component-map';

import './css/main-panel.css';

// @vue/component
export const MainPanel = {
	name: 'MainPanel',
	components: {
		MainHeader,
		SidebarSkeleton,
	},
	props:
	{
		dialogId: {
			type: String,
			required: true,
		},
	},
	data(): JsonObject
	{
		return {
			isLoading: true,
		};
	},
	computed:
	{
		blocks(): ComponentOptions[]
		{
			const sidebarConfig = SidebarManager.getInstance().getConfig(this.dialogId);
			const defaultBlocks = sidebarConfig.getBlocks(this.dialogId)
				.map((block) => ComponentMap[block]);
			const customBlocks = sidebarConfig.getCustomBlocks();

			return [...defaultBlocks, ...customBlocks];
		},
		dialog(): ImModelChat
		{
			return this.$store.getters['chats/get'](this.dialogId, true);
		},
		dialogInited(): boolean
		{
			return this.dialog.inited;
		},
		chatId(): number
		{
			return this.dialog.chatId;
		},
		hasInitialData(): boolean
		{
			return this.$store.getters['sidebar/isInited'](this.chatId);
		},
	},
	watch:
	{
		dialogId()
		{
			this.initializeSidebar();
		},
		dialogInited()
		{
			this.initializeSidebar();
		},
	},
	created()
	{
		this.initializeSidebar();
	},
	methods:
	{
		initializeSidebar()
		{
			if (!this.dialogInited)
			{
				return;
			}

			if (this.hasInitialData)
			{
				this.isLoading = false;

				return;
			}
			this.sidebarService = new Main({ dialogId: this.dialogId });

			this.isLoading = true;
			this.sidebarService.requestInitialData().then(() => {
				this.isLoading = false;
			}).catch((error) => {
				Logger.warn('Sidebar: request initial data error:', error);
			});
		},
	},
	template: `
		<div class="bx-im-sidebar-main-panel__container">
			<MainHeader :dialogId="dialogId" />
			<SidebarSkeleton v-if="isLoading || !dialogInited" />
			<div v-else class="bx-im-sidebar-main-panel__blocks">
				<component
					v-for="block in blocks"
					:key="block.name"
					:is="block"
					:dialogId="dialogId"
					class="bx-im-sidebar-main-panel__block"
				/>
			</div>
		</div>
	`,
};

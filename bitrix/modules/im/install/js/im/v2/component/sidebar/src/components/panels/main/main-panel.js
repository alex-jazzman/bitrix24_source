import { Logger } from 'im.v2.lib.logger';

import { Main } from '../../../classes/panels/main';
import { getAvailableBlocks } from '../../../classes/panels/helpers/get-available-blocks';

import { InfoPreview } from './blocks/info';
import { FilePreview } from './blocks/file';
import { TaskPreview } from './blocks/task';
import { MainHeader } from './blocks/header';
import { MarketPreview } from './blocks/market';
import { MeetingPreview } from './blocks/meeting';
import { ChatPreview } from './blocks/chat-preview';
import { UserPreview } from './blocks/user-preview';
import { FileUnsortedPreview } from './blocks/file-unsorted';
import { SidebarSkeleton } from '../../elements/skeleton/skeleton';

import './css/main-panel.css';

import type { JsonObject } from 'main.core';
import type { ImModelChat } from 'im.v2.model';

// @vue/component
export const MainPanel = {
	name: 'MainPanel',
	components: {
		MainHeader,
		ChatPreview,
		UserPreview,
		InfoPreview,
		FilePreview,
		TaskPreview,
		MeetingPreview,
		FileUnsortedPreview,
		MarketPreview,
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
			isLoading: false,
		};
	},
	computed:
	{
		blocks(): string[]
		{
			return getAvailableBlocks(this.dialogId);
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
		chatId(newValue: number)
		{
			if (newValue > 0)
			{
				this.initializeSidebar();
			}
		},
	},
	created()
	{
		this.initializeSidebar();
	},
	methods:
	{
		getPreviewComponentName(block: string): string
		{
			return `${block}Preview`;
		},
		initializeSidebar()
		{
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
			<SidebarSkeleton v-if="isLoading" />
			<div v-else class="bx-im-sidebar-main-panel__blocks">
				<component
					v-for="block in blocks"
					:key="block"
					class="bx-im-sidebar-main-panel__block"
					:is="getPreviewComponentName(block)"
					:dialogId="dialogId"
				/>
			</div>
		</div>
	`,
};
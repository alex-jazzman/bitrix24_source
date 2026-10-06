import { FolderType, RecentType } from 'im.v2.const';
import { type ImModelFolder } from 'im.v2.model';
import { CounterManager } from 'im.v2.lib.counter';

import { isSelectedFolder } from '../functions/layout';

import '../css/item.css';

// @vue/component
export const PanelItem = {
	name: 'PanelItem',
	props: {
		item: {
			type: Object,
			required: true,
		},
	},
	computed: {
		folder(): ImModelFolder
		{
			return this.item;
		},
		isSelected(): boolean
		{
			return isSelectedFolder(this.folder);
		},
		isSystemFolder(): boolean
		{
			return this.folder.type === FolderType.system;
		},
		counter(): number
		{
			const { definition } = this.folder;
			if (this.isSystemFolder)
			{
				const folderRecentType = definition.recentSection;

				return this.$store.getters['counters/getCounterByRecentType'](folderRecentType);
			}

			const folderChatIds = definition.chats.map((chat) => chat.chatId);

			return this.$store.getters['counters/getTotalCounterByIdsWithChildren'](folderChatIds);
		},
		showCounter(): boolean
		{
			// "Channels" is a company-wide showcase folder, not a personal one, so no unread counter there
			return this.counter > 0 && this.folder.code !== RecentType.openChannel;
		},
		formattedCounter(): string
		{
			return CounterManager.formatCounter(this.counter);
		},
		containerClasses(): Record<string, boolean>
		{
			return { '--selected': this.isSelected };
		},
		iconClasses(): string[]
		{
			if (!this.isSystemFolder)
			{
				return [];
			}

			return [`--${this.folder.code}`];
		},
	},
	template: `
		<div class="bx-im-messenger-folder-panel__item" :class="containerClasses" data-testid="folder-panel-item">
			<div class="bx-im-messenger-folder-panel-item__icon" :class="iconClasses">
				<div v-if="showCounter" class="bx-im-messenger-folder-panel-item__counter">
					{{ formattedCounter }}
				</div>
			</div>
			<div class="bx-im-messenger-folder-panel-item__title --line-clamp-2" :title="folder.title">
				{{ folder.title }}
			</div>
		</div>
	`,
};

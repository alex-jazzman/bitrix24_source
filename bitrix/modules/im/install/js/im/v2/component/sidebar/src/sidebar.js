import { type JsonObject } from 'main.core';
import { type BaseEvent, type EventEmitter } from 'main.core.events';

import { ChatType, EventType, LocalStorageKey, SidebarDetailBlock, DialogIdChatPrefix } from 'im.v2.const';
import { LocalStorageManager } from 'im.v2.lib.local-storage';
import { Logger } from 'im.v2.lib.logger';
import { type ImModelChat } from 'im.v2.model';

import { SidebarPanel } from './components/sidebar-panel';

import './css/icons.css';
import './css/sidebar.css';

type SidebarPanelType = $Values<typeof SidebarDetailBlock>;
type LocalStorageKeyType = $Values<typeof LocalStorageKey>;

const LocalStorageKeyByChatType: Record<string, LocalStorageKeyType> = {
	[ChatType.taskComments]: LocalStorageKey.taskCommentsSidebarOpened,
	default: LocalStorageKey.sidebarOpened,
};

// @vue/component
export const ChatSidebar = {
	name: 'ChatSidebar',
	components: { SidebarPanel },
	props:
	{
		originDialogId: {
			type: String,
			required: true,
		},
		isActive: {
			type: Boolean,
			default: true,
		},
	},
	emits: ['changePanel'],
	data(): JsonObject
	{
		return {
			needTopLevelTransition: true,
			needSecondLevelTransition: true,

			topLevelPanelType: '',
			topLevelPanelDialogId: '',
			topLevelPanelStandalone: false,

			secondLevelPanelType: '',
			secondLevelPanelDialogId: '',
			secondLevelPanelEntityId: '',
			secondLevelPanelStandalone: false,
		};
	},
	computed:
	{
		SidebarDetailBlock: () => SidebarDetailBlock,
		dialog(): ImModelChat
		{
			return this.$store.getters['chats/get'](this.originDialogId, true);
		},
		sidebarOpenedStorageKey(): LocalStorageKeyType
		{
			return LocalStorageKeyByChatType[this.dialog.type] ?? LocalStorageKeyByChatType.default;
		},
		topLevelTransitionName(): string
		{
			return this.needTopLevelTransition ? 'top-level-panel' : '';
		},
		secondLevelTransitionName(): string
		{
			return this.needSecondLevelTransition ? 'second-level-panel' : '';
		},
		canShowTopPanel(): boolean
		{
			const membersPanel = this.topLevelPanelType === SidebarDetailBlock.members;
			const personalChat = !this.originDialogId.startsWith(DialogIdChatPrefix);
			if (membersPanel && personalChat)
			{
				return false;
			}

			const messageSearchPanel = this.topLevelPanelType === SidebarDetailBlock.messageSearch;

			return !messageSearchPanel;
		},
		sidebarOpened(): boolean
		{
			return this.topLevelPanelType || this.secondLevelPanelType;
		},
	},
	watch:
	{
		originDialogId(newValue: string, oldValue: string)
		{
			const chatSwitched = Boolean(newValue && oldValue);
			if (chatSwitched)
			{
				this.needTopLevelTransition = false;
			}

			if (!this.topLevelPanelStandalone)
			{
				this.updateTopPanelOriginDialogId(newValue);
			}

			const isSecondLevelPanelOpened = this.secondLevelPanelType.length > 0;
			if (isSecondLevelPanelOpened && !this.secondLevelPanelStandalone)
			{
				this.closeSecondLevelPanel();
			}

			if (!this.canShowTopPanel)
			{
				this.closeTopPanel();
			}
		},
		topLevelPanelType(newValue: SidebarPanelType, oldValue: SidebarPanelType)
		{
			this.needTopLevelTransition = oldValue.length === 0 || newValue.length === 0;

			const isMainPanelOpened = newValue === SidebarDetailBlock.main;
			this.saveSidebarOpenedState(isMainPanelOpened);
		},
		secondLevelPanelType(newValue: SidebarPanelType, oldValue: SidebarPanelType)
		{
			this.needSecondLevelTransition = !(newValue && oldValue);
		},
	},
	created()
	{
		Logger.warn('ChatSidebar: created');
		this.restoreOpenState();
	},
	mounted()
	{
		this.getEmitter().subscribe(EventType.sidebar.open, this.onSidebarOpen);
		this.getEmitter().subscribe(EventType.sidebar.close, this.onSidebarClose);
	},
	beforeUnmount()
	{
		this.getEmitter().unsubscribe(EventType.sidebar.open, this.onSidebarOpen);
		this.getEmitter().unsubscribe(EventType.sidebar.close, this.onSidebarClose);
	},
	methods:
	{
		onSidebarOpen(event: BaseEvent<{panel: SidebarPanelType, standalone: boolean, dialogId: string}>)
		{
			if (!this.isActive)
			{
				return;
			}
			const { panel = '', standalone = false, dialogId, entityId = '' } = event.getData();

			const needToCloseSecondLevelPanel = !standalone && panel && this.secondLevelPanelType === panel;
			if (needToCloseSecondLevelPanel)
			{
				this.closeSecondLevelPanel();

				return;
			}

			const needToOpenSecondLevelPanel = this.topLevelPanelType && this.topLevelPanelType !== panel;
			if (needToOpenSecondLevelPanel)
			{
				this.openSecondLevelPanel(panel, dialogId, standalone, entityId);
			}
			else
			{
				this.openTopPanel(panel, dialogId, standalone);
			}
		},
		onSidebarClose(event: BaseEvent<{panel: SidebarPanelType}>)
		{
			if (!this.isActive)
			{
				return;
			}
			this.needTopLevelTransition = true;

			const { panel = '' } = event.getData();
			const needToCloseSecondLevelPanel = panel && this.secondLevelPanelType === panel;
			if (needToCloseSecondLevelPanel)
			{
				this.closeSecondLevelPanel();
			}
			else
			{
				this.closeSecondLevelPanel();
				this.closeTopPanel();
			}
		},
		restoreOpenState()
		{
			const sidebarOpenState = LocalStorageManager.getInstance().get(this.sidebarOpenedStorageKey);
			if (!sidebarOpenState)
			{
				return;
			}

			this.openTopPanel(SidebarDetailBlock.main, this.originDialogId, false);
		},
		saveSidebarOpenedState(sidebarOpened: boolean)
		{
			const WRITE_TO_STORAGE_TIMEOUT = 200;
			clearTimeout(this.saveSidebarStateTimeout);
			this.saveSidebarStateTimeout = setTimeout(() => {
				LocalStorageManager.getInstance().set(this.sidebarOpenedStorageKey, sidebarOpened);
			}, WRITE_TO_STORAGE_TIMEOUT);
		},
		openTopPanel(type, dialogId, standalone = false)
		{
			this.topLevelPanelType = type;
			this.topLevelPanelDialogId = dialogId;
			this.topLevelPanelStandalone = standalone;
			this.$emit('changePanel', { panel: this.topLevelPanelType });
		},
		updateTopPanelOriginDialogId(dialogId: string)
		{
			this.topLevelPanelDialogId = dialogId;
		},
		openSecondLevelPanel(type, dialogId, standalone = false, entityId = '')
		{
			this.secondLevelPanelType = type;
			this.secondLevelPanelDialogId = dialogId;
			this.secondLevelPanelStandalone = standalone;
			this.secondLevelPanelEntityId = entityId;
			this.$emit('changePanel', { panel: this.secondLevelPanelType });
		},
		closeTopPanel()
		{
			this.topLevelPanelType = '';
			this.topLevelPanelDialogId = '';
			this.topLevelPanelStandalone = false;
			this.$emit('changePanel', { panel: '' });
		},
		closeSecondLevelPanel()
		{
			this.secondLevelPanelType = '';
			this.secondLevelPanelDialogId = '';
			this.secondLevelPanelStandalone = false;
			this.$emit('changePanel', { panel: this.topLevelPanelType });
		},
		getEmitter(): EventEmitter
		{
			return this.$Bitrix.eventEmitter;
		},
	},
	template: `
		<div class="bx-im-sidebar__container" :class="{'--opened': sidebarOpened}">
			<Transition :name="topLevelTransitionName">
				<SidebarPanel
					v-if="topLevelPanelType"
					:dialogId="topLevelPanelDialogId"
					:panel="topLevelPanelType"
				/>
			</Transition>
			<Transition :name="secondLevelTransitionName">
				<SidebarPanel
					v-if="secondLevelPanelType"
					:dialogId="secondLevelPanelDialogId" 
					:panel="secondLevelPanelType"
					:entityId="secondLevelPanelEntityId"
					:secondLevel="true"
				/>
			</Transition>
		</div>
	`,
};

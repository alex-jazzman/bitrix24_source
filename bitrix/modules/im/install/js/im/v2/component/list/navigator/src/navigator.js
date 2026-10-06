import { EventEmitter, type BaseEvent } from 'main.core.events';
import { type JsonObject } from 'main.core';

import { EventType, Layout, type LayoutType, RecentType, type OpenCollabOptions } from 'im.v2.const';
import { LayoutManager } from 'im.v2.lib.layout';
import { type ImModelLayout, type ImModelChat } from 'im.v2.model';
import { SlideAnimation, SlideEntrySide } from 'im.v2.component.animation';
import { EscEventAction } from 'im.v2.lib.esc-manager';
import { Utils } from 'im.v2.lib.utils';
import { CollabNestedListContainer, NestedListLoadingState } from 'im.v2.component.list.container.collab';
import { TariffManager } from 'im.v2.lib.feature';

import { NestedListManager } from './classes/nested-list-manager';
import { chatMatchesChatId } from './functions/matches-chat-id';

import './css/navigator.css';

export type NestedListPayload = { parentDialogId: string, options: OpenCollabOptions };

type SelectChatPayload = { layoutName: LayoutType, dialogId: string };
type CloseNestedListPayload = ?{ dialogId: string };

// @vue/component
export const ListNavigator = {
	name: 'ListNavigator',
	components: { SlideAnimation, CollabNestedListContainer, NestedListLoadingState },
	props: {
		listComponent: {
			type: Object,
			required: true,
		},
	},
	emits: ['selectChat'],
	data(): JsonObject
	{
		return {
			isLoading: false,
			nestedListParentChatId: 0,
			nestedListCompactMode: true,
			initialRecentSection: null,
		};
	},
	computed: {
		SlideEntrySide: () => SlideEntrySide,
		layout(): ImModelLayout
		{
			return this.$store.getters['application/getLayout'];
		},
		isNestedListActive(): boolean
		{
			return this.nestedListParentChatId > 0;
		},
		isRootListAvatarsOnly(): boolean
		{
			return this.isNestedListActive && this.nestedListCompactMode;
		},
		nestedListClasses(): Record<string, boolean>
		{
			return { '--compact-mode': this.nestedListCompactMode };
		},
	},
	watch: {
		layout(newLayout: ImModelLayout, prevLayout: ImModelLayout)
		{
			if (newLayout.name !== prevLayout.name)
			{
				this.onLayoutChange(prevLayout.name, newLayout.name);
			}
		},
	},
	created()
	{
		EventEmitter.subscribe(EventType.recent.openNestedList, this.onOpenNestedListEvent);
		EventEmitter.subscribe(EventType.recent.closeNestedList, this.onCloseNestedListEvent);

		this.getEmitter().subscribe(EventType.dialog.onDialogInited, this.onDialogInited);
	},
	beforeUnmount()
	{
		EventEmitter.unsubscribe(EventType.recent.openNestedList, this.onOpenNestedListEvent);
		EventEmitter.unsubscribe(EventType.recent.closeNestedList, this.onCloseNestedListEvent);

		this.getEmitter().unsubscribe(EventType.dialog.onDialogInited, this.onDialogInited);
	},
	methods: {
		async openNestedList(parentDialogId: string, options: OpenCollabOptions = {})
		{
			const { compactMode = true, recentType = RecentType.collabDefault } = options;

			this.nestedListCompactMode = compactMode;
			this.isLoading = true;
			const parentChatId = await NestedListManager.prepareParentChatId(parentDialogId);
			const listWasClosed = !this.isLoading;
			if (listWasClosed)
			{
				return;
			}
			this.nestedListParentChatId = parentChatId;
			this.initialRecentSection = recentType;
			this.isLoading = false;
		},
		closeNestedList()
		{
			if (LayoutManager.getInstance().isChatFormLayout(this.layout.name))
			{
				this.openLayout(Layout.chat);
			}

			this.nestedListParentChatId = 0;
			this.isLoading = false;
		},
		openLayout(layoutName: LayoutType)
		{
			this.$emit('selectChat', { layoutName, dialogId: '' });
		},
		openChat(payload: SelectChatPayload)
		{
			this.$emit('selectChat', payload);
		},
		async onSelectChat(initialEvent: SelectChatPayload)
		{
			const { dialogId, layoutName } = initialEvent;

			const { type }: ImModelChat = this.$store.getters['chats/get'](dialogId, true);

			const canOpenNestedList = NestedListManager.isSupportedChatType(type) && NestedListManager.isFeatureAvailable();
			if (!canOpenNestedList)
			{
				if (this.isNestedListActive)
				{
					this.closeNestedList();
				}

				this.openChat(initialEvent);

				return;
			}

			if (!TariffManager.collabV2.isAvailable())
			{
				TariffManager.collabV2.openFeatureSlider();

				return;
			}

			this.openLayout(layoutName);
			await this.$nextTick();
			void this.openNestedList(dialogId);
		},
		onNestedListSelectChat(dialogId: string)
		{
			let layoutName = this.layout.name;
			if (LayoutManager.getInstance().isChatFormLayout(this.layout.name))
			{
				layoutName = Layout.chat;
			}

			this.openChat({ layoutName, dialogId });
		},
		onDialogInited(event: BaseEvent<{ dialogId: string, chat: ImModelChat }>)
		{
			const { chat } = event.getData();

			if (!NestedListManager.isFeatureAvailable() || !TariffManager.collabV2.isAvailable())
			{
				return;
			}

			if (this.isNestedListOpenedForChat(chat))
			{
				return;
			}

			const manager = new NestedListManager({ initedChat: chat });
			if (manager.shouldOpen())
			{
				void this.openNestedList(manager.getDialogIdToOpen());

				return;
			}

			if (!this.isNestedListActive)
			{
				return;
			}

			this.closeNestedList();
		},
		onLayoutChange(prevLayoutName: LayoutType, newLayoutName: LayoutType)
		{
			if (!this.isNestedListActive)
			{
				return;
			}

			const switchingToForm = LayoutManager.getInstance().isChatFormLayout(newLayoutName);
			const switchingFromForm = LayoutManager.getInstance().isChatFormLayout(prevLayoutName);
			if (switchingToForm || switchingFromForm)
			{
				return;
			}

			this.closeNestedList();
		},
		onOpenNestedListEvent(event: BaseEvent<NestedListPayload>)
		{
			const { parentDialogId, options } = event.getData();

			void this.openNestedList(parentDialogId, options);
		},
		onCloseNestedListEvent(event: BaseEvent<CloseNestedListPayload>): $Values<typeof EscEventAction>
		{
			if (!this.closeEventMatchesActiveList(event))
			{
				return EscEventAction.ignored;
			}

			this.closeNestedList();

			return EscEventAction.handled;
		},
		onCloseNestedListClick()
		{
			if (LayoutManager.getInstance().isChatLayout(this.layout.name))
			{
				LayoutManager.getInstance().clearCurrentLayoutEntityId();
			}

			this.closeNestedList();
		},
		closeEventMatchesActiveList(event: BaseEvent<CloseNestedListPayload>): boolean
		{
			if (!this.isNestedListActive)
			{
				return false;
			}

			const { dialogId } = event.getData() ?? {};
			if (!dialogId)
			{
				return true;
			}

			const currentParentChatId = this.nestedListParentChatId;
			const currentDialogId = Utils.dialog.buildChatDialogId(currentParentChatId);

			return currentDialogId === dialogId;
		},
		isNestedListOpenedForChat(chat: ImModelChat): boolean
		{
			if (!this.isNestedListActive)
			{
				return false;
			}

			return chatMatchesChatId(chat, this.nestedListParentChatId);
		},
		getEmitter(): EventEmitter
		{
			return this.$Bitrix.eventEmitter;
		},
	},
	template: `
		<KeepAlive>
			<component :is="listComponent" :avatarsOnly="isRootListAvatarsOnly" @selectChat="onSelectChat" />
		</KeepAlive>
		<SlideAnimation :entrySide="SlideEntrySide.right">
			<div v-if="isLoading || isNestedListActive" :class="nestedListClasses" class="bx-im-list-navigator-nested-list__container">
				<NestedListLoadingState v-if="isLoading" :compactMode="nestedListCompactMode" @close="onCloseNestedListClick" />
				<CollabNestedListContainer
					v-else-if="isNestedListActive"
					:parentChatId="nestedListParentChatId"
					:compactMode="nestedListCompactMode"
					:initialRecentSection="initialRecentSection"
					@close="onCloseNestedListClick"
					@selectChat="onNestedListSelectChat"
				/>
			</div>
		</SlideAnimation>
	`,
};

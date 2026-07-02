import { EventEmitter, type BaseEvent } from 'main.core.events';
import { type BitrixVueComponentProps } from 'ui.vue3';

import { ChatType, EventType, Layout, type LayoutType, type ChatTypeItem } from 'im.v2.const';
import { LayoutManager } from 'im.v2.lib.layout';
import { FeatureManager, Feature } from 'im.v2.lib.feature';
import { type ImModelLayout, type ImModelChat } from 'im.v2.model';
import { CollabNestedListContainer } from 'im.v2.component.list.container.collab';

type NestedListContext = { chatType: ChatTypeItem, parentChatId: number };

const NestedListComponentByChatType = {
	[ChatType.collab]: CollabNestedListContainer,
};

// @vue/component
export const ListNavigator = {
	name: 'ListNavigator',
	props: {
		listComponent: {
			type: Object,
			required: true,
		},
	},
	emits: ['selectChat'],
	data(): { nestedListContext: ?NestedListContext }
	{
		return {
			nestedListContext: null,
		};
	},
	computed: {
		layout(): ImModelLayout
		{
			return this.$store.getters['application/getLayout'];
		},
		isNestedListActive(): boolean
		{
			return this.nestedListContext !== null;
		},
		isNestedListAvailable(): boolean
		{
			return FeatureManager.isFeatureAvailable(Feature.isNestedListAvailable);
		},
		nestedListComponent(): ?BitrixVueComponentProps
		{
			return NestedListComponentByChatType[this.nestedListContext.chatType] ?? null;
		},
	},
	watch: {
		layout(newLayout: ImModelLayout, prevLayout: ImModelLayout)
		{
			if (LayoutManager.getInstance().isChatLayout(newLayout.name))
			{
				this.onChatChange(newLayout.entityId);
			}

			if (newLayout.name !== prevLayout.name)
			{
				this.onLayoutChange(prevLayout.name, newLayout.name);
			}
		},
	},
	created()
	{
		EventEmitter.subscribe(EventType.recent.openNestedList, this.onOpenNestedList);
	},
	beforeUnmount()
	{
		EventEmitter.unsubscribe(EventType.recent.openNestedList, this.onOpenNestedList);
	},
	methods: {
		openNestedList(params: NestedListContext)
		{
			this.nestedListContext = params;
		},
		closeNestedList()
		{
			if (LayoutManager.getInstance().isChatFormLayout(this.layout.name))
			{
				this.$emit('selectChat', { layoutName: Layout.chat, dialogId: '' });
			}

			this.nestedListContext = null;
		},
		async onSelectChat(event: { layoutName: LayoutType, dialogId: string })
		{
			const { dialogId, layoutName } = event;

			const { type, chatId }: ImModelChat = this.$store.getters['chats/get'](dialogId, true);
			if (!this.needToShowNestedListByType(type) || !this.isNestedListAvailable)
			{
				this.$emit('selectChat', event);

				return;
			}

			this.$emit('selectChat', { layoutName, dialogId: '' });
			await this.$nextTick();
			this.openNestedList({ chatType: type, parentChatId: chatId });
		},
		onNestedListSelectChat(dialogId: string)
		{
			let layoutName = this.layout.name;
			if (LayoutManager.getInstance().isChatFormLayout(this.layout.name))
			{
				layoutName = Layout.chat;
			}

			this.$emit('selectChat', { layoutName, dialogId });
		},
		onChatChange(newDialogId: string)
		{
			if (!this.isNestedListActive || newDialogId === '')
			{
				return;
			}

			const newChat: ImModelChat = this.$store.getters['chats/get'](newDialogId, true);
			const nestedListParentChatId = this.nestedListContext.parentChatId;

			const hasCurrentParent = newChat.parentChatId === nestedListParentChatId;
			const isCurrentParent = newChat.chatId === nestedListParentChatId;
			if (!hasCurrentParent && !isCurrentParent)
			{
				this.closeNestedList();
			}
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
		onOpenNestedList(event: BaseEvent<NestedListContext>)
		{
			const payload = event.getData();
			this.openNestedList(payload);
		},
		needToShowNestedListByType(chatType: string): boolean
		{
			return Boolean(NestedListComponentByChatType[chatType]);
		},
	},
	template: `
		<KeepAlive>
			<component :is="listComponent" @selectChat="onSelectChat" />
		</KeepAlive>
		<component
			v-if="isNestedListActive"
			:is="nestedListComponent"
			:parentChatId="nestedListContext.parentChatId"
			@close="closeNestedList"
			@selectChat="onNestedListSelectChat"
		/>
	`,
};

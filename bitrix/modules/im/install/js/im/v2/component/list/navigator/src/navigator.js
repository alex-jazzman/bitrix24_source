import { EventEmitter, type BaseEvent } from 'main.core.events';
import { type JsonObject } from 'main.core';

import { EventType, Layout, type LayoutType, RecentType, type OpenCollabOptions } from 'im.v2.const';
import { FolderManager } from 'im.v2.lib.folder';
import { LayoutManager } from 'im.v2.lib.layout';
import { type ImModelLayout, type ImModelChat } from 'im.v2.model';
import { SlideAnimation, SlideEntrySide } from 'im.v2.component.animation';
import { EscEventAction } from 'im.v2.lib.esc-manager';
import { Utils } from 'im.v2.lib.utils';
import { isFocusOwnedByPopup, isKeyboardFocusHandoffHeldByNestedList } from 'im.v2.lib.a11y';
import { CollabNestedListContainer, NestedListLoadingState } from 'im.v2.component.list.container.collab';
import { TariffManager } from 'im.v2.lib.feature';

import { NestedListManager } from './classes/nested-list-manager';
import { findCollabTransitionTarget } from './functions/find-transition-target';
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
		isNestedListShown(): boolean
		{
			// The nested list drawer overlays the root list (loading state included).
			return this.isLoading || this.isNestedListActive;
		},
		isRootListAvatarsOnly(): boolean
		{
			// Compact peek: only the 68px avatar strip of the root list stays visible beside the
			// drawer, so it must remain mouse-clickable (switch collab without closing the drawer).
			return this.isNestedListActive && this.nestedListCompactMode;
		},
		isRootListInert(): boolean
		{
			// `inert` pulls the root list out of the tab order while the drawer is shown (Tab enters
			// the drawer, not the main header). It also kills mouse + AT - fine when the drawer covers
			// the whole list, wrong for the compact peek. There the strip stays clickable, so `inert`
			// is dropped and keyboard access is removed inside the list instead (header `inert` + row
			// focus zone off). Cleared on close before P3 restores focus to the parent row.
			return this.isNestedListShown && !this.isRootListAvatarsOnly;
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
			const layoutManager = LayoutManager.getInstance();
			if (layoutManager.isChatFormLayout(this.layout.name))
			{
				// The layout is set whole and not sent through the selectChat event: the event carries a
				// name alone, and a personal folder is told apart by the folderId of its params.
				void layoutManager.setLayout(FolderManager.getDefaultLayout() ?? { name: Layout.chat });
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
		async openCollab({ layoutName, dialogId }: SelectChatPayload)
		{
			const target = findCollabTransitionTarget(dialogId);
			if (target)
			{
				this.openChat({ layoutName, dialogId: target.dialogId });
			}
			else
			{
				this.openLayout(layoutName);
			}
			await this.$nextTick();
			void this.openNestedList(dialogId);
		},
		async onSelectChat(initialEvent: SelectChatPayload)
		{
			const { dialogId } = initialEvent;

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

			await this.openCollab(initialEvent);
		},
		onNestedListSelectChat(dialogId: string)
		{
			let layoutName = this.layout.name;
			if (LayoutManager.getInstance().isChatFormLayout(this.layout.name))
			{
				layoutName = FolderManager.getRegularChatsLayout().name;
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

			if (this.isLoading || this.isNestedListOpenedForChat(chat))
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

			const parentChatId = this.nestedListParentChatId;
			this.closeNestedList();
			this.returnFocusToParentRow(parentChatId);

			return EscEventAction.handled;
		},
		onCloseNestedListClick()
		{
			const parentChatId = this.nestedListParentChatId;
			if (LayoutManager.getInstance().isChatLayout(this.layout.name))
			{
				LayoutManager.getInstance().clearCurrentLayoutEntityId();
			}

			this.closeNestedList();
			this.returnFocusToParentRow(parentChatId);
		},
		returnFocusToParentRow(parentChatId: number)
		{
			// User dismissed the nested list (Escape / close control), so send focus back to the
			// collab row it was opened from. Capture parentChatId before closeNestedList() resets it.
			if (parentChatId <= 0 || !this.canMoveFocus())
			{
				return;
			}

			const dialogId = Utils.dialog.buildChatDialogId(parentChatId);

			// The collab was entered from a search with the keyboard, and this list was the last surface that
			// walk opened: the collapsed search it started from outranks the row and takes the focus itself.
			if (isKeyboardFocusHandoffHeldByNestedList({ layoutName: this.layout.name, dialogId }))
			{
				return;
			}

			// Root list re-expands from avatars-only on close; wait a tick so the row is laid out.
			void this.$nextTick(() => {
				const row = this.$refs.rootList?.$el?.querySelector?.(`[data-id="${dialogId}"]`);
				if (row?.isConnected)
				{
					row.focus();
				}
			});
		},
		canMoveFocus(): boolean
		{
			// Do not steal focus from a popup/menu that currently owns it (active focus trap).
			return !isFocusOwnedByPopup();
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
			<component :is="listComponent" ref="rootList" :inert="isRootListInert || null" :avatarsOnly="isRootListAvatarsOnly" @selectChat="onSelectChat" />
		</KeepAlive>
		<SlideAnimation :entrySide="SlideEntrySide.right">
			<div v-if="isLoading || isNestedListActive" :class="nestedListClasses" class="bx-im-list-navigator-nested-list__container" data-testid="im-nested-list-drawer">
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

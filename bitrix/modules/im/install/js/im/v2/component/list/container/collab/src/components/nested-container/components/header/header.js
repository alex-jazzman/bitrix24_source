import { CreateChatButton } from 'im.v2.component.list.container.elements.create-chat-button';
import { ChatSearchInput } from 'im.v2.component.search';
import { PermissionManager } from 'im.v2.lib.permission';
import { Utils } from 'im.v2.lib.utils';
import { ActionByRole, ActionByUserType, RecentType } from 'im.v2.const';
import { HeaderMenu } from 'im.v2.component.list.container.elements.header-menu';
import { type ImModelCollabInfo } from 'im.v2.model';
import { AttachToCollabV2 } from 'im.v2.component.entity-selector';

import { CreateMenu } from './classes/create-menu';
import { CreateChatPromo } from './components/create-chat-promo';
import { CollabPromoManager, type ShowPromoEvent } from '../../classes/promo-manager';

// @vue/component
export const CollabHeader = {
	name: 'CollabHeader',
	components: { CreateChatButton, ChatSearchInput, CreateChatPromo, HeaderMenu, AttachToCollabV2 },
	inject: ['promoManager'],
	props: {
		parentChatId: {
			type: Number,
			required: true,
		},
		currentSection: {
			type: String,
			required: true,
		},
		unreadMode: {
			type: Boolean,
			required: true,
		},
		searchMode: {
			type: Boolean,
			required: true,
		},
		isSearchLoading: {
			type: Boolean,
			required: true,
		},
	},
	emits: ['openSearch', 'closeSearch', 'updateSearch', 'toggleUnreadMode'],
	data()
	{
		return {
			showCreateChatPromo: false,
			showAttachToCollabV2Popup: false,
		};
	},
	computed: {
		RecentType: () => RecentType,
		parentDialogId(): string
		{
			return Utils.dialog.buildChatDialogId(this.parentChatId);
		},
		canCreateEntities(): boolean
		{
			const manager = PermissionManager.getInstance();
			const canCreateByRole = manager.canPerformActionByRole(ActionByRole.createChildChat, this.parentDialogId);
			const canCreateByUserType = manager.canPerformActionByUserType(ActionByUserType.createChat);

			return canCreateByRole && canCreateByUserType;
		},
		collabId(): number
		{
			const { collabId }: ImModelCollabInfo = this.$store.getters['chats/collabs/getByChatId'](this.parentChatId);

			return collabId;
		},
		createChatClasses(): Record<string, boolean>
		{
			return { 'ui-highlighter': this.showCreateChatPromo };
		},
	},
	created()
	{
		this.bindPromoEvent();
	},
	mounted()
	{
		this.contextMenuManager = new CreateMenu();

		this.contextMenuManager.subscribe(CreateMenu.events.onAttachToCollabV2Show, this.onAttachToCollabV2Show);
	},
	beforeUnmount()
	{
		this.contextMenuManager.unsubscribe(CreateMenu.events.onAttachToCollabV2Show, this.onAttachToCollabV2Show);

		this.contextMenuManager.destroy();
	},
	methods: {
		onAttachToCollabV2Show()
		{
			this.showAttachToCollabV2Popup = true;
		},
		bindPromoEvent()
		{
			this.promoManager.subscribe(CollabPromoManager.events.showCreateChatPromo, (event: ShowPromoEvent) => {
				this.showCreateChatPromo = event.getData();
			});
		},
		onCreateClick(event: PointerEvent)
		{
			const context = {
				parentChatId: this.parentChatId,
				collabId: this.collabId,
			};

			this.contextMenuManager.openMenu(context, event.currentTarget);
		},
		onCloseCreateChatPromo()
		{
			this.promoManager.onCloseCreateChatPromo();
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<div class="bx-im-nested-list-collab__header">
			<div class="bx-im-nested-list-collab__search">
				<ChatSearchInput
					:searchMode="searchMode"
					:isLoading="searchMode && isSearchLoading"
					:placeholder="loc('IM_LIST_CONTAINER_COLLAB_NESTED_SEARCH_INPUT_PLACEHOLDER')"
					@openSearch="$emit('openSearch')"
					@closeSearch="$emit('closeSearch')"
					@updateSearch="$emit('updateSearch', $event)"
				/>
			</div>
			<HeaderMenu
				:key="currentSection"
				:unreadMode="unreadMode"
				:recentSection="currentSection"
				:parentChatId="parentChatId"
				@toggleUnreadMode="$emit('toggleUnreadMode')"
			/>
			<div :class="createChatClasses" class="bx-im-nested-list-collab__subheader_create-button" ref="create-chat-button">
				<CreateChatButton v-if="canCreateEntities" @click="onCreateClick" />
			</div>
			<CreateChatPromo v-if="showCreateChatPromo" :bindElement="$refs['create-chat-button']" @close="onCloseCreateChatPromo" />
			<AttachToCollabV2
				v-if="showAttachToCollabV2Popup"
				:popupTitle="loc('IM_LIST_CONTAINER_COLLAB_ATTACH_TO_COLLAB_V2_POPUP_TITLE')"
				:searchParams="{ onlyWithOwnerRight: true, searchChatTypes: ['C'], onlyWithNullEntityType: true }"
				:dialogId="parentDialogId"
				@close="showAttachToCollabV2Popup = false"
			/>
		</div>
	`,
};

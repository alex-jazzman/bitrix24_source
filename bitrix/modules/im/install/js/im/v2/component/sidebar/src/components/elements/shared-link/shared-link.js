import { type JsonObject } from 'main.core';
import { type BaseEvent } from 'main.core.events';
import { BIcon, Outline as OutlineIcons } from 'ui.icon-set.api.vue';

import { Notifier } from 'im.v2.lib.notifier';
import { type ImModelChat, type ImModelSidebarSharedLinkItem } from 'im.v2.model';
import { GuestInvitationService } from 'im.v2.provider.service.guest-invitation';
import { Analytics } from 'im.v2.lib.analytics';

import { SharedLinkChangeType, SharedLinkMenu, SharedLinkMenuMode, type SharedLinkMenuContext } from './classes/menu';
import { SharedLinkService } from './classes/service';
import { copySharedLink } from './helpers/helpers';

import './css/shared-link.css';

const CHANGE_LINK_ACTIONS = {
	[SharedLinkChangeType.shared]: ({ code }) => (new SharedLinkService()).regenerate(code),
	[SharedLinkChangeType.guest]: ({ chatId }) => (new GuestInvitationService()).updateLink(chatId),
};

// @vue/component
export const SharedLink = {
	name: 'SharedLink',
	components: { BIcon },
	props: {
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
	computed: {
		OutlineIcons: () => OutlineIcons,
		dialog(): ImModelChat
		{
			return this.$store.getters['chats/get'](this.dialogId, true);
		},
		sharedLink(): ImModelSidebarSharedLinkItem
		{
			return this.$store.getters['sidebar/sharedLink/getChatInviteLink'](this.dialog.chatId);
		},
		guestLink(): ?ImModelSidebarSharedLinkItem
		{
			return this.$store.getters['sidebar/sharedLink/getGuestInviteLink'](this.dialog.chatId);
		},
		hasGuestLink(): boolean
		{
			return Boolean(this.guestLink);
		},
		url(): string
		{
			return this.sharedLink?.url ?? '';
		},
	},
	created()
	{
		this.contextMenuManager = new SharedLinkMenu();
		this.contextMenuManager.subscribe(SharedLinkMenu.events.onChangeLink, this.onChangeLink);
	},
	beforeUnmount()
	{
		this.contextMenuManager.destroy();
		this.contextMenuManager.unsubscribe(SharedLinkMenu.events.onChangeLink, this.onChangeLink);
	},
	methods: {
		async onChangeLink(event: BaseEvent)
		{
			const { type, ...data } = event.getData();
			this.isLoading = true;

			try
			{
				await CHANGE_LINK_ACTIONS[type](data);
				Notifier.sharedLink.onChangeLinkComplete();
			}
			catch
			{
				Notifier.sharedLink.onChangeLinkError();
			}
			finally
			{
				this.isLoading = false;
			}
		},
		onContainerClick()
		{
			if (!this.hasGuestLink)
			{
				void copySharedLink(this.url);

				Analytics.getInstance().chatInviteLink.onCopySharedLink(this.dialogId);

				return;
			}

			this.contextMenuManager.openMenu(this.buildMenuContext(SharedLinkMenuMode.compact), this.$refs['icon-menu']);
		},
		showMenuPopup()
		{
			this.contextMenuManager.openMenu(this.buildMenuContext(SharedLinkMenuMode.full), this.$refs['icon-menu']);
		},
		buildMenuContext(mode: $Values<typeof SharedLinkMenuMode>): SharedLinkMenuContext
		{
			return {
				dialogId: this.dialogId,
				chatId: this.dialog.chatId,
				mode,
				sharedLinkUrl: this.sharedLink?.url,
				sharedLinkCode: this.sharedLink?.code,
				guestLinkUrl: this.guestLink?.url,
			};
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<div @click="onContainerClick" class="bx-im-sidebar-shared-link__container --ui-context-content-dark">
			<BIcon
				class="bx-im-sidebar-shared-link__icon"
				:name="OutlineIcons.COPY"
			/>
			<div class="bx-im-sidebar-shared-link__content">
				<div class="bx-im-sidebar-shared-link__content_title">
					<div class="bx-im-sidebar-shared-link__title">{{ loc('IM_SIDEBAR_SHARED_LINK_DESCRIPTION_MSGVER_1') }}</div>
					<div class="bx-im-sidebar-shared-link__container_icon-menu" ref="icon-menu">
						<BIcon
							class="bx-im-sidebar-shared-link__icon_menu"
							:class="{ '--disabled': isLoading }"
							:name="OutlineIcons.MORE_L"
							:hoverable="true"
							@click.stop="showMenuPopup"
						/>
					</div>
				</div>
				<div v-if="isLoading" class="bx-im-sidebar-shared-link-skeleton__container"></div>
				<div v-else class="bx-im-sidebar-shared-link-url__content --ellipsis">{{ url }}</div>
			</div>
		</div>
	`,
};

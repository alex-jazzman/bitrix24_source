import { BIcon, Outline as OutlineIcons } from 'ui.icon-set.api.vue';

import { Notifier } from 'im.v2.lib.notifier';

import { SharedLinkMenu } from './classes/menu';
import { SharedLinkService } from './classes/service';
import { copySharedLink } from './helpers/helpers';

import './css/shared-link.css';

import type { JsonObject } from 'main.core';
import type { BaseEvent } from 'main.core.events';
import type { ImModelChat, ImModelSidebarSharedLinkItem } from 'im.v2.model';

const ICON_SIZE = 20;

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
		ICON_SIZE: () => ICON_SIZE,
		dialog(): ImModelChat
		{
			return this.$store.getters['chats/get'](this.dialogId, true);
		},
		link(): ImModelSidebarSharedLinkItem
		{
			return this.$store.getters['sidebar/sharedLink/getChatInviteLink'](this.dialog.chatId);
		},
		url(): string
		{
			return this.link.url;
		},
	},
	created()
	{
		this.contextMenuManager = new SharedLinkMenu();

		this.contextMenuManager.subscribe(SharedLinkMenu.events.onChangeSharedLink, this.onChangeLink);
	},
	beforeUnmount()
	{
		this.contextMenuManager.destroy();

		this.contextMenuManager.unsubscribe(SharedLinkMenu.events.onChangeSharedLink, this.onChangeLink);
	},
	methods: {
		async onChangeLink(event: BaseEvent)
		{
			this.isLoading = true;

			try
			{
				const { code } = event.getData();
				await (new SharedLinkService()).regenerate(code);

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
		copyLink()
		{
			void copySharedLink(this.url);
		},
		showMenuPopup()
		{
			const context = {
				url: this.url,
				code: this.link.code,
			};

			this.contextMenuManager.openMenu(context, this.$refs['icon-menu']);
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<div @click="copyLink" class="bx-im-sidebar-shared-link__container --ui-context-content-dark">
			<BIcon
				class="bx-im-sidebar-shared-link__icon"
				:name="OutlineIcons.COPY"
				:size="ICON_SIZE"
			/>
			<div class="bx-im-sidebar-shared-link__content">
				<div class="bx-im-sidebar-shared-link__content_title">
					<div class="bx-im-sidebar-shared-link__title">{{ loc('IM_SIDEBAR_SHARED_LINK_DESCRIPTION_MSGVER_1') }}</div>
					<div class="bx-im-sidebar-shared-link__container_icon-menu" ref="icon-menu">
						<BIcon
							class="bx-im-sidebar-shared-link__icon_menu"
							:class="{ '--disabled': isLoading }"
							:name="OutlineIcons.MORE_L"
							:size="ICON_SIZE"
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

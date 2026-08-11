import { type JsonObject } from 'main.core';

import { Core } from 'im.v2.application.core';
import { ChatHeader } from 'im.v2.component.content.elements';
import { type ImModelChat } from 'im.v2.model';

import { type ImolModelSession } from 'imopenlines.v2.model';
import { FinishService } from 'imopenlines.v2.provider.service';

import { ChatTransfer } from '../entity-selector/chat-transfer/chat-transfer';
import { OpenLinesHeaderMenu } from './header-menu';

import './css/header.css';

// @vue/component
export const OpenLinesHeader = {
	name: 'OpenLinesHeader',
	components: { ChatHeader, ChatTransfer },
	props:
	{
		dialogId: {
			type: String,
			required: true,
		},
		isQueueTypeAll: {
			type: Boolean,
			required: true,
		},
	},
	data(): JsonObject
	{
		return {
			showChatTransferPopup: false,
		};
	},
	computed:
	{
		dialog(): ImModelChat
		{
			return this.$store.getters['chats/get'](this.dialogId, true);
		},
		session(): ImolModelSession
		{
			return this.$store.getters['openLines/sessions/getByChatId'](this.dialog.chatId, true);
		},
		isClosed(): boolean
		{
			return this.session ? this.session.isClosed : false;
		},
		isOwner(): boolean
		{
			const userId = Core.getUserId();

			if (this.dialog?.ownerId === userId)
			{
				return true;
			}

			return this.session?.operatorId === userId;
		},
	},
	mounted()
	{
		this.headerMenu = new OpenLinesHeaderMenu();
	},
	beforeUnmount()
	{
		this.headerMenu?.destroy();
	},
	methods:
	{
		onFinish(): Promise
		{
			return this.getFinishService().finishChat(this.dialogId);
		},
		onClickHeaderMenu(event): void
		{
			this.headerMenu.openMenu(
				{ dialogId: this.dialogId, isQueueTypeAll: this.isQueueTypeAll },
				event.currentTarget,
			);
		},
		openChatTransferPopup()
		{
			this.showChatTransferPopup = true;
		},
		getFinishService(): FinishService
		{
			if (!this.finishService)
			{
				this.finishService = new FinishService();
			}

			return this.finishService;
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<div class="bx-imol-header-button_container">
			<ChatHeader
				:dialogId="dialogId"
				:withCallButton="false"
				:withSearchButton="true"
			>
				<template v-if="!isClosed" #before-actions>
					<ul class="bx-imol-header-button_container-list">
						<li class="bx-imol-header-button_container-item">
							<button
								:title="loc('IMOL_CONTENT_HEADER_BUTTON_MORE')"
								class="bx-imol-header-button__icon-container"
								@click="onClickHeaderMenu"
							>
								<i class="bx-imol-header-button__icon fa-solid fa-ellipsis fa-lg"></i>
							</button>
						</li>
						<template v-if="isOwner">
							<li class="bx-imol-header-button_container-item">
								<button
									:title="loc('IMOL_CONTENT_HEADER_BUTTON_FINISH')"
									class="bx-imol-header-button__icon-container"
									@click="onFinish"
								>
									<i class="bx-imol-header-button__icon fa-regular fa-circle-check fa-lg"></i>
								</button>
							</li>
							<li class="bx-imol-header-button_container-item">
								<button
									:title="loc('IMOL_CONTENT_BUTTON_TRANSFER')"
									:class="{'--active': showChatTransferPopup}"
									class="bx-imol-header-button__icon-container"
									@click="openChatTransferPopup"
									ref="transfer-chat"
								>
									<i class="bx-imol-header-button__icon fa-solid fa-arrows-turn-right fa-lg"></i>
								</button>
							</li>
						</template>
					</ul>
				</template>
			</ChatHeader>
			<ChatTransfer
				:bindElement="$refs['transfer-chat'] || {}"
				:dialogId="dialogId"
				:showPopup="showChatTransferPopup"
				:popupConfig="{offsetTop: 15, offsetLeft: -300}"
				@close="showChatTransferPopup = false"
			/>
		</div>
	`,
};

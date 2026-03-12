import { ChatHeader } from 'im.v2.component.content.elements';
import { PulseAnimation } from 'im.v2.component.elements.pulse-animation';
import { EventType } from 'im.v2.const';
import { AddToChat as AddToChatPopup } from 'im.v2.component.entity-selector';

import { CollabTitle } from './collab-title';
import { EntitiesPanel } from './entities-panel/entities-panel';
import { AddToChatButton } from './add-to-chat-button';

import type { JsonObject } from 'main.core';
import type { EventEmitter } from 'main.core.events';
import type { ImModelChat } from 'im.v2.model';

// @vue/component
export const CollabHeader = {
	name: 'CollabHeader',
	components: { ChatHeader, CollabTitle, EntitiesPanel, AddToChatButton, AddToChatPopup, PulseAnimation },
	props:
	{
		dialogId: {
			type: String,
			default: '',
		},
	},
	data(): JsonObject
	{
		return {
			compactMode: false,
			showAddToChatPopupDelayed: false,
		};
	},
	computed:
	{
		dialog(): ImModelChat
		{
			return this.$store.getters['chats/get'](this.dialogId, true);
		},
		isInited(): boolean
		{
			return this.dialog.inited;
		},
	},
	watch:
	{
		async isInited(isInited: boolean)
		{
			if (isInited && this.showAddToChatPopupDelayed)
			{
				await this.$nextTick();
				this.openAddToChatPopup();
			}
		},
	},
	created()
	{
		this.getEmitter().subscribe(EventType.header.openAddToChatPopup, this.onOpenAddToChatPopup);
	},
	beforeUnmount()
	{
		this.getEmitter().unsubscribe(EventType.header.openAddToChatPopup, this.onOpenAddToChatPopup);
	},
	methods:
	{
		onOpenAddToChatPopup()
		{
			if (!this.isInited)
			{
				this.showAddToChatPopupDelayed = true;

				return;
			}

			this.openAddToChatPopup();
		},
		openAddToChatPopup()
		{
			this.$refs['add-to-chat-button'].openAddToChatPopup();
		},
		onCompactModeChange(compactMode: boolean)
		{
			this.compactMode = compactMode;
		},
		getEmitter(): EventEmitter
		{
			return this.$Bitrix.eventEmitter;
		},
	},
	template: `
		<ChatHeader :dialogId="dialogId" @compactModeChange="onCompactModeChange" class="bx-im-collab-header__container">
			<template #title>
				<CollabTitle :dialogId="dialogId" />
			</template>
			<template #before-actions>
				<EntitiesPanel :dialogId="dialogId" :compactMode="compactMode" />
			</template>
			<template #add-to-chat-button>
				<PulseAnimation :showPulse="showAddToChatPopupDelayed" class="bx-im-collab-header__add-to-chat">
					<AddToChatButton 
						:withAnimation="showAddToChatPopupDelayed" 
						:dialogId="dialogId" 
						ref="add-to-chat-button" 
						@close="showAddToChatPopupDelayed = false"
					/>
				</PulseAnimation>
			</template>
		</ChatHeader>
	`,
};

import { ActiveCall } from 'call.widget.active-call';
import { ActiveCallList as ActiveCallListOriginal } from 'call.widget.active-call-list';

import { type ImModelCallItem, type ImModelChat } from 'im.v2.model';
import type { BitrixVueComponentProps } from 'ui.vue3';

import './css/active-call-list.css';

// @vue/component
export const ActiveCallList = {
	name: 'ActiveCallList',
	components: { ActiveCall },
	inject: {
		avatarsOnly: {
			default: false,
		},
	},
	props: {
		listIsScrolled: {
			type: Boolean,
			required: true,
		},
		parentChatId: {
			type: Number,
			default: 0,
		},
	},
	emits: ['onCallClick'],
	data(): { listIsActive: boolean }
	{
		return {
			listIsActive: true,
		};
	},
	computed:
		{
			componentToRender(): BitrixVueComponentProps
			{
				return ActiveCallListOriginal;
			},
			showsOneProject(): boolean
			{
				return this.parentChatId > 0;
			},
			projectCalls(): ImModelCallItem[]
			{
				return this.$store.getters['recent/calls/get'].filter((activeCall: ImModelCallItem) => {
					const chat: ImModelChat = this.$store.getters['chats/get'](activeCall.dialogId, true);

					return this.belongsToProject(chat);
				});
			},
		},
	activated()
	{
		this.listIsActive = true;
	},
	deactivated()
	{
		this.listIsActive = false;
	},
	methods:
		{
			belongsToProject(chat: ImModelChat): boolean
			{
				const chatIsKnown = Number(chat.dialogId) !== 0;
				const chatOfProject = chat.chatId === this.parentChatId || chat.parentChatId === this.parentChatId;

				return chatIsKnown && chatOfProject;
			},
			onCallClick(payload: { item: ImModelCallItem, $event: PointerEvent })
			{
				this.$emit('onCallClick', payload);
			},
		},
	template: `
		<template v-if="listIsActive">
			<template v-if="showsOneProject">
				<div
					v-if="projectCalls.length > 0"
					data-testid="im-active-call-list"
					class="bx-im-list-recent__calls_container"
					:class="{'--with-shadow': listIsScrolled}"
				>
					<ActiveCall
						v-for="activeCall in projectCalls"
						:key="activeCall.dialogId"
						:item="activeCall"
						@click="onCallClick"
					/>
				</div>
			</template>
			<component
				v-else-if="componentToRender"
				:is="componentToRender"
				data-testid="im-active-call-list"
				:class="{'--avatars-only': avatarsOnly}"
				:aria-hidden="avatarsOnly ? 'true' : null"
				:listIsScrolled="listIsScrolled"
				@onCallClick="onCallClick"
			/>
		</template>
	`,
};

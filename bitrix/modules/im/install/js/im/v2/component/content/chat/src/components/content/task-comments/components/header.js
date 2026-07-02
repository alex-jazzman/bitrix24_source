import { type JsonObject } from 'main.core';

import { ChatHeader } from 'im.v2.component.content.elements';
import { Feature, FeatureManager } from 'im.v2.lib.feature';
import { GroupChatTitle, EntityButton } from 'im.v2.component.content.elements';

// @vue/component
export const TaskCommentsHeader = {
	name: 'TaskCommentsHeader',
	components: { ChatHeader, GroupChatTitle, EntityButton },
	props: {
		dialogId: {
			type: String,
			default: '',
		},
		isTaskCardOpened: {
			type: Boolean,
			required: true,
		},
	},
	emits: ['toggleTaskCard'],
	data(): JsonObject
	{
		return {
			compactMode: false,
		};
	},
	computed: {
		isTaskCardAvailable(): boolean
		{
			return FeatureManager.isFeatureAvailable(Feature.isTaskCardAvailable);
		},
		needShowEntityLink(): boolean
		{
			return !this.isTaskCardAvailable;
		},
		entityText(): string
		{
			return this.isTaskCardOpened ?
				this.loc('IM_CONTENT_TASK_ENTITY_CONTROL_CLOSE_CARD_TEXT') :
				this.loc('IM_CONTENT_TASK_ENTITY_CONTROL_OPEN_CARD_TEXT');
		},
	},
	methods: {
		onCompactModeChange(compactMode: boolean)
		{
			this.compactMode = compactMode;
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<ChatHeader 
			:dialogId="dialogId"
			@compactModeChange="onCompactModeChange"
		>
			<template v-if="isTaskCardAvailable" #title="{ onNewTitleHandler }">
				<GroupChatTitle
					:dialogId="dialogId"
					:withEntityLink="needShowEntityLink"
					@newTitle="onNewTitleHandler"
				>
					<template #after-user-counter>
						<EntityButton :text="entityText" :compactMode="compactMode" @click="$emit('toggleTaskCard')"/>
					</template>
				</GroupChatTitle>
			</template>
		</ChatHeader>
	`,
};

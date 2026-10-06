import { type JsonObject } from 'main.core';

import { Feature, FeatureManager } from 'im.v2.lib.feature';
import { GroupChatTitle, ChatHeader } from 'im.v2.component.content.elements';

import { TaskHeaderButton } from './header-button';

// @vue/component
export const TaskCommentsHeader = {
	name: 'TaskCommentsHeader',
	components: { ChatHeader, GroupChatTitle, TaskHeaderButton },
	props: {
		dialogId: {
			type: String,
			default: '',
		},
		isTaskCardOpened: {
			type: Boolean,
			required: true,
		},
		withEmbeddedTaskCard: {
			type: Boolean,
			default: false,
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
			return this.isTaskCardOpened
				? this.loc('IM_CONTENT_TASK_ENTITY_CONTROL_CLOSE_CARD_TEXT_MSGVER_1')
				: this.loc('IM_CONTENT_TASK_ENTITY_CONTROL_OPEN_CARD_TEXT');
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
						<TaskHeaderButton
							:text="entityText"
							:compactMode="compactMode"
							:withEmbeddedTaskCard="withEmbeddedTaskCard"
							@click="$emit('toggleTaskCard')"
						/>
					</template>
				</GroupChatTitle>
			</template>
		</ChatHeader>
	`,
};

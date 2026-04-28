import { type JsonObject } from 'main.core';

import { ChatHeader } from 'im.v2.component.content.elements';
import { Feature, FeatureManager } from 'im.v2.lib.feature';

// @vue/component
export const TaskCommentsHeader = {
	name: 'TaskCommentsHeader',
	components: { ChatHeader },
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
			:withEntityLink="needShowEntityLink" 
			@compactModeChange="onCompactModeChange"
		>
			<template v-if="isTaskCardAvailable" #after-actions>
				<div 
					@click="$emit('toggleTaskCard')" 
					:class="['bx-im-task-comments-header-button__container', { '--active': isTaskCardOpened }]"
				>
					<div class="bx-im-task-comments-header-button__icon"></div>
					<div :class="['bx-im-task-comments-header-button__title', { '--compact': compactMode }]">
						{{ loc('IM_CONTENT_TASK_HEADER_BUTTON_TITLE') }}
					</div>
				</div>
			</template>
		</ChatHeader>
	`,
};

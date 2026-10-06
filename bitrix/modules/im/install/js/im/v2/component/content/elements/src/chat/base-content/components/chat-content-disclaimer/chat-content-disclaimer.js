import { Loc } from 'main.core';
import { RichLoc } from 'ui.vue3.components.rich-loc';

import { CopilotManager } from 'im.v2.lib.copilot';
import { Feature, FeatureManager } from 'im.v2.lib.feature';
import { openHelpdeskArticle } from 'im.v2.lib.helpdesk';

import './css/chat-content-disclaimer.css';

const ARTICLE_CODE = '20412666';

// @vue/component
export const ChatContentDisclaimer = {
	name: 'ChatContentDisclaimer',
	components: { RichLoc },
	props:
	{
		dialogId: {
			type: String,
			default: '',
		},
	},
	computed:
	{
		warningText(): string
		{
			return Loc.getMessage('IM_CONTENT_COPILOT_DISCLAIMER_MSGVER_1', {
				'#COPILOT_NAME#': this.copilotManager.getName(),
			});
		},
		shouldShow(): boolean
		{
			return FeatureManager.isFeatureAvailable(Feature.isBitrixGptV2Available)
				&& FeatureManager.isFeatureAvailable(Feature.copilotAvailable)
				&& FeatureManager.isFeatureAvailable(Feature.copilotActive)
				&& this.$store.getters['copilot/chats/hasAiGeneratedContent'](this.dialogId);
		},
	},
	created()
	{
		this.copilotManager = new CopilotManager();
	},
	methods: {
		onLinkClick()
		{
			openHelpdeskArticle(ARTICLE_CODE);
		},
	},
	template: `
		<div v-if="shouldShow" class="bx-im-chat-content-disclaimer__container">
			<RichLoc
				:text="warningText"
				placeholder="[link]"
				tag="span"
				class="bx-im-chat-content-disclaimer__text --ellipsis"
			>
				<template #link="{ text }">
					<span class="bx-im-chat-content-disclaimer__link" @click="onLinkClick">
						{{ text }}
					</span>
				</template>
			</RichLoc>
		</div>
	`,
};

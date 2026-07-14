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
	computed: {
		warningText(): string
		{
			return Loc.getMessage('IM_CONTENT_COPILOT_DISCLAIMER_MSGVER_1', {
				'#COPILOT_NAME#': this.copilotManager.getName(),
			});
		},
		shouldShowDisclaimer(): boolean
		{
			return FeatureManager.isFeatureAvailable(Feature.isBitrixGptV2Available)
				&& FeatureManager.isFeatureAvailable(Feature.copilotAvailable)
				&& FeatureManager.isFeatureAvailable(Feature.copilotActive);
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
		<div v-if="shouldShowDisclaimer" class="bx-im-chat-content-disclaimer__container --ui-context-content-dark">
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

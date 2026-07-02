import { Loc } from 'main.core';
import { RichLoc } from 'ui.vue3.components.rich-loc';

import { CopilotManager } from 'im.v2.lib.copilot';
import { openHelpdeskArticle } from 'im.v2.lib.helpdesk';

import './css/copilot-disclaimer.css';

const ARTICLE_CODE = '20412666';

// @vue/component
export const CopilotDisclaimer = {
	name: 'CopilotDisclaimer',
	components: { RichLoc },
	computed: {
		warningText(): string
		{
			return Loc.getMessage('IM_CONTENT_COPILOT_DISCLAIMER', {
				'#COPILOT_NAME#': this.copilotManager.getName(),
			});
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
		<div class="bx-im-copilot-disclaimer__container">
			<RichLoc
				:text="warningText"
				placeholder="[link]"
				tag="span"
				class="bx-im-copilot-disclaimer__text --ellipsis"
			>
				<template #link="{ text }">
					<span class="bx-im-copilot-disclaimer__link" @click="onLinkClick">
						{{ text }}
					</span>
				</template>
			</RichLoc>
		</div>
	`,
};

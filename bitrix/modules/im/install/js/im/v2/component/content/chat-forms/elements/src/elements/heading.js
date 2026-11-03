import { HeadlineXs } from 'ui.system.typography.vue';

import 'ui.design-tokens.air';

import { ChatHint } from 'im.v2.component.elements.hint';
import { Feature, FeatureManager } from 'im.v2.lib.feature';

import './css/heading.css';

const SUBTITLE_START = '#SUBTITLE_START#';
const SUBTITLE_END = '#SUBTITLE_END#';

// @vue/component
export const CreateChatHeading = {
	name: 'CreateChatHeading',
	components: { ChatHint, HeadlineXs },
	props:
	{
		text: {
			type: String,
			required: true,
		},
		hintText: {
			type: String,
			required: false,
			default: '',
		},
	},
	computed:
	{
		isAirDesignEnabled(): boolean
		{
			return FeatureManager.isFeatureAvailable(Feature.isAirDesignEnabled);
		},
		preparedText(): string
		{
			return this.text
				.replace(SUBTITLE_START, '<span class="bx-im-content-create-chat__subheading">')
				.replace(SUBTITLE_END, '</span>');
		},
		// The air branch renders the parts as separate typography nodes, so the markers are
		// split out instead of being turned into markup.
		textParts(): { heading: string, subheading: string }
		{
			const [heading, subheading = ''] = this.text.split(SUBTITLE_START);

			return { heading, subheading: subheading.replace(SUBTITLE_END, '') };
		},
	},
	template: `
		<div class="bx-im-content-create-chat__heading_container">
			<HeadlineXs v-if="isAirDesignEnabled">
				{{ textParts.heading }}<HeadlineXs
					v-if="textParts.subheading"
					tag="span"
					className="bx-im-chat-forms-heading__subheading"
				>{{ textParts.subheading }}</HeadlineXs>
			</HeadlineXs>
			<div v-else class="bx-im-content-create-chat__heading" v-html="preparedText"></div>
			<ChatHint v-if="hintText" :text="hintText" />
		</div>
	`,
};

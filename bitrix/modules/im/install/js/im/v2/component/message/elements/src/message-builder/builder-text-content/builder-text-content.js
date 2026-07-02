import { Parser, type ParserInlineSourceLinkSegments } from 'im.v2.lib.parser';

import { TextContent } from '../../text-content/text-content.js';
import { SourceItem } from './components/source-item/item.js';

import './builder-text-content.css';

const TextSegmentType = 'text';

// @vue/component
export const BuilderTextContent = {
	name: 'BuilderTextContent',
	components: { TextContent, SourceItem },
	props: {
		text: {
			type: String,
			required: true,
		},
	},
	computed: {
		TextSegmentType: () => TextSegmentType,
		segments(): ParserInlineSourceLinkSegments
		{
			return Parser.getInlineSourceLinkSegments(this.text);
		},
	},
	template: `
		<TextContent :text="text">
			<template v-for="(segment, index) in segments" :key="index">
				<span v-if="segment.type === TextSegmentType" v-html="segment.value"></span>
				<SourceItem v-else :text="segment.text" :data-source-id="segment.id" />
			</template>
		</TextContent>
	`,
};

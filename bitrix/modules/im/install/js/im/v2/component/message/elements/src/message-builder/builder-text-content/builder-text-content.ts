import { defineComponent } from 'ui.vue3';

import { Parser } from 'im.v2.lib.parser';

import { TextContent } from '../../text-content/text-content';

import './builder-text-content.css';

// @vue/component
export const BuilderTextContent = defineComponent({
	name: 'BuilderTextContent',
	components: { TextContent },
	props: {
		text: {
			type: String,
			required: true,
		},
	},
	computed: {
		formattedText(): string
		{
			return Parser.decodeInlineSourceLinks(this.text);
		},
	},
	template: `
		<TextContent :text="formattedText" />
	`,
});

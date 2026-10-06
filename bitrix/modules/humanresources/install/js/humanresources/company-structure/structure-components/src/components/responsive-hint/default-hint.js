import 'ui.hint';
import { ResponsiveHint } from './responsive-hint';

// @vue/component
export const DefaultHint = {
	name: 'DefaultHint',

	components: { ResponsiveHint },

	props: {
		/** Plain text only: the popup renders it via innerHTML, so it is encoded before show(). */
		content: {
			type: String,
			required: true,
		},
		width: {
			type: Number,
			default: 300,
		},
	},

	template: `
		<ResponsiveHint :content=content>
			<span class="ui-hint-icon"/>
		</ResponsiveHint>
	`,
};

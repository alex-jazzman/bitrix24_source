import { Outline } from 'ui.icon-set.api.vue';
import { Plugins } from 'ui.text-editor';

import { ActionButton } from './action-button';

// @vue/component
export const MentionButton = {
	name: 'EditorActionMention',
	components: {
		ActionButton,
		Outline,
	},
	props: {
		editor: {
			type: Object,
			required: true,
		},
	},
	setup(): Object
	{
		return {
			Outline,
		};
	},
	methods: {
		handleClick(): void
		{
			this.editor.focus(
				() => {
					this.editor.dispatchCommand(
						Plugins.Mention.INSERT_MENTION_DIALOG_COMMAND,
					);
				},
				{ defaultSelection: 'rootEnd' },
			);
		},
	},
	template: `
		<ActionButton
			:iconName="Outline.MENTION"
			:title="loc('TASKS_V2_ENTITY_TEXT_ACTION_MENTION')"
			@click="handleClick"
		/>
	`,
};

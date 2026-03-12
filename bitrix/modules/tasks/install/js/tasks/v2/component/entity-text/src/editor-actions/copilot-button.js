import { Outline } from 'ui.icon-set.api.vue';
import { Plugins } from 'ui.text-editor';

import { Core } from 'tasks.v2.core';

import { ActionButton } from './action-button';

// @vue/component
export const CopilotButton = {
	name: 'EditorActionCopilot',
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
	computed: {
		buttonColor(): String
		{
			return 'var(--ui-color-copilot-primary)';
		},
		copilotText(): String
		{
			return Core.getParams().copilotName;
		},
	},
	methods: {
		handleClick(): void
		{
			this.editor.focus(
				() => {
					this.editor.dispatchCommand(Plugins.Copilot.INSERT_COPILOT_DIALOG_COMMAND);
				},
				{ defaultSelection: 'rootEnd' },
			);
		},
	},
	template: `
		<ActionButton
			:iconName="Outline.COPILOT"
			:iconColor="buttonColor"
			:copilotText
			@click="handleClick"
		/>
	`,
};

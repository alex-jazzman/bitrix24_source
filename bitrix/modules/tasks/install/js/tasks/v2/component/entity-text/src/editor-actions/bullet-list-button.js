import { Outline } from 'ui.icon-set.api.vue';
import { INSERT_UNORDERED_LIST_COMMAND } from 'ui.lexical.list';

import { ActionButton } from './action-button';

// @vue/component
export const BulletListButton = {
	name: 'EditorActionBulletList',
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
			this.editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND);
		},
	},
	template: `
		<ActionButton
			:iconName="Outline.BULLETED_LIST"
			:title="loc('TASKS_V2_ENTITY_TEXT_MORE_BULLET_LIST')"
			@click="handleClick"
		/>
	`,
};

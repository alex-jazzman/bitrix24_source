import { Outline } from 'ui.icon-set.api.vue';

import { ActionButton } from './action-button';

// @vue/component
export const AttachButton = {
	name: 'EditorActionAttach',
	components: {
		ActionButton,
		Outline,
	},
	props: {
		fileService: {
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
			this.fileService.browse({
				bindElement: this.$el,
				onHideCallback: this.onFileBrowserClose,
			});
		},
		onFileBrowserClose(): void
		{
			this.fileService.setFileBrowserClosed(false);
		},
	},
	template: `
		<ActionButton
			:iconName="Outline.ATTACH"
			:title="loc('TASKS_V2_ENTITY_TEXT_ACTION_ATTACH')"
			@click="handleClick"
		/>
	`,
};

import { ChatTextarea } from 'im.v2.component.textarea';

import { ToolbarButtons } from './components/toolbar-buttons/toolbar-buttons';

// @vue/component
export const OpenLinesTextarea = {
	name: 'OpenLinesTextarea',
	components: { ChatTextarea, ToolbarButtons },
	props: {
		dialogId: {
			type: String,
			default: '',
		},
	},
	template: `
		<ChatTextarea :dialogId="dialogId" :key="dialogId">
			<template #bottom-panel-buttons>
				<ToolbarButtons :dialogId="dialogId" />
			</template>
		</ChatTextarea>
	`,
};

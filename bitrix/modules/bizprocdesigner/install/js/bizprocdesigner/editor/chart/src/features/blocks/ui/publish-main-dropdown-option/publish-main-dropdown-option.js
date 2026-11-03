import { mapState, mapWritableState } from 'ui.vue3.pinia';
import {
	DropdownMenuOption,
	WorkflowIcon,
	diagramStore as useDiagramStore,
	TEMPLATE_PUBLISH_STATUSES,
} from '../../../../entities/blocks';

// @vue/components
export const PublishMainDropdownOption = {
	name: 'PublishMainDropdownOption',
	components:
	{
		DropdownMenuOption,
		WorkflowIcon,
	},
	computed:
	{
		...mapWritableState(useDiagramStore, ['templatePublishStatus']),
		...mapState(useDiagramStore, ['isWriteLocked']),
		isActive(): boolean
		{
			return this.templatePublishStatus === TEMPLATE_PUBLISH_STATUSES.MAIN;
		},
	},
	methods:
	{
		onChangeOption()
		{
			// The refusal is here and not only in the interception of the click: the border of the row is
			// part of what a pointer hits, and the handler of the owner sits on the row, so a click on that
			// strip reaches it past the control. Writing the mode while the write is locked is small harm,
			// but it is harm all the same.
			if (this.isWriteLocked)
			{
				return;
			}

			this.templatePublishStatus = TEMPLATE_PUBLISH_STATUSES.MAIN;
		},
	},
	template: `
		<DropdownMenuOption
			:disabled="isWriteLocked"
			data-testid="bizprocdesigner-editor-publish-main-option"
			:title="$Bitrix.Loc.getMessage('BIZPROCDESIGNER_EDITOR_MENU_MAIN_TITLE')"
			:description="$Bitrix.Loc.getMessage('BIZPROCDESIGNER_EDITOR_MENU_MAIN_DESCR')"
			:isActive="isActive"
			:toggle="true"
			@click="onChangeOption"
		>
			<template #icon>
				<WorkflowIcon :active="isActive"/>
			</template>
		</DropdownMenuOption>
	`,
};

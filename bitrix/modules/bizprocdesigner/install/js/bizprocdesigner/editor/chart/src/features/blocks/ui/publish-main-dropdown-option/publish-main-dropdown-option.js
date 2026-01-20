import { mapWritableState } from 'ui.vue3.pinia';
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
		isActive(): boolean
		{
			return this.templatePublishStatus === TEMPLATE_PUBLISH_STATUSES.MAIN;
		},
	},
	methods:
	{
		onChangeOption()
		{
			this.templatePublishStatus = TEMPLATE_PUBLISH_STATUSES.MAIN;
		},
	},
	template: `
		<DropdownMenuOption
			:title="$Bitrix.Loc.getMessage('BIZPROCDESIGNER_EDITOR_MENU_MAIN_TITLE')"
			:description="$Bitrix.Loc.getMessage('BIZPROCDESIGNER_EDITOR_MENU_MAIN_DESCR')"
			:isActive="isActive"
			@click="onChangeOption"
		>
			<template #icon>
				<WorkflowIcon :active="isActive"/>
			</template>
		</DropdownMenuOption>
	`,
};

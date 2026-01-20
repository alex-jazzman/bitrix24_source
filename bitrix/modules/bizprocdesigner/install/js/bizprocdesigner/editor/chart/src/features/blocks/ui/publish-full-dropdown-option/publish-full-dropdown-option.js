import { mapWritableState } from 'ui.vue3.pinia';
import {
	DropdownMenuOption,
	StopIcon,
	diagramStore as useDiagramStore,
	TEMPLATE_PUBLISH_STATUSES,
} from '../../../../entities/blocks';

// @vue/components
export const PublishFullDropdownOption = {
	name: 'PublishFullDropdownOption',
	components:
	{
		DropdownMenuOption,
		StopIcon,
	},
	computed:
	{
		...mapWritableState(useDiagramStore, ['templatePublishStatus']),
		isActive(): boolean
		{
			return this.templatePublishStatus === TEMPLATE_PUBLISH_STATUSES.FULL;
		},
	},
	methods:
	{
		onChangeOption()
		{
			this.templatePublishStatus = TEMPLATE_PUBLISH_STATUSES.FULL;
		},
	},
	template: `
		<DropdownMenuOption
			:title="$Bitrix.Loc.getMessage('BIZPROCDESIGNER_EDITOR_MENU_FULL_TITLE')"
			:description="$Bitrix.Loc.getMessage('BIZPROCDESIGNER_EDITOR_MENU_FULL_DESCR')"
			:isActive="false"
			:notReleased="true"
		>
			<template #icon>
				<StopIcon :active="isActive"/>
			</template>
		</DropdownMenuOption>
	`,
};

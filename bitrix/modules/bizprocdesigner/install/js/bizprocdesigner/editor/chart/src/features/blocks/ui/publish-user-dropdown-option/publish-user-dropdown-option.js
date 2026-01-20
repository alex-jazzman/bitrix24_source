import { mapWritableState } from 'ui.vue3.pinia';
import {
	DropdownMenuOption,
	PersonIcon,
	diagramStore as useDiagramStore,
	TEMPLATE_PUBLISH_STATUSES,
} from '../../../../entities/blocks';

// @vue/components
export const PublishUserDropdownOption = {
	name: 'PublishUserDropdownOption',
	components:
	{
		DropdownMenuOption,
		PersonIcon,
	},
	computed:
	{
		...mapWritableState(useDiagramStore, ['templatePublishStatus']),
		isActive(): boolean
		{
			return this.templatePublishStatus === TEMPLATE_PUBLISH_STATUSES.USER;
		},
	},
	methods:
	{
		onChangeOption()
		{
			this.templatePublishStatus = TEMPLATE_PUBLISH_STATUSES.USER;
		},
	},
	template: `
		<DropdownMenuOption
			:title="$Bitrix.Loc.getMessage('BIZPROCDESIGNER_EDITOR_MENU_PERSONAL_TITLE')"
			:description="$Bitrix.Loc.getMessage('BIZPROCDESIGNER_EDITOR_MENU_PERSONAL_DESCR')"
			:isActive="false"
			:notReleased="true"
		>
			<template #icon>
				<PersonIcon :active="isActive"/>
			</template>
		</DropdownMenuOption>
	`,
};

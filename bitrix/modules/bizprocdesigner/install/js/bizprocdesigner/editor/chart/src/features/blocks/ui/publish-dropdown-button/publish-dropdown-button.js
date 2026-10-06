import { mapState } from 'ui.vue3.pinia';
import { AirButtonStyle } from 'ui.vue3.components.button';

import {
	diagramStore as useDiagramStore,
	DropdownMenuButton,
	usePublishMenuStore,
	TEMPLATE_PUBLISH_STATUSES,
} from '../../../../entities/blocks';
import { usePublishTemplate } from '../../composables/use-publish-template';

// @vue/component
export const PublishDropdownButton = {
	name: 'PublishDropdownButton',
	components: {
		DropdownMenuButton,
	},
	provide(): Object
	{
		return {
			// The item of the menu offering a publication to an audience is an action, and the scenario
			// of that publication lives here: the item starts it instead of carrying a copy of its own.
			publishToPilotAudience: this.publishToChosenAudience,
		};
	},
	props: {
		readonly: {
			type: Boolean,
			default: false,
		},
	},
	setup(props): Object
	{
		return usePublishTemplate(props);
	},
	computed: {
		...mapState(
			useDiagramStore,
			[
				'templatePublishStatus',
				'hasUnpublishedChanges',
				'connections',
				'isEditorReadonly',
			],
		),
		// The onboarding points at an item of the menu, so the menu is opened for it and stays open until
		// the tour is over.
		...mapState(usePublishMenuStore, { isMenuHeldOpen: 'isHeldOpen' }),
		isPublishDisabled(): boolean
		{
			return !this.canPublish;
		},
		icon(): string
		{
			const icons = {
				[TEMPLATE_PUBLISH_STATUSES.MAIN]: 'ui-btn-icon-workflow',
				[TEMPLATE_PUBLISH_STATUSES.USER]: 'ui-btn-icon-person',
				[TEMPLATE_PUBLISH_STATUSES.FULL]: 'ui-btn-icon-workflow-stop',
			};

			return icons[this.templatePublishStatus];
		},
		style(): string
		{
			return this.hasUnpublishedChanges
				? AirButtonStyle.FILLED
				: AirButtonStyle.OUTLINE_ACCENT_2
			;
		},
	},
	template: `
		<DropdownMenuButton
			data-testid="bizprocdesigner-editor-publish-button"
			:data-disabled="isPublishDisabled ? 'true' : 'false'"
			:text="$Bitrix.Loc.getMessage('BIZPROCDESIGNER_EDITOR_PUBLISH')"
			:icon="icon"
			:loading="isPublishing"
			:style="style"
			:disabled="isPublishDisabled"
			:hint="publishHint"
			:keepOpen="isMenuHeldOpen"
			@change="publishTemplate"
		>
			<template #default>
				<slot/>
			</template>
		</DropdownMenuButton>
	`,
};

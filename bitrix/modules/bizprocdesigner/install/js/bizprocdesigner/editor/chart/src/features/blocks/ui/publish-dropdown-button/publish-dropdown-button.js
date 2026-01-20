import { mapState, mapActions } from 'ui.vue3.pinia';
import { UI } from 'ui.notification';
import { handleResponseError } from '../../../../shared/utils';
import {
	DropdownMenuButton,
	diagramStore as useDiagramStore,
	TEMPLATE_PUBLISH_STATUSES,
} from '../../../../entities/blocks';

type PublishDropdownButtonData = {
	isLoading: boolean,
};

// @vue/component
export const PublishDropdownButton = {
	name: 'PublishDropdownButton',
	components: {
		DropdownMenuButton,
	},
	data(): PublishDropdownButtonData
	{
		return {
			isLoading: false,
		};
	},
	computed: {
		...mapState(useDiagramStore, ['templatePublishStatus']),
		icon(): string
		{
			const icons = {
				[TEMPLATE_PUBLISH_STATUSES.MAIN]: 'ui-btn-icon-workflow',
				[TEMPLATE_PUBLISH_STATUSES.USER]: 'ui-btn-icon-person',
				[TEMPLATE_PUBLISH_STATUSES.FULL]: 'ui-btn-icon-workflow-stop',
			};

			return icons[this.templatePublishStatus];
		},
	},
	methods: {
		...mapActions(useDiagramStore, [
			'publicTemplate',
		]),
		publishTemplate(): void
		{
			({
				[TEMPLATE_PUBLISH_STATUSES.MAIN]: this.fetchPublishMainTemplate,
				[TEMPLATE_PUBLISH_STATUSES.USER]: this.fetchPublishUserTemplate,
				[TEMPLATE_PUBLISH_STATUSES.FULL]: this.fetchPublishFullTemplate,
			})[this.templatePublishStatus]();
		},
		async fetchPublishMainTemplate()
		{
			this.isLoading = true;

			try
			{
				await this.publicTemplate();

				UI.Notification.Center.notify({
					content: this.$Bitrix.Loc.getMessage('BIZPROCDESIGNER_EDITOR_MENU_SAVE_SUCCESS') ?? '',
					autoHideDelay: 5000,
				});
			}
			catch (error)
			{
				handleResponseError(error);
			}
			finally
			{
				this.isLoading = false;
			}
		},
		fetchPublishUserTemplate(): void
		{
			alert('doUserPublication');
			this.loading = false;
		},
		fetchPublishFullTemplate(): void
		{
			alert('doFullPublication');
			this.loading = false;
		},
	},
	template: `
		<DropdownMenuButton
			:text="$Bitrix.Loc.getMessage('BIZPROCDESIGNER_EDITOR_PUBLISH')"
			:icon="icon"
			:loading="isLoading"
			@change="publishTemplate"
		>
			<template #default>
				<slot/>
			</template>
		</DropdownMenuButton>
	`,
};

import { UI } from 'ui.notification';
import { Loc, Type } from 'main.core';
import { mapState, mapActions } from 'ui.vue3.pinia';
import { useToastStore } from '../../../../shared/stores';
import { AirButtonStyle } from 'ui.vue3.components.button';
import {
	diagramStore as useDiagramStore,
	DropdownMenuButton,
	TEMPLATE_PUBLISH_STATUSES,
	BLOCK_TOAST_TYPES,
} from '../../../../entities/blocks';
import type { TimestampMap } from '../../../../shared/types';
import { handleResponseError } from '../../../../shared/utils';

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
		...mapState(
			useDiagramStore,
			[
				'templatePublishStatus',
				'blockCurrentTimestamps',
				'blockSavedTimestamps',
				'connectionCurrentTimestamps',
				'connectionSavedTimestamps',
				'connections',
			],
		),
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
			const isChanged = this.isChanged(this.blockCurrentTimestamps, this.blockSavedTimestamps)
				|| this.isChanged(this.connectionCurrentTimestamps, this.connectionSavedTimestamps)
			;

			return isChanged
				? AirButtonStyle.FILLED
				: AirButtonStyle.OUTLINE_ACCENT_2
			;
		},
	},
	methods: {
		...mapActions(useDiagramStore, [
			'publicTemplate',
		]),
		...mapActions(useToastStore, {
			addCustomToast: 'addCustom',
			clearAllToastOfType: 'clearAllOfType',
		}),
		publishTemplate(): void
		{
			({
				[TEMPLATE_PUBLISH_STATUSES.MAIN]: this.fetchPublishMainTemplate,
				[TEMPLATE_PUBLISH_STATUSES.USER]: this.fetchPublishUserTemplate,
				[TEMPLATE_PUBLISH_STATUSES.FULL]: this.fetchPublishFullTemplate,
			})[this.templatePublishStatus]();
		},
		async fetchPublishMainTemplate(): Promise<void>
		{
			this.isLoading = true;

			this.clearAllToastOfType(BLOCK_TOAST_TYPES.ACTIVITY_PUBLIC_ERROR);

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
				if (Type.isArrayFilled(error.data?.activityErrors))
				{
					this.addCustomToast(
						Loc.getMessage('BIZPROCDESIGNER_EDITOR_PUBLISH_ERROR_TOAST'),
						BLOCK_TOAST_TYPES.ACTIVITY_PUBLIC_ERROR,
					);
				}

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
		isChanged(current: TimestampMap, published: TimestampMap): boolean
		{
			const keysCurrent = Object.keys(current);
			const keysPublished = Object.keys(published);

			if (keysCurrent.length !== keysPublished.length)
			{
				return true;
			}

			for (const key of keysCurrent)
			{
				if (current[key] !== published[key])
				{
					return true;
				}
			}

			return false;
		},
	},
	template: `
		<DropdownMenuButton
			:text="$Bitrix.Loc.getMessage('BIZPROCDESIGNER_EDITOR_PUBLISH')"
			:icon="icon"
			:loading="isLoading"
			:style="style"
			@change="publishTemplate"
		>
			<template #default>
				<slot/>
			</template>
		</DropdownMenuButton>
	`,
};

import { EventEmitter } from 'main.core.events';
import { Text, Type } from 'main.core';
import { Notifier, NotificationOptions } from 'ui.notification-manager';

import { EventName, Model } from 'booking.const';
import { SkuResourcesEditor } from 'booking.application.sku-resources-editor';
import { resourceService } from 'booking.provider.service.resources-service';
import { resourceDialogService } from 'booking.provider.service.resource-dialog-service';

import type { ResourceModel } from 'booking.model.resources';
import type { CatalogSkuEntityOptions } from 'booking.model.sku';

// @vue/component
export const SkusSettings = {
	name: 'SkusSettings',
	created(): void
	{
		EventEmitter.subscribe(EventName.BookingOpenSkusSettings, this.openSkuResourcesEditor);
	},
	methods: {
		async openSkuResourcesEditor(): void
		{
			const editor = new SkuResourcesEditor({
				title: this.loc('BOOKING_BOOKING_SKUS_SETTINGS_TITLE'),
				description: this.loc('BOOKING_BOOKING_SKUS_SETTINGS_DESCRIPTION'),
				options: {
					editMode: false,
					canBeEmpty: true,
					catalogSkuEntityOptions: this.getCatalogSkuEntityOptions(),
				},
				loadData: () => this.getResources(),
				save: (data) => this.saveResources(data),
			});

			editor.open();
		},
		async fetchResourceSkuRelations(): Promise<void>
		{
			await resourceService.loadResourceSkuRelations();
		},
		async fetchMainResources(): Promise<void>
		{
			await resourceDialogService.getMainResources();
		},
		getCatalogSkuEntityOptions(): CatalogSkuEntityOptions
		{
			return this.$store.state[Model.Sku].catalogSkuEntityOptions;
		},
		async getResources(): ResourceModel[]
		{
			await Promise.all([
				this.fetchResourceSkuRelations(),
				this.fetchMainResources(),
			]);

			return this.$store.state[Model.Resources].resourcesSkuRelations;
		},
		async saveResources(data): void
		{
			if (Type.isNil(data) || !Type.isArray(data.resources))
			{
				return;
			}

			try
			{
				await resourceService.updateResourceSkuRelations(data.resources);

				Notifier.notify(this.prepareNotificationOptions(
					this.loc('BOOKING_BOOKING_SKUS_SETTINGS_UPDATE_SUCCESS_MESSAGE'),
				));
			}
			catch (error)
			{
				console.error('save Resources data error', error);
			}
		},
		prepareNotificationOptions(text: string): NotificationOptions
		{
			return {
				id: Text.getRandom(),
				text,
			};
		},
	},
	template: `

	`,
};

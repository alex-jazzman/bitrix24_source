import { Loc, Type } from 'main.core';
import { BIcon as Icon, Outline, Main } from 'ui.icon-set.api.vue';

import { Model, IntegrationMapItemStatus } from 'booking.const';
import { Button, ButtonColor, ButtonSize } from 'booking.component.button';
import { UiResourceWizardItem } from 'booking.component.ui-resource-wizard-item';
import { Avatar as UiAvatar } from 'booking.component.avatar';
import { SkuResourcesEditor } from 'booking.application.sku-resources-editor';
import { deepToRaw } from 'booking.lib.deep-to-raw';
import { resourceDialogService } from 'booking.provider.service.resource-dialog-service';
import type { ResourceModel } from 'booking.model.resources';
import type { CatalogSkuEntityOptions } from 'booking.model.sku';

import './settings-resource.css';

// @vue/component
export const YandexIntegrationWizardSettingsResource = {
	name: 'YandexIntegrationWizardSettingsResource',
	components: {
		UiResourceWizardItem,
		UiButton: Button,
		UiAvatar,
		Icon,
	},
	setup(): {
		ButtonColor: typeof ButtonColor,
		ButtonSize: typeof ButtonSize,
		Outline: typeof Outline,
		Main: typeof Main
		}
	{
		return {
			ButtonColor,
			ButtonSize,
			Outline,
			Main,
		};
	},
	computed: {
		selectedResources(): ResourceModel[]
		{
			return this.$store.state[Model.YandexIntegrationWizard].resources.filter((resource) => {
				return resource.skusYandex.length > 0;
			});
		},
		selectedResourcesCount(): number
		{
			return this.selectedResources?.length ?? 0;
		},
		buttonTitle(): string
		{
			return this.selectedResourcesCount > 0
				? this.loc('YANDEX_WIZARD_SETTINGS_RESOURCE_BUTTON_MORE')
				: this.loc('YANDEX_WIZARD_SETTINGS_RESOURCE_BUTTON_CHOOSE');
		},
		informTitle(): string
		{
			if (this.selectedResourcesCount > 0)
			{
				return Loc.getMessagePlural('YANDEX_WIZARD_SETTINGS_RESOURCE_STATE', this.selectedResourcesCount, {
					'#COUNT#': this.selectedResourcesCount,
				});
			}

			return this.loc('YANDEX_WIZARD_SETTINGS_RESOURCE_STATE_EMPTY');
		},
		imageClass(): string
		{
			switch (this.selectedResourcesCount)
			{
				case 0:
					return '';
				case 1:
					return '--one';
				case 2:
					return '--two';
				case 3:
					return '--three';
				default:
					return '--many';
			}
		},
		avatarSize(): number
		{
			switch (this.selectedResourcesCount)
			{
				case 1:
					return 64;
				case 2:
					return 46;
				default:
					return 32;
			}
		},
		shownResources(): Array
		{
			return this.selectedResources.slice(0, 4);
		},
		amountHiddenResource(): number
		{
			return Math.max(this.selectedResourcesCount - 4, 0);
		},
		integrationStatus(): $Values<typeof IntegrationMapItemStatus>
		{
			return (
				this.$store.state[Model.YandexIntegrationWizard].integration.status
				|| IntegrationMapItemStatus.NOT_CONNECTED
			);
		},
	},
	methods: {
		openSkuResourcesEditor(): void
		{
			const editor = new SkuResourcesEditor({
				title: this.loc('YANDEX_WIZARD_POPUP_RESOURCE_POPUP_TITLE'),
				description: this.loc('YANDEX_WIZARD_POPUP_RESOURCE_POPUP_DESCRIPTION'),
				options: {
					editMode: true,
					catalogSkuEntityOptions: this.getCatalogSkuEntityOptions(),
				},
				loadData: () => this.getResources(),
				save: (data) => this.saveResources(data),
			});

			editor.open();
		},
		getCatalogSkuEntityOptions(): CatalogSkuEntityOptions
		{
			return this.$store.state[Model.Sku].catalogSkuEntityOptions;
		},
		saveResources(data): void
		{
			if (Type.isNil(data) || !Type.isArray(data.resources))
			{
				return;
			}

			const resources = data.resources.map((resource) => {
				return {
					...resource,
					skusYandex: resource.skus,
				};
			});
			void this.$store.dispatch(`${Model.YandexIntegrationWizard}/updateResourcesSkusYandex`, resources);
		},
		async getResources(): ResourceModel[]
		{
			const notConnected = this.integrationStatus === IntegrationMapItemStatus.NOT_CONNECTED;
			const resources = this.$store.state[Model.YandexIntegrationWizard].resources.map((resource) => {
				return {
					...resource,
					avatar: { ...resource.avatar },
					skus: deepToRaw(notConnected && resource.skusYandex.length === 0 ? resource.skus : resource.skusYandex),
				};
			});

			await resourceDialogService.getMainResources();
			const mainResources = (this.$store.getters[`${Model.Resources}/get`] || []).map((resource) => {
				return {
					...resource,
					skus: [],
					skusYandex: [],
				};
			});

			return [
				...mainResources,
				...resources,
			];
		},
	},
	template: `
		<UiResourceWizardItem
			:iconType="Outline.USER_PROFILE"
			:title="loc('YANDEX_WIZARD_SETTINGS_RESOURCE_TITLE')"
			:description="loc('YANDEX_WIZARD_SETTINGS_RESOURCE_DESCRIPTION')"
			helpDeskType="YandexIntegrationServices"
		>
			<div class="booking-yiw-settings-resource__content --ui-context-content-light">
				<div
					class="booking-yiw-settings-resource__content-icons"
					:class="imageClass"
				>
					<div v-if="selectedResourcesCount === 0"
						 class="booking-yiw-settings-resource__content-icon_empty"
					></div>
					<template v-else>
						<template v-for="resource in shownResources">
							<UiAvatar
								:size="avatarSize"
								:userName="resource.name"
								:userpicPath="resource?.avatar?.url"
								baseColor="#B15EF5"
								class="booking-yiw-settings-resource__ui-avatar"
							/>
						</template>
						<div
							v-if="amountHiddenResource"
							class="booking-yiw-settings-resource__amount-excess-resources"
						>
							+{{ amountHiddenResource }}
						</div>
					</template>
				</div>
				<div class="booking-yiw-settings-resource__content-inform">
					<div class="booking-yiw-settings-resource__content-inform_text">
						{{ informTitle }}
					</div>
					<div class="booking-yiw-settings-resource__content-inform_button-block">
						<UiButton
							:text="buttonTitle"
							:size="ButtonSize.SMALL"
							:color="ButtonColor.PRIMARY"
							data-element="booking-yiw-btn-add-more-resource"
							noCaps
							useAirDesign
							@click="openSkuResourcesEditor"
						/>
						<div
							v-if="selectedResourcesCount > 0"
							class="booking-yiw-settings-resource__content-inform_done"
						>
							<Icon
								:name="Main.CIRCLE_CHECK"
								color="var(--ui-color-accent-main-success)"
								:size="18"
							/>
							{{ loc('YANDEX_WIZARD_SETTINGS_RESOURCE_STATE_DONE_LABEL') }}
						</div>
					</div>
				</div>
			</div>
		</UiResourceWizardItem>
	`,
};

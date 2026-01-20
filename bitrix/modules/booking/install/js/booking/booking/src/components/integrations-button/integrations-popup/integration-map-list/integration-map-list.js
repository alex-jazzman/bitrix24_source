import { createNamespacedHelpers } from 'ui.vue3.vuex';
import { Loader, LoaderType } from 'booking.component.loader';
import { HelpDeskLoc } from 'booking.component.help-desk-loc';
import { IntegrationMapItemCode, IntegrationMapItemStatus, Model } from 'booking.const';
import { YandexIntegrationWizard } from 'booking.application.yandex-integration-wizard';
import { IntegrationItem } from 'booking.model.sale-channels';
import { saleChannelsService } from 'booking.provider.service.sale-channels-service';

import { StatusControl } from './components/status-control/status-control';
import { BackButton } from '../components/back-button';

import './integration-map-list.css';

const { mapGetters, mapActions } = createNamespacedHelpers(Model.SaleChannels);

type IntegrationItemConfig = {
	code: $Values<typeof IntegrationMapItemCode>;
	title: string;
	imageClass: string;
	click?: () => void;
};

export type IntegrationMapItem = IntegrationItem & IntegrationItemConfig;

// @vue/component
export const IntegrationMapList = {
	name: 'IntegrationMapList',
	components: {
		BackButton,
		HelpDeskLoc,
		Loader,
		IntegrationMapItemStatusControl: StatusControl,
	},
	emits: ['update:view', 'update:visible'],
	setup(): Object
	{
		return {
			LoaderType,
		};
	},
	data(): Object
	{
		return {
			integrationsConfig: [
				{
					code: IntegrationMapItemCode.YANDEX,
					title: this.loc('BOOKING_INTEGRATIONS_MAPS_LIST_YANDEX_TITLE'),
					imageClass: '--yandex',
					click: () => this.openYandexIntegrationWizard(),
				},
				{
					code: IntegrationMapItemCode.GIS,
					title: this.loc('BOOKING_INTEGRATIONS_MAPS_LIST_GIS_TITLE'),
					imageClass: '--gis',
				},
			],
		};
	},
	computed: {
		...mapGetters([
			'getIntegrations',
			'isLoaded',
			'isFetching',
		]),
		items(): IntegrationMapItem[]
		{
			return this.getIntegrations
				.map((item: IntegrationItem): IntegrationMapItem => {
					const itemConfig = this.integrationsConfig
						.find((config: IntegrationItemConfig): boolean => config.code === item.code)
					;

					if (!itemConfig)
					{
						return null;
					}

					return {
						...item,
						...itemConfig,
					};
				})
				.filter(Boolean);
		},
	},
	async mounted(): Promise<void> {
		await this.fetchIntegrationStatuses();
	},
	methods: {
		...mapActions([
			'setFetching',
		]),
		async fetchIntegrationStatuses(): Promise<void>
		{
			if (this.isLoaded)
			{
				return;
			}

			this.setFetching(true);

			try
			{
				await saleChannelsService.loadData();
			}
			finally
			{
				this.setFetching(false);
			}
		},
		openYandexIntegrationWizard(): void
		{
			const wizard = new YandexIntegrationWizard();
			wizard.open();

			this.$emit('update:visible', false);
		},
	},
	template: `
		<div class="booking--integration-popup--integration-map-list">
			<div class="booking--integration-popup--integration-map-list__header">
				<div class="booking--integration-popup--integration-map-list__title-line">
					<BackButton @click="$emit('update:view', 'IntegrationList')" />
					<h5 class="booking--integration-popup--integration-map-list__title">
						{{ loc('BOOKING_INTEGRATIONS_MAPS_LIST_TITLE') }}
					</h5>
				</div>
				<div class="booking--integration-popup--integration-map-list__description">
					<HelpDeskLoc :message="loc('BOOKING_INTEGRATIONS_MAPS_LIST_DESCRIPTION')" />
				</div>
			</div>
			<Loader 
				v-if="isFetching" 
				class="booking--integration-popup--integration-map-list__loader"
				:options="{ type: LoaderType.DEFAULT }"
			/>
			<div v-if="!isFetching" class="booking--integration-popup--integration-map-list__list">
				<div
					v-for="item in items"
					:key="item.code"
					class="booking--integration-popup--integration-map-list-item"
				>
					<div class="booking--integration-popup--integration-map-list-item__header">
						<div
							class="booking--integration-popup--integration-map-list-item__image"
							:class="item.imageClass"
						>
						</div>
						<div class="booking--integration-popup--integration-map-list-item__title">
							{{ item.title }}
						</div>
					</div>
					<IntegrationMapItemStatusControl :item />
				</div>
			</div>
		</div>
	`,
};

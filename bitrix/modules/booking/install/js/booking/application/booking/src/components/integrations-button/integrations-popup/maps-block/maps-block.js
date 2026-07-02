import { YandexIntegrationWizard } from 'booking.application.yandex-integration-wizard';
import { Loc } from 'main.core';

import { AhaMoment, IntegrationMapItemCode, IntegrationMapItemStatus, Model } from 'booking.const';
import { ahaMoments } from 'booking.lib.aha-moments';

import { OptionCard } from '../../../option-card/option-card';
import imgLogoYa from '../../../../images/logo_ya_maps_square_rounded.png';
import imgLogoTwoGis from '../../../../images/logo_two_gis_square_rounded.png';

const OPTIONS_MAPS_STATUSES = [
	{
		id: 1,
		name: IntegrationMapItemStatus.NotConnected,
		value: Loc.getMessage('BOOKING_INTEGRATIONS_POPUP_MAPS_STATUS_NOT_CONNECTED'),
	},
	{
		id: 2,
		name: IntegrationMapItemStatus.InProgress,
		value: Loc.getMessage('BOOKING_INTEGRATIONS_POPUP_MAPS_STATUS_IN_PROGRESS'),
	},
	{
		id: 3,
		name: IntegrationMapItemStatus.Connected,
		value: Loc.getMessage('BOOKING_INTEGRATIONS_POPUP_MAPS_STATUS_CONNECTED'),
	},
];

// @vue/component
export const MapsBlock = {
	name: 'IntegrationPopupMapsBlock',
	components: {
		OptionCard,
	},
	props: {
		integrations: {
			type: Array,
			default: () => [],
		},
	},
	emits: ['freeze', 'unfreeze'],
	setup(): Object
	{
		return {
			imgLogoYa,
			imgLogoTwoGis,
		};
	},
	computed: {
		optionMapYa(): { id: string, [key: string]: any }
		{
			return {
				id: 'optionMapYa',
				code: IntegrationMapItemCode.Yandex,
				imgSrc: this.imgLogoYa,
				head: this.loc('BOOKING_INTEGRATIONS_POPUP_YANDEX_MAP_LABEL_MSGVER_1'),
				counter: {
					id: 'counterMapsYa',
					value: this.counterMapsYa,
				},
				click: this.handleClickMapYa,
			};
		},
		optionMapTwoGis(): { id: string, [key: string]: any }
		{
			return {
				id: 'option2GIS',
				code: IntegrationMapItemCode.Gis,
				imgSrc: this.imgLogoTwoGis,
				head: this.loc('BOOKING_INTEGRATIONS_POPUP_2GIS_LABEL'),
			};
		},
		optionsMaps(): any
		{
			const optionsNew = {
				[IntegrationMapItemCode.Yandex]: this.optionMapYa,
				[IntegrationMapItemCode.Gis]: this.optionMapTwoGis,
			};

			return this.integrations.map((integration) => {
				const integrationOption = optionsNew[integration.code];
				const integrationDescription = OPTIONS_MAPS_STATUSES.find((status) => status.name === integration.status)?.value
					|| this.loc('BOOKING_INTEGRATIONS_POPUP_LABEL_SOON');

				return {
					...integrationOption,
					description: integrationDescription,
					isDisabled: !(integration.status),
					isInline: true,
				};
			});
		},
		counterMapsYa(): number
		{
			return this.$store.state[Model.Counters].counters.newYandexMaps ?? 0;
		},
	},
	mounted(): void
	{
		if (ahaMoments.shouldShow(AhaMoment.IntegrationMapsYa))
		{
			void this.$nextTick(this.showAhaMomentMapsYa);
		}
	},
	methods: {
		handleClickMapYa(): void
		{
			this.openYandexIntegrationWizard();
		},
		openYandexIntegrationWizard(): void
		{
			const wizard = new YandexIntegrationWizard();
			wizard.open();
		},
		async showAhaMomentMapsYa(): Promise<void>
		{
			this.$emit('freeze');
			const optionYandexMapEl = this.$refs[`option${this.optionMapYa.id}`]?.[0]?.$el || null;

			if (optionYandexMapEl === null)
			{
				return;
			}

			await ahaMoments.show({
				id: 'booking-integrations-aha-moment-maps-ya',
				title: '',
				text: this.loc('BOOKING_INTEGRATIONS_POPUP_YANDEX_MAP_AHA'),
				target: optionYandexMapEl,
				top: true,
				isPulsarTransparent: true,
			});

			ahaMoments.setShown(AhaMoment.IntegrationMapsYa);
			this.$emit('unfreeze');
		},
	},
	template: `
		<div
			v-if="optionsMaps.length > 0"
			class="booking-integrations__options"
		>
			<div class="booking-integrations__options-header">
				<p class="booking-integrations__options-header-head">
					{{ loc('BOOKING_INTEGRATIONS_POPUP_MAPS_TITLE') }}
				</p>
			</div>
			<ul class="booking-integrations__options-list">
				<li v-for="option in optionsMaps" :key="option" class="booking-integrations__option">
					<OptionCard
						:ref="'option' + option.id"
						:id="option.id"
						v-bind="option"
						@click="option.click"
					/>
				</li>
			</ul>
		</div>
	`,
};

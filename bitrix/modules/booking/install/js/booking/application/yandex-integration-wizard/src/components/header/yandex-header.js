import { BIcon as Icon, Set as IconSet, Outline } from 'ui.icon-set.api.vue';
import { EmptyRichLoc } from 'booking.component.help-desk-loc';

import './yandex-header.css';

// @vue/component
export const YandexIntegrationWizardLayoutHeader = {
	name: 'YandexIntegrationWizardLayoutHeader',
	components: {
		EmptyRichLoc,
		Icon,
	},
	setup(): { IconSet: typeof IconSet, Outline: typeof Outline }
	{
		return {
			IconSet,
			Outline,
		};
	},
	computed: {
		integrationMapsImageUrl(): string
		{
			const languageId = this.loc('LANGUAGE_ID') ?? 'en';
			const imageLanguageId = languageId === 'ru' ? 'ru' : 'en';

			return `/bitrix/js/booking/application/yandex-integration-wizard/images/integrations-maps-${imageLanguageId}.png`;
		},
	},
	template: `
		<div class="booking-yiw__title">
			{{ loc('YANDEX_WIZARD_TITLE') }}
		</div>
		<div class="booking-yiw__info">
			<div class="booking-yiw__info-text">
				<div class="booking-yiw__info_icon-block">
					<div class="booking-yiw__info_icon"></div>
				</div>
				<div class="booking-yiw__info-text_block">
					<div class="booking-yiw__info-text_title">
						<EmptyRichLoc
							:message="loc('YANDEX_WIZARD_SUB_TITLE')"
							:rules="['br']"
						/>
					</div>
					<div class="booking-yiw__info-text_points">
						<div class="booking-yiw__info-text_point">
							<div class="booking-yiw__info-text_point-icon">
								<Icon
									:name="Outline.OBSERVER"
									color="white"
									:size="14"
								/>
							</div>
							<div class="booking-yiw__info-text_point-icon-text">
								{{ loc('YANDEX_WIZARD_POINT_1') }}
							</div>
						</div>
						<div class="booking-yiw__info-text_point">
							<div class="booking-yiw__info-text_point-icon">
								<Icon
									:name="Outline.FLAG"
									color="white"
									:size="14"
								/>
							</div>
							<div class="booking-yiw__info-text_point-icon-text">
								{{ loc('YANDEX_WIZARD_POINT_2') }}
							</div>
						</div>
						<div class="booking-yiw__info-text_point">
							<div class="booking-yiw__info-text_point-icon">
								<Icon
									:name="Outline.ONLINE_BOOKING"
									color="white"
									:size="14"
								/>
							</div>
							<div class="booking-yiw__info-text_point-icon-text">
								{{ loc('YANDEX_WIZARD_POINT_3') }}
							</div>
						</div>
					</div>
				</div>
			</div>
			<img 
				class="booking-yiw__info-map"
				:src="integrationMapsImageUrl"
				:alt="loc('YANDEX_WIZARD_TITLE')"
				draggable="false"
			/>
		</div>
	`,
};

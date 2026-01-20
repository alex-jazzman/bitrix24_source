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
	setup(): Object
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
		<div class="yandex-wizard__title">
			{{ loc('YANDEX_WIZARD_TITLE') }}
		</div>
		<div class="yandex-wizard__info">
			<div class="yandex-wizard__info-text">
				<div class="yandex-wizard__info_icon-block">
					<div class="yandex-wizard__info_icon"></div>
				</div>
				<div class="yandex-wizard__info-text_block">
					<div class="yandex-wizard__info-text_title">
						<EmptyRichLoc
							:message="loc('YANDEX_WIZARD_SUB_TITLE')"
							:rules="['br']"
						/>
					</div>
					<div class="yandex-wizard__info-text_points">
						<div class="yandex-wizard__info-text_point">
							<div class="yandex-wizard__info-text_point-icon">
								<Icon
									:name="Outline.OBSERVER"
									color="white"
									:size="14"
								/>
							</div>
							<div class="yandex-wizard__info-text_point-icon-text">
								{{ loc('YANDEX_WIZARD_POINT_1') }}
							</div>
						</div>
						<div class="yandex-wizard__info-text_point">
							<div class="yandex-wizard__info-text_point-icon">
								<Icon
									:name="Outline.FLAG"
									color="white"
									:size="14"
								/>
							</div>
							<div class="yandex-wizard__info-text_point-icon-text">
								{{ loc('YANDEX_WIZARD_POINT_2') }}
							</div>
						</div>
						<div class="yandex-wizard__info-text_point">
							<div class="yandex-wizard__info-text_point-icon">
								<Icon
									:name="Outline.ONLINE_BOOKING"
									color="white"
									:size="14"
								/>
							</div>
							<div class="yandex-wizard__info-text_point-icon-text">
								{{ loc('YANDEX_WIZARD_POINT_3') }}
							</div>
						</div>
					</div>
				</div>
			</div>
			<img 
				class="yandex-wizard__info-map"
				:src="integrationMapsImageUrl"
				:alt="loc('YANDEX_WIZARD_TITLE')"
				draggable="false"
			/>
		</div>
	`,
};

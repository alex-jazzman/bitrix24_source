import { Loc } from 'main.core';
import { DateTimeFormat } from 'main.date';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import { HeadlineXl, TextSm } from 'ui.system.typography.vue';
import { AirButtonStyle, Button as UiButton, ButtonSize } from 'ui.vue3.components.button';
import 'ui.design-tokens';

import {
	getApplicationLimitActions,
	type ApplicationLimitAction,
	type ApplicationLimitDto,
	type ApplicationLimitPresentation,
	resolveApplicationLimitPresentation,
} from '../../model/application-limit/types';
import {
	APPLICATION_LIMIT_LEARN_MORE_TEST_ID,
	getApplicationLimitActionTestId,
} from './test-ids';
import { AppsProgressRing } from './apps-progress-ring';

import './application-limit-popup.css';

type BitrixWithHelper = typeof BX & {
	Helper: {
		show(code: string): void,
	},
};

export const ApplicationLimitPopupComponent = {
	name: 'MarketVibePlusApplicationLimitPopup',
	components: {
		BIcon,
		AppsProgressRing,
		HeadlineXl,
		TextSm,
		UiButton,
	},
	props: {
		dto: {
			type: Object,
			required: true,
		},
		onAction: {
			type: Function,
			required: true,
		},
		onClose: {
			type: Function,
			required: true,
		},
	},
	data(): Object
	{
		return {
			buttonSize: ButtonSize.LARGE,
			closeIcon: Outline.CROSS_M,
			learnMoreTestId: APPLICATION_LIMIT_LEARN_MORE_TEST_ID,
		};
	},
	computed: {
		presentation(this: any): ApplicationLimitPresentation
		{
			const presentation = resolveApplicationLimitPresentation(this.dto);
			if (presentation === null)
			{
				throw new TypeError('The application limit popup received an invalid projection.');
			}

			return presentation;
		},
		actions(this: any): ApplicationLimitAction[]
		{
			return getApplicationLimitActions(this.dto);
		},
		title(this: any): string
		{
			const suffix = this.presentation.variant === 'transition' ? 'TRANSITION' : 'ACTIVE';

			return Loc.getMessage(`MARKET_VIBE_PLUS_APPLICATION_LIMIT_POPUP_TITLE_${suffix}`) ?? '';
		},
		contentParagraphs(this: any): string[]
		{
			const replacements = {
				'#COUNT#': String(this.presentation.count),
				'#LIMIT#': String(this.presentation.limit),
				'#DATE#': this.transitionEndDate,
			};
			const codes = this.presentation.variant === 'transition'
				? [
					'MARKET_VIBE_PLUS_APPLICATION_LIMIT_POPUP_SUMMARY_TRANSITION',
					'MARKET_VIBE_PLUS_APPLICATION_LIMIT_POPUP_ACTION_TRANSITION',
				]
				: [
					'MARKET_VIBE_PLUS_APPLICATION_LIMIT_POPUP_SUMMARY_ACTIVE',
					'MARKET_VIBE_PLUS_APPLICATION_LIMIT_POPUP_WARNING_ACTIVE',
					'MARKET_VIBE_PLUS_APPLICATION_LIMIT_POPUP_ACTION_ACTIVE',
				];

			return codes
				.map((code) => Loc.getMessage(code, replacements) ?? '')
				.filter((text) => text !== '');
		},
		transitionEndDate(this: any): string
		{
			if (this.presentation.transitionEndAt === null)
			{
				return '';
			}

			return DateTimeFormat.format(
				Loc.getMessage('MARKET_VIBE_PLUS_APPLICATION_LIMIT_POPUP_DATE_FORMAT') ?? 'j F',
				this.presentation.transitionEndAt,
			);
		},
		ringLabel(this: any): string
		{
			return Loc.getMessage(
				'MARKET_VIBE_PLUS_APPLICATION_LIMIT_POPUP_RING_LABEL',
				{
					'#COUNT#': this.presentation.count,
					'#LIMIT#': this.presentation.limit,
				},
			) ?? '';
		},
	},
	methods: {
		getActionLabel(type: string): string
		{
			const messageCode = {
				buy: 'MARKET_VIBE_PLUS_APPLICATION_LIMIT_POPUP_BUY',
				trial: 'MARKET_VIBE_PLUS_APPLICATION_LIMIT_POPUP_TRIAL',
				list: 'MARKET_VIBE_PLUS_APPLICATION_LIMIT_POPUP_LIST',
			}[type] ?? '';

			return Loc.getMessage(messageCode) ?? '';
		},
		getActionStyle(type: string): string
		{
			return {
				buy: AirButtonStyle.FILLED_SUCCESS,
				trial: AirButtonStyle.OUTLINE,
				list: AirButtonStyle.PLAIN,
			}[type] ?? AirButtonStyle.PLAIN;
		},
		getActionDataset(action: ApplicationLimitAction, index: number): Object
		{
			return {
				testid: getApplicationLimitActionTestId(action.type),
				autofocus: index === 0 ? '' : null,
			};
		},
		showChangesInfo(): void
		{
			(BX as BitrixWithHelper).Helper.show('redirect=detail&code=26027119');
		},
	},
	template: `
		<section
			class="market-vibe-plus-application-limit-popup"
			data-testid="vibe-plus-notifications-app-limit-popup"
		>
			<div
				class="market-vibe-plus-application-limit-popup__card"
				data-testid="vibe-plus-notifications-app-limit-card"
			>
				<div
					class="market-vibe-plus-application-limit-popup__left"
					data-testid="vibe-plus-notifications-app-limit-left"
				>
					<header
						class="market-vibe-plus-application-limit-popup__head"
						data-testid="vibe-plus-notifications-app-limit-head"
					>
						<HeadlineXl
							id="market-vibe-plus-application-limit-popup-title"
							className="market-vibe-plus-application-limit-popup__title"
							tag="h2"
							data-testid="vibe-plus-notifications-app-limit-title"
						>
							{{ title }}
						</HeadlineXl>
					</header>

					<div
						class="market-vibe-plus-application-limit-popup__content"
						data-testid="vibe-plus-notifications-app-limit-content"
					>
						<div class="market-vibe-plus-application-limit-popup__paragraphs">
							<TextSm
								v-for="(paragraph, index) in contentParagraphs"
								:key="index"
								className="market-vibe-plus-application-limit-popup__paragraph"
								tag="p"
								:data-testid="'vibe-plus-notifications-app-limit-paragraph-' + index"
							>
								{{ paragraph }}
							</TextSm>
						</div>
						<TextSm
							className="market-vibe-plus-application-limit-popup__learn-more"
							tag="a"
							href="#"
							:data-testid="learnMoreTestId"
							@click.prevent="showChangesInfo"
						>
							{{ $Bitrix.Loc.getMessage('MARKET_VIBE_PLUS_APPLICATION_LIMIT_POPUP_LEARN_MORE') }}
						</TextSm>
					</div>

					<div
						class="market-vibe-plus-application-limit-popup__buttons"
						data-testid="vibe-plus-notifications-app-limit-buttons"
					>
						<UiButton
							v-for="(action, index) in actions"
							:key="action.type"
							:class="'market-vibe-plus-application-limit-popup__action market-vibe-plus-application-limit-popup__action--' + action.type"
							:text="getActionLabel(action.type)"
							:style="getActionStyle(action.type)"
							:size="buttonSize"
							:dataset="getActionDataset(action, index)"
							@click="onAction(action)"
						/>
					</div>
				</div>

				<div
					class="market-vibe-plus-application-limit-popup__graphic"
					data-testid="vibe-plus-notifications-app-limit-graphic"
				>
					<AppsProgressRing
						data-testid="vibe-plus-notifications-app-limit-ring"
						:value="presentation.count"
						:max="presentation.limit"
						:label="ringLabel"
						:caption="$Bitrix.Loc.getMessage('MARKET_VIBE_PLUS_APPLICATION_LIMIT_POPUP_RING_CAPTION')"
					/>
					<img
						class="market-vibe-plus-application-limit-popup__mascot"
						src="/bitrix/js/market/vibe-plus-application-limit-popup/images/limit-mascot.webp"
						srcset="/bitrix/js/market/vibe-plus-application-limit-popup/images/limit-mascot.webp 1x, /bitrix/js/market/vibe-plus-application-limit-popup/images/limit-mascot@2x.webp 2x"
						alt=""
						aria-hidden="true"
						data-testid="vibe-plus-notifications-app-limit-mascot"
					>
				</div>

				<button
					class="market-vibe-plus-application-limit-popup__close"
					type="button"
					:aria-label="$Bitrix.Loc.getMessage('MARKET_VIBE_PLUS_APPLICATION_LIMIT_POPUP_CLOSE')"
					data-testid="vibe-plus-notifications-app-limit-close"
					@click="onClose"
				>
					<BIcon
						:name="closeIcon"
						:size="20"
						color="#ffffff"
						aria-hidden="true"
						data-testid="vibe-plus-notifications-app-limit-close-icon"
					/>
				</button>
			</div>
		</section>
	`,
};

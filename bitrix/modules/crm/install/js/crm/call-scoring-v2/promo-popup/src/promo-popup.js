import { NameService } from 'crm.ai.name-service';
import { BannerDispatcher } from 'crm.integration.ui.banner-dispatcher';
import { Event, Loc, Tag, Type } from 'main.core';
import { Popup, type PopupOptions } from 'main.popup';
import { AirButtonStyle, Button as UiButton } from 'ui.buttons';
import './promo-popup.css';

type PromoPopupOptions = {
	closeOptionCategory?: string,
	closeOptionName?: string,
};

const VIDEO_URL = '/bitrix/js/crm/call-scoring-v2/script-created-popup/video/zefir.webm';
const HELP_ARTICLE_CODE = '23240682';

export class PromoPopup
{
	#popup: Popup | null = null;
	#bannerDispatcher: BannerDispatcher | null = null;
	#closeOptionCategory: string;
	#closeOptionName: string;

	constructor(options: PromoPopupOptions = {})
	{
		this.#closeOptionCategory = Type.isStringFilled(options.closeOptionCategory)
			? options.closeOptionCategory
			: 'crm.tour'
		;
		this.#closeOptionName = Type.isStringFilled(options.closeOptionName)
			? options.closeOptionName
			: ''
		;
	}

	show(): void
	{
		if (this.#getPopup().isShown())
		{
			return;
		}

		this.#bannerDispatcher = new BannerDispatcher();
		this.#bannerDispatcher.toQueue((onDone: Function): void => {
			this.#getPopup().subscribe('onAfterClose', onDone);
			this.#getPopup().show();
		});
	}

	close(): void
	{
		this.#popup?.close();
	}

	#getPopup(): Popup
	{
		if (this.#popup === null)
		{
			this.#popup = new Popup(this.#getPopupParams());
		}

		return this.#popup;
	}

	#getPopupParams(): PopupOptions
	{
		return {
			id: 'crm-tour-call-scoring-v2-promo',
			className: 'crm-tour-csv2-promo',
			content: this.#getContent(),
			width: 820,
			padding: 0,
			closeIcon: true,
			closeByEsc: true,
			cacheable: false,
			contentBackground: 'transparent',
			borderRadius: '20px',
			contentBorderRadius: '20px',
			overlay: {
				opacity: 40,
			},
			animation: 'fading-slide',
			events: {
				onPopupClose: () => {
					this.#saveSeen();
				},
			},
		};
	}

	#getContent(): HTMLElement
	{
		const buttons = Tag.render`<div class="crm-tour-csv2-promo__buttons"></div>`;
		this.#createPrimaryButton().renderTo(buttons);
		this.#createSecondaryButton().renderTo(buttons);

		const copilotName = NameService.copilotNameReplacement();

		return Tag.render`
			<div class="crm-tour-csv2-promo__layout">
				<div class="crm-tour-csv2-promo__content">
					<h2 class="crm-tour-csv2-promo__title">
						${Loc.getMessage('CRM_CALL_SCORING_V2_PROMO_TITLE', {
							'#ACCENT_START#': '<span class="crm-tour-csv2-promo__title-accent">',
							'#ACCENT_END#': '</span>',
						})}
					</h2>
					<div class="crm-tour-csv2-promo__banner">
						<span class="crm-tour-csv2-promo__banner-icon"></span>
						<div class="crm-tour-csv2-promo__banner-body">
							<div class="crm-tour-csv2-promo__banner-title">
								${Loc.getMessage('CRM_CALL_SCORING_V2_PROMO_BANNER_TITLE', copilotName)}
							</div>
							<div class="crm-tour-csv2-promo__banner-text">
								${Loc.getMessage('CRM_CALL_SCORING_V2_PROMO_BANNER_TEXT')}
							</div>
						</div>
						<span class="crm-tour-csv2-promo__banner-arrow"></span>
					</div>
					<div class="crm-tour-csv2-promo__feature">
						<span class="crm-tour-csv2-promo__feature-icon"></span>
						<div class="crm-tour-csv2-promo__feature-body">
							<div class="crm-tour-csv2-promo__feature-title">
								${Loc.getMessage('CRM_CALL_SCORING_V2_PROMO_FEATURE_TITLE')}
							</div>
							<div class="crm-tour-csv2-promo__feature-text">
								${Loc.getMessage('CRM_CALL_SCORING_V2_PROMO_FEATURE_TEXT')}
							</div>
						</div>
					</div>
					${buttons}
				</div>
				<div class="crm-tour-csv2-promo__media">
					${this.#renderVideo()}
				</div>
			</div>
		`;
	}

	#renderVideo(): HTMLVideoElement
	{
		const video = Tag.render`
			<video
				class="crm-tour-csv2-promo__video"
				autoplay
				loop
				muted
				playsinline
				preload="auto"
			>
				<source src="${VIDEO_URL}" type="video/webm">
			</video>
		`;

		Event.bind(video, 'canplay', () => {
			video.muted = true;
			video.play().catch(() => {});
		});

		return video;
	}

	#createPrimaryButton(): UiButton
	{
		return new UiButton({
			useAirDesign: true,
			text: Loc.getMessage('CRM_CALL_SCORING_V2_PROMO_BTN_PRIMARY'),
			style: AirButtonStyle.FILLED_BITRIX_GPT,
			size: UiButton.Size.LARGE,
			round: true,
			onclick: () => {
				this.close();
			},
		});
	}

	#createSecondaryButton(): UiButton
	{
		return new UiButton({
			useAirDesign: true,
			text: Loc.getMessage('CRM_CALL_SCORING_V2_PROMO_BTN_SECONDARY'),
			style: AirButtonStyle.PLAIN_NO_ACCENT,
			size: UiButton.Size.LARGE,
			round: true,
			onclick: () => {
				this.#openHelpArticle();
			},
		});
	}

	#openHelpArticle(): void
	{
		window.top.BX?.Helper?.show(`redirect=detail&code=${HELP_ARTICLE_CODE}`);
	}

	#saveSeen(): void
	{
		if (this.#closeOptionName === '')
		{
			return;
		}

		BX.userOptions.save(this.#closeOptionCategory, this.#closeOptionName, 'closed', 'Y');
	}
}

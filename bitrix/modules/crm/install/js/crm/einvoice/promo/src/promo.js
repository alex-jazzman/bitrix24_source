import { Tag, Loc } from 'main.core';
import { Popup } from 'main.popup';
import { AirButtonStyle, Button, ButtonSize } from 'ui.buttons';
import { Outline as OutlineIconSet, Icon } from 'ui.icon-set.api.core';
import 'ui.icon-set.outline';
import 'ui.design-tokens';
import { sendData } from 'ui.analytics';
import { Builder } from 'crm.integration.analytics';

import './promo.css';

const PREVIEW_VIDEO_PATH = '/bitrix/js/crm/einvoice/promo/src/video/preview.webm';

type PromoAnalytics = {
	c_section: string;
	c_sub_section: string;
};

export type PromoOptions = {
	events?: PromoEvents;
	analytics?: ?PromoAnalytics;
};

type PromoEvents = {
	onPrimaryClick?: Function;
	onRemindLater?: Function;
	onShow?: Function;
	onHide?: Function;
};

export class Promo
{
	#popup: ?Popup = null;
	#events: PromoEvents;
	#analytics: ?PromoAnalytics;
	#convertedViaPrimary: boolean = false;
	#listeners: { [string]: Array<Function> } = {};

	constructor(options: PromoOptions = {})
	{
		this.#events = options.events ?? {};
		this.#analytics = options.analytics ?? null;
	}

	show(): void
	{
		this.#getPopup().show();
	}

	hide(): void
	{
		this.#popup?.close();
	}

	subscribe(eventName: string, callback: Function): void
	{
		(this.#listeners[eventName] ??= []).push(callback);
	}

	#emit(eventName: string): void
	{
		(this.#listeners[eventName] ?? []).forEach((callback) => callback());
	}

	#sendAnalytics(builderClass): void
	{
		if (this.#analytics === null)
		{
			return;
		}

		const data = builderClass
			.createDefault(this.#analytics.c_section, this.#analytics.c_sub_section)
			.buildData();

		if (data)
		{
			sendData(data);
		}
	}

	#getPopup(): Popup
	{
		if (this.#popup === null)
		{
			this.#popup = this.#createPopup();
		}

		return this.#popup;
	}

	#createPopup(): Popup
	{
		return new Popup({
			id: 'crm-einvoice-promo',
			className: 'crm__einvoice-promo-popup',
			content: this.#renderContent(),
			closeIcon: false,
			closeByEsc: true,
			padding: 0,
			borderRadius: '32px',
			overlay: { opacity: 40 },
			animation: 'fading-slide',
			autoHide: false,
			cacheable: false,
			events: {
				onShow: () => {
					this.#sendAnalytics(Builder.EInvoicePromo.ViewEvent);
					this.#events.onShow?.();
					this.#emit('onShow');
				},
				onAfterClose: () => {
					if (!this.#convertedViaPrimary)
					{
						this.#sendAnalytics(Builder.EInvoicePromo.CloseEvent);
					}

					this.#events.onHide?.();
					this.#emit('onAfterHide');
					this.#popup = null;
				},
			},
		});
	}

	#renderContent(): HTMLElement
	{
		return Tag.render`
			<div class="crm__einvoice-promo">
				${this.#renderCloseButton()}
				<div class="crm__einvoice-promo_content">
					<div class="crm__einvoice-promo_title">
						${Loc.getMessage('CRM_EINVOICE_PROMO_TITLE') || ''}
					</div>
					<div class="crm__einvoice-promo_description">
						<div class="crm__einvoice-promo_lead">
							${Loc.getMessage('CRM_EINVOICE_PROMO_DESCRIPTION') || ''}
						</div>
						${this.#renderBenefits()}
					</div>
					${this.#renderControls()}
				</div>
				${this.#renderAside()}
			</div>
		`;
	}

	#renderCloseButton(): HTMLElement
	{
		const icon = new Icon({
			icon: OutlineIconSet.CROSS_L,
			size: 24,
			color: 'var(--ui-color-accent-main-primary-alt-2)',
		}).render();

		return Tag.render`
			<div class="crm__einvoice-promo_close" onclick="${() => this.hide()}">
				${icon}
			</div>
		`;
	}

	#renderBenefits(): HTMLElement
	{
		const benefit = (index, icon) => Tag.render`
			<div class="crm__einvoice-promo_benefit">
				<div class="crm__einvoice-promo_benefit-icon">
					${this.#renderBenefitIcon(icon)}
				</div>
				<div class="crm__einvoice-promo_benefit-text">
					${Loc.getMessage(`CRM_EINVOICE_PROMO_BENEFIT_${index}`) || ''}
				</div>
			</div>
		`;

		return Tag.render`
			<div class="crm__einvoice-promo_benefits">
				${benefit(1, OutlineIconSet.REPEAT_CYCLE)}
				${benefit(2, OutlineIconSet.EXCLAMATION_CIRCLE)}
			</div>
		`;
	}

	#renderBenefitIcon(icon: string): HTMLElement
	{
		return new Icon({
			icon,
			size: 28,
			color: 'var(--ui-color-accent-main-primary)',
		}).render();
	}

	#renderControls(): HTMLElement
	{
		const primary = new Button({
			text: Loc.getMessage('CRM_EINVOICE_PROMO_PRIMARY_BUTTON') || '',
			size: ButtonSize.EXTRA_LARGE,
			style: AirButtonStyle.FILLED,
			useAirDesign: true,
			onclick: () => {
				this.#convertedViaPrimary = true;
				this.#sendAnalytics(Builder.EInvoicePromo.ClickEvent);
				this.#events.onPrimaryClick?.();
			},
		});

		const secondary = new Button({
			text: Loc.getMessage('CRM_EINVOICE_PROMO_SECONDARY_BUTTON') || '',
			size: ButtonSize.EXTRA_LARGE,
			style: AirButtonStyle.PLAIN,
			useAirDesign: true,
			onclick: () => this.#events.onRemindLater?.(),
		});

		return Tag.render`
			<div class="crm__einvoice-promo_controls">
				${primary.render()}
				${secondary.render()}
			</div>
		`;
	}

	#renderAside(): HTMLElement
	{
		return Tag.render`
			<div class="crm__einvoice-promo_aside">
				<div class="crm__einvoice-promo_preview">
					${this.#renderPreviewVideo()}
				</div>
				<div class="crm__einvoice-promo_mascot"></div>
			</div>
		`;
	}

	#renderPreviewVideo(): HTMLElement
	{
		const video = Tag.render`
			<video
				class="crm__einvoice-promo_video"
				src="${PREVIEW_VIDEO_PATH}"
				autoplay
				preload
				loop
				muted
				playsinline
			></video>
		`;

		// eslint-disable-next-line @bitrix24/bitrix24-rules/no-native-events-binding
		video.addEventListener('canplay', () => {
			video.muted = true;
			video.play();
		});

		return video;
	}
}

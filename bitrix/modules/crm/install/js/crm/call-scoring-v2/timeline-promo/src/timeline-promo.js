import { NameService } from 'crm.ai.name-service';
import { BannerDispatcher } from 'crm.integration.ui.banner-dispatcher';
import { Router } from 'crm.router';
import { Event, Loc, Tag, Type } from 'main.core';
import { type BaseEvent, EventEmitter } from 'main.core.events';
import { Popup, type PopupOptions } from 'main.popup';
import { AirButtonStyle, Button as UiButton } from 'ui.buttons';
import './timeline-promo.css';

type TimelinePromoOptions = {
	closeOptionCategory?: string,
	closeOptionName?: string,
};

const SHOW_TOUR_EVENT = 'BX.Crm.Timeline.Call:onShowCallScoringV2Tour';
const ARROW_TIP_OFFSET = 5;
const POPUP_WIDTH = 480;
const VIDEO_URL = '/bitrix/js/crm/call-scoring-v2/timeline-promo/video/zefir-waving.webm';

export class TimelinePromo
{
	#popup: Popup | null = null;
	#bannerDispatcher: BannerDispatcher | null = null;
	#eventHandler: ((event: BaseEvent) => void) | null = null;
	#actionParams: Object | null = null;
	#closeOptionCategory: string;
	#closeOptionName: string;

	constructor(options: TimelinePromoOptions = {})
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
		this.#unsubscribe();
		this.#eventHandler = (event: BaseEvent): void => {
			const { target, actionParams } = event.getData();
			if (!Type.isElementNode(target) || !Type.isObject(actionParams))
			{
				return;
			}

			this.#actionParams = actionParams;
			this.#unsubscribe();
			this.#enqueue(target);
		};

		EventEmitter.subscribe(SHOW_TOUR_EVENT, this.#eventHandler);
	}

	close(): void
	{
		this.#unsubscribe();
		this.#popup?.close();
	}

	#unsubscribe(): void
	{
		if (this.#eventHandler !== null)
		{
			EventEmitter.unsubscribe(SHOW_TOUR_EVENT, this.#eventHandler);
			this.#eventHandler = null;
		}
	}

	#enqueue(chart: HTMLElement): void
	{
		this.#bannerDispatcher = new BannerDispatcher();
		this.#bannerDispatcher.toQueue((onDone: Function): void => {
			const popup = this.#getPopup(chart);
			popup.subscribe('onAfterClose', onDone);
			popup.show();
		});
	}

	#getPopup(chart: HTMLElement): Popup
	{
		if (this.#popup === null)
		{
			this.#popup = new Popup(this.#getPopupParams(chart));
		}

		return this.#popup;
	}

	#getPopupParams(chart: HTMLElement): PopupOptions
	{
		const chartRect = chart.getBoundingClientRect();
		const offsetTop = ARROW_TIP_OFFSET;
		const offsetLeft = Math.round((chartRect.width - POPUP_WIDTH) / 2);

		return {
			id: 'crm-tour-call-scoring-v2-timeline',
			className: 'crm-tour-csv2-timeline-popup',
			content: this.#getContent(),
			bindElement: chart,
			bindOptions: {
				position: 'top',
				forceBindPosition: true,
				forceLeft: true,
			},
			offsetTop,
			offsetLeft,
			width: POPUP_WIDTH,
			padding: 0,
			closeIcon: true,
			closeByEsc: true,
			cacheable: false,
			autoHide: true,
			borderRadius: '20px',
			contentBorderRadius: '20px',
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
		const buttonContainer = Tag.render`<div class="crm-tour-csv2-timeline__actions"></div>`;
		this.#createPrimaryButton().renderTo(buttonContainer);

		return Tag.render`
			<div class="crm-tour-csv2-timeline">
				<div class="crm-tour-csv2-timeline__clip">
					<div class="crm-tour-csv2-timeline__media">
						${this.#renderVideo()}
					</div>
					<div class="crm-tour-csv2-timeline__body">
						<div class="crm-tour-csv2-timeline__title">
							${Loc.getMessage('CRM_CALL_SCORING_V2_TIMELINE_PROMO_TITLE', NameService.copilotNameReplacement())}
						</div>
						<div class="crm-tour-csv2-timeline__text">
							${Loc.getMessage('CRM_CALL_SCORING_V2_TIMELINE_PROMO_TEXT')}
						</div>
						${buttonContainer}
					</div>
				</div>
			</div>
		`;
	}

	#renderVideo(): HTMLVideoElement
	{
		const video = Tag.render`
			<video
				class="crm-tour-csv2-timeline__video"
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
			text: Loc.getMessage('CRM_CALL_SCORING_V2_TIMELINE_PROMO_BTN'),
			style: AirButtonStyle.FILLED_SUCCESS,
			size: UiButton.Size.MEDIUM,
			round: true,
			onclick: () => {
				this.#openAssessmentSlider().catch((error) => {
					console.error('CRM.CallScoringV2.TimelinePromo: failed to open assessment slider', error);
				});
			},
		});
	}

	async #openAssessmentSlider(): Promise<void>
	{
		this.close();

		if (this.#actionParams === null)
		{
			return;
		}

		if (this.#actionParams.isV2)
		{
			void Router.Instance.openAiReportDrawer('call-assessment', {
				activityId: this.#actionParams.activityId,
				ownerTypeId: this.#actionParams.ownerTypeId,
				ownerId: this.#actionParams.ownerId,
				jobId: this.#actionParams.jobId ?? null,
				assessmentSettingsId: this.#actionParams.assessmentSettingsId ?? null,
			});

			return;
		}

		await top.BX.Runtime.loadExtension('crm.ai.call');
		const dialog = new top.BX.Crm.AI.Call.CallQuality(this.#actionParams);
		dialog.open();
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

import { BannerDispatcher } from 'crm.integration.ui.banner-dispatcher';
import { NameService } from 'crm.ai.name-service';
import { Router } from 'crm.router';
import { Event, Loc, Reflection, Tag, Type } from 'main.core';
import { Popup, type PopupOptions } from 'main.popup';
import { AirButtonStyle, Button as UiButton } from 'ui.buttons';
import './script-created-popup.css';

type ScriptCreatedPopupKind = 'created' | 'enriched';

type ScriptCreatedPopupOptions = {
	closeOptionCategory?: string,
	closeOptionName?: string,
	scriptId?: number,
	kind?: ScriptCreatedPopupKind | string,
};

const VIDEO_URL = '/bitrix/js/crm/call-scoring-v2/script-created-popup/video/zefir.webm';
const HELP_ARTICLE_CODE = '18114500'; // @todo replace with the real article code
const KIND_ENRICHED = 'enriched';

export class ScriptCreatedPopup
{
	#popup: Popup | null = null;
	#bannerDispatcher: BannerDispatcher | null = null;
	#closeOptionCategory: string;
	#closeOptionName: string;
	#scriptId: number;
	#kind: string;

	constructor(options: ScriptCreatedPopupOptions = {})
	{
		this.#closeOptionCategory = Type.isStringFilled(options.closeOptionCategory)
			? options.closeOptionCategory
			: 'crm.tour';
		this.#closeOptionName = Type.isStringFilled(options.closeOptionName)
			? options.closeOptionName
			: '';
		this.#scriptId = Type.isNumber(options.scriptId) && options.scriptId > 0 ? options.scriptId : 0;
		this.#kind = Type.isStringFilled(options.kind) ? options.kind : '';
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
			id: 'crm-tour-call-scoring-v2',
			className: 'crm-tour-csv2-popup',
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
		const buttons = Tag.render`<div class="crm-tour-csv2__buttons"></div>`;
		this.#createPrimaryButton().renderTo(buttons);
		this.#createSecondaryButton().renderTo(buttons);

		return Tag.render`
			<div class="crm-tour-csv2">
				<div class="crm-tour-csv2__content">
					<h2 class="crm-tour-csv2__title">
						${Loc.getMessage('CRM_CALL_SCORING_V2_SCRIPT_CREATED_TITLE', {
							'#GPT_START#': '<span class="crm-tour-csv2__gpt">',
							'#GPT_END#': '</span>',
							...NameService.copilotNameReplacement(),
						})}
					</h2>
					<div class="crm-tour-csv2__subtitle">
						${Loc.getMessage(this.#getSubtitleMessageCode(), {
							'#GPT_START#': '<span class="crm-tour-csv2__gpt">',
							'#GPT_END#': '</span>',
						})}
					</div>
					${buttons}
				</div>
				<div class="crm-tour-csv2__media">
					${this.#renderVideo()}
				</div>
			</div>
		`;
	}

	#createPrimaryButton(): UiButton
	{
		return new UiButton({
			useAirDesign: true,
			text: Loc.getMessage('CRM_CALL_SCORING_V2_SCRIPT_CREATED_BTN_PRIMARY'),
			style: AirButtonStyle.FILLED,
			size: UiButton.Size.LARGE,
			round: true,
			onclick: () => {
				this.#openScriptSlider();
			},
		});
	}

	#openScriptSlider(): void
	{
		if (this.#scriptId <= 0)
		{
			return;
		}

		Router.Instance.openCallAssessmentSlider(this.#scriptId, { allowChangeHistory: false });
	}

	#createSecondaryButton(): UiButton
	{
		return new UiButton({
			useAirDesign: true,
			text: Loc.getMessage('CRM_CALL_SCORING_V2_SCRIPT_CREATED_BTN_SECONDARY'),
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
		const Helper = Reflection.getClass('top.BX.Helper');
		Helper?.show(`redirect=detail&code=${HELP_ARTICLE_CODE}`);
	}

	#getSubtitleMessageCode(): string
	{
		return this.#kind === KIND_ENRICHED
			? 'CRM_CALL_SCORING_V2_SCRIPT_CREATED_SUBTITLE_ENRICHED'
			: 'CRM_CALL_SCORING_V2_SCRIPT_CREATED_SUBTITLE'
		;
	}

	#renderVideo(): HTMLVideoElement
	{
		const video = Tag.render`
			<video
				class="crm-tour-csv2__video"
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

	#saveSeen(): void
	{
		if (this.#closeOptionName === '')
		{
			return;
		}

		BX.userOptions.save(this.#closeOptionCategory, this.#closeOptionName, 'closed', 'Y');
	}
}
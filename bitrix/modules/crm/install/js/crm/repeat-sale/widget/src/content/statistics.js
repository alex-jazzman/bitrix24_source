import 'ui.design-tokens';
import { ajax as Ajax, Loc, Tag } from 'main.core';
import { PopupManager } from 'main.popup';
import { Lottie } from 'ui.lottie';
import { Footer } from '../footer';
import type { WidgetParams, WidgetTypeEnum } from '../widget';
import { PeriodType, WidgetType } from '../widget';
import { Base } from './base';

export class Statistics extends Base
{
	#periodType: number = PeriodType.day30;
	#showSettingsButton: boolean = true;

	constructor(params: WidgetParams)
	{
		super(params);

		this.#showSettingsButton = params.showSettingsButton ?? true;
	}

	getType(): WidgetTypeEnum
	{
		return WidgetType.statistics;
	}

	#getLoadingPopupContent(): HTMLElement
	{
		return Tag.render`
			<div>
				<header class="crm-rs__w-header --statistics">
					${Loc.getMessage('CRM_REPEAT_SALE_WIDGET_STATISTICS_POPUP_TITLE')}
				</header>
				<div class="crm-rs__w-body">
					<div class="crm-rs__w-body-loading-bubble">
						<div class="crm-rs__w-body-loading-bubble-wrapper">
							${this.renderLottieAnimation()}
							${this.#renderLoadingLottieAnimation()}
						</div>
						<div class="crm-rs__w-body-bubble-subtitle">
							${Loc.getMessage('CRM_REPEAT_SALE_WIDGET_STATISTICS_POPUP_LOADING')}
						</div>
					</div>
				</div>
				<footer class="crm-rs__w-footer --statistics">
					${this.#getFooterContent()}
				</footer>
			</div>
		`;
	}

	#renderLoadingLottieAnimation(): HTMLElement
	{
		const container = Tag.render`
			<div class="crm-rs__w-loading-lottie-container">
				<div ref="lottie" class="crm-rs__w-lottie"></div>
			</div>
		`;

		const mainAnimation = Lottie.loadAnimation({
			path: '/bitrix/js/crm/repeat-sale/widget/lottie/loading.json',
			container: container.lottie,
			renderer: 'svg',
			loop: true,
			autoplay: true,
		});

		mainAnimation.setSpeed(0.75);

		return container.root;
	}

	getPopupContent(data: Object): HTMLElement
	{
		return Tag.render`
			<div>
				<header class="crm-rs__w-header --statistics">
					${Loc.getMessage('CRM_REPEAT_SALE_WIDGET_STATISTICS_POPUP_TITLE')}
				</header>
				<div class="crm-rs__w-body">
					<div class="crm-rs__w-body-content --statistics">
						<div class="crm-rs__w-period-selector">
							${this.#getSelectorTitle()}
							<span
								onclick="${this.#onPeriodChange.bind(this, this.#periodType)}"
								class="crm-rs__w-period-selector-icon"
							></span>
						</div>
						<div class="crm-rs__w-body-statistics">
							<div class="crm-rs__w-body-rs-statistics">
								<div class="crm-rs__w-body-rs-statistics-title">
									${Loc.getMessage('CRM_REPEAT_SALE_WIDGET_STATISTICS_POPUP_BODY_TITLE')}
								</div>
								<div class="crm-rs__w-body-statistics-row">
									<div class="crm-rs__w-body-statistics-item">
										${Loc.getMessagePlural(
											'CRM_REPEAT_SALE_WIDGET_STATISTICS_POPUP_BODY_RS_WIN',
											data.repeatSaleWinCount ?? 0,
											{ '#COUNT#': data.repeatSaleWinCount ?? 0 },
										)}
									</div>
									<div class="crm-rs__w-body-statistics-item --sum">
										${data.repeatSaleWinSum ?? ''}
									</div>
								</div>
								<div class="crm-rs__w-body-statistics-row">
									<div class="crm-rs__w-body-statistics-item">
										${Loc.getMessage('CRM_REPEAT_SALE_WIDGET_STATISTICS_POPUP_BODY_RS_PROCESS')}
									</div>
									<div class="crm-rs__w-body-statistics-item --sum">
										${data.repeatSaleProcessSum ?? 0}
									</div>
								</div>
							</div>
							<div class="crm-rs__w-body-statistics-row">
								<div class="crm-rs__w-body-statistics-item">
									${Loc.getMessage('CRM_REPEAT_SALE_WIDGET_STATISTICS_POPUP_BODY_OTHER')}
								</div>
								<div class="crm-rs__w-body-statistics-item --sum">
									${data.otherWinSum ?? 0}
								</div>
							</div>
							<div class="crm-rs__w-body-statistics-row">
								<div class="crm-rs__w-body-statistics-item">
									${Loc.getMessage('CRM_REPEAT_SALE_WIDGET_STATISTICS_POPUP_BODY_TOTAL')}
								</div>
								<div class="crm-rs__w-body-statistics-item --sum">
									${data.totalSum ?? 0}
								</div>
							</div>
						</div>
					</div>
					<div class="crm-rs__w-body-bubble --statistics">
						${this.renderLottieAnimation()}
						<div class="crm-rs__w-body-icon"></div>
						<div class="crm-rs__w-body-bubble-percent">
							<span>${data.percent ?? 0}</span>
							<div>
								<div class="crm-rs__w-body-bubble-percent-arrow ${data.percent > 0 ? '' : '--hidden'}"></div>
								<div class="crm-rs__w-body-bubble-percent-icon"></div>
							</div>
						</div>
						<div class="crm-rs__w-body-bubble-subtitle">
							${this.#getBubbleSubTitle()}
						</div>
					</div>
				</div>
				<footer class="crm-rs__w-footer --statistics">
					${this.#getFooterContent()}
				</footer>
			</div>
		`;
	}

	#getSelectorTitle(): string
	{
		let code = null;

		switch (this.#periodType)
		{
			case PeriodType.day30:
				code = 'CRM_REPEAT_SALE_WIDGET_STATISTICS_POPUP_PERIOD_DAY_30';
				break;
			case PeriodType.quarter:
				code = 'CRM_REPEAT_SALE_WIDGET_STATISTICS_POPUP_PERIOD_QUARTER';
				break;
			case PeriodType.halfYear:
				code = 'CRM_REPEAT_SALE_WIDGET_STATISTICS_POPUP_PERIOD_HALF_YEAR';
				break;
			case PeriodType.year:
				code = 'CRM_REPEAT_SALE_WIDGET_STATISTICS_POPUP_PERIOD_YEAR';
				break;
			default:
				throw new RangeError('unknown period type');
		}

		return Loc.getMessage(code);
	}

	#getBubbleSubTitle(): string
	{
		let code = null;

		switch (this.#periodType)
		{
			case PeriodType.day30:
				code = 'CRM_REPEAT_SALE_WIDGET_STATISTICS_POPUP_BUBBLE_PERIOD_DAY_30';
				break;
			case PeriodType.quarter:
				code = 'CRM_REPEAT_SALE_WIDGET_STATISTICS_POPUP_BUBBLE_PERIOD_QUARTER';
				break;
			case PeriodType.halfYear:
				code = 'CRM_REPEAT_SALE_WIDGET_STATISTICS_POPUP_BUBBLE_PERIOD_HALF_YEAR';
				break;
			case PeriodType.year:
				code = 'CRM_REPEAT_SALE_WIDGET_STATISTICS_POPUP_BUBBLE_PERIOD_YEAR';
				break;
			default:
				throw new RangeError('unknown period type');
		}

		return Loc.getMessage(code);
	}

	#getFooterContent(): HTMLElement
	{
		const footer = new Footer(this.#showSettingsButton);

		return footer.getFooterContent();
	}

	getFetchUrl(): string
	{
		return 'crm.repeatsale.statistics.getData';
	}

	getFetchParams(): Object
	{
		return {
			periodType: this.#periodType,
		};
	}

	#onPeriodChange(periodTypeId: number): void
	{
		let nextPeriodTypeId = PeriodType.day30;

		const periodTypeIds = Object.values(PeriodType);

		if (periodTypeIds.includes(periodTypeId))
		{
			const index = periodTypeIds.indexOf(periodTypeId);
			if (index + 1 < periodTypeIds.length)
			{
				nextPeriodTypeId = index + 1;
			}
		}

		const data = {
			periodTypeId: nextPeriodTypeId,
		};

		// @todo maybe pointless loader
		// const popup = PopupManager.getPopupById(`crm_repeat_sale_widget_${this.getType()}`);
		// if (popup)
		// {
		// 	popup.setContent(this.#getLoadingPopupContent());
		// }

		Ajax
			.runAction(this.getFetchUrl(), { data })
			.then(
				(response) => {
					if (response.status === 'success')
					{
						const popup = PopupManager.getPopupById(`crm_repeat_sale_widget_${this.getType()}`);
						if (popup === null)
						{
							return;
						}

						this.data = response.data;
						this.#periodType = nextPeriodTypeId;

						popup.setContent(this.getPopupContent(this.data));

						return;
					}

					this.showError();
				},
				(response) => {
					//popup.setContent(this.getPopupContent(this.data));
					this.showError();
				},
			)
			.catch((response) => {
				//popup.setContent(this.getPopupContent(this.data));
				this.showError();
			})
		;
	}
}

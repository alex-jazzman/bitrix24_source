import { Loc, ajax, Tag, Text, Dom, Extension } from 'main.core';
import { BaseEvent, EventEmitter } from 'main.core.events';
import { ResponseDataType } from './types/response-data-type';
import { ResponseServiceDataType } from './types/response-service-data-type';
import type { WidgetDataType } from './types/widget-data-type';
import { Icon, Set } from 'ui.icon-set.api.core';
import { Widget } from './widget';
import { Analytics } from './analytics';

export class ServiceWidget extends Widget
{
	#serviceCode: string;
	#serviceData: ResponseServiceDataType;

	constructor(widgetData: ?WidgetDataType)
	{
		super(widgetData);

		if (BX.PULL && Extension.getSettings('baas.store').pull)
		{
			BX.PULL.extendWatch(Extension.getSettings('baas.store').pull.channelName);

			EventEmitter.subscribe('onPullEvent-baas', (event: BaseEvent) => {
				const [command: string, params: ResponseDataType] = event.getData();

				if (command === 'updateService' && params.service.code === this.#serviceCode)
				{
					this.#adjustFromPull(params.service);
				}
			});
		}
	}

	setServiceCode(code: string): this
	{
		this.#serviceCode = code;

		return this;
	}

	setData(data: ResponseDataType): this
	{
		super.setData(data);
		this.#serviceData = data.service;
		this.#serviceData.icon.className = Set[this.#serviceData.icon.className] ? this.#serviceData.icon.className : 'QR_CODE_1';

		return this;
	}

	getAjaxPromise(): Promise
	{
		return ajax.runAction('baas.Service.get', { data: { code: this.#serviceCode } });
	}

	getAnalytic(): Analytics
	{
		return this.cache.remember('analyticObject', () => {
			return Analytics.createByServiceCode(this.#serviceCode);
		});
	}

	#getIconContainer(): ?HTMLElement
	{
		return this.cache.remember('baas-popup-icon', () => {
			const iconParams: { className: ?string, color: ?string, style: ?Object } = this.#serviceData.icon;
			// const iconClass = this.#serviceData.isActive ? iconParams.className : 'LOCK';
			const iconClass = iconParams.className;
			let iconNode = Tag.render`<div class="ui-popupconstructor-content-item__icon ui-icon-set"></div>`;

			if (Set[iconClass])
			{
				const params = { icon: Set[iconClass] };
				if (iconParams.color)
				{
					params.color = iconParams.color;
				}
				iconNode = (new Icon(params)).render();
			}
			else
			{
				Dom.addClass(iconNode, iconClass);
			}

			return iconNode;
		});
	}

	#getSubtitleContainer(): HTMLElement
	{
		return this.cache.remember('baas-popup-subtitle', () => {
			return Tag.render`<span>${Text.encode(this.#serviceData.isActive ? this.#serviceData.activeSubtitle : this.#serviceData.inactiveSubtitle)}</span>`;
		});
	}

	convertIntoWidgetDataType(): WidgetDataType
	{
		const data: ResponseDataType = this.cache.get('response-data');
		Dom.addClass(this.getPopup().contentContainer, '--baas-widget --baas-specified');

		return {
			header: {
				icon: this.#getIconContainer(),
				top: {
					title: data.service.title,
					subtitle: this.#getSubtitleContainer(),
				},
				info: data.adsInfo ? {
					title: data.adsInfo.title,
					subtitle: data.adsInfo.subtitle,
					subtitleDescription: data.adsInfo.subtitleDescription,
					roundContent: {
						posterUrl: data.adsInfo.iconUrl,
						videos: [{
							url: data.adsInfo.videoUrl,
							type: data.adsInfo.videoFileType,
						}],
					},
					moreLabel: Loc.getMessage('BAAS_WIDGET_MORE_LINK_TITLE'),
					code: data.adsInfo.featurePromotionCode || data.service.featurePromotionCode,
				} : {
					title: data.service.description,
					roundContent: new Icon({
						icon: (Set[data.service.icon.className] ?? Set.QR_CODE_1),
					}).render(),
					moreLabel: Loc.getMessage('BAAS_WIDGET_MORE_LINK_TITLE'),
					code: data.service.featurePromotionCode,
				},
			},
			items: data.packages,
		};
	}

	#adjustFromPull(newServiceData: ResponseServiceDataType)
	{
		if (newServiceData.isActive !== this.#serviceData.isActive)
		{
			// const iconParams: { className: ?string, color: ?string, style: ?Object } = this.#serviceData.icon;
			// const iconClass = Set[iconParams.className] ? `--${Set[iconParams.className]}` : iconParams.className;

			if (newServiceData.isActive === true)
			{
				// Dom.removeClass(this.#getIconContainer(), `--${Set.LOCK}`);
				// Dom.addClass(this.#getIconContainer(), iconClass);

				this.#getSubtitleContainer().innerHTML = Text.encode(this.#serviceData.activeSubtitle);
			}
			else
			{
				// Dom.addClass(this.#getIconContainer(), `--${Set.LOCK}`);
				// Dom.removeClass(this.#getIconContainer(), iconClass);

				this.#getSubtitleContainer().innerHTML = Text.encode(this.#serviceData.inactiveSubtitle);
			}
		}

		this.#serviceData.isActive = newServiceData.isActive;
		this.#serviceData.value = newServiceData.value;
	}

	bindAnalyticContext(node: HTMLElement, bxAnalyticContextLabel: string): this
	{
		if (Analytics.CONTEXT_IS_NOT_SET === bxAnalyticContextLabel)
		{
			bxAnalyticContextLabel = Analytics.guessContextByServiceCode(this.#serviceCode);
		}

		super.bindAnalyticContext(node, bxAnalyticContextLabel);

		return this;
	}

	static #instances = [];

	static getInstanceByCode(code: string): Widget
	{
		if (!this.#instances[code])
		{
			this.#instances[code] = (new this()).setServiceCode(code);
		}

		return this.#instances[code];
	}
}

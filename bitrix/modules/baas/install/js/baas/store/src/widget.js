import type { AjaxResponse, AjaxSuccess } from 'main.core';
import { Cache, Loc, ajax, Dom, Type } from 'main.core';
import { EventEmitter, BaseEvent } from 'main.core.events';
import 'ui.icons.b24';
import { Popup } from 'main.popup';
import { Button, ButtonColor, ButtonSize } from 'ui.buttons';
import { PackageItem } from './package-item';
import { PackageTemplateManager } from './package-template-manager';
import { ResponseDataType } from './types/response-data-type';
import type { WidgetDataType } from './types/widget-data-type';
import { PopupWithHeader } from 'ui.popup-with-header';
import { Actions, Icon, Set } from 'ui.icon-set.api.core';
import { WidgetIcon } from './widget-icon';
import { Analytics } from './analytics';

export class Widget extends EventEmitter
{
	static justCounter: Number = 0;
	cache: Cache.MemoryCache = new Cache.MemoryCache();
	analytic: Analytics;

	constructor(widgetData: ?WidgetDataType)
	{
		super();

		this.setEventNamespace('BX.Baas');

		EventEmitter.subscribe(
			EventEmitter.GLOBAL_TARGET,
			'BX.Baas:onPurchaseShown',
			(event: BaseEvent) => this.#onPurchaseShown(event),
		);
		EventEmitter.subscribe(
			EventEmitter.GLOBAL_TARGET,
			'BX.Baas:onPurchaseHidden',
			(event: BaseEvent) => this.#onPackageHidden(event),
		);

		this.cache.set('boundElements', new WeakMap());
	}

	#getPopupWithHeader(): PopupWithHeader
	{
		return this.cache.remember('baas-popup', () => {
			return new PopupWithHeader({
				target: this.#getLastBoundElement(),
				id: `baas-components-maker-${this.constructor.justCounter++}`,
				width: 344,
				content: [],
				asyncData: this.#fetchData(),
				template: new PackageTemplateManager(),
				analyticsCallback: (event, additionalParameter) => {
					this.getAnalytic().onPlayerEvents(event, additionalParameter);
				},
				popupOptions: {
					autoHide: true,
					closeByEsc: true,
					events: {
						onShow: (event: BaseEvent): void => {
							const popup = event.getTarget();
							const targetPos = Dom.getPosition(popup.bindElement);
							const popupWidth = popup.getPopupContainer().offsetWidth;
							const offsetLeft = (targetPos.width / 2) - (popupWidth / 2);
							const angleShift = Popup.getOption('angleLeftOffset') - Popup.getOption('angleMinTop');

							popup.setAngle({ offset: popupWidth / 2 - angleShift });
							popup.setOffset({ offsetLeft: offsetLeft + Popup.getOption('angleLeftOffset') });

							this.getAnalytic().activate().onShowFrom(
								popup.bindElement.dataset.bxAnalyticContextLabel ?? Analytics.CONTEXT_IS_NOT_SET,
							);
						},
						onClose: () => {
							this.getAnalytic().deactivate();
						},
					},
				},
			});
		});
	}

	getPopup(): Popup
	{
		return this.#getPopupWithHeader().getPopup();
	}

	getAnalytic(): Analytics
	{
		return this.cache.remember('analyticObject', () => {
			return new Analytics(Analytics.SERVICE_ALL);
		});
	}

	#getLastBoundElement(): ?HTMLElement
	{
		return (this.cache.has('boundLastElement') ? this.cache.get('boundLastElement') : null);
	}

	getAjaxPromise(): Promise
	{
		return ajax.runAction('baas.Service.getAll');
	}

	#fetchData(): Array
	{
		return new Promise((resolve, reject) => {
			if (this.cache.has('widgetData'))
			{
				resolve({ data: this.cache.get('widgetData') });
			}
			else
			{
				this.getAjaxPromise()
					.then((response: AjaxResponse<AjaxSuccess>) => {
						response.data = this.setData(response.data).convertIntoWidgetDataType();
						resolve(response);
					})
					.catch(reject)
				;
			}
		});
	}

	setData(data: ResponseDataType): this
	{
		this.cache.set('response-data', data);

		return this;
	}

	convertIntoWidgetDataType(): WidgetDataType
	{
		const data: ResponseDataType = this.cache.get('response-data');
		Dom.addClass(this.getPopup().contentContainer, '--baas-widget --baas-common');

		const showMore = Type.isStringFilled(data.adsInfo && data.adsInfo.featurePromotionCode);
		const result = {
			header: {
				icon: new WidgetIcon({
					icon: Actions.CHEVRON_LEFT,
					size: 22,
					color: '#fff',
					events: {
						click: () => {
							this.emit('onClickBack');
							this.hide();
						},
					},
				}).render(),
				top: {
					title: Loc.getMessage('BAAS_WIDGET_TITLE'),
					subtitle: '',
				},
				info: data.adsInfo && data.adsInfo.title ? {
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
					moreLabel: showMore ? Loc.getMessage('BAAS_WIDGET_MORE_LINK_TITLE') : '',
					code: showMore ? data.adsInfo.featurePromotionCode : null,
				} : {
					title: Loc.getMessage('BAAS_WIDGET_DESCRIPTION'),
					roundContent: new Icon({ icon: Set.QR_CODE_1 }).render(),
					moreLabel: '',
					code: null,
				},
			},
		};

		if (Type.isArray(data.packages) && data.packages.length > 0)
		{
			result.items = data.packages;
		}
		else
		{
			result.header.button = new Button({
				text: Loc.getMessage('BAAS_WIDGET_RELOAD_PACKAGES'),
				color: ButtonColor.LIGHT_BORDER,
				size: ButtonSize.SMALL,
				onclick: () => {
					this.reload();
				},
				round: true,
				noCaps: true,
			});
		}

		return result;
	}

	bind(node: HTMLElement, bxAnalyticContextLabel: ?string): this
	{
		this.cache.set('boundLastElement', node);

		if (!this.cache.get('boundElements').has(node))
		{
			this.cache.get('boundElements').set(node);
			Event.bind(node, 'click', () => {
				this.show(node);
			});
		}

		this.bindAnalyticContext(node, bxAnalyticContextLabel || Analytics.CONTEXT_IS_NOT_SET);

		return this;
	}

	bindAnalyticContext(node: HTMLElement, bxAnalyticContextLabel: string): this
	{
		node.dataset.bxAnalyticContextLabel = bxAnalyticContextLabel;

		return this;
	}

	show(node: ?HTMLElement): this
	{
		const popup = this.getPopup();
		if (!node)
		{
			node = this.cache.get('boundLastElement');
		}

		if (node && node !== popup.bindElement)
		{
			popup.setBindElement(node);
		}
		popup.show();

		return this;
	}

	toggle(node: ?HTMLElement): this
	{
		const popup = this.getPopup();
		if (popup.isShown())
		{
			this.hide();
		}
		else
		{
			this.show(node);
		}

		return this;
	}

	hide(): this
	{
		const popup = this.getPopup();
		popup.close();

		return this;
	}

	#onPurchaseShown(event: BaseEvent): void
	{
		const packageItem: PackageItem = event.getData().package;
		if (this.cache.has('baas-popup') && this.getPopup()?.getContentContainer().contains(packageItem.getContainer()))
		{
			this.getPopup().setAutoHide(false);
			this.getPopup().setClosingByEsc(false);
		}
	}

	#onPackageHidden(event: BaseEvent)
	{
		const packageItem: PackageItem = event.getData().package;
		if (this.cache.has('baas-popup') && this.getPopup().getContentContainer().contains(packageItem.getContainer()))
		{
			this.getPopup().setAutoHide(true);
			this.getPopup().setClosingByEsc(true);
		}
	}

	reload()
	{
		const popup = this.getPopup();
		popup.close();
		this.cache.delete('widgetData');
		this.cache.delete('baas-popup');
		this.show(popup.bindElement);
	}

	static #instance = null;

	static getInstance(): Widget
	{
		if (this.#instance === null)
		{
			this.#instance = new this();
		}

		return this.#instance;
	}
}

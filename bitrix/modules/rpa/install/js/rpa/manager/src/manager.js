import { Event, Reflection, Type, Uri } from 'main.core';

import 'ui.design-tokens';
import 'ui.fonts.opensans';
import 'sidepanel';
import { EventEmitter } from 'main.core.events';

import {
	getItemSliderHistoryState,
	getItemSliderHistoryAction,
	getItemSliderRestoreUrl,
	getItemSliderCanonicalUrl,
} from './item-slider-history';

let instance = null;

class Manager
{
	urlTemplates = {};

	constructor()
	{
		const saveItemSliderState = (slider) => {
			// SidePanel updates the browser URL in its own listener after global listeners.
			queueMicrotask(() => {
				const sidePanel = BX.SidePanel.Instance;
				if (!slider || !slider.canChangeHistory() || sidePanel.getTopSlider() !== slider)
				{
					return;
				}

				const itemSlider = getItemSliderHistoryState(
					slider.getUrl(),
					sidePanel.getPageUrl(),
					window.location.origin,
					this.urlTemplates,
				);
				if (itemSlider && sidePanel.getCurrentUrl() === itemSlider.itemUrl)
				{
					const restoreUrl = getItemSliderRestoreUrl(itemSlider.itemUrl, window.location.origin);
					if (restoreUrl)
					{
						window.history.replaceState({ rpaItemSlider: itemSlider }, '', restoreUrl);
					}
				}
			});
		};

		EventEmitter.subscribe('SidePanel.Slider:onOpenComplete', (event) => {
			saveItemSliderState(event.getTarget());
		});
		EventEmitter.subscribe('SidePanel.Slider:onLoad', (event) => {
			saveItemSliderState(event.getTarget());
		});
		EventEmitter.subscribe('SidePanel.Slider:onCloseComplete', () => {
			saveItemSliderState(BX.SidePanel.Instance.getTopSlider());
		});

		if (Type.isEventTargetLike(window.navigation))
		{
			Event.bind(window.navigation, 'navigate', (event) => {
				if (event.navigationType !== 'reload' || !event.cancelable)
				{
					return;
				}

				const action = getItemSliderHistoryAction(
					BX.SidePanel.Instance.getCurrentUrl(),
					window.history.state,
					window.location.origin,
					this.urlTemplates,
				);
				if (action?.type !== 'restorePage')
				{
					return;
				}

				event.preventDefault();
				window.history.replaceState({
					rpaItemSliderPending: {
						itemUrl: action.itemUrl,
						pageUrl: action.pageUrl,
					},
				}, '', action.pageUrl);
				Manager.reloadPage();
			});
		}
	}

	static editors = {};

	static get Instance(): Manager
	{
		if (window.top !== window)
		{
			return window.top.BX.Rpa.Manager.Instance;
		}

		if (instance === null)
		{
			instance = new Manager();
		}

		return instance;
	}

	setUrlTemplates(urlTemplates: Object): Manager
	{
		if (Type.isPlainObject(urlTemplates))
		{
			this.urlTemplates = urlTemplates;
		}

		if (BX.SidePanel.Instance.getTopSlider())
		{
			return this;
		}

		const action = getItemSliderHistoryAction(
			BX.SidePanel.Instance.getCurrentUrl(),
			window.history.state,
			window.location.origin,
			this.urlTemplates,
		);
		if (action?.type === 'restorePage')
		{
			window.history.replaceState({
				rpaItemSliderPending: {
					itemUrl: action.itemUrl,
					pageUrl: action.pageUrl,
				},
			}, '', action.pageUrl);
			Manager.reloadPage();
		}
		else if (action?.type === 'openSlider')
		{
			window.history.replaceState({}, '', BX.SidePanel.Instance.getCurrentUrl());
			Manager.openSlider(action.itemUrl);
		}
		else
		{
			const canonicalUrl = getItemSliderCanonicalUrl(window.location.href, window.location.origin);
			if (canonicalUrl)
			{
				window.location.replace(canonicalUrl);
			}
		}

		return this;
	}

	static reloadPage(): void
	{
		window.location.reload();
	}

	static addEditor(typeId: number, itemId: number, editor)
	{
		const editorClass = Reflection.getClass('BX.UI.EntityEditor');
		if (!editorClass)
		{
			return;
		}

		if (Type.isInteger(typeId) && Type.isInteger(itemId) && editor instanceof BX.UI.EntityEditor)
		{
			if (!Manager.editors[typeId])
			{
				Manager.editors[typeId] = {};
			}
			Manager.editors[typeId][itemId] = editor;
		}
	}

	/**
	 * @param typeId
	 * @param itemId
	 * @returns {null|BX.UI.EntityEditor}
	 */
	static getEditor(typeId: number, itemId: number): ?Object
	{
		if (Type.isInteger(typeId) && Type.isInteger(itemId) && Manager.editors[typeId] && Manager.editors[typeId][itemId])
		{
			return Manager.editors[typeId][itemId];
		}

		return null;
	}

	static openSlider(url, options): Promise<?BX.SidePanel.Slider>
	{
		const sliderOptions = {
			cacheable: false,
			allowChangeHistory: true,
			events: {},
			...(Type.isPlainObject(options) ? options : {}),
		};

		return new Promise((resolve) => {
			if (Type.isString(url) && url.length > 1)
			{
				sliderOptions.events.onClose = function(event)
				{
					resolve(event.getSlider());
				};
				BX.SidePanel.Instance.open(url, sliderOptions);
			}
			else
			{
				resolve();
			}
		});
	}

	openTasks(typeId: number, itemId: number): Promise<{isCompleted: boolean}>
	{
		return new Promise((resolve) => {
			Manager.openSlider(
				this.getTasksUrl(typeId, itemId).toString(),
				{ width: 580, cacheable: false, allowChangeHistory: false },
			).then((slider) => {
				let isCompleted = false;
				let item = null;
				if (slider.isLoaded())
				{
					isCompleted = slider.getData().get('isCompleted') || false;
					item = slider.getData().get('item') || null;
				}

				resolve({
					isCompleted,
					item,
				});
			}).catch((error) => {
				throw error;
			});
		});
	}

	getTasksUrl(typeId: number, itemId: number): ?Uri
	{
		const template = this.urlTemplates['bitrix:rpa.task'];
		if (template)
		{
			return new Uri(template.replace('#typeId#', typeId).replace('#elementId#', itemId));
		}

		return null;
	}

	openKanban(typeId: number): boolean
	{
		const template = this.urlTemplates['bitrix:rpa.kanban'];
		if (template)
		{
			location.href = (new Uri(template.replace('#typeId#', typeId))).toString();

			return true;
		}

		return false;
	}

	openTypeDetail(typeId: number, options: ?{}): ?Promise<?BX.SidePanel.Slider>
	{
		const sliderOptions = Type.isPlainObject(options) ? options : {};
		sliderOptions.width = 702;
		const template = this.urlTemplates['bitrix:rpa.type.detail'];
		if (template)
		{
			return Manager.openSlider(template.replace('#id#', typeId), sliderOptions);
		}

		return null;
	}

	getItemDetailUrl(typeId: number, itemId: number = 0): ?Uri
	{
		const template = this.urlTemplates['bitrix:rpa.item.detail'];
		if (template)
		{
			return new Uri(template.replace('#typeId#', typeId).replace('#id#', itemId));
		}

		return null;
	}

	openItemDetail(typeId: number, itemId: number = 0, options: ?{} = {}): ?Promise<?BX.SidePanel.Slider>
	{
		const uri = this.getItemDetailUrl(typeId, itemId);
		if (uri)
		{
			return Manager.openSlider(uri.toString(), options);
		}

		return null;
	}

	getStageListUrl(typeId: number): ?Uri
	{
		const template = this.urlTemplates['bitrix:rpa.stage.list'];
		if (template)
		{
			return new Uri(template.replace('#typeId#', typeId));
		}

		return null;
	}

	openStageList(typeId: number): ?Promise<?BX.SidePanel.Slider>
	{
		const url = this.getStageListUrl(typeId);
		if (url)
		{
			return Manager.openSlider(url.toString());
		}

		return null;
	}

	getFieldsListUrl(typeId: number): ?Uri
	{
		const template = this.urlTemplates.fieldsList;
		if (template)
		{
			return new Uri(template.replace('#typeId#', typeId));
		}

		return null;
	}

	openFieldsList(typeId: number): ?Promise<?BX.SidePanel.Slider>
	{
		const url = this.getFieldsListUrl(typeId);
		if (url)
		{
			return Manager.openSlider(url.toString());
		}

		return null;
	}

	getFieldDetailUrl(typeId: number, fieldId: number): ?Uri
	{
		const template = this.urlTemplates.fieldDetail;
		if (template)
		{
			return new Uri(template.replace('#typeId#', typeId).replace('#fieldId#', fieldId));
		}

		return null;
	}

	openFieldDetail(typeId: number, fieldId: number, options: {}): ?Promise<?BX.SidePanel.Slider>
	{
		const url = this.getFieldDetailUrl(typeId, fieldId);
		if (url)
		{
			return Manager.openSlider(url.toString(), options);
		}

		return null;
	}

	static calculateTextColor(baseColor)
	{
		let r = Number.NaN;
		let g = Number.NaN;
		let b = Number.NaN;
		if (baseColor.length > 7)
		{
			let hexComponent = baseColor.split('(')[1].split(')')[0];
			hexComponent = hexComponent.split(',');
			const parseColorComponent = (value) => {
				const radix = /^[+-]?0x/i.test(String(value).trim()) ? 16 : 10;

				return parseInt(value, radix);
			};
			r = parseColorComponent(hexComponent[0]);
			g = parseColorComponent(hexComponent[1]);
			b = parseColorComponent(hexComponent[2]);
		}
		else if (/^#([\dA-Fa-f]{3}){1,2}$/.test(baseColor))
		{
			let c = baseColor.slice(1);
			if (c.length === 3)
			{
				c = `${c[0]}${c[0]}${c[1]}${c[1]}${c[2]}${c[2]}`;
			}
			c = `0x${c}`;
			r = (c >> 16) & 255;
			g = (c >> 8) & 255;
			b = c & 255;
		}

		const y = 0.21 * r + 0.72 * g + 0.07 * b;

		return (y < 145) ? '#fff' : '#333';
	}

	closeSettingsMenu(event, item)
	{
		if (item && Type.isFunction(item.getMenuWindow))
		{
			const window = item.getMenuWindow();
			if (window)
			{
				window.close();

				return;
			}
		}

		if (this && Type.isFunction(this.close))
		{
			this.close();
		}
	}

	showFeatureSlider(event, item)
	{
		Manager.Instance.closeSettingsMenu(event, item);
		BX.UI.InfoHelper.show('limit_robotic_process_automation');
	}
}

export {
	Manager,
};

/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, ui_designTokens, ui_fonts_opensans, sidepanel, main_core_events) {
	'use strict';

	const restoreParameter = '__rpa_slider_restore';
	function escapeRegExp(value) {
		let escaped = '';
		for (const character of value) {
			escaped += '\\^$.*+?()[]{}|'.includes(character) ? `\\${character}` : character;
		}
		return escaped;
	}
	function matchTemplate(path, template) {
		if (!main_core.Type.isStringFilled(template) || !template.startsWith('/')) {
			return null;
		}
		const placeholder = /#(typeId|id)#/g;
		const names = [];
		let pattern = '^';
		let offset = 0;
		let match = placeholder.exec(template);
		while (match) {
			pattern += escapeRegExp(template.slice(offset, match.index));
			pattern += '(\\d+)';
			names.push(match[1]);
			offset = match.index + match[0].length;
			match = placeholder.exec(template);
		}
		pattern += escapeRegExp(template.slice(offset));
		pattern = `${pattern.replace(/\/$/, '/?')}$`;
		const matches = path.match(new RegExp(pattern));
		if (!matches) {
			return null;
		}
		const parameters = {};
		names.forEach((name, index) => {
			parameters[name] = matches[index + 1];
		});
		return parameters;
	}
	function getUrl(value, origin) {
		if (!main_core.Type.isStringFilled(value)) {
			return null;
		}
		try {
			const url = new URL(value, origin);
			return url.origin === origin && /^https?:$/.test(url.protocol) ? url : null;
		} catch {
			return null;
		}
	}
	function getItemSliderHistoryState(itemUrl, pageUrl, origin, urlTemplates) {
		const item = getUrl(itemUrl, origin);
		const page = getUrl(pageUrl, origin);
		if (!item || !page || item.searchParams.has(restoreParameter) || !main_core.Type.isPlainObject(urlTemplates)) {
			return null;
		}
		const itemParameters = matchTemplate(item.pathname, urlTemplates['bitrix:rpa.item.detail']);
		const pageParameters = matchTemplate(page.pathname, urlTemplates['bitrix:rpa.item.list']) || matchTemplate(page.pathname, urlTemplates['bitrix:rpa.kanban']);
		if (!itemParameters?.typeId || !itemParameters?.id || itemParameters.typeId !== pageParameters?.typeId) {
			return null;
		}
		return {
			itemUrl: item.pathname + item.search + item.hash,
			pageUrl: page.pathname + page.search + page.hash
		};
	}
	function getItemSliderRestoreUrl(itemUrl, origin) {
		const item = getUrl(itemUrl, origin);
		if (!item || item.searchParams.has(restoreParameter)) {
			return null;
		}
		item.searchParams.set(restoreParameter, '1');
		return item.pathname + item.search + item.hash;
	}
	function getItemSliderCanonicalUrl(currentUrl, origin) {
		const current = getUrl(currentUrl, origin);
		if (!current || !current.searchParams.has(restoreParameter)) {
			return null;
		}
		current.searchParams.delete(restoreParameter);
		return current.pathname + current.search + current.hash;
	}
	function getItemSliderHistoryAction(currentUrl, state, origin, urlTemplates) {
		if (!main_core.Type.isPlainObject(state)) {
			return null;
		}
		const current = getUrl(currentUrl, origin);
		if (!current) {
			return null;
		}
		const currentPath = getItemSliderCanonicalUrl(currentUrl, origin) || current.pathname + current.search + current.hash;
		for (const [key, type, matchingUrl] of [['rpaItemSlider', 'restorePage', 'itemUrl'], ['rpaItemSliderPending', 'openSlider', 'pageUrl']]) {
			const value = state[key];
			if (!main_core.Type.isPlainObject(value)) {
				continue;
			}
			const urls = getItemSliderHistoryState(value.itemUrl, value.pageUrl, origin, urlTemplates);
			if (urls && urls[matchingUrl] === currentPath) {
				return type === 'restorePage' ? {
					type,
					...urls
				} : {
					type,
					itemUrl: urls.itemUrl
				};
			}
		}
		return null;
	}

	let instance = null;
	class Manager {
		urlTemplates = {};
		constructor() {
			const saveItemSliderState = slider => {
				// SidePanel updates the browser URL in its own listener after global listeners.
				queueMicrotask(() => {
					const sidePanel = BX.SidePanel.Instance;
					if (!slider || !slider.canChangeHistory() || sidePanel.getTopSlider() !== slider) {
						return;
					}
					const itemSlider = getItemSliderHistoryState(slider.getUrl(), sidePanel.getPageUrl(), window.location.origin, this.urlTemplates);
					if (itemSlider && sidePanel.getCurrentUrl() === itemSlider.itemUrl) {
						const restoreUrl = getItemSliderRestoreUrl(itemSlider.itemUrl, window.location.origin);
						if (restoreUrl) {
							window.history.replaceState({
								rpaItemSlider: itemSlider
							}, '', restoreUrl);
						}
					}
				});
			};
			main_core_events.EventEmitter.subscribe('SidePanel.Slider:onOpenComplete', event => {
				saveItemSliderState(event.getTarget());
			});
			main_core_events.EventEmitter.subscribe('SidePanel.Slider:onLoad', event => {
				saveItemSliderState(event.getTarget());
			});
			main_core_events.EventEmitter.subscribe('SidePanel.Slider:onCloseComplete', () => {
				saveItemSliderState(BX.SidePanel.Instance.getTopSlider());
			});
			if (main_core.Type.isEventTargetLike(window.navigation)) {
				main_core.Event.bind(window.navigation, 'navigate', event => {
					if (event.navigationType !== 'reload' || !event.cancelable) {
						return;
					}
					const action = getItemSliderHistoryAction(BX.SidePanel.Instance.getCurrentUrl(), window.history.state, window.location.origin, this.urlTemplates);
					if (action?.type !== 'restorePage') {
						return;
					}
					event.preventDefault();
					window.history.replaceState({
						rpaItemSliderPending: {
							itemUrl: action.itemUrl,
							pageUrl: action.pageUrl
						}
					}, '', action.pageUrl);
					Manager.reloadPage();
				});
			}
		}
		static editors = {};
		static get Instance() {
			if (window.top !== window) {
				return window.top.BX.Rpa.Manager.Instance;
			}
			if (instance === null) {
				instance = new Manager();
			}
			return instance;
		}
		setUrlTemplates(urlTemplates) {
			if (main_core.Type.isPlainObject(urlTemplates)) {
				this.urlTemplates = urlTemplates;
			}
			if (BX.SidePanel.Instance.getTopSlider()) {
				return this;
			}
			const action = getItemSliderHistoryAction(BX.SidePanel.Instance.getCurrentUrl(), window.history.state, window.location.origin, this.urlTemplates);
			if (action?.type === 'restorePage') {
				window.history.replaceState({
					rpaItemSliderPending: {
						itemUrl: action.itemUrl,
						pageUrl: action.pageUrl
					}
				}, '', action.pageUrl);
				Manager.reloadPage();
			} else if (action?.type === 'openSlider') {
				window.history.replaceState({}, '', BX.SidePanel.Instance.getCurrentUrl());
				Manager.openSlider(action.itemUrl);
			} else {
				const canonicalUrl = getItemSliderCanonicalUrl(window.location.href, window.location.origin);
				if (canonicalUrl) {
					window.location.replace(canonicalUrl);
				}
			}
			return this;
		}
		static reloadPage() {
			window.location.reload();
		}
		static addEditor(typeId, itemId, editor) {
			const editorClass = main_core.Reflection.getClass('BX.UI.EntityEditor');
			if (!editorClass) {
				return;
			}
			if (main_core.Type.isInteger(typeId) && main_core.Type.isInteger(itemId) && editor instanceof BX.UI.EntityEditor) {
				if (!Manager.editors[typeId]) {
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
		static getEditor(typeId, itemId) {
			if (main_core.Type.isInteger(typeId) && main_core.Type.isInteger(itemId) && Manager.editors[typeId] && Manager.editors[typeId][itemId]) {
				return Manager.editors[typeId][itemId];
			}
			return null;
		}
		static openSlider(url, options) {
			const sliderOptions = {
				cacheable: false,
				allowChangeHistory: true,
				events: {},
				...(main_core.Type.isPlainObject(options) ? options : {})
			};
			return new Promise(resolve => {
				if (main_core.Type.isString(url) && url.length > 1) {
					sliderOptions.events.onClose = function (event) {
						resolve(event.getSlider());
					};
					BX.SidePanel.Instance.open(url, sliderOptions);
				} else {
					resolve();
				}
			});
		}
		openTasks(typeId, itemId) {
			return new Promise(resolve => {
				Manager.openSlider(this.getTasksUrl(typeId, itemId).toString(), {
					width: 580,
					cacheable: false,
					allowChangeHistory: false
				}).then(slider => {
					let isCompleted = false;
					let item = null;
					if (slider.isLoaded()) {
						isCompleted = slider.getData().get('isCompleted') || false;
						item = slider.getData().get('item') || null;
					}
					resolve({
						isCompleted,
						item
					});
				}).catch(error => {
					throw error;
				});
			});
		}
		getTasksUrl(typeId, itemId) {
			const template = this.urlTemplates['bitrix:rpa.task'];
			if (template) {
				return new main_core.Uri(template.replace('#typeId#', typeId).replace('#elementId#', itemId));
			}
			return null;
		}
		openKanban(typeId) {
			const template = this.urlTemplates['bitrix:rpa.kanban'];
			if (template) {
				location.href = new main_core.Uri(template.replace('#typeId#', typeId)).toString();
				return true;
			}
			return false;
		}
		openTypeDetail(typeId, options) {
			const sliderOptions = main_core.Type.isPlainObject(options) ? options : {};
			sliderOptions.width = 702;
			const template = this.urlTemplates['bitrix:rpa.type.detail'];
			if (template) {
				return Manager.openSlider(template.replace('#id#', typeId), sliderOptions);
			}
			return null;
		}
		getItemDetailUrl(typeId, itemId = 0) {
			const template = this.urlTemplates['bitrix:rpa.item.detail'];
			if (template) {
				return new main_core.Uri(template.replace('#typeId#', typeId).replace('#id#', itemId));
			}
			return null;
		}
		openItemDetail(typeId, itemId = 0, options = {}) {
			const uri = this.getItemDetailUrl(typeId, itemId);
			if (uri) {
				return Manager.openSlider(uri.toString(), options);
			}
			return null;
		}
		getStageListUrl(typeId) {
			const template = this.urlTemplates['bitrix:rpa.stage.list'];
			if (template) {
				return new main_core.Uri(template.replace('#typeId#', typeId));
			}
			return null;
		}
		openStageList(typeId) {
			const url = this.getStageListUrl(typeId);
			if (url) {
				return Manager.openSlider(url.toString());
			}
			return null;
		}
		getFieldsListUrl(typeId) {
			const template = this.urlTemplates.fieldsList;
			if (template) {
				return new main_core.Uri(template.replace('#typeId#', typeId));
			}
			return null;
		}
		openFieldsList(typeId) {
			const url = this.getFieldsListUrl(typeId);
			if (url) {
				return Manager.openSlider(url.toString());
			}
			return null;
		}
		getFieldDetailUrl(typeId, fieldId) {
			const template = this.urlTemplates.fieldDetail;
			if (template) {
				return new main_core.Uri(template.replace('#typeId#', typeId).replace('#fieldId#', fieldId));
			}
			return null;
		}
		openFieldDetail(typeId, fieldId, options) {
			const url = this.getFieldDetailUrl(typeId, fieldId);
			if (url) {
				return Manager.openSlider(url.toString(), options);
			}
			return null;
		}
		static calculateTextColor(baseColor) {
			let r = Number.NaN;
			let g = Number.NaN;
			let b = Number.NaN;
			if (baseColor.length > 7) {
				let hexComponent = baseColor.split('(')[1].split(')')[0];
				hexComponent = hexComponent.split(',');
				const parseColorComponent = value => {
					const radix = /^[+-]?0x/i.test(String(value).trim()) ? 16 : 10;
					return parseInt(value, radix);
				};
				r = parseColorComponent(hexComponent[0]);
				g = parseColorComponent(hexComponent[1]);
				b = parseColorComponent(hexComponent[2]);
			} else if (/^#([\dA-Fa-f]{3}){1,2}$/.test(baseColor)) {
				let c = baseColor.slice(1);
				if (c.length === 3) {
					c = `${c[0]}${c[0]}${c[1]}${c[1]}${c[2]}${c[2]}`;
				}
				c = `0x${c}`;
				r = c >> 16 & 255;
				g = c >> 8 & 255;
				b = c & 255;
			}
			const y = 0.21 * r + 0.72 * g + 0.07 * b;
			return y < 145 ? '#fff' : '#333';
		}
		closeSettingsMenu(event, item) {
			if (item && main_core.Type.isFunction(item.getMenuWindow)) {
				const window = item.getMenuWindow();
				if (window) {
					window.close();
					return;
				}
			}
			if (this && main_core.Type.isFunction(this.close)) {
				this.close();
			}
		}
		showFeatureSlider(event, item) {
			Manager.Instance.closeSettingsMenu(event, item);
			BX.UI.InfoHelper.show('limit_robotic_process_automation');
		}
	}

	exports.Manager = Manager;

})(this.BX.Rpa = this.BX.Rpa || {}, BX, window, BX, BX, BX.Event);
//# sourceMappingURL=manager.bundle.js.map

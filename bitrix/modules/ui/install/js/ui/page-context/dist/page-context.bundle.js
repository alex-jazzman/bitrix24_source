/* eslint-disable */
this.BX = this.BX || {};
this.BX.UI = this.BX.UI || {};
(function (exports, main_core_events) {
	'use strict';

	class ContextStack {
		#layers = [new Map()];
		push() {
			this.#layers.push(new Map());
		}
		pop() {
			if (this.#layers.length > 1) {
				this.#layers.pop();
			}
		}
		current() {
			return this.#layers[this.#layers.length - 1];
		}
		get depth() {
			return this.#layers.length;
		}
	}

	function getUrl() {
		return window.location.pathname + window.location.search + window.location.hash;
	}

	/**
	 * Maps a portal URL path to the module that is presumed to own its content.
	 *
	 * Derived from the portal left menu (intranet `.superleft.menu_ext.php`) and the
	 * components mounted by the matching public pages. The first matching rule wins,
	 * so more specific paths must come before the generic ones.
	 */
	const MODULE_ROUTE_MAP = [[/^\/company\/personal\/user\/\d+\/tasks(\/|$)/, 'tasks'], [/^\/company\/personal\/user\/\d+\/calendar(\/|$)/, 'calendar'], [/^\/company\/personal\/user\/\d+\/(disk|files)(\/|$)/, 'disk'], [/^\/company\/personal\/bizproc(\/|$)/, 'bizproc'], [/^\/shop\/documents(\/|$|-)/, 'catalog'], [/^\/stream(\/|$)/, 'socialnetwork'], [/^\/tasks(\/|$)/, 'tasks'], [/^\/calendar(\/|$)/, 'calendar'], [/^\/(docs|disk)(\/|$)/, 'disk'], [/^\/crm(\/|$)/, 'crm'], [/^\/contact_center(\/|$)/, 'crm'], [/^\/booking(\/|$)/, 'booking'], [/^\/shop(\/|$)/, 'sale'], [/^\/(sites|kb)(\/|$)/, 'landing'], [/^\/bi(\/|$)/, 'biconnector'], [/^\/note(\/|$)/, 'note'], [/^\/marketing(\/|$)/, 'sender'], [/^\/(online|desktop_app)(\/|$)/, 'im'], [/^\/sign(\/|$)/, 'sign'], [/^\/mail(\/|$)/, 'mail'], [/^\/workgroups(\/|$)/, 'socialnetwork'], [/^\/spaces(\/|$)/, 'socialnetwork'], [/^\/bizproc(\/|$)/, 'bizproc'], [/^\/automation(\/|$)/, 'bizproc'], [/^\/marketplace(\/|$)/, 'rest'], [/^\/market(\/|$)/, 'market'], [/^\/devops(\/|$)/, 'rest'], [/^\/mcp(\/|$)/, 'aiassistant'], [/^\/conference(\/|$)/, 'call'], [/^\/timeman(\/|$)/, 'timeman'], [/^\/settings(\/|$)/, 'intranet'], [/^\/company(\/|$)/, 'intranet']];
	function extractPath(url) {
		const path = String(url).split('#')[0].split('?')[0];
		return path.startsWith('/') ? path : `/${path}`;
	}
	function getModule(url = window.location.pathname) {
		const path = extractPath(url).toLowerCase();
		for (const [pattern, moduleId] of MODULE_ROUTE_MAP) {
			if (pattern.test(path)) {
				return moduleId;
			}
		}
		return null;
	}

	const SLIDER_EVENT_OPEN = 'SidePanel.Slider:onOpenComplete';
	const SLIDER_EVENT_CLOSE = 'SidePanel.Slider:onCloseComplete';
	class PageContextClass {
		#stack = new ContextStack();
		constructor() {
			this.#subscribeToSliderEvents();
		}
		set(moduleId, key, value) {
			const layer = this.#stack.current();
			if (!layer.has(moduleId)) {
				layer.set(moduleId, new Map());
			}
			layer.get(moduleId).set(key, value);
		}
		delete(moduleId, key) {
			const moduleData = this.#stack.current().get(moduleId);
			if (moduleData) {
				moduleData.delete(key);
				if (moduleData.size === 0) {
					this.#stack.current().delete(moduleId);
				}
			}
		}
		getSystem(key) {
			return this.#collectSystem()[key];
		}
		getModule() {
			return getModule();
		}
		getCustom(moduleId, key) {
			return this.#stack.current().get(moduleId)?.get(key);
		}
		getModuleCustom(moduleId) {
			const moduleData = this.#stack.current().get(moduleId);
			if (!moduleData) {
				return {};
			}
			return Object.fromEntries(moduleData);
		}
		getAllSystem() {
			return this.#collectSystem();
		}
		getAllCustom() {
			const result = {};
			for (const [moduleId, moduleData] of this.#stack.current()) {
				result[moduleId] = Object.fromEntries(moduleData);
			}
			return result;
		}
		getAll() {
			return {
				system: this.getAllSystem(),
				custom: this.getAllCustom()
			};
		}
		#collectSystem() {
			return {
				url: getUrl(),
				module: getModule()
			};
		}
		#subscribeToSliderEvents() {
			main_core_events.EventEmitter.subscribe(SLIDER_EVENT_OPEN, this.#handleSliderOpen);
			main_core_events.EventEmitter.subscribe(SLIDER_EVENT_CLOSE, this.#handleSliderClose);
		}
		#handleSliderOpen = () => {
			this.#stack.push();
		};
		#handleSliderClose = () => {
			this.#stack.pop();
		};
	}
	const PageContext = new PageContextClass();

	exports.PageContext = PageContext;

})(this.BX.UI.PageContext = this.BX.UI.PageContext || {}, BX.Event);
//# sourceMappingURL=page-context.bundle.js.map

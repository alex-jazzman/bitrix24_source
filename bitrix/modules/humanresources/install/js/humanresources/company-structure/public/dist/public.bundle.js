/* eslint-disable */
this.BX = this.BX || {};
this.BX.Humanresources = this.BX.Humanresources || {};
(function (exports, main_core, main_core_events) {
	'use strict';

	class Structure {
		static open(options = {}) {
			const settings = main_core.Extension.getSettings('humanresources.company-structure.public');
			const baseUrl = settings.get('url');
			if (!baseUrl) {
				return;
			}
			if (!this.#isCurrentPageStructureView(baseUrl)) {
				const url = new main_core.Uri(baseUrl);
				this.#appendParamsFromOptions(url, options);
				this.#openSlider(url);
				return;
			}
			this.#handleInPlaceStructureNavigation(options);
		}
		static #isCurrentPageStructureView(url) {
			return window.location.href.includes(url);
		}
		static #appendParamsFromOptions(url, options) {
			if (main_core.Type.isInteger(options.focusNodeId)) {
				url.setQueryParam('focusNodeId', options.focusNodeId);
			}
			return url;
		}
		static #handleInPlaceStructureNavigation(options) {
			if (options.focusNodeId) {
				main_core_events.EventEmitter.emit('HumanResources.CompanyStructure:focusNode', {
					nodeId: options.focusNodeId
				});
			}
		}
		static #openSlider(url) {
			top.BX.SidePanel.Instance.open(url.toString());
		}
	}

	exports.Structure = Structure;

})(this.BX.Humanresources.CompanyStructure = this.BX.Humanresources.CompanyStructure || {}, BX, BX.Event);
//# sourceMappingURL=public.bundle.js.map

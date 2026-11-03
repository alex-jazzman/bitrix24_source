/* eslint-disable */
this.BX = this.BX || {};
this.BX.Sign = this.BX.Sign || {};
this.BX.Sign.V2 = this.BX.Sign.V2 || {};
this.BX.Sign.V2.Grid = this.BX.Sign.V2.Grid || {};
(function (exports, ui_system_tooltip, main_core, main_sidepanel, ui_a11y, sign_v2_api) {
	'use strict';

	const RowActionRole = Object.freeze({
		Retry: 'sign-b2e-process-retry',
		Protocol: 'sign-b2e-process-protocol',
		Catalog: 'sign-b2e-process-catalog'
	});
	const BUTTON_WAITING_CLASS = 'ui-btn-wait';
	function parseRetryTarget(dataset) {
		const launchId = readPositiveInt(dataset.launchId);
		if (launchId === null) {
			return null;
		}
		const rawItemId = dataset.itemId;
		if (rawItemId === undefined || rawItemId === '') {
			return {
				launchId,
				itemId: null
			};
		}
		const itemId = readPositiveInt(rawItemId);
		return itemId === null ? null : {
			launchId,
			itemId
		};
	}
	function readPositiveInt(value) {
		if (value === undefined) {
			return null;
		}
		const parsed = Number(value);
		return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
	}
	class RowActions {
		#handlers;
		#slidersByRole;
		constructor(handlers) {
			this.#handlers = handlers;
			this.#slidersByRole = [[RowActionRole.Protocol, handlers.openProtocol], [RowActionRole.Catalog, handlers.openCatalog]];
		}
		bind() {
			main_core.Event.bind(document, 'click', this.#handleClick);
		}
		unbind() {
			main_core.Event.unbind(document, 'click', this.#handleClick);
		}
		#handleClick = event => {
			const source = event.target;
			if (!main_core.Type.isDomNode(source)) {
				return;
			}
			const node = source;
			const retryButton = node.closest(`[data-role="${RowActionRole.Retry}"]`);
			if (retryButton !== null) {
				event.preventDefault();
				this.#retry(retryButton);
				return;
			}
			for (const [role, open] of this.#slidersByRole) {
				const link = node.closest(`[data-role="${role}"]`);
				if (link !== null) {
					event.preventDefault();
					open(link.getAttribute('href') ?? '');
					return;
				}
			}
		};
		#retry(button) {
			if (main_core.Dom.hasClass(button, BUTTON_WAITING_CLASS)) {
				return;
			}
			const target = parseRetryTarget(button.dataset);
			if (target === null) {
				return;
			}
			main_core.Dom.addClass(button, BUTTON_WAITING_CLASS);
			main_core.Dom.attr(button, {
				'aria-busy': 'true',
				'aria-disabled': 'true'
			});
			void this.#handlers.retry(target).finally(() => {
				main_core.Dom.removeClass(button, BUTTON_WAITING_CLASS);
				main_core.Dom.attr(button, {
					'aria-busy': null,
					'aria-disabled': null
				});
			});
		}
	}

	const PROTOCOL_SLIDER_WIDTH = 1200;
	const CATALOG_SLIDER_WIDTH = 1650;
	class ProcessList {
		static #instance = null;
		#gridId;
		#actions;
		static bind(gridId) {
			if (ProcessList.#instance !== null) {
				return;
			}
			ProcessList.#instance = new ProcessList(gridId);
			ProcessList.#instance.#subscribe();
		}
		constructor(gridId) {
			this.#gridId = gridId;
			this.#actions = new RowActions({
				retry: target => this.#retry(target),
				openProtocol: url => ProcessList.#openSlider(url, PROTOCOL_SLIDER_WIDTH),
				openCatalog: url => ProcessList.#openSlider(url, CATALOG_SLIDER_WIDTH)
			});
		}
		#subscribe() {
			this.#actions.bind();
		}
		async #retry(target) {
			try {
				await new sign_v2_api.Api().process.retry(target.launchId, target.itemId);
			} catch {
				return;
			}
			const grid = this.#getGrid();
			ProcessList.#leadFocusToGrid(grid);
			ui_a11y.LiveAnnouncer.announce(main_core.Loc.getMessage('SIGN_B2E_PROCESS_LIST_RETRY_ANNOUNCE') ?? '');
			grid?.reload();
		}
		#getGrid() {
			const manager = BX.Main?.gridManager;
			return manager?.getInstanceById(this.#gridId) ?? manager?.getById(this.#gridId)?.instance ?? null;
		}
		static #leadFocusToGrid(grid) {
			const container = grid?.getContainer?.() ?? null;
			if (container !== null) {
				ui_a11y.FocusNavigator.focusContainer(container);
			}
		}
		static #openSlider(url, width) {
			if (url === '') {
				return;
			}
			main_sidepanel.SidePanel.Instance.open(url, {
				width,
				cacheable: false
			});
		}
	}

	exports.ProcessList = ProcessList;

})(this.BX.Sign.V2.Grid.B2e = this.BX.Sign.V2.Grid.B2e || {}, BX.UI.System.Tooltip, BX, BX.SidePanel, BX.UI.Accessibility, BX.Sign.V2);
//# sourceMappingURL=index.bundle.js.map

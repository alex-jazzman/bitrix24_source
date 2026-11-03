/* eslint-disable */
this.BX = this.BX || {};
this.BX.Sign = this.BX.Sign || {};
this.BX.Sign.V2 = this.BX.Sign.V2 || {};
(function (exports, main_core, ui_counterpanel, sign_v2_api) {
	'use strict';

	const SECTION_ROOT = 'b2e/';
	const PROCESSES_TAB = 'processes/';
	function resolveProcessesTabUrl(pathname) {
		const rootAt = pathname.indexOf(SECTION_ROOT);
		return rootAt === -1 ? null : `${pathname.slice(0, rootAt + SECTION_ROOT.length)}${PROCESSES_TAB}`;
	}

	const ITEM_ID = 'sign-b2e-processes';
	const ACTIONS_BAR_SELECTOR = '.ui-actions-bar';
	const NAVIGATION_SELECTOR = '.ui-actions-bar__panel';
	const RUNNING_PROBE_LIMIT = 1;
	class ProcessPill {
		#panel = null;
		static mount() {
			main_core.Event.ready(() => {
				new ProcessPill().#render();
			});
		}
		#render() {
			const row = document.querySelector(ACTIONS_BAR_SELECTOR);
			const tabUrl = resolveProcessesTabUrl(document.location.pathname);
			if (row === null || tabUrl === null) {
				return;
			}
			this.#panel = new ui_counterpanel.CounterPanel({
				target: this.#placeTarget(row, tabUrl),
				title: '',
				multiselect: true,
				items: [{
					id: ITEM_ID,
					title: main_core.Loc.getMessage('SIGN_B2E_PROCESS_PILL_TITLE') ?? ''
				}]
			});
			this.#panel.init();
			this.#loadRunningMark();
		}
		#placeTarget(row, tabUrl) {
			const target = main_core.Tag.render`
			<a class="ui-actions-bar__panel sign-b2e-process-pill" data-testid="sign-b2e-process-pill"></a>
		`;
			main_core.Dom.attr(target, 'href', tabUrl);
			const navigation = row.querySelector(NAVIGATION_SELECTOR);
			if (navigation === null) {
				main_core.Dom.append(target, row);
			} else {
				main_core.Dom.insertAfter(target, navigation);
			}
			return target;
		}
		async #loadRunningMark() {
			try {
				const page = await new sign_v2_api.Api().process.getGroups({}, RUNNING_PROBE_LIMIT, 0);
				if (page.hasAnyRunning) {
					this.#showRunningMark();
				}
			} catch {
			}
		}
		#showRunningMark() {
			const container = this.#panel?.getItemById(ITEM_ID)?.getContainer() ?? null;
			if (container === null) {
				return;
			}
			const label = main_core.Text.encode(main_core.Loc.getMessage('SIGN_B2E_PROCESS_PILL_HAS_RUNNING') ?? '');
			main_core.Dom.append(main_core.Tag.render`<span class="sign-b2e-process-pill__mark" role="img" aria-label="${label}"></span>`, container);
		}
	}

	ProcessPill.mount();

	exports.ProcessPill = ProcessPill;

})(this.BX.Sign.V2.B2e = this.BX.Sign.V2.B2e || {}, BX, BX.UI, BX.Sign.V2);
//# sourceMappingURL=process-pill.bundle.js.map

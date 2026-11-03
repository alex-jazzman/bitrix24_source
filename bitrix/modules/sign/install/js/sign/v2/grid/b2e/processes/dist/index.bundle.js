/* eslint-disable */
this.BX = this.BX || {};
this.BX.Sign = this.BX.Sign || {};
this.BX.Sign.V2 = this.BX.Sign.V2 || {};
this.BX.Sign.V2.Grid = this.BX.Sign.V2.Grid || {};
(function (exports, main_core, ui_a11y, ui_buttons, ui_system_dialog, main_sidepanel, sign_v2_api) {
	'use strict';

	const RUN_PROCESS_EXTENSION = 'sign.v2.b2e.run-process';
	const SECTION_ROOT = 'b2e/';
	const PROCESSES_TAB = 'processes/';
	async function openRunProcess(process) {
		const {
			RunProcess
		} = await main_core.Runtime.loadExtension(RUN_PROCESS_EXTENSION);
		RunProcess.open(process, {
			onLaunched: () => goToProcessesTab()
		});
	}
	function goToProcessesTab() {
		const topWindow = top ?? window;
		const url = readProcessesTabUrl(topWindow.location.pathname);
		if (url === null) {
			return;
		}
		topWindow.location.href = url;
	}
	function readProcessesTabUrl(pathname) {
		const rootEnd = pathname.indexOf(SECTION_ROOT);
		return rootEnd === -1 ? null : `${pathname.slice(0, rootEnd + SECTION_ROOT.length)}${PROCESSES_TAB}`;
	}

	const RUN_BUTTON_SELECTOR = '[data-role="sign-b2e-process-run"]';
	class ProcessCatalog {
		static #instance = null;
		static bind() {
			if (ProcessCatalog.#instance !== null) {
				return;
			}
			ProcessCatalog.#instance = new ProcessCatalog();
			ProcessCatalog.#instance.#subscribe();
		}
		#subscribe() {
			main_core.Event.bind(document, 'click', this.#handleClick);
		}
		#handleClick = event => {
			const target = event.target;
			if (!main_core.Type.isDomNode(target)) {
				return;
			}
			const button = target.closest(RUN_BUTTON_SELECTOR);
			if (button === null) {
				return;
			}
			const process = ProcessCatalog.#readProcess(button);
			if (process === null) {
				return;
			}
			if (process.isConstantsTuned) {
				void openRunProcess(process);
				return;
			}
			this.#warnAboutConstants(process);
		};
		static #readProcess(button) {
			try {
				return JSON.parse(button.dataset.process ?? '');
			} catch {
				return null;
			}
		}
		#warnAboutConstants(process) {
			const title = main_core.Loc.getMessage('SIGN_B2E_PROCESS_CATALOG_CONSTANTS_TITLE') ?? '';
			const content = main_core.Tag.render`
			<div class="sign-b2e-process-catalog__dialog" data-testid="sign-b2e-process-catalog-constants">
				${main_core.Loc.getMessage('SIGN_B2E_PROCESS_CATALOG_CONSTANTS_TEXT')}
			</div>
		`;
			const dialog = new ui_system_dialog.Dialog({
				title,
				content,
				hasOverlay: true,
				leftButtons: [new ui_buttons.Button({
					useAirDesign: true,
					style: ui_buttons.AirButtonStyle.FILLED,
					size: ui_buttons.ButtonSize.LARGE,
					collapsedIcon: ui_buttons.ButtonIcon.START,
					text: main_core.Loc.getMessage('SIGN_B2E_PROCESS_CATALOG_CONSTANTS_RUN') ?? '',
					dataset: {
						testid: 'sign-b2e-process-catalog-constants-run'
					},
					onclick: async () => {
						dialog.hide();
						await openRunProcess(process);
					}
				}), new ui_buttons.Button({
					useAirDesign: true,
					style: ui_buttons.AirButtonStyle.PLAIN,
					size: ui_buttons.ButtonSize.LARGE,
					collapsedIcon: ui_buttons.ButtonIcon.CANCEL,
					text: main_core.Loc.getMessage('SIGN_B2E_PROCESS_CATALOG_CONSTANTS_CANCEL') ?? '',
					dataset: {
						testid: 'sign-b2e-process-catalog-constants-cancel'
					},
					onclick: () => {
						dialog.hide();
						return true;
					}
				})]
			});
			dialog.subscribe('onAfterShow', () => ProcessCatalog.#nameDialogAndMoveFocus(content, title));
			dialog.show();
		}
		static #nameDialogAndMoveFocus(content, title) {
			const container = content.closest('[role="dialog"]');
			if (container === null) {
				return;
			}
			main_core.Dom.attr(container, 'aria-label', title);
			ui_a11y.FocusNavigator.focusContainer(container);
		}
	}

	const SUBMENU_PROCESS_LIMIT = 5;
	const SubmenuItemId = Object.freeze({
		Empty: 'sign-b2e-run-process-empty',
		Delimiter: 'sign-b2e-run-process-delimiter',
		AllProcesses: 'sign-b2e-run-process-all',
		CreateProcess: 'sign-b2e-run-process-create'
	});
	function getProcessItemId(processId) {
		return `sign-b2e-run-process-${processId}`;
	}
	function buildSubmenuItems(response, options, onProcessSelect, onAllProcessesSelect) {
		const processes = [...response.processes].sort((first, second) => first.name.localeCompare(second.name)).slice(0, SUBMENU_PROCESS_LIMIT);
		const actions = [];
		if (processes.length > 0 && options.allProcessesUrl !== '') {
			actions.push(buildAllProcessesItem(onAllProcessesSelect));
		}
		if (response.canCreateProcess && options.createProcessUrl !== '') {
			actions.push(buildCreateProcessItem(options.createProcessUrl));
		}
		const head = processes.length > 0 ? processes.map(process => buildProcessItem(process, onProcessSelect)) : [buildEmptyItem()];
		return actions.length > 0 ? [...head, buildDelimiter(), ...actions] : head;
	}
	function buildProcessItem(process, onProcessSelect) {
		return {
			id: getProcessItemId(process.id),
			text: process.name,
			onclick: () => onProcessSelect(process)
		};
	}
	function buildEmptyItem() {
		return {
			id: SubmenuItemId.Empty,
			className: 'menu-popup-no-icon sign-b2e-run-process-menu__item --empty',
			html: main_core.Tag.render`
			<span class="sign-b2e-run-process-menu__empty">
				${main_core.Loc.getMessage('SIGN_B2E_RUN_PROCESS_MENU_EMPTY')}
			</span>
		`
		};
	}
	function buildDelimiter() {
		return {
			id: SubmenuItemId.Delimiter,
			delimiter: true
		};
	}
	function buildAllProcessesItem(onAllProcessesSelect) {
		return {
			id: SubmenuItemId.AllProcesses,
			text: main_core.Loc.getMessage('SIGN_B2E_RUN_PROCESS_MENU_ALL_PROCESSES') ?? '',
			onclick: onAllProcessesSelect
		};
	}
	function buildCreateProcessItem(createProcessUrl) {
		return {
			id: SubmenuItemId.CreateProcess,
			text: main_core.Loc.getMessage('SIGN_B2E_RUN_PROCESS_MENU_CREATE_PROCESS') ?? '',
			href: createProcessUrl
		};
	}

	const MENU_SCOPE_CLASS = 'sign-b2e-run-process-menu';
	const CATALOG_SLIDER_WIDTH = 1650;
	class RunProcessMenu {
		static #menus = new WeakMap();
		static fill(item, options) {
			let menu = this.#menus.get(item);
			if (menu === undefined) {
				menu = new RunProcessMenu(item, options);
				this.#menus.set(item, menu);
			}
			menu.#load();
		}
		#item;
		#options;
		#api = new sign_v2_api.Api();
		#isLoaded = false;
		#isLoading = false;
		constructor(item, options) {
			this.#item = item;
			this.#options = options;
		}
		async #load() {
			if (this.#isLoaded || this.#isLoading) {
				return;
			}
			this.#isLoading = true;
			try {
				this.#render(await this.#api.process.getAvailableList(SUBMENU_PROCESS_LIMIT));
				this.#isLoaded = true;
			} catch {
			} finally {
				this.#isLoading = false;
			}
		}
		#render(response) {
			const subMenu = this.#item.getSubMenu();
			if (subMenu === null) {
				return;
			}
			main_core.Dom.addClass(subMenu.getMenuContainer(), MENU_SCOPE_CLASS);
			const placeholderIds = subMenu.getMenuItems().map(item => item.getId());
			buildSubmenuItems(response, this.#options, process => this.#runProcess(process), () => this.#openCatalog()).forEach(item => subMenu.addMenuItem(item, null));
			placeholderIds.forEach(id => subMenu.removeMenuItem(id));
			this.#item.adjustSubMenu();
		}
		async #runProcess(process) {
			this.#closeMenu();
			await openRunProcess(process);
		}
		#openCatalog() {
			this.#closeMenu();
			main_sidepanel.SidePanel.Instance.open(this.#options.allProcessesUrl, {
				width: CATALOG_SLIDER_WIDTH,
				cacheable: false
			});
		}
		#closeMenu() {
			this.#item.getMenuWindow()?.close();
		}
	}

	exports.ProcessCatalog = ProcessCatalog;
	exports.RunProcessMenu = RunProcessMenu;

})(this.BX.Sign.V2.Grid.B2e = this.BX.Sign.V2.Grid.B2e || {}, BX, BX.UI.Accessibility, BX.UI, BX.UI.System, BX.SidePanel, BX.Sign.V2);
//# sourceMappingURL=index.bundle.js.map

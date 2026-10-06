/* eslint-disable */
this.BX = this.BX || {};
this.BX.Bizproc = this.BX.Bizproc || {};
(function (exports, main_core, main_core_events, ui_alerts, bizproc_a11y, bizproc_router) {
	'use strict';

	class UserProcessesStart {
		#counters = new Map();
		onElementCreatedHandler = null;

		// The template calls init() on every Grid::updated, so the previous subscription
		// is dropped before a new one is created.
		#gridSubscription = null;
		constructor(options) {
			if (main_core.Type.isPlainObject(options)) {
				this.gridId = options.gridId;
				if (main_core.Type.isArray(options.errors)) {
					this.showErrors(options.errors);
				}
			}
			this.init();
		}
		init() {
			BX.UI.Hint.init(document);
			if (this.getGrid()) {
				BX.Bizproc.Component.UserProcessesStart.colorPinnedRows(this.getGrid());
			}
			this.#applyGridA11y();
			this.subscribeGridEvents();
			this.subscribeCustomEvents();
		}
		subscribeGridEvents() {
			this.unsubscribeGridEvents();
			this.#gridSubscription = bizproc_a11y.subscribeGridUpdated(this.gridId, () => this.#onAfterGridUpdated());
		}
		unsubscribeGridEvents() {
			this.#gridSubscription?.destroy();
			this.#gridSubscription = null;
		}
		#applyGridA11y() {
			const container = this.getGrid()?.getContainer();
			if (!main_core.Type.isDomNode(container)) {
				return;
			}
			bizproc_a11y.enhanceGrid(container, {
				gridId: this.gridId,
				rowActionsLabel: main_core.Loc.getMessage('BIZPROC_USER_PROCESSES_START_ROW_ACTIONS_LABEL'),
				columnLabels: {
					PIN: main_core.Loc.getMessage('BIZPROC_USER_PROCESSES_START_PIN_COLUMN_LABEL')
				},
				toggles: [{
					selector: '.main-grid-cell-content-action-pin',
					label: main_core.Loc.getMessage('BIZPROC_USER_PROCESSES_START_PIN_LABEL'),
					// the helper falls back to the same class value when the grid is not loaded yet
					activeClass: BX.Grid?.CellActionState?.ACTIVE
				}]
			});
		}
		subscribeCustomEvents() {
			if (this.onElementCreatedHandler === null) {
				this.onElementCreatedHandler = this.onElementCreated.bind(this);
				main_core_events.EventEmitter.subscribe('SidePanel.Slider:onMessage', this.onElementCreatedHandler);
			}
		}
		unsubscribeCustomEvents() {
			if (this.onElementCreatedHandler) {
				main_core_events.EventEmitter.unsubscribe('SidePanel.Slider:onMessage', this.onElementCreatedHandler);
				this.onElementCreatedHandler = null;
			}
		}
		destroy() {
			this.unsubscribeGridEvents();
			this.unsubscribeCustomEvents();
		}
		static changePin(iblockId, gridId, event) {
			const eventData = event.getData();
			const button = eventData.button;
			if (main_core.Dom.hasClass(button, BX.Grid.CellActionState.ACTIVE)) {
				BX.Bizproc.Component.UserProcessesStart.#action('unpin', iblockId, gridId);
				main_core.Dom.removeClass(button, BX.Grid.CellActionState.ACTIVE);
				main_core.Dom.attr(button, 'aria-pressed', 'false');
				bizproc_a11y.announce(main_core.Loc.getMessage('BIZPROC_USER_PROCESSES_START_UNPINNED'));
			} else {
				BX.Bizproc.Component.UserProcessesStart.#action('pin', iblockId, gridId);
				main_core.Dom.addClass(button, BX.Grid.CellActionState.ACTIVE);
				main_core.Dom.attr(button, 'aria-pressed', 'true');
				bizproc_a11y.announce(main_core.Loc.getMessage('BIZPROC_USER_PROCESSES_START_PINNED'));
			}
			const grid = BX.Main.gridManager.getInstanceById(gridId);
			if (grid) {
				BX.Bizproc.Component.UserProcessesStart.colorPinnedRows(grid);
			}
		}
		static #action(action, iblockId, gridId) {
			const component = 'bitrix:bizproc.user.processes.start';
			main_core.ajax.runComponentAction(component, action, {
				mode: 'class',
				data: {
					iblockId
				}
			}).then(response => {
				const grid = BX.Main.gridManager.getInstanceById(gridId);
				if (grid) {
					grid.reload();
				}
			}).catch(() => {});
		}
		static colorPinnedRows(grid) {
			grid.getRows().getRows().forEach(row => {
				const node = row.getNode();
				if (main_core.Type.isElementNode(node.querySelector('.main-grid-cell-content-action-pin.main-grid-cell-content-action-active'))) {
					main_core.Dom.addClass(node, 'bizproc-user-processes-start-item-pinned');
				} else {
					main_core.Dom.removeClass(node, 'bizproc-user-processes-start-item-pinned');
				}
			});
		}
		#onAfterGridUpdated() {
			if (this.getGrid()) {
				BX.UI.Hint.init(this.getGrid().getContainer());
				BX.Bizproc.Component.UserProcessesStart.colorPinnedRows(this.getGrid());
			}
			this.#applyGridA11y();
			bizproc_a11y.announce(main_core.Loc.getMessage('BIZPROC_USER_PROCESSES_START_GRID_UPDATED'));
			this.#counters.forEach((value, key) => {
				const counter = document.querySelector(`[data-role="iblock-${key}-counter"]`);
				if (main_core.Type.isElementNode(counter)) {
					main_core.Dom.clean(counter);
					main_core.Dom.append(this.#renderStartedByMeNow(key), counter);
				}
			});
		}
		#renderStartedByMeNow(iblockId) {
			let message = main_core.Text.encode(main_core.Loc.getMessage('BIZPROC_USER_PROCESSES_START_COUNTER', {
				'#COUNTER#': this.#counters.get(iblockId)
			}));
			message = message.replace('[bold]', '<span class="bizproc-user-processes-start-column-start-counter">');
			message = message.replace('[/bold]', '</span>');
			return main_core.Tag.render`<div class="ui-typography-text-xs">${message}</div>`;
		}
		startWorkflow(event, iBlockTypeId, iblockId, iBlockName) {
			event.preventDefault();
			main_core.Runtime.loadExtension('lists.element.creation-guide').then(({
				CreationGuide
			}) => {
				CreationGuide?.open({
					iBlockTypeId,
					iBlockId: iblockId,
					analyticsP1: iBlockName
				});
			}).catch(() => {}).finally(() => {});
		}
		onElementCreated(event) {
			const [sliderEvent] = event.getCompatData();
			if (sliderEvent.getEventId() === 'BX.Lists.Element.CreationGuide:onElementCreated') {
				const eventArgs = sliderEvent.getData();
				if (!this.#counters.has(eventArgs.iBlockId)) {
					this.#counters.set(eventArgs.iBlockId, 0);
				}
				this.#counters.set(eventArgs.iBlockId, this.#counters.get(eventArgs.iBlockId) + 1);
				this.reloadGrid();
				BX.SidePanel.Instance.getSliderByWindow(window).close();
			} else {
				this.reloadGrid();
			}
		}
		showErrors(errors) {
			if (!main_core.Type.isArrayFilled(errors)) {
				if (!main_core.Type.isArray(errors)) {
					console.error(errors);
				}
				return;
			}
			const errorsContainer = document.getElementById('bp-user-processes-errors-container');
			if (errorsContainer) {
				let errorCounter = 0;
				const fixStyles = () => {
					if (errorCounter > 0) {
						main_core.Dom.style(errorsContainer, {
							margin: '10px'
						});
					} else {
						main_core.Dom.style(errorsContainer, {
							margin: '0px'
						});
					}
				};
				for (const error of errors) {
					errorCounter += 1;
					const alert = new ui_alerts.Alert({
						text: main_core.Text.encode(error.message),
						color: ui_alerts.AlertColor.DANGER,
						closeBtn: true,
						animated: true
					});
					alert.renderTo(errorsContainer);
					if (alert.getCloseBtn()) {
						// eslint-disable-next-line no-loop-func
						alert.getCloseBtn().onclick = () => {
							errorCounter -= 1;
							fixStyles();
						};
					}
				}
				fixStyles();
			}
		}
		reloadGrid() {
			this.getGrid()?.reload();
		}
		getGrid() {
			if (this.gridId) {
				return BX.Main.gridManager?.getInstanceById(this.gridId);
			}
			return null;
		}
		editTemplate(event, bizprocEditorUrl, canEdit) {
			if (!canEdit) {
				this.showNoPermissionsHint(event.target);
				return;
			}
			if (bizprocEditorUrl.length === 0) {
				this.showNoEditorHint(event.target);
				return;
			}
			top.window.location.href = bizprocEditorUrl;
		}
		editTemplateConstants(templateId, signedDocumentType) {
			bizproc_router.Router.openWorkflowChangeConstants({
				templateId,
				signedDocumentType
			});
		}
		showAngleHint(node, text) {
			if (this.hintTimeout) {
				clearTimeout(this.hintTimeout);
			}
			this.popupHint = BX.UI.Hint.createInstance({
				popupParameters: {
					width: 334,
					height: 104,
					closeByEsc: true,
					autoHide: true,
					angle: {
						offset: main_core.Dom.getPosition(node).width / 2
					},
					bindOptions: {
						position: 'top'
					}
				}
			});
			this.popupHint.close = function () {
				this.hide();
			};
			this.popupHint.show(node, text);
			this.timeout = setTimeout(this.hideHint.bind(this), 5000);
		}
		hideHint() {
			if (this.popupHint) {
				this.popupHint.close();
			}
			this.popupHint = null;
		}
		showNoPermissionsHint(node) {
			this.showAngleHint(node, main_core.Loc.getMessage('BIZPROC_USER_PROCESSES_START_TEMPLATE_RIGHTS_ERROR'));
		}
		showNoEditorHint(node) {
			this.showAngleHint(node, main_core.Loc.getMessage('BIZPROC_USER_PROCESSES_START_TEMPLATE_MODULE_ERROR'));
		}
	}

	exports.UserProcessesStart = UserProcessesStart;

})(this.BX.Bizproc.Component = this.BX.Bizproc.Component || {}, BX, BX.Event, BX.UI, BX.Bizproc.A11y, BX.Bizproc);
//# sourceMappingURL=script.js.map

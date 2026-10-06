/* eslint-disable */
(function (main_core, ui_entitySelector, bizproc_a11y) {
	'use strict';

	const namespace = main_core.Reflection.namespace('BX.Bizproc.Component');
	class TaskList {
		#gridId;
		#delegateToSelector;
		#delegateToUserId = 0;
		constructor(options) {
			this.#gridId = options.gridId;
			this.#initSelectors();
		}
		#initSelectors() {
			const self = this;
			this.#delegateToSelector = new ui_entitySelector.TagSelector({
				multiple: false,
				tagMaxWidth: 180,
				events: {
					onTagAdd(event) {
						self.#delegateToUserId = parseInt(event.getData().tag.getId());
						if (!main_core.Type.isInteger(self.#delegateToUserId)) {
							self.#delegateToUserId = 0;
						}
					},
					onTagRemove() {
						self.#delegateToUserId = 0;
					}
				},
				dialogOptions: {
					entities: [{
						id: 'user',
						options: {
							intranetUsersOnly: true,
							inviteEmployeeLink: false
						}
					}]
				}
			});
		}
		init() {
			const delegateToWrapper = document.getElementById('ACTION_DELEGATE_TO_WRAPPER');
			if (delegateToWrapper) {
				this.#delegateToSelector.renderTo(delegateToWrapper);
				main_core.Dom.attr(delegateToWrapper, {
					role: 'group',
					'aria-label': main_core.Loc.getMessage('BPATL_A11Y_DELEGATE_TO_LABEL')
				});
			}
			this.#enhanceRows();
			this.subscribeGridEvents();
		}

		// init() runs on every Grid::updated and from the reloadTable() callback, so
		// announcing there would speak twice per group action. A single filtered
		// subscription announces the update once, and only for this grid.
		#gridSubscription = null;
		subscribeGridEvents() {
			this.unsubscribeGridEvents();
			this.#gridSubscription = bizproc_a11y.subscribeGridUpdated(this.#gridId, () => bizproc_a11y.announce(main_core.Loc.getMessage('BPATL_A11Y_GRID_UPDATED')));
		}
		unsubscribeGridEvents() {
			this.#gridSubscription?.destroy();
			this.#gridSubscription = null;
		}
		destroy() {
			this.unsubscribeGridEvents();
		}
		#enhanceRows() {
			const container = this.getGrid()?.getContainer();
			if (!main_core.Type.isDomNode(container)) {
				return;
			}
			bizproc_a11y.enhanceGrid(container, {
				gridId: this.#gridId,
				rowActionsLabel: main_core.Loc.getMessage('BPATL_A11Y_ROW_ACTIONS_LABEL'),
				checkboxesFromTitle: true
			});
			const links = container.querySelectorAll('.bp-task a, .bp-comments a, .bp-btn-panel a');
			links.forEach(link => {
				if (main_core.Dom.hasClass(link, 'bizproc-a11y-focusable')) {
					return;
				}
				// rows bind their own inline click; empty handler adds only focus-visible styling
				bizproc_a11y.makeActivatable(link, () => {});
			});
			container.querySelectorAll('.bp-short-process-step').forEach(step => {
				if (!step.getAttribute('aria-label')) {
					main_core.Dom.attr(step, 'aria-label', main_core.Loc.getMessage('BPATL_A11Y_PROCESS_FACES_LABEL'));
				}
			});
			container.querySelectorAll('img:not([alt])').forEach(image => {
				// row images are decorative document icons, adjacent text carries the meaning
				main_core.Dom.attr(image, 'alt', '');
			});
		}
		applyActionPanelValues() {
			const grid = this.getGrid();
			const actionsPanel = grid?.getActionsPanel();
			if (grid && actionsPanel) {
				const data = {
					['action_all_rows_' + this.#gridId]: actionsPanel.getForAllCheckbox()?.checked ? 'Y' : 'N',
					ACTION_DELEGATE_TO_ID: this.#delegateToUserId,
					ID: grid.getRows().getSelectedIds()
				};
				for (const [key, value] of Object.entries(actionsPanel.getValues())) {
					data[key] = main_core.Type.isString(value) ? value.trim().replace(/^['"]+|['"]+$/g, '') : value;
				}
				this.getGrid()?.reloadTable('POST', data, () => this.init());
			}
		}
		reloadGrid() {
			const grid = this.getGrid();
			if (grid) {
				grid.reload();
			}
		}
		getGrid() {
			if (this.#gridId) {
				return BX.Main.gridManager && BX.Main.gridManager.getInstanceById(this.#gridId);
			}
			return null;
		}
	}
	namespace.TaskList = TaskList;

})(BX, BX.UI.EntitySelector, BX.Bizproc.A11y);
//# sourceMappingURL=script.js.map

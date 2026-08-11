/* eslint-disable */
(function (main_core, main_core_events) {
	'use strict';

	/**
	 * @namespace BX.BIConnector
	 */
	class UsageStatGridManager {
		#gridId;
		constructor(props) {
			this.#gridId = props.gridId;
			this.#initHints();
			main_core_events.EventEmitter.subscribe('Grid::updated', () => this.#initHints());
		}
		#getGrid() {
			const manager = BX.Main.gridManager.getById(this.#gridId);
			return manager ? manager.instance : null;
		}
		#initHints() {
			const grid = this.#getGrid();
			if (!grid) {
				return;
			}
			const manager = BX.UI.Hint.createInstance({
				popupParameters: {
					autoHide: true,
					offsetLeft: 10,
					offsetTop: 6,
					maxWidth: 320
				}
			});
			manager.init(grid.getContainer());
		}

		// noinspection JSUnusedGlobalSymbols
		openElement(entityType, entityId) {
			const grid = this.#getGrid();
			grid?.tableFade();
			main_core.ajax.runAction('biconnector.usagestat.getOpenUrl', {
				data: {
					entityType,
					entityId
				}
			}).then(response => {
				const link = response.data;
				if (link) {
					window.open(link, '_blank').focus();
				}
				grid?.tableUnfade();
			}).catch(response => {
				if (response?.errors?.[0]?.message) {
					BX.UI.Notification.Center.notify({
						content: main_core.Text.encode(response.errors[0].message)
					});
				}
				grid?.tableUnfade();
			});
		}
	}
	main_core.Reflection.namespace('BX.BIConnector').UsageStatGridManager = UsageStatGridManager;

})(BX, BX.Event);
//# sourceMappingURL=script.js.map

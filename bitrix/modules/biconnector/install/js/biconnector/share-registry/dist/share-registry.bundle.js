/* eslint-disable */
this.BX = this.BX || {};
this.BX.BIConnector = this.BX.BIConnector || {};
(function (exports, main_core, main_core_events, main_sidepanel, ui_buttons, ui_hint, ui_system_dialog, ui_notification, biconnector_errorMessage, biconnector_apacheSupersetDashboardManager) {
	'use strict';

	function showDisableSummary(result, total, options) {
		const failed = result.failed ?? [];
		if (total === 1 && failed.length === 0) {
			return;
		}
		ui_notification.Center.notify({
			content: total === 1 ? main_core.Text.encode(failed[0].message) : buildSummaryHtml(failed, total, options),
			actions: failed.length > 0 ? [buildRetryAction(failed, options)] : []
		});
	}
	function buildSummaryHtml(failed, total, options) {
		const lines = [phrase('BICONNECTOR_SHARE_REGISTRY_DISABLE_SUMMARY', {
			'#DONE#': String(total - failed.length),
			'#TOTAL#': String(total)
		})];
		if (failed.length > 0) {
			lines.push(phrase('BICONNECTOR_SHARE_REGISTRY_DISABLE_SUMMARY_FAILED'), ...failed.map(failure => formatFailure(failure, options.getDashboardTitle(failure.id))));
		}
		return lines.join('<br>');
	}
	function formatFailure(failure, dashboardTitle) {
		const message = main_core.Text.encode(failure.message);
		return dashboardTitle ? `«${main_core.Text.encode(dashboardTitle)}»: ${message}` : message;
	}
	function buildRetryAction(failed, options) {
		return {
			title: phrase('BICONNECTOR_SHARE_REGISTRY_RETRY'),
			events: {
				click: (event, balloon) => {
					balloon?.close();
					options.onRetry(failed.map(failure => failure.id));
				}
			}
		};
	}
	function phrase(code, replacements) {
		return main_core.Loc.getMessage(code, replacements) ?? '';
	}

	const ACCESS_DENIED_ERROR = 'access_denied';
	const AUTHOR_FILTER_FIELD = 'AUTHOR_ID';
	const SHARE_SETTING_CHANGE_EVENT = 'BIConnector.ShareSetting:onChange';
	class GridManager {
		static Instance = null;
		#gridId;
		#hint;
		constructor(options) {
			this.#gridId = options.gridId;
			this.#hint = ui_hint.Hint.createInstance({
				popupParameters: {
					autoHide: true,
					maxWidth: 320
				}
			});
			this.#initHints();
			main_core_events.EventEmitter.subscribe('Grid::updated', this.#onGridUpdated);
			getTopEventBus().subscribe(SHARE_SETTING_CHANGE_EVENT, this.#onShareSettingChange);
			main_core.Event.bind(window, 'unload', () => this.destroy());
		}
		destroy() {
			main_core_events.EventEmitter.unsubscribe('Grid::updated', this.#onGridUpdated);
			getTopEventBus().unsubscribe(SHARE_SETTING_CHANGE_EVENT, this.#onShareSettingChange);
		}
		#onGridUpdated = event => {
			const [grid] = event.getCompatData();
			if (grid?.getId() === this.#gridId) {
				this.#initHints();
			}
		};
		#onShareSettingChange = () => {
			this.#getGrid()?.reload();
		};
		openDashboard(url) {
			window.open(url, '_blank')?.focus();
		}
		async disableShares(ids) {
			const shareIds = ids.map(id => main_core.Text.toInteger(id)).filter(id => id > 0);
			if (shareIds.length === 0) {
				return;
			}
			if (await this.#confirmDisable(shareIds)) {
				await this.#disable(shareIds);
			}
		}
		disableSelected() {
			const selectedIds = this.#getGrid()?.getRows().getSelectedIds() ?? [];
			return this.disableShares(selectedIds.map(id => main_core.Text.toInteger(id)));
		}
		openSettings(dashboardId, dashboardType) {
			biconnector_apacheSupersetDashboardManager.DashboardManager.openSettingsSlider(main_core.Text.toInteger(dashboardId), dashboardType);
		}
		toggleAuthorFilter(authorId, authorName, isActive) {
			const id = main_core.Text.toInteger(authorId);
			const filter = this.#getFilter();
			if (id <= 0 || !filter) {
				return;
			}
			if (isActive) {
				removeFilterField(filter, AUTHOR_FILTER_FIELD);
				return;
			}
			filter.getApi().extendFilter({
				[AUTHOR_FILTER_FIELD]: [String(id)],
				[`${AUTHOR_FILTER_FIELD}_label`]: [authorName]
			});
		}
		#getFilter() {
			const filterManager = main_core.Reflection.getClass('BX.Main.filterManager');
			return filterManager?.getById(this.#gridId) ?? null;
		}
		#getGrid() {
			const gridManager = main_core.Reflection.getClass('BX.Main.gridManager');
			return gridManager?.getInstanceById(this.#gridId) ?? null;
		}
		#initHints() {
			const container = this.#getGrid()?.getContainer();
			if (!container) {
				return;
			}
			this.#hint.init(container);
		}
		#confirmDisable(shareIds) {
			const content = buildConfirmContent(shareIds.length);
			return new Promise(resolve => {
				let isConfirmed = false;
				const dialog = new ui_system_dialog.Dialog({
					title: content.title,
					content: main_core.Tag.render`<div class="biconnector-share-registry-disable-popup-content">${content.html}</div>`,
					centerButtons: [createButton(phrase('BICONNECTOR_SHARE_REGISTRY_DISABLE_BUTTON'), ui_buttons.AirButtonStyle.FILLED, () => {
						isConfirmed = true;
						dialog.hide();
					}), createButton(phrase('BICONNECTOR_SHARE_REGISTRY_CANCEL'), ui_buttons.AirButtonStyle.PLAIN, () => dialog.hide())],
					hasOverlay: true,
					width: 400
				});
				dialog.subscribe('onHide', () => resolve(isConfirmed));
				dialog.show();
			});
		}
		#getCellText(shareId, columnId) {
			const cell = this.#getGrid()?.getRows().getById(shareId)?.getCellById(columnId);
			const text = cell?.textContent?.trim() ?? '';
			return main_core.Type.isStringFilled(text) ? text : null;
		}
		async #disable(shareIds) {
			const dashboardTitles = new Map(shareIds.map(id => [id, this.#getCellText(id, 'DASHBOARD')]));
			try {
				const response = await main_core.ajax.runAction('biconnector.sharecontrol.disableShares', {
					data: {
						ids: shareIds
					}
				});
				this.#getGrid()?.reload();
				showDisableSummary(response.data, shareIds.length, {
					getDashboardTitle: id => dashboardTitles.get(id) ?? null,
					onRetry: failedIds => this.#disable(failedIds)
				});
			} catch (response) {
				if (isAccessDenied(response)) {
					notifyAccessDenied(response);
					return;
				}
				ui_notification.Center.notify({
					content: biconnector_errorMessage.resolveErrorHtml(response, phrase('BICONNECTOR_SHARE_REGISTRY_DISABLE_ERROR')),
					actions: [{
						title: phrase('BICONNECTOR_SHARE_REGISTRY_RETRY'),
						events: {
							click: (event, balloon) => {
								balloon?.close();
								void this.#disable(shareIds);
							}
						}
					}]
				});
			}
		}
	}
	function removeFilterField(filter, fieldName) {
		filter.getFilterFields().filter(field => field.getAttribute('data-name') === fieldName).forEach(field => filter.getFields().deleteField(field));
		filter.getSearch().apply();
	}
	function buildConfirmContent(count) {
		if (count === 1) {
			return {
				title: phrase('BICONNECTOR_SHARE_REGISTRY_DISABLE_CONFIRM_SINGLE'),
				html: phrase('BICONNECTOR_SHARE_REGISTRY_DISABLE_CONFIRM_BAN_HINT')
			};
		}
		return {
			title: main_core.Loc.getMessagePlural('BICONNECTOR_SHARE_REGISTRY_DISABLE_CONFIRM_MANY', count, {
				'#COUNT#': String(count)
			}) ?? '',
			html: phrase('BICONNECTOR_SHARE_REGISTRY_DISABLE_CONFIRM_MANY_TEXT')
		};
	}
	function createButton(text, style, onClick) {
		const options = {
			text,
			size: ui_buttons.ButtonSize.LARGE,
			style,
			useAirDesign: true,
			onclick: () => {
				onClick();
				return {};
			}
		};
		return new ui_buttons.Button(options);
	}
	function isAccessDenied(response) {
		const errors = response?.errors;
		return main_core.Type.isArray(errors) && errors.some(error => error?.code === ACCESS_DENIED_ERROR);
	}
	function notifyAccessDenied(response) {
		ui_notification.Center.notify({
			content: biconnector_errorMessage.resolveErrorHtml(response, phrase('BICONNECTOR_SHARE_REGISTRY_DISABLE_ERROR')),
			actions: [{
				title: phrase('BICONNECTOR_SHARE_REGISTRY_RETURN_TO_BI'),
				events: {
					click: (event, balloon) => {
						balloon?.close();
						main_sidepanel.SidePanel.Instance.getSliderByWindow(window)?.close();
					}
				}
			}]
		});
	}
	function getTopEventBus() {
		return main_core.Reflection.getClass('top.BX.Event.EventEmitter') ?? main_core_events.EventEmitter;
	}

	exports.GridManager = GridManager;

})(this.BX.BIConnector.ShareRegistry = this.BX.BIConnector.ShareRegistry || {}, BX, BX.Event, BX.SidePanel, BX.UI, BX.UI, BX.UI.System, BX.UI.Notification, BX.BIConnector, BX.BIConnector);
//# sourceMappingURL=share-registry.bundle.js.map

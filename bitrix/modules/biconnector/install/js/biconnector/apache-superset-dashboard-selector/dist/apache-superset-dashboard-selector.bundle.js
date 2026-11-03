/* eslint-disable */
(function (biconnector_apacheSupersetDashboardManager, biconnector_errorMessage, main_core, main_core_events, ui_entitySelector, ui_infoHelper, ui_notification) {
	'use strict';

	class SupersetDashboardSelector {
		#dialog;
		#selectorNode;
		#textNode;
		#dashboardId;
		#marketCollectionUrl;
		#isMarketInstalled;
		#dashboardUrlParams;
		constructor(props) {
			this.#selectorNode = document.getElementById(props.containerId);
			this.#textNode = document.getElementById(props.textNodeId);
			this.#dashboardId = props.dashboardId;
			this.#marketCollectionUrl = props.marketCollectionUrl;
			this.#isMarketInstalled = props.isMarketInstalled;
			this.#dashboardUrlParams = props.dashboardUrlParams;
			this.#initDialog(this.#selectorNode);
			if (this.#selectorNode) {
				main_core.Event.bind(this.#selectorNode, 'click', this.#handleSearchClick.bind(this));
				main_core_events.EventEmitter.subscribe('BIConnector.DashboardManager:onCopyDashboard', this.#handleCopyDashboard.bind(this));
			}
		}
		#initDialog(node) {
			if (this.#dialog) {
				return this.#dialog;
			}
			this.#dialog = new ui_entitySelector.Dialog({
				id: 'biconnector-superset-dashboard',
				multiple: false,
				targetNode: node,
				offsetTop: 14,
				context: 'biconnector-superset-dashboard',
				entities: [{
					id: 'biconnector-superset-dashboard',
					dynamicLoad: true,
					dynamicSearch: true
				}],
				enableSearch: true,
				dropdownMode: true,
				showAvatars: true,
				compactView: false,
				dynamicLoad: true,
				clearUnavailableItems: true,
				preselectedItems: [['biconnector-superset-dashboard', this.#dashboardId]],
				events: {
					'Item:onSelect': this.#onSelectItem.bind(this),
					'Item:onBeforeSelect': event => {
						if (!event.data.item.getCustomData().get('isAvailable')) {
							event.preventDefault();
							this.#openTariffSlider();
						}
					}
				}
			});
			return this.#dialog;
		}
		#onSelectItem(event) {
			main_core_events.EventEmitter.emit('BiConnector:DashboardSelector.onSelect');
			const item = event.data.item;
			this.#setTitle(item.getTitle());
			return this.#installDashboard(item).then(() => this.#getDashboardEmbeddedData(item.id)).then(response => {
				if (response.data.dashboard) {
					if (!response.data.dashboard.isAvailable) {
						this.#openTariffSlider();
						return response;
					}
					this.#setTitle(response.data.dashboard.title);
					main_core_events.EventEmitter.emit('BiConnector:DashboardSelector.onSelectDataLoaded', {
						item,
						dashboardId: item.id,
						credentials: response.data.dashboard
					});
				}
				return response;
			}).catch(response => {
				ui_notification.Center.notify({
					content: biconnector_errorMessage.resolveErrorHtml(response, main_core.Loc.getMessage('BICONNECTOR_DASHBOARD_SELECTOR_LOAD_ERROR'))
				});
				throw response;
			});
		}
		#installDashboard(item) {
			return new Promise((resolve, reject) => {
				const status = item.getCustomData().get('status');
				if (status === 'N') {
					biconnector_apacheSupersetDashboardManager.DashboardManager.installDashboard(item.id).then(response => resolve(response)).catch(error => reject(error));
					return;
				}
				resolve();
			});
		}
		#getDashboardEmbeddedData(dashboardId) {
			return BX.ajax.runAction('biconnector.dashboard.getDashboardEmbeddedData', {
				data: {
					id: dashboardId,
					urlParams: this.#dashboardUrlParams
				}
			});
		}
		#handleSearchClick() {
			this.#dialog.show();
		}
		#setTitle(text) {
			const title = main_core.Text.encode(text);
			this.#textNode.innerHTML = title;
			this.#textNode.title = title;
			document.title = title;
		}
		#handleCopyDashboard(event) {
			const dashboard = event.data.dashboard;
			return new Promise(resolve => {
				this.#setTitle(dashboard.title);
				this.#dialog = null;
				this.#dashboardId = dashboard.id;
				this.#initDialog(this.#selectorNode);
				main_core_events.EventEmitter.emit('BiConnector:DashboardSelector.onSelectDataLoaded', {
					item: dashboard,
					dashboardId: dashboard.id,
					credentials: dashboard
				});
				resolve();
			});
		}
		#openTariffSlider() {
			new ui_infoHelper.FeaturePromoter({
				code: 'limit_benefit_market_active'
			}).show();
		}
	}
	main_core.Reflection.namespace('BX.BIConnector').SupersetDashboardSelector = SupersetDashboardSelector;

})(BX.BIConnector, BX.BIConnector, BX, BX.Event, BX.UI.EntitySelector, BX.UI, BX.UI.Notification);

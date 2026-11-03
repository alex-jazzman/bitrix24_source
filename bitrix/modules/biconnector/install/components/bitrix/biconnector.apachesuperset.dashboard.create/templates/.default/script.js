/* eslint-disable */
(function (main_core, main_core_events, biconnector_dashboardParametersSelector, biconnector_apacheSupersetAnalytics, biconnector_errorMessage, ui_buttons) {
	'use strict';

	/**
	 * @namespace BX.BIConnector
	 */
	class SupersetDashboardCreateManager {
		#props;
		#node;
		#paramsSelector;
		#saveButton;
		constructor(props) {
			this.#props = props;
			this.#node = document.querySelector(`#${this.#props.nodeId}`);
			this.#render();
			this.#saveButton = ui_buttons.ButtonManager.createFromNode(document.querySelector('#dashboard-button-save'));
			this.#saveButton.setDisabled(true);
			main_core_events.EventEmitter.subscribe('BIConnector.DashboardParamsSelector:initCompleted', this.#onParamSelectorInit.bind(this));
			main_core_events.EventEmitter.subscribe('BIConnector.DashboardParamsSelector:onChange', this.#onSelectorChange.bind(this));
		}
		#render() {
			main_core.Dom.append(this.#getTopBlock(), this.#node);
			main_core.Dom.append(this.#getMainContent(), this.#node);
			this.#paramsSelector = new biconnector_dashboardParametersSelector.DashboardParametersSelector({
				groups: new Set(),
				scopes: new Set(),
				params: new Set(),
				paramList: this.#props.paramList,
				activeUrlParamsSelector: this.#props.activeUrlParamsSelector,
				isNewDashboard: true,
				requiredParamList: this.#props.requiredParamList,
				isNew: true
			});
			main_core.Dom.append(this.#paramsSelector.getLayout(), this.#node);
		}
		#getMainContent() {
			return main_core.Tag.render`
			<div>
				<div class="dashboard-params-title-container">
					<div class="dashboard-params-title">
						${main_core.Loc.getMessage('DASHBOARD_CREATE_NAME')}
					</div>
				</div>
				<div class="ui-ctl ui-ctl-textbox ui-ctl-w100 dashboard-title-wrapper">
					<input type="text" class="ui-ctl-element" id="dashboard-title-field" value="${this.#props.defaultValues.title}">
				</div>
			</div>
		`;
		}
		#getTopBlock() {
			return main_core.Tag.render`
			<div class="dashboard-create-top-block">
				<div class="dashboard-create-top-block-image"></div>
				<div class="dashboard-create-top-block-text">
					${main_core.Loc.getMessage('DASHBOARD_CREATE_TOP_BLOCK')}
				</div>
			</div>
		`;
		}
		#onParamSelectorInit() {
			this.#paramsSelector.selectGroups(this.#props.groupIds);
			const isDisabled = this.#props.groupIds.length <= 0;
			this.#saveButton.setDisabled(isDisabled);
		}
		#onSelectorChange() {
			const selectorData = this.#paramsSelector.getValues();
			const isDisabled = (selectorData?.groups?.size ?? 0) <= 0;
			this.#saveButton.setDisabled(isDisabled);
		}

		// noinspection JSUnusedGlobalSymbols
		onClickSave() {
			const titleField = document.querySelector('#dashboard-title-field');
			const saveData = {
				title: titleField.value
			};
			const selectorData = this.#paramsSelector.getValues();
			saveData.groups = [...selectorData.groups];
			saveData.scopes = [...selectorData.scopes];
			saveData.params = [...selectorData.params];
			this.#saveButton.setWaiting(true);
			main_core.ajax.runComponentAction(this.#props.componentName, 'save', {
				mode: 'class',
				signedParameters: this.#props.signedParameters,
				data: {
					data: saveData
				}
			}).then(response => {
				biconnector_apacheSupersetAnalytics.ApacheSupersetAnalytics.sendAnalytics('new', 'report_new', {
					type: 'custom',
					c_element: 'new_button'
				});
				window.open(response.data.dashboard.detailUrl, '_blank')?.focus();
				parent.BX.Event.EventEmitter.emit('BIConnector.CreateForm:onDashboardCreated', {
					dashboard: response.data.dashboard
				});
				BX.SidePanel.Instance.getTopSlider().close();
			}).catch(response => {
				BX.UI.Notification.Center.notify({
					content: biconnector_errorMessage.resolveErrorHtml(response, main_core.Loc.getMessage('DASHBOARD_CREATE_SAVE_ERROR'))
				});
				this.#saveButton.setWaiting(false);
			});
		}
	}
	main_core.Reflection.namespace('BX.BIConnector').SupersetDashboardCreateManager = SupersetDashboardCreateManager;

})(BX, BX.Event, BX.BIConnector, BX.BIConnector, BX.BIConnector, BX.UI);
//# sourceMappingURL=script.js.map

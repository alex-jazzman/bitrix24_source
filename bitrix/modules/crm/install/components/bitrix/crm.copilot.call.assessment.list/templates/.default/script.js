/* eslint-disable */
(function (exports, main_core, ui_sidepanel, ui_dialogs_messagebox, ui_notification, main_core_events, ui_progressround) {
	'use strict';

	const namespace$3 = main_core.Reflection.namespace('BX.Crm.Copilot.CallAssessmentList');
	class ActionButton {
		#isActive;
		constructor(isActiveCopilot = true) {
			this.#isActive = isActiveCopilot;
		}
		execute() {
			if (this.#isActive) {
				if (!ui_sidepanel.SidePanel.Instance) {
					console.error('SidePanel.Instance not found');
					return;
				}
				ui_sidepanel.SidePanel.Instance.open(`/crm/copilot-call-assessment/details/0/`, {
					cacheable: false,
					width: 700,
					allowChangeHistory: false
				});
				return;
			}
			top.BX.UI?.InfoHelper?.show('limit_v2_crm_copilot_call_assessment_off');
		}
	}
	namespace$3.ActionButton = ActionButton;

	const namespace$2 = main_core.Reflection.namespace('BX.Crm.Copilot.CallAssessmentList');
	class ActiveField {
		#id;
		#targetNode;
		#checked;
		#readOnly;
		constructor({
			id,
			targetNodeId,
			checked,
			readOnly
		}) {
			this.#id = id;
			this.#targetNode = document.getElementById(targetNodeId);
			this.#checked = checked;
			this.#readOnly = readOnly;
		}
		init() {
			void main_core.Runtime.loadExtension('ui.switcher').then(exports$1 => {
				const {
					Switcher
				} = exports$1;
				this.switcher = new Switcher({
					checked: this.#checked,
					disabled: this.#readOnly,
					handlers: {
						checked: event => {
							event.stopPropagation();
							const popupContainer = main_core.Tag.render`
							<div class="crm-copilot-call-assessment-list-confirm-container">
								<div class="crm-copilot-call-assessment-list-confirm-title">
									${main_core.Loc.getMessage('CRM_COPILOT_CALL_ASSESSMENT_LIST_COLUMN_ACTIVITY_CONFIRM_DIALOG_TITLE')}
								</div>
								<div class="crm-copilot-call-assessment-list-confirm-message"></div>
							</div>
						`;
							ui_dialogs_messagebox.MessageBox.show({
								modal: true,
								minHeight: 100,
								minWidth: 400,
								popupOptions: {
									content: popupContainer,
									closeIcon: false
								},
								buttons: ui_dialogs_messagebox.MessageBoxButtons.OK_CANCEL,
								okCaption: main_core.Loc.getMessage('CRM_COPILOT_CALL_ASSESSMENT_LIST_COLUMN_ACTIVITY_CONFIRM_DIALOG_OK_BTN'),
								onOk: messageBox => {
									messageBox.close();
									this.#changeCallAssessmentActive(false);
								},
								onCancel: messageBox => {
									this.switcher.check(true, false);
									messageBox.close();
								}
							});
						},
						unchecked: event => {
							event.stopPropagation();
							this.#changeCallAssessmentActive(true);
						}
					}
				});
				main_core.Dom.clean(this.#targetNode);
				this.switcher.renderTo(this.#targetNode);
			});
		}
		#changeCallAssessmentActive(isEnabled) {
			main_core.Runtime.throttle(() => {
				main_core.ajax.runAction('crm.copilot.callassessment.active', {
					data: {
						id: this.#id,
						isEnabled: isEnabled ? 'Y' : 'N'
					}
				}).catch(response => {
					ui_notification.UI.Notification.Center.notify({
						content: main_core.Text.encode(response.errors[0].message),
						autoHideDelay: 6000
					});
					throw response;
				});
			}, 100)();
		}
	}
	namespace$2.ActiveField = ActiveField;

	const namespace$1 = main_core.Reflection.namespace('BX.Crm.Copilot.CallAssessmentList');
	class Grid {
		#grid = null;
		#reloadGridTimeoutId = null;
		constructor(gridId) {
			this.#grid = BX.Main.gridManager.getInstanceById(gridId);
		}
		init() {
			this.#bindEvents();
		}
		#bindEvents() {
			main_core_events.EventEmitter.subscribe('BX.Crm.Copilot.CallAssessment:onClickDelete', this.#handleItemDelete.bind(this));
		}
		#handleItemDelete(event) {
			const id = main_core.Text.toInteger(event.data.id);
			if (!id) {
				this.#showError(main_core.Loc.getMessage('CRM_COPILOT_CALL_ASSESSMENT_LIST_NOT_FOUND_MSGVER_1'));
				return;
			}
			ui_dialogs_messagebox.MessageBox.show({
				title: main_core.Loc.getMessage('CRM_TYPE_ITEM_DELETE_CONFIRMATION_TITLE'),
				message: main_core.Loc.getMessage('CRM_TYPE_ITEM_DELETE_CONFIRMATION_MESSAGE'),
				modal: true,
				buttons: ui_dialogs_messagebox.MessageBoxButtons.YES_CANCEL,
				onYes: messageBox => {
					main_core.ajax.runAction('crm.controller.copilot.callassessment.delete', {
						data: {
							id
						}
					}).then(response => {
						ui_notification.UI.Notification.Center.notify({
							content: main_core.Loc.getMessage('CRM_TYPE_ITEM_DELETE_NOTIFICATION')
						});
						this.#reloadGridAfterTimeout();
					}).catch(({
						errors
					}) => {
						this.#showError(errors[0]?.message ?? main_core.Loc.getMessage('CRM_COPILOT_CALL_ASSESSMENT_LIST_ITEM_DELETE_ERROR'));
					});
					messageBox.close();
				}
			});
		}
		#showError(message) {
			ui_notification.UI.Notification.Center.notify({
				content: main_core.Text.encode(message),
				autoHideDelay: 6000
			});
		}
		#reloadGridAfterTimeout() {
			if (!this.#grid) {
				return;
			}
			if (this.#reloadGridTimeoutId > 0) {
				clearTimeout(this.#reloadGridTimeoutId);
				this.#reloadGridTimeoutId = 0;
			}
			this.#reloadGridTimeoutId = setTimeout(() => {
				this.#grid.reload();
			}, 1000);
		}
	}
	namespace$1.Grid = Grid;

	const namespace = main_core.Reflection.namespace('BX.Crm.Copilot.CallAssessmentList');
	const DEFAULT_BORDER = 'default';
	const LOW_BORDER = 'lowBorder';
	const HIGH_BORDER = 'highBorder';
	class RoundChartField {
		#id;
		#targetNode;
		#borders;
		#value;
		#valueContainer;
		constructor({
			id,
			targetNodeId,
			borders,
			value
		}) {
			this.#id = id;
			this.#targetNode = document.getElementById(targetNodeId);
			this.#borders = borders ?? null;
			this.#value = value;
		}
		init() {
			if (this.#value === null) {
				return;
			}
			this.#valueContainer = main_core.Tag.render`<div></div>`;
			const content = main_core.Tag.render`
			<div class="crm-copilot-call-assessment-list-assessment-avg">
				${this.#valueContainer}
				<div class="crm-copilot-call-assessment-list-assessment-avg-value">
					${this.#value}
					<span class="crm-copilot-call-assessment-list-assessment-avg-percent">%</span>
				</div>
			</div>
		`;
			main_core.Dom.append(content, this.#targetNode);
			const loader = new ui_progressround.ProgressRound({
				width: 28,
				lineSize: 8,
				colorBar: this.#getTrackColor(),
				colorTrack: '#EBF1F6',
				rotation: false,
				value: this.#value,
				color: ui_progressround.ProgressRound.Color.SUCCESS
			});
			loader.renderTo(this.#valueContainer);
			this.#bindEvents(content);
		}
		#bindEvents(target) {
			main_core.Event.bind(target, 'mouseenter', this.#showTooltip.bind(this));
			main_core.Event.bind(target, 'mouseleave', this.#hideTooltip.bind(this));
		}
		#getTrackColor() {
			const highBorder = this.#getBorderById(HIGH_BORDER);
			if (highBorder && this.#value >= highBorder?.value) {
				return highBorder.color;
			}
			const lowBorder = this.#getBorderById(LOW_BORDER);
			if (lowBorder && this.#value <= lowBorder?.value) {
				return lowBorder.color;
			}
			const defaultBorder = this.#getBorderById(DEFAULT_BORDER);
			if (defaultBorder) {
				return defaultBorder.color;
			}
			throw new RangeError('unknown track color');
		}
		#getBorderById(id) {
			return this.#borders.find(border => {
				return border.id === id;
			}) ?? null;
		}
		#showTooltip(event) {
			const lowBorder = this.#getBorderById(LOW_BORDER);
			const highBorder = this.#getBorderById(HIGH_BORDER);
			BX.UI.Hint.show(event.target, main_core.Loc.getMessage('CRM_COPILOT_CALL_ASSESSMENT_LIST_COLUMN_ASSESSMENT_AVG_TOOLTIP', {
				'#LOW_BORDER#': lowBorder.value,
				'#HIGH_BORDER#': highBorder.value
			}), true);
		}
		#hideTooltip(event) {
			BX.UI.Hint.hide(event.target);
		}
	}
	namespace.RoundChartField = RoundChartField;

	exports.ActionButton = ActionButton;
	exports.ActiveField = ActiveField;
	exports.Grid = Grid;
	exports.RoundChartField = RoundChartField;

})(this.window = this.window || {}, BX, BX, BX.UI.Dialogs, BX, BX.Event, BX.UI);
//# sourceMappingURL=script.js.map

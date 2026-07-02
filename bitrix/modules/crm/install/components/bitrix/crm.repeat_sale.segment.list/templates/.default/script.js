/* eslint-disable */
(function (exports, main_core, ui_dialogs_messagebox, ui_notification, ui_progressround) {
	'use strict';

	const namespace$1 = main_core.Reflection.namespace('BX.Crm.RepeatSale.SegmentList');
	class ActiveField {
		#id;
		#targetNode;
		#checked;
		#readOnly;
		#isFlowDisabled;
		constructor({
			id,
			targetNodeId,
			checked,
			readOnly,
			isFlowDisabled
		}) {
			this.#id = id;
			this.#targetNode = document.getElementById(targetNodeId);
			this.#checked = checked;
			this.#readOnly = readOnly;
			this.#isFlowDisabled = isFlowDisabled;
		}
		init() {
			void main_core.Runtime.loadExtension('ui.switcher').then(exports$1 => {
				const {
					Switcher
				} = exports$1;
				const switcher = new Switcher({
					checked: this.#checked,
					disabled: this.#readOnly,
					handlers: {
						checked: event => {
							event.stopPropagation();
							this.#showMessageBox(() => {
								this.#changeRepeatSaleSegmentActive(false);
							}, () => {
								switcher.check(true, false);
							});
						},
						unchecked: event => {
							event.stopPropagation();
							if (this.#isFlowDisabled) {
								this.#showAllFlowEnableMessageBox(() => {
									this.#changeRepeatSaleSegmentActive(true);
									this.#isFlowDisabled = false;
								}, () => {
									switcher.check(false, false);
								});
							} else {
								this.#changeRepeatSaleSegmentActive(true);
							}
						}
					}
				});
				main_core.Dom.clean(this.#targetNode);
				switcher.renderTo(this.#targetNode);
			});
		}
		#showMessageBox(onOk, onCancel) {
			const popupContainer = main_core.Tag.render`
			<div class="crm-repeat-sale-segment-list-confirm-container">
				<div class="crm-repeat-sale-segment-list-confirm-message">
					${main_core.Loc.getMessage('CRM_REPEAT_SALE_SEGMENT_LIST_COLUMN_IS_ENABLED_CONFIRM_DIALOG_MESSAGE')}
				</div>
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
				okCaption: main_core.Loc.getMessage('CRM_REPEAT_SALE_SEGMENT_LIST_COLUMN_IS_ENABLED_CONFIRM_DIALOG_OK_BTN'),
				onOk: messageBox => {
					messageBox.close();
					onOk();
				},
				onCancel: messageBox => {
					onCancel();
					messageBox.close();
				}
			});
		}
		#showAllFlowEnableMessageBox(onOk, onCancel) {
			const popupContainer = main_core.Tag.render`
			<div class="crm-repeat-sale-segment-list-confirm-container">
				<div class="crm-repeat-sale-segment-list-confirm-message">
					${main_core.Loc.getMessage('CRM_REPEAT_SALE_SEGMENT_LIST_COLUMN_IS_ENABLED_RS_CONFIRM_DIALOG_MESSAGE')}
				</div>
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
				okCaption: main_core.Loc.getMessage('CRM_REPEAT_SALE_SEGMENT_LIST_COLUMN_IS_ENABLED_RS_CONFIRM_DIALOG_OK_BTN'),
				onOk: messageBox => {
					messageBox.close();
					onOk();
				},
				onCancel: messageBox => {
					onCancel();
					messageBox.close();
				}
			});
		}
		#changeRepeatSaleSegmentActive(isEnabled) {
			main_core.Runtime.throttle(() => {
				main_core.ajax.runAction('crm.repeatsale.segment.active', {
					json: {
						id: this.#id,
						isEnabled: isEnabled ? 'Y' : 'N'
					},
					analyticsLabel: {
						tool: 'crm',
						category: 'editor',
						event: 'scenario_enable',
						c_element: `${isEnabled ? 'on' : 'off'}`
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
	namespace$1.ActiveField = ActiveField;

	const namespace = main_core.Reflection.namespace('BX.Crm.RepeatSale.SegmentList');
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
			<div class="crm-repeat-sale-segment-list-client-percent">
				${this.#valueContainer}
				<div class="crm-repeat-sale-segment-list-client-percent-value">
					${this.#value}
					<span class="crm-repeat-sale-segment-list-client-percent-percent">%</span>
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
	}
	namespace.RoundChartField = RoundChartField;

	exports.ActiveField = ActiveField;
	exports.RoundChartField = RoundChartField;

})(this.window = this.window || {}, BX, BX.UI.Dialogs, BX, BX.UI);
//# sourceMappingURL=script.js.map

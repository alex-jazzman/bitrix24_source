/* eslint-disable */
this.BX = this.BX || {};
this.BX.Bizproc = this.BX.Bizproc || {};
(function (exports, main_core, main_core_events, ui_buttons, bizproc_task, ui_dialogs_messagebox) {
	'use strict';

	class ValidateHelper {
		static #NEED_PATTERN = new Set(['S:HTML', 'email', 'phone', 'web', 'im', 'E:EList']);
		static #MULTIPLE_WITH_NO_BRACKETS = new Set([...ValidateHelper.#NEED_PATTERN, 'user', 'S:employee', 'sms_sender', 'mail_sender']);
		static checkRequiredFieldsFilled(formData, requiredFields) {
			const errors = [];
			for (const requiredField of requiredFields) {
				const fieldId = this.#getFieldId(requiredField);
				const values = this.#getFieldValues(formData, requiredField, fieldId);
				if (!main_core.Type.isArrayFilled(values)) {
					const originalFieldId = requiredField.FieldId ?? requiredField.Id;
					if (!formData.keys().every(key => !key.includes(originalFieldId))) {
						continue;
					}
				}
				if (this.#isFieldEmpty(requiredField, values)) {
					errors.push({
						message: main_core.Loc.getMessage('BPWFI_SLIDER_ARGUMENT_NULL', {
							'#PARAM#': requiredField.Name
						}),
						fieldId: requiredField.Id
					});
				}
			}
			return errors;
		}
		static #getFieldId(field) {
			let fieldId = main_core.Type.isNil(field.FieldId) ? field.Id : field.FieldId;
			if (field.Multiple || field.Type === 'S:DiskFile') {
				fieldId = ValidateHelper.#MULTIPLE_WITH_NO_BRACKETS.has(field.Type) ? fieldId : `${fieldId}[]`;
			}
			return fieldId;
		}
		static #getFieldValues(formData, field, fieldId) {
			return ValidateHelper.#NEED_PATTERN.has(field.Type) ? this.#getPatternValues(formData, this.#getPattern(field, fieldId)) : formData.getAll(fieldId);
		}
		static #isFieldEmpty(field, values) {
			if (field.Multiple || field.Type === 'S:DiskFile' || ValidateHelper.#NEED_PATTERN.has(field.Type)) {
				return !main_core.Type.isArrayFilled(values) || values.every(value => this.#isValueEmpty(field, value));
			}
			return this.#isValueEmpty(field, values[0]);
		}
		static #isValueEmpty(field, value) {
			if (field.Type === 'file') {
				return main_core.Type.isFile(value) && value.name === '';
			}
			return !main_core.Type.isStringFilled(value);
		}
		static #getPattern(field, fieldId) {
			if (field.Type === 'S:HTML') {
				return field.Multiple ? `${fieldId}\\[n\\d+\\]\\[TEXT\\]` : `${fieldId}\\[TEXT\\]`;
			}
			if (field.Type === 'E:EList') {
				return field.Multiple ? `${fieldId}\\[[n]?\\d+\\]\\[VALUE\\]` : `^${fieldId}$`;
			}
			if (field.Type === 'email' || field.Type === 'phone' || field.Type === 'web' || field.Type === 'im') {
				return `${fieldId}\\[${field.Type.toUpperCase()}\\]\\[n\\d+\\]\\[VALUE\\]`;
			}
			return '';
		}
		static #getPatternValues(formData, pattern) {
			const values = [];
			for (const [key, value] of formData.entries()) {
				if (new RegExp(pattern).test(key)) {
					values.push(value);
				}
			}
			return values;
		}
	}

	function doTaskAction(data, slider, isLast) {
		BX.SidePanel.Instance.postMessage(window, 'try-do-bp-task-event', {
			workflowId: data.get('workflowId')
		});
		return new Promise((resolve, reject) => {
			main_core.ajax.runAction('bizproc.task.do', {
				data
			}).then(response => {
				if (isLast) {
					BX.SidePanel.Instance.postMessage(slider, 'success-do-bp-task-event', {
						taskName: data.get('taskName')
					});
				}
				resolve(response);
			}).catch(response => {
				BX.SidePanel.Instance.postMessage(slider, 'error-do-bp-task-event', {
					workflowId: data.get('workflowId')
				});
				reject(response);
			});
		});
	}

	class WorkflowInfo {
		#isChanged = false;
		#messageBox;
		#canClose = false;
		#workflowResult = null;
		commentRequired = 'N';
		#canUseHumanResources;
		#uiButtons = [];
		constructor(options) {
			this.currentUserId = options.currentUserId;
			this.workflowId = options.workflowId;
			this.taskId = options.taskId;
			this.taskUserId = options.taskUserId;
			this.taskButtons = options.taskButtons;
			this.taskForm = options.taskForm;
			this.taskFields = options.taskFields;
			this.taskName = options.taskName;
			this.buttonsPanel = options.buttonsPanel;
			this.workflowContent = options.workflowContent;
			this.canDelegateTask = options.canDelegateTask;
			this.fastClose = options.fastClose && !this.#hasFileFields();
			this.saveVariables = options.saveVariables;
			this.commentRequired = options.commentRequired;
			this.#canUseHumanResources = main_core.Text.toBoolean(options.canUseHumanResources);
			this.handleMarkAsRead = main_core.Runtime.debounce(this.#sendMarkAsRead, 100, this);
			this.#workflowResult = main_core.Type.isNil(options.workflowResult) ? null : options.workflowResult;
		}
		init() {
			if (this.buttonsPanel) {
				this.#renderButtons();
			}
			this.handleMarkAsRead();
			main_core_events.EventEmitter.subscribe('OnUCCommentWasRead', event => {
				const [xmlId] = event.getData();
				if (xmlId === `WF_${this.workflowId}`) {
					this.handleMarkAsRead();
				}
			});
			if (this.taskForm) {
				main_core.Event.bind(this.taskForm, 'change', () => {
					this.#isChanged = true;
				});
				main_core.Event.bind(this.taskForm, 'input', event => {
					const target = event.target;
					if (target.matches('input, textarea, select')) {
						const formRow = target.closest('.ui-form-content');
						if (formRow) {
							this.#clearError(formRow);
						}
					}
					this.#isChanged = true;
				});
				this.taskForm.querySelectorAll('.ui-form-content').forEach(row => {
					main_core.Event.bind(row, 'click', event => {
						const target = event.currentTarget;
						this.#clearError(target);
					});
				});
				main_core_events.EventEmitter.subscribe('BX.UI.Selector:onChange', event => {
					const box = BX(`crm-${event.data[0].selectorId}-box`);
					const formRow = box.closest('.ui-form-content');
					if (formRow) {
						this.#clearError(formRow);
						this.#isChanged = true;
					}
				});
				main_core_events.EventEmitter.subscribe('BX.UI.EntitySelector.Dialog:Item:onSelect', event => {
					if (event.target.context === 'BIZPROC') {
						this.#isChanged = true;
					}
				});
				main_core_events.EventEmitter.subscribe('BX.UI.EntitySelector.Dialog:Item:onDeselect', event => {
					if (event.target.context === 'BIZPROC') {
						this.#isChanged = true;
					}
				});
				main_core_events.EventEmitter.subscribe('OnIframeKeyup', event => {
					const box = event.target.dom.cont;
					const formRow = box.closest('.ui-form-content');
					if (formRow) {
						this.#clearError(formRow);
					}
				});
				main_core_events.EventEmitter.subscribe('OnContentChanged', event => {
					if (event.target.dom.cont.closest('.ui-form-content')) {
						this.#isChanged = true;
					}
				});
				main_core_events.EventEmitter.subscribe('BX.Disk.Uploader.Integration:Item:onAdd', event => {
					if (event.target.getUploader().getHiddenFieldsContainer().closest('.ui-form-content')) {
						this.#isChanged = true;
					}
				});
				main_core_events.EventEmitter.subscribe('BX.Disk.Uploader.Integration:Item:onRemove', event => {
					if (event.target.getUploader().getHiddenFieldsContainer().closest('.ui-form-content')) {
						this.#isChanged = true;
					}
				});
				main_core_events.EventEmitter.subscribe('SidePanel.Slider:onClose', event => {
					if (event.getTarget().getWindow() === window && this.#isChanged && !this.#canClose) {
						event.getCompatData()[0].denyAction();
						if (!this.#messageBox?.getPopupWindow().isShown()) {
							this.#showConfirmDialog();
						}
					}
				});
			}
			const desc = this.workflowContent.querySelector('.bp-workflow-info__desc-inner');
			if (desc) {
				BX.UI.Hint.init(desc);
			}
			const resultNode = this.workflowContent.querySelector('[data-role="bp-workflow-result"]');
			if (resultNode && this.#workflowResult) {
				main_core.Runtime.loadExtension('bizproc.workflow.result').then(exports$1 => {
					if (exports$1?.WorkflowResult) {
						new exports$1.WorkflowResult(this.#workflowResult).renderTo(resultNode);
					}
				}).catch(() => {});
			}
		}
		#renderButtons() {
			this.#uiButtons = [];
			if (this.taskButtons) {
				main_core.Dom.clean(this.buttonsPanel);
				this.taskButtons.forEach(taskButton => {
					const targetStatus = new bizproc_task.UserStatus(taskButton.TARGET_USER_STATUS);
					const isDecline = targetStatus.isNo() || targetStatus.isCancel();
					const button = new ui_buttons.Button({
						color: isDecline ? ui_buttons.ButtonColor.LIGHT_BORDER : ui_buttons.ButtonColor.SUCCESS,
						// icon: isDecline ? ButtonIcon.CANCEL : ButtonIcon.DONE,
						round: true,
						size: ui_buttons.ButtonSize.MEDIUM,
						// noCaps: true,
						text: taskButton.TEXT,
						onclick: btn => this.#handleTaskButtonClick(taskButton, btn)
					});
					main_core.Dom.style(button.getContainer(), 'minWidth', '160px');
					main_core.Dom.style(button.getContainer(), 'maxWidth', '200px');
					main_core.Dom.attr(button.getContainer(), 'title', taskButton.TEXT);
					main_core.Dom.append(button.getContainer(), this.buttonsPanel);
					this.#uiButtons.push(button);
				});
			}
			if (this.canDelegateTask) {
				const button = new ui_buttons.Button({
					color: ui_buttons.ButtonColor.LINK,
					size: ui_buttons.ButtonSize.MEDIUM,
					// noCaps: true,
					text: main_core.Loc.getMessage('BPWFI_SLIDER_BUTTON_DELEGATE'),
					onclick: btn => this.#handleDelegateButtonClick(btn)
				});
				main_core.Dom.style(button.getContainer(), 'minWidth', '160px');
				main_core.Dom.style(button.getContainer(), 'maxWidth', '200px');
				main_core.Dom.append(button.getContainer(), this.buttonsPanel);
				this.#uiButtons.push(button);
			}
		}
		#setButtonsBusy(busy, clocking = null) {
			this.#uiButtons.forEach(button => {
				if (button === clocking) {
					button.setClocking(busy);
				} else {
					button.setDisabled(busy);
				}
			});
		}
		#handleTaskButtonClick(taskButton, uiButton) {
			const formData = new FormData(this.taskForm);
			const errors = ValidateHelper.checkRequiredFieldsFilled(formData, this.#getRequiredFields(taskButton.NAME));
			if (main_core.Type.isArrayFilled(errors)) {
				this.#showErrors(errors);
				return;
			}
			formData.append('taskId', this.taskId);
			formData.append('workflowId', this.workflowId);
			formData.append('taskName', this.taskName);
			formData.append(taskButton.NAME, taskButton.VALUE);
			const slider = BX.SidePanel.Instance.getSliderByWindow(window);
			this.#setButtonsBusy(true, uiButton);
			if (this.fastClose) {
				this.#canClose = true;
				slider?.close();
				slider.setCacheable(true);
			}
			doTaskAction(formData, slider, this.fastClose).then(() => {
				slider?.setCacheable(false);
				main_core.Dom.addClass(this.workflowContent, 'fade-out');
				this.#getNextTaskOrClose(formData);
			}).catch(response => {
				this.#setButtonsBusy(false, uiButton);
				this.#showErrors(this.#prepareErrors(response.errors));
			});
		}
		#isNeedValidate(buttonName) {
			return !(this.#isCanceled(buttonName) && !this.saveVariables);
		}
		#isCanceled(buttonName) {
			return buttonName === 'cancel' || buttonName === 'nonapprove';
		}
		#hasFileFields() {
			return main_core.Type.isArrayFilled(this.taskFields) && this.taskFields.some(field => field.Type === 'file');
		}
		#getRequiredFields(buttonName) {
			if (main_core.Type.isNil(this.taskFields)) {
				return [];
			}
			const fields = this.#isNeedValidate(buttonName) ? this.taskFields.filter(field => field.Required) : [];
			if (this.commentRequired === 'YA' && !this.#isCanceled(buttonName) || this.commentRequired === 'YR' && this.#isCanceled(buttonName)) {
				const comment = this.taskFields.find(field => field.Id === 'task_comment');
				if (comment) {
					fields.push(comment);
				}
			}
			return fields;
		}
		#getNextTaskOrClose(formData) {
			main_core.ajax.runAction('bizproc.task.getUserTaskByWorkflowId', {
				data: formData
			}).then(res => {
				if (BX.type.isArray(res.data.additionalParams) && res.data.additionalParams.length === 0) {
					this.#canClose = true;
					BX.SidePanel.Instance.getSliderByWindow(window)?.close();
				} else {
					this.#renderNextTask(res.data);
				}
			}).catch(response => {
				main_core.Dom.toggleClass(this.workflowContent, 'fade-out fade-in');
				ui_dialogs_messagebox.MessageBox.alert(response.errors.pop().message);
			});
		}
		#prepareErrors(responseErrors) {
			const errors = [];
			for (const error of responseErrors) {
				errors.push({
					fieldId: error.customData ?? null,
					message: error.message
				});
			}
			return errors;
		}
		#handleDelegateButtonClick(uiButton) {
			uiButton.setDisabled(true);
			main_core.Runtime.loadExtension('ui.entity-selector').then(exports$1 => {
				const {
					Dialog
				} = exports$1;
				uiButton.setDisabled(false);
				const dialog = new Dialog({
					targetNode: uiButton.getContainer(),
					context: 'bp-task-delegation',
					entities: [{
						id: 'user',
						options: {
							intranetUsersOnly: true,
							emailUsers: false,
							inviteEmployeeLink: false,
							inviteGuestLink: false
						}
					}, {
						id: this.#canUseHumanResources ? 'structure-node' : 'department',
						options: {
							selectMode: 'usersOnly'
						}
					}],
					popupOptions: {
						bindOptions: {
							forceBindPosition: true
						}
					},
					enableSearch: true,
					events: {
						'Item:onSelect': event => {
							const item = event.getData().item;
							this.#delegateTask(item.getId());
						},
						onHide: event => {
							event.getTarget().destroy();
						}
					},
					hideOnSelect: true,
					offsetTop: 3,
					clearUnavailableItems: true,
					multiple: false
				});
				dialog.show();
			}).catch(e => {
				console.error(e);
				uiButton.setDisabled(false);
			});
		}
		#delegateTask(toUserId) {
			const actionData = {
				taskIds: [this.taskId],
				fromUserId: this.taskUserId || this.currentUserId,
				toUserId
			};
			this.#setButtonsBusy(true);
			main_core.ajax.runAction('bizproc.task.delegate', {
				data: actionData
			}).then(response => {
				this.#canClose = true;
				BX.SidePanel.Instance.getSliderByWindow(window)?.close();
			}).catch(response => {
				this.#setButtonsBusy(false);
				ui_dialogs_messagebox.MessageBox.alert(response.errors.pop().message);
			});
		}
		#sendMarkAsRead() {
			main_core.ajax.runAction('bizproc.workflow.comment.markAsRead', {
				data: {
					workflowId: this.workflowId,
					userId: this.currentUserId
				}
			});
		}
		#clearError(target) {
			const errorContainer = target.querySelector('.ui-form-notice');
			if (errorContainer) {
				BX.Dom.remove(errorContainer);
			}
		}
		#showErrors(errors) {
			if (BX.type.isArray(errors)) {
				const popupErrors = [];
				errors.forEach(error => {
					const fieldName = error.fieldId;
					if (this.taskForm && fieldName) {
						this.#showError(error.message, fieldName);
					} else {
						popupErrors.push(error.message);
					}
				});
				if (popupErrors.length > 0) {
					ui_dialogs_messagebox.MessageBox.alert(popupErrors.join(', '));
				}
			}
		}
		#showError(message, id) {
			const field = this.taskForm.querySelector(`[data-cid="${id}"]`);
			if (!field) {
				return;
			}
			const parentContainer = field.querySelector('.ui-form-content');
			let errorContainer = field.querySelector('.ui-form-notice');
			if (!errorContainer) {
				errorContainer = BX.Dom.create('div', {
					attrs: {
						className: 'ui-form-notice'
					}
				});
				errorContainer.innerText = message;
				if (parentContainer) {
					BX.Dom.append(errorContainer, parentContainer);
				}
			}
		}
		#renderNextTask(data) {
			this.#isChanged = false;
			this.#renderTaskFields(data);
			if (data.additionalParams) {
				this.taskId = data.additionalParams.ID;
				this.saveVariables = data.additionalParams.saveVariables;
				this.commentRequired = data.additionalParams.commentRequired;
				this.taskFields = data.additionalParams.FIELDS;
				this.fastClose = data.additionalParams.IS_LAST_TASK_FOR_USER && !this.#hasFileFields();
				const subject = this.workflowContent.querySelector('.bp-workflow-info__subject');
				if (subject) {
					subject.innerText = data.additionalParams.NAME;
				}
				const desc = this.workflowContent.querySelector('.bp-workflow-info__desc-inner');
				if (desc) {
					const descWrap = desc.closest('.bp-workflow-info__tabs-block');
					if (data.additionalParams.DESCRIPTION.length > 0) {
						main_core.Dom.removeClass(descWrap, 'block-hidden');
					} else {
						main_core.Dom.addClass(descWrap, 'block-hidden');
					}
					desc.innerHTML = data.additionalParams.DESCRIPTION;
					BX.UI.Hint.init(desc);
				}
				const slider = BX.SidePanel.Instance.getSliderByWindow(window);
				if (slider) {
					const currentUrl = slider.getUrl();
					const newUrl = currentUrl.replace(/\/bizproc\/\d+\//, `/bizproc/${this.taskId}/`);
					slider.setUrl(newUrl);
					top.history.replaceState({}, '', newUrl);
				}
			}
			if (data.additionalParams && data.additionalParams.BUTTONS) {
				this.taskButtons = data.additionalParams.BUTTONS;
			}
			this.init();
			main_core.Dom.removeClass(this.workflowContent, 'fade-out');
			main_core.Dom.addClass(this.workflowContent, 'fade-in');
			main_core.Event.bindOnce(this.workflowContent, 'animationend', () => {
				main_core.Dom.removeClass(this.workflowContent, 'fade-in');
			});
		}
		#renderTaskFields(data) {
			const taskFields = this.workflowContent.querySelector('.bp-workflow-info__editor');
			if (BX.type.isArray(data.html) && data.html.length > 0) {
				main_core.Dom.removeClass(taskFields, 'block-hidden');
				main_core.Dom.clean(this.taskForm);
				data.html.forEach((renderedControl, controlId) => {
					const fieldData = data.additionalParams?.FIELDS?.[controlId];
					if (fieldData) {
						const labelClass = fieldData.Required ? 'ui-form-label --required' : 'ui-form-label';
						const node = main_core.Tag.render`
						<div class="ui-form-row" data-cid="${main_core.Text.encode(fieldData.Id)}">
							<div class="${labelClass}">
								<div class="ui-ctl-label-text">${main_core.Text.encode(fieldData.Name)}</div>
							</div>
							<div class="ui-form-content"></div>
						</div>
					`;
						BX.Runtime.html(node.querySelector('.ui-form-content'), renderedControl);
						this.taskForm.append(node);
					}
				});
			} else {
				main_core.Dom.addClass(taskFields, 'block-hidden');
			}
		}
		#showConfirmDialog() {
			this.#messageBox = ui_dialogs_messagebox.MessageBox.confirm(main_core.Loc.getMessage('BPWFI_SLIDER_CONFIRM_DESCRIPTION'), main_core.Loc.getMessage('BPWFI_SLIDER_CONFIRM_TITLE'), () => {
				this.#canClose = true;
				BX.SidePanel.Instance.getSliderByWindow(window)?.close();
			}, main_core.Loc.getMessage('BPWFI_SLIDER_CONFIRM_ACCEPT'), () => {
				this.#messageBox.close();
				this.#messageBox = null;
			}, main_core.Loc.getMessage('BPWFI_SLIDER_CONFIRM_CANCEL'));
		}
	}

	exports.WorkflowInfo = WorkflowInfo;

})(this.BX.Bizproc.Component = this.BX.Bizproc.Component || {}, BX, BX.Event, BX.UI, BX.Bizproc, BX.UI.Dialogs);
//# sourceMappingURL=script.js.map

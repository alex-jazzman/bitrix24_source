/* eslint-disable */
(function (main_core, rpa_manager) {
	'use strict';

	const namespace = main_core.Reflection.namespace('BX.Rpa');
	class TaskComponent {
		typeId = null;
		itemId = null;
		buttons = [];
		task = null;
		onTaskComplete = null;
		editor = false;
		requestStarted = false;
		constructor(typeId, itemId, options) {
			this.typeId = typeId;
			this.itemId = itemId;
			this.buttons = options.buttons || [];
			this.task = options.task || null;
			this.onTaskComplete = options.onTaskComplete || null;
		}
		init() {
			[].forEach.call(this.buttons, btn => {
				btn.style.color = rpa_manager.Manager.calculateTextColor(btn.style.backgroundColor);
				BX.bind(btn, 'click', this.clickButtonHandler.bind(this, btn));
			}, this);
			if (this.task.ACTIVITY === 'RpaRequestActivity') {
				this.prepareEditor();
			}
		}
		startRequest() {
			this.requestStarted = true;
			if (BX.UI && BX.UI.ButtonManager) {
				this.buttons.forEach(node => {
					const uiButton = BX.UI.ButtonManager.createFromNode(node);
					if (uiButton) {
						uiButton.setWaiting(true);
					}
				});
			}
		}
		stopRequest() {
			this.requestStarted = false;
			if (BX.UI && BX.UI.ButtonManager) {
				this.buttons.forEach(node => {
					const uiButton = BX.UI.ButtonManager.createFromNode(node);
					if (uiButton) {
						uiButton.setWaiting(false);
					}
				});
			}
		}
		clickButtonHandler(btn, event) {
			event.preventDefault();
			if (this.editor) {
				if (this.validateFields()) {
					this.startRequest();
					this.editor.save();
				}
			} else {
				this.doTask(btn);
			}
		}
		doTask(clickedButton) {
			if (this.requestStarted) {
				return;
			}
			this.startRequest();
			let formData = new FormData(clickedButton.closest('form'));
			formData.append(clickedButton.name, clickedButton.value);
			main_core.ajax.runAction('rpa.Task.do', {
				analyticsLabel: 'rpaTaskDo',
				data: formData
			}).then(response => {
				this.stopRequest();
				if (response.data.completed) {
					if (this.onTaskComplete) {
						this.onTaskComplete(response.data);
					}
				}
			});
		}
		prepareEditor() {
			this.editor = rpa_manager.Manager.getEditor(this.typeId, this.itemId);
			BX.addCustomEvent(window, 'BX.UI.EntityEditorAjax:onSubmitFailure', this.onEditorErrors.bind(this));
			BX.addCustomEvent(window, 'BX.UI.EntityEditorAjax:onSubmit', this.onEditorSubmit.bind(this));
			BX.addCustomEvent(window, 'BX.UI.EntityEditor:onSave', this.onEditorSave.bind(this));
			BX.addCustomEvent(window, "BX.UI.EntityEditor:onFailedValidation", this.onEditorErrors.bind(this));
			this.unregisterActiveFields();
		}
		unregisterActiveFields() {
			const showSection = this.editor.getControlById('to_show');
			const fields = showSection ? showSection.getChildren() : [];
			fields.forEach(field => {
				field._isActive = false;
			});
		}
		validateFields() {
			let result = true;
			const setSection = this.editor.getControlById('to_set');
			const fields = setSection ? setSection.getChildren() : [];
			fields.forEach(field => {
				if (BX.Main.UF.Factory.isEmpty(field.getId())) {
					let control = this.editor.getControlById(field.getId());
					if (!control.hasError()) {
						control.showError(main_core.Loc.getMessage('RPA_TASK_FIELD_VALIDATION_ERROR'));
					}
					result = false;
				}
			});
			return result;
		}
		onEditorSubmit(entityData, response) {
			this.stopRequest();
			if (response.data.completed && main_core.Type.isFunction(this.onTaskComplete)) {
				setTimeout(this.onTaskComplete.bind(this, response.data), 10);
			}
		}
		onEditorSave(editor, eventArgs) {
			if (this.editor === editor) {
				eventArgs.enableCloseConfirmation = false;
			}
		}
		onEditorErrors(errors) {
			this.stopRequest();
			let msg = errors.pop().message;
			BX.UI.Notification.Center.notify({
				content: msg
			});
		}
	}
	namespace.TaskComponent = TaskComponent;

})(BX, BX.Rpa);
//# sourceMappingURL=script.js.map

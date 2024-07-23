/* eslint-disable */
this.BX = this.BX || {};
this.BX.Bizproc = this.BX.Bizproc || {};
(function (exports,main_core,main_core_events,ui_buttons,bizproc_task,ui_dialogs_messagebox) {
	'use strict';

	var _renderButtons = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("renderButtons");
	var _handleTaskButtonClick = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handleTaskButtonClick");
	var _handleDelegateButtonClick = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handleDelegateButtonClick");
	var _delegateTask = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("delegateTask");
	var _sendMarkAsRead = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("sendMarkAsRead");
	var _clearError = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("clearError");
	var _showError = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("showError");
	class WorkflowInfo {
	  constructor(options) {
	    Object.defineProperty(this, _showError, {
	      value: _showError2
	    });
	    Object.defineProperty(this, _clearError, {
	      value: _clearError2
	    });
	    Object.defineProperty(this, _sendMarkAsRead, {
	      value: _sendMarkAsRead2
	    });
	    Object.defineProperty(this, _delegateTask, {
	      value: _delegateTask2
	    });
	    Object.defineProperty(this, _handleDelegateButtonClick, {
	      value: _handleDelegateButtonClick2
	    });
	    Object.defineProperty(this, _handleTaskButtonClick, {
	      value: _handleTaskButtonClick2
	    });
	    Object.defineProperty(this, _renderButtons, {
	      value: _renderButtons2
	    });
	    this.currentUserId = options.currentUserId;
	    this.workflowId = options.workflowId;
	    this.taskId = options.taskId;
	    this.taskUserId = options.taskUserId;
	    this.taskButtons = options.taskButtons;
	    this.taskForm = options.taskForm;
	    this.buttonsPanel = options.buttonsPanel;
	    this.canDelegateTask = options.canDelegateTask;
	    this.handleMarkAsRead = main_core.Runtime.debounce(babelHelpers.classPrivateFieldLooseBase(this, _sendMarkAsRead)[_sendMarkAsRead], 100, this);
	  }
	  init() {
	    if (this.buttonsPanel) {
	      babelHelpers.classPrivateFieldLooseBase(this, _renderButtons)[_renderButtons]();
	    }
	    this.handleMarkAsRead();
	    main_core_events.EventEmitter.subscribe('OnUCCommentWasRead', event => {
	      const [xmlId] = event.getData();
	      if (xmlId === `WF_${this.workflowId}`) {
	        this.handleMarkAsRead();
	      }
	    });
	    if (this.taskForm) {
	      main_core.Event.bind(this.taskForm, 'input', event => {
	        const target = event.target;
	        if (target.matches('input, textarea, select')) {
	          const formRow = target.closest('.ui-form-content');
	          if (formRow) {
	            babelHelpers.classPrivateFieldLooseBase(this, _clearError)[_clearError](formRow);
	          }
	        }
	      });
	      this.taskForm.querySelectorAll('.ui-form-content').forEach(row => {
	        main_core.Event.bind(row, 'click', event => {
	          const target = event.currentTarget;
	          babelHelpers.classPrivateFieldLooseBase(this, _clearError)[_clearError](target);
	        });
	      });
	      main_core_events.EventEmitter.subscribe('BX.UI.Selector:onChange', event => {
	        const box = BX(`crm-${event.data[0].selectorId}-box`);
	        const formRow = box.closest('.ui-form-content');
	        if (formRow) {
	          babelHelpers.classPrivateFieldLooseBase(this, _clearError)[_clearError](formRow);
	        }
	      });
	      main_core_events.EventEmitter.subscribe('OnIframeKeyup', event => {
	        const box = event.target.dom.cont;
	        const formRow = box.closest('.ui-form-content');
	        if (formRow) {
	          babelHelpers.classPrivateFieldLooseBase(this, _clearError)[_clearError](formRow);
	        }
	      });
	    }
	  }
	}
	function _renderButtons2() {
	  if (this.taskButtons) {
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
	        onclick: btn => babelHelpers.classPrivateFieldLooseBase(this, _handleTaskButtonClick)[_handleTaskButtonClick](taskButton, btn)
	      });
	      main_core.Dom.style(button.getContainer(), 'minWidth', '160px');
	      main_core.Dom.style(button.getContainer(), 'maxWidth', '200px');
	      main_core.Dom.attr(button.getContainer(), 'title', taskButton.TEXT);
	      main_core.Dom.append(button.getContainer(), this.buttonsPanel);
	    });
	  }
	  if (this.canDelegateTask) {
	    const button = new ui_buttons.Button({
	      color: ui_buttons.ButtonColor.LINK,
	      size: ui_buttons.ButtonSize.MEDIUM,
	      // noCaps: true,
	      text: main_core.Loc.getMessage('BPWFI_SLIDER_BUTTON_DELEGATE'),
	      onclick: btn => babelHelpers.classPrivateFieldLooseBase(this, _handleDelegateButtonClick)[_handleDelegateButtonClick](btn)
	    });
	    main_core.Dom.style(button.getContainer(), 'minWidth', '160px');
	    main_core.Dom.style(button.getContainer(), 'maxWidth', '200px');
	    main_core.Dom.append(button.getContainer(), this.buttonsPanel);
	  }
	}
	function _handleTaskButtonClick2(taskButton, uiButton) {
	  const formData = new FormData(this.taskForm);
	  formData.append('taskId', this.taskId);
	  formData.append(taskButton.NAME, taskButton.VALUE);
	  uiButton.setDisabled(true);
	  main_core.ajax.runAction('bizproc.task.do', {
	    data: formData
	  }).then(() => {
	    var _BX$SidePanel$Instanc;
	    uiButton.setDisabled(false);
	    (_BX$SidePanel$Instanc = BX.SidePanel.Instance.getSliderByWindow(window)) == null ? void 0 : _BX$SidePanel$Instanc.close();
	  }).catch(response => {
	    if (BX.type.isArray(response.errors)) {
	      const popupErrors = [];
	      response.errors.forEach(error => {
	        const fieldName = error.customData;
	        if (this.taskForm && fieldName) {
	          const field = this.taskForm.querySelector(`[data-cid="${fieldName}"]`);
	          if (field) {
	            babelHelpers.classPrivateFieldLooseBase(this, _showError)[_showError](error, field);
	          }
	        } else {
	          popupErrors.push(error.message);
	        }
	      });
	      if (popupErrors.length > 0) {
	        ui_dialogs_messagebox.MessageBox.alert(popupErrors.join(', '));
	      }
	    }
	    uiButton.setDisabled(false);
	  });
	}
	function _handleDelegateButtonClick2(uiButton) {
	  uiButton.setDisabled(true);
	  main_core.Runtime.loadExtension('ui.entity-selector').then(exports => {
	    const {
	      Dialog
	    } = exports;
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
	        id: 'department',
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
	          babelHelpers.classPrivateFieldLooseBase(this, _delegateTask)[_delegateTask](item.getId());
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
	function _delegateTask2(toUserId) {
	  const actionData = {
	    taskIds: [this.taskId],
	    fromUserId: this.taskUserId || this.currentUserId,
	    toUserId
	  };
	  main_core.ajax.runAction('bizproc.task.delegate', {
	    data: actionData
	  }).then(response => {
	    var _BX$SidePanel$Instanc2;
	    (_BX$SidePanel$Instanc2 = BX.SidePanel.Instance.getSliderByWindow(window)) == null ? void 0 : _BX$SidePanel$Instanc2.close();
	  }).catch(response => {
	    ui_dialogs_messagebox.MessageBox.alert(response.errors.pop().message);
	  });
	}
	function _sendMarkAsRead2() {
	  main_core.ajax.runAction('bizproc.workflow.comment.markAsRead', {
	    data: {
	      workflowId: this.workflowId,
	      userId: this.currentUserId
	    }
	  });
	}
	function _clearError2(target) {
	  const errorContainer = target.querySelector('.ui-form-notice');
	  if (errorContainer) {
	    BX.Dom.remove(errorContainer);
	  }
	}
	function _showError2(error, field) {
	  const parentContainer = field.querySelector('.ui-form-content');
	  let errorContainer = field.querySelector('.ui-form-notice');
	  if (!errorContainer) {
	    errorContainer = BX.Dom.create('div', {
	      attrs: {
	        className: 'ui-form-notice'
	      }
	    });
	    errorContainer.innerText = error.message;
	    if (parentContainer) {
	      BX.Dom.append(errorContainer, parentContainer);
	    }
	  }
	}

	exports.WorkflowInfo = WorkflowInfo;

}((this.BX.Bizproc.Component = this.BX.Bizproc.Component || {}),BX,BX.Event,BX.UI,BX.Bizproc,BX.UI.Dialogs));
//# sourceMappingURL=script.js.map

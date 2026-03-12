/* eslint-disable */
this.BX = this.BX || {};
this.BX.Bizproc = this.BX.Bizproc || {};
(function (exports,main_core,ui_buttons,ui_dialogs_messagebox,main_loader) {
	'use strict';

	class StorageFieldEdit {
	  constructor(options) {
	    this.formNode = null;
	    this.errorsContainer = null;
	    this.tabs = new Map();
	    this.container = null;
	    this.inputs = new Map();
	    this.settingsTable = null;
	    this.saveButton = null;
	    this.deleteButton = null;
	    this.skipSave = false;
	    this.inputs = new Map();
	    if (main_core.Type.isPlainObject(options)) {
	      if (options.formName) {
	        this.formNode = document.querySelector(`form[data-role="${options.formName}"]`);
	        const saveButtonNode = this.formNode.querySelector('#ui-button-panel-save');
	        if (saveButtonNode) {
	          this.saveButton = ui_buttons.ButtonManager.createFromNode(saveButtonNode);
	        }
	        const deleteButtonNode = this.formNode.querySelector('#ui-button-panel-remove');
	        if (deleteButtonNode) {
	          this.deleteButton = ui_buttons.ButtonManager.createFromNode(deleteButtonNode);
	        }
	      }
	      if (main_core.Type.isElementNode(options.tabContainer)) {
	        this.tabContainer = options.tabContainer;
	      }
	      if (main_core.Type.isDomNode(options.errorsContainer)) {
	        this.errorsContainer = options.errorsContainer;
	      }
	      if (options.skipSave) {
	        this.skipSave = options.skipSave;
	      }
	    }
	    this.init();
	    StorageFieldEdit.instance = this;
	  }
	  init() {
	    if (!this.formNode) {
	      return;
	    }
	    main_core.Event.bind(this.formNode, 'submit', event => {
	      var _event$submitter;
	      event.preventDefault();
	      const eventName = (_event$submitter = event.submitter) == null ? void 0 : _event$submitter.name;
	      this.onHandleSubmitForm(eventName);
	    });
	    this.fillTabs();
	  }
	  fillTabs() {
	    if (this.tabContainer) {
	      const tabs = this.tabContainer.querySelectorAll('.bizproc-storage-field-edit-tab');
	      tabs.forEach(tabNode => {
	        if (tabNode.dataset.tab) {
	          this.tabs.set(tabNode.dataset.tab, tabNode);
	        }
	      });
	    }
	  }
	  resetSaveButton() {
	    if (this.saveButton) {
	      main_core.Dom.removeClass(this.saveButton.getContainer(), 'ui-btn-wait');
	    }
	  }
	  resetRemoveButton() {
	    if (this.deleteButton) {
	      main_core.Dom.removeClass(this.deleteButton.getContainer(), 'ui-btn-wait');
	    }
	  }
	  onHandleSubmitForm(eventName) {
	    const formPrepared = main_core.ajax.prepareForm(this.formNode);
	    if (!formPrepared || !formPrepared.data) {
	      return;
	    }
	    const {
	      data
	    } = formPrepared;
	    const isUpdate = data.id > 0;
	    const isRemove = eventName === 'remove';
	    if (isRemove) {
	      var _Loc$getMessage, _Loc$getMessage2;
	      ui_dialogs_messagebox.MessageBox.confirm((_Loc$getMessage = main_core.Loc.getMessage('BIZPROC_STORAGE_FIELD_EDIT_CONFIRM_MESSAGE')) != null ? _Loc$getMessage : '', messageBox => {
	        this.sendForm('bizproc.v2.StorageField.delete', {
	          id: data.id
	        }, 'BIZPROC_STORAGE_FIELD_EDIT_DELETE_MESSAGE', messageBox);
	      }, (_Loc$getMessage2 = main_core.Loc.getMessage('BIZPROC_STORAGE_FIELD_EDIT_CONFIRM_MESSAGE_OK')) != null ? _Loc$getMessage2 : '', messageBox => {
	        messageBox.close();
	        this.resetRemoveButton();
	      });
	      return;
	    }
	    let action = isUpdate ? 'bizproc.v2.StorageField.update' : 'bizproc.v2.StorageField.add';
	    let successMessageCode = 'BIZPROC_STORAGE_FIELD_EDIT_SAVE_MESSAGE';
	    if (this.skipSave) {
	      action = 'bizproc.v2.StorageField.getPreparedForm';
	      successMessageCode = 'BIZPROC_STORAGE_FIELD_EDIT_ADD_MESSAGE';
	    }
	    data.format = true;
	    this.sendForm(action, data, successMessageCode);
	  }
	  sendForm(action, data, successMessageCode, messageBox) {
	    main_core.ajax.runAction(action, {
	      data
	    }).then(response => {
	      if (response.data) {
	        var _Loc$getMessage3;
	        top.BX.UI.Notification.Center.notify({
	          content: (_Loc$getMessage3 = main_core.Loc.getMessage(successMessageCode)) != null ? _Loc$getMessage3 : ''
	        });
	        const idNode = this.formNode.querySelector('input[name="id"]');
	        if (idNode && response.data.id) {
	          idNode.value = response.data.id;
	        }
	        if (messageBox) {
	          messageBox.close();
	        }
	        this.reloadListSlider();
	        const slider = BX.SidePanel.Instance.getTopSlider();
	        if (slider) {
	          const dictionary = slider.getData();
	          const fieldData = action === 'bizproc.v2.StorageField.delete' ? {
	            id: (data == null ? void 0 : data.id) || null,
	            action
	          } : response.data;
	          dictionary.set('data', fieldData);
	          slider.close();
	        }
	      }
	      this.resetSaveButton();
	    }).catch(error => {
	      var _error$errors, _error$errors$;
	      const message = ((_error$errors = error.errors) == null ? void 0 : (_error$errors$ = _error$errors[0]) == null ? void 0 : _error$errors$.message) || 'Unknown error';
	      ui_dialogs_messagebox.MessageBox.alert(message);
	      this.resetSaveButton();
	    });
	  }
	  reloadListSlider() {
	    const slider = this.getSlider();
	    if (slider) {
	      BX.SidePanel.Instance.postMessage(slider, 'storage-field-list-update');
	    }
	  }
	  getSlider() {
	    if (main_core.Reflection.getClass('BX.SidePanel')) {
	      return BX.SidePanel.Instance.getSliderByWindow(window);
	    }
	    return null;
	  }
	  showTab(tabNameToShow) {
	    [...this.tabs.keys()].forEach(tabName => {
	      if (tabName === tabNameToShow) {
	        main_core.Dom.addClass(this.tabs.get(tabName), 'bizproc-storage-field-edit-tab-current');
	      } else {
	        main_core.Dom.removeClass(this.tabs.get(tabName), 'bizproc-storage-field-edit-tab-current');
	      }
	    });
	  }
	  getSettingsContainer() {
	    this.container = this.formNode;
	    if (this.container && !this.settingsContainer) {
	      this.settingsContainer = this.container.querySelector('[data-role="bizproc-storage-field-settings-container"]');
	    }
	    return this.settingsContainer;
	  }
	  getSelectedUserTypeId() {
	    const option = this.getSelectedOption('type');
	    if (option) {
	      return option.value;
	    }
	    return null;
	  }
	  getSelectedOption(inputName) {
	    const input = this.getInput(inputName);
	    if (input) {
	      const options = [...input.querySelectorAll('option')];
	      const index = input.selectedIndex;
	      return options[index];
	    }
	    return null;
	  }
	  adjustVisibility() {
	    const settingsTable = this.getSettingsTable();
	    const settingsTab = document.querySelector('[data-role="tab-settings"]');
	    if (!settingsTable || !settingsTab) {
	      return;
	    }
	    if (settingsTable.childElementCount <= 0) {
	      main_core.Dom.hide(settingsTab);
	    } else {
	      main_core.Dom.show(settingsTab);
	    }
	    const userTypeId = this.getSelectedUserTypeId();
	    if (userTypeId === 'boolean') {
	      this.changeInputVisibility('multiple', 'none');
	      this.changeInputVisibility('mandatory', 'none');
	    } else {
	      this.changeInputVisibility('multiple', 'block');
	      this.changeInputVisibility('mandatory', 'block');
	    }
	  }
	  changeInputVisibility(inputName, display) {
	    const input = this.getInput(inputName);
	    if (input && input.parentElement && input.parentElement.parentElement) {
	      if (display === 'block') {
	        main_core.Dom.show(input.parentElement.parentElement);
	      } else {
	        main_core.Dom.hide(input.parentElement.parentElement);
	      }
	    }
	  }
	  getInput(name) {
	    if (this.formNode) {
	      const input = this.formNode.querySelector(`[name="${name}"]`);
	      if (input) {
	        this.inputs.set(name, input);
	      }
	    }
	    return this.inputs.get(name);
	  }
	  showErrors(errors) {
	    let text = '';
	    errors.forEach(message => {
	      text += message;
	    });
	    if (main_core.Type.isDomNode(this.errorsContainer)) {
	      this.errorsContainer.innerText = text;
	      main_core.Dom.show(this.errorsContainer.parentElement);
	    } else {
	      console.error(text);
	    }
	  }
	  getLoader() {
	    if (!this.loader) {
	      this.loader = new main_loader.Loader({
	        size: 150
	      });
	    }
	    return this.loader;
	  }
	  startProgress() {
	    this.isProgress = true;
	    if (!this.getLoader().isShown()) {
	      this.getLoader().show(this.container);
	    }
	    this.hideErrors();
	  }
	  stopProgress() {
	    this.isProgress = false;
	    this.getLoader().hide();
	    setTimeout(() => {
	      this.saveButton.setWaiting(false);
	      this.resetSaveButton();
	      if (this.deleteButton) {
	        this.deleteButton.setWaiting(false);
	        this.resetRemoveButton();
	      }
	    }, 200);
	  }
	  hideErrors() {
	    if (main_core.Type.isDomNode(this.errorsContainer)) {
	      this.errorsContainer.innerText = '';
	      main_core.Dom.hide(this.errorsContainer.parentElement);
	    }
	  }
	  static handleLeftMenuClick(tabName) {
	    if (this.instance) {
	      this.instance.showTab(tabName);
	    }
	  }
	}
	StorageFieldEdit.instance = null;

	exports.StorageFieldEdit = StorageFieldEdit;

}((this.BX.Bizproc.Component = this.BX.Bizproc.Component || {}),BX,BX.UI,BX.UI.Dialogs,BX));
//# sourceMappingURL=script.js.map

/* eslint-disable */
this.BX = this.BX || {};
this.BX.Bizproc = this.BX.Bizproc || {};
(function (exports,main_core,ui_dialogs_messagebox) {
	'use strict';

	var _collectFormFields = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("collectFormFields");
	class StorageEdit {
	  constructor(options) {
	    Object.defineProperty(this, _collectFormFields, {
	      value: _collectFormFields2
	    });
	    this.formNode = null;
	    this.tabs = new Map();
	    if (main_core.Type.isPlainObject(options)) {
	      if (options.formName) {
	        this.formNode = document.querySelector(`form[data-role="${options.formName}"]`);
	      }
	      if (main_core.Type.isElementNode(options.tabContainer)) {
	        this.tabContainer = options.tabContainer;
	      }
	    }
	    this.init();
	    StorageEdit.instance = this;
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
	      const tabs = this.tabContainer.querySelectorAll('.bizproc-storage-edit-tab');
	      tabs.forEach(tabNode => {
	        if (tabNode.dataset.tab) {
	          this.tabs.set(tabNode.dataset.tab, tabNode);
	        }
	      });
	    }
	  }
	  resetSaveButton() {
	    const saveButtonNode = this.formNode.querySelector('.main-user-field-edit-buttons #ui-button-panel-save');
	    if (saveButtonNode) {
	      main_core.Dom.removeClass(saveButtonNode, 'ui-btn-wait');
	    }
	  }
	  onHandleSubmitForm(eventName) {
	    const fields = babelHelpers.classPrivateFieldLooseBase(this, _collectFormFields)[_collectFormFields]();
	    const isUpdate = fields.id > 0;
	    const isRemove = eventName === 'remove';
	    if (isRemove) {
	      var _Loc$getMessage, _Loc$getMessage2;
	      ui_dialogs_messagebox.MessageBox.confirm((_Loc$getMessage = main_core.Loc.getMessage('BIZPROC_STORAGE_EDIT_CONFIRM_MESSAGE')) != null ? _Loc$getMessage : '', messageBox => {
	        this.runAction('bizproc.storage.delete', {
	          id: fields.id
	        }, 'BIZPROC_STORAGE_EDIT_DELETE_MESSAGE', messageBox);
	      }, (_Loc$getMessage2 = main_core.Loc.getMessage('BIZPROC_STORAGE_EDIT_CONFIRM_MESSAGE_OK')) != null ? _Loc$getMessage2 : '');
	      return;
	    }
	    const action = isUpdate ? 'bizproc.storage.update' : 'bizproc.storage.add';
	    this.runAction(action, {
	      storageType: fields
	    }, 'BIZPROC_STORAGE_EDIT_SAVE_MESSAGE');
	  }
	  runAction(action, data, successMessageCode, messageBox) {
	    BX.ajax.runAction(action, {
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
	        const slider = BX.SidePanel.Instance.getTopSlider();
	        if (slider) {
	          const dictionary = slider.getData();
	          dictionary.set('data', {
	            storageId: response.data.id,
	            storageTitle: response.data.title
	          });
	          slider.close();
	        }
	      }
	      this.resetSaveButton();
	    }).catch(error => {
	      ui_dialogs_messagebox.MessageBox.alert(error.errors.pop().message);
	      this.resetSaveButton();
	    });
	  }
	  showTab(tabNameToShow) {
	    [...this.tabs.keys()].forEach(tabName => {
	      if (tabName === tabNameToShow) {
	        main_core.Dom.addClass(this.tabs.get(tabName), 'bizproc-storage-edit-tab-current');
	      } else {
	        main_core.Dom.removeClass(this.tabs.get(tabName), 'bizproc-storage-edit-tab-current');
	      }
	    });
	  }
	  static handleLeftMenuClick(tabName) {
	    if (this.instance) {
	      this.instance.showTab(tabName);
	    }
	  }
	  static showStorageFieldList(storageId) {
	    BX.Runtime.loadExtension('bizproc.router').then(({
	      Router
	    }) => {
	      const slider = BX.SidePanel.Instance.getTopSlider(); // TODO temp logic
	      slider == null ? void 0 : slider.close();
	      if (Router != null && Router.openStorageFieldList) {
	        Router.openStorageFieldList({
	          requestMethod: 'get',
	          requestParams: {
	            storageId
	          }
	        });
	      } else {
	        console.warn('Router or openStorageFieldList method not available');
	      }
	    }).catch(e => console.error(e));
	  }
	}
	function _collectFormFields2() {
	  const formData = new FormData(this.formNode);
	  const fields = {};
	  for (const [key, value] of formData.entries()) {
	    fields[key] = value;
	  }
	  return fields;
	}
	StorageEdit.instance = null;

	exports.StorageEdit = StorageEdit;

}((this.BX.Bizproc.Component = this.BX.Bizproc.Component || {}),BX,BX.UI.Dialogs));
//# sourceMappingURL=script.js.map

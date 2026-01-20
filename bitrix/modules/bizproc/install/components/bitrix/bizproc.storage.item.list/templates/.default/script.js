/* eslint-disable */
this.BX = this.BX || {};
this.BX.Bizproc = this.BX.Bizproc || {};
(function (exports,main_core,ui_dialogs_messagebox) {
	'use strict';

	class StorageItemList {
	  constructor() {
	    StorageItemList.instance = this;
	  }
	  static removeStorage(storageId) {
	    var _Loc$getMessage, _Loc$getMessage3;
	    ui_dialogs_messagebox.MessageBox.confirm((_Loc$getMessage = main_core.Loc.getMessage('BIZPROC_STORAGE_ITEM_LIST_CONFIRM_MESSAGE')) != null ? _Loc$getMessage : '', messageBox => {
	      BX.ajax.runAction('bizproc.storage.delete', {
	        data: {
	          id: storageId
	        }
	      }).then(response => {
	        if (response.data) {
	          var _Loc$getMessage2;
	          top.BX.UI.Notification.Center.notify({
	            content: (_Loc$getMessage2 = main_core.Loc.getMessage('BIZPROC_STORAGE_ITEM_DELETE_MESSAGE')) != null ? _Loc$getMessage2 : ''
	          });
	          if (messageBox) {
	            messageBox.close();
	          }
	          const slider = BX.SidePanel.Instance.getTopSlider();
	          if (slider) {
	            slider.close();
	          }
	          top.BX.Event.EventEmitter.emit('BX.Bizproc.Component.StorageItemList:onStorageRemove', {
	            storageId: storageId
	          });
	        }
	      }).catch(error => {
	        ui_dialogs_messagebox.MessageBox.alert(error.errors.pop().message);
	      });
	    }, (_Loc$getMessage3 = main_core.Loc.getMessage('BIZPROC_STORAGE_ITEM_CONFIRM_MESSAGE_OK')) != null ? _Loc$getMessage3 : '');
	  }
	}
	StorageItemList.instance = null;

	exports.StorageItemList = StorageItemList;

}((this.BX.Bizproc.Component = this.BX.Bizproc.Component || {}),BX,BX.UI.Dialogs));
//# sourceMappingURL=script.js.map

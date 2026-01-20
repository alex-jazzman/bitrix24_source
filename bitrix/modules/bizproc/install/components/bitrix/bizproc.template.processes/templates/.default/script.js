/* eslint-disable */
this.BX = this.BX || {};
this.BX.Bizproc = this.BX.Bizproc || {};
(function (exports,main_core,ui_dialogs_messagebox) {
	'use strict';

	var _signedParameters = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("signedParameters");
	var _componentName = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("componentName");
	var _gridId = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("gridId");
	var _reloadGrid = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("reloadGrid");
	var _getGrid = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getGrid");
	class TemplateProcesses {
	  constructor(options = {
	    signedParameters: string,
	    componentName: string,
	    gridId: string
	  }) {
	    Object.defineProperty(this, _getGrid, {
	      value: _getGrid2
	    });
	    Object.defineProperty(this, _reloadGrid, {
	      value: _reloadGrid2
	    });
	    Object.defineProperty(this, _signedParameters, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _componentName, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _gridId, {
	      writable: true,
	      value: void 0
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _signedParameters)[_signedParameters] = options.signedParameters;
	    babelHelpers.classPrivateFieldLooseBase(this, _componentName)[_componentName] = options.componentName;
	    babelHelpers.classPrivateFieldLooseBase(this, _gridId)[_gridId] = options.gridId;
	  }
	  deleteTemplateAction(id) {
	    const me = this;
	    new ui_dialogs_messagebox.MessageBox({
	      message: main_core.Loc.getMessage('BIZPROC_TEMPLATE_PROCESSES_DELETE_CONFIRMATION'),
	      okCaption: main_core.Loc.getMessage('BIZPROC_TEMPLATE_PROCESSES_DELETE_OK_CAPTION_TEXT'),
	      onOk: messageBox => {
	        BX.ajax.runComponentAction(babelHelpers.classPrivateFieldLooseBase(this, _componentName)[_componentName], 'deleteTemplate', {
	          mode: 'class',
	          data: {
	            id: id
	          }
	        }).then(() => {
	          babelHelpers.classPrivateFieldLooseBase(me, _reloadGrid)[_reloadGrid]();
	          messageBox.close();
	        }).catch(response => {
	          ui_dialogs_messagebox.MessageBox.alert(response.errors[0].message);
	          messageBox.close();
	        });
	      },
	      buttons: ui_dialogs_messagebox.MessageBoxButtons.OK_CANCEL,
	      popupOptions: {
	        events: {
	          onAfterShow: event => {
	            const okBtn = event.getTarget().getButton('ok');
	            if (okBtn) {
	              okBtn.getContainer().focus();
	            }
	          }
	        }
	      },
	      useAirDesign: true
	    }).show();
	  }
	}
	function _reloadGrid2() {
	  const grid = babelHelpers.classPrivateFieldLooseBase(this, _getGrid)[_getGrid]();
	  if (grid) {
	    grid.reload();
	  }
	}
	function _getGrid2() {
	  if (babelHelpers.classPrivateFieldLooseBase(this, _gridId)[_gridId]) {
	    return BX.Main.gridManager && BX.Main.gridManager.getInstanceById(babelHelpers.classPrivateFieldLooseBase(this, _gridId)[_gridId]);
	  }
	  return null;
	}

	exports.TemplateProcesses = TemplateProcesses;

}((this.BX.Bizproc.Component = this.BX.Bizproc.Component || {}),BX,BX.UI.Dialogs));
//# sourceMappingURL=script.js.map

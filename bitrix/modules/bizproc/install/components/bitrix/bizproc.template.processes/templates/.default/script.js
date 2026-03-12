/* eslint-disable */
this.BX = this.BX || {};
this.BX.Bizproc = this.BX.Bizproc || {};
(function (exports,main_core,ui_dialogs_messagebox) {
	'use strict';

	var _signedParameters = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("signedParameters");
	var _componentName = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("componentName");
	var _gridId = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("gridId");
	var _getSelectedTemplateIds = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getSelectedTemplateIds");
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
	    Object.defineProperty(this, _getSelectedTemplateIds, {
	      value: _getSelectedTemplateIds2
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
	  deleteBulkTemplateAction() {
	    const templateIds = babelHelpers.classPrivateFieldLooseBase(this, _getSelectedTemplateIds)[_getSelectedTemplateIds]();
	    if (templateIds.length === 0) {
	      return;
	    }
	    BX.ajax.runComponentAction(babelHelpers.classPrivateFieldLooseBase(this, _componentName)[_componentName], 'deleteBulkTemplate', {
	      mode: 'class',
	      data: {
	        ids: templateIds
	      }
	    }).then(() => {
	      babelHelpers.classPrivateFieldLooseBase(this, _reloadGrid)[_reloadGrid]();
	    }).catch(response => {
	      ui_dialogs_messagebox.MessageBox.alert(response.errors[0].message);
	    });
	  }
	  editTemplateAction(id) {
	    const url = `/bizprocdesigner/editor/?ID=${encodeURIComponent(id)}`;
	    window.open(url, '_blank');
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
	  applyActionPanelValues() {
	    const grid = babelHelpers.classPrivateFieldLooseBase(this, _getGrid)[_getGrid]();
	    const actionsPanel = grid == null ? void 0 : grid.getActionsPanel();
	    if (!main_core.Type.isObject(grid) || !main_core.Type.isObject(actionsPanel)) {
	      return;
	    }
	    const action = actionsPanel.getValues();
	    if (!action.hasOwnProperty('groupAction')) {
	      return;
	    }
	    if (action['groupAction'] === 'delete') {
	      this.deleteBulkTemplateAction();
	    }
	  }
	}
	function _getSelectedTemplateIds2() {
	  const grid = babelHelpers.classPrivateFieldLooseBase(this, _getGrid)[_getGrid]();
	  if (main_core.Type.isNull(grid)) {
	    return [];
	  }
	  const $templateIds = grid.getRows().getSelectedIds();
	  if ($templateIds.length === 0) {
	    return [];
	  }
	  return $templateIds;
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

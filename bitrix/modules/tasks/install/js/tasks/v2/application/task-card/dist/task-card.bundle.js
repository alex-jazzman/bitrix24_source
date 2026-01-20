/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
(function (exports,main_core,main_popup,ui_system_skeleton,tasks_v2_lib_idUtils) {
	'use strict';

	let _ = t => t,
	  _t;
	const settings = main_core.Extension.getSettings('tasks.v2.application.task-card');
	const load = top.BX.Runtime.loadExtension;
	class TaskCard {
	  static showCompactCard(params = {}) {
	    var _params$taskId;
	    if (window !== top) {
	      void load('tasks.v2.application.task-card').then(exports => exports.TaskCard.showCompactCard(params));
	      return;
	    }
	    const hasMandatoryUserFields = tasks_v2_lib_idUtils.idUtils.isTemplate((_params$taskId = params.taskId) != null ? _params$taskId : 0) ? settings.hasMandatoryTemplateUserFields : settings.hasMandatoryTaskUserFields;
	    if (hasMandatoryUserFields && settings.formV2Enabled) {
	      this.showFullCard(params);
	      return;
	    }
	    const id = `tasks-compact-card-${params.taskId}`;
	    if (main_popup.PopupManager.getPopupById(id)) {
	      return;
	    }
	    const content = main_core.Tag.render(_t || (_t = _`<div/>`));
	    void ui_system_skeleton.renderSkeleton('/bitrix/js/tasks/v2/application/task-card/src/skeleton.html?v=1', content);
	    let card = null;
	    const popup = new main_popup.Popup({
	      id,
	      className: 'tasks-compact-card-popup',
	      width: 580,
	      minHeight: 324,
	      borderRadius: '16px',
	      noAllPaddings: true,
	      content,
	      cacheable: false,
	      events: {
	        onAfterClose: () => card.unmount()
	      },
	      overlay: {
	        opacity: 100,
	        backgroundColor: '#0363',
	        blur: 'blur(2px)'
	      }
	    });
	    void load('tasks.v2.application.task-compact-card').then(exports => {
	      card = new exports.TaskCompactCard(params);
	      card.mount(popup);
	    });
	    popup.show();
	  }
	  static showFullCard(params = {}) {
	    var _params$url;
	    let card = null;
	    const options = {
	      contentCallback: async slider => {
	        const exports = await load('tasks.v2.application.task-full-card');
	        card = new exports.TaskFullCard(params);
	        return card.mount(slider);
	      },
	      events: {
	        onClose: event => {
	          var _card;
	          return (_card = card) == null ? void 0 : _card.onClose(event);
	        },
	        onCloseComplete: () => {
	          if (card) {
	            card.onCloseComplete();
	          } else if (params.closeCompleteUrl) {
	            location.href = params.closeCompleteUrl;
	          }
	        }
	      }
	    };
	    BX.SidePanel.Instance.open((_params$url = params.url) != null ? _params$url : this.getUrl(params.taskId), options);
	  }
	  static getUrl(entityId, groupId) {
	    const template = String(entityId).split('template')[1];
	    const id = Number(template) || template || entityId;
	    const isReal = Number.isInteger(id);
	    const path = (entityId != null && entityId.startsWith != null && entityId.startsWith('template') ? settings.templatePath : groupId ? settings.groupTaskPath : settings.userTaskPath).replace('#user_id#', settings.userId).replace('#group_id#', groupId).replace('#task_id#', isReal ? id : 0).replace('#template_id#', isReal ? id : 0).replace('#action#', isReal ? 'view' : 'edit');
	    if (isReal) {
	      return path;
	    }
	    return new main_core.Uri(path).setQueryParam('id', id).toString();
	  }
	}

	exports.TaskCard = TaskCard;

}((this.BX.Tasks.V2.Application = this.BX.Tasks.V2.Application || {}),BX,BX.Main,BX.UI.System,BX.Tasks.V2.Lib));
//# sourceMappingURL=task-card.bundle.js.map

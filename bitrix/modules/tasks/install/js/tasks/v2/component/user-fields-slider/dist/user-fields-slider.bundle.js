/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
(function (exports,main_core,ui_notificationManager,tasks_v2_lib_idUtils,tasks_v2_const,tasks_v2_core,tasks_v2_lib_apiClient,tasks_v2_provider_service_taskService,tasks_v2_provider_service_templateService,tasks_v2_component_fields_userFields) {
	'use strict';

	var _cacheContent = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("cacheContent");
	var _cacheRequest = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("cacheRequest");
	var _currentParams = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("currentParams");
	var _getContent = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getContent");
	var _getTasksContent = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getTasksContent");
	var _getTemplateContent = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getTemplateContent");
	var _getTaskFromTemplateContent = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getTaskFromTemplateContent");
	var _openSlider = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("openSlider");
	var _handleSliderClose = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handleSliderClose");
	var _handleSliderCloseComplete = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handleSliderCloseComplete");
	var _render = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("render");
	var _renderContent = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("renderContent");
	var _renderTitle = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("renderTitle");
	var _renderFooter = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("renderFooter");
	var _renderConfirmButton = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("renderConfirmButton");
	var _renderCancelButton = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("renderCancelButton");
	var _convertToArray = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("convertToArray");
	var _collectUserFieldsData = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("collectUserFieldsData");
	var _buildSchemeEntry = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("buildSchemeEntry");
	var _getEntityId = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getEntityId");
	var _prepareValue = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("prepareValue");
	var _showError = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("showError");
	var _currentTaskId = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("currentTaskId");
	var _currentIsTemplate = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("currentIsTemplate");
	var _currentTemplateId = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("currentTemplateId");
	var _currentCopiedFromId = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("currentCopiedFromId");
	class UserFieldsSlider {
	  constructor() {
	    Object.defineProperty(this, _currentCopiedFromId, {
	      get: _get_currentCopiedFromId,
	      set: void 0
	    });
	    Object.defineProperty(this, _currentTemplateId, {
	      get: _get_currentTemplateId,
	      set: void 0
	    });
	    Object.defineProperty(this, _currentIsTemplate, {
	      get: _get_currentIsTemplate,
	      set: void 0
	    });
	    Object.defineProperty(this, _currentTaskId, {
	      get: _get_currentTaskId,
	      set: void 0
	    });
	    Object.defineProperty(this, _showError, {
	      value: _showError2
	    });
	    Object.defineProperty(this, _prepareValue, {
	      value: _prepareValue2
	    });
	    Object.defineProperty(this, _getEntityId, {
	      value: _getEntityId2
	    });
	    Object.defineProperty(this, _buildSchemeEntry, {
	      value: _buildSchemeEntry2
	    });
	    Object.defineProperty(this, _collectUserFieldsData, {
	      value: _collectUserFieldsData2
	    });
	    Object.defineProperty(this, _convertToArray, {
	      value: _convertToArray2
	    });
	    Object.defineProperty(this, _renderCancelButton, {
	      value: _renderCancelButton2
	    });
	    Object.defineProperty(this, _renderConfirmButton, {
	      value: _renderConfirmButton2
	    });
	    Object.defineProperty(this, _renderFooter, {
	      value: _renderFooter2
	    });
	    Object.defineProperty(this, _renderTitle, {
	      value: _renderTitle2
	    });
	    Object.defineProperty(this, _renderContent, {
	      value: _renderContent2
	    });
	    Object.defineProperty(this, _render, {
	      value: _render2
	    });
	    Object.defineProperty(this, _handleSliderCloseComplete, {
	      value: _handleSliderCloseComplete2
	    });
	    Object.defineProperty(this, _openSlider, {
	      value: _openSlider2
	    });
	    Object.defineProperty(this, _getTaskFromTemplateContent, {
	      value: _getTaskFromTemplateContent2
	    });
	    Object.defineProperty(this, _getTemplateContent, {
	      value: _getTemplateContent2
	    });
	    Object.defineProperty(this, _getTasksContent, {
	      value: _getTasksContent2
	    });
	    Object.defineProperty(this, _getContent, {
	      value: _getContent2
	    });
	    Object.defineProperty(this, _cacheContent, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _cacheRequest, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _currentParams, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _handleSliderClose, {
	      writable: true,
	      value: () => {
	        const container = document.getElementById('user-fields-slider-content');
	        if (!container) {
	          return;
	        }
	        const {
	          scheme
	        } = babelHelpers.classPrivateFieldLooseBase(this, _collectUserFieldsData)[_collectUserFieldsData](container);
	        if (babelHelpers.classPrivateFieldLooseBase(this, _currentIsTemplate)[_currentIsTemplate]) {
	          void this.$store.dispatch(`${tasks_v2_const.Model.Interface}/updateTemplateUserFieldScheme`, scheme);
	          const taskScheme = [...this.$store.getters[`${tasks_v2_const.Model.Interface}/taskUserFieldScheme`]];
	          taskScheme.push(...scheme.filter(it => !taskScheme.some(({
	            id
	          }) => id === it.id)));
	          void this.$store.dispatch(`${tasks_v2_const.Model.Interface}/updateTaskUserFieldScheme`, taskScheme);
	        } else {
	          void this.$store.dispatch(`${tasks_v2_const.Model.Interface}/updateTaskUserFieldScheme`, scheme);
	          const templateScheme = [...this.$store.getters[`${tasks_v2_const.Model.Interface}/templateUserFieldScheme`]];
	          templateScheme.push(...scheme.filter(it => !templateScheme.some(({
	            id
	          }) => id === it.id)));
	          void this.$store.dispatch(`${tasks_v2_const.Model.Interface}/updateTemplateUserFieldScheme`, templateScheme);
	        }
	      }
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _cacheContent)[_cacheContent] = new Map();
	    babelHelpers.classPrivateFieldLooseBase(this, _cacheRequest)[_cacheRequest] = new Map();
	    babelHelpers.classPrivateFieldLooseBase(this, _currentParams)[_currentParams] = {};
	  }
	  async open(params) {
	    babelHelpers.classPrivateFieldLooseBase(this, _currentParams)[_currentParams] = params;
	    if (babelHelpers.classPrivateFieldLooseBase(this, _cacheContent)[_cacheContent].has(babelHelpers.classPrivateFieldLooseBase(this, _currentTaskId)[_currentTaskId])) {
	      const userFieldsElement = babelHelpers.classPrivateFieldLooseBase(this, _cacheContent)[_cacheContent].get(babelHelpers.classPrivateFieldLooseBase(this, _currentTaskId)[_currentTaskId]);
	      if (userFieldsElement) {
	        babelHelpers.classPrivateFieldLooseBase(this, _openSlider)[_openSlider](userFieldsElement);
	      }
	      return;
	    }
	    const content = await babelHelpers.classPrivateFieldLooseBase(this, _getContent)[_getContent]();
	    const userFieldsElement = document.createElement('div');
	    BX.Runtime.html(userFieldsElement, content, {
	      useAdjacentHTML: true
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _cacheContent)[_cacheContent].set(babelHelpers.classPrivateFieldLooseBase(this, _currentTaskId)[_currentTaskId], userFieldsElement);
	    babelHelpers.classPrivateFieldLooseBase(this, _openSlider)[_openSlider](userFieldsElement);
	  }
	  async handleConfirm() {
	    const container = document.getElementById('user-fields-slider-content');
	    if (!container) {
	      return;
	    }
	    const {
	      userFields
	    } = babelHelpers.classPrivateFieldLooseBase(this, _collectUserFieldsData)[_collectUserFieldsData](container);
	    if (babelHelpers.classPrivateFieldLooseBase(this, _currentIsTemplate)[_currentIsTemplate]) {
	      void this.updateTemplateUserFields(userFields);
	    } else {
	      void this.updateTaskUserFields(userFields);
	    }
	    BX.SidePanel.Instance.close();
	  }
	  async updateTaskUserFields(userFields) {
	    var _result$Endpoint$Task;
	    const result = await tasks_v2_provider_service_taskService.taskService.update(babelHelpers.classPrivateFieldLooseBase(this, _currentTaskId)[_currentTaskId], {
	      userFields
	    });
	    if ((_result$Endpoint$Task = result[tasks_v2_const.Endpoint.TaskUpdate]) != null && _result$Endpoint$Task.length) {
	      const error = result[tasks_v2_const.Endpoint.TaskUpdate][0];
	      babelHelpers.classPrivateFieldLooseBase(this, _showError)[_showError](error);
	    }
	  }
	  async updateTemplateUserFields(userFields) {
	    var _result$Endpoint$Temp;
	    const result = await tasks_v2_provider_service_templateService.templateService.update(babelHelpers.classPrivateFieldLooseBase(this, _currentTaskId)[_currentTaskId], {
	      userFields
	    });
	    if ((_result$Endpoint$Temp = result[tasks_v2_const.Endpoint.TemplateUpdate]) != null && _result$Endpoint$Temp.length) {
	      const error = result[tasks_v2_const.Endpoint.TemplateUpdate][0];
	      babelHelpers.classPrivateFieldLooseBase(this, _showError)[_showError](error);
	    }
	  }
	  get $store() {
	    return tasks_v2_core.Core.getStore();
	  }
	}
	async function _getContent2() {
	  if (babelHelpers.classPrivateFieldLooseBase(this, _cacheRequest)[_cacheRequest].has(babelHelpers.classPrivateFieldLooseBase(this, _currentTaskId)[_currentTaskId])) {
	    return babelHelpers.classPrivateFieldLooseBase(this, _cacheRequest)[_cacheRequest].get(babelHelpers.classPrivateFieldLooseBase(this, _currentTaskId)[_currentTaskId]);
	  }
	  try {
	    let html = '';
	    if (babelHelpers.classPrivateFieldLooseBase(this, _currentCopiedFromId)[_currentCopiedFromId]) {
	      if (babelHelpers.classPrivateFieldLooseBase(this, _currentIsTemplate)[_currentIsTemplate]) {
	        const id = tasks_v2_lib_idUtils.idUtils.unbox(babelHelpers.classPrivateFieldLooseBase(this, _currentCopiedFromId)[_currentCopiedFromId]);
	        html = await babelHelpers.classPrivateFieldLooseBase(this, _getTemplateContent)[_getTemplateContent](id);
	      } else {
	        const id = main_core.Type.isNumber(babelHelpers.classPrivateFieldLooseBase(this, _currentCopiedFromId)[_currentCopiedFromId]) ? babelHelpers.classPrivateFieldLooseBase(this, _currentCopiedFromId)[_currentCopiedFromId] : 0;
	        html = await babelHelpers.classPrivateFieldLooseBase(this, _getTasksContent)[_getTasksContent](id);
	      }
	    } else if (babelHelpers.classPrivateFieldLooseBase(this, _currentIsTemplate)[_currentIsTemplate]) {
	      const id = tasks_v2_lib_idUtils.idUtils.unbox(babelHelpers.classPrivateFieldLooseBase(this, _currentTaskId)[_currentTaskId]);
	      html = await babelHelpers.classPrivateFieldLooseBase(this, _getTemplateContent)[_getTemplateContent](id);
	    } else if (babelHelpers.classPrivateFieldLooseBase(this, _currentTemplateId)[_currentTemplateId]) {
	      var _babelHelpers$classPr;
	      const id = (_babelHelpers$classPr = babelHelpers.classPrivateFieldLooseBase(this, _currentTemplateId)[_currentTemplateId]) != null ? _babelHelpers$classPr : 0;
	      html = await babelHelpers.classPrivateFieldLooseBase(this, _getTaskFromTemplateContent)[_getTaskFromTemplateContent](id);
	    } else {
	      const id = main_core.Type.isNumber(babelHelpers.classPrivateFieldLooseBase(this, _currentTaskId)[_currentTaskId]) ? babelHelpers.classPrivateFieldLooseBase(this, _currentTaskId)[_currentTaskId] : 0;
	      html = await babelHelpers.classPrivateFieldLooseBase(this, _getTasksContent)[_getTasksContent](id);
	    }
	    const content = babelHelpers.classPrivateFieldLooseBase(this, _render)[_render](html);
	    babelHelpers.classPrivateFieldLooseBase(this, _cacheRequest)[_cacheRequest].set(babelHelpers.classPrivateFieldLooseBase(this, _currentTaskId)[_currentTaskId], content);
	    return content;
	  } catch (error) {
	    console.error('UserFieldsSlider.#getContent error', error);
	    return '';
	  }
	}
	async function _getTasksContent2(id) {
	  var _data$html;
	  const data = await tasks_v2_lib_apiClient.apiClient.post(tasks_v2_const.Endpoint.LegacyUserFieldGetTask, {
	    task: {
	      id
	    }
	  });
	  return (_data$html = data == null ? void 0 : data.html) != null ? _data$html : '';
	}
	async function _getTemplateContent2(id) {
	  var _data$html2;
	  const data = await tasks_v2_lib_apiClient.apiClient.post(tasks_v2_const.Endpoint.LegacyUserFieldGetTemplate, {
	    template: {
	      id
	    }
	  });
	  return (_data$html2 = data == null ? void 0 : data.html) != null ? _data$html2 : '';
	}
	async function _getTaskFromTemplateContent2(id) {
	  var _data$html3;
	  const data = await tasks_v2_lib_apiClient.apiClient.post('LegacyUserField.getTaskFromTemplate', {
	    template: {
	      id
	    }
	  });
	  return (_data$html3 = data == null ? void 0 : data.html) != null ? _data$html3 : '';
	}
	function _openSlider2(content) {
	  const sidePanelId = `tasks-task-legacy-user-fields-${main_core.Text.getRandom()}`;
	  const maxWidth = 800;
	  BX.SidePanel.Instance.open(sidePanelId, {
	    customLeftBoundary: 0,
	    width: maxWidth,
	    cacheable: false,
	    customRightBoundary: 0,
	    contentCallback: () => content,
	    events: {
	      onClose: babelHelpers.classPrivateFieldLooseBase(this, _handleSliderClose)[_handleSliderClose],
	      onCloseComplete: () => babelHelpers.classPrivateFieldLooseBase(this, _handleSliderCloseComplete)[_handleSliderCloseComplete]()
	    }
	  });
	}
	function _handleSliderCloseComplete2() {
	  var _BX$calendar;
	  // Hacks for BX.calendar
	  const calendar = (_BX$calendar = BX.calendar) == null ? void 0 : _BX$calendar.get();
	  if (!calendar) {
	    return;
	  }
	  if (calendar.popup) {
	    calendar.popup.destroy();
	    calendar.popup = null;
	    // eslint-disable-next-line no-underscore-dangle,@bitrix24/bitrix24-rules/no-pseudo-private
	    calendar._layers = {};
	    // eslint-disable-next-line no-underscore-dangle,@bitrix24/bitrix24-rules/no-pseudo-private
	    calendar._current_layer = null;
	  }
	  if (calendar.popup_month) {
	    calendar.popup_month.destroy();
	    calendar.popup_month = null;
	  }
	  if (calendar.popup_year) {
	    calendar.popup_year.destroy();
	    calendar.popup_year = null;
	  }
	}
	function _render2(html) {
	  return `
			<div class="tasks-task-full-card-user-fields">
				${babelHelpers.classPrivateFieldLooseBase(this, _renderTitle)[_renderTitle]()}
				${babelHelpers.classPrivateFieldLooseBase(this, _renderContent)[_renderContent](html)}
				${babelHelpers.classPrivateFieldLooseBase(this, _renderFooter)[_renderFooter]()}
			</div>
		`;
	}
	function _renderContent2(html) {
	  return `
			<div class="tasks-task-full-card-user-fields-content" id="user-fields-slider-content">
				${html}
			</div>
		`;
	}
	function _renderTitle2() {
	  return `
			<div class="tasks-task-full-card-user-fields-title">
				${tasks_v2_component_fields_userFields.userFieldsMeta.title}
			</div>
		`;
	}
	function _renderFooter2() {
	  return `
			<div class="tasks-task-full-card-user-fields-footer">
				${babelHelpers.classPrivateFieldLooseBase(this, _renderConfirmButton)[_renderConfirmButton]()}
				${babelHelpers.classPrivateFieldLooseBase(this, _renderCancelButton)[_renderCancelButton]()}
			</div>
		`;
	}
	function _renderConfirmButton2() {
	  return `
			<button class="ui-btn --air ui-btn-lg --style-filled ui-btn-no-caps" onclick="top.BX.Tasks.V2.Component.userFieldsSlider.handleConfirm();">
				<span class="ui-btn-text">
					<span class="ui-btn-text-inner">
						${main_core.Loc.getMessage('TASKS_V2_USER_FIELDS_SLIDER_CONFIRM')}
					</span>
				</span>
			</button>
		`;
	}
	function _renderCancelButton2() {
	  return `
			<button class="ui-btn --air ui-btn-lg --style-plain ui-btn-no-caps" onclick="top.BX.SidePanel.Instance.close();">
				<span class="ui-btn-text">
					<span class="ui-btn-text-inner">
						${main_core.Loc.getMessage('TASKS_V2_USER_FIELDS_SLIDER_CANCEL')}
					</span>
				</span>
			</button>
		`;
	}
	function _convertToArray2(userFields) {
	  return Object.keys(userFields).map(key => {
	    return {
	      key,
	      value: babelHelpers.classPrivateFieldLooseBase(this, _prepareValue)[_prepareValue](userFields[key])
	    };
	  });
	}
	function _collectUserFieldsData2(container) {
	  const result = {};
	  const scheme = [];
	  const inputs = container.querySelectorAll('input[name^="USER_FIELDS["], select[name^="USER_FIELDS["], textarea[name^="USER_FIELDS["]');
	  inputs.forEach(input => {
	    const name = input.getAttribute('name');
	    if (!name) {
	      return;
	    }
	    const match = name.match(/USER_FIELDS\[([^\]]+)](\[])?/);
	    if (!match) {
	      return;
	    }
	    const fieldKey = match[1];
	    const isMultiple = Boolean(match[2]);
	    const fieldContainer = input.closest('.js-id-item-set-item');
	    if (fieldContainer && !scheme.some(item => item.fieldName === fieldKey)) {
	      scheme.push(babelHelpers.classPrivateFieldLooseBase(this, _buildSchemeEntry)[_buildSchemeEntry](fieldContainer, fieldKey));
	    }
	    let value = null;
	    if (input.type === 'checkbox') {
	      if (input.checked) {
	        value = input.value;
	      } else {
	        return;
	      }
	    } else {
	      value = input.value;
	    }
	    if (isMultiple) {
	      var _result$fieldKey;
	      (_result$fieldKey = result[fieldKey]) != null ? _result$fieldKey : result[fieldKey] = [];
	      result[fieldKey].push(value);
	    } else {
	      result[fieldKey] = value;
	    }
	  });
	  return {
	    scheme,
	    userFields: babelHelpers.classPrivateFieldLooseBase(this, _convertToArray)[_convertToArray](result)
	  };
	}
	function _buildSchemeEntry2(fieldContainer, fieldName) {
	  const id = Number(fieldContainer.getAttribute('data-item-value'));
	  const userTypeId = fieldContainer.getAttribute('data-type') || 'string';
	  const multiple = fieldContainer.getAttribute('data-multiple') === '1';
	  const mandatory = main_core.Dom.hasClass(fieldContainer, 'required');
	  const labelElement = fieldContainer.querySelector('.js-id-item-set-item-label');
	  const editFormLabel = labelElement ? labelElement.textContent.trim() : fieldName;
	  return {
	    id,
	    mandatory,
	    editFormLabel,
	    userTypeId,
	    multiple,
	    fieldName,
	    entityId: babelHelpers.classPrivateFieldLooseBase(this, _getEntityId)[_getEntityId]()
	  };
	}
	function _getEntityId2() {
	  return babelHelpers.classPrivateFieldLooseBase(this, _currentIsTemplate)[_currentIsTemplate] ? 'TASKS_TASK_TEMPLATE' : 'TASKS_TASK';
	}
	function _prepareValue2(value) {
	  if (value === '') {
	    return null;
	  }
	  if (main_core.Type.isArray(value) && value.every(item => item === '')) {
	    return [''];
	  }
	  return value;
	}
	function _showError2(error) {
	  ui_notificationManager.Notifier.notifyViaBrowserProvider({
	    id: 'tasks-user-fields-update-error',
	    text: error == null ? void 0 : error.message
	  });
	}
	function _get_currentTaskId() {
	  return babelHelpers.classPrivateFieldLooseBase(this, _currentParams)[_currentParams].taskId;
	}
	function _get_currentIsTemplate() {
	  return babelHelpers.classPrivateFieldLooseBase(this, _currentParams)[_currentParams].isTemplate;
	}
	function _get_currentTemplateId() {
	  return babelHelpers.classPrivateFieldLooseBase(this, _currentParams)[_currentParams].templateId;
	}
	function _get_currentCopiedFromId() {
	  return babelHelpers.classPrivateFieldLooseBase(this, _currentParams)[_currentParams].copiedFromId;
	}
	const userFieldsSlider = new UserFieldsSlider();

	exports.userFieldsSlider = userFieldsSlider;

}((this.BX.Tasks.V2.Component = this.BX.Tasks.V2.Component || {}),BX,BX.UI.NotificationManager,BX.Tasks.V2.Lib,BX.Tasks.V2.Const,BX.Tasks.V2,BX.Tasks.V2.Lib,BX.Tasks.V2.Provider.Service,BX.Tasks.V2.Provider.Service,BX.Tasks.V2.Component.Fields));
//# sourceMappingURL=user-fields-slider.bundle.js.map

/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
(function (exports, main_core, ui_notificationManager, tasks_v2_lib_idUtils, tasks_v2_const, tasks_v2_core, tasks_v2_lib_apiClient, tasks_v2_provider_service_taskService, tasks_v2_provider_service_templateService, tasks_v2_component_fields_userFields) {
	'use strict';

	class UserFieldsSlider {
		#cacheContent;
		#cacheRequest;
		#currentParams;
		constructor() {
			this.#cacheContent = new Map();
			this.#cacheRequest = new Map();
			this.#currentParams = {};
		}
		async open(params) {
			this.#currentParams = params;
			if (this.#cacheContent.has(this.#currentTaskId)) {
				const userFieldsElement = this.#cacheContent.get(this.#currentTaskId);
				if (userFieldsElement) {
					this.#openSlider(userFieldsElement);
				}
				return;
			}
			const content = await this.#getContent();
			const userFieldsElement = document.createElement('div');
			BX.Runtime.html(userFieldsElement, content, {
				useAdjacentHTML: true
			});
			this.#cacheContent.set(this.#currentTaskId, userFieldsElement);
			this.#openSlider(userFieldsElement);
		}
		async #getContent() {
			if (this.#cacheRequest.has(this.#currentTaskId)) {
				return this.#cacheRequest.get(this.#currentTaskId);
			}
			try {
				let html = '';
				if (this.#currentCopiedFromId) {
					if (this.#currentIsTemplate) {
						const id = tasks_v2_lib_idUtils.idUtils.unbox(this.#currentCopiedFromId);
						html = await this.#getTemplateContent(id);
					} else {
						const id = main_core.Type.isNumber(this.#currentCopiedFromId) ? this.#currentCopiedFromId : 0;
						html = await this.#getTasksContent(id);
					}
				} else if (this.#currentIsTemplate) {
					const id = tasks_v2_lib_idUtils.idUtils.unbox(this.#currentTaskId);
					html = await this.#getTemplateContent(id);
				} else if (this.#currentTemplateId) {
					const id = this.#currentTemplateId ?? 0;
					html = await this.#getTaskFromTemplateContent(id);
				} else {
					const id = main_core.Type.isNumber(this.#currentTaskId) ? this.#currentTaskId : 0;
					html = await this.#getTasksContent(id);
				}
				const content = this.#render(html);
				this.#cacheRequest.set(this.#currentTaskId, content);
				return content;
			} catch (error) {
				console.error('UserFieldsSlider.#getContent error', error);
				return '';
			}
		}
		async #getTasksContent(id) {
			const data = await tasks_v2_lib_apiClient.apiClient.post(tasks_v2_const.Endpoint.LegacyUserFieldGetTask, {
				task: {
					id
				}
			});
			return data?.html ?? '';
		}
		async #getTemplateContent(id) {
			const data = await tasks_v2_lib_apiClient.apiClient.post(tasks_v2_const.Endpoint.LegacyUserFieldGetTemplate, {
				template: {
					id
				}
			});
			return data?.html ?? '';
		}
		async #getTaskFromTemplateContent(id) {
			const data = await tasks_v2_lib_apiClient.apiClient.post('LegacyUserField.getTaskFromTemplate', {
				template: {
					id
				}
			});
			return data?.html ?? '';
		}
		#openSlider(content) {
			const sidePanelId = `tasks-task-legacy-user-fields-${main_core.Text.getRandom()}`;
			const maxWidth = 800;
			BX.SidePanel.Instance.open(sidePanelId, {
				customLeftBoundary: 0,
				width: maxWidth,
				cacheable: false,
				customRightBoundary: 0,
				contentCallback: () => content,
				events: {
					onClose: this.#handleSliderClose,
					onCloseComplete: () => this.#handleSliderCloseComplete()
				}
			});
		}
		#handleSliderClose = () => {
			const container = document.getElementById('user-fields-slider-content');
			if (!container) {
				return;
			}
			const {
				scheme
			} = this.#collectUserFieldsData(container);
			if (this.#currentIsTemplate) {
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
		};
		#handleSliderCloseComplete() {
			// Hacks for BX.calendar
			const calendar = BX.calendar?.get();
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
		#render(html) {
			return `
			<div class="tasks-task-full-card-user-fields">
				${this.#renderTitle()}
				${this.#renderContent(html)}
				${this.#renderFooter()}
			</div>
		`;
		}
		#renderContent(html) {
			return `
			<div class="tasks-task-full-card-user-fields-content" id="user-fields-slider-content">
				${html}
			</div>
		`;
		}
		#renderTitle() {
			return `
			<div class="tasks-task-full-card-user-fields-title">
				${tasks_v2_component_fields_userFields.userFieldsMeta.title}
			</div>
		`;
		}
		#renderFooter() {
			return `
			<div class="tasks-task-full-card-user-fields-footer">
				${this.#renderConfirmButton()}
				${this.#renderCancelButton()}
			</div>
		`;
		}
		#renderConfirmButton() {
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
		#renderCancelButton() {
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
		async handleConfirm() {
			const container = document.getElementById('user-fields-slider-content');
			if (!container) {
				return;
			}
			const {
				userFields
			} = this.#collectUserFieldsData(container);
			if (this.#currentIsTemplate) {
				void this.updateTemplateUserFields(userFields);
			} else {
				void this.updateTaskUserFields(userFields);
			}
			BX.SidePanel.Instance.close();
		}
		async updateTaskUserFields(userFields) {
			const result = await tasks_v2_provider_service_taskService.taskService.update(this.#currentTaskId, {
				userFields
			});
			if (result[tasks_v2_const.Endpoint.TaskUpdate]?.length) {
				const error = result[tasks_v2_const.Endpoint.TaskUpdate][0];
				this.#showError(error);
			}
		}
		async updateTemplateUserFields(userFields) {
			const result = await tasks_v2_provider_service_templateService.templateService.update(this.#currentTaskId, {
				userFields
			});
			if (result[tasks_v2_const.Endpoint.TemplateUpdate]?.length) {
				const error = result[tasks_v2_const.Endpoint.TemplateUpdate][0];
				this.#showError(error);
			}
		}
		#convertToArray(userFields) {
			return Object.keys(userFields).map(key => {
				return {
					key,
					value: this.#prepareValue(userFields[key])
				};
			});
		}
		#collectUserFieldsData(container) {
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
					scheme.push(this.#buildSchemeEntry(fieldContainer, fieldKey));
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
					result[fieldKey] ??= [];
					result[fieldKey].push(value);
				} else {
					result[fieldKey] = value;
				}
			});
			return {
				scheme,
				userFields: this.#convertToArray(result)
			};
		}
		#buildSchemeEntry(fieldContainer, fieldName) {
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
				entityId: this.#getEntityId()
			};
		}
		#getEntityId() {
			return this.#currentIsTemplate ? 'TASKS_TASK_TEMPLATE' : 'TASKS_TASK';
		}
		#prepareValue(value) {
			if (value === '') {
				return null;
			}
			if (main_core.Type.isArray(value) && value.every(item => item === '')) {
				return [''];
			}
			return value;
		}
		#showError(error) {
			ui_notificationManager.Notifier.notifyViaBrowserProvider({
				id: 'tasks-user-fields-update-error',
				text: error?.message
			});
		}
		get #currentTaskId() {
			return this.#currentParams.taskId;
		}
		get #currentIsTemplate() {
			return this.#currentParams.isTemplate;
		}
		get #currentTemplateId() {
			return this.#currentParams.templateId;
		}
		get #currentCopiedFromId() {
			return this.#currentParams.copiedFromId;
		}
		get $store() {
			return tasks_v2_core.Core.getStore();
		}
	}
	const userFieldsSlider = new UserFieldsSlider();

	exports.userFieldsSlider = userFieldsSlider;

})(this.BX.Tasks.V2.Component = this.BX.Tasks.V2.Component || {}, BX, BX.UI.NotificationManager, BX.Tasks.V2.Lib, BX.Tasks.V2.Const, BX.Tasks.V2, BX.Tasks.V2.Lib, BX.Tasks.V2.Provider.Service, BX.Tasks.V2.Provider.Service, BX.Tasks.V2.Component.Fields);
//# sourceMappingURL=user-fields-slider.bundle.js.map

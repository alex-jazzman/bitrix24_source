import { Text, Loc, Type, Dom } from 'main.core';

import type { Store } from 'ui.vue3.vuex';

import { idUtils } from 'tasks.v2.lib.id-utils';
import { Model, Endpoint } from 'tasks.v2.const';
import { Core } from 'tasks.v2.core';
import { apiClient } from 'tasks.v2.lib.api-client';
import { taskService } from 'tasks.v2.provider.service.task-service';
import { templateService } from 'tasks.v2.provider.service.template-service';
import { userFieldsMeta } from 'tasks.v2.component.fields.user-fields';

import './user-fields-slider.css';

class UserFieldsSlider
{
	#cacheContent: Map<number, HTMLElement>;
	#cacheRequest: Map<number, string>;
	#currentTaskId: number | string;
	#currentIsTemplate: boolean;
	#currentTemplateId: number | null;

	constructor()
	{
		this.#cacheContent = new Map();
		this.#cacheRequest = new Map();
		this.#currentTaskId = 0;
		this.#currentIsTemplate = false;
	}

	async open(taskId: number | string, isTemplate: boolean, templateId: number | null): void
	{
		this.#currentTaskId = taskId;
		this.#currentIsTemplate = isTemplate;
		this.#currentTemplateId = templateId;

		if (this.#cacheContent.has(taskId))
		{
			const userFieldsElement = this.#cacheContent.get(taskId);
			if (userFieldsElement)
			{
				this.#openSlider(userFieldsElement);
			}

			return;
		}

		const content = await this.#getContent();

		const userFieldsElement = document.createElement('div');
		BX.Runtime.html(userFieldsElement, content, { useAdjacentHTML: true });

		this.#cacheContent.set(taskId, userFieldsElement);
		this.#openSlider(userFieldsElement);
	}

	async #getContent(): Promise<string>
	{
		if (this.#cacheRequest.has(this.#currentTaskId))
		{
			return this.#cacheRequest.get(this.#currentTaskId);
		}

		try
		{
			let html = '';
			if (this.#currentIsTemplate)
			{
				html = await this.#getTemplateContent();
			}
			else if (this.#currentTemplateId)
			{
				html = await this.#getTaskFromTemplateContent();
			}
			else
			{
				html = await this.#getTasksContent();
			}

			const content = this.#render(html);

			this.#cacheRequest.set(this.#currentTaskId, content);

			return content;
		}
		catch (error)
		{
			console.error('UserFieldsSlider.#getContent error', error);

			return '';
		}
	}

	async #getTasksContent(): Promise<string>
	{
		const id = Type.isNumber(this.#currentTaskId) ? this.#currentTaskId : 0;
		const data = await apiClient.post(Endpoint.LegacyUserFieldGetTask, { task: { id } });

		return data?.html ?? '';
	}

	async #getTemplateContent(): Promise<string>
	{
		const id = idUtils.unbox(this.#currentTaskId);
		const data = await apiClient.post(Endpoint.LegacyUserFieldGetTemplate, { template: { id } });

		return data?.html ?? '';
	}

	async #getTaskFromTemplateContent(): Promise<string>
	{
		const id = this.#currentTemplateId ?? 0;
		const data = await apiClient.post(Endpoint.LegacyUserFieldGetTemplate, {
			template: {
				id,
				task: { id: this.#currentTaskId },
			},
		});

		return data?.html ?? '';
	}

	#openSlider(content: HTMLElement): void
	{
		const sidePanelId = `tasks-task-legacy-user-fields-${Text.getRandom()}`;
		const maxWidth = 800;

		BX.SidePanel.Instance.open(sidePanelId, {
			customLeftBoundary: 0,
			width: maxWidth,
			cacheable: false,
			customRightBoundary: 0,
			contentCallback: () => content,
			events: {
				onCloseComplete: () => this.#handleSliderClose(),
			},
		});
	}

	#handleSliderClose(): void
	{
		// Hacks for BX.calendar
		const calendar = BX.calendar?.get();

		if (!calendar)
		{
			return;
		}

		if (calendar.popup)
		{
			calendar.popup.destroy();
			calendar.popup = null;
			// eslint-disable-next-line no-underscore-dangle,@bitrix24/bitrix24-rules/no-pseudo-private
			calendar._layers = {};
			// eslint-disable-next-line no-underscore-dangle,@bitrix24/bitrix24-rules/no-pseudo-private
			calendar._current_layer = null;
		}

		if (calendar.popup_month)
		{
			calendar.popup_month.destroy();
			calendar.popup_month = null;
		}

		if (calendar.popup_year)
		{
			calendar.popup_year.destroy();
			calendar.popup_year = null;
		}
	}

	#render(html): string
	{
		return `
			<div class="tasks-task-full-card-user-fields">
				${this.#renderTitle()}
				${this.#renderContent(html)}
				${this.#renderFooter()}
			</div>
		`;
	}

	#renderContent(html): string
	{
		return `
			<div class="tasks-task-full-card-user-fields-content" id="user-fields-slider-content">
				${html}
			</div>
		`;
	}

	#renderTitle(): string
	{
		return `
			<div class="tasks-task-full-card-user-fields-title">
				${userFieldsMeta.title}
			</div>
		`;
	}

	#renderFooter(): string
	{
		return `
			<div class="tasks-task-full-card-user-fields-footer">
				<button class="ui-btn --air ui-btn-lg --style-filled ui-btn-no-caps" onclick="top.BX.Tasks.V2.Component.userFieldsSlider.handleConfirm();">
					<span class="ui-btn-text">
						<span class="ui-btn-text-inner">
							${Loc.getMessage('TASKS_V2_USER_FIELDS_SLIDER_CONFIRM')}
						</span>
					</span>
				</button>
				<button class="ui-btn --air ui-btn-lg --style-plain ui-btn-no-caps" onclick="top.BX.SidePanel.Instance.close();">
					<span class="ui-btn-text">
						<span class="ui-btn-text-inner">
							${Loc.getMessage('TASKS_V2_USER_FIELDS_SLIDER_CANCEL')}
						</span>
					</span>
				</button>
			</div>
		`;
	}

	async handleConfirm(): void
	{
		const container = document.getElementById('user-fields-slider-content');

		if (!container)
		{
			return;
		}

		const { userFields, scheme } = this.#collectUserFieldsData(container);

		if (this.#currentIsTemplate)
		{
			await this.updateTemplateUserFields(userFields, scheme);
		}
		else
		{
			await this.updateTaskUserFields(userFields, scheme);
		}

		BX.SidePanel.Instance.close();
	}

	async updateTaskUserFields(userFields: Array, scheme: Array): void
	{
		await this.$store.dispatch(`${Model.Interface}/updateTaskUserFieldScheme`, scheme);

		void taskService.update(this.#currentTaskId, { userFields });
	}

	async updateTemplateUserFields(userFields: Array, scheme: Array): void
	{
		await this.$store.dispatch(`${Model.Interface}/updateTemplateUserFieldScheme`, scheme);

		void templateService.update(this.#currentTaskId, { userFields });
	}

	#convertToArray(userFields: Object): Array
	{
		return Object.keys(userFields).map((key) => {
			return {
				key,
				value: this.#prepareValue(userFields[key]),
			};
		});
	}

	#collectUserFieldsData(container: HTMLElement): Object
	{
		const result = {};
		const scheme = [];

		const inputs = container.querySelectorAll(
			'input[name^="USER_FIELDS["], select[name^="USER_FIELDS["], textarea[name^="USER_FIELDS["]',
		);

		inputs.forEach((input) => {
			const name = input.getAttribute('name');
			if (!name)
			{
				return;
			}

			const match = name.match(/USER_FIELDS\[([^\]]+)](\[])?/);
			if (!match)
			{
				return;
			}

			const fieldKey = match[1];
			const isMultiple = Boolean(match[2]);

			const fieldContainer = input.closest('.js-id-item-set-item');

			if (fieldContainer && !scheme.some((item) => item.fieldName === fieldKey))
			{
				scheme.push(this.#buildSchemeEntry(fieldContainer, fieldKey));
			}

			let value = null;
			if (input.type === 'checkbox')
			{
				if (input.checked)
				{
					value = input.value;
				}
				else
				{
					return;
				}
			}
			else
			{
				value = input.value;
			}

			if (isMultiple)
			{
				result[fieldKey] ??= [];
				result[fieldKey].push(value);
			}
			else
			{
				result[fieldKey] = value;
			}
		});

		return {
			scheme,
			userFields: this.#convertToArray(result),
		};
	}

	#buildSchemeEntry(fieldContainer: HTMLElement, fieldName: string): Object
	{
		const id = Number(fieldContainer.getAttribute('data-item-value'));
		const userTypeId = fieldContainer.getAttribute('data-type') || 'string';
		const multiple = fieldContainer.getAttribute('data-multiple') === '1';
		const mandatory = Dom.hasClass(fieldContainer, 'required');
		const labelElement = fieldContainer.querySelector('.js-id-item-set-item-label');
		const editFormLabel = labelElement ? labelElement.textContent.trim() : fieldName;

		return {
			id,
			mandatory,
			editFormLabel,
			userTypeId,
			multiple,
			fieldName,
			entityId: this.#getEntityId(),
		};
	}

	#getEntityId(): string
	{
		return this.#currentIsTemplate ? 'TASKS_TASK_TEMPLATE' : 'TASKS_TASK';
	}

	#prepareValue(value: any): ?any
	{
		if (value === '')
		{
			return null;
		}

		if (Type.isArray(value) && value.every((item) => item === ''))
		{
			return [''];
		}

		return value;
	}

	get $store(): Store
	{
		return Core.getStore();
	}
}

export const userFieldsSlider = new UserFieldsSlider();

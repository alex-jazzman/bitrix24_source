import { Runtime, Uri } from 'main.core';
import { BaseEvent, EventEmitter } from 'main.core.events';
import { PopupManager } from 'main.popup';

import { HeadlineXl } from 'ui.system.typography.vue';

import { apiClient } from 'tasks.v2.lib.api-client';
import { Endpoint } from 'tasks.v2.const';

import { TypeFields } from './fields/type-fields/type-fields';
import { TimeFields } from './fields/time-fields/time-fields';
import { MessageFields } from './fields/message-fields/message-fields';
import { ErrorsFields } from './fields/errors-fields/errors-fields';
import { GridLoader } from './grid-loader/grid-loader';

import './app.css';

const gridId = 'tasks-template-history-grid';

// @vue/component
export const App = {
	name: 'TemplateHistoryGrid',
	components: {
		HeadlineXl,
		TimeFields,
		TypeFields,
		MessageFields,
		ErrorsFields,
		GridLoader,
	},
	props: {
		templateId: {
			type: [Number, String],
			required: true,
		},
	},
	mounted(): void
	{
		EventEmitter.subscribe('Grid::beforeRequest', this.handleBeforeGridRequest);
		EventEmitter.subscribe('Grid::updated', this.update);

		void this.getData();
	},
	beforeUnmount(): void
	{
		EventEmitter.unsubscribe('Grid::beforeRequest', this.handleBeforeGridRequest);
		EventEmitter.unsubscribe('Grid::updated', this.update);

		BX.Main?.gridManager?.destroy(gridId);
		PopupManager.getPopupById(`${gridId}-grid-settings-window`)?.destroy();
	},
	methods: {
		async getData(): Promise<void>
		{
			const { html } = await apiClient.post(Endpoint.TemplateHistoryGetGrid, { templateId: this.templateId });

			await Runtime.html(this.$refs.grid, html);

			this.update();
		},
		handleBeforeGridRequest(event: BaseEvent): void
		{
			const [, eventArgs] = event.getData();

			if (eventArgs.url)
			{
				this.nav = new Uri(eventArgs.url ?? '').getQueryParams().nav;
			}

			eventArgs.url = `/bitrix/services/main/ajax.php?action=tasks.V2.Template.History.getGridData&nav=${this.nav}`;
			eventArgs.method = 'POST';
			eventArgs.data = {
				templateId: this.templateId,
			};
		},
		update(): void
		{
			void this.$refs.timeFields.update();
			void this.$refs.typeFields.update();
			void this.$refs.messageFields.update();
			void this.$refs.errorsFields.update();
		},
	},
	template: `
		<div class="tasks-template-history-grid-container">
			<div class="tasks-template-history-grid-header">
				<HeadlineXl>{{ loc('TASKS_V2_TEMPLATE_HISTORY_GRID_LOG_HEADER') }}</HeadlineXl>
			</div>
			<div ref="grid" class="tasks-template-history-grid-main-content"><GridLoader/></div>
			<TimeFields ref="timeFields" :getGrid="() => this.$refs.grid"/>
			<TypeFields ref="typeFields" :getGrid="() => this.$refs.grid"/>
			<MessageFields ref="messageFields" :getGrid="() => this.$refs.grid"/>
			<ErrorsFields ref="errorsFields" :getGrid="() => this.$refs.grid"/>
		</div>
	`,
};

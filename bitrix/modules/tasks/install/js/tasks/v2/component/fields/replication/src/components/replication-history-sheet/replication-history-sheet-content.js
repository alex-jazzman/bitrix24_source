import { Runtime, Uri } from 'main.core';
import { BaseEvent, EventEmitter } from 'main.core.events';
import { PopupManager } from 'main.popup';

import { Endpoint } from 'tasks.v2.const';
import { apiClient } from 'tasks.v2.lib.api-client';
import { idUtils } from 'tasks.v2.lib.id-utils';

import { TimeFields } from './time-fields/time-fields';
import { MessageFields } from './message-fields/message-fields';
import { GridLoader } from './grid-loader/grid-loader';

const gridId = 'tasks-template-history-grid';

// @vue/component
export const ReplicationHistorySheetContent = {
	components: {
		TimeFields,
		MessageFields,
		GridLoader,
	},
	inject: {
		taskId: {},
	},
	setup(): { taskId: number } {},
	computed: {
		templateId(): number
		{
			return idUtils.unbox(this.taskId);
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
			void this.$refs.messageFields.update();
		},
	},
	template: `
		<div class="tasks-field-replication-sheet__history-grid-container">
			<div ref="grid" class="tasks-field-replication-sheet__history-grid-main-content"><GridLoader/></div>
			<TimeFields ref="timeFields" :getGrid="() => this.$refs.grid"/>
			<MessageFields ref="messageFields" :getGrid="() => this.$refs.grid"/>
		</div>
	`,
};

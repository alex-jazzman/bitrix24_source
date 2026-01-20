import { Runtime, Uri } from 'main.core';
import { EventEmitter, type BaseEvent } from 'main.core.events';
import { PopupManager } from 'main.popup';

import { HeadlineXl } from 'ui.system.typography.vue';

import { apiClient } from 'tasks.v2.lib.api-client';

import { ChangesetTime } from './fields/changeset-time/changeset-time';
import { Authors } from './fields/authors/authors';
import { ChangesetLocations } from './fields/changeset-locations/changeset-locations';
import { ChangesetValues } from './fields/changeset-values/changeset-values';
import { GridLoader } from './grid-loader/grid-loader';

import './app.css';

const gridId = 'tasks-history-grid';

// @vue/component
export const App = {
	name: 'HistoryGrid',
	components: {
		HeadlineXl,
		GridLoader,
		ChangesetTime,
		Authors,
		ChangesetLocations,
		ChangesetValues,
	},
	props: {
		taskId: {
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
			const { html } = await apiClient.post('Task.HistoryGrid.get', { taskId: this.taskId });

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

			eventArgs.url = `/bitrix/services/main/ajax.php?action=tasks.v2.Task.HistoryGrid.getData&nav=${this.nav}`;
			eventArgs.method = 'POST';
			eventArgs.data = {
				taskId: this.taskId,
			};
		},
		update(): void
		{
			void this.$refs.changesetTime.update();
			void this.$refs.authors.update();
			void this.$refs.changesetLocations.update();
			void this.$refs.changesetValues.update();
		},
	},
	template: `
		<div class="tasks-history-grid-container">
			<div class="tasks-history-grid-header">
				<HeadlineXl>{{ loc('TASKS_V2_HISTORY_LOG_HEADER') }}</HeadlineXl>
			</div>
			<div ref="grid" class="tasks-history-grid-main-content"><GridLoader/></div>
			<Authors ref="authors" :getGrid="() => this.$refs.grid"/>
			<ChangesetTime ref="changesetTime" :getGrid="() => this.$refs.grid"/>
			<ChangesetLocations ref="changesetLocations" :getGrid="() => this.$refs.grid" :taskId/>
			<ChangesetValues ref="changesetValues" :getGrid="() => this.$refs.grid"/>
		</div>
	`,
};

import { Title as TitleField } from 'tasks.v2.component.fields.title';
import { Importance } from 'tasks.v2.component.fields.importance';

import { ControlPanel } from './control-panel/control-panel';
import { TasksCloserEmbedded } from './tasks-closer-embedded/tasks-closer-embedded.js';
import './task-header.css';

// @vue/component
export const TaskHeader = {
	name: 'TaskFullCardHeader',
	components: {
		TitleField,
		Importance,
		ControlPanel,
		TasksCloserEmbedded,
	},
	inject: {
		isEdit: {},
		isTemplate: {},
		embedded: {},
		onCloseEmbedded: {},
	},
	template: `
		<div class="tasks-full-card-header">
			<TitleField />
			<Importance />
			<ControlPanel
				v-if="!isTemplate && isEdit"
			/>
			<TasksCloserEmbedded
				v-if="embedded && onCloseEmbedded"
				:onCloseEmbedded
			/>
		</div>
	`,
};

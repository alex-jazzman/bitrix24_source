import { Title as TitleField } from 'tasks.v2.component.fields.title';
import { Importance } from 'tasks.v2.component.fields.importance';

import { ControlPanel } from './control-panel/control-panel';
import { OpenFullCard } from './open-full-card';
import './task-header.css';

// @vue/component
export const TaskHeader = {
	name: 'TaskFullCardHeader',
	components: {
		TitleField,
		Importance,
		OpenFullCard,
		ControlPanel,
	},
	inject: {
		isEdit: {},
		isTemplate: {},
		embedded: {},
	},
	template: `
		<div class="tasks-full-card-header">
			<TitleField />
			<Importance />
			<OpenFullCard v-if="embedded" />
			<ControlPanel
				v-if="!isTemplate && isEdit"
			/>
		</div>
	`,
};

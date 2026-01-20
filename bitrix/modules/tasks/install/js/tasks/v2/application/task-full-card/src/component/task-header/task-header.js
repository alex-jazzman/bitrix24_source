import { Title as TitleField } from 'tasks.v2.component.fields.title';
import { Importance } from 'tasks.v2.component.fields.importance';

import { BurgerMenu } from './burger-menu/burger-menu';
import './task-header.css';

// @vue/component
export const TaskHeader = {
	name: 'TaskFullCardHeader',
	components: {
		TitleField,
		Importance,
		BurgerMenu,
	},
	inject: {
		isEdit: {},
		isTemplate: {},
	},
	template: `
		<div class="tasks-full-card-header">
			<TitleField/>
			<Importance/>
			<BurgerMenu v-if="!isTemplate && isEdit"/>
		</div>
	`,
};

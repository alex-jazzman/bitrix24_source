import './tasks-control-panel.css';

// @vue/component
export const TasksControlPanel = {
	name: 'TasksControlPanel',
	template: `
		<div class="tasks-control-panel">
			<div class="tasks-control-panel__bg"></div>
			<div class="tasks-control-panel__content">
				<slot />
			</div>
		</div>
	`,
};

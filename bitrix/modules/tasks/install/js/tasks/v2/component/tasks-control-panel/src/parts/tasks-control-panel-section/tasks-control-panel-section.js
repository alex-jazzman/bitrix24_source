import { BIcon, Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import './tasks-control-panel-section.css';

// @vue/component
export const TasksControlPanelSection = {
	name: 'TasksControlPanelSection',
	components: {
		BIcon,
	},
	props: {
		controlItems: {
			type: Array,
			default: () => [],
		},
	},
	setup(): {}
	{
		return {
			Outline,
		};
	},
	template: `
		<div class="tasks-control-panel-section">
			<div class="tasks-control-panel-section__bg"></div>
			<div class="tasks-control-panel-section__content">
				<slot />
				<ul class="tasks-control-panel-section__list">
					<li v-for="controlItem in controlItems" class="tasks-control-panel-section__item">
						<button
							class="tasks-control-panel-section__item-action"
							:disabled="controlItem.isDisabled || controlItem.isLocked"
							@click="controlItem.handleClickItem"
						>
							<div v-if="controlItem.isLocked" class="tasks-control-panel-section__item-action-status">
								<BIcon
									class="tasks-control-panel-section__item-action-status-icon"
									:name="Outline.LOCK_L"
								/>
							</div>
							<div class="tasks-control-panel-section__item-vis">
								<BIcon
									class="tasks-control-panel-section__item-vis-icon"
									:name="controlItem.icon"
								/>
							</div>
							<p class="tasks-control-panel-section__item-text">{{ controlItem.title }}</p>
						</button>
					</li>
				</ul>
			</div>
		</div>
	`,
};

import { BIcon, Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import './tasks-control-panel-menu.css';

// @vue/component
export const TasksControlPanelMenu = {
	name: 'TasksControlPanelMenu',
	components: {
		BIcon,
	},
	props: {
		menuItems: {
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
		<div class="tasks-control-panel-menu">
			<div class="tasks-control-panel-menu__bg"></div>
			<div class="tasks-control-panel-menu__content">
				<ul class="tasks-control-panel-menu__list">
					<li
						v-for="menuItem in menuItems"
						class="tasks-control-panel-menu__item"
						:class="menuItem.className"
					>
						<button
							class="tasks-control-panel-menu__action"
							:class="{'tasks-control-panel-menu__action_active': menuItem.isActive}"
							:id="menuItem.id"
							@click="menuItem.handleClickItem"
						>
							<div class="tasks-control-panel-menu__action-bg"></div>
							<div class="tasks-control-panel-menu__action-content">
								<div class="tasks-control-panel-menu__action-text">
									<BIcon
										class="tasks-control-panel-menu__action-text-icon"
										:name="menuItem.icon"
									/>
									<span class="tasks-control-panel-menu__action-text-title">{{ menuItem.title }}</span>
								</div>
								<div class="tasks-control-panel-menu__action-vis">
									<BIcon
										class="tasks-control-panel-menu__action-vis-icon"
										:name="Outline.CHEVRON_RIGHT_M"
									/>
								</div>
							</div>
						</button>
					</li>
				</ul>
			</div>
		</div>
	`,
};

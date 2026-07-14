/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
(function (exports, ui_iconSet_api_vue) {
	'use strict';

	// @vue/component
	const TasksControlPanel = {
		name: 'TasksControlPanel',
		template: `
		<div class="tasks-control-panel">
			<div class="tasks-control-panel__bg"></div>
			<div class="tasks-control-panel__content">
				<slot />
			</div>
		</div>
	`
	};

	// @vue/component
	const TasksControlPanelSection = {
		name: 'TasksControlPanelSection',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		props: {
			controlItems: {
				type: Array,
				default: () => []
			}
		},
		setup() {
			return {
				Outline: ui_iconSet_api_vue.Outline
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
	`
	};

	// @vue/component
	const TasksControlPanelMenu = {
		name: 'TasksControlPanelMenu',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		props: {
			menuItems: {
				type: Array,
				default: () => []
			}
		},
		setup() {
			return {
				Outline: ui_iconSet_api_vue.Outline
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
	`
	};

	// @vue/component
	const TasksControlPanelInfo = {
		name: 'TasksControlPanelInfo',
		template: `
		<div class="tasks-control-panel-info">
			<slot />
		</div>
	`
	};

	exports.TasksControlPanel = TasksControlPanel;
	exports.TasksControlPanelInfo = TasksControlPanelInfo;
	exports.TasksControlPanelMenu = TasksControlPanelMenu;
	exports.TasksControlPanelSection = TasksControlPanelSection;

})(this.BX.Tasks.V2.Component = this.BX.Tasks.V2.Component || {}, BX.UI.IconSet);
//# sourceMappingURL=tasks-control-panel.bundle.js.map

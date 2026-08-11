/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
(function (exports, ui_iconSet_api_vue, ui_system_menu_vue, main_core, main_core_events, ui_iconSet_outline, tasks_taskModel, tasks_v2_const, tasks_v2_component_elements_hoverPill, tasks_v2_component_elements_hint, tasks_v2_provider_service_taskService, tasks_v2_provider_service_templateService, tasks_v2_lib_entitySelectorDialog, tasks_v2_lib_fieldHighlighter) {
	'use strict';

	const TemplatesButton = {
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			BMenu: ui_system_menu_vue.BMenu,
			HoverPill: tasks_v2_component_elements_hoverPill.HoverPill,
			Hint: tasks_v2_component_elements_hint.Hint
		},
		inject: {
			task: {}
		},
		setup() {
			return {
				Outline: ui_iconSet_api_vue.Outline
			};
		},
		data() {
			return {
				isMenuShown: false,
				isHintShown: false,
				hintContainer: null
			};
		},
		created() {
			this.keydownHandler = null;
		},
		beforeUnmount() {
			this.dialog?.destroy();
			this.unbindKeydownHandler();
		},
		computed: {
			menuOptions() {
				return {
					id: 'tasks-templates-button-menu',
					bindElement: this.$refs.button,
					items: this.menuItems
				};
			},
			menuItems() {
				return [{
					title: this.loc('TASKS_V2_TEMPLATES_SELECT_TEMPLATE'),
					icon: ui_iconSet_api_vue.Outline.CHEVRON_RIGHT_L,
					onClick: () => this.openTemplateSelector()
				}, {
					title: this.loc('TASKS_V2_TEMPLATES_SAVE_AS_TEMPLATE'),
					icon: ui_iconSet_api_vue.Outline.TEMPLATE_TASK,
					onClick: () => this.saveAsTemplate()
				}];
			},
			hintText() {
				return this.loc('TASKS_V2_TEMPLATE_TITLE_IS_EMPTY');
			}
		},
		methods: {
			unbindKeydownHandler() {
				if (!this.keydownHandler) {
					return;
				}
				main_core.Event.unbind(window, 'keydown', this.keydownHandler);
				this.keydownHandler = null;
			},
			hideHint() {
				this.isHintShown = false;
				this.unbindKeydownHandler();
			},
			openTemplateSelector() {
				const popupWidth = 385;
				const popupHeight = 385;
				this.dialog ??= new tasks_v2_lib_entitySelectorDialog.EntitySelectorDialog({
					context: 'tasks-card',
					width: popupWidth,
					height: popupHeight,
					multiple: false,
					enableSearch: true,
					dropdownMode: true,
					entities: [{
						id: tasks_v2_const.EntitySelectorEntity.TemplateCommon,
						options: {
							isFullListOpenable: true
						}
					}],
					preselectedItems: this.task.templateId ? [[tasks_v2_const.EntitySelectorEntity.TemplateCommon, this.task.templateId]] : [],
					popupOptions: {
						className: 'popup-window_entity-picker-no-check',
						events: {
							onClose: () => {
								const templateId = this.dialog.getSelectedItems()[0]?.getId();
								if (templateId > 0) {
									void tasks_v2_provider_service_taskService.taskService.updateStoreTask(this.task.id, {
										templateId
									});
								}
							}
						}
					}
				});
				this.dialog.showTo(this.$refs.button);
			},
			async saveAsTemplate() {
				if (this.task.title.trim() === '') {
					await this.handleEmptyTitle();
					return;
				}
				const [id, error] = await tasks_v2_provider_service_templateService.templateService.addFromTaskEntity(this.task);
				main_core_events.EventEmitter.emit(tasks_v2_const.EventName.NotifyTemplateCreated, {
					id,
					error
				});
			},
			async handleEmptyTitle() {
				await this.$nextTick();
				this.hintContainer = tasks_v2_lib_fieldHighlighter.fieldHighlighter.setContainer(this.$root.$el).addHighlight(tasks_v2_const.TaskField.Title).getFieldContainer(tasks_v2_const.TaskField.Title);
				this.hintContainer?.querySelector('textarea')?.focus();
				this.unbindKeydownHandler();
				this.keydownHandler = () => {
					this.hideHint();
				};
				main_core.Event.bind(window, 'keydown', this.keydownHandler);
				this.isHintShown = true;
			}
		},
		template: `
		<div ref="button">
			<HoverPill @click="isMenuShown = true">
				<div class="tasks-full-card-templates-button-container">
					<div class="tasks-full-card-templates-button-container-text">{{ loc('TASKS_V2_TEMPLATES') }}</div>
					<BIcon :name="Outline.CHEVRON_DOWN_L" color="var(--ui-color-design-plain-na-content)"/>
				</div>
			</HoverPill>
		</div>
		<BMenu v-if="isMenuShown" :options="menuOptions" @close="isMenuShown = false"/>
		<Hint v-if="isHintShown" :bindElement="hintContainer" @close="hideHint">
			{{ hintText }}
		</Hint>
	`
	};

	exports.TemplatesButton = TemplatesButton;

})(this.BX.Tasks.V2.Component = this.BX.Tasks.V2.Component || {}, BX.UI.IconSet, BX.UI.System.Menu, BX, BX.Event, window, BX.Tasks.TaskModel, BX.Tasks.V2.Const, BX.Tasks.V2.Component.Elements, BX.Tasks.V2.Component.Elements, BX.Tasks.V2.Provider.Service, BX.Tasks.V2.Provider.Service, BX.Tasks.V2.Lib, BX.Tasks.V2.Lib);
//# sourceMappingURL=templates-button.bundle.js.map

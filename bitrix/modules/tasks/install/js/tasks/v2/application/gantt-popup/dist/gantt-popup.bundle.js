/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
(function (exports, main_popup, ui_vue3, ui_vue3_mixins_locMixin, tasks_v2_core, ui_vue3_components_richLoc, ui_vue3_components_button, ui_system_input_vue, ui_system_typography_vue, ui_iconSet_api_vue, ui_iconSet_outline, tasks_v2_const, tasks_v2_lib_relationError, tasks_v2_lib_relationTasksDialog, tasks_v2_provider_service_relationService, ui_system_menu_vue, ui_vue3_components_popup) {
	'use strict';

	const sectionCodeHelp = 'help';

	// @vue/component
	const GanttMenu = {
		components: {
			BMenu: ui_system_menu_vue.BMenu
		},
		props: {
			type: {
				type: String,
				required: true
			},
			bindElement: {
				type: HTMLElement,
				required: true
			}
		},
		emits: ['update:type', 'close'],
		computed: {
			menuOptions() {
				return {
					bindElement: this.bindElement,
					sections: [{
						code: sectionCodeHelp
					}],
					closeOnItemClick: false,
					items: [...Object.keys(this.types).map(type => ({
						title: this.types[type].title,
						subtitle: this.types[type].description,
						isSelected: type === this.type,
						onClick: () => {
							this.$emit('update:type', type);
							this.$emit('close');
						}
					})), {
						sectionCode: sectionCodeHelp,
						design: ui_system_menu_vue.MenuItemDesign.Accent2,
						title: this.loc('TASKS_V2_GANTT_TYPE_HELP'),
						icon: ui_iconSet_api_vue.Outline.QUESTION,
						onClick: () => this.showHelpDesk()
					}],
					offsetTop: 4,
					targetContainer: this.bindElement.closest('body')
				};
			},
			types() {
				return {
					finish_start: {
						title: this.loc('TASKS_V2_GANTT_FINISH_START'),
						description: this.loc('TASKS_V2_GANTT_FINISH_START_DESCRIPTION')
					},
					start_start: {
						title: this.loc('TASKS_V2_GANTT_START_START'),
						description: this.loc('TASKS_V2_GANTT_START_START_DESCRIPTION')
					},
					start_finish: {
						title: this.loc('TASKS_V2_GANTT_START_FINISH'),
						description: this.loc('TASKS_V2_GANTT_START_FINISH_DESCRIPTION')
					},
					finish_finish: {
						title: this.loc('TASKS_V2_GANTT_FINISH_FINISH'),
						description: this.loc('TASKS_V2_GANTT_FINISH_FINISH_DESCRIPTION')
					}
				};
			}
		},
		methods: {
			showHelpDesk() {
				top.BX.Helper.show('redirect=detail&code=18100344');
			}
		},
		template: `
		<BMenu :options="menuOptions" @close="$emit('close')"/>
	`
	};

	// @vue/component
	const GanttPopupContent = {
		components: {
			RichLoc: ui_vue3_components_richLoc.RichLoc,
			UiButton: ui_vue3_components_button.Button,
			BIcon: ui_iconSet_api_vue.BIcon,
			BInput: ui_system_input_vue.BInput,
			HeadlineMd: ui_system_typography_vue.HeadlineMd,
			TextMd: ui_system_typography_vue.TextMd,
			TextXs: ui_system_typography_vue.TextXs,
			GanttMenu
		},
		inject: {
			analytics: {}
		},
		props: {
			taskId: {
				type: [Number, String],
				required: true
			},
			close: {
				type: Function,
				required: true
			},
			freeze: {
				type: Function,
				required: true
			},
			unfreeze: {
				type: Function,
				required: true
			},
			updated: {
				type: Function,
				default: null
			}
		},
		setup() {
			return {
				AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
				ButtonSize: ui_vue3_components_button.ButtonSize,
				Outline: ui_iconSet_api_vue.Outline
			};
		},
		data() {
			return {
				task: null,
				type: 'finish_start',
				isMenuShown: false,
				error: null
			};
		},
		computed: {
			typeTitle() {
				return {
					finish_start: this.loc('TASKS_V2_GANTT_FINISH_START'),
					start_start: this.loc('TASKS_V2_GANTT_START_START'),
					start_finish: this.loc('TASKS_V2_GANTT_START_FINISH'),
					finish_finish: this.loc('TASKS_V2_GANTT_FINISH_FINISH')
				}[this.type];
			}
		},
		methods: {
			showDialog() {
				this.freeze();
				this.handleClose = this.handleDialogClose;
				tasks_v2_lib_relationTasksDialog.ganttDialog.show({
					targetNode: this.$refs.task.$refs.inputContainer,
					targetContainer: this.$refs.task.$el.closest('body'),
					taskId: this.taskId,
					ids: this.task ? [this.task.id] : [],
					analytics: this.analytics,
					onClose: items => this.handleClose?.(items[0])
				});
			},
			clearTask() {
				this.handleClose = null;
				this.task = null;
				this.error = null;
			},
			handleDialogClose(item) {
				this.unfreeze();
				if (this.task && item && this.task.id === item.getId()) {
					return;
				}
				this.task = item ? {
					id: item.getId(),
					title: item.getTitle()
				} : null;
				this.error = null;
				if (this.task) {
					void this.checkDependence(this.task.id);
				}
			},
			showMenu() {
				this.isMenuShown = true;
				this.freeze();
			},
			hideMenu() {
				this.isMenuShown = false;
				this.unfreeze();
			},
			showHelpDesk() {
				top.BX.Helper.show('redirect=detail&code=18127718');
			},
			async checkDependence(dependentId) {
				this.error = await tasks_v2_provider_service_relationService.ganttService.checkDependence({
					taskId: this.taskId,
					dependentId
				});
			},
			async handleAdd() {
				this.close();
				const error = await tasks_v2_provider_service_relationService.ganttService.addDependence({
					taskId: this.taskId,
					dependentId: this.task.id,
					type: this.type
				});
				if (error) {
					void tasks_v2_lib_relationError.relationError.setTaskId(this.taskId).showError(error, tasks_v2_const.TaskField.Gantt);
					return;
				}
				this.updated?.();
			}
		},
		template: `
		<div class="tasks-field-gantt-popup">
			<div class="tasks-field-gantt-popup-header">
				<HeadlineMd>{{ loc('TASKS_V2_GANTT_POPUP_TITLE') }}</HeadlineMd>
				<BIcon :name="Outline.CROSS_L" hoverable @click="close"/>
			</div>
			<TextMd className="tasks-field-gantt-popup-description">
				<RichLoc :text="loc('TASKS_V2_GANTT_POPUP_DESCRIPTION')" placeholder="[helpdesk]">
					<template #helpdesk="{ text }">
						<span class="tasks-field-gantt-popup-description-help" @click="showHelpDesk">
							<BIcon :name="Outline.KNOWLEDGE_BASE"/>
							<TextXs>{{ text }}</TextXs>
						</span>
					</template>
				</RichLoc>
			</TextMd>
			<BInput
				:modelValue="task?.title ?? ''"
				:label="loc('TASKS_V2_GANTT_POPUP_TASK')"
				dropdown
				:withClear="Boolean(task)"
				clickable
				:error
				ref="task"
				@click="showDialog"
				@clear="clearTask"
			/>
			<BInput
				:modelValue="typeTitle"
				:label="loc('TASKS_V2_GANTT_POPUP_TYPE')"
				dropdown
				clickable
				:active="isMenuShown"
				ref="type"
				@click="showMenu"
			/>
			<div class="tasks-field-gantt-popup-buttons">
				<UiButton
					:text="loc('TASKS_V2_GANTT_POPUP_ADD')"
					:style="AirButtonStyle.PRIMARY"
					:size="ButtonSize.LARGE"
					:disabled="Boolean(!task || error)"
					@click="handleAdd"
				/>
				<UiButton
					:text="loc('TASKS_V2_GANTT_POPUP_CANCEL')"
					:style="AirButtonStyle.OUTLINE"
					:size="ButtonSize.LARGE"
					@click="close"
				/>
			</div>
		</div>
		<GanttMenu v-if="isMenuShown" v-model:type="type" :bindElement="$refs.type.$refs.inputContainer" @close="hideMenu"/>
	`
	};

	const popupId = 'tasks-gantt-popup';
	class GanttPopupApi {
		#params;
		#popup;
		#application;
		#onUpdate = null;
		constructor(params = {}) {
			this.#params = params;
		}
		onUpdate(callback) {
			this.#onUpdate = callback;
		}
		async showTo(bindElement, targetContainer) {
			if (main_popup.PopupManager.getPopupById(popupId)) {
				return;
			}
			const content = document.createElement('div');
			await this.#mountApplication(content);
			this.#popup = new main_popup.Popup({
				id: popupId,
				content,
				bindElement,
				targetContainer,
				padding: 14,
				width: 470,
				offsetTop: 4,
				cacheable: false,
				autoHide: true,
				closeByEsc: true,
				animation: 'fading',
				bindOptions: {
					forceBindPosition: true
				},
				events: {
					onAfterClose: () => this.#unmountApplication()
				}
			});
			this.#popup.show();
		}
		destroy() {
			main_popup.PopupManager.getPopupById(popupId)?.destroy();
		}
		async #mountApplication(container) {
			await tasks_v2_core.Core.init();
			const application = ui_vue3.BitrixVue.createApp(GanttPopupContent, {
				...this.#params,
				close: () => this.#popup.close(),
				freeze: () => {
					this.#popup.setAutoHide(false);
					this.#popup.setClosingByEsc(false);
				},
				unfreeze: () => {
					this.#popup.setAutoHide(true);
					this.#popup.setClosingByEsc(true);
				},
				updated: this.#onUpdate
			});
			application.mixin(ui_vue3_mixins_locMixin.locMixin);
			application.mount(container);
			this.#application = application;
		}
		#unmountApplication() {
			this.#application.unmount();
		}
	}

	// @vue/component
	const GanttPopup = {
		name: 'TaskGanttPopup',
		components: {
			Popup: ui_vue3_components_popup.Popup,
			GanttPopupContent
		},
		inject: {
			taskId: {}
		},
		props: {
			bindElement: {
				type: HTMLElement,
				required: true
			}
		},
		emits: ['close'],
		computed: {
			options() {
				return {
					className: 'tasks-field-gantt-popup-container',
					bindElement: this.bindElement,
					padding: 14,
					width: 470,
					targetContainer: document.body
				};
			}
		},
		template: `
		<Popup
			v-slot="{ freeze, unfreeze }"
			:options
			@close="$emit('close')"
		>
			<GanttPopupContent
				:taskId
				:close="() => $emit('close')"
				:freeze
				:unfreeze
			/>
		</Popup>
	`
	};

	exports.GanttMenu = GanttMenu;
	exports.GanttPopup = GanttPopup;
	exports.GanttPopupApi = GanttPopupApi;

})(this.BX.Tasks.V2.Application = this.BX.Tasks.V2.Application || {}, BX.Main, BX.Vue3, BX.Vue3.Mixins, BX.Tasks.V2, BX.UI.Vue3.Components, BX.Vue3.Components, BX.UI.System.Input.Vue, BX.UI.System.Typography.Vue, BX.UI.IconSet, window, BX.Tasks.V2.Const, BX.Tasks.V2.Lib, BX.Tasks.V2.Lib, BX.Tasks.V2.Provider.Service, BX.UI.System.Menu, BX.UI.Vue3.Components);
//# sourceMappingURL=gantt-popup.bundle.js.map

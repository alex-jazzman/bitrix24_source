/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
(function (exports, main_core, ui_iconSet_api_vue, ui_iconSet_outline, tasks_v2_const, ui_vue3_vuex, tasks_v2_core, tasks_v2_lib_entitySelectorDialog, tasks_v2_lib_showLimit, tasks_v2_lib_idUtils, tasks_v2_provider_service_taskService, tasks_v2_provider_service_relationService, ui_notificationManager, ui_system_typography_vue, ui_system_menu_vue, tasks_v2_application_taskCard, tasks_v2_component_fields_deadline, tasks_v2_component_fields_responsible, tasks_v2_lib_analytics, tasks_v2_provider_service_templateService, tasks_v2_provider_service_statusService, tasks_v2_lib_onboardingBanners, tasks_v2_component_elements_hoverPill, tasks_v2_application_ganttPopup, ui_system_skeleton_vue) {
	'use strict';

	// @vue/component
	const Gantt = {
		components: {
			HoverPill: tasks_v2_component_elements_hoverPill.HoverPill,
			GanttMenu: tasks_v2_application_ganttPopup.GanttMenu,
			TextMd: ui_system_typography_vue.TextMd
		},
		inject: {
			parentTaskId: 'taskId'
		},
		props: {
			taskId: {
				type: [Number, String],
				required: true
			}
		},
		data() {
			return {
				isMenuShown: false
			};
		},
		computed: {
			ganttLink() {
				return this.$store.getters[`${tasks_v2_const.Model.GanttLinks}/getLink`]({
					taskId: this.parentTaskId,
					dependentId: this.taskId
				});
			},
			type: {
				get() {
					return this.ganttLink?.type;
				},
				set(type) {
					void tasks_v2_provider_service_relationService.ganttService.updateDependence({
						taskId: this.parentTaskId,
						dependentId: this.taskId,
						type
					});
				}
			},
			typeTitle() {
				return this.loc({
					finish_start: 'TASKS_V2_GANTT_FINISH_START',
					start_start: 'TASKS_V2_GANTT_START_START',
					start_finish: 'TASKS_V2_GANTT_START_FINISH',
					finish_finish: 'TASKS_V2_GANTT_FINISH_FINISH'
				}[this.type]);
			}
		},
		template: `
		<HoverPill textOnly noOffset ref="type" @click="isMenuShown = true">
			<TextMd>{{ typeTitle }}</TextMd>
		</HoverPill>
		<GanttMenu v-if="isMenuShown" v-model:type="type" :bindElement="$refs.type.$el" @close="isMenuShown = false"/>
	`
	};

	// @vue/component
	const TaskLineExpandToggle = {
		components: {
			Text2Xs: ui_system_typography_vue.Text2Xs,
			BIcon: ui_iconSet_api_vue.BIcon
		},
		props: {
			text: {
				type: String,
				required: true
			},
			icon: {
				type: String,
				required: true
			},
			extraPadding: {
				type: Boolean,
				default: false
			},
			ariaExpanded: {
				type: Boolean,
				default: null
			},
			ariaHaspopup: {
				type: String,
				default: ''
			}
		},
		template: `
		<button
			type="button"
			class="tasks-task-line-expand-toggle"
			:class="{ '--extra-padding': extraPadding }"
			:aria-expanded="ariaExpanded"
			:aria-haspopup="ariaHaspopup || null"
		>
			<Text2Xs class="tasks-task-line-expand-toggle-text">{{ text }}</Text2Xs>
			<BIcon :name="icon" aria-hidden="true"/>
		</button>
	`
	};

	const sectionStatus = 'sectionStatus';
	const sectionBase = 'sectionBase';
	const sectionRemove = 'sectionRemove';

	// SC-005: the hover popup extension is loaded lazily on the first qualifying hover —
	// only a new user hovering a self-owned deadlineless row ever needs it, so it must not
	// sit in the task-list rel and must not be built for every row. The promise is cached
	// module-wide so large lists load the extension at most once. On failure the cached
	// promise is dropped (and the error rethrown), so a rejected load is not memoized: a
	// later hover retries instead of re-awaiting a permanently rejected promise. The consumer
	// swallows the rejection, so a failed hover never surfaces as an unhandled rejection.
	let deadlinelessHintExtensionPromise = null;
	function loadDeadlinelessHint() {
		deadlinelessHintExtensionPromise ??= main_core.Runtime.loadExtension('tasks.v2.component.onboarding.deadlineless-hint').catch(error => {
			deadlinelessHintExtensionPromise = null;
			throw error;
		});
		return deadlinelessHintExtensionPromise;
	}

	// @vue/component
	const TaskLine = {
		components: {
			TextMd: ui_system_typography_vue.TextMd,
			BIcon: ui_iconSet_api_vue.BIcon,
			BMenu: ui_system_menu_vue.BMenu,
			Responsible: tasks_v2_component_fields_responsible.Responsible,
			Deadline: tasks_v2_component_fields_deadline.Deadline,
			Gantt,
			TaskLineExpandToggle
		},
		inject: {
			settings: {},
			analytics: {},
			fields: {},
			shouldShowSubTasksOption: {},
			isTemplateEntities: {}
		},
		props: {
			taskId: {
				type: [Number, String],
				required: true
			},
			isExpanded: {
				type: Boolean,
				default: false
			},
			isSubTask: {
				type: Boolean,
				default: false
			},
			isLastSubTask: {
				type: Boolean,
				default: false
			}
		},
		emits: ['remove', 'toggleSubTasks'],
		setup() {
			return {
				Outline: ui_iconSet_api_vue.Outline,
				// SC-005 hover popup adapter; imperative, driven by this line.
				deadlinelessHint: null
			};
		},
		data() {
			return {
				isMenuShown: false,
				isHovered: false
			};
		},
		computed: {
			...ui_vue3_vuex.mapGetters({
				taskListOptions: `${tasks_v2_const.Model.Interface}/taskListOptions`
			}),
			task() {
				return tasks_v2_provider_service_taskService.taskService.getStoreTask(this.taskId);
			},
			isTemplate() {
				return tasks_v2_lib_idUtils.idUtils.isTemplate(this.taskId);
			},
			// ALG-02 (NORMATIVE): mark (warning badge, see template + css) a deadlineless row
			// owned by the current user, but only inside the «new user» onboarding segment.
			// Derived from row data only — no closed state is stored (AC-023), no extra server
			// fetch (ADR invariant).
			isDeadlinelessOwnedHint() {
				if (this.isTemplate) {
					return false;
				}
				const isNewUser = tasks_v2_lib_onboardingBanners.onboardingBanners.isNewUser;
				const currentUserId = tasks_v2_core.Core.getParams().currentUser?.id;
				return isNewUser && !this.task.deadlineTs // "No deadline"
				&& Number(this.task.creatorId) === Number(currentUserId) // I am the creator
				&& this.canChangeDeadline // the deadline must actually be settable on this row
	;
			},
			// ALG-02 gate: the badge/hint + its OpenDeadlinePicker CTA must appear only when the
			// user can really open the picker for this row. Mirrors the compact-mode `readonly`
			// of the nested Deadline field (deadline.js): the field is read-only — and its CTA a
			// no-op — without the `deadline` right or in a completed / supposedly-completed /
			// deferred status. The deadline-change-limit and flow-auto-deadline branches of that
			// `readonly` never apply here (the predicate already requires the current user to be
			// the creator, and list rows are always saved tasks), so they are omitted.
			canChangeDeadline() {
				const readonlyStatuses = [tasks_v2_const.TaskStatus.Completed, tasks_v2_const.TaskStatus.SupposedlyCompleted, tasks_v2_const.TaskStatus.Deferred];
				return Boolean(this.task.rights?.deadline) && !readonlyStatuses.includes(this.task.status);
			},
			rights() {
				return this.task.rights;
			},
			completed() {
				return this.task.status === tasks_v2_const.TaskStatus.Completed;
			},
			href() {
				const path = String(this.taskId).startsWith('tmp.') ? tasks_v2_application_taskCard.TaskCard.getUrl(tasks_v2_lib_idUtils.idUtils.boxTemplate(this.taskId.replace('tmp.', ''))) : tasks_v2_application_taskCard.TaskCard.getUrl(this.taskId);
				return `${window.location.origin}${path}`;
			},
			menuOptions() {
				return () => ({
					id: `tasks-line-menu-${this.taskId}`,
					bindElement: this.$refs.moreIcon,
					offsetTop: 8,
					sections: this.menuSections,
					items: this.menuItems,
					targetContainer: document.body,
					closeByEsc: true,
					autoHide: true
				});
			},
			menuItems() {
				return [...this.statusMenuItems, ...this.baseMenuItems, ...this.removeMenuItems].filter(Boolean);
			},
			menuSections() {
				return [this.statusMenuItems.length > 0 && {
					code: sectionStatus
				}, {
					code: sectionBase
				}, this.removeMenuItems.length > 0 && {
					code: sectionRemove
				}].filter(Boolean);
			},
			statusMenuItems() {
				if (this.isTemplate) {
					return [];
				}
				const statusActionsMap = {
					[tasks_v2_const.TaskStatus.Pending]: [this.rights.start && this.getStartItem(), this.rights.complete && this.getCompleteItem(), this.rights.defer && this.getDeferItem()],
					[tasks_v2_const.TaskStatus.InProgress]: [this.rights.pause && this.getPauseItem(), this.rights.complete && this.getCompleteItem()],
					[tasks_v2_const.TaskStatus.SupposedlyCompleted]: [this.rights.renew && this.getRenewItem(), this.rights.complete && this.getCompleteItem()],
					[tasks_v2_const.TaskStatus.Deferred]: [this.rights.renew && this.getResumeItem(), this.rights.complete && this.getCompleteItem()],
					[tasks_v2_const.TaskStatus.Completed]: [this.rights.renew && this.getResumeItem()]
				};
				return statusActionsMap[this.task.status]?.filter(Boolean) ?? [];
			},
			baseMenuItems() {
				return [this.getCopyLinkItem(), this.getSubCreateItem()];
			},
			removeMenuItems() {
				return [this.canDetach && this.getRemoveItem(), this.rights.remove && this.getDeleteItem()].filter(Boolean);
			},
			canDetach() {
				const {
					detachParent,
					detachRelated,
					changeDependence
				} = this.task.rights;
				return detachParent || detachRelated || changeDependence;
			},
			subTaskIds() {
				return tasks_v2_provider_service_relationService.subTasksService.getSortedIds(this.taskId, this.task?.subTaskIds ?? [], this.taskListOptions.showCompletedSubTasks, this.isTemplateEntities);
			},
			countSubTasks() {
				return this.subTaskIds.length;
			},
			hasSubTasks() {
				return this.shouldShowSubTasksOption && this.countSubTasks > 0;
			},
			sideIconClass() {
				return this.isLastSubTask ? '--last' : '--side';
			},
			showSubTasksOption() {
				return this.isTemplate ? this.taskListOptions.showSubTemplates : this.taskListOptions.showSubTasks;
			},
			showExpand() {
				return this.shouldShowSubTasksOption && this.showSubTasksOption && this.hasSubTasks && !this.isExpanded;
			},
			expandTitle() {
				if (this.isTemplate) {
					return main_core.Loc.getMessagePlural('TASKS_V2_TASK_LINE_SUBTEMPLATE', this.countSubTasks, {
						'#NUM#': this.countSubTasks
					});
				}
				return main_core.Loc.getMessagePlural('TASKS_V2_TASK_LINE_SUBTASK', this.countSubTasks, {
					'#NUM#': this.countSubTasks
				});
			},
			expandIcon() {
				return this.isSubTask ? ui_iconSet_api_vue.Outline.CHEVRON_RIGHT_M : ui_iconSet_api_vue.Outline.CHEVRON_DOWN_M;
			},
			menuLabel() {
				return this.isTemplate ? this.loc('TASKS_V2_TASK_LINE_TEMPLATE_MENU_ARIA_LABEL') : this.loc('TASKS_V2_TASK_LINE_MENU_ARIA_LABEL');
			}
		},
		beforeUnmount() {
			// Guards the async handleHintMouseEnter() continuation from creating a popup for a
			// line that has already unmounted (list re-render while the extension was loading).
			this.isUnmounted = true;
			this.deadlinelessHint?.destroy();
			this.deadlinelessHint = null;
		},
		methods: {
			// SC-005: on the first qualifying hover, lazy-load the hover popup extension and
			// show it. The isDeadlinelessOwnedHint predicate gates BEFORE any load, so only a
			// new user's self-owned deadlineless row ever fetches the extension (RF2-7). The
			// hover-intent close delay (300 ms) stays inside DeadlinelessHint.
			async handleHintMouseEnter() {
				if (!this.isDeadlinelessOwnedHint) {
					return;
				}
				this.isHovered = true;
				if (this.deadlinelessHint) {
					this.deadlinelessHint.tryShow();
					return;
				}

				// Best-effort: if the hover popup extension fails to load, silently skip
				// (mirrors onboardingBanners.setViewed()); loadDeadlinelessHint() dropped the
				// cached rejection so a later hover retries.
				const hintModule = await loadDeadlinelessHint().catch(() => null);

				// The cursor may have left (or the line unmounted) while loading: do not pop
				// the hint if the load failed or the hover is no longer active.
				if (!hintModule || this.isUnmounted || !this.isHovered) {
					return;
				}
				const {
					DeadlinelessHint
				} = hintModule;

				// hover popup anchored to the deadline field cell (where the SC-005 badge lives),
				// matching the kanban/grid surfaces; falls back to the title cell if the deadline
				// column is hidden.
				this.deadlinelessHint ??= new DeadlinelessHint(this.taskId, () => this.$refs.deadlineField ?? this.$refs.titleWrapper, () => this.sendDeadlinelessHintAnalytics(tasks_v2_const.Analytics.Event.ClickSuggestBanner), () => this.sendDeadlinelessHintAnalytics(tasks_v2_const.Analytics.Event.CloseSuggestBanner));
				this.deadlinelessHint.tryShow();
			},
			handleHintMouseLeave() {
				this.isHovered = false;
				this.deadlinelessHint?.scheduleClose();
			},
			// SC-005 events 1-2: the deadlineless hint is a notification, not a card banner, so it
			// sends type=notification and no c_element. c_sub_section is fixed to `list` for the
			// V2 list; c_section comes from the mount context (omitted when absent).
			sendDeadlinelessHintAnalytics(event) {
				tasks_v2_lib_analytics.analytics.sendBannerInteraction({
					context: this.analytics?.context,
					additionalContext: tasks_v2_const.Analytics.SubSection.List
				}, {
					event,
					type: tasks_v2_const.Analytics.Type.Notification
				});
			},
			getStartItem() {
				return {
					sectionCode: sectionStatus,
					title: this.loc('TASKS_V2_TASK_LINE_START_ACTION'),
					icon: ui_iconSet_api_vue.Outline.NEXT,
					dataset: {
						id: `tasks-line-menu-start-${this.taskId}`
					},
					onClick: () => tasks_v2_provider_service_statusService.statusService.start(this.taskId)
				};
			},
			getPauseItem() {
				return {
					sectionCode: sectionStatus,
					title: this.loc('TASKS_V2_TASK_LINE_PAUSE_ACTION'),
					icon: ui_iconSet_api_vue.Outline.HOURGLASS,
					dataset: {
						id: `tasks-line-menu-pause-${this.taskId}`
					},
					onClick: () => tasks_v2_provider_service_statusService.statusService.pause(this.taskId)
				};
			},
			getCompleteItem() {
				return {
					sectionCode: sectionStatus,
					title: this.loc('TASKS_V2_TASK_LINE_COMPLETE_ACTION'),
					icon: ui_iconSet_api_vue.Outline.CHECK_L,
					dataset: {
						id: `tasks-line-menu-complete-${this.taskId}`
					},
					onClick: async () => {
						const error = await tasks_v2_provider_service_statusService.statusService.complete(this.taskId, {
							context: tasks_v2_const.Analytics.Section.Tasks,
							additionalContext: tasks_v2_const.Analytics.SubSection.TaskCard
						}, false);
						if (error) {
							ui_notificationManager.Notifier.notifyViaBrowserProvider({
								id: 'task-line-notify-error-complete',
								text: error.message
							});
						}
					}
				};
			},
			getDeferItem() {
				return {
					sectionCode: sectionStatus,
					title: this.loc('TASKS_V2_TASK_LINE_DEFER_ACTION'),
					icon: ui_iconSet_api_vue.Outline.PAUSE_L,
					dataset: {
						id: `tasks-line-menu-defer-${this.taskId}`
					},
					onClick: () => tasks_v2_provider_service_statusService.statusService.defer(this.taskId)
				};
			},
			getRenewItem() {
				return {
					sectionCode: sectionStatus,
					title: this.loc('TASKS_V2_TASK_LINE_RENEW_ACTION'),
					icon: ui_iconSet_api_vue.Outline.UNDO,
					dataset: {
						id: `tasks-line-menu-renew-${this.taskId}`
					},
					onClick: () => tasks_v2_provider_service_statusService.statusService.renew(this.taskId)
				};
			},
			getResumeItem() {
				return {
					sectionCode: sectionStatus,
					title: this.loc('TASKS_V2_TASK_LINE_RESUME_ACTION'),
					icon: ui_iconSet_api_vue.Outline.UNDO,
					dataset: {
						id: `tasks-line-menu-resume-${this.taskId}`
					},
					onClick: () => tasks_v2_provider_service_statusService.statusService.renew(this.taskId)
				};
			},
			getCopyLinkItem() {
				return {
					sectionCode: sectionBase,
					title: this.loc('TASKS_V2_TASK_LINE_COPY_LINK_ACTION'),
					icon: ui_iconSet_api_vue.Outline.COPY,
					dataset: {
						id: `tasks-line-menu-copy-link-${this.taskId}`
					},
					onClick: () => {
						const isCopyingSuccess = BX.clipboard.copy(this.href);
						if (isCopyingSuccess) {
							ui_notificationManager.Notifier.notifyViaBrowserProvider({
								id: 'task-line-notify-copy-link',
								text: this.loc('TASKS_V2_TASK_LINE_COPY_LINK_NOTIFICATION')
							});
						}
					}
				};
			},
			getSubCreateItem() {
				return this.isTemplate ? this.getSubTemplateCreateItem() : this.getSubTaskCreateItem();
			},
			getSubTemplateCreateItem() {
				if (!this.settings.rights.templates.create) {
					return null;
				}
				const isLocked = !this.settings.restrictions.templatesSubtasks.available;
				return {
					sectionCode: sectionBase,
					title: this.loc('TASKS_V2_TASK_LINE_TEMPLATE_SUBTASK_CREATE_ACTION'),
					icon: ui_iconSet_api_vue.Outline.RELATED_TASKS,
					dataset: {
						id: `tasks-line-menu-add-subtemplate-${this.taskId}`
					},
					onClick: () => {
						if (isLocked) {
							void tasks_v2_lib_showLimit.showLimit({
								featureId: this.settings.restrictions.templatesSubtasks.featureId
							});
							return;
						}
						tasks_v2_application_taskCard.TaskCard.showCompactCard({
							taskId: 'template0',
							groupId: this.task.groupId,
							parentId: this.taskId
						});
					}
				};
			},
			getSubTaskCreateItem() {
				if (!this.rights.createSubtask) {
					return null;
				}
				return {
					sectionCode: sectionBase,
					title: this.loc('TASKS_V2_TASK_LINE_SUBTASK_CREATE_ACTION'),
					icon: ui_iconSet_api_vue.Outline.RELATED_TASKS,
					dataset: {
						id: `tasks-line-menu-add-subtask-${this.taskId}`
					},
					onClick: () => {
						tasks_v2_application_taskCard.TaskCard.showCompactCard({
							groupId: this.task.groupId,
							parentId: this.taskId,
							analytics: {}
						});
					}
				};
			},
			getRemoveItem() {
				return {
					sectionCode: sectionRemove,
					title: this.loc('TASKS_V2_TASK_LINE_REMOVE_ACTION'),
					icon: ui_iconSet_api_vue.Outline.CROSS_L,
					dataset: {
						id: `tasks-line-menu-remove-${this.taskId}`
					},
					onClick: () => {
						this.$emit('remove');
					}
				};
			},
			getDeleteItem() {
				const title = this.isTemplate ? this.loc('TASKS_V2_TASK_LINE_DELETE_TEMPLATE_ACTION') : this.loc('TASKS_V2_TASK_LINE_DELETE_TASK_ACTION');
				return {
					title,
					sectionCode: sectionRemove,
					icon: ui_iconSet_api_vue.Outline.TRASHCAN,
					design: ui_system_menu_vue.MenuItemDesign.Alert,
					dataset: {
						id: `tasks-line-menu-delete-${this.taskId}`
					},
					onClick: () => {
						if (this.isTemplate) {
							void tasks_v2_provider_service_templateService.templateService.delete(this.taskId);
						} else {
							void tasks_v2_provider_service_taskService.taskService.delete(this.taskId);
						}
					}
				};
			},
			handleMenuClose() {
				this.isMenuShown = false;
				this.$refs.moreIcon?.focus();
			}
		},
		template: `
		<div
			class="tasks-task-line-title-container-wrapper"
			:class="{ '--expanded': isExpanded }"
			ref="titleWrapper"
			@mouseenter="handleHintMouseEnter"
			@mouseleave="handleHintMouseLeave"
		>
			<div v-if="isSubTask" class="tasks-task-line-side-icon" :class="sideIconClass"/>
			<div 
				class="tasks-task-line-title-container"
				:class="{ 
					'--sub-task': isSubTask,
					'--sub-task-with-expanded': isSubTask && showExpand,
				}"
			>
				<TextMd
					class="tasks-task-line-title print-white-space-normal"
					:title="task.title"
				>
					<a
						class="tasks-task-line-title-href print-font-color-base-1"
						:class="{ '--completed': completed }"
						:href
					>
						{{ task.title }}
					</a>
				</TextMd>
				<TaskLineExpandToggle
					v-if="showExpand"
					:text="expandTitle"
					:icon="expandIcon"
					:ariaExpanded="isSubTask ? null : isExpanded"
					:ariaHaspopup="isSubTask ? 'dialog' : ''"
					:data-testid="isSubTask ? 'task-line-drill-btn' : 'task-line-expand-toggle'"
					@click="$emit('toggleSubTasks')"
				/>
			</div>
		</div>
		<div
			v-if="fields.has('responsible')"
			class="tasks-task-line-field"
			:class="{ '--expanded': isExpanded }"
		>
			<Responsible :taskId avatarOnly/>
		</div>
		<div
			v-if="fields.has('deadline')"
			class="tasks-task-line-field"
			:class="{ '--expanded': isExpanded, '--deadlineless-hint': isDeadlinelessOwnedHint }"
			ref="deadlineField"
			@mouseenter="handleHintMouseEnter"
			@mouseleave="handleHintMouseLeave"
		>
			<Deadline :taskId :isTemplate compact/>
			<div v-if="isDeadlinelessOwnedHint" class="tasks-task-line-deadlineless-badge" aria-hidden="true"/>
		</div>
		<div
			v-if="fields.has('gantt')"
			class="tasks-task-line-field"
			:class="{ '--expanded': isExpanded }"
		>
			<Gantt :taskId/>
		</div>
		<button
			type="button"
			class="tasks-task-line-more print-ignore"
			data-testid="task-line-menu-btn"
			:data-task-id="taskId"
			:class="{ '--expanded': isExpanded }"
			:aria-label="menuLabel"
			aria-haspopup="menu"
			:aria-expanded="isMenuShown"
			@click="isMenuShown = true"
			ref="moreIcon"
		>
			<BIcon :name="Outline.MORE_L" hoverable aria-hidden="true"/>
		</button>
		<BMenu v-if="isMenuShown" :options="menuOptions()" @close="handleMenuClose"/>
	`
	};

	// @vue/component
	const TaskLineSkeleton = {
		components: {
			BLine: ui_system_skeleton_vue.BLine,
			BCircle: ui_system_skeleton_vue.BCircle
		},
		inject: {
			fields: {}
		},
		props: {
			isSubTask: {
				type: Boolean,
				default: false
			},
			isLastSubTask: {
				type: Boolean,
				default: false
			}
		},
		computed: {
			sideIconClass() {
				return this.isLastSubTask ? '--last' : '--side';
			}
		},
		template: `
		<div class="tasks-task-line-title-container-wrapper" :class="{ '--sub-task': isSubTask }" aria-hidden="true">
			<div v-if="isSubTask" class="tasks-task-line-side-icon" :class="sideIconClass"/>
			<BLine :width="200" :height="10" :style="{ 'margin-left': isSubTask ? '12px' : 0 }"/>
		</div>
		<div v-if="fields.size === 2" class="tasks-task-line-field" aria-hidden="true">
			<BCircle :size="24" style="margin-left: 2px"/>
		</div>
		<div class="tasks-task-line-field" aria-hidden="true">
			<BLine :width="80" :height="12" style="margin: 0 10px"/>
		</div>
		<div class="tasks-task-line-more" aria-hidden="true">
			<BCircle :size="20"/>
		</div>
	`
	};

	// @vue/component
	const TaskLineGroup = {
		components: {
			TaskLine,
			TaskLineSkeleton,
			TaskLineExpandToggle
		},
		inject: {
			fields: {},
			settings: {},
			shouldShowSubTasksOption: {},
			isTemplateEntities: {}
		},
		props: {
			taskId: {
				type: [Number, String],
				required: true
			},
			isLoading: {
				type: Boolean,
				default: false
			}
		},
		emits: ['remove'],
		setup() {
			return {
				Outline: ui_iconSet_api_vue.Outline
			};
		},
		data() {
			return {
				isExpanded: false
			};
		},
		computed: {
			...ui_vue3_vuex.mapGetters({
				taskListOptions: `${tasks_v2_const.Model.Interface}/taskListOptions`
			}),
			task() {
				return tasks_v2_provider_service_taskService.taskService.getStoreTask(this.taskId);
			},
			isTemplate() {
				return tasks_v2_lib_idUtils.idUtils.isTemplate(this.taskId);
			},
			subTaskIds() {
				return tasks_v2_provider_service_relationService.subTasksService.getSortedIds(this.taskId, this.task?.subTaskIds ?? [], this.taskListOptions.showCompletedSubTasks, this.isTemplateEntities);
			},
			showSubTasksOption() {
				return this.isTemplate ? this.taskListOptions.showSubTemplates : this.taskListOptions.showSubTasks;
			},
			showSubTasks() {
				return this.shouldShowSubTasksOption && this.showSubTasksOption && this.subTaskIds.length > 0 && this.isExpanded;
			},
			loadingSubTaskIds() {
				return this.subTaskIds.filter(id => !tasks_v2_provider_service_relationService.subTasksService.hasStoreTask(id));
			},
			hasUnloadedSubTasks() {
				return this.loadingSubTaskIds.length > 0;
			},
			isTaskLineExpanded() {
				return this.showSubTasks && this.isExpanded;
			}
		},
		methods: {
			async toggleExpand() {
				if (this.isExpanded) {
					const parentWrapper = this.getGroupRowWrappers()[0] ?? null;
					this.isExpanded = false;
					await this.$nextTick();
					this.focusParentTrigger(parentWrapper);
					return;
				}
				this.isExpanded = true;
				try {
					if (this.hasUnloadedSubTasks) {
						await tasks_v2_provider_service_relationService.subTasksService.listByIds(this.taskId, this.subTaskIds);
					}
				} finally {
					// The expand trigger left the DOM the moment the group opened, so the focus has to
					// land back on the group even when the request failed - but only if the user has not
					// picked another control while waiting for the answer.
					await this.$nextTick();
					if (tasks_v2_lib_entitySelectorDialog.isFocusLost()) {
						this.focusFirstSubTask();
					}
				}
			},
			openSubTaskGrid(taskId) {
				const isLocked = this.isTemplate ? !this.settings.restrictions.templatesSubtasks.available : false;
				if (isLocked) {
					void tasks_v2_lib_showLimit.showLimit({
						featureId: this.settings.restrictions.templatesSubtasks.featureId
					});
					return;
				}
				const userId = tasks_v2_core.Core.getParams().currentUser.id;
				const gridPath = this.isTemplate ? this.settings.paths.userTemplateListPathTemplate.replace('#user_id#', userId) : this.settings.paths.userListTaskPathTemplate.replace('#user_id#', userId);
				const relationType = this.isTemplate ? 'subTemplates' : 'subTasks';
				const relationToId = tasks_v2_lib_idUtils.idUtils.unbox(taskId);
				const urlParams = new URLSearchParams({
					relationToId,
					relationType
				});
				BX.SidePanel.Instance.open(`${gridPath}?${urlParams}`, {
					newWindowLabel: false,
					copyLinkLabel: false
				});
			},
			isLastSubTask(subTaskId) {
				return this.subTaskIds[this.subTaskIds.length - 1] === subTaskId;
			},
			async removeSubTask(subTaskId) {
				const target = this.getRemovalFocusTarget(subTaskId);
				void tasks_v2_provider_service_relationService.subTasksService.delete(this.taskId, [subTaskId]);
				await this.$nextTick();
				target?.focus?.();
			},
			getGroupRowWrappers() {
				const anchor = this.$refs.collapseToggle?.$el;
				if (!anchor) {
					return [];
				}
				const wrappers = [];
				let node = anchor.previousElementSibling;
				while (node && !node.classList.contains('tasks-task-line-separator')) {
					if (node.classList.contains('tasks-task-line-title-container-wrapper')) {
						wrappers.unshift(node);
					}
					node = node.previousElementSibling;
				}
				return wrappers;
			},
			focusFirstSubTask() {
				const wrappers = this.getGroupRowWrappers();
				const link = wrappers[1]?.querySelector('.tasks-task-line-title-href');
				(link ?? this.$refs.collapseToggle?.$el)?.focus?.();
			},
			focusParentTrigger(parentWrapper) {
				const trigger = parentWrapper?.querySelector('.tasks-task-line-expand-toggle') ?? parentWrapper?.querySelector('.tasks-task-line-title-href');
				trigger?.focus?.();
			},
			getRemovalFocusTarget(subTaskId) {
				const wrappers = this.getGroupRowWrappers();
				if (wrappers.length === 0) {
					return null;
				}
				const [parentWrapper, ...subWrappers] = wrappers;
				const index = this.subTaskIds.indexOf(subTaskId);
				const candidates = [subWrappers[index + 1], subWrappers[index - 1], parentWrapper];
				for (const wrapper of candidates) {
					const link = wrapper?.querySelector('.tasks-task-line-title-href');
					if (link) {
						return link;
					}
				}
				return null;
			}
		},
		template: `
		<template v-if="isLoading">
			<TaskLineSkeleton/>
		</template>
		<template v-else>
			<TaskLine
				:taskId
				:isExpanded="isTaskLineExpanded"
				@remove="$emit('remove', taskId)"
				@toggleSubTasks="toggleExpand"
			/>
			<template v-if="showSubTasks">
				<template v-for="subTaskId in subTaskIds" :key="subTaskId">
					<template v-if="loadingSubTaskIds.includes(subTaskId)">
						<TaskLineSkeleton
							isSubTask
							:isLastSubTask="isLastSubTask(subTaskId)"
						/>
					</template>
					<template v-else>
						<TaskLine
							:taskId="subTaskId"
							:isLastSubTask="isLastSubTask(subTaskId)"
							isSubTask
							@remove="removeSubTask(subTaskId)"
							@toggleSubTasks="openSubTaskGrid(subTaskId)"
						/>
					</template>
				</template>
				<TaskLineExpandToggle
					ref="collapseToggle"
					:text="loc('TASKS_V2_TASK_LINE_GROUP_COLLAPSE')"
					:icon="Outline.CHEVRON_TOP_M"
					extraPadding
					:ariaExpanded="true"
					data-testid="task-line-group-collapse-btn"
					@click="toggleExpand"
				/>
			</template>
		</template>
	`
	};

	const limit = tasks_v2_const.Limit.RelationList;

	// @vue/component
	const TaskList = {
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			TaskLineGroup,
			TaskLineSkeleton
		},
		provide() {
			return {
				shouldShowSubTasksOption: this.shouldShowSubTasksOption,
				isTemplateEntities: this.isTemplateEntities,
				fields: this.fields
			};
		},
		props: {
			ids: {
				type: Array,
				required: true
			},
			loadingIds: {
				type: Array,
				required: true
			},
			canOpenMore: {
				type: Boolean,
				default: true
			},
			shouldShowSubTasksOption: {
				type: Boolean,
				default: true
			},
			fields: {
				type: Set,
				default: new Set(['responsible', 'deadline'])
			},
			idsLoaded: {
				type: Boolean,
				default: false
			},
			isTemplateEntities: {
				type: Boolean,
				default: false
			}
		},
		emits: ['openMore', 'removeTask'],
		setup() {
			return {
				Outline: ui_iconSet_api_vue.Outline,
				limit
			};
		},
		computed: {
			limitedTasks() {
				return this.ids.slice(0, limit);
			},
			moreText() {
				const count = this.ids.length - limit;
				return main_core.Loc.getMessagePlural('TASKS_V2_TASK_LIST_MORE', count, {
					'#COUNT#': count
				});
			},
			shouldShow() {
				if (!this.idsLoaded) {
					return true;
				}
				return this.ids.length > 0 || this.loadingIds.length > 0;
			},
			isBusy() {
				return !this.idsLoaded || this.loadingIds.length > 0;
			}
		},
		methods: {
			handleMoreClick() {
				if (this.canOpenMore) {
					this.$emit('openMore');
				}
			}
		},
		template: `
		<div
			v-if="shouldShow"
			class="tasks-task-list print-no-box-shadow"
			:style="{ '--fields-count': fields.size }"
			:aria-busy="isBusy ? 'true' : null"
		>
			<template v-if="ids.length === 0 && !idsLoaded">
				<div class="tasks-task-line-separator print-background-white"/>
				<TaskLineSkeleton/>
			</template>
			<template v-for="taskId in limitedTasks" :key="taskId">
				<div class="tasks-task-line-separator print-background-white"/>
				<TaskLineGroup
					:taskId
					:isLoading="loadingIds.includes(taskId)"
					@remove="$emit('removeTask', $event)"
				/>
			</template>
		</div>
		<component
			:is="canOpenMore ? 'button' : 'div'"
			v-if="ids.length > limit"
			:type="canOpenMore ? 'button' : null"
			data-testid="task-list-more-btn"
			class="tasks-task-list-more print-background-white"
			:class="{ '--readonly': !canOpenMore }"
			:aria-haspopup="canOpenMore ? 'dialog' : null"
			@click="handleMoreClick"
		>
			<div class="tasks-task-list-more-text print-font-color-base-1">{{ moreText }}</div>
			<BIcon
				v-if="canOpenMore"
				class="tasks-task-list-icon print-ignore"
				:name="Outline.CHEVRON_RIGHT_L"
				hoverable
				aria-hidden="true"
			/>
		</component>
	`
	};

	exports.TaskList = TaskList;

})(this.BX.Tasks.V2.Component = this.BX.Tasks.V2.Component || {}, BX, BX.UI.IconSet, window, BX.Tasks.V2.Const, BX.Vue3.Vuex, BX.Tasks.V2, BX.Tasks.V2.Lib, BX.Tasks.V2.Lib, BX.Tasks.V2.Lib, BX.Tasks.V2.Provider.Service, BX.Tasks.V2.Provider.Service, BX.UI.NotificationManager, BX.UI.System.Typography.Vue, BX.UI.System.Menu, BX.Tasks.V2.Application, BX.Tasks.V2.Component.Fields, BX.Tasks.V2.Component.Fields, BX.Tasks.V2.Lib, BX.Tasks.V2.Provider.Service, BX.Tasks.V2.Provider.Service, BX.Tasks.V2.Lib, BX.Tasks.V2.Component.Elements, BX.Tasks.V2.Application, BX.UI.System.Skeleton.Vue);
//# sourceMappingURL=task-list.bundle.js.map

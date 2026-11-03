/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Component = this.BX.Tasks.V2.Component || {};
(function (exports, ui_iconSet_api_vue, ui_iconSet_outline, tasks_v2_const, tasks_v2_component_elements_hint, tasks_v2_component_elements_hoverPill, tasks_v2_component_elements_fieldAdd, tasks_v2_lib_showLimit, tasks_v2_provider_service_taskService, main_core, tasks_v2_core, ui_a11y, ui_vue3_components_button, ui_vue3_components_popup, tasks_v2_provider_service_groupService, tasks_v2_provider_service_userService, main_core_events, ui_notificationManager, im_public, tasks_v2_lib_entitySelectorDialog, ui_system_menu_vue, ui_system_skeleton_vue, ui_iconSet_api_core, ui_iconSet_crm, tasks_v2_lib_color, tasks_v2_lib_scrumManager, ui_system_typography_vue, ui_entitySelector, ui_system_chip_vue, tasks_v2_lib_fieldHighlighter, tasks_v2_lib_analytics) {
	'use strict';

	const groupMeta = Object.freeze({
		id: tasks_v2_const.TaskField.Group,
		title: main_core.Loc.getMessage('TASKS_V2_GROUP_TITLE'),
		stageTitle: main_core.Loc.getMessage('TASKS_V2_GROUP_STAGE_TITLE'),
		epicTitle: main_core.Loc.getMessage('TASKS_V2_GROUP_EPIC_TITLE'),
		storyPointsTitle: main_core.Loc.getMessage('TASKS_V2_GROUP_STORY_POINTS_TITLE'),
		getTitle: groupId => {
			const group = tasks_v2_core.Core.getStore().getters[`${tasks_v2_const.Model.Groups}/getById`](groupId);
			const collabTitle = tasks_v2_core.Core.getParams().features.isNewProjectsOn ? main_core.Loc.getMessage('TASKS_V2_GROUP_TITLE') : main_core.Loc.getMessage('TASKS_V2_GROUP_TITLE_COLLAB');
			return {
				[tasks_v2_const.GroupType.Collab]: collabTitle,
				[tasks_v2_const.GroupType.Scrum]: main_core.Loc.getMessage('TASKS_V2_GROUP_TITLE_SCRUM')
			}[group?.type] ?? main_core.Loc.getMessage('TASKS_V2_GROUP_TITLE');
		}
	});

	const GroupPopup = {
		components: {
			Popup: ui_vue3_components_popup.Popup,
			UiButton: ui_vue3_components_button.Button
		},
		inject: {
			task: {}
		},
		props: {
			getBindElement: {
				type: Function,
				required: true
			}
		},
		emits: ['openGroup', 'close'],
		setup() {
			return {
				AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
				ButtonSize: ui_vue3_components_button.ButtonSize
			};
		},
		data() {
			return {
				isPopupShown: false,
				/** @type GroupInfo */
				groupInfo: {}
			};
		},
		computed: {
			group() {
				return this.$store.getters[`${tasks_v2_const.Model.Groups}/getById`](this.task.groupId);
			},
			bindElement() {
				return this.getBindElement();
			},
			options() {
				return {
					id: 'tasks-field-group-popup',
					bindElement: this.bindElement,
					padding: 24,
					minWidth: 260,
					maxWidth: 400,
					offsetTop: 8,
					closeByEsc: true,
					targetContainer: document.body,
					ariaLabel: this.group?.name || this.loc('TASKS_V2_GROUP_HIDDEN'),
					focusTrap: {
						initialFocus: false,
						restoreFocus: false,
						startBoundary: () => this.keyboardTrigger
					}
				};
			},
			groupOwnerUrl() {
				return tasks_v2_provider_service_userService.userService.getUrl(this.groupInfo.ownerId);
			},
			groupMembersCountFormatted() {
				return main_core.Loc.getMessagePlural('TASKS_V2_GROUP_COUNT_MEMBERS', this.groupInfo.numberOfMembers, {
					'#COUNT#': this.groupInfo.numberOfMembers
				});
			},
			groupAboutFormatted() {
				const collabTitle = tasks_v2_core.Core.getParams().features.isNewProjectsOn ? this.loc('TASKS_V2_GROUP_ABOUT') : this.loc('TASKS_V2_GROUP_ABOUT_COLLAB');
				return {
					[tasks_v2_const.GroupType.Collab]: collabTitle,
					[tasks_v2_const.GroupType.Scrum]: this.loc('TASKS_V2_GROUP_ABOUT_SCRUM')
				}[this.group?.type] ?? this.loc('TASKS_V2_GROUP_ABOUT');
			},
			groupRestricted() {
				return !this.group || Boolean(this.group.isRestrictedView);
			}
		},
		mounted() {
			main_core.Event.bind(this.bindElement, 'click', this.handleClick);
			main_core.Event.bind(this.bindElement, 'mouseenter', this.handleMouseEnter);
			main_core.Event.bind(this.bindElement, 'mouseleave', this.handleMouseLeave);
			main_core.Event.bind(this.bindElement, 'focusin', this.handleMouseEnter);
			main_core.Event.bind(this.bindElement, 'focusout', this.handleFocusOut);
			main_core.Event.bind(this.bindElement, 'keydown', this.handleTriggerKeyDown);
		},
		beforeUnmount() {
			this.clearTimeouts();
			main_core.Event.unbind(this.bindElement, 'click', this.handleClick);
			main_core.Event.unbind(this.bindElement, 'mouseenter', this.handleMouseEnter);
			main_core.Event.unbind(this.bindElement, 'mouseleave', this.handleMouseLeave);
			main_core.Event.unbind(this.bindElement, 'focusin', this.handleMouseEnter);
			main_core.Event.unbind(this.bindElement, 'focusout', this.handleFocusOut);
			main_core.Event.unbind(this.bindElement, 'keydown', this.handleTriggerKeyDown);
			main_core.Event.unbind(document, 'mouseover', this.updateHoverElement);
		},
		methods: {
			openGroup() {
				if (this.groupRestricted) {
					return;
				}
				this.closePopup();
				this.$emit('openGroup');
			},
			handleClick() {
				this.clearTimeouts();
			},
			handleMouseEnter() {
				if (this.groupRestricted || this.isRestoringFocus) {
					return;
				}
				this.groupInfoPromise = tasks_v2_provider_service_groupService.groupService.getGroupInfo(this.group.id);
				this.clearTimeouts();
				this.showTimeout = setTimeout(() => this.showPopup(), 400);
			},
			handleMouseLeave() {
				main_core.Event.unbind(document, 'mouseover', this.updateHoverElement);
				main_core.Event.bind(document, 'mouseover', this.updateHoverElement);
				this.clearTimeouts();
				this.closeTimeout = setTimeout(() => {
					if (this.containsFocus()) {
						return;
					}
					if (!this.$refs.container?.contains(this.hoverElement) && !this.bindElement?.contains(this.hoverElement)) {
						this.closePopup();
					}
				}, 100);
			},
			handleFocusOut() {
				this.clearTimeouts();
				this.closeTimeout = setTimeout(() => {
					if (!this.containsFocus()) {
						this.closePopup();
					}
				}, 100);
			},
			handleTriggerKeyDown(event) {
				if (event.key !== 'Tab' || event.shiftKey || !this.isPopupShown) {
					return;
				}
				if (ui_a11y.FocusNavigator.getNext(this.bindElement)) {
					return;
				}
				const trigger = ui_a11y.FocusNavigator.getActiveElement();
				if (!this.focusPopupContent()) {
					return;
				}
				this.keyboardTrigger = trigger;
				event.preventDefault();
			},
			focusPopupContent() {
				const focusTrap = this.$refs.popup?.getPopupInstance?.()?.getFocusTrap?.();
				return Boolean(focusTrap?.focusFirst());
			},
			containsFocus() {
				const activeElement = ui_a11y.FocusNavigator.getActiveElement();
				if (activeElement === null) {
					return false;
				}
				return this.bindElement?.contains(activeElement) || Boolean(this.$refs.popup?.contains(activeElement));
			},
			popupContainsFocus() {
				const activeElement = ui_a11y.FocusNavigator.getActiveElement();
				return activeElement !== null && Boolean(this.$refs.popup?.contains(activeElement));
			},
			updateHoverElement(event) {
				this.hoverElement = event.target;
			},
			async showPopup() {
				if (this.groupInfoPromise) {
					this.groupInfo = await this.groupInfoPromise;
				}
				if (!this.group || Object.keys(this.groupInfo).length === 0) {
					return;
				}
				this.clearTimeouts();
				this.isPopupShown = true;
				await this.$nextTick();
				this.$refs.popup.adjustPosition();
			},
			closePopup() {
				const trigger = this.popupContainsFocus() ? this.keyboardTrigger : null;
				this.keyboardTrigger = null;
				this.clearTimeouts();
				this.isPopupShown = false;
				main_core.Event.unbind(this.$refs.container, 'mouseleave', this.handleMouseLeave);
				main_core.Event.unbind(document, 'mouseover', this.updateHoverElement);
				void this.restoreTriggerFocus(trigger);
			},
			async restoreTriggerFocus(trigger) {
				if (!trigger) {
					return;
				}
				await this.$nextTick();
				if (!document.body.contains(trigger)) {
					return;
				}
				this.isRestoringFocus = true;
				ui_a11y.FocusNavigator.restoreFocus(trigger);
				this.isRestoringFocus = false;
			},
			clearTimeouts() {
				clearTimeout(this.closeTimeout);
				clearTimeout(this.showTimeout);
			}
		},
		template: `
		<Popup v-if="isPopupShown" :options ref="popup" @close="closePopup">
			<div class="tasks-field-group-popup" ref="container">
				<div class="tasks-field-group-popup-header">
					<img class="tasks-field-group-popup-image" :src="encodeURI(group?.image)" :alt="group?.name">
					<div class="tasks-field-group-popup-title-container">
						<div class="tasks-field-group-popup-title" :title="group?.name">{{ group?.name }}</div>
						<div class="tasks-field-group-popup-subtitle">{{ groupMembersCountFormatted }}</div>
					</div>
				</div>
				<div class="tasks-field-group-popup-button">
					<UiButton
						:text="groupAboutFormatted"
						:style="AirButtonStyle.OUTLINE_ACCENT_2"
						:size="ButtonSize.SMALL"
						wide
						@click="openGroup"
					/>
				</div>
				<div class="tasks-field-group-popup-info">
					<div class="tasks-field-group-popup-field">
						<div class="tasks-field-group-popup-field-title">{{ loc('TASKS_V2_GROUP_OWNER') }}</div>
						<div class="tasks-field-group-popup-field-value">
							<a :href="groupOwnerUrl">{{ groupInfo.ownerName }}</a>
						</div>
					</div>
					<div class="tasks-field-group-popup-field">
						<div class="tasks-field-group-popup-field-title">{{ loc('TASKS_V2_GROUP_DATE_CREATE') }}</div>
						<div class="tasks-field-group-popup-field-value">{{ groupInfo.dateCreate }}</div>
					</div>
					<div class="tasks-field-group-popup-field">
						<div class="tasks-field-group-popup-field-title">{{ loc('TASKS_V2_GROUP_SUBJECT') }}</div>
						<div class="tasks-field-group-popup-field-value">{{ groupInfo.subjectTitle }}</div>
					</div>
				</div>
			</div>
		</Popup>
	`
	};

	const groupDialog = new class {
		#dialog;
		#taskId;
		#onClose;
		show(params) {
			this.#taskId = params.taskId;
			this.#onClose = params.onClose;
			this.#dialog ??= this.#createDialog();
			this.#dialog.selectItemsByIds(this.#items);
			this.#dialog.showTo(params.targetNode);
		}
		#openInMessenger(group) {
			const externalId = `sg${group.id}`;
			if (group.type === tasks_v2_const.GroupType.Collab) {
				im_public.Messenger.openChat(externalId);
				return;
			}
			im_public.Messenger.openCollab(externalId);
		}
		async openGroup(isAutonomous, group, taskId = 0) {
			if (tasks_v2_core.Core.getParams().features.isNewProjectsOn && (im_public.Messenger.isEmbeddedMode() || im_public.Messenger.isMessengerSliderOpened()) && group.type !== tasks_v2_const.GroupType.Scrum) {
				const closeEventName = isAutonomous ? tasks_v2_const.EventName.CardClosed : tasks_v2_const.EventName.FullCardClosed;
				main_core_events.EventEmitter.subscribeOnce(closeEventName, () => {
					this.#openInMessenger(group);
				});
				if (isAutonomous) {
					main_core_events.EventEmitter.emit(`${tasks_v2_const.EventName.CloseCard}:${taskId}`);
				} else {
					main_core_events.EventEmitter.emit(tasks_v2_const.EventName.TryCloseFullCard, {
						taskId
					});
				}
			} else {
				void this.#emulateAnchorClick(group);
			}
		}
		async openProject(group) {
			if (tasks_v2_core.Core.getParams().features.isNewProjectsOn && (im_public.Messenger.isEmbeddedMode() || im_public.Messenger.isMessengerSliderOpened()) && group.type !== tasks_v2_const.GroupType.Scrum) {
				this.#openInMessenger(group);
			} else {
				void this.#emulateAnchorClick(group);
			}
		}
		async #emulateAnchorClick(group) {
			const href = await tasks_v2_provider_service_groupService.groupService.getUrl(group.id, group.type);
			BX.SidePanel.Instance.emulateAnchorClick(href);
		}
		#createDialog() {
			return new tasks_v2_lib_entitySelectorDialog.EntitySelectorDialog({
				context: 'tasks-card',
				multiple: false,
				hideOnDeselect: true,
				enableSearch: true,
				entities: [{
					id: tasks_v2_const.EntitySelectorEntity.Project
				}],
				preselectedItems: this.#items,
				events: {
					onLoad: this.#fillStore
				},
				popupOptions: {
					events: {
						onClose: this.#handleGroupSelect
					}
				}
			});
		}
		#handleGroupSelect = async () => {
			const onClose = this.#onClose;
			this.#onClose = null;
			if (!this.#dialog.isLoaded()) {
				onClose?.();
				return;
			}

			// Singleton dialog: a show() for another card can overwrite this.#taskId while an await
			// below is in flight, so capture the id and current group synchronously and use only these.
			const taskId = this.#taskId;
			const currentGroupId = tasks_v2_provider_service_taskService.taskService.getStoreTask(taskId).groupId;
			const groupId = await this.#fillStore();
			if (currentGroupId === groupId) {
				onClose?.();
				return;
			}
			tasks_v2_provider_service_taskService.taskService.setSilentErrorMode(true);
			const updatePromise = tasks_v2_provider_service_taskService.taskService.update(taskId, {
				groupId,
				stageId: 0
			});
			tasks_v2_provider_service_groupService.groupService.setHasScrumInfo(taskId, updatePromise);
			onClose?.(groupId);
			const result = await updatePromise;
			tasks_v2_provider_service_taskService.taskService.setSilentErrorMode(false);
			if (result[tasks_v2_const.Endpoint.TaskUpdate]?.length) {
				const error = result[tasks_v2_const.Endpoint.TaskUpdate][0];
				ui_notificationManager.Notifier.notifyViaBrowserProvider({
					id: 'task-notify-update-group-error',
					text: error?.message
				});
			}

			// Refetch canCreateEpic unconditionally: setHasScrumInfo() cleared it as a fail-safe, so on
			// update failure (server unchanged) the refetch restores the old group's real right, and on
			// success the new group's. The synthetic promise from setHasScrumInfo() would otherwise
			// short-circuit the mount-fetch with the stale flag. Each call self-guards by task id kind:
			// getScrumInfo runs for a real task, getEpicCreationRight for a create-mode draft.
			void tasks_v2_provider_service_groupService.groupService.getScrumInfo(taskId, {
				force: true
			});
			void tasks_v2_provider_service_groupService.groupService.getEpicCreationRight(taskId);
		};
		#fillStore = async () => {
			const item = this.#dialog.getSelectedItems()[0];
			if (!item) {
				return 0;
			}
			const group = {
				id: item.getId(),
				name: item.getTitle(),
				image: item.getAvatar(),
				type: item.getEntityType()
			};
			await tasks_v2_core.Core.getStore().dispatch(`${tasks_v2_const.Model.Groups}/insert`, group);
			return group.id;
		};
		get #items() {
			return this.#groupId ? [[tasks_v2_const.EntitySelectorEntity.Project, this.#groupId]] : [];
		}
		get #groupId() {
			return tasks_v2_provider_service_taskService.taskService.getStoreTask(this.#taskId).groupId;
		}
	}();

	// @vue/component
	const Group = {
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			Hint: tasks_v2_component_elements_hint.Hint,
			HoverPill: tasks_v2_component_elements_hoverPill.HoverPill,
			FieldAdd: tasks_v2_component_elements_fieldAdd.FieldAdd,
			GroupPopup
		},
		inject: {
			settings: {},
			task: {},
			taskId: {},
			isEdit: {},
			embedded: {}
		},
		setup() {
			return {
				groupMeta,
				Outline: ui_iconSet_api_vue.Outline
			};
		},
		data() {
			return {
				isHintShown: false,
				isDialogShown: false
			};
		},
		computed: {
			group() {
				return this.$store.getters[`${tasks_v2_const.Model.Groups}/getById`](this.task.groupId);
			},
			groupName() {
				return this.group?.name ?? this.loc('TASKS_V2_GROUP_HIDDEN');
			},
			groupImage() {
				return encodeURI(this.group?.image);
			},
			ariaLabel() {
				if (this.readonly) {
					return '';
				}
				return this.loc('TASKS_V2_GROUP_VALUE_ARIA_LABEL', {
					'#TITLE#': groupMeta.getTitle(this.task.groupId),
					'#VALUE#': this.groupName
				});
			},
			addAriaLabel() {
				return this.readonly ? '' : this.loc('TASKS_V2_GROUP_ADD_ARIA_LABEL');
			},
			isSecret() {
				return Boolean(this.task.groupId) && !this.group;
			},
			hasFlow() {
				return this.task.flowId > 0;
			},
			readonly() {
				return !this.task.rights.edit || this.hasFlow;
			},
			isRestrictedView() {
				return Boolean(this.group?.isRestrictedView);
			},
			isLocked() {
				return !this.settings.restrictions.project.available;
			},
			withClear() {
				return !this.readonly && (this.task.flowId ?? 0) <= 0;
			}
		},
		methods: {
			handleClick() {
				if (!this.isEdit && this.hasFlow) {
					this.isHintShown = true;
					return;
				}
				if (this.readonly) {
					if (!this.isSecret && !this.isRestrictedView) {
						void this.openGroup();
					}
					return;
				}
				if (this.isLocked) {
					this.showLimitDialog();
				} else {
					this.showDialog();
				}
			},
			async openGroup() {
				if (!this.group || this.isRestrictedView) {
					return;
				}
				if (this.embedded) {
					void groupDialog.openProject(this.group);
				} else {
					void groupDialog.openGroup(false, this.group, this.taskId);
				}
			},
			showDialog() {
				this.isDialogShown = true;
				groupDialog.show({
					targetNode: this.$refs.group,
					taskId: this.taskId,
					onClose: this.handleDialogClose
				});
			},
			async handleDialogClose() {
				this.isDialogShown = false;
				await this.focusTrigger();
			},
			async focusTrigger() {
				await this.$nextTick();
				this.$refs.group?.querySelector('.b24-hover-pill-content')?.focus();
			},
			async clear() {
				void tasks_v2_provider_service_taskService.taskService.update(this.taskId, {
					groupId: 0,
					stageId: 0
				});
				await this.focusTrigger();
			},
			showLimitDialog() {
				void tasks_v2_lib_showLimit.showLimit({
					featureId: this.settings.restrictions.project.featureId
				});
			}
		},
		template: `
		<div
			:data-task-id="taskId"
			:data-task-field-id="groupMeta.id"
			:data-task-field-value="task.groupId"
			ref="group"
		>
			<div class="tasks-field-group-group" :class="{ '--secret': isSecret, '--restricted': isRestrictedView, }" @click="handleClick">
				<HoverPill
					v-if="task.groupId"
					:withClear
					:clearAriaLabel="loc('TASKS_V2_GROUP_CLEAR_ARIA_LABEL')"
					@clear="clear"
					:readonly
					:ariaLabel
					:ariaHaspopup="readonly ? '' : 'dialog'"
					:ariaExpanded="readonly ? null : isDialogShown"
				>
					<img v-if="groupImage" class="tasks-field-group-image" :src="groupImage" :alt="groupName"/>
					<BIcon v-else class="tasks-field-group-icon" :name="Outline.FOLDER"/>
					<div class="tasks-field-group-title">{{ groupName }}</div>
				</HoverPill>
				<FieldAdd
					v-else
					:icon="Outline.FOLDER_PLUS"
					:ariaLabel="addAriaLabel"
					:ariaHaspopup="readonly ? '' : 'dialog'"
					:ariaExpanded="readonly ? null : isDialogShown"
				/>
			</div>
		</div>
		<Hint v-if="isHintShown" :bindElement="$refs.group" @close="isHintShown = false">
			{{ loc('TASKS_V2_GROUP_CANT_CHANGE_FLOW') }}
		</Hint>
		<GroupPopup :getBindElement="() => $refs.group" @openGroup="openGroup"/>
	`
	};

	const STAGE_SYNC_RESTORED_EVENT = tasks_v2_const.EventName.TaskStageSyncRestored ?? 'tasks:card:taskStageSyncRestored';

	// @vue/component
	const Stage = {
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			BMenu: ui_system_menu_vue.BMenu,
			BLine: ui_system_skeleton_vue.BLine
		},
		inject: {
			task: {},
			taskId: {}
		},
		setup() {
			return {
				Outline: ui_iconSet_api_vue.Outline
			};
		},
		data() {
			return {
				isMenuShown: false,
				isStageLoading: false,
				stageSyncFailed: false
			};
		},
		computed: {
			group() {
				return this.$store.getters[`${tasks_v2_const.Model.Groups}/getById`](this.task.groupId);
			},
			groupId() {
				return this.task?.groupId ?? 0;
			},
			stageId() {
				return this.task?.stageId ?? 0;
			},
			stage() {
				return this.$store.getters[`${tasks_v2_const.Model.Stages}/getById`](this.stageId);
			},
			menuOptions() {
				return () => ({
					id: 'tasks-field-group-stage-menu',
					bindElement: this.$refs.stage,
					offsetTop: 8,
					maxWidth: 500,
					items: this.menuItems,
					maxHeight: window.innerHeight / 2,
					targetContainer: document.body
				});
			},
			menuItems() {
				const stages = this.$store.getters[`${tasks_v2_const.Model.Stages}/getByIds`](this.group.stagesIds ?? []).sort(({
					sort: a
				}, {
					sort: b
				}) => a - b);
				return stages?.map(stage => ({
					title: stage.title,
					svg: this.getStageSvg(new tasks_v2_lib_color.Color(stage.color).limit(250).toRgb()),
					isSelected: stage.id === this.stage.id,
					onClick: () => this.setStage(stage.id)
				}));
			},
			backgroundColor() {
				return new tasks_v2_lib_color.Color(this.stage.color).setOpacity(0.1).limit(250).toRgb();
			},
			isDarkColor() {
				return new tasks_v2_lib_color.Color(this.stage.color).isDark();
			},
			readonly() {
				return !this.task.rights.sort || this.stageSyncFailed;
			}
		},
		watch: {
			task() {
				void this.ensureStage();
			},
			groupId() {
				void this.ensureStage();
			}
		},
		created() {
			main_core_events.EventEmitter.subscribe(tasks_v2_const.EventName.TaskStageSyncFailed ?? 'tasks:card:taskStageSyncFailed', this.handleStageSyncFailed);
			main_core_events.EventEmitter.subscribe(STAGE_SYNC_RESTORED_EVENT, this.handleStageSyncRestored);
			if (tasks_v2_provider_service_taskService.taskService.isStageSyncUncertain?.(this.taskId)) {
				this.notifyStageSyncFailed();
			}
			void this.ensureStage();
		},
		beforeUnmount() {
			main_core_events.EventEmitter.unsubscribe(tasks_v2_const.EventName.TaskStageSyncFailed ?? 'tasks:card:taskStageSyncFailed', this.handleStageSyncFailed);
			main_core_events.EventEmitter.unsubscribe(STAGE_SYNC_RESTORED_EVENT, this.handleStageSyncRestored);
		},
		methods: {
			handleStageSyncFailed(event) {
				if (event.getData().taskId === this.taskId) {
					this.notifyStageSyncFailed();
				}
			},
			handleStageSyncRestored(event) {
				if (event.getData().taskId === this.taskId && tasks_v2_provider_service_taskService.taskService.isStageSyncUncertain?.(this.taskId) === false) {
					this.stageSyncFailed = false;
				}
			},
			notifyStageSyncFailed() {
				if (this.stageSyncFailed) {
					return;
				}
				this.stageSyncFailed = true;
				BX.UI.Notification.Center.notify({
					content: main_core.Loc.getMessage('TASKS_V2_GROUP_STAGE_SYNC_ERROR')
				});
			},
			notifyStageMoveFailed(error) {
				if (!error || error.code === 'STAGE_MOVE_STALE') {
					return;
				}
				if (error.code === 'STAGE_SYNC_UNCERTAIN') {
					this.notifyStageSyncFailed();
					return;
				}
				BX.UI.Notification.Center.notify({
					content: error.code === 'ACCESS_DENIED' && error.message ? error.message : main_core.Loc.getMessage('TASKS_V2_GROUP_STAGE_MOVE_ERROR')
				});
			},
			getStageSvg(color) {
				return new ui_iconSet_api_core.Icon({
					icon: ui_iconSet_api_vue.CRM.STAGE,
					color
				}).render();
			},
			async handleClick() {
				if (this.readonly) {
					return;
				}
				if (!this.group.stagesIds || this.group.stagesIds.length === 0) {
					await tasks_v2_provider_service_groupService.groupService.getStages(this.groupId);
				}
				this.isMenuShown = true;
			},
			handleMenuClose() {
				this.isMenuShown = false;
				this.$refs.stage?.focus();
			},
			async setStage(stageId) {
				const scrumManager = new tasks_v2_lib_scrumManager.ScrumManager({
					taskId: this.task.id,
					parentId: this.task.parentId,
					groupId: this.task.groupId
				});
				const isScrum = scrumManager.isScrum(this.group?.type);
				let isFinishStage = false;
				if (isScrum) {
					const stage = (await this.$store.getters[`${tasks_v2_const.Model.Stages}/getById`](stageId)) ?? null;
					isFinishStage = stage?.systemType === 'FINISH';
				}
				if (isFinishStage) {
					try {
						const {
							checkListCompletionService,
							isCompletionSuccessful
						} = await main_core.Runtime.loadExtension('tasks.v2.lib.check-list-completion');
						// V2 always delegates checklist completion to the server, even for an empty client snapshot
						const moveToFinishStage = () => tasks_v2_provider_service_taskService.taskService.setStage(this.taskId, stageId, {
							completeWithChecklist: true
						});
						const completionResult = await checkListCompletionService.run({
							taskId: this.taskId,
							complete: moveToFinishStage,
							completeWithChecklist: moveToFinishStage,
							beforeComplete: () => scrumManager.handleDodDisplay()
						});
						if (!isCompletionSuccessful(completionResult)) {
							this.notifyStageMoveFailed(completionResult.error);
							return completionResult.error;
						}
					} catch (error) {
						console.error('Stage: setStage error', error);
						return error;
					}
				} else {
					const error = await tasks_v2_provider_service_taskService.taskService.setStage(this.taskId, stageId);
					if (error) {
						this.notifyStageMoveFailed(error);
						return error;
					}
				}
				if (isScrum) {
					void scrumManager?.handleParentState();
				}
				return null;
			},
			async ensureStage() {
				if (!this.groupId || this.stage?.id || this.isStageLoading) {
					return;
				}
				const groupId = this.groupId;
				if (!this.group?.stagesIds || this.group.stagesIds.length === 0) {
					this.isStageLoading = true;
					try {
						await tasks_v2_provider_service_groupService.groupService.getStages(groupId);
					} finally {
						this.isStageLoading = false;
					}
				}
				if (!this.task) {
					return;
				}
				if (this.groupId !== groupId) {
					void this.ensureStage();
					return;
				}
				this.applyDefaultStage();
			},
			applyDefaultStage() {
				// A freshly created project has no assigned stage yet, so the server returns
				// no stage on update; pick the system start stage (NEW), falling back to the
				// first kanban stage by sort.
				if (this.stage?.id) {
					return;
				}
				const stages = this.$store.getters[`${tasks_v2_const.Model.Stages}/getByIds`](this.group?.stagesIds ?? []);
				const defaultStage = stages.find(stage => stage.systemType === 'NEW') ?? [...stages].sort(({
					sort: a
				}, {
					sort: b
				}) => a - b)[0];
				if (defaultStage?.id) {
					tasks_v2_provider_service_taskService.taskService.updateStoreTask(this.taskId, {
						stageId: defaultStage.id
					});
				}
			}
		},
		template: `
		<component
			:is="readonly ? 'div' : 'button'"
			v-if="stage?.id"
			:type="readonly ? null : 'button'"
			class="tasks-field-group-stage"
			:class="{ '--dark': isDarkColor, '--readonly': readonly }"
			:style="{
				'--stage-color': '#' + stage.color,
				'--stage-background': backgroundColor,
			}"
			:title="stage?.title"
			:aria-label="readonly ? null : loc('TASKS_V2_GROUP_STAGE_ARIA_LABEL')"
			:aria-haspopup="readonly ? null : 'menu'"
			:aria-expanded="readonly ? null : isMenuShown"
			:data-task-id="taskId"
			:data-task-field-id="'stageId'"
			:data-task-field-value="stageId"
			:data-task-stage-title="stage?.title"
			ref="stage"
			@click="handleClick"
		>
			<div class="tasks-field-group-stage-text-container print-background-white print-font-weight-normal print-no-padding-left print-font-size-lg">
				<div class="tasks-field-group-stage-text print-font-color-base-1">{{ stage.title }}</div>
			</div>
			<div class="tasks-field-group-stage-arrow print-ignore"/>
			<BIcon v-if="!readonly" :name="Outline.CHEVRON_DOWN_S" class="print-ignore" aria-hidden="true"/>
		</component>
		<div v-else-if="isStageLoading" class="tasks-field-group-stage-loader">
			<BLine :width="80" :height="10"/>
		</div>
		<BMenu v-if="isMenuShown" :options="menuOptions()" @close="handleMenuClose"/>
	`
	};

	class EpicCreateFooter extends ui_entitySelector.BaseFooter {
		render() {
			return main_core.Tag.render`
			<div
				class="ui-selector-footer-default tasks-v2-group-epic-footer"
				data-testid="tasks-epic-selector-footer"
			>
				<button
					type="button"
					class="ui-selector-footer-link"
					data-testid="tasks-epic-selector-manage-btn"
					onclick="${this.getOption('onManageEpic')}"
				>
					${this.getOption('manageLabel')}
				</button>
				<span class="tasks-v2-group-epic-footer-hint">
					${this.getOption('hint')}
				</span>
			</div>
		`;
		}
	}

	const dialogs = {};

	// Per-group mutable state kept separate from dialog instances so that
	// concurrent show() calls for different tasks never corrupt each other.
	const dialogStates = {};

	// Monotonic across all groups and tasks, so an id is never reused: a create captured before its
	// window ended cannot match the id of a window opened for the same task afterwards.
	let lastOperationId = 0;
	function getState(groupId) {
		dialogStates[groupId] ??= {
			taskId: 0,
			operations: {},
			suppressBindForEpicId: null,
			onClose: null
		};
		return dialogStates[groupId];
	}
	function startOperationWindow(state, taskId) {
		lastOperationId += 1;
		const {
			operations
		} = state;
		operations[taskId] = lastOperationId;
		return lastOperationId;
	}
	function endOperationWindow(state, taskId) {
		const {
			operations
		} = state;
		delete operations[taskId];
	}
	function isCurrentOperationWindow(state, taskId, operationId) {
		// An ended window leaves no entry, so an undefined lookup must not read as "still current".
		return operationId > 0 && state.operations[taskId] === operationId;
	}

	// Bound the pending-retry registry. An auto-hidden retry toast never delivers a local 'close'
	// event (see the 'close' handler below), so entries would otherwise accumulate for the whole
	// singleton lifecycle. Evict the oldest on overflow instead of using a timer, which would fight
	// the toast's hover-to-pause auto-hide and could drop a still-visible Retry.
	const MAX_PENDING_RETRIES = 20;
	const epicDialog = new class {
		#pendingRetries = new Map();
		#openingEpicLists = new Map();
		constructor() {
			// Event/action names are stable constants of ui.notification-manager (not re-exported).
			ui_notificationManager.Notifier.subscribe('action', event => {
				const {
					id,
					action
				} = event.getData();
				if (action !== 'button_1' || !this.#pendingRetries.has(id)) {
					return;
				}
				const {
					taskId,
					groupId,
					name
				} = this.#pendingRetries.get(id);
				this.#pendingRetries.delete(id);
				if (!this.#isTaskStillInGroup(taskId, groupId)) {
					return;
				}
				if (!this.#canUpdateScrumFields(taskId)) {
					this.#closeDialog(groupId);
					return;
				}

				// A retry click is a fresh explicit intent, so it opens a new operation window for its
				// task rather than reusing the one the failed attempt was captured in.
				// #createEpic re-throws on failure; the error is already surfaced via #notifyServerError,
				// so swallow it here to avoid an unhandled rejection on a repeated retry click.
				const operationId = startOperationWindow(getState(groupId), taskId);
				void this.#createEpic(taskId, groupId, name, operationId).catch(() => {});
			});

			// Drop a pending retry when its toast is closed manually. Auto-hide does not reach here
			// (it only broadcasts 'close' to other tabs, never to us), so the size cap in
			// #notifyServerError is what ultimately keeps the registry bounded.
			ui_notificationManager.Notifier.subscribe('close', event => {
				this.#pendingRetries.delete(event.getData().id);
			});
		}
		show(params) {
			const taskId = params.taskId;
			const groupId = tasks_v2_provider_service_taskService.taskService.getStoreTask(taskId).groupId;
			const state = getState(groupId);
			// Every open starts a fresh operation window for its own task, so anything still in flight
			// from a previous open of that task must not write back. Only this task's window is touched:
			// opening for a different task merely re-targets the shared per-group dialog and must not
			// cancel a create already started for another task of the same group.
			startOperationWindow(state, taskId);
			state.taskId = taskId;
			// The focus-return callback lives in the per-group state, not in a singleton field: the dialog
			// is cached per group, so two card fields of different tasks must not overwrite each other's.
			state.onClose = params.onClose ?? null;
			// Clear any stale suppression so a fresh show() cannot inherit a previous create's guard.
			state.suppressBindForEpicId = null;

			// Proactively hide the "create epic" footer when the server would deny creation.
			// The right is stable per (group + user), so reading it at the first (lazy) dialog
			// creation is correct; the dialog is cached per group afterwards.
			const canCreateEpic = tasks_v2_provider_service_taskService.taskService.getStoreTask(taskId).canCreateEpic === true;
			dialogs[groupId] ??= this.#createDialog(groupId, canCreateEpic);
			this.#syncCreateAction(groupId, canCreateEpic);

			// The dialog is cached per group and #setFooterError() mutates the footer label in place,
			// so a previous empty-name error would persist into this open. Reset it to the normal label.
			this.#setFooterError(groupId, main_core.Loc.getMessage('TASKS_V2_GROUP_EPIC_FOOTER_CREATE'));
			const epicId = tasks_v2_provider_service_taskService.taskService.getStoreTask(taskId).epicId;
			const items = epicId ? [[tasks_v2_const.EntitySelectorEntity.Epic, epicId]] : [];

			// On the first open the dynamic-load dialog has no items yet, so selectItemsByIds()
			// (it iterates getItems()) cannot preselect the bound epic. setPreselectedItems()
			// makes the dialog select it while loading; selectItemsByIds() then keeps reuse opens
			// in sync once items already exist. Without this, opening/closing without changes
			// reads zero selected items and clears the existing binding (epicId: 0).
			dialogs[groupId].setPreselectedItems(items);
			dialogs[groupId].selectItemsByIds(items);
			dialogs[groupId].showTo(params.targetNode);
		}
		syncCreateAvailability(taskId) {
			const task = tasks_v2_provider_service_taskService.taskService.getStoreTask(taskId);
			if (!task) {
				return;
			}
			const groupId = task.groupId;
			const dialog = dialogs[groupId];
			if (!dialog || getState(groupId).taskId !== taskId) {
				return;
			}
			this.#syncCreateAction(groupId, task.canCreateEpic === true);
		}
		#createDialog(groupId, canCreateEpic) {
			// Preselection is set per-open in show() via setPreselectedItems() because the dialog
			// is created once and reused; computing it here from mutable state would be a stale read.
			const preselectedItems = [];
			return new tasks_v2_lib_entitySelectorDialog.EntitySelectorDialog({
				context: 'tasks-card',
				multiple: false,
				hideOnDeselect: true,
				enableSearch: true,
				entities: [{
					id: tasks_v2_const.EntitySelectorEntity.Epic,
					options: {
						groupId
					},
					dynamicLoad: true,
					dynamicSearch: true
				}],
				searchOptions: {
					allowCreateItem: canCreateEpic,
					footerOptions: {
						label: main_core.Loc.getMessage('TASKS_V2_GROUP_EPIC_FOOTER_CREATE')
					}
				},
				footer: canCreateEpic ? EpicCreateFooter : null,
				footerOptions: this.#getFooterOptions(groupId),
				preselectedItems,
				events: {
					onLoad: () => this.#fillStore(groupId),
					'Search:onItemCreateAsync': event => this.#handleItemCreate(groupId, event)
				},
				popupOptions: {
					events: {
						onClose: () => this.#handleEpicSelect(groupId)
					}
				}
			});
		}
		#handleItemCreate = async (groupId, event) => {
			const name = (event.getData().searchQuery.getQuery() ?? '').trim();
			if (name === '') {
				const errorMessage = main_core.Loc.getMessage('TASKS_V2_GROUP_EPIC_EMPTY_NAME_ERROR');
				this.#setFooterError(groupId, errorMessage);

				// The footer label is a visual-only change; announce it so screen readers
				// learn why the create failed (WCAG 4.1.3 / 3.3.1). ui.a11y is loaded lazily
				// here so this rare error path does not pull ~60 KB into the card's initial load.
				try {
					const {
						LiveAnnouncer
					} = await main_core.Runtime.loadExtension('ui.a11y');
					LiveAnnouncer.announce(errorMessage, 'assertive');
				} catch {
					// Announcement is best-effort; a failed extension load must not break the flow.
				}

				// Reject keeps the dialog open and the entered query untouched.
				throw new Error('empty name');
			}

			// Capture taskId synchronously and open the operation window this create owns, so that
			// neither a concurrent show() nor a selection made while the request is in flight can
			// redirect or overwrite the binding. A create started now is current by definition; it
			// stops being current once the dialog is closed or reopened for this same task.
			const state = getState(groupId);
			const taskId = state.taskId;
			if (!this.#canUpdateScrumFields(taskId)) {
				this.#closeDialog(groupId);
				return;
			}
			const operationId = startOperationWindow(state, taskId);
			await this.#createEpic(taskId, groupId, name, operationId);
		};
		#getFooterOptions(groupId) {
			return {
				manageLabel: main_core.Loc.getMessage('TASKS_V2_GROUP_EPIC_FOOTER_MANAGE'),
				hint: main_core.Loc.getMessage('TASKS_V2_GROUP_EPIC_FOOTER_HINT'),
				onManageEpic: () => this.#showEpicList(groupId)
			};
		}
		#showEpicList = async groupId => {
			const state = getState(groupId);
			const taskId = state.taskId;
			const operationId = state.operations[taskId];
			if (this.#openingEpicLists.get(groupId) === operationId) {
				return;
			}
			this.#openingEpicLists.set(groupId, operationId);
			try {
				let epic = null;
				try {
					const {
						Epic
					} = await main_core.Runtime.loadExtension('tasks.scrum.epic');
					if (!main_core.Type.isFunction(Epic)) {
						throw new TypeError('The tasks.scrum.epic extension does not export Epic');
					}
					if (!isCurrentOperationWindow(state, taskId, operationId) || state.taskId !== taskId) {
						return;
					}
					epic = new Epic({
						view: 'list',
						groupId
					});
				} catch {
					this.#notifyEpicListError();
					return;
				}
				epic.show();
			} finally {
				if (this.#openingEpicLists.get(groupId) === operationId) {
					this.#openingEpicLists.delete(groupId);
				}
			}
		};
		#notifyEpicListError() {
			ui_notificationManager.Notifier.notifyViaBrowserProvider({
				id: `tasks-epic-list-error-${main_core.Text.getRandom()}`,
				text: main_core.Loc.getMessage('TASKS_V2_GROUP_EPIC_LIST_LOAD_ERROR')
			});
		}
		#createEpic = async (taskId, groupId, name, operationId) => {
			try {
				const response = await main_core.ajax.runAction('tasks.scrum.epic.createEpic', {
					data: {
						groupId,
						name
					}
				});
				this.#applyCreatedEpic(taskId, groupId, operationId, response.data);
			} catch (response) {
				this.#notifyServerError(taskId, groupId, name, response);
				throw response;
			}
		};

		// The create action returns code TASKS_EC_02 (Group::ACTION_CREATE_TASKS denied) for
		// read-only roles; ajax.runAction rejects with a plain { errors: [{ code }] } payload.
		#isAccessDenied(response) {
			const errors = response?.errors;
			return Array.isArray(errors) && errors.some(error => error?.code === 'TASKS_EC_02');
		}
		#applyCreatedEpic(taskId, groupId, operationId, data) {
			const epic = {
				id: data.id,
				title: data.name,
				color: data.color
			};

			// The epic exists on the server regardless of what the user did meanwhile, so it is always
			// stored and listed. Only the write-back below is dropped for a stale operation window.
			void tasks_v2_core.Core.getStore().dispatch(`${tasks_v2_const.Model.Epics}/insert`, epic);
			const dialog = dialogs[groupId];
			const state = getState(groupId);
			const isCurrentOperation = isCurrentOperationWindow(state, taskId, operationId) && this.#isTaskStillInGroup(taskId, groupId);
			if (dialog) {
				dialog.addItem({
					entityId: tasks_v2_const.EntitySelectorEntity.Epic,
					id: epic.id,
					title: epic.title,
					avatarOptions: {
						bgColor: epic.color
					},
					// Provider returns its items in the 'recents' tab; place the created epic in the
					// same tab so it stays visible (and rendered) when the dialog is reopened.
					tabs: 'recents'
				});
				if (isCurrentOperation && state.taskId === taskId) {
					// The explicit update below already binds the epic; suppress the duplicate bind
					// that onClose would trigger — but only when it is still this same epic.
					// Programmatic selectItemsByIds does not emit onClose, so we key suppression
					// to the epic id rather than relying on "the next close" (which may be a
					// different epic chosen by the user in the same open dialog).
					state.suppressBindForEpicId = epic.id;
					dialog.selectItemsByIds([[tasks_v2_const.EntitySelectorEntity.Epic, epic.id]]);
				}
			}
			if (isCurrentOperation) {
				if (!this.#canUpdateScrumFields(taskId)) {
					this.#closeDialog(groupId);
					return;
				}
				void tasks_v2_provider_service_taskService.taskService.update(taskId, {
					epicId: epic.id
				});
			}
		}
		#isTaskStillInGroup(taskId, groupId) {
			return tasks_v2_provider_service_taskService.taskService.getStoreTask(taskId)?.groupId === groupId;
		}
		#syncCreateAction(groupId, canCreateEpic) {
			const dialog = dialogs[groupId];
			const searchTab = dialog.getSearchTab?.();
			if (searchTab && searchTab.canCreateItem?.() !== canCreateEpic) {
				searchTab.setAllowCreateItem(canCreateEpic, {
					label: main_core.Loc.getMessage('TASKS_V2_GROUP_EPIC_FOOTER_CREATE')
				});
			}
			const hasCreateFooter = dialog.getFooter() instanceof EpicCreateFooter;
			if (hasCreateFooter !== canCreateEpic) {
				dialog.setFooter(canCreateEpic ? EpicCreateFooter : null, this.#getFooterOptions(groupId));
			}
		}
		#setFooterError(groupId, message) {
			const footer = dialogs[groupId]?.getSearchTab?.()?.getFooter?.();
			footer?.setLabel?.(message);
		}
		#notifyServerError(taskId, groupId, name, response) {
			// An access-denied failure is deterministic: retrying will fail the same way, so show a
			// plain message without a Retry button and without registering a pending retry.
			if (this.#isAccessDenied(response)) {
				ui_notificationManager.Notifier.notifyViaBrowserProvider({
					id: `tasks-epic-create-error-${main_core.Text.getRandom()}`,
					text: main_core.Loc.getMessage('TASKS_V2_GROUP_EPIC_CREATE_ACCESS_DENIED')
				});
				return;
			}
			const id = `tasks-epic-create-error-${main_core.Text.getRandom()}`;
			if (this.#pendingRetries.size >= MAX_PENDING_RETRIES) {
				this.#pendingRetries.delete(this.#pendingRetries.keys().next().value);
			}
			this.#pendingRetries.set(id, {
				taskId,
				groupId,
				name
			});
			ui_notificationManager.Notifier.notifyViaBrowserProvider({
				id,
				text: main_core.Loc.getMessage('TASKS_V2_GROUP_EPIC_CREATE_SERVER_ERROR'),
				button1Text: main_core.Loc.getMessage('TASKS_V2_GROUP_EPIC_CREATE_RETRY')
			});
		}
		#handleEpicSelect = async groupId => {
			const dialog = dialogs[groupId];
			const state = getState(groupId);

			// End the operation window of the task the dialog currently targets, synchronously before any
			// await: whatever the user chose on close wins over an inline create still in flight for THAT
			// task. Other tasks of the group keep their own windows, so their pending creates survive.
			endOperationWindow(state, state.taskId);

			// Consume the callback before any early return below: focus has to go back to the field
			// on every close, even when nothing gets bound. Consuming makes it fire exactly once.
			const onClose = state.onClose;
			state.onClose = null;
			onClose?.();
			if (!dialog?.isLoaded()) {
				// Nothing selectable yet; drop any pending suppression so it cannot leak.
				state.suppressBindForEpicId = null;
				return;
			}
			const suppressedEpicId = state.suppressBindForEpicId;
			state.suppressBindForEpicId = null; // consume once, regardless of outcome

			// Capture the id synchronously before the await so a concurrent show() cannot redirect the bind.
			const taskId = state.taskId;
			if (!this.#isTaskStillInGroup(taskId, groupId)) {
				return;
			}
			const epicId = await this.#fillStore(groupId);
			if (!this.#isTaskStillInGroup(taskId, groupId)) {
				return;
			}

			// The inline-created epic was already bound in #applyCreatedEpic; skip the
			// redundant re-bind only when the closing selection is still that same epic.
			// Programmatic selectItemsByIds does not emit onClose, so suppression must be
			// keyed to the epic id and must never rely on "the next close".
			if (suppressedEpicId !== null && suppressedEpicId === epicId) {
				return;
			}
			if (!this.#canUpdateScrumFields(taskId)) {
				this.#closeDialog(groupId);
				return;
			}
			await tasks_v2_provider_service_taskService.taskService.update(taskId, {
				epicId
			});
		};
		#canUpdateScrumFields(taskId) {
			return typeof taskId !== 'number' || tasks_v2_provider_service_taskService.taskService.getStoreTask(taskId)?.canUpdateScrumFields !== false;
		}
		#closeDialog(groupId) {
			const dialog = dialogs[groupId];
			if (typeof dialog?.isShown !== 'function' || dialog.isShown()) {
				dialog.hide();
			}
		}
		#fillStore = async groupId => {
			const item = dialogs[groupId]?.getSelectedItems()[0];
			if (!item) {
				return 0;
			}
			const epic = {
				id: item.getId(),
				title: item.getTitle(),
				color: item.getAvatarOption('bgColor')
			};
			await tasks_v2_core.Core.getStore().dispatch(`${tasks_v2_const.Model.Epics}/insert`, epic);
			return epic.id;
		};
	}();

	// @vue/component
	const Epic = {
		components: {
			TextXs: ui_system_typography_vue.TextXs,
			BIcon: ui_iconSet_api_vue.BIcon,
			BLine: ui_system_skeleton_vue.BLine
		},
		inject: {
			task: {},
			taskId: {}
		},
		setup() {
			return {
				Outline: ui_iconSet_api_vue.Outline
			};
		},
		data() {
			return {
				scrumInfoState: typeof tasks_v2_provider_service_groupService.groupService.getScrumInfoState === 'function' ? tasks_v2_provider_service_groupService.groupService.getScrumInfoState(this.taskId) : 'loaded',
				unsubscribeScrumInfoState: null,
				isDialogShown: false,
				returnFocusElement: null
			};
		},
		computed: {
			epic() {
				return this.$store.getters[`${tasks_v2_const.Model.Epics}/getById`](this.task.epicId);
			},
			epicColor() {
				if (!this.epic) {
					return '';
				}
				return new tasks_v2_lib_color.Color(this.epic.color).toRgb();
			},
			backgroundColor() {
				if (!this.epic) {
					return '';
				}
				return new tasks_v2_lib_color.Color(this.epic.color).setOpacity(0.3).limit(250).toRgb();
			},
			isDarkColor() {
				if (!this.epic) {
					return false;
				}
				return new tasks_v2_lib_color.Color(this.epic.color).isDark();
			},
			canUpdateScrumFields() {
				return typeof this.taskId !== 'number' || this.task.canUpdateScrumFields !== false && this.task.rights?.edit !== false;
			},
			hasScrumInfo() {
				return this.scrumInfoState === 'loaded';
			}
		},
		watch: {
			taskId: async function onTaskIdChange() {
				this.subscribeScrumInfoState?.(this.taskId);
				await this.loadScrumInfo();
			},
			'task.groupId': function onGroupChange() {
				void this.updateScrumInfoState();
			},
			'task.canCreateEpic': function onCanCreateEpicChange() {
				epicDialog.syncCreateAvailability(this.taskId);
			}
		},
		async mounted() {
			this.subscribeScrumInfoState(this.taskId);
			await this.updateScrumInfoState();

			// A create-mode draft has a string taskId, so getScrumInfo above no-ops and never confirms the
			// create-epic right; resolve it by groupId and update an already-open non-reactive selector.
			await tasks_v2_provider_service_groupService.groupService.getEpicCreationRight(this.taskId);
			epicDialog.syncCreateAvailability(this.taskId);
		},
		beforeUnmount() {
			this.unsubscribeScrumInfoState?.();
		},
		methods: {
			subscribeScrumInfoState(taskId) {
				this.unsubscribeScrumInfoState?.();
				this.unsubscribeScrumInfoState = tasks_v2_provider_service_groupService.groupService.subscribeScrumInfoState?.(taskId, state => {
					this.scrumInfoState = state;
				});
			},
			async updateScrumInfoState() {
				let request = tasks_v2_provider_service_groupService.groupService.getScrumInfo(this.taskId);
				this.scrumInfoState = tasks_v2_provider_service_groupService.groupService.getScrumInfoState?.(this.taskId) ?? 'loaded';
				await request;

				// A group change can finish the old request before the update flow starts its force refetch.
				// Start or join the current generation instead of accepting the stale loading state.
				if (tasks_v2_provider_service_groupService.groupService.getScrumInfoState?.(this.taskId) === 'loading') {
					request = tasks_v2_provider_service_groupService.groupService.getScrumInfo(this.taskId);
					this.scrumInfoState = tasks_v2_provider_service_groupService.groupService.getScrumInfoState?.(this.taskId) ?? 'loaded';
					await request;
				}
				this.scrumInfoState = tasks_v2_provider_service_groupService.groupService.getScrumInfoState?.(this.taskId) ?? 'loaded';
			},
			async loadScrumInfo() {
				if (typeof this.updateScrumInfoState !== 'function') {
					await tasks_v2_provider_service_groupService.groupService.getScrumInfo(this.taskId);
					this.hasScrumInfo = tasks_v2_provider_service_groupService.groupService.hasScrumInfo(this.taskId);
					return;
				}
				await this.updateScrumInfoState();
			},
			showDialog() {
				if (!this.canUpdateScrumFields) {
					return;
				}
				this.returnFocusElement = document.activeElement;
				this.isDialogShown = true;
				epicDialog.show({
					targetNode: this.$el,
					taskId: this.taskId,
					onClose: this.handleDialogClose
				});
			},
			handleDialogClose() {
				this.isDialogShown = false;
				const element = this.returnFocusElement;
				this.returnFocusElement = null;
				if (element?.isConnected) {
					element.focus?.();
				}
			}
		},
		template: `
		<button
			v-if="hasScrumInfo && !epic?.isRestricted && canUpdateScrumFields"
			type="button"
			class="tasks-field-epic print-background-white"
			:class="{ '--dark': isDarkColor, '--filled': epic }"
			:style="{
				'--epic-color': epicColor,
				'--epic-background': backgroundColor,
			}"
			:title="epic?.title"
			:aria-label="loc('TASKS_V2_GROUP_EPIC_ARIA_LABEL')"
			aria-haspopup="dialog"
			:aria-expanded="isDialogShown"
			@click="showDialog"
		>
			<TextXs className="tasks-field-epic-title">
				{{ epic?.title || loc('TASKS_V2_GROUP_CHOOSE_EPIC') }}
			</TextXs>
			<BIcon :name="Outline.CHEVRON_DOWN_S" class="print-ignore" aria-hidden="true"/>
		</button>
		<div v-else-if="hasScrumInfo && !epic?.isRestricted" class="tasks-field-epic print-background-white" :class="{ '--dark': isDarkColor, '--filled': epic }">
			<TextXs className="tasks-field-epic-title">{{ epic?.title || '-' }}</TextXs>
		</div>
		<div v-else-if="scrumInfoState === 'loading'" class="tasks-field-epic-loader">
			<BLine :width="80" :height="10"/>
		</div>
	`
	};

	// @vue/component
	const StoryPoints = {
		components: {
			TextXs: ui_system_typography_vue.TextXs,
			BLine: ui_system_skeleton_vue.BLine
		},
		inject: {
			task: {},
			taskId: {}
		},
		setup() {},
		data() {
			return {
				isFocused: false,
				scrumInfoState: typeof tasks_v2_provider_service_groupService.groupService.getScrumInfoState === 'function' ? tasks_v2_provider_service_groupService.groupService.getScrumInfoState(this.taskId) : 'loaded',
				unsubscribeScrumInfoState: null
			};
		},
		computed: {
			epic() {
				return tasks_v2_core.Core.getStore()?.getters?.[`${tasks_v2_const.Model.Epics}/getById`]?.(this.task.epicId);
			},
			storyPoints() {
				return this.task.storyPoints?.trim();
			},
			canUpdateScrumFields() {
				return typeof this.taskId !== 'number' || this.task.canUpdateScrumFields !== false;
			}
		},
		watch: {
			taskId: async function onTaskIdChange() {
				this.subscribeScrumInfoState?.(this.taskId);
				await this.loadScrumInfo();
			},
			'task.groupId': function onGroupChange() {
				void this.updateScrumInfoState();
			}
		},
		async mounted() {
			this.subscribeScrumInfoState(this.taskId);
			await this.updateScrumInfoState();
		},
		beforeUnmount() {
			this.unsubscribeScrumInfoState?.();
		},
		methods: {
			subscribeScrumInfoState(taskId) {
				this.unsubscribeScrumInfoState?.();
				this.unsubscribeScrumInfoState = tasks_v2_provider_service_groupService.groupService.subscribeScrumInfoState?.(taskId, state => {
					this.scrumInfoState = state;
				});
			},
			async updateScrumInfoState() {
				let request = tasks_v2_provider_service_groupService.groupService.getScrumInfo(this.taskId);
				this.scrumInfoState = tasks_v2_provider_service_groupService.groupService.getScrumInfoState?.(this.taskId) ?? 'loaded';
				await request;

				// A group change can finish the old request before the update flow starts its force refetch.
				// Start or join the current generation instead of accepting the stale loading state.
				if (tasks_v2_provider_service_groupService.groupService.getScrumInfoState?.(this.taskId) === 'loading') {
					request = tasks_v2_provider_service_groupService.groupService.getScrumInfo(this.taskId);
					this.scrumInfoState = tasks_v2_provider_service_groupService.groupService.getScrumInfoState?.(this.taskId) ?? 'loaded';
					await request;
				}
				this.scrumInfoState = tasks_v2_provider_service_groupService.groupService.getScrumInfoState?.(this.taskId) ?? 'loaded';
			},
			async loadScrumInfo() {
				if (typeof this.updateScrumInfoState !== 'function') {
					await tasks_v2_provider_service_groupService.groupService.getScrumInfo(this.taskId);
					this.hasScrumInfo = tasks_v2_provider_service_groupService.groupService.hasScrumInfo(this.taskId);
					return;
				}
				await this.updateScrumInfoState();
			},
			async handleClick() {
				if (!this.canUpdateScrumFields) {
					return;
				}
				this.isFocused = true;
				await this.$nextTick();
				this.$refs.input.focus();
			},
			handleBlur() {
				this.isFocused = false;
				if (!this.canUpdateScrumFields) {
					return;
				}
				void tasks_v2_provider_service_taskService.taskService.update(this.taskId, {
					storyPoints: this.$refs.input.value.trim()
				});
			}
		},
		template: `
		<div
			v-if="scrumInfoState === 'loaded' && epic?.isRestricted"
			class="tasks-field-story-points --restricted print-background-white"
			:class="{ '--filled': storyPoints }"
		>
			<TextXs className="tasks-field-story-points-text print-background-white print-font-color-base-1">
				{{ storyPoints || '-' }}
			</TextXs>
		</div>
		<div v-else-if="scrumInfoState === 'loaded' && canUpdateScrumFields" class="tasks-field-story-points" :class="{ '--filled': storyPoints }">
			<input
				v-if="isFocused"
				class="tasks-field-story-points-input"
				:value="storyPoints"
				:aria-label="loc('TASKS_V2_GROUP_STORY_POINTS_ARIA_LABEL')"
				ref="input"
				@blur="handleBlur"
			/>
			<TextXs
				v-else
				tag="button"
				type="button"
				className="tasks-field-story-points-text print-background-white print-font-color-base-1"
				:aria-label="loc('TASKS_V2_GROUP_STORY_POINTS_ARIA_LABEL')"
				@click="handleClick"
			>
				{{ storyPoints || '-' }}
			</TextXs>
		</div>
		<div v-else-if="scrumInfoState === 'loaded'" class="tasks-field-story-points" :class="{ '--filled': storyPoints }">
			<TextXs className="tasks-field-story-points-text print-font-color-base-1">{{ storyPoints || '-' }}</TextXs>
		</div>
		<div v-else-if="scrumInfoState === 'loading'" class="tasks-field-story-points-loader">
			<BLine :width="30" :height="10"/>
		</div>
	`
	};

	// @vue/component
	const GroupChip = {
		components: {
			Chip: ui_system_chip_vue.Chip,
			Hint: tasks_v2_component_elements_hint.Hint,
			GroupPopup
		},
		inject: {
			settings: {},
			analytics: {},
			cardType: {},
			task: {},
			taskId: {},
			embedded: {}
		},
		props: {
			isAutonomous: {
				type: Boolean,
				default: false
			}
		},
		setup() {
			return {
				groupMeta
			};
		},
		data() {
			return {
				doShowHint: false,
				isDialogShown: false
			};
		},
		computed: {
			group() {
				return this.$store.getters[`${tasks_v2_const.Model.Groups}/getById`](this.task.groupId);
			},
			design() {
				return {
					[!this.isAutonomous && !this.isSelected]: ui_system_chip_vue.ChipDesign.ShadowNoAccent,
					[!this.isAutonomous && this.isSelected]: ui_system_chip_vue.ChipDesign.ShadowAccent,
					[this.isAutonomous && !this.isSelected]: ui_system_chip_vue.ChipDesign.OutlineNoAccent,
					[this.isAutonomous && this.isSelected]: ui_system_chip_vue.ChipDesign.OutlineAccent
				}.true;
			},
			isSelected() {
				if (this.isAutonomous) {
					return this.task.groupId > 0;
				}
				return this.task.filledFields[groupMeta.id];
			},
			isFilled() {
				return Boolean(this.isAutonomous && this.group);
			},
			isFlowFilled() {
				return this.task.flowId > 0;
			},
			text() {
				if (this.isFilled) {
					return this.group?.name ?? this.loc('TASKS_V2_GROUP_HIDDEN');
				}
				return this.loc('TASKS_V2_GROUP_TITLE_CHIP');
			},
			icon() {
				if (this.isFilled) {
					return null;
				}
				return ui_iconSet_api_vue.Outline.FOLDER;
			},
			image() {
				if (!this.isFilled) {
					return null;
				}
				if (!this.group?.image) {
					return null;
				}
				return {
					src: encodeURI(this.group.image),
					alt: this.group?.name
				};
			},
			canChange() {
				return (this.task.flowId ?? 0) <= 0;
			},
			isLocked() {
				return !this.settings.restrictions.project.available;
			},
			opensDialog() {
				return (this.isAutonomous || !this.isSelected) && !this.isLocked && !this.isFlowFilled;
			},
			ariaLabel() {
				if (!this.isFilled) {
					return this.text;
				}
				return this.loc('TASKS_V2_GROUP_VALUE_ARIA_LABEL', {
					'#TITLE#': groupMeta.getTitle(this.task.groupId),
					'#VALUE#': this.text
				});
			}
		},
		watch: {
			isDialogShown() {
				this.syncAria();
			},
			opensDialog() {
				this.syncAria();
			},
			text() {
				this.syncAria();
			}
		},
		async created() {
			if (this.task.groupId && !this.group && !this.task.flowId) {
				const group = await tasks_v2_provider_service_groupService.groupService.getGroup(this.task.groupId);
				if (!group) {
					tasks_v2_provider_service_taskService.taskService.updateStoreTask(this.taskId, {
						groupId: 0,
						stageId: 0
					});
				}
			}
		},
		mounted() {
			this.syncAria();
		},
		methods: {
			handleClick() {
				if (!this.isAutonomous && this.isSelected) {
					this.highlightField();
					return;
				}
				if (this.isLocked) {
					void tasks_v2_lib_showLimit.showLimit({
						featureId: this.settings.restrictions.project.featureId
					});
					return;
				}
				if (this.isFlowFilled) {
					this.doShowHint = true;
					return;
				}
				this.isDialogShown = true;
				const targetNode = this.getChipElement();
				if (!targetNode) {
					return;
				}
				groupDialog.show({
					targetNode,
					taskId: this.taskId,
					onClose: this.handleDialogClose
				});
			},
			handleDialogClose(groupId) {
				this.isDialogShown = false;
				this.$refs.chip?.$el?.focus();
				if (groupId === undefined) {
					return;
				}
				if (!this.isAutonomous && this.isSelected) {
					this.highlightField();
				}
				if (groupId) {
					tasks_v2_lib_analytics.analytics.sendAddProject(this.analytics, {
						cardType: this.cardType,
						taskId: main_core.Type.isNumber(this.taskId) ? this.taskId : 0,
						viewersCount: this.task.auditorsIds.length,
						coexecutorsCount: this.task.accomplicesIds.length
					});
				}
			},
			async openGroup() {
				if (this.embedded) {
					void groupDialog.openProject(this.group);
				} else {
					void groupDialog.openGroup(this.isAutonomous, this.group, this.taskId);
				}
			},
			highlightField() {
				void tasks_v2_lib_fieldHighlighter.fieldHighlighter.setContainer(this.$root.$el).highlight(groupMeta.id);
			},
			handleClear() {
				void tasks_v2_provider_service_taskService.taskService.update(this.taskId, {
					groupId: 0,
					stageId: 0
				});
			},
			handleKeydown(event) {
				if (event.key !== ' ') {
					return;
				}
				event.preventDefault();
				this.handleClick();
			},
			syncAria() {
				const el = this.getChipElement();
				if (!el) {
					return;
				}
				main_core.Dom.attr(el, 'role', 'button');
				main_core.Dom.attr(el, 'aria-haspopup', this.opensDialog ? 'dialog' : null);
				main_core.Dom.attr(el, 'aria-expanded', this.opensDialog ? String(this.isDialogShown) : null);
				main_core.Dom.attr(el, 'aria-label', this.ariaLabel);
			},
			getChipElement() {
				return this.$refs.chip?.$el ?? null;
			}
		},
		template: `
		<Chip
			:design
			:icon
			:image
			:text
			:withClear="isFilled && !isFlowFilled"
			:lock="isLocked"
			:trimmable="isFilled"
			:data-task-id="taskId"
			:data-task-chip-id="groupMeta.id"
			:data-task-chip-value="task.groupId"
			ref="chip"
			@click="handleClick"
			@clear="handleClear"
			@keydown="handleKeydown"
		/>
		<Hint
			v-if="doShowHint && getChipElement()"
			:bindElement="getChipElement()"
			@close="doShowHint = false"
		>
			{{ loc('TASKS_V2_GROUP_CANT_CHANGE_FLOW') }}
		</Hint>
		<GroupPopup
			v-if="isAutonomous"
			:getBindElement="getChipElement"
			@openGroup="openGroup"
		/>
	`
	};

	exports.Epic = Epic;
	exports.Group = Group;
	exports.GroupChip = GroupChip;
	exports.Stage = Stage;
	exports.StoryPoints = StoryPoints;
	exports.groupMeta = groupMeta;

})(this.BX.Tasks.V2.Component.Fields = this.BX.Tasks.V2.Component.Fields || {}, BX.UI.IconSet, window, BX.Tasks.V2.Const, BX.Tasks.V2.Component.Elements, BX.Tasks.V2.Component.Elements, BX.Tasks.V2.Component.Elements, BX.Tasks.V2.Lib, BX.Tasks.V2.Provider.Service, BX, BX.Tasks.V2, BX.UI.Accessibility, BX.Vue3.Components, BX.UI.Vue3.Components, BX.Tasks.V2.Provider.Service, BX.Tasks.V2.Provider.Service, BX.Event, BX.UI.NotificationManager, BX, BX.Tasks.V2.Lib, BX.UI.System.Menu, BX.UI.System.Skeleton.Vue, BX.UI.IconSet, window, BX.Tasks.V2.Lib, BX.Tasks.V2.Lib, BX.UI.System.Typography.Vue, BX.UI.EntitySelector, BX.UI.System.Chip.Vue, BX.Tasks.V2.Lib, BX.Tasks.V2.Lib);
//# sourceMappingURL=group.bundle.js.map

/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Component = this.BX.Tasks.V2.Component || {};
(function (exports, ui_iconSet_api_vue, ui_iconSet_outline, tasks_v2_const, tasks_v2_component_elements_hint, tasks_v2_component_elements_hoverPill, tasks_v2_component_elements_fieldAdd, tasks_v2_lib_showLimit, tasks_v2_provider_service_taskService, main_core, tasks_v2_core, ui_vue3_components_button, ui_vue3_components_popup, tasks_v2_provider_service_groupService, tasks_v2_provider_service_userService, main_core_events, ui_notificationManager, im_public, tasks_v2_lib_entitySelectorDialog, ui_system_menu_vue, ui_system_skeleton_vue, ui_iconSet_api_core, ui_iconSet_crm, tasks_v2_lib_color, tasks_v2_lib_scrumManager, ui_system_typography_vue, ui_system_chip_vue, tasks_v2_lib_fieldHighlighter, tasks_v2_lib_analytics) {
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
					targetContainer: document.body
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
			}
		},
		mounted() {
			main_core.Event.bind(this.bindElement, 'click', this.handleClick);
			main_core.Event.bind(this.bindElement, 'mouseenter', this.handleMouseEnter);
			main_core.Event.bind(this.bindElement, 'mouseleave', this.handleMouseLeave);
		},
		methods: {
			openGroup() {
				this.closePopup();
				this.$emit('openGroup');
			},
			handleClick() {
				this.clearTimeouts();
			},
			handleMouseEnter() {
				if (!this.group) {
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
					if (!this.$refs.container?.contains(this.hoverElement) && !this.bindElement.contains(this.hoverElement)) {
						this.closePopup();
					}
				}, 100);
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
				this.clearTimeouts();
				this.isPopupShown = false;
				main_core.Event.unbind(this.$refs.container, 'mouseleave', this.handleMouseLeave);
				main_core.Event.unbind(document, 'mouseover', this.updateHoverElement);
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
		async openGroup(isAutonomous, group, taskId = 0) {
			if (tasks_v2_core.Core.getParams().features.isNewProjectsOn && (im_public.Messenger.isEmbeddedMode() || im_public.Messenger.isMessengerSliderOpened()) && group.type !== tasks_v2_const.GroupType.Scrum) {
				const closeEventName = isAutonomous ? tasks_v2_const.EventName.CardClosed : tasks_v2_const.EventName.FullCardClosed;
				main_core_events.EventEmitter.subscribeOnce(closeEventName, () => {
					im_public.Messenger.openCollab(`sg${group.id}`);
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
				im_public.Messenger.openCollab(`sg${group.id}`);
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
			if (!this.#dialog.isLoaded()) {
				return;
			}
			const groupId = await this.#fillStore();
			if (this.#groupId === groupId) {
				return;
			}
			tasks_v2_provider_service_groupService.groupService.setHasScrumInfo(this.#taskId);
			this.#onClose?.(groupId);
			tasks_v2_provider_service_taskService.taskService.setSilentErrorMode(true);
			const result = await tasks_v2_provider_service_taskService.taskService.update(this.#taskId, {
				groupId,
				stageId: 0
			});
			tasks_v2_provider_service_taskService.taskService.setSilentErrorMode(false);
			if (result[tasks_v2_const.Endpoint.TaskUpdate]?.length) {
				const error = result[tasks_v2_const.Endpoint.TaskUpdate][0];
				ui_notificationManager.Notifier.notifyViaBrowserProvider({
					id: 'task-notify-update-group-error',
					text: error?.message
				});
			}
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
				isHintShown: false
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
			isSecret() {
				return Boolean(this.task.groupId) && !this.group;
			},
			hasFlow() {
				return this.task.flowId > 0;
			},
			readonly() {
				return !this.task.rights.edit || this.hasFlow;
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
					if (!this.isSecret) {
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
				if (this.embedded) {
					void groupDialog.openProject(this.group);
				} else {
					void groupDialog.openGroup(false, this.group, this.taskId);
				}
			},
			showDialog() {
				groupDialog.show({
					targetNode: this.$refs.group,
					taskId: this.taskId
				});
			},
			clear() {
				void tasks_v2_provider_service_taskService.taskService.update(this.taskId, {
					groupId: 0,
					stageId: 0
				});
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
			<div class="tasks-field-group-group" :class="{ '--secret': isSecret }" @click="handleClick">
				<HoverPill
					v-if="task.groupId"
					:withClear
					@clear="clear"
				>
					<img v-if="groupImage" class="tasks-field-group-image" :src="groupImage" :alt="groupName"/>
					<BIcon v-else class="tasks-field-group-icon" :name="Outline.FOLDER"/>
					<div class="tasks-field-group-title">{{ groupName }}</div>
				</HoverPill>
				<FieldAdd v-else :icon="Outline.FOLDER_PLUS"/>
			</div>
		</div>
		<Hint v-if="isHintShown" :bindElement="$refs.group" @close="isHintShown = false">
			{{ loc('TASKS_V2_GROUP_CANT_CHANGE_FLOW') }}
		</Hint>
		<GroupPopup :getBindElement="() => $refs.group" @openGroup="openGroup"/>
	`
	};

	// @vue/component
	const Stage = {
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			BMenu: ui_system_menu_vue.BMenu,
			BLine: ui_system_skeleton_vue.BLine
		},
		inject: {
			task: {},
			taskId: {},
			isEdit: {}
		},
		setup() {
			return {
				Outline: ui_iconSet_api_vue.Outline
			};
		},
		data() {
			return {
				isMenuShown: false
			};
		},
		computed: {
			group() {
				return this.$store.getters[`${tasks_v2_const.Model.Groups}/getById`](this.task.groupId);
			},
			groupId() {
				return this.task.groupId;
			},
			stageId() {
				return this.task.stageId;
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
				return !this.task.rights.sort;
			}
		},
		watch: {
			groupId() {
				void this.loadStagesForCreation();
			}
		},
		created() {
			void this.loadStagesForCreation();
		},
		methods: {
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
			async setStage(stageId) {
				const scrumManager = new tasks_v2_lib_scrumManager.ScrumManager({
					taskId: this.task.id,
					parentId: this.task.parentId,
					groupId: this.task.groupId
				});
				let canMove = true;
				if (scrumManager.isScrum(this.group?.type)) {
					const stage = (await this.$store.getters[`${tasks_v2_const.Model.Stages}/getById`](stageId)) ?? null;
					if (stage.systemType === 'FINISH') {
						canMove = await scrumManager.handleDodDisplay();
					}
				}
				if (!canMove) {
					return;
				}
				await tasks_v2_provider_service_taskService.taskService.setStage(this.taskId, stageId);
				if (scrumManager.isScrum(this.group?.type)) {
					void scrumManager?.handleParentState();
				}
			},
			async loadStagesForCreation() {
				if (this.isEdit || this.group.stagesIds) {
					return;
				}
				await tasks_v2_provider_service_groupService.groupService.getStages(this.groupId);
			}
		},
		template: `
		<div
			v-if="stage?.id"
			class="tasks-field-group-stage"
			:class="{ '--dark': isDarkColor, '--readonly': readonly }"
			:style="{
				'--stage-color': '#' + stage.color,
				'--stage-background': backgroundColor,
			}"
			:title="stage?.title"
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
			<BIcon v-if="!readonly" :name="Outline.CHEVRON_DOWN_S" class="print-ignore"/>
		</div>
		<div v-else class="tasks-field-group-stage-loader">
			<BLine :width="80" :height="10"/>
		</div>
		<BMenu v-if="isMenuShown" :options="menuOptions()" @close="isMenuShown = false"/>
	`
	};

	const dialogs = {};
	const epicDialog = new class {
		#taskId;
		show(params) {
			this.#taskId = params.taskId;
			this.#dialog.selectItemsByIds(this.#items);
			this.#dialog.showTo(params.targetNode);
		}
		get #dialog() {
			const groupId = tasks_v2_provider_service_taskService.taskService.getStoreTask(this.#taskId).groupId;
			dialogs[groupId] ??= this.#createDialog(groupId);
			return dialogs[groupId];
		}
		#createDialog(groupId) {
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
				preselectedItems: this.#items,
				events: {
					onLoad: this.#fillStore
				},
				popupOptions: {
					events: {
						onClose: this.#handleEpicSelect
					}
				}
			});
		}
		#handleEpicSelect = async () => {
			if (!this.#dialog.isLoaded()) {
				return;
			}
			const epicId = await this.#fillStore();
			await tasks_v2_provider_service_taskService.taskService.update(this.#taskId, {
				epicId
			});
		};
		#fillStore = async () => {
			const item = this.#dialog.getSelectedItems()[0];
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
		get #items() {
			const epicId = tasks_v2_provider_service_taskService.taskService.getStoreTask(this.#taskId).epicId;
			return epicId ? [[tasks_v2_const.EntitySelectorEntity.Epic, epicId]] : [];
		}
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
				hasScrumInfo: tasks_v2_provider_service_groupService.groupService.hasScrumInfo(this.taskId)
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
			}
		},
		async mounted() {
			await tasks_v2_provider_service_groupService.groupService.getScrumInfo(this.taskId);
			this.hasScrumInfo = tasks_v2_provider_service_groupService.groupService.hasScrumInfo(this.taskId);
		},
		methods: {
			showDialog() {
				epicDialog.show({
					targetNode: this.$el,
					taskId: this.taskId
				});
			}
		},
		template: `
		<div
			v-if="hasScrumInfo"
			class="tasks-field-epic print-background-white"
			:class="{ '--dark': isDarkColor, '--filled': epic }"
			:style="{
				'--epic-color': epicColor,
				'--epic-background': backgroundColor,
			}"
			:title="epic?.title"
			@click="showDialog"
		>
			<TextXs className="tasks-field-epic-title">
				{{ epic?.title || loc('TASKS_V2_GROUP_CHOOSE_EPIC') }}
			</TextXs>
			<BIcon :name="Outline.CHEVRON_DOWN_S" class="print-ignore"/>
		</div>
		<div v-else class="tasks-field-epic-loader">
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
				hasScrumInfo: tasks_v2_provider_service_groupService.groupService.hasScrumInfo(this.taskId)
			};
		},
		computed: {
			storyPoints() {
				return this.task.storyPoints?.trim();
			}
		},
		async mounted() {
			await tasks_v2_provider_service_groupService.groupService.getScrumInfo(this.taskId);
			this.hasScrumInfo = tasks_v2_provider_service_groupService.groupService.hasScrumInfo(this.taskId);
		},
		methods: {
			async handleClick() {
				this.isFocused = true;
				await this.$nextTick();
				this.$refs.input.focus();
			},
			handleBlur() {
				this.isFocused = false;
				void tasks_v2_provider_service_taskService.taskService.update(this.taskId, {
					storyPoints: this.$refs.input.value.trim()
				});
			}
		},
		template: `
		<div v-if="hasScrumInfo" class="tasks-field-story-points" :class="{ '--filled': storyPoints }">
			<input
				v-if="isFocused"
				class="tasks-field-story-points-input"
				:value="storyPoints"
				ref="input"
				@blur="handleBlur"
			/>
			<TextXs
				v-else
				className="tasks-field-story-points-text print-background-white print-font-color-base-1"
				@click="handleClick"
			>
				{{ storyPoints || '-' }}
			</TextXs>
		</div>
		<div v-else class="tasks-field-story-points-loader">
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
				doShowHint: false
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
				groupDialog.show({
					targetNode: this.$refs.chip.$el,
					taskId: this.taskId,
					onClose: this.handleDialogClose
				});
			},
			handleDialogClose(groupId) {
				if (this.isAutonomous) {
					this.$refs.chip?.$el.focus();
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
		/>
		<Hint
			v-if="doShowHint"
			:bindElement="$refs.chip.$el"
			@close="doShowHint = false"
		>
			{{ loc('TASKS_V2_GROUP_CANT_CHANGE_FLOW') }}
		</Hint>
		<GroupPopup
			v-if="isAutonomous"
			:getBindElement="() => $refs.chip.$el"
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

})(this.BX.Tasks.V2.Component.Fields = this.BX.Tasks.V2.Component.Fields || {}, BX.UI.IconSet, window, BX.Tasks.V2.Const, BX.Tasks.V2.Component.Elements, BX.Tasks.V2.Component.Elements, BX.Tasks.V2.Component.Elements, BX.Tasks.V2.Lib, BX.Tasks.V2.Provider.Service, BX, BX.Tasks.V2, BX.Vue3.Components, BX.UI.Vue3.Components, BX.Tasks.V2.Provider.Service, BX.Tasks.V2.Provider.Service, BX.Event, BX.UI.NotificationManager, BX.Messenger.v2.Lib, BX.Tasks.V2.Lib, BX.UI.System.Menu, BX.UI.System.Skeleton.Vue, BX.UI.IconSet, window, BX.Tasks.V2.Lib, BX.Tasks.V2.Lib, BX.UI.System.Typography.Vue, BX.UI.System.Chip.Vue, BX.Tasks.V2.Lib, BX.Tasks.V2.Lib);
//# sourceMappingURL=group.bundle.js.map

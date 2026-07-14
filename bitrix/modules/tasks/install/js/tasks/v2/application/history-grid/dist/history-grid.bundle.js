/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
(function (exports, ui_vue3, ui_vue3_mixins_locMixin, main_core, main_core_events, main_popup, ui_system_typography_vue, tasks_v2_lib_apiClient, tasks_v2_lib_timezone, main_date, tasks_v2_provider_service_userService, ui_vue3_components_richLoc) {
	'use strict';

	// @vue/component
	const ChangesetTime = {
		props: {
			getGrid: {
				type: Function,
				required: true
			}
		},
		data() {
			return {
				changesetTimeRef: [],
				changesetTime: []
			};
		},
		methods: {
			async update() {
				const time = this.getGrid().querySelectorAll('[data-time]');
				this.changesetTime = [...time].map(changesetTimeNode => this.getChangesetTime(changesetTimeNode));
				await this.$nextTick();
				time.forEach(changesetTimeNode => {
					const changesetTime = this.getChangesetTime(changesetTimeNode);
					changesetTimeNode.append(this.changesetTimeRef[changesetTime.rowId]);
				});
			},
			getChangesetTime(changesetTimeNode) {
				const rowId = Number(changesetTimeNode.closest('[data-id]').dataset.id);
				const offsetTimestamp = this.getOffsetTimestamp(changesetTimeNode.dataset.time);
				return {
					rowId,
					offsetTimestamp
				};
			},
			getOffsetTimestamp(timestampString) {
				const timestamp = Number(timestampString) * 1000;
				const offset = tasks_v2_lib_timezone.timezone.getOffset(timestamp);
				const offsetTimestamp = (timestamp + offset) / 1000;
				return main_date.DateTimeFormat.format(main_date.DateTimeFormat.getFormat('FORMAT_DATETIME'), offsetTimestamp);
			},
			setRef(element, rowId) {
				this.changesetTimeRef ??= {};
				this.changesetTimeRef[rowId] = element;
			}
		},
		template: `
		<template v-for="(time, id) in changesetTime" :key="id">
			<div :ref="(el) => setRef(el, time.rowId)">{{ time.offsetTimestamp }}</div>
		</template>
	`
	};

	// @vue/component
	const Authors = {
		props: {
			getGrid: {
				type: Function,
				required: true
			}
		},
		data() {
			return {
				authorsRefs: [],
				authors: []
			};
		},
		methods: {
			async update() {
				const authors = this.getGrid().querySelectorAll('[data-author][data-author-id]');
				this.authors = [...authors].map(authorNode => this.getAuthor(authorNode));
				await this.$nextTick();
				authors.forEach(authorNode => {
					const author = this.getAuthor(authorNode);
					authorNode.append(this.authorsRefs[author.rowId]);
				});
			},
			getAuthor(authorNode) {
				const rowId = Number(authorNode.closest('[data-id]').dataset.id);
				const author = JSON.parse(authorNode.dataset.author);
				const authorId = Number(authorNode.dataset.authorId);
				const type = JSON.parse(authorNode.dataset.authorType);
				return {
					rowId,
					author,
					authorId,
					type
				};
			},
			setRef(element, rowId) {
				this.authorsRefs ??= {};
				this.authorsRefs[rowId] = element;
			},
			getUserUrl(userId) {
				return tasks_v2_provider_service_userService.userService.getUrl(userId);
			}
		},
		template: `
		<template v-for="(author, id) in authors" :key="id">
			<a
				:ref="(el) => setRef(el, author.rowId)"
				:href="getUserUrl(author.authorId)"
				class="tasks-history-grid-author-column-element"
				:class="{ '--collaber' : author.type === 'collaber'}"
			>
				{{ author.author }}
			</a>
		</template>
	`
	};

	const localizationMap = {
		NEW: 'TASKS_V2_HISTORY_LOG_NEW',
		TITLE: 'TASKS_V2_HISTORY_LOG_TITLE',
		DESCRIPTION: 'TASKS_V2_HISTORY_LOG_DESCRIPTION',
		CREATED_BY: 'TASKS_V2_HISTORY_LOG_CREATED_BY',
		RESPONSIBLE_ID: 'TASKS_V2_HISTORY_LOG_RESPONSIBLE_ID',
		FLOW_ID: 'TASKS_V2_HISTORY_LOG_FLOW_ID',
		DEADLINE: 'TASKS_V2_HISTORY_LOG_DEADLINE',
		ACCOMPLICES: 'TASKS_V2_HISTORY_LOG_ACCOMPLICES',
		AUDITORS: 'TASKS_V2_HISTORY_LOG_AUDITORS',
		UF_TASK_WEBDAV_FILES: 'TASKS_V2_HISTORY_LOG_UF_TASK_WEBDAV_FILES',
		TAGS: 'TASKS_V2_HISTORY_LOG_TAGS',
		PRIORITY: 'TASKS_V2_HISTORY_LOG_PRIORITY',
		GROUP_ID: 'TASKS_V2_HISTORY_LOG_GROUP_ID',
		STAGE: 'TASKS_V2_HISTORY_LOG_STAGE',
		PARENT_ID: 'TASKS_V2_HISTORY_LOG_PARENT_ID',
		DEPENDS_ON: 'TASKS_V2_HISTORY_LOG_DEPENDS_ON',
		STATUS: 'TASKS_V2_HISTORY_LOG_STATUS',
		MARK: 'TASKS_V2_HISTORY_LOG_MARK',
		ADD_IN_REPORT: 'TASKS_V2_HISTORY_LOG_ADD_IN_REPORT',
		DELETE: 'TASKS_V2_HISTORY_LOG_DELETE',
		RENEW: 'TASKS_V2_HISTORY_LOG_RENEW',
		MOVE_TO_SPRINT: 'TASKS_V2_HISTORY_LOG_MOVE_TO_SPRINT',
		MOVE_TO_BACKLOG: 'TASKS_V2_HISTORY_LOG_MOVE_TO_BACKLOG',
		DELETED_FILES: 'TASKS_V2_HISTORY_LOG_DELETED_FILES',
		NEW_FILES: 'TASKS_V2_HISTORY_LOG_NEW_FILES',
		COMMENT: 'TASKS_V2_HISTORY_LOG_COMMENT',
		COMMENT_EDIT: 'TASKS_V2_HISTORY_LOG_COMMENT_EDIT',
		COMMENT_DEL: 'TASKS_V2_HISTORY_LOG_COMMENT_DEL',
		RESULT_REMOVE: 'TASKS_V2_HISTORY_LOG_RESULT_REMOVE',
		RESULT_EDIT: 'TASKS_V2_HISTORY_LOG_RESULT_EDIT',
		RESULT: 'TASKS_V2_HISTORY_LOG_RESULT',
		START_DATE_PLAN: 'TASKS_V2_HISTORY_LOG_START_DATE_PLAN',
		END_DATE_PLAN: 'TASKS_V2_HISTORY_LOG_END_DATE_PLAN',
		DURATION_PLAN: 'TASKS_V2_HISTORY_LOG_DURATION_PLAN',
		DURATION_PLAN_SECONDS: 'TASKS_V2_HISTORY_LOG_DURATION_PLAN_SECONDS',
		DURATION_FACT: 'TASKS_V2_HISTORY_LOG_DURATION_FACT',
		TIME_ESTIMATE: 'TASKS_V2_HISTORY_LOG_TIME_ESTIMATE',
		TIME_SPENT_IN_LOGS: 'TASKS_V2_HISTORY_LOG_TIME_SPENT_IN_LOGS',
		CHECKLIST_ITEM_CREATE: 'TASKS_V2_HISTORY_LOG_CHECKLIST_ITEM_CREATE',
		CHECKLIST_ITEM_REMOVE: 'TASKS_V2_HISTORY_LOG_CHECKLIST_ITEM_REMOVE',
		CHECKLIST_ITEM_RENAME: 'TASKS_V2_HISTORY_LOG_CHECKLIST_ITEM_RENAME',
		CHECKLIST_ITEM_UNCHECK: 'TASKS_V2_HISTORY_LOG_CHECKLIST_ITEM_UNCHECK',
		CHECKLIST_ITEM_CHECK: 'TASKS_V2_HISTORY_LOG_CHECKLIST_ITEM_CHECK',
		CHECKLIST_ITEM_MAKE_IMPORTANT: 'TASKS_V2_HISTORY_LOG_CHECKLIST_ITEM_MAKE_IMPORTANT',
		CHECKLIST_ITEM_MAKE_UNIMPORTANT: 'TASKS_V2_HISTORY_LOG_CHECKLIST_ITEM_MAKE_UNIMPORTANT',
		UF_CRM_TASK_ADDED: 'TASKS_V2_HISTORY_LOG_UF_CRM_TASK_ADDED',
		UF_CRM_TASK_DELETED: 'TASKS_V2_HISTORY_LOG_UF_CRM_TASK_DELETED'
	};

	// @vue/component
	const ChangesetLocations = {
		props: {
			getGrid: {
				type: Function,
				required: true
			},
			taskId: {
				type: [Number, String],
				required: true
			}
		},
		setup() {
			return {
				localizationMap
			};
		},
		data() {
			return {
				changeTypesRef: [],
				changeTypes: []
			};
		},
		methods: {
			async update() {
				const changes = this.getGrid().querySelectorAll('[data-changeset-location]');
				this.changeTypes = [...changes].map(changeNode => {
					return this.getChange(changeNode);
				});
				await this.$nextTick();
				changes.forEach(changeNode => {
					const change = this.getChange(changeNode);
					changeNode.append(this.changeTypesRef[change.rowId]);
				});
			},
			getChange(changeTypeNode) {
				const rowId = Number(changeTypeNode.closest('[data-id]').dataset.id);
				const changeType = changeTypeNode.dataset.changesetLocation;
				const isComment = ['COMMENT', 'COMMENT_EDIT', 'COMMENT_DEL'].includes(changeType);
				return {
					rowId,
					changeType: this.loc(this.localizationMap[changeType]),
					isComment
				};
			},
			setRef(element, rowId) {
				this.changeTypesRef ??= {};
				this.changeTypesRef[rowId] = element;
			},
			handleClick() {
				BX.SidePanel.Instance.open(`/task/comments/${this.taskId}`, {
					width: 1000
				});
			}
		},
		template: `
		<template v-for="(changeType, id) in changeTypes" :key="id">
			<div
				:ref="(el) => setRef(el, changeType.rowId)"
				@click="() => changeType.isComment && handleClick()"
				:class="{ 'tasks-history-grid-comment-link': changeType.isComment }"
			>
				{{ changeType.changeType }}
			</div>
		</template>
	`
	};

	// @vue/component
	const HistoryChange = {
		components: {
			RichLoc: ui_vue3_components_richLoc.RichLoc
		},
		props: {
			changeset: {
				/** @type HistoryChangeset */
				type: Object,
				required: true
			},
			component: {
				type: Object,
				default: null
			},
			format: {
				type: Function,
				default: null
			}
		},
		template: `
		<RichLoc
			v-if="component || format"
			:text="loc('TASKS_V2_HISTORY_LOG_CHANGE')"
			:placeholder="['[from/]', '[to/]']"
		>
			<template #from>
				<component v-if="component" :is="component" :value="changeset.fromValue"/>
				<template v-else>{{ format(changeset.fromValue) }}</template>
			</template>
			<template #to>
				<component v-if="component" :is="component" :value="changeset.toValue"/>
				<template v-else>{{ format(changeset.toValue) }}</template>
			</template>
		</RichLoc>
	`
	};

	const offsetDateTimeFormat = value => {
		const timestamp = Number(JSON.parse(value)) * 1000;
		if (timestamp <= 0) {
			return '';
		}
		const offset = tasks_v2_lib_timezone.timezone.getOffset(timestamp);
		const timestampOffset = (timestamp + offset) / 1000;
		const date = main_date.DateTimeFormat.format(main_date.DateTimeFormat.getFormat('SHORT_DATE_FORMAT'), timestampOffset);
		const time = main_date.DateTimeFormat.format(main_date.DateTimeFormat.getFormat('SHORT_TIME_FORMAT'), timestampOffset);
		return `${date} ${time}`;
	};

	const elapsedPreciseTimeFormat = value => {
		const durationInSeconds = Number(JSON.parse(value));
		const durationFormat = new main_date.DurationFormat(durationInSeconds * 1000);
		if (durationInSeconds <= 0) {
			return durationFormat.format({
				format: 'i'
			});
		}
		const hours = Math.floor(durationInSeconds / 3600);
		if (hours > 0) {
			return durationFormat.format({
				format: 'H i'
			});
		}
		return durationFormat.format({
			format: 'i s'
		});
	};

	const elapsedTimeFormat = value => {
		const durationInMinutes = Number(JSON.parse(value));
		const durationInMilliseconds = durationInMinutes * 60 * 1000;
		return new main_date.DurationFormat(durationInMilliseconds).format({
			format: 'H i'
		});
	};

	const tagsFormat = value => {
		return JSON.parse(value).replace(',', ', ');
	};

	const durationPlanFormat = value => {
		const durationInSeconds = Number(JSON.parse(value)) * 1000;
		if (durationInSeconds <= 0) {
			return '';
		}
		return new main_date.DurationFormat(durationInSeconds).format({
			format: 'd H'
		});
	};

	const defaultFormat = value => JSON.parse(value);

	const formatMap = {
		DEADLINE: offsetDateTimeFormat,
		TIME_SPENT_IN_LOGS: elapsedPreciseTimeFormat,
		TIME_ESTIMATE: elapsedPreciseTimeFormat,
		DURATION_FACT: elapsedTimeFormat,
		TAGS: tagsFormat,
		START_DATE_PLAN: offsetDateTimeFormat,
		END_DATE_PLAN: offsetDateTimeFormat,
		DURATION_PLAN_SECONDS: durationPlanFormat,
		STATUS: defaultFormat,
		MARK: defaultFormat,
		PRIORITY: defaultFormat,
		ADD_IN_REPORT: defaultFormat,
		STAGE: defaultFormat,
		TITLE: defaultFormat,
		CHECKLIST_ITEM_RENAME: defaultFormat,
		CHECKLIST_ITEM_CREATE: defaultFormat,
		CHECKLIST_ITEM_REMOVE: defaultFormat,
		CHECKLIST_ITEM_MAKE_UNIMPORTANT: defaultFormat,
		CHECKLIST_ITEM_MAKE_IMPORTANT: defaultFormat
	};

	// @vue/component
	const UserElement = {
		props: {
			/** @type UserChangeset */
			user: {
				type: Object,
				required: true
			}
		},
		computed: {
			isCollaber() {
				return this.user?.type === 'collaber';
			}
		},
		template: `
		<a
			:href="user?.link"
			class="tasks-history-grid-user-element"
			:class="{ '--collaber': isCollaber }"
		>
			{{ user?.name }}
		</a>
	`
	};

	// @vue/component
	const UserElementList = {
		components: {
			UserElement
		},
		props: {
			value: {
				type: String,
				default: ''
			}
		},
		computed: {
			users() {
				return JSON.parse(this.value);
			}
		},
		template: `
		<template v-for="(user, index) of users" :key="index">
			<UserElement :user/>{{ index < users.length - 1 ? ', ': '' }}
		</template>
	`
	};

	// @vue/component
	const RelatedTaskElement = {
		props: {
			/** @type RelatedTaskChangeset */
			relatedTaskItem: {
				type: Object,
				required: true
			}
		},
		computed: {
			isLinkFilled() {
				return main_core.Type.isStringFilled(this.relatedTaskItem?.link);
			}
		},
		template: `
		<a v-if="isLinkFilled" :href="relatedTaskItem?.link">{{ relatedTaskItem?.title }}</a>
		<span v-else>{{ relatedTaskItem?.title }}</span>
	`
	};

	// @vue/component
	const RelatedTaskElementList = {
		components: {
			RelatedTaskElement
		},
		props: {
			value: {
				type: String,
				default: ''
			}
		},
		computed: {
			relatedTaskItems() {
				return JSON.parse(this.value);
			},
			isNotFilled() {
				return main_core.Type.isNull(this.relatedTaskItems);
			},
			isHidden() {
				return this.relatedTaskItems?.length === 0;
			}
		},
		template: `
		<span v-if="isNotFilled"/>
		<span v-else-if="isHidden">{{ loc('TASKS_V2_HISTORY_LOG_HIDDEN_VALUE') }}</span>
		<template v-else v-for="(relatedTaskItem, index) of relatedTaskItems" :key="index">
			<RelatedTaskElement :relatedTaskItem/>{{ index < relatedTaskItems.length - 1 ? ', ': '' }}
		</template>
	`
	};

	// @vue/component
	const GroupElement = {
		props: {
			value: {
				type: String,
				default: ''
			}
		},
		computed: {
			group() {
				return JSON.parse(this.value);
			},
			isNotFilled() {
				return main_core.Type.isNull(this.group);
			},
			isHidden() {
				return Object.keys(this.group).length === 0;
			},
			isLinkFilled() {
				return main_core.Type.isStringFilled(this.group?.link);
			}
		},
		template: `
		<span v-if="isNotFilled"/>
		<span v-else-if="isHidden">{{ loc('TASKS_V2_HISTORY_LOG_HIDDEN_VALUE') }}</span>
		<a v-else-if="isLinkFilled" :href="group?.link" target="_top">{{ group?.name }}</a>
		<span v-else>{{ group?.name }}</span>
	`
	};

	// @vue/component
	const FlowElement = {
		props: {
			value: {
				type: String,
				default: ''
			}
		},
		data() {
			return {
				viewFormExtension: null
			};
		},
		computed: {
			flow() {
				return JSON.parse(this.value);
			},
			isNotFilled() {
				return main_core.Type.isNull(this.flow);
			},
			isHidden() {
				return Object.keys(this.flow).length === 0;
			},
			flowName() {
				return this.flow?.name || '';
			}
		},
		async beforeMount() {
			const extension = await main_core.Runtime.loadExtension('tasks.flow.view-form');
			this.viewFormExtension = extension.ViewForm;
		},
		methods: {
			handleClick() {
				this.viewFormExtension?.showInstance({
					flowId: this.flow?.id,
					bindElement: this.$refs.flowLink
				});
			}
		},
		template: `
		<span v-if="isNotFilled"/>
		<span v-else-if="isHidden">{{ loc('TASKS_V2_HISTORY_LOG_HIDDEN_VALUE') }}</span>
		<a v-else @click="handleClick" ref="flowLink">{{ flowName }}</a>
	`
	};

	// @vue/component
	const CrmElement = {
		props: {
			/** @type CrmChangeset */
			crmItem: {
				type: Object,
				required: true
			}
		},
		template: `
		<a :href="crmItem?.link">{{ crmItem?.title }}</a>
	`
	};

	// @vue/component
	const CrmElementList = {
		components: {
			CrmElement
		},
		props: {
			value: {
				type: String,
				default: ''
			}
		},
		computed: {
			crmItems() {
				return JSON.parse(this.value);
			},
			isNotFilled() {
				return main_core.Type.isNull(this.crmItems);
			},
			isHidden() {
				return this.crmItems?.length === 0;
			}
		},
		template: `
		<span v-if="isNotFilled"/>
		<span v-else-if="isHidden">{{ loc('TASKS_V2_HISTORY_LOG_HIDDEN_VALUE') }}</span>
		<template v-else v-for="(crmItem, index) of crmItems" :key="index">
			<CrmElement :crmItem/>{{ index < crmItems.length - 1 ? ', ': '' }}
		</template>
	`
	};

	// @vue/component
	const CheckListElement = {
		props: {
			value: {
				type: String,
				default: ''
			}
		},
		computed: {
			checkListItem() {
				return JSON.parse(this.value);
			}
		},
		template: `
		<span
			class="tasks-history-grid-checklist-element"
			:class="{ '--checked' : checkListItem?.isChecked }"
		>
			{{ checkListItem?.title }}
		</span>
	`
	};

	const componentMap = {
		RESPONSIBLE_ID: UserElementList,
		AUDITORS: UserElementList,
		CREATED_BY: UserElementList,
		ACCOMPLICES: UserElementList,
		PARENT_ID: RelatedTaskElementList,
		DEPENDS_ON: RelatedTaskElementList,
		GROUP_ID: GroupElement,
		FLOW_ID: FlowElement,
		UF_CRM_TASK_DELETED: CrmElementList,
		UF_CRM_TASK_ADDED: CrmElementList,
		CHECKLIST_ITEM_CHECK: CheckListElement,
		CHECKLIST_ITEM_UNCHECK: CheckListElement
	};

	// @vue/component
	const ChangesetValues = {
		components: {
			HistoryChange
		},
		props: {
			getGrid: {
				type: Function,
				required: true
			}
		},
		setup() {
			return {
				formatMap,
				componentMap
			};
		},
		data() {
			return {
				changesetRef: [],
				changesetLocations: []
			};
		},
		methods: {
			async update() {
				const changesetValues = this.getGrid().querySelectorAll('[data-changeset-from-value][data-changeset-to-value]');
				this.changesetLocations = [...changesetValues].map(changesetValueNode => {
					return this.getChangesetInfo(changesetValueNode);
				});
				await this.$nextTick();
				changesetValues.forEach(changesetValueNode => {
					const changeset = this.getChangesetInfo(changesetValueNode);
					changesetValueNode.append(this.changesetRef[changeset.rowId]);
				});
			},
			getChangesetInfo(changesetValueNode) {
				const rowId = Number(changesetValueNode.closest('[data-id]').dataset.id);
				const location = this.getGrid().querySelector(`[data-id="${rowId}"] [data-changeset-location]`).dataset.changesetLocation;
				return {
					location,
					rowId,
					changesetValue: {
						fromValue: changesetValueNode.dataset.changesetFromValue,
						toValue: changesetValueNode.dataset.changesetToValue
					}
				};
			},
			setRef(element, rowId) {
				this.changesetRef ??= {};
				this.changesetRef[rowId] = element;
			}
		},
		template: `
		<template v-for="(changesetLocation, id) in changesetLocations" :key="id">
			<HistoryChange
				:changeset="changesetLocation.changesetValue"
				:component="componentMap[changesetLocation.location]"
				:format="formatMap[changesetLocation.location]"
				:ref="(el) => setRef(el?.$el, changesetLocation.rowId)"
			/>
		</template>
	`
	};

	// @vue/component
	const GridLoader = {
		template: `
		<div class="tasks-history-grid-loader-spinner"/>
	`
	};

	const gridId = 'tasks-history-grid';

	// @vue/component
	const App = {
		name: 'HistoryGrid',
		components: {
			HeadlineXl: ui_system_typography_vue.HeadlineXl,
			GridLoader,
			ChangesetTime,
			Authors,
			ChangesetLocations,
			ChangesetValues
		},
		props: {
			taskId: {
				type: [Number, String],
				required: true
			}
		},
		mounted() {
			main_core_events.EventEmitter.subscribe('Grid::beforeRequest', this.handleBeforeGridRequest);
			main_core_events.EventEmitter.subscribe('Grid::updated', this.update);
			void this.getData();
		},
		beforeUnmount() {
			main_core_events.EventEmitter.unsubscribe('Grid::beforeRequest', this.handleBeforeGridRequest);
			main_core_events.EventEmitter.unsubscribe('Grid::updated', this.update);
			BX.Main?.gridManager?.destroy(gridId);
			main_popup.PopupManager.getPopupById(`${gridId}-grid-settings-window`)?.destroy();
		},
		methods: {
			async getData() {
				const {
					html
				} = await tasks_v2_lib_apiClient.apiClient.post('Task.HistoryGrid.get', {
					taskId: this.taskId
				});
				await main_core.Runtime.html(this.$refs.grid, html);
				this.update();
			},
			handleBeforeGridRequest(event) {
				const [, eventArgs] = event.getData();
				if (eventArgs.url) {
					this.nav = new main_core.Uri(eventArgs.url ?? '').getQueryParams().nav;
				}
				eventArgs.url = `/bitrix/services/main/ajax.php?action=tasks.v2.Task.HistoryGrid.getData&nav=${this.nav}`;
				eventArgs.method = 'POST';
				eventArgs.data = {
					taskId: this.taskId
				};
			},
			update() {
				void this.$refs.changesetTime.update();
				void this.$refs.authors.update();
				void this.$refs.changesetLocations.update();
				void this.$refs.changesetValues.update();
			}
		},
		template: `
		<div class="tasks-history-grid-container">
			<div class="tasks-history-grid-header">
				<HeadlineXl>{{ loc('TASKS_V2_HISTORY_LOG_HEADER') }}</HeadlineXl>
			</div>
			<div ref="grid" class="tasks-history-grid-main-content"><GridLoader/></div>
			<Authors ref="authors" :getGrid="() => this.$refs.grid"/>
			<ChangesetTime ref="changesetTime" :getGrid="() => this.$refs.grid"/>
			<ChangesetLocations ref="changesetLocations" :getGrid="() => this.$refs.grid" :taskId/>
			<ChangesetValues ref="changesetValues" :getGrid="() => this.$refs.grid"/>
		</div>
	`
	};

	class HistoryGrid {
		#application;
		#params;
		constructor(params = {}) {
			this.#params = params;
		}
		static openHistoryGrid(params) {
			let historyGrid = null;
			BX.SidePanel.Instance.open('tasks-history-grid', {
				contentCallback: slider => {
					historyGrid = new this(params);
					return historyGrid.mount(slider);
				},
				events: {
					onClose: () => historyGrid?.unmount()
				},
				cacheable: false,
				width: 1200
			});
		}
		mount(slider) {
			this.#application = this.#mountApplication(slider.getContentContainer());
		}
		unmount() {
			this.#unmountApplication();
		}
		#mountApplication(container) {
			const application = ui_vue3.BitrixVue.createApp(App, this.#params);
			application.mixin(ui_vue3_mixins_locMixin.locMixin);
			application.mount(container);
			return application;
		}
		#unmountApplication() {
			this.#application?.unmount();
		}
	}

	exports.HistoryGrid = HistoryGrid;

})(this.BX.Tasks.V2.Application = this.BX.Tasks.V2.Application || {}, BX.Vue3, BX.Vue3.Mixins, BX, BX.Event, BX.Main, BX.UI.System.Typography.Vue, BX.Tasks.V2.Lib, BX.Tasks.V2.Lib, BX.Main, BX.Tasks.V2.Provider.Service, BX.UI.Vue3.Components);
//# sourceMappingURL=history-grid.bundle.js.map

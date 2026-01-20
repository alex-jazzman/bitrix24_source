import { mapGetters } from 'ui.vue3.vuex';
import { hint, type HintParams } from 'ui.vue3.directives.hint';
import { BIcon, Animated, Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.animated';
import 'ui.icon-set.outline';

import { Model } from 'tasks.v2.const';
import { checkListService } from 'tasks.v2.provider.service.check-list-service';
import { tooltip } from 'tasks.v2.component.elements.hint';
import type { TaskModel } from 'tasks.v2.model.tasks';
import type { CheckListModel } from 'tasks.v2.model.check-list';

import { CheckListManager } from '../../lib/check-list-manager';
import { checkListMeta } from '../../lib/check-list-meta';

import './check-list-list.css';

// @vue/component
export const CheckListList = {
	name: 'TaskCheckListList',
	components: {
		BIcon,
	},
	directives: { hint },
	inject: {
		task: {},
		taskId: {},
		isEdit: {},
	},
	props: {
		isEmpty: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['open', 'addFastCheckList'],
	setup(): { task: TaskModel }
	{
		return {
			Animated,
			Outline,
			checkListMeta,
		};
	},
	data(): Object
	{
		return {
			isLoading: null,
		};
	},
	computed: {
		...mapGetters({
			deletingCheckListIds: `${Model.Interface}/deletingCheckListIds`,
			disableCheckListAnimations: `${Model.Interface}/disableCheckListAnimations`,
		}),
		checkLists(): CheckListModel[]
		{
			return this.$store.getters[`${Model.CheckList}/getByIds`](this.task.checklist);
		},
		isFilledEmpty(): boolean
		{
			return this.checkListLength === 0 && this.task.filledFields[checkListMeta.id];
		},
		checkListLength(): number
		{
			const deletingRootIds = Object.values(this.deletingCheckListIds);

			const deletingIds = new Set();

			deletingRootIds.forEach((rootId: string | number) => {
				deletingIds.add(rootId);

				this.checkListManager
					.getAllChildren(rootId)
					.forEach((child: CheckListModel) => {
						deletingIds.add(child.id);
					});
			});

			return this.checkLists.filter(({ id }) => !deletingIds.has(id)).length;
		},
		containsChecklist(): boolean
		{
			return this.task.containsChecklist;
		},
		loading(): boolean
		{
			return this.isLoading === true;
		},
		canCheckListAdd(): boolean
		{
			if (!this.isEdit)
			{
				return true;
			}

			return this.task.rights.checklistAdd;
		},
		addTooltip(): Function
		{
			return (): HintParams => tooltip({
				text: this.loc('TASKS_V2_CHECK_LIST_STUB_BTN'),
				popupOptions: {
					offsetLeft: this.$refs.stubAddIcon.$el.offsetWidth / 2,
				},
			});
		},
	},
	async created(): void
	{
		this.checkListManager = new CheckListManager({
			computed: {
				checkLists: () => this.checkLists,
			},
		});

		if (this.containsChecklist && this.checkLists.length === 0)
		{
			this.isLoading = true;

			await this.loadData();

			this.isLoading = false;
		}
	},
	methods: {
		async loadData(): Promise<void>
		{
			await checkListService.load(this.taskId);
		},
	},
	template: `
		<div
			class="tasks-check-list-list"
			:class="{ '--default': loading || isFilledEmpty }"
		>
			<div
				class="tasks-check-list-list-content"
				:class="{ '--default': loading || isFilledEmpty }"
			>
				<div v-if="loading" class="tasks-check-list-list-transition-content">
					<div class="tasks-check-list-list-content-row">
						<BIcon :name="Animated.LOADER_WAIT"/>
						<div class="tasks-check-list-list-content-text">
							{{ loc('TASKS_V2_CHECK_LIST_LOADING') }}
						</div>
					</div>
				</div>
				<Transition name="check-list-fade" mode="in-out" :css="!disableCheckListAnimations">
					<div
						v-if="!loading && isFilledEmpty"
						key="empty"
						class="tasks-check-list-list-transition-content"
					>
						<div
							class="tasks-check-list-list-content-row --stub"
							@click="() => canCheckListAdd && $emit('addFastCheckList')"
						>
							<div class="tasks-check-list-list-content-row-main">
								<BIcon :name="Outline.CHECK_LIST"/>
								<div class="tasks-check-list-list-content-text">
									{{ loc('TASKS_V2_CHECK_LIST_CHIP_TITLE') }}
								</div>
							</div>
							<div class="tasks-check-list-list-content-row-icon">
								<BIcon
									v-if="canCheckListAdd"
									class="tasks-check-list-list-add"
									v-hint="addTooltip"
									:name="Outline.PLUS_L"
									hoverable
									ref="stubAddIcon"
								/>
							</div>
						</div>
					</div>
				</Transition>
				<div
					v-if="!loading && !isFilledEmpty"
					key="content"
					class="tasks-check-list-list-transition-content"
				>
					<slot/>
					<div
						v-if="canCheckListAdd"
						class="tasks-check-list-list-content-row --footer"
						@click="$emit('addFastCheckList')"
					>
						<div
							class="tasks-check-list-list-content-btn"
							:class="{ '--empty': isEmpty }"
						>
							<BIcon :name="Outline.PLUS_L"/>
							<div class="tasks-check-list-list-content-btn-text">
								{{ loc('TASKS_V2_CHECK_LIST_ADD_LABEL') }}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	`,
};

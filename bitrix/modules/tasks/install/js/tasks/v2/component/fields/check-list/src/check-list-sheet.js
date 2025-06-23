import { Event } from 'main.core';

import { mapGetters } from 'ui.vue3.vuex';
import { Button as UiButton, ButtonSize, ButtonIcon } from 'ui.vue3.components.button';
import { BIcon } from 'ui.icon-set.api.vue';
import { Outline } from 'ui.icon-set.api.core';

import { BottomSheet } from 'tasks.v2.component.elements.bottom-sheet';
import { Model } from 'tasks.v2.const';
import type { CheckListModel } from 'tasks.v2.model.check-list';
import type { TaskModel } from 'tasks.v2.model.tasks';

import { CheckListMixin } from './check-list-mixin';
import { CheckListStub } from './check-list-stub';
import { CheckListWidgetMixin } from './check-list-widget/check-list-widget-mixin';
import { CheckListWidget } from './check-list-widget/check-list-widget';
import { CheckListItemPanel } from './check-list-widget/check-list-item-panel';

import './check-list-sheet.css';

// @vue/component
export const CheckListSheet = {
	name: 'TaskCheckListSheet',
	components: {
		BottomSheet,
		CheckListWidget,
		CheckListItemPanel,
		CheckListStub,
		UiButton,
		BIcon,
	},
	mixins: [
		CheckListMixin,
		CheckListWidgetMixin,
	],
	props: {
		taskId: {
			type: [Number, String],
			required: true,
		},
		checkListId: {
			type: [Number, String],
			default: 0,
		},
		isShown: {
			type: Boolean,
			required: true,
		},
	},
	emits: ['close'],
	setup(): Object
	{
		return {
			ButtonSize,
			ButtonIcon,
			Outline,
		};
	},
	data(): Object
	{
		return {
			isExpanded: false,
			itemPanelTopOffset: 2,
			itemPanelTopLimit: 700,
		};
	},
	computed: {
		...mapGetters({
			titleFieldOffsetHeight: `${Model.Interface}/titleFieldOffsetHeight`,
		}),
		task(): TaskModel
		{
			return this.$store.getters[`${Model.Tasks}/getById`](this.taskId);
		},
		checkLists(): CheckListModel[]
		{
			return this.$store.getters[`${Model.CheckList}/getByIds`](this.task.checklist);
		},
	},
	watch: {
		titleFieldOffsetHeight(): void
		{
			this.$refs.bottomSheet?.adjustPosition();
		},
		async isShown(value): void
		{
			await this.$nextTick();

			if (value)
			{
				Event.bind(this.$refs.list, 'scroll', this.handleScroll);
			}
			else
			{
				Event.unbind(this.$refs.list, 'scroll', this.handleScroll);
			}
		},
	},
	methods: {
		handleClose(): void
		{
			this.cancelGroupMode();

			void this.saveCheckList();

			this.$emit('close');
		},
	},
	template: `
		<BottomSheet
			:isShown="isShown"
			:isExpanded="isExpanded"
			:class="'--check-list'"
			ref="bottomSheet"
		>
			<div ref="wrapper" class="tasks-field-check-list-sheet">
				<div ref="list" data-list class="tasks-field-check-list-list">
					<CheckListWidget
						v-show="!stub"
						:taskId="taskId"
						:checkListId="checkListId"
						:listShownItemPanels="listShownItemPanels"
						@update="handleUpdate"
						@toggleIsComplete="handleToggleIsComplete"
						@addItem="addItem"
						@removeItem="handleRemove"
						@focus="handleFocus"
						@blur="handleBlur"
						@emptyBlur="handleEmptyBlur"
						@toggleCompleted="toggleCompleted"
						@startGroupMode="handleGroupMode"
						@toggleGroupModeSelected="handleGroupModeSelect"
					/>
					<CheckListStub v-if="stub" />
					<div class="tasks-field-check-list-close-icon --sheet">
						<BIcon :name="Outline.CROSS_L" @click="handleClose"/>
					</div>
				</div>
				<div class="tasks-field-check-list-footer">
					<UiButton
						:text="loc('TASKS_V2_CHECK_LIST_ADD_BTN')"
						:size="ButtonSize.MEDIUM"
						:leftIcon="ButtonIcon.ADD"
						@click="addCheckList"
					/>
				</div>
				<CheckListItemPanel
					v-if="itemPanelIsShown"
					ref="panel"
					:style="itemPanelStyles"
					:visibleActions="visiblePanelActions"
					:disabledActions="disabledPanelActions"
					:activeActions="activePanelActions"
					@action="handlePanelAction"
				/>
			</div>
		</BottomSheet>
	`,
};

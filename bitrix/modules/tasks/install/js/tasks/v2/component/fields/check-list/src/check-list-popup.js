import { Event } from 'main.core';
import { EventEmitter } from 'main.core.events';
import type { PopupOptions } from 'main.popup';

import { Popup } from 'ui.vue3.components.popup';
import { mapGetters } from 'ui.vue3.vuex';
import { Button as UiButton, AirButtonStyle, ButtonSize, ButtonIcon } from 'ui.vue3.components.button';
import { BIcon } from 'ui.icon-set.api.vue';
import { Outline } from 'ui.icon-set.api.core';

import { EventName, Model } from 'tasks.v2.const';
import type { CheckListModel } from 'tasks.v2.model.check-list';
import type { TaskModel } from 'tasks.v2.model.tasks';

import { CheckListMixin } from './check-list-mixin';
import { CheckListStub } from './check-list-stub';
import { CheckListWidgetMixin } from './check-list-widget/check-list-widget-mixin';
import { CheckListWidget } from './check-list-widget/check-list-widget';
import { CheckListItemPanel } from './check-list-widget/check-list-item-panel';

import './check-list-popup.css';

// @vue/component
export const CheckListPopup = {
	name: 'TaskCheckListPopup',
	components: {
		Popup,
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
	},
	emits: ['show', 'close', 'resize'],
	setup(): Object
	{
		return {
			resizeObserver: null,
			AirButtonStyle,
			ButtonSize,
			ButtonIcon,
			Outline,
		};
	},
	data(): Object
	{
		return {
			itemPanelTopOffset: 5,
			itemPanelTopLimit: 450,
		};
	},
	computed: {
		task(): TaskModel
		{
			return this.$store.getters[`${Model.Tasks}/getById`](this.taskId);
		},
		checkLists(): CheckListModel[]
		{
			return this.$store.getters[`${Model.CheckList}/getByIds`](this.task.checklist);
		},
		popupId(): string
		{
			return `tasks-check-list-popup-${this.taskId}`;
		},
		popupOptions(): PopupOptions
		{
			return {
				className: 'tasks-check-list-popup',
				width: 580,
				height: 500,
				borderRadius: '18px',
				offsetTop: 0,
				padding: 0,
				autoHide: true,
				closeByEsc: true,
				animation: {
					showClassName: 'tasks-check-list-popup-show',
					closeClassName: 'tasks-check-list-popup-close',
					closeAnimationType: 'animation',
				},
				events: {
					onClose: this.handleClose.bind(this),
				},
			};
		},
		...mapGetters({
			titleFieldOffsetHeight: `${Model.Interface}/titleFieldOffsetHeight`,
		}),
	},
	watch: {
		async titleFieldOffsetHeight(): Promise<void>
		{
			if (!this.$refs.popupComponent)
			{
				return;
			}

			await this.$nextTick();
			this.resize();
		},
	},
	created(): void
	{
		this.resizeObserver = new ResizeObserver((entries) => {
			for (const entry of entries)
			{
				if (entry.target === this.$refs.wrapper)
				{
					this.resize();
				}
			}
		});
	},
	mounted(): void
	{
		Event.bind(window, 'resize', this.resize);

		EventEmitter.subscribe('BX.Main.Popup:onShow', this.handleShowPopup);
		EventEmitter.subscribe('BX.Main.Popup:onClose', this.handleClosePopup);
	},
	beforeUnmount(): void
	{
		Event.unbind(window, 'resize', this.resize);

		EventEmitter.unsubscribe('BX.Main.Popup:onShow', this.handleShowPopup);
		EventEmitter.unsubscribe('BX.Main.Popup:onClose', this.handleClosePopup);
	},
	methods: {
		resize(): void
		{
			const popupInstance = this.$refs.popupComponent?.getPopupInstance();
			if (popupInstance)
			{
				this.$emit('resize');
				popupInstance.adjustPosition();
			}
		},
		handleShow(): void
		{
			this.$emit('show', { popupInstance: this.$refs.popupComponent.getPopupInstance() });
			this.$refs.popupComponent?.getPopupInstance().adjustPosition();
			setTimeout(() => this.resizeObserver.observe(this.$refs.wrapper), 300);
		},
		handleClose(): void
		{
			this.cancelGroupMode();

			void this.saveCheckList();

			this.resizeObserver.disconnect();
			this.$bitrix.eventEmitter.emit(EventName.CloseCheckList);
			this.$emit('close');
		},
	},
	template: `
		<Popup :options="popupOptions" ref="popupComponent">
			<div ref="wrapper" class="tasks-check-list-popup-wrapper">
				<div ref="list" data-list class="tasks-check-list-popup-list">
					<CheckListWidget
						v-show="!stub"
						:taskId="taskId"
						:listShownItemPanels="listShownItemPanels"
						@update="handleUpdate"
						@toggleIsComplete="handleToggleIsComplete"
						@show="handleShow"
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
					<div class="tasks-field-check-list-close-icon --popup">
						<BIcon :name="Outline.CROSS_L" @click="handleClose"/>
					</div>
				</div>
				<div class="tasks-check-list-popup-footer">
					<UiButton
						:text="loc('TASKS_V2_CHECK_LIST_NEW_BTN')"
						:size="ButtonSize.MEDIUM"
						:leftIcon="ButtonIcon.ADD"
						:style="AirButtonStyle.PLAIN_NO_ACCENT"
						@click="addCheckList"
					/>
					<UiButton
						:text="loc('TASKS_V2_CHECK_LIST_READY_BTN')"
						:size="ButtonSize.MEDIUM"
						@click="handleClose"
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
				<BMenu
					v-if="isForwardMenuShown"
					:options="forwardMenuOptions"
					@close="isForwardMenuShown = false"
				/>
			</div>
		</Popup>
	`,
};

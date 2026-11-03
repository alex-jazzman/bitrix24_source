import { Text, Event } from 'main.core';
import { type BaseEvent } from 'main.core.events';

import { mapGetters } from 'ui.vue3.vuex';
import { BMenu, type MenuOptions, type MenuItemOptions } from 'ui.vue3.components.menu';
import { Chip, ChipDesign } from 'ui.system.chip.vue';
import { Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import { Core } from 'tasks.v2.core';
import { Model, EventName } from 'tasks.v2.const';
import { showLimit } from 'tasks.v2.lib.show-limit';
import { fieldHighlighter } from 'tasks.v2.lib.field-highlighter';
import { taskService } from 'tasks.v2.provider.service.task-service';
import { stateService } from 'tasks.v2.provider.service.state-service';
import { type UserModel } from 'tasks.v2.model.users';
import { type TaskModel } from 'tasks.v2.model.tasks';

import { resultsMeta } from './results-meta';
import { captureFocusTrigger, restoreFocusTrigger } from './lib/results-focus';
import { ResultEditorSheet } from './components/result-editor-sheet/result-editor-sheet';

const ChipAction = Object.freeze({
	Highlight: 'highlight',
	RequireResult: 'requireResult',
	Menu: 'menu',
	AddResult: 'addResult',
});

// @vue/component
export const ResultsChip = {
	components: {
		Chip,
		BMenu,
		ResultEditorSheet,
	},
	inject: {
		task: {},
		taskId: {},
		isEdit: {},
		isTemplate: {},
		embedded: {},
	},
	props: {
		isSheetShown: {
			type: Boolean,
			default: false,
		},
		sheetBindProps: {
			type: Object,
			required: true,
		},
	},
	emits: ['update:isSheetShown'],
	setup(): { task: TaskModel }
	{
		return {
			Outline,
			resultsMeta,
		};
	},
	data(): Object
	{
		return {
			isMenuShown: false,
			sheetResultId: 0,
			sheetFocusTrigger: null,
		};
	},
	computed: {
		...mapGetters({
			currentUserId: `${Model.Interface}/currentUserId`,
			stateFlags: `${Model.Interface}/stateFlags`,
			templateStateFlags: `${Model.Interface}/templateStateFlags`,
		}),
		design(): string
		{
			return this.isSelected ? ChipDesign.ShadowAccent : ChipDesign.ShadowNoAccent;
		},
		isSelected(): boolean
		{
			return this.task.filledFields[resultsMeta.id] || this.task.requireResult;
		},
		menuOptions(): MenuOptions
		{
			return {
				id: `result-chip-menu-${Text.getRandom()}`,
				bindOptions: {
					forceBindPosition: true,
					forceTop: true,
					position: 'top',
				},
				bindElement: this.$refs.chip.$el,
				targetContainer: document.body,
				minWidth: 240,
				items: this.menuItems,
				autoHide: true,
				closeByEsc: true,
			};
		},
		menuItems(): MenuItemOptions[]
		{
			return [
				{
					title: this.loc('TASKS_V2_RESULT_ADD'),
					icon: Outline.PLUS_L,
					onClick: this.openAddResultSheet,
					dataset: {
						id: `MenuResultAdd-${this.taskId}`,
					},
				},
				{
					title: this.loc('TASKS_V2_RESULT_REQUIRE'),
					icon: Outline.WINDOW_FLAG,
					onClick: this.requireResult,
					isLocked: this.isLocked,
					dataset: {
						id: `MenuResultRequire-${this.taskId}`,
					},
				},
			];
		},
		isLocked(): boolean
		{
			return !Core.getParams().restrictions.requiredResult.available;
		},
		featureId(): string
		{
			return Core.getParams().restrictions.requiredResult.featureId;
		},
		clickAction(): string
		{
			if (this.isSelected)
			{
				return ChipAction.Highlight;
			}

			if (this.isTemplate || (!this.isEdit && !this.isLocked))
			{
				return ChipAction.RequireResult;
			}

			return this.task.rights.edit ? ChipAction.Menu : ChipAction.AddResult;
		},
		shownPopupType(): ?string
		{
			if (this.isMenuShown)
			{
				return 'menu';
			}

			return this.isSheetShown ? 'dialog' : null;
		},
		popupType(): ?string
		{
			// A popup this chip opened stays on screen even when the click branch moves on meanwhile
			// (a result arrives, a result becomes required): keep announcing what is really open.
			return this.shownPopupType ?? {
				[ChipAction.Menu]: 'menu',
				[ChipAction.AddResult]: 'dialog',
			}[this.clickAction] ?? null;
		},
		isPopupShown(): boolean
		{
			return Boolean(this.shownPopupType);
		},
	},
	watch: {
		popupType(): void
		{
			this.syncChipAria();
		},
		isPopupShown(): void
		{
			this.syncChipAria();
		},
	},
	mounted(): void
	{
		Event.EventEmitter.subscribe(EventName.OpenPrefilledResultForm, this.handleOpenPrefilledResultForm);

		this.syncChipAria();
	},
	beforeUnmount(): void
	{
		Event.EventEmitter.unsubscribe(EventName.OpenPrefilledResultForm, this.handleOpenPrefilledResultForm);
	},
	methods: {
		handleClick(): void
		{
			switch (this.clickAction)
			{
				case ChipAction.Highlight:
					this.highlightField();
					break;

				case ChipAction.RequireResult:
					this.requireResult();
					break;

				case ChipAction.Menu:
					this.isMenuShown = true;
					break;

				default:
					this.openAddResultSheet();
					break;
			}
		},
		openAddResultSheet(text = null): void
		{
			this.sheetFocusTrigger = captureFocusTrigger();

			const id = Text.getRandom();

			const payload = {
				id,
				text,
				taskId: this.taskId,
				author: this.getUser(this.currentUserId),
			};

			void this.$store.dispatch(`${Model.Results}/insert`, payload);

			this.sheetResultId = id;
			this.setSheetShown(true);
		},
		syncChipAria(): void
		{
			const el = this.$refs.chip?.$el;
			if (!el)
			{
				return;
			}

			el.setAttribute('role', 'button');

			if (this.popupType === null)
			{
				el.removeAttribute('aria-haspopup');
				el.removeAttribute('aria-expanded');

				return;
			}

			el.setAttribute('aria-haspopup', this.popupType);
			el.setAttribute('aria-expanded', String(this.isPopupShown));
		},
		handleMenuClose(): void
		{
			this.isMenuShown = false;
			this.$refs.chip?.$el?.focus();
		},
		handleSheetClose(): void
		{
			this.setSheetShown(false);
			restoreFocusTrigger(this.sheetFocusTrigger);
			this.sheetFocusTrigger = null;
		},
		async requireResult(): void
		{
			if (this.isLocked)
			{
				void showLimit({
					code: `limit_${this.featureId}`,
					bindElement: this.$refs.chip.$el,
					analytics: {
						type: 'limit_tasks_status_summary',
					},
				});

				return;
			}

			void taskService.update(this.taskId, { requireResult: true });

			if (this.isEdit)
			{
				return;
			}

			if (this.isTemplate)
			{
				await this.$store.dispatch(`${Model.Interface}/updateTemplateStateFlags`, { defaultRequireResult: true });

				void stateService.setTemplateFlags(this.templateStateFlags);
			}
			else
			{
				await this.$store.dispatch(`${Model.Interface}/updateStateFlags`, { defaultRequireResult: true });

				void stateService.set(this.stateFlags);
			}
		},
		highlightField(): void
		{
			void fieldHighlighter.setContainer(this.$root.$el).highlight(resultsMeta.id);
		},
		getUser(userId): UserModel | null
		{
			return this.$store.getters[`${Model.Users}/getById`](userId);
		},
		setSheetShown(isShown: boolean): void
		{
			this.$emit('update:isSheetShown', isShown);
		},
		handleOpenPrefilledResultForm(event: BaseEvent): void
		{
			const { taskId, text } = event.getData();

			if (this.taskId !== taskId || event.isDefaultPrevented())
			{
				return;
			}

			if (this.embedded)
			{
				queueMicrotask(() => {
					if (!event.isDefaultPrevented())
					{
						event.preventDefault();
						this.openAddResultSheet(text);
					}
				});

				return;
			}

			event.preventDefault();

			this.openAddResultSheet(text);
		},
	},
	template: `
		<Chip
			:design
			:text="resultsMeta.title"
			:icon="Outline.WINDOW_FLAG"
			:data-task-id="taskId"
			:data-task-chip-id="resultsMeta.id"
			data-testid="tasks-results-chip"
			ref="chip"
			@click="handleClick"
		/>
		<BMenu v-if="isMenuShown" :options="menuOptions" @close="handleMenuClose"/>
		<ResultEditorSheet
			v-if="isSheetShown"
			:resultId="sheetResultId"
			:sheetBindProps
			@close="handleSheetClose"
		/>
	`,
};

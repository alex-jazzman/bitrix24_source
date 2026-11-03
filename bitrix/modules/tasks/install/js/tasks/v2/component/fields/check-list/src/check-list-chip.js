import { Text, Type } from 'main.core';
import { BaseEvent } from 'main.core.events';
import { checkListService } from 'tasks.v2.provider.service.check-list-service';

import { Chip, ChipDesign } from 'ui.system.chip.vue';
import { Animated, Outline } from 'ui.icon-set.api.vue';
import { BMenu } from 'ui.system.menu.vue';
import { type MenuItemOptions, type MenuOptions } from 'ui.system.menu';
import { InteractivityChecker } from 'ui.a11y';
import 'ui.icon-set.animated';
import 'ui.icon-set.outline';

import { EventName, Model, normalizeAddCheckListFromTextPayload } from 'tasks.v2.const';
import { fieldHighlighter } from 'tasks.v2.lib.field-highlighter';
import { fileService, EntityTypes } from 'tasks.v2.provider.service.file-service';
import { taskService } from 'tasks.v2.provider.service.task-service';
import type { TaskModel } from 'tasks.v2.model.tasks';
import type { CheckListModel } from 'tasks.v2.model.check-list';
import { CheckListManager } from './lib/check-list-manager';
import { CheckListAddFromText } from './lib/check-list-add-from-text';
import { splitTitles } from './lib/check-list-title-utils';
import { buildCheckListPickerMenuItems, selectEditableParentCheckLists } from './lib/check-list-picker-menu';

import { checkListMeta } from './lib/check-list-meta';

const PICKER_MENU_CREATE_SECTION = 'createSection';

// @vue/component
export const CheckListChip = {
	components: {
		Chip,
		BMenu,
	},
	inject: {
		task: {},
		taskId: {},
		isEdit: {},
	},
	props: {
		isAutonomous: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['showCheckList'],
	setup(): { task: TaskModel }
	{
		return {
			checkListMeta,
		};
	},
	data(): Object
	{
		return {
			isOpen: false,
			isPickerMenuShown: false,
			pickerAnchor: null,
			pickerText: '',
		};
	},
	computed: {
		checkLists(): CheckListModel[]
		{
			return this.$store.getters[`${Model.CheckList}/getByIds`](this.task.checklist);
		},
		isUploading(): boolean
		{
			return this.task.checklist?.some((itemId) => {
				return fileService.get(
					itemId,
					EntityTypes.CheckListItem,
					{ parentEntityId: this.taskId },
				).isUploading();
			});
		},
		design(): string
		{
			return {
				[!this.isAutonomous && !this.isSelected]: ChipDesign.ShadowNoAccent,
				[!this.isAutonomous && this.isSelected]: ChipDesign.ShadowAccent,
				[this.isAutonomous && !this.isSelected]: ChipDesign.OutlineNoAccent,
				[this.isAutonomous && this.isSelected]: ChipDesign.OutlineAccent,
			}.true;
		},
		isSelected(): boolean
		{
			if (this.isAutonomous)
			{
				return this.checkLists.length > 0;
			}

			return this.wasFilled || this.checkLists.length > 0;
		},
		wasFilled(): boolean
		{
			return this.task.filledFields[checkListMeta.id];
		},
		opensDialog(): boolean
		{
			return this.isAutonomous || !this.isSelected;
		},
		checkListItemCount(): number
		{
			return this.checkLists.filter((checkList: CheckListModel) => checkList.parentId !== 0).length;
		},
		text(): string
		{
			if (this.isAutonomous && this.checkListItemCount > 0)
			{
				const completedCount = this.getCompletedCount();

				return this.loc(
					'TASKS_V2_CHECK_LIST_COUNT_TITLE',
					{
						'#count#': completedCount,
						'#total#': this.checkListItemCount,
					},
				);
			}

			return this.loc('TASKS_V2_CHECK_LIST_CHIP_TITLE');
		},
		icon(): string
		{
			if (this.isUploading && !this.wasFilled)
			{
				return Animated.LOADER_WAIT;
			}

			return Outline.CHECK_LIST;
		},
		deletingCheckListIds(): { [id: number | string]: number | string }
		{
			return this.$store.getters[`${Model.Interface}/deletingCheckListIds`] ?? {};
		},
		canAddCheckListItems(): boolean
		{
			if (!this.isEdit)
			{
				return true;
			}

			return this.task.rights.checklistAdd;
		},
		editableParentCheckLists(): CheckListModel[]
		{
			// A list pending deferred deletion is still in the store, but save() drops it with its children.
			return selectEditableParentCheckLists(this.checkLists, this.canAddCheckListItems)
				.filter((checkList: CheckListModel) => !this.deletingCheckListIds[checkList.id]);
		},
		pickerMenuItems(): MenuItemOptions[]
		{
			return buildCheckListPickerMenuItems({
				checkLists: this.editableParentCheckLists,
				existingItemIdPrefix: 'CheckListPickerExisting',
				onSelectCheckList: (checkList: CheckListModel) => {
					this.isPickerMenuShown = false;
					void this.handleSelectExistingCheckList(checkList, this.pickerText);
				},
				createNewItem: {
					id: `CheckListPickerCreateNew-${this.taskId}`,
					title: this.loc('TASKS_V2_CHECK_LIST_ITEM_FORWARD_MENU_CREATE'),
					sectionCode: PICKER_MENU_CREATE_SECTION,
					onClick: () => {
						this.isPickerMenuShown = false;
						void this.createCheckListFromText(this.pickerText);
					},
				},
			});
		},
		pickerMenuOptions(): MenuOptions
		{
			return {
				id: `check-list-picker-menu-${this.taskId}`,
				// Bind to the live toolbar button node, since the toolbar stays open on click.
				bindElement: this.pickerAnchor,
				role: 'menu',
				ariaLabel: this.loc('TASKS_V2_CHECK_LIST_PICKER_ARIA_LABEL'),
				focusTrap: {
					// true (not 'first-tabbable', which FocusTrap reads as a CSS selector) focuses the first item.
					initialFocus: true,
					restoreFocus: () => this.getPickerRestoreFocusTarget(),
				},
				maxWidth: 400,
				maxHeight: 300,
				sections: [
					{ code: PICKER_MENU_CREATE_SECTION },
				],
				items: this.pickerMenuItems,
				targetContainer: document.body,
			};
		},
	},
	watch: {
		isOpen(): void
		{
			this.syncChipAria();
		},
		opensDialog(): void
		{
			this.syncChipAria();
		},
	},
	created(): void
	{
		this.checkListManager = new CheckListManager({
			computed: {
				checkLists: () => this.checkLists,
			},
		});

		this.checkListAddFromText = new CheckListAddFromText(this.taskId);
	},
	mounted(): void
	{
		this.$bitrix.eventEmitter.subscribe(EventName.AddCheckListFromText, this.handleAddFromText);
		this.$bitrix.eventEmitter.subscribe(EventName.CloseCheckList, this.handleFieldClose);

		this.syncChipAria();
	},
	beforeUnmount(): void
	{
		this.$bitrix.eventEmitter.unsubscribe(EventName.AddCheckListFromText, this.handleAddFromText);
		this.$bitrix.eventEmitter.unsubscribe(EventName.CloseCheckList, this.handleFieldClose);
	},
	methods: {
		handleClick(): void
		{
			if (this.opensDialog)
			{
				void this.showCheckList();
			}
			else
			{
				void this.highlightField();
			}
		},
		async handleAddFromText(baseEvent: BaseEvent): Promise<void>
		{
			const { text, anchor } = normalizeAddCheckListFromTextPayload(baseEvent.getData());

			// Nothing to add (e.g. whitespace-only selection): no picker, no highlight, no save.
			if (splitTitles(text).length === 0)
			{
				return;
			}

			// Without a stable anchor (the AI path) there's nowhere to place the picker, so create a new list.
			if (anchor && this.editableParentCheckLists.length > 0)
			{
				this.showCheckListPicker(text, anchor);

				return;
			}

			await this.createCheckListFromText(text);
		},
		showCheckListPicker(text: string, anchor: HTMLElement): void
		{
			this.pickerText = text;
			this.pickerAnchor = anchor;
			this.isPickerMenuShown = true;
		},
		async handleSelectExistingCheckList(checkList: CheckListModel, text: string): Promise<void>
		{
			const outcome = await this.checkListAddFromText.addToCheckList(checkList, text, this.isEdit);

			this.emitCheckListAddResolved();

			// Lead the user to the target list, including the all-duplicates case; not on failure.
			if (outcome)
			{
				this.persistExpandedState(checkList.id);

				await this.showAddedCheckList(checkList.id);
			}
		},
		async createCheckListFromText(text: string): Promise<void>
		{
			const checkListId = await this.buildCheckList(text);

			// Empty id means empty input: no list created, nothing to close.
			if (checkListId === '')
			{
				return;
			}

			if (this.isEdit)
			{
				checkListService.save(this.taskId, this.checkLists)
					.then(() => this.persistExpandedStateByNodeId(checkListId))
					.catch(() => {});
			}

			this.emitCheckListAddResolved();

			await this.showAddedCheckList(checkListId);
		},
		async showAddedCheckList(checkListId: number | string): Promise<void>
		{
			await this.expandCheckList(checkListId);

			// The resolved event closes the description sheet; highlight only after its overlay
			// is gone, otherwise the user sees just the tail of the animation.
			await this.waitForOverlayHidden();

			await this.highlightField();

			// By now save() may have re-created the list under its server id, and the node is keyed by id.
			this.checkListManager.scrollToCheckList(this.$root.$el, this.resolveActualCheckListId(checkListId), 'smooth');
		},
		resolveActualCheckListId(checkListId: number | string): number | string
		{
			if (this.checkLists.some((checkList: CheckListModel) => checkList.id === checkListId))
			{
				return checkListId;
			}

			return this.findCheckListByNodeId(checkListId)?.id ?? checkListId;
		},
		async expandCheckList(checkListId: number | string): Promise<void>
		{
			// In the card preview every list but the first one is collapsed (isItemCollapsed),
			// so the just added items would stay hidden behind a collapsed header.
			await this.$store.dispatch(`${Model.CheckList}/update`, {
				id: checkListId,
				fields: { localCollapsedState: false },
			});

			// Render the items before the scroll offset is measured.
			await this.$nextTick();
		},
		persistExpandedStateByNodeId(nodeId: number | string): void
		{
			const savedCheckList = this.findCheckListByNodeId(nodeId);
			if (!savedCheckList)
			{
				return;
			}

			// The save response re-creates the list under its server id and drops the flag set for
			// the temporary one, so re-apply it here: without that the list blinks shut until the
			// slower expand response arrives.
			void this.expandCheckList(savedCheckList.id);

			this.persistExpandedState(savedCheckList.id);
		},
		persistExpandedState(checkListId: number | string): void
		{
			// The collapsed state is a per-user server option: without the endpoint the list
			// would fold back on the next card load. Unsaved lists have no server id yet.
			if (this.isEdit && Type.isNumber(checkListId))
			{
				checkListService.expand(this.taskId, checkListId).catch((error) => {
					console.error('tasks: check-list expand failed', error);
				});
			}
		},
		findCheckListByNodeId(nodeId: number | string): ?CheckListModel
		{
			// A saved list keeps the client nodeId but gets its real id from the server.
			return this.checkLists.find((checkList: CheckListModel) => checkList.nodeId === nodeId) ?? null;
		},
		waitForOverlayHidden(): Promise<void>
		{
			return new Promise((resolve) => {
				const deadline = Date.now() + 2000;

				const check = () => {
					const overlay = this.$root.$el?.querySelector?.('.tasks-full-card-main.--overlay');
					if (!overlay || Date.now() > deadline)
					{
						resolve();

						return;
					}

					requestAnimationFrame(check);
				};

				check();
			});
		},
		emitCheckListAddResolved(): void
		{
			this.$bitrix.eventEmitter.emit(EventName.CheckListAddFromTextResolved);
		},
		handleFieldClose(): void
		{
			this.isOpen = false;

			if (this.isAutonomous)
			{
				this.getChipElement()?.focus();
			}
		},
		syncChipAria(): void
		{
			const el = this.getChipElement();
			if (!el)
			{
				return;
			}

			el.setAttribute('role', 'button');

			// The first built item already turns the next click into a highlight, while the sheet
			// this chip opened stays on screen: it has to remain announced until it reports its close.
			const controlsDialog = this.opensDialog || this.isOpen;
			if (!controlsDialog)
			{
				el.removeAttribute('aria-haspopup');
				el.removeAttribute('aria-expanded');

				return;
			}

			el.setAttribute('aria-haspopup', 'dialog');
			el.setAttribute('aria-expanded', String(this.isOpen));
		},
		getChipElement(): ?HTMLElement
		{
			// Multi-root component (Chip + BMenu), so this.$el is the fragment placeholder; get the chip via ref.
			return this.$refs.chipRoot?.$el ?? null;
		},
		getPickerRestoreFocusTarget(): ?HTMLElement
		{
			// If the picker was cancelled the toolbar button is still focusable; after success fall back to the chip.
			if (InteractivityChecker.isFocusable(this.pickerAnchor))
			{
				return this.pickerAnchor;
			}

			return this.getChipElement();
		},
		async showCheckList(): Promise<void>
		{
			let focusItemId: ?string = null;
			if (!this.isSelected)
			{
				focusItemId = await this.buildEmptyCheckList();
			}

			this.isOpen = true;

			if (focusItemId === null)
			{
				this.$emit('showCheckList');

				return;
			}

			this.$emit('showCheckList', focusItemId);
		},
		async buildEmptyCheckList(): Promise<string>
		{
			const parentId = Text.getRandom();
			const childId = Text.getRandom();

			await this.$store.dispatch(`${Model.CheckList}/insertMany`, [
				{
					id: parentId,
					nodeId: parentId,
					title: this.loc('TASKS_V2_CHECK_LIST_TITLE_NUMBER', { '#number#': 1 }),
				},
				{
					id: childId,
					nodeId: childId,
					parentId,
				},
			]);

			await taskService.updateStoreTask(this.taskId, {
				checklist: [parentId, childId],
			});

			return childId;
		},
		async buildCheckList(baseText: string): Promise<string>
		{
			const titles = splitTitles(baseText);
			if (titles.length === 0)
			{
				return '';
			}

			const items = [];

			const parentId = Text.getRandom();
			const checkListsNumber = this.getCheckListsNumber();

			const taskChecklist = [...this.task.checklist, parentId];

			items.push({
				id: parentId,
				nodeId: parentId,
				parentId: 0,
				title: this.loc('TASKS_V2_CHECK_LIST_TITLE_NUMBER', { '#number#': checkListsNumber + 1 }),
				sortIndex: checkListsNumber,
			});

			titles.forEach((title: string, index: number) => {
				const childId = Text.getRandom();

				items.push({
					id: childId,
					nodeId: childId,
					parentId,
					title,
					sortIndex: index,
				});

				taskChecklist.push(childId);
			});

			await this.$store.dispatch(`${Model.CheckList}/insertMany`, items);

			await taskService.updateStoreTask(this.taskId, {
				checklist: taskChecklist,
			});

			return parentId;
		},
		highlightField(): Promise<void>
		{
			return fieldHighlighter.setContainer(this.$root.$el).highlight(checkListMeta.id);
		},
		getCheckListsNumber(): number
		{
			return this.checkLists.filter((checklist: CheckListModel) => checklist.parentId === 0).length;
		},
		getCompletedCount(): number
		{
			return this.checkLists.filter((checklist: CheckListModel) => {
				return checklist.isComplete && checklist.parentId !== 0;
			}).length;
		},
	},
	template: `
		<Chip
			ref="chipRoot"
			:design
			:icon
			:text
			:data-task-id="taskId"
			:data-task-chip-id="checkListMeta.id"
			data-testid="task-check-list-chip"
			@click="handleClick"
		/>
		<BMenu
			v-if="isPickerMenuShown"
			:options="pickerMenuOptions"
			@close="isPickerMenuShown = false"
		/>
	`,
};

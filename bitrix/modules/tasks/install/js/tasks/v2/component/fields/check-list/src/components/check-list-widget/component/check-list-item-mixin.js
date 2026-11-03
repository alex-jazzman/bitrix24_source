/* global Partial */

import { Dom, Type } from 'main.core';
import { mapActions, mapGetters } from 'ui.vue3.vuex';

import { Model } from 'tasks.v2.const';
import { CheckListBbCode } from 'tasks.v2.lib.check-list-bb-code';
import { checkListService, activeFieldRegistry } from 'tasks.v2.provider.service.check-list-service';
import type { TaskModel } from 'tasks.v2.model.tasks';
import type { CheckListModel } from 'tasks.v2.model.check-list';
import type { UserModel } from 'tasks.v2.model.users';

import { CheckListManager } from '../../../lib/check-list-manager';
import { MentionManager } from '../../../lib/mention/mention-manager';

// @vue/component
export const CheckListItemMixin = {
	inject: {
		task: {},
		taskId: {},
		isEdit: {},
		checkListEditor: { default: null },
	},
	provide(): Object
	{
		return {
			checkListEditorItem: {
				getId: () => this.id,
			},
		};
	},
	props: {
		id: {
			type: [Number, String],
			required: true,
		},
		isPreview: {
			type: Boolean,
			default: false,
		},
	},
	emits: [
		'update',
		'addItem',
		'removeItem',
		'focus',
		'blur',
		'emptyBlur',
		'show',
		'hide',
		'formattingSelectionChange',
		'itemPointerEnter',
		'itemPointerLeave',
		'panelTab',
	],
	setup(): { task: TaskModel } {},
	data(): Object
	{
		return {
			isHovered: false,
			scrollContainer: null,
			isDragEnabled: false,
		};
	},
	computed: {
		...mapGetters({
			currentUserId: `${Model.Interface}/currentUserId`,
			draggedCheckListId: `${Model.Interface}/draggedCheckListId`,
		}),
		checkLists(): CheckListModel[]
		{
			return this.$store.getters[`${Model.CheckList}/getByIds`](this.task.checklist);
		},
		item(): CheckListModel
		{
			return this.$store.getters[`${Model.CheckList}/getById`](this.id);
		},
		plainTitle(): string
		{
			return CheckListBbCode.toPlainText(this.item.title);
		},
		isItemEdit(): boolean
		{
			return Type.isNumber(this.item.id);
		},
		canAdd(): boolean
		{
			if (!this.isEdit)
			{
				return true;
			}

			return this.task.rights.checklistAdd;
		},
		canEdit(): boolean
		{
			if (!this.isEdit)
			{
				return true;
			}

			const checkListItem = this.checkListManager.getRootParentByChildId(this.item?.id);

			return (
				this.task.rights.checklistEdit
				|| checkListItem?.creator?.id === this.currentUserId
			);
		},
		canModify(): boolean
		{
			return this.item?.actions?.modify === true;
		},
		canRemove(): boolean
		{
			return this.item?.actions?.remove === true;
		},
		canToggle(): boolean
		{
			if (this.readOnly && !this.isItemEdit && this.isEdit)
			{
				return false;
			}

			return this.item?.actions?.toggle === true;
		},
		hasAttachments(): boolean
		{
			return this.hasUsers;
		},
		hasUsers(): boolean
		{
			return (
				this.hasAccomplices
				|| this.hasAuditors
			);
		},
		hasAccomplices(): boolean
		{
			return this.accomplices?.length > 0;
		},
		hasAuditors(): boolean
		{
			return this.auditors?.length > 0;
		},
		accomplices(): ?UserModel[]
		{
			return this.item.accomplices;
		},
		auditors(): ?UserModel[]
		{
			return this.item.auditors;
		},
		accomplicesLabel(): string
		{
			return this.loc('TASKS_V2_CHECK_LIST_ITEM_PRINT_ACCOMPLICES', {
				'#USERS#': this.getUserNames(this.accomplices),
			});
		},
		auditorsLabel(): string
		{
			return this.loc('TASKS_V2_CHECK_LIST_ITEM_PRINT_AUDITORS', {
				'#USERS#': this.getUserNames(this.auditors),
			});
		},
		files(): ?[]
		{
			return this.item.attachments;
		},
		textColor(): string
		{
			return this.completed ? 'var(--ui-color-base-4)' : 'var(--ui-color-base-1)';
		},
		linkColor(): string
		{
			return this.completed ? 'var(--ui-color-base-4)' : 'var(--ui-color-accent-main-link)';
		},
		groupMode(): boolean
		{
			return this.item.groupMode?.active === true;
		},
		groupModeSelected(): boolean
		{
			return this.item.groupMode?.selected === true;
		},
		completed(): boolean
		{
			return this.checkListManager.isItemCompleted(this.item);
		},
		canDragItem(): boolean
		{
			if (!this.isDragEnabled)
			{
				return false;
			}

			return (
				this.isHovered
				&& this.canModify
				&& !this.readOnly
				&& !this.groupMode
			);
		},
		readOnly(): boolean
		{
			return this.isPreview;
		},
		textReadOnly(): boolean
		{
			return this.groupMode || this.isPreview || !this.canModify;
		},
	},
	created(): void
	{
		this.checkListManager = new CheckListManager({
			computed: {
				checkLists: () => this.checkLists,
			},
		});

		this.mentionManager = new MentionManager({
			taskId: this.taskId,
			itemId: this.item.id,
			onDialogStateChange: (open) => this.checkListEditor?.setParticipantSelectorOpen(open),
		});

		this.registeredActiveFields = new Set();
	},
	mounted(): void
	{
		setTimeout(() => {
			this.isDragEnabled = true;
		}, 1000);

		void this.$nextTick(() => {
			this.mentionManager.attachHost(this.$refs.growingTextArea?.$el);
		});
	},
	beforeUnmount(): void
	{
		this.mentionManager.destroy();
		this.registeredActiveFields.forEach((field: string) => {
			activeFieldRegistry.release(this.id, field);
		});
		this.registeredActiveFields.clear();
	},
	methods: {
		...mapActions(Model.Interface, [
			'addCheckListCompletionCallback',
		]),
		registerActiveField(field: string): void
		{
			if (this.registeredActiveFields.has(field))
			{
				return;
			}

			activeFieldRegistry.register(this.id, field);
			this.registeredActiveFields.add(field);
		},
		releaseActiveField(field: string): void
		{
			if (!this.registeredActiveFields.has(field))
			{
				return;
			}

			activeFieldRegistry.release(this.id, field);
			this.registeredActiveFields.delete(field);
		},
		handleFocus(): void
		{
			this.registerActiveField('title');
			this.$emit('focus', this.id);
		},
		handleBlur(): void
		{
			this.releaseActiveField('title');
			this.$emit('blur', this.id);
		},
		handleEmptyBlur(): void
		{
			this.$emit('emptyBlur', this.id);
		},
		handleLinkClick(event: PointerEvent): void
		{
			event.stopPropagation();
		},
		handleFormattingSelectionChange(actions: string[]): void
		{
			this.$emit('formattingSelectionChange', this.id, actions);
		},
		getUserNames(users: ?UserModel[]): string
		{
			return (users ?? []).map((user: UserModel) => user.name).join(', ');
		},
		updateCheckList(id: number | string, fields: Partial<CheckListModel>): Promise<void>
		{
			this.$emit('update', this.id);

			return this.$store.dispatch(`${Model.CheckList}/update`, { id, fields });
		},
		upsertCheckLists(items: CheckListModel[]): Promise<void>
		{
			this.$emit('update', this.id);

			return this.$store.dispatch(`${Model.CheckList}/upsertMany`, items);
		},
		updateTitle(title: string = ''): void
		{
			this.$store.dispatch(`${Model.CheckList}/update`, {
				id: this.id,
				fields: { title },
			});

			this.$emit('update', this.id);
		},
		applyFormatting(action: string, node: ?HTMLElement = null, url: string = ''): void
		{
			if (this.textReadOnly)
			{
				return;
			}

			this.$refs.growingTextArea?.applyFormatting(action, url);
		},
		addItem(sort: ?number): void
		{
			if (!this.canAdd)
			{
				return;
			}

			this.$emit(
				'addItem',
				{
					id: this.id,
					sort: Type.isNumber(sort) ? sort : null,
				},
			);
		},
		removeItem(): void
		{
			this.$emit('removeItem', this.id);
		},
		async complete(isComplete: boolean, persist: boolean = true): void
		{
			if (this.canToggle === false)
			{
				return;
			}

			this.registerActiveField('isComplete');

			await this.updateCheckList(this.id, { localCompleteState: isComplete });

			const listParents = new Map();
			this.checkListManager.syncParentCompletionState(
				this.id,
				(id: string | number, fields: Partial<CheckListModel>) => {
					listParents.set(id, fields);
					this.updateCheckList(id, { localCompleteState: fields.isComplete });
				},
			);

			this.$emit('update', this.id);

			const completionCallback = () => {
				this.updateCheckList(this.id, { isComplete });
				listParents.forEach((fields: Partial<CheckListModel>, id: string | number) => {
					this.updateCheckList(id, fields);
					if (persist && this.isPreview && this.isEdit)
					{
						this.saveCompleteState(id, fields.isComplete);
					}
				});
				this.releaseActiveField('isComplete');
			};

			this.addCheckListCompletionCallback({
				id: this.id,
				callback: completionCallback,
			});

			if (persist && this.isPreview && this.isEdit)
			{
				this.saveCompleteState(this.id, isComplete);
			}
		},
		saveCompleteState(itemId: string | number, isComplete: boolean): void
		{
			if (isComplete)
			{
				void checkListService.complete(this.taskId, itemId);
			}
			else
			{
				void checkListService.renew(this.taskId, itemId);
			}
		},
		async scrollToItem(): Promise<void>
		{
			await new Promise((resolve) => {
				setTimeout(() => resolve(), 300);
			});

			const item = this.$refs.item;
			const scrollContainer = this.$parent.$el?.closest('[data-list]');

			const itemRect = Dom.getPosition(item);
			const containerRect = Dom.getPosition(scrollContainer);

			const offsetTopInsideContainer = itemRect.top - containerRect.top + scrollContainer.scrollTop;

			scrollContainer.scrollTo({
				top: offsetTopInsideContainer - 200,
				behavior: 'smooth',
			});
		},
		handleInput(value: string): void
		{
			const currentTitle = this.item.title;
			this.updateTitle(value);
			const currentPlainTitle = CheckListBbCode.toPlainText(currentTitle);
			const nextPlainTitle = CheckListBbCode.toPlainText(value);

			const formattingLayer = this.$refs.growingTextArea;
			const visibleState = formattingLayer.getVisibleState();

			void this.mentionManager.handleInput({
				item: { ...this.item, title: value },
				isEntered: currentPlainTitle.length < nextPlainTitle.length,
				visibleText: visibleState?.text ?? '',
				cursorPosition: visibleState?.end ?? 0,
				targetNode: formattingLayer.$el,
				captureVisibleRange: (start, end) => formattingLayer.captureVisibleRange(start, end),
				removeVisibleRange: (range) => formattingLayer.removeVisibleRange(range),
				setAria: (aria) => formattingLayer.setEditorAria(aria),
			});
		},
		handleEditorInput(value: string): void
		{
			this.handleInput(value);
		},
	},
};

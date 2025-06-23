import { Type } from 'main.core';
import { Model } from 'tasks.v2.const';
import type { TaskModel } from 'tasks.v2.model.tasks';
import type { CheckListModel } from 'tasks.v2.model.check-list';
import type { UserModel } from 'tasks.v2.model.users';

// @vue/component
export const CheckListItemMixin = {
	props: {
		taskId: {
			type: [Number, String],
			required: true,
		},
		id: {
			type: [Number, String],
			required: true,
		},
		panelIsShown: {
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
	],
	data(): Object
	{
		return {
			isHovered: false,
			scrollContainer: null,
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
		item(): CheckListModel
		{
			return this.$store.getters[`${Model.CheckList}/getById`](this.id);
		},
		canModify(): boolean
		{
			return this.item.actions.modify === true;
		},
		canRemove(): boolean
		{
			return this.item.actions.remove === true;
		},
		canToggle(): boolean
		{
			return this.item.actions.toggle === true;
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
		files(): ?[]
		{
			return this.item.attachments;
		},
		textColor(): string
		{
			return this.item.isComplete ? 'var(--ui-color-base-4)' : 'var(--ui-color-base-1)';
		},
		groupMode(): boolean
		{
			return this.item.groupMode?.active === true;
		},
		groupModeSelected(): boolean
		{
			return this.item.groupMode?.selected === true;
		},
	},
	methods: {
		updateTitle(title: string = ''): void
		{
			this.$store.dispatch(`${Model.CheckList}/update`, {
				id: this.id,
				fields: { title },
			});

			this.$emit('update');
		},
		clearTitle(): void
		{
			this.$refs.growingTextArea?.clearValue();
		},
		addItem(sort: ?number): void
		{
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
		handleFocus(): void
		{
			this.$emit('focus', this.id);
		},
		handleBlur(): void
		{
			this.$emit('blur', this.id);
		},
		handleEmptyBlur(): void
		{
			this.$emit('emptyBlur', this.id);
		},
		show(): void
		{
			this.$emit('show', this.id);
		},
		hide(): void
		{
			this.$emit('hide', this.id);
		},
	},
};

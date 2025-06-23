import { Popup } from 'ui.vue3.components.popup';
import { RichLoc } from 'ui.vue3.components.rich-loc';

import { Model } from 'tasks.v2.const';
import { Hint } from 'tasks.v2.component.elements.hint';
import { UserCustomTagSelector, type ItemId } from 'tasks.v2.component.elements.user-custom-tag-selector';
import type { TaskModel } from 'tasks.v2.model.tasks';
import type { UserModel } from 'tasks.v2.model.users';

import './participant.css';

// @vue/component
export const Participant = {
	name: 'TaskParticipant',
	components: {
		UserCustomTagSelector,
		Popup,
		RichLoc,
		Hint,
	},
	props: {
		taskId: {
			type: [Number, String],
			required: true,
		},
		dialogOptions: {
			type: Object,
			required: true,
		},
		preselected: {
			type: Array,
			required: true,
		},
		canChange: {
			type: Function,
			required: true,
		},
		cantChangeHint: {
			type: String,
			required: true,
		},
		hintClickHandler: {
			type: Function,
			required: true,
		},
		selectorWithActionMenu: {
			type: Boolean,
			default: false,
		},
		dataset: {
			type: Object,
			default: null,
		},
		readonly: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['update'],
	data(): Object
	{
		return {
			isPopupShown: false,
		};
	},
	computed: {
		task(): TaskModel
		{
			return this.$store.getters[`${Model.Tasks}/getById`](this.taskId);
		},
		userInfo(): UserModel
		{
			const [, userId]: ItemId = this.preselected[0] ?? [];

			return this.$store.getters[`${Model.Users}/getById`](userId);
		},
	},
	methods: {
		handleUserSelected(user: UserModel): void
		{
			this.$emit('update', user);
		},
		async onClick(): Promise<boolean>
		{
			if (this.canChange())
			{
				return true;
			}

			this.isPopupShown = true;

			return new Promise((resolve) => {
				this.resolvePopupClosePromise = resolve;
			});
		},
		handleHintClick(): void
		{
			this.hintClickHandler();

			this.resolvePopupClosePromise(true);

			this.isPopupShown = false;
		},
		closeHint(): void
		{
			this.resolvePopupClosePromise(false);

			this.isPopupShown = false;
		},
		handleKeydown(event: KeyboardEvent): void
		{
			if (event.key === 'Enter' && !(event.ctrlKey || event.metaKey))
			{
				void this.$refs.selector.handleClick();
			}
		},
		focus(): void
		{
			this.$refs.container.focus();
		},
	},
	template: `
		<div class="tasks-field-participant" v-bind="dataset" ref="container" tabindex="0" @keydown="handleKeydown">
			<UserCustomTagSelector
				:dialogOptions="dialogOptions"
				:items="preselected"
				:userInfo="userInfo"
				:withActionMenu="selectorWithActionMenu"
				:clickHandler="onClick"
				:readonly="readonly"
				ref="selector"
				@select="handleUserSelected"
				@unfreeze="focus"
			/>
		</div>
		<Hint
			v-if="isPopupShown"
			:bindElement="$refs.container"
			@close="closeHint"
		>
			<RichLoc :text="cantChangeHint" placeholder="[action]">
				<template #action="{ text }">
					<span @click="handleHintClick">{{ text }}</span>
				</template>
			</RichLoc>
		</Hint>
	`,
};

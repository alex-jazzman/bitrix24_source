import type { PopupOptions } from 'main.popup';
import { showLimit } from 'tasks.v2.lib.show-limit';
import { Popup } from 'ui.vue3.components.popup';
import { RichLoc } from 'ui.vue3.components.rich-loc';
import { Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import { Core } from 'tasks.v2.core';
import { Model } from 'tasks.v2.const';
import { HoverPill } from 'tasks.v2.component.elements.hover-pill';
import { FieldHoverButton } from 'tasks.v2.component.elements.field-hover-button';
import { FieldAdd } from 'tasks.v2.component.elements.field-add';
import { Hint } from 'tasks.v2.component.elements.hint';
import { UserLabel } from 'tasks.v2.component.elements.user-label';
import { idUtils } from 'tasks.v2.lib.id-utils';
import { usersDialog } from 'tasks.v2.lib.user-selector-dialog';
import { userService } from 'tasks.v2.provider.service.user-service';
import type { UserModel } from 'tasks.v2.model.users';

import { Users } from './users/users';
import { More } from './more/more';
import './participants.css';

const maxUsers = 4;

// @vue/component
export const Participants = {
	components: {
		RichLoc,
		Popup,
		HoverPill,
		FieldAdd,
		FieldHoverButton,
		Hint,
		UserLabel,
		Users,
		More,
	},
	props: {
		taskId: {
			type: [Number, String],
			required: true,
		},
		context: {
			type: String,
			required: true,
		},
		userIds: {
			type: Array,
			required: true,
		},
		canAdd: {
			type: Boolean,
			default: true,
		},
		canRemove: {
			type: Boolean,
			default: true,
		},
		withHint: {
			type: Boolean,
			default: false,
		},
		hintText: {
			type: String,
			default: '',
		},
		useRemoveAll: {
			type: Boolean,
			default: false,
		},
		single: {
			type: Boolean,
			default: false,
		},
		multipleOnPlus: {
			type: Boolean,
			default: false,
		},
		inline: {
			type: Boolean,
			default: false,
		},
		avatarOnly: {
			type: Boolean,
			default: false,
		},
		dataset: {
			type: Object,
			required: true,
		},
		isLocked: {
			type: Boolean,
			default: false,
		},
		featureId: {
			type: String,
			default: '',
		},
		showMenu: {
			type: Boolean,
			default: true,
		},
		forceEdit: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['update', 'hintClick'],
	setup(): Object
	{
		return {
			Outline,
		};
	},
	data(): Object
	{
		return {
			isDialogShown: false,
			isMoreShown: false,
			isHintShown: false,
			isHovered: false,
		};
	},
	computed: {
		isEdit(): boolean
		{
			return idUtils.isReal(this.taskId);
		},
		removableUserId(): number
		{
			if (this.multipleOnPlus)
			{
				return 0;
			}

			return this.canAdd ? Core.getParams().currentUser.id : 0;
		},
		userCount(): number
		{
			return this.userIds.length;
		},
		popupOptions(): Function
		{
			return (): PopupOptions => ({
				id: 'tasks-field-users-more-popup',
				bindElement: this.$refs.anchor,
				padding: 18,
				maxWidth: 300,
				maxHeight: 300,
				offsetTop: 8,
				targetContainer: document.body,
			});
		},
		bodyUserIds(): number[]
		{
			return this.userIds.slice(0, maxUsers);
		},
		moreUserIds(): number[]
		{
			return this.userIds.slice(maxUsers);
		},
		popupUserIds(): number[]
		{
			return this.inline && !this.canAdd ? this.userIds : this.moreUserIds;
		},
		withRemove(): boolean
		{
			if (!this.canRemove)
			{
				return false;
			}

			if (!this.useRemoveAll || this.userCount <= maxUsers)
			{
				return false;
			}

			return this.isDialogShown || this.isHovered;
		},
	},
	watch: {
		userCount(): void
		{
			if (this.popupUserIds.length === 0)
			{
				this.isMoreShown = false;
			}
		},
	},
	mounted(): void
	{
		void userService.list(this.userIds);
	},
	methods: {
		getUser(userId: number): UserModel
		{
			return this.$store.getters[`${Model.Users}/getById`](userId);
		},
		handleClick(): void
		{
			if (this.canAdd)
			{
				void this.showDialog();

				return;
			}

			if (this.userIds.length === 1)
			{
				BX.SidePanel.Instance.emulateAnchorClick(userService.getUrl(this.userIds[0]));

				return;
			}

			this.isMoreShown = true;
		},
		handleMore(): void
		{
			if ((!this.isEdit || this.inline) && this.canAdd)
			{
				void this.showDialog();

				return;
			}

			this.isMoreShown = true;
		},
		async showDialog(plus: boolean = false): Promise<void>
		{
			if (this.isLocked)
			{
				void showLimit({
					featureId: this.featureId,
					bindElement: this.$refs.anchor,
				});

				return;
			}

			if (this.withHint)
			{
				this.isHintShown = true;
				this.hintPromise = new Resolvable();

				if (await this.hintPromise === false)
				{
					return;
				}
			}

			this.isDialogShown = true;
			void usersDialog.show({
				targetNode: this.$refs.anchor,
				ids: this.userIds,
				selectableIds: this.canRemove ? null : new Set([this.removableUserId]),
				onClose: this.handleDialogClose,
				isMultiple: !this.single && (!this.multipleOnPlus || plus),
			});
		},
		handleDialogClose(userIds: number[]): void
		{
			this.isDialogShown = false;
			if (usersDialog.getDialog().isLoaded())
			{
				this.updateUsers(userIds);
			}
		},
		removeUser(userId: number): void
		{
			this.updateUsers(this.userIds.filter((id) => id !== userId));
		},
		updateUsers(userIds: number[]): void
		{
			this.$emit('update', userIds);
		},
		handleHintClick(): void
		{
			this.$emit('hintClick');

			this.hintPromise.resolve(true);

			this.isHintShown = false;
		},
		closeHint(): void
		{
			this.hintPromise.resolve(false);

			this.isHintShown = false;
		},
	},
	template: `
		<div v-bind="dataset" @mouseenter="isHovered = true" @mouseleave="isHovered = false">
			<FieldAdd 
				v-if="userCount === 0"
				:icon="Outline.PERSON"
				:isLocked
				@click="showDialog"
			/>
			<div v-else-if="inline && userCount > 1 || avatarOnly" class="tasks-field-users-inline">
				<HoverPill compact @click="handleClick">
					<template v-for="userId in bodyUserIds">
						<UserLabel class="tasks-field-user --inline" :user="getUser(userId)" avatarOnly/>
					</template>
				</HoverPill>
				<More
					:count="moreUserIds.length"
					:withRemove
					inline
					@showMore="handleMore"
					@removeAll="updateUsers([])"
				/>
			</div>
			<div v-else>
				<FieldHoverButton
					v-if="canAdd && !inline"
					:icon="Outline.PLUS_L"
					:isVisible="isDialogShown || isHovered"
					:isLocked
					@click="showDialog(true)"
				/>
				<Users
					:taskId
					:isEdit
					:userIds="bodyUserIds"
					:canAdd
					:canRemove="canRemove && !multipleOnPlus"
					:removableUserId
					:single
					:inline
					:showMenu
					:forceEdit
					@edit="showDialog"
					@remove="removeUser"
				/>
				<More
					:count="moreUserIds.length"
					:withRemove
					@showMore="handleMore"
					@removeAll="updateUsers([])"
				/>
			</div>
			<div ref="anchor"/>
		</div>
		<Popup v-if="isMoreShown" :options="popupOptions()" @close="isMoreShown = false">
			<Users
				:taskId
				:isEdit
				:userIds="popupUserIds"
				:canAdd
				:canRemove
				:removableUserId
				:single
				:showMenu
				:forceEdit
				fromPopup
				@edit="showDialog"
				@remove="removeUser"
			/>
		</Popup>
		<Hint v-if="isHintShown" :bindElement="$refs.anchor" @close="closeHint">
			<RichLoc class="tasks-field-users-hint" :text="hintText" placeholder="[action]">
				<template #action="{ text }">
					<span @click="handleHintClick">{{ text }}</span>
				</template>
			</RichLoc>
		</Hint>
	`,
};

function Resolvable(): Promise
{
	const promise = new Promise((resolve) => {
		this.resolve = resolve;
	});

	promise.resolve = this.resolve;

	return promise;
}

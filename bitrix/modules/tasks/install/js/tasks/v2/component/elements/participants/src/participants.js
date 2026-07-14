import type { PopupOptions } from 'main.popup';

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
import { showLimit } from 'tasks.v2.lib.show-limit';
import { idUtils } from 'tasks.v2.lib.id-utils';
import { usersDialog, type UserDialogItem } from 'tasks.v2.lib.user-selector-dialog';
import { loadUsersAbsenceInfo } from 'tasks.v2.component.absence-popup';
import { userService } from 'tasks.v2.provider.service.user-service';
import type { UserModel } from 'tasks.v2.model.users';

import { Users } from './users/users';
import { More } from './more/more';
import './participants.css';

const maxUsers = 4;

// @vue/component
export const Participants = {
	name: 'TaskParticipants',
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
		warnAboutAbsence: {
			type: [Boolean, String],
			default: false,
		},
	},
	emits: ['update', 'hintClick', 'absenceLoaded'],
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
		handleDialogClose(userIds: number[], items: UserDialogItem[]): void
		{
			this.isDialogShown = false;
			if (usersDialog.getDialog().isLoaded())
			{
				this.updateUsers(this.getUserIds(items));

				if (this.warnAboutAbsence)
				{
					void this.loadUsersAbsenceInfo(items);
				}
			}
		},
		getUserIds(items: UserDialogItem[]): number[]
		{
			if (!Array.isArray(items))
			{
				return [];
			}

			const itemsNew = [...items];
			const itemsSorted = itemsNew.sort((a, b) => {
				const getIsOnVacation = (item: UserDialogItem): boolean => {
					return item.customData?.get?.('isOnVacation') === true;
				};

				const isOnVacationA = getIsOnVacation(a);
				const isOnVacationB = getIsOnVacation(b);

				if (isOnVacationA === isOnVacationB)
				{
					return 0;
				}

				return isOnVacationA ? 1 : -1;
			});
			const ids = itemsSorted.map(({ id }) => id);
			const idsFiltered = ids.filter((id) => typeof id === 'number');

			return idsFiltered;
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
		async loadUsersAbsenceInfo(items: UserDialogItem[] = []): Promise<void>
		{
			const loadedUserIds = await loadUsersAbsenceInfo(items);

			if (loadedUserIds.length > 0)
			{
				this.$emit('absenceLoaded', loadedUserIds);
			}
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
					<template v-for="userId in bodyUserIds" :key="userId">
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
				>
					<template #user="slotProps">
						<slot name="user" v-bind="slotProps"/>
					</template>
				</Users>
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
			>
				<template #user="slotProps">
					<slot name="user" v-bind="slotProps"/>
				</template>
			</Users>
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

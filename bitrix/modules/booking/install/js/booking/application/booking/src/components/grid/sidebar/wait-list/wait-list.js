import { Event } from 'main.core';
import { mapGetters } from 'ui.vue3.vuex';
import { BIcon as Icon, Set as IconSet } from 'ui.icon-set.api.vue';
import 'ui.icon-set.actions';

import { EventName, LimitFeatureId, Model, Option } from 'booking.const';
import { dragActions, dragPolicy } from 'booking.lib.drag';
import { optionService } from 'booking.provider.service.option-service';

import { WaitListLayout } from './components/wait-list-layout/wait-list-layout';
import { WaitListGroups } from './components/wait-list-groups/wait-list-groups';
import { WaitListItem } from './components/wait-list-item/wait-list-item';
import { ButtonAddWaitListItem } from './components/button-add-wait-list-item/button-add-wait-list-item';
import './wait-list.css';

// @vue/component
export const WaitList = {
	name: 'WaitList',
	components: {
		Icon,
		ButtonAddWaitListItem,
		WaitListLayout,
		WaitListGroups,
		WaitListItem,
	},
	setup(): Object
	{
		return {
			IconSet,
		};
	},
	computed: {
		...mapGetters({
			waitListItems: `${Model.WaitList}/get`,
			waitListExpanded: `${Model.Interface}/waitListExpanded`,
			draggedBookingId: `${Model.Interface}/draggedBookingId`,
			draggedBookingResourceId: `${Model.Interface}/draggedBookingResourceId`,
			editingBookingId: `${Model.Interface}/editingBookingId`,
			editingWaitListItemId: `${Model.Interface}/editingWaitListItemId`,
			isFeatureEnabled: `${Model.Interface}/isFeatureEnabled`,
			embedItems: `${Model.Interface}/embedItems`,
		}),
		featureEnabled(): boolean
		{
			return this.$store.state[Model.Interface].enabledFeature.bookingWaitlist;
		},
		isEmpty(): boolean
		{
			return this.waitListItems.length === 0;
		},
		isAvailableDropToWaitList(): boolean
		{
			return Boolean(this.draggedBookingId) && dragPolicy.canMoveBookingOnCheckList({
				draggedBookingId: this.draggedBookingId,
				draggedBookingResourceId: this.draggedBookingResourceId,
			});
		},
		showEmptyState(): boolean
		{
			return this.isEmpty && !this.draggedBookingId;
		},
		embedEditingMode(): boolean
		{
			return (
				this.isFeatureEnabled
				&& (
					this.editingBookingId > 0
					|| this.editingWaitListItemId > 0
					|| (this.embedItems?.length ?? 0) > 0
				)
			);
		},
	},
	watch: {
		// wait list can be expanded externally (currently in ButtonAddWaitListItem)
		async waitListExpanded(newValue, oldValue): void
		{
			if (newValue !== oldValue)
			{
				await optionService.setBool(Option.WaitListExpanded, newValue);
			}
		},
	},
	methods: {
		async onMouseUp(): Promise<void>
		{
			if (!this.isAvailableDropToWaitList)
			{
				return;
			}

			const bookingId = this.draggedBookingId;

			if (!this.featureEnabled)
			{
				Event.EventEmitter.emit(EventName.StartLockedBookingAnimation, {
					bookingId,
					featureId: LimitFeatureId.Waitlist,
				});

				return;
			}

			await dragActions.moveBookingToWaitList(bookingId);
		},
		async collapseToggle(): Promise<void>
		{
			await this.$store.dispatch(`${Model.Interface}/setWaitListExpanded`, !this.waitListExpanded);
		},
	},
	template: `
		<WaitListLayout
			:dragging="isAvailableDropToWaitList"
			:showEmptyState
			:expanded="waitListExpanded"
			:waitListItemsCount="waitListItems.length"
			:waitListClass="{
				'--expand': waitListExpanded,
				'embed-editing-mode': embedEditingMode,
			}"
			@mouseUp="onMouseUp"
		>
			<template #header>
				<ButtonAddWaitListItem/>
				<div class="booking-sidebar-button" @click="collapseToggle">
					<Icon :name="waitListExpanded ? IconSet.COLLAPSE : IconSet.EXPAND_1"/>
				</div>
			</template>
			<template #waitlist>
				<WaitListGroups>
					<template #item="{ item }">
						<WaitListItem :item/>
					</template>
				</WaitListGroups>
			</template>
		</WaitListLayout>
	`,
};

import { mapGetters } from 'ui.vue3.vuex';
import { BIcon as Icon, Outline, Set as IconSet } from 'ui.icon-set.api.vue';

import { Dom } from 'main.core';
import { MenuManager } from 'main.popup';
import 'ui.icon-set.main';

import { Counter as UiCounter, CounterSize } from 'booking.component.counter';
import { HelpDesk, LimitFeatureId, Model, Option, ScrollDirection } from 'booking.const';
import { optionService } from 'booking.provider.service.option-service';
import { limit } from 'booking.lib.limit';
import { helpDesk } from 'booking.lib.help-desk';
import { busySlots } from 'booking.lib.busy-slots';

import { Multiple } from './multiple/multiple';
import { Single } from './single/single';

import './resource-intersection.css';

const IntersectionModeMenuItemId = 'booking-intersection-menu-mode';

// @vue/component
export const ResourceIntersection = {
	name: 'ResourceIntersection',
	components: {
		Icon,
		UiCounter,
		Multiple,
		Single,
	},
	setup(): Object
	{
		return {
			CounterSize,
			IconSet,
			Outline,
		};
	},
	computed: {
		...mapGetters({
			resourcesIds: `${Model.Interface}/resourcesIds`,
			isFilterMode: `${Model.Filter}/isFilterMode`,
			isEditingBookingMode: `${Model.Interface}/isEditingBookingMode`,
			intersections: `${Model.Interface}/intersections`,
			isIntersectionForAll: `${Model.Interface}/isIntersectionForAll`,
			intersectionExpanded: `${Model.Interface}/intersectionExpanded`,
			scroll: `${Model.Interface}/scroll`,
			isLoaded: `${Model.Interface}/isLoaded`,
			isFeatureEnabled: `${Model.Interface}/isFeatureEnabled`,
			isWeekMode: `${Model.Interface}/isWeekMode`,
		}),
		countIntersectionResources(): number
		{
			if (this.isIntersectionForAll)
			{
				return this.intersections[0]?.length ?? 0;
			}

			return Object.values(this.intersections)
				.filter((resourcesIds: number[]): boolean => resourcesIds.length > 0)
				.length
			;
		},
		neededShowIntersectionCounter(): boolean
		{
			return this.countIntersectionResources > 0;
		},
		hasIntersections(): boolean
		{
			return Object.values(this.intersections).some((resourcesIds: number[]) => resourcesIds.length > 0);
		},
		disabled(): boolean
		{
			return !this.isLoaded || this.isFilterMode || this.isEditingBookingMode;
		},
		isMultiResourcesFeatureEnabled(): boolean
		{
			return this.$store.state[Model.Interface].enabledFeature.bookingMulti;
		},
		scrollProperty(): string
		{
			return this.isWeekMode ? ScrollDirection.Vertical : ScrollDirection.Horizontal;
		},
		inactiveScrollProperty(): string
		{
			return this.isWeekMode ? ScrollDirection.Horizontal : ScrollDirection.Vertical;
		},
	},
	watch: {
		async isIntersectionForAll(): void
		{
			await this.$store.dispatch(`${Model.Interface}/setIntersections`, {});

			this.updateScroll();

			await busySlots.loadBusySlots();

			this.toggleMenuItemActivityState(
				this.menu.getMenuItem(IntersectionModeMenuItemId),
			);
		},
		scroll(): void
		{
			this.updateScroll();
		},
		intersectionExpanded(): void
		{
			void this.$nextTick(this.updateScroll);
		},
	},
	mounted(): void
	{
		this.menu = MenuManager.create(
			'booking-intersection-menu',
			this.$refs.intersectionMenu,
			this.getMenuItems(),
			{
				closeByEsc: true,
				autoHide: true,
				cacheable: true,
			},
		);
	},
	unmounted(): void
	{
		this.menu.destroy();
		this.menu = null;
	},
	methods: {
		showMenu(): void
		{
			if (!this.isMultiResourcesFeatureEnabled)
			{
				void limit.show(LimitFeatureId.MultiResources);

				return;
			}

			if (this.isFeatureEnabled)
			{
				this.menu.show();
			}
			else
			{
				void limit.show();
			}
		},
		getMenuItems(): MenuItemOptions[]
		{
			return [
				this.getIntersectionForAllItem(),
				{
					delimiter: true,
				},
				this.getHelpDeskItem(),
			];
		},
		getIntersectionForAllItem(): MenuItemOptions
		{
			return {
				id: IntersectionModeMenuItemId,
				dataset: {
					id: IntersectionModeMenuItemId,
				},
				text: this.loc('BOOKING_BOOKING_INTERSECTION_MENU_ALL'),
				className: this.isIntersectionForAll
					? 'menu-popup-item menu-popup-item-accept'
					: 'menu-popup-item menu-popup-no-icon',
				onclick: () => {
					this.menu.close();

					const value = !this.isIntersectionForAll;

					void this.$store.dispatch(`${Model.Interface}/setIntersectionMode`, value);
					void optionService.setBool(Option.IntersectionForAll, value);
				},
			};
		},
		getHelpDeskItem(): MenuItemOptions
		{
			return {
				id: 'booking-intersection-menu-info',
				dataset: {
					id: 'booking-intersection-menu-info',
				},
				text: this.loc('BOOKING_BOOKING_INTERSECTION_MENU_HOW'),
				onclick: () => this.showHelpDesk(),
			};
		},
		async showIntersections(selectedResourceIds: number[], resourceId: number = 0): void
		{
			const intersections = {
				...(resourceId === 0 ? {} : this.intersections),
				[resourceId]: selectedResourceIds,
			};

			await this.$store.dispatch(`${Model.Interface}/setIntersections`, intersections);

			await busySlots.loadBusySlots();
		},
		toggleMenuItemActivityState(item: MenuItem): void
		{
			Dom.toggleClass(item.getContainer(), 'menu-popup-item-accept');
			Dom.toggleClass(item.getContainer(), 'menu-popup-no-icon');
		},
		updateScroll(): void
		{
			if (!this.$refs.inner)
			{
				return;
			}

			if (this.intersectionExpanded)
			{
				this.$refs.inner[this.inactiveScrollProperty] = 0;
				this.$refs.inner[this.scrollProperty] = this.scroll;
			}
		},
		showHelpDesk(): void
		{
			helpDesk.show(
				HelpDesk.Intersection.code,
				HelpDesk.Intersection.anchorCode,
			);
		},
	},
	template: `
		<div
			class="booking-booking__intersection-settings"
			:class="{
				'--locked': !isMultiResourcesFeatureEnabled,
				'--active': hasIntersections,
				'--disabled': disabled,
			}"
			data-id="booking-intersections-left-panel-menu"
			ref="intersectionMenu"
			@click="showMenu"
		>
			<div class="booking-booking__intersection-settings_icon">
				<Icon :name="Outline.LAYERS"/>
				<UiCounter
					v-if="neededShowIntersectionCounter"
					counterClass="booking-booking__intersection-settings_counter --air"
					:size="CounterSize.SMALL"
					:value="countIntersectionResources"
				/>
				<div
					v-if="!isFeatureEnabled || !isMultiResourcesFeatureEnabled"
					class="booking-booking__intersection-settings_lock-icon"
				>
					<Icon :name="IconSet.LOCK"/>
				</div>
			</div>
			<template v-if="isWeekMode">
				<div class="booking-booking__intersection-settings_divider"></div>
				<div
					class="booking-booking__intersection-settings_toggle"
					@click.stop="$store.dispatch('interface/setIntersectionExpanded', !intersectionExpanded)"
				>
					<div class="booking-booking__intersection-settings_toggle-title">
						{{ loc('BOOKING_BOOKING_INTERSECTION_BUTTON_LABEL') }}
					</div>
					<Icon v-show="!intersectionExpanded" :name="Outline.CHEVRON_RIGHT_S"/>
					<Icon v-show="intersectionExpanded" :name="Outline.CHEVRON_LEFT_S"/>
				</div>
			</template>
		</div>
		<Teleport defer to="#booking-resource-intersections">
			<div 
				class="booking-booking__intersections"
				:class="{
					'--locked': !isMultiResourcesFeatureEnabled,
					'--disabled': disabled,
				}"
			>
				<div
					class="booking-booking__intersection-container"
					ref="inner"
					@scroll="$store.dispatch('interface/setScroll', $refs.inner[scrollProperty])"
				>
					<Single v-if="isIntersectionForAll" @change="showIntersections"/>
					<template v-else>
						<template v-for="resourceId of resourcesIds" :key="resourceId">
							<Multiple :resourceId="resourceId" @change="showIntersections"/>
						</template>
						<div class="booking-booking__intersection-container_blank"></div>
					</template>
				</div>
				<span v-if="isWeekMode" class="booking-booking__intersection-help" @click="showHelpDesk">?</span>
			</div>
		</Teleport>
	`,
};

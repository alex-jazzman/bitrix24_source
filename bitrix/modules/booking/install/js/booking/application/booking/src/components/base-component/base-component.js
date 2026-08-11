import { mapGetters } from 'ui.vue3.vuex';
import { DateTimeFormat } from 'main.date';

import { Model } from 'booking.const';
import { busySlots } from 'booking.lib.busy-slots';
import { gridTokens } from 'booking.lib.grid';

import { Sidebar } from '../grid/sidebar/sidebar';
import { GridDay } from '../grid-day/grid-day';
import { GridWeek } from '../grid-week/grid-week';
import { ActionsMenu } from '../actions-menu/actions-menu';
import { ResourcePanel } from '../resource-panel/resource-panel';
import { WeekInitialZoom } from '../../lib/initial-zoom/week-initial-zoom';

import './base-component.css';

const timeFormat = DateTimeFormat.getFormat('SHORT_TIME_FORMAT');

// @vue/component
export const BaseComponent = {
	name: 'BaseComponent',
	components: {
		GridDay,
		GridWeek,
		ActionsMenu,
		ResourcePanel,
		Sidebar,
	},
	data(): Object
	{
		return {
			isGridTokensInitialized: false,
			isInitialZoomMeasuring: false,
		};
	},
	computed: {
		...mapGetters({
			zoom: 'interface/zoom',
			fromHour: 'interface/fromHour',
			toHour: 'interface/toHour',
			gridMode: 'interface/gridMode',
			isWeekMode: `${Model.Interface}/isWeekMode`,
			intersectionExpanded: `${Model.Interface}/intersectionExpanded`,
		}),
		isAmPmMode(): boolean
		{
			if (DateTimeFormat.isAmPmMode())
			{
				return true;
			}

			const now: string = DateTimeFormat.format(timeFormat, Date.now());

			return now.endsWith('am') || now.endsWith('pm');
		},
		currentGridComponent(): Object
		{
			return this.isWeekMode ? GridWeek : GridDay;
		},
	},
	watch: {
		gridMode(): void
		{
			void busySlots.loadBusySlots();
			void this.updateInitialZoom();
		},
	},
	async mounted(): Promise<void>
	{
		await gridTokens.init(this.$refs.baseComponent);
		this.isGridTokensInitialized = true;

		void this.updateInitialZoom();
	},
	methods: {
		async updateInitialZoom(): Promise<void>
		{
			if (!this.isWeekMode)
			{
				this.isInitialZoomMeasuring = false;

				return;
			}

			this.isInitialZoomMeasuring = true;

			try
			{
				const zoom = new WeekInitialZoom().get(this.$refs.baseComponent);

				if (zoom && (zoom !== this.zoom))
				{
					await this.$store.dispatch('interface/setZoom', zoom);
				}
			}
			finally
			{
				this.isInitialZoomMeasuring = false;
			}
		},
	},
	template: `
		<div
			ref="baseComponent"
			class="booking-booking__base-component --ui-context-content-light"
			data-id="booking-booking-base-component"
			id="booking-content"
			:style="{
				'--zoom': zoom,
				'--from-hour': fromHour,
				'--to-hour': toHour,
			}"
			:class="{
				'--zoom-is-less-than-07': zoom < 0.7,
				'--zoom-is-less-than-08': zoom < 0.8,
				'--am-pm-mode': isAmPmMode,
				'--week-mode': isWeekMode,
				'--day-mode': !isWeekMode,
				'--initial-zoom-measuring': isInitialZoomMeasuring,
			}"
		>
			<template v-if="isGridTokensInitialized">
				<ActionsMenu class="booking-booking__base-component_actions"/>
				<ResourcePanel class="booking-booking__base-component_resources"/>
				<div v-show="intersectionExpanded"
					class="booking-booking__base-component_intersections" 
					id="booking-resource-intersections"
				></div>
				<component :is="currentGridComponent"/>
				<Sidebar/>
			</template>
		</div>
	`,
};

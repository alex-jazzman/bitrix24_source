import { AhaMoment, HelpDesk } from 'booking.const';
import { ahaMoments } from 'booking.lib.aha-moments';

import { BatteryIcon, BATTERY_ICON_HEIGHT, BATTERY_ICON_WIDTH } from './battery-icon/battery-icon';
import { resourceWorkloadService, type ResourceWorkloadStats } from './lib/resource-workload-service';
import { WorkloadPopup } from './workload-popup/workload-popup';
import './resource-workload.css';

// @vue/component
export const ResourceWorkload = {
	name: 'ResourceWorkload',
	components: {
		BatteryIcon,
		WorkloadPopup,
	},
	props: {
		resourceId: {
			type: Number,
			required: true,
		},
		scale: {
			type: Number,
			default: 1,
		},
		isGrid: {
			type: Boolean,
			default: false,
		},
	},
	data(): Object
	{
		return {
			isPopupShown: false,
		};
	},
	computed: {
		stats(): ResourceWorkloadStats
		{
			return resourceWorkloadService.calculate(this.resourceId) ?? {
				slotsCount: 0,
				busySlotsCount: 0,
			};
		},
		workLoadPercent(): number
		{
			if (this.slotsCount === 0)
			{
				return 0;
			}

			return Math.round(this.busySlotsCount * 100 / this.slotsCount);
		},
		slotsCount(): number
		{
			return this.stats.slotsCount;
		},
		batteryIconOptions(): { height: number, width: number }
		{
			return {
				height: Math.round(BATTERY_ICON_HEIGHT * this.scale),
				width: Math.round(BATTERY_ICON_WIDTH * this.scale),
			};
		},
		busySlotsCount(): number
		{
			return this.stats.busySlotsCount;
		},
	},
	watch: {
		busySlotsCount(newCount: number, previousCount: number): void
		{
			if (this.isGrid && newCount > previousCount && ahaMoments.shouldShow(AhaMoment.ResourceWorkload))
			{
				void this.showAhaMoment();
			}
		},
	},
	methods: {
		onMouseEnter(): void
		{
			this.showTimeout = setTimeout(() => this.showPopup(), 100);
		},
		onMouseLeave(): void
		{
			clearTimeout(this.showTimeout);
			this.closePopup();
		},
		showPopup(): void
		{
			this.isPopupShown = true;
		},
		closePopup(): void
		{
			this.isPopupShown = false;
		},
		async showAhaMoment(): Promise<void>
		{
			ahaMoments.setPopupShown(AhaMoment.ResourceWorkload);
			await ahaMoments.show({
				id: 'booking-resource-workload',
				title: this.loc('BOOKING_AHA_RESOURCE_WORKLOAD_TITLE'),
				text: this.loc('BOOKING_AHA_RESOURCE_WORKLOAD_TEXT'),
				article: HelpDesk.AhaResourceWorkload,
				target: this.$refs.container,
				isPulsarTransparent: true,
			});

			ahaMoments.setShown(AhaMoment.ResourceWorkload);
		},
	},
	template: `
		<div
			class="booking-booking-header-resource-workload"
			data-element="booking-resource-workload"
			:data-id="resourceId"
			ref="container"
			@click="showPopup"
			@mouseenter="onMouseEnter"
			@mouseleave="onMouseLeave"
		>
			<BatteryIcon
				:percent="workLoadPercent"
				:data-id="resourceId"
				:height="batteryIconOptions.height"
				:width="batteryIconOptions.width"
			/>
		</div>
		<WorkloadPopup
			v-if="isPopupShown"
			:resourceId="resourceId"
			:slotsCount="slotsCount"
			:busySlotsCount="busySlotsCount"
			:workLoadPercent="workLoadPercent"
			:bindElement="$refs.container"
			@close="closePopup"
		/>
	`,
};

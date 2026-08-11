import { Event } from 'main.core';
import { mapGetters } from 'ui.vue3.vuex';
import { Label, LabelSize } from 'ui.label';

import { EventName, Model } from 'booking.const';
import { ahaMoments } from 'booking.lib.aha-moments';
import { Duration } from 'booking.lib.duration';
import { currencyFormat } from 'booking.lib.currency-format';
import { Counter as UiCounter, CounterSize } from 'booking.component.counter';

import { type BookingModel, type SkuModel } from 'booking.model.bookings';
import { type ResourceModel } from 'booking.model.resources';
import { type ResourceTypeModel } from 'booking.model.resource-types';

import { ResourceWorkload } from './resource-workload/resource-workload';
import { ResourceMenu } from './resource-menu/resource-menu';

import './resource.css';

// @vue/component
export const Resource = {
	components: {
		ResourceMenu,
		ResourceWorkload,
		UiCounter,
	},
	props: {
		resourceId: {
			type: Number,
			required: true,
		},
		withScale: {
			type: Boolean,
			default: true,
		},
	},
	setup(): Object
	{
		return {
			CounterSize,
		};
	},
	data(): Object
	{
		return {
			visible: true,
		};
	},
	computed: {
		...mapGetters({
			resourcesIds: `${Model.Interface}/resourcesIds`,
			zoom: `${Model.Interface}/zoom`,
			scroll: `${Model.Interface}/scroll`,
			selectedDateTs: `${Model.Interface}/selectedDateTs`,
			selectedFirstDayPeriodTs: `${Model.Interface}/selectedFirstDayPeriodTs`,
			gridMode: `${Model.Interface}/gridMode`,
			isWeekMode: `${Model.Interface}/isWeekMode`,
			intersections: `${Model.Interface}/intersections`,
			intersectionExpanded: `${Model.Interface}/intersectionExpanded`,
			hasIntersectionByResourceId: `${Model.Interface}/hasIntersectionByResourceId`,
		}),
		resource(): ResourceModel
		{
			return this.$store.getters[`${Model.Resources}/getById`](this.resourceId);
		},
		resourceType(): ResourceTypeModel
		{
			return this.$store.getters[`${Model.ResourceTypes}/getById`](this.resource.typeId);
		},
		neededShowIntersectionCounter(): boolean
		{
			return this.isWeekMode && this.hasIntersectionByResourceId(this.resourceId);
		},
		intersectionCountLabel(): string
		{
			const count = (this.intersections[this.resourceId] ?? []).length;

			return `+${count}`;
		},
		profit(): string
		{
			const currencyId = currencyFormat.getBaseCurrencyId();
			const services = this.bookings
				.filter((booking: BookingModel) => booking.skus)
				.flatMap((booking: BookingModel) => booking.skus)
				.filter((sku: SkuModel) => sku.currencyId === currencyId)
			;

			if (services.length === 0)
			{
				return '';
			}

			const profit = services.reduce((sum: number, sku: SkuModel) => sum + sku.price, 0);

			return currencyFormat.format(currencyId, profit);
		},
		bookings(): BookingModel[]
		{
			if (this.isWeekMode)
			{
				return this.$store.getters[`${Model.Bookings}/getByIntervalAndResources`](
					this.selectedFirstDayPeriodTs,
					this.selectedFirstDayPeriodTs + Duration.getUnitDurations().w,
					[this.resourceId],
				);
			}

			return this.$store.getters[`${Model.Bookings}/getByDateAndResources`](this.selectedDateTs, [this.resourceId]);
		},
		labelHTML(): string {
			const label = new Label({
				size: LabelSize.SM,
				text: this.loc('BOOKING_BOOKING_RESOURCE_DELETED'),
				fill: true,
			});

			return label.render().outerHTML;
		},
		isFirstResource(): boolean
		{
			return this.resourceId === this.resourcesIds[0];
		},
	},
	watch: {
		scroll(): void
		{
			this.updateVisibility();
		},
		zoom(): void
		{
			this.updateVisibility();
		},
		resourcesIds(): void
		{
			this.updateVisibilityDuringTransition();
		},
		gridMode(): void
		{
			this.updateVisibility();
		},
	},
	mounted(): void
	{
		this.updateVisibility();
		this.updateVisibilityDuringTransition();

		if (this.isFirstResource)
		{
			Event.EventEmitter.subscribe(EventName.AiCallBannerClosed, this.tryShowAiCallAha);
		}
	},
	beforeUnmount(): void
	{
		if (this.isFirstResource)
		{
			Event.EventEmitter.unsubscribe(EventName.AiCallBannerClosed, this.tryShowAiCallAha);
		}
	},
	methods: {
		updateVisibilityDuringTransition(): void
		{
			this.animation?.stop();
			this.animation = new BX.easing({
				duration: 200,
				start: {},
				finish: {},
				step: this.updateVisibility,
			});
			this.animation.animate();
		},
		updateVisibility(): void
		{
			if (!this.$refs.container)
			{
				return;
			}

			const rect = this.$refs.container.getBoundingClientRect();

			if (this.isWeekMode)
			{
				this.visible = rect.bottom > 0 && rect.top < window.innerHeight;
			}
			else
			{
				this.visible = rect.right > 0 && rect.left < window.innerWidth;
			}
		},
		async tryShowAiCallAha(): Promise<void>
		{
			const isAiCallAhaShown = this.$store.getters[`${Model.Interface}/isAiCallAhaShown`];
			if (isAiCallAhaShown || !this.$refs.meta)
			{
				return;
			}

			void this.$store.dispatch(`${Model.Interface}/setIsAiCallAhaShown`, true);

			await ahaMoments.show({
				id: 'booking-ai-call-notification',
				text: this.loc('BOOKING_AHA_AI_CALL_NOTIFICATION_TEXT'),
				target: this.$refs.meta,
				isPulsarTransparent: true,
			});
		},
	},
	template: `
		<div
			class="booking-booking-header-resource"
			data-element="booking-resource"
			:data-id="resourceId"
			ref="container"
		>
			<template v-if="visible">
				<ResourceWorkload
					v-if="!resource.isDeleted"
					:resourceId="resourceId"
					:scale="withScale ? zoom : undefined"
					:isGrid="true"
				/>
				<div class="booking-booking-header-resource-title">
					<div class="booking-booking-header-resource-name" :title="resource.name">
						{{ resource.name }}
					</div>
					<div class="booking-booking-header-resource-type" :title="resourceType.name">
						{{ resourceType.name }}
					</div>
				</div>
				<div
					v-if="resource.isDeleted"
					v-html="labelHTML"
				></div>
				<div v-else class="booking-booking-header-resource-meta">
					<div
						class="booking-booking-header-resource-profit"
						v-html="profit"
					></div>
					<div class="booking-booking-header-resource-meta-row" ref="meta">
						<div class="booking-booking-header-resource-actions">
							<ResourceMenu :resourceId="resourceId"/>
						</div>
						<UiCounter
							v-if="neededShowIntersectionCounter"
							counterClass="booking-booking-header-resource-intersection-counter --air"
							:size="CounterSize.MEDIUM"
							:value="intersectionCountLabel"
							@click.stop="$store.dispatch('interface/setIntersectionExpanded', !intersectionExpanded)"
						/>
					</div>
				</div>
			</template>
		</div>
	`,
};

import { mapGetters } from 'ui.vue3.vuex';

import { Model, ScrollDirection } from 'booking.const';

import { Resource } from './resource/resource';
import { AddResourceButton } from './add-resource-button/add-resource-button';

import './resource-panel.css';

// @vue/component
export const ResourcePanel = {
	components: {
		Resource,
		AddResourceButton,
	},
	computed: {
		...mapGetters({
			scroll: `${Model.Interface}/scroll`,
			resourcesIds: `${Model.Interface}/resourcesIds`,
			isEditingBookingMode: `${Model.Interface}/isEditingBookingMode`,
			gridMode: `${Model.Interface}/gridMode`,
			isWeekMode: `${Model.Interface}/isWeekMode`,
		}),
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
		scroll(value): void
		{
			this.applyScroll(value);
		},
	},
	mounted(): void
	{
		this.applyScroll(this.scroll);
	},
	methods: {
		applyScroll(value: number): void
		{
			this.$refs.container[this.inactiveScrollProperty] = 0;
			this.$refs.container[this.scrollProperty] = value;
		},
		handleScroll(): void
		{
			const scrollValue = this.$refs.container[this.scrollProperty];
			this.$store.dispatch('interface/setScroll', scrollValue);
		},
	},
	template: `
		<div 
			class="booking-booking__resource-panel"
			ref="container"
			@scroll="handleScroll"
		>
			<div class="booking-booking__resource-panel_resources">
				<TransitionGroup name="booking-transition-resource">
					<template v-for="resourceId of resourcesIds" :key="resourceId">
						<Resource :resourceId="resourceId" :withScale="!isWeekMode"/>
					</template>
				</TransitionGroup>
			</div>
			<AddResourceButton v-if="!isEditingBookingMode"/>
		</div>
	`,
};

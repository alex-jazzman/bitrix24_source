import { Event, Type } from 'main.core';

import { locMixin } from 'booking.component.mixin.loc-mixin';

import { AllResource } from './const/const';
import { mapDtoToResource, mapResourcesToFormData } from './lib/mappers';
import { Occupancy, createOccupancy } from './occupancy';
import { SkuSelectBlock } from './components/sku-select-block/sku-select-block';
import { ResourceSelectBlock } from './components/resource-select-block/resource-select-block';
import { CalendarBlock } from './components/calendar-block/calendar-block';
import { TimeSelectorBlock } from './components/time-selector-block/time-selector-block';
import { AvailableSlotsBlock } from './components/available-slots-block/available-slots-block';
import type { Resource, ResourceSkuRelation } from './types';
import './field.css';

type Slot = {
	id: string,
	fromTs: number,
	toTs: number,
};

// @vue/component
export const Field = {
	name: 'CrmFormBookingField',
	components: {
		AvailableSlotsBlock,
		CalendarBlock,
		ResourceSelectBlock,
		SkuSelectBlock,
		TimeSelectorBlock,
	},
	mixins: [locMixin],
	provide(): Object
	{
		return {
			isPreview: this.isPreview,
		};
	},
	props: {
		field: {
			type: Object,
			required: true,
		},
		runAction: {
			type: Function,
			required: true,
		},
		dependencies: {
			type: Object,
			required: true,
		},
	},
	emits: ['change'],
	data(): Object
	{
		return {
			form: {
				skuId: 0,
				resourceId: 0,
				date: null,
				dateTs: 0,
				slot: null,
			},
			resources: [],
			resourceIds: [],
			resourcesWithSkus: [],
			fetchingResources: false,
			fetchingOccupancy: false,
			fetchingAutoSelectionResource: false,
			visibleCalendar: false,
			occupancy: null,
		};
	},
	computed: {
		timezone(): string
		{
			return Intl.DateTimeFormat().resolvedOptions().timeZone;
		},
		isPreview(): boolean
		{
			return this.$root.form.editMode || window.location.pathname.indexOf('/sites/site/') === 0;
		},
		isAutoSelectionOn(): boolean
		{
			return Boolean(this.field?.options?.settingsData?.isAutoSelectionOn);
		},
		settingsData(): Object
		{
			const defaultSettingsData = {
				label: this.loc('BOOKING_CRM_FORMS_DEFAULT_RESOURCE_FIELD_LABEL'),
				textHeader: this.loc('BOOKING_CRM_FORMS_DEFAULT_RESOURCE_FIELD_PLACEHOLDER'),
				hint: this.loc('BOOKING_CRM_FORMS_DEFAULT_RESOURCE_FIELD_HINT'),
				isVisibleHint: true,
				skuLabel: this.loc('BOOKING_CRM_FORMS_DEFAULT_SKU_FIELD_LABEL'),
				skuTextHeader: this.loc('BOOKING_CRM_FORMS_DEFAULT_SKU_FIELD_PLACEHOLDER'),
			};

			if (this.isPreview && Array.isArray(this.field?.options?.settingsData))
			{
				return defaultSettingsData;
			}

			const result = this.isAutoSelectionOn
				? this.field?.options?.settingsData?.autoSelection
				: this.field?.options?.settingsData?.default;

			return Type.isObject(result) ? result : defaultSettingsData;
		},
		hasSlotsAllAvailableResources(): boolean
		{
			return !this.isAutoSelectionOn && this.settingsData?.hasSlotsAllAvailableResources;
		},
		isFieldWithSkus(): boolean
		{
			return this.resourceSkuRelations?.length > 0;
		},
		hasSkuFieldInPreview(): boolean
		{
			if (!this.isPreview)
			{
				return false;
			}

			const settingsData = this.isAutoSelectionOn
				? this.field?.options?.settingsData?.autoSelection
				: this.field?.options?.settingsData?.default;

			return (
				settingsData?.skuLabel
				|| settingsData?.skuTextHeader
				|| settingsData?.skuHint
				|| settingsData?.isVisibleSkuHint
				|| settingsData?.resources?.length > 0
			);
		},
		fetching(): boolean
		{
			return this.fetchingResources || this.fetchingOccupancy || this.fetchingAutoSelectionResource;
		},
		resource(): Object | null
		{
			if (!this.form.resourceId)
			{
				return null;
			}

			return this.resources.find((resource: Resource) => resource.id === this.form.resourceId) || null;
		},
		realResources(): Resource[]
		{
			return this.hasSlotsAllAvailableResources
				? this.resources.filter(({ id }) => id !== AllResource.id)
				: this.resources;
		},
		value(): { resourcesIds: number[], fromTs: number, toTs: number } | null
		{
			if (!this.form.slot || !this.form.resourceId)
			{
				return null;
			}

			let resources = [];
			if (this.isFieldWithSkus)
			{
				resources = [
					{
						id: this.form.resourceId,
						skus: [{ id: this.form.skuId }],
					},
				];
			}
			else
			{
				resources = [{ id: this.form.resourceId }];
			}

			return {
				resources,
				dateFromTs: this.form.slot.fromTs / 1000,
				dateToTs: this.form.slot.toTs / 1000,
				timezone: this.timezone,
			};
		},
		resourceSkuRelations(): ResourceSkuRelation[]
		{
			return this.settingsData?.resources || [];
		},
		errorMessage(): string
		{
			return this.field.messages.get('fieldErrorRequired');
		},
		hasErrors(): boolean
		{
			return this.field.validated && !this.field.focused && !this.field.valid();
		},
		hasTitleOnlyInCalendar(): boolean
		{
			return (
				this.form.date
				&& !this.visibleCalendar
				&& (this.form.resourceId && this.isAutoSelectionOn)
			);
		},
		showedCalendarBlock(): boolean
		{
			return (
				(this.form.resourceId && !this.form.date)
				|| this.form.date !== null
				|| this.visibleCalendar
			);
		},
		showedSlotsBlock(): boolean
		{
			return (
				!this.isPreview
				&& this.hasSlotsAllAvailableResources
				&& this.form.resourceId === AllResource.id
				&& this.resources.length > 0
				&& this.form.date !== null
			);
		},
		showedTimeSelectorBlock(): boolean
		{
			return !this.isPreview && this.form.resourceId > 0 && this.realResources.length > 0 && this.form.date !== null;
		},
	},
	watch: {
		'$root.form.sent': {
			handler(next, prev): void
			{
				this.tryUnbindCompleteScreen();

				if (next && !prev)
				{
					Event.bind(window, 'click', this.subscribeCompleteScreen, true);
				}
			},
		},
	},
	created(): void
	{
		this.initField();
	},
	async mounted(): Promise<void>
	{
		if (!this.isPreview)
		{
			await this.loadData();
		}

		Event.bind(window, 'click', this.handleFocus, true);
	},
	beforeUnmount(): void
	{
		Event.unbind(window, 'click', this.handleFocus, true);
	},
	methods: {
		initField(): void
		{
			this.resourceIds = this.settingsData?.resourceIds || [];

			this.occupancyManager = createOccupancy(this.runAction);
			this.occupancyManager.setTimezone(this.timezone);

			this.form.skuId = 0;
			this.form.resourceId = this.hasSlotsAllAvailableResources ? AllResource.id : 0;
			this.form.date = new Date();
			this.form.slot = null;
		},
		async loadData(): Promise<void>
		{
			if (this.isFieldWithSkus)
			{
				await this.loadResourceSkuRelationsData();
			}
			else
			{
				await this.loadResourcesData();
			}
		},
		async resetForm(): void
		{
			this.initField();
			this.field.validated = false;
			this.occupancyManager.clearCache();

			await this.loadData();
		},
		handleFocus({ target }): void
		{
			this.field.focused = this.$el.contains(target);
		},
		onSelectorChange(): void
		{
			this.updateValue();
		},
		updateValue(): void
		{
			if (this.form.resourceId || this.form.slot)
			{
				this.field.validated = false;
			}

			this.$emit('change', this.value);
		},
		async loadResourceSkuRelationsData(): Promise<void>
		{
			try
			{
				this.fetchingResources = true;

				const formData = mapResourcesToFormData(this.settingsData.resources || []);
				const response = await this.runAction('booking.api_v1.CrmForm.PublicForm.getResourcesWithSkus', {
					data: formData,
				});

				this.resourcesWithSkus = response?.data || [];
			}
			catch (error)
			{
				console.error('Load resource sku relations error', error);
			}
			finally
			{
				this.fetchingResources = false;
			}
		},
		async loadResourcesData(): Promise<void>
		{
			const promises = [
				this.loadResources(),
			];

			if (this.isAutoSelectionOn)
			{
				promises.push(this.fetchAutoSelectionData());
			}

			await Promise.all(promises);
		},
		async fetchAutoSelectionData(): Promise<void>
		{
			try
			{
				this.fetchingAutoSelectionResource = true;

				const formData = new FormData();
				formData.append('timezone', this.timezone);

				this.resourceIds.forEach((resourceId: number) => {
					formData.append('resourceIds[]', resourceId);
				});

				const response = await this.runAction('booking.api_v1.CrmForm.PublicForm.getAutoSelectionData', {
					data: formData,
				});

				if (Type.isPlainObject(response?.data))
				{
					this.form.resourceId = response.data.resourceId || 0;
					this.form.date = response.data.date ? new Date(response.data.date) : null;
				}
			}
			catch (error)
			{
				console.error('RunAction getAutoSelectionData error', error);
			}
			finally
			{
				this.fetchingAutoSelectionResource = false;
			}
		},
		async loadResources(): Promise<void>
		{
			try
			{
				this.fetchingResources = true;
				const response = await this.runAction('booking.api_v1.CrmForm.PublicForm.getResources', {
					data: {
						ids: this.resourceIds,
					},
				});
				this.setResources(mapDtoToResource(response.data || []));

				if (this.occupancyManager instanceof Occupancy)
				{
					this.occupancyManager.setResources(this.resources);
				}
			}
			catch (error)
			{
				console.error('Load resource error', error);
			}
			finally
			{
				this.fetchingResources = false;
			}
		},
		changeDate(): void
		{
			if (this.isPreview)
			{
				return;
			}

			this.visibleCalendar = true;
		},
		setResourceIdsBySkuId(skuId: number): void
		{
			const resourceIds: Set<number> = new Set();

			for (const resource of this.resourcesWithSkus)
			{
				if (resource.skus.some(({ id }) => id === skuId))
				{
					resourceIds.add(resource.id);
				}
			}

			this.resourceIds = [...resourceIds];
		},
		async setSku(skuId: number): Promise<void>
		{
			this.form.skuId = skuId;
			this.setResourceIdsBySkuId(skuId);

			await this.loadResourcesData();
		},
		setResource(resourceId: number): void
		{
			this.form.resourceId = resourceId;
			this.form.slot = null;
		},
		setResources(resources: Resource[]): void
		{
			const resourceIds: number[] = this.resourceIds || [];
			const artificialResources: Resource[] = [];

			if (this.hasSlotsAllAvailableResources)
			{
				artificialResources.push({
					...AllResource,
					name: this.loc('BOOKING_CRM_FORMS_ALL_RESOURCES_LABEL'),
				});
			}

			this.resources = [
				...artificialResources,
				...resources.filter(({ id }) => resourceIds.includes(id)),
			];
		},
		setDate(date: Date | null): void
		{
			this.form.date = date;
			this.form.slot = null;
		},
		setSlot(selectedSlot: Slot): void
		{
			this.form.slot = selectedSlot;
			this.updateValue();
		},
		updateForm(formPatch: Object): void
		{
			this.form = {
				...this.form,
				...formPatch,
			};
			this.updateValue();
		},
		subscribeCompleteScreen(e: PointerEvent): void
		{
			if (e.target.tagName.toLowerCase() !== 'button')
			{
				return;
			}

			this.resetForm();
		},
		tryUnbindCompleteScreen(): void
		{
			Event.unbind(window, 'click', this.subscribeCompleteScreen, true);
		},
	},
	template: `
		<div class="booking-crm-forms-field-container">
			<SkuSelectBlock
				v-if="hasSkuFieldInPreview || isFieldWithSkus"
				:skuId="form.skuId"
				:resourcesWithSkus="resourcesWithSkus"
				:settingsData="settingsData"
				:dependencies="dependencies"
				@update:skuId="setSku"
			/>
			<ResourceSelectBlock
				v-if="isPreview || (isFieldWithSkus && form.skuId > 0) || !isFieldWithSkus"
				:resourceId="form.resourceId"
				:resources="resources"
				:settingsData="settingsData"
				:errorMessage="errorMessage"
				:hasErrors="hasErrors && form.resourceId <= 0"
				:fetching="fetchingAutoSelectionResource || fetchingResources || fetchingOccupancy"
				:dependencies="dependencies"
				@update:resourceId="setResource"
			/>
			<template v-if="(isFieldWithSkus && form.skuId > 0) || !isFieldWithSkus">
				<CalendarBlock
					v-if="!isPreview && showedCalendarBlock"
					:resource="resource"
					:date="form.date"
					:titleOnly="hasTitleOnlyInCalendar"
					:hasError="hasErrors && form.slot === null"
					:errorMessage="errorMessage"
					@updateDate="setDate"
				/>
				<AvailableSlotsBlock
					v-if="showedSlotsBlock"
					:date="form.date"
					:resources="realResources"
					:runAction="runAction"
					:timezone="timezone"
					@update:form="updateForm"
				/>
				<TimeSelectorBlock
					v-if="showedTimeSelectorBlock"
					:slot="form.slot"
					:resource="resource"
					:resources="realResources"
					:date="form.date"
					:runAction="runAction"
					:fetching="fetchingOccupancy"
					:timezone="timezone"
					:showChangeDateButton="hasTitleOnlyInCalendar"
					@update:fetching="fetchingOccupancy = $event"
					@update:slot="setSlot"
					@showCalendar="visibleCalendar = true"
				/>
			</template>
		</div>
	`,
};

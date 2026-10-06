import 'ui.forms';
import 'ui.icon-set.main';
import 'ui.layout-form';
import { Type } from 'main.core';
import { type UploaderFile } from 'ui.uploader.core';
import { createNamespacedHelpers, mapGetters } from 'ui.vue3.vuex';

import { Model, NotificationFieldsMap, NotificationTemplateType } from 'booking.const';
import { type TemplateTypePreselectionContext } from 'booking.model.resource-creation-wizard';
import { type ResourceTypeModel } from 'booking.model.resource-types';
import { type SlotRange } from 'booking.model.resources';
import { resourceCreationWizardService } from 'booking.provider.service.resource-creation-wizard-service';

import {
	isMultidayTemplateAvailable,
	normalizeSlotLength,
	resolvePreselectedTemplateTypes,
	shouldPreselectTemplateTypes,
	type MultidayTemplateAvailability,
	type TemplateTypeSelection,
} from '../../lib/slot-length';

import { BaseFields } from './base-fields/base-fields';
import { Integration } from './integration/integration';
import { ScheduleTypes } from './schedule-types/schedule-types';
import { ServicesSkus } from './services-skus/services-skus';
import { SlotLength } from './slot-length/slot-length';
import { WorkTime } from './work-time/work-time';

import './resource-settings-card.css';

const { mapGetters: mapResourceGetters, mapActions, mapMutations } = createNamespacedHelpers('resource-creation-wizard');

// @vue/component
export const ResourceSettingsCard = {
	name: 'ResourceSettingsCard',
	components: {
		BaseFields,
		ScheduleTypes,
		WorkTime,
		SlotLength,
		ServicesSkus,
		Integration,
	},
	data(): Object
	{
		return {
			selectedSlotLength: 60,
			initialTimezone: '',
		};
	},
	computed: {
		...mapGetters({
			timezone: `${Model.Interface}/timezone`,
		}),
		...mapResourceGetters({
			resource: 'getResource',
			companyScheduleSlots: 'getCompanyScheduleSlots',
			isCompanyScheduleAccess: 'isCompanyScheduleAccess',
			companyScheduleUrl: 'companyScheduleUrl',
			isGlobalSchedule: 'isGlobalSchedule',
			templateTypePreselectionContext: 'templateTypePreselectionContext',
		}),
		resourceName(): string
		{
			return this.resource.name;
		},
		resourceType(): Object
		{
			const resourceType: ?ResourceTypeModel = this.$store
				.getters[`${Model.ResourceTypes}/getById`](this.resource.typeId)
			;

			return {
				typeId: this.resource.typeId,
				typeName: resourceType?.name,
			};
		},
		resourceDescription(): string
		{
			return this.resource.description ?? '';
		},
		resourceAvatarUrl(): string
		{
			return this.resource.avatar?.url ?? '';
		},
		slotRanges(): SlotRange[]
		{
			return this.resource.slotRanges;
		},
		defaultSlotRange(): SlotRange
		{
			return this.companyScheduleSlots[0];
		},
		slotSize(): number
		{
			const slotRange: SlotRange = this.resource.slotRanges?.[0];

			return normalizeSlotLength(slotRange?.slotSize ?? 60, this.isMultidayFeatureEnabled);
		},
		isMultidayFeatureEnabled(): boolean
		{
			return this.$store.state[Model.Interface].enabledFeature.bookingLong;
		},
		isMain: {
			get(): boolean
			{
				return this.resource.isMain;
			},
			set(isMain: boolean)
			{
				this.updateResource({ isMain });
			},
		},
		isEditForm(): boolean
		{
			return this.resource.id !== null;
		},
		resourceTypeTemplateDefaults(): TemplateTypeSelection
		{
			const resourceType: ?ResourceTypeModel = this.$store
				.getters[`${Model.ResourceTypes}/getById`](this.resource.typeId)
			;

			return {
				templateTypeInfo: resourceType?.[NotificationFieldsMap.TemplateType.info]
					?? NotificationTemplateType.Animate,
				templateTypeConfirmation: resourceType?.[NotificationFieldsMap.TemplateType.confirmation]
					?? NotificationTemplateType.Animate,
			};
		},
		multidayTemplateAvailability(): MultidayTemplateAvailability
		{
			const dictionary = this.$store.getters[`${Model.Dictionary}/getNotifications`];

			return {
				templateTypeInfo: this.hasMultidayTemplate(dictionary?.Info?.value),
				templateTypeConfirmation: this.hasMultidayTemplate(dictionary?.Confirmation?.value),
			};
		},
	},
	created(): void
	{
		this.initialTimezone = this.getInitialSlotTimeZone();
		this.selectedSlotLength = this.slotSize;

		const slotRanges = (
			Type.isArrayFilled(this.resource.slotRanges)
				? this.resource.slotRanges
				: this.companyScheduleSlots
		);

		this.updateSlotRanges(slotRanges);
		this.applyPreselectedTemplateTypes();
	},
	methods: {
		...mapActions([
			'updateResource',
			'setResourceAvatarFile',
			'setInvalidResourceName',
			'setInvalidResourceType',
		]),
		...mapMutations([
			'setGlobalSchedule',
			'setTemplateTypePreselectionContext',
		]),
		updateResourceName(name): void
		{
			this.updateResource({ name });
			if (name)
			{
				this.setInvalidResourceName(false);
			}
		},
		updateResourceType(typeId): void
		{
			if (typeId !== this.resource.typeId)
			{
				this.updateResource({ typeId });
				this.applyPreselectedTemplateTypes();
			}

			if (typeId)
			{
				this.setInvalidResourceType(false);
			}
		},
		hasMultidayTemplate(notificationType: ?string): boolean
		{
			if (!notificationType)
			{
				return false;
			}

			const notification = this.$store.getters[`${Model.Notifications}/getByType`](notificationType);

			return isMultidayTemplateAvailable(notification?.templates);
		},
		applyPreselectedTemplateTypes(): void
		{
			const currentContext: TemplateTypePreselectionContext = {
				resourceTypeId: this.resource.typeId,
				slotLength: this.selectedSlotLength,
			};

			if (!shouldPreselectTemplateTypes(
				this.isEditForm,
				this.templateTypePreselectionContext,
				currentContext,
			))
			{
				return;
			}

			this.updateResource(resolvePreselectedTemplateTypes(
				this.selectedSlotLength,
				this.resourceTypeTemplateDefaults,
				this.multidayTemplateAvailability,
			));
			this.setTemplateTypePreselectionContext(currentContext);
		},
		updateResourceDescription(description): void
		{
			this.updateResource({ description });
		},
		updateResourceAvatarFile(avatarFile: UploaderFile | null): void
		{
			if (avatarFile)
			{
				this.setResourceAvatarFile(avatarFile.getBinary());
				this.updateResource({
					avatar: {
						id: null,
						url: avatarFile.getPreviewUrl(),
					},
				});
			}
			else
			{
				this.setResourceAvatarFile(null);
				this.updateResource({ avatar: null });
			}
		},
		updateSlotRanges(slotRanges: SlotRange[]): void
		{
			this.updateResource({ slotRanges: this.updateSlotDataForAllRanges(slotRanges) });
		},
		updateSlotLength(value): void
		{
			const selectedSlotLength = normalizeSlotLength(value, this.isMultidayFeatureEnabled);
			this.selectedSlotLength = selectedSlotLength;
			this.applyPreselectedTemplateTypes();

			if (this.resource.slotRanges.length === 0)
			{
				return;
			}

			this.updateSlotRanges(this.resource.slotRanges);
		},
		updateSlotDataForAllRanges(inputSlotRanges: SlotRange[]): SlotRange[]
		{
			const slotRanges = inputSlotRanges || this.resource.slotRanges;

			return slotRanges.map((slotRange: SlotRange) => {
				return {
					...slotRange,
					slotSize: normalizeSlotLength(this.selectedSlotLength, this.isMultidayFeatureEnabled),
					timezone: this.timezone,
				};
			});
		},
		updateGlobalSchedule(checked: boolean): void
		{
			this.setGlobalSchedule(checked);
		},
		async fetchData(): void
		{
			await resourceCreationWizardService.fetchData();

			if (!this.isEditForm)
			{
				this.updateSlotRanges(this.companyScheduleSlots);
			}
		},
		getInitialSlotTimeZone(): string
		{
			const slotRanges = this.isEditForm ? this.resource.slotRanges : this.companyScheduleSlots;

			return slotRanges[0]?.timezone;
		},
	},
	template: `
		<div class="resource-settings-card">
			<BaseFields
				data-id="brcw-resource-settings-base"
				:initialResourceName="resourceName"
				:initialResourceType="resourceType"
				:initialResourceDescription="resourceDescription"
				:initialResourceAvatarUrl="resourceAvatarUrl"
				@nameUpdate="updateResourceName"
				@typeUpdate="updateResourceType"
				@descriptionUpdate="updateResourceDescription"
				@avatarFileUpdate="updateResourceAvatarFile"
			/>
			<ServicesSkus/>
			<ScheduleTypes
				data-id="brcw-resource-settings-schedule-types"
				v-model="isMain"
			/>
			<Integration/>
			<WorkTime
				data-id="brcw-resource-settings-work-time"
				:initialSlotRanges="slotRanges"
				:defaultSlotRange="defaultSlotRange"
				:isGlobalSchedule="isGlobalSchedule"
				:initialTimezone="initialTimezone"
				:currentTimezone="timezone"
				:isCompanyScheduleAccess="isCompanyScheduleAccess"
				:companyScheduleUrl="companyScheduleUrl"
				@update="updateSlotRanges"
				@updateGlobalSchedule="updateGlobalSchedule"
				@getGlobalSchedule="fetchData"
			/>
			<SlotLength
				data-id="brcw-resource-settings-slot-length"
				:initialSelectedValue="slotSize"
				@select="updateSlotLength"
			/>
		</div>
	`,
};

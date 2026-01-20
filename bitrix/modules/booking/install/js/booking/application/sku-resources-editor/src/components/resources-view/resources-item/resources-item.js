import { Model } from 'booking.const';

import { BaseItem } from '../../base/base-item/base-item';
import { ResourcesSkuSelector } from './resources-sku-selector';

import type { ResourceModel, Skus } from 'booking.model.resources';

import './resources-item.css';

// @vue/component
export const ResourcesItem = {
	name: 'ResourcesItem',
	components: {
		BaseItem,
		ResourcesSkuSelector,
	},
	props: {
		resourceId: {
			type: Number,
			required: true,
		},
		selected: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['update:selected', 'afterRemove'],
	computed: {
		resource(): ResourceModel
		{
			return this.$store.state[Model.SkuResourcesEditor].resources.get(this.resourceId);
		},
		resourcesSkusMap(): Map<number, Set<number>>
		{
			return this.$store.state[Model.SkuResourcesEditor].resourcesSkusMap;
		},
		avatar(): string
		{
			return this.resource.avatar?.url || '';
		},
		skusIds(): number[]
		{
			return [...(this.resourcesSkusMap.get(this.resource.id) || [])];
		},
		invalid(): boolean
		{
			return this.$store.state[Model.SkuResourcesEditor].invalidResource
				&& this.skusIds.length === 0;
		},
	},
	watch: {
		invalid: {
			handler(invalid: boolean)
			{
				if (invalid)
				{
					this.scrollToInvalid();
				}
			},
			immediate: true,
		},
	},
	methods: {
		scrollToInvalid(): void
		{
			void this.$nextTick(() => {
				this.$refs.resource?.$el?.scrollIntoView(true, { behavior: 'smooth', block: 'center' });
			});
		},
		removeResource(resourceId: number): void
		{
			void this.$store.dispatch(`${Model.SkuResourcesEditor}/deleteResource`, resourceId);

			this.$emit('afterRemove', resourceId);
		},
		addSku({ resourceId, sku }: { resourceId: number, sku: Skus }): void
		{
			void this.$store.dispatch(`${Model.SkuResourcesEditor}/addSkuToResource`, {
				resourceId,
				sku,
			});
		},
		removeSku({ resourceId, skuId }: { resourceId: number, skuId: number }): void
		{
			void this.$store.dispatch(`${Model.SkuResourcesEditor}/deleteSkuFromResource`, {
				resourceId,
				skuId,
			});
		},
	},
	template: `
		<BaseItem
			ref="resource"
			:selected
			:name="resource.name"
			hasAvatar
			:avatar
			:label="loc('BOOKING_SRE_RESOURCE_SKUS_LABEL')"
			:dataId="resource.id"
			:invalid
			:invalidMessage="loc('BOOKING_SRE_SKUS_FOR_RESOURCE_NOT_SELECTED')"
			@update:selected="$emit('update:selected', resource.id)"
			@remove="removeResource(resource.id)"
		>
			<ResourcesSkuSelector
				:resourceId="resource.id"
				:selectedSkusIds="skusIds"
				@add="addSku"
				@remove="removeSku"
			/>
		</BaseItem>
	`,
};

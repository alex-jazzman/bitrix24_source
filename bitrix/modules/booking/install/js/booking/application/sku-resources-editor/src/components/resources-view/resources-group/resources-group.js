import { mapGetters } from 'ui.vue3.vuex';
import { BIcon, Outline } from 'ui.icon-set.api.vue';

import { Model } from 'booking.const';

import './resources-group.css';

// @vue/component
export const ResourcesGroup = {
	name: 'ResourcesGroup',
	components: {
		BIcon,
	},
	props: {
		selected: {
			type: Set,
			required: true,
		},
		typeId: {
			type: Number,
			required: true,
		},
		/** @type{number[]} */
		resourcesIds: {
			type: Array,
			default: () => [],
		},
	},
	emits: ['selectGroup'],
	// eslint-disable-next-line flowtype/require-return-type
	setup()
	{
		return {
			Outline,
		};
	},
	data(): { collapsed: boolean }
	{
		return {
			collapsed: false,
		};
	},
	computed: {
		...mapGetters({
			getResourceTypeById: `${Model.ResourceTypes}/getById`,
		}),
		groupName(): string
		{
			return this.getResourceTypeById(this.typeId)?.name || '';
		},
		isChecked: {
			get(): boolean
			{
				return this.resourcesIds.every((id) => this.selected.has(id));
			},
			set(): void
			{
				this.$emit('selectGroup', {
					checked: !this.isChecked,
					resourcesIds: this.resourcesIds,
				});
			},
		},
		collapseLabel(): string
		{
			return this.collapsed
				? this.loc('BOOKING_SRE_RESOURCES_GROUP_EXPAND')
				: this.loc('BOOKING_SRE_RESOURCES_GROUP_COLLAPSE');
		},
	},
	template: `
		<div class="booking-sre-app__resources-group">
			<div class="booking-sre-app__resources-group-header">
				<div class="booking-sre-app__resources-group-header-title">
					<div class="ui-form-row-inline">
						<label class="ui-ctl ui-ctl-checkbox">
							<input
								v-model="isChecked"
								:id="'booking-sre-resource-group-checkbox' + typeId"
								:data-id="'booking-sre-resource-group-checkbox' + typeId"
								type="checkbox"
								class="ui-ctl-element ui-ctl-checkbox booking-services-settings-popup__base-item__checkbox"
							/>
						</label>
					</div>
					<span class="booking-sre-app__resources_group-header--title">{{ groupName }}</span>
				</div>
				<div class="booking-sre-app__resources-group-header-actions">
					<div
						class="booking-sre-app__resources_group-header--collapse"
						@click="collapsed = !collapsed"
					>
						<span class="booking-sre-app__resources_group-header--collapse-label">{{ collapseLabel }}</span>
						<BIcon
							class="booking-sre-app__resources_group-header--collapse-icon"
							:class="{ '--expand': collapsed }"
							:name="Outline.CHEVRON_TOP_L"
							:size="18"
							color="var(--ui-color-base-70)"
						/>
					</div>
				</div>
			</div>
			<Transition name="collapse">
				<div
					v-show="!collapsed"
					class="booking-sre-app__resources-group-content"
					:class="{ '--collapsed': collapsed }"
				>
					<slot :resourcesIds="resourcesIds"/>
				</div>
			</Transition>
		</div>
	`,
};

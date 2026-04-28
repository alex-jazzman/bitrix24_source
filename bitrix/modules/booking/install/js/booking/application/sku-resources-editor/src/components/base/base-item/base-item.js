import { BIcon, Outline } from 'ui.icon-set.api.vue';

import { Avatar as UiAvatar } from 'booking.component.avatar';
import { Model } from 'booking.const';

import type { SkuResourcesEditorOptions } from 'booking.model.sku-resources-editor';

import './base-item.css';

// @vue/component
export const BaseItem = {
	name: 'BaseItem',
	components: {
		BIcon,
		UiAvatar,
	},
	props: {
		selected: {
			type: Boolean,
			default: false,
		},
		label: {
			type: String,
			required: true,
		},
		name: {
			type: String,
			required: true,
		},
		hasAvatar: {
			type: Boolean,
			default: false,
		},
		avatar: {
			type: String,
			default: '',
		},
		invalid: {
			type: Boolean,
			default: false,
		},
		invalidMessage: {
			type: String,
			default: '',
		},
		dataId: {
			type: [String, Number],
			default: '',
		},
	},
	emits: ['update:selected', 'remove'],
	setup(): { Outline: typeof Outline}
	{
		return {
			Outline,
		};
	},
	computed: {
		isChecked: {
			get(): boolean
			{
				return this.selected;
			},
			set(checked: boolean): void
			{
				this.$emit('update:selected', checked);
			},
		},
		skusResourcesEditorOptions(): SkuResourcesEditorOptions
		{
			return this.$store.state[Model.SkuResourcesEditor].options;
		},
	},
	template: `
		<div class="booking-services-settings-popup__base-item">
			<div class="booking-services-settings-popup__base-item__header">
				<div class="ui-form-row-inline">
					<label class="ui-ctl ui-ctl-checkbox">
						<input
							v-model="isChecked"
							:id="'booking-services-settings-checkbox' + dataId"
							:data-id="'booking-services-settings-checkbox' + dataId"
							type="checkbox"
							class="ui-ctl-element ui-ctl-checkbox booking-services-settings-popup__base-item__checkbox"
						/>
					</label>
				</div>
				<UiAvatar
					v-if="hasAvatar"
					:size="32"
					:userName="name"
					:userpicPath="avatar"
					baseColor="#B15EF5"
					class="booking-services-settings-popup__base-item__avatar"
				/>
				<h6 class="booking-services-settings-popup__base-item__title">{{ name }}</h6>
				<slot name="header"/>
				<BIcon
					v-if="skusResourcesEditorOptions.editMode"
					class="booking-sre-app__base-item__close-icon"
					:name="Outline.CROSS_L"
					:size="18"
					color="var(--ui-color-text-secondary)"
					@click="$emit('remove')"
				/>
			</div>
			<div class="booking-services-settings-popup__base-item__content" :class="{ '--invalid': invalid }">
				<label class="booking-services-settings-popup__base-item__text-on-frame booking-services-settings-popup__base-item__label">
					{{ label }}
				</label>
				<slot/>
				<span
					v-if="invalid"
					class="booking-services-settings-popup__base-item__text-on-frame booking-services-settings-popup__base-item__error-msg"
				>
					{{ invalidMessage }}
				</span>
			</div>
		</div>
	`,
};

import { BIcon } from 'ui.icon-set.api.vue';
import { Outline, Main } from 'ui.icon-set.api.core';
import { UpdateItemPropertyEventPayload } from '../../types';

import './title-field.css';
// eslint-disable-next-line no-unused-vars
import type { TitleItem } from '../../types';

// @vue/component
export const TitleField = {
	name: 'TitleField',
	components: {
		BIcon,
	},
	props: {
		/** @type TitleItem */
		item: {
			type: Object,
			required: true,
		},
	},
	emits: ['updateItemProperty', 'delete'],
	setup(): { [string]: string }
	{
		return {
			Outline,
			Main,
		};
	},
	methods: {
		onInput(event: Event): void
		{
			const payload: UpdateItemPropertyEventPayload = {
				propertyValues: {
					text: event.target.value,
				},
			};
			this.$emit('updateItemProperty', payload);
		},
		handleDragStart(event: Event): void
		{
			this.$emit('itemDragStart', {
				event,
				element: this.$el,
			});
		},
	},
	template: `
		<div class="bizproc-setuptemplateactivity-field-wrapper">
			<div
				class="bizproc-setuptemplateactivity-field-drag-icon"
				@mousedown.prevent="handleDragStart"
			>
				<BIcon :name="Main.MORE_POINTS" :size="18"/>
			</div>
			<div class="bizproc-setuptemplateactivity-title-field">
				<div class="ui-ctl-container">
					<div class="ui-ctl-top">
						<div class="ui-ctl-title bizproc-setuptemplateactivity-title-field__label">
							{{ $Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_TITLE_ITEM_LABEL') }}
						</div>
					</div>
					<div class="ui-ctl ui-ctl-w100">
						<input
							:value="item.text"
							class="ui-ctl-element"
							type="text"
							@input="onInput"
						/>
					</div>
				</div>
				<div class="bizproc-setuptemplateactivity-title-field__controls">
					<BIcon
						:name="Outline.CROSS_L"
						:size="18"
						class="bizproc-setuptemplateactivity-title-field__delete-icon"
						@click="$emit('delete')"
					/>
				</div>
			</div>
		</div>
	`,
};

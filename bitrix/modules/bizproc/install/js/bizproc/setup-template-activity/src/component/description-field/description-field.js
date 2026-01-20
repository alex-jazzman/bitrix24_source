import { BIcon } from 'ui.icon-set.api.vue';
import { Outline, Main } from 'ui.icon-set.api.core';

import './description-field.css';

// eslint-disable-next-line no-unused-vars
import type { DescriptionItem, UpdateItemPropertyEventPayload } from '../../types';

// @vue/component
export const DescriptionField = {
	name: 'DescriptionField',
	components: {
		BIcon,
	},
	props: {
		/** @type DescriptionItem */
		item: {
			type: Object,
			required: true,
		},
	},
	emits: ['updateItemProperty'],
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
			<div class="bizproc-setuptemplateactivity-description-feild">
				<div class="ui-ctl-container">
					<div class="ui-ctl-top">
						<div class="ui-ctl-title bizproc-setuptemplateactivity-description-feild__label">
							{{ $Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_DESCRIPTION_ITEM_LABEL') }}
						</div>
					</div>
					<div class="ui-ctl ui-ctl-textarea ui-ctl-w100">
						<textarea
							:value="item.text"
							class="ui-ctl-element"
							rows="4"
							@input="onInput"
						/>
					</div>
				</div>
				<div class="bizproc-setuptemplateactivity-description-feild__controls">
					<BIcon
						:name="Outline.CROSS_L"
						:size="18"
						class="bizproc-setuptemplateactivity-description-feild__delete-icon"
						@click="$emit('delete')"
					/>
				</div>
			</div>
		</div>
	`,
};

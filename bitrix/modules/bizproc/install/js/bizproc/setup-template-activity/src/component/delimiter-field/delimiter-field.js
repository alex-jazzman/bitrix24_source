import { BIcon } from 'ui.icon-set.api.vue';
import { Outline, Main } from 'ui.icon-set.api.core';

import './delimiter-field.css';

// eslint-disable-next-line no-unused-vars
import type { DelimiterItem, UpdateItemPropertyEventPayload } from '../../types';

// @vue/component
export const DelimiterField = {
	name: 'DelimiterField',
	components: {
		BIcon,
	},
	props: {
		/** @type DelimiterItem */
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
		onSelect(event: Event): void
		{
			const payload: UpdateItemPropertyEventPayload = {
				propertyValues: {
					delimiterType: event.target.value,
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
			<div class="bizproc-setuptemplateactivity-delimiter-field">
				<div class="ui-ctl-container">
					<div class="ui-ctl-top">
						<div class="ui-ctl-title">
							{{ $Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_DELIMITER_ITEM_LABEL') }}
						</div>
					</div>
					<div class="ui-ctl ui-ctl-after-icon ui-ctl-dropdown ui-ctl-w100">
						<div class="ui-ctl-after ui-ctl-icon-angle"></div>
						<select
							:value="item.delimiterType"
							class="ui-ctl-element ui-ctl-w100"
							@change="onSelect"
						>
							<option value="line">
								{{ $Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_DELIMITER_ITEM_OPTION_LINE') }}
							</option>
						</select>
					</div>
				</div>
				<div class="bizproc-setuptemplateactivity-delimiter-field__controls">
					<BIcon
						:name="Outline.CROSS_L"
						:size="18"
						class="bizproc-setuptemplateactivity-delimiter-field__delete-icon"
						@click="$emit('delete')"
					/>
				</div>
			</div>
		</div>
	`,
};

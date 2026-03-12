// eslint-disable-next-line no-unused-vars
import { $Bitrix } from 'ui.vue3';
import { UpdateItemPropertyEventPayload } from '../../types';
// eslint-disable-next-line no-unused-vars
import type { DelimiterItem } from '../../types';

// @vue/component
export const DelimiterComponent = {
	name: 'DelimiterComponent',
	props: {
		/** @type DelimiterItem */
		item: {
			type: Object,
			required: true,
		},
	},
	emits: ['updateItemProperty'],
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
	},
	template: `
		<div>
			<div>
				{{ $Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_DELIMITER_ITEM_LABEL') }}
			</div>
			<div>
				<select :value="item.delimiterType" @change="onSelect">
					<option value="line">
						{{ $Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_DELIMITER_ITEM_OPTION_LINE') }}
					</option>
				</select>
			</div>
		</div>
	`,
};

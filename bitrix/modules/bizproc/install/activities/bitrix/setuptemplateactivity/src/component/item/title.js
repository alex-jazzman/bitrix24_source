// eslint-disable-next-line no-unused-vars
import { $Bitrix } from 'ui.vue3';
import { UpdateItemPropertyEventPayload } from '../../types';
// eslint-disable-next-line no-unused-vars
import type { TitleItem } from '../../types';

// @vue/component
export const TitleComponent = {
	name: 'TitleComponent',
	props: {
		/** @type TitleItem */
		item: {
			type: Object,
			required: true,
		},
	},
	emits: ['updateItemProperty'],
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
	},
	template: `
		<div>
			<div>
				{{ $Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_TITLE_ITEM_LABEL') }}
			</div>
			<div>
				<input type="text" :value="item.text" @input="onInput"/>
			</div>
		</div>
	`,
};

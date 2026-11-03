import { TextLg } from 'ui.system.typography.vue';

import 'ui.design-tokens.air';

import { ChatHint } from 'im.v2.component.elements.hint';

import './field-row.css';

// @vue/component
export const FieldRow = {
	name: 'FieldRow',
	components: { ChatHint, TextLg },
	props:
	{
		name: {
			type: String,
			required: true,
		},
		label: {
			type: String,
			default: '',
		},
		hint: {
			type: String,
			default: '',
		},
	},
	computed:
	{
		// The slotted control gets the ids through the slot scope: the row cannot put
		// attributes on markup it does not own.
		controlId(): string
		{
			return `im-chat-form-field-${this.name}`;
		},
		labelId(): string
		{
			return `${this.controlId}-label`;
		},
	},
	template: `
		<div class="bx-im-chat-forms-field-row" :data-testid="'field-' + name">
			<div v-if="label" class="bx-im-chat-forms-field-row__header">
				<TextLg
					tag="label"
					:id="labelId"
					:for="controlId"
					className="bx-im-chat-forms-field-row__label"
				>{{ label }}</TextLg>
				<ChatHint v-if="hint" :text="hint"/>
			</div>
			<slot :controlId="controlId" :labelId="labelId"/>
		</div>
	`,
};

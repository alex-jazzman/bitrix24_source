import { TextSm } from 'ui.system.typography.vue';
import { defineComponent } from 'ui.vue3';

import './message-field.css';

/**
 * One row of the letter card. The label and the value are a term and its definition, so the row stands as a
 * group of a description list and the reader gets the pair bound together instead of a flat run of text; the
 * list itself is opened by the owner of the rows.
 */
// @vue/component
export const MessageField = defineComponent({
	name: 'MailScheduledViewMessageField',
	components: { TextSm } as { TextSm: typeof TextSm },
	props: { label: { type: String, required: true } },
	template: `
		<div class="mail-scheduled-view-field">
			<TextSm tag="dt" class-name="mail-scheduled-view-field__label">{{ label }}</TextSm>
			<dd class="mail-scheduled-view-field__value"><slot/></dd>
		</div>
	`,
});

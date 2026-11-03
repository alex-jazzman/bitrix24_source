import { defineComponent, type PropType } from 'ui.vue3';

import { BindingKind } from '../../const';
import { type RowBinding } from '../../model/grid/types';

/**
 * A placeholder of the bindings: a node that carries values and nothing else.
 *
 * The subtree belongs to `mail.client.binding`, which reads the node by its attributes and replaces
 * it with a button of its own on every update of the grid, so it is drawn once and never touched
 * again. An attribute whose value is absent is not written at all: the extension tells a missing
 * attribute from an empty one.
 */
// @vue/component
export const BindingCell = defineComponent({
	name: 'MailMessageGridBindingCell',

	props: {
		binding: {
			type: Object as PropType<RowBinding>,
			required: true,
		},
		/** Composite identifier of the row, the one the extension calls `message-id`. */
		rowId: {
			type: String,
			required: true,
		},
		messageId: {
			type: Number,
			required: true,
		},
	},

	computed: {
		isAction(): boolean
		{
			return this.binding.kind === BindingKind.Action;
		},

		nodeClass(): string[]
		{
			return this.isAction
				? ['mail-ui-action-data']
				: ['mail-ui-binding-data', `js-bind-${this.messageId}`]
			;
		},

		attributes(): Record<string, string>
		{
			const attrs: Record<string, string> = {
				'message-id': this.rowId,
				'message-simple-id': String(this.messageId),
			};

			if (this.binding.errorType !== null)
			{
				attrs['error-type'] = this.binding.errorType;
			}

			if (this.isAction)
			{
				attrs['action-type'] = BindingKind.Action;
				if (this.binding.actionId !== null)
				{
					attrs['action-id'] = this.binding.actionId;
				}

				return attrs;
			}

			if (this.binding.bindId !== null)
			{
				attrs['bind-id'] = this.binding.bindId;
			}

			if (this.binding.bindHref !== null)
			{
				attrs['bind-href'] = this.binding.bindHref;
			}

			if (this.binding.createHref !== null)
			{
				attrs['create-href'] = this.binding.createHref;
			}

			if (this.binding.type !== null)
			{
				attrs['bind-type'] = this.binding.type;
			}

			return attrs;
		},
	},

	template: `
		<span v-once :class="nodeClass" v-bind="attributes"></span>
	`,
});

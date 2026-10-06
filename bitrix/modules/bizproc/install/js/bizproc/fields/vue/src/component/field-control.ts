import { Dom, Type } from 'main.core';
import { defineComponent, markRaw, toRaw, type PropType } from 'ui.vue3';
import { FieldManager, initFieldHints } from 'bizproc.fields';
import type { RenderFieldParams } from 'bizproc.fields';

/**
 * Whether the model already says what the field holds. Guards the two-way binding: the value the
 * control just announced comes straight back through the prop, and writing it in again would
 * reset a caret or a selection for nothing.
 */
function isSameValue(left: string | string[] | null, right: string | string[] | null): boolean
{
	if (Type.isArray<string>(left) && Type.isArray<string>(right))
	{
		return left.length === right.length && left.every((item, index) => item === right[index]);
	}

	return left === right;
}

export const FieldControl = defineComponent({
	name: 'BizprocFieldsFieldControl',

	/** Channel of the form component: one manager provided once, every field control picks it up. */
	inject: {
		injectedManager: {
			from: 'bizprocFieldManager',
			default: null,
		},
	},

	props: {
		params: {
			type: Object as PropType<RenderFieldParams>,
			required: true,
		},
		modelValue: {
			type: [String, Array] as PropType<string | string[] | null>,
			default: null,
		},
		/** Channel of a caller placing a single control: the manager it already owns. */
		fieldManager: {
			type: Object as PropType<FieldManager | null>,
			default: null,
		},
	},

	emits: ['update:modelValue'],

	data(): { manager: FieldManager, ownsManager: boolean, fieldId: string | null, renderedType: string | null }
	{
		// A manager batches the backend render of the fields it holds into one request, so a
		// form hands the same one to all of its controls; a lone control falls back to its own.
		// The double assertion is the Options API inject typing: what a provider supplies is
		// opaque to the component, so the injected value arrives untyped.
		const shared = this.fieldManager ?? (this.injectedManager as unknown as FieldManager | null);

		return {
			// toRaw before markRaw: a manager arriving from outside may already sit behind a
			// reactive proxy, through which its private #fields are unreachable.
			manager: markRaw(Type.isNull(shared) ? new FieldManager() : toRaw(shared)),
			// Ownership is settled here, while the answer is known: by beforeUnmount neither the
			// prop nor the injection is guaranteed to still hold the manager the control took.
			ownsManager: Type.isNull(shared),
			fieldId: null,
			renderedType: null,
		};
	},

	watch: {
		modelValue(value: string | string[] | null): void
		{
			if (Type.isNull(this.fieldId))
			{
				return;
			}

			// Skipped when the model merely echoes what the field just announced, so a controlled
			// binding does not write the value back over the control on every change it hears.
			if (isSameValue(this.manager.getFieldValue(this.fieldId), value))
			{
				return;
			}

			this.manager.setFieldValue(this.fieldId, value ?? '');
		},

		params: {
			deep: true,
			handler(value: RenderFieldParams): void
			{
				if (Type.isNull(this.fieldId))
				{
					return;
				}

				// Another type is another field, and the manager says so by handing the old node
				// back unchanged - only a same-type change is a property the field can take on.
				if (value.property.Type === this.renderedType)
				{
					this.manager.applyProperty(this.fieldId, value.property);

					return;
				}

				this.remountField();
			},
		},
	},

	mounted(): void
	{
		this.mountField();
	},

	beforeUnmount(): void
	{
		// A manager the control built for itself has no life past this point, and only destroy()
		// cancels the backend render it may still have queued. A manager passed in or injected
		// belongs to the form, so from it the control takes back its own field and nothing else:
		// destroying it would take the sibling fields down.
		if (this.ownsManager)
		{
			this.manager.destroy();

			return;
		}

		if (!Type.isNull(this.fieldId))
		{
			this.manager.releaseField(this.fieldId);
		}
	},

	methods: {
		mountField(): void
		{
			const rendered = this.manager.renderField({
				...this.params,
				value: this.modelValue ?? undefined,
			});

			this.fieldId = rendered.fieldId;
			this.renderedType = this.params.property.Type;

			const container = this.$refs.container as HTMLElement;
			Dom.append(rendered.node, container);

			initFieldHints(container);
		},

		/** Draws the field anew where the property changed into another type - see the params watcher. */
		remountField(): void
		{
			if (!Type.isNull(this.fieldId))
			{
				this.manager.releaseField(this.fieldId);
			}

			Dom.clean(this.$refs.container as HTMLElement);
			this.mountField();
		},

		handleChange(): void
		{
			// By id, not by name: a shared manager may hold several fields under this name, and
			// reading by name would answer with the first of them.
			if (Type.isNull(this.fieldId))
			{
				return;
			}

			const value = this.manager.getFieldValue(this.fieldId);

			// Null is not a value here but the manager saying it holds no instance for this id -
			// a field the registry does not know, rendered by the backend. Its markup still emits
			// change, and passing that null on would wipe the model the caller handed in.
			if (Type.isNull(value))
			{
				return;
			}

			this.$emit('update:modelValue', value);
		},
	},

	template: `
		<div
			ref="container"
			class="bizproc-fields-vue-field-control"
			data-testid="bizproc-field-vue-control"
			@change="handleChange"
		></div>
	`,
});

import { Type } from 'main.core';

// The first control of a row is the one that takes focus after a row is added or removed.
const FOCUSABLE_SELECTOR = 'input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Rows of a multiple constant: a list always has a row to fill in, and a single value stored
 * before the constant became multiple is its first row.
 */
export function toMultipleValues(model: mixed): Array<string>
{
	if (Type.isArray(model))
	{
		return model.length > 0 ? model : [''];
	}

	return [Type.isString(model) ? model : ''];
}

/**
 * List of values of a multiple constant: rows, the remove icon and the add button.
 * The row control itself comes from the `control` slot, so a field of any type
 * keeps its own markup and its own value format.
 */
// @vue/component
export const MultipleConstantField = {
	name: 'MultipleConstantField',
	props: {
		modelValue: {
			type: [String, Array],
			default: '',
		},
		testIdPrefix: {
			type: String,
			required: true,
		},
	},
	emits: ['update:modelValue'],
	data(): Object
	{
		return {
			fieldKeys: [],
		};
	},
	computed: {
		values(): Array<string>
		{
			return toMultipleValues(this.modelValue);
		},
		showRemoveIcon(): boolean
		{
			return this.values.length > 1;
		},
	},
	watch: {
		values(): void
		{
			this.syncFieldKeys();
		},
	},
	created(): void
	{
		this.lastFieldKey = 0;
		this.syncFieldKeys();
	},
	methods: {
		/**
		 * Row controls keep their own state, so a row is identified by a key of its own:
		 * with the index as a key the state of the removed row would stay on the next one.
		 */
		createFieldKey(): number
		{
			this.lastFieldKey += 1;

			return this.lastFieldKey;
		},
		syncFieldKeys(): void
		{
			while (this.fieldKeys.length < this.values.length)
			{
				this.fieldKeys.push(this.createFieldKey());
			}

			this.fieldKeys.splice(this.values.length);
		},
		updateValueAtIndex(index: number, newValue: string): void
		{
			const newValues = [...this.values];
			newValues[index] = newValue;

			this.$emit('update:modelValue', newValues);
		},
		async addField(): void
		{
			const addedIndex = this.values.length;
			this.fieldKeys.push(this.createFieldKey());
			this.$emit('update:modelValue', [...this.values, '']);

			await this.$nextTick();
			this.focusFieldAt(addedIndex);
		},
		async removeField(index: number): void
		{
			if (!this.showRemoveIcon)
			{
				return;
			}

			const newValues = [...this.values];
			newValues.splice(index, 1);
			this.fieldKeys.splice(index, 1);
			this.$emit('update:modelValue', newValues);

			await this.$nextTick();
			this.focusFieldAt(Math.max(0, index - 1));
		},
		focusFieldAt(index: number): void
		{
			const rows = this.$refs.fieldRows ?? [];
			rows[index]?.querySelector(FOCUSABLE_SELECTOR)?.focus();
		},
	},
	template: `
		<div
			class="bizproc-setup-template__multiple-wrapper"
			:data-test-id="testIdPrefix + '-list'"
		>
			<div
				v-for="(value, index) in values"
				:key="fieldKeys[index]"
				ref="fieldRows"
				class="bizproc-setup-template__field-item"
				:data-test-id="testIdPrefix + '-item-' + index"
			>
				<slot
					name="control"
					:value="value"
					:rowKey="fieldKeys[index]"
					:update="(newValue) => updateValueAtIndex(index, newValue)"
				/>
				<span
					v-if="showRemoveIcon"
					role="button"
					tabindex="0"
					@click="removeField(index)"
					@keydown.enter.prevent="!$event.repeat && removeField(index)"
					@keydown.space.prevent="!$event.repeat && removeField(index)"
					:aria-label="$Bitrix.Loc.getMessage('BIZPROC_JS_AI_AGENTS_ACTIVATOR_FORM_REMOVE_FIELD')"
					:data-test-id="testIdPrefix + '-delete-btn'"
					class="bizproc-setup-template__field-remove"
				><i class="ui-icon-set --cross-m"></i></span>
			</div>
			<button
				@click="addField"
				class="bizproc-setup-template__add-btn"
				type="button"
				:data-test-id="testIdPrefix + '-add-btn'"
			>
				{{ $Bitrix.Loc.getMessage('BIZPROC_JS_AI_AGENTS_ACTIVATOR_FORM_ADD_FIELD') }}
			</button>
		</div>
	`,
};

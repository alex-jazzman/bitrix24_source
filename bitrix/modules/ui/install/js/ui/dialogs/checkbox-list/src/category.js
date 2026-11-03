import { Text, Type } from 'main.core';

import { CheckboxListOption } from './option';

export const CheckboxListCategory = {
	props: [
		'columnCount',
		'category',
		'options',
		'context',
		'isActiveSearch',
		'isEditableOptionsTitle',
		'onChange',
		'setOptionRef',
	],

	emits: [
		'onToggleOption',
		'onEditModeChange',
	],

	components: {
		CheckboxListOption,
	},

	setup(): Object
	{
		return {
			titleId: `ui-checkbox-list-category-${Text.getRandom().toLowerCase()}`,
		};
	},

	computed: {
		// A group role without a name is worse than no role at all, so both the role and the
		// association appear only when the category actually renders a non-empty title.
		hasTitle(): boolean
		{
			return Type.isStringFilled(this.category?.title);
		},
	},

	methods: {
		setRef(ref)
		{
			if (ref)
			{
				this.setOptionRef(ref.getId(), ref);
			}
		},
		onToggleOption(event)
		{
			this.$emit('onToggleOption', event);
		},
		// byKey travels with the event: the dialog hands the closing by Escape back at once when a
		// mouse ended the edit, and waits for a keyup when a key did. Dropping it here made every
		// exit look like one made by mouse.
		onEditModeChange(isEditing: boolean, byKey: boolean = false)
		{
			this.$emit('onEditModeChange', isEditing, byKey);
		},
	},

	template: `
		<div
			v-if="options.length > 0 || !isActiveSearch"
			class="ui-checkbox-list__category"
		>
			<div v-if="category" :id="titleId" class="ui-checkbox-list__categories-title">
				{{ category.title }}
			</div>
			<div
				class="ui-checkbox-list__options"
				:role="hasTitle ? 'group' : null"
				:aria-labelledby="hasTitle ? titleId : null"
				:style="{ 'column-count': columnCount }"
			>
				<div
					v-for="option in options"
					:key="option.id"
				>
					<checkbox-list-option
						:context="context"
						:id="option.id"
						:title="option.title ?? option.id"
						:isChecked="option.value"
						:isLocked="option?.locked"
						:isEditable="isEditableOptionsTitle"
						:ref="setRef"
						@onToggleOption="onToggleOption"
						@onEditModeChange="onEditModeChange"
					/>
				</div>
			</div>
		</div>
	`,
};

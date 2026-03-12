// eslint-disable-next-line no-unused-vars
import { $Bitrix } from 'ui.vue3';
import { UpdateItemPropertyEventPayload } from '../../types';
// eslint-disable-next-line no-unused-vars
import type { ConstantItem } from '../../types';
import { ConstantEditComponent } from './constant-edit';

// @vue/component
export const ConstantComponent = {
	name: 'ConstantComponent',
	components: { ConstantEditComponent },
	props: {
		/** @type ConstantItem */
		item: {
			type: Object,
			required: true,
		},
		/** Record<string, string> */
		fieldTypeNames: {
			type: Object,
			required: true,
		},
	},
	emits: ['updateItemProperty', 'cancelItem'],
	data(): { editMode: boolean }
	{
		return {
			editMode: this.item.name === '',
		};
	},
	computed: {
		typeLabel(): string
		{
			return this.fieldTypeNames[this.item.constantType]
				?? this.$Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_ITEM_TYPE_UNSUPPORTED')
			;
		},
		titleWithType(): string
		{
			return this.$Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_ITEM_TITLE', {
				'#NAME#': this.item.name,
				'#TYPE#': this.typeLabel,
			});
		},
	},
	methods: {
		onInput(event: Event): void
		{
			const payload: UpdateItemPropertyEventPayload = {
				propertyValues: {
					default: event.target.value,
				},
			};
			this.$emit('updateItemProperty', payload);
		},
		onEdit(): void
		{
			this.editMode = true;
		},
		onEditCancel(): void
		{
			this.editMode = false;
			if (this.item.name === '')
			{
				this.$emit('cancelItem');
			}
		},
		onEditUpdate(payload: UpdateItemPropertyEventPayload): void
		{
			this.editMode = false;
			this.$emit('updateItemProperty', payload);
		},
	},
	template: `
		<div>
			<div v-if="!editMode">
				<div>
					{{ titleWithType }}
				</div>
				<div>
					<input type="text" :value="item.default" @input="onInput">
				</div>
				<button type="button" @click="onEdit">
					{{ $Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_EDIT') }}
				</button>
			</div>
			<ConstantEditComponent
				v-if="editMode"
				:item="item"
			 	:fieldTypeNames="fieldTypeNames"
				@cancel="onEditCancel"
				@update="onEditUpdate"
			/>
		</div>
	`,
};

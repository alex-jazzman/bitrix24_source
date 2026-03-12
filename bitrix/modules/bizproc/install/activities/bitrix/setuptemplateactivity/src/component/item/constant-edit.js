// eslint-disable-next-line no-unused-vars
import { $Bitrix } from 'ui.vue3';
import { UpdateItemPropertyEventPayload } from '../../types';
// eslint-disable-next-line no-unused-vars
import type { ConstantItem } from '../../types';
import { CONSTANT_TYPES } from '../../constants';

// @vue/component
export const ConstantEditComponent = {
	name: 'ConstantEditComponent',
	props: {
		/** @type ConstantItem */
		item: {
			type: Object,
			required: false,
			default: null,
		},
		/** Record<string, string> */
		fieldTypeNames: {
			type: Object,
			required: true,
		},
	},
	emits: ['update', 'cancel'],
	data(): { type: string, name: string, multiple: boolean, required: boolean, highlighted: Array<string> }
	{
		return {
			type: this.item?.constantType ?? CONSTANT_TYPES.STRING,
			name: this.item?.name ?? '',
			multiple: this.item?.multiple ?? false,
			required: this.item?.required ?? false,
			nameInvalid: false,
		};
	},
	watch: {
		name(value: string): void
		{
			if (value !== '')
			{
				this.nameInvalid = false;
			}
		},
	},
	methods:
	{
		onOk(): void
		{
			if (this.name === '')
			{
				this.nameInvalid = true;

				return;
			}
			this.nameInvalid = false;

			const payload: UpdateItemPropertyEventPayload = {
				propertyValues: {
					constantType: this.type,
					name: this.name,
					multiple: this.multiple,
					required: this.required,
				},
			};

			this.$emit('update', payload);
		},
		onCancel(): void
		{
			this.$emit('cancel');
		},
	},
	template: `
		<div>
			<div>
				{{ $Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_EDIT_HEADING') }}
			</div>

			<div>
				<label>
					{{ $Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_EDIT_NAME_LABEL') }}
					<br>
					<input v-model.trim="name" type="text" :class="{'has-error': this.nameInvalid }"/>
				</label>
			</div>

			<div>
				<label>
					{{ $Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_EDIT_TYPE_LABEL') }}
					<br>
					<select v-model="type">
						<option v-for="(typeName, typeKey) in fieldTypeNames" :value="typeKey" :key="typeKey">
							{{ typeName }}
						</option>
					</select>
				</label>
			</div>

			<div>
				<label>
					<input v-model="multiple" type="checkbox"/>
					{{ $Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_EDIT_MULTIPLE_LABEL') }}
	
				</label>
			</div>

			<div>
				<label>
					<input v-model="required" type="checkbox"/>
					{{ $Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_EDIT_REQUIRED_LABEL') }}
				</label>
			</div>
	
			<div>
				<button type="button" @click="onOk">
					{{ $Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_EDIT_OK') }}
				</button>

				<button type="button" @click="onCancel">
					{{ $Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_EDIT_CANCEL') }}
				</button>
			</div>
		</div>
	`,
};

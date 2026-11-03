import { defineComponent } from 'ui.vue3';
import { Vue as RadioButtonVue } from 'ui.system.radiobutton';
import { TextSm } from 'ui.system.typography.vue';

import { getMainToolImageUrl, getMainToolPresentation } from '../../model/picker/presentation';
import type { MainToolPresentation } from '../../model/picker/presentation';

export const ToolTile = defineComponent({
	name: 'IntranetMainToolTile',
	components: { RadioButton: RadioButtonVue.RadioButton, TextSm },
	props: {
		presetId: { type: String, required: true },
		group: { type: String, required: true },
		selected: { type: Boolean, default: false },
		disabled: { type: Boolean, default: false },
		muted: { type: Boolean, default: false },
	},
	emits: ['select', 'imageError'],
	setup()
	{
		return { checkImage: getMainToolImageUrl('check.svg') };
	},
	computed: {
		inputId(): string
		{
			return `${this.group}-${this.presetId}`;
		},
		captionId(): string
		{
			return `${this.inputId}-caption`;
		},
		presentation(): MainToolPresentation
		{
			return getMainToolPresentation(this.presetId);
		},
	},
	methods: {
		handleChecked(checked: boolean): void
		{
			if (checked && !this.disabled)
			{
				this.$emit('select', this.presetId);
			}
		},
	},
	template: `
		<div
			class="intranet-main-tool-tile"
			:class="{ '--selected': selected, '--disabled': disabled, '--muted': muted }"
			:data-testid="'intranet-main-tool-picker-tile-' + presetId"
		>
			<RadioButton
				:id="inputId"
				:group="group"
				:value="presetId"
				:aria-labelledby="captionId"
				:modelValue="selected"
				:disabled="disabled"
				:data-testid="'intranet-main-tool-picker-radio-' + presetId"
				@update:modelValue="handleChecked"
			/>
			<img
				v-if="presentation.tile"
				class="intranet-main-tool-tile__image"
				:src="presentation.tile"
				width="78"
				height="78"
				alt=""
				draggable="false"
				@error="$emit('imageError', $event)"
			/>
			<TextSm :id="captionId" class="intranet-main-tool-tile__caption" accent>
				{{ loc(presentation.label) }}
			</TextSm>
			<div v-show="selected" class="intranet-main-tool-tile__check" aria-hidden="true">
				<img :src="checkImage" width="16" height="16" alt="" draggable="false" @error="$emit('imageError', $event)"/>
			</div>
		</div>
	`,
});

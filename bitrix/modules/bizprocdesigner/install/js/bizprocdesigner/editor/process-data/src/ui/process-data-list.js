import { Loc, Type } from 'main.core';
import { defineComponent } from 'ui.vue3';

import { elementId, type ProcessDataElement } from 'bizprocdesigner.editor.chart';

import { typeLabel } from '../labels';

export type ProcessDataGroup = {
	id: string;
	title: string;
	hint: string;
	items: ProcessDataElement[];
};

export const ProcessDataList = defineComponent({
	name: 'BizprocDesignerProcessDataList',
	props: {
		groups: {
			type: Array,
			default: (): ProcessDataGroup[] => [],
		},
		selectedId: {
			type: String,
			default: null,
		},
	},
	emits: ['select'],
	computed: {
		acceptsStartValueText(): string
		{
			return Loc.getMessage('BIZPROCDESIGNER_EDITOR_PROCESS_DATA_ACCEPTS_START_VALUE') ?? '';
		},
	},
	methods: {
		itemId(item: ProcessDataElement): string
		{
			return elementId(item.sourceType, item.key);
		},
		typeLabel,
		// An element may reach the list without a name: the identifier is what its author sees elsewhere.
		elementName(item: ProcessDataElement): string
		{
			return Type.isStringFilled(item.property?.Name) ? item.property.Name : item.key;
		},
		handleSelect(item: ProcessDataElement): void
		{
			this.$emit('select', item);
		},
	},
	template: `
		<div class="bizprocdesigner-process-data-list" data-testid="bizprocdesigner-process-data-list">
			<section
				v-for="group in groups"
				:key="group.id"
				class="bizprocdesigner-process-data-list__group"
				:data-testid="'bizprocdesigner-process-data-group-' + group.id"
			>
				<h3 class="bizprocdesigner-process-data-list__group-title">{{ group.title }}</h3>
				<p
					v-if="group.items.length === 0"
					class="bizprocdesigner-process-data-list__group-hint"
					:data-testid="'bizprocdesigner-process-data-group-hint-' + group.id"
				>
					{{ group.hint }}
				</p>
				<ul v-else class="bizprocdesigner-process-data-list__items">
					<li v-for="item in group.items" :key="itemId(item)">
						<button
							type="button"
							class="bizprocdesigner-process-data-item"
							:class="{ '--selected': itemId(item) === selectedId }"
							:aria-current="itemId(item) === selectedId ? 'true' : null"
							:data-testid="'bizprocdesigner-process-data-item-' + itemId(item)"
							@click="handleSelect(item)"
						>
							<span class="bizprocdesigner-process-data-item__main">
								<span class="bizprocdesigner-process-data-item__name">{{ elementName(item) }}</span>
								<span class="bizprocdesigner-process-data-item__type">{{ typeLabel(item.property.Type) }}</span>
							</span>
							<span
								v-if="item.acceptsStartValue || item.visibilityName"
								class="bizprocdesigner-process-data-item__meta"
							>
								<span
									v-if="item.acceptsStartValue"
									:data-testid="'bizprocdesigner-process-data-item-start-value-' + itemId(item)"
								>
									{{ acceptsStartValueText }}
								</span>
								<span
									v-if="item.visibilityName"
									:data-testid="'bizprocdesigner-process-data-item-visibility-' + itemId(item)"
								>
									{{ item.visibilityName }}
								</span>
							</span>
						</button>
					</li>
				</ul>
			</section>
		</div>
	`,
});

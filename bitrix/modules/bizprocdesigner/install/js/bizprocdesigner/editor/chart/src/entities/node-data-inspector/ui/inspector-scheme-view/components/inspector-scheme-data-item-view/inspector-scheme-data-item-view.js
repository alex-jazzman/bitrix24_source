import { BIcon, Outline } from 'ui.icon-set.api.vue';
import { Loc } from 'main.core';
import { UI } from 'ui.notification';

import { InspectorValueCell } from '../../../inspector-value-cell/inspector-value-cell';

import './style.css';

// @vue/component
export const InspectorSchemeDataItemView = {
	name: 'InspectorSchemeDataItemView',
	components: {
		BIcon,
		InspectorValueCell,
	},
	props: {
		item: {
			/** @type InspectorViewItemData */
			type: Object,
			required: true,
		},
	},
	computed: {
		itemTitle(): string
		{
			return this.item.text;
		},
		dataType(): string
		{
			return this.item.dataType ?? '';
		},
		isClipboardCopyAvailable(): boolean
		{
			return BX.clipboard?.isCopySupported() ?? false;
		},
		Outline: (): typeof Outline => Outline,
	},
	methods: {
		onCopyClick(): void
		{
			BX.clipboard?.copy(this.item.value ?? '');
			UI.Notification.Center.notify({
				content: Loc.getMessage('BIZPROCDESIGNER_EDITOR_NODE_DATA_INSPECTOR_COPY_NOTIFICATION'),
				autoHideDelay: 2000,
			});
		},
	},
	template: `
		<div class="inspector-scheme-view__data-item-row">
			<div class="inspector-scheme-view__data-item-title-container">
				<div
					class="inspector-scheme-view__data-item-hoverable inspector-scheme-view__data-item-drag-source"
					:data-test-id="$testId('nodeDataInspectorSchemeDragSource')"
					:data-drag-value="item.value"
				>
					<div class="inspector-scheme-view__data-item-title"
						 :title="itemTitle"
					>
						<BIcon
							:name="Outline.DRAG_L"
							:size="16"
						/>
						<span class="inspector-scheme-view__data-item-title-text">{{ itemTitle }}</span>
					</div>
				</div>
				<div v-if="isClipboardCopyAvailable"
					 class="inspector-scheme-view__data-item-copy-button"
					 @click="onCopyClick"
				>
					<BIcon :name="Outline.COPY" :size="16"/>
				</div>
			</div>
			<span
				class="inspector-scheme-view__data-item-example-value"
				:data-test-id="$testId('nodeDataInspectorSchemeValueCell')"
			>
				<InspectorValueCell
					:data-test-id="$testId('nodeDataInspectorSchemeValueText')"
					:item="item"
				/>
			</span>
			<span 
				class="inspector-scheme-view__data-item-type"
				:title="dataType"
			>
				{{ dataType }}
			</span>
		</div>
	`,
};

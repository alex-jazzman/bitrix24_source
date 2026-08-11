import { BIcon, Outline } from 'ui.icon-set.api.vue';
import { Loc } from 'main.core';
import { UI } from 'ui.notification';
import { dragInspectorSchemeDataItem } from '../../../../directives/drag-inspector-scheme-data-item';

import './style.css';

// @vue/component
export const InspectorSchemeDataItemView = {
	name: 'InspectorSchemeDataItemView',
	components: {
		BIcon,
	},
	directives: {
		dragInspectorSchemeDataItem,
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
		exampleValue(): string
		{
			return this.item.exampleValue ?? '';
		},
		hasExampleValue(): boolean
		{
			return this.exampleValue !== undefined && this.exampleValue !== null && this.exampleValue !== '';
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
					class="inspector-scheme-view__data-item-hoverable"
					v-drag-inspector-scheme-data-item="item.value"
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
			<span class="inspector-scheme-view__data-item-example-value"
				  :title="exampleValue"
			>
				{{ exampleValue }}
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

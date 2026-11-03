import { BIcon, Outline } from 'ui.icon-set.api.vue';
import { Loc, Type } from 'main.core';
import { UI } from 'ui.notification';
import { hint } from 'ui.vue3.directives.hint';

import { InspectorValueCell } from '../../../inspector-value-cell/inspector-value-cell';

import './style.css';

// A leaf without an expression is no source of one: no drag handle and no copy button. The reason
// travels with the item, the leaf itself does not know why its expression is missing.
// @vue/component
export const InspectorSchemeDataItemView = {
	name: 'InspectorSchemeDataItemView',
	components: {
		BIcon,
		InspectorValueCell,
	},
	directives: {
		hint,
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
		hasExpression(): boolean
		{
			return Type.isStringFilled(this.item.value);
		},
		isClipboardCopyAvailable(): boolean
		{
			if (!this.hasExpression)
			{
				return false;
			}

			return BX.clipboard?.isCopySupported() ?? false;
		},
		noExpressionHintParams(): ?Object
		{
			const text = this.item.noExpressionHint ?? '';
			if (this.hasExpression || text === '')
			{
				return null;
			}

			return {
				text,
				// hoverable popup: the pointer can reach it and it is not dismissed at once (WCAG 1.4.13)
				interactivity: true,
				popupOptions: { closeByEsc: true, role: 'tooltip' },
			};
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
					:class="{ 'inspector-scheme-view__data-item-drag-source': hasExpression }"
					:data-test-id="hasExpression ? $testId('nodeDataInspectorSchemeDragSource') : null"
					:data-drag-value="hasExpression ? item.value : null"
				>
					<div class="inspector-scheme-view__data-item-title"
						 :title="hasExpression ? itemTitle : null"
						 v-hint="noExpressionHintParams"
					>
						<BIcon
							:class="['inspector-scheme-view__data-item-drag-icon', { '--inactive': !hasExpression }]"
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

import { BIcon, Outline } from 'ui.icon-set.api.vue';
import { mapActions, mapState } from 'ui.vue3.pinia';

import { diagramStore } from '../../../../entities/blocks/stores/diagram';
import { type InspectorViewItemData } from '../../../../entities/node-data-inspector/types';
import {
	InspectorSchemeCollapsibleItemView,
} from '../../../../entities/node-data-inspector/ui/inspector-scheme-view/components/inspector-scheme-collapsible-item-view/inspector-scheme-collapsible-item-view';
import {
	InspectorSchemeDataItemView,
} from '../../../../entities/node-data-inspector/ui/inspector-scheme-view/components/inspector-scheme-data-item-view/inspector-scheme-data-item-view';
import {
	type NodeFilterFoundItem,
	type NodeFilterItemValues,
	NodeFilterSourceState,
} from '../../../../shared/api';
import { useLoc } from '../../../../shared/composables';
import { useNodeDataInspectorStore } from '../../../../shared/stores/node-data-inspector-store';
import { documentFieldsCache } from '../../../../shared/utils/document-fields-cache';
import { formatLastValue } from '../../../../widgets/node-data-inspector/utils/format-last-value';

import './style.css';

// The list, the selected position and the values belong to the panel store; the collapsed state
// stays with the tree level above.
// @vue/component
export const FoundItemsView = {
	name: 'FoundItemsView',
	components: {
		BIcon,
		InspectorSchemeCollapsibleItemView,
		InspectorSchemeDataItemView,
	},
	props: {
		item: {
			/** @type InspectorViewFoundItemsItem */
			type: Object,
			required: true,
		},
		collapsed: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['toggle'],
	setup(): Object
	{
		const { getMessage } = useLoc();

		return { getMessage };
	},
	computed: {
		...mapState(diagramStore, ['templateId']),
		...mapState(useNodeDataInspectorStore, [
			'foundItems',
			'foundItemsLoading',
			'foundItemsErrors',
			'selectedFoundItemIds',
			'foundItemValues',
		]),
		expression(): string
		{
			return this.item.collectionExpression ?? '';
		},
		list(): ?Object
		{
			return this.foundItems[this.expression] ?? null;
		},
		items(): Array<NodeFilterFoundItem>
		{
			return this.list?.items ?? [];
		},
		sourceState(): string
		{
			return this.list?.state ?? '';
		},
		isListLoading(): boolean
		{
			return this.foundItemsLoading[this.expression] === true;
		},
		listErrorCode(): string
		{
			return this.foundItemsErrors[this.expression] ?? '';
		},
		isTruncated(): boolean
		{
			return this.list?.hasMore === true;
		},
		selectedItemId(): string
		{
			return this.selectedFoundItemIds[this.expression] ?? '';
		},
		selectedIndex(): number
		{
			return this.items.findIndex((item: NodeFilterFoundItem) => item.id === this.selectedItemId);
		},
		selectedItem(): ?NodeFilterFoundItem
		{
			return this.items[this.selectedIndex] ?? null;
		},
		// The first position is the only one an expression addresses, so it is the only one that
		// keeps the drag handle and the copy button.
		isFirstPosition(): boolean
		{
			return this.selectedIndex === 0;
		},
		hasCounter(): boolean
		{
			return this.selectedIndex >= 0;
		},
		hasSwitcher(): boolean
		{
			return this.hasCounter && this.items.length > 1;
		},
		hasPreviousItem(): boolean
		{
			return this.selectedIndex > 0;
		},
		hasNextItem(): boolean
		{
			return this.selectedIndex >= 0 && this.selectedIndex < this.items.length - 1;
		},
		positionText(): string
		{
			return `${this.selectedIndex + 1}/${this.items.length}`;
		},
		// The address is built by the server from the document type, so an allowlist of schemes costs
		// nothing and keeps a provider answering with a foreign scheme out of the link.
		itemUrl(): string
		{
			const url = this.selectedItem?.url ?? '';

			return /^\/(?!\/)|^https?:\/\//.test(url) ? url : '';
		},
		documentType(): string | Array<string> | null
		{
			return this.item.documentType ?? null;
		},
		// An empty list of fields alone does not tell a refused schema from a document without
		// fields: the refusal lives in the schema cache, apart from the list.
		areFieldsRefused(): boolean
		{
			return Boolean(this.documentType) && documentFieldsCache.hasFailed(this.documentType);
		},
		fieldKeys(): Array<string>
		{
			return (this.item.fields ?? []).map((field) => field.fieldKey);
		},
		fieldKeyByExpression(): Map<string, string>
		{
			return new Map(
				(this.item.fields ?? []).map((field) => [this.makeFieldExpression(field.fieldKey), field.fieldKey]),
			);
		},
		valuesView(): Object
		{
			return this.foundItemValues(this.expression, this.selectedItemId);
		},
		itemValues(): ?NodeFilterItemValues
		{
			return this.valuesView.values;
		},
		valuesErrorCode(): string
		{
			return this.valuesView.errorCode ?? '';
		},
		areValuesLoading(): boolean
		{
			return this.valuesView.loading === true;
		},
		// The fields of the item and the item itself are two requests, so the values are asked for
		// again once a schema that was missing arrives.
		valuesRequestKey(): string
		{
			return `${this.selectedItemId}|${this.fieldKeys.join(',')}`;
		},
		// What the node shows instead of a selected item: a state of the source or a refusal of the
		// list. Empty while there is an item to show.
		notice(): string
		{
			if (this.listErrorCode !== '')
			{
				return this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_DATA_INSPECTOR_FOUND_ITEMS_LIST_ERROR');
			}

			if (this.list === null)
			{
				return this.isListLoading
					? this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_DATA_INSPECTOR_FOUND_ITEMS_LOADING')
					: '';
			}

			if (this.sourceState === NodeFilterSourceState.empty)
			{
				return this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_DATA_INSPECTOR_FOUND_ITEMS_EMPTY');
			}

			if (this.sourceState === NodeFilterSourceState.noSnapshot)
			{
				return this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_DATA_INSPECTOR_FOUND_ITEMS_NO_SNAPSHOT');
			}

			return '';
		},
		isNoticeAlert(): boolean
		{
			return this.listErrorCode !== '';
		},
		// The field leaves come from the node itself, so the panel search keeps filtering them; the
		// values and the expression rules are the only part this component puts on top.
		fieldRows(): Array<InspectorViewItemData>
		{
			return (this.item.items ?? []).map((field: InspectorViewItemData) => {
				const fieldKey = this.fieldKeyByExpression.get(field.value) ?? '';
				const value = formatLastValue(this.itemValues?.[fieldKey]);

				return {
					...field,
					// no expression means no drag source and no copy: an empty one would insert an
					// empty string into the field it was dropped on
					value: this.isFirstPosition ? field.value : '',
					noExpressionHint: this.isFirstPosition ? '' : this.makeNoExpressionHint(field.text),
					exampleValue: value.text,
					exampleValueItems: value.items,
					exampleValueMoreCount: value.moreCount,
				};
			});
		},
		Outline: (): typeof Outline => Outline,
	},
	watch: {
		// the list is asked for by the expression and not once on creation: levels of the scheme are keyed
		// by their text, so a switch to a node whose filter property is named the same reuses this very
		// component and no hook would fire again
		expression: {
			immediate: true,
			handler(): void
			{
				void this.loadFoundItems(this.templateId, this.expression);
			},
		},
		valuesRequestKey: {
			immediate: true,
			handler(): void
			{
				this.requestItemValues();
			},
		},
	},
	methods: {
		...mapActions(useNodeDataInspectorStore, [
			'loadFoundItems',
			'selectFoundItem',
			'loadFoundItemValues',
			'retryFoundItems',
			'retryFoundItemValues',
		]),
		requestItemValues(): void
		{
			// an answer to an empty set of fields is an empty map, and it would be cached as the
			// values of the item, so the request waits for the field schema
			if (this.fieldKeys.length === 0)
			{
				return;
			}

			void this.loadFoundItemValues(this.templateId, this.expression, this.selectedItemId, this.fieldKeys);
		},
		retryList(): void
		{
			void this.retryFoundItems(this.templateId, this.expression);
		},
		retryItemValues(): void
		{
			void this.retryFoundItemValues(this.templateId, this.expression, this.selectedItemId, this.fieldKeys);
		},
		retryFields(): void
		{
			if (this.documentType === null)
			{
				return;
			}

			void documentFieldsCache.refetchFailedFields(this.documentType);
		},
		// The hint carries the field name as well: it replaces the native title of the row, and the
		// name in the row itself may be cut off.
		makeNoExpressionHint(fieldTitle: string): string
		{
			return this.getMessage(
				'BIZPROCDESIGNER_EDITOR_NODE_DATA_INSPECTOR_FOUND_ITEMS_NO_EXPRESSION',
				{ '#FIELD#': fieldTitle },
			);
		},
		makeFieldExpression(fieldKey: string): string
		{
			const prefix = this.item.firstItemExpressionPrefix ?? '';

			return prefix.endsWith('}') ? `${prefix.slice(0, -1)}.${fieldKey}}` : '';
		},
		selectItemAt(index: number): void
		{
			const item = this.items[index];
			if (item)
			{
				this.selectFoundItem(this.expression, item.id);
			}
		},
	},
	template: `
		<InspectorSchemeCollapsibleItemView
			:item="item"
			:item-type="item.type"
			:collapsed="collapsed"
			has-children
			@toggle="$emit('toggle')"
		>
			<template #header-controls>
				<div v-if="hasCounter" class="editor-chart-found-items__switcher">
					<button
						v-if="hasSwitcher"
						type="button"
						class="editor-chart-found-items__switcher-button"
						:data-test-id="$testId('nodeDataInspectorFoundItemsPrev')"
						:disabled="!hasPreviousItem"
						:title="getMessage('BIZPROCDESIGNER_EDITOR_NODE_DATA_INSPECTOR_FOUND_ITEMS_PREV')"
						@click="selectItemAt(selectedIndex - 1)"
					>
						<BIcon :name="Outline.CHEVRON_LEFT_L" :size="16"/>
					</button>
					<span
						class="editor-chart-found-items__position"
						:data-test-id="$testId('nodeDataInspectorFoundItemsPosition')"
					>
						{{ positionText }}
					</span>
					<button
						v-if="hasSwitcher"
						type="button"
						class="editor-chart-found-items__switcher-button"
						:data-test-id="$testId('nodeDataInspectorFoundItemsNext')"
						:disabled="!hasNextItem"
						:title="getMessage('BIZPROCDESIGNER_EDITOR_NODE_DATA_INSPECTOR_FOUND_ITEMS_NEXT')"
						@click="selectItemAt(selectedIndex + 1)"
					>
						<BIcon :name="Outline.CHEVRON_RIGHT_L" :size="16"/>
					</button>
					<span v-if="isTruncated" class="editor-chart-found-items__truncated">
						{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_DATA_INSPECTOR_FOUND_ITEMS_TRUNCATED') }}
					</span>
				</div>
			</template>
		</InspectorSchemeCollapsibleItemView>
		<ul v-if="!collapsed" class="inspector-scheme-view__item-list">
			<li v-if="notice" class="inspector-scheme-view__item">
				<p
					class="editor-chart-found-items__notice"
					:class="{ '--alert': isNoticeAlert }"
					:role="isNoticeAlert ? 'alert' : null"
					:data-test-id="$testId('nodeDataInspectorFoundItemsNotice')"
				>
					{{ notice }}
					<button
						v-if="isNoticeAlert"
						type="button"
						class="editor-chart-found-items__retry"
						:data-test-id="$testId('nodeDataInspectorFoundItemsListRetry')"
						@click="retryList"
					>{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_DATA_INSPECTOR_FOUND_ITEMS_RETRY') }}</button>
				</p>
			</li>
			<li v-if="selectedItem" class="inspector-scheme-view__item">
				<a
					v-if="itemUrl"
					class="editor-chart-found-items__caption --link"
					:data-test-id="$testId('nodeDataInspectorFoundItemsCaption')"
					:href="itemUrl"
					target="_blank"
					rel="noopener"
				>{{ selectedItem.title }}</a>
				<span
					v-else
					class="editor-chart-found-items__caption"
					:data-test-id="$testId('nodeDataInspectorFoundItemsCaption')"
				>{{ selectedItem.title }}</span>
				<p
					v-if="areFieldsRefused"
					class="editor-chart-found-items__notice --alert"
					role="alert"
					:data-test-id="$testId('nodeDataInspectorFoundItemsFieldsError')"
				>
					{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_DATA_INSPECTOR_FOUND_ITEMS_FIELDS_ERROR') }}
					<button
						type="button"
						class="editor-chart-found-items__retry"
						:data-test-id="$testId('nodeDataInspectorFoundItemsFieldsRetry')"
						@click="retryFields"
					>{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_DATA_INSPECTOR_FOUND_ITEMS_RETRY') }}</button>
				</p>
				<template v-else>
					<p
						v-if="valuesErrorCode"
						class="editor-chart-found-items__notice --alert"
						role="alert"
						:data-test-id="$testId('nodeDataInspectorFoundItemsValuesError')"
					>
						{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_DATA_INSPECTOR_FOUND_ITEMS_VALUES_ERROR') }}
						<button
							type="button"
							class="editor-chart-found-items__retry"
							:data-test-id="$testId('nodeDataInspectorFoundItemsValuesRetry')"
							@click="retryItemValues"
						>{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_DATA_INSPECTOR_FOUND_ITEMS_RETRY') }}</button>
					</p>
					<p
						v-if="areValuesLoading"
						class="editor-chart-found-items__notice"
						:data-test-id="$testId('nodeDataInspectorFoundItemsValuesLoading')"
					>{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_DATA_INSPECTOR_FOUND_ITEMS_LOADING') }}</p>
					<p
						v-if="fieldRows.length === 0"
						class="editor-chart-found-items__notice"
						:data-test-id="$testId('nodeDataInspectorFoundItemsNoFields')"
					>{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_DATA_INSPECTOR_FOUND_ITEMS_NO_FIELDS') }}</p>
					<ul
						v-else
						class="inspector-scheme-view__item-list editor-chart-found-items__fields"
						:class="{ '--static': !isFirstPosition }"
					>
						<li
							v-for="(row, rowIndex) in fieldRows"
							:key="row.text || rowIndex"
							class="inspector-scheme-view__item"
						>
							<InspectorSchemeDataItemView :item="row"/>
						</li>
					</ul>
				</template>
			</li>
		</ul>
	`,
};

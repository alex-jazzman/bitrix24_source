import { type ContentBlockItem } from '../../../../shared/types';
import { ReadableExpressionText } from '../readable-expression-text/readable-expression-text';

import './style.css';

/**
 * Whether a representation gives the summary anything to draw. The rule of what counts as content
 * belongs to the component and is exported only so that a place of use can lay out the row around a
 * summary it cannot measure yet - never to be restated there.
 */
export function hasSummaryContent(items: ?Array<ContentBlockItem>, text: ?string): boolean
{
	return (items ?? []).length > 0 || (text ?? '').trim() !== '';
}

/**
 * Read-only summary of what a node is configured to do: the labelled values of its representation,
 * or the joined string of the same representation when there are none.
 *
 * The whole choice of what to draw lives here, so a place of use hands over both halves of the
 * representation and nothing else. The component knows about neither node types nor constructions:
 * it renders what it was given, and renders nothing at all when there is nothing to say. It reads
 * neither store nor API of its own: resolving the references of a value is left to
 * `ReadableExpressionText`, the same way the title of the row does it. That component carries the
 * hint of the text as well, so the tail the ellipsis ate is read the way the text itself reads.
 */
// @vue/component
export const SettingsSummary = {
	name: 'SettingsSummary',
	components: { ReadableExpressionText },
	props:
	{
		/** @type Array<ContentBlockItem> */
		items:
		{
			type: Array,
			default: () => [],
		},
		text:
		{
			type: String,
			default: '',
		},
	},
	computed:
	{
		// An empty list means the same as no list at all, so an activity that resolved no labelled
		// value still falls back to the joined string instead of leaving an empty row behind.
		labelledItems(): Array<ContentBlockItem>
		{
			return this.items ?? [];
		},
		// Normalized here rather than by the place of use: the component is meant to be reused, and a
		// string of blanks would otherwise count as content and leave a row with a gap and nothing in it.
		fallbackText(): string
		{
			return (this.text ?? '').trim();
		},
		hasContent(): boolean
		{
			return hasSummaryContent(this.items, this.text);
		},
	},
	methods:
	{
		getValueTestId(index: number): string
		{
			return this.$testId('settingsSummaryValue', String(index));
		},
	},
	template: `
		<div
			v-if="hasContent"
			class="editor-chart-settings-summary"
			:data-test-id="$testId('settingsSummary')"
		>
			<template v-if="labelledItems.length > 0">
				<!-- The label names the value and is never cut: the ellipsis eats the value, and the
				full text stays on hover, exactly as in the preview of a complex node. -->
				<div
					v-for="(item, index) in labelledItems"
					:key="index"
					class="editor-chart-settings-summary__item"
				>
					<span class="editor-chart-settings-summary__label">{{ item.label }}:</span>
					<ReadableExpressionText
						class="editor-chart-settings-summary__value"
						:value="item.value"
						:data-test-id="getValueTestId(index)"
						:withTitle="true"
					/>
				</div>
			</template>
			<ReadableExpressionText
				v-else
				class="editor-chart-settings-summary__value"
				:value="fallbackText"
				:data-test-id="$testId('settingsSummaryText')"
				:withTitle="true"
			/>
		</div>
	`,
};

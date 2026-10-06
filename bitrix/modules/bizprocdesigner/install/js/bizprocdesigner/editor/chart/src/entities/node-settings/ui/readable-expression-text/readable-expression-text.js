import { Loc } from 'main.core';
import { mapState } from 'ui.vue3.pinia';

import { type ActivityData, type ActivityProperty, type Block } from '../../../../shared/types';
import { diagramStore } from '../../../blocks/stores/diagram';
import {
	type ExpressionRefToken,
	type ExpressionToken,
	buildExpressionTokens,
	expressionTokenLabel,
	isReadableExpressionsAvailable,
	tokenSectionClass,
} from '../../utils/readable-expressions';

import './style.css';

type ActivityExpressionSource = {
	name: string,
	title: ?string,
	returnProperties: Array<ActivityProperty>,
	children: Array<?ActivityExpressionSource>,
};

type BlockExpressionSource = {
	id: string,
	nodeTitle: ?string,
	activity: ?ActivityExpressionSource,
};

function getActivityExpressionSource(activity: ?ActivityData): ?ActivityExpressionSource
{
	if (!activity)
	{
		return null;
	}

	return {
		name: activity.Name,
		title: activity.Properties?.Title,
		returnProperties: activity.ReturnProperties,
		children: (activity.Children ?? []).map(getActivityExpressionSource),
	};
}

function getExpressionSources(blocks: Array<Block>): Array<BlockExpressionSource>
{
	return blocks.map((block: Block) => ({
		id: block.id,
		nodeTitle: block.node?.title,
		activity: getActivityExpressionSource(block.activity),
	}));
}

/**
 * Read-only rendering of a value with references. Tokens carry no handlers and no focus of their
 * own: a click on them reaches the preview card, exactly as a click on the plain text does.
 */
// @vue/component
export const ReadableExpressionText = {
	name: 'ReadableExpressionText',
	props:
	{
		value:
		{
			type: String,
			default: '',
		},
		/** @type Array<Block> */
		contextBlocks:
		{
			type: Array,
			default: null,
		},
	},
	data(): { tokens: Array<ExpressionToken>, isUnmounted: boolean }
	{
		return {
			tokens: [],
			isUnmounted: false,
		};
	},
	computed:
	{
		...mapState(diagramStore, ['blocks']),
		// Titles of the sources alone, and only while there is something to build tokens from: with
		// the feature off the value stays plain text, and a deep watcher over every block of the
		// diagram would be walked on each of its changes for nothing.
		expressionSources(): Array<BlockExpressionSource>
		{
			if (!isReadableExpressionsAvailable())
			{
				return [];
			}

			return getExpressionSources([...(this.contextBlocks ?? []), ...this.blocks]);
		},
	},
	watch:
	{
		value:
		{
			immediate: true,
			handler: 'rebuildTokens',
		},
		expressionSources:
		{
			deep: true,
			handler: 'rebuildTokens',
		},
	},
	beforeUnmount(): void
	{
		this.isUnmounted = true;
	},
	methods:
	{
		rebuildTokens(): void
		{
			const { value, contextBlocks } = this;
			const { tokens, pending } = buildExpressionTokens(value, contextBlocks);

			this.tokens = tokens;
			pending?.then(() => this.applyResolvedTokens(value));
		},
		// Fields of a document arrive after a request: a value replaced meanwhile and a component
		// already gone leave the state alone. The second pass is taken as is — waiting for its own
		// promise would loop over a request that came back without the fields.
		applyResolvedTokens(value: string): void
		{
			if (this.isUnmounted || this.value !== value)
			{
				return;
			}

			this.tokens = buildExpressionTokens(value, this.contextBlocks).tokens;
		},
		getTokenLabel(token: ExpressionRefToken): string
		{
			return expressionTokenLabel(token);
		},
		getTokenClass(token: ExpressionRefToken): Array<string>
		{
			return [tokenSectionClass(token), token.unknown ? 'bxr-unknown' : ''];
		},
		// A broken reference is told apart by colour alone, so the same is said in words as well.
		getTokenTitle(token: ExpressionRefToken): string | null
		{
			return token.unknown
				? Loc.getMessage('BIZPROCDESIGNER_EDITOR_READABLE_EXPRESSIONS_UNKNOWN') ?? ''
				: null
			;
		},
	},
	template: `
		<span class="editor-chart-readable-expression-text" data-testid="bizprocdesigner-readable-expression-text">
			<template v-for="(token, index) in tokens" :key="index">
				<span
					v-if="token.kind === 'ref'"
					class="bxr-tok"
					:class="getTokenClass(token)"
					:title="getTokenTitle(token)"
					data-testid="bizprocdesigner-readable-expression-token"
				>{{ getTokenLabel(token) }}</span>
				<template v-else>{{ token.text }}</template>
			</template>
		</span>
	`,
};

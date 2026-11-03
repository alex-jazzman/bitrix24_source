import { LiveAnnouncer } from 'ui.a11y';
import { Outline } from 'ui.icon-set.api.core';
import { BIcon } from 'ui.icon-set.api.vue';
import { mapState } from 'ui.vue3.pinia';

import { useCanvas, useHighlightedBlocks, type UseHighlightedBlocks } from 'ui.block-diagram';

import { diagramStore as useDiagramStore } from '../../../../entities/blocks';
import { useLoc } from '../../../../shared/composables';

// The shape of the pill is shared with the pill of the publish errors, and their common rules are kept
// in one file: both buttons standing in that slot look the same.
import '../toast-error-block-navigation-button/style.css';
import './style.css';

const MESSAGE_IDS = Object.freeze({
	review: 'BIZPROCDESIGNER_EDITOR_FRAGMENT_LIBRARY_INSERT_REVIEW_BUTTON',
	navigation: 'BIZPROCDESIGNER_EDITOR_FRAGMENT_LIBRARY_INSERT_REVIEW_NAVIGATION_LABEL',
	prev: 'BIZPROCDESIGNER_EDITOR_FRAGMENT_LIBRARY_INSERT_REVIEW_PREV',
	next: 'BIZPROCDESIGNER_EDITOR_FRAGMENT_LIBRARY_INSERT_REVIEW_NEXT',
	position: 'BIZPROCDESIGNER_EDITOR_FRAGMENT_LIBRARY_INSERT_REVIEW_POSITION_ANNOUNCE',
});

const ICON_SIZE = 18;

let counterUidSeq = 0;

type ToastFragmentReviewButtonSetup = {
	goToBlockById: (blockId: string) => void,
	highlightedBlocks: UseHighlightedBlocks,
	getMessage: (messageId: string) => string,
	ICON_SIZE: number,
	MESSAGE_IDS: { [string]: string },
	counterId: string,
}

/**
 * Walks the nodes of the last inserted fragment whose settings still point outside it. The map of the
 * publish errors is deliberately not reused: it is filled by a refused publication and cleared by the
 * next one, while this map lives from one insertion to the next reload of the scheme.
 *
 * Going to a node reads the scheme, so the button works under the ban on writing too.
 */
// @vue/component
export const ToastFragmentReviewButton = {
	name: 'ToastFragmentReviewButton',
	components: {
		BIcon,
	},
	setup(): ToastFragmentReviewButtonSetup
	{
		const highlightedBlocks = useHighlightedBlocks();
		const { goToBlockById } = useCanvas();
		const { getMessage } = useLoc();

		counterUidSeq += 1;

		return {
			goToBlockById,
			highlightedBlocks,
			getMessage,
			ICON_SIZE,
			MESSAGE_IDS,
			// The counter describes both arrows, so it needs an id of its own.
			counterId: `bizprocdesigner-fragment-review-position-${counterUidSeq}`,
		};
	},
	data(): { currentIdx: number }
	{
		return {
			currentIdx: 0,
		};
	},
	computed: {
		...mapState(useDiagramStore, ['fragmentReviewBlockIds']),
		blockId(): string | null
		{
			return this.fragmentReviewBlockIds[this.currentIdx] ?? null;
		},
		hasNodesToReview(): boolean
		{
			return this.reviewBlocksCount > 0;
		},
		reviewBlocksCount(): number
		{
			return this.fragmentReviewBlockIds.length;
		},
		currentStateTitle(): string
		{
			return `${this.currentIdx + 1} / ${this.reviewBlocksCount}`;
		},
		isPrevAvailable(): boolean
		{
			return this.currentIdx > 0;
		},
		isNextAvailable(): boolean
		{
			return this.currentIdx + 1 < this.reviewBlocksCount;
		},
		Outline: (): typeof Outline => Outline,
	},
	watch: {
		// A list that shrank under the person moves nothing: the camera and the announcement belong to a
		// step they took, and a node deleted from the scheme is not one.
		reviewBlocksCount(count: number): void
		{
			this.currentIdx = Math.min(Math.max(count - 1, 0), this.currentIdx);
		},
	},
	methods: {
		/**
		 * The edge of the walk is told by `aria-disabled` and not by the native attribute: the browser
		 * takes the focus off a control that becomes natively unavailable, and the person who reached
		 * the last node would lose their place in the document. A focusable button has to refuse the
		 * step itself.
		 */
		onPrev(): void
		{
			if (!this.isPrevAvailable)
			{
				return;
			}

			this.goToNodeAt(this.currentIdx - 1);
		},
		onNext(): void
		{
			if (!this.isNextAvailable)
			{
				return;
			}

			this.goToNodeAt(this.currentIdx + 1);
		},
		onCurrent(): void
		{
			this.tryGoToBlockById(this.blockId);
		},
		goToNodeAt(idx: number): void
		{
			this.currentIdx = idx;
			this.tryGoToBlockById(this.blockId);
			this.announcePosition();
		},
		/**
		 * The counter is the whole answer to "where am I now", and a person who does not see it hears
		 * nothing from the move itself: the camera of the canvas is silent.
		 */
		announcePosition(): void
		{
			LiveAnnouncer.announce(this.getMessage(MESSAGE_IDS.position, {
				'#CURRENT#': this.currentIdx + 1,
				'#TOTAL#': this.reviewBlocksCount,
			}));
		},
		tryGoToBlockById(blockId: string | null): void
		{
			if (!blockId)
			{
				return;
			}

			this.highlightedBlocks.clear();
			this.highlightedBlocks.add(blockId);
			this.goToBlockById(blockId);
		},
	},
	template: `
		<div
			v-if="hasNodesToReview"
			class="editor-chart-toast-block-navigation-button --no-container-action"
			data-testid="bizprocdesigner-fragment-review"
		>
			<button
				type="button"
				class="editor-chart-toast-block-navigation-button__action"
				data-testid="bizprocdesigner-fragment-review-current"
				@click="onCurrent"
			>
				{{ getMessage(MESSAGE_IDS.review) }}
			</button>

			<div
				role="group"
				class="editor-chart-toast-block-navigation-button__controls"
				:aria-label="getMessage(MESSAGE_IDS.navigation)"
			>
				<button
					type="button"
					class="editor-chart-toast-block-navigation-button__controls__button"
					:class="{ '--disabled': !isPrevAvailable }"
					:aria-disabled="!isPrevAvailable"
					:aria-label="getMessage(MESSAGE_IDS.prev)"
					:aria-describedby="counterId"
					data-testid="bizprocdesigner-fragment-review-prev"
					@click="onPrev"
				>
					<BIcon
						aria-hidden="true"
						:name="Outline.CHEVRON_LEFT_L"
						:size="ICON_SIZE"
					/>
				</button>
				<div
					:id="counterId"
					class="editor-chart-toast-block-navigation-button__controls__state-title"
					data-testid="bizprocdesigner-fragment-review-position"
				>
					{{ currentStateTitle }}
				</div>
				<button
					type="button"
					class="editor-chart-toast-block-navigation-button__controls__button"
					:class="{ '--disabled': !isNextAvailable }"
					:aria-disabled="!isNextAvailable"
					:aria-label="getMessage(MESSAGE_IDS.next)"
					:aria-describedby="counterId"
					data-testid="bizprocdesigner-fragment-review-next"
					@click="onNext"
				>
					<BIcon
						aria-hidden="true"
						:name="Outline.CHEVRON_RIGHT_L"
						:size="ICON_SIZE"
					/>
				</button>
			</div>
		</div>
	`,
};

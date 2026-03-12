import { Outline } from 'ui.icon-set.api.core';
import { BIcon } from 'ui.icon-set.api.vue';
import { mapState } from 'ui.vue3.pinia';

import { useCanvas, useHighlightedBlocks } from 'ui.block-diagram';
import type { UseCanvas, UseHighlightedBlocks } from 'ui.block-diagram';

import { useLoc, type UseLoc } from '../../../../shared/composables';

import { diagramStore as useDiagramStore } from '../../../../entities/blocks';

import './style.css';

type ToastErrorBlockNavigationButtonSetup = {
	goToBlockById: Pick<UseCanvas, 'goToBlockById'>,
	highlightedBlocks: UseHighlightedBlocks,
	getMessage: Pick<UseLoc, 'getMessage'>,
}

// @vue/component
export const ToastErrorBlockNavigationButton = {
	name: 'ToastErrorBlockNavigationButton',
	components: {
		BIcon,
	},
	setup(): ToastErrorBlockNavigationButtonSetup
	{
		const highlightedBlocks = useHighlightedBlocks();
		const { goToBlockById } = useCanvas();
		const { getMessage } = useLoc();

		return {
			goToBlockById,
			highlightedBlocks,
			getMessage,
		};
	},
	data(): { currentIdx: number }
	{
		return {
			currentIdx: 0,
		};
	},
	computed: {
		...mapState(useDiagramStore, ['blockCurrentPublishErrors']),
		blockId(): string | null
		{
			return Object.keys(this.blockCurrentPublishErrors)[this.currentIdx] ?? null;
		},
		hasPublishErrors(): boolean
		{
			return this.errorBlocksCount > 0;
		},
		errorBlocksCount(): number
		{
			return Object.keys(this.blockCurrentPublishErrors).length;
		},
		currentStateTitle(): string
		{
			return `${this.currentIdx + 1} / ${this.errorBlocksCount}`;
		},
		isPrevAvailable(): boolean
		{
			return this.currentIdx > 0;
		},
		isNextAvailable(): boolean
		{
			return this.currentIdx + 1 < this.errorBlocksCount;
		},
		Outline: (): typeof Outline => Outline,
	},
	watch: {
		currentIdx(newIdx: number): void
		{
			if (!this.blockId)
			{
				return;
			}

			this.tryGoToBlockById(this.blockId);
		},
		errorBlocksCount(count: number): void
		{
			this.currentIdx = Math.min(count - 1, this.currentIdx);
		},
	},
	methods: {
		onPrev(): void
		{
			this.currentIdx = Math.max(this.currentIdx - 1, 0);
		},
		onNext(): void
		{
			this.currentIdx = Math.min(this.currentIdx + 1, Math.max(this.errorBlocksCount - 1, 0));
		},
		onCurrent(): void
		{
			this.tryGoToBlockById(this.blockId);
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
		<div v-if="hasPublishErrors"
			 class="editor-chart-toast-block-navigation-button"
			 @click="onCurrent"
		>
			<div class="editor-chart-toast-block-navigation-button__title">
				{{ $Bitrix.Loc.getMessage('BIZPROC_DESIGNER_TOAST_ERROR_BLOCK_NAVIGATION_BUTTON_TEXT') }}
			</div>

			<div class="editor-chart-toast-block-navigation-button__controls">
				<button 
					class="editor-chart-toast-block-navigation-button__controls__button"
					:class="{ '--disabled': !isPrevAvailable }"
				>
					<BIcon
						:name="Outline.CHEVRON_LEFT_L"
						:size="18"
						@click.stop="onPrev"
					/>
				</button>
				<div class="editor-chart-toast-block-navigation-button__controls__state-title">
					{{ currentStateTitle }}
				</div>
				<button 
					class="editor-chart-toast-block-navigation-button__controls__button"
					:class="{ '--disabled': !isNextAvailable }"
				>
					<BIcon
					   :name="Outline.CHEVRON_RIGHT_L"
					   :size="18"
					   @click.stop="onNext"
					/>
				</button>
			</div>
		</div>
	`,
};

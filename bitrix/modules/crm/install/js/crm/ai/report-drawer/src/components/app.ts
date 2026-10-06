import { defineComponent, PropType } from 'ui.vue3';

import { Header } from './header';
import { Toolbar } from './toolbar';
import { Assessment } from './blocks/assessment';
import { TextBlock } from './blocks/text-block';
import { TrailingSpacerBlock } from './blocks/trailing-spacer-block';

import { type AssessmentSettingData, type ViewData } from '../types';

import '../css/index';

const ANCHOR_ACTIVATION_LINE_OFFSET_PX = 6;
const PROGRAMMATIC_SCROLL_MAX_DISTANCE_TO_TARGET_PX = 2;
type AnchoredBlockElement = HTMLElement | null;
type AnchoredBlockRef = { $el?: Element } | Element | null;
type AnchoredBlockPosition = { blockId: string; top: number };

export const App = defineComponent({
	name: 'App',

	components: {
		Header,
		Toolbar,
		Assessment,
		TextBlock,
		TrailingSpacerBlock,
	},

	props: {
		viewData: {
			type: Object as PropType<ViewData>,
			required: true,
		},
		shareLink: {
			type: String,
			default: null,
		},
	},

	data(): {
		activeAnchorBlockId: null | string,
		isProgrammaticScrollInProgress: boolean,
		programmaticScrollTargetTop: null | number,
	}
	{
		const activeAnchor = this.viewData.anchors.find((anchor) => anchor.isActive);

		return {
			activeAnchorBlockId: activeAnchor?.blockId ?? null,
			isProgrammaticScrollInProgress: false,
			programmaticScrollTargetTop: null,
		};
	},

	setup(): { anchoredBlockElements: Record<string, AnchoredBlockElement> }
	{
		return {
			anchoredBlockElements: {},
		};
	},

	emits: ['showReassessmentPopup', 'chooseNewScript'],

	methods: {
		handleShowReassessmentPopup(assessmentSetting: AssessmentSettingData): void
		{
			this.$emit('showReassessmentPopup', assessmentSetting);
		},
		handleChooseNewScript(bindElement: HTMLElement): void
		{
			this.$emit('chooseNewScript', bindElement);
		},
		setAnchoredBlockElement(blockId: string, anchoredBlockRef: AnchoredBlockRef): void
		{
			if (anchoredBlockRef === null)
			{
				delete this.anchoredBlockElements[blockId];

				return;
			}

			const element = anchoredBlockRef instanceof Element ? anchoredBlockRef : anchoredBlockRef.$el;
			this.anchoredBlockElements[blockId] = element instanceof HTMLElement ? element : null;
		},
		getAnchoredBlockElement(blockId: string): null | HTMLElement
		{
			const anchoredBlockElement = this.anchoredBlockElements[blockId];

			return anchoredBlockElement instanceof HTMLElement && anchoredBlockElement.isConnected
				? anchoredBlockElement
				: null
			;
		},
		handleAnchorActivated(blockId: string): void
		{
			this.activeAnchorBlockId = blockId;
			this.scrollToBlock(blockId);
		},
		handleContentScroll(): void
		{
			if (this.isProgrammaticScrollInProgress)
			{
				this.finishProgrammaticScrollIfReachedTarget();

				return;
			}

			this.updateActiveAnchorFromScroll();
		},
		finishProgrammaticScrollIfReachedTarget(): void
		{
			const content = this.$refs.content as HTMLElement;
			if (!(content instanceof HTMLElement))
			{
				return;
			}

			if (this.programmaticScrollTargetTop === null)
			{
				this.finishProgrammaticScroll();

				return;
			}

			if (Math.abs(content.scrollTop - this.programmaticScrollTargetTop) > PROGRAMMATIC_SCROLL_MAX_DISTANCE_TO_TARGET_PX)
			{
				return;
			}

			this.finishProgrammaticScroll();
		},
		finishProgrammaticScroll(): void
		{
			this.programmaticScrollTargetTop = null;
			this.isProgrammaticScrollInProgress = false;
			this.updateActiveAnchorFromScroll();
		},
		resolveActiveAnchorBlockId(blockPositions: AnchoredBlockPosition[]): string | null
		{
			if (blockPositions.length === 0)
			{
				return null;
			}

			const activeBlock = [...blockPositions]
				.reverse()
				.find(({ top }) => top <= ANCHOR_ACTIVATION_LINE_OFFSET_PX)
			;

			return activeBlock?.blockId ?? blockPositions[0].blockId;
		},
		updateActiveAnchorFromScroll(): void
		{
			const content = this.$refs.content as HTMLElement;
			if (!(content instanceof HTMLElement))
			{
				return;
			}

			const contentTop = content.getBoundingClientRect().top;
			const blockPositions = this.viewData.anchors.reduce(
				(positions: AnchoredBlockPosition[], { blockId }) => {
					const element = this.getAnchoredBlockElement(blockId);
					if (!(element instanceof HTMLElement))
					{
						return positions;
					}

					positions.push({
						blockId,
						top: element.getBoundingClientRect().top - contentTop,
					});

					return positions;
				},
				[],
			);

			if (blockPositions.length === 0)
			{
				return;
			}

			this.activeAnchorBlockId = this.resolveActiveAnchorBlockId(blockPositions) ?? this.activeAnchorBlockId;
		},
		scrollToBlock(blockId: string): void
		{
			const content = this.$refs.content as HTMLElement;
			if (!(content instanceof HTMLElement))
			{
				return;
			}

			const block = this.getAnchoredBlockElement(blockId);
			if (!(block instanceof HTMLElement))
			{
				return;
			}

			const maxScrollTop = Math.max(content.scrollHeight - content.clientHeight, 0);
			const targetScrollTop = Math.min(
				Math.max(
					content.scrollTop + block.getBoundingClientRect().top - content.getBoundingClientRect().top,
					0,
				),
				maxScrollTop,
			);

			this.programmaticScrollTargetTop = targetScrollTop;
			this.isProgrammaticScrollInProgress = Math.abs(content.scrollTop - targetScrollTop) > PROGRAMMATIC_SCROLL_MAX_DISTANCE_TO_TARGET_PX;
			if (!this.isProgrammaticScrollInProgress)
			{
				this.finishProgrammaticScroll();

				return;
			}

			content.scrollTo({
				top: targetScrollTop,
				behavior: 'smooth',
			});
		},
	},

	template: `
		<div class="crm-ai-report-drawer --ui-context-edge-dark ui-icon-set__scope">
			<Header
				:title="viewData.title"
				:subtitle="viewData.subtitle"
				:settings="viewData.settings"
				:shareLink="shareLink"
				@chooseNewScript="handleChooseNewScript"
			/>
			<Toolbar
				:record="viewData.record"
				:infoPopup="viewData.infoPopup"
				:anchors="viewData.anchors"
				:activeAnchorBlockId="activeAnchorBlockId"
				@anchorActivated="handleAnchorActivated"
			/>
			<div ref="content" class="crm-ai-report-drawer__content" @scroll.passive="handleContentScroll">
				<Assessment v-for="assessmentBlock in viewData.assessmentBlocks"
					:key="assessmentBlock.blockId"
					:id="assessmentBlock.blockId"
					:ref="(element) => setAnchoredBlockElement(assessmentBlock.blockId, element)"
					:assessmentBlockData="assessmentBlock"
					:assessmentSetting="viewData.assessmentSetting"
					@showReassessmentPopup="handleShowReassessmentPopup"
				/>
				<TextBlock v-for="block in viewData.blocks"
					:key="block.blockId"
					:id="block.blockId"
					:ref="(element) => setAnchoredBlockElement(block.blockId, element)"
					:blockData="block"
				/>
				<TrailingSpacerBlock />
			</div>
			<div class="crm-ai-report-drawer__ai-alert ui-typography-text-xs" v-html="viewData.aiDisclaimer" />
		</div>
	`,
});

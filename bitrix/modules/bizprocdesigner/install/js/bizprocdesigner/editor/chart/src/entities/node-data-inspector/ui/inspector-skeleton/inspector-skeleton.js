import { BIcon, Outline } from 'ui.icon-set.api.vue';
import { BLine } from 'ui.system.skeleton.vue';

import './style.css';

const GROUP_COUNT = 3;
const GROUP_TITLE_WIDTH = 120;
const GROUP_TITLE_HEIGHT = 24;
const NODE_TITLE_WIDTH = 139;

type SkeletonRow = {
	title: number,
	value: number,
	type: number,
};

// Uneven widths on purpose: equal ones read as a table of empty cells rather than as loading content.
const DATA_ROWS: Array<SkeletonRow> = [
	{ title: 101, value: 120, type: 65 },
	{ title: 76, value: 87, type: 52 },
	{ title: 130, value: 142, type: 77 },
	{ title: 57, value: 50, type: 55 },
];

type InspectorSkeletonSetup = {
	groups: Array<number>,
	dataRows: Array<SkeletonRow>,
	groupTitleWidth: number,
	groupTitleHeight: number,
	nodeTitleWidth: number,
	Outline: typeof Outline,
};

// The start of the loading is announced by the panel through `LiveAnnouncer`, so the placeholder
// itself carries no live region: a region inserted together with its text is not reliably spoken.
// It carries no text either, hence `aria-hidden` on the root: it also covers the chevrons inside.
// @vue/component
export const InspectorSkeleton = {
	name: 'InspectorSkeleton',
	components: {
		BIcon,
		BLine,
	},
	setup(): InspectorSkeletonSetup
	{
		return {
			groups: Array.from({ length: GROUP_COUNT }, (_, index) => index),
			dataRows: DATA_ROWS,
			groupTitleWidth: GROUP_TITLE_WIDTH,
			groupTitleHeight: GROUP_TITLE_HEIGHT,
			nodeTitleWidth: NODE_TITLE_WIDTH,
			Outline,
		};
	},
	template: `
		<div
			class="editor-chart-inspector-skeleton"
			:data-test-id="$testId('nodeDataInspectorSkeleton')"
			aria-hidden="true"
		>
			<div
				v-for="group in groups"
				:key="group"
				class="editor-chart-inspector-skeleton__group"
			>
				<div class="editor-chart-inspector-skeleton__header">
					<BIcon :name="Outline.CHEVRON_DOWN_L" :size="16"/>
					<BLine :width="groupTitleWidth" :height="groupTitleHeight"/>
				</div>
				<div class="editor-chart-inspector-skeleton__node">
					<div class="editor-chart-inspector-skeleton__header">
						<BIcon :name="Outline.CHEVRON_DOWN_L" :size="16"/>
						<BLine :width="nodeTitleWidth"/>
					</div>
					<div class="editor-chart-inspector-skeleton__row-list">
						<div
							v-for="row in dataRows"
							:key="row.title"
							class="editor-chart-inspector-skeleton__row"
						>
							<div class="editor-chart-inspector-skeleton__row-title">
								<div class="editor-chart-inspector-skeleton__row-title-chip">
									<BLine :width="row.title"/>
								</div>
							</div>
							<div class="editor-chart-inspector-skeleton__row-value">
								<BLine :width="row.value"/>
							</div>
							<div class="editor-chart-inspector-skeleton__row-type">
								<BLine :width="row.type"/>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	`,
};

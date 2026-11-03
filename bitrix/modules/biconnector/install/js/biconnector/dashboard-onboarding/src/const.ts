import { type EmbedTargetBox } from './types';

export const OnboardingMode = Object.freeze({
	Tour: 'tour',
	EmptyDashboardCta: 'emptyDashboard',
	None: 'none',
});

/**
 * The embed reports ready as soon as the frame answers, while its charts are still fetching
 * data, so the automatic tour waits before the first card instead of covering placeholders.
 */
export const AUTO_START_DELAY_MS = 4500;

export const StepId = Object.freeze({
	Filters: 'filters',
	Presets: 'presets',
	Info: 'info',
	Share: 'share',
	BitrixGpt: 'bitrixgpt',
	Edit: 'edit',
});

/**
 * Portal side targets of the report header. The steps living inside the embedded Superset
 * are covered by a band of the frame instead, see EmbedTargetBand.
 */
export const StepTargetSelector: Record<string, string> = Object.freeze({
	[StepId.Info]: '#info-btn',
	[StepId.Share]: '#share-btn',
	[StepId.BitrixGpt]: '[data-bitrixgpt-trigger]',
	[StepId.Edit]: '#more-btn',
});

/**
 * Where the targets inside the embedded report sit, in the coordinates of the frame. The embed
 * is cross-origin and its markup is unreachable, but its layout is fixed, so a band of the
 * frame stands in for the element.
 *
 * `height: null` means the band runs the full height of the frame, and `heightRatio` takes a
 * share of that height instead: the panel scales with the frame, a fixed box would not.
 *
 * The card stands beside the middle of its band and the beak points there, so the band is the
 * part of the panel the card belongs next to - not the control it talks about. The filter panel
 * is always 300px wide at the left edge; the two steps that speak about it share that column
 * and differ by height, so the cards of the tour do not land on the same spot twice.
 */
export const EmbedTargetBand: Record<string, EmbedTargetBox> = Object.freeze({
	[StepId.Filters]: { top: 0, left: 0, width: 300, height: null, heightRatio: 1 / 3 },
	[StepId.Presets]: { top: 0, left: 0, width: 300, height: null },
});

export const FlagAction = Object.freeze({
	CompleteTour: 'biconnector.dashboardonboarding.completeTour',
	DismissEmptyDashboardCta: 'biconnector.dashboardonboarding.dismissEmptyDashboardCta',
});

/**
 * Card edge the pointer sits on, so the card itself stands on the opposite side of the target.
 */
export const CardSide = Object.freeze({
	Top: 'top',
	Left: 'left',
	Right: 'right',
});

export const StepSide: Record<string, string> = Object.freeze({
	[StepId.Filters]: CardSide.Left,
	[StepId.Presets]: CardSide.Left,
	[StepId.Info]: CardSide.Top,
	[StepId.Share]: CardSide.Top,
	[StepId.BitrixGpt]: CardSide.Top,
	[StepId.Edit]: CardSide.Top,
});

export const StepImage: Record<string, string> = Object.freeze({
	[StepId.Filters]: 'stand-filters.webp',
	[StepId.Presets]: 'stand-presets.webp',
	[StepId.Info]: 'stand-report-info.webp',
	[StepId.Share]: 'stand-share-access.webp',
	[StepId.BitrixGpt]: 'stand-ai.webp',
	[StepId.Edit]: 'stand-analytics-positive.webp',
});

/**
 * Correction of a mascot framed differently from the rest of the set. The others are drawn
 * wedged into the bottom left corner of their 196x236 frame - the figure of the neighbouring
 * step touches the left edge on 147 rows and is cut by the bottom one - while this one stands
 * free in the middle of its frame: it ends 56px above the bottom and reaches the left edge with
 * the tip of an arm alone.
 *
 * The zoom and the two shifts seat it the same way: cut by the bottom edge of the card and
 * slightly over its left one. Shifts are pixels of the crop window, which is a fixed 98px
 * column in the stylesheet, and they are applied as a transform - see coachmark.css.
 *
 * The zoom is bounded by the prop in the mascot hand: it touches the right edge of this frame,
 * so the zoomed width plus the left shift must stay within the column, or the prop is cut. The
 * figure gives way instead - it is cut on the left and at the bottom. A frame drawn like the rest
 * of the set would need no correction at all - this one is the exception.
 */
export const StepImageFit: Record<string, { scale: number, shiftX: number, shiftY: number }> = Object.freeze({
	[StepImage[StepId.Edit]]: { scale: 1.15, shiftX: -16, shiftY: 20 },
});

export const IMAGE_PATH = '/bitrix/js/biconnector/dashboard-onboarding/images/';

/**
 * Card pointer of the design system: a smooth beak, not a triangle. Geometry and paths repeat
 * the DialogArrow component of the layout library.
 *
 * The beak is a builder rather than a fixed path moved by a transform: the card and the beak
 * have to reach the clip as one single path, see Coachmark.
 */
export const PointerShape = Object.freeze({
	up: {
		width: 36,
		height: 12,
		// Where the tip of the outline actually sits. Taking the middle of the nominal width
		// instead is wrong: the curve is asymmetric and the tip is a pixel off centre.
		apex: 16.994,
		path: (x: number, y: number): string => (
			`M${x + 0.571} ${y + 12}`
			+ `C${x + 6.687} ${y + 12} ${x + 12.393} ${y} ${x + 16.994} ${y}`
			+ `C${x + 21.595} ${y} ${x + 27.233} ${y + 12} ${x + 33.417} ${y + 12}Z`
		),
	},
	left: {
		width: 12,
		height: 36,
		apex: 17.006,
		path: (x: number, y: number): string => (
			`M${x + 12} ${y + 33.429}`
			+ `C${x + 12} ${y + 27.313} ${x} ${y + 21.607} ${x} ${y + 17.006}`
			+ `C${x} ${y + 12.405} ${x + 12} ${y + 6.767} ${x + 12} ${y + 0.583}Z`
		),
	},
	right: {
		width: 12,
		height: 36,
		apex: 16.994,
		path: (x: number, y: number): string => (
			`M${x} ${y + 0.571}`
			+ `C${x} ${y + 6.687} ${x + 12} ${y + 12.393} ${x + 12} ${y + 16.994}`
			+ `C${x + 12} ${y + 21.595} ${x} ${y + 27.233} ${x} ${y + 33.417}Z`
		),
	},
});

/**
 * How close the beak may come to the card corner. It bounds where the beak is allowed to sit,
 * and with it - how far off-centre a target the card can still point at.
 *
 * Kept below the corner radius on purpose. A target near the edge of the window pushes the card
 * against that edge, and then the beak has to reach across the card to stay on its target: with
 * the margin equal to the radius the beak ran out of room a few pixels short and pointed past
 * the button. The outer shoulders of the beak lie almost flat against the edge, so letting them
 * overlap the corner arc by those few pixels is invisible, while the miss was not.
 */
export const POINTER_EDGE_MARGIN = 8;

/**
 * How deep the beak sinks into the card. Chromium drops a clip shape that only touches the
 * card edge, and the bare seam between the two shapes shows as a hairline in the other
 * engines, so the beak always overlaps the card by this much.
 */
export const POINTER_SEAM = 1;

/**
 * Palette of the "dark-blue" scheme of the live card splash. Curated promo colours of the
 * layout library, they are not tokenized in Figma.
 */
export const WATER_SCHEME = Object.freeze({
	base: '#00078C',
	glow: '#2A76F0',
});

/**
 * Names of the design system illustrations the layout uses for the single cards.
 */
export const CardIllustration = Object.freeze({
	Help: 'help',
	CreateNew: 'create-new',
});

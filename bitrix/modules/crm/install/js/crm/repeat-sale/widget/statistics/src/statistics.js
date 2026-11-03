// Content of the statistics popup of the repeat sale widget. The statistics is by far the heaviest of the
// three widget contents and is needed only once someone opens it, so it lives in an extension of its own:
// crm.repeat-sale.widget loads it from its ContentFactory on the first opening of the popup.
import { Builder, Dictionary } from 'crm.integration.analytics';
import 'ui.design-tokens';
import { ajax as Ajax, Dom, Event, Loc, Reflection, Tag, Text, Type } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { PopupManager } from 'main.popup';
import { sendData } from 'ui.analytics';
import { Lottie } from 'ui.lottie';
import { Icon, Outline } from 'ui.icon-set.api.core';
import { PeriodType, WidgetContentBase as Base, WidgetFooter as Footer, WidgetType } from 'crm.repeat-sale.widget';
import type { WidgetParams, WidgetTypeEnum } from 'crm.repeat-sale.widget';
import { applyDealFilter, canFilterDeals, hasDealFilterTarget, StageSemantic } from './deal-filter';
import type { DealFilterOptions } from './deal-filter';

import 'ui.hint';
import './statistics.css';

const UserOptions = Reflection.namespace('BX.userOptions');

// Row test ids; the deals-in-work one also marks the row expanded by default below.
const DEALS_IN_WORK_BASE_TEST_ID = 'repeat-sale-widget-deals-in-work';
const WON_DEALS_BASE_TEST_ID = 'repeat-sale-widget-won-deals';

const SLIDER_OPEN_EVENT = 'SidePanel.Slider:onOpenStart';
const SLIDER_CLOSE_EVENT = 'SidePanel.Slider:onCloseComplete';

// SVG ids are global to the document: changing the period re-renders the content, and until the old
// node is dropped two elements would share an id, so every render gets its own suffix.
let ghostDigitsSeq = 0;

type ConversionPercent = {
	value: string,
	label: string,
};

// The server rounds the percent to one decimal place, so a couple of won deals out of thousands
// created reach the widget as a bare zero: whether there is any conversion at all is told by the
// counters, not by the rounded percent.
function formatConversionPercent(value: number, winCount: number): ConversionPercent
{
	if (value < 1 && (value > 0 || winCount > 0))
	{
		return {
			value: '<1',
			label: '<1%',
		};
	}

	const roundedValue = String(Math.round(value));

	return {
		value: roundedValue,
		label: `${roundedValue}%`,
	};
}

// The saved period arrives from user options, where it is not necessarily a number: the cookie fallback
// of BX.userOptions hands the value over as a string until the deferred write reaches the server, and
// settings saved by older versions hold strings too. Every consumer compares the period with the numeric
// PeriodType, so an unknown value falls back to the default view instead of travelling further.
function toPeriodType(periodTypeId: mixed): number
{
	const periodType = Number.parseInt(periodTypeId, 10);

	return Object.values(PeriodType).includes(periodType) ? periodType : PeriodType.day30;
}

type SegmentStat = {
	id: number,
	title: string,
	processCount: number,
	processSum: string,
	winCount: number,
	winSum: string,
};

type StatisticsData = {
	repeatSaleProcessCount: number,
	repeatSaleProcessSum: string,
	repeatSaleWinCount: number,
	repeatSaleWinSum: string,
	repeatSaleTotalCount: number,
	repeatSaleTodayCount: number,
	conversionByCount: number,
	repeatSaleSegmentIds: number[],
	repeatSaleSegmentStats: SegmentStat[],
	repeatSalePeriodStartDate: ?string,
};

type DealFilterOptionsFactory = (segmentIds: number[]) => DealFilterOptions;

type StatRowConfig = {
	testId: string,
	titleCode: string,
	count: number,
	sum: string,
	segments: SegmentStat[],
	countField: string,
	sumField: string,
	stageSemanticId: string,
	data: StatisticsData,
	isBottomRow: boolean,
};

type SegmentsRowConfig = {
	testId: string,
	segments: SegmentStat[],
	countField: string,
	sumField: string,
	buildFilterOptions: DealFilterOptionsFactory,
	isExpanded: boolean,
};

type SegmentItemConfig = {
	segment: SegmentStat,
	countField: string,
	sumField: string,
	buildFilterOptions: DealFilterOptionsFactory,
};

type SegmentsToggleContext = {
	baseTestId: string,
	row: HTMLElement,
	segmentsRow: HTMLElement,
	shiftsBottomRadius: boolean,
	toggle: ?HTMLElement,
};

type SegmentsToggleConfig = {
	testId: string,
	isExpanded: boolean,
	toggleContext: SegmentsToggleContext,
};

export class Statistics extends Base
{
	#periodType: number = PeriodType.day30;
	#showSettingsButton: boolean = true;
	#isGlowingSettingsButton: boolean = false;
	#hint: ?Manager = null;
	// Survives popup content re-renders (e.g. period change) since it lives on this instance, not in the DOM.
	// The deals-in-work breakdown starts open on every opening of the widget.
	#expandedSegmentRows: Set<string> = new Set([DEALS_IN_WORK_BASE_TEST_ID]);
	#backgroundNode: ?HTMLElement = null;
	#ghostNode: ?HTMLElement = null;
	#isBackgroundPaused: boolean = false;
	#stopSliderTracking: ?Function = null;

	constructor(params: WidgetParams)
	{
		super(params);

		this.#showSettingsButton = params.showSettingsButton ?? true;
		this.#isGlowingSettingsButton = params.isGlowingSettingsButton ?? false;
		this.#periodType = toPeriodType(params.periodTypeId);
	}

	getType(): WidgetTypeEnum
	{
		return WidgetType.statistics;
	}

	getPopupWidth(): number
	{
		return 489;
	}

	isAutoHidePopup(): boolean
	{
		// The popup has to survive the deal slider: a click inside the slider counts as outside the
		// popup, so auto-hide would close it. It closes by its own cross or Esc instead.
		return false;
	}

	// Without auto-hide the base class turns the native closeIcon on, and the popup already draws its
	// own cross (.crm-rs__w-close), so the native one is switched off to avoid two of them.
	// The popup container carries role="dialog", so it needs a name of its own: the visible heading is
	// inside the content and would not be found by the dialog itself.
	getPopupParams(data: Object, params: Object = {}): Object
	{
		return {
			...super.getPopupParams(data, params),
			closeIcon: false,
			ariaLabel: Loc.getMessage('CRM_REPEAT_SALE_WIDGET_STATISTICS_POPUP_TITLE'),
		};
	}

	onFirstShow(): void
	{
		super.onFirstShow();

		this.#startSliderTracking();
	}

	onClose(): void
	{
		this.#stopSliderTracking?.();
		this.#stopSliderTracking = null;
		this.#backgroundNode = null;
		this.#ghostNode = null;
		this.#isBackgroundPaused = false;

		super.onClose();
	}

	// The background drifts for as long as the popup lives, and the popup deliberately outlives the deal
	// slider (see isAutoHidePopup), where nobody sees it drift. Any slider closing resumes the drift, even
	// with an outer slider still open: a background left frozen in sight would be worse than a few extra frames.
	#startSliderTracking(): void
	{
		this.#stopSliderTracking?.();

		const pause = () => this.#setBackgroundPaused(true);
		const resume = () => this.#setBackgroundPaused(false);

		EventEmitter.subscribe(SLIDER_OPEN_EVENT, pause);
		EventEmitter.subscribe(SLIDER_CLOSE_EVENT, resume);

		this.#stopSliderTracking = () => {
			EventEmitter.unsubscribe(SLIDER_OPEN_EVENT, pause);
			EventEmitter.unsubscribe(SLIDER_CLOSE_EVENT, resume);
		};
	}

	#setBackgroundPaused(paused: boolean): void
	{
		this.#isBackgroundPaused = paused;

		if (this.#backgroundNode !== null)
		{
			Dom.toggleClass(this.#backgroundNode, '--paused', paused);
		}

		if (this.#ghostNode !== null)
		{
			Dom.toggleClass(this.#ghostNode, '--paused', paused);
		}
	}

	#getLoadingPopupContent(): HTMLElement
	{
		return Tag.render`
			<div>
				<header class="crm-rs__w-header --statistics">
					${Loc.getMessage('CRM_REPEAT_SALE_WIDGET_STATISTICS_POPUP_TITLE')}
				</header>
				<div class="crm-rs__w-body">
					<div class="crm-rs__w-body-loading-bubble">
						<div class="crm-rs__w-body-loading-bubble-wrapper">
							${this.renderLottieAnimation()}
							${this.#renderLoadingLottieAnimation()}
						</div>
						<div class="crm-rs__w-body-bubble-subtitle">
							${Loc.getMessage('CRM_REPEAT_SALE_WIDGET_STATISTICS_POPUP_LOADING')}
						</div>
					</div>
				</div>
				<footer class="crm-rs__w-footer --statistics">
					${this.#getFooterContent()}
				</footer>
			</div>
		`;
	}

	#renderLoadingLottieAnimation(): HTMLElement
	{
		const container = Tag.render`
			<div class="crm-rs__w-loading-lottie-container">
				<div ref="lottie" class="crm-rs__w-lottie"></div>
			</div>
		`;

		const mainAnimation = Lottie.loadAnimation({
			path: '/bitrix/js/crm/repeat-sale/widget/lottie/loading.json',
			container: container.lottie,
			renderer: 'svg',
			loop: true,
			autoplay: true,
		});

		mainAnimation.setSpeed(0.75);

		return container.root;
	}

	getPopupContent(data: ?StatisticsData = null): HTMLElement
	{
		const conversion = formatConversionPercent(data?.conversionByCount ?? 0, data?.repeatSaleWinCount ?? 0);

		return Tag.render`
			<div class="crm-rs__w-statistics-root">
				${this.#renderLiveBackground()}
				${this.#renderGhostDigits(conversion.value)}
				<div class="crm-rs__w-statistics-content">
					<span
						class="crm-rs__w-close"
						data-testid="repeat-sale-widget-close"
						role="button"
						tabindex="0"
						aria-label="${Loc.getMessage('CRM_REPEAT_SALE_WIDGET_POPUP_CLOSE')}"
						onclick="${() => this.close()}"
						onkeydown="${(event) => {
							if (event.key === 'Enter' || event.key === ' ')
							{
								event.preventDefault();
								this.close();
							}
						}}"
					>${new Icon({ icon: Outline.CROSS_M, size: 24, color: '#ffffff' }).render()}</span>
					<header class="crm-rs__w-header --statistics">
						${this.#getPopupTitle(data)}
					</header>
					<div class="crm-rs__w-body">
						<div class="crm-rs__w-body-content --statistics">
							${this.#renderConversionBar(data)}
							<div class="crm-rs__w-body-statistics-table" data-testid="repeat-sale-widget-statistics-table">
								${this.#renderProcessRow(data)}
								${this.#renderWinRow(data)}
							</div>
						</div>
					</div>
					<footer class="crm-rs__w-footer --statistics">
						${this.#getFooterContent()}
					</footer>
				</div>
			</div>
		`;
	}

	// Background of four drifting blobs behind the popup content. The node is kept so that a content
	// re-render (period change) behind an open slider brings back a paused background, not a moving one.
	#renderLiveBackground(): HTMLElement
	{
		const background = Tag.render`
			<div class="crm-rs__w-bg" aria-hidden="true">
				<span class="crm-rs__w-blob --b2"></span>
				<span class="crm-rs__w-blob --b1"></span>
				<span class="crm-rs__w-blob --b3"></span>
				<span class="crm-rs__w-blob --b4"></span>
			</div>
		`;

		if (this.#isBackgroundPaused)
		{
			Dom.addClass(background, '--paused');
		}

		this.#backgroundNode = background;

		return background;
	}

	// Conversion digits drawn as glass behind the content: no fill, only soft inner highlights masked by
	// the glyph body. The size is fixed rather than following the popup height, so the digits do not jump
	// when a group expands or the period changes. The highlight sweeps left-right as a CSS transform on
	// the sheen rect (see .crm-rs__w-ghost-sheen), which is drawn wider than the mask so the pan never
	// runs out of gradient.
	//
	// There is deliberately no feGaussianBlur here. An earlier version animated the gradient through
	// SMIL gradientTransform and was made static because that re-ran the blur every frame; measuring the
	// two on a stand showed a transform does not avoid that — an SVG filter="url(#...)" makes the element
	// ineligible for the compositor path, so the filter is re-applied whenever the element moves, no
	// matter what moves it (the background blobs get away with it only because CSS filter: blur() on a
	// promoted layer is rasterized once). Dropping the blur instead is free visually: it was blurring a
	// smooth linear gradient, and a Gaussian blur of a linear ramp reproduces the ramp — a pixel diff of
	// the layer with and without it differs by at most 2/255 per channel at every point of the sweep.
	// Built through innerHTML: Tag.render gives no SVG namespace.
	#renderGhostDigits(conversion: string): HTMLElement
	{
		const value = Text.encode(conversion);

		const w = this.getPopupWidth();
		const h = 280;
		const numFs = 235;
		const pctFs = 36;
		const pctRight = w - 16; // right edge of '%' meets the content edge (padding-right 16)
		const pctY = 66;
		const numY = 188; // lowered for the large font size so the top of the digits is not cut off
		const numRight = pctRight - pctFs - 2;

		// The sheen rect is wider than the glyph mask so the CSS pan (up to 21% of its own width, see
		// statistics.css) never runs out of gradient to show through the static mask.
		//
		// Do not reach for a longer throw to make the sweep more visible — that was tried and measured.
		// Peak change over a full sweep runs ~18/255 at 1.4x and ~38/255 here, then flattens: the bands
		// are drawn in objectBoundingBox units, so widening the rect to buy travel widens them by the
		// same factor and cancels the gain. Past ~1.9x the digits simply start blinking as the light
		// clears them entirely. Band opacity is the lever that works: the stops below are the original
		// .2/.13 raised by half, which is what took the sweep from unnoticeable to ~55/255 — and they
		// stay in objectBoundingBox units precisely so the light never fully clears the glyphs.
		const sheenW = w * 1.9;
		const sheenX = -(sheenW - w) / 2;

		ghostDigitsSeq += 1;
		const maskId = `crm-rs-ghost-mask-${ghostDigitsSeq}`;
		const reflectionId = `crm-rs-ghost-reflection-${ghostDigitsSeq}`;

		// Glyph typography lives in widget.css; only the geometry computed above stays here.
		const glyphs = (attr: string): string => (
			`<text class="crm-rs__w-ghost-number" x="${numRight}" y="${numY}" text-anchor="end" font-size="${numFs}" ${attr}>${value}</text>`
			+ `<text class="crm-rs__w-ghost-percent" x="${pctRight}" y="${pctY}" text-anchor="end" font-size="${pctFs}" ${attr}>%</text>`
		);

		const wrap = Tag.render`<div class="crm-rs__w-ghost" aria-hidden="true"></div>`;

		if (this.#isBackgroundPaused)
		{
			Dom.addClass(wrap, '--paused');
		}

		this.#ghostNode = wrap;

		wrap.innerHTML = `
			<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
				<defs>
					<mask id="${maskId}" maskUnits="userSpaceOnUse">${glyphs('fill="#fff"')}</mask>
					<linearGradient id="${reflectionId}" x1="0" y1="0" x2=".75" y2="1">
						<stop offset="0" stop-color="#fff" stop-opacity="0"/>
						<stop offset=".24" stop-color="#fff" stop-opacity=".3"/>
						<stop offset=".46" stop-color="#fff" stop-opacity="0"/>
						<stop offset=".7" stop-color="#fff" stop-opacity=".195"/>
						<stop offset="1" stop-color="#fff" stop-opacity="0"/>
					</linearGradient>
				</defs>
				<g mask="url(#${maskId})">
					<rect class="crm-rs__w-ghost-sheen" x="${sheenX}" y="0" width="${sheenW}" height="${h}" fill="url(#${reflectionId})"/>
				</g>
			</svg>
		`;

		return wrap;
	}

	// Conversion moved out of the header into a gradient bar that sits above the table (first row),
	// with the period selector docked to its right side.
	#renderConversionBar(data: StatisticsData): HTMLElement
	{
		const conversion = formatConversionPercent(data.conversionByCount ?? 0, data.repeatSaleWinCount ?? 0);

		const infoIcon = new Icon({
			icon: Outline.INFO_CIRCLE,
			size: 16,
			color: '#ffffff',
		}).render();

		return Tag.render`
			<div class="crm-rs__w-conversion">
				<span class="crm-rs__w-conversion-label" data-testid="repeat-sale-widget-conversion">
					${Loc.getMessage('CRM_REPEAT_SALE_WIDGET_STATISTICS_POPUP_CONVERSION')} ${Text.encode(conversion.label)}
					<span
						class="crm-rs__w-conversion-hint"
						data-testid="repeat-sale-widget-conversion-hint"
						role="img"
						aria-label="${Loc.getMessage('CRM_REPEAT_SALE_WIDGET_STATISTICS_POPUP_CONVERSION_HINT')}"
						onmouseenter="${this.#showHint.bind(this)}"
						onmouseleave="${this.#hideHint.bind(this)}"
					>${infoIcon}</span>
				</span>
				<div
					class="crm-rs__w-period-selector"
					data-testid="repeat-sale-widget-period-selector"
					role="button"
					tabindex="0"
					onclick="${this.#onPeriodChange.bind(this, this.#periodType)}"
					onkeydown="${this.#onPeriodKeyDown.bind(this)}"
				>
					${this.#getSelectorTitle()}
					<span class="crm-rs__w-period-selector-icon"></span>
				</div>
			</div>
		`;
	}

	// The selector is a div, so the browser turns neither Enter nor Space into a click on its own.
	#onPeriodKeyDown(event: KeyboardEvent): void
	{
		if (event.key !== 'Enter' && event.key !== ' ')
		{
			return;
		}

		event.preventDefault();
		this.#onPeriodChange(this.#periodType);
	}

	#renderProcessRow(data: StatisticsData): HTMLElement
	{
		const count = data.repeatSaleProcessCount ?? 0;
		const segments = this.#getRowSegments(data, 'processCount');

		return this.#renderStatRow({
			testId: `${DEALS_IN_WORK_BASE_TEST_ID}-row`,
			titleCode: 'CRM_REPEAT_SALE_WIDGET_STATISTICS_POPUP_DEALS_IN_WORK',
			count,
			sum: data.repeatSaleProcessSum ?? 0,
			segments,
			countField: 'processCount',
			sumField: 'processSum',
			stageSemanticId: StageSemantic.Process,
			data,
			isBottomRow: false,
		});
	}

	#renderWinRow(data: StatisticsData): HTMLElement
	{
		const count = data.repeatSaleWinCount ?? 0;
		const segments = this.#getRowSegments(data, 'winCount');

		return this.#renderStatRow({
			testId: `${WON_DEALS_BASE_TEST_ID}-row`,
			titleCode: 'CRM_REPEAT_SALE_WIDGET_STATISTICS_POPUP_WIN_DEALS',
			count,
			sum: data.repeatSaleWinSum ?? 0,
			segments,
			countField: 'winCount',
			sumField: 'winSum',
			stageSemanticId: StageSemantic.Success,
			data,
			isBottomRow: true,
		});
	}

	// A group = the parent row + its (optionally hidden) scenarios block. Groups are separated by a 2px
	// gap; only the table's outer corners are rounded (top on the first row, bottom on the last visible row).
	#renderStatRow(config: StatRowConfig): HTMLElement
	{
		const {
			testId, titleCode, count, sum, segments, countField, sumField, stageSemanticId, data, isBottomRow,
		} = config;

		const baseTestId = testId.replace(/-row$/, '');
		const isExpanded = this.#expandedSegmentRows.has(baseTestId);
		// Built once here and handed down ready (for this row) or as a factory (for each segment row below),
		// so the segments/segment-item layers don't need to drag `data` and `stageSemanticId` around just to reach it.
		const buildFilterOptions = (segmentIds) => this.#buildDealFilterOptions(segmentIds, stageSemanticId, data);

		const segmentsRow = this.#renderSegmentsRow({
			testId: `${baseTestId}-segments`,
			segments,
			countField,
			sumField,
			buildFilterOptions,
			isExpanded,
		});

		const dealFilterOptions = buildFilterOptions(data.repeatSaleSegmentIds ?? []);

		const { root: row, titleCell, countCell, sumCell } = Tag.render`
			<div class="crm-rs__w-row --parent" data-testid="${testId}">
				<span class="crm-rs__w-row-name" data-testid="${baseTestId}-name" ref="titleCell">${Loc.getMessage(titleCode)}</span>
				<span class="crm-rs__w-row-count" data-testid="${baseTestId}-count" ref="countCell">${count}</span>
				<span class="crm-rs__w-row-sum" data-testid="${baseTestId}-sum" ref="sumCell">${sum}</span>
			</div>
		`;

		if (segmentsRow !== null)
		{
			// With a breakdown the whole row toggles the group, while the data cells open the slider and
			// stop propagation so they do not toggle it. The chevron toggles as well.
			const toggleContext = {
				baseTestId,
				row,
				segmentsRow,
				shiftsBottomRadius: isBottomRow,
				toggle: null,
			};

			Dom.append(
				this.#renderSegmentsToggle({ testId: `${baseTestId}-toggle`, isExpanded, toggleContext }),
				titleCell,
			);

			Dom.addClass(row, '--expandable');
			Event.bind(row, 'click', (event) => this.#toggleSegments(event, toggleContext));

			[titleCell, countCell, sumCell].forEach((cell) => {
				this.#bindDealFilter(cell, dealFilterOptions, count, true);
			});
		}
		else
		{
			// With no breakdown there is nothing to toggle, so the whole row opens the slider.
			this.#bindDealFilter(row, dealFilterOptions, count);
		}

		// Top group rounds the table's top corners; the bottom group rounds the bottom - and that bottom
		// rounding lives on whatever is actually last (the parent row when collapsed, the scenarios block when open).
		if (isBottomRow)
		{
			const bottomTarget = (segmentsRow !== null && isExpanded) ? segmentsRow : row;
			Dom.addClass(bottomTarget, '--round-bottom');
		}
		else
		{
			Dom.addClass(row, '--round-top');
		}

		const group = Tag.render`<div class="crm-rs__w-statgroup"></div>`;
		Dom.append(row, group);
		if (segmentsRow !== null)
		{
			Dom.append(segmentsRow, group);
		}

		return group;
	}

	// Only segments with a non-zero count in this row's own column are worth showing in its breakdown,
	// ordered by that same column - the backend sorts by total count, which is a different order.
	#getRowSegments(data: StatisticsData, countField: string): SegmentStat[]
	{
		const stats = data.repeatSaleSegmentStats ?? [];

		return stats
			.filter((segment) => (segment[countField] ?? 0) > 0)
			.sort((a, b) => (b[countField] ?? 0) - (a[countField] ?? 0));
	}

	#renderSegmentsRow(config: SegmentsRowConfig): ?HTMLElement
	{
		const { testId, segments, countField, sumField, buildFilterOptions, isExpanded } = config;

		if (segments.length === 0)
		{
			return null;
		}

		// The inner wrapper carries overflow:hidden so the height animates through grid-template-rows
		// 0fr to 1fr on the .crm-rs__w-scenarios grid container (see widget.css).
		const row = Tag.render`
			<div class="crm-rs__w-scenarios" data-testid="${testId}">
				<div class="crm-rs__w-scenarios-inner">
					${segments.map((segment) => this.#renderSegmentItem({
						segment,
						countField,
						sumField,
						buildFilterOptions,
					}))}
				</div>
			</div>
		`;

		if (isExpanded)
		{
			Dom.addClass(row, '--expanded');
		}

		this.#setSegmentsRowReachable(row, isExpanded);

		return row;
	}

	// Collapsing only takes the height away, so without this the hidden scenario rows keep their place in
	// the Tab order and stay readable by a screen reader.
	#setSegmentsRowReachable(segmentsRow: HTMLElement, reachable: boolean): void
	{
		Dom.attr(segmentsRow, 'inert', reachable ? null : true);
		Dom.attr(segmentsRow, 'aria-hidden', reachable ? null : 'true');
	}

	#renderSegmentItem(config: SegmentItemConfig): HTMLElement
	{
		const { segment, countField, sumField, buildFilterOptions } = config;

		const gotoIcon = new Icon({
			icon: Outline.GO_TO_XS,
			size: 20,
			color: '#ffffff',
		}).render();

		const item = Tag.render`
			<div class="crm-rs__w-scenario" data-testid="repeat-sale-widget-segment-row">
				<span class="crm-rs__w-scenario-name">
					<span class="crm-rs__w-scenario-title">${Text.encode(segment.title ?? '')}</span>
					<span class="crm-rs__w-scenario-goto">${gotoIcon}</span>
				</span>
				<span class="crm-rs__w-scenario-count">${segment[countField] ?? 0}</span>
				<span class="crm-rs__w-scenario-sum">${segment[sumField] ?? 0}</span>
			</div>
		`;

		return this.#bindSegmentDealFilter(item, buildFilterOptions([segment.id]));
	}

	#renderChevron(isExpanded: boolean): HTMLElement
	{
		return new Icon({
			icon: isExpanded ? Outline.CHEVRON_TOP_XS : Outline.CHEVRON_DOWN_XS,
			size: 20,
			color: '#ffffff',
		}).render();
	}

	#renderSegmentsToggle(config: SegmentsToggleConfig): HTMLElement
	{
		const { testId, isExpanded, toggleContext } = config;

		// The chevron carries no text of its own, so the name says which list it opens; the state stays
		// on aria-expanded and the name does not have to change with it.
		const toggle = Tag.render`
			<span
				class="crm-rs__w-toggle"
				data-testid="${testId}"
				role="button"
				tabindex="0"
				aria-label="${Loc.getMessage('CRM_REPEAT_SALE_WIDGET_STATISTICS_POPUP_SEGMENTS_TOGGLE')}"
				aria-expanded="false"
				onclick="${(event) => this.#toggleSegments(event, toggleContext)}"
				onkeydown="${(event) => this.#onToggleKeyDown(event, toggleContext)}"
			>${this.#renderChevron(isExpanded)}</span>
		`;

		// Both toggle handlers, on the chevron and on the whole row, need it to swap the glyph.
		toggleContext.toggle = toggle;

		if (isExpanded)
		{
			Dom.addClass(toggle, '--expanded');
			Dom.attr(toggle, 'aria-expanded', 'true');
		}

		return toggle;
	}

	// The toggle sits inside a row that itself applies the deal filter on click - it must not bubble into that handler.
	#toggleSegments(event: Event, context: SegmentsToggleContext): void
	{
		event.stopPropagation();

		const { baseTestId, row, segmentsRow, shiftsBottomRadius, toggle } = context;
		const expand = !Dom.hasClass(segmentsRow, '--expanded');

		Dom.toggleClass(segmentsRow, '--expanded', expand);
		Dom.toggleClass(toggle, '--expanded', expand);
		Dom.attr(toggle, 'aria-expanded', expand ? 'true' : 'false');
		this.#setSegmentsRowReachable(segmentsRow, expand);

		// Swap the AIR chevron glyph itself (top when open, down when closed) rather than rotating one icon.
		Dom.clean(toggle);
		Dom.append(this.#renderChevron(expand), toggle);

		if (expand)
		{
			this.#expandedSegmentRows.add(baseTestId);
		}
		else
		{
			this.#expandedSegmentRows.delete(baseTestId);
		}

		if (shiftsBottomRadius)
		{
			Dom.toggleClass(row, '--round-bottom', !expand);
			Dom.toggleClass(segmentsRow, '--round-bottom', expand);
		}
	}

	// Space scrolls and Enter can submit a form by default - both are suppressed since this activates the toggle instead.
	#onToggleKeyDown(event: KeyboardEvent, context: SegmentsToggleContext): void
	{
		if (event.key !== 'Enter' && event.key !== ' ')
		{
			return;
		}

		event.preventDefault();
		this.#toggleSegments(event, context);
	}

	#bindDealFilter(
		element: HTMLElement,
		dealFilterOptions: DealFilterOptions,
		count: number,
		stopPropagation: boolean = false,
	): HTMLElement
	{
		if (count <= 0 || !canFilterDeals(dealFilterOptions.segmentIds) || !hasDealFilterTarget(dealFilterOptions))
		{
			return element;
		}

		Dom.addClass(element, '--clickable');

		const applyFilter = () => {
			this.#sendDealFilterAnalytics(dealFilterOptions.stageSemanticId, false);

			// The popup stays open behind the slider (see isAutoHidePopup) to return to once it closes.
			applyDealFilter(dealFilterOptions);
		};

		Event.bind(element, 'click', (event) => {
			// Cells of a parent row sit inside the toggling row, so the click must not reach it.
			if (stopPropagation)
			{
				event.stopPropagation();
			}

			applyFilter();
		});

		// The title cell of an expandable row already holds the chevron toggle: giving the cell a button
		// role of its own would nest one control inside another. The filter stays reachable from the
		// keyboard through the count and sum cells of the same row.
		if (element.querySelector('[role="button"], button, a') === null)
		{
			this.#bindKeyboardActivation(element, applyFilter);
		}

		return element;
	}

	// Enter and Space on a span or a div produce no click, and Space scrolls the popup by default.
	#bindKeyboardActivation(element: HTMLElement, activate: Function): void
	{
		Dom.attr(element, 'role', 'button');
		Dom.attr(element, 'tabindex', '0');

		Event.bind(element, 'keydown', (event: KeyboardEvent) => {
			if (event.key !== 'Enter' && event.key !== ' ')
			{
				return;
			}

			event.preventDefault();
			event.stopPropagation();
			activate();
		});
	}

	// A segment row filters deals by that one segment only, unlike the parent row which filters by every segment
	// in `data.repeatSaleSegmentIds` (all segments of the period, not just the ones shown in its own breakdown,
	// which hides segments with a zero count in that column) - the rest of the filter options are shared.
	#bindSegmentDealFilter(item: HTMLElement, dealFilterOptions: DealFilterOptions): HTMLElement
	{
		if (!canFilterDeals(dealFilterOptions.segmentIds) || !hasDealFilterTarget(dealFilterOptions))
		{
			return item;
		}

		Dom.addClass(item, '--clickable');

		const applySegmentFilter = () => {
			this.#sendDealFilterAnalytics(dealFilterOptions.stageSemanticId, true);

			// The popup stays open behind the slider.
			applyDealFilter(dealFilterOptions);
		};

		Event.bind(item, 'click', applySegmentFilter);
		this.#bindKeyboardActivation(item, applySegmentFilter);

		return item;
	}

	#buildDealFilterOptions(segmentIds: number[], stageSemanticId: string, data: StatisticsData): DealFilterOptions
	{
		return {
			segmentIds,
			stageSemanticId,
			createdFrom: data.repeatSalePeriodStartDate ?? null,
			dealListUrl: this.params.dealListUrl ?? null,
		};
	}

	// Filter behind the header totals: every segment of the period and no stage filter at all.
	// todayOnly narrows it down to the deals created today.
	#buildTotalsFilterOptions(data: StatisticsData, todayOnly: boolean): DealFilterOptions
	{
		return {
			segmentIds: data.repeatSaleSegmentIds ?? [],
			stageSemanticId: null,
			createdFrom: data.repeatSalePeriodStartDate ?? null,
			dealListUrl: this.params.dealListUrl ?? null,
			todayOnly,
		};
	}

	#sendDealFilterAnalytics(stageSemanticId: ?string, isSegmentRow: boolean): void
	{
		// The header totals span every stage, and the analytics contract names the stage rows only - counting
		// their clicks as deals in work would put a different set of deals into that row's own metric.
		if (!Type.isStringFilled(stageSemanticId))
		{
			return;
		}

		const isSuccess = stageSemanticId === StageSemantic.Success;
		const element = isSegmentRow
			? (isSuccess ? 'won_deals_segment' : 'deals_in_work_segment')
			: (isSuccess ? 'won_deals' : 'deals_in_work');

		const eventBuilder = this.#getClickEventBuilder();
		eventBuilder.setElement(element);
		eventBuilder.setPeriod(this.#periodType);
		sendData(eventBuilder.buildData());
	}

	#renderTotals(data: StatisticsData): HTMLElement
	{
		const repeatSaleForPeriodText = Tag.render`
			<span data-testid="repeat-sale-widget-totals-period">
				${Loc.getMessagePlural(
					'CRM_REPEAT_SALE_WIDGET_STATISTICS_POPUP_TITLE_TOTAL_DEALS',
					data.repeatSaleTotalCount ?? 0,
					{
						'#COUNT#': data.repeatSaleTotalCount ?? 0,
					},
				)}
			</span>
		`;
		// The total count opens every repeat-sale deal of the period.
		this.#bindDealFilter(repeatSaleForPeriodText, this.#buildTotalsFilterOptions(data, false), data.repeatSaleTotalCount ?? 0);

		const repeatSaleTodayCount = data.repeatSaleTodayCount ?? 0;

		let repeatSaleTodayText = null;
		if (repeatSaleTodayCount > 0)
		{
			repeatSaleTodayText = Tag.render`
				<span data-testid="repeat-sale-widget-totals-today">
					${Loc.getMessagePlural(
						'CRM_REPEAT_SALE_WIDGET_STATISTICS_POPUP_TITLE_TODAY_DEALS',
						data.repeatSaleTodayCount ?? 0,
						{
							'#COUNT#': data.repeatSaleTodayCount ?? 0,
						},
					)}
				</span>
			`;
			// The today count opens the deals created today.
			this.#bindDealFilter(repeatSaleTodayText, this.#buildTotalsFilterOptions(data, true), repeatSaleTodayCount);
		}
		else
		{
			const todayNoDealsMessage = Loc.getMessage('CRM_REPEAT_SALE_WIDGET_STATISTICS_POPUP_TITLE_TODAY_NO_DEALS');
			if (todayNoDealsMessage)
			{
				repeatSaleTodayText = Tag.render`<span data-testid="repeat-sale-widget-totals-today">${todayNoDealsMessage}</span>`;
			}
		}

		return Tag.render`
			<div class="crm-rs__w-body-statistics-totals" data-testid="repeat-sale-widget-totals">
				${repeatSaleForPeriodText}
				${repeatSaleTodayText}
			</div>
		`;
	}

	#getPopupTitle(data: StatisticsData): HTMLElement
	{
		return Tag.render`
			<div class="crm-rs__w-header-main">
				<div class="crm-rs__w-header-title">${Loc.getMessage('CRM_REPEAT_SALE_WIDGET_STATISTICS_POPUP_TITLE')}</div>
				${this.#renderTotals(data)}
			</div>
		`;
	}

	#getSelectorTitle(): string
	{
		let code = null;

		switch (this.#periodType)
		{
			case PeriodType.day30:
				code = 'CRM_REPEAT_SALE_WIDGET_STATISTICS_POPUP_PERIOD_DAY_30';
				break;
			case PeriodType.quarter:
				code = 'CRM_REPEAT_SALE_WIDGET_STATISTICS_POPUP_PERIOD_QUARTER';
				break;
			case PeriodType.halfYear:
				code = 'CRM_REPEAT_SALE_WIDGET_STATISTICS_POPUP_PERIOD_HALF_YEAR';
				break;
			case PeriodType.year:
				code = 'CRM_REPEAT_SALE_WIDGET_STATISTICS_POPUP_PERIOD_YEAR';
				break;
			default:
				throw new RangeError(`Unknown period type: ${this.#periodType}`);
		}

		return Loc.getMessage(code);
	}

	#getFooterContent(): HTMLElement
	{
		const footer = new Footer({
			showSettingsButton: this.#showSettingsButton,
			analytics: {
				type: this.getAnalyticsType(),
				subSection: this.getAnalyticsSubSection(),
			},
			isGlowingSettingsButton: this.#isGlowingSettingsButton,
		});

		return footer.getFooterContent();
	}

	getAnalyticsType(): string
	{
		return Dictionary.TYPE_REPEAT_SALE_BANNER_STATISTICS;
	}

	getFetchUrl(): string
	{
		return 'crm.repeatsale.statistics.getData';
	}

	getFetchParams(): Object
	{
		return {
			periodType: this.#periodType,
		};
	}

	#onPeriodChange(periodTypeId: number): void
	{
		let nextPeriodTypeId = PeriodType.day30;

		const periodTypeIds = Object.values(PeriodType);

		if (periodTypeIds.includes(periodTypeId))
		{
			const index = periodTypeIds.indexOf(periodTypeId);
			if (index + 1 < periodTypeIds.length)
			{
				nextPeriodTypeId = index + 1;
			}
		}

		this.#savePeriodTypeId(nextPeriodTypeId);

		const data = {
			periodTypeId: nextPeriodTypeId,
		};

		const eventBuilder = this.#getClickEventBuilder();
		eventBuilder.setElement('change_period');
		eventBuilder.setPeriod(nextPeriodTypeId);
		sendData(eventBuilder.buildData());

		// @todo maybe pointless loader
		// const popup = PopupManager.getPopupById(`crm_repeat_sale_widget_${this.getType()}`);
		// if (popup)
		// {
		// 	popup.setContent(this.#getLoadingPopupContent());
		// }

		Ajax
			.runAction(this.getFetchUrl(), { data })
			.then(
				(response) => {
					if (response.status === 'success')
					{
						const popup = PopupManager.getPopupById(`crm_repeat_sale_widget_${this.getType()}`);
						if (popup === null)
						{
							return;
						}

						this.data = response.data;
						this.#periodType = nextPeriodTypeId;

						popup.setContent(this.getPopupContent(this.data));

						return;
					}

					this.showError();
				},
				(response) => {
					//popup.setContent(this.getPopupContent(this.data));
					this.showError();
				},
			)
			.catch((response) => {
				//popup.setContent(this.getPopupContent(this.data));
				this.showError();
			})
		;
	}

	#savePeriodTypeId(periodTypeId: PeriodType.day30 | PeriodType.quarter | PeriodType.halfYear | PeriodType.year): void
	{
		UserOptions.save('crm', 'repeat-sale', 'statistics-period-type-id', periodTypeId);
	}

	#showHint(event: Event): void
	{
		this.#getHintInstance().show(
			event.currentTarget,
			Loc.getMessage('CRM_REPEAT_SALE_WIDGET_STATISTICS_POPUP_CONVERSION_HINT'),
			true,
		);
	}

	#hideHint(): void
	{
		this.#getHintInstance().hide();
	}

	#getHintInstance(): Manager
	{
		if (this.#hint === null)
		{
			this.#hint = BX.UI.Hint.createInstance({
				popupParameters: {
					autoHide: true,
					events: {
						onFirstShow: (event) => {
							event.getCompatData()[0].setOffset({ offsetLeft: 9 });
						},
					},
				},
			});
		}

		return this.#hint;
	}

	#getClickEventBuilder(): Builder.RepeatSale.Banner.ClickEvent
	{
		const type = this.getAnalyticsType();
		const subSection = this.getAnalyticsSubSection();

		return Builder.RepeatSale.Banner.ClickEvent.createDefault(type, subSection);
	}
}

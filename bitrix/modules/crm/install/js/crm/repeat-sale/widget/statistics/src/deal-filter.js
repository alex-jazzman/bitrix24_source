import { Extension, Page, Reflection, Type } from 'main.core';

export const StageSemantic = Object.freeze({
	Process: 'P',
	Success: 'S',
});

export type DealFilterOptions = {
	segmentIds: number[],
	// null = no stage filter at all, which is what the header totals need.
	stageSemanticId: ?string,
	createdFrom: ?string,
	dealListUrl: ?string,
	// true = keep only the deals created today, for the today total.
	todayOnly?: boolean,
};

const SegmentField = 'REPEAT_SALE_SEGMENT_ID';
const StageSemanticField = 'STAGE_SEMANTIC_ID';
// The date of the deal, the same one the statistics count by - the log row of a repeat sale is written
// after its deal, so a boundary taken from the log would not match the list this filter opens.
const CreatedField = 'DATE_CREATE';
const DateRangeType = 'RANGE';
const DateCurrentDayType = 'CURRENT_DAY';
const RepeatSaleWidgetDealGridParameter = 'repeatSaleWidgetDealGrid';

// Ids come from the server as numbers; anything else would reach the grid as a bogus filter value
// (e.g. 'undefined'), which silently yields zero deals instead of leaving the row non-clickable.
export function canFilterDeals(segmentIds: number[]): boolean
{
	return Type.isArrayFilled(segmentIds) && segmentIds.every((segmentId) => Type.isNumber(segmentId));
}

export function hasDealFilterTarget(options: DealFilterOptions): boolean
{
	return Type.isStringFilled(resolveDealListUrl(options.dealListUrl));
}

export function applyDealFilter(options: DealFilterOptions): void
{
	if (!canFilterDeals(options.segmentIds))
	{
		return;
	}

	const fields = buildFields(options);
	const url = buildDealListUrl(fields, options.dealListUrl);

	if (!url)
	{
		return;
	}

	// The filtered deal list opens in a slider over the section, without a reload.
	const sidePanel = Reflection.getClass('BX.SidePanel.Instance');
	if (sidePanel)
	{
		// The slider animates in with a CSS transition, and opening it synchronously from the click
		// handler can skip the initial off-screen frame, leaving it without animation.
		requestAnimationFrame(() => sidePanel.open(url, {
			width: 1215,
			cacheable: false,
			allowChangeHistory: false,
		}));

		return;
	}

	// Without a slider the deal list opens in a new tab, so that the page the widget was called from
	// stays where it was.
	Page.redirect(url, { newTab: true });
}

function buildFields(options: DealFilterOptions): Object
{
	const fields = {
		[SegmentField]: options.segmentIds.map((segmentId) => String(segmentId)),
	};

	// The totals span every stage, so the stage field goes in only when one is set.
	if (Type.isStringFilled(options.stageSemanticId))
	{
		fields[StageSemanticField] = [options.stageSemanticId];
	}

	if (options.todayOnly === true)
	{
		fields[`${CreatedField}_datesel`] = DateCurrentDayType;
		// Main\UI\Filter\Options::fetchSettingsFromQuery() keeps a date field only when a boundary
		// parameter comes along with _datesel, so the empty one is what lets CURRENT_DAY through.
		fields[`${CreatedField}_from`] = '';
	}
	else if (Type.isStringFilled(options.createdFrom))
	{
		fields[`${CreatedField}_datesel`] = DateRangeType;
		fields[`${CreatedField}_from`] = options.createdFrom;
	}

	return fields;
}

function resolveDealListUrl(dealListUrl: ?string): ?string
{
	if (Type.isStringFilled(dealListUrl))
	{
		return dealListUrl;
	}

	return Extension.getSettings('crm.repeat-sale.widget.statistics').get('dealListUrl');
}

function buildDealListUrl(fields: Object, dealListUrl: ?string): ?string
{
	const resolvedUrl = resolveDealListUrl(dealListUrl);
	if (!Type.isStringFilled(resolvedUrl))
	{
		return null;
	}

	const url = new URL(resolvedUrl, window.location.origin);
	url.searchParams.set('apply_filter', 'Y');
	url.searchParams.set(RepeatSaleWidgetDealGridParameter, 'Y');

	Object.entries(fields).forEach(([name, value]) => {
		if (Type.isArray(value))
		{
			value.forEach((item) => url.searchParams.append(`${name}[]`, item));

			return;
		}

		url.searchParams.set(name, value);
	});

	return url.toString();
}

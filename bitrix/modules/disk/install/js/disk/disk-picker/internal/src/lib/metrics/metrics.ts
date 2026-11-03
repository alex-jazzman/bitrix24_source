// The advance of a virtualised row — its own height plus the air below it — is declared once,
// in picker-layout.css, and read back here. Before this module the same numbers lived twice:
// as lengths in the stylesheets and as constants beside the virtual scroll. A row that grew in
// the stylesheet left the scroll counting the old advance, and nothing said so — the list stayed
// upright and simply put the rows in the wrong places, further off with every group.
//
// The defaults repeat the declarations only as a fallback: a component mounted outside the
// layout (a unit test, a fragment on a showcase page) has nothing to read them from.

export type PickerMetrics = {
	listRow: number,
	groupTitle: number,
	tableRow: number,
	sourceRow: number,
	sourceGroup: number,
};

const METRIC_PROPERTIES: { [key in keyof PickerMetrics]: string } = {
	listRow: '--disk-picker-list-row-advance',
	groupTitle: '--disk-picker-group-title-advance',
	tableRow: '--disk-picker-table-row-advance',
	sourceRow: '--disk-picker-source-row-advance',
	sourceGroup: '--disk-picker-source-group-advance',
};

export const DEFAULT_METRICS: PickerMetrics = {
	listRow: 48,
	groupTitle: 36,
	tableRow: 48,
	sourceRow: 48,
	sourceGroup: 46,
};

function readLength(style: CSSStyleDeclaration, property: string, fallback: number): number
{
	const value = Number.parseFloat(style.getPropertyValue(property));

	// The properties are registered as <length> in picker-layout.css, so calc() and var() arrive
	// resolved to px; an invalid value falls to the registered initial 0px.
	return Number.isFinite(value) && value > 0 ? value : fallback;
}

// Reads the advances off the layout the element stands in. Anything unreadable keeps its
// default, so a component outside the layout still scrolls by the numbers the design has.
export function readMetrics(element: Element | null): PickerMetrics
{
	const layout = element?.closest('.disk-picker-layout');
	if (!layout)
	{
		return { ...DEFAULT_METRICS };
	}

	const style = getComputedStyle(layout);

	return {
		listRow: readLength(style, METRIC_PROPERTIES.listRow, DEFAULT_METRICS.listRow),
		groupTitle: readLength(style, METRIC_PROPERTIES.groupTitle, DEFAULT_METRICS.groupTitle),
		tableRow: readLength(style, METRIC_PROPERTIES.tableRow, DEFAULT_METRICS.tableRow),
		sourceRow: readLength(style, METRIC_PROPERTIES.sourceRow, DEFAULT_METRICS.sourceRow),
		sourceGroup: readLength(style, METRIC_PROPERTIES.sourceGroup, DEFAULT_METRICS.sourceGroup),
	};
}

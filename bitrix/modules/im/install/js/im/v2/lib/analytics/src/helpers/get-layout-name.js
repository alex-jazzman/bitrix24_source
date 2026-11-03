import { Layout, type LayoutType } from 'im.v2.const';

export type AnalyticsLayoutName = LayoutType | typeof PROJECT_LAYOUT_NAME;

const PROJECT_LAYOUT_NAME = 'project';

export function getLayoutName(layout: LayoutType): AnalyticsLayoutName
{
	// The projects section is named 'collab' inside the app; analytics reports it as a project.
	if (layout === Layout.collab)
	{
		return PROJECT_LAYOUT_NAME;
	}

	return layout;
}

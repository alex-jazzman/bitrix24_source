import { Loc, Text } from 'main.core';

export class ViewsBlock
{
	constructor(viewsCountRaw: any)
	{
		this.viewsCountRaw = viewsCountRaw;
	}

	getCount(): number
	{
		return Math.max(0, Text.toNumber(this.viewsCountRaw));
	}

	render(): string
	{
		const viewsCount = this.getCount();
		const viewsTitle = Loc.getMessage('BICONNECTOR_APACHESUPERSET_DASHBOARD_DETAIL_INFO_VIEWS_TITLE') ?? '';

		return `
			<span class="report__views" title="${Text.encode(viewsTitle)}">
				<div class="ui-icon-set --o-observer"></div>
				${viewsCount}
			</span>
		`;
	}
}

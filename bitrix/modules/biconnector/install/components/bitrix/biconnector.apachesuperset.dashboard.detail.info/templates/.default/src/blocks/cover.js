import { Text, Type } from 'main.core';
import { normalizeImageUrl } from '../image-url';

type CoverOptions = {
	icon: any,
	dashboardType: string,
	emptyIconPath: string,
	marketBackgroundPath: string,
};

export class CoverBlock
{
	constructor(options: CoverOptions)
	{
		this.icon = options.icon;
		this.dashboardType = options.dashboardType;
		this.emptyIconPath = options.emptyIconPath;
		this.marketBackgroundPath = options.marketBackgroundPath;
	}

	static getRandomMarketBackgroundPath(isMarketModuleInstalled: boolean): string
	{
		if (!isMarketModuleInstalled)
		{
			return '';
		}

		const maxBackgrounds = 30;
		const backgroundIndex = Math.floor(Math.random() * maxBackgrounds) + 1;

		return `/bitrix/js/market/images/backgrounds/${backgroundIndex}.png`;
	}

	static isMarketDashboardType(dashboardType: string): boolean
	{
		return dashboardType === 'MARKET' || dashboardType === 'SYSTEM';
	}

	render(): string
	{
		const safeImageUrl = normalizeImageUrl(this.icon);
		if (Type.isStringFilled(safeImageUrl))
		{
			const safeIcon = Text.encode(safeImageUrl);
			if (CoverBlock.isMarketDashboardType(this.dashboardType))
			{
				const coverStyle = this.marketBackgroundPath
					? ` style="--report-market-background-image: url('${Text.encode(this.marketBackgroundPath)}');"`
					: ''
				;

				return `
					<div class="report__cover report__cover--market"${coverStyle}>
						<img class="report__cover-image report__cover-image--market" src="${safeIcon}" alt=""/>
					</div>
				`;
			}

			return `
				<div class="report__cover">
					<img class="report__cover-image" src="${safeIcon}" alt=""/>
				</div>
			`;
		}

		const safeIconPath = Text.encode(this.emptyIconPath);

		return `
			<div class="report__cover">
				<div class="report__cover-empty">
					<img class="report__cover-empty-image" src="${safeIconPath}" alt=""/>
				</div>
			</div>
		`;
	}
}

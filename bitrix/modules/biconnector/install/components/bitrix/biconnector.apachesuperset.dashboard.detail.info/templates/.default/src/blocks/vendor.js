import { Loc, Text, Type } from 'main.core';

export class VendorBlock
{
	constructor(partnerName: string, dashboardType: string)
	{
		this.partnerName = partnerName;
		this.dashboardType = dashboardType;
	}

	getLabel(): string
	{
		if (this.dashboardType === 'CUSTOM')
		{
			return this.getCustomDashboardLabel();
		}

		if (!Type.isStringFilled(this.partnerName))
		{
			return '';
		}

		return Loc.getMessage(
			'BICONNECTOR_APACHESUPERSET_DASHBOARD_DETAIL_INFO_VENDOR',
			{ '#PARTNER_NAME#': Text.encode(this.partnerName) },
		) ?? '';
	}

	getCustomDashboardLabel(): string
	{
		return Loc.getMessage('BICONNECTOR_APACHESUPERSET_DASHBOARD_DETAIL_INFO_CUSTOM_VENDOR') ?? '';
	}

	render(): string
	{
		const vendorLabel = this.getLabel();

		if (!Type.isStringFilled(vendorLabel))
		{
			return '';
		}

		return `<span>${vendorLabel}</span>`;
	}
}

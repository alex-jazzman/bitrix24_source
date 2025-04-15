import { Loc } from 'main.core';
import { PurchaseTileAnnual } from './purchase-tile-annual';

export class PurchaseTileAiCopilotAnnualToken extends PurchaseTileAnnual
{
	getLeftUnitsLabel(): string
	{
		return Loc.getMessage('BAAS_WIDGET_AI_PURCHASE_LEFT');
	}
}

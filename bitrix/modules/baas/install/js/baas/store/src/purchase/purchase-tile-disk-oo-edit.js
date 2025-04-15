import { Loc } from 'main.core';
import { PurchaseTileDefault } from './purchase-tile-default';

export class PurchaseTileDiskOoEdit extends PurchaseTileDefault
{
	getLeftUnitsLabel(): string
	{
		return Loc.getMessage('BAAS_WIDGET_AI_PURCHASE_LEFT');
	}
}

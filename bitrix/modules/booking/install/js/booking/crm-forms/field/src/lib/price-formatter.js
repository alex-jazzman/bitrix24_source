import type { Sku } from '../types';

export function formatPrice(sku: Sku): string
{
	if (typeof sku.price !== 'number' || Number.isNaN(sku.price))
	{
		return '';
	}

	const currency = (sku.currencyFormat || '').split(' ')?.[1] || '';

	return `${sku.price} ${currency}`;
}

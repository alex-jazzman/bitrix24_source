import { Type } from 'main.core';
import { GridTokenCssVar, HoursInDay } from './const';

import { type BaseTokenKey, type TokenKey, type TokenState } from './types';

class GridTokens
{
	#tokens: ?TokenState = null;

	async init(baseElement: HTMLElement): Promise<void>
	{
		if (!Type.isDomNode(baseElement))
		{
			throw new Error('Booking.GridTokens: baseElement is incorrect');
		}

		const computedStyles = getComputedStyle(baseElement);

		const tokens = {};
		for (const tokenKey of Object.keys(GridTokenCssVar))
		{
			tokens[tokenKey] = this.#parseToken(computedStyles, tokenKey);
		}

		tokens.WeekHourWidth = tokens.WeekCellWidth / HoursInDay;
		this.#tokens = tokens;
	}

	get(key: TokenKey): number
	{
		if (this.#tokens === null)
		{
			throw new Error('Booking.GridTokens: is not initialized');
		}

		return this.#tokens[key];
	}

	#parseToken(computedStyles: CSSStyleDeclaration, tokenKey: BaseTokenKey): number
	{
		const cssVar = GridTokenCssVar[tokenKey];

		const rawValue = computedStyles.getPropertyValue(cssVar).trim();
		if (rawValue === '')
		{
			throw new Error(`Booking.GridTokens: token ${cssVar} is not defined`);
		}

		const parsedValue = Number.parseFloat(rawValue);
		if (!Number.isFinite(parsedValue))
		{
			throw new TypeError(`Booking.GridTokens: token ${cssVar} is incorrect`);
		}

		return parsedValue;
	}
}

export const gridTokens = new GridTokens();

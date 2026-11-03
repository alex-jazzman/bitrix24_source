import { Type } from 'main.core';

import { type MarketDemoOnboardingVariant } from './types';

export const MARKET_COLLECTION_URL = '/market/collection/21378528/';
export const AI_GUIDE_SLIDER_CODE = 'bitrixgpt_guide';

export const VARIANT_A: MarketDemoOnboardingVariant = 'variant_a';
export const VARIANT_B: MarketDemoOnboardingVariant = 'variant_b';

export function isMarketDemoOnboardingVariant(value: unknown): value is MarketDemoOnboardingVariant
{
	return Type.isString(value) && (value === VARIANT_A || value === VARIANT_B);
}

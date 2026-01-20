import { Tag, Loc } from 'main.core';
import { DiscountEar } from './discount-ear';

export class DiscountEarSubscription extends DiscountEar
{
	constructor(props)
	{
		super(props);

		this.discountPercentage = props?.discountPercentage ?? null;
		this.termsUrl = props?.termsUrl ?? null;
		this.isRenamedMarket = props?.isRenamedMarket ?? false;
	}

	getContainer(): HTMLElement
	{
		this.container ??= Tag.render`
			<aside class="rest-market-expired-popup__discount rest-market-expired-popup__discount--subscription">
				${this.#renderDiscountPercent()}
				<p class="rest-market-expired-popup__discount-description">
					${this.#getDescription()}
				</p>
				${this.#renderTermsOfPromotion()}
			</aside>
		`;

		return this.container;
	}

	#getDescription(): string
	{
		return this.isRenamedMarket
			? Loc.getMessage('REST_MARKET_EXPIRED_POPUP_DISCOUNT_SUBSCRIPTION_DESCRIPTION_BITRIX_GPT')
			: Loc.getMessage('REST_MARKET_EXPIRED_POPUP_DISCOUNT_SUBSCRIPTION_DESCRIPTION_MARKET_PLUS');
	}

	#renderDiscountPercent(): HTMLElement
	{
		if (this.discountPercentage)
		{
			return Tag.render`
				<p class="rest-market-expired-popup__discount-percentage">
					- ${this.discountPercentage}%
				</p>
			`;
		}

		return '';
	}

	#renderTermsOfPromotion(): HTMLElement
	{
		if (this.termsUrl)
		{
			return Tag.render`
				<a href="${this.termsUrl}" target="_blank" class="ui-link rest-market-expired-popup__discount-terms">
					${Loc.getMessage('REST_MARKET_EXPIRED_POPUP_TERMS_OF_PROMOTION')}
				</a>
			`;
		}

		return '';
	}
}

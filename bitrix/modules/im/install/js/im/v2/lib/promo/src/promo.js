import { Core } from 'im.v2.application.core';
import { type PromoId } from 'im.v2.const';
import { Logger } from 'im.v2.lib.logger';
import { type PromotionUpdatedParams, type PromoParams, type RawPromoData } from 'im.v2.provider.pull';

import { Promo } from './classes/promo';
import { PromoService } from './classes/promo-service';

export class PromoManager
{
	static #instance: PromoManager;

	#promoList: Promo[];
	#claimedPromos: Promo[] = [];

	static getInstance(): PromoManager
	{
		if (!this.#instance)
		{
			this.#instance = new this();
		}

		return this.#instance;
	}

	static init()
	{
		PromoManager.getInstance();
	}

	constructor()
	{
		const { promoList = [] } = Core.getApplicationData();
		Logger.warn('PromoManager: promoList', promoList);
		this.#init(promoList);
	}

	needToShow(promoId: $Values<typeof PromoId>, promoParams: PromoParams = {}): boolean
	{
		const promo = new Promo(promoId, promoParams);

		return Boolean(this.#get(promo)) && !this.#hasClaimed(promo);
	}

	confirmShown(promoId: $Values<typeof PromoId>, promoParams: PromoParams = {}): boolean
	{
		const promo = new Promo(promoId, promoParams);
		if (!this.#get(promo) || this.#hasClaimed(promo))
		{
			return false;
		}

		this.#claimedPromos.push(promo);
		this.#remove(promo);
		void PromoService.markAsWatched(promo);

		return true;
	}

	async markAsWatched(promoId: $Values<typeof PromoId>, promoParams: PromoParams = {}): Promise<void>
	{
		const promo = new Promo(promoId, promoParams);

		if (this.#get(promo))
		{
			await PromoService.markAsWatched(promo);
			this.#remove(promo);
		}
	}

	onPromotionUpdated(params: PromotionUpdatedParams): void
	{
		const deletedPromotions: Promo[] = params.deletedPromotions.map(
			(promoData: RawPromoData) => Promo.createFromRawPromoData(promoData),
		);

		this.#removeByPromotionList(deletedPromotions);

		const addedPromotions: Promo[] = params.addedPromotions
			.map((promoData: RawPromoData) => Promo.createFromRawPromoData(promoData))
			.filter((promo: Promo) => !this.#hasClaimed(promo))
		;

		this.#promoList = [...this.#promoList, ...addedPromotions];
	}

	#init(promoList: RawPromoData[]): void
	{
		this.#promoList = promoList.map((promoData: RawPromoData) => Promo.createFromRawPromoData(promoData));
	}

	#get(promo: Promo): ?Promo
	{
		return this.#promoList.find((item: Promo) => item.isEqual(promo));
	}

	#hasClaimed(promo: Promo): boolean
	{
		return this.#claimedPromos.some((claimedPromo: Promo) => claimedPromo.isEqual(promo));
	}

	#remove(promo: Promo): void
	{
		this.#promoList = this.#promoList.filter((item: Promo) => !item.isEqual(promo));
	}

	#removeByPromotionList(promoList: Promo[]): void
	{
		this.#promoList = this.#promoList.filter((promo: Promo) => {
			const deletedPromo = promoList.find((deleted: Promo) => deleted.id === promo.id);
			if (!deletedPromo)
			{
				return true;
			}

			if (deletedPromo.isEmptyParams())
			{
				return false;
			}

			return !promo.isEqual(deletedPromo);
		});
	}
}

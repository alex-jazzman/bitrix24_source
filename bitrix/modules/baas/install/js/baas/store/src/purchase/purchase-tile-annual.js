import { Tag, Loc, Type } from 'main.core';
import { DateTimeFormat } from 'main.date';
import { ResponsePurchasedPackageDataType, ServiceInPurchasedPackageType } from '../types/response-purchased-package-data-type';
import { PurchaseTileDefault } from './purchase-tile-default';

export class PurchaseTileAnnual extends PurchaseTileDefault
{
	#prepareActiveAndFuturePurchases(purchasedPackages: ResponsePurchasedPackageDataType[]): Object
	{
		const rawActivePacks = {};
		const rawInactivePacks = {};
		let expirationDateObj = new Date();

		purchasedPackages
			.forEach(
				(rawPack: ResponsePurchasedPackageDataType) => {
					const actual = (rawPack.actual === 'Y' || rawPack.actual === true);
					const pack = { ...rawPack };
					if (actual)
					{
						const expDateActive = DateTimeFormat.parse(rawPack.expirationDate, false, this.FORMAT_DATE).getTime();
						rawActivePacks[expDateActive] = rawActivePacks[expDateActive] ?? [];
						rawActivePacks[expDateActive].push(pack);
					}
					else
					{
						const startDate = DateTimeFormat.parse(rawPack.startDate, false, this.FORMAT_DATE).getTime();
						rawInactivePacks[startDate] = rawInactivePacks[startDate] ?? [];
						rawInactivePacks[startDate].push(pack);
					}

					const expDate = DateTimeFormat.parse(rawPack.expirationDate, false, this.FORMAT_DATE);

					if (expDate > expirationDateObj)
					{
						expirationDateObj = expDate;
					}
				},
			)
		;

		const result = {
			expirationDate: DateTimeFormat.format(DateTimeFormat.getFormat('LONG_DATE_FORMAT'), expirationDateObj),
		};

		const activePackKeys = Object.keys(rawActivePacks);
		if (activePackKeys.length > 0)
		{
			result.active = {
				current: 0,
				maximal: 0,
				expirationDateObject: new Date(),
				expirationDate: '',
			};
			activePackKeys
				.forEach(
					(key) => {
						const packs = rawActivePacks[key];
						packs
							.forEach((pack) => {
								Object
									.keys(pack.services)
									.forEach((serviceCode: string) => {
										const service: ServiceInPurchasedPackageType = pack.services[serviceCode];
										result.active.current += parseInt(service.current, 10);
										result.active.maximal += parseInt(service.maximal, 10);
									})
								;
								const expDateActive = DateTimeFormat.parse(pack.expirationDate, false, this.FORMAT_DATE);

								if (result.active.expirationDateObject < expDateActive)
								{
									result.active.expirationDateObject = expDateActive;
								}
							})
						;
					},
				)
			;
			result.active.expirationDate = DateTimeFormat.format(
				DateTimeFormat.getFormat('DAY_MONTH_FORMAT'),
				result.active.expirationDateObject,
			);
		}
		else
		{
			result.next = {
				current: 0,
				maximal: 0,
				startDateObject: new Date(),
				startDate: '',
			};

			const inactivePackKeys = Object
				.keys(rawInactivePacks)
				.sort((a, b) => {
					return a < b ? -1 : 1;
				})
			;
			const firstDate = inactivePackKeys[0];
			const futurePacks = rawInactivePacks[firstDate];

			futurePacks
				.forEach((pack) => {
					Object
						.keys(pack.services)
						.forEach((serviceCode: string) => {
							const service: ServiceInPurchasedPackageType = pack.services[serviceCode];
							result.next.current += parseInt(service.current, 10);
							result.next.maximal += parseInt(service.maximal, 10);
						})
					;
					result.next.startDate = pack.startDate;
				})
			;
		}

		return result;
	}

	getContainer(): HTMLElement
	{
		const packageInfo = this.#prepareActiveAndFuturePurchases(this.getGroupedPurchases());

		const count = this.getGroupedPurchases().length;
		const modifiedClass = count > 2 ? '--more' : '--two';
		const current = packageInfo.active ? packageInfo.active.current : packageInfo.next.current;
		const maximal = packageInfo.active ? packageInfo.active.maximal : packageInfo.next.maximal;
		const theDate = packageInfo.active ? packageInfo.active.expirationDate : packageInfo.next.startDate;
		const expirationDate = packageInfo.expirationDate;

		return Tag.render`
			<div class="ui-popupcomponentmaker__content--section ${modifiedClass}">
				<div class="ui-popupcomponentmaker__content--section-item">
					<div class="ui-popupconstructor-content-item-wrapper">
						<div class="ui-popupconstructor-content-item-wrapper_information">
							<div class="ui-popupconstructor-content-item-wrapper-title">
								<div class="ui-popupconstructor-content-item__title">
									${Loc.getMessage('BAAS_WIDGET_PURCHASE_TITLE')}
								</div>
								<div class="ui-popupconstructor-content-item-subject">
									<div class="ui-label ui-label-success ui-label-sm --active ui-label-fill">
										<div class="ui-label-status"></div>
										<span class="ui-label-inner">${Loc.getMessage('BAAS_WIDGET_PURCHASE_IS_ACTIVE')}</span>
									</div>
								</div>
							</div>
							<div class="ui-popupconstructor-content-item-progressbar">${this.createProgressBar(current, maximal).getContainer()}</div>
							${packageInfo.active ? Tag.render`
								<div class="ui-popupconstructor-content-item-limit">
									<span>${this.getLeftUnitsLabel()} </span>
										${Loc.getMessage('BAAS_WIDGET_PURCHASE_LEFT_STATUS', {
										'#left#': `<span class="ui-popupconstructor-content-item-num">${current}</span>`,
										'#total#': `<span class="ui-popupconstructor-content-item-num">${maximal}</span>`,
										'#date#': `<span class="ui-popupconstructor-content-item-date">${theDate}</span>`,
									})}
								</div>` : Tag.render`
								<div class="ui-popupconstructor-content-item-limit">
									<span>${this.getFutureUnitsLabel()} </span>
										${Loc.getMessage('BAAS_WIDGET_PURCHASE_WILL_BE_AVAILABLE_STATUS', {
											'#left#': `<span class="ui-popupconstructor-content-item-num">${current}</span>`,
											'#total#': `<span class="ui-popupconstructor-content-item-num">${maximal}</span>`,
											'#date#': `<span class="ui-popupconstructor-content-item-date">${theDate}</span>`,
										})}
								</div>
							`}
							<div class="ui-popupconstructor-content-item-limit">
							${Loc.getMessage('BAAS_WIDGET_PURCHASE_ANNUAL_LIFETIME', {
								'#date#': `<span class="ui-popupconstructor-content-item-date">${expirationDate}</span>`,
							})}
							</div>
						</div>
					</div>
				</div>
			</div>`
		;
	}

	getFutureUnitsLabel(): string
	{
		return Loc.getMessage('BAAS_WIDGET_PURCHASES_FUTURE_UNITS');
	}
}

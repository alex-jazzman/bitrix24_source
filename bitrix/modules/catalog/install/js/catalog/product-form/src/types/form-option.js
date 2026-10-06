import { FormElementPosition } from './form-element-position';
import type { BasketItem } from './basket-item';
import type { BasketMeasure } from './basket-measure';
import type { DiscountTypes } from 'catalog.product-calculator';
import { FormInputCode } from './form-input-code';
import type { FormCompilationOption } from './form-compilation-option';
import { FormCompilationType } from './form-compilation-type';
import { FormErrorCode } from './form-error-code';

export type TaxRate = {
	taxId: number,
	value: number | null,
};

export type FormOption = {
	basket: Array<BasketItem>,
	measures: Array<BasketMeasure>,
	iblockId?: number,
	basePriceId?: number,
	taxRateList?: Array<TaxRate>,
	currencySymbol?: string,
	singleProductMode: boolean,
	showResults: boolean,
	showCompilationModeSwitcher: boolean,
	disabledCompilationModeSwitcher: boolean,
	enableEmptyProductError: boolean,
	enableCatalogSaving: boolean,
	currency?: string,
	pricePrecision: number,
	displayPrecision: number,
	allowedDiscountTypes: Array<DiscountTypes>,
	taxIncluded: 'Y' | 'N',
	showDiscountBlock: 'Y' | 'N',
	showTaxBlock: 'Y' | 'N',
	showTaxSettingsSwitcher: 'Y' | 'N',
	newItemPosition: FormElementPosition,
	buttonsPosition: FormElementPosition,
	visibleBlocks: Array<FormInputCode>,
	validationCodes: Array<FormErrorCode>,
	requiredFields: Array<FormErrorCode>,
	editableFields: Array<FormInputCode>,
	urlBuilderContext: string,
	hideUnselectedProperties: boolean,
	compilationFormType: FormCompilationType,
	compilationFormOption: FormCompilationOption,
	isBlockedExistedPrice: boolean,
	isCatalogHidden: boolean,
	isCatalogDiscountSetEnabled: boolean,
	isCatalogPriceEditEnabled: boolean,
	isCatalogPriceSaveEnabled: boolean,
	fieldHints: {},
	ownerId: ?number,
	ownerTypeId: ?number,
	dialogId: ?string,
	sessionId: ?number,
};

import { Analytics } from '../analytics';

export type FeaturePromoterConfiguration = {
	code?: string,
	featureId?: string,
	bindElement?: HTMLElement,
	analytics?: Analytics,
}

export type PopupProviderConfiguration = {
	code: string,
	featureId: string,
	bindElement: HTMLElement,
	dataSource?: Promise,
}

export type ProviderRequestFactoryConfiguration = {
	code?: string,
	featureId?: string,
	type: string,
}
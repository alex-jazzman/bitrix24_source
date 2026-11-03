import { type SliderOptions } from 'main.sidepanel';

export type SidePanelLinkOptions = Readonly<Pick<
	SliderOptions,
	'cacheable' | 'allowChangeHistory' | 'width' | 'customLeftBoundary'
>>;

export const sidePanelOptionsByNavigationId: Readonly<Record<string, SidePanelLinkOptions>> = {
	'business-processes': { cacheable: false, allowChangeHistory: false },
	currencies: { cacheable: false },
	taxes: { cacheable: false, allowChangeHistory: false },
	'product-properties': { cacheable: false, allowChangeHistory: false },
	'mail-sendsave': { cacheable: false, allowChangeHistory: false },
	'sms-marketplace': { cacheable: false, customLeftBoundary: 0 },
	'document-numerators': { cacheable: false, allowChangeHistory: false },
	'smart-invoice-numerator': { width: 480 },
	'legacy-invoice-numerator': { width: 480 },
	'quote-numerator': { width: 480 },
	'payment-systems': { cacheable: false, allowChangeHistory: false },
	'requisite-templates': { cacheable: false, allowChangeHistory: false },
	'external-sale': { cacheable: false, allowChangeHistory: false },
	'exchange-1c': { cacheable: false, allowChangeHistory: false },
	locations: { cacheable: false, customLeftBoundary: 40 },
	directories: { cacheable: false, allowChangeHistory: false, customLeftBoundary: 40 },
	pipelines: { cacheable: false, allowChangeHistory: false, customLeftBoundary: 40 },
	'user-fields': { cacheable: false, allowChangeHistory: false },
	'analytics-reports': { cacheable: false },
	'crm-volume': { cacheable: false, allowChangeHistory: false },
};

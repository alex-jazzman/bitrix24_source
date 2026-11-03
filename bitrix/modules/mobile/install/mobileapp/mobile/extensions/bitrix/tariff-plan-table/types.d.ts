import { BaseTariffPlanWindowProps } from '../tariff-plan-checkout/types';

export type TariffPlanTableProps = BaseTariffPlanWindowProps & {
	tariffFocus?: 'upsell' | null,
};

export type TariffPlanTableOptions = {
	parentWidget?: LayoutWidget,
	tariffFocus?: 'upsell' | null,
};

import { IntegrationMapItemCode, IntegrationMapItemStatus } from 'booking.const';

export type SaleChannelsState = {
	formsMenu: FormsMenu;
	integrations: IntegrationItem[];
	isFetching: boolean;
	isLoaded: boolean;
}

export type FormsMenu = {
	canEdit: boolean;
	createFormLink: string;
	formList: FormsMenuItem[];
	formsListLink: string;
}

export type FormsMenuItem = {
	id: number;
	name: string;
	editUrl: string;
	publicUrl: string;
}

export type IntegrationItem = {
	code: $Values<typeof IntegrationMapItemCode>;
	status: $Values<typeof IntegrationMapItemStatus> | null;
}

export type SetIntegrationStatusPayload = {
	code: $Values<typeof IntegrationMapItemCode>;
	status: $Values<typeof IntegrationMapItemStatus>;
}

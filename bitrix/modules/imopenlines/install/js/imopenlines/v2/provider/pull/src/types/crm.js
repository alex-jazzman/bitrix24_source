import { type RawCrm } from 'imopenlines.v2.provider.service';

export type CrmUpdateParams = {
	dialogId: string,
	crm: RawCrm,
};

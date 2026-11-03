import { ajax, Type } from 'main.core';

import { DictionaryField, type DictionaryItem } from './dictionary-field';

const companyListActionName = 'sign.api_v1.document.listB2eCompanies';
const menuIdPrefix = 'sign-b2e-configure-activity';

type ActivityOptions = {
	formName: string,
	company: Object,
	provider: Object,
	messages: Object,
};

async function loadCompanyItems(): Promise<?Array<DictionaryItem>>
{
	try
	{
		const { data } = await ajax.runAction(companyListActionName, {});
		const showTaxId = data?.showTaxId === true;
		const companies = Type.isArray(data?.companies) ? data.companies : [];

		return companies.map((company): DictionaryItem => {
			const value = String(company.id);
			const title = String(company.title ?? '').trim() || value;
			const taxId = String(company.taxId ?? '').trim();

			return {
				value,
				name: showTaxId && taxId !== '' ? `${title} (${taxId})` : title,
			};
		});
	}
	catch (response)
	{
		console.error(response?.errors ?? response);

		return null;
	}
}

export class SignB2EDocumentConfigureActivity
{
	#fields: Array<DictionaryField>;

	constructor(options: ActivityOptions)
	{
		if (!Type.isStringFilled(options?.formName))
		{
			throw new Error('formName must be filled string');
		}

		const messages = options.messages ?? {};
		const providerItems = Type.isArray(options.provider?.items) ? options.provider.items : [];

		this.#fields = [
			new DictionaryField({
				fieldName: options.company?.fieldName,
				containerNode: options.company?.containerNode,
				menuId: `${menuIdPrefix}-${options.formName}-company`,
				emptyText: messages.emptyCompanyList,
				errorText: messages.companyListError,
				loadItems: loadCompanyItems,
			}),
			new DictionaryField({
				fieldName: options.provider?.fieldName,
				containerNode: options.provider?.containerNode,
				menuId: `${menuIdPrefix}-${options.formName}-provider`,
				loadItems: () => Promise.resolve(providerItems),
			}),
		];
	}

	init(): void
	{
		this.#fields.forEach((field: DictionaryField) => field.init());
	}
}

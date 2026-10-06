import { Loc, Type } from 'main.core';

import type {
	SignatureMacroCatalogDto,
	SignatureMacroCatalogGroup,
	SignatureMacroCatalogItem,
} from './types';

const SUPPORTED_VERSION = 1;

export class SignatureMacroCatalog
{
	#groups: SignatureMacroCatalogGroup[];
	#tokens: Set<string>;

	private constructor(groups: SignatureMacroCatalogGroup[])
	{
		this.#groups = groups;
		this.#tokens = new Set(
			groups.flatMap((group: SignatureMacroCatalogGroup) => {
				return group.items.map((item: SignatureMacroCatalogItem) => item.token);
			}),
		);
	}

	static fromDto(dto: unknown): SignatureMacroCatalog | null
	{
		if (!Type.isPlainObject(dto))
		{
			return null;
		}

		const catalogDto = dto as SignatureMacroCatalogDto;
		if (String(catalogDto.version) !== String(SUPPORTED_VERSION) || !Type.isArrayFilled(catalogDto.groups))
		{
			return null;
		}

		const tokens = new Set<string>();
		const groups: SignatureMacroCatalogGroup[] = [];
		for (const groupDto of catalogDto.groups)
		{
			if (
				!Type.isPlainObject(groupDto)
				|| !Type.isStringFilled(groupDto.id)
				|| !Type.isArrayFilled(groupDto.items)
			)
			{
				return null;
			}

			const items: SignatureMacroCatalogItem[] = [];
			for (const itemDto of groupDto.items)
			{
				if (
					!Type.isPlainObject(itemDto)
					|| !Type.isStringFilled(itemDto.id)
					|| !Type.isStringFilled(itemDto.token)
					|| !Type.isStringFilled(itemDto.labelKey)
					|| tokens.has(itemDto.token)
				)
				{
					return null;
				}

				tokens.add(itemDto.token);
				items.push({
					id: itemDto.id,
					token: itemDto.token,
					labelKey: itemDto.labelKey,
					label: Loc.getMessage(itemDto.labelKey) ?? '',
				});
			}

			groups.push({
				id: groupDto.id,
				label: Loc.getMessage(`MAIL_SIGNATURE_MACRO_GROUP_${groupDto.id.toUpperCase()}`) ?? '',
				items,
			});
		}

		return new SignatureMacroCatalog(groups);
	}

	getGroups(): SignatureMacroCatalogGroup[]
	{
		return this.#groups;
	}

	getTokens(): Set<string>
	{
		return new Set(this.#tokens);
	}
}

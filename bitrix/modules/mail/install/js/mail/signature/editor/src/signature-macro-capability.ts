import { Dom, Loc, Text } from 'main.core';
import { Button, ButtonColor } from 'ui.buttons';

import type {
	SignatureEditorContext,
	SignatureMacroCapabilityOptions,
	SignatureMacroCatalogGroup,
	SignatureMacroCatalogItem,
} from './types';

type MenuItemOptions = {
	id: string,
	title: string,
	sectionCode: string,
	onClick: () => void,
};

type MenuSectionOptions = {
	code: string,
	title: string,
};

export type SignatureMacroMenuOptions = {
	sections: MenuSectionOptions[],
	items: MenuItemOptions[],
	closeOnItemClick: boolean,
};

export function buildSignatureMacroMenuOptions(
	groups: SignatureMacroCatalogGroup[],
	onSelect: (item: SignatureMacroCatalogItem) => void,
): SignatureMacroMenuOptions
{
	return {
		sections: groups.map((group: SignatureMacroCatalogGroup) => ({
			code: group.id,
			title: group.label,
		})),
		items: groups.flatMap((group: SignatureMacroCatalogGroup) => {
			return group.items.map((item: SignatureMacroCatalogItem) => ({
				id: item.id,
				title: item.label,
				sectionCode: group.id,
				onClick: () => onSelect(item),
			}));
		}),
		closeOnItemClick: true,
	};
}

export function findFirstUnknownMacro(template: string, knownTokens: Set<string>): string | null
{
	let offset = 0;
	while (offset < template.length)
	{
		const start = template.indexOf('{{', offset);
		if (start === -1)
		{
			return null;
		}

		const end = template.indexOf('}}', start + 2);
		if (end === -1)
		{
			return template.slice(start);
		}

		const construction = template.slice(start, end + 2);
		if (!knownTokens.has(construction))
		{
			return construction;
		}

		offset = end + 2;
	}

	return null;
}

export class SignatureMacroCapability
{
	#options: SignatureMacroCapabilityOptions;
	#context: SignatureEditorContext | null = null;
	#button: Button | null = null;

	constructor(options: SignatureMacroCapabilityOptions)
	{
		this.#options = options;
	}

	connect(context: SignatureEditorContext): void
	{
		this.disconnect();
		this.#context = context;
		this.#button = new Button({
			text: Loc.getMessage('MAIL_SIGNATURE_MACRO_ADD') ?? '',
			color: ButtonColor.LIGHT_BORDER,
			noCaps: true,
			systemMenu: buildSignatureMacroMenuOptions(
				this.#options.catalog.getGroups(),
				(item: SignatureMacroCatalogItem) => this.#insert(item),
			),
		} as unknown as ConstructorParameters<typeof Button>[0]);
		this.#button.renderTo(this.#options.actionContainer);
	}

	beforeSave(): boolean
	{
		if (!this.#context)
		{
			return true;
		}

		const unknown = findFirstUnknownMacro(
			this.#context.editor.getContent(),
			this.#options.catalog.getTokens(),
		);
		if (unknown !== null)
		{
			this.#context.showError(
				Loc.getMessage('MAIL_SIGNATURE_MACRO_UNKNOWN', { '#TOKEN#': Text.encode(unknown) }) ?? '',
			);

			return false;
		}

		this.#context.clearError();

		return true;
	}

	disconnect(): void
	{
		if (this.#button)
		{
			this.#button.setSystemMenu(false);
			Dom.remove(this.#button.getContainer());
		}

		this.#button = null;
		this.#context = null;
	}

	#insert(item: SignatureMacroCatalogItem): void
	{
		if (!this.#context)
		{
			return;
		}

		this.#context.editor.insertHtml(item.token);
		this.#context.editor.focus();
	}
}

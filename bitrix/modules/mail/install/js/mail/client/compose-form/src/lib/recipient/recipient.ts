/**
 * Must stay the context of the old form: the providers answer requests by it and the recent addresses are
 * stored under it, so a context of our own would show an empty recent list.
 */
export const RecipientDialogContext = 'MAIN_MAIL_FROM';

/** Module filters that reshape the items of the `crm` and user providers. */
const CrmAppearanceFilter = 'mail.mailCrmRecipientAppearanceFilter';
const UserAppearanceFilter = 'mail.mailUserRecipientAppearanceFilter';

const CrmEntity = Object.freeze(['contact', 'company', 'lead'] as const);

/**
 * A recipient is read off the item and never off its tag: `Item.createTag()` keeps the rendered parts only
 * and leaves the custom data empty.
 */
export type SelectorItem = {
	getId(): number | string,
	getEntityId(): string,
	getCustomData(): Map<string, unknown>,
	getAvatar(): string | null,
};

export type RecipientEntityFilter = {
	id: string,
};

export type RecipientEntityConfig = {
	id: string,
	dynamicLoad?: boolean,
	dynamicSearch?: boolean,
	filters?: RecipientEntityFilter[],
	options?: Record<string, unknown>,
};

export type RecipientElement = {
	id: number | string,
	entityId: string,
	avatar?: string,
	customData: Record<string, unknown>,
};

/**
 * The custom data is copied whole: the send hands it over to CRM as it came, and nothing describes what the
 * keys beyond the three it reads are, so none of them may be renamed or dropped here.
 */
export function toRecipientElement(item: SelectorItem): RecipientElement
{
	const avatar = item.getAvatar();

	return {
		id: item.getId(),
		entityId: item.getEntityId(),
		...(avatar ? { avatar } : {}),
		customData: Object.fromEntries(item.getCustomData()),
	};
}

/**
 * Deduplicated by `entityId` and `id`: the picker replaces a tag on a repeated pick, and the field follows.
 * The keys already taken are held in a set: the field is rebuilt on every tag added and removed, and a tariff
 * without a limit on the row leaves the length of the list to the user.
 */
export function toRecipientElements(items: SelectorItem[]): RecipientElement[]
{
	const elements: RecipientElement[] = [];
	const known = new Set<string>();

	items.forEach((item) => {
		const element = toRecipientElement(item);
		const key = `${element.entityId}:${String(element.id)}`;

		if (!known.has(key))
		{
			known.add(key);
			elements.push(element);
		}
	});

	return elements;
}

function getCrmEntities(): RecipientEntityConfig[]
{
	return CrmEntity.map((entityId): RecipientEntityConfig => {
		return {
			id: entityId,
			dynamicLoad: true,
			dynamicSearch: true,
			filters: [{ id: CrmAppearanceFilter }],
			options: { onlyWithEmail: true },
		};
	});
}

/**
 * The set of sources the mail context of `main.mail.form` uses: address book, CRM entities carrying an
 * address, the tab gathering them, and portal users. Every field gets the same set; the CRM contexts of that
 * form are not ported.
 */
export function getRecipientEntities(): RecipientEntityConfig[]
{
	return [
		{ id: 'address_book', dynamicLoad: true },
		...getCrmEntities(),
		{ id: 'mail_crm_recipient', dynamicLoad: true },
		{
			id: 'user',
			filters: [{ id: UserAppearanceFilter }],
			options: { showInvitationFooter: false, onlyWithEmail: true },
		},
	];
}

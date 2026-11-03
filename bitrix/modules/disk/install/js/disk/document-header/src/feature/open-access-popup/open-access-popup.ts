import { Reflection, Runtime, Type } from 'main.core';

import { type InfoHelper, loadInfoHelper } from '../../lib/deferred-ui/deferred-ui';
import { type CompositionModel, type ObjectType } from '../../model/composition/types';

/** The value the server gives the access control of an opening closed by the tariff of the portal. */
const BLOCKED_BY_FEATURE = 'blocked-by-feature';

/**
 * The slider which tells about the restriction, one per kind of object: a board is closed by the
 * tariff of its links, a document by the one of sharing files.
 */
const RestrictionSlider: Record<ObjectType, string> = Object.freeze({
	board: 'limit_office_share_file',
	document: 'limit_office_files_access_permissions',
});

type AccessPopupParams = {
	objectId: number,
	uniqueCode: string | null,
};

type AccessPopupDialog = {
	open: (params: AccessPopupParams) => Promise<void>,
};

type SharingAccessPopupExtension = {
	SharingPopupDialog: new () => AccessPopupDialog,
};

let dialog: AccessPopupDialog | null = null;
let opening: Promise<void> | null = null;

/**
 * The access of the opening as the composition describes it. An opening whose sharing the tariff of
 * the portal closed answers with the slider of that restriction and opens no popup - the previous
 * shells of both editors kept the button and answered the same way.
 */
export async function openAccess(composition: CompositionModel): Promise<void>
{
	if (composition.access.controlType === BLOCKED_BY_FEATURE)
	{
		await showRestriction(composition.objectType);

		return;
	}

	await openAccessPopup(composition.object.id, composition.object.uniqueCode);
}

/**
 * The restriction is told by the helpdesk of the portal, and the header may itself be opened inside
 * a slider: a slider of its own would then be drawn inside that one.
 */
async function showRestriction(objectType: ObjectType): Promise<void>
{
	const infoHelper = await resolveInfoHelper();

	infoHelper?.show(RestrictionSlider[objectType]);
}

/**
 * The helpdesk is taken from the page which owns the slider, and the pages of both office editors put
 * it there themselves. The page of the board carries none and is not opened inside a slider either, so
 * there is nothing above it to reach for: what the page does not have is asked for at this moment, and
 * the weight of it stays off every opening which never runs into a restriction.
 */
async function resolveInfoHelper(): Promise<InfoHelper | null>
{
	const present = (
		Reflection.getClass('top.BX.UI.InfoHelper') ?? Reflection.getClass('BX.UI.InfoHelper')
	) as unknown as InfoHelper | null;

	return present ?? loadInfoHelper();
}

/**
 * The header does not own the access popup: it loads `disk.sharing-access-popup` on demand and opens
 * it with the same parameters the editors pass today, changing neither its composition nor its rules.
 */
export async function openAccessPopup(objectId: number, uniqueCode: string): Promise<void>
{
	if (!Type.isNumber(objectId) || objectId <= 0)
	{
		return;
	}

	if (opening !== null)
	{
		await opening;

		return;
	}

	opening = openDialog(objectId, uniqueCode);

	try
	{
		await opening;
	}
	finally
	{
		opening = null;
	}
}

async function openDialog(objectId: number, uniqueCode: string): Promise<void>
{
	try
	{
		const extension = await Runtime.loadExtension('disk.sharing-access-popup') as unknown as SharingAccessPopupExtension;
		dialog ??= new extension.SharingPopupDialog();

		await dialog.open({
			objectId,
			uniqueCode: Type.isStringFilled(uniqueCode) ? uniqueCode : null,
		});
	}
	catch
	{
		// the popup reports its own failures; a failed load leaves the header intact and the next click retries
		dialog = null;
	}
}

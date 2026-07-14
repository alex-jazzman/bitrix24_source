import type { MailboxCrmOptionsResponse } from '../api';
import type { CrmSettingsState, ResponsibleQueueItem } from '../types';

function resolveYesNoFlag(value: boolean | string | null | undefined): boolean
{
	return value === true || value === 'Y';
}

function normalizeLeadCreationAddresses(rawValue: string | string[] | undefined): string
{
	if (Array.isArray(rawValue))
	{
		return rawValue.join('\n');
	}

	if (typeof rawValue !== 'string' || rawValue.length === 0)
	{
		return '';
	}

	return rawValue
		.split(/[,\n]/)
		.map((item) => item.trim())
		.filter(Boolean)
		.join('\n');
}

function mapResponsibleQueue(crm: MailboxCrmOptionsResponse): ResponsibleQueueItem[]
{
	const crmUsers = crm.config?.crm_lead_resp_users ?? [];
	const crmUserMap = new Map<number, string>(
		crmUsers.map((item) => [item.id, item.title]),
	);
	const ids = crm.leadResp ?? crm.config?.crm_lead_resp ?? [];

	return ids.map((id) => ({
		id,
		entityId: 'user',
		name: crmUserMap.get(id) ?? '',
	}));
}

export function mapMailboxCrmOptionsToStatePatch(
	crm: MailboxCrmOptionsResponse,
	currentState: CrmSettingsState,
): CrmSettingsState
{
	const config = crm.config ?? {};
	const syncDays = crm.syncDays ?? config.crm_sync_days;
	const incomingEntity = crm.newEntityIn ?? config.crm_new_entity_in ?? '';
	const outgoingEntity = crm.newEntityOut ?? config.crm_new_entity_out ?? '';
	const leadSource = crm.leadSource ?? config.crm_lead_source;
	const publicFlag = crm.public ?? config.crm_public;
	const enabled = resolveYesNoFlag(crm.enabled);

	return {
		enabled,
		sync: syncDays === null || syncDays === undefined
			? { ...currentState.sync }
			: {
				enabled: true,
				periodValue: String(syncDays),
			},
		assignKnownClientEmails: resolveYesNoFlag(publicFlag),
		vcf: config.crm_vcf === undefined
			? currentState.vcf
			: resolveYesNoFlag(config.crm_vcf),
		incoming: enabled
			? {
				enabled: Boolean(incomingEntity),
				createAction: incomingEntity || currentState.incoming.createAction,
			}
			: { ...currentState.incoming },
		outgoing: enabled
			? {
				enabled: Boolean(outgoingEntity),
				createAction: outgoingEntity || currentState.outgoing.createAction,
			}
			: { ...currentState.outgoing },
		source: leadSource || currentState.source,
		leadCreationAddresses: normalizeLeadCreationAddresses(
			crm.newLeadFor ?? config.crm_new_lead_for,
		),
		responsibleQueue: mapResponsibleQueue(crm),
	};
}

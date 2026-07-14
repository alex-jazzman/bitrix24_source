import assert from 'node:assert/strict';

import { mapSettingsConfigToState } from '../../../settings-config/src/index.ts';
import { mapMailboxCrmOptionsToStatePatch } from '../../src/utils/crm-options.ts';

function createCrmSettingsState(settingsConfig)
{
	const mapped = mapSettingsConfigToState(settingsConfig);

	return {
		enabled: mapped.crmEnabled,
		sync: {
			enabled: mapped.crmSyncEnabled,
			periodValue: mapped.crmSyncPeriod,
		},
		assignKnownClientEmails: mapped.crmAssignKnownClientEmails,
		incoming: {
			enabled: mapped.crmIncomingCreate,
			createAction: mapped.crmIncomingEntity,
		},
		outgoing: {
			enabled: mapped.crmOutgoingCreate,
			createAction: mapped.crmOutgoingEntity,
		},
		source: mapped.crmSource,
		leadCreationAddresses: '',
		responsibleQueue: [],
	};
}

const settingsConfig = {
	crmSyncIntervals: [
		{ value: 7 },
	],
	crmEntities: [
		{ value: 'LEAD' },
		{ value: 'CONTACT' },
	],
	crmSources: [
		{ value: 'EMAIL' },
	],
	defaults: {
		crmSyncPeriod: 7,
		crmIncomingEntity: 'LEAD',
		crmOutgoingEntity: 'CONTACT',
		crmSource: 'EMAIL',
	},
};

const currentState = createCrmSettingsState(settingsConfig);

assert.deepEqual(currentState, {
	enabled: false,
	sync: {
		enabled: true,
		periodValue: '7',
	},
	assignKnownClientEmails: true,
	incoming: {
		enabled: true,
		createAction: 'LEAD',
	},
	outgoing: {
		enabled: true,
		createAction: 'CONTACT',
	},
	source: 'EMAIL',
	leadCreationAddresses: '',
	responsibleQueue: [],
});

const patch = mapMailboxCrmOptionsToStatePatch({
	enabled: 'Y',
	config: {
		crm_sync_days: 7,
		crm_new_entity_in: '',
		crm_new_entity_out: '',
		crm_lead_source: 'EMAIL',
		crm_lead_resp: [],
		crm_new_lead_for: '',
		crm_public: 'N',
		crm_vcf: 'Y',
	},
}, currentState);

assert.deepEqual(patch.incoming, {
	enabled: false,
	createAction: 'LEAD',
});
assert.deepEqual(patch.outgoing, {
	enabled: false,
	createAction: 'CONTACT',
});
assert.equal(patch.assignKnownClientEmails, false);

const enabledPatch = mapMailboxCrmOptionsToStatePatch({
	enabled: 'Y',
	config: {
		crm_new_entity_in: 'CONTACT',
		crm_new_entity_out: 'LEAD',
		crm_public: 'Y',
	},
}, currentState);

assert.deepEqual(enabledPatch.incoming, {
	enabled: true,
	createAction: 'CONTACT',
});
assert.deepEqual(enabledPatch.outgoing, {
	enabled: true,
	createAction: 'LEAD',
});
assert.equal(enabledPatch.assignKnownClientEmails, true);

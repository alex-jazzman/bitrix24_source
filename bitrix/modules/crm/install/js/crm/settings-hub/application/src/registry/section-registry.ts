import { Loc } from 'main.core';

import { capabilityCatalog } from '../data/capability-catalog';
import {
	type CatalogSectionRegistration,
	type HubSectionRegistration,
} from '../model/types';
import { settingsSectionRegistry } from './settings-section-registry';

const capabilitiesSection: CatalogSectionRegistration = {
	id: 'capabilities',
	title: Loc.getMessage('CRM_SETTINGS_HUB_SECTION_CAPABILITIES_TITLE') ?? '',
	type: 'capabilities-catalog',
	catalog: capabilityCatalog,
};

export const sectionRegistry: readonly HubSectionRegistration[] = [
	capabilitiesSection,
	...settingsSectionRegistry,
];

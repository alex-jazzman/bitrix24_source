import { type SettingsSectionRegistration } from '../model/types';
import { accessSection } from './section/access';
import { activitiesSection } from './section/activities';
import { automationSection } from './section/automation';
import { catalogSection } from './section/catalog';
import { clientsSection } from './section/clients';
import { commsSection } from './section/comms';
import { copilotSection } from './section/copilot';
import { docsSection } from './section/docs';
import { historySection } from './section/history';
import { integrationsSection } from './section/integrations';
import { interfaceSection } from './section/interface';
import { legacySection } from './section/legacy';
import { restSection } from './section/rest';
import { salesSection } from './section/sales';

export const settingsSectionRegistry: readonly SettingsSectionRegistration[] = [
	salesSection,
	clientsSection,
	activitiesSection,
	automationSection,
	copilotSection,
	commsSection,
	docsSection,
	catalogSection,
	accessSection,
	integrationsSection,
	interfaceSection,
	historySection,
	restSection,
	legacySection,
];

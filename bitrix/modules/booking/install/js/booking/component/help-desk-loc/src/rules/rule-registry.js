import { HelpDeskRule } from './helpdesk-rule';
import { NoWrapRule } from './nowrap-rule';
import { BrRule } from './br-rule';

export const ruleRegistry = {
	helpdesk: {
		name: 'helpdesk',
		component: HelpDeskRule,
	},
	nowrap: {
		name: 'nowrap',
		component: NoWrapRule,
	},
	br: {
		name: 'br',
		component: BrRule,
	},
};

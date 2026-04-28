import { BuilderModel } from 'ui.vue3.vuex';

import { SessionsModel } from '../sessions/sessions';
import { RecentModel } from '../recent/recent';
import { QueueModel } from '../queue/queue';
import { ConnectorModel } from '../connector/connector';
import { CrmModel } from '../crm/crm';
import { CurrentSessionModel } from '../current-session/current-session';

export class OpenLinesModel extends BuilderModel
{
	getName(): string
	{
		return 'openLines';
	}

	getNestedModules(): { [moduleName: string]: BuilderModel }
	{
		return {
			sessions: SessionsModel,
			recent: RecentModel,
			queue: QueueModel,
			connector: ConnectorModel,
			crm: CrmModel,
			currentSession: CurrentSessionModel,
		};
	}
}

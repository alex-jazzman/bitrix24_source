import { BuilderModel } from 'ui.vue3.vuex';

import { SessionsModel } from '../sessions/sessions';
import { RecentModel } from '../recent/recent';
import { QueueModel } from '../queue/queue';
import { ConnectorModel } from '../connector/connector';
import { CrmModel } from '../crm/crm';
import { CrmFormModel } from '../crm-form/crm-form';
import { CurrentSessionModel } from '../current-session/current-session';
import { QuickReplyModel } from '../quick-reply/quick-reply';

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
			crmForm: CrmFormModel,
			currentSession: CurrentSessionModel,
			quickReply: QuickReplyModel,
		};
	}
}

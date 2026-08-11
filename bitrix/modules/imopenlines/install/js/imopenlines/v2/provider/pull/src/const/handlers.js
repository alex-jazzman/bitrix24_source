import { LinesPullHandler } from '../recent/recent';
import { SessionPullHandler } from '../session/session';
import { QueuePullHandler } from '../queue/queue';
import { CrmPullHandler } from '../crm/crm';
import { ConnectorPullHandler } from '../connector/connector';

export const OpenLinesHandlers = [
	LinesPullHandler,
	SessionPullHandler,
	QueuePullHandler,
	CrmPullHandler,
	ConnectorPullHandler,
];

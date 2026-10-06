import { Loc } from 'main.core';

import type { HandlerInterface } from './handler-interface';

export class TemplateStale implements HandlerInterface
{
	handle(): void
	{
		BX.UI.Notification.Center.notify({
			content: Loc.getMessage('BIZPROC_AI_AGENTS_GRID_RESTART_ACTION_TEMPLATE_STALE_ERROR'),
		});
	}
}

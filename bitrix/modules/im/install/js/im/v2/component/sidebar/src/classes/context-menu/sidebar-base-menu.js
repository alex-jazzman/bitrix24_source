import { Loc } from 'main.core';

import { BaseMenu } from 'im.v2.lib.menu';
import { Notifier } from 'im.v2.lib.notifier';
import { EventType } from 'im.v2.const';

import type { EventEmitter } from 'main.core.events';
import type { MenuItemOptions, MenuOptions } from 'ui.system.menu';
import type { ApplicationContext } from 'im.v2.const';

export class SidebarMenu extends BaseMenu
{
	emitter: EventEmitter;

	constructor(applicationContext: ApplicationContext)
	{
		super();
		this.id = 'im-sidebar-context-menu';

		const { emitter } = applicationContext;
		this.emitter = emitter;
	}

	getMenuOptions(): MenuOptions
	{
		return {
			...super.getMenuOptions(),
			className: this.getMenuClassName(),
		};
	}

	getOpenContextMessageItem(): ?MenuItemOptions
	{
		if (!this.context.messageId || this.context.messageId === 0)
		{
			return null;
		}

		return {
			title: Loc.getMessage('IM_SIDEBAR_MENU_GO_TO_CONTEXT_MESSAGE'),
			onClick: () => {
				this.emitter.emit(EventType.dialog.goToMessageContext, {
					messageId: this.context.messageId,
					dialogId: this.context.dialogId,
				});

				this.menuInstance.close();
			},
		};
	}

	getCopyLinkItem(title: string): ?MenuItemOptions
	{
		if (!BX.clipboard.isCopySupported())
		{
			return null;
		}

		return {
			title,
			onClick: () => {
				if (BX.clipboard.copy(this.context.source))
				{
					Notifier.onCopyLinkComplete();
				}
				this.menuInstance.close();
			},
		};
	}
}

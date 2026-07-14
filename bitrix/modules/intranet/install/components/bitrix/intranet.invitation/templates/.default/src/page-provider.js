import { type BaseEvent, EventEmitter } from 'main.core.events';

import { PageFactory } from './page-factory';
import InviteType from './type/invite-type';
import { type PageOptions } from './type/page-options';

export class PageProvider
{
	#options: PageOptions;
	#pageFactory: PageFactory;
	#pages: Map;

	constructor(options: PageOptions, userOptions: Object)
	{
		this.#options = options;
		this.#pageFactory = new PageFactory(options, userOptions);
		this.#subscribeEvents();
	}

	provide(): Map
	{
		this.#pages = new Map();

		if (this.#options.canCurrentUserInvite)
		{
			this.#pages.set('invite', this.#pageFactory.createInvitePage(
				this.#options.smsAvailable
					? InviteType.ALL
					: InviteType.EMAIL,
			));
			this.#pages.set('add', this.#pageFactory.createRegisterPage());
			this.#pages.set('self', this.#options.isSelfRegisterEnabled
				? this.#pageFactory.createLinkPage()
				: this.#pageFactory.createLinkDisabledPage());
		}

		if (this.#options.isExtranetInstalled)
		{
			this.#pages.set('extranet', this.#pageFactory.createExtranetPage());
		}

		if (this.#options.isCloud && this.#options.canCurrentUserInvite)
		{
			this.#pages.set('integrator', this.#pageFactory.createIntegratorPage());
		}

		return this.#pages;
	}

	#subscribeEvents(): void
	{
		EventEmitter.subscribe('BX.Intranet.Invitation:selfChange', this.#onSelfRegisterChange.bind(this));
	}

	#onSelfRegisterChange(event: BaseEvent): void
	{
		if (!this.#pages)
		{
			return;
		}

		this.#pages.set(
			'self',
			event.data?.selfEnabled ? this.#pageFactory.createLinkPage() : this.#pageFactory.createLinkDisabledPage(),
		);

		EventEmitter.emit(EventEmitter.GLOBAL_TARGET, 'BX.Intranet.Invitation:pageUpdate', {
			pages: this.#pages,
		});
	}
}

import { ajax } from 'main.core';
import { BaseEvent, EventEmitter } from 'main.core.events';

import { Binding } from 'mail.client.binding';
import { MailboxSelector } from 'mail.client.mailboxselector';
import { ErrorBox } from 'mail.client.errorbox';
import { FilterToolbar } from 'mail.client.filtertoolbar';

export class Mailer
{
	#filter;
	#filterToolbar;
	#binding;
	#mailboxId;
	#mailboxGridButtonCounterRequest = null;
	#isMailboxGridButtonCounterRefreshQueued = false;
	focusReset = false;

	constructor(config = {
		filterId: '',
		mailboxId: 0,
		syncAvailable: true,
		configPath: '',
		mailboxSelectorConfig: null,
	})
	{
		// delete the loader (the envelope is bouncing)
		const elements = top.document.getElementsByClassName('mail-loader-modifier');
		for (const element of elements)
		{
			element.classList.remove('mail-loader-modifier');
		}

		this.#mailboxId = config.mailboxId;
		this.#filter = BX.Main.filterManager.getById(config.filterId);

		this.#initMailboxSelector(config['mailboxSelectorConfig']);

		this.sendApplyFilterEventForMenuRefresh();

		// Removing the focus from the filter field
		if (document.activeElement)
		{
			document.activeElement.blur();
		}

		const mailCounterWrapper = document.querySelector('[data-role="mail-counter-toolbar"]');

		const mailErrorBoxWrapper = document.querySelector('[data-role="mail-error-box-wrapper"]');

		const errorBox = new ErrorBox({
			wrapper: mailErrorBoxWrapper,
			errorLink: config.configPath,
			currentMailboxId: this.#mailboxId,
		});

		const filterToolbar = new FilterToolbar({
			wrapper: mailCounterWrapper,
			filter: this.#filter,
		});

		filterToolbar.build();
		this.#filterToolbar = filterToolbar;

		this.#binding = new Binding(this.#mailboxId);
		Binding.initButtons();
		this.#subscribeToMailboxGridButtonRefresh();

		EventEmitter.subscribe('Grid::updated', (event) => {
			const [grid] = event.getCompatData();
			if (grid !== {} && grid !== undefined && BX.Mail.Home.Grid.getId() === grid.getId())
			{
				Binding.initButtons();
			}
		});

		EventEmitter.subscribe('BX.Main.Filter:apply', (event) => {
			const dir = this.#filter.getFilterFieldsValues().DIR;
			BX.Mail.Home.Counters.setDirectory(dir);
		});

		if (!config.syncAvailable)
		{
			top.BX.UI.InfoHelper.show('limit_contact_center_mail_box_number');
			let lock = false;
			const handler = () => {
				if (!lock)
				{
					lock = true;
					top.BX.removeCustomEvent('SidePanel.Slider:onCloseComplete', handler);
					top.BX.SidePanel.Instance.close();
				}
			};
			top.BX.addCustomEvent('SidePanel.Slider:onCloseComplete', handler);
		}
	}

	#subscribeToMailboxGridButtonRefresh()
	{
		EventEmitter.subscribe('onPullEvent-mail', (event) => {
			const [command] = event.getData();
			if (
				command !== 'mailbox_grid_button_counter_refresh'
				&& command !== 'connection_request_count_changed'
			)
			{
				return;
			}

			this.#refreshMailboxGridButtonCounter();
		});
	}

	#refreshMailboxGridButtonCounter()
	{
		if (!this.#getMailboxGridButton())
		{
			return;
		}

		if (this.#mailboxGridButtonCounterRequest)
		{
			this.#isMailboxGridButtonCounterRefreshQueued = true;

			return;
		}

		this.#mailboxGridButtonCounterRequest = ajax.runAction(
			'mail.mailboxsettings.getMailboxGridButtonCounter',
		).then((response) => {
			const count = Number(response?.data?.count ?? 0);
			this.#updateMailboxGridButtonCounter(count);
		}).catch(() => {}).finally(() => {
			this.#mailboxGridButtonCounterRequest = null;

			if (this.#isMailboxGridButtonCounterRefreshQueued)
			{
				this.#isMailboxGridButtonCounterRefreshQueued = false;
				this.#refreshMailboxGridButtonCounter();
			}
		});
	}

	#updateMailboxGridButtonCounter(count)
	{
		const button = this.#getMailboxGridButton();
		if (!button)
		{
			return;
		}

		if (count <= 0)
		{
			button.setRightCounter(null);

			return;
		}

		const counter = button.getRightCounter();
		if (counter)
		{
			counter.setValue(count);

			return;
		}

		button.setRightCounter({
			value: count,
		});
	}

	#getMailboxGridButton()
	{
		const buttonNode = document.querySelector('[data-id="mail-mailbox-grid-button"]');
		if (!buttonNode || !BX.UI || !BX.UI.ButtonManager)
		{
			return null;
		}

		return BX.UI.ButtonManager.createFromNode(buttonNode);
	}

	sendApplyFilterEventForMenuRefresh()
	{
		if (Boolean(this.#filter) && (this.#filter instanceof BX.Main.Filter))
		{
			setTimeout(() => {
				EventEmitter.emit('BX.Main.Filter:apply', new BaseEvent());
			}, 1);
		}
	}

	setFilterDir(name)
	{
		if (Boolean(this.#filter) && (this.#filter instanceof BX.Main.Filter))
		{
			const FilterApi = this.#filter.getApi();
			FilterApi.setFields({
				DIR: name,
			});
			FilterApi.apply();
		}
	}

	getFilterToolbar()
	{
		return this.#filterToolbar;
	}

	#initMailboxSelector(selectorConfig)
	{
		if (!selectorConfig)
		{
			return;
		}
		const root = document.querySelector('[data-role="mailbox-selector-root"]');
		if (!root)
		{
			return;
		}
		BX.Mail.Home = BX.Mail.Home || {};
		BX.Mail.Home.MailboxSelector = new MailboxSelector({ root, selectorConfig });
	}
}

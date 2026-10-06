import { ajax, Dom, Loc, Tag } from 'main.core';
import { BaseEvent, EventEmitter } from 'main.core.events';

import { Binding } from 'mail.client.binding';
import { MailboxSelector } from 'mail.client.mailboxselector';
import { ErrorBox } from 'mail.client.errorbox';
import { FilterToolbar } from 'mail.client.filtertoolbar';
import { getMigrationState } from 'mail.migration-state';

export class Mailer
{
	#filter;
	#filterToolbar;
	#mailboxId;
	#mailboxGridButtonCounterRequest = null;
	#isMailboxGridButtonCounterRefreshQueued = false;
	#migrationMailboxIds = [];
	#migrationReloadStarted = false;
	#migrationStatuses = new Map();
	#reloadPage;
	focusReset = false;

	constructor(config = {
		filterId: '',
		mailboxId: 0,
		syncAvailable: true,
		configPath: '',
		mailboxSelectorConfig: null,
		isDraftMode: false,
		staticCounter: null,
	})
	{
		// delete the loader (the envelope is bouncing)
		const elements = top.document.getElementsByClassName('mail-loader-modifier');
		for (const element of elements)
		{
			Dom.removeClass(element, 'mail-loader-modifier');
		}

		this.#mailboxId = config.mailboxId;
		this.#migrationMailboxIds = config.migrationMailboxIds ?? [Number(this.#mailboxId)];
		this.#reloadPage = config.reloadPage ?? (() => window.location.reload());
		this.#initMailboxSelector(config.mailboxSelectorConfig);

		if (config.isDraftMode)
		{
			return;
		}

		this.#filter = BX.Main.filterManager.getById(config.filterId);
		this.sendApplyFilterEventForMenuRefresh();

		// Removing the focus from the filter field
		if (document.activeElement)
		{
			document.activeElement.blur();
		}

		const mailCounterWrapper = document.querySelector('[data-role="mail-counter-toolbar"]');

		const mailErrorBoxWrapper = document.querySelector('[data-role="mail-error-box-wrapper"]');

		this.errorBox = new ErrorBox({
			wrapper: mailErrorBoxWrapper,
			errorLink: config.configPath,
			currentMailboxId: this.#mailboxId,
		});

		const filterToolbar = new FilterToolbar({
			wrapper: mailCounterWrapper,
			filter: this.#filter,
			staticCounter: config.staticCounter,
		});

		filterToolbar.build();
		this.#filterToolbar = filterToolbar;

		this.binding = new Binding(this.#mailboxId);
		Binding.initButtons();
		this.#subscribeToMailboxGridButtonRefresh();
		this.#initMigrationState();

		EventEmitter.subscribe('Grid::updated', (event) => {
			const [grid] = event.getCompatData();
			if (grid !== undefined && BX.Mail.Home.Grid.getId() === grid.getId())
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

	#initMigrationState()
	{
		this.#migrationMailboxIds.forEach((mailboxId) => {
			const normalizedMailboxId = Number(mailboxId);
			if (!Number.isInteger(normalizedMailboxId) || normalizedMailboxId <= 0)
			{
				return;
			}

			const migrationState = getMigrationState(normalizedMailboxId);
			migrationState.subscribe((change) => this.#handleMigrationState(normalizedMailboxId, change));
			if (migrationState.isActive())
			{
				this.#migrationStatuses.set(normalizedMailboxId, migrationState.getStatus().status);
			}
			void migrationState.initialize();
		});
		this.#renderMigrationBanner();
	}

	#handleMigrationState(mailboxId, change)
	{
		if (change.active)
		{
			this.#migrationStatuses.set(mailboxId, change.status.status);
			this.#renderMigrationBanner();

			return;
		}

		this.#migrationStatuses.delete(mailboxId);
		this.#renderMigrationBanner();
		if (
			(change.previousActive || change.source === 'pull')
			&& change.status.status === 'done'
			&& !this.#migrationReloadStarted
		)
		{
			this.#migrationReloadStarted = true;
			const grid = BX.Mail.Home?.Grid;
			grid?.resetGridSelection();
			grid?.setGridWrapper(document.querySelector('[data-role="mail-msg-list-grid"]'));
			grid?.setGridStub(document.querySelector('[data-role="mail-msg-list-grid-stub"]'));
			grid?.enableLoadingMessagesStub();
			this.#reloadPage();
		}
	}

	#renderMigrationBanner()
	{
		const priorities = ['blocked', 'cancelling', 'switching', 'waiting', 'running'];
		const status = priorities.find((candidate) => (
			[...this.#migrationStatuses.values()].includes(candidate)
		));
		if (status)
		{
			this.#showMigrationBanner(status);

			return;
		}

		this.#hideMigrationBanner();
	}

	#showMigrationBanner(status)
	{
		const statusPhrases = {
			running: 'MAIL_MESSAGE_LIST_MIGRATION_RUNNING',
			waiting: 'MAIL_MESSAGE_LIST_MIGRATION_WAITING',
			switching: 'MAIL_MESSAGE_LIST_MIGRATION_SWITCHING',
			blocked: 'MAIL_MESSAGE_LIST_MIGRATION_BLOCKED',
			cancelling: 'MAIL_MESSAGE_LIST_MIGRATION_CANCELLING',
		};
		const title = Loc.getMessage('MAIL_MESSAGE_LIST_MIGRATION_TITLE').trim();
		const text = Loc.getMessage(statusPhrases[status] ?? statusPhrases.running).trim();

		// A locale without these phrases would leave an empty warning stripe on the list.
		if (title === '' && text === '')
		{
			this.#hideMigrationBanner();

			return;
		}

		const banner = this.#getMigrationBanner() ?? this.#createMigrationBanner();
		if (!banner)
		{
			return;
		}

		banner.querySelector('[data-role="mail-migration-banner-title"]').textContent = title;
		banner.querySelector('[data-role="mail-migration-banner-text"]').textContent = text;
	}

	#hideMigrationBanner()
	{
		Dom.remove(this.#getMigrationBanner());
	}

	#getMigrationBanner()
	{
		return document.querySelector('[data-role="mail-migration-banner"]');
	}

	#createMigrationBanner()
	{
		const wrapper = document.querySelector('[data-role="mail-error-box-wrapper"]');
		if (!wrapper)
		{
			return null;
		}

		const banner = Tag.render`
			<div
				class="ui-alert ui-alert-warning ui-alert-icon-warning"
				data-role="mail-migration-banner"
				data-testid="mail-migration-banner"
			>
				<span class="ui-alert-message">
					<strong data-role="mail-migration-banner-title"></strong><br>
					<span data-role="mail-migration-banner-text"></span>
				</span>
			</div>
		`;
		Dom.prepend(banner, wrapper);

		return banner;
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

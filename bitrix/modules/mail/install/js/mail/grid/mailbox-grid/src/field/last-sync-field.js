import { BaseField } from './base-field';
import { Dom, Tag, Text, Event, Loc } from 'main.core';
import { DateTimeFormat } from 'main.date';
import { GridManager } from '../grid-manager';
import { Chip, ChipDesign, ChipSize } from 'ui.system.chip';
import { MigrationProgressPanelLoader } from '../migration-progress-panel-loader';

export type LastSyncFieldType = {
	lastSync: ?number,
	mailboxId: ?number,
	hasError: ?boolean,
	canEdit: ?boolean,
	migrationStatus: ?string,
	migrationActive: ?boolean,
	migrationAdminProgressAvailable: ?boolean,
	migrationAdminProgressAllowed: ?boolean,
	migrationAdminProgressEarlyVisible: ?boolean,
	migrationAdminStatus: ?string,
}

export class LastSyncField extends BaseField
{
	render(params: LastSyncFieldType): void
	{
		const lastSyncContainer = Tag.render`
			<div class="mailbox-grid_last-sync-container mailbox-grid_single-line_field"></div>
		`;
		const migrationStatusContainer = Tag.render`
			<div class="mailbox-grid_last-sync-status-container" data-role="mailbox-grid-migration-status"></div>
		`;
		const regularStatusContainer = Tag.render`
			<div class="mailbox-grid_last-sync-status-container" data-role="mailbox-grid-regular-sync-status"></div>
		`;

		const hasAdminProgress = params.migrationAdminProgressAvailable === true;
		Dom.attr(migrationStatusContainer, 'data-mailbox-admin-progress', hasAdminProgress ? 'Y' : 'N');
		Dom.attr(
			migrationStatusContainer,
			'data-mailbox-admin-progress-allowed',
			params.migrationAdminProgressAllowed === true ? 'Y' : 'N',
		);
		Dom.attr(
			migrationStatusContainer,
			'data-mailbox-admin-progress-early-visible',
			params.migrationAdminProgressEarlyVisible === true ? 'Y' : 'N',
		);
		const migrationStatus = this.#getMigrationStatus(params);
		if (hasAdminProgress)
		{
			Dom.attr(migrationStatusContainer, 'data-mailbox-admin-progress-text', migrationStatus.textContent ?? '');
		}
		Dom.append(migrationStatus, migrationStatusContainer);
		if (params.hasError)
		{
			Dom.append(this.#getErrorMessage(), regularStatusContainer);
		}
		else
		{
			if (params.lastSync)
			{
				Dom.append(this.#getLastSyncContainer(params.lastSync), regularStatusContainer);
			}
			else
			{
				Dom.append(this.#getLastSyncRightNowContainer(), regularStatusContainer);
			}

			if (params.mailboxId && params.canEdit)
			{
				Dom.append(this.#getLastSyncButton(params.mailboxId), regularStatusContainer);
			}
		}

		migrationStatusContainer.hidden = params.migrationActive !== true && !hasAdminProgress;
		regularStatusContainer.hidden = params.migrationActive === true || hasAdminProgress;
		Dom.append(migrationStatusContainer, lastSyncContainer);
		Dom.append(regularStatusContainer, lastSyncContainer);

		this.appendToFieldNode(lastSyncContainer);
	}

	#getMigrationStatus(params: LastSyncFieldType): HTMLElement
	{
		const adminStatusKeys = {
			waiting: 'MAIL_MIGRATION_PROGRESS_STATUS_WAITING',
			manual_waiting: 'MAIL_MIGRATION_PROGRESS_STATUS_MANUAL_WAITING',
			blocked: 'MAIL_MIGRATION_PROGRESS_STATUS_BLOCKED',
			cancelling: 'MAIL_MIGRATION_PROGRESS_STATUS_CANCELLING',
			switching: 'MAIL_MIGRATION_PROGRESS_STATUS_SWITCHING',
		};
		const status = params.migrationAdminProgressAvailable === true
			? params.migrationAdminStatus
			: params.migrationStatus;
		const key = (params.migrationAdminProgressAvailable === true || params.migrationActive === true)
			&& Object.hasOwn(adminStatusKeys, status)
			? adminStatusKeys[status]
			: 'MAIL_MIGRATION_STATUS'
		;
		const chip = new Chip({
			size: ChipSize.Sm,
			rounded: true,
			text: Text.encode(Loc.getMessage(key) ?? ''),
			design: ChipDesign.OutlineWarning,
		}).render();
		if (params.migrationAdminProgressAllowed === true
			&& (params.migrationAdminProgressAvailable === true || params.migrationActive === true)
			&& params.mailboxId && this.getGridId())
		{
			MigrationProgressPanelLoader.getInstance(this.getGridId()).bindAnchor(chip, Number(params.mailboxId));
		}

		return chip;
	}

	#getLastSyncContainer(lastSync: string): HTMLElement
	{
		let formattedTime = lastSync;
		if (/^\d+$/.test(lastSync))
		{
			const timestamp = parseInt(lastSync, 10);
			formattedTime = DateTimeFormat.formatLastActivityDate(timestamp);
		}

		return Tag.render`
			<span class="mailbox-grid_last-sync-text">${Text.encode(formattedTime)}</span>
		`;
	}

	#getLastSyncRightNowContainer(): HTMLElement
	{
		return Tag.render`
			<span class="mailbox-grid_last-sync-text">${Loc.getMessage('MAIL_MAILBOX_LIST_LAST_SYNC_NEW_CONNECT')}</span>
		`;
	}

	#getLastSyncButton(mailboxId: number): HTMLElement
	{
		const button = Tag.render`
				<div class="mailbox-grid_last-sync-button ui-icon-set --o-refresh" data-testid="mailbox-grid_refresh-button"></div>
		`;

		Event.bind(button, 'click', () => {
			GridManager.getInstance(this.getGrid().containerId).runAction({
				actionId: 'syncAction',
				options: {},
				params: { mailboxId },
			});
		});

		return button;
	}

	#getErrorMessage(): HTMLElement
	{
		return Tag.render`
			<span class="mailbox-grid_last-sync-error-message">
				${Loc.getMessage('MAIL_MAILBOX_LIST_LAST_SYNC_ERROR_MESSAGE')}
			</span>
		`;
	}
}

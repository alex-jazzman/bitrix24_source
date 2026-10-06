import { Loc, Runtime, Tag, Type } from 'main.core';
import type { Button, ButtonIcon } from 'ui.buttons';
import type { Dialog, DialogOptions } from 'ui.system.dialog';

import { DraftConnector } from './draft-connector';
import { DraftCoordinator } from './draft-coordinator';
import type { ComposeForm, DraftContext, DraftGateway, DraftView } from './types';

type BootstrapOptions = {
	form: ComposeForm,
	clientId: string,
	draftId?: number | null,
	draft?: DraftView | null,
	connector?: DraftGateway,
	context?: DraftContext,
	onDraftIdChange?: (draftId: number, revision: number) => void,
	onCancel?: () => Promise<void> | void,
};

type CrmDraftContextOptions = {
	entityTypeId?: number,
	entityId?: number,
	ownerEntityTypeId?: number,
	ownerEntityId?: number,
};

type NotificationCenter = {
	notify: (options: { content: string }) => void,
};

let mailDraftNotificationCenter: NotificationCenter | null = null;

type DialogButtonPresentation = {
	size: string,
	style: string,
	useAirDesign: boolean,
};

type CrmRestoreDialogPresentation = {
	shell: 'ui.system.dialog',
	width: number,
	buttonGroup: 'centerButtons',
	hasOverlay: boolean,
	buttons: {
		continue: DialogButtonPresentation,
		startNew: DialogButtonPresentation,
	},
};

export async function bootstrapMailDraft(options: BootstrapOptions): Promise<DraftCoordinator | null>
{
	if (!Type.isFunction(options.form?.getComposeSnapshot))
	{
		return null;
	}

	const connector = options.connector ?? new DraftConnector(options.context ?? { contextType: 'mail' });
	const lifecycleToken = options.form.getDraftLifecycleToken?.() ?? 0;
	options.form.setDraftLoading?.(true);
	try
	{
		options.form.setDraftRestoreFailed?.(false);
		if (!(await connector.config()).available || !isLifecycleActive(options.form, lifecycleToken))
		{
			return null;
		}
		const draft = options.draft ?? (options.draftId ? await connector.get(options.draftId) : null);
		if (!isLifecycleActive(options.form, lifecycleToken))
		{
			return null;
		}
		if (draft)
		{
			await options.form.applyComposeSnapshot?.(draft.snapshot, draft.attachments);
		}
		if (!isLifecycleActive(options.form, lifecycleToken))
		{
			return null;
		}
		if (draft)
		{
			options.onDraftIdChange?.(draft.id, draft.revision);
		}
		await options.form.waitForDraftReady?.();
		if (!isLifecycleActive(options.form, lifecycleToken))
		{
			return null;
		}
		if (window.top && window.top !== window)
		{
			await prepareMailDraftNotificationCenter();
		}
		return new DraftCoordinator({
			form: options.form,
			connector,
			draft,
			onFlushError: showFlushErrorDialog,
			onDeleteDraft: (draftId) => connector.delete(draftId),
			onCloseWithSavedDraft: notifyMailDraftClosed,
			onStateChange: ({ draftId, revision }) => {
				if (draftId !== null && revision !== null)
				{
					options.onDraftIdChange?.(draftId, revision);
					notifyMailDraftSaved(draftId);
				}
			},
		});
	}
	catch (error)
	{
		handleMailDraftBootstrapError(options);

		throw error;
	}
	finally
	{
		options.form.setDraftLoading?.(false);
	}
}

function handleMailDraftBootstrapError(options: BootstrapOptions): void
{
	if (options.draftId)
	{
		options.form.showError?.(Loc.getMessage('MAIL_DRAFT_RESTORE_ERROR') ?? '');
		options.form.setDraftRestoreFailed?.(true);
	}
}

function notifyMailDraftClosed(): void
{
	const content = Loc.getMessage('MAIL_DRAFT_SAVED_NOTIFICATION') ?? '';
	const topWindow = window.top as (Window & { BX?: typeof BX }) | null;
	const notificationCenter = mailDraftNotificationCenter ?? topWindow?.BX?.UI?.Notification?.Center;
	if (notificationCenter)
	{
		notificationCenter.notify({ content });

		return;
	}

	void prepareMailDraftNotificationCenter().then(() => notifyMailDraftClosed());
}

async function prepareMailDraftNotificationCenter(): Promise<void>
{
	if (mailDraftNotificationCenter)
	{
		return;
	}

	const topWindow = window.top as (Window & { BX?: typeof BX }) | null;
	mailDraftNotificationCenter = topWindow?.BX?.UI?.Notification?.Center ?? null;
	if (!mailDraftNotificationCenter)
	{
		const notificationExtension = topWindow?.BX?.Runtime
			? await topWindow.BX.Runtime.loadExtension('ui.notification')
			: await Runtime.loadExtension('ui.notification')
		;
		mailDraftNotificationCenter = topWindow?.BX?.UI?.Notification?.Center
			?? notificationExtension.Center
		;
	}
}

function notifyMailDraftSaved(draftId: number): void
{
	const topWindow = window.top as (Window & { BX?: typeof BX }) | null;
	const sidePanel = topWindow?.BX?.SidePanel ?? BX.SidePanel;
	sidePanel?.Instance?.postMessage?.(window, 'Mail.Client.DraftSaved', { draftId });
}

export async function bootstrapCrmDraft(options: BootstrapOptions): Promise<DraftCoordinator | null>
{
	const connector = options.connector ?? new DraftConnector(options.context ?? { contextType: 'crm' });
	const lifecycleToken = options.form.getDraftLifecycleToken?.() ?? 0;
	options.form.setDraftLoading?.(true);
	try
	{
		if (!(await connector.config()).available || !isLifecycleActive(options.form, lifecycleToken))
		{
			return null;
		}

		const draft = options.draft ?? await connector.getByContext();
		if (!isLifecycleActive(options.form, lifecycleToken))
		{
			return null;
		}
		let coordinatorDraft = draft;
		if (draft)
		{
			const decision = await showCrmRestoreDialog();
			if (!isLifecycleActive(options.form, lifecycleToken))
			{
				return null;
			}
			const result = await resolveCrmRestoreDecision(decision, connector);
			if (result === 'cancel')
			{
				await options.onCancel?.();

				return null;
			}
			if (result === 'continue')
			{
				await options.form.applyComposeSnapshot?.(draft.snapshot, draft.attachments);
			}
			else if (result === 'start-new')
			{
				coordinatorDraft = null;
			}
		}
		if (!isLifecycleActive(options.form, lifecycleToken))
		{
			return null;
		}
		if (coordinatorDraft)
		{
			options.onDraftIdChange?.(coordinatorDraft.id, coordinatorDraft.revision);
		}

		if (window.top && window.top !== window)
		{
			await prepareMailDraftNotificationCenter();
		}

		return new DraftCoordinator({
			form: options.form,
			connector,
			draft: coordinatorDraft ?? null,
			onFlushError: showFlushErrorDialog,
			onDeleteDraft: () => connector.deleteCurrent(),
			onCloseWithSavedDraft: notifyMailDraftClosed,
			onStateChange: ({ draftId, revision }) => {
				if (draftId !== null && revision !== null)
				{
					options.onDraftIdChange?.(draftId, revision);
				}
			},
		});
	}
	finally
	{
		options.form.setDraftLoading?.(false);
	}
}

export function resolveCrmDraftContext(options: CrmDraftContextOptions): {
	entityTypeId: number,
	entityId: number,
}
{
	const entityTypeId = Number(options.entityTypeId || 0);
	const entityId = Number(options.entityId || 0);
	if (entityTypeId > 0 && entityId > 0)
	{
		return { entityTypeId, entityId };
	}

	return {
		entityTypeId: Number(options.ownerEntityTypeId || 0),
		entityId: Number(options.ownerEntityId || 0),
	};
}

function isLifecycleActive(form: ComposeForm, token: number): boolean
{
	return form.isDraftLifecycleActive?.(token) ?? true;
}

export async function resolveCrmRestoreDecision(
	decision: 'continue' | 'start-new' | 'cancel',
	connector: Pick<DraftGateway, 'deleteCurrent'>,
): Promise<'continue' | 'start-new' | 'cancel'>
{
	if (decision === 'start-new')
	{
		await connector.deleteCurrent();
	}

	return decision;
}

export function isDraftRoute(path: string): boolean
{
	return /\/drafts\/?(?:\?|$)/.test(path);
}

async function showCrmRestoreDialog(): Promise<'continue' | 'start-new' | 'cancel'>
{
	const { Dialog, Button } = await loadDialogExtensions();

	return new Promise((resolve) => {
		const presentation = getCrmRestoreDialogPresentation();
		let settled = false;
		const choose = (decision: 'continue' | 'start-new' | 'cancel', close = true) => {
			if (settled)
			{
				return;
			}
			settled = true;
			if (close)
			{
				dialog.hide();
			}
			resolve(decision);
		};
		const dialogOptions: DialogOptions & { width: number } = {
			title: Loc.getMessage('MAIL_DRAFT_RESTORE_TITLE') ?? '',
			content: Tag.render`
				<div data-testid="mail-draft-restore-dialog" data-dialog-shell="${presentation.shell}">
					${Loc.getMessage('MAIL_DRAFT_RESTORE_TEXT')}
				</div>
			`,
			[presentation.buttonGroup]: [
				createDialogButton(
					Button,
					Loc.getMessage('MAIL_DRAFT_RESTORE_START_NEW') ?? '',
					() => choose('start-new'),
					presentation.buttons.startNew,
				),
				createDialogButton(
					Button,
					Loc.getMessage('MAIL_DRAFT_RESTORE_CONTINUE') ?? '',
					() => choose('continue'),
					presentation.buttons.continue,
				),
			],
			width: presentation.width,
			hasOverlay: presentation.hasOverlay,
		};
		const dialog = new Dialog(dialogOptions);
		dialog.subscribe('onHide', () => choose('cancel', false));
		dialog.show();
	});
}

async function showFlushErrorDialog(): Promise<'retry' | 'close-with-risk' | 'cancel'>
{
	const { Dialog, Button } = await loadDialogExtensions();

	return new Promise((resolve) => {
		const presentation = getCrmRestoreDialogPresentation();
		let settled = false;
		const choose = (decision: 'retry' | 'close-with-risk' | 'cancel', close = true) => {
			if (settled)
			{
				return;
			}
			settled = true;
			if (close)
			{
				dialog.hide();
			}
			resolve(decision);
		};
		const dialogOptions: DialogOptions & { width: number } = {
			title: Loc.getMessage('MAIL_DRAFT_CLOSE_ERROR_TITLE') ?? '',
			content: Tag.render`
				<div data-testid="mail-draft-close-error-dialog" data-dialog-shell="${presentation.shell}">
					${Loc.getMessage('MAIL_DRAFT_CLOSE_ERROR_TEXT')}
				</div>
			`,
			[presentation.buttonGroup]: [
				createDialogButton(
					Button,
					Loc.getMessage('MAIL_DRAFT_CLOSE_WITH_RISK') ?? '',
					() => choose('close-with-risk'),
					presentation.buttons.startNew,
				),
				createDialogButton(
					Button,
					Loc.getMessage('MAIL_DRAFT_CLOSE_RETRY') ?? '',
					() => choose('retry'),
					presentation.buttons.continue,
				),
			],
			width: presentation.width,
			hasOverlay: presentation.hasOverlay,
		};
		const dialog = new Dialog(dialogOptions);
		dialog.subscribe('onHide', () => choose('cancel', false));
		dialog.show();
	});
}

export function getCrmRestoreDialogPresentation(): CrmRestoreDialogPresentation
{
	return Object.freeze({
		shell: 'ui.system.dialog',
		width: 440,
		buttonGroup: 'centerButtons',
		hasOverlay: true,
		buttons: {
			continue: {
				size: 'ui-btn-md',
				style: '--style-filled',
				useAirDesign: true,
			},
			startNew: {
				size: 'ui-btn-md',
				style: '--style-outline',
				useAirDesign: true,
			},
		},
	});
}

function createDialogButton(
	ButtonClass: typeof Button,
	text: string,
	callback: () => void,
	presentation: DialogButtonPresentation,
): Button
{
	return new ButtonClass({
		text,
		size: presentation.size,
		style: presentation.style,
		useAirDesign: presentation.useAirDesign,
		collapsedIcon: '' as ButtonIcon,
		onclick: () => {
			callback();

			return {};
		},
	});
}

async function loadDialogExtensions(): Promise<{ Dialog: typeof Dialog, Button: typeof Button }>
{
	return await Runtime.loadExtension(
		'ui.system.dialog',
		'ui.buttons',
	) as unknown as { Dialog: typeof Dialog, Button: typeof Button };
}

export { DraftConnector, DraftCoordinator };
export type { ComposeSnapshot, DraftContext, DraftView } from './types';

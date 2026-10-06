import { Event, Loc, Tag, Text } from 'main.core';
import { type BaseEvent } from 'main.core.events';
import { Dialog, type Item } from 'ui.entity-selector';
import { LiveAnnouncer } from 'ui.a11y';
import 'ui.notification';

import { apiClient, LabelCollection, type LabelDto } from 'mail.label.core';

import { buildSelectorItems, LABEL_TAB_ID } from './state';

const LABELS_SLIDER_URL = '/mail/labels';

export type AssignMenuChange = {
	labelId: number,
	assigned: boolean,
};

export type AssignMenuOptions = {
	bindElement: HTMLElement,
	messageIds: string[],
	currentLabelIds: number[] | Promise<number[]>,
	mailboxId?: number | null,
	onChange?: (change: AssignMenuChange) => void,
	onShow?: () => void,
	onClose?: () => void,
};

const sharedCollections: Map<string, LabelCollection> = new Map();
const sharedPromises: Map<string, Promise<LabelCollection>> = new Map();
let dialogCounter = 0;
let cacheGeneration = 0;

function scopeKey(mailboxId: number | null): string
{
	return mailboxId === null ? 'all' : String(mailboxId);
}

function loadSharedLabels(mailboxId: number | null): Promise<LabelCollection>
{
	const key = scopeKey(mailboxId);

	const cached = sharedCollections.get(key);
	if (cached)
	{
		return Promise.resolve(cached);
	}

	let promise = sharedPromises.get(key);
	if (!promise)
	{
		const requestedGeneration = cacheGeneration;

		promise = apiClient.list(mailboxId)
			.then((labels: LabelDto[]): LabelCollection => {
				const collection = new LabelCollection(labels);
				// Stale after an invalidation mid-flight: caching it would resurrect the old list.
				if (requestedGeneration === cacheGeneration)
				{
					sharedCollections.set(key, collection);
				}

				return collection;
			})
			.finally((): void => {
				sharedPromises.delete(key);
			});
		sharedPromises.set(key, promise);
	}

	return promise;
}

export function invalidateSharedLabels(): void
{
	cacheGeneration++;
	sharedCollections.clear();
	sharedPromises.clear();
}

export class AssignMenu
{
	#bindElement: HTMLElement;
	#messageIds: string[];
	#currentLabelIds: number[] | Promise<number[]>;
	#selectedLabelIds: Set<number> = new Set();
	#mailboxId: number | null;
	#onChange: ((change: AssignMenuChange) => void) | null;
	#onShow: (() => void) | null;
	#onClose: (() => void) | null;

	#dialog: Dialog | null = null;
	#labels: LabelDto[] = [];
	#toggleQueue: Map<number, Promise<mixed>> = new Map();

	constructor(options: AssignMenuOptions)
	{
		this.#bindElement = options.bindElement;
		this.#messageIds = options.messageIds;
		this.#currentLabelIds = options.currentLabelIds;
		this.#mailboxId = options.mailboxId ?? null;
		this.#onChange = options.onChange ?? null;
		this.#onShow = options.onShow ?? null;
		this.#onClose = options.onClose ?? null;
	}

	static show(options: AssignMenuOptions): Promise<void>
	{
		return new this(options).#open();
	}

	#open(): Promise<void>
	{
		return Promise.all([
			loadSharedLabels(this.#mailboxId),
			Promise.resolve(this.#currentLabelIds),
		])
			.then(([collection, currentLabelIds]: [LabelCollection, number[]]): void => {
				this.#labels = collection.getAll();
				this.#selectedLabelIds = new Set(currentLabelIds);

				this.#dialog = new Dialog({
					id: `mail-label-selector-${++dialogCounter}`,
					targetNode: this.#bindElement,
					multiple: true,
					enableSearch: true,
					compactView: false,
					cacheable: false,
					autoHide: true,
					width: 350,
					tabs: [
						{
							id: LABEL_TAB_ID,
							title: Loc.getMessage('MAIL_LABEL_ASSIGN_MENU_TITLE') ?? '',
						},
					],
					recentTabOptions: {
						id: 'recents',
						visible: false,
						stub: false,
					},
					items: buildSelectorItems(this.#labels, this.#selectedLabelIds),
					footer: this.#buildCreateFooter(),
					popupOptions: {
						focusTrap: true,
					},
					events: {
						'Item:onSelect': (event: BaseEvent): void => this.#handleToggle(event, true),
						'Item:onDeselect': (event: BaseEvent): void => this.#handleToggle(event, false),
						onShow: (): void => this.#handleShow(),
						onHide: (): void => this.#handleHide(),
					},
				});

				this.#dialog.show();
			})
			.catch((): void => {
				this.#notifyError();
			});
	}

	#handleToggle(event: BaseEvent, assigned: boolean): void
	{
		const item: Item = event.getData().item;
		const labelId = Number(item.getId());
		const title = this.#labels.find((label: LabelDto): boolean => label.id === labelId)?.name ?? '';

		this.#applyState(labelId, assigned);

		// Chained per label: out-of-order answers would leave the server on an earlier click.
		const pending = this.#toggleQueue.get(labelId) ?? Promise.resolve();
		const request = pending
			.then((): Promise<mixed> => (assigned
				? apiClient.assign([labelId], this.#messageIds)
				: apiClient.unassign([labelId], this.#messageIds)
			))
			.then((): void => {
				this.#announceToggle(title, assigned);
				this.#onChange?.({ labelId, assigned });
			})
			.catch((): void => {
				this.#applyState(labelId, !assigned);
				this.#revertItem(item, !assigned);
				this.#notifyError();
			})
			.finally((): void => {
				if (this.#toggleQueue.get(labelId) === request)
				{
					this.#toggleQueue.delete(labelId);
				}
			});

		this.#toggleQueue.set(labelId, request);
	}

	#applyState(labelId: number, isSelected: boolean): void
	{
		if (isSelected)
		{
			this.#selectedLabelIds.add(labelId);
		}
		else
		{
			this.#selectedLabelIds.delete(labelId);
		}
	}

	#revertItem(item: Item, isSelected: boolean): void
	{
		if (isSelected)
		{
			item.select({ emitEvents: false });
		}
		else
		{
			item.deselect({ emitEvents: false });
		}
	}

	#buildCreateFooter(): HTMLElement
	{
		const footer = Tag.render`
			<a
				class="ui-selector-footer-link ui-selector-footer-link-add"
				role="button"
				tabindex="0"
				data-testid="mail-label-selector-create"
			>${Text.encode(Loc.getMessage('MAIL_LABEL_ASSIGN_MENU_CREATE') ?? '')}</a>
		`;

		Event.bind(footer, 'click', (): void => this.#openCreateSlider());
		Event.bind(footer, 'keydown', (event: KeyboardEvent): void => {
			if (event.key === 'Enter' || event.key === ' ')
			{
				event.preventDefault();
				this.#openCreateSlider();
			}
		});

		return footer;
	}

	#handleShow(): void
	{
		Event.bind(window, 'blur', this.#handleWindowBlur);
		this.#onShow?.();
	}

	#handleWindowBlur = (): void => {
		const active = document.activeElement;
		if (active && active.tagName === 'IFRAME')
		{
			this.#dialog?.hide();
		}
	};

	#handleHide(): void
	{
		Event.unbind(window, 'blur', this.#handleWindowBlur);
		this.#onClose?.();
		this.#dialog?.destroy();
		this.#dialog = null;
	}

	#announceToggle(title: string, assigned: boolean): void
	{
		const phraseId = assigned
			? 'MAIL_LABEL_ASSIGN_MENU_ANNOUNCE_ASSIGNED'
			: 'MAIL_LABEL_ASSIGN_MENU_ANNOUNCE_UNASSIGNED';

		LiveAnnouncer.announce(Loc.getMessage(phraseId, { '#TITLE#': title }) ?? '');
	}

	#openCreateSlider(): void
	{
		this.#dialog?.hide();

		if (!BX.SidePanel)
		{
			return;
		}

		BX.SidePanel.Instance.open(`${LABELS_SLIDER_URL}?form=y`, {
			width: 680,
			cacheable: false,
			events: {
				onClose: (): void => {
					invalidateSharedLabels();
				},
			},
		});
	}

	#notifyError(): void
	{
		const message = Loc.getMessage('MAIL_LABEL_ASSIGN_MENU_ERROR') ?? '';

		BX.UI.Notification.Center.notify({
			content: message,
			position: 'top-right',
			autoHideDelay: 3000,
		});

		LiveAnnouncer.announce(message, 'assertive');
	}
}

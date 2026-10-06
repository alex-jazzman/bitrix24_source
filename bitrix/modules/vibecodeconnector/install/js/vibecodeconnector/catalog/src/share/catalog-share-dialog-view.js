import { Dom, Event, Loc, Tag, Type } from 'main.core';
import { AirButtonStyle, Button, ButtonSize, ButtonState } from 'ui.buttons';
import { DatePicker } from 'ui.date-picker';
import { TagSelector } from 'ui.entity-selector';
import { Icon, Outline } from 'ui.icon-set.api.core';
import { Input, InputDesign } from 'ui.system.input';
import { Menu } from 'ui.system.menu';
import { AirSwitcherStyle, Switcher, SwitcherSize } from 'ui.switcher';

import {
	CatalogShareViewState,
	type CatalogShareSnapshot,
} from './catalog-share-state';
import {
	Audience,
	LinkAvailability,
	type AudienceValue,
	type CatalogShareApplication,
	type CatalogShareParticipant,
} from './catalog-share-types';

type EntitySelectorItem = {
	getEntityId: () => string,
	getId: () => string | number,
	getTitle: () => string,
};

type EntitySelectorDialog = {
	getSelectedItems: () => EntitySelectorItem[],
	destroy: () => void,
};

type EntityTagSelector = {
	renderTo: (node: HTMLElement) => void,
	getDialog: () => EntitySelectorDialog | null,
	unsubscribeAll: () => void,
	focusZone?: { deactivate: () => void },
};

export type EntitySelectorFactory = (options: Object) => EntityTagSelector;

export type CatalogShareDialogViewCallbacks = {
	onRetry: () => void,
	onSelectAudience: (audience: AudienceValue) => void,
	onSetMembers: (users: CatalogShareParticipant[], departments: CatalogShareParticipant[]) => void,
	onSaveShare: () => void,
	onCopyApplicationLink: () => void,
	onOpenLinkSettings: () => void,
	onCloseLinkSettings: () => void,
	onSetLinkExpiryEnabled: (expiryEnabled: boolean) => void,
	onSetLinkExpiry: (expiresAt: Date) => void,
	onSetLinkRequireB24Auth: (requireB24Auth: boolean) => void,
	onSaveAndCopyLink: () => void,
	onRequestPortalLinkRevoke: () => void,
};

type CatalogShareDialogViewOptions = {
	application: CatalogShareApplication,
	callbacks: CatalogShareDialogViewCallbacks,
	selectorFactory?: EntitySelectorFactory,
	now?: () => Date,
};

export type CatalogShareDialogRendering = {
	content: HTMLElement,
	leftButtons: Button[],
	rightButtons: Button[],
};

const AUDIENCE_MESSAGES = Object.freeze({
	[Audience.OwnerOnly]: 'VIBECODECONNECTOR_CATALOG_SHARE_AUDIENCE_OWNER_ONLY',
	[Audience.SpecificMembers]: 'VIBECODECONNECTOR_CATALOG_SHARE_AUDIENCE_SPECIFIC_MEMBERS',
	[Audience.Portal]: 'VIBECODECONNECTOR_CATALOG_SHARE_AUDIENCE_PORTAL',
	[Audience.Authenticated]: 'VIBECODECONNECTOR_CATALOG_SHARE_AUDIENCE_AUTHENTICATED',
	[Audience.Public]: 'VIBECODECONNECTOR_CATALOG_SHARE_AUDIENCE_PUBLIC',
});

const AUDIENCES: AudienceValue[] = [
	Audience.OwnerOnly,
	Audience.SpecificMembers,
	Audience.Portal,
	Audience.Authenticated,
	Audience.Public,
];

function getMessage(code: string): string
{
	return Loc.getMessage(code) ?? '';
}

function hasDirectGlobalAccess(audience: ?AudienceValue): boolean
{
	return audience === Audience.Authenticated || audience === Audience.Public;
}

export class CatalogShareDialogView
{
	#application: CatalogShareApplication;
	#callbacks: CatalogShareDialogViewCallbacks;
	#selectorFactory: EntitySelectorFactory;
	#now: () => Date;
	#tagSelector: EntityTagSelector | null = null;
	#audienceMenu: Menu | null = null;
	#audienceMenuOpened: boolean = false;
	#snapshot: CatalogShareSnapshot | null = null;
	#shareButton: Button | null = null;
	#buttons: Button[] = [];
	#inputs: Input[] = [];
	#switchers: Map<string, Switcher> = new Map();
	#datePicker: DatePicker | null = null;
	#boundNodes: HTMLElement[] = [];

	constructor(options: CatalogShareDialogViewOptions)
	{
		this.#application = options.application;
		this.#callbacks = options.callbacks;
		this.#now = options.now ?? (() => new Date());
		this.#selectorFactory = options.selectorFactory ?? ((selectorOptions) => {
			return new TagSelector(selectorOptions);
		});
	}

	render(snapshot: CatalogShareSnapshot): CatalogShareDialogRendering
	{
		this.#disposeControls();
		this.#destroyTagSelector();
		this.#snapshot = snapshot;

		if (snapshot.status === CatalogShareViewState.Loading)
		{
			return {
				content: this.#renderLoading(),
				leftButtons: [],
				rightButtons: [],
			};
		}

		if (snapshot.status === CatalogShareViewState.LoadError)
		{
			return {
				content: this.#renderLoadError(),
				leftButtons: [],
				rightButtons: [],
			};
		}

		if (
			snapshot.status === CatalogShareViewState.GeneratingDefaultLink
			|| snapshot.status === CatalogShareViewState.LinkSettings
			|| snapshot.status === CatalogShareViewState.ConfirmAnonymousLink
			|| snapshot.status === CatalogShareViewState.ConfirmPortalLinkRevoke
			|| snapshot.status === CatalogShareViewState.SavingLink
		)
		{
			return this.#renderLinkSettings(snapshot);
		}

		const content = this.#renderEditor(snapshot);
		const buttons = this.#createFooterButtons(snapshot);

		return {
			content,
			leftButtons: buttons.left,
			rightButtons: buttons.right,
		};
	}

	destroy(): void
	{
		this.#disposeControls();
		this.#destroySwitchers();
		this.#destroyTagSelector();
		this.#snapshot = null;
	}

	updateShareButton(snapshot: CatalogShareSnapshot): void
	{
		const isDisabled = this.#isShareButtonDisabled(snapshot);
		this.#shareButton?.setDisabled(isDisabled);

		if (this.#shareButton !== null)
		{
			this.#shareButton.render().hidden = this.#isShareButtonHidden(snapshot);
		}

		if (!isDisabled)
		{
			this.#shareButton?.removeClass(ButtonState.DISABLED);
		}
	}

	#renderLoading(): HTMLElement
	{
		return Tag.render`
			<div
				class="vibecode-catalog__share-dialog-loading ui-text --sm"
				data-state="loading"
				aria-busy="true"
			>
				${getMessage('VIBECODECONNECTOR_CATALOG_SHARE_LOADING')}
			</div>
		`;
	}

	#renderLoadError(): HTMLElement
	{
		const retryButton = this.#createButton({
			text: getMessage('VIBECODECONNECTOR_CATALOG_SHARE_RETRY'),
			style: AirButtonStyle.FILLED,
			dataset: { testid: 'vibecode-catalog-share-retry' },
			onclick: this.#callbacks.onRetry,
		});

		return Tag.render`
			<div class="vibecode-catalog__share-dialog-error" data-state="loadError">
				<p class="ui-text --sm">${getMessage('VIBECODECONNECTOR_CATALOG_SHARE_LOAD_ERROR')}</p>
				${retryButton.render()}
			</div>
		`;
	}

	#renderLinkSettings(snapshot: CatalogShareSnapshot): CatalogShareDialogRendering
	{
		const content = document.createElement('div');
		content.className = 'vibecode-catalog__share-dialog vibecode-catalog__share-link-settings';
		content.dataset.state = snapshot.status;

		Dom.append(Tag.render`
			<p class="vibecode-catalog__share-link-description ui-text --sm">
				${getMessage('VIBECODECONNECTOR_CATALOG_SHARE_LINK_DESCRIPTION')}
			</p>
		`, content);
		if (snapshot.status === CatalogShareViewState.GeneratingDefaultLink)
		{
			Dom.append(Tag.render`
				<p
					class="vibecode-catalog__share-link-generating ui-text --sm"
					data-testid="vibecode-catalog-share-link-generating"
					aria-busy="true"
				>
					${getMessage('VIBECODECONNECTOR_CATALOG_SHARE_LINK_GENERATING')}
				</p>
			`, content);

			return { content, leftButtons: [], rightButtons: [] };
		}

		if (snapshot.linkState?.availability === LinkAvailability.Unavailable)
		{
			Dom.append(Tag.render`
				<p class="vibecode-catalog__share-notice ui-text --sm" role="status">
					${getMessage('VIBECODECONNECTOR_CATALOG_SHARE_LINK_UNAVAILABLE')}
				</p>
			`, content);

			const buttons = this.#createLinkFooterButtons(snapshot);

			return { content, leftButtons: buttons.left, rightButtons: buttons.right };
		}

		if (snapshot.linkDraft !== null)
		{
			Dom.append(this.#renderExpiryInput(snapshot), content);
			Dom.append(this.#renderAuthCheckbox(snapshot), content);
		}

		if (snapshot.errorCode !== null)
		{
			let errorMessage = 'VIBECODECONNECTOR_CATALOG_SHARE_LINK_SAVE_ERROR';
			if (snapshot.errorCode === 'COPY_FAILED')
			{
				errorMessage = 'VIBECODECONNECTOR_CATALOG_SHARE_LINK_COPY_ERROR';
			}
			else if (['LINK_EXPIRY_TOO_SOON', 'LINK_EXPIRY_TOO_LATE'].includes(snapshot.errorCode))
			{
				errorMessage = 'VIBECODECONNECTOR_CATALOG_SHARE_LINK_EXPIRY_ERROR';
			}
			Dom.append(Tag.render`
				<p class="vibecode-catalog__share-error ui-text --sm" role="alert">
					${getMessage(errorMessage)}
				</p>
			`, content);
		}

		const buttons = this.#createLinkFooterButtons(snapshot);

		return { content, leftButtons: buttons.left, rightButtons: buttons.right };
	}

	#renderExpiryInput(snapshot: CatalogShareSnapshot): HTMLElement
	{
		const isEditable = snapshot.status === CatalogShareViewState.LinkSettings;
		const expiryEnabled = snapshot.linkDraft?.expiryEnabled === true;
		const isExpired = this.#isLinkExpired(snapshot);
		const section = document.createElement('div');
		section.className = 'vibecode-catalog__share-link-expiry';

		const expirySwitcher = this.#createSwitcher({
			id: `vibecode-catalog-share-expiry-enabled-${this.#application.id}`,
			checked: expiryEnabled,
			disabled: !isEditable,
			testId: 'vibecode-catalog-share-link-expiry-switch',
			ariaLabel: getMessage('VIBECODECONNECTOR_CATALOG_SHARE_LINK_EXPIRY'),
			onToggle: this.#callbacks.onSetLinkExpiryEnabled,
		});
		const switchLabel = document.createElement('div');
		switchLabel.className = 'vibecode-catalog__share-link-switch-row';
		Dom.append(expirySwitcher.getNode(), switchLabel);
		Dom.append(Tag.render`
			<span>${getMessage('VIBECODECONNECTOR_CATALOG_SHARE_LINK_EXPIRY')}</span>
		`, switchLabel);
		Dom.append(switchLabel, section);

		const expiryInput = this.#createInput({
			readonly: true,
			design: !isEditable || !expiryEnabled ? InputDesign.Disabled : InputDesign.Grey,
			error: isExpired ? getMessage('VIBECODECONNECTOR_CATALOG_SHARE_LINK_EXPIRED') : '',
			stretched: false,
			ariaLabel: getMessage('VIBECODECONNECTOR_CATALOG_SHARE_LINK_EXPIRY_ARIA'),
		});
		const inputWrapper = expiryInput.render();
		const inputField = inputWrapper.querySelector('input');
		const composition = document.createElement('div');
		composition.className = 'vibecode-catalog__share-link-expiry-date';
		composition.dataset.testid = 'vibecode-catalog-share-link-expiry-date';
		Dom.append(inputWrapper, composition);

		const calendarButton = document.createElement('button');
		calendarButton.type = 'button';
		calendarButton.className = 'vibecode-catalog__share-link-expiry-calendar';
		calendarButton.disabled = !isEditable || !expiryEnabled;
		calendarButton.dataset.testid = 'vibecode-catalog-share-link-expiry-calendar';
		calendarButton.setAttribute(
			'aria-label',
			getMessage('VIBECODECONNECTOR_CATALOG_SHARE_LINK_CALENDAR_ARIA'),
		);
		const calendarIcon = new Icon({ icon: Outline.CALENDAR, size: 20 }).render();
		calendarIcon.setAttribute('aria-hidden', 'true');
		Dom.append(calendarIcon, calendarButton);
		Dom.append(calendarButton, composition);
		Dom.append(composition, section);

		const now = this.#now();
		const minimumExpiry = new Date(now.getTime() + 5 * 60 * 1000);
		this.#datePicker = new DatePicker({
			enableTime: true,
			selectionMode: 'single',
			selectedDates: [snapshot.linkDraft.lastFiniteExpiresAt],
			minDate: minimumExpiry,
			maxDate: new Date(now.getTime() + 315_360_000 * 1000),
			inputField,
			targetNode: composition,
		});
		this.#datePicker.subscribe('onSelect', (event) => {
			const date = event.getData().date;
			if (date instanceof Date)
			{
				this.#callbacks.onSetLinkExpiry(date);
			}
		});
		this.#datePicker.updateInputFields();
		const showDatePicker = () => {
			if (isEditable && expiryEnabled)
			{
				this.#datePicker?.show();
			}
		};

		if (inputField !== null)
		{
			Event.bind(inputField, 'click', showDatePicker);
			this.#boundNodes.push(inputField);
		}
		Event.bind(calendarButton, 'click', showDatePicker);
		this.#boundNodes.push(calendarButton);

		return section;
	}

	#renderAuthCheckbox(snapshot: CatalogShareSnapshot): HTMLElement
	{
		const label = document.createElement('div');
		label.className = 'vibecode-catalog__share-link-switch-row';
		const switcher = this.#createSwitcher({
			id: `vibecode-catalog-share-require-auth-${this.#application.id}`,
			checked: snapshot.linkDraft?.requireB24Auth === true,
			disabled: snapshot.status !== CatalogShareViewState.LinkSettings,
			testId: 'vibecode-catalog-share-link-require-auth',
			ariaLabel: getMessage('VIBECODECONNECTOR_CATALOG_SHARE_LINK_REQUIRE_AUTH'),
			onToggle: this.#callbacks.onSetLinkRequireB24Auth,
		});
		Dom.append(switcher.getNode(), label);
		Dom.append(Tag.render`<span>${getMessage('VIBECODECONNECTOR_CATALOG_SHARE_LINK_REQUIRE_AUTH')}</span>`, label);

		return label;
	}

	#createSwitcher(options: {
		id: string,
		checked: boolean,
		disabled: boolean,
		testId: string,
		ariaLabel: string,
		onToggle: (checked: boolean) => void,
	}): Switcher
	{
		let switcher = this.#switchers.get(options.id);
		if (!switcher)
		{
			switcher = new Switcher({
				id: options.id,
				checked: options.checked,
				disabled: options.disabled,
				size: SwitcherSize.extraSmall,
				useAirDesign: true,
				style: AirSwitcherStyle.TINTED,
				showStateTitle: false,
				handlers: {
					toggled() {
						options.onToggle(this.isChecked());
					},
				},
			});
			const node = switcher.getNode();
			Event.bind(node, 'keydown', (event) => {
				if (event.key === ' ' || event.key === 'Enter')
				{
					event.preventDefault();
					switcher.toggle(event);
				}
			});
			this.#switchers.set(options.id, switcher);
		}

		switcher.check(options.checked, false);
		switcher.disable(options.disabled, false);
		const node = switcher.getNode();
		node.dataset.testid = options.testId;
		node.setAttribute('role', 'switch');
		node.setAttribute('aria-label', options.ariaLabel);
		node.setAttribute('aria-checked', String(options.checked));
		node.setAttribute('aria-disabled', String(options.disabled));
		node.tabIndex = options.disabled ? -1 : 0;

		return switcher;
	}

	#createLinkFooterButtons(snapshot: CatalogShareSnapshot): { left: Button[], right: Button[] }
	{
		const isSaving = snapshot.status === CatalogShareViewState.SavingLink;
		const isExpired = this.#isLinkExpired(snapshot);
		const left = [this.#createButton({
			text: getMessage('VIBECODECONNECTOR_CATALOG_SHARE_LINK_BACK'),
			style: AirButtonStyle.OUTLINE,
			dataset: { testid: 'vibecode-catalog-share-link-back' },
			disabled: isSaving,
			onclick: this.#callbacks.onCloseLinkSettings,
		})];
		if (snapshot.linkState?.availability === LinkAvailability.Unavailable)
		{
			return { left, right: [] };
		}

		const right = [];
		if (snapshot.linkState?.link !== null && snapshot.linkState?.link !== undefined)
		{
			right.push(this.#createButton({
				text: getMessage('VIBECODECONNECTOR_CATALOG_SHARE_LINK_REVOKE'),
				style: AirButtonStyle.PLAIN,
				dataset: { testid: 'vibecode-catalog-share-link-revoke' },
				disabled: isSaving,
				onclick: this.#callbacks.onRequestPortalLinkRevoke,
			}));
		}

		right.push(this.#createButton({
			text: getMessage(snapshot.isLinkDraftDirty
				? 'VIBECODECONNECTOR_CATALOG_SHARE_LINK_SAVE_AND_COPY'
				: 'VIBECODECONNECTOR_CATALOG_SHARE_LINK_COPY'),
			style: AirButtonStyle.FILLED,
			dataset: { testid: 'vibecode-catalog-share-link-copy' },
			disabled: isSaving || isExpired,
			onclick: this.#callbacks.onSaveAndCopyLink,
		}));

		return { left, right };
	}

	#isLinkExpired(snapshot: CatalogShareSnapshot): boolean
	{
		return snapshot.linkDraft?.expiryEnabled === true
			&& snapshot.linkDraft.lastFiniteExpiresAt.getTime() <= this.#now().getTime();
	}

	#createInput(options: Object): Input
	{
		const input = new Input(options);
		this.#inputs.push(input);

		return input;
	}

	#renderEditor(snapshot: CatalogShareSnapshot): HTMLElement
	{
		const root = document.createElement('div');
		root.className = 'vibecode-catalog__share-dialog';
		root.dataset.state = snapshot.status;

		Dom.append(Tag.render`
			<p class="vibecode-catalog__share-description ui-text --sm">
				${getMessage('VIBECODECONNECTOR_CATALOG_SHARE_DESCRIPTION')}
			</p>
		`, root);
		Dom.append(this.#renderApplication(), root);
		Dom.append(Tag.render`
			<h3 class="vibecode-catalog__share-audience-title ui-text --sm">
				${getMessage('VIBECODECONNECTOR_CATALOG_SHARE_AUDIENCE_TITLE')}
			</h3>
		`, root);
		Dom.append(this.#renderAudience(snapshot), root);

		if (snapshot.status === CatalogShareViewState.MemberDraft)
		{
			Dom.append(this.#renderMembers(snapshot), root);
		}

		const linkSettingsHint = this.#renderLinkSettingsHint(snapshot);
		if (linkSettingsHint !== null)
		{
			Dom.append(linkSettingsHint, root);
		}

		if (snapshot.errorCode !== null)
		{
			const error = Tag.render`
				<p class="vibecode-catalog__share-error ui-text --sm" role="alert">
					${getMessage('VIBECODECONNECTOR_CATALOG_SHARE_SAVE_ERROR')}
				</p>
			`;
			Dom.append(error, root);
		}

		return root;
	}

	#renderLinkSettingsHint(snapshot: CatalogShareSnapshot): HTMLElement | null
	{
		if (
			snapshot.linkState?.availability !== LinkAvailability.Available
			|| hasDirectGlobalAccess(snapshot.draftShare?.audience)
		)
		{
			return null;
		}

		const hint = document.createElement('p');
		hint.className = 'vibecode-catalog__share-link-hint ui-text --sm';
		const linkSettings = document.createElement('button');
		linkSettings.type = 'button';
		linkSettings.className = 'vibecode-catalog__share-link-action';
		linkSettings.dataset.testid = 'vibecode-catalog-share-link-settings';
		linkSettings.disabled = snapshot.status !== CatalogShareViewState.Audience
			&& snapshot.status !== CatalogShareViewState.MemberDraft;
		Event.bind(linkSettings, 'click', this.#callbacks.onOpenLinkSettings);
		this.#boundNodes.push(linkSettings);

		const message = getMessage('VIBECODECONNECTOR_CATALOG_SHARE_LINK_HINT');
		const linkStart = message.indexOf('[link]');
		const linkEnd = message.indexOf('[/link]');
		if (linkStart === -1 || linkEnd < linkStart)
		{
			hint.textContent = message;

			return hint;
		}

		Dom.append(document.createTextNode(message.slice(0, linkStart)), hint);
		linkSettings.textContent = message.slice(linkStart + '[link]'.length, linkEnd);
		Dom.append(linkSettings, hint);
		Dom.append(document.createTextNode(message.slice(linkEnd + '[/link]'.length)), hint);

		return hint;
	}

	#renderApplication(): HTMLElement
	{
		const application = document.createElement('div');
		application.className = 'vibecode-catalog__share-application';

		const iconContainer = document.createElement('span');
		iconContainer.className = 'vibecode-catalog__share-application-icon';
		iconContainer.setAttribute('aria-hidden', 'true');
		if (this.#application.color !== null)
		{
			Dom.style(iconContainer, 'backgroundColor', this.#application.color);
		}

		if (this.#application.iconUrl !== null)
		{
			const icon = document.createElement('img');
			icon.alt = '';
			icon.src = this.#application.iconUrl;
			Dom.append(icon, iconContainer);
		}

		const title = document.createElement('span');
		title.className = 'ui-text --sm';
		title.textContent = this.#application.title;

		Dom.append(iconContainer, application);
		Dom.append(title, application);

		return application;
	}

	#renderAudience(snapshot: CatalogShareSnapshot): HTMLElement
	{
		const audience = document.createElement('div');
		audience.className = 'vibecode-catalog__share-audience';

		const isDisabled = (
			snapshot.status !== CatalogShareViewState.Audience
			&& snapshot.status !== CatalogShareViewState.MemberDraft
		) || snapshot.pendingAudience !== null || snapshot.ownerOnlyConfirmationRequired;
		const currentAudience = snapshot.draftShare?.audience ?? Audience.OwnerOnly;
		let triggerNode: HTMLElement | null = null;
		const input = this.#createInput({
			value: getMessage(AUDIENCE_MESSAGES[currentAudience]),
			readonly: true,
			dropdown: true,
			clickable: true,
			stretched: true,
			design: isDisabled ? InputDesign.Disabled : InputDesign.Grey,
			ariaLabel: getMessage('VIBECODECONNECTOR_CATALOG_SHARE_AUDIENCE_ARIA'),
			onClick: () => {
				if (triggerNode !== null)
				{
					this.#toggleAudienceMenu(triggerNode, isDisabled);
				}
			},
		});
		const node = input.render();
		triggerNode = node;
		node.dataset.testid = 'vibecode-catalog-share-audience';
		node.setAttribute('role', 'combobox');
		node.setAttribute('aria-haspopup', 'listbox');
		node.setAttribute('aria-expanded', 'false');
		node.setAttribute('aria-disabled', String(isDisabled));
		node.tabIndex = isDisabled ? -1 : 0;
		Event.bind(node, 'keydown', (event) => {
			if (!isDisabled && (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown'))
			{
				event.preventDefault();
				this.#toggleAudienceMenu(node, false);
			}
		});
		this.#boundNodes.push(node);
		Dom.append(node, audience);

		return audience;
	}

	#toggleAudienceMenu(bindNode: HTMLElement, isDisabled: boolean): void
	{
		if (isDisabled)
		{
			return;
		}

		if (this.#audienceMenuOpened)
		{
			this.#audienceMenu?.close();

			return;
		}

		const currentAudience = this.#snapshot?.draftShare?.audience ?? Audience.OwnerOnly;
		const items = AUDIENCES.map((audienceValue) => ({
			id: audienceValue,
			dataset: {
				testid: `vibecode-catalog-share-audience-${audienceValue.toLowerCase().replaceAll('_', '-')}`,
			},
			title: getMessage(AUDIENCE_MESSAGES[audienceValue]),
			isSelected: audienceValue === currentAudience,
			onClick: () => {
				this.#audienceMenu?.close();
				this.#callbacks.onSelectAudience(audienceValue);
			},
		}));
		if (this.#audienceMenu === null)
		{
			this.#audienceMenu = new Menu({
				closeOnItemClick: false,
				items,
				events: {
					onShow: () => {
						const menuButtons = this.#audienceMenu?.getPopup()?.getPopupContainer()
							?.querySelectorAll('.ui-popup-menu-item-action') ?? [];
						items.forEach((item, index) => {
							if (menuButtons[index])
							{
								Object.assign(menuButtons[index].dataset, item.dataset);
							}
						});
						this.#audienceMenuOpened = true;
						bindNode.setAttribute('aria-expanded', 'true');
						Dom.addClass(bindNode, '--active');
					},
					onClose: () => {
						this.#audienceMenuOpened = false;
						bindNode.setAttribute('aria-expanded', 'false');
						Dom.removeClass(bindNode, '--active');
					},
				},
			});
		}
		else
		{
			this.#audienceMenu.updateItems(items);
		}

		this.#audienceMenu.show(bindNode);
	}

	#renderMembers(snapshot: CatalogShareSnapshot): HTMLElement
	{
		const section = document.createElement('div');
		section.className = 'vibecode-catalog__share-members';
		section.dataset.testid = 'vibecode-catalog-share-members';
		section.setAttribute('aria-label', getMessage('VIBECODECONNECTOR_CATALOG_SHARE_MEMBERS_ARIA'));
		const selectedItems = [
			...(snapshot.draftShare?.users ?? []).map(({ id }) => ['user', id]),
			...(snapshot.draftShare?.departments ?? []).map(({ id }) => ['department', id]),
		];
		const items = [
			...(snapshot.draftShare?.users ?? []).map(({ id, name }) => ({ id, entityId: 'user', title: name })),
			...(snapshot.draftShare?.departments ?? [])
				.map(({ id, name }) => ({ id, entityId: 'department', title: name })),
		];
		let tagSelector = null;
		let memberSyncScheduled = false;
		const scheduleMemberSync = () => {
			if (memberSyncScheduled)
			{
				return;
			}

			memberSyncScheduled = true;
			void Promise.resolve().then(() => {
				memberSyncScheduled = false;
				if (this.#tagSelector === tagSelector)
				{
					this.#syncMembers();
				}
			});
		};
		tagSelector = this.#selectorFactory({
			id: `vibecode-catalog-share-members-${this.#application.id}`,
			items,
			multiple: true,
			textBoxAutoHide: false,
			textBoxWidth: 350,
			maxHeight: 99,
			placeholder: getMessage('VIBECODECONNECTOR_CATALOG_SHARE_ADD_MEMBERS'),
			addButtonCaption: getMessage('VIBECODECONNECTOR_CATALOG_SHARE_ADD_MEMBERS'),
			events: {
				onTagAdd: scheduleMemberSync,
				onTagRemove: scheduleMemberSync,
			},
			dialogOptions: {
				preselectedItems: selectedItems,
				multiple: true,
				hideOnDeselect: false,
				entities: [
					{ id: 'user', options: { intranetUsersOnly: true } },
					{
						id: 'department',
						options: {
							selectMode: 'usersAndDepartments',
							allowFlatDepartments: true,
							allowSelectRootDepartment: true,
						},
					},
				],
				events: {
					'Item:onSelect': scheduleMemberSync,
					'Item:onDeselect': scheduleMemberSync,
				},
			},
		});
		this.#tagSelector = tagSelector;
		this.#tagSelector.renderTo(section);

		return section;
	}

	#createFooterButtons(snapshot: CatalogShareSnapshot): { left: Button[], right: Button[] }
	{
		const isSaving = snapshot.status === CatalogShareViewState.SavingShare
			|| snapshot.status === CatalogShareViewState.RefreshingLink;
		if (
			snapshot.status !== CatalogShareViewState.Audience
			&& snapshot.status !== CatalogShareViewState.MemberDraft
			&& !isSaving
		)
		{
			return { left: [], right: [] };
		}

		const right = [];
		if (
			hasDirectGlobalAccess(snapshot.draftShare?.audience)
			&& Type.isStringFilled(this.#application.viewUrl)
		)
		{
			right.push(this.#createButton({
				text: getMessage('VIBECODECONNECTOR_CATALOG_SHARE_COPY_APPLICATION_LINK'),
				style: AirButtonStyle.PLAIN,
				dataset: { testid: 'vibecode-catalog-share-copy-application-link' },
				disabled: isSaving,
				onclick: this.#callbacks.onCopyApplicationLink,
			}));
		}

		this.#shareButton = this.#createButton({
			text: getMessage('VIBECODECONNECTOR_CATALOG_SHARE_SAVE'),
			style: AirButtonStyle.FILLED,
			dataset: { testid: 'vibecode-catalog-share-save' },
			disabled: this.#isShareButtonDisabled(snapshot),
			onclick: this.#callbacks.onSaveShare,
		});
		this.updateShareButton(snapshot);
		right.push(this.#shareButton);

		return { left: [], right };
	}

	#isShareButtonDisabled(snapshot: CatalogShareSnapshot): boolean
	{
		return snapshot.status === CatalogShareViewState.SavingShare
			|| snapshot.status === CatalogShareViewState.RefreshingLink
			|| this.#isShareButtonHidden(snapshot)
			|| !snapshot.isShareDraftDirty;
	}

	#isShareButtonHidden(snapshot: CatalogShareSnapshot): boolean
	{
		return snapshot.draftShare?.audience === Audience.SpecificMembers
			&& snapshot.draftShare.users.length === 0
			&& snapshot.draftShare.departments.length === 0;
	}

	#createButton(options: Object): Button
	{
		const button = new Button({
			size: ButtonSize.MEDIUM,
			useAirDesign: true,
			...options,
		});
		this.#buttons.push(button);

		return button;
	}

	#syncMembers(): void
	{
		const users = [];
		const departments = [];
		this.#tagSelector?.getDialog()?.getSelectedItems().forEach((item) => {
			const participant = {
				id: String(item.getId()),
				name: item.getTitle(),
			};
			if (item.getEntityId() === 'user')
			{
				users.push(participant);
			}
			else if (item.getEntityId() === 'department')
			{
				departments.push(participant);
			}
		});

		this.#callbacks.onSetMembers(users, departments);
	}

	#disposeControls(): void
	{
		this.#audienceMenu?.destroy();
		this.#audienceMenu = null;
		this.#audienceMenuOpened = false;
		this.#datePicker?.destroy();
		this.#datePicker = null;
		this.#inputs.forEach((input) => input.destroy());
		this.#inputs = [];
		this.#boundNodes.forEach((node) => Event.unbindAll(node));
		this.#boundNodes = [];
		this.#buttons.forEach((button) => button.unbindEvent('click'));
		this.#buttons = [];
		this.#shareButton = null;
	}

	#destroySwitchers(): void
	{
		const switcherList = Switcher.getList();
		this.#switchers.forEach((switcher) => {
			Event.unbindAll(switcher.getNode());
			const index = switcherList.indexOf(switcher);
			if (index !== -1)
			{
				switcherList.splice(index, 1);
			}
		});
		this.#switchers.clear();
	}

	#destroyTagSelector(): void
	{
		if (this.#tagSelector === null)
		{
			return;
		}

		this.#tagSelector.focusZone?.deactivate();
		this.#tagSelector.unsubscribeAll();
		this.#tagSelector.getDialog()?.destroy();
		this.#tagSelector = null;
	}
}

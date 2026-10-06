import { Loc, Tag, Type } from 'main.core';
import { type BaseEvent } from 'main.core.events';
import { AirButtonStyle, Button } from 'ui.buttons';
import { TagSelector, type Item, type ItemId, type ItemOptions } from 'ui.entity-selector';
import { Dialog } from 'ui.system.dialog';

import type { PilotAudienceEntry, PilotAudienceMember } from '../../api/pilot-api';
import {
	DEPARTMENT_ENTITY_ID,
	STRUCTURE_NODE_ENTITY_ID,
	TEAM_NODE_ENTITY_TYPE,
	USER_ENTITY_ID,
	getAccessCodeByItem,
	getItemIdByAccessCode,
} from '../../lib/access-code';

const DIALOG_WIDTH = 540;

function toMember(entry: PilotAudienceEntry): PilotAudienceMember | null
{
	if (Type.isStringFilled(entry))
	{
		return { accessCode: entry };
	}

	return Type.isStringFilled(entry?.accessCode) ? entry : null;
}

/**
 * The choice of an audience, on its own: it asks who the version is for and answers with access codes,
 * knowing nothing of what the caller does with them afterwards.
 */
export class PilotAudienceDialog
{
	#audience: Set<string>;
	#selector: TagSelector;
	#confirmButton: Button;
	#dialog: Dialog;
	#resolve: ((audience: string[] | null) => void) | null = null;
	#isSelectorReleased: boolean = false;

	static open(audience: PilotAudienceEntry[] = []): Promise<string[] | null>
	{
		return new this(audience).open();
	}

	constructor(audience: PilotAudienceEntry[] = [])
	{
		const members = (Type.isArray(audience) ? audience : [])
			.map((entry: PilotAudienceEntry) => toMember(entry))
			.filter((member: PilotAudienceMember | null) => member !== null)
		;

		// The codes, not the items of the selector, are the answer of the dialog: an element the
		// selector could not load stays in the audience instead of disappearing from it silently.
		this.#audience = new Set(members.map((member: PilotAudienceMember) => member.accessCode));
		this.#selector = this.#createSelector(members);
		this.#confirmButton = this.#createConfirmButton();
		this.#dialog = this.#createDialog();
	}

	// The dialog answers once and is not reopened, so the selector leaves together with the answer:
	// a confirmation, a refusal, the cross and Escape all end up here.
	open(): Promise<string[] | null>
	{
		return new Promise((resolve) => {
			this.#resolve = resolve;
			this.#dialog.show();
		}).finally(() => this.#releaseSelector());
	}

	getAudience(): string[]
	{
		return [...this.#audience];
	}

	getSelector(): TagSelector
	{
		return this.#selector;
	}

	isConfirmEnabled(): boolean
	{
		return !this.#confirmButton.isDisabled();
	}

	#createSelector(members: PilotAudienceMember[]): TagSelector
	{
		const preselectedItems: ItemId[] = members
			.filter((member: PilotAudienceMember) => member.available !== false)
			.map((member: PilotAudienceMember) => getItemIdByAccessCode(member.accessCode))
			.filter((itemId: ItemId | null) => itemId !== null)
		;

		const unavailableItems: ItemOptions[] = members
			.filter((member: PilotAudienceMember) => member.available === false)
			.map((member: PilotAudienceMember) => this.#describeUnavailableMember(member))
			.filter((item: ItemOptions | null) => item !== null)
		;

		return new TagSelector({
			multiple: true,
			addButtonCaption: Loc.getMessage('BIZPROCDESIGNER_EDITOR_PILOT_AUDIENCE_SELECT'),
			addButtonCaptionMore: Loc.getMessage('BIZPROCDESIGNER_EDITOR_PILOT_AUDIENCE_ADD'),
			dialogOptions: {
				enableSearch: true,
				preselectedItems,
				// Already chosen and shown as they came, without asking the server: these are exactly
				// the elements it cannot resolve anymore.
				selectedItems: unavailableItems,
				entities: [
					{
						id: USER_ENTITY_ID,
						options: {
							intranetUsersOnly: true,
						},
					},
					{
						id: DEPARTMENT_ENTITY_ID,
						options: {
							selectMode: 'usersAndDepartments',
							// A department can be taken alone or together with everyone below it, and
							// the difference travels on as D{id} against DR{id}.
							allowFlatDepartments: true,
							allowSelectRootDepartment: true,
						},
					},
					// Teams live in the HR structure only and are not mirrored into the old one, so
					// they come from their own source; departments stay on the source above and on
					// their old codes. On a portal without the HR module the platform leaves this
					// entity out of the dialog on its own, entity by entity.
					{
						id: STRUCTURE_NODE_ENTITY_ID,
						options: {
							includedNodeEntityTypes: [TEAM_NODE_ENTITY_TYPE],
							// Teams are fetched flat only in this branch of the provider; otherwise it
							// asks for the first depth level of the tree and the tab comes back empty.
							useMultipleTabs: true,
							selectMode: 'usersAndDepartments',
							allowFlatDepartments: true,
							allowSelectRootDepartment: true,
							visual: {
								avatarMode: 'node',
								tagStyle: 'none',
							},
						},
					},
				],
				events: {
					'Item:onSelect': (event: BaseEvent) => this.#handleItemChange(event.getData().item, true),
					'Item:onDeselect': (event: BaseEvent) => this.#handleItemChange(event.getData().item, false),
				},
			},
		});
	}

	#describeUnavailableMember(member: PilotAudienceMember): ItemOptions | null
	{
		const itemId = getItemIdByAccessCode(member.accessCode);
		if (itemId === null)
		{
			return null;
		}

		const [entityId, id] = itemId;

		return {
			id,
			entityId,
			title: member.title ?? member.accessCode,
			subtitle: Loc.getMessage('BIZPROCDESIGNER_EDITOR_PILOT_AUDIENCE_UNAVAILABLE'),
		};
	}

	#createConfirmButton(): Button
	{
		const button = new Button({
			text: Loc.getMessage('BIZPROCDESIGNER_EDITOR_PILOT_AUDIENCE_CONFIRM'),
			useAirDesign: true,
			style: AirButtonStyle.FILLED,
			dataset: { testid: 'bizprocdesigner-pilot-audience-confirm' },
		});

		button.setDisabled(this.#audience.size === 0);
		button.bindEvent('click', () => {
			this.#finish([...this.#audience]);
			this.#dialog.hide();
		});

		return button;
	}

	#createDialog(): Dialog
	{
		const cancelButton = new Button({
			text: Loc.getMessage('BIZPROCDESIGNER_EDITOR_PILOT_AUDIENCE_CANCEL'),
			useAirDesign: true,
			style: AirButtonStyle.OUTLINE,
			dataset: { testid: 'bizprocdesigner-pilot-audience-cancel' },
		});

		const dialog = new Dialog({
			title: Loc.getMessage('BIZPROCDESIGNER_EDITOR_PILOT_AUDIENCE_TITLE'),
			subtitle: Loc.getMessage('BIZPROCDESIGNER_EDITOR_PILOT_AUDIENCE_SUBTITLE'),
			content: this.#renderContent(),
			width: DIALOG_WIDTH,
			hasOverlay: true,
			// The selector opens its own popup over the dialog, and a click in it must not read as a
			// click outside: the choice is dropped only by an explicit refusal.
			closeByClickOutside: false,
			centerButtons: [cancelButton, this.#confirmButton],
			events: {
				// Escape and the close cross end the same way as the cancel button.
				onHide: () => this.#finish(null),
			},
		});

		cancelButton.bindEvent('click', () => dialog.hide());

		return dialog;
	}

	#renderContent(): HTMLElement
	{
		const content = Tag.render`<div data-testid="bizprocdesigner-pilot-audience-selector"></div>`;
		this.#selector.renderTo(content);

		return content;
	}

	#handleItemChange(item: Item, chosen: boolean): void
	{
		const accessCode = getAccessCodeByItem(item);
		if (accessCode === null)
		{
			return;
		}

		if (chosen)
		{
			this.#audience.add(accessCode);
		}
		else
		{
			this.#audience.delete(accessCode);
		}

		// An empty audience is not published: the server refuses it as well, and the button says so
		// before the round trip.
		this.#confirmButton.setDisabled(this.#audience.size === 0);
	}

	// Answers once: whichever of the two ways closes the dialog first owns the answer, and the hide
	// that follows a confirmation does not turn it into a refusal.
	#finish(audience: string[] | null): void
	{
		const resolve = this.#resolve;
		if (resolve === null)
		{
			return;
		}

		this.#resolve = null;
		resolve(audience);
	}

	// The dialog of the selector stays in a list of the platform that lives as long as the page, and only
	// `destroy()` takes it out of there together with its popup and its loaded elements.
	#releaseSelector(): void
	{
		if (this.#isSelectorReleased)
		{
			return;
		}

		this.#isSelectorReleased = true;
		// A destroyed instance loses its methods, so the guard above is what keeps a repeated call safe.
		this.#selector.getDialog()?.destroy();
	}
}

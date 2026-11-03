import { Dom, Loc, Text, Type } from 'main.core';
import { InteractivityChecker, LiveAnnouncer } from 'ui.a11y';
import { UI } from 'ui.notification';
import type { HintParams } from 'ui.vue3.directives.hint';
import { MessageBox, MessageBoxButtons } from 'ui.dialogs.messagebox';
import { computed, type VueRefValue } from 'ui.vue3';

import {
	diagramStore as useDiagramStore,
	BLOCK_TOAST_TYPES,
	TEMPLATE_PUBLISH_STATUSES,
} from '../../../entities/blocks';
import {
	buildConsequencesText,
	getMissingConfirmations,
	PilotAudienceDialog,
	usePilotAudienceStore,
} from '../../../features/pilot';
import type { ApiError } from '../../../shared/api';
import { useToastStore } from '../../../shared/stores';
import { handleResponseError } from '../../../shared/utils';

// What the publisher is told before the scheme goes to the audience, one wording per consequence the
// server names. Which of them applies is decided by the server: whether the template has a common
// version and what its constants hold is known there, not here.
const MAIN_PUBLISH_BUTTON_SELECTOR = '[data-testid="bizprocdesigner-split-button-main"]';

const PILOT_CONFIRMATION_DIALOG = {
	titleMessageId: 'BIZPROCDESIGNER_EDITOR_PILOT_PUBLISH_CONFIRM_TITLE',
	messages: new Map([
		['settingsFreeze', 'BIZPROCDESIGNER_EDITOR_PILOT_PUBLISH_CONFIRM_SETTINGS_FREEZE'],
		['emptyConstants', 'BIZPROCDESIGNER_EDITOR_PILOT_PUBLISH_CONFIRM_EMPTY_CONSTANTS'],
	]),
	fallbackMessageId: 'BIZPROCDESIGNER_EDITOR_PILOT_PUBLISH_CONFIRM',
};

// The same for the publication that stops the processes started before it. Its consequences arrive in
// one answer of the server, so both wordings are known here and the publisher sees them in one dialog
// and agrees once. The publication to an audience this mode puts an end to is told about in the very
// wording of the operation that ends it - the consequence is the same one.
const CONFIRMATION_STOP_RUNNING_PROCESSES = 'stopRunningProcesses';
const CONFIRMATION_PILOT_STOP = 'pilotStop';

const FULL_CONFIRMATION_DIALOG = {
	titleMessageId: 'BIZPROCDESIGNER_EDITOR_FULL_PUBLISH_CONFIRM_TITLE',
	messages: new Map([
		[CONFIRMATION_STOP_RUNNING_PROCESSES, 'BIZPROCDESIGNER_EDITOR_FULL_PUBLISH_CONFIRM_STOP_RUNNING'],
		[CONFIRMATION_PILOT_STOP, 'BIZPROCDESIGNER_EDITOR_PILOT_STOP_CONFIRM'],
	]),
	fallbackMessageId: 'BIZPROCDESIGNER_EDITOR_FULL_PUBLISH_CONFIRM',
};

type FullPublishOutcome = {
	messageId: string,
	politeness: 'polite' | 'assertive',
};

// How that publication ended, in the words the publisher hears. The wait of the button and the balloon
// of the success are a look and nothing more - neither of them reaches a screen reader - so the end of
// an operation agreed to as irreversible is named outright, and its refusal insistently.
const FULL_PUBLISH_OUTCOMES: { [string]: FullPublishOutcome } = {
	PUBLISHED: {
		messageId: 'BIZPROCDESIGNER_EDITOR_FULL_PUBLISH_PUBLISHED_ANNOUNCE',
		politeness: 'polite',
	},
	FAILED: {
		messageId: 'BIZPROCDESIGNER_EDITOR_FULL_PUBLISH_FAILED_ANNOUNCE',
		politeness: 'assertive',
	},
	CANCELLED: {
		messageId: 'BIZPROCDESIGNER_EDITOR_FULL_PUBLISH_CANCELLED_ANNOUNCE',
		politeness: 'polite',
	},
	// Published, and the stop of the previous processes was not scheduled: a part of an irreversible
	// operation is missing, and the one who listens has to hear it as insistently as a failure.
	TERMINATION_NOT_SCHEDULED: {
		messageId: 'BIZPROCDESIGNER_EDITOR_FULL_PUBLISH_TERMINATION_NOT_SCHEDULED_ANNOUNCE',
		politeness: 'assertive',
	},
};

export const usePublishTemplate = (props: { readonly: boolean } = { readonly: false }): {
	isPublishing: VueRefValue<boolean>,
	canPublish: VueRefValue<boolean>,
	isPublishInert: VueRefValue<boolean>,
	publishHint: VueRefValue<?HintParams>,
	publishTemplate: () => void,
	publishToChosenAudience: () => ?Promise<void>,
} => {
	const diagram = useDiagramStore();
	const toastStore = useToastStore();
	// The flag lives in the store: every publish surface shares one, so the toolbar button and the
	// restore bar cannot each start their own publication of the same template.
	const isPublishing = computed((): boolean => diagram.isPublishing);
	const canPublish = computed((): boolean => diagram.canPublish);
	// Every way to publish - the button, the items of its menu, the bar of a restored version alike -
	// stays inert while the write is locked, instead of starting a publication the store refuses.
	//
	// The whole lock and not the deleted template alone. The store refuses the write on the view of a
	// version and on the transition into it too, and the bar of a restored version stays on screen
	// through that transition with a button of its own. A publication started there sent nothing and
	// changed nothing, yet announced its beginning and then, assertively, its failure - telling of an
	// irreversible operation that never happened, and telling it only to the one who listens.
	const isPublishInert = computed((): boolean => props.readonly || diagram.isWriteLocked);
	// The hint is the only explanation a disabled button has: its hidden description for a screen reader is
	// built out of this very text, so an empty hint leaves the keyboard and the screen reader with
	// "Publish, button, unavailable" and no reason. Both refusals are explained, and the right one wins:
	// a user who may not publish at all is told that first.
	const publishRefusalPhrase = computed((): ?string => {
		if (!diagram.canPublish)
		{
			return 'BIZPROCDESIGNER_EDITOR_PUBLISH_ACCESS_DENIED_HINT';
		}

		return isPublishInert.value ? 'BIZPROCDESIGNER_EDITOR_PUBLISH_WRITE_LOCKED_HINT' : null;
	});
	// Who started the publication. The dialogs of an irreversible operation must give the focus back to that
	// control, and the platform on its own gives it back to whatever document.activeElement held when the
	// dialog was shown - that is, to what the click or the key press happened to leave behind, and browsers
	// leave behind different things. So the target is named instead of remembered: a function, because it is
	// resolved when the dialog closes, and by then the node may have been re-created by a render.
	let publicationInitiator = null;
	const rememberPublicationInitiator = (): void => {
		publicationInitiator = document.activeElement instanceof HTMLElement ? document.activeElement : null;
	};
	const publicationFocusOwner = (): ?HTMLElement => {
		// Focusable and not merely still in the document. A node that is there and cannot take the focus is
		// the common case rather than the exception: <body> is what document.activeElement holds where the
		// browser leaves nothing behind, and a lock that arrives while the dialog is open takes the disabled
		// attribute and the tab stop away from the very button the publication was started from. Either way
		// the reserve below must take over, and isConnected never lets it.
		if (publicationInitiator !== null && InteractivityChecker.isFocusable(publicationInitiator))
		{
			return publicationInitiator;
		}

		// The surface that started it is gone or refuses the focus - the bar of a restored version
		// disappears with the restore itself - so the focus goes to the button that is always there.
		return document.querySelector(MAIN_PUBLISH_BUTTON_SELECTOR);
	};
	// The platform gives the focus back to what it captured when the dialog was shown, and a key press or a
	// click does not everywhere leave the pressed control focused: in Firefox nothing is captured, the focus
	// ends up on <body>, and the publisher who has just answered an irreversible question with the keyboard
	// has nowhere to go on from. So the owner of the operation puts the focus back itself - the same rescue
	// the panels of the editor do when the application destroys a subtree under a focused node - and only
	// from <body>: taking the focus away from someone who has moved on elsewhere is never right.
	const rescuePublicationFocus = (): void => {
		const active = document.activeElement;

		if (active !== null && active !== document.body)
		{
			return;
		}

		publicationFocusOwner()?.focus({ preventScroll: true });
	};
	const publishHint = computed((): ?HintParams => {
		if (publishRefusalPhrase.value === null)
		{
			return null;
		}

		return {
			text: Loc.getMessage(publishRefusalPhrase.value) ?? '',
			popupOptions: {
				width: 339,
				offsetTop: 20,
				background: '#085DC1',
				// WCAG 1.4.13: the hint must survive the pointer moving onto it and close on Escape.
				interactivity: true,
				closeByEsc: true,
			},
		};
	});

	const publishMainTemplate = async (): Promise<void> => {
		toastStore.clearAllOfType(BLOCK_TOAST_TYPES.ACTIVITY_PUBLIC_ERROR);

		try
		{
			// Nothing was published: the editor is locked, or the template got deleted mid-publish and
			// the store already surfaced its own toast. Either way there is no success to report.
			if (await diagram.publicTemplate() !== true)
			{
				return;
			}

			UI.Notification.Center.notify({
				content: Loc.getMessage('BIZPROCDESIGNER_EDITOR_MENU_SAVE_SUCCESS') ?? '',
				autoHideDelay: 5000,
			});
		}
		catch (error)
		{
			if (Type.isArrayFilled(error.data?.activityErrors))
			{
				toastStore.addCustom(
					Loc.getMessage('BIZPROCDESIGNER_EDITOR_PUBLISH_ERROR_TOAST') ?? '',
					BLOCK_TOAST_TYPES.ACTIVITY_PUBLIC_ERROR,
				);
			}

			handleResponseError(error);
		}
	};

	// A refusal of a publication as the user sees it: the blocks the server named are already marked
	// by the store, so what is left is the toast over the scheme and the server message.
	const showPublishError = (error: ApiError): void => {
		if (Type.isArrayFilled(error.data?.activityErrors))
		{
			toastStore.addCustom(
				Loc.getMessage('BIZPROCDESIGNER_EDITOR_PUBLISH_ERROR_TOAST') ?? '',
				BLOCK_TOAST_TYPES.ACTIVITY_PUBLIC_ERROR,
			);
		}

		handleResponseError(error);
	};

	const askPublishConfirmation = (
		required: Array<string>,
		error: ?ApiError,
		dialog: {
			titleMessageId: string,
			messages: Map<string, string>,
			fallbackMessageId: string,
		},
	): Promise<boolean> => {
		// The rescue is hung on the answer and not on the closing of the dialog on purpose: the platform
		// deactivates its focus trap synchronously inside close(), after the event of the closing, so a
		// rescue done in that event would be overwritten by the restore that follows it. A promise settles
		// later than the stack that settled it.
		return new Promise((resolve) => {
			// The consequences are the description of the dialog, and the platform names a description by
			// the id of its node: the text gets a node of its own instead of being poured into the container
			// of the popup, which carries no semantics to be named by.
			const consequences = Dom.create('div', {
				attrs: {
					id: `editor-chart-publish-consequences-${Text.getRandom()}`,
					'data-testid': 'bizprocdesigner-editor-publish-consequences',
				},
				html: buildConsequencesText({
					required,
					error,
					messages: dialog.messages,
					getMessage: Loc.getMessage.bind(Loc),
					fallbackMessageId: dialog.fallbackMessageId,
				}),
			});

			const messageBox = new MessageBox({
				title: Loc.getMessage(dialog.titleMessageId),
				message: consequences,
				buttons: MessageBoxButtons.OK_CANCEL,
				// Every publication asks one and the same question of the publisher, whatever it is
				// about to do, so the captions of the answer belong to all of them alike.
				okCaption: Loc.getMessage('BIZPROCDESIGNER_EDITOR_PILOT_PUBLISH_CONFIRM_CONTINUE'),
				cancelCaption: Loc.getMessage('BIZPROCDESIGNER_EDITOR_PILOT_PUBLISH_CONFIRM_CANCEL'),
				popupOptions: {
					// Escape ends the publication the same way as the cancel button.
					closeByEsc: true,
					// The publisher is agreeing to an irreversible operation, so the keyboard must not
					// leave the dialog. Asked for outright: on its own the platform takes the trap from a
					// setting of the portal, and a portal that never set it would be left without one.
					// The target of the focus on the way back is named here for the same reason - see
					// publicationFocusOwner().
					focusTrap: { restoreFocus: publicationFocusOwner },
					ariaDescribedBy: consequences.id,
					events: {
						onPopupClose: () => resolve(false),
					},
				},
				onOk: () => {
					resolve(true);
					messageBox.close();
				},
				onCancel: () => {
					resolve(false);
					messageBox.close();
				},
			});

			messageBox.show();
		}).then((agreed: boolean): boolean => {
			rescuePublicationFocus();

			return agreed;
		});
	};

	// The publication itself, with the confirmations the server asks for along the way. Every repeat
	// carries the audience that was chosen once and the scheme collected once: a confirmation only
	// adds codes to the same request, it never asks for the choice again.
	const sendPilotPublication = async (audience: Array<string>): Promise<void> => {
		// The graph of the scheme is the heavy part of the request, and the rounds of confirmations
		// publish the very same one: it is collected here, before the first of them.
		const scheme = diagram.buildPublicationData();
		let confirmations = [];

		for (;;)
		{
			try
			{
				// eslint-disable-next-line no-await-in-loop
				await diagram.publicPilotTemplate({ audience, confirmations, scheme });

				// The template got deleted mid-publish: the store already surfaced the
				// "template deleted" toast and locked the editor, so skip the success note.
				if (diagram.isEditorReadonly)
				{
					return;
				}

				UI.Notification.Center.notify({
					content: Loc.getMessage('BIZPROCDESIGNER_EDITOR_PILOT_PUBLISH_SUCCESS') ?? '',
					autoHideDelay: 5000,
				});

				return;
			}
			catch (error)
			{
				const required = getMissingConfirmations(error, confirmations);
				if (required.length === 0)
				{
					// The pilot this publication renews may already be gone - stopped or replaced
					// elsewhere - and the template it belongs to may be deleted or closed for
					// writing: those refusals are read the same way as for every other operation over
					// the pilot, instead of reaching the publisher as a raw server message.
					// eslint-disable-next-line no-await-in-loop
					if (!await diagram.handlePilotOperationFailure(error))
					{
						showPublishError(error);
					}

					return;
				}

				// eslint-disable-next-line no-await-in-loop
				const isConfirmed = await askPublishConfirmation(required, error, PILOT_CONFIRMATION_DIALOG);
				if (!isConfirmed)
				{
					return;
				}

				confirmations = [...confirmations,...required];
			}
		}
	};

	// The audience of the pilot lives in one place: the composition of a live pilot comes from the
	// server, the composition of an attempt that was refused stays there as well, so a refusal does
	// not cost the publisher the choice again.
	const pilotAudienceStore = usePilotAudienceStore();

	/**
	 * The start of a publication to an audience: the running publication is answered back, and `null`
	 * when there is nothing to start - another publication is already running, the template is gone or
	 * it has no row of its own to keep a pilot beside. The item of the menu reads that answer: the
	 * wait it shows and tells about belongs to a publication that really began.
	 */
	const startPilotPublication = (readAudience: () => Promise<?Array<string>>): ?Promise<void> => {
		if (diagram.isPublishing || isPublishInert.value || !diagram.canPublishToPilotAudience)
		{
			return null;
		}

		return runPilotPublication(readAudience);
	};

	/**
	 * The publication to an audience from the moment it is known to the answer of the server. The
	 * choice of the audience, the confirmations and the sending are one publication, so the waiting
	 * lock covers all of it: a second start, wherever it comes from, must not begin another one.
	 */
	const runPilotPublication = async (readAudience: () => Promise<?Array<string>>): Promise<void> => {
		diagram.isPublishing = true;

		try
		{
			const audience = await readAudience();
			if (audience === null)
			{
				return;
			}

			toastStore.clearAllOfType(BLOCK_TOAST_TYPES.ACTIVITY_PUBLIC_ERROR);

			await sendPilotPublication(audience);
		}
		catch (error)
		{
			// The publication itself reports its own refusals; what reaches this point is the reading
			// of the composition, and without it the choice must not be asked for on an empty list.
			// The pilot whose composition is being read may already be gone - stopped or replaced
			// elsewhere - and the template it belongs to may be deleted or closed for writing: all of
			// them are read the same way as by the rest of the editor.
			if (!await diagram.handlePilotOperationFailure(error))
			{
				handleResponseError(error);
			}
		}
		finally
		{
			diagram.isPublishing = false;
		}
	};

	// The composition of a pilot that is already running is kept by the server, so the choice starts
	// from it and not from an empty list. `null` is a refusal of the choice.
	const chooseAudience = async (): Promise<?Array<string>> => {
		if (diagram.pilot.hasPilot)
		{
			await pilotAudienceStore.loadAudience(diagram.templateId);
		}

		const audience = await PilotAudienceDialog.open(pilotAudienceStore.audience);
		if (audience !== null)
		{
			pilotAudienceStore.setAudience(audience);
		}

		return audience;
	};

	// The audience of the live pilot as the server holds it: it may have been changed in another tab,
	// so the repeated publication goes to the composition in force and not to a stored one.
	const readLivePilotAudience = async (): Promise<Array<string>> => {
		await pilotAudienceStore.loadAudience(diagram.templateId);

		return pilotAudienceStore.accessCodes;
	};

	const publishToChosenAudience = (): ?Promise<void> => {
		rememberPublicationInitiator();

		return startPilotPublication(chooseAudience);
	};

	// The main button repeats the publication of the pilot that is in force, and its audience is
	// already known: it is not asked for again. Without a live pilot there is nothing to repeat, so
	// the choice opens and the button does the same as the item of the menu.
	const publishUserTemplate = (): ?Promise<void> => (
		diagram.pilot.hasPilot
			? startPilotPublication(readLivePilotAudience)
			: publishToChosenAudience()
	);

	// The publication that stops the processes started before it, with the confirmations the server asks
	// for along the way. Every repeat carries the codes agreed to so far and the scheme collected once:
	// a confirmation only adds codes to the same request. How it ended is answered back: every end of the
	// publication is told about, and only the scenario as a whole knows there is nothing more to wait for.
	/**
	 * The consequences this format is known to have before the server is asked about them: the stop of the
	 * running processes is required by it unconditionally, and the end of a publication for chosen employees
	 * whenever one is in force - and that the editor knows from its own state.
	 */
	const foreseenConsequences = (): Array<string> => (
		diagram.pilot.hasPilot
			? [CONFIRMATION_STOP_RUNNING_PROCESSES, CONFIRMATION_PILOT_STOP]
			: [CONFIRMATION_STOP_RUNNING_PROCESSES]
	);

	const sendFullPublication = async (): Promise<FullPublishOutcome> => {
		// Asked before the first request and not after its refusal. The code of the stop is required by this
		// format always, so asking afterwards sends the whole graph twice on every publication, and a
		// refusal of the publisher throws away a heavy request that had no chance of going through. The
		// server stays the one who decides: if it asks for a code the editor did not foresee - the state of
		// the pilot is a tab old, say - the loop below shows the second dialog exactly as before.
		let confirmations = foreseenConsequences();

		const isForeseenConfirmed = await askPublishConfirmation(
			confirmations,
			null,
			FULL_CONFIRMATION_DIALOG,
		);
		if (!isForeseenConfirmed)
		{
			return FULL_PUBLISH_OUTCOMES.CANCELLED;
		}

		// The graph of the scheme is the heavy part of the request, and the rounds of confirmations publish
		// the very same one: it is collected once, after the agreement and before the first request.
		const scheme = diagram.buildPublicationData();

		for (;;)
		{
			try
			{
				// eslint-disable-next-line no-await-in-loop
				const isPublished = await diagram.publicFullTemplate({ confirmations, scheme });

				// The outcome is the answer of the store and not the state of the editor read afterwards.
				// Reading the lock here would call a publication that went through a failure whenever
				// something else locked the editor while the request was in flight - opening a version
				// for viewing does exactly that, and it does not ask whether a publication is running.
				if (!isPublished)
				{
					return FULL_PUBLISH_OUTCOMES.FAILED;
				}

				// The scheme is published either way, and the stop of the processes is what may be missing:
				// the server answers whether it managed to schedule the background job. Reporting the
				// ordinary success then would send the author away believing the processes of the previous
				// scheme are being stopped, while they keep running and nothing else says so.
				if (!diagram.isTerminationScheduled)
				{
					UI.Notification.Center.notify({
						content: Loc.getMessage(
							'BIZPROCDESIGNER_EDITOR_FULL_PUBLISH_TERMINATION_NOT_SCHEDULED',
						) ?? '',
						autoHideDelay: 5000,
					});

					return FULL_PUBLISH_OUTCOMES.TERMINATION_NOT_SCHEDULED;
				}

				// The stop has only begun, so what is told about is the publication itself - the same
				// success every format reports.
				UI.Notification.Center.notify({
					content: Loc.getMessage('BIZPROCDESIGNER_EDITOR_MENU_SAVE_SUCCESS') ?? '',
					autoHideDelay: 5000,
				});

				return FULL_PUBLISH_OUTCOMES.PUBLISHED;
			}
			catch (error)
			{
				const required = getMissingConfirmations(error, confirmations);
				if (required.length === 0)
				{
					// A refusal of this publication is read as a refusal of any other one: the mode
					// promotes no pilot version and meets none of the refusals of that path.
					showPublishError(error);

					return FULL_PUBLISH_OUTCOMES.FAILED;
				}

				// eslint-disable-next-line no-await-in-loop
				const isConfirmed = await askPublishConfirmation(required, error, FULL_CONFIRMATION_DIALOG);
				if (!isConfirmed)
				{
					return FULL_PUBLISH_OUTCOMES.CANCELLED;
				}

				confirmations = [...confirmations,...required];
			}
		}
	};

	/**
	 * The publication in that format from the click to the answer of the server. The confirmations and
	 * the sending are one publication, so the waiting lock covers all of it: between the rounds a dialog
	 * stands open, and a second start - wherever it comes from - must not begin another one.
	 */
	const runFullPublication = async (): Promise<void> => {
		diagram.isPublishing = true;
		LiveAnnouncer.announce(
			Loc.getMessage('BIZPROCDESIGNER_EDITOR_FULL_PUBLISH_STARTED_ANNOUNCE') ?? '',
		);

		// Whatever ends the publication - the answer of the server, the refusal of the publisher or a
		// failure of the editor itself - the wait it began must not be left hanging without a word.
		let outcome = FULL_PUBLISH_OUTCOMES.FAILED;

		try
		{
			toastStore.clearAllOfType(BLOCK_TOAST_TYPES.ACTIVITY_PUBLIC_ERROR);

			outcome = await sendFullPublication();
		}
		catch (error)
		{
			// The publication itself reports every refusal of the server; what reaches this point is a
			// failure of the editor, and the outcome stays the refusal announced below.
			showPublishError(error);
		}
		finally
		{
			diagram.isPublishing = false;
			LiveAnnouncer.announce(Loc.getMessage(outcome.messageId) ?? '', outcome.politeness);
		}
	};

	// A running publication keeps the button waiting, and the waiting of the platform button is a
	// look and nothing more: the click of it still reaches here. The wait covers a whole scenario -
	// the choice of the audience and the confirmations included - so that click, in whatever mode
	// the button is, must neither begin a second publication nor end the wait of the running one.
	const publishTemplate = (): void => {
		if (diagram.isPublishing || isPublishInert.value)
		{
			return;
		}

		rememberPublicationInitiator();

		({
			[TEMPLATE_PUBLISH_STATUSES.MAIN]: () => {
				void publishMainTemplate();
			},
			[TEMPLATE_PUBLISH_STATUSES.USER]: () => {
				void publishUserTemplate();
			},
			[TEMPLATE_PUBLISH_STATUSES.FULL]: () => {
				void runFullPublication();
			},
		})[diagram.templatePublishStatus]();
	};

	return {
		isPublishing,
		canPublish,
		// Every surface that offers publication has to be able to show the refusal: the scenario answers a
		// click made under a write lock by doing nothing at all, and a live-looking button that does nothing
		// is worse than a disabled one.
		isPublishInert,
		publishHint,
		publishTemplate,
		publishToChosenAudience,
	};
};

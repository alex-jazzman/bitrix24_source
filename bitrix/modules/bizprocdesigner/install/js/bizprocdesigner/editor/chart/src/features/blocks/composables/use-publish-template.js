import { Loc, Type } from 'main.core';
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
const CONFIRMATION_MESSAGES = new Map([
	['settingsFreeze', 'BIZPROCDESIGNER_EDITOR_PILOT_PUBLISH_CONFIRM_SETTINGS_FREEZE'],
	['emptyConstants', 'BIZPROCDESIGNER_EDITOR_PILOT_PUBLISH_CONFIRM_EMPTY_CONSTANTS'],
]);

export const usePublishTemplate = (props: { readonly: boolean }): {
	isPublishing: VueRefValue<boolean>,
	canPublish: VueRefValue<boolean>,
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
	// A deleted template locks the editor: every way to publish - the button and the items of its
	// menu alike - stays inert instead of round-tripping to a template that no longer exists.
	const isPublishInert = computed((): boolean => props.readonly || diagram.isEditorReadonly);
	const publishHint = computed((): ?HintParams => {
		if (diagram.canPublish)
		{
			return null;
		}

		return {
			text: Loc.getMessage('BIZPROCDESIGNER_EDITOR_PUBLISH_ACCESS_DENIED_HINT') ?? '',
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

	const askPublishConfirmation = (required: Array<string>, error: ApiError): Promise<boolean> => {
		return new Promise((resolve) => {
			const messageBox = new MessageBox({
				title: Loc.getMessage('BIZPROCDESIGNER_EDITOR_PILOT_PUBLISH_CONFIRM_TITLE'),
				message: buildConsequencesText({
					required,
					error,
					messages: CONFIRMATION_MESSAGES,
					getMessage: Loc.getMessage.bind(Loc),
					fallbackMessageId: 'BIZPROCDESIGNER_EDITOR_PILOT_PUBLISH_CONFIRM',
				}),
				buttons: MessageBoxButtons.OK_CANCEL,
				okCaption: Loc.getMessage('BIZPROCDESIGNER_EDITOR_PILOT_PUBLISH_CONFIRM_CONTINUE'),
				cancelCaption: Loc.getMessage('BIZPROCDESIGNER_EDITOR_PILOT_PUBLISH_CONFIRM_CANCEL'),
				popupOptions: {
					// Escape ends the publication the same way as the cancel button.
					closeByEsc: true,
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
				const isConfirmed = await askPublishConfirmation(required, error);
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

	const publishToChosenAudience = (): ?Promise<void> => startPilotPublication(chooseAudience);

	// The main button repeats the publication of the pilot that is in force, and its audience is
	// already known: it is not asked for again. Without a live pilot there is nothing to repeat, so
	// the choice opens and the button does the same as the item of the menu.
	const publishUserTemplate = (): ?Promise<void> => (
		diagram.pilot.hasPilot
			? startPilotPublication(readLivePilotAudience)
			: publishToChosenAudience()
	);

	// A running publication keeps the button waiting, and the waiting of the platform button is a
	// look and nothing more: the click of it still reaches here. The wait covers a whole scenario -
	// the choice of the audience and the confirmations included - so that click, in whatever mode
	// the button is, must neither begin a second publication nor end the wait of the running one.
	const publishTemplate = (): void => {
		if (diagram.isPublishing || isPublishInert.value)
		{
			return;
		}

		({
			[TEMPLATE_PUBLISH_STATUSES.MAIN]: () => {
				void publishMainTemplate();
			},
			[TEMPLATE_PUBLISH_STATUSES.USER]: () => {
				void publishUserTemplate();
			},
			[TEMPLATE_PUBLISH_STATUSES.FULL]: () => alert('doFullPublication'),
		})[diagram.templatePublishStatus]();
	};

	return {
		isPublishing,
		canPublish,
		publishHint,
		publishTemplate,
		publishToChosenAudience,
	};
};

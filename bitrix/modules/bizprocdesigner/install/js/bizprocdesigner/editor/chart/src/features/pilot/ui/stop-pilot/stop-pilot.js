import { MessageBox, MessageBoxButtons } from 'ui.dialogs.messagebox';
import { UI } from 'ui.notification';
import { AirButtonStyle, Button as UiButton, ButtonSize } from 'ui.vue3.components.button';
import { mapActions, mapState } from 'ui.vue3.pinia';

import { diagramStore as useDiagramStore } from '../../../../entities/blocks';
import { useLoc } from '../../../../shared/composables';
import type { ApiError } from '../../../../shared/api';
import { handleResponseError } from '../../../../shared/utils';
import { pilotApi } from '../../api/pilot-api';
import { buildConsequencesText, getMissingConfirmations } from '../../lib/confirmations';
import { notifyPilotFailure } from '../../lib/failure';
import { usePilotAudienceStore } from '../../stores/pilot-audience';

// What the publisher is told before the pilot is stopped, one wording per consequence the server
// names. Both are asked for in a single answer, so a common warning would hide one of them.
const CONSEQUENCE_MESSAGES = new Map([
	['noCommonVersion', 'BIZPROCDESIGNER_EDITOR_PILOT_STOP_CONFIRM_NO_COMMON_VERSION'],
	['draftOverwrite', 'BIZPROCDESIGNER_EDITOR_PILOT_STOP_CONFIRM_DRAFT_OVERWRITE'],
]);

/**
 * Stops the live pilot. Whether a consequence has to be confirmed is decided by the server: a guess
 * made here - say, about a draft - would be stale by the moment the publisher answers. Once the pilot
 * is over the common version is the scheme in force again, so the canvas is read anew.
 */
// @vue/component
export const StopPilot = {
	name: 'StopPilot',
	components: {
		UiButton,
	},
	inject: {
		// Outside the card of the pilot there is nothing to hold open.
		pilotCardLock: { default: null },
	},
	setup(): Object
	{
		const { getMessage } = useLoc();

		return {
			getMessage,
			buttonSize: ButtonSize,
			buttonStyle: AirButtonStyle,
		};
	},
	data(): { isLoading: boolean }
	{
		return {
			isLoading: false,
		};
	},
	computed: {
		...mapState(useDiagramStore, ['templateId', 'canPublish', 'pilot']),
	},
	methods: {
		...mapActions(useDiagramStore, [
			'setPilotState',
			'refreshDiagramData',
			'handlePilotOperationFailure',
		]),
		...mapActions(usePilotAudienceStore, ['clearAudience']),
		async handleClick(): Promise<void>
		{
			// The confirmations and the sending are one operation, so a second click must not start
			// another one.
			if (this.isLoading)
			{
				return;
			}

			this.isLoading = true;
			// The confirmations open over the card, and the answer of the server comes back to it: the
			// card is kept open so the waiting button and the outcome are seen where the click was.
			this.pilotCardLock?.hold();

			try
			{
				await this.sendStop(this.pilot.pilotId);
			}
			finally
			{
				this.isLoading = false;
				this.pilotCardLock?.release();
			}
		},
		// Every repeat carries the codes confirmed so far: a confirmation only adds codes to the same
		// request, it never replaces the ones already given.
		async sendStop(pilotId: number): Promise<void>
		{
			let confirmations = [];

			for (;;)
			{
				try
				{
					// eslint-disable-next-line no-await-in-loop
					const { draftSaved } = await pilotApi.stop(this.templateId, pilotId, confirmations);

					// eslint-disable-next-line no-await-in-loop
					await this.applyStop(draftSaved);

					return;
				}
				catch (error)
				{
					const required = getMissingConfirmations(error, confirmations);
					if (required.length === 0)
					{
						// eslint-disable-next-line no-await-in-loop
						if (!await this.handlePilotOperationFailure(error))
						{
							notifyPilotFailure(
								error,
								this.getMessage('BIZPROCDESIGNER_EDITOR_PILOT_STOP_ERROR'),
							);
						}

						return;
					}

					// eslint-disable-next-line no-await-in-loop
					const isConfirmed = await this.askConfirmation(required, error);
					if (!isConfirmed)
					{
						return;
					}

					confirmations = [...confirmations,...required];
				}
			}
		},
		// The pilot is over the moment the server says so, and the state says it too even if the reload
		// below fails; the scheme in force is the common version again, so the canvas is read anew.
		async applyStop(draftSaved: boolean): Promise<void>
		{
			this.setPilotState(null);
			// The audience the stopped pilot ran for is over with it: the next publication chooses its
			// own. A stop the server refused never reaches this point, so a failed one costs nothing.
			this.clearAudience();

			UI.Notification.Center.notify({
				content: this.getMessage(
					draftSaved
						? 'BIZPROCDESIGNER_EDITOR_PILOT_STOP_SUCCESS_DRAFT_SAVED'
						: 'BIZPROCDESIGNER_EDITOR_PILOT_STOP_SUCCESS',
				) ?? '',
				autoHideDelay: 5000,
			});

			try
			{
				await this.refreshDiagramData({ templateId: this.templateId });
			}
			catch (error)
			{
				// The server has accepted the stop, so a failed reload is a failure of its own: it only
				// leaves the canvas as it was and is reported the way every other failed request is.
				// Passed on to the caller it would read as a refusal of the stop that already happened.
				handleResponseError(error);
			}
		},
		askConfirmation(required: Array<string>, error: ApiError): Promise<boolean>
		{
			return new Promise((resolve) => {
				const messageBox = new MessageBox({
					title: this.getMessage('BIZPROCDESIGNER_EDITOR_PILOT_STOP_CONFIRM_TITLE'),
					message: buildConsequencesText({
						required,
						error,
						messages: CONSEQUENCE_MESSAGES,
						getMessage: this.getMessage,
						fallbackMessageId: 'BIZPROCDESIGNER_EDITOR_PILOT_STOP_CONFIRM',
					}),
					buttons: MessageBoxButtons.OK_CANCEL,
					okCaption: this.getMessage('BIZPROCDESIGNER_EDITOR_PILOT_STOP_CONFIRM_CONTINUE'),
					cancelCaption: this.getMessage('BIZPROCDESIGNER_EDITOR_PILOT_STOP_CONFIRM_CANCEL'),
					popupOptions: {
						// Escape ends the operation the same way as the cancel button.
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
		},
	},
	template: `
		<UiButton
			v-if="canPublish"
			:text="getMessage('BIZPROCDESIGNER_EDITOR_PILOT_CARD_STOP')"
			:size="buttonSize.SMALL"
			:style="buttonStyle.TINTED_ALERT"
			:loading="isLoading"
			:dataset="{ testid: 'bizprocdesigner-pilot-stop' }"
			@click="handleClick"
		/>
	`,
};

import { UI } from 'ui.notification';
import { AirButtonStyle, Button as UiButton, ButtonSize } from 'ui.vue3.components.button';
import { mapActions, mapState } from 'ui.vue3.pinia';

import { diagramStore as useDiagramStore } from '../../../../entities/blocks';
import { useLoc } from '../../../../shared/composables';
import { pilotApi } from '../../api/pilot-api';
import { notifyPilotFailure } from '../../lib/failure';
import { usePilotAudienceStore } from '../../stores/pilot-audience';
import { PilotAudienceDialog } from '../pilot-audience-dialog/pilot-audience-dialog';

/**
 * Changes who the live pilot is running for. The scheme is not published again and the canvas is left
 * alone: only the state of the pilot and the composition of its audience are renewed.
 */
// @vue/component
export const ChangePilotAudience = {
	name: 'ChangePilotAudience',
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
		...mapState(usePilotAudienceStore, ['audience']),
	},
	methods: {
		...mapActions(useDiagramStore, ['setPilotState', 'handlePilotOperationFailure']),
		...mapActions(usePilotAudienceStore, ['loadAudience', 'setAudience']),
		async handleClick(): Promise<void>
		{
			// The composition, the choice and the sending are one operation, so a second click must not
			// start another one.
			if (this.isLoading)
			{
				return;
			}

			this.isLoading = true;
			// The choice opens over the card, and the answer of the server comes back to it: the card is
			// kept open so the waiting button, the success and the refusal are seen where the click was.
			this.pilotCardLock?.hold();

			try
			{
				await this.loadAudience(this.templateId);

				const audience = await PilotAudienceDialog.open(this.audience);
				if (audience === null)
				{
					return;
				}

				this.setPilotState(await pilotApi.changeAudience(this.templateId, this.pilot.pilotId, audience));
				// The server has accepted the composition, so it is what the editor shows from now on; a
				// refusal leaves the stored one as it was.
				this.setAudience(audience);

				UI.Notification.Center.notify({
					content: this.getMessage('BIZPROCDESIGNER_EDITOR_PILOT_AUDIENCE_CHANGE_SUCCESS') ?? '',
					autoHideDelay: 5000,
				});
			}
			catch (error)
			{
				// The pilot may have been stopped or replaced elsewhere, and the template it belongs to
				// may be deleted or closed for writing: every such refusal is read the same way as by
				// the rest of the editor, and only what is left over is told as a failure of this
				// operation.
				if (!await this.handlePilotOperationFailure(error))
				{
					notifyPilotFailure(
						error,
						this.getMessage('BIZPROCDESIGNER_EDITOR_PILOT_AUDIENCE_CHANGE_ERROR'),
					);
				}
			}
			finally
			{
				this.isLoading = false;
				this.pilotCardLock?.release();
			}
		},
	},
	template: `
		<UiButton
			v-if="canPublish"
			:text="getMessage('BIZPROCDESIGNER_EDITOR_PILOT_CARD_CHANGE_AUDIENCE')"
			:size="buttonSize.SMALL"
			:style="buttonStyle.OUTLINE_ACCENT_2"
			:loading="isLoading"
			:dataset="{ testid: 'bizprocdesigner-pilot-change-audience' }"
			@click="handleClick"
		/>
	`,
};

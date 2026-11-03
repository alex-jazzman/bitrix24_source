import { Dom, Loc, Tag, Text } from 'main.core';
import { Center, type Balloon } from 'ui.notification';

import { FinalTransitionModel, type FinalTransitionContext } from '../model/final-transition-model';

type CloseToastOptions = {
	context: FinalTransitionContext,
	entityTitle: string,
	onUndo: () => Promise<void>,
};

const CLOSE_DELAY = 4000;

export class CloseToast
{
	static #cancelAutoClose: (() => void) | null = null;

	static show(options: CloseToastOptions): void
	{
		this.#cancelAutoClose?.();

		const title = Loc.getMessage('CRM_STAGE_FINAL_TRANSITION_TOAST', {
			'#STAGE#': FinalTransitionModel.getName(options.context.targetStage),
		}) ?? '';
		const undoTitle = Loc.getMessage('CRM_STAGE_FINAL_TRANSITION_UNDO') ?? '';
		const content = Tag.render`
			<span
				class="crm-stage-final-transition__toast-message"
				role="status"
				aria-live="polite"
				aria-atomic="true"
			>
				${Text.encode(title)}<br>${Text.encode(options.entityTitle)}
			</span>
		`;
		let isUndoing = false;

		const balloon = Center.notify({
			id: 'crm-stage-final-transition-toast',
			position: 'top-right',
			width: 'auto',
			autoHideDelay: CLOSE_DELAY,
			blinkOnUpdate: false,
			closeButton: false,
			testId: 'crm-stage-final-transition-toast',
			data: {
				finalTransitionTargetStatusId: FinalTransitionModel.getStatusId(options.context.targetStage),
			},
			content,
			actions: [
				{
					id: 'undo',
					title: undoTitle,
					testId: 'crm-stage-final-transition-undo',
					events: {
						click: (_event, currentBalloon, action) => {
							if (isUndoing)
							{
								return;
							}

							isUndoing = true;
							action.getContainer().setAttribute('aria-disabled', 'true');
							currentBalloon.close();
							void options.onUndo().catch(() => {
								Center.notify({
									content: Text.encode(
										Loc.getMessage('CRM_STAGE_FINAL_TRANSITION_UNDO_ERROR') ?? '',
									),
									autoHideDelay: 4000,
								});
							});
						},
					},
				},
			],
		});
		const visibleBalloon = balloon ?? Center.getBalloonById('crm-stage-final-transition-toast');
		if (visibleBalloon)
		{
			Dom.addClass(visibleBalloon.getContainer(), 'crm-stage-final-transition__toast');
			this.#scheduleAutoClose(visibleBalloon);
		}
	}

	static #scheduleAutoClose(balloon: Balloon): void
	{
		const timeout = setTimeout(() => balloon.close(), CLOSE_DELAY);
		const cancelAutoClose = () => {
			clearTimeout(timeout);
			balloon.removeEvent('onClose', cancelAutoClose);
			this.#cancelAutoClose = null;
		};
		this.#cancelAutoClose = cancelAutoClose;
		balloon.addEvent('onClose', cancelAutoClose);
	}
}

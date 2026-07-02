import { Popup } from 'main.popup';
import { ajax } from 'main.ajax';
import { AnglePosition, PromoVideoPopup, PromoVideoPopupEvents } from 'ui.promo-video-popup';
import { CopilotPromoPopup } from 'ai.copilot-promo-popup';

import { ahaMoments } from 'tasks.v2.lib.aha-moments';
import { Option } from 'tasks.v2.const';

type Params = {
	targetElement: HTMLElement,
};

export class TasksAiPromo
{
	#params: Params;
	#popup: ?Popup;
	#promotionType: string = 'tasks_ai';

	constructor(params: Params)
	{
		this.#params = params;
	}

	show()
	{
		if (ahaMoments.shouldShow(Option.AhaTasksAiPromo))
		{
			ahaMoments.setActive(Option.AhaTasksAiPromo);

			setTimeout(() => {
				this.#showPopup();
			}, 1000);
		}
	}

	#showPopup()
	{
		this.#popup = this.#getPopup();

		if (!this.#popup)
		{
			return;
		}

		this.#popup.subscribe(PromoVideoPopupEvents.HIDE, this.#onCopilotPromoHide.bind(this));
		this.#popup.show();
	}

	#getPopup(): ?PromoVideoPopup
	{
		if (!this.#params.targetElement)
		{
			return null;
		}

		return CopilotPromoPopup.createByPresetId({
			presetId: CopilotPromoPopup.Preset.TASK,
			targetOptions: this.#params.targetElement,
			offset: {
				left: this.#params.targetElement.offsetWidth / 2,
			},
			angleOptions: {
				position: AnglePosition.TOP,
			},
		});
	}

	#onCopilotPromoHide()
	{
		ajax.runAction('tasks.promotion.setViewed', { data: { promotion: this.#promotionType } })
			.catch((err) => {
				console.error(err);
			})
		;

		ahaMoments.setInactive(Option.AhaTasksAiPromo);
		ahaMoments.setPopupShown(Option.AhaTasksAiPromo);
	}
}

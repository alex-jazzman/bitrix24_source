/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Lib = this.BX.Tasks.V2.Lib || {};
(function (exports, main_popup, main_ajax, ui_promoVideoPopup, ai_copilotPromoPopup, tasks_v2_lib_ahaMoments, tasks_v2_const) {
	'use strict';

	class TasksAiPromo {
		#params;
		#popup;
		#promotionType = 'tasks_ai';
		constructor(params) {
			this.#params = params;
		}
		show() {
			if (tasks_v2_lib_ahaMoments.ahaMoments.shouldShow(tasks_v2_const.Option.AhaTasksAiPromo)) {
				tasks_v2_lib_ahaMoments.ahaMoments.setActive(tasks_v2_const.Option.AhaTasksAiPromo);
				setTimeout(() => {
					this.#showPopup();
				}, 1000);
			}
		}
		#showPopup() {
			this.#popup = this.#getPopup();
			if (!this.#popup) {
				return;
			}
			this.#popup.subscribe(ui_promoVideoPopup.PromoVideoPopupEvents.HIDE, this.#onCopilotPromoHide.bind(this));
			this.#popup.show();
		}
		#getPopup() {
			if (!this.#params.targetElement) {
				return null;
			}
			return ai_copilotPromoPopup.CopilotPromoPopup.createByPresetId({
				presetId: ai_copilotPromoPopup.CopilotPromoPopup.Preset.TASK,
				targetOptions: this.#params.targetElement,
				offset: {
					left: this.#params.targetElement.offsetWidth / 2
				},
				angleOptions: {
					position: ui_promoVideoPopup.AnglePosition.TOP
				}
			});
		}
		#onCopilotPromoHide() {
			main_ajax.ajax.runAction('tasks.promotion.setViewed', {
				data: {
					promotion: this.#promotionType
				}
			}).catch(err => {
				console.error(err);
			});
			tasks_v2_lib_ahaMoments.ahaMoments.setInactive(tasks_v2_const.Option.AhaTasksAiPromo);
			tasks_v2_lib_ahaMoments.ahaMoments.setPopupShown(tasks_v2_const.Option.AhaTasksAiPromo);
		}
	}

	exports.TasksAiPromo = TasksAiPromo;

})(this.BX.Tasks.V2.Lib.Promotion = this.BX.Tasks.V2.Lib.Promotion || {}, BX.Main, BX, BX.UI, BX.AI, BX.Tasks.V2.Lib, BX.Tasks.V2.Const);
//# sourceMappingURL=promotion.bundle.js.map

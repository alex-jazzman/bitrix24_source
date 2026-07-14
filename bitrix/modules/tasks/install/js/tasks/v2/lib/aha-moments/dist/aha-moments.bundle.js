/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
(function (exports, main_core, spotlight, ui_tour, tasks_v2_core, tasks_v2_const, tasks_v2_provider_service_optionService) {
	'use strict';

	class AhaMoments {
		#ahaPopupWidth = 380;
		#shownPopups = {};
		#activeAhaMoment = null;
		show(params) {
			if (params.ahaMoment && this.#wasShown(params.ahaMoment)) {
				return;
			}
			const guide = new ui_tour.Guide({
				id: params.id,
				overlay: false,
				simpleMode: true,
				onEvents: true,
				steps: [{
					target: params.target,
					title: params.title,
					text: params.text,
					position: params.top ? 'top' : 'bottom',
					condition: {
						top: !params.top,
						bottom: Boolean(params.top),
						color: 'primary'
					},
					article: params.article?.code,
					articleAnchor: params.article?.anchorCode,
					linkTitle: params.article?.title
				}],
				targetContainer: params.targetContainer
			});

			// default is 280
			if (this.#ahaPopupWidth) {
				guide.getPopup().setWidth(this.#ahaPopupWidth);
			}
			const pulsar = new BX.SpotLight({
				targetElement: params.target,
				targetVertex: 'middle-center',
				color: 'var(--ui-color-primary)'
			});

			// eslint-disable-next-line consistent-return
			return new Promise(resolve => {
				const guidePopup = guide.getPopup();
				guidePopup.setAutoHide(true);
				guidePopup.setAngle({
					offset: params.target.offsetWidth / 2
				});
				const adjustPosition = () => {
					guidePopup.adjustPosition();
				};
				const onClose = () => {
					pulsar.close();
					main_core.Event.unbind(document, 'scroll', adjustPosition, true);
					resolve();
				};
				guidePopup.subscribe('onClose', onClose);
				guidePopup.subscribe('onDestroy', onClose);
				pulsar.show();
				guide.start();
				guidePopup.adjustPosition({
					forceTop: !params.top,
					forceBindPosition: true
				});
				if (params.isPulsarTransparent) {
					main_core.Dom.style(pulsar.container, 'pointer-events', 'none');
				}
				main_core.Event.bind(document, 'scroll', adjustPosition, true);
			});
		}
		shouldShow(ahaMoment) {
			if (this.#activeAhaMoment !== null && this.#activeAhaMoment !== ahaMoment) {
				return false;
			}
			return this.#wasNotShown(ahaMoment);
		}
		setShown(ahaMoment) {
			this.setPopupShown(ahaMoment);
			void tasks_v2_provider_service_optionService.optionService.setBool(ahaMoment, true);
		}
		setPopupShown(ahaMoment) {
			this.#shownPopups[ahaMoment] = true;
		}
		setActive(ahaMoment) {
			this.#activeAhaMoment = ahaMoment;
		}
		setInactive(ahaMoment) {
			if (this.#activeAhaMoment === ahaMoment) {
				this.#activeAhaMoment = null;
			}
		}
		isActive(ahaMoment) {
			return this.#activeAhaMoment === ahaMoment;
		}
		#wasNotShown(ahaMoment) {
			return !this.#wasShown(ahaMoment);
		}
		#wasShown(ahaMoment) {
			const {
				ahaMoments
			} = tasks_v2_core.Core.getParams();
			return !ahaMoments[ahaMoment] || this.#shownPopups[ahaMoment];
		}
	}
	const ahaMoments = new AhaMoments();

	exports.ahaMoments = ahaMoments;

})(this.BX.Tasks.V2.Lib = this.BX.Tasks.V2.Lib || {}, BX, BX, BX.UI.Tour, BX.Tasks.V2, BX.Tasks.V2.Const, BX.Tasks.V2.Provider.Service);
//# sourceMappingURL=aha-moments.bundle.js.map

/* eslint-disable */
this.BX = this.BX || {};
this.BX.Booking = this.BX.Booking || {};
(function (exports, main_core, main_popup, spotlight, ui_tour, ui_autoLaunch, ui_bannerDispatcher, booking_core, booking_const, booking_provider_service_optionService) {
	'use strict';

	class AhaMoments {
		#ahaPopupWidth = 380;
		#bookingForAhaMoment;
		#shownPopups = {};
		show(params) {
			if (!ui_autoLaunch.AutoLauncher.isEnabled()) {
				ui_autoLaunch.AutoLauncher.enable();
			}
			return new Promise(resolve => {
				ui_bannerDispatcher.BannerDispatcher.high.toQueue(async onDone => {
					if (!params.target?.offsetWidth) {
						onDone();
						return;
					}
					await this.showGuide(params);
					onDone();
					resolve();
				});
			});
		}
		showGuide(params) {
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
		shouldShow(ahaMoment, params = {}) {
			return {
				[booking_const.AhaMoment.Banner]: this.#shouldShowBanner(ahaMoment),
				[booking_const.AhaMoment.TrialBanner]: this.#wasNotShown(ahaMoment),
				[booking_const.AhaMoment.AddResource]: this.#shouldShowAddResource(),
				[booking_const.AhaMoment.MessageTemplate]: this.#wasNotShown(ahaMoment),
				[booking_const.AhaMoment.AddClient]: this.#shouldShowAddClient(params),
				[booking_const.AhaMoment.ResourceWorkload]: this.#wasNotShown(ahaMoment),
				[booking_const.AhaMoment.ResourceIntersection]: this.#shouldShowResourceIntersection(),
				[booking_const.AhaMoment.ExpandGrid]: this.#shouldShowExpandGrid(),
				[booking_const.AhaMoment.SelectResources]: this.#shouldShowSelectResources(),
				[booking_const.AhaMoment.CyclePopup]: this.#shouldShowCyclePopup(),
				[booking_const.AhaMoment.SearchNavigation]: this.#shouldShowSearchNavigation(),
				[booking_const.AhaMoment.IntegrationMapsYa]: this.#shouldShowIntegrationMapsYa()
			}[ahaMoment];
		}
		setShown(ahaMoment) {
			const optionName = this.#getOptionName(ahaMoment);
			this.setPopupShown(ahaMoment);
			void booking_provider_service_optionService.optionService.setBool(optionName, true);
		}
		setPopupShown(ahaMoment) {
			this.#shownPopups[ahaMoment] = true;
		}
		setBookingForAhaMoment(bookingId) {
			this.#bookingForAhaMoment ??= bookingId;
		}
		#shouldShowBanner(ahaMoment) {
			const canTurnOnDemo = booking_core.Core.getStore().getters[`${booking_const.Model.Interface}/canTurnOnDemo`];
			return canTurnOnDemo || this.#wasNotShown(ahaMoment);
		}
		#shouldShowAddResource() {
			const wasNotShown = this.#wasNotShown(booking_const.AhaMoment.AddResource);
			const isLoaded = booking_core.Core.getStore().getters[`${booking_const.Model.Interface}/isLoaded`];
			const resourcesIds = booking_core.Core.getStore().getters[`${booking_const.Model.Interface}/resourcesIds`];
			return wasNotShown && isLoaded && resourcesIds.length === 0;
		}
		#shouldShowAddClient(params) {
			const wasNotShown = this.#wasNotShown(booking_const.AhaMoment.AddClient);
			const isBookingForAhaMoment = this.#bookingForAhaMoment === params.bookingId;
			return wasNotShown && isBookingForAhaMoment;
		}
		#shouldShowResourceIntersection() {
			const wasNotShown = this.#wasNotShown(booking_const.AhaMoment.ResourceIntersection);
			const isLoaded = booking_core.Core.getStore().getters[`${booking_const.Model.Interface}/isLoaded`];
			const resourcesIds = booking_core.Core.getStore().getters[`${booking_const.Model.Interface}/resourcesIds`];
			return wasNotShown && isLoaded && resourcesIds.length >= 2 && !main_popup.PopupManager.isAnyPopupShown();
		}
		#shouldShowExpandGrid() {
			const wasNotShown = this.#wasNotShown(booking_const.AhaMoment.ExpandGrid);
			const previousAhaMomentsShown = [booking_const.AhaMoment.ResourceWorkload, booking_const.AhaMoment.ResourceWorkload].every(ahaMoment => this.#wasShown(ahaMoment));
			return wasNotShown && previousAhaMomentsShown && !main_popup.PopupManager.isAnyPopupShown();
		}
		#shouldShowSelectResources() {
			const wasNotShown = this.#wasNotShown(booking_const.AhaMoment.SelectResources);
			const previousAhaMomentShown = this.#wasShown(booking_const.AhaMoment.ExpandGrid);
			return wasNotShown && previousAhaMomentShown && !main_popup.PopupManager.isAnyPopupShown();
		}
		#shouldShowCyclePopup() {
			const wasNotShown = this.#wasNotShown(booking_const.AhaMoment.CyclePopup);
			const previousAhaMomentShown = this.#wasShown(booking_const.AhaMoment.SelectResources);
			return wasNotShown && previousAhaMomentShown;
		}
		#shouldShowSearchNavigation() {
			return this.#wasNotShown(booking_const.AhaMoment.SearchNavigation);
		}
		#shouldShowIntegrationMapsYa() {
			return this.#wasNotShown(booking_const.AhaMoment.IntegrationMapsYa);
		}
		#wasNotShown(ahaMoment) {
			return !this.#wasShown(ahaMoment);
		}
		#wasShown(ahaMoment) {
			const {
				ahaMoments
			} = booking_core.Core.getParams();
			return !ahaMoments[ahaMoment] || this.#shownPopups[ahaMoment];
		}
		#getOptionName(ahaMoment) {
			return {
				[booking_const.AhaMoment.Banner]: booking_const.Option.AhaBanner,
				[booking_const.AhaMoment.TrialBanner]: booking_const.Option.AhaTrialBanner,
				[booking_const.AhaMoment.AddResource]: booking_const.Option.AhaAddResource,
				[booking_const.AhaMoment.MessageTemplate]: booking_const.Option.AhaMessageTemplate,
				[booking_const.AhaMoment.AddClient]: booking_const.Option.AhaAddClient,
				[booking_const.AhaMoment.ResourceWorkload]: booking_const.Option.AhaResourceWorkload,
				[booking_const.AhaMoment.ResourceIntersection]: booking_const.Option.AhaResourceIntersection,
				[booking_const.AhaMoment.ExpandGrid]: booking_const.Option.AhaExpandGrid,
				[booking_const.AhaMoment.SelectResources]: booking_const.Option.AhaSelectResources,
				[booking_const.AhaMoment.CyclePopup]: booking_const.Option.AhaCyclePopup,
				[booking_const.AhaMoment.SearchNavigation]: booking_const.Option.AhaSearchNavigation,
				[booking_const.AhaMoment.IntegrationMapsYa]: booking_const.Option.AhaIntegrationMapsYa
			}[ahaMoment];
		}
	}
	const ahaMoments = new AhaMoments();

	exports.ahaMoments = ahaMoments;

})(this.BX.Booking.Lib = this.BX.Booking.Lib || {}, BX, BX.Main, BX, BX.UI.Tour, BX.UI.AutoLaunch, BX.UI, BX.Booking, BX.Booking.Const, BX.Booking.Provider.Service);
//# sourceMappingURL=aha-moments.bundle.js.map

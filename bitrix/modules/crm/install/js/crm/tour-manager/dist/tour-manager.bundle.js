/* eslint-disable */
this.BX = this.BX || {};
(function (exports, crm_integration_ui_bannerDispatcher) {
	'use strict';

	class Queue {
		#stack = new Map();
		get(id) {
			return this.#stack.get(id) ?? null;
		}
		push(tour) {
			this.#stack.set(tour.getGuide().getId(), tour);
		}
		pop() {
			const lastTour = [...this.#stack.values()].pop();
			if (!lastTour) {
				return null;
			}
			this.delete(lastTour.getGuide().getId());
			return lastTour;
		}
		peek() {
			const [firstTour] = this.#stack.values();
			if (!firstTour) {
				return null;
			}
			this.delete(firstTour.getGuide().getId());
			return firstTour;
		}
		delete(id) {
			return this.#stack.delete(id);
		}
		size() {
			return this.#stack.size();
		}
	}

	class TourManager {
		static TOUR_FINISH_EVENT = 'UI.Tour.Guide:onFinish';
		static instance = null;
		#queue = new Queue();
		#current = null;
		#bannerDispatcher;
		static getInstance() {
			if (!TourManager.instance) {
				TourManager.instance = new TourManager();
			}
			return TourManager.instance;
		}
		constructor() {
			this.#bannerDispatcher = new crm_integration_ui_bannerDispatcher.BannerDispatcher();
		}
		registerWithLaunch(tour) {
			this.register(tour);
			this.launch();
		}
		launch() {
			if (this.#current || this.#isBannerDispatcherAvailable()) {
				return;
			}
			this.#current = this.#queue.peek();
			this.#current?.show();
		}
		register(tour) {
			if (!tour.canShow()) {
				return;
			}
			if (this.#isBannerDispatcherAvailable()) {
				this.#toBannerDispatcherQueue(tour);
				return;
			}
			this.#queue.push(tour);
			this.#subscribeTourFinish(tour);
		}
		#isBannerDispatcherAvailable() {
			return this.#bannerDispatcher.isAvailable();
		}
		#toBannerDispatcherQueue(tour) {
			this.#bannerDispatcher.toQueue(onDone => {
				if (tour.canShow()) {
					tour.getGuide().subscribe(TourManager.TOUR_FINISH_EVENT, onDone);
					tour.show();
				} else {
					onDone();
				}
			});
		}
		#subscribeTourFinish(tour) {
			tour.getGuide().subscribe(TourManager.TOUR_FINISH_EVENT, this.#showNextTour.bind(this));
		}
		#showNextTour() {
			const nextTour = this.#queue.peek();
			if (!nextTour) {
				this.#current = null;
				return;
			}
			this.#current = nextTour;
			this.#current.show();
		}
	}

	exports.TourManager = TourManager;

})(this.BX.Crm = this.BX.Crm || {}, BX.Crm.Integration.UI);
//# sourceMappingURL=tour-manager.bundle.js.map

/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
(function (exports, main_core_events, main_core, ui_tour) {
	'use strict';

	class FirstProject extends main_core_events.EventEmitter {
		constructor(params) {
			super(params);
			this.setEventNamespace('BX.Tasks.Tour.FirstProject');
			this.popupData = params.popupData;
			this.targetNode = document.getElementById(params.targetNodeId);
			this.guide = new ui_tour.Guide({
				steps: [{
					target: this.targetNode,
					title: this.popupData[0].title,
					text: this.popupData[0].text,
					article: this.popupData[0].article
				}],
				onEvents: true
			});
			this.bindEvents();
		}
		bindEvents() {
			main_core_events.EventEmitter.subscribe('UI.Tour.Guide:onFinish', this.onGuideFinish.bind(this));
			main_core_events.EventEmitter.subscribe('SidePanel.Slider:onMessage', this.onProjectSliderMessage.bind(this));
		}
		onGuideFinish(event) {
			const {
				guide
			} = event.getData();
			if (guide === this.guide) {
				this.targetNode.href = main_core.Uri.removeParam(this.targetNode.href, ['PROJECT_OPTIONS']);
			}
		}
		onProjectSliderMessage(event) {
			const [sliderEvent] = event.getData();
			if (sliderEvent.getEventId() !== 'sonetGroupEvent') {
				return;
			}
			const sliderEventData = sliderEvent.getData();
			if (sliderEventData.code !== 'afterCreate' || sliderEventData.data.projectOptions.tourId !== this.guide.getId()) {
				return;
			}
			const projectId = sliderEventData.data.group.ID;
			this.emit('afterProjectCreated', projectId);
		}
		showFinalStep(target) {
			this.guide.steps.push(new ui_tour.Step({
				target,
				cursorMode: true,
				targetEvent: () => {
					setTimeout(() => this.guide.close(), 1000);
				}
			}));
			this.finish();
			this.showNextStep();
		}
		start() {
			this.targetNode.href = main_core.Uri.addParam(this.targetNode.href, {
				PROJECT_OPTIONS: {
					tourId: this.guide.getId()
				}
			});
			this.showNextStep();
		}
		finish() {
			main_core.ajax.runAction('tasks.tourguide.firstprojectcreation.finish');
		}
		showNextStep() {
			setTimeout(() => this.guide.showNextStep(), 1000);
		}
	}

	class FirstScrum extends main_core_events.EventEmitter {
		constructor(params) {
			super(params);
			this.setEventNamespace('BX.Tasks.Tour.FirstScrum');
			this.popupData = params.popupData;
			this.targetNode = document.getElementById(params.targetNodeId);
			this.guide = new ui_tour.Guide({
				steps: [{
					target: this.targetNode,
					title: this.popupData[0].title,
					text: this.popupData[0].text,
					article: null
				}],
				onEvents: true
			});
			this.bindEvents();
		}
		bindEvents() {
			main_core_events.EventEmitter.subscribe('UI.Tour.Guide:onFinish', this.onGuideFinish.bind(this));
			main_core_events.EventEmitter.subscribe('SidePanel.Slider:onMessage', this.onProjectSliderMessage.bind(this));
		}
		onGuideFinish(event) {
			const {
				guide
			} = event.getData();
			if (guide === this.guide) {
				this.targetNode.href = main_core.Uri.removeParam(this.targetNode.href, ['PROJECT_OPTIONS']);
			}
		}
		onProjectSliderMessage(event) {
			const [sliderEvent] = event.getData();
			if (sliderEvent.getEventId() !== 'sonetGroupEvent') {
				return;
			}
			const sliderEventData = sliderEvent.getData();
			if (sliderEventData.code !== 'afterCreate' || sliderEventData.data.projectOptions.tourId !== this.guide.getId()) {
				return;
			}
			const projectId = sliderEventData.data.group.ID;
			this.emit('afterProjectCreated', projectId);
		}
		showFinalStep(target) {
			this.guide.steps.push(new ui_tour.Step({
				target,
				cursorMode: true,
				targetEvent: () => {
					setTimeout(() => this.guide.close(), 1000);
				}
			}));
			this.finish();
			this.showNextStep();
		}
		start() {
			this.targetNode.href = main_core.Uri.addParam(this.targetNode.href, {
				PROJECT_OPTIONS: {
					tourId: this.guide.getId()
				}
			});
			this.showNextStep();
		}
		finish() {
			main_core.ajax.runAction('tasks.tourguide.firstscrumcreation.finish');
		}
		showNextStep() {
			setTimeout(() => this.guide.showNextStep(), 1000);
		}
	}

	class Tour extends main_core_events.EventEmitter {
		constructor(params) {
			super(params);
			this.setEventNamespace('BX.Tasks.Tour');
			const tours = params.tours;
			const firstProjectData = tours.firstProjectCreation ?? {};
			const firstScrumData = tours.firstScrumCreation ?? {};
			if (firstProjectData.show) {
				this.firstProject = new FirstProject({
					targetNodeId: firstProjectData.targetNodeId,
					popupData: firstProjectData.popupData
				});
				this.firstProject.subscribe('afterProjectCreated', baseEvent => {
					this.emit('FirstProject:afterProjectCreated', baseEvent.getData());
				});
				this.firstProject.start();
			}
			if (firstScrumData.show) {
				this.firstScrum = new FirstScrum({
					targetNodeId: firstScrumData.targetNodeId,
					popupData: firstScrumData.popupData
				});
				this.firstScrum.subscribe('afterProjectCreated', baseEvent => {
					this.emit('FirstScrum:afterScrumCreated', baseEvent.getData());
				});
				this.firstScrum.start();
			}
		}
		showFinalStep(target) {
			if (this.firstProject) {
				this.firstProject.showFinalStep(target);
			}
			if (this.firstScrum) {
				this.firstScrum.showFinalStep(target);
			}
		}
	}

	exports.Tour = Tour;

})(this.BX.Tasks.Tour = this.BX.Tasks.Tour || {}, BX.Event, BX, BX.UI.Tour);
//# sourceMappingURL=tour.bundle.js.map

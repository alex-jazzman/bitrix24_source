/* eslint-disable */
this.BX = this.BX || {};
(function (exports, ui_tour, ui_bannerDispatcher, main_core) {
	'use strict';

	class Spot {
		static WIDTH = 380;
		static PATH_TO_IMAGES = '/bitrix/js/tasks/clue/images/spot/';
		#targetElement;
		#spotlight = null;
		constructor() {
			if (new.target === Spot) {
				throw new Error('This class is abstract and cannot be instantiated directly');
			}
		}
		getWidth() {
			return Spot.WIDTH;
		}
		getAngleOffset() {
			return this.#targetElement.offsetWidth / 2;
		}
		isAutoHide() {
			return true;
		}
		setTargetElement(targetElement) {
			this.#targetElement = targetElement;
		}
		showLight() {
			this.#spotlight = new BX.SpotLight({
				targetElement: this.#targetElement,
				targetVertex: 'middle-center',
				color: this.getSpotlightColor()
			});
			this.#spotlight.show();
		}
		close() {
			this.#spotlight.close();
		}
		getIconSrc() {
			return null;
		}
		getSpotlightColor() {
			return null;
		}
		getConditionColor() {
			return 'primary';
		}
		getTitle() {}
		getText() {}
	}

	class FlowCopilotAdvice extends Spot {
		getWidth() {
			return 340;
		}
		getIconSrc() {
			return null;
		}
		getTitle() {
			return main_core.Loc.getMessage('TASKS_CLUE_FLASH_COPILOT_ADVICE_TITLE_MSGVER_1', {
				'#COPILOT_NAME#': main_core.Extension.getSettings('tasks.clue').copilotName
			});
		}
		getText() {
			return main_core.Loc.getMessage('TASKS_CLUE_FLASH_COPILOT_ADVICE_TEXT');
		}
		getSpotlightColor() {
			return '#8e52ec';
		}
		getConditionColor() {
			return 'copilot';
		}
	}

	class MyTasks extends Spot {
		getIconSrc() {
			return `${Spot.PATH_TO_IMAGES}my-tasks.svg`;
		}
		getTitle() {
			return main_core.Loc.getMessage('TASKS_CLUE_FLASH_MY_TASKS_TITLE');
		}
		getText() {
			return main_core.Loc.getMessage('TASKS_CLUE_FLASH_MY_TASKS_TEXT');
		}
	}

	class TaskStart extends Spot {
		getIconSrc() {
			return `${Spot.PATH_TO_IMAGES}task-start.svg`;
		}
		getTitle() {
			return main_core.Loc.getMessage('TASKS_CLUE_FLASH_TASK_START_TITLE');
		}
		getText() {
			return main_core.Loc.getMessage('TASKS_CLUE_FLASH_TASK_START_TEXT');
		}
	}

	class CommentCounter extends Spot {
		getTitle() {
			return main_core.Loc.getMessage('TASKS_CLUE_FLASH_COMMENT_COUNTER_TITLE');
		}
		getText() {
			return main_core.Loc.getMessage('TASKS_CLUE_FLASH_COMMENT_COUNTER_TEXT');
		}
	}

	class Clue {
		static SPOT = Object.freeze({
			MY_TASKS: new MyTasks(),
			TASK_START: new TaskStart(),
			FLOW_COPILOT_ADVICE: new FlowCopilotAdvice(),
			COMMENT_COUNTER: new CommentCounter()
		});
		#params;
		#spot = null;
		#guide = null;
		constructor(params) {
			this.#params = params;
		}
		show(spot, bindElement) {
			this.#spot = spot;
			this.#spot.setTargetElement(bindElement);
			this.#guide = new ui_tour.Guide({
				id: this.#params.id,
				autoSave: this.#params.autoSave === true,
				overlay: this.#params.overlay === true,
				simpleMode: true,
				onEvents: true,
				steps: [{
					target: bindElement,
					iconSrc: this.#spot.getIconSrc(),
					title: this.#spot.getTitle(),
					text: this.#spot.getText(),
					position: 'bottom',
					condition: {
						top: true,
						bottom: false,
						color: this.#spot.getConditionColor()
					}
				}]
			});
			ui_bannerDispatcher.BannerDispatcher.normal.toQueue(onDone => {
				const guidePopup = this.#guide.getPopup();
				const onClose = () => {
					this.#spot.close();
					onDone();
				};
				guidePopup.setWidth(this.#spot.getWidth());
				guidePopup.setAngle({
					offset: this.#spot.getAngleOffset()
				});
				guidePopup.setAutoHide(this.#spot.isAutoHide());
				guidePopup.subscribe('onClose', onClose);
				guidePopup.subscribe('onDestroy', onClose);
				this.#spot.showLight();
				this.#guide.start();
			});
		}
		isShown() {
			if (this.#guide === null) {
				return false;
			}
			return this.#guide.getPopup().isShown();
		}
		close() {
			if (this.#guide) {
				this.#guide.close();
			}
			if (this.#spot) {
				this.#spot.close();
			}
		}
		adjustPosition(bindElement) {
			if (this.#guide) {
				this.#guide.getPopup().setBindElement(bindElement);
				this.#guide.getPopup().adjustPosition();
			}
			if (this.#spot) {
				this.#spot.setTargetElement(bindElement);
				this.#spot.showLight();
			}
		}
	}

	exports.Clue = Clue;

})(this.BX.Tasks = this.BX.Tasks || {}, BX.UI.Tour, BX.UI, BX);
//# sourceMappingURL=clue.bundle.js.map

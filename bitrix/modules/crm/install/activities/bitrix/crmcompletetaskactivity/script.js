/* eslint-disable */
(function (exports, main_core) {
	'use strict';

	const namespace = main_core.Reflection.namespace('BX.Crm.Automation.Activity');
	class CompleteTaskActivity {
		#form;
		#chosenStages;
		#stages;
		#categoryContainer;
		#stagesContainer;
		#isRobot;
		constructor(options) {
			this.#form = document.forms.namedItem(options.formName);
			if (!main_core.Type.isArray(options.chosenStages)) {
				options.chosenStages = [];
			}
			this.#categoryContainer = this.#form['target_category'];
			this.#stagesContainer = this.#form['target_status[]'];
			this.#chosenStages = new Set(options.chosenStages.map(stageId => String(stageId)));
			this.#isRobot = options.isRobot;
			this.#stages = {};
			if (main_core.Type.isPlainObject(options.stages)) {
				for (const [categoryId, stages] of Object.entries(options.stages)) {
					// we have to cast types explicitly
					this.#stages[categoryId] = stages.map(stageInfo => ({
						id: String(stageInfo.id),
						name: String(stageInfo.name)
					}));
				}
			} else if (main_core.Type.isArray(options.stages)) {
				// we have to cast types explicitly
				options.stages.forEach((categoryStages, categoryId) => {
					this.#stages[categoryId] = categoryStages.map(stageInfo => ({
						id: String(stageInfo.id),
						name: String(stageInfo.name)
					}));
				});
			}
		}
		init() {
			if (this.#categoryContainer.options.length <= 1) {
				if (this.#isRobot) {
					main_core.Dom.remove(this.#categoryContainer.parentElement);
				} else {
					main_core.Dom.remove(this.#categoryContainer.parentElement.parentElement);
				}
			} else {
				this.updateStages();
			}
		}
		updateStages() {
			main_core.Dom.clean(this.#stagesContainer);
			this.renderStages();
		}
		render() {
			if (this.#categoryContainer) {
				this.#categoryContainer.onchange = this.updateStages.bind(this);
			}
		}
		renderStages() {
			if (this.#stages.hasOwnProperty(this.#categoryContainer.value)) {
				const stages = this.#stages[this.#categoryContainer.value];
				stages.forEach(({
					id,
					name
				}) => {
					const option = new Option(name, id, false, this.#chosenStages.has(id));
					this.#stagesContainer.append(option);
				});
			} else {
				for (const categoryOption of this.#categoryContainer.options) {
					const categoryId = categoryOption.value;
					const categoryName = categoryOption.text;
					if (this.#stages.hasOwnProperty(categoryId)) {
						this.#stages[categoryId].forEach(({
							id,
							name
						}) => {
							const stageName = main_core.Text.encode(`${categoryName} / ${name}`);
							const option = new Option(stageName, id, false, this.#chosenStages.has(id));
							this.#stagesContainer.append(option);
						});
					}
				}
			}
		}
	}
	namespace.CompleteTaskActivity = CompleteTaskActivity;

	exports.CompleteTaskActivity = CompleteTaskActivity;

})(this.window = this.window || {}, BX);
//# sourceMappingURL=script.js.map

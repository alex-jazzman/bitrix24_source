/* eslint-disable */
this.BX = this.BX || {};
this.BX.Bizproc = this.BX.Bizproc || {};
this.BX.Bizproc.Workflow = this.BX.Bizproc.Workflow || {};
(function (exports, main_core, main_date, bizproc_workflow_timeline, bizproc_a11y) {
	'use strict';

	class Summary {
		#name;
		#isFinal = false;
		#workflowId;
		#durationTexts = {
			nameBefore: '',
			value: '',
			nameAfter: ''
		};
		constructor(props = {}) {
			if (!main_core.Type.isStringFilled(props.workflowId)) {
				throw new TypeError('workflowId must be filled string');
			}
			this.#workflowId = props.workflowId;
			this.#isFinal = props.data?.status === 'success';
			this.#name = main_core.Type.isStringFilled(props.data?.name) ? props.data.name : '';
			this.#calculateDurationTexts(props.data?.duration);
		}
		#calculateDurationTexts(time) {
			if (!this.#isFinal) {
				return;
			}
			const duration = main_core.Type.isNumber(time) ? main_date.DateTimeFormat.format([['s', 'sdiff'], ['i', 'idiff'], ['H', 'Hdiff'], ['d', 'ddiff'], ['m', 'mdiff'], ['Y', 'Ydiff']], 0, time) : null;
			if (duration) {
				const pattern = /\d+/;
				const match = duration.match(pattern);
				if (match) {
					this.#durationTexts.value = String(match[0]);
					const index = duration.indexOf(this.#durationTexts.value);
					if (index !== -1) {
						this.#durationTexts.nameBefore = duration.slice(0, index).trim();
						this.#durationTexts.nameAfter = duration.slice(index + this.#durationTexts.value.length).trim();
					}
				} else {
					this.#durationTexts.nameAfter = duration;
				}
			}
		}
		render() {
			const title = main_core.Text.encode(this.#name);
			const footerTitle = main_core.Text.encode(main_core.Loc.getMessage('BIZPROC_JS_WORKFLOW_FACES_SUMMARY_TIMELINE_MSGVER_1'));
			const root = main_core.Tag.render`
			<div class="bp-workflow-faces-summary-item">
				<div class="bp-workflow-faces-summary-name">
					<div class="bp-workflow-faces-summary__text-area" title="${title}">${title}</div>
				</div>
				${this.#renderContent()}
				<div class="bp-workflow-faces-summary__duration">
					<div class="bp-workflow-faces-summary__text-area" title="${footerTitle}">${footerTitle}</div>
				</div>
			</div>
		`;
			const durationNode = root.querySelector('.bp-workflow-faces-summary__duration');
			if (durationNode) {
				bizproc_a11y.makeActivatable(durationNode, this.#openTimeline.bind(this));
			}
			return root;
		}
		#renderContent() {
			if (this.#isFinal) {
				return main_core.Tag.render`
				<div class="bp-workflow-faces-summary__summary">
					<div class="bp-workflow-faces-summary__summary-name">${main_core.Text.encode(this.#durationTexts.nameBefore)}</div>
					<div class="bp-workflow-faces-summary__summary-value">${main_core.Text.encode(this.#durationTexts.value)}</div>
					<div class="bp-workflow-faces-summary__summary-name">${main_core.Text.encode(this.#durationTexts.nameAfter)}</div>
				</div>
			`;
			}
			return main_core.Tag.render`
			<div class="bp-workflow-faces-summary__icon-wrapper">
				<div class="ui-icon-set --clock-2 bp-workflow-faces-summary__icon"></div>
			</div>
		`;
		}
		#openTimeline(event) {
			event.stopPropagation();
			event.preventDefault();
			bizproc_workflow_timeline.Timeline.open({
				workflowId: this.#workflowId
			});
		}
	}

	exports.Summary = Summary;

})(this.BX.Bizproc.Workflow.Faces = this.BX.Bizproc.Workflow.Faces || {}, BX, BX.Main, BX.Bizproc.Workflow, BX.Bizproc.A11y);
//# sourceMappingURL=summary.bundle.js.map

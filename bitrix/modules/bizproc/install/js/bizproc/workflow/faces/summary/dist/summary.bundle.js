/* eslint-disable */
this.BX = this.BX || {};
this.BX.Bizproc = this.BX.Bizproc || {};
this.BX.Bizproc.Workflow = this.BX.Bizproc.Workflow || {};
(function (exports,main_core,main_date,bizproc_workflow_timeline) {
	'use strict';

	let _ = t => t,
	  _t,
	  _t2,
	  _t3,
	  _t4;
	var _isFinal = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isFinal");
	var _workflowId = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("workflowId");
	var _showArrow = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("showArrow");
	var _showContent = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("showContent");
	var _showTitle = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("showTitle");
	var _calculateDurationTexts = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("calculateDurationTexts");
	var _renderContent = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("renderContent");
	var _openTimeline = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("openTimeline");
	class Summary {
	  constructor(props = {}) {
	    Object.defineProperty(this, _openTimeline, {
	      value: _openTimeline2
	    });
	    Object.defineProperty(this, _renderContent, {
	      value: _renderContent2
	    });
	    Object.defineProperty(this, _calculateDurationTexts, {
	      value: _calculateDurationTexts2
	    });
	    Object.defineProperty(this, _isFinal, {
	      writable: true,
	      value: false
	    });
	    Object.defineProperty(this, _workflowId, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _showArrow, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _showContent, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _showTitle, {
	      writable: true,
	      value: void 0
	    });
	    if (!main_core.Type.isStringFilled(props.workflowId)) {
	      throw new TypeError('workflowId must be filled string');
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _workflowId)[_workflowId] = props.workflowId;
	    if (main_core.Type.isBoolean(props.workflowIsCompleted)) {
	      babelHelpers.classPrivateFieldLooseBase(this, _isFinal)[_isFinal] = props.workflowIsCompleted;
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _showArrow)[_showArrow] = main_core.Type.isBoolean(props.showArrow) ? props.showArrow : true;
	    babelHelpers.classPrivateFieldLooseBase(this, _showContent)[_showContent] = main_core.Type.isBoolean(props.showContent) ? props.showContent : true;
	    babelHelpers.classPrivateFieldLooseBase(this, _showTitle)[_showTitle] = main_core.Type.isBoolean(props.showTitle) ? props.showTitle : true;
	    babelHelpers.classPrivateFieldLooseBase(this, _calculateDurationTexts)[_calculateDurationTexts](props.time);
	  }
	  render() {
	    const title = main_core.Loc.getMessage(babelHelpers.classPrivateFieldLooseBase(this, _isFinal)[_isFinal] ? 'BIZPROC_JS_WORKFLOW_FACES_SUMMARY_TITLE_FINAL' : 'BIZPROC_JS_WORKFLOW_FACES_SUMMARY_TITLE');
	    if (babelHelpers.classPrivateFieldLooseBase(this, _showContent)[_showContent]) {
	      return main_core.Tag.render(_t || (_t = _`
				<div class="bp-workflow-faces__steps-item --result --summary ${0}">
					<div class="bp-workflow-faces__steps-name">
						<span class="bp-workflow-faces__text-area">${0}</span>
					</div>
					${0}
					<div class="bp-workflow-faces__steps-duration" onclick="${0}">
						<a href="#" class="bp-workflow-faces__text-area">
							${0}
						</a>
					</div>
				</div>
			`), babelHelpers.classPrivateFieldLooseBase(this, _showArrow)[_showArrow] ? '' : '--arrow-hidden', babelHelpers.classPrivateFieldLooseBase(this, _showTitle)[_showTitle] ? main_core.Text.encode(title) : '', babelHelpers.classPrivateFieldLooseBase(this, _renderContent)[_renderContent](), babelHelpers.classPrivateFieldLooseBase(this, _openTimeline)[_openTimeline].bind(this), main_core.Loc.getMessage('BIZPROC_JS_WORKFLOW_FACES_SUMMARY_TIMELINE'));
	    }
	    return main_core.Tag.render(_t2 || (_t2 = _`
			<div class="bp-workflow-faces__steps-item --result --summary --content-hidden"></div>
		`));
	  }
	}
	function _calculateDurationTexts2(time) {
	  const duration = main_core.Type.isNumber(time) && babelHelpers.classPrivateFieldLooseBase(this, _showContent)[_showContent] ? main_date.DateTimeFormat.format([['s', 'sdiff'], ['i', 'idiff'], ['H', 'Hdiff'], ['d', 'ddiff'], ['m', 'mdiff'], ['Y', 'Ydiff']], 0, time) : null;
	  this.durationTexts = {
	    nameBefore: '',
	    value: '',
	    nameAfter: ''
	  };
	  if (duration) {
	    const pattern = /\d+/;
	    const match = duration.match(pattern);
	    if (match) {
	      this.durationTexts.value = String(match[0]);
	      const index = duration.indexOf(this.durationTexts.value);
	      if (index !== -1) {
	        this.durationTexts.nameBefore = duration.slice(0, index).trim();
	        this.durationTexts.nameAfter = duration.slice(index + this.durationTexts.value.length).trim();
	      }
	    } else {
	      this.durationTexts.nameAfter = duration;
	    }
	  }
	}
	function _renderContent2() {
	  if (babelHelpers.classPrivateFieldLooseBase(this, _isFinal)[_isFinal]) {
	    return main_core.Tag.render(_t3 || (_t3 = _`
				<div class="bp-workflow-faces__steps-summary">
					<div class="bp-workflow-faces__steps-summary-name">${0}</div>
					<div class="bp-workflow-faces__steps-summary-value">${0}</div>
					<div class="bp-workflow-faces__steps-summary-name">${0}</div>
				</div>
			`), main_core.Text.encode(this.durationTexts.nameBefore), main_core.Text.encode(this.durationTexts.value), main_core.Text.encode(this.durationTexts.nameAfter));
	  }
	  return main_core.Tag.render(_t4 || (_t4 = _`
			<div class="bp-workflow-faces__steps-users">
				<div class="ui-icon-set --clock-2 bp-workflow-faces__steps-user"></div>
			</div>
		`));
	}
	function _openTimeline2(event) {
	  event.preventDefault();
	  bizproc_workflow_timeline.Timeline.open({
	    workflowId: babelHelpers.classPrivateFieldLooseBase(this, _workflowId)[_workflowId]
	  });
	}

	exports.Summary = Summary;

}((this.BX.Bizproc.Workflow.Faces = this.BX.Bizproc.Workflow.Faces || {}),BX,BX.Main,BX.Bizproc.Workflow));
//# sourceMappingURL=summary.bundle.js.map

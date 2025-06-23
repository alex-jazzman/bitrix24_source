/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
(function (exports,main_core) {
	'use strict';

	const fieldAttribute = 'data-task-field-id';
	const chipAttribute = 'data-task-chip-id';
	const fieldSelector = '[data-field-container]';
	var _container = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("container");
	var _highlightTimeouts = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("highlightTimeouts");
	var _startAnimation = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("startAnimation");
	var _stopAnimation = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("stopAnimation");
	var _scrollToField = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("scrollToField");
	var _getFieldContainer = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getFieldContainer");
	var _getChipContainer = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getChipContainer");
	var _nextTick = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("nextTick");
	class FieldHighlighter {
	  constructor() {
	    Object.defineProperty(this, _nextTick, {
	      value: _nextTick2
	    });
	    Object.defineProperty(this, _getChipContainer, {
	      value: _getChipContainer2
	    });
	    Object.defineProperty(this, _getFieldContainer, {
	      value: _getFieldContainer2
	    });
	    Object.defineProperty(this, _scrollToField, {
	      value: _scrollToField2
	    });
	    Object.defineProperty(this, _stopAnimation, {
	      value: _stopAnimation2
	    });
	    Object.defineProperty(this, _startAnimation, {
	      value: _startAnimation2
	    });
	    Object.defineProperty(this, _container, {
	      writable: true,
	      value: document.body
	    });
	    Object.defineProperty(this, _highlightTimeouts, {
	      writable: true,
	      value: {}
	    });
	  }
	  setContainer(container) {
	    babelHelpers.classPrivateFieldLooseBase(this, _container)[_container] = container;
	    return this;
	  }
	  addHighlight(fieldId) {
	    return this.highlightContainer(babelHelpers.classPrivateFieldLooseBase(this, _getFieldContainer)[_getFieldContainer](fieldId));
	  }
	  addChipHighlight(fieldId) {
	    return this.highlightContainer(babelHelpers.classPrivateFieldLooseBase(this, _getChipContainer)[_getChipContainer](fieldId));
	  }
	  highlightContainer(container) {
	    main_core.Dom.addClass(container, 'tasks-field-highlight');
	    const removeHighlight = () => {
	      main_core.Dom.removeClass(container, 'tasks-field-highlight');
	      main_core.Event.unbind(window, 'click', removeHighlight);
	      main_core.Event.unbind(window, 'keydown', removeHighlight);
	    };
	    main_core.Event.bind(window, 'click', removeHighlight);
	    main_core.Event.bind(window, 'keydown', removeHighlight);
	    return container;
	  }
	  async highlight(fieldId) {
	    await babelHelpers.classPrivateFieldLooseBase(this, _nextTick)[_nextTick]();
	    const fieldContainer = babelHelpers.classPrivateFieldLooseBase(this, _getFieldContainer)[_getFieldContainer](fieldId);
	    babelHelpers.classPrivateFieldLooseBase(this, _stopAnimation)[_stopAnimation](fieldContainer);
	    setTimeout(() => babelHelpers.classPrivateFieldLooseBase(this, _startAnimation)[_startAnimation](fieldContainer));
	    clearTimeout(babelHelpers.classPrivateFieldLooseBase(this, _highlightTimeouts)[_highlightTimeouts][fieldId]);
	    babelHelpers.classPrivateFieldLooseBase(this, _highlightTimeouts)[_highlightTimeouts][fieldId] = setTimeout(() => babelHelpers.classPrivateFieldLooseBase(this, _stopAnimation)[_stopAnimation](fieldContainer), 1500);
	    babelHelpers.classPrivateFieldLooseBase(this, _scrollToField)[_scrollToField](fieldId);
	    return fieldContainer;
	  }
	}
	function _startAnimation2(fieldContainer) {
	  main_core.Dom.addClass(fieldContainer, ['tasks-field-highlight', '--animate']);
	}
	function _stopAnimation2(fieldContainer) {
	  main_core.Dom.removeClass(fieldContainer, ['tasks-field-highlight', '--animate']);
	}
	function _scrollToField2(fieldId) {
	  const fieldContainer = babelHelpers.classPrivateFieldLooseBase(this, _getFieldContainer)[_getFieldContainer](fieldId);
	  fieldContainer.scrollIntoView({
	    block: 'center',
	    behavior: 'smooth'
	  });
	}
	function _getFieldContainer2(fieldId) {
	  return babelHelpers.classPrivateFieldLooseBase(this, _container)[_container].querySelector(`[${fieldAttribute}="${fieldId}"]`).closest(fieldSelector);
	}
	function _getChipContainer2(fieldId) {
	  return babelHelpers.classPrivateFieldLooseBase(this, _container)[_container].querySelector(`[${chipAttribute}="${fieldId}"]`);
	}
	function _nextTick2() {
	  return new Promise(resolve => {
	    setTimeout(resolve, 0);
	  });
	}
	const fieldHighlighter = new FieldHighlighter();

	exports.fieldHighlighter = fieldHighlighter;

}((this.BX.Tasks.V2.Lib = this.BX.Tasks.V2.Lib || {}),BX));
//# sourceMappingURL=field-highlighter.bundle.js.map

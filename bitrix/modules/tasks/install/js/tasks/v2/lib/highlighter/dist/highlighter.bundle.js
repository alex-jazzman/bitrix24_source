/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
(function (exports,main_core) {
	'use strict';

	var _activeHighlights = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("activeHighlights");
	var _startAnimation = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("startAnimation");
	var _cleanup = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("cleanup");
	var _nextTick = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("nextTick");
	class Highlighter {
	  constructor() {
	    Object.defineProperty(this, _nextTick, {
	      value: _nextTick2
	    });
	    Object.defineProperty(this, _cleanup, {
	      value: _cleanup2
	    });
	    Object.defineProperty(this, _startAnimation, {
	      value: _startAnimation2
	    });
	    Object.defineProperty(this, _activeHighlights, {
	      writable: true,
	      value: new WeakMap()
	    });
	  }
	  async highlight(element, duration = Highlighter.ANIMATION_DURATION) {
	    if (!main_core.Type.isElementNode(element)) {
	      return;
	    }
	    await babelHelpers.classPrivateFieldLooseBase(this, _nextTick)[_nextTick]();
	    babelHelpers.classPrivateFieldLooseBase(this, _cleanup)[_cleanup](element);
	    babelHelpers.classPrivateFieldLooseBase(this, _activeHighlights)[_activeHighlights].set(element, {
	      animationStart: null,
	      timeoutId: null,
	      handler: null
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _startAnimation)[_startAnimation](element);
	    const handler = () => babelHelpers.classPrivateFieldLooseBase(this, _cleanup)[_cleanup](element);
	    main_core.Event.bind(window, 'click', handler);
	    main_core.Event.bind(window, 'keydown', handler);
	    const state = babelHelpers.classPrivateFieldLooseBase(this, _activeHighlights)[_activeHighlights].get(element);
	    state.handler = handler;
	    state.timeoutId = setTimeout(() => babelHelpers.classPrivateFieldLooseBase(this, _cleanup)[_cleanup](element), Highlighter.ANIMATION_DURATION);
	  }
	}
	function _startAnimation2(element) {
	  main_core.Dom.addClass(element, [Highlighter.HIGHLIGHT_CLASS, Highlighter.ANIMATE_CLASS]);
	  const state = babelHelpers.classPrivateFieldLooseBase(this, _activeHighlights)[_activeHighlights].get(element);
	  if (state) {
	    state.animationStart = Date.now();
	  }
	}
	function _cleanup2(element) {
	  const state = babelHelpers.classPrivateFieldLooseBase(this, _activeHighlights)[_activeHighlights].get(element);
	  if (!state) {
	    return;
	  }
	  main_core.Dom.removeClass(element, [Highlighter.HIGHLIGHT_CLASS, Highlighter.ANIMATE_CLASS]);
	  if (state.timeoutId) {
	    clearTimeout(state.timeoutId);
	  }
	  if (state.handler) {
	    main_core.Event.unbind(window, 'click', state.handler);
	    main_core.Event.unbind(window, 'keydown', state.handler);
	  }
	  babelHelpers.classPrivateFieldLooseBase(this, _activeHighlights)[_activeHighlights].delete(element);
	}
	function _nextTick2() {
	  return new Promise(resolve => {
	    // eslint-disable-next-line no-promise-executor-return
	    return setTimeout(resolve, 0);
	  });
	}
	Highlighter.HIGHLIGHT_CLASS = 'element-highlight';
	Highlighter.ANIMATE_CLASS = '--animate';
	Highlighter.ANIMATION_DURATION = 1000;
	const highlighter = new Highlighter();

	exports.Highlighter = Highlighter;
	exports.highlighter = highlighter;

}((this.BX.Tasks.V2.Lib = this.BX.Tasks.V2.Lib || {}),BX));
//# sourceMappingURL=highlighter.bundle.js.map

/* eslint-disable */
this.BX = this.BX || {};
this.BX.UI = this.BX.UI || {};
(function (exports,ui_pdfjs) {
	'use strict';

	let _Symbol$iterator;
	/**
	 * @licstart The following is the entire license notice for the
	 * JavaScript code in this page
	 *
	 * Copyright 2024 Mozilla Foundation
	 *
	 * Licensed under the Apache License, Version 2.0 (the "License");
	 * you may not use this file except in compliance with the License.
	 * You may obtain a copy of the License at
	 *
	 *     http://www.apache.org/licenses/LICENSE-2.0
	 *
	 * Unless required by applicable law or agreed to in writing, software
	 * distributed under the License is distributed on an "AS IS" BASIS,
	 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	 * See the License for the specific language governing permissions and
	 * limitations under the License.
	 *
	 * @licend The above is the entire license notice for the
	 * JavaScript code in this page
	 */

	/******/ // The require scope
	/******/
	var __webpack_require__ = {};
	/******/
	/************************************************************************/
	/******/ /* webpack/runtime/define property getters */
	/******/
	(() => {
	  /******/ // define getter functions for harmony exports
	  /******/__webpack_require__.d = (exports, definition) => {
	    /******/for (var key in definition) {
	      /******/if (__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
	        /******/Object.defineProperty(exports, key, {
	          enumerable: true,
	          get: definition[key]
	        });
	        /******/
	      }
	      /******/
	    }
	    /******/
	  };
	  /******/
	})();
	/******/
	/******/ /* webpack/runtime/hasOwnProperty shorthand */
	/******/
	(() => {
	  /******/__webpack_require__.o = (obj, prop) => Object.prototype.hasOwnProperty.call(obj, prop);
	  /******/
	})();
	/******/
	/************************************************************************/
	var __webpack_exports__ = {};

	// EXPORTS
	__webpack_require__.d(__webpack_exports__, {
	  PDFViewerApplication: () => /* reexport */PDFViewerApplication,
	  PDFViewerApplicationConstants: () => /* binding */AppConstants,
	  PDFViewerApplicationOptions: () => /* reexport */AppOptions
	});
	const DEFAULT_SCALE_VALUE = "auto";
	const DEFAULT_SCALE = 1.0;
	const DEFAULT_SCALE_DELTA = 1.1;
	const MIN_SCALE = 0.1;
	const MAX_SCALE = 10.0;
	const UNKNOWN_SCALE = 0;
	const MAX_AUTO_SCALE = 1.25;
	const SCROLLBAR_PADDING = 40;
	const VERTICAL_PADDING = 5;
	const RenderingStates = {
	  INITIAL: 0,
	  RUNNING: 1,
	  PAUSED: 2,
	  FINISHED: 3
	};
	const PresentationModeState = {
	  UNKNOWN: 0,
	  NORMAL: 1,
	  CHANGING: 2,
	  FULLSCREEN: 3
	};
	const SidebarView = {
	  UNKNOWN: -1,
	  NONE: 0,
	  THUMBS: 1,
	  OUTLINE: 2,
	  ATTACHMENTS: 3,
	  LAYERS: 4
	};
	const TextLayerMode = {
	  DISABLE: 0,
	  ENABLE: 1,
	  ENABLE_PERMISSIONS: 2
	};
	const ScrollMode = {
	  UNKNOWN: -1,
	  VERTICAL: 0,
	  HORIZONTAL: 1,
	  WRAPPED: 2,
	  PAGE: 3
	};
	const SpreadMode = {
	  UNKNOWN: -1,
	  NONE: 0,
	  ODD: 1,
	  EVEN: 2
	};
	const CursorTool = {
	  SELECT: 0,
	  HAND: 1,
	  ZOOM: 2
	};
	const AutoPrintRegExp = /\bprint\s*\(/;
	function scrollIntoView(element, spot, scrollMatches = false) {
	  let parent = element.offsetParent;
	  if (!parent) {
	    console.error("offsetParent is not set -- cannot scroll");
	    return;
	  }
	  let offsetY = element.offsetTop + element.clientTop;
	  let offsetX = element.offsetLeft + element.clientLeft;
	  while (parent.clientHeight === parent.scrollHeight && parent.clientWidth === parent.scrollWidth || scrollMatches && (parent.classList.contains("markedContent") || getComputedStyle(parent).overflow === "hidden")) {
	    offsetY += parent.offsetTop;
	    offsetX += parent.offsetLeft;
	    parent = parent.offsetParent;
	    if (!parent) {
	      return;
	    }
	  }
	  if (spot) {
	    if (spot.top !== undefined) {
	      offsetY += spot.top;
	    }
	    if (spot.left !== undefined) {
	      offsetX += spot.left;
	      parent.scrollLeft = offsetX;
	    }
	  }
	  parent.scrollTop = offsetY;
	}
	function watchScroll(viewAreaElement, callback, abortSignal = undefined) {
	  const debounceScroll = function (evt) {
	    if (rAF) {
	      return;
	    }
	    rAF = window.requestAnimationFrame(function viewAreaElementScrolled() {
	      rAF = null;
	      const currentX = viewAreaElement.scrollLeft;
	      const lastX = state.lastX;
	      if (currentX !== lastX) {
	        state.right = currentX > lastX;
	      }
	      state.lastX = currentX;
	      const currentY = viewAreaElement.scrollTop;
	      const lastY = state.lastY;
	      if (currentY !== lastY) {
	        state.down = currentY > lastY;
	      }
	      state.lastY = currentY;
	      callback(state);
	    });
	  };
	  const state = {
	    right: true,
	    down: true,
	    lastX: viewAreaElement.scrollLeft,
	    lastY: viewAreaElement.scrollTop,
	    _eventHandler: debounceScroll
	  };
	  let rAF = null;
	  viewAreaElement.addEventListener("scroll", debounceScroll, {
	    useCapture: true,
	    signal: abortSignal
	  });
	  abortSignal == null ? void 0 : abortSignal.addEventListener("abort", () => window.cancelAnimationFrame(rAF), {
	    once: true
	  });
	  return state;
	}
	function parseQueryString(query) {
	  const params = new Map();
	  for (const [key, value] of new URLSearchParams(query)) {
	    params.set(key.toLowerCase(), value);
	  }
	  return params;
	}
	const InvisibleCharsRegExp = /[\x00-\x1F]/g;
	function removeNullCharacters(str, replaceInvisible = false) {
	  if (!InvisibleCharsRegExp.test(str)) {
	    return str;
	  }
	  if (replaceInvisible) {
	    return str.replaceAll(InvisibleCharsRegExp, m => m === "\x00" ? "" : " ");
	  }
	  return str.replaceAll("\x00", "");
	}
	function binarySearchFirstItem(items, condition, start = 0) {
	  let minIndex = start;
	  let maxIndex = items.length - 1;
	  if (maxIndex < 0 || !condition(items[maxIndex])) {
	    return items.length;
	  }
	  if (condition(items[minIndex])) {
	    return minIndex;
	  }
	  while (minIndex < maxIndex) {
	    const currentIndex = minIndex + maxIndex >> 1;
	    const currentItem = items[currentIndex];
	    if (condition(currentItem)) {
	      maxIndex = currentIndex;
	    } else {
	      minIndex = currentIndex + 1;
	    }
	  }
	  return minIndex;
	}
	function approximateFraction(x) {
	  if (Math.floor(x) === x) {
	    return [x, 1];
	  }
	  const xinv = 1 / x;
	  const limit = 8;
	  if (xinv > limit) {
	    return [1, limit];
	  } else if (Math.floor(xinv) === xinv) {
	    return [1, xinv];
	  }
	  const x_ = x > 1 ? xinv : x;
	  let a = 0,
	    b = 1,
	    c = 1,
	    d = 1;
	  while (true) {
	    const p = a + c,
	      q = b + d;
	    if (q > limit) {
	      break;
	    }
	    if (x_ <= p / q) {
	      c = p;
	      d = q;
	    } else {
	      a = p;
	      b = q;
	    }
	  }
	  let result;
	  if (x_ - a / b < c / d - x_) {
	    result = x_ === x ? [a, b] : [b, a];
	  } else {
	    result = x_ === x ? [c, d] : [d, c];
	  }
	  return result;
	}
	function floorToDivide(x, div) {
	  return x - x % div;
	}
	function getPageSizeInches({
	  view,
	  userUnit,
	  rotate
	}) {
	  const [x1, y1, x2, y2] = view;
	  const changeOrientation = rotate % 180 !== 0;
	  const width = (x2 - x1) / 72 * userUnit;
	  const height = (y2 - y1) / 72 * userUnit;
	  return {
	    width: changeOrientation ? height : width,
	    height: changeOrientation ? width : height
	  };
	}
	function backtrackBeforeAllVisibleElements(index, views, top) {
	  if (index < 2) {
	    return index;
	  }
	  let elt = views[index].div;
	  let pageTop = elt.offsetTop + elt.clientTop;
	  if (pageTop >= top) {
	    elt = views[index - 1].div;
	    pageTop = elt.offsetTop + elt.clientTop;
	  }
	  for (let i = index - 2; i >= 0; --i) {
	    elt = views[i].div;
	    if (elt.offsetTop + elt.clientTop + elt.clientHeight <= pageTop) {
	      break;
	    }
	    index = i;
	  }
	  return index;
	}
	function getVisibleElements({
	  scrollEl,
	  views,
	  sortByVisibility = false,
	  horizontal = false,
	  rtl = false
	}) {
	  const top = scrollEl.scrollTop,
	    bottom = top + scrollEl.clientHeight;
	  const left = scrollEl.scrollLeft,
	    right = left + scrollEl.clientWidth;
	  function isElementBottomAfterViewTop(view) {
	    const element = view.div;
	    const elementBottom = element.offsetTop + element.clientTop + element.clientHeight;
	    return elementBottom > top;
	  }
	  function isElementNextAfterViewHorizontally(view) {
	    const element = view.div;
	    const elementLeft = element.offsetLeft + element.clientLeft;
	    const elementRight = elementLeft + element.clientWidth;
	    return rtl ? elementLeft < right : elementRight > left;
	  }
	  const visible = [],
	    ids = new Set(),
	    numViews = views.length;
	  let firstVisibleElementInd = binarySearchFirstItem(views, horizontal ? isElementNextAfterViewHorizontally : isElementBottomAfterViewTop);
	  if (firstVisibleElementInd > 0 && firstVisibleElementInd < numViews && !horizontal) {
	    firstVisibleElementInd = backtrackBeforeAllVisibleElements(firstVisibleElementInd, views, top);
	  }
	  let lastEdge = horizontal ? right : -1;
	  for (let i = firstVisibleElementInd; i < numViews; i++) {
	    const view = views[i],
	      element = view.div;
	    const currentWidth = element.offsetLeft + element.clientLeft;
	    const currentHeight = element.offsetTop + element.clientTop;
	    const viewWidth = element.clientWidth,
	      viewHeight = element.clientHeight;
	    const viewRight = currentWidth + viewWidth;
	    const viewBottom = currentHeight + viewHeight;
	    if (lastEdge === -1) {
	      if (viewBottom >= bottom) {
	        lastEdge = viewBottom;
	      }
	    } else if ((horizontal ? currentWidth : currentHeight) > lastEdge) {
	      break;
	    }
	    if (viewBottom <= top || currentHeight >= bottom || viewRight <= left || currentWidth >= right) {
	      continue;
	    }
	    const hiddenHeight = Math.max(0, top - currentHeight) + Math.max(0, viewBottom - bottom);
	    const hiddenWidth = Math.max(0, left - currentWidth) + Math.max(0, viewRight - right);
	    const fractionHeight = (viewHeight - hiddenHeight) / viewHeight,
	      fractionWidth = (viewWidth - hiddenWidth) / viewWidth;
	    const percent = fractionHeight * fractionWidth * 100 | 0;
	    visible.push({
	      id: view.id,
	      x: currentWidth,
	      y: currentHeight,
	      view,
	      percent,
	      widthPercent: fractionWidth * 100 | 0
	    });
	    ids.add(view.id);
	  }
	  const first = visible[0],
	    last = visible.at(-1);
	  if (sortByVisibility) {
	    visible.sort(function (a, b) {
	      const pc = a.percent - b.percent;
	      if (Math.abs(pc) > 0.001) {
	        return -pc;
	      }
	      return a.id - b.id;
	    });
	  }
	  return {
	    first,
	    last,
	    views: visible,
	    ids
	  };
	}
	function normalizeWheelEventDirection(evt) {
	  let delta = Math.hypot(evt.deltaX, evt.deltaY);
	  const angle = Math.atan2(evt.deltaY, evt.deltaX);
	  if (-0.25 * Math.PI < angle && angle < 0.75 * Math.PI) {
	    delta = -delta;
	  }
	  return delta;
	}
	function normalizeWheelEventDelta(evt) {
	  const deltaMode = evt.deltaMode;
	  let delta = normalizeWheelEventDirection(evt);
	  const MOUSE_PIXELS_PER_LINE = 30;
	  const MOUSE_LINES_PER_PAGE = 30;
	  if (deltaMode === WheelEvent.DOM_DELTA_PIXEL) {
	    delta /= MOUSE_PIXELS_PER_LINE * MOUSE_LINES_PER_PAGE;
	  } else if (deltaMode === WheelEvent.DOM_DELTA_LINE) {
	    delta /= MOUSE_LINES_PER_PAGE;
	  }
	  return delta;
	}
	function isValidRotation(angle) {
	  return Number.isInteger(angle) && angle % 90 === 0;
	}
	function isValidScrollMode(mode) {
	  return Number.isInteger(mode) && Object.values(ScrollMode).includes(mode) && mode !== ScrollMode.UNKNOWN;
	}
	function isValidSpreadMode(mode) {
	  return Number.isInteger(mode) && Object.values(SpreadMode).includes(mode) && mode !== SpreadMode.UNKNOWN;
	}
	function isPortraitOrientation(size) {
	  return size.width <= size.height;
	}
	const animationStarted = new Promise(function (resolve) {
	  window.requestAnimationFrame(resolve);
	});
	const docStyle = document.documentElement.style;
	function clamp(v, min, max) {
	  return Math.min(Math.max(v, min), max);
	}
	var _classList = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("classList");
	var _disableAutoFetchTimeout = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("disableAutoFetchTimeout");
	var _percent = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("percent");
	var _style = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("style");
	var _visible = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("visible");
	class ProgressBar {
	  constructor(bar) {
	    Object.defineProperty(this, _classList, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _disableAutoFetchTimeout, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _percent, {
	      writable: true,
	      value: 0
	    });
	    Object.defineProperty(this, _style, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _visible, {
	      writable: true,
	      value: true
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _classList)[_classList] = bar.classList;
	    babelHelpers.classPrivateFieldLooseBase(this, _style)[_style] = bar.style;
	  }
	  get percent() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _percent)[_percent];
	  }
	  set percent(val) {
	    babelHelpers.classPrivateFieldLooseBase(this, _percent)[_percent] = clamp(val, 0, 100);
	    if (isNaN(val)) {
	      babelHelpers.classPrivateFieldLooseBase(this, _classList)[_classList].add("indeterminate");
	      return;
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _classList)[_classList].remove("indeterminate");
	    babelHelpers.classPrivateFieldLooseBase(this, _style)[_style].setProperty("--progressBar-percent", `${babelHelpers.classPrivateFieldLooseBase(this, _percent)[_percent]}%`);
	  }
	  setWidth(viewer) {
	    if (!viewer) {
	      return;
	    }
	    const container = viewer.parentNode;
	    const scrollbarWidth = container.offsetWidth - viewer.offsetWidth;
	    if (scrollbarWidth > 0) {
	      babelHelpers.classPrivateFieldLooseBase(this, _style)[_style].setProperty("--progressBar-end-offset", `${scrollbarWidth}px`);
	    }
	  }
	  setDisableAutoFetch(delay = 5000) {
	    if (babelHelpers.classPrivateFieldLooseBase(this, _percent)[_percent] === 100 || isNaN(babelHelpers.classPrivateFieldLooseBase(this, _percent)[_percent])) {
	      return;
	    }
	    if (babelHelpers.classPrivateFieldLooseBase(this, _disableAutoFetchTimeout)[_disableAutoFetchTimeout]) {
	      clearTimeout(babelHelpers.classPrivateFieldLooseBase(this, _disableAutoFetchTimeout)[_disableAutoFetchTimeout]);
	    }
	    this.show();
	    babelHelpers.classPrivateFieldLooseBase(this, _disableAutoFetchTimeout)[_disableAutoFetchTimeout] = setTimeout(() => {
	      babelHelpers.classPrivateFieldLooseBase(this, _disableAutoFetchTimeout)[_disableAutoFetchTimeout] = null;
	      this.hide();
	    }, delay);
	  }
	  hide() {
	    if (!babelHelpers.classPrivateFieldLooseBase(this, _visible)[_visible]) {
	      return;
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _visible)[_visible] = false;
	    babelHelpers.classPrivateFieldLooseBase(this, _classList)[_classList].add("hidden");
	  }
	  show() {
	    if (babelHelpers.classPrivateFieldLooseBase(this, _visible)[_visible]) {
	      return;
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _visible)[_visible] = true;
	    babelHelpers.classPrivateFieldLooseBase(this, _classList)[_classList].remove("hidden");
	  }
	}
	function getActiveOrFocusedElement() {
	  let curRoot = document;
	  let curActiveOrFocused = curRoot.activeElement || curRoot.querySelector(":focus");
	  while ((_curActiveOrFocused = curActiveOrFocused) != null && _curActiveOrFocused.shadowRoot) {
	    var _curActiveOrFocused;
	    curRoot = curActiveOrFocused.shadowRoot;
	    curActiveOrFocused = curRoot.activeElement || curRoot.querySelector(":focus");
	  }
	  return curActiveOrFocused;
	}
	function apiPageLayoutToViewerModes(layout) {
	  let scrollMode = ScrollMode.VERTICAL,
	    spreadMode = SpreadMode.NONE;
	  switch (layout) {
	    case "SinglePage":
	      scrollMode = ScrollMode.PAGE;
	      break;
	    case "OneColumn":
	      break;
	    case "TwoPageLeft":
	      scrollMode = ScrollMode.PAGE;
	    case "TwoColumnLeft":
	      spreadMode = SpreadMode.ODD;
	      break;
	    case "TwoPageRight":
	      scrollMode = ScrollMode.PAGE;
	    case "TwoColumnRight":
	      spreadMode = SpreadMode.EVEN;
	      break;
	  }
	  return {
	    scrollMode,
	    spreadMode
	  };
	}
	function apiPageModeToSidebarView(mode) {
	  switch (mode) {
	    case "UseNone":
	      return SidebarView.NONE;
	    case "UseThumbs":
	      return SidebarView.THUMBS;
	    case "UseOutlines":
	      return SidebarView.OUTLINE;
	    case "UseAttachments":
	      return SidebarView.ATTACHMENTS;
	    case "UseOC":
	      return SidebarView.LAYERS;
	  }
	  return SidebarView.NONE;
	}
	function toggleCheckedBtn(button, toggle, view = null) {
	  button.classList.toggle("toggled", toggle);
	  button.setAttribute("aria-checked", toggle);
	  view == null ? void 0 : view.classList.toggle("hidden", !toggle);
	}
	function toggleExpandedBtn(button, toggle, view = null) {
	  button.classList.toggle("toggled", toggle);
	  button.setAttribute("aria-expanded", toggle);
	  view == null ? void 0 : view.classList.toggle("hidden", !toggle);
	}
	const calcRound = function () {
	  const e = document.createElement("div");
	  e.style.width = "round(down, calc(1.6666666666666665 * 792px), 1px)";
	  return e.style.width === "calc(1320px)" ? Math.fround : x => x;
	}();
	{
	  var compatParams = new Map();
	  const userAgent = navigator.userAgent || "";
	  const platform = navigator.platform || "";
	  const maxTouchPoints = navigator.maxTouchPoints || 1;
	  const isAndroid = /Android/.test(userAgent);
	  const isIOS = /\b(iPad|iPhone|iPod)(?=;)/.test(userAgent) || platform === "MacIntel" && maxTouchPoints > 1;
	  (function () {
	    if (isIOS || isAndroid) {
	      compatParams.set("maxCanvasPixels", 5242880);
	    }
	  })();
	  (function () {
	    if (isAndroid) {
	      compatParams.set("useSystemFonts", false);
	    }
	  })();
	}
	const OptionKind = {
	  BROWSER: 0x01,
	  VIEWER: 0x02,
	  API: 0x04,
	  WORKER: 0x08,
	  EVENT_DISPATCH: 0x10,
	  PREFERENCE: 0x80
	};
	const Type = {
	  BOOLEAN: 0x01,
	  NUMBER: 0x02,
	  OBJECT: 0x04,
	  STRING: 0x08,
	  UNDEFINED: 0x10
	};
	const defaultOptions = {
	  allowedGlobalEvents: {
	    value: null,
	    kind: OptionKind.BROWSER
	  },
	  canvasMaxAreaInBytes: {
	    value: -1,
	    kind: OptionKind.BROWSER + OptionKind.API
	  },
	  isInAutomation: {
	    value: false,
	    kind: OptionKind.BROWSER
	  },
	  localeProperties: {
	    value: {
	      lang: navigator.language || "en-US"
	    },
	    kind: OptionKind.BROWSER
	  },
	  nimbusDataStr: {
	    value: "",
	    kind: OptionKind.BROWSER
	  },
	  supportsCaretBrowsingMode: {
	    value: false,
	    kind: OptionKind.BROWSER
	  },
	  supportsDocumentFonts: {
	    value: true,
	    kind: OptionKind.BROWSER
	  },
	  supportsIntegratedFind: {
	    value: false,
	    kind: OptionKind.BROWSER
	  },
	  supportsMouseWheelZoomCtrlKey: {
	    value: true,
	    kind: OptionKind.BROWSER
	  },
	  supportsMouseWheelZoomMetaKey: {
	    value: true,
	    kind: OptionKind.BROWSER
	  },
	  supportsPinchToZoom: {
	    value: true,
	    kind: OptionKind.BROWSER
	  },
	  toolbarDensity: {
	    value: 0,
	    kind: OptionKind.BROWSER + OptionKind.EVENT_DISPATCH
	  },
	  altTextLearnMoreUrl: {
	    value: "",
	    kind: OptionKind.VIEWER + OptionKind.PREFERENCE
	  },
	  annotationEditorMode: {
	    value: 0,
	    kind: OptionKind.VIEWER + OptionKind.PREFERENCE
	  },
	  annotationMode: {
	    value: 2,
	    kind: OptionKind.VIEWER + OptionKind.PREFERENCE
	  },
	  cursorToolOnLoad: {
	    value: 0,
	    kind: OptionKind.VIEWER + OptionKind.PREFERENCE
	  },
	  debuggerSrc: {
	    value: "./debugger.mjs",
	    kind: OptionKind.VIEWER
	  },
	  defaultZoomDelay: {
	    value: 400,
	    kind: OptionKind.VIEWER + OptionKind.PREFERENCE
	  },
	  defaultZoomValue: {
	    value: "",
	    kind: OptionKind.VIEWER + OptionKind.PREFERENCE
	  },
	  disableHistory: {
	    value: false,
	    kind: OptionKind.VIEWER
	  },
	  disablePageLabels: {
	    value: false,
	    kind: OptionKind.VIEWER + OptionKind.PREFERENCE
	  },
	  enableAltText: {
	    value: false,
	    kind: OptionKind.VIEWER + OptionKind.PREFERENCE
	  },
	  enableAltTextModelDownload: {
	    value: true,
	    kind: OptionKind.VIEWER + OptionKind.PREFERENCE + OptionKind.EVENT_DISPATCH
	  },
	  enableGuessAltText: {
	    value: true,
	    kind: OptionKind.VIEWER + OptionKind.PREFERENCE + OptionKind.EVENT_DISPATCH
	  },
	  enableHighlightFloatingButton: {
	    value: false,
	    kind: OptionKind.VIEWER + OptionKind.PREFERENCE
	  },
	  enableNewAltTextWhenAddingImage: {
	    value: true,
	    kind: OptionKind.VIEWER + OptionKind.PREFERENCE
	  },
	  enablePermissions: {
	    value: false,
	    kind: OptionKind.VIEWER + OptionKind.PREFERENCE
	  },
	  enablePrintAutoRotate: {
	    value: true,
	    kind: OptionKind.VIEWER + OptionKind.PREFERENCE
	  },
	  enableScripting: {
	    value: true,
	    kind: OptionKind.VIEWER + OptionKind.PREFERENCE
	  },
	  enableUpdatedAddImage: {
	    value: false,
	    kind: OptionKind.VIEWER + OptionKind.PREFERENCE
	  },
	  externalLinkRel: {
	    value: "noopener noreferrer nofollow",
	    kind: OptionKind.VIEWER
	  },
	  externalLinkTarget: {
	    value: 0,
	    kind: OptionKind.VIEWER + OptionKind.PREFERENCE
	  },
	  highlightEditorColors: {
	    value: "yellow=#FFFF98,green=#53FFBC,blue=#80EBFF,pink=#FFCBE6,red=#FF4F5F",
	    kind: OptionKind.VIEWER + OptionKind.PREFERENCE
	  },
	  historyUpdateUrl: {
	    value: false,
	    kind: OptionKind.VIEWER + OptionKind.PREFERENCE
	  },
	  ignoreDestinationZoom: {
	    value: false,
	    kind: OptionKind.VIEWER + OptionKind.PREFERENCE
	  },
	  imageResourcesPath: {
	    value: "./images/",
	    kind: OptionKind.VIEWER
	  },
	  maxCanvasPixels: {
	    value: 2 ** 25,
	    kind: OptionKind.VIEWER
	  },
	  forcePageColors: {
	    value: false,
	    kind: OptionKind.VIEWER + OptionKind.PREFERENCE
	  },
	  pageColorsBackground: {
	    value: "Canvas",
	    kind: OptionKind.VIEWER + OptionKind.PREFERENCE
	  },
	  pageColorsForeground: {
	    value: "CanvasText",
	    kind: OptionKind.VIEWER + OptionKind.PREFERENCE
	  },
	  pdfBugEnabled: {
	    value: false,
	    kind: OptionKind.VIEWER + OptionKind.PREFERENCE
	  },
	  printResolution: {
	    value: 150,
	    kind: OptionKind.VIEWER
	  },
	  sidebarViewOnLoad: {
	    value: -1,
	    kind: OptionKind.VIEWER + OptionKind.PREFERENCE
	  },
	  scrollModeOnLoad: {
	    value: -1,
	    kind: OptionKind.VIEWER + OptionKind.PREFERENCE
	  },
	  spreadModeOnLoad: {
	    value: -1,
	    kind: OptionKind.VIEWER + OptionKind.PREFERENCE
	  },
	  textLayerMode: {
	    value: 1,
	    kind: OptionKind.VIEWER + OptionKind.PREFERENCE
	  },
	  viewOnLoad: {
	    value: 0,
	    kind: OptionKind.VIEWER + OptionKind.PREFERENCE
	  },
	  cMapPacked: {
	    value: true,
	    kind: OptionKind.API
	  },
	  cMapUrl: {
	    value: "../web/cmaps/",
	    kind: OptionKind.API
	  },
	  disableAutoFetch: {
	    value: false,
	    kind: OptionKind.API + OptionKind.PREFERENCE
	  },
	  disableFontFace: {
	    value: false,
	    kind: OptionKind.API + OptionKind.PREFERENCE
	  },
	  disableRange: {
	    value: false,
	    kind: OptionKind.API + OptionKind.PREFERENCE
	  },
	  disableStream: {
	    value: false,
	    kind: OptionKind.API + OptionKind.PREFERENCE
	  },
	  docBaseUrl: {
	    value: "",
	    kind: OptionKind.API
	  },
	  enableHWA: {
	    value: true,
	    kind: OptionKind.API + OptionKind.VIEWER + OptionKind.PREFERENCE
	  },
	  enableXfa: {
	    value: true,
	    kind: OptionKind.API + OptionKind.PREFERENCE
	  },
	  fontExtraProperties: {
	    value: false,
	    kind: OptionKind.API
	  },
	  isEvalSupported: {
	    value: true,
	    kind: OptionKind.API
	  },
	  isOffscreenCanvasSupported: {
	    value: true,
	    kind: OptionKind.API
	  },
	  maxImageSize: {
	    value: -1,
	    kind: OptionKind.API
	  },
	  pdfBug: {
	    value: false,
	    kind: OptionKind.API
	  },
	  standardFontDataUrl: {
	    value: "../web/standard_fonts/",
	    kind: OptionKind.API
	  },
	  useSystemFonts: {
	    value: undefined,
	    kind: OptionKind.API,
	    type: Type.BOOLEAN + Type.UNDEFINED
	  },
	  verbosity: {
	    value: 1,
	    kind: OptionKind.API
	  },
	  workerPort: {
	    value: null,
	    kind: OptionKind.WORKER
	  },
	  workerSrc: {
	    value: "../build/pdf.worker.mjs",
	    kind: OptionKind.WORKER
	  }
	};
	{
	  defaultOptions.defaultUrl = {
	    value: "compressed.tracemonkey-pldi-09.pdf",
	    kind: OptionKind.VIEWER
	  };
	  defaultOptions.sandboxBundleSrc = {
	    value: "../build/pdf.sandbox.mjs",
	    kind: OptionKind.VIEWER
	  };
	  defaultOptions.viewerCssTheme = {
	    value: 0,
	    kind: OptionKind.VIEWER + OptionKind.PREFERENCE
	  };
	  defaultOptions.enableFakeMLManager = {
	    value: true,
	    kind: OptionKind.VIEWER
	  };
	}
	{
	  defaultOptions.disablePreferences = {
	    value: false,
	    kind: OptionKind.VIEWER
	  };
	}
	var _opts = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("opts");
	class AppOptions {
	  static get(name) {
	    return babelHelpers.classPrivateFieldLooseBase(this, _opts)[_opts].get(name);
	  }
	  static getAll(kind = null, defaultOnly = false) {
	    const options = Object.create(null);
	    for (const name in defaultOptions) {
	      const defaultOpt = defaultOptions[name];
	      if (kind && !(kind & defaultOpt.kind)) {
	        continue;
	      }
	      options[name] = !defaultOnly ? babelHelpers.classPrivateFieldLooseBase(this, _opts)[_opts].get(name) : defaultOpt.value;
	    }
	    return options;
	  }
	  static set(name, value) {
	    this.setAll({
	      [name]: value
	    });
	  }
	  static setAll(options, prefs = false) {
	    this._hasInvokedSet || (this._hasInvokedSet = true);
	    let events;
	    for (const name in options) {
	      const defaultOpt = defaultOptions[name],
	        userOpt = options[name];
	      if (!defaultOpt || !(typeof userOpt === typeof defaultOpt.value || Type[(typeof userOpt).toUpperCase()] & defaultOpt.type)) {
	        continue;
	      }
	      const {
	        kind
	      } = defaultOpt;
	      if (prefs && !(kind & OptionKind.BROWSER || kind & OptionKind.PREFERENCE)) {
	        continue;
	      }
	      if (this.eventBus && kind & OptionKind.EVENT_DISPATCH) {
	        (events || (events = new Map())).set(name, userOpt);
	      }
	      babelHelpers.classPrivateFieldLooseBase(this, _opts)[_opts].set(name, userOpt);
	    }
	    if (events) {
	      for (const [name, value] of events) {
	        this.eventBus.dispatch(name.toLowerCase(), {
	          source: this,
	          value
	        });
	      }
	    }
	  }
	}
	Object.defineProperty(AppOptions, _opts, {
	  writable: true,
	  value: new Map()
	});
	(() => {
	  for (const name in defaultOptions) {
	    babelHelpers.classPrivateFieldLooseBase(AppOptions, _opts)[_opts].set(name, defaultOptions[name].value);
	  }
	  for (const [name, value] of compatParams) {
	    babelHelpers.classPrivateFieldLooseBase(AppOptions, _opts)[_opts].set(name, value);
	  }
	  AppOptions._hasInvokedSet = false;
	  AppOptions._checkDisablePreferences = () => {
	    if (AppOptions.get("disablePreferences")) {
	      return true;
	    }
	    if (AppOptions._hasInvokedSet) {
	      console.warn("The Preferences may override manually set AppOptions; " + 'please use the "disablePreferences"-option to prevent that.');
	    }
	    return false;
	  };
	})();

	const DEFAULT_LINK_REL = "noopener noreferrer nofollow";
	const LinkTarget = {
	  NONE: 0,
	  SELF: 1,
	  BLANK: 2,
	  PARENT: 3,
	  TOP: 4
	};
	var _isValidExplicitDest = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isValidExplicitDest");
	class PDFLinkService {
	  constructor({
	    eventBus,
	    externalLinkTarget = null,
	    externalLinkRel = null,
	    ignoreDestinationZoom = false
	  } = {}) {
	    this.externalLinkEnabled = true;
	    this.eventBus = eventBus;
	    this.externalLinkTarget = externalLinkTarget;
	    this.externalLinkRel = externalLinkRel;
	    this._ignoreDestinationZoom = ignoreDestinationZoom;
	    this.baseUrl = null;
	    this.pdfDocument = null;
	    this.pdfViewer = null;
	    this.pdfHistory = null;
	  }
	  setDocument(pdfDocument, baseUrl = null) {
	    this.baseUrl = baseUrl;
	    this.pdfDocument = pdfDocument;
	  }
	  setViewer(pdfViewer) {
	    this.pdfViewer = pdfViewer;
	  }
	  setHistory(pdfHistory) {
	    this.pdfHistory = pdfHistory;
	  }
	  get pagesCount() {
	    return this.pdfDocument ? this.pdfDocument.numPages : 0;
	  }
	  get page() {
	    return this.pdfDocument ? this.pdfViewer.currentPageNumber : 1;
	  }
	  set page(value) {
	    if (this.pdfDocument) {
	      this.pdfViewer.currentPageNumber = value;
	    }
	  }
	  get rotation() {
	    return this.pdfDocument ? this.pdfViewer.pagesRotation : 0;
	  }
	  set rotation(value) {
	    if (this.pdfDocument) {
	      this.pdfViewer.pagesRotation = value;
	    }
	  }
	  get isInPresentationMode() {
	    return this.pdfDocument ? this.pdfViewer.isInPresentationMode : false;
	  }
	  async goToDestination(dest) {
	    if (!this.pdfDocument) {
	      return;
	    }
	    let namedDest, explicitDest, pageNumber;
	    if (typeof dest === "string") {
	      namedDest = dest;
	      explicitDest = await this.pdfDocument.getDestination(dest);
	    } else {
	      namedDest = null;
	      explicitDest = await dest;
	    }
	    if (!Array.isArray(explicitDest)) {
	      console.error(`goToDestination: "${explicitDest}" is not a valid destination array, for dest="${dest}".`);
	      return;
	    }
	    const [destRef] = explicitDest;
	    if (destRef && typeof destRef === "object") {
	      pageNumber = this.pdfDocument.cachedPageNumber(destRef);
	      if (!pageNumber) {
	        try {
	          pageNumber = (await this.pdfDocument.getPageIndex(destRef)) + 1;
	        } catch {
	          console.error(`goToDestination: "${destRef}" is not a valid page reference, for dest="${dest}".`);
	          return;
	        }
	      }
	    } else if (Number.isInteger(destRef)) {
	      pageNumber = destRef + 1;
	    }
	    if (!pageNumber || pageNumber < 1 || pageNumber > this.pagesCount) {
	      console.error(`goToDestination: "${pageNumber}" is not a valid page number, for dest="${dest}".`);
	      return;
	    }
	    if (this.pdfHistory) {
	      this.pdfHistory.pushCurrentPosition();
	      this.pdfHistory.push({
	        namedDest,
	        explicitDest,
	        pageNumber
	      });
	    }
	    this.pdfViewer.scrollPageIntoView({
	      pageNumber,
	      destArray: explicitDest,
	      ignoreDestinationZoom: this._ignoreDestinationZoom
	    });
	  }
	  goToPage(val) {
	    if (!this.pdfDocument) {
	      return;
	    }
	    const pageNumber = typeof val === "string" && this.pdfViewer.pageLabelToPageNumber(val) || val | 0;
	    if (!(Number.isInteger(pageNumber) && pageNumber > 0 && pageNumber <= this.pagesCount)) {
	      console.error(`PDFLinkService.goToPage: "${val}" is not a valid page.`);
	      return;
	    }
	    if (this.pdfHistory) {
	      this.pdfHistory.pushCurrentPosition();
	      this.pdfHistory.pushPage(pageNumber);
	    }
	    this.pdfViewer.scrollPageIntoView({
	      pageNumber
	    });
	  }
	  addLinkAttributes(link, url, newWindow = false) {
	    if (!url || typeof url !== "string") {
	      throw new Error('A valid "url" parameter must provided.');
	    }
	    const target = newWindow ? LinkTarget.BLANK : this.externalLinkTarget,
	      rel = this.externalLinkRel;
	    if (this.externalLinkEnabled) {
	      link.href = link.title = url;
	    } else {
	      link.href = "";
	      link.title = `Disabled: ${url}`;
	      link.onclick = () => false;
	    }
	    let targetStr = "";
	    switch (target) {
	      case LinkTarget.NONE:
	        break;
	      case LinkTarget.SELF:
	        targetStr = "_self";
	        break;
	      case LinkTarget.BLANK:
	        targetStr = "_blank";
	        break;
	      case LinkTarget.PARENT:
	        targetStr = "_parent";
	        break;
	      case LinkTarget.TOP:
	        targetStr = "_top";
	        break;
	    }
	    link.target = targetStr;
	    link.rel = typeof rel === "string" ? rel : DEFAULT_LINK_REL;
	  }
	  getDestinationHash(dest) {
	    if (typeof dest === "string") {
	      if (dest.length > 0) {
	        return this.getAnchorUrl("#" + escape(dest));
	      }
	    } else if (Array.isArray(dest)) {
	      const str = JSON.stringify(dest);
	      if (str.length > 0) {
	        return this.getAnchorUrl("#" + escape(str));
	      }
	    }
	    return this.getAnchorUrl("");
	  }
	  getAnchorUrl(anchor) {
	    return this.baseUrl ? this.baseUrl + anchor : anchor;
	  }
	  setHash(hash) {
	    if (!this.pdfDocument) {
	      return;
	    }
	    let pageNumber, dest;
	    if (hash.includes("=")) {
	      const params = parseQueryString(hash);
	      if (params.has("search")) {
	        const query = params.get("search").replaceAll('"', ""),
	          phrase = params.get("phrase") === "true";
	        this.eventBus.dispatch("findfromurlhash", {
	          source: this,
	          query: phrase ? query : query.match(/\S+/g)
	        });
	      }
	      if (params.has("page")) {
	        pageNumber = params.get("page") | 0 || 1;
	      }
	      if (params.has("zoom")) {
	        const zoomArgs = params.get("zoom").split(",");
	        const zoomArg = zoomArgs[0];
	        const zoomArgNumber = parseFloat(zoomArg);
	        if (!zoomArg.includes("Fit")) {
	          dest = [null, {
	            name: "XYZ"
	          }, zoomArgs.length > 1 ? zoomArgs[1] | 0 : null, zoomArgs.length > 2 ? zoomArgs[2] | 0 : null, zoomArgNumber ? zoomArgNumber / 100 : zoomArg];
	        } else if (zoomArg === "Fit" || zoomArg === "FitB") {
	          dest = [null, {
	            name: zoomArg
	          }];
	        } else if (zoomArg === "FitH" || zoomArg === "FitBH" || zoomArg === "FitV" || zoomArg === "FitBV") {
	          dest = [null, {
	            name: zoomArg
	          }, zoomArgs.length > 1 ? zoomArgs[1] | 0 : null];
	        } else if (zoomArg === "FitR") {
	          if (zoomArgs.length !== 5) {
	            console.error('PDFLinkService.setHash: Not enough parameters for "FitR".');
	          } else {
	            dest = [null, {
	              name: zoomArg
	            }, zoomArgs[1] | 0, zoomArgs[2] | 0, zoomArgs[3] | 0, zoomArgs[4] | 0];
	          }
	        } else {
	          console.error(`PDFLinkService.setHash: "${zoomArg}" is not a valid zoom value.`);
	        }
	      }
	      if (dest) {
	        this.pdfViewer.scrollPageIntoView({
	          pageNumber: pageNumber || this.page,
	          destArray: dest,
	          allowNegativeOffset: true
	        });
	      } else if (pageNumber) {
	        this.page = pageNumber;
	      }
	      if (params.has("pagemode")) {
	        this.eventBus.dispatch("pagemode", {
	          source: this,
	          mode: params.get("pagemode")
	        });
	      }
	      if (params.has("nameddest")) {
	        this.goToDestination(params.get("nameddest"));
	      }
	      return;
	    }
	    dest = unescape(hash);
	    try {
	      dest = JSON.parse(dest);
	      if (!Array.isArray(dest)) {
	        dest = dest.toString();
	      }
	    } catch {}
	    if (typeof dest === "string" || babelHelpers.classPrivateFieldLooseBase(PDFLinkService, _isValidExplicitDest)[_isValidExplicitDest](dest)) {
	      this.goToDestination(dest);
	      return;
	    }
	    console.error(`PDFLinkService.setHash: "${unescape(hash)}" is not a valid destination.`);
	  }
	  executeNamedAction(action) {
	    var _this$pdfHistory, _this$pdfHistory2;
	    if (!this.pdfDocument) {
	      return;
	    }
	    switch (action) {
	      case "GoBack":
	        (_this$pdfHistory = this.pdfHistory) == null ? void 0 : _this$pdfHistory.back();
	        break;
	      case "GoForward":
	        (_this$pdfHistory2 = this.pdfHistory) == null ? void 0 : _this$pdfHistory2.forward();
	        break;
	      case "NextPage":
	        this.pdfViewer.nextPage();
	        break;
	      case "PrevPage":
	        this.pdfViewer.previousPage();
	        break;
	      case "LastPage":
	        this.page = this.pagesCount;
	        break;
	      case "FirstPage":
	        this.page = 1;
	        break;
	      default:
	        break;
	    }
	    this.eventBus.dispatch("namedaction", {
	      source: this,
	      action
	    });
	  }
	  async executeSetOCGState(action) {
	    if (!this.pdfDocument) {
	      return;
	    }
	    const pdfDocument = this.pdfDocument,
	      optionalContentConfig = await this.pdfViewer.optionalContentConfigPromise;
	    if (pdfDocument !== this.pdfDocument) {
	      return;
	    }
	    optionalContentConfig.setOCGState(action);
	    this.pdfViewer.optionalContentConfigPromise = Promise.resolve(optionalContentConfig);
	  }
	}
	function _isValidExplicitDest2(dest) {
	  if (!Array.isArray(dest) || dest.length < 2) {
	    return false;
	  }
	  const [page, zoom, ...args] = dest;
	  if (!(typeof page === "object" && Number.isInteger(page == null ? void 0 : page.num) && Number.isInteger(page == null ? void 0 : page.gen)) && !Number.isInteger(page)) {
	    return false;
	  }
	  if (!(typeof zoom === "object" && typeof (zoom == null ? void 0 : zoom.name) === "string")) {
	    return false;
	  }
	  const argsLen = args.length;
	  let allowNull = true;
	  switch (zoom.name) {
	    case "XYZ":
	      if (argsLen < 2 || argsLen > 3) {
	        return false;
	      }
	      break;
	    case "Fit":
	    case "FitB":
	      return argsLen === 0;
	    case "FitH":
	    case "FitBH":
	    case "FitV":
	    case "FitBV":
	      if (argsLen > 1) {
	        return false;
	      }
	      break;
	    case "FitR":
	      if (argsLen !== 4) {
	        return false;
	      }
	      allowNull = false;
	      break;
	    default:
	      return false;
	  }
	  for (const arg of args) {
	    if (!(typeof arg === "number" || allowNull && arg === null)) {
	      return false;
	    }
	  }
	  return true;
	}
	Object.defineProperty(PDFLinkService, _isValidExplicitDest, {
	  value: _isValidExplicitDest2
	});
	class SimpleLinkService extends PDFLinkService {
	  setDocument(pdfDocument, baseUrl = null) {}
	}
	const {
	  AbortException,
	  AnnotationEditorLayer,
	  AnnotationEditorParamsType,
	  AnnotationEditorType,
	  AnnotationEditorUIManager,
	  AnnotationLayer,
	  AnnotationMode,
	  build,
	  ColorPicker,
	  createValidAbsoluteUrl,
	  DOMSVGFactory,
	  DrawLayer,
	  FeatureTest,
	  fetchData,
	  getDocument,
	  getFilenameFromUrl,
	  getPdfFilenameFromUrl: pdfjs_getPdfFilenameFromUrl,
	  getXfaPageViewport,
	  GlobalWorkerOptions,
	  ImageKind,
	  InvalidPDFException,
	  isDataScheme,
	  isPdfFile,
	  MissingPDFException,
	  noContextMenu,
	  normalizeUnicode,
	  OPS,
	  OutputScale,
	  PasswordResponses,
	  PDFDataRangeTransport,
	  PDFDateString,
	  PDFWorker,
	  PermissionFlag,
	  PixelsPerInch,
	  RenderingCancelledException,
	  setLayerDimensions,
	  shadow,
	  TextLayer,
	  UnexpectedResponseException,
	  Util,
	  VerbosityLevel,
	  version,
	  XfaLayer
	} = globalThis.pdfjsLib;
	const WaitOnType = {
	  EVENT: "event",
	  TIMEOUT: "timeout"
	};
	async function waitOnEventOrTimeout({
	  target,
	  name,
	  delay = 0
	}) {
	  if (typeof target !== "object" || !(name && typeof name === "string") || !(Number.isInteger(delay) && delay >= 0)) {
	    throw new Error("waitOnEventOrTimeout - invalid parameters.");
	  }
	  const {
	    promise,
	    resolve
	  } = Promise.withResolvers();
	  const ac = new AbortController();
	  function handler(type) {
	    ac.abort();
	    clearTimeout(timeout);
	    resolve(type);
	  }
	  const evtMethod = target instanceof EventBus ? "_on" : "addEventListener";
	  target[evtMethod](name, handler.bind(null, WaitOnType.EVENT), {
	    signal: ac.signal
	  });
	  const timeout = setTimeout(handler.bind(null, WaitOnType.TIMEOUT), delay);
	  return promise;
	}
	var _listeners = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("listeners");
	class EventBus {
	  constructor() {
	    Object.defineProperty(this, _listeners, {
	      writable: true,
	      value: Object.create(null)
	    });
	  }
	  on(eventName, listener, options = null) {
	    this._on(eventName, listener, {
	      external: true,
	      once: options == null ? void 0 : options.once,
	      signal: options == null ? void 0 : options.signal
	    });
	  }
	  off(eventName, listener, options = null) {
	    this._off(eventName, listener);
	  }
	  dispatch(eventName, data) {
	    const eventListeners = babelHelpers.classPrivateFieldLooseBase(this, _listeners)[_listeners][eventName];
	    if (!eventListeners || eventListeners.length === 0) {
	      return;
	    }
	    let externalListeners;
	    for (const {
	      listener,
	      external,
	      once
	    } of eventListeners.slice(0)) {
	      if (once) {
	        this._off(eventName, listener);
	      }
	      if (external) {
	        (externalListeners || (externalListeners = [])).push(listener);
	        continue;
	      }
	      listener(data);
	    }
	    if (externalListeners) {
	      for (const listener of externalListeners) {
	        listener(data);
	      }
	      externalListeners = null;
	    }
	  }
	  _on(eventName, listener, options = null) {
	    var _babelHelpers$classPr;
	    let rmAbort = null;
	    if ((options == null ? void 0 : options.signal) instanceof AbortSignal) {
	      const {
	        signal
	      } = options;
	      if (signal.aborted) {
	        console.error("Cannot use an `aborted` signal.");
	        return;
	      }
	      const onAbort = () => this._off(eventName, listener);
	      rmAbort = () => signal.removeEventListener("abort", onAbort);
	      signal.addEventListener("abort", onAbort);
	    }
	    const eventListeners = (_babelHelpers$classPr = babelHelpers.classPrivateFieldLooseBase(this, _listeners)[_listeners])[eventName] || (_babelHelpers$classPr[eventName] = []);
	    eventListeners.push({
	      listener,
	      external: (options == null ? void 0 : options.external) === true,
	      once: (options == null ? void 0 : options.once) === true,
	      rmAbort
	    });
	  }
	  _off(eventName, listener, options = null) {
	    const eventListeners = babelHelpers.classPrivateFieldLooseBase(this, _listeners)[_listeners][eventName];
	    if (!eventListeners) {
	      return;
	    }
	    for (let i = 0, ii = eventListeners.length; i < ii; i++) {
	      const evt = eventListeners[i];
	      if (evt.listener === listener) {
	        evt.rmAbort == null ? void 0 : evt.rmAbort();
	        eventListeners.splice(i, 1);
	        return;
	      }
	    }
	  }
	}
	var _externalServices = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("externalServices");
	var _globalEventNames = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("globalEventNames");
	var _isInAutomation = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isInAutomation");
	class BaseExternalServices {
	  updateFindControlState(data) {}
	  updateFindMatchesCount(data) {}
	  initPassiveLoading() {}
	  reportTelemetry(data) {}
	  async createL10n() {
	    throw new Error("Not implemented: createL10n");
	  }
	  createScripting() {
	    throw new Error("Not implemented: createScripting");
	  }
	  updateEditorStates(data) {
	    throw new Error("Not implemented: updateEditorStates");
	  }
	  dispatchGlobalEvent(_event) {}
	}
	var _defaults = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("defaults");
	var _initializedPromise = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("initializedPromise");
	class BasePreferences {
	  constructor() {
	    Object.defineProperty(this, _defaults, {
	      writable: true,
	      value: Object.freeze({
	        altTextLearnMoreUrl: "",
	        annotationEditorMode: 0,
	        annotationMode: 2,
	        cursorToolOnLoad: 0,
	        defaultZoomDelay: 400,
	        defaultZoomValue: "",
	        disablePageLabels: false,
	        enableAltText: false,
	        enableAltTextModelDownload: true,
	        enableGuessAltText: true,
	        enableHighlightFloatingButton: false,
	        enableNewAltTextWhenAddingImage: true,
	        enablePermissions: false,
	        enablePrintAutoRotate: true,
	        enableScripting: true,
	        enableUpdatedAddImage: false,
	        externalLinkTarget: 0,
	        highlightEditorColors: "yellow=#FFFF98,green=#53FFBC,blue=#80EBFF,pink=#FFCBE6,red=#FF4F5F",
	        historyUpdateUrl: false,
	        ignoreDestinationZoom: false,
	        forcePageColors: false,
	        pageColorsBackground: "Canvas",
	        pageColorsForeground: "CanvasText",
	        pdfBugEnabled: false,
	        sidebarViewOnLoad: -1,
	        scrollModeOnLoad: -1,
	        spreadModeOnLoad: -1,
	        textLayerMode: 1,
	        viewOnLoad: 0,
	        disableAutoFetch: false,
	        disableFontFace: false,
	        disableRange: false,
	        disableStream: false,
	        enableHWA: true,
	        enableXfa: true,
	        viewerCssTheme: 0
	      })
	    });
	    Object.defineProperty(this, _initializedPromise, {
	      writable: true,
	      value: null
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _initializedPromise)[_initializedPromise] = this._readFromStorage(babelHelpers.classPrivateFieldLooseBase(this, _defaults)[_defaults]).then(({
	      browserPrefs,
	      prefs
	    }) => {
	      if (AppOptions._checkDisablePreferences()) {
	        return;
	      }
	      AppOptions.setAll({
	        ...browserPrefs,
	        ...prefs
	      }, true);
	    });
	  }
	  async _writeToStorage(prefObj) {
	    throw new Error("Not implemented: _writeToStorage");
	  }
	  async _readFromStorage(prefObj) {
	    throw new Error("Not implemented: _readFromStorage");
	  }
	  async reset() {
	    await babelHelpers.classPrivateFieldLooseBase(this, _initializedPromise)[_initializedPromise];
	    AppOptions.setAll(babelHelpers.classPrivateFieldLooseBase(this, _defaults)[_defaults], true);
	    await this._writeToStorage(babelHelpers.classPrivateFieldLooseBase(this, _defaults)[_defaults]);
	  }
	  async set(name, value) {
	    await babelHelpers.classPrivateFieldLooseBase(this, _initializedPromise)[_initializedPromise];
	    AppOptions.setAll({
	      [name]: value
	    }, true);
	    await this._writeToStorage(AppOptions.getAll(OptionKind.PREFERENCE));
	  }
	  async get(name) {
	    await babelHelpers.classPrivateFieldLooseBase(this, _initializedPromise)[_initializedPromise];
	    return AppOptions.get(name);
	  }
	  get initializedPromise() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _initializedPromise)[_initializedPromise];
	  }
	}
	class FluentType {
	  constructor(value) {
	    this.value = value;
	  }
	  valueOf() {
	    return this.value;
	  }
	}
	class FluentNone extends FluentType {
	  constructor(value = "???") {
	    super(value);
	  }
	  toString(scope) {
	    return `{${this.value}}`;
	  }
	}
	class FluentNumber extends FluentType {
	  constructor(value, opts = {}) {
	    super(value);
	    this.opts = opts;
	  }
	  toString(scope) {
	    try {
	      const nf = scope.memoizeIntlObject(Intl.NumberFormat, this.opts);
	      return nf.format(this.value);
	    } catch (err) {
	      scope.reportError(err);
	      return this.value.toString(10);
	    }
	  }
	}
	class FluentDateTime extends FluentType {
	  constructor(value, opts = {}) {
	    super(value);
	    this.opts = opts;
	  }
	  toString(scope) {
	    try {
	      const dtf = scope.memoizeIntlObject(Intl.DateTimeFormat, this.opts);
	      return dtf.format(this.value);
	    } catch (err) {
	      scope.reportError(err);
	      return new Date(this.value).toISOString();
	    }
	  }
	}

	const MAX_PLACEABLES = 100;
	const FSI = "\u2068";
	const PDI = "\u2069";
	function match(scope, selector, key) {
	  if (key === selector) {
	    return true;
	  }
	  if (key instanceof FluentNumber && selector instanceof FluentNumber && key.value === selector.value) {
	    return true;
	  }
	  if (selector instanceof FluentNumber && typeof key === "string") {
	    let category = scope.memoizeIntlObject(Intl.PluralRules, selector.opts).select(selector.value);
	    if (key === category) {
	      return true;
	    }
	  }
	  return false;
	}
	function getDefault(scope, variants, star) {
	  if (variants[star]) {
	    return resolvePattern(scope, variants[star].value);
	  }
	  scope.reportError(new RangeError("No default"));
	  return new FluentNone();
	}
	function getArguments(scope, args) {
	  const positional = [];
	  const named = Object.create(null);
	  for (const arg of args) {
	    if (arg.type === "narg") {
	      named[arg.name] = resolveExpression(scope, arg.value);
	    } else {
	      positional.push(resolveExpression(scope, arg));
	    }
	  }
	  return {
	    positional,
	    named
	  };
	}
	function resolveExpression(scope, expr) {
	  switch (expr.type) {
	    case "str":
	      return expr.value;
	    case "num":
	      return new FluentNumber(expr.value, {
	        minimumFractionDigits: expr.precision
	      });
	    case "var":
	      return resolveVariableReference(scope, expr);
	    case "mesg":
	      return resolveMessageReference(scope, expr);
	    case "term":
	      return resolveTermReference(scope, expr);
	    case "func":
	      return resolveFunctionReference(scope, expr);
	    case "select":
	      return resolveSelectExpression(scope, expr);
	    default:
	      return new FluentNone();
	  }
	}
	function resolveVariableReference(scope, {
	  name
	}) {
	  let arg;
	  if (scope.params) {
	    if (Object.prototype.hasOwnProperty.call(scope.params, name)) {
	      arg = scope.params[name];
	    } else {
	      return new FluentNone(`$${name}`);
	    }
	  } else if (scope.args && Object.prototype.hasOwnProperty.call(scope.args, name)) {
	    arg = scope.args[name];
	  } else {
	    scope.reportError(new ReferenceError(`Unknown variable: $${name}`));
	    return new FluentNone(`$${name}`);
	  }
	  if (arg instanceof FluentType) {
	    return arg;
	  }
	  switch (typeof arg) {
	    case "string":
	      return arg;
	    case "number":
	      return new FluentNumber(arg);
	    case "object":
	      if (arg instanceof Date) {
	        return new FluentDateTime(arg.getTime());
	      }
	    default:
	      scope.reportError(new TypeError(`Variable type not supported: $${name}, ${typeof arg}`));
	      return new FluentNone(`$${name}`);
	  }
	}
	function resolveMessageReference(scope, {
	  name,
	  attr
	}) {
	  const message = scope.bundle._messages.get(name);
	  if (!message) {
	    scope.reportError(new ReferenceError(`Unknown message: ${name}`));
	    return new FluentNone(name);
	  }
	  if (attr) {
	    const attribute = message.attributes[attr];
	    if (attribute) {
	      return resolvePattern(scope, attribute);
	    }
	    scope.reportError(new ReferenceError(`Unknown attribute: ${attr}`));
	    return new FluentNone(`${name}.${attr}`);
	  }
	  if (message.value) {
	    return resolvePattern(scope, message.value);
	  }
	  scope.reportError(new ReferenceError(`No value: ${name}`));
	  return new FluentNone(name);
	}
	function resolveTermReference(scope, {
	  name,
	  attr,
	  args
	}) {
	  const id = `-${name}`;
	  const term = scope.bundle._terms.get(id);
	  if (!term) {
	    scope.reportError(new ReferenceError(`Unknown term: ${id}`));
	    return new FluentNone(id);
	  }
	  if (attr) {
	    const attribute = term.attributes[attr];
	    if (attribute) {
	      scope.params = getArguments(scope, args).named;
	      const resolved = resolvePattern(scope, attribute);
	      scope.params = null;
	      return resolved;
	    }
	    scope.reportError(new ReferenceError(`Unknown attribute: ${attr}`));
	    return new FluentNone(`${id}.${attr}`);
	  }
	  scope.params = getArguments(scope, args).named;
	  const resolved = resolvePattern(scope, term.value);
	  scope.params = null;
	  return resolved;
	}
	function resolveFunctionReference(scope, {
	  name,
	  args
	}) {
	  let func = scope.bundle._functions[name];
	  if (!func) {
	    scope.reportError(new ReferenceError(`Unknown function: ${name}()`));
	    return new FluentNone(`${name}()`);
	  }
	  if (typeof func !== "function") {
	    scope.reportError(new TypeError(`Function ${name}() is not callable`));
	    return new FluentNone(`${name}()`);
	  }
	  try {
	    let resolved = getArguments(scope, args);
	    return func(resolved.positional, resolved.named);
	  } catch (err) {
	    scope.reportError(err);
	    return new FluentNone(`${name}()`);
	  }
	}
	function resolveSelectExpression(scope, {
	  selector,
	  variants,
	  star
	}) {
	  let sel = resolveExpression(scope, selector);
	  if (sel instanceof FluentNone) {
	    return getDefault(scope, variants, star);
	  }
	  for (const variant of variants) {
	    const key = resolveExpression(scope, variant.key);
	    if (match(scope, sel, key)) {
	      return resolvePattern(scope, variant.value);
	    }
	  }
	  return getDefault(scope, variants, star);
	}
	function resolveComplexPattern(scope, ptn) {
	  if (scope.dirty.has(ptn)) {
	    scope.reportError(new RangeError("Cyclic reference"));
	    return new FluentNone();
	  }
	  scope.dirty.add(ptn);
	  const result = [];
	  const useIsolating = scope.bundle._useIsolating && ptn.length > 1;
	  for (const elem of ptn) {
	    if (typeof elem === "string") {
	      result.push(scope.bundle._transform(elem));
	      continue;
	    }
	    scope.placeables++;
	    if (scope.placeables > MAX_PLACEABLES) {
	      scope.dirty.delete(ptn);
	      throw new RangeError(`Too many placeables expanded: ${scope.placeables}, ` + `max allowed is ${MAX_PLACEABLES}`);
	    }
	    if (useIsolating) {
	      result.push(FSI);
	    }
	    result.push(resolveExpression(scope, elem).toString(scope));
	    if (useIsolating) {
	      result.push(PDI);
	    }
	  }
	  scope.dirty.delete(ptn);
	  return result.join("");
	}
	function resolvePattern(scope, value) {
	  if (typeof value === "string") {
	    return scope.bundle._transform(value);
	  }
	  return resolveComplexPattern(scope, value);
	}
	class Scope {
	  constructor(bundle, errors, args) {
	    this.dirty = new WeakSet();
	    this.params = null;
	    this.placeables = 0;
	    this.bundle = bundle;
	    this.errors = errors;
	    this.args = args;
	  }
	  reportError(error) {
	    if (!this.errors || !(error instanceof Error)) {
	      throw error;
	    }
	    this.errors.push(error);
	  }
	  memoizeIntlObject(ctor, opts) {
	    let cache = this.bundle._intls.get(ctor);
	    if (!cache) {
	      cache = {};
	      this.bundle._intls.set(ctor, cache);
	    }
	    let id = JSON.stringify(opts);
	    if (!cache[id]) {
	      cache[id] = new ctor(this.bundle.locales, opts);
	    }
	    return cache[id];
	  }
	}

	function values(opts, allowed) {
	  const unwrapped = Object.create(null);
	  for (const [name, opt] of Object.entries(opts)) {
	    if (allowed.includes(name)) {
	      unwrapped[name] = opt.valueOf();
	    }
	  }
	  return unwrapped;
	}
	const NUMBER_ALLOWED = ["unitDisplay", "currencyDisplay", "useGrouping", "minimumIntegerDigits", "minimumFractionDigits", "maximumFractionDigits", "minimumSignificantDigits", "maximumSignificantDigits"];
	function NUMBER(args, opts) {
	  let arg = args[0];
	  if (arg instanceof FluentNone) {
	    return new FluentNone(`NUMBER(${arg.valueOf()})`);
	  }
	  if (arg instanceof FluentNumber) {
	    return new FluentNumber(arg.valueOf(), {
	      ...arg.opts,
	      ...values(opts, NUMBER_ALLOWED)
	    });
	  }
	  if (arg instanceof FluentDateTime) {
	    return new FluentNumber(arg.valueOf(), {
	      ...values(opts, NUMBER_ALLOWED)
	    });
	  }
	  throw new TypeError("Invalid argument to NUMBER");
	}
	const DATETIME_ALLOWED = ["dateStyle", "timeStyle", "fractionalSecondDigits", "dayPeriod", "hour12", "weekday", "era", "year", "month", "day", "hour", "minute", "second", "timeZoneName"];
	function DATETIME(args, opts) {
	  let arg = args[0];
	  if (arg instanceof FluentNone) {
	    return new FluentNone(`DATETIME(${arg.valueOf()})`);
	  }
	  if (arg instanceof FluentDateTime) {
	    return new FluentDateTime(arg.valueOf(), {
	      ...arg.opts,
	      ...values(opts, DATETIME_ALLOWED)
	    });
	  }
	  if (arg instanceof FluentNumber) {
	    return new FluentDateTime(arg.valueOf(), {
	      ...values(opts, DATETIME_ALLOWED)
	    });
	  }
	  throw new TypeError("Invalid argument to DATETIME");
	}
	const cache = new Map();
	function getMemoizerForLocale(locales) {
	  const stringLocale = Array.isArray(locales) ? locales.join(" ") : locales;
	  let memoizer = cache.get(stringLocale);
	  if (memoizer === undefined) {
	    memoizer = new Map();
	    cache.set(stringLocale, memoizer);
	  }
	  return memoizer;
	}

	class FluentBundle {
	  constructor(locales, {
	    functions,
	    useIsolating = true,
	    transform = v => v
	  } = {}) {
	    this._terms = new Map();
	    this._messages = new Map();
	    this.locales = Array.isArray(locales) ? locales : [locales];
	    this._functions = {
	      NUMBER: NUMBER,
	      DATETIME: DATETIME,
	      ...functions
	    };
	    this._useIsolating = useIsolating;
	    this._transform = transform;
	    this._intls = getMemoizerForLocale(locales);
	  }
	  hasMessage(id) {
	    return this._messages.has(id);
	  }
	  getMessage(id) {
	    return this._messages.get(id);
	  }
	  addResource(res, {
	    allowOverrides = false
	  } = {}) {
	    const errors = [];
	    for (let i = 0; i < res.body.length; i++) {
	      let entry = res.body[i];
	      if (entry.id.startsWith("-")) {
	        if (allowOverrides === false && this._terms.has(entry.id)) {
	          errors.push(new Error(`Attempt to override an existing term: "${entry.id}"`));
	          continue;
	        }
	        this._terms.set(entry.id, entry);
	      } else {
	        if (allowOverrides === false && this._messages.has(entry.id)) {
	          errors.push(new Error(`Attempt to override an existing message: "${entry.id}"`));
	          continue;
	        }
	        this._messages.set(entry.id, entry);
	      }
	    }
	    return errors;
	  }
	  formatPattern(pattern, args = null, errors = null) {
	    if (typeof pattern === "string") {
	      return this._transform(pattern);
	    }
	    let scope = new Scope(this, errors, args);
	    try {
	      let value = resolveComplexPattern(scope, pattern);
	      return value.toString(scope);
	    } catch (err) {
	      if (scope.errors && err instanceof Error) {
	        scope.errors.push(err);
	        return new FluentNone().toString(scope);
	      }
	      throw err;
	    }
	  }
	}
	const RE_MESSAGE_START = /^(-?[a-zA-Z][\w-]*) *= */gm;
	const RE_ATTRIBUTE_START = /\.([a-zA-Z][\w-]*) *= */y;
	const RE_VARIANT_START = /\*?\[/y;
	const RE_NUMBER_LITERAL = /(-?[0-9]+(?:\.([0-9]+))?)/y;
	const RE_IDENTIFIER = /([a-zA-Z][\w-]*)/y;
	const RE_REFERENCE = /([$-])?([a-zA-Z][\w-]*)(?:\.([a-zA-Z][\w-]*))?/y;
	const RE_FUNCTION_NAME = /^[A-Z][A-Z0-9_-]*$/;
	const RE_TEXT_RUN = /([^{}\n\r]+)/y;
	const RE_STRING_RUN = /([^\\"\n\r]*)/y;
	const RE_STRING_ESCAPE = /\\([\\"])/y;
	const RE_UNICODE_ESCAPE = /\\u([a-fA-F0-9]{4})|\\U([a-fA-F0-9]{6})/y;
	const RE_LEADING_NEWLINES = /^\n+/;
	const RE_TRAILING_SPACES = / +$/;
	const RE_BLANK_LINES = / *\r?\n/g;
	const RE_INDENT = /( *)$/;
	const TOKEN_BRACE_OPEN = /{\s*/y;
	const TOKEN_BRACE_CLOSE = /\s*}/y;
	const TOKEN_BRACKET_OPEN = /\[\s*/y;
	const TOKEN_BRACKET_CLOSE = /\s*] */y;
	const TOKEN_PAREN_OPEN = /\s*\(\s*/y;
	const TOKEN_ARROW = /\s*->\s*/y;
	const TOKEN_COLON = /\s*:\s*/y;
	const TOKEN_COMMA = /\s*,?\s*/y;
	const TOKEN_BLANK = /\s+/y;
	class FluentResource {
	  constructor(source) {
	    this.body = [];
	    RE_MESSAGE_START.lastIndex = 0;
	    let cursor = 0;
	    while (true) {
	      let next = RE_MESSAGE_START.exec(source);
	      if (next === null) {
	        break;
	      }
	      cursor = RE_MESSAGE_START.lastIndex;
	      try {
	        this.body.push(parseMessage(next[1]));
	      } catch (err) {
	        if (err instanceof SyntaxError) {
	          continue;
	        }
	        throw err;
	      }
	    }
	    function test(re) {
	      re.lastIndex = cursor;
	      return re.test(source);
	    }
	    function consumeChar(char, errorClass) {
	      if (source[cursor] === char) {
	        cursor++;
	        return true;
	      }
	      if (errorClass) {
	        throw new errorClass(`Expected ${char}`);
	      }
	      return false;
	    }
	    function consumeToken(re, errorClass) {
	      if (test(re)) {
	        cursor = re.lastIndex;
	        return true;
	      }
	      if (errorClass) {
	        throw new errorClass(`Expected ${re.toString()}`);
	      }
	      return false;
	    }
	    function match(re) {
	      re.lastIndex = cursor;
	      let result = re.exec(source);
	      if (result === null) {
	        throw new SyntaxError(`Expected ${re.toString()}`);
	      }
	      cursor = re.lastIndex;
	      return result;
	    }
	    function match1(re) {
	      return match(re)[1];
	    }
	    function parseMessage(id) {
	      let value = parsePattern();
	      let attributes = parseAttributes();
	      if (value === null && Object.keys(attributes).length === 0) {
	        throw new SyntaxError("Expected message value or attributes");
	      }
	      return {
	        id,
	        value,
	        attributes
	      };
	    }
	    function parseAttributes() {
	      let attrs = Object.create(null);
	      while (test(RE_ATTRIBUTE_START)) {
	        let name = match1(RE_ATTRIBUTE_START);
	        let value = parsePattern();
	        if (value === null) {
	          throw new SyntaxError("Expected attribute value");
	        }
	        attrs[name] = value;
	      }
	      return attrs;
	    }
	    function parsePattern() {
	      let first;
	      if (test(RE_TEXT_RUN)) {
	        first = match1(RE_TEXT_RUN);
	      }
	      if (source[cursor] === "{" || source[cursor] === "}") {
	        return parsePatternElements(first ? [first] : [], Infinity);
	      }
	      let indent = parseIndent();
	      if (indent) {
	        if (first) {
	          return parsePatternElements([first, indent], indent.length);
	        }
	        indent.value = trim(indent.value, RE_LEADING_NEWLINES);
	        return parsePatternElements([indent], indent.length);
	      }
	      if (first) {
	        return trim(first, RE_TRAILING_SPACES);
	      }
	      return null;
	    }
	    function parsePatternElements(elements = [], commonIndent) {
	      while (true) {
	        if (test(RE_TEXT_RUN)) {
	          elements.push(match1(RE_TEXT_RUN));
	          continue;
	        }
	        if (source[cursor] === "{") {
	          elements.push(parsePlaceable());
	          continue;
	        }
	        if (source[cursor] === "}") {
	          throw new SyntaxError("Unbalanced closing brace");
	        }
	        let indent = parseIndent();
	        if (indent) {
	          elements.push(indent);
	          commonIndent = Math.min(commonIndent, indent.length);
	          continue;
	        }
	        break;
	      }
	      let lastIndex = elements.length - 1;
	      let lastElement = elements[lastIndex];
	      if (typeof lastElement === "string") {
	        elements[lastIndex] = trim(lastElement, RE_TRAILING_SPACES);
	      }
	      let baked = [];
	      for (let element of elements) {
	        if (element instanceof Indent) {
	          element = element.value.slice(0, element.value.length - commonIndent);
	        }
	        if (element) {
	          baked.push(element);
	        }
	      }
	      return baked;
	    }
	    function parsePlaceable() {
	      consumeToken(TOKEN_BRACE_OPEN, SyntaxError);
	      let selector = parseInlineExpression();
	      if (consumeToken(TOKEN_BRACE_CLOSE)) {
	        return selector;
	      }
	      if (consumeToken(TOKEN_ARROW)) {
	        let variants = parseVariants();
	        consumeToken(TOKEN_BRACE_CLOSE, SyntaxError);
	        return {
	          type: "select",
	          selector,
	          ...variants
	        };
	      }
	      throw new SyntaxError("Unclosed placeable");
	    }
	    function parseInlineExpression() {
	      if (source[cursor] === "{") {
	        return parsePlaceable();
	      }
	      if (test(RE_REFERENCE)) {
	        let [, sigil, name, attr = null] = match(RE_REFERENCE);
	        if (sigil === "$") {
	          return {
	            type: "var",
	            name
	          };
	        }
	        if (consumeToken(TOKEN_PAREN_OPEN)) {
	          let args = parseArguments();
	          if (sigil === "-") {
	            return {
	              type: "term",
	              name,
	              attr,
	              args
	            };
	          }
	          if (RE_FUNCTION_NAME.test(name)) {
	            return {
	              type: "func",
	              name,
	              args
	            };
	          }
	          throw new SyntaxError("Function names must be all upper-case");
	        }
	        if (sigil === "-") {
	          return {
	            type: "term",
	            name,
	            attr,
	            args: []
	          };
	        }
	        return {
	          type: "mesg",
	          name,
	          attr
	        };
	      }
	      return parseLiteral();
	    }
	    function parseArguments() {
	      let args = [];
	      while (true) {
	        switch (source[cursor]) {
	          case ")":
	            cursor++;
	            return args;
	          case undefined:
	            throw new SyntaxError("Unclosed argument list");
	        }
	        args.push(parseArgument());
	        consumeToken(TOKEN_COMMA);
	      }
	    }
	    function parseArgument() {
	      let expr = parseInlineExpression();
	      if (expr.type !== "mesg") {
	        return expr;
	      }
	      if (consumeToken(TOKEN_COLON)) {
	        return {
	          type: "narg",
	          name: expr.name,
	          value: parseLiteral()
	        };
	      }
	      return expr;
	    }
	    function parseVariants() {
	      let variants = [];
	      let count = 0;
	      let star;
	      while (test(RE_VARIANT_START)) {
	        if (consumeChar("*")) {
	          star = count;
	        }
	        let key = parseVariantKey();
	        let value = parsePattern();
	        if (value === null) {
	          throw new SyntaxError("Expected variant value");
	        }
	        variants[count++] = {
	          key,
	          value
	        };
	      }
	      if (count === 0) {
	        return null;
	      }
	      if (star === undefined) {
	        throw new SyntaxError("Expected default variant");
	      }
	      return {
	        variants,
	        star
	      };
	    }
	    function parseVariantKey() {
	      consumeToken(TOKEN_BRACKET_OPEN, SyntaxError);
	      let key;
	      if (test(RE_NUMBER_LITERAL)) {
	        key = parseNumberLiteral();
	      } else {
	        key = {
	          type: "str",
	          value: match1(RE_IDENTIFIER)
	        };
	      }
	      consumeToken(TOKEN_BRACKET_CLOSE, SyntaxError);
	      return key;
	    }
	    function parseLiteral() {
	      if (test(RE_NUMBER_LITERAL)) {
	        return parseNumberLiteral();
	      }
	      if (source[cursor] === '"') {
	        return parseStringLiteral();
	      }
	      throw new SyntaxError("Invalid expression");
	    }
	    function parseNumberLiteral() {
	      let [, value, fraction = ""] = match(RE_NUMBER_LITERAL);
	      let precision = fraction.length;
	      return {
	        type: "num",
	        value: parseFloat(value),
	        precision
	      };
	    }
	    function parseStringLiteral() {
	      consumeChar('"', SyntaxError);
	      let value = "";
	      while (true) {
	        value += match1(RE_STRING_RUN);
	        if (source[cursor] === "\\") {
	          value += parseEscapeSequence();
	          continue;
	        }
	        if (consumeChar('"')) {
	          return {
	            type: "str",
	            value
	          };
	        }
	        throw new SyntaxError("Unclosed string literal");
	      }
	    }
	    function parseEscapeSequence() {
	      if (test(RE_STRING_ESCAPE)) {
	        return match1(RE_STRING_ESCAPE);
	      }
	      if (test(RE_UNICODE_ESCAPE)) {
	        let [, codepoint4, codepoint6] = match(RE_UNICODE_ESCAPE);
	        let codepoint = parseInt(codepoint4 || codepoint6, 16);
	        return codepoint <= 0xd7ff || 0xe000 <= codepoint ? String.fromCodePoint(codepoint) : "�";
	      }
	      throw new SyntaxError("Unknown escape sequence");
	    }
	    function parseIndent() {
	      let start = cursor;
	      consumeToken(TOKEN_BLANK);
	      switch (source[cursor]) {
	        case ".":
	        case "[":
	        case "*":
	        case "}":
	        case undefined:
	          return false;
	        case "{":
	          return makeIndent(source.slice(start, cursor));
	      }
	      if (source[cursor - 1] === " ") {
	        return makeIndent(source.slice(start, cursor));
	      }
	      return false;
	    }
	    function trim(text, re) {
	      return text.replace(re, "");
	    }
	    function makeIndent(blank) {
	      let value = blank.replace(RE_BLANK_LINES, "\n");
	      let length = RE_INDENT.exec(blank)[1].length;
	      return new Indent(value, length);
	    }
	  }
	}
	class Indent {
	  constructor(value, length) {
	    this.value = value;
	    this.length = length;
	  }
	}
	const reOverlay = /<|&#?\w+;/;
	const TEXT_LEVEL_ELEMENTS = {
	  "http://www.w3.org/1999/xhtml": ["em", "strong", "small", "s", "cite", "q", "dfn", "abbr", "data", "time", "code", "var", "samp", "kbd", "sub", "sup", "i", "b", "u", "mark", "bdi", "bdo", "span", "br", "wbr"]
	};
	const LOCALIZABLE_ATTRIBUTES = {
	  "http://www.w3.org/1999/xhtml": {
	    global: ["title", "aria-label", "aria-valuetext"],
	    a: ["download"],
	    area: ["download", "alt"],
	    input: ["alt", "placeholder"],
	    menuitem: ["label"],
	    menu: ["label"],
	    optgroup: ["label"],
	    option: ["label"],
	    track: ["label"],
	    img: ["alt"],
	    textarea: ["placeholder"],
	    th: ["abbr"]
	  },
	  "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul": {
	    global: ["accesskey", "aria-label", "aria-valuetext", "label", "title", "tooltiptext"],
	    description: ["value"],
	    key: ["key", "keycode"],
	    label: ["value"],
	    textbox: ["placeholder", "value"]
	  }
	};
	function translateElement(element, translation) {
	  const {
	    value
	  } = translation;
	  if (typeof value === "string") {
	    if (element.localName === "title" && element.namespaceURI === "http://www.w3.org/1999/xhtml") {
	      element.textContent = value;
	    } else if (!reOverlay.test(value)) {
	      element.textContent = value;
	    } else {
	      const templateElement = element.ownerDocument.createElementNS("http://www.w3.org/1999/xhtml", "template");
	      templateElement.innerHTML = value;
	      overlayChildNodes(templateElement.content, element);
	    }
	  }
	  overlayAttributes(translation, element);
	}
	function overlayChildNodes(fromFragment, toElement) {
	  for (const childNode of fromFragment.childNodes) {
	    if (childNode.nodeType === childNode.TEXT_NODE) {
	      continue;
	    }
	    if (childNode.hasAttribute("data-l10n-name")) {
	      const sanitized = getNodeForNamedElement(toElement, childNode);
	      fromFragment.replaceChild(sanitized, childNode);
	      continue;
	    }
	    if (isElementAllowed(childNode)) {
	      const sanitized = createSanitizedElement(childNode);
	      fromFragment.replaceChild(sanitized, childNode);
	      continue;
	    }
	    console.warn(`An element of forbidden type "${childNode.localName}" was found in ` + "the translation. Only safe text-level elements and elements with " + "data-l10n-name are allowed.");
	    fromFragment.replaceChild(createTextNodeFromTextContent(childNode), childNode);
	  }
	  toElement.textContent = "";
	  toElement.appendChild(fromFragment);
	}
	function hasAttribute(attributes, name) {
	  if (!attributes) {
	    return false;
	  }
	  for (let attr of attributes) {
	    if (attr.name === name) {
	      return true;
	    }
	  }
	  return false;
	}
	function overlayAttributes(fromElement, toElement) {
	  const explicitlyAllowed = toElement.hasAttribute("data-l10n-attrs") ? toElement.getAttribute("data-l10n-attrs").split(",").map(i => i.trim()) : null;
	  for (const attr of Array.from(toElement.attributes)) {
	    if (isAttrNameLocalizable(attr.name, toElement, explicitlyAllowed) && !hasAttribute(fromElement.attributes, attr.name)) {
	      toElement.removeAttribute(attr.name);
	    }
	  }
	  if (!fromElement.attributes) {
	    return;
	  }
	  for (const attr of Array.from(fromElement.attributes)) {
	    if (isAttrNameLocalizable(attr.name, toElement, explicitlyAllowed) && toElement.getAttribute(attr.name) !== attr.value) {
	      toElement.setAttribute(attr.name, attr.value);
	    }
	  }
	}
	function getNodeForNamedElement(sourceElement, translatedChild) {
	  const childName = translatedChild.getAttribute("data-l10n-name");
	  const sourceChild = sourceElement.querySelector(`[data-l10n-name="${childName}"]`);
	  if (!sourceChild) {
	    console.warn(`An element named "${childName}" wasn't found in the source.`);
	    return createTextNodeFromTextContent(translatedChild);
	  }
	  if (sourceChild.localName !== translatedChild.localName) {
	    console.warn(`An element named "${childName}" was found in the translation ` + `but its type ${translatedChild.localName} didn't match the ` + `element found in the source (${sourceChild.localName}).`);
	    return createTextNodeFromTextContent(translatedChild);
	  }
	  sourceElement.removeChild(sourceChild);
	  const clone = sourceChild.cloneNode(false);
	  return shallowPopulateUsing(translatedChild, clone);
	}
	function createSanitizedElement(element) {
	  const clone = element.ownerDocument.createElement(element.localName);
	  return shallowPopulateUsing(element, clone);
	}
	function createTextNodeFromTextContent(element) {
	  return element.ownerDocument.createTextNode(element.textContent);
	}
	function isElementAllowed(element) {
	  const allowed = TEXT_LEVEL_ELEMENTS[element.namespaceURI];
	  return allowed && allowed.includes(element.localName);
	}
	function isAttrNameLocalizable(name, element, explicitlyAllowed = null) {
	  if (explicitlyAllowed && explicitlyAllowed.includes(name)) {
	    return true;
	  }
	  const allowed = LOCALIZABLE_ATTRIBUTES[element.namespaceURI];
	  if (!allowed) {
	    return false;
	  }
	  const attrName = name.toLowerCase();
	  const elemName = element.localName;
	  if (allowed.global.includes(attrName)) {
	    return true;
	  }
	  if (!allowed[elemName]) {
	    return false;
	  }
	  if (allowed[elemName].includes(attrName)) {
	    return true;
	  }
	  if (element.namespaceURI === "http://www.w3.org/1999/xhtml" && elemName === "input" && attrName === "value") {
	    const type = element.type.toLowerCase();
	    if (type === "submit" || type === "button" || type === "reset") {
	      return true;
	    }
	  }
	  return false;
	}
	function shallowPopulateUsing(fromElement, toElement) {
	  toElement.textContent = fromElement.textContent;
	  overlayAttributes(fromElement, toElement);
	  return toElement;
	}
	class CachedIterable extends Array {
	  static from(iterable) {
	    if (iterable instanceof this) {
	      return iterable;
	    }
	    return new this(iterable);
	  }
	}

	class CachedAsyncIterable extends CachedIterable {
	  constructor(iterable) {
	    super();
	    if (Symbol.asyncIterator in Object(iterable)) {
	      this.iterator = iterable[Symbol.asyncIterator]();
	    } else if (Symbol.iterator in Object(iterable)) {
	      this.iterator = iterable[Symbol.iterator]();
	    } else {
	      throw new TypeError("Argument must implement the iteration protocol.");
	    }
	  }
	  [Symbol.asyncIterator]() {
	    const cached = this;
	    let cur = 0;
	    return {
	      async next() {
	        if (cached.length <= cur) {
	          cached.push(cached.iterator.next());
	        }
	        return cached[cur++];
	      }
	    };
	  }
	  async touchNext(count = 1) {
	    let idx = 0;
	    while (idx++ < count) {
	      const last = this[this.length - 1];
	      if (last && (await last).done) {
	        break;
	      }
	      this.push(this.iterator.next());
	    }
	    return this[this.length - 1];
	  }
	}

	class Localization {
	  constructor(resourceIds = [], generateBundles) {
	    this.resourceIds = resourceIds;
	    this.generateBundles = generateBundles;
	    this.onChange(true);
	  }
	  addResourceIds(resourceIds, eager = false) {
	    this.resourceIds.push(...resourceIds);
	    this.onChange(eager);
	    return this.resourceIds.length;
	  }
	  removeResourceIds(resourceIds) {
	    this.resourceIds = this.resourceIds.filter(r => !resourceIds.includes(r));
	    this.onChange();
	    return this.resourceIds.length;
	  }
	  async formatWithFallback(keys, method) {
	    const translations = [];
	    let hasAtLeastOneBundle = false;
	    for await (const bundle of this.bundles) {
	      hasAtLeastOneBundle = true;
	      const missingIds = keysFromBundle(method, bundle, keys, translations);
	      if (missingIds.size === 0) {
	        break;
	      }
	      if (typeof console !== "undefined") {
	        const locale = bundle.locales[0];
	        const ids = Array.from(missingIds).join(", ");
	        console.warn(`[fluent] Missing translations in ${locale}: ${ids}`);
	      }
	    }
	    if (!hasAtLeastOneBundle && typeof console !== "undefined") {
	      console.warn(`[fluent] Request for keys failed because no resource bundles got generated.
  keys: ${JSON.stringify(keys)}.
  resourceIds: ${JSON.stringify(this.resourceIds)}.`);
	    }
	    return translations;
	  }
	  formatMessages(keys) {
	    return this.formatWithFallback(keys, messageFromBundle);
	  }
	  formatValues(keys) {
	    return this.formatWithFallback(keys, valueFromBundle);
	  }
	  async formatValue(id, args) {
	    const [val] = await this.formatValues([{
	      id,
	      args
	    }]);
	    return val;
	  }
	  handleEvent() {
	    this.onChange();
	  }
	  onChange(eager = false) {
	    this.bundles = CachedAsyncIterable.from(this.generateBundles(this.resourceIds));
	    if (eager) {
	      this.bundles.touchNext(2);
	    }
	  }
	}
	function valueFromBundle(bundle, errors, message, args) {
	  if (message.value) {
	    return bundle.formatPattern(message.value, args, errors);
	  }
	  return null;
	}
	function messageFromBundle(bundle, errors, message, args) {
	  const formatted = {
	    value: null,
	    attributes: null
	  };
	  if (message.value) {
	    formatted.value = bundle.formatPattern(message.value, args, errors);
	  }
	  let attrNames = Object.keys(message.attributes);
	  if (attrNames.length > 0) {
	    formatted.attributes = new Array(attrNames.length);
	    for (let [i, name] of attrNames.entries()) {
	      let value = bundle.formatPattern(message.attributes[name], args, errors);
	      formatted.attributes[i] = {
	        name,
	        value
	      };
	    }
	  }
	  return formatted;
	}
	function keysFromBundle(method, bundle, keys, translations) {
	  const messageErrors = [];
	  const missingIds = new Set();
	  keys.forEach(({
	    id,
	    args
	  }, i) => {
	    if (translations[i] !== undefined) {
	      return;
	    }
	    let message = bundle.getMessage(id);
	    if (message) {
	      messageErrors.length = 0;
	      translations[i] = method(bundle, messageErrors, message, args);
	      if (messageErrors.length > 0 && typeof console !== "undefined") {
	        const locale = bundle.locales[0];
	        const errors = messageErrors.join(", ");
	        console.warn(`[fluent][resolver] errors in ${locale}/${id}: ${errors}.`);
	      }
	    } else {
	      missingIds.add(id);
	    }
	  });
	  return missingIds;
	}

	const L10NID_ATTR_NAME = "data-l10n-id";
	const L10NARGS_ATTR_NAME = "data-l10n-args";
	const L10N_ELEMENT_QUERY = `[${L10NID_ATTR_NAME}]`;
	class DOMLocalization extends Localization {
	  constructor(resourceIds, generateBundles) {
	    super(resourceIds, generateBundles);
	    this.roots = new Set();
	    this.pendingrAF = null;
	    this.pendingElements = new Set();
	    this.windowElement = null;
	    this.mutationObserver = null;
	    this.observerConfig = {
	      attributes: true,
	      characterData: false,
	      childList: true,
	      subtree: true,
	      attributeFilter: [L10NID_ATTR_NAME, L10NARGS_ATTR_NAME]
	    };
	  }
	  onChange(eager = false) {
	    super.onChange(eager);
	    if (this.roots) {
	      this.translateRoots();
	    }
	  }
	  setAttributes(element, id, args) {
	    element.setAttribute(L10NID_ATTR_NAME, id);
	    if (args) {
	      element.setAttribute(L10NARGS_ATTR_NAME, JSON.stringify(args));
	    } else {
	      element.removeAttribute(L10NARGS_ATTR_NAME);
	    }
	    return element;
	  }
	  getAttributes(element) {
	    return {
	      id: element.getAttribute(L10NID_ATTR_NAME),
	      args: JSON.parse(element.getAttribute(L10NARGS_ATTR_NAME) || null)
	    };
	  }
	  connectRoot(newRoot) {
	    for (const root of this.roots) {
	      if (root === newRoot || root.contains(newRoot) || newRoot.contains(root)) {
	        throw new Error("Cannot add a root that overlaps with existing root.");
	      }
	    }
	    if (this.windowElement) {
	      if (this.windowElement !== newRoot.ownerDocument.defaultView) {
	        throw new Error(`Cannot connect a root:
          DOMLocalization already has a root from a different window.`);
	      }
	    } else {
	      this.windowElement = newRoot.ownerDocument.defaultView;
	      this.mutationObserver = new this.windowElement.MutationObserver(mutations => this.translateMutations(mutations));
	    }
	    this.roots.add(newRoot);
	    this.mutationObserver.observe(newRoot, this.observerConfig);
	  }
	  disconnectRoot(root) {
	    this.roots.delete(root);
	    this.pauseObserving();
	    if (this.roots.size === 0) {
	      this.mutationObserver = null;
	      if (this.windowElement && this.pendingrAF) {
	        this.windowElement.cancelAnimationFrame(this.pendingrAF);
	      }
	      this.windowElement = null;
	      this.pendingrAF = null;
	      this.pendingElements.clear();
	      return true;
	    }
	    this.resumeObserving();
	    return false;
	  }
	  translateRoots() {
	    const roots = Array.from(this.roots);
	    return Promise.all(roots.map(root => this.translateFragment(root)));
	  }
	  pauseObserving() {
	    if (!this.mutationObserver) {
	      return;
	    }
	    this.translateMutations(this.mutationObserver.takeRecords());
	    this.mutationObserver.disconnect();
	  }
	  resumeObserving() {
	    if (!this.mutationObserver) {
	      return;
	    }
	    for (const root of this.roots) {
	      this.mutationObserver.observe(root, this.observerConfig);
	    }
	  }
	  translateMutations(mutations) {
	    for (const mutation of mutations) {
	      switch (mutation.type) {
	        case "attributes":
	          if (mutation.target.hasAttribute("data-l10n-id")) {
	            this.pendingElements.add(mutation.target);
	          }
	          break;
	        case "childList":
	          for (const addedNode of mutation.addedNodes) {
	            if (addedNode.nodeType === addedNode.ELEMENT_NODE) {
	              if (addedNode.childElementCount) {
	                for (const element of this.getTranslatables(addedNode)) {
	                  this.pendingElements.add(element);
	                }
	              } else if (addedNode.hasAttribute(L10NID_ATTR_NAME)) {
	                this.pendingElements.add(addedNode);
	              }
	            }
	          }
	          break;
	      }
	    }
	    if (this.pendingElements.size > 0) {
	      if (this.pendingrAF === null) {
	        this.pendingrAF = this.windowElement.requestAnimationFrame(() => {
	          this.translateElements(Array.from(this.pendingElements));
	          this.pendingElements.clear();
	          this.pendingrAF = null;
	        });
	      }
	    }
	  }
	  translateFragment(frag) {
	    return this.translateElements(this.getTranslatables(frag));
	  }
	  async translateElements(elements) {
	    if (!elements.length) {
	      return undefined;
	    }
	    const keys = elements.map(this.getKeysForElement);
	    const translations = await this.formatMessages(keys);
	    return this.applyTranslations(elements, translations);
	  }
	  applyTranslations(elements, translations) {
	    this.pauseObserving();
	    for (let i = 0; i < elements.length; i++) {
	      if (translations[i] !== undefined) {
	        translateElement(elements[i], translations[i]);
	      }
	    }
	    this.resumeObserving();
	  }
	  getTranslatables(element) {
	    const nodes = Array.from(element.querySelectorAll(L10N_ELEMENT_QUERY));
	    if (typeof element.hasAttribute === "function" && element.hasAttribute(L10NID_ATTR_NAME)) {
	      nodes.push(element);
	    }
	    return nodes;
	  }
	  getKeysForElement(element) {
	    return {
	      id: element.getAttribute(L10NID_ATTR_NAME),
	      args: JSON.parse(element.getAttribute(L10NARGS_ATTR_NAME) || null)
	    };
	  }
	}
	var _dir = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("dir");
	var _elements = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("elements");
	var _lang = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("lang");
	var _l10n = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("l10n");
	var _fixupLangCode = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("fixupLangCode");
	var _isRTL = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isRTL");
	class L10n {
	  constructor({
	    lang,
	    isRTL
	  }, l10n = null) {
	    Object.defineProperty(this, _dir, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _elements, {
	      writable: true,
	      value: new Set()
	    });
	    Object.defineProperty(this, _lang, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _l10n, {
	      writable: true,
	      value: void 0
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _lang)[_lang] = babelHelpers.classPrivateFieldLooseBase(L10n, _fixupLangCode)[_fixupLangCode](lang);
	    babelHelpers.classPrivateFieldLooseBase(this, _l10n)[_l10n] = l10n;
	    babelHelpers.classPrivateFieldLooseBase(this, _dir)[_dir] = (isRTL != null ? isRTL : babelHelpers.classPrivateFieldLooseBase(L10n, _isRTL)[_isRTL](babelHelpers.classPrivateFieldLooseBase(this, _lang)[_lang])) ? "rtl" : "ltr";
	  }
	  _setL10n(l10n) {
	    babelHelpers.classPrivateFieldLooseBase(this, _l10n)[_l10n] = l10n;
	  }
	  getLanguage() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _lang)[_lang];
	  }
	  getDirection() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _dir)[_dir];
	  }
	  async get(ids, args = null, fallback) {
	    var _messages$;
	    if (Array.isArray(ids)) {
	      ids = ids.map(id => ({
	        id
	      }));
	      const messages = await babelHelpers.classPrivateFieldLooseBase(this, _l10n)[_l10n].formatMessages(ids);
	      return messages.map(message => message.value);
	    }
	    const messages = await babelHelpers.classPrivateFieldLooseBase(this, _l10n)[_l10n].formatMessages([{
	      id: ids,
	      args
	    }]);
	    return ((_messages$ = messages[0]) == null ? void 0 : _messages$.value) || fallback;
	  }
	  async translate(element) {
	    babelHelpers.classPrivateFieldLooseBase(this, _elements)[_elements].add(element);
	    try {
	      babelHelpers.classPrivateFieldLooseBase(this, _l10n)[_l10n].connectRoot(element);
	      await babelHelpers.classPrivateFieldLooseBase(this, _l10n)[_l10n].translateRoots();
	    } catch {}
	  }
	  async translateOnce(element) {
	    try {
	      await babelHelpers.classPrivateFieldLooseBase(this, _l10n)[_l10n].translateElements([element]);
	    } catch (ex) {
	      console.error(`translateOnce: "${ex}".`);
	    }
	  }
	  async destroy() {
	    for (const element of babelHelpers.classPrivateFieldLooseBase(this, _elements)[_elements]) {
	      babelHelpers.classPrivateFieldLooseBase(this, _l10n)[_l10n].disconnectRoot(element);
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _elements)[_elements].clear();
	    babelHelpers.classPrivateFieldLooseBase(this, _l10n)[_l10n].pauseObserving();
	  }
	  pause() {
	    babelHelpers.classPrivateFieldLooseBase(this, _l10n)[_l10n].pauseObserving();
	  }
	  resume() {
	    babelHelpers.classPrivateFieldLooseBase(this, _l10n)[_l10n].resumeObserving();
	  }
	}
	function _fixupLangCode2(langCode) {
	  var _langCode;
	  langCode = ((_langCode = langCode) == null ? void 0 : _langCode.toLowerCase()) || "en-us";
	  const PARTIAL_LANG_CODES = {
	    en: "en-us",
	    es: "es-es",
	    fy: "fy-nl",
	    ga: "ga-ie",
	    gu: "gu-in",
	    hi: "hi-in",
	    hy: "hy-am",
	    nb: "nb-no",
	    ne: "ne-np",
	    nn: "nn-no",
	    pa: "pa-in",
	    pt: "pt-pt",
	    sv: "sv-se",
	    zh: "zh-cn"
	  };
	  return PARTIAL_LANG_CODES[langCode] || langCode;
	}
	function _isRTL2(lang) {
	  const shortCode = lang.split("-", 1)[0];
	  return ["ar", "he", "fa", "ps", "ur"].includes(shortCode);
	}
	Object.defineProperty(L10n, _isRTL, {
	  value: _isRTL2
	});
	Object.defineProperty(L10n, _fixupLangCode, {
	  value: _fixupLangCode2
	});

	function createBundle(lang, text) {
	  const resource = new FluentResource(text);
	  const bundle = new FluentBundle(lang);
	  const errors = bundle.addResource(resource);
	  if (errors.length) {
	    console.error("L10n errors", errors);
	  }
	  return bundle;
	}
	var _generateBundles = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("generateBundles");
	var _createBundle = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("createBundle");
	var _getPaths = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getPaths");
	var _generateBundlesFallback = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("generateBundlesFallback");
	var _createBundleFallback = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("createBundleFallback");
	class genericl10n_GenericL10n extends L10n {
	  constructor(lang) {
	    super({
	      lang
	    });
	    const generateBundles = !lang ? babelHelpers.classPrivateFieldLooseBase(genericl10n_GenericL10n, _generateBundlesFallback)[_generateBundlesFallback].bind(genericl10n_GenericL10n, this.getLanguage()) : babelHelpers.classPrivateFieldLooseBase(genericl10n_GenericL10n, _generateBundles)[_generateBundles].bind(genericl10n_GenericL10n, "en-us", this.getLanguage());
	    this._setL10n(new DOMLocalization([], generateBundles));
	  }
	}
	async function* _generateBundles2(defaultLang, baseLang) {
	  const {
	    baseURL,
	    paths
	  } = await babelHelpers.classPrivateFieldLooseBase(this, _getPaths)[_getPaths]();
	  const langs = [baseLang];
	  if (defaultLang !== baseLang) {
	    const shortLang = baseLang.split("-", 1)[0];
	    if (shortLang !== baseLang) {
	      langs.push(shortLang);
	    }
	    langs.push(defaultLang);
	  }
	  for (const lang of langs) {
	    const bundle = await babelHelpers.classPrivateFieldLooseBase(this, _createBundle)[_createBundle](lang, baseURL, paths);
	    if (bundle) {
	      yield bundle;
	    } else if (lang === "en-us") {
	      yield babelHelpers.classPrivateFieldLooseBase(this, _createBundleFallback)[_createBundleFallback](lang);
	    }
	  }
	}
	async function _createBundle2(lang, baseURL, paths) {
	  const path = paths[lang];
	  if (!path) {
	    return null;
	  }
	  const url = new URL(path, baseURL);
	  const text = await fetchData(url, "text");
	  return createBundle(lang, text);
	}
	async function _getPaths2() {
	  try {
	    const {
	      href
	    } = document.querySelector(`link[type="application/l10n"]`);
	    const paths = await fetchData(href, "json");
	    return {
	      baseURL: href.replace(/[^/]*$/, "") || "./",
	      paths
	    };
	  } catch {}
	  return {
	    baseURL: "./",
	    paths: Object.create(null)
	  };
	}
	async function* _generateBundlesFallback2(lang) {
	  yield babelHelpers.classPrivateFieldLooseBase(this, _createBundleFallback)[_createBundleFallback](lang);
	}
	async function _createBundleFallback2(lang) {
	  const text = "pdfjs-previous-button =\n    .title = Previous Page\npdfjs-previous-button-label = Previous\npdfjs-next-button =\n    .title = Next Page\npdfjs-next-button-label = Next\npdfjs-page-input =\n    .title = Page\npdfjs-of-pages = of { $pagesCount }\npdfjs-page-of-pages = ({ $pageNumber } of { $pagesCount })\npdfjs-zoom-out-button =\n    .title = Zoom Out\npdfjs-zoom-out-button-label = Zoom Out\npdfjs-zoom-in-button =\n    .title = Zoom In\npdfjs-zoom-in-button-label = Zoom In\npdfjs-zoom-select =\n    .title = Zoom\npdfjs-presentation-mode-button =\n    .title = Switch to Presentation Mode\npdfjs-presentation-mode-button-label = Presentation Mode\npdfjs-open-file-button =\n    .title = Open File\npdfjs-open-file-button-label = Open\npdfjs-print-button =\n    .title = Print\npdfjs-print-button-label = Print\npdfjs-save-button =\n    .title = Save\npdfjs-save-button-label = Save\npdfjs-download-button =\n    .title = Download\npdfjs-download-button-label = Download\npdfjs-bookmark-button =\n    .title = Current Page (View URL from Current Page)\npdfjs-bookmark-button-label = Current Page\npdfjs-tools-button =\n    .title = Tools\npdfjs-tools-button-label = Tools\npdfjs-first-page-button =\n    .title = Go to First Page\npdfjs-first-page-button-label = Go to First Page\npdfjs-last-page-button =\n    .title = Go to Last Page\npdfjs-last-page-button-label = Go to Last Page\npdfjs-page-rotate-cw-button =\n    .title = Rotate Clockwise\npdfjs-page-rotate-cw-button-label = Rotate Clockwise\npdfjs-page-rotate-ccw-button =\n    .title = Rotate Counterclockwise\npdfjs-page-rotate-ccw-button-label = Rotate Counterclockwise\npdfjs-cursor-text-select-tool-button =\n    .title = Enable Text Selection Tool\npdfjs-cursor-text-select-tool-button-label = Text Selection Tool\npdfjs-cursor-hand-tool-button =\n    .title = Enable Hand Tool\npdfjs-cursor-hand-tool-button-label = Hand Tool\npdfjs-scroll-page-button =\n    .title = Use Page Scrolling\npdfjs-scroll-page-button-label = Page Scrolling\npdfjs-scroll-vertical-button =\n    .title = Use Vertical Scrolling\npdfjs-scroll-vertical-button-label = Vertical Scrolling\npdfjs-scroll-horizontal-button =\n    .title = Use Horizontal Scrolling\npdfjs-scroll-horizontal-button-label = Horizontal Scrolling\npdfjs-scroll-wrapped-button =\n    .title = Use Wrapped Scrolling\npdfjs-scroll-wrapped-button-label = Wrapped Scrolling\npdfjs-spread-none-button =\n    .title = Do not join page spreads\npdfjs-spread-none-button-label = No Spreads\npdfjs-spread-odd-button =\n    .title = Join page spreads starting with odd-numbered pages\npdfjs-spread-odd-button-label = Odd Spreads\npdfjs-spread-even-button =\n    .title = Join page spreads starting with even-numbered pages\npdfjs-spread-even-button-label = Even Spreads\npdfjs-document-properties-button =\n    .title = Document Properties\u2026\npdfjs-document-properties-button-label = Document Properties\u2026\npdfjs-document-properties-file-name = File name:\npdfjs-document-properties-file-size = File size:\npdfjs-document-properties-size-kb = { NUMBER($kb, maximumSignificantDigits: 3) } KB ({ $b } bytes)\npdfjs-document-properties-size-mb = { NUMBER($mb, maximumSignificantDigits: 3) } MB ({ $b } bytes)\npdfjs-document-properties-title = Title:\npdfjs-document-properties-author = Author:\npdfjs-document-properties-subject = Subject:\npdfjs-document-properties-keywords = Keywords:\npdfjs-document-properties-creation-date = Creation Date:\npdfjs-document-properties-modification-date = Modification Date:\npdfjs-document-properties-date-time-string = { DATETIME($dateObj, dateStyle: \"short\", timeStyle: \"medium\") }\npdfjs-document-properties-creator = Creator:\npdfjs-document-properties-producer = PDF Producer:\npdfjs-document-properties-version = PDF Version:\npdfjs-document-properties-page-count = Page Count:\npdfjs-document-properties-page-size = Page Size:\npdfjs-document-properties-page-size-unit-inches = in\npdfjs-document-properties-page-size-unit-millimeters = mm\npdfjs-document-properties-page-size-orientation-portrait = portrait\npdfjs-document-properties-page-size-orientation-landscape = landscape\npdfjs-document-properties-page-size-name-a-three = A3\npdfjs-document-properties-page-size-name-a-four = A4\npdfjs-document-properties-page-size-name-letter = Letter\npdfjs-document-properties-page-size-name-legal = Legal\npdfjs-document-properties-page-size-dimension-string = { $width } \xD7 { $height } { $unit } ({ $orientation })\npdfjs-document-properties-page-size-dimension-name-string = { $width } \xD7 { $height } { $unit } ({ $name }, { $orientation })\npdfjs-document-properties-linearized = Fast Web View:\npdfjs-document-properties-linearized-yes = Yes\npdfjs-document-properties-linearized-no = No\npdfjs-document-properties-close-button = Close\npdfjs-print-progress-message = Preparing document for printing\u2026\npdfjs-print-progress-percent = { $progress }%\npdfjs-print-progress-close-button = Cancel\npdfjs-printing-not-supported = Warning: Printing is not fully supported by this browser.\npdfjs-printing-not-ready = Warning: The PDF is not fully loaded for printing.\npdfjs-toggle-sidebar-button =\n    .title = Toggle Sidebar\npdfjs-toggle-sidebar-notification-button =\n    .title = Toggle Sidebar (document contains outline/attachments/layers)\npdfjs-toggle-sidebar-button-label = Toggle Sidebar\npdfjs-document-outline-button =\n    .title = Show Document Outline (double-click to expand/collapse all items)\npdfjs-document-outline-button-label = Document Outline\npdfjs-attachments-button =\n    .title = Show Attachments\npdfjs-attachments-button-label = Attachments\npdfjs-layers-button =\n    .title = Show Layers (double-click to reset all layers to the default state)\npdfjs-layers-button-label = Layers\npdfjs-thumbs-button =\n    .title = Show Thumbnails\npdfjs-thumbs-button-label = Thumbnails\npdfjs-current-outline-item-button =\n    .title = Find Current Outline Item\npdfjs-current-outline-item-button-label = Current Outline Item\npdfjs-findbar-button =\n    .title = Find in Document\npdfjs-findbar-button-label = Find\npdfjs-additional-layers = Additional Layers\npdfjs-thumb-page-title =\n    .title = Page { $page }\npdfjs-thumb-page-canvas =\n    .aria-label = Thumbnail of Page { $page }\npdfjs-find-input =\n    .title = Find\n    .placeholder = Find in document\u2026\npdfjs-find-previous-button =\n    .title = Find the previous occurrence of the phrase\npdfjs-find-previous-button-label = Previous\npdfjs-find-next-button =\n    .title = Find the next occurrence of the phrase\npdfjs-find-next-button-label = Next\npdfjs-find-highlight-checkbox = Highlight All\npdfjs-find-match-case-checkbox-label = Match Case\npdfjs-find-match-diacritics-checkbox-label = Match Diacritics\npdfjs-find-entire-word-checkbox-label = Whole Words\npdfjs-find-reached-top = Reached top of document, continued from bottom\npdfjs-find-reached-bottom = Reached end of document, continued from top\npdfjs-find-match-count =\n    { $total ->\n        [one] { $current } of { $total } match\n       *[other] { $current } of { $total } matches\n    }\npdfjs-find-match-count-limit =\n    { $limit ->\n        [one] More than { $limit } match\n       *[other] More than { $limit } matches\n    }\npdfjs-find-not-found = Phrase not found\npdfjs-page-scale-width = Page Width\npdfjs-page-scale-fit = Page Fit\npdfjs-page-scale-auto = Automatic Zoom\npdfjs-page-scale-actual = Actual Size\npdfjs-page-scale-percent = { $scale }%\npdfjs-page-landmark =\n    .aria-label = Page { $page }\npdfjs-loading-error = An error occurred while loading the PDF.\npdfjs-invalid-file-error = Invalid or corrupted PDF file.\npdfjs-missing-file-error = Missing PDF file.\npdfjs-unexpected-response-error = Unexpected server response.\npdfjs-rendering-error = An error occurred while rendering the page.\npdfjs-annotation-date-time-string = { DATETIME($dateObj, dateStyle: \"short\", timeStyle: \"medium\") }\npdfjs-text-annotation-type =\n    .alt = [{ $type } Annotation]\npdfjs-password-label = Enter the password to open this PDF file.\npdfjs-password-invalid = Invalid password. Please try again.\npdfjs-password-ok-button = OK\npdfjs-password-cancel-button = Cancel\npdfjs-web-fonts-disabled = Web fonts are disabled: unable to use embedded PDF fonts.\npdfjs-editor-free-text-button =\n    .title = Text\npdfjs-editor-free-text-button-label = Text\npdfjs-editor-ink-button =\n    .title = Draw\npdfjs-editor-ink-button-label = Draw\npdfjs-editor-stamp-button =\n    .title = Add or edit images\npdfjs-editor-stamp-button-label = Add or edit images\npdfjs-editor-highlight-button =\n    .title = Highlight\npdfjs-editor-highlight-button-label = Highlight\npdfjs-highlight-floating-button1 =\n    .title = Highlight\n    .aria-label = Highlight\npdfjs-highlight-floating-button-label = Highlight\npdfjs-editor-remove-ink-button =\n    .title = Remove drawing\npdfjs-editor-remove-freetext-button =\n    .title = Remove text\npdfjs-editor-remove-stamp-button =\n    .title = Remove image\npdfjs-editor-remove-highlight-button =\n    .title = Remove highlight\npdfjs-editor-free-text-color-input = Color\npdfjs-editor-free-text-size-input = Size\npdfjs-editor-ink-color-input = Color\npdfjs-editor-ink-thickness-input = Thickness\npdfjs-editor-ink-opacity-input = Opacity\npdfjs-editor-stamp-add-image-button =\n    .title = Add image\npdfjs-editor-stamp-add-image-button-label = Add image\npdfjs-editor-free-highlight-thickness-input = Thickness\npdfjs-editor-free-highlight-thickness-title =\n    .title = Change thickness when highlighting items other than text\npdfjs-free-text2 =\n    .aria-label = Text Editor\n    .default-content = Start typing\u2026\npdfjs-ink =\n    .aria-label = Draw Editor\npdfjs-ink-canvas =\n    .aria-label = User-created image\npdfjs-editor-alt-text-button-label = Alt text\npdfjs-editor-alt-text-edit-button-label = Edit alt text\npdfjs-editor-alt-text-dialog-label = Choose an option\npdfjs-editor-alt-text-dialog-description = Alt text (alternative text) helps when people can\u2019t see the image or when it doesn\u2019t load.\npdfjs-editor-alt-text-add-description-label = Add a description\npdfjs-editor-alt-text-add-description-description = Aim for 1-2 sentences that describe the subject, setting, or actions.\npdfjs-editor-alt-text-mark-decorative-label = Mark as decorative\npdfjs-editor-alt-text-mark-decorative-description = This is used for ornamental images, like borders or watermarks.\npdfjs-editor-alt-text-cancel-button = Cancel\npdfjs-editor-alt-text-save-button = Save\npdfjs-editor-alt-text-decorative-tooltip = Marked as decorative\npdfjs-editor-alt-text-textarea =\n    .placeholder = For example, \u201CA young man sits down at a table to eat a meal\u201D\npdfjs-editor-resizer-top-left =\n    .aria-label = Top left corner \u2014 resize\npdfjs-editor-resizer-top-middle =\n    .aria-label = Top middle \u2014 resize\npdfjs-editor-resizer-top-right =\n    .aria-label = Top right corner \u2014 resize\npdfjs-editor-resizer-middle-right =\n    .aria-label = Middle right \u2014 resize\npdfjs-editor-resizer-bottom-right =\n    .aria-label = Bottom right corner \u2014 resize\npdfjs-editor-resizer-bottom-middle =\n    .aria-label = Bottom middle \u2014 resize\npdfjs-editor-resizer-bottom-left =\n    .aria-label = Bottom left corner \u2014 resize\npdfjs-editor-resizer-middle-left =\n    .aria-label = Middle left \u2014 resize\npdfjs-editor-highlight-colorpicker-label = Highlight color\npdfjs-editor-colorpicker-button =\n    .title = Change color\npdfjs-editor-colorpicker-dropdown =\n    .aria-label = Color choices\npdfjs-editor-colorpicker-yellow =\n    .title = Yellow\npdfjs-editor-colorpicker-green =\n    .title = Green\npdfjs-editor-colorpicker-blue =\n    .title = Blue\npdfjs-editor-colorpicker-pink =\n    .title = Pink\npdfjs-editor-colorpicker-red =\n    .title = Red\npdfjs-editor-highlight-show-all-button-label = Show all\npdfjs-editor-highlight-show-all-button =\n    .title = Show all\npdfjs-editor-new-alt-text-dialog-edit-label = Edit alt text (image description)\npdfjs-editor-new-alt-text-dialog-add-label = Add alt text (image description)\npdfjs-editor-new-alt-text-textarea =\n    .placeholder = Write your description here\u2026\npdfjs-editor-new-alt-text-description = Short description for people who can\u2019t see the image or when the image doesn\u2019t load.\npdfjs-editor-new-alt-text-disclaimer1 = This alt text was created automatically and may be inaccurate.\npdfjs-editor-new-alt-text-disclaimer-learn-more-url = Learn more\npdfjs-editor-new-alt-text-create-automatically-button-label = Create alt text automatically\npdfjs-editor-new-alt-text-not-now-button = Not now\npdfjs-editor-new-alt-text-error-title = Couldn\u2019t create alt text automatically\npdfjs-editor-new-alt-text-error-description = Please write your own alt text or try again later.\npdfjs-editor-new-alt-text-error-close-button = Close\npdfjs-editor-new-alt-text-ai-model-downloading-progress = Downloading alt text AI model ({ $downloadedSize } of { $totalSize } MB)\n    .aria-valuetext = Downloading alt text AI model ({ $downloadedSize } of { $totalSize } MB)\npdfjs-editor-new-alt-text-added-button-label = Alt text added\npdfjs-editor-new-alt-text-missing-button-label = Missing alt text\npdfjs-editor-new-alt-text-to-review-button-label = Review alt text\npdfjs-editor-new-alt-text-generated-alt-text-with-disclaimer = Created automatically: { $generatedAltText }\npdfjs-image-alt-text-settings-button =\n    .title = Image alt text settings\npdfjs-image-alt-text-settings-button-label = Image alt text settings\npdfjs-editor-alt-text-settings-dialog-label = Image alt text settings\npdfjs-editor-alt-text-settings-automatic-title = Automatic alt text\npdfjs-editor-alt-text-settings-create-model-button-label = Create alt text automatically\npdfjs-editor-alt-text-settings-create-model-description = Suggests descriptions to help people who can\u2019t see the image or when the image doesn\u2019t load.\npdfjs-editor-alt-text-settings-download-model-label = Alt text AI model ({ $totalSize } MB)\npdfjs-editor-alt-text-settings-ai-model-description = Runs locally on your device so your data stays private. Required for automatic alt text.\npdfjs-editor-alt-text-settings-delete-model-button = Delete\npdfjs-editor-alt-text-settings-download-model-button = Download\npdfjs-editor-alt-text-settings-downloading-model-button = Downloading\u2026\npdfjs-editor-alt-text-settings-editor-title = Alt text editor\npdfjs-editor-alt-text-settings-show-dialog-button-label = Show alt text editor right away when adding an image\npdfjs-editor-alt-text-settings-show-dialog-description = Helps you make sure all your images have alt text.\npdfjs-editor-alt-text-settings-close-button = Close";
	  return createBundle(lang, text);
	}
	Object.defineProperty(genericl10n_GenericL10n, _createBundleFallback, {
	  value: _createBundleFallback2
	});
	Object.defineProperty(genericl10n_GenericL10n, _generateBundlesFallback, {
	  value: _generateBundlesFallback2
	});
	Object.defineProperty(genericl10n_GenericL10n, _getPaths, {
	  value: _getPaths2
	});
	Object.defineProperty(genericl10n_GenericL10n, _createBundle, {
	  value: _createBundle2
	});
	Object.defineProperty(genericl10n_GenericL10n, _generateBundles, {
	  value: _generateBundles2
	});
	class GenericScripting {
	  constructor(sandboxBundleSrc) {
	    this._ready = new Promise((resolve, reject) => {
	      const sandbox = import( /*webpackIgnore: true*/sandboxBundleSrc);
	      sandbox.then(pdfjsSandbox => {
	        resolve(pdfjsSandbox.QuickJSSandbox());
	      }).catch(reject);
	    });
	  }
	  async createSandbox(data) {
	    const sandbox = await this._ready;
	    sandbox.create(data);
	  }
	  async dispatchEventInSandbox(event) {
	    const sandbox = await this._ready;
	    setTimeout(() => sandbox.dispatchEvent(event), 0);
	  }
	  async destroySandbox() {
	    const sandbox = await this._ready;
	    sandbox.nukeSandbox();
	  }
	}
	class Preferences extends BasePreferences {
	  async _writeToStorage(prefObj) {
	    localStorage.setItem("pdfjs.preferences", JSON.stringify(prefObj));
	  }
	  async _readFromStorage(prefObj) {
	    return {
	      prefs: JSON.parse(localStorage.getItem("pdfjs.preferences"))
	    };
	  }
	}
	class ExternalServices extends BaseExternalServices {
	  async createL10n() {
	    var _AppOptions$get;
	    return new genericl10n_GenericL10n((_AppOptions$get = AppOptions.get("localeProperties")) == null ? void 0 : _AppOptions$get.lang);
	  }
	  createScripting() {
	    return new GenericScripting(AppOptions.get("sandboxBundleSrc"));
	  }
	}
	var _boundCancel = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("boundCancel");
	var _createAutomaticallyButton = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("createAutomaticallyButton");
	var _currentEditor = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("currentEditor");
	var _cancelButton = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("cancelButton");
	var _descriptionContainer = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("descriptionContainer");
	var _dialog = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("dialog");
	var _disclaimer = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("disclaimer");
	var _downloadModel = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("downloadModel");
	var _downloadModelDescription = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("downloadModelDescription");
	var _eventBus = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("eventBus");
	var _firstTime = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("firstTime");
	var _guessedAltText = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("guessedAltText");
	var _hasAI = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("hasAI");
	var _isEditing = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isEditing");
	var _imagePreview = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("imagePreview");
	var _imageData = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("imageData");
	var _isAILoading = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isAILoading");
	var _wasAILoading = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("wasAILoading");
	var _learnMore = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("learnMore");
	var _notNowButton = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("notNowButton");
	var _overlayManager = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("overlayManager");
	var _textarea = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("textarea");
	var _title = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("title");
	var _uiManager = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("uiManager");
	var _previousAltText = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("previousAltText");
	var _toggleLoading = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("toggleLoading");
	var _toggleError = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("toggleError");
	var _toggleGuessAltText = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("toggleGuessAltText");
	var _toggleNotNow = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("toggleNotNow");
	var _toggleAI = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("toggleAI");
	var _toggleTitleAndDisclaimer = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("toggleTitleAndDisclaimer");
	var _mlGuessAltText = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("mlGuessAltText");
	var _addAltText = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("addAltText");
	var _setProgress = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("setProgress");
	var _cancel = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("cancel");
	var _finish = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("finish");
	var _close = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("close");
	var _save = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("save");
	class NewAltTextManager {
	  constructor({
	    descriptionContainer,
	    dialog,
	    imagePreview,
	    cancelButton,
	    disclaimer,
	    notNowButton,
	    saveButton,
	    textarea,
	    learnMore,
	    errorCloseButton,
	    createAutomaticallyButton,
	    downloadModel,
	    downloadModelDescription,
	    title
	  }, overlayManager, eventBus) {
	    Object.defineProperty(this, _save, {
	      value: _save2
	    });
	    Object.defineProperty(this, _close, {
	      value: _close2
	    });
	    Object.defineProperty(this, _finish, {
	      value: _finish2
	    });
	    Object.defineProperty(this, _cancel, {
	      value: _cancel2
	    });
	    Object.defineProperty(this, _setProgress, {
	      value: _setProgress2
	    });
	    Object.defineProperty(this, _addAltText, {
	      value: _addAltText2
	    });
	    Object.defineProperty(this, _mlGuessAltText, {
	      value: _mlGuessAltText2
	    });
	    Object.defineProperty(this, _toggleTitleAndDisclaimer, {
	      value: _toggleTitleAndDisclaimer2
	    });
	    Object.defineProperty(this, _toggleAI, {
	      value: _toggleAI2
	    });
	    Object.defineProperty(this, _toggleNotNow, {
	      value: _toggleNotNow2
	    });
	    Object.defineProperty(this, _toggleGuessAltText, {
	      value: _toggleGuessAltText2
	    });
	    Object.defineProperty(this, _toggleError, {
	      value: _toggleError2
	    });
	    Object.defineProperty(this, _toggleLoading, {
	      value: _toggleLoading2
	    });
	    Object.defineProperty(this, _boundCancel, {
	      writable: true,
	      value: babelHelpers.classPrivateFieldLooseBase(this, _cancel)[_cancel].bind(this)
	    });
	    Object.defineProperty(this, _createAutomaticallyButton, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _currentEditor, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _cancelButton, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _descriptionContainer, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _dialog, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _disclaimer, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _downloadModel, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _downloadModelDescription, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _eventBus, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _firstTime, {
	      writable: true,
	      value: false
	    });
	    Object.defineProperty(this, _guessedAltText, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _hasAI, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _isEditing, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _imagePreview, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _imageData, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _isAILoading, {
	      writable: true,
	      value: false
	    });
	    Object.defineProperty(this, _wasAILoading, {
	      writable: true,
	      value: false
	    });
	    Object.defineProperty(this, _learnMore, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _notNowButton, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _overlayManager, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _textarea, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _title, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _uiManager, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _previousAltText, {
	      writable: true,
	      value: null
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _cancelButton)[_cancelButton] = cancelButton;
	    babelHelpers.classPrivateFieldLooseBase(this, _createAutomaticallyButton)[_createAutomaticallyButton] = createAutomaticallyButton;
	    babelHelpers.classPrivateFieldLooseBase(this, _descriptionContainer)[_descriptionContainer] = descriptionContainer;
	    babelHelpers.classPrivateFieldLooseBase(this, _dialog)[_dialog] = dialog;
	    babelHelpers.classPrivateFieldLooseBase(this, _disclaimer)[_disclaimer] = disclaimer;
	    babelHelpers.classPrivateFieldLooseBase(this, _notNowButton)[_notNowButton] = notNowButton;
	    babelHelpers.classPrivateFieldLooseBase(this, _imagePreview)[_imagePreview] = imagePreview;
	    babelHelpers.classPrivateFieldLooseBase(this, _textarea)[_textarea] = textarea;
	    babelHelpers.classPrivateFieldLooseBase(this, _learnMore)[_learnMore] = learnMore;
	    babelHelpers.classPrivateFieldLooseBase(this, _title)[_title] = title;
	    babelHelpers.classPrivateFieldLooseBase(this, _downloadModel)[_downloadModel] = downloadModel;
	    babelHelpers.classPrivateFieldLooseBase(this, _downloadModelDescription)[_downloadModelDescription] = downloadModelDescription;
	    babelHelpers.classPrivateFieldLooseBase(this, _overlayManager)[_overlayManager] = overlayManager;
	    babelHelpers.classPrivateFieldLooseBase(this, _eventBus)[_eventBus] = eventBus;
	    dialog.addEventListener("close", babelHelpers.classPrivateFieldLooseBase(this, _close)[_close].bind(this));
	    dialog.addEventListener("contextmenu", event => {
	      if (event.target !== babelHelpers.classPrivateFieldLooseBase(this, _textarea)[_textarea]) {
	        event.preventDefault();
	      }
	    });
	    cancelButton.addEventListener("click", babelHelpers.classPrivateFieldLooseBase(this, _boundCancel)[_boundCancel]);
	    notNowButton.addEventListener("click", babelHelpers.classPrivateFieldLooseBase(this, _boundCancel)[_boundCancel]);
	    saveButton.addEventListener("click", babelHelpers.classPrivateFieldLooseBase(this, _save)[_save].bind(this));
	    errorCloseButton.addEventListener("click", () => {
	      babelHelpers.classPrivateFieldLooseBase(this, _toggleError)[_toggleError](false);
	    });
	    createAutomaticallyButton.addEventListener("click", async () => {
	      const checked = createAutomaticallyButton.getAttribute("aria-pressed") !== "true";
	      babelHelpers.classPrivateFieldLooseBase(this, _currentEditor)[_currentEditor]._reportTelemetry({
	        action: "pdfjs.image.alt_text.ai_generation_check",
	        data: {
	          status: checked
	        }
	      });
	      if (babelHelpers.classPrivateFieldLooseBase(this, _uiManager)[_uiManager]) {
	        babelHelpers.classPrivateFieldLooseBase(this, _uiManager)[_uiManager].setPreference("enableGuessAltText", checked);
	        await babelHelpers.classPrivateFieldLooseBase(this, _uiManager)[_uiManager].mlManager.toggleService("altText", checked);
	      }
	      babelHelpers.classPrivateFieldLooseBase(this, _toggleGuessAltText)[_toggleGuessAltText](checked, false);
	    });
	    textarea.addEventListener("focus", () => {
	      babelHelpers.classPrivateFieldLooseBase(this, _wasAILoading)[_wasAILoading] = babelHelpers.classPrivateFieldLooseBase(this, _isAILoading)[_isAILoading];
	      babelHelpers.classPrivateFieldLooseBase(this, _toggleLoading)[_toggleLoading](false);
	      babelHelpers.classPrivateFieldLooseBase(this, _toggleTitleAndDisclaimer)[_toggleTitleAndDisclaimer]();
	    });
	    textarea.addEventListener("blur", () => {
	      if (!textarea.value) {
	        babelHelpers.classPrivateFieldLooseBase(this, _toggleLoading)[_toggleLoading](babelHelpers.classPrivateFieldLooseBase(this, _wasAILoading)[_wasAILoading]);
	      }
	      babelHelpers.classPrivateFieldLooseBase(this, _toggleTitleAndDisclaimer)[_toggleTitleAndDisclaimer]();
	    });
	    textarea.addEventListener("input", () => {
	      babelHelpers.classPrivateFieldLooseBase(this, _toggleTitleAndDisclaimer)[_toggleTitleAndDisclaimer]();
	    });
	    eventBus._on("enableguessalttext", ({
	      value
	    }) => {
	      babelHelpers.classPrivateFieldLooseBase(this, _toggleGuessAltText)[_toggleGuessAltText](value, false);
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _overlayManager)[_overlayManager].register(dialog);
	    babelHelpers.classPrivateFieldLooseBase(this, _learnMore)[_learnMore].addEventListener("click", () => {
	      babelHelpers.classPrivateFieldLooseBase(this, _currentEditor)[_currentEditor]._reportTelemetry({
	        action: "pdfjs.image.alt_text.info",
	        data: {
	          topic: "alt_text"
	        }
	      });
	    });
	  }
	  async editAltText(uiManager, editor, firstTime) {
	    var _mlManager, _babelHelpers$classPr2;
	    if (babelHelpers.classPrivateFieldLooseBase(this, _currentEditor)[_currentEditor] || !editor) {
	      return;
	    }
	    if (firstTime && editor.hasAltTextData()) {
	      editor.altTextFinish();
	      return;
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _firstTime)[_firstTime] = firstTime;
	    let {
	      mlManager
	    } = uiManager;
	    let hasAI = !!mlManager;
	    babelHelpers.classPrivateFieldLooseBase(this, _toggleTitleAndDisclaimer)[_toggleTitleAndDisclaimer]();
	    if (mlManager && !mlManager.isReady("altText")) {
	      hasAI = false;
	      if (mlManager.hasProgress) {
	        babelHelpers.classPrivateFieldLooseBase(this, _setProgress)[_setProgress]();
	      } else {
	        mlManager = null;
	      }
	    } else {
	      babelHelpers.classPrivateFieldLooseBase(this, _downloadModel)[_downloadModel].classList.toggle("hidden", true);
	    }
	    const isAltTextEnabledPromise = (_mlManager = mlManager) == null ? void 0 : _mlManager.isEnabledFor("altText");
	    babelHelpers.classPrivateFieldLooseBase(this, _currentEditor)[_currentEditor] = editor;
	    babelHelpers.classPrivateFieldLooseBase(this, _uiManager)[_uiManager] = uiManager;
	    babelHelpers.classPrivateFieldLooseBase(this, _uiManager)[_uiManager].removeEditListeners();
	    ({
	      altText: babelHelpers.classPrivateFieldLooseBase(this, _previousAltText)[_previousAltText]
	    } = editor.altTextData);
	    babelHelpers.classPrivateFieldLooseBase(this, _textarea)[_textarea].value = (_babelHelpers$classPr2 = babelHelpers.classPrivateFieldLooseBase(this, _previousAltText)[_previousAltText]) != null ? _babelHelpers$classPr2 : "";
	    const AI_MAX_IMAGE_DIMENSION = 224;
	    const MAX_PREVIEW_DIMENSION = 180;
	    let canvas, width, height;
	    if (mlManager) {
	      ({
	        canvas,
	        width,
	        height,
	        imageData: babelHelpers.classPrivateFieldLooseBase(this, _imageData)[_imageData]
	      } = editor.copyCanvas(AI_MAX_IMAGE_DIMENSION, MAX_PREVIEW_DIMENSION, true));
	      if (hasAI) {
	        babelHelpers.classPrivateFieldLooseBase(this, _toggleGuessAltText)[_toggleGuessAltText](await isAltTextEnabledPromise, true);
	      }
	    } else {
	      ({
	        canvas,
	        width,
	        height
	      } = editor.copyCanvas(AI_MAX_IMAGE_DIMENSION, MAX_PREVIEW_DIMENSION, false));
	    }
	    canvas.setAttribute("role", "presentation");
	    const {
	      style
	    } = canvas;
	    style.width = `${width}px`;
	    style.height = `${height}px`;
	    babelHelpers.classPrivateFieldLooseBase(this, _imagePreview)[_imagePreview].append(canvas);
	    babelHelpers.classPrivateFieldLooseBase(this, _toggleNotNow)[_toggleNotNow]();
	    babelHelpers.classPrivateFieldLooseBase(this, _toggleAI)[_toggleAI](hasAI);
	    babelHelpers.classPrivateFieldLooseBase(this, _toggleError)[_toggleError](false);
	    try {
	      await babelHelpers.classPrivateFieldLooseBase(this, _overlayManager)[_overlayManager].open(babelHelpers.classPrivateFieldLooseBase(this, _dialog)[_dialog]);
	    } catch (ex) {
	      babelHelpers.classPrivateFieldLooseBase(this, _close)[_close]();
	      throw ex;
	    }
	  }
	  destroy() {
	    babelHelpers.classPrivateFieldLooseBase(this, _uiManager)[_uiManager] = null;
	    babelHelpers.classPrivateFieldLooseBase(this, _finish)[_finish]();
	  }
	}
	function _toggleLoading2(value) {
	  if (!babelHelpers.classPrivateFieldLooseBase(this, _uiManager)[_uiManager] || babelHelpers.classPrivateFieldLooseBase(this, _isAILoading)[_isAILoading] === value) {
	    return;
	  }
	  babelHelpers.classPrivateFieldLooseBase(this, _isAILoading)[_isAILoading] = value;
	  babelHelpers.classPrivateFieldLooseBase(this, _descriptionContainer)[_descriptionContainer].classList.toggle("loading", value);
	}
	function _toggleError2(value) {
	  if (!babelHelpers.classPrivateFieldLooseBase(this, _uiManager)[_uiManager]) {
	    return;
	  }
	  babelHelpers.classPrivateFieldLooseBase(this, _dialog)[_dialog].classList.toggle("error", value);
	}
	async function _toggleGuessAltText2(value, isInitial = false) {
	  if (!babelHelpers.classPrivateFieldLooseBase(this, _uiManager)[_uiManager]) {
	    return;
	  }
	  babelHelpers.classPrivateFieldLooseBase(this, _dialog)[_dialog].classList.toggle("aiDisabled", !value);
	  babelHelpers.classPrivateFieldLooseBase(this, _createAutomaticallyButton)[_createAutomaticallyButton].setAttribute("aria-pressed", value);
	  if (value) {
	    const {
	      altTextLearnMoreUrl
	    } = babelHelpers.classPrivateFieldLooseBase(this, _uiManager)[_uiManager].mlManager;
	    if (altTextLearnMoreUrl) {
	      babelHelpers.classPrivateFieldLooseBase(this, _learnMore)[_learnMore].href = altTextLearnMoreUrl;
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _mlGuessAltText)[_mlGuessAltText](isInitial);
	  } else {
	    babelHelpers.classPrivateFieldLooseBase(this, _toggleLoading)[_toggleLoading](false);
	    babelHelpers.classPrivateFieldLooseBase(this, _isAILoading)[_isAILoading] = false;
	    babelHelpers.classPrivateFieldLooseBase(this, _toggleTitleAndDisclaimer)[_toggleTitleAndDisclaimer]();
	  }
	}
	function _toggleNotNow2() {
	  babelHelpers.classPrivateFieldLooseBase(this, _notNowButton)[_notNowButton].classList.toggle("hidden", !babelHelpers.classPrivateFieldLooseBase(this, _firstTime)[_firstTime]);
	  babelHelpers.classPrivateFieldLooseBase(this, _cancelButton)[_cancelButton].classList.toggle("hidden", babelHelpers.classPrivateFieldLooseBase(this, _firstTime)[_firstTime]);
	}
	function _toggleAI2(value) {
	  if (!babelHelpers.classPrivateFieldLooseBase(this, _uiManager)[_uiManager] || babelHelpers.classPrivateFieldLooseBase(this, _hasAI)[_hasAI] === value) {
	    return;
	  }
	  babelHelpers.classPrivateFieldLooseBase(this, _hasAI)[_hasAI] = value;
	  babelHelpers.classPrivateFieldLooseBase(this, _dialog)[_dialog].classList.toggle("noAi", !value);
	  babelHelpers.classPrivateFieldLooseBase(this, _toggleTitleAndDisclaimer)[_toggleTitleAndDisclaimer]();
	}
	function _toggleTitleAndDisclaimer2() {
	  const visible = babelHelpers.classPrivateFieldLooseBase(this, _isAILoading)[_isAILoading] || babelHelpers.classPrivateFieldLooseBase(this, _guessedAltText)[_guessedAltText] && babelHelpers.classPrivateFieldLooseBase(this, _guessedAltText)[_guessedAltText] === babelHelpers.classPrivateFieldLooseBase(this, _textarea)[_textarea].value;
	  babelHelpers.classPrivateFieldLooseBase(this, _disclaimer)[_disclaimer].hidden = !visible;
	  const isEditing = babelHelpers.classPrivateFieldLooseBase(this, _isAILoading)[_isAILoading] || !!babelHelpers.classPrivateFieldLooseBase(this, _textarea)[_textarea].value;
	  if (babelHelpers.classPrivateFieldLooseBase(this, _isEditing)[_isEditing] === isEditing) {
	    return;
	  }
	  babelHelpers.classPrivateFieldLooseBase(this, _isEditing)[_isEditing] = isEditing;
	  babelHelpers.classPrivateFieldLooseBase(this, _title)[_title].setAttribute("data-l10n-id", isEditing ? "pdfjs-editor-new-alt-text-dialog-edit-label" : "pdfjs-editor-new-alt-text-dialog-add-label");
	}
	async function _mlGuessAltText2(isInitial) {
	  if (babelHelpers.classPrivateFieldLooseBase(this, _isAILoading)[_isAILoading]) {
	    return;
	  }
	  if (babelHelpers.classPrivateFieldLooseBase(this, _textarea)[_textarea].value) {
	    return;
	  }
	  if (isInitial && babelHelpers.classPrivateFieldLooseBase(this, _previousAltText)[_previousAltText] !== null) {
	    return;
	  }
	  babelHelpers.classPrivateFieldLooseBase(this, _guessedAltText)[_guessedAltText] = babelHelpers.classPrivateFieldLooseBase(this, _currentEditor)[_currentEditor].guessedAltText;
	  if (babelHelpers.classPrivateFieldLooseBase(this, _previousAltText)[_previousAltText] === null && babelHelpers.classPrivateFieldLooseBase(this, _guessedAltText)[_guessedAltText]) {
	    babelHelpers.classPrivateFieldLooseBase(this, _addAltText)[_addAltText](babelHelpers.classPrivateFieldLooseBase(this, _guessedAltText)[_guessedAltText]);
	    return;
	  }
	  babelHelpers.classPrivateFieldLooseBase(this, _toggleLoading)[_toggleLoading](true);
	  babelHelpers.classPrivateFieldLooseBase(this, _toggleTitleAndDisclaimer)[_toggleTitleAndDisclaimer]();
	  let hasError = false;
	  try {
	    const altText = await babelHelpers.classPrivateFieldLooseBase(this, _currentEditor)[_currentEditor].mlGuessAltText(babelHelpers.classPrivateFieldLooseBase(this, _imageData)[_imageData], false);
	    if (altText) {
	      babelHelpers.classPrivateFieldLooseBase(this, _guessedAltText)[_guessedAltText] = altText;
	      babelHelpers.classPrivateFieldLooseBase(this, _wasAILoading)[_wasAILoading] = babelHelpers.classPrivateFieldLooseBase(this, _isAILoading)[_isAILoading];
	      if (babelHelpers.classPrivateFieldLooseBase(this, _isAILoading)[_isAILoading]) {
	        babelHelpers.classPrivateFieldLooseBase(this, _addAltText)[_addAltText](altText);
	      }
	    }
	  } catch (e) {
	    console.error(e);
	    hasError = true;
	  }
	  babelHelpers.classPrivateFieldLooseBase(this, _toggleLoading)[_toggleLoading](false);
	  babelHelpers.classPrivateFieldLooseBase(this, _toggleTitleAndDisclaimer)[_toggleTitleAndDisclaimer]();
	  if (hasError && babelHelpers.classPrivateFieldLooseBase(this, _uiManager)[_uiManager]) {
	    babelHelpers.classPrivateFieldLooseBase(this, _toggleError)[_toggleError](true);
	  }
	}
	function _addAltText2(altText) {
	  if (!babelHelpers.classPrivateFieldLooseBase(this, _uiManager)[_uiManager] || babelHelpers.classPrivateFieldLooseBase(this, _textarea)[_textarea].value) {
	    return;
	  }
	  babelHelpers.classPrivateFieldLooseBase(this, _textarea)[_textarea].value = altText;
	  babelHelpers.classPrivateFieldLooseBase(this, _toggleTitleAndDisclaimer)[_toggleTitleAndDisclaimer]();
	}
	function _setProgress2() {
	  babelHelpers.classPrivateFieldLooseBase(this, _downloadModel)[_downloadModel].classList.toggle("hidden", false);
	  const callback = async ({
	    detail: {
	      finished,
	      total,
	      totalLoaded
	    }
	  }) => {
	    const ONE_MEGA_BYTES = 1e6;
	    totalLoaded = Math.min(0.99 * total, totalLoaded);
	    const totalSize = babelHelpers.classPrivateFieldLooseBase(this, _downloadModelDescription)[_downloadModelDescription].ariaValueMax = Math.round(total / ONE_MEGA_BYTES);
	    const downloadedSize = babelHelpers.classPrivateFieldLooseBase(this, _downloadModelDescription)[_downloadModelDescription].ariaValueNow = Math.round(totalLoaded / ONE_MEGA_BYTES);
	    babelHelpers.classPrivateFieldLooseBase(this, _downloadModelDescription)[_downloadModelDescription].setAttribute("data-l10n-args", JSON.stringify({
	      totalSize,
	      downloadedSize
	    }));
	    if (!finished) {
	      return;
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _eventBus)[_eventBus]._off("loadaiengineprogress", callback);
	    babelHelpers.classPrivateFieldLooseBase(this, _downloadModel)[_downloadModel].classList.toggle("hidden", true);
	    babelHelpers.classPrivateFieldLooseBase(this, _toggleAI)[_toggleAI](true);
	    if (!babelHelpers.classPrivateFieldLooseBase(this, _uiManager)[_uiManager]) {
	      return;
	    }
	    const {
	      mlManager
	    } = babelHelpers.classPrivateFieldLooseBase(this, _uiManager)[_uiManager];
	    mlManager.toggleService("altText", true);
	    babelHelpers.classPrivateFieldLooseBase(this, _toggleGuessAltText)[_toggleGuessAltText](await mlManager.isEnabledFor("altText"), true);
	  };
	  babelHelpers.classPrivateFieldLooseBase(this, _eventBus)[_eventBus]._on("loadaiengineprogress", callback);
	}
	function _cancel2() {
	  babelHelpers.classPrivateFieldLooseBase(this, _currentEditor)[_currentEditor].altTextData = {
	    cancel: true
	  };
	  const altText = babelHelpers.classPrivateFieldLooseBase(this, _textarea)[_textarea].value.trim();
	  babelHelpers.classPrivateFieldLooseBase(this, _currentEditor)[_currentEditor]._reportTelemetry({
	    action: "pdfjs.image.alt_text.dismiss",
	    data: {
	      alt_text_type: altText ? "present" : "empty",
	      flow: babelHelpers.classPrivateFieldLooseBase(this, _firstTime)[_firstTime] ? "image_add" : "alt_text_edit"
	    }
	  });
	  babelHelpers.classPrivateFieldLooseBase(this, _currentEditor)[_currentEditor]._reportTelemetry({
	    action: "pdfjs.image.image_added",
	    data: {
	      alt_text_modal: true,
	      alt_text_type: "skipped"
	    }
	  });
	  babelHelpers.classPrivateFieldLooseBase(this, _finish)[_finish]();
	}
	function _finish2() {
	  if (babelHelpers.classPrivateFieldLooseBase(this, _overlayManager)[_overlayManager].active === babelHelpers.classPrivateFieldLooseBase(this, _dialog)[_dialog]) {
	    babelHelpers.classPrivateFieldLooseBase(this, _overlayManager)[_overlayManager].close(babelHelpers.classPrivateFieldLooseBase(this, _dialog)[_dialog]);
	  }
	}
	function _close2() {
	  var _babelHelpers$classPr34, _babelHelpers$classPr35;
	  const canvas = babelHelpers.classPrivateFieldLooseBase(this, _imagePreview)[_imagePreview].firstChild;
	  canvas.remove();
	  canvas.width = canvas.height = 0;
	  babelHelpers.classPrivateFieldLooseBase(this, _imageData)[_imageData] = null;
	  babelHelpers.classPrivateFieldLooseBase(this, _toggleLoading)[_toggleLoading](false);
	  (_babelHelpers$classPr34 = babelHelpers.classPrivateFieldLooseBase(this, _uiManager)[_uiManager]) == null ? void 0 : _babelHelpers$classPr34.addEditListeners();
	  babelHelpers.classPrivateFieldLooseBase(this, _currentEditor)[_currentEditor].altTextFinish();
	  (_babelHelpers$classPr35 = babelHelpers.classPrivateFieldLooseBase(this, _uiManager)[_uiManager]) == null ? void 0 : _babelHelpers$classPr35.setSelected(babelHelpers.classPrivateFieldLooseBase(this, _currentEditor)[_currentEditor]);
	  babelHelpers.classPrivateFieldLooseBase(this, _currentEditor)[_currentEditor] = null;
	  babelHelpers.classPrivateFieldLooseBase(this, _uiManager)[_uiManager] = null;
	}
	function _save2() {
	  const altText = babelHelpers.classPrivateFieldLooseBase(this, _textarea)[_textarea].value.trim();
	  babelHelpers.classPrivateFieldLooseBase(this, _currentEditor)[_currentEditor].altTextData = {
	    altText,
	    decorative: false
	  };
	  babelHelpers.classPrivateFieldLooseBase(this, _currentEditor)[_currentEditor].altTextData.guessedAltText = babelHelpers.classPrivateFieldLooseBase(this, _guessedAltText)[_guessedAltText];
	  if (babelHelpers.classPrivateFieldLooseBase(this, _guessedAltText)[_guessedAltText] && babelHelpers.classPrivateFieldLooseBase(this, _guessedAltText)[_guessedAltText] !== altText) {
	    const guessedWords = new Set(babelHelpers.classPrivateFieldLooseBase(this, _guessedAltText)[_guessedAltText].split(/\s+/));
	    const words = new Set(altText.split(/\s+/));
	    babelHelpers.classPrivateFieldLooseBase(this, _currentEditor)[_currentEditor]._reportTelemetry({
	      action: "pdfjs.image.alt_text.user_edit",
	      data: {
	        total_words: guessedWords.size,
	        words_removed: guessedWords.difference(words).size,
	        words_added: words.difference(guessedWords).size
	      }
	    });
	  }
	  babelHelpers.classPrivateFieldLooseBase(this, _currentEditor)[_currentEditor]._reportTelemetry({
	    action: "pdfjs.image.image_added",
	    data: {
	      alt_text_modal: true,
	      alt_text_type: altText ? "present" : "empty"
	    }
	  });
	  babelHelpers.classPrivateFieldLooseBase(this, _currentEditor)[_currentEditor]._reportTelemetry({
	    action: "pdfjs.image.alt_text.save",
	    data: {
	      alt_text_type: altText ? "present" : "empty",
	      flow: babelHelpers.classPrivateFieldLooseBase(this, _firstTime)[_firstTime] ? "image_add" : "alt_text_edit"
	    }
	  });
	  babelHelpers.classPrivateFieldLooseBase(this, _finish)[_finish]();
	}
	var _aiModelSettings = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("aiModelSettings");
	var _createModelButton = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("createModelButton");
	var _downloadModelButton = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("downloadModelButton");
	var _dialog2 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("dialog");
	var _eventBus2 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("eventBus");
	var _mlManager2 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("mlManager");
	var _overlayManager2 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("overlayManager");
	var _showAltTextDialogButton = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("showAltTextDialogButton");
	var _reportTelemetry = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("reportTelemetry");
	var _download = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("download");
	var _delete = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("delete");
	var _togglePref = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("togglePref");
	var _setPref = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("setPref");
	var _finish3 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("finish");
	class ImageAltTextSettings {
	  constructor({
	    dialog,
	    createModelButton,
	    aiModelSettings,
	    learnMore,
	    closeButton,
	    deleteModelButton,
	    downloadModelButton,
	    showAltTextDialogButton
	  }, overlayManager, eventBus, mlManager) {
	    Object.defineProperty(this, _finish3, {
	      value: _finish4
	    });
	    Object.defineProperty(this, _setPref, {
	      value: _setPref2
	    });
	    Object.defineProperty(this, _togglePref, {
	      value: _togglePref2
	    });
	    Object.defineProperty(this, _delete, {
	      value: _delete2
	    });
	    Object.defineProperty(this, _download, {
	      value: _download2
	    });
	    Object.defineProperty(this, _reportTelemetry, {
	      value: _reportTelemetry2
	    });
	    Object.defineProperty(this, _aiModelSettings, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _createModelButton, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _downloadModelButton, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _dialog2, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _eventBus2, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _mlManager2, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _overlayManager2, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _showAltTextDialogButton, {
	      writable: true,
	      value: void 0
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _dialog2)[_dialog2] = dialog;
	    babelHelpers.classPrivateFieldLooseBase(this, _aiModelSettings)[_aiModelSettings] = aiModelSettings;
	    babelHelpers.classPrivateFieldLooseBase(this, _createModelButton)[_createModelButton] = createModelButton;
	    babelHelpers.classPrivateFieldLooseBase(this, _downloadModelButton)[_downloadModelButton] = downloadModelButton;
	    babelHelpers.classPrivateFieldLooseBase(this, _showAltTextDialogButton)[_showAltTextDialogButton] = showAltTextDialogButton;
	    babelHelpers.classPrivateFieldLooseBase(this, _overlayManager2)[_overlayManager2] = overlayManager;
	    babelHelpers.classPrivateFieldLooseBase(this, _eventBus2)[_eventBus2] = eventBus;
	    babelHelpers.classPrivateFieldLooseBase(this, _mlManager2)[_mlManager2] = mlManager;
	    const {
	      altTextLearnMoreUrl
	    } = mlManager;
	    if (altTextLearnMoreUrl) {
	      learnMore.href = altTextLearnMoreUrl;
	    }
	    dialog.addEventListener("contextmenu", noContextMenu);
	    createModelButton.addEventListener("click", async e => {
	      const checked = babelHelpers.classPrivateFieldLooseBase(this, _togglePref)[_togglePref]("enableGuessAltText", e);
	      await mlManager.toggleService("altText", checked);
	      babelHelpers.classPrivateFieldLooseBase(this, _reportTelemetry)[_reportTelemetry]({
	        type: "stamp",
	        action: "pdfjs.image.alt_text.settings_ai_generation_check",
	        data: {
	          status: checked
	        }
	      });
	    });
	    showAltTextDialogButton.addEventListener("click", e => {
	      const checked = babelHelpers.classPrivateFieldLooseBase(this, _togglePref)[_togglePref]("enableNewAltTextWhenAddingImage", e);
	      babelHelpers.classPrivateFieldLooseBase(this, _reportTelemetry)[_reportTelemetry]({
	        type: "stamp",
	        action: "pdfjs.image.alt_text.settings_edit_alt_text_check",
	        data: {
	          status: checked
	        }
	      });
	    });
	    deleteModelButton.addEventListener("click", babelHelpers.classPrivateFieldLooseBase(this, _delete)[_delete].bind(this, true));
	    downloadModelButton.addEventListener("click", babelHelpers.classPrivateFieldLooseBase(this, _download)[_download].bind(this, true));
	    closeButton.addEventListener("click", babelHelpers.classPrivateFieldLooseBase(this, _finish3)[_finish3].bind(this));
	    learnMore.addEventListener("click", () => {
	      babelHelpers.classPrivateFieldLooseBase(this, _reportTelemetry)[_reportTelemetry]({
	        type: "stamp",
	        action: "pdfjs.image.alt_text.info",
	        data: {
	          topic: "ai_generation"
	        }
	      });
	    });
	    eventBus._on("enablealttextmodeldownload", ({
	      value
	    }) => {
	      if (value) {
	        babelHelpers.classPrivateFieldLooseBase(this, _download)[_download](false);
	      } else {
	        babelHelpers.classPrivateFieldLooseBase(this, _delete)[_delete](false);
	      }
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _overlayManager2)[_overlayManager2].register(dialog);
	  }
	  async open({
	    enableGuessAltText,
	    enableNewAltTextWhenAddingImage
	  }) {
	    const {
	      enableAltTextModelDownload
	    } = babelHelpers.classPrivateFieldLooseBase(this, _mlManager2)[_mlManager2];
	    babelHelpers.classPrivateFieldLooseBase(this, _createModelButton)[_createModelButton].disabled = !enableAltTextModelDownload;
	    babelHelpers.classPrivateFieldLooseBase(this, _createModelButton)[_createModelButton].setAttribute("aria-pressed", enableAltTextModelDownload && enableGuessAltText);
	    babelHelpers.classPrivateFieldLooseBase(this, _showAltTextDialogButton)[_showAltTextDialogButton].setAttribute("aria-pressed", enableNewAltTextWhenAddingImage);
	    babelHelpers.classPrivateFieldLooseBase(this, _aiModelSettings)[_aiModelSettings].classList.toggle("download", !enableAltTextModelDownload);
	    await babelHelpers.classPrivateFieldLooseBase(this, _overlayManager2)[_overlayManager2].open(babelHelpers.classPrivateFieldLooseBase(this, _dialog2)[_dialog2]);
	    babelHelpers.classPrivateFieldLooseBase(this, _reportTelemetry)[_reportTelemetry]({
	      type: "stamp",
	      action: "pdfjs.image.alt_text.settings_displayed"
	    });
	  }
	}
	function _reportTelemetry2(data) {
	  babelHelpers.classPrivateFieldLooseBase(this, _eventBus2)[_eventBus2].dispatch("reporttelemetry", {
	    source: this,
	    details: {
	      type: "editing",
	      data
	    }
	  });
	}
	async function _download2(isFromUI = false) {
	  if (isFromUI) {
	    babelHelpers.classPrivateFieldLooseBase(this, _downloadModelButton)[_downloadModelButton].disabled = true;
	    const span = babelHelpers.classPrivateFieldLooseBase(this, _downloadModelButton)[_downloadModelButton].firstChild;
	    span.setAttribute("data-l10n-id", "pdfjs-editor-alt-text-settings-downloading-model-button");
	    await babelHelpers.classPrivateFieldLooseBase(this, _mlManager2)[_mlManager2].downloadModel("altText");
	    span.setAttribute("data-l10n-id", "pdfjs-editor-alt-text-settings-download-model-button");
	    babelHelpers.classPrivateFieldLooseBase(this, _createModelButton)[_createModelButton].disabled = false;
	    babelHelpers.classPrivateFieldLooseBase(this, _setPref)[_setPref]("enableGuessAltText", true);
	    babelHelpers.classPrivateFieldLooseBase(this, _mlManager2)[_mlManager2].toggleService("altText", true);
	    babelHelpers.classPrivateFieldLooseBase(this, _setPref)[_setPref]("enableAltTextModelDownload", true);
	    babelHelpers.classPrivateFieldLooseBase(this, _downloadModelButton)[_downloadModelButton].disabled = false;
	  }
	  babelHelpers.classPrivateFieldLooseBase(this, _aiModelSettings)[_aiModelSettings].classList.toggle("download", false);
	  babelHelpers.classPrivateFieldLooseBase(this, _createModelButton)[_createModelButton].setAttribute("aria-pressed", true);
	}
	async function _delete2(isFromUI = false) {
	  if (isFromUI) {
	    await babelHelpers.classPrivateFieldLooseBase(this, _mlManager2)[_mlManager2].deleteModel("altText");
	    babelHelpers.classPrivateFieldLooseBase(this, _setPref)[_setPref]("enableGuessAltText", false);
	    babelHelpers.classPrivateFieldLooseBase(this, _setPref)[_setPref]("enableAltTextModelDownload", false);
	  }
	  babelHelpers.classPrivateFieldLooseBase(this, _aiModelSettings)[_aiModelSettings].classList.toggle("download", true);
	  babelHelpers.classPrivateFieldLooseBase(this, _createModelButton)[_createModelButton].disabled = true;
	  babelHelpers.classPrivateFieldLooseBase(this, _createModelButton)[_createModelButton].setAttribute("aria-pressed", false);
	}
	function _togglePref2(name, {
	  target
	}) {
	  const checked = target.getAttribute("aria-pressed") !== "true";
	  babelHelpers.classPrivateFieldLooseBase(this, _setPref)[_setPref](name, checked);
	  target.setAttribute("aria-pressed", checked);
	  return checked;
	}
	function _setPref2(name, value) {
	  babelHelpers.classPrivateFieldLooseBase(this, _eventBus2)[_eventBus2].dispatch("setpreference", {
	    source: this,
	    name,
	    value
	  });
	}
	function _finish4() {
	  if (babelHelpers.classPrivateFieldLooseBase(this, _overlayManager2)[_overlayManager2].active === babelHelpers.classPrivateFieldLooseBase(this, _dialog2)[_dialog2]) {
	    babelHelpers.classPrivateFieldLooseBase(this, _overlayManager2)[_overlayManager2].close(babelHelpers.classPrivateFieldLooseBase(this, _dialog2)[_dialog2]);
	  }
	}
	var _clickAC = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("clickAC");
	var _currentEditor2 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("currentEditor");
	var _cancelButton2 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("cancelButton");
	var _dialog3 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("dialog");
	var _eventBus3 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("eventBus");
	var _hasUsedPointer = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("hasUsedPointer");
	var _optionDescription = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("optionDescription");
	var _optionDecorative = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("optionDecorative");
	var _overlayManager3 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("overlayManager");
	var _saveButton = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("saveButton");
	var _textarea2 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("textarea");
	var _uiManager2 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("uiManager");
	var _previousAltText2 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("previousAltText");
	var _resizeAC = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("resizeAC");
	var _svgElement = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("svgElement");
	var _rectElement = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("rectElement");
	var _container = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("container");
	var _telemetryData = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("telemetryData");
	var _createSVGElement = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("createSVGElement");
	var _setPosition = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("setPosition");
	var _finish5 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("finish");
	var _close3 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("close");
	var _updateUIState = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("updateUIState");
	var _save3 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("save");
	var _onClick = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onClick");
	var _removeOnClickListeners = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("removeOnClickListeners");
	class AltTextManager {
	  constructor({
	    dialog: _dialog4,
	    optionDescription,
	    optionDecorative,
	    textarea,
	    cancelButton,
	    saveButton
	  }, container, overlayManager, eventBus) {
	    Object.defineProperty(this, _removeOnClickListeners, {
	      value: _removeOnClickListeners2
	    });
	    Object.defineProperty(this, _onClick, {
	      value: _onClick2
	    });
	    Object.defineProperty(this, _save3, {
	      value: _save4
	    });
	    Object.defineProperty(this, _updateUIState, {
	      value: _updateUIState2
	    });
	    Object.defineProperty(this, _close3, {
	      value: _close4
	    });
	    Object.defineProperty(this, _finish5, {
	      value: _finish6
	    });
	    Object.defineProperty(this, _setPosition, {
	      value: _setPosition2
	    });
	    Object.defineProperty(this, _createSVGElement, {
	      value: _createSVGElement2
	    });
	    Object.defineProperty(this, _clickAC, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _currentEditor2, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _cancelButton2, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _dialog3, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _eventBus3, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _hasUsedPointer, {
	      writable: true,
	      value: false
	    });
	    Object.defineProperty(this, _optionDescription, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _optionDecorative, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _overlayManager3, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _saveButton, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _textarea2, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _uiManager2, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _previousAltText2, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _resizeAC, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _svgElement, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _rectElement, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _container, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _telemetryData, {
	      writable: true,
	      value: null
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _dialog3)[_dialog3] = _dialog4;
	    babelHelpers.classPrivateFieldLooseBase(this, _optionDescription)[_optionDescription] = optionDescription;
	    babelHelpers.classPrivateFieldLooseBase(this, _optionDecorative)[_optionDecorative] = optionDecorative;
	    babelHelpers.classPrivateFieldLooseBase(this, _textarea2)[_textarea2] = textarea;
	    babelHelpers.classPrivateFieldLooseBase(this, _cancelButton2)[_cancelButton2] = cancelButton;
	    babelHelpers.classPrivateFieldLooseBase(this, _saveButton)[_saveButton] = saveButton;
	    babelHelpers.classPrivateFieldLooseBase(this, _overlayManager3)[_overlayManager3] = overlayManager;
	    babelHelpers.classPrivateFieldLooseBase(this, _eventBus3)[_eventBus3] = eventBus;
	    babelHelpers.classPrivateFieldLooseBase(this, _container)[_container] = container;
	    const onUpdateUIState = babelHelpers.classPrivateFieldLooseBase(this, _updateUIState)[_updateUIState].bind(this);
	    _dialog4.addEventListener("close", babelHelpers.classPrivateFieldLooseBase(this, _close3)[_close3].bind(this));
	    _dialog4.addEventListener("contextmenu", event => {
	      if (event.target !== babelHelpers.classPrivateFieldLooseBase(this, _textarea2)[_textarea2]) {
	        event.preventDefault();
	      }
	    });
	    cancelButton.addEventListener("click", babelHelpers.classPrivateFieldLooseBase(this, _finish5)[_finish5].bind(this));
	    saveButton.addEventListener("click", babelHelpers.classPrivateFieldLooseBase(this, _save3)[_save3].bind(this));
	    optionDescription.addEventListener("change", onUpdateUIState);
	    optionDecorative.addEventListener("change", onUpdateUIState);
	    babelHelpers.classPrivateFieldLooseBase(this, _overlayManager3)[_overlayManager3].register(_dialog4);
	  }
	  async editAltText(uiManager, editor) {
	    if (babelHelpers.classPrivateFieldLooseBase(this, _currentEditor2)[_currentEditor2] || !editor) {
	      return;
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _createSVGElement)[_createSVGElement]();
	    babelHelpers.classPrivateFieldLooseBase(this, _hasUsedPointer)[_hasUsedPointer] = false;
	    babelHelpers.classPrivateFieldLooseBase(this, _clickAC)[_clickAC] = new AbortController();
	    const clickOpts = {
	        signal: babelHelpers.classPrivateFieldLooseBase(this, _clickAC)[_clickAC].signal
	      },
	      onClick = babelHelpers.classPrivateFieldLooseBase(this, _onClick)[_onClick].bind(this);
	    for (const element of [babelHelpers.classPrivateFieldLooseBase(this, _optionDescription)[_optionDescription], babelHelpers.classPrivateFieldLooseBase(this, _optionDecorative)[_optionDecorative], babelHelpers.classPrivateFieldLooseBase(this, _textarea2)[_textarea2], babelHelpers.classPrivateFieldLooseBase(this, _saveButton)[_saveButton], babelHelpers.classPrivateFieldLooseBase(this, _cancelButton2)[_cancelButton2]]) {
	      element.addEventListener("click", onClick, clickOpts);
	    }
	    const {
	      altText,
	      decorative
	    } = editor.altTextData;
	    if (decorative === true) {
	      babelHelpers.classPrivateFieldLooseBase(this, _optionDecorative)[_optionDecorative].checked = true;
	      babelHelpers.classPrivateFieldLooseBase(this, _optionDescription)[_optionDescription].checked = false;
	    } else {
	      babelHelpers.classPrivateFieldLooseBase(this, _optionDecorative)[_optionDecorative].checked = false;
	      babelHelpers.classPrivateFieldLooseBase(this, _optionDescription)[_optionDescription].checked = true;
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _previousAltText2)[_previousAltText2] = babelHelpers.classPrivateFieldLooseBase(this, _textarea2)[_textarea2].value = (altText == null ? void 0 : altText.trim()) || "";
	    babelHelpers.classPrivateFieldLooseBase(this, _updateUIState)[_updateUIState]();
	    babelHelpers.classPrivateFieldLooseBase(this, _currentEditor2)[_currentEditor2] = editor;
	    babelHelpers.classPrivateFieldLooseBase(this, _uiManager2)[_uiManager2] = uiManager;
	    babelHelpers.classPrivateFieldLooseBase(this, _uiManager2)[_uiManager2].removeEditListeners();
	    babelHelpers.classPrivateFieldLooseBase(this, _resizeAC)[_resizeAC] = new AbortController();
	    babelHelpers.classPrivateFieldLooseBase(this, _eventBus3)[_eventBus3]._on("resize", babelHelpers.classPrivateFieldLooseBase(this, _setPosition)[_setPosition].bind(this), {
	      signal: babelHelpers.classPrivateFieldLooseBase(this, _resizeAC)[_resizeAC].signal
	    });
	    try {
	      await babelHelpers.classPrivateFieldLooseBase(this, _overlayManager3)[_overlayManager3].open(babelHelpers.classPrivateFieldLooseBase(this, _dialog3)[_dialog3]);
	      babelHelpers.classPrivateFieldLooseBase(this, _setPosition)[_setPosition]();
	    } catch (ex) {
	      babelHelpers.classPrivateFieldLooseBase(this, _close3)[_close3]();
	      throw ex;
	    }
	  }
	  destroy() {
	    var _babelHelpers$classPr3;
	    babelHelpers.classPrivateFieldLooseBase(this, _uiManager2)[_uiManager2] = null;
	    babelHelpers.classPrivateFieldLooseBase(this, _finish5)[_finish5]();
	    (_babelHelpers$classPr3 = babelHelpers.classPrivateFieldLooseBase(this, _svgElement)[_svgElement]) == null ? void 0 : _babelHelpers$classPr3.remove();
	    babelHelpers.classPrivateFieldLooseBase(this, _svgElement)[_svgElement] = babelHelpers.classPrivateFieldLooseBase(this, _rectElement)[_rectElement] = null;
	  }
	}
	function _createSVGElement2() {
	  if (babelHelpers.classPrivateFieldLooseBase(this, _svgElement)[_svgElement]) {
	    return;
	  }
	  const svgFactory = new DOMSVGFactory();
	  const svg = babelHelpers.classPrivateFieldLooseBase(this, _svgElement)[_svgElement] = svgFactory.createElement("svg");
	  svg.setAttribute("width", "0");
	  svg.setAttribute("height", "0");
	  const defs = svgFactory.createElement("defs");
	  svg.append(defs);
	  const mask = svgFactory.createElement("mask");
	  defs.append(mask);
	  mask.setAttribute("id", "alttext-manager-mask");
	  mask.setAttribute("maskContentUnits", "objectBoundingBox");
	  let rect = svgFactory.createElement("rect");
	  mask.append(rect);
	  rect.setAttribute("fill", "white");
	  rect.setAttribute("width", "1");
	  rect.setAttribute("height", "1");
	  rect.setAttribute("x", "0");
	  rect.setAttribute("y", "0");
	  rect = babelHelpers.classPrivateFieldLooseBase(this, _rectElement)[_rectElement] = svgFactory.createElement("rect");
	  mask.append(rect);
	  rect.setAttribute("fill", "black");
	  babelHelpers.classPrivateFieldLooseBase(this, _dialog3)[_dialog3].append(svg);
	}
	function _setPosition2() {
	  if (!babelHelpers.classPrivateFieldLooseBase(this, _currentEditor2)[_currentEditor2]) {
	    return;
	  }
	  const dialog = babelHelpers.classPrivateFieldLooseBase(this, _dialog3)[_dialog3];
	  const {
	    style
	  } = dialog;
	  const {
	    x: containerX,
	    y: containerY,
	    width: containerW,
	    height: containerH
	  } = babelHelpers.classPrivateFieldLooseBase(this, _container)[_container].getBoundingClientRect();
	  const {
	    innerWidth: windowW,
	    innerHeight: windowH
	  } = window;
	  const {
	    width: dialogW,
	    height: dialogH
	  } = dialog.getBoundingClientRect();
	  const {
	    x,
	    y,
	    width,
	    height
	  } = babelHelpers.classPrivateFieldLooseBase(this, _currentEditor2)[_currentEditor2].getClientDimensions();
	  const MARGIN = 10;
	  const isLTR = babelHelpers.classPrivateFieldLooseBase(this, _uiManager2)[_uiManager2].direction === "ltr";
	  const xs = Math.max(x, containerX);
	  const xe = Math.min(x + width, containerX + containerW);
	  const ys = Math.max(y, containerY);
	  const ye = Math.min(y + height, containerY + containerH);
	  babelHelpers.classPrivateFieldLooseBase(this, _rectElement)[_rectElement].setAttribute("width", `${(xe - xs) / windowW}`);
	  babelHelpers.classPrivateFieldLooseBase(this, _rectElement)[_rectElement].setAttribute("height", `${(ye - ys) / windowH}`);
	  babelHelpers.classPrivateFieldLooseBase(this, _rectElement)[_rectElement].setAttribute("x", `${xs / windowW}`);
	  babelHelpers.classPrivateFieldLooseBase(this, _rectElement)[_rectElement].setAttribute("y", `${ys / windowH}`);
	  let left = null;
	  let top = Math.max(y, 0);
	  top += Math.min(windowH - (top + dialogH), 0);
	  if (isLTR) {
	    if (x + width + MARGIN + dialogW < windowW) {
	      left = x + width + MARGIN;
	    } else if (x > dialogW + MARGIN) {
	      left = x - dialogW - MARGIN;
	    }
	  } else if (x > dialogW + MARGIN) {
	    left = x - dialogW - MARGIN;
	  } else if (x + width + MARGIN + dialogW < windowW) {
	    left = x + width + MARGIN;
	  }
	  if (left === null) {
	    top = null;
	    left = Math.max(x, 0);
	    left += Math.min(windowW - (left + dialogW), 0);
	    if (y > dialogH + MARGIN) {
	      top = y - dialogH - MARGIN;
	    } else if (y + height + MARGIN + dialogH < windowH) {
	      top = y + height + MARGIN;
	    }
	  }
	  if (top !== null) {
	    dialog.classList.add("positioned");
	    if (isLTR) {
	      style.left = `${left}px`;
	    } else {
	      style.right = `${windowW - left - dialogW}px`;
	    }
	    style.top = `${top}px`;
	  } else {
	    dialog.classList.remove("positioned");
	    style.left = "";
	    style.top = "";
	  }
	}
	function _finish6() {
	  if (babelHelpers.classPrivateFieldLooseBase(this, _overlayManager3)[_overlayManager3].active === babelHelpers.classPrivateFieldLooseBase(this, _dialog3)[_dialog3]) {
	    babelHelpers.classPrivateFieldLooseBase(this, _overlayManager3)[_overlayManager3].close(babelHelpers.classPrivateFieldLooseBase(this, _dialog3)[_dialog3]);
	  }
	}
	function _close4() {
	  var _babelHelpers$classPr36, _babelHelpers$classPr37;
	  babelHelpers.classPrivateFieldLooseBase(this, _currentEditor2)[_currentEditor2]._reportTelemetry(babelHelpers.classPrivateFieldLooseBase(this, _telemetryData)[_telemetryData] || {
	    action: "alt_text_cancel",
	    alt_text_keyboard: !babelHelpers.classPrivateFieldLooseBase(this, _hasUsedPointer)[_hasUsedPointer]
	  });
	  babelHelpers.classPrivateFieldLooseBase(this, _telemetryData)[_telemetryData] = null;
	  babelHelpers.classPrivateFieldLooseBase(this, _removeOnClickListeners)[_removeOnClickListeners]();
	  (_babelHelpers$classPr36 = babelHelpers.classPrivateFieldLooseBase(this, _uiManager2)[_uiManager2]) == null ? void 0 : _babelHelpers$classPr36.addEditListeners();
	  (_babelHelpers$classPr37 = babelHelpers.classPrivateFieldLooseBase(this, _resizeAC)[_resizeAC]) == null ? void 0 : _babelHelpers$classPr37.abort();
	  babelHelpers.classPrivateFieldLooseBase(this, _resizeAC)[_resizeAC] = null;
	  babelHelpers.classPrivateFieldLooseBase(this, _currentEditor2)[_currentEditor2].altTextFinish();
	  babelHelpers.classPrivateFieldLooseBase(this, _currentEditor2)[_currentEditor2] = null;
	  babelHelpers.classPrivateFieldLooseBase(this, _uiManager2)[_uiManager2] = null;
	}
	function _updateUIState2() {
	  babelHelpers.classPrivateFieldLooseBase(this, _textarea2)[_textarea2].disabled = babelHelpers.classPrivateFieldLooseBase(this, _optionDecorative)[_optionDecorative].checked;
	}
	function _save4() {
	  const altText = babelHelpers.classPrivateFieldLooseBase(this, _textarea2)[_textarea2].value.trim();
	  const decorative = babelHelpers.classPrivateFieldLooseBase(this, _optionDecorative)[_optionDecorative].checked;
	  babelHelpers.classPrivateFieldLooseBase(this, _currentEditor2)[_currentEditor2].altTextData = {
	    altText,
	    decorative
	  };
	  babelHelpers.classPrivateFieldLooseBase(this, _telemetryData)[_telemetryData] = {
	    action: "alt_text_save",
	    alt_text_description: !!altText,
	    alt_text_edit: !!babelHelpers.classPrivateFieldLooseBase(this, _previousAltText2)[_previousAltText2] && babelHelpers.classPrivateFieldLooseBase(this, _previousAltText2)[_previousAltText2] !== altText,
	    alt_text_decorative: decorative,
	    alt_text_keyboard: !babelHelpers.classPrivateFieldLooseBase(this, _hasUsedPointer)[_hasUsedPointer]
	  };
	  babelHelpers.classPrivateFieldLooseBase(this, _finish5)[_finish5]();
	}
	function _onClick2(evt) {
	  if (evt.detail === 0) {
	    return;
	  }
	  babelHelpers.classPrivateFieldLooseBase(this, _hasUsedPointer)[_hasUsedPointer] = true;
	  babelHelpers.classPrivateFieldLooseBase(this, _removeOnClickListeners)[_removeOnClickListeners]();
	}
	function _removeOnClickListeners2() {
	  var _babelHelpers$classPr38;
	  (_babelHelpers$classPr38 = babelHelpers.classPrivateFieldLooseBase(this, _clickAC)[_clickAC]) == null ? void 0 : _babelHelpers$classPr38.abort();
	  babelHelpers.classPrivateFieldLooseBase(this, _clickAC)[_clickAC] = null;
	}
	var _bindListeners = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("bindListeners");
	class AnnotationEditorParams {
	  constructor(options, eventBus) {
	    Object.defineProperty(this, _bindListeners, {
	      value: _bindListeners2
	    });
	    this.eventBus = eventBus;
	    babelHelpers.classPrivateFieldLooseBase(this, _bindListeners)[_bindListeners](options);
	  }
	}
	function _bindListeners2({
	  editorFreeTextFontSize,
	  editorFreeTextColor,
	  editorInkColor,
	  editorInkThickness,
	  editorInkOpacity,
	  editorStampAddImage,
	  editorFreeHighlightThickness,
	  editorHighlightShowAll
	}) {
	  const dispatchEvent = (typeStr, value) => {
	    this.eventBus.dispatch("switchannotationeditorparams", {
	      source: this,
	      type: AnnotationEditorParamsType[typeStr],
	      value
	    });
	  };
	  editorFreeTextFontSize.addEventListener("input", function () {
	    dispatchEvent("FREETEXT_SIZE", this.valueAsNumber);
	  });
	  editorFreeTextColor.addEventListener("input", function () {
	    dispatchEvent("FREETEXT_COLOR", this.value);
	  });
	  editorInkColor.addEventListener("input", function () {
	    dispatchEvent("INK_COLOR", this.value);
	  });
	  editorInkThickness.addEventListener("input", function () {
	    dispatchEvent("INK_THICKNESS", this.valueAsNumber);
	  });
	  editorInkOpacity.addEventListener("input", function () {
	    dispatchEvent("INK_OPACITY", this.valueAsNumber);
	  });
	  editorStampAddImage.addEventListener("click", () => {
	    this.eventBus.dispatch("reporttelemetry", {
	      source: this,
	      details: {
	        type: "editing",
	        data: {
	          action: "pdfjs.image.add_image_click"
	        }
	      }
	    });
	    dispatchEvent("CREATE");
	  });
	  editorFreeHighlightThickness.addEventListener("input", function () {
	    dispatchEvent("HIGHLIGHT_THICKNESS", this.valueAsNumber);
	  });
	  editorHighlightShowAll.addEventListener("click", function () {
	    const checked = this.getAttribute("aria-pressed") === "true";
	    this.setAttribute("aria-pressed", !checked);
	    dispatchEvent("HIGHLIGHT_SHOW_ALL", !checked);
	  });
	  this.eventBus._on("annotationeditorparamschanged", evt => {
	    for (const [type, value] of evt.details) {
	      switch (type) {
	        case AnnotationEditorParamsType.FREETEXT_SIZE:
	          editorFreeTextFontSize.value = value;
	          break;
	        case AnnotationEditorParamsType.FREETEXT_COLOR:
	          editorFreeTextColor.value = value;
	          break;
	        case AnnotationEditorParamsType.INK_COLOR:
	          editorInkColor.value = value;
	          break;
	        case AnnotationEditorParamsType.INK_THICKNESS:
	          editorInkThickness.value = value;
	          break;
	        case AnnotationEditorParamsType.INK_OPACITY:
	          editorInkOpacity.value = value;
	          break;
	        case AnnotationEditorParamsType.HIGHLIGHT_THICKNESS:
	          editorFreeHighlightThickness.value = value;
	          break;
	        case AnnotationEditorParamsType.HIGHLIGHT_FREE:
	          editorFreeHighlightThickness.disabled = !value;
	          break;
	        case AnnotationEditorParamsType.HIGHLIGHT_SHOW_ALL:
	          editorHighlightShowAll.setAttribute("aria-pressed", value);
	          break;
	      }
	    }
	  });
	}
	const PRECISION = 1e-1;
	var _mainContainer = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("mainContainer");
	var _toolBarHeight = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("toolBarHeight");
	var _viewerContainer = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("viewerContainer");
	var _isOnSameLine = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isOnSameLine");
	var _isUnderOver = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isUnderOver");
	var _isVisible = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isVisible");
	var _getCaretPosition = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getCaretPosition");
	var _caretPositionFromPoint = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("caretPositionFromPoint");
	var _setCaretPositionHelper = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("setCaretPositionHelper");
	var _setCaretPosition = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("setCaretPosition");
	var _getNodeOnNextPage = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getNodeOnNextPage");
	class CaretBrowsingMode {
	  constructor(abortSignal, mainContainer, viewerContainer, toolbarContainer) {
	    Object.defineProperty(this, _getNodeOnNextPage, {
	      value: _getNodeOnNextPage2
	    });
	    Object.defineProperty(this, _setCaretPosition, {
	      value: _setCaretPosition2
	    });
	    Object.defineProperty(this, _setCaretPositionHelper, {
	      value: _setCaretPositionHelper2
	    });
	    Object.defineProperty(this, _getCaretPosition, {
	      value: _getCaretPosition2
	    });
	    Object.defineProperty(this, _isVisible, {
	      value: _isVisible2
	    });
	    Object.defineProperty(this, _isUnderOver, {
	      value: _isUnderOver2
	    });
	    Object.defineProperty(this, _isOnSameLine, {
	      value: _isOnSameLine2
	    });
	    Object.defineProperty(this, _mainContainer, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _toolBarHeight, {
	      writable: true,
	      value: 0
	    });
	    Object.defineProperty(this, _viewerContainer, {
	      writable: true,
	      value: void 0
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _mainContainer)[_mainContainer] = mainContainer;
	    babelHelpers.classPrivateFieldLooseBase(this, _viewerContainer)[_viewerContainer] = viewerContainer;
	    if (!toolbarContainer) {
	      return;
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _toolBarHeight)[_toolBarHeight] = toolbarContainer.getBoundingClientRect().height;
	    const toolbarObserver = new ResizeObserver(entries => {
	      for (const entry of entries) {
	        if (entry.target === toolbarContainer) {
	          babelHelpers.classPrivateFieldLooseBase(this, _toolBarHeight)[_toolBarHeight] = Math.floor(entry.borderBoxSize[0].blockSize);
	          break;
	        }
	      }
	    });
	    toolbarObserver.observe(toolbarContainer);
	    abortSignal.addEventListener("abort", () => toolbarObserver.disconnect(), {
	      once: true
	    });
	  }
	  moveCaret(isUp, select) {
	    const selection = document.getSelection();
	    if (selection.rangeCount === 0) {
	      return;
	    }
	    const {
	      focusNode
	    } = selection;
	    const focusElement = focusNode.nodeType !== Node.ELEMENT_NODE ? focusNode.parentElement : focusNode;
	    const root = focusElement.closest(".textLayer");
	    if (!root) {
	      return;
	    }
	    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
	    walker.currentNode = focusNode;
	    const focusRect = focusElement.getBoundingClientRect();
	    let newLineElement = null;
	    const nodeIterator = (isUp ? walker.previousSibling : walker.nextSibling).bind(walker);
	    while (nodeIterator()) {
	      const element = walker.currentNode.parentElement;
	      if (!babelHelpers.classPrivateFieldLooseBase(this, _isOnSameLine)[_isOnSameLine](focusRect, element.getBoundingClientRect())) {
	        newLineElement = element;
	        break;
	      }
	    }
	    if (!newLineElement) {
	      const node = babelHelpers.classPrivateFieldLooseBase(this, _getNodeOnNextPage)[_getNodeOnNextPage](root, isUp);
	      if (!node) {
	        return;
	      }
	      if (select) {
	        const lastNode = (isUp ? walker.firstChild() : walker.lastChild()) || focusNode;
	        selection.extend(lastNode, isUp ? 0 : lastNode.length);
	        const range = document.createRange();
	        range.setStart(node, isUp ? node.length : 0);
	        range.setEnd(node, isUp ? node.length : 0);
	        selection.addRange(range);
	        return;
	      }
	      const [caretX] = babelHelpers.classPrivateFieldLooseBase(this, _getCaretPosition)[_getCaretPosition](selection, isUp);
	      const {
	        parentElement
	      } = node;
	      babelHelpers.classPrivateFieldLooseBase(this, _setCaretPosition)[_setCaretPosition](select, selection, parentElement, parentElement.getBoundingClientRect(), caretX);
	      return;
	    }
	    const [caretX, caretY] = babelHelpers.classPrivateFieldLooseBase(this, _getCaretPosition)[_getCaretPosition](selection, isUp);
	    const newLineElementRect = newLineElement.getBoundingClientRect();
	    if (babelHelpers.classPrivateFieldLooseBase(this, _isUnderOver)[_isUnderOver](newLineElementRect, caretX, caretY, isUp)) {
	      babelHelpers.classPrivateFieldLooseBase(this, _setCaretPosition)[_setCaretPosition](select, selection, newLineElement, newLineElementRect, caretX);
	      return;
	    }
	    while (nodeIterator()) {
	      const element = walker.currentNode.parentElement;
	      const elementRect = element.getBoundingClientRect();
	      if (!babelHelpers.classPrivateFieldLooseBase(this, _isOnSameLine)[_isOnSameLine](newLineElementRect, elementRect)) {
	        break;
	      }
	      if (babelHelpers.classPrivateFieldLooseBase(this, _isUnderOver)[_isUnderOver](elementRect, caretX, caretY, isUp)) {
	        babelHelpers.classPrivateFieldLooseBase(this, _setCaretPosition)[_setCaretPosition](select, selection, element, elementRect, caretX);
	        return;
	      }
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _setCaretPosition)[_setCaretPosition](select, selection, newLineElement, newLineElementRect, caretX);
	  }
	}
	function _isOnSameLine2(rect1, rect2) {
	  const top1 = rect1.y;
	  const bot1 = rect1.bottom;
	  const mid1 = rect1.y + rect1.height / 2;
	  const top2 = rect2.y;
	  const bot2 = rect2.bottom;
	  const mid2 = rect2.y + rect2.height / 2;
	  return top1 <= mid2 && mid2 <= bot1 || top2 <= mid1 && mid1 <= bot2;
	}
	function _isUnderOver2(rect, x, y, isUp) {
	  const midY = rect.y + rect.height / 2;
	  return (isUp ? y >= midY : y <= midY) && rect.x - PRECISION <= x && x <= rect.right + PRECISION;
	}
	function _isVisible2(rect) {
	  return rect.top >= babelHelpers.classPrivateFieldLooseBase(this, _toolBarHeight)[_toolBarHeight] && rect.left >= 0 && rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) && rect.right <= (window.innerWidth || document.documentElement.clientWidth);
	}
	function _getCaretPosition2(selection, isUp) {
	  const {
	    focusNode,
	    focusOffset
	  } = selection;
	  const range = document.createRange();
	  range.setStart(focusNode, focusOffset);
	  range.setEnd(focusNode, focusOffset);
	  const rect = range.getBoundingClientRect();
	  return [rect.x, isUp ? rect.top : rect.bottom];
	}
	function _caretPositionFromPoint2(x, y) {
	  if (!document.caretPositionFromPoint) {
	    const {
	      startContainer: offsetNode,
	      startOffset: offset
	    } = document.caretRangeFromPoint(x, y);
	    return {
	      offsetNode,
	      offset
	    };
	  }
	  return document.caretPositionFromPoint(x, y);
	}
	function _setCaretPositionHelper2(selection, caretX, select, element, rect) {
	  var _caretPosition$offset;
	  rect || (rect = element.getBoundingClientRect());
	  if (caretX <= rect.x + PRECISION) {
	    if (select) {
	      selection.extend(element.firstChild, 0);
	    } else {
	      selection.setPosition(element.firstChild, 0);
	    }
	    return;
	  }
	  if (rect.right - PRECISION <= caretX) {
	    const {
	      lastChild
	    } = element;
	    if (select) {
	      selection.extend(lastChild, lastChild.length);
	    } else {
	      selection.setPosition(lastChild, lastChild.length);
	    }
	    return;
	  }
	  const midY = rect.y + rect.height / 2;
	  let caretPosition = babelHelpers.classPrivateFieldLooseBase(CaretBrowsingMode, _caretPositionFromPoint)[_caretPositionFromPoint](caretX, midY);
	  let parentElement = (_caretPosition$offset = caretPosition.offsetNode) == null ? void 0 : _caretPosition$offset.parentElement;
	  if (parentElement && parentElement !== element) {
	    var _caretPosition$offset2;
	    const elementsAtPoint = document.elementsFromPoint(caretX, midY);
	    const savedVisibilities = [];
	    for (const el of elementsAtPoint) {
	      if (el === element) {
	        break;
	      }
	      const {
	        style
	      } = el;
	      savedVisibilities.push([el, style.visibility]);
	      style.visibility = "hidden";
	    }
	    caretPosition = babelHelpers.classPrivateFieldLooseBase(CaretBrowsingMode, _caretPositionFromPoint)[_caretPositionFromPoint](caretX, midY);
	    parentElement = (_caretPosition$offset2 = caretPosition.offsetNode) == null ? void 0 : _caretPosition$offset2.parentElement;
	    for (const [el, visibility] of savedVisibilities) {
	      el.style.visibility = visibility;
	    }
	  }
	  if (parentElement !== element) {
	    if (select) {
	      selection.extend(element.firstChild, 0);
	    } else {
	      selection.setPosition(element.firstChild, 0);
	    }
	    return;
	  }
	  if (select) {
	    selection.extend(caretPosition.offsetNode, caretPosition.offset);
	  } else {
	    selection.setPosition(caretPosition.offsetNode, caretPosition.offset);
	  }
	}
	function _setCaretPosition2(select, selection, newLineElement, newLineElementRect, caretX) {
	  if (babelHelpers.classPrivateFieldLooseBase(this, _isVisible)[_isVisible](newLineElementRect)) {
	    babelHelpers.classPrivateFieldLooseBase(this, _setCaretPositionHelper)[_setCaretPositionHelper](selection, caretX, select, newLineElement, newLineElementRect);
	    return;
	  }
	  babelHelpers.classPrivateFieldLooseBase(this, _mainContainer)[_mainContainer].addEventListener("scrollend", babelHelpers.classPrivateFieldLooseBase(this, _setCaretPositionHelper)[_setCaretPositionHelper].bind(this, selection, caretX, select, newLineElement, null), {
	    once: true
	  });
	  newLineElement.scrollIntoView();
	}
	function _getNodeOnNextPage2(textLayer, isUp) {
	  while (true) {
	    const page = textLayer.closest(".page");
	    const pageNumber = parseInt(page.getAttribute("data-page-number"));
	    const nextPage = isUp ? pageNumber - 1 : pageNumber + 1;
	    textLayer = babelHelpers.classPrivateFieldLooseBase(this, _viewerContainer)[_viewerContainer].querySelector(`.page[data-page-number="${nextPage}"] .textLayer`);
	    if (!textLayer) {
	      return null;
	    }
	    const walker = document.createTreeWalker(textLayer, NodeFilter.SHOW_TEXT);
	    const node = isUp ? walker.lastChild() : walker.firstChild();
	    if (node) {
	      return node;
	    }
	  }
	}
	Object.defineProperty(CaretBrowsingMode, _caretPositionFromPoint, {
	  value: _caretPositionFromPoint2
	});

	function download(blobUrl, filename) {
	  const a = document.createElement("a");
	  if (!a.click) {
	    throw new Error('DownloadManager: "a.click()" is not supported.');
	  }
	  a.href = blobUrl;
	  a.target = "_parent";
	  if ("download" in a) {
	    a.download = filename;
	  }
	  (document.body || document.documentElement).append(a);
	  a.click();
	  a.remove();
	}
	var _openBlobUrls = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("openBlobUrls");
	class DownloadManager {
	  constructor() {
	    Object.defineProperty(this, _openBlobUrls, {
	      writable: true,
	      value: new WeakMap()
	    });
	  }
	  downloadData(data, filename, contentType) {
	    const blobUrl = URL.createObjectURL(new Blob([data], {
	      type: contentType
	    }));
	    download(blobUrl, filename);
	  }
	  openOrDownloadData(data, filename, dest = null) {
	    const isPdfData = isPdfFile(filename);
	    const contentType = isPdfData ? "application/pdf" : "";
	    if (isPdfData) {
	      let blobUrl = babelHelpers.classPrivateFieldLooseBase(this, _openBlobUrls)[_openBlobUrls].get(data);
	      if (!blobUrl) {
	        blobUrl = URL.createObjectURL(new Blob([data], {
	          type: contentType
	        }));
	        babelHelpers.classPrivateFieldLooseBase(this, _openBlobUrls)[_openBlobUrls].set(data, blobUrl);
	      }
	      let viewerUrl;
	      viewerUrl = "?file=" + encodeURIComponent(blobUrl + "#" + filename);
	      if (dest) {
	        viewerUrl += `#${escape(dest)}`;
	      }
	      try {
	        window.open(viewerUrl);
	        return true;
	      } catch (ex) {
	        console.error(`openOrDownloadData: ${ex}`);
	        URL.revokeObjectURL(blobUrl);
	        babelHelpers.classPrivateFieldLooseBase(this, _openBlobUrls)[_openBlobUrls].delete(data);
	      }
	    }
	    this.downloadData(data, filename, contentType);
	    return false;
	  }
	  download(data, url, filename) {
	    let blobUrl;
	    if (data) {
	      blobUrl = URL.createObjectURL(new Blob([data], {
	        type: "application/pdf"
	      }));
	    } else {
	      if (!createValidAbsoluteUrl(url, "http://example.com")) {
	        console.error(`download - not a valid URL: ${url}`);
	        return;
	      }
	      blobUrl = url + "#pdfjs.action=download";
	    }
	    download(blobUrl, filename);
	  }
	}
	var _overlays = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("overlays");
	var _active = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("active");
	class OverlayManager {
	  constructor() {
	    Object.defineProperty(this, _overlays, {
	      writable: true,
	      value: new WeakMap()
	    });
	    Object.defineProperty(this, _active, {
	      writable: true,
	      value: null
	    });
	  }
	  get active() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _active)[_active];
	  }
	  async register(dialog, canForceClose = false) {
	    if (typeof dialog !== "object") {
	      throw new Error("Not enough parameters.");
	    } else if (babelHelpers.classPrivateFieldLooseBase(this, _overlays)[_overlays].has(dialog)) {
	      throw new Error("The overlay is already registered.");
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _overlays)[_overlays].set(dialog, {
	      canForceClose
	    });
	    dialog.addEventListener("cancel", evt => {
	      babelHelpers.classPrivateFieldLooseBase(this, _active)[_active] = null;
	    });
	  }
	  async open(dialog) {
	    if (!babelHelpers.classPrivateFieldLooseBase(this, _overlays)[_overlays].has(dialog)) {
	      throw new Error("The overlay does not exist.");
	    } else if (babelHelpers.classPrivateFieldLooseBase(this, _active)[_active]) {
	      if (babelHelpers.classPrivateFieldLooseBase(this, _active)[_active] === dialog) {
	        throw new Error("The overlay is already active.");
	      } else if (babelHelpers.classPrivateFieldLooseBase(this, _overlays)[_overlays].get(dialog).canForceClose) {
	        await this.close();
	      } else {
	        throw new Error("Another overlay is currently active.");
	      }
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _active)[_active] = dialog;
	    dialog.showModal();
	  }
	  async close(dialog = babelHelpers.classPrivateFieldLooseBase(this, _active)[_active]) {
	    if (!babelHelpers.classPrivateFieldLooseBase(this, _overlays)[_overlays].has(dialog)) {
	      throw new Error("The overlay does not exist.");
	    } else if (!babelHelpers.classPrivateFieldLooseBase(this, _active)[_active]) {
	      throw new Error("The overlay is currently not active.");
	    } else if (babelHelpers.classPrivateFieldLooseBase(this, _active)[_active] !== dialog) {
	      throw new Error("Another overlay is currently active.");
	    }
	    dialog.close();
	    babelHelpers.classPrivateFieldLooseBase(this, _active)[_active] = null;
	  }
	}
	var _activeCapability = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("activeCapability");
	var _updateCallback = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("updateCallback");
	var _reason = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("reason");
	var _verify = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("verify");
	var _cancel3 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("cancel");
	var _invokeCallback = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("invokeCallback");
	class PasswordPrompt {
	  constructor(options, overlayManager, isViewerEmbedded = false) {
	    Object.defineProperty(this, _invokeCallback, {
	      value: _invokeCallback2
	    });
	    Object.defineProperty(this, _cancel3, {
	      value: _cancel4
	    });
	    Object.defineProperty(this, _verify, {
	      value: _verify2
	    });
	    Object.defineProperty(this, _activeCapability, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _updateCallback, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _reason, {
	      writable: true,
	      value: null
	    });
	    this.dialog = options.dialog;
	    this.label = options.label;
	    this.input = options.input;
	    this.submitButton = options.submitButton;
	    this.cancelButton = options.cancelButton;
	    this.overlayManager = overlayManager;
	    this._isViewerEmbedded = isViewerEmbedded;
	    this.submitButton.addEventListener("click", babelHelpers.classPrivateFieldLooseBase(this, _verify)[_verify].bind(this));
	    this.cancelButton.addEventListener("click", this.close.bind(this));
	    this.input.addEventListener("keydown", e => {
	      if (e.keyCode === 13) {
	        babelHelpers.classPrivateFieldLooseBase(this, _verify)[_verify]();
	      }
	    });
	    this.overlayManager.register(this.dialog, true);
	    this.dialog.addEventListener("close", babelHelpers.classPrivateFieldLooseBase(this, _cancel3)[_cancel3].bind(this));
	  }
	  async open() {
	    var _babelHelpers$classPr4;
	    await ((_babelHelpers$classPr4 = babelHelpers.classPrivateFieldLooseBase(this, _activeCapability)[_activeCapability]) == null ? void 0 : _babelHelpers$classPr4.promise);
	    babelHelpers.classPrivateFieldLooseBase(this, _activeCapability)[_activeCapability] = Promise.withResolvers();
	    try {
	      await this.overlayManager.open(this.dialog);
	    } catch (ex) {
	      babelHelpers.classPrivateFieldLooseBase(this, _activeCapability)[_activeCapability].resolve();
	      throw ex;
	    }
	    const passwordIncorrect = babelHelpers.classPrivateFieldLooseBase(this, _reason)[_reason] === PasswordResponses.INCORRECT_PASSWORD;
	    if (!this._isViewerEmbedded || passwordIncorrect) {
	      this.input.focus();
	    }
	    this.label.setAttribute("data-l10n-id", passwordIncorrect ? "pdfjs-password-invalid" : "pdfjs-password-label");
	  }
	  async close() {
	    if (this.overlayManager.active === this.dialog) {
	      this.overlayManager.close(this.dialog);
	    }
	  }
	  async setUpdateCallback(updateCallback, reason) {
	    if (babelHelpers.classPrivateFieldLooseBase(this, _activeCapability)[_activeCapability]) {
	      await babelHelpers.classPrivateFieldLooseBase(this, _activeCapability)[_activeCapability].promise;
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _updateCallback)[_updateCallback] = updateCallback;
	    babelHelpers.classPrivateFieldLooseBase(this, _reason)[_reason] = reason;
	  }
	}
	function _verify2() {
	  const password = this.input.value;
	  if ((password == null ? void 0 : password.length) > 0) {
	    babelHelpers.classPrivateFieldLooseBase(this, _invokeCallback)[_invokeCallback](password);
	  }
	}
	function _cancel4() {
	  babelHelpers.classPrivateFieldLooseBase(this, _invokeCallback)[_invokeCallback](new Error("PasswordPrompt cancelled."));
	  babelHelpers.classPrivateFieldLooseBase(this, _activeCapability)[_activeCapability].resolve();
	}
	function _invokeCallback2(password) {
	  if (!babelHelpers.classPrivateFieldLooseBase(this, _updateCallback)[_updateCallback]) {
	    return;
	  }
	  this.close();
	  this.input.value = "";
	  babelHelpers.classPrivateFieldLooseBase(this, _updateCallback)[_updateCallback](password);
	  babelHelpers.classPrivateFieldLooseBase(this, _updateCallback)[_updateCallback] = null;
	}

	const TREEITEM_OFFSET_TOP = -100;
	const TREEITEM_SELECTED_CLASS = "selected";
	class BaseTreeViewer {
	  constructor(options) {
	    this.container = options.container;
	    this.eventBus = options.eventBus;
	    this._l10n = options.l10n;
	    this.reset();
	  }
	  reset() {
	    this._pdfDocument = null;
	    this._lastToggleIsShow = true;
	    this._currentTreeItem = null;
	    this.container.textContent = "";
	    this.container.classList.remove("treeWithDeepNesting");
	  }
	  _dispatchEvent(count) {
	    throw new Error("Not implemented: _dispatchEvent");
	  }
	  _bindLink(element, params) {
	    throw new Error("Not implemented: _bindLink");
	  }
	  _normalizeTextContent(str) {
	    return removeNullCharacters(str, true) || "\u2013";
	  }
	  _addToggleButton(div, hidden = false) {
	    const toggler = document.createElement("div");
	    toggler.className = "treeItemToggler";
	    if (hidden) {
	      toggler.classList.add("treeItemsHidden");
	    }
	    toggler.onclick = evt => {
	      evt.stopPropagation();
	      toggler.classList.toggle("treeItemsHidden");
	      if (evt.shiftKey) {
	        const shouldShowAll = !toggler.classList.contains("treeItemsHidden");
	        this._toggleTreeItem(div, shouldShowAll);
	      }
	    };
	    div.prepend(toggler);
	  }
	  _toggleTreeItem(root, show = false) {
	    this._l10n.pause();
	    this._lastToggleIsShow = show;
	    for (const toggler of root.querySelectorAll(".treeItemToggler")) {
	      toggler.classList.toggle("treeItemsHidden", !show);
	    }
	    this._l10n.resume();
	  }
	  _toggleAllTreeItems() {
	    this._toggleTreeItem(this.container, !this._lastToggleIsShow);
	  }
	  _finishRendering(fragment, count, hasAnyNesting = false) {
	    if (hasAnyNesting) {
	      this.container.classList.add("treeWithDeepNesting");
	      this._lastToggleIsShow = !fragment.querySelector(".treeItemsHidden");
	    }
	    this._l10n.pause();
	    this.container.append(fragment);
	    this._l10n.resume();
	    this._dispatchEvent(count);
	  }
	  render(params) {
	    throw new Error("Not implemented: render");
	  }
	  _updateCurrentTreeItem(treeItem = null) {
	    if (this._currentTreeItem) {
	      this._currentTreeItem.classList.remove(TREEITEM_SELECTED_CLASS);
	      this._currentTreeItem = null;
	    }
	    if (treeItem) {
	      treeItem.classList.add(TREEITEM_SELECTED_CLASS);
	      this._currentTreeItem = treeItem;
	    }
	  }
	  _scrollToCurrentTreeItem(treeItem) {
	    if (!treeItem) {
	      return;
	    }
	    this._l10n.pause();
	    let currentNode = treeItem.parentNode;
	    while (currentNode && currentNode !== this.container) {
	      if (currentNode.classList.contains("treeItem")) {
	        const toggler = currentNode.firstElementChild;
	        toggler == null ? void 0 : toggler.classList.remove("treeItemsHidden");
	      }
	      currentNode = currentNode.parentNode;
	    }
	    this._l10n.resume();
	    this._updateCurrentTreeItem(treeItem);
	    this.container.scrollTo(treeItem.offsetLeft, treeItem.offsetTop + TREEITEM_OFFSET_TOP);
	  }
	}
	var _appendAttachment = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("appendAttachment");
	class PDFAttachmentViewer extends BaseTreeViewer {
	  constructor(options) {
	    super(options);
	    Object.defineProperty(this, _appendAttachment, {
	      value: _appendAttachment2
	    });
	    this.downloadManager = options.downloadManager;
	    this.eventBus._on("fileattachmentannotation", babelHelpers.classPrivateFieldLooseBase(this, _appendAttachment)[_appendAttachment].bind(this));
	  }
	  reset(keepRenderedCapability = false) {
	    super.reset();
	    this._attachments = null;
	    if (!keepRenderedCapability) {
	      this._renderedCapability = Promise.withResolvers();
	    }
	    this._pendingDispatchEvent = false;
	  }
	  async _dispatchEvent(attachmentsCount) {
	    this._renderedCapability.resolve();
	    if (attachmentsCount === 0 && !this._pendingDispatchEvent) {
	      this._pendingDispatchEvent = true;
	      await waitOnEventOrTimeout({
	        target: this.eventBus,
	        name: "annotationlayerrendered",
	        delay: 1000
	      });
	      if (!this._pendingDispatchEvent) {
	        return;
	      }
	    }
	    this._pendingDispatchEvent = false;
	    this.eventBus.dispatch("attachmentsloaded", {
	      source: this,
	      attachmentsCount
	    });
	  }
	  _bindLink(element, {
	    content,
	    description,
	    filename
	  }) {
	    if (description) {
	      element.title = description;
	    }
	    element.onclick = () => {
	      this.downloadManager.openOrDownloadData(content, filename);
	      return false;
	    };
	  }
	  render({
	    attachments,
	    keepRenderedCapability = false
	  }) {
	    if (this._attachments) {
	      this.reset(keepRenderedCapability);
	    }
	    this._attachments = attachments || null;
	    if (!attachments) {
	      this._dispatchEvent(0);
	      return;
	    }
	    const fragment = document.createDocumentFragment();
	    let attachmentsCount = 0;
	    for (const name in attachments) {
	      const item = attachments[name];
	      const div = document.createElement("div");
	      div.className = "treeItem";
	      const element = document.createElement("a");
	      this._bindLink(element, item);
	      element.textContent = this._normalizeTextContent(item.filename);
	      div.append(element);
	      fragment.append(div);
	      attachmentsCount++;
	    }
	    this._finishRendering(fragment, attachmentsCount);
	  }
	}
	function _appendAttachment2(item) {
	  const renderedPromise = this._renderedCapability.promise;
	  renderedPromise.then(() => {
	    if (renderedPromise !== this._renderedCapability.promise) {
	      return;
	    }
	    const attachments = this._attachments || Object.create(null);
	    for (const name in attachments) {
	      if (item.filename === name) {
	        return;
	      }
	    }
	    attachments[item.filename] = item;
	    this.render({
	      attachments,
	      keepRenderedCapability: true
	    });
	  });
	}
	const CSS_CLASS_GRAB = "grab-to-pan-grab";
	var _activateAC = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("activateAC");
	var _mouseDownAC = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("mouseDownAC");
	var _scrollAC = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("scrollAC");
	var _onMouseDown = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onMouseDown");
	var _onMouseMove = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onMouseMove");
	var _endPan = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("endPan");
	class GrabToPan {
	  constructor({
	    element
	  }) {
	    Object.defineProperty(this, _endPan, {
	      value: _endPan2
	    });
	    Object.defineProperty(this, _onMouseMove, {
	      value: _onMouseMove2
	    });
	    Object.defineProperty(this, _onMouseDown, {
	      value: _onMouseDown2
	    });
	    Object.defineProperty(this, _activateAC, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _mouseDownAC, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _scrollAC, {
	      writable: true,
	      value: null
	    });
	    this.element = element;
	    this.document = element.ownerDocument;
	    const overlay = this.overlay = document.createElement("div");
	    overlay.className = "grab-to-pan-grabbing";
	  }
	  activate() {
	    if (!babelHelpers.classPrivateFieldLooseBase(this, _activateAC)[_activateAC]) {
	      babelHelpers.classPrivateFieldLooseBase(this, _activateAC)[_activateAC] = new AbortController();
	      this.element.addEventListener("mousedown", babelHelpers.classPrivateFieldLooseBase(this, _onMouseDown)[_onMouseDown].bind(this), {
	        capture: true,
	        signal: babelHelpers.classPrivateFieldLooseBase(this, _activateAC)[_activateAC].signal
	      });
	      this.element.classList.add(CSS_CLASS_GRAB);
	    }
	  }
	  deactivate() {
	    if (babelHelpers.classPrivateFieldLooseBase(this, _activateAC)[_activateAC]) {
	      babelHelpers.classPrivateFieldLooseBase(this, _activateAC)[_activateAC].abort();
	      babelHelpers.classPrivateFieldLooseBase(this, _activateAC)[_activateAC] = null;
	      babelHelpers.classPrivateFieldLooseBase(this, _endPan)[_endPan]();
	      this.element.classList.remove(CSS_CLASS_GRAB);
	    }
	  }
	  toggle() {
	    if (babelHelpers.classPrivateFieldLooseBase(this, _activateAC)[_activateAC]) {
	      this.deactivate();
	    } else {
	      this.activate();
	    }
	  }
	  ignoreTarget(node) {
	    return node.matches("a[href], a[href] *, input, textarea, button, button *, select, option");
	  }
	}
	function _onMouseDown2(event) {
	  if (event.button !== 0 || this.ignoreTarget(event.target)) {
	    return;
	  }
	  if (event.originalTarget) {
	    try {
	      event.originalTarget.tagName;
	    } catch {
	      return;
	    }
	  }
	  this.scrollLeftStart = this.element.scrollLeft;
	  this.scrollTopStart = this.element.scrollTop;
	  this.clientXStart = event.clientX;
	  this.clientYStart = event.clientY;
	  babelHelpers.classPrivateFieldLooseBase(this, _mouseDownAC)[_mouseDownAC] = new AbortController();
	  const boundEndPan = babelHelpers.classPrivateFieldLooseBase(this, _endPan)[_endPan].bind(this),
	    mouseOpts = {
	      capture: true,
	      signal: babelHelpers.classPrivateFieldLooseBase(this, _mouseDownAC)[_mouseDownAC].signal
	    };
	  this.document.addEventListener("mousemove", babelHelpers.classPrivateFieldLooseBase(this, _onMouseMove)[_onMouseMove].bind(this), mouseOpts);
	  this.document.addEventListener("mouseup", boundEndPan, mouseOpts);
	  babelHelpers.classPrivateFieldLooseBase(this, _scrollAC)[_scrollAC] = new AbortController();
	  this.element.addEventListener("scroll", boundEndPan, {
	    capture: true,
	    signal: babelHelpers.classPrivateFieldLooseBase(this, _scrollAC)[_scrollAC].signal
	  });
	  event.preventDefault();
	  event.stopPropagation();
	  const focusedElement = document.activeElement;
	  if (focusedElement && !focusedElement.contains(event.target)) {
	    focusedElement.blur();
	  }
	}
	function _onMouseMove2(event) {
	  var _babelHelpers$classPr39;
	  (_babelHelpers$classPr39 = babelHelpers.classPrivateFieldLooseBase(this, _scrollAC)[_scrollAC]) == null ? void 0 : _babelHelpers$classPr39.abort();
	  babelHelpers.classPrivateFieldLooseBase(this, _scrollAC)[_scrollAC] = null;
	  if (!(event.buttons & 1)) {
	    babelHelpers.classPrivateFieldLooseBase(this, _endPan)[_endPan]();
	    return;
	  }
	  const xDiff = event.clientX - this.clientXStart;
	  const yDiff = event.clientY - this.clientYStart;
	  this.element.scrollTo({
	    top: this.scrollTopStart - yDiff,
	    left: this.scrollLeftStart - xDiff,
	    behavior: "instant"
	  });
	  if (!this.overlay.parentNode) {
	    document.body.append(this.overlay);
	  }
	}
	function _endPan2() {
	  var _babelHelpers$classPr40, _babelHelpers$classPr41;
	  (_babelHelpers$classPr40 = babelHelpers.classPrivateFieldLooseBase(this, _mouseDownAC)[_mouseDownAC]) == null ? void 0 : _babelHelpers$classPr40.abort();
	  babelHelpers.classPrivateFieldLooseBase(this, _mouseDownAC)[_mouseDownAC] = null;
	  (_babelHelpers$classPr41 = babelHelpers.classPrivateFieldLooseBase(this, _scrollAC)[_scrollAC]) == null ? void 0 : _babelHelpers$classPr41.abort();
	  babelHelpers.classPrivateFieldLooseBase(this, _scrollAC)[_scrollAC] = null;
	  this.overlay.remove();
	}
	var _active2 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("active");
	var _prevActive = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("prevActive");
	var _switchTool = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("switchTool");
	var _addEventListeners = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("addEventListeners");
	class PDFCursorTools {
	  constructor({
	    container,
	    eventBus,
	    cursorToolOnLoad = CursorTool.SELECT
	  }) {
	    Object.defineProperty(this, _addEventListeners, {
	      value: _addEventListeners2
	    });
	    Object.defineProperty(this, _switchTool, {
	      value: _switchTool2
	    });
	    Object.defineProperty(this, _active2, {
	      writable: true,
	      value: CursorTool.SELECT
	    });
	    Object.defineProperty(this, _prevActive, {
	      writable: true,
	      value: null
	    });
	    this.container = container;
	    this.eventBus = eventBus;
	    babelHelpers.classPrivateFieldLooseBase(this, _addEventListeners)[_addEventListeners]();
	    Promise.resolve().then(() => {
	      this.switchTool(cursorToolOnLoad);
	    });
	  }
	  get activeTool() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _active2)[_active2];
	  }
	  switchTool(tool) {
	    if (babelHelpers.classPrivateFieldLooseBase(this, _prevActive)[_prevActive] !== null) {
	      return;
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _switchTool)[_switchTool](tool);
	  }
	  get _handTool() {
	    return shadow(this, "_handTool", new GrabToPan({
	      element: this.container
	    }));
	  }
	}
	function _switchTool2(tool, disabled = false) {
	  if (tool === babelHelpers.classPrivateFieldLooseBase(this, _active2)[_active2]) {
	    if (babelHelpers.classPrivateFieldLooseBase(this, _prevActive)[_prevActive] !== null) {
	      this.eventBus.dispatch("cursortoolchanged", {
	        source: this,
	        tool,
	        disabled
	      });
	    }
	    return;
	  }
	  const disableActiveTool = () => {
	    switch (babelHelpers.classPrivateFieldLooseBase(this, _active2)[_active2]) {
	      case CursorTool.SELECT:
	        break;
	      case CursorTool.HAND:
	        this._handTool.deactivate();
	        break;
	      case CursorTool.ZOOM:
	    }
	  };
	  switch (tool) {
	    case CursorTool.SELECT:
	      disableActiveTool();
	      break;
	    case CursorTool.HAND:
	      disableActiveTool();
	      this._handTool.activate();
	      break;
	    case CursorTool.ZOOM:
	    default:
	      console.error(`switchTool: "${tool}" is an unsupported value.`);
	      return;
	  }
	  babelHelpers.classPrivateFieldLooseBase(this, _active2)[_active2] = tool;
	  this.eventBus.dispatch("cursortoolchanged", {
	    source: this,
	    tool,
	    disabled
	  });
	}
	function _addEventListeners2() {
	  this.eventBus._on("switchcursortool", evt => {
	    if (!evt.reset) {
	      this.switchTool(evt.tool);
	    } else if (babelHelpers.classPrivateFieldLooseBase(this, _prevActive)[_prevActive] !== null) {
	      annotationEditorMode = AnnotationEditorType.NONE;
	      presentationModeState = PresentationModeState.NORMAL;
	      enableActive();
	    }
	  });
	  let annotationEditorMode = AnnotationEditorType.NONE,
	    presentationModeState = PresentationModeState.NORMAL;
	  const disableActive = () => {
	    var _babelHelpers$classPr42, _babelHelpers$classPr43;
	    (_babelHelpers$classPr43 = (_babelHelpers$classPr42 = babelHelpers.classPrivateFieldLooseBase(this, _prevActive))[_prevActive]) != null ? _babelHelpers$classPr43 : _babelHelpers$classPr42[_prevActive] = babelHelpers.classPrivateFieldLooseBase(this, _active2)[_active2];
	    babelHelpers.classPrivateFieldLooseBase(this, _switchTool)[_switchTool](CursorTool.SELECT, true);
	  };
	  const enableActive = () => {
	    if (babelHelpers.classPrivateFieldLooseBase(this, _prevActive)[_prevActive] !== null && annotationEditorMode === AnnotationEditorType.NONE && presentationModeState === PresentationModeState.NORMAL) {
	      babelHelpers.classPrivateFieldLooseBase(this, _switchTool)[_switchTool](babelHelpers.classPrivateFieldLooseBase(this, _prevActive)[_prevActive]);
	      babelHelpers.classPrivateFieldLooseBase(this, _prevActive)[_prevActive] = null;
	    }
	  };
	  this.eventBus._on("annotationeditormodechanged", ({
	    mode
	  }) => {
	    annotationEditorMode = mode;
	    if (mode === AnnotationEditorType.NONE) {
	      enableActive();
	    } else {
	      disableActive();
	    }
	  });
	  this.eventBus._on("presentationmodechanged", ({
	    state
	  }) => {
	    presentationModeState = state;
	    if (state === PresentationModeState.NORMAL) {
	      enableActive();
	    } else if (state === PresentationModeState.FULLSCREEN) {
	      disableActive();
	    }
	  });
	}

	const NON_METRIC_LOCALES = ["en-us", "en-lr", "my"];
	const US_PAGE_NAMES = {
	  "8.5x11": "pdfjs-document-properties-page-size-name-letter",
	  "8.5x14": "pdfjs-document-properties-page-size-name-legal"
	};
	const METRIC_PAGE_NAMES = {
	  "297x420": "pdfjs-document-properties-page-size-name-a-three",
	  "210x297": "pdfjs-document-properties-page-size-name-a-four"
	};
	function getPageName(size, isPortrait, pageNames) {
	  const width = isPortrait ? size.width : size.height;
	  const height = isPortrait ? size.height : size.width;
	  return pageNames[`${width}x${height}`];
	}
	var _fieldData = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("fieldData");
	var _reset = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("reset");
	var _updateUI = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("updateUI");
	var _parseFileSize = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("parseFileSize");
	var _parsePageSize = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("parsePageSize");
	var _parseDate = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("parseDate");
	var _parseLinearization = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("parseLinearization");
	class PDFDocumentProperties {
	  constructor({
	    dialog,
	    fields,
	    closeButton
	  }, overlayManager, eventBus, l10n, fileNameLookup) {
	    Object.defineProperty(this, _parseLinearization, {
	      value: _parseLinearization2
	    });
	    Object.defineProperty(this, _parseDate, {
	      value: _parseDate2
	    });
	    Object.defineProperty(this, _parsePageSize, {
	      value: _parsePageSize2
	    });
	    Object.defineProperty(this, _parseFileSize, {
	      value: _parseFileSize2
	    });
	    Object.defineProperty(this, _updateUI, {
	      value: _updateUI2
	    });
	    Object.defineProperty(this, _reset, {
	      value: _reset2
	    });
	    Object.defineProperty(this, _fieldData, {
	      writable: true,
	      value: null
	    });
	    this.dialog = dialog;
	    this.fields = fields;
	    this.overlayManager = overlayManager;
	    this.l10n = l10n;
	    this._fileNameLookup = fileNameLookup;
	    babelHelpers.classPrivateFieldLooseBase(this, _reset)[_reset]();
	    closeButton.addEventListener("click", this.close.bind(this));
	    this.overlayManager.register(this.dialog);
	    eventBus._on("pagechanging", evt => {
	      this._currentPageNumber = evt.pageNumber;
	    });
	    eventBus._on("rotationchanging", evt => {
	      this._pagesRotation = evt.pagesRotation;
	    });
	  }
	  async open() {
	    await Promise.all([this.overlayManager.open(this.dialog), this._dataAvailableCapability.promise]);
	    const currentPageNumber = this._currentPageNumber;
	    const pagesRotation = this._pagesRotation;
	    if (babelHelpers.classPrivateFieldLooseBase(this, _fieldData)[_fieldData] && currentPageNumber === babelHelpers.classPrivateFieldLooseBase(this, _fieldData)[_fieldData]._currentPageNumber && pagesRotation === babelHelpers.classPrivateFieldLooseBase(this, _fieldData)[_fieldData]._pagesRotation) {
	      babelHelpers.classPrivateFieldLooseBase(this, _updateUI)[_updateUI]();
	      return;
	    }
	    const {
	      info,
	      contentLength
	    } = await this.pdfDocument.getMetadata();
	    const [fileName, fileSize, creationDate, modificationDate, pageSize, isLinearized] = await Promise.all([this._fileNameLookup(), babelHelpers.classPrivateFieldLooseBase(this, _parseFileSize)[_parseFileSize](contentLength), babelHelpers.classPrivateFieldLooseBase(this, _parseDate)[_parseDate](info.CreationDate), babelHelpers.classPrivateFieldLooseBase(this, _parseDate)[_parseDate](info.ModDate), this.pdfDocument.getPage(currentPageNumber).then(pdfPage => {
	      return babelHelpers.classPrivateFieldLooseBase(this, _parsePageSize)[_parsePageSize](getPageSizeInches(pdfPage), pagesRotation);
	    }), babelHelpers.classPrivateFieldLooseBase(this, _parseLinearization)[_parseLinearization](info.IsLinearized)]);
	    babelHelpers.classPrivateFieldLooseBase(this, _fieldData)[_fieldData] = Object.freeze({
	      fileName,
	      fileSize,
	      title: info.Title,
	      author: info.Author,
	      subject: info.Subject,
	      keywords: info.Keywords,
	      creationDate,
	      modificationDate,
	      creator: info.Creator,
	      producer: info.Producer,
	      version: info.PDFFormatVersion,
	      pageCount: this.pdfDocument.numPages,
	      pageSize,
	      linearized: isLinearized,
	      _currentPageNumber: currentPageNumber,
	      _pagesRotation: pagesRotation
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _updateUI)[_updateUI]();
	    const {
	      length
	    } = await this.pdfDocument.getDownloadInfo();
	    if (contentLength === length) {
	      return;
	    }
	    const data = Object.assign(Object.create(null), babelHelpers.classPrivateFieldLooseBase(this, _fieldData)[_fieldData]);
	    data.fileSize = await babelHelpers.classPrivateFieldLooseBase(this, _parseFileSize)[_parseFileSize](length);
	    babelHelpers.classPrivateFieldLooseBase(this, _fieldData)[_fieldData] = Object.freeze(data);
	    babelHelpers.classPrivateFieldLooseBase(this, _updateUI)[_updateUI]();
	  }
	  async close() {
	    this.overlayManager.close(this.dialog);
	  }
	  setDocument(pdfDocument) {
	    if (this.pdfDocument) {
	      babelHelpers.classPrivateFieldLooseBase(this, _reset)[_reset]();
	      babelHelpers.classPrivateFieldLooseBase(this, _updateUI)[_updateUI]();
	    }
	    if (!pdfDocument) {
	      return;
	    }
	    this.pdfDocument = pdfDocument;
	    this._dataAvailableCapability.resolve();
	  }
	}
	function _reset2() {
	  this.pdfDocument = null;
	  babelHelpers.classPrivateFieldLooseBase(this, _fieldData)[_fieldData] = null;
	  this._dataAvailableCapability = Promise.withResolvers();
	  this._currentPageNumber = 1;
	  this._pagesRotation = 0;
	}
	function _updateUI2() {
	  if (babelHelpers.classPrivateFieldLooseBase(this, _fieldData)[_fieldData] && this.overlayManager.active !== this.dialog) {
	    return;
	  }
	  for (const id in this.fields) {
	    var _babelHelpers$classPr44;
	    const content = (_babelHelpers$classPr44 = babelHelpers.classPrivateFieldLooseBase(this, _fieldData)[_fieldData]) == null ? void 0 : _babelHelpers$classPr44[id];
	    this.fields[id].textContent = content || content === 0 ? content : "-";
	  }
	}
	async function _parseFileSize2(b = 0) {
	  const kb = b / 1024,
	    mb = kb / 1024;
	  return kb ? this.l10n.get(mb >= 1 ? "pdfjs-document-properties-size-mb" : "pdfjs-document-properties-size-kb", {
	    mb,
	    kb,
	    b
	  }) : undefined;
	}
	async function _parsePageSize2(pageSizeInches, pagesRotation) {
	  if (!pageSizeInches) {
	    return undefined;
	  }
	  if (pagesRotation % 180 !== 0) {
	    pageSizeInches = {
	      width: pageSizeInches.height,
	      height: pageSizeInches.width
	    };
	  }
	  const isPortrait = isPortraitOrientation(pageSizeInches),
	    nonMetric = NON_METRIC_LOCALES.includes(this.l10n.getLanguage());
	  let sizeInches = {
	    width: Math.round(pageSizeInches.width * 100) / 100,
	    height: Math.round(pageSizeInches.height * 100) / 100
	  };
	  let sizeMillimeters = {
	    width: Math.round(pageSizeInches.width * 25.4 * 10) / 10,
	    height: Math.round(pageSizeInches.height * 25.4 * 10) / 10
	  };
	  let nameId = getPageName(sizeInches, isPortrait, US_PAGE_NAMES) || getPageName(sizeMillimeters, isPortrait, METRIC_PAGE_NAMES);
	  if (!nameId && !(Number.isInteger(sizeMillimeters.width) && Number.isInteger(sizeMillimeters.height))) {
	    const exactMillimeters = {
	      width: pageSizeInches.width * 25.4,
	      height: pageSizeInches.height * 25.4
	    };
	    const intMillimeters = {
	      width: Math.round(sizeMillimeters.width),
	      height: Math.round(sizeMillimeters.height)
	    };
	    if (Math.abs(exactMillimeters.width - intMillimeters.width) < 0.1 && Math.abs(exactMillimeters.height - intMillimeters.height) < 0.1) {
	      nameId = getPageName(intMillimeters, isPortrait, METRIC_PAGE_NAMES);
	      if (nameId) {
	        sizeInches = {
	          width: Math.round(intMillimeters.width / 25.4 * 100) / 100,
	          height: Math.round(intMillimeters.height / 25.4 * 100) / 100
	        };
	        sizeMillimeters = intMillimeters;
	      }
	    }
	  }
	  const [{
	    width,
	    height
	  }, unit, name, orientation] = await Promise.all([nonMetric ? sizeInches : sizeMillimeters, this.l10n.get(nonMetric ? "pdfjs-document-properties-page-size-unit-inches" : "pdfjs-document-properties-page-size-unit-millimeters"), nameId && this.l10n.get(nameId), this.l10n.get(isPortrait ? "pdfjs-document-properties-page-size-orientation-portrait" : "pdfjs-document-properties-page-size-orientation-landscape")]);
	  return this.l10n.get(name ? "pdfjs-document-properties-page-size-dimension-name-string" : "pdfjs-document-properties-page-size-dimension-string", {
	    width,
	    height,
	    unit,
	    name,
	    orientation
	  });
	}
	async function _parseDate2(inputDate) {
	  const dateObj = PDFDateString.toDateObject(inputDate);
	  return dateObj ? this.l10n.get("pdfjs-document-properties-date-time-string", {
	    dateObj: dateObj.valueOf()
	  }) : undefined;
	}
	function _parseLinearization2(isLinearized) {
	  return this.l10n.get(isLinearized ? "pdfjs-document-properties-linearized-yes" : "pdfjs-document-properties-linearized-no");
	}
	const CharacterType = {
	  SPACE: 0,
	  ALPHA_LETTER: 1,
	  PUNCT: 2,
	  HAN_LETTER: 3,
	  KATAKANA_LETTER: 4,
	  HIRAGANA_LETTER: 5,
	  HALFWIDTH_KATAKANA_LETTER: 6,
	  THAI_LETTER: 7
	};
	function isAlphabeticalScript(charCode) {
	  return charCode < 0x2e80;
	}
	function isAscii(charCode) {
	  return (charCode & 0xff80) === 0;
	}
	function isAsciiAlpha(charCode) {
	  return charCode >= 0x61 && charCode <= 0x7a || charCode >= 0x41 && charCode <= 0x5a;
	}
	function isAsciiDigit(charCode) {
	  return charCode >= 0x30 && charCode <= 0x39;
	}
	function isAsciiSpace(charCode) {
	  return charCode === 0x20 || charCode === 0x09 || charCode === 0x0d || charCode === 0x0a;
	}
	function isHan(charCode) {
	  return charCode >= 0x3400 && charCode <= 0x9fff || charCode >= 0xf900 && charCode <= 0xfaff;
	}
	function isKatakana(charCode) {
	  return charCode >= 0x30a0 && charCode <= 0x30ff;
	}
	function isHiragana(charCode) {
	  return charCode >= 0x3040 && charCode <= 0x309f;
	}
	function isHalfwidthKatakana(charCode) {
	  return charCode >= 0xff60 && charCode <= 0xff9f;
	}
	function isThai(charCode) {
	  return (charCode & 0xff80) === 0x0e00;
	}
	function getCharacterType(charCode) {
	  if (isAlphabeticalScript(charCode)) {
	    if (isAscii(charCode)) {
	      if (isAsciiSpace(charCode)) {
	        return CharacterType.SPACE;
	      } else if (isAsciiAlpha(charCode) || isAsciiDigit(charCode) || charCode === 0x5f) {
	        return CharacterType.ALPHA_LETTER;
	      }
	      return CharacterType.PUNCT;
	    } else if (isThai(charCode)) {
	      return CharacterType.THAI_LETTER;
	    } else if (charCode === 0xa0) {
	      return CharacterType.SPACE;
	    }
	    return CharacterType.ALPHA_LETTER;
	  }
	  if (isHan(charCode)) {
	    return CharacterType.HAN_LETTER;
	  } else if (isKatakana(charCode)) {
	    return CharacterType.KATAKANA_LETTER;
	  } else if (isHiragana(charCode)) {
	    return CharacterType.HIRAGANA_LETTER;
	  } else if (isHalfwidthKatakana(charCode)) {
	    return CharacterType.HALFWIDTH_KATAKANA_LETTER;
	  }
	  return CharacterType.ALPHA_LETTER;
	}
	let NormalizeWithNFKC;
	function getNormalizeWithNFKC() {
	  NormalizeWithNFKC || (NormalizeWithNFKC = ` ¨ª¯²-µ¸-º¼-¾Ĳ-ĳĿ-ŀŉſǄ-ǌǱ-ǳʰ-ʸ˘-˝ˠ-ˤʹͺ;΄-΅·ϐ-ϖϰ-ϲϴ-ϵϹևٵ-ٸक़-य़ড়-ঢ়য়ਲ਼ਸ਼ਖ਼-ਜ਼ਫ਼ଡ଼-ଢ଼ำຳໜ-ໝ༌གྷཌྷདྷབྷཛྷཀྵჼᴬ-ᴮᴰ-ᴺᴼ-ᵍᵏ-ᵪᵸᶛ-ᶿẚ-ẛάέήίόύώΆ᾽-῁ΈΉ῍-῏ΐΊ῝-῟ΰΎ῭-`ΌΏ´-῾ - ‑‗․-… ″-‴‶-‷‼‾⁇-⁉⁗ ⁰-ⁱ⁴-₎ₐ-ₜ₨℀-℃℅-ℇ℉-ℓℕ-№ℙ-ℝ℠-™ℤΩℨK-ℭℯ-ℱℳ-ℹ℻-⅀ⅅ-ⅉ⅐-ⅿ↉∬-∭∯-∰〈-〉①-⓪⨌⩴-⩶⫝̸ⱼ-ⱽⵯ⺟⻳⼀-⿕　〶〸-〺゛-゜ゟヿㄱ-ㆎ㆒-㆟㈀-㈞㈠-㉇㉐-㉾㊀-㏿ꚜ-ꚝꝰꟲ-ꟴꟸ-ꟹꭜ-ꭟꭩ豈-嗀塚晴凞-羽蘒諸逸-都飯-舘並-龎ﬀ-ﬆﬓ-ﬗיִײַ-זּטּ-לּמּנּ-סּףּ-פּצּ-ﮱﯓ-ﴽﵐ-ﶏﶒ-ﷇﷰ-﷼︐-︙︰-﹄﹇-﹒﹔-﹦﹨-﹫ﹰ-ﹲﹴﹶ-ﻼ！-ﾾￂ-ￇￊ-ￏￒ-ￗￚ-ￜ￠-￦`);
	  return NormalizeWithNFKC;
	}

	const FindState = {
	  FOUND: 0,
	  NOT_FOUND: 1,
	  WRAPPED: 2,
	  PENDING: 3
	};
	const FIND_TIMEOUT = 250;
	const MATCH_SCROLL_OFFSET_TOP = -50;
	const MATCH_SCROLL_OFFSET_LEFT = -400;
	const CHARACTERS_TO_NORMALIZE = {
	  "\u2010": "-",
	  "\u2018": "'",
	  "\u2019": "'",
	  "\u201A": "'",
	  "\u201B": "'",
	  "\u201C": '"',
	  "\u201D": '"',
	  "\u201E": '"',
	  "\u201F": '"',
	  "\u00BC": "1/4",
	  "\u00BD": "1/2",
	  "\u00BE": "3/4"
	};
	const DIACRITICS_EXCEPTION = new Set([0x3099, 0x309a, 0x094d, 0x09cd, 0x0a4d, 0x0acd, 0x0b4d, 0x0bcd, 0x0c4d, 0x0ccd, 0x0d3b, 0x0d3c, 0x0d4d, 0x0dca, 0x0e3a, 0x0eba, 0x0f84, 0x1039, 0x103a, 0x1714, 0x1734, 0x17d2, 0x1a60, 0x1b44, 0x1baa, 0x1bab, 0x1bf2, 0x1bf3, 0x2d7f, 0xa806, 0xa82c, 0xa8c4, 0xa953, 0xa9c0, 0xaaf6, 0xabed, 0x0c56, 0x0f71, 0x0f72, 0x0f7a, 0x0f7b, 0x0f7c, 0x0f7d, 0x0f80, 0x0f74]);
	let DIACRITICS_EXCEPTION_STR;
	const DIACRITICS_REG_EXP = /\p{M}+/gu;
	const SPECIAL_CHARS_REG_EXP = /([.*+?^${}()|[\]\\])|(\p{P})|(\s+)|(\p{M})|(\p{L})/gu;
	const NOT_DIACRITIC_FROM_END_REG_EXP = /([^\p{M}])\p{M}*$/u;
	const NOT_DIACRITIC_FROM_START_REG_EXP = /^\p{M}*([^\p{M}])/u;
	const SYLLABLES_REG_EXP = /[\uAC00-\uD7AF\uFA6C\uFACF-\uFAD1\uFAD5-\uFAD7]+/g;
	const SYLLABLES_LENGTHS = new Map();
	const FIRST_CHAR_SYLLABLES_REG_EXP = "[\\u1100-\\u1112\\ud7a4-\\ud7af\\ud84a\\ud84c\\ud850\\ud854\\ud857\\ud85f]";
	const NFKC_CHARS_TO_NORMALIZE = new Map();
	let noSyllablesRegExp = null;
	let withSyllablesRegExp = null;
	function normalize(text) {
	  const syllablePositions = [];
	  let m;
	  while ((m = SYLLABLES_REG_EXP.exec(text)) !== null) {
	    let {
	      index
	    } = m;
	    for (const char of m[0]) {
	      let len = SYLLABLES_LENGTHS.get(char);
	      if (!len) {
	        len = char.normalize("NFD").length;
	        SYLLABLES_LENGTHS.set(char, len);
	      }
	      syllablePositions.push([len, index++]);
	    }
	  }
	  let normalizationRegex;
	  if (syllablePositions.length === 0 && noSyllablesRegExp) {
	    normalizationRegex = noSyllablesRegExp;
	  } else if (syllablePositions.length > 0 && withSyllablesRegExp) {
	    normalizationRegex = withSyllablesRegExp;
	  } else {
	    const replace = Object.keys(CHARACTERS_TO_NORMALIZE).join("");
	    const toNormalizeWithNFKC = getNormalizeWithNFKC();
	    const CJK = "(?:\\p{Ideographic}|[\u3040-\u30FF])";
	    const HKDiacritics = "(?:\u3099|\u309A)";
	    const CompoundWord = "\\p{Ll}-\\n\\p{Lu}";
	    const regexp = `([${replace}])|([${toNormalizeWithNFKC}])|(${HKDiacritics}\\n)|(\\p{M}+(?:-\\n)?)|(${CompoundWord})|(\\S-\\n)|(${CJK}\\n)|(\\n)`;
	    if (syllablePositions.length === 0) {
	      normalizationRegex = noSyllablesRegExp = new RegExp(regexp + "|(\\u0000)", "gum");
	    } else {
	      normalizationRegex = withSyllablesRegExp = new RegExp(regexp + `|(${FIRST_CHAR_SYLLABLES_REG_EXP})`, "gum");
	    }
	  }
	  const rawDiacriticsPositions = [];
	  while ((m = DIACRITICS_REG_EXP.exec(text)) !== null) {
	    rawDiacriticsPositions.push([m[0].length, m.index]);
	  }
	  let normalized = text.normalize("NFD");
	  const positions = [[0, 0]];
	  let rawDiacriticsIndex = 0;
	  let syllableIndex = 0;
	  let shift = 0;
	  let shiftOrigin = 0;
	  let eol = 0;
	  let hasDiacritics = false;
	  normalized = normalized.replace(normalizationRegex, (match, p1, p2, p3, p4, p5, p6, p7, p8, p9, i) => {
	    var _syllablePositions$sy;
	    i -= shiftOrigin;
	    if (p1) {
	      const replacement = CHARACTERS_TO_NORMALIZE[p1];
	      const jj = replacement.length;
	      for (let j = 1; j < jj; j++) {
	        positions.push([i - shift + j, shift - j]);
	      }
	      shift -= jj - 1;
	      return replacement;
	    }
	    if (p2) {
	      let replacement = NFKC_CHARS_TO_NORMALIZE.get(p2);
	      if (!replacement) {
	        replacement = p2.normalize("NFKC");
	        NFKC_CHARS_TO_NORMALIZE.set(p2, replacement);
	      }
	      const jj = replacement.length;
	      for (let j = 1; j < jj; j++) {
	        positions.push([i - shift + j, shift - j]);
	      }
	      shift -= jj - 1;
	      return replacement;
	    }
	    if (p3) {
	      var _rawDiacriticsPositio;
	      hasDiacritics = true;
	      if (i + eol === ((_rawDiacriticsPositio = rawDiacriticsPositions[rawDiacriticsIndex]) == null ? void 0 : _rawDiacriticsPositio[1])) {
	        ++rawDiacriticsIndex;
	      } else {
	        positions.push([i - 1 - shift + 1, shift - 1]);
	        shift -= 1;
	        shiftOrigin += 1;
	      }
	      positions.push([i - shift + 1, shift]);
	      shiftOrigin += 1;
	      eol += 1;
	      return p3.charAt(0);
	    }
	    if (p4) {
	      var _rawDiacriticsPositio2;
	      const hasTrailingDashEOL = p4.endsWith("\n");
	      const len = hasTrailingDashEOL ? p4.length - 2 : p4.length;
	      hasDiacritics = true;
	      let jj = len;
	      if (i + eol === ((_rawDiacriticsPositio2 = rawDiacriticsPositions[rawDiacriticsIndex]) == null ? void 0 : _rawDiacriticsPositio2[1])) {
	        jj -= rawDiacriticsPositions[rawDiacriticsIndex][0];
	        ++rawDiacriticsIndex;
	      }
	      for (let j = 1; j <= jj; j++) {
	        positions.push([i - 1 - shift + j, shift - j]);
	      }
	      shift -= jj;
	      shiftOrigin += jj;
	      if (hasTrailingDashEOL) {
	        i += len - 1;
	        positions.push([i - shift + 1, 1 + shift]);
	        shift += 1;
	        shiftOrigin += 1;
	        eol += 1;
	        return p4.slice(0, len);
	      }
	      return p4;
	    }
	    if (p5) {
	      positions.push([i - shift + 3, 1 + shift]);
	      shift += 1;
	      shiftOrigin += 1;
	      eol += 1;
	      return p5.replace("\n", "");
	    }
	    if (p6) {
	      const len = p6.length - 2;
	      positions.push([i - shift + len, 1 + shift]);
	      shift += 1;
	      shiftOrigin += 1;
	      eol += 1;
	      return p6.slice(0, -2);
	    }
	    if (p7) {
	      const len = p7.length - 1;
	      positions.push([i - shift + len, shift]);
	      shiftOrigin += 1;
	      eol += 1;
	      return p7.slice(0, -1);
	    }
	    if (p8) {
	      positions.push([i - shift + 1, shift - 1]);
	      shift -= 1;
	      shiftOrigin += 1;
	      eol += 1;
	      return " ";
	    }
	    if (i + eol === ((_syllablePositions$sy = syllablePositions[syllableIndex]) == null ? void 0 : _syllablePositions$sy[1])) {
	      const newCharLen = syllablePositions[syllableIndex][0] - 1;
	      ++syllableIndex;
	      for (let j = 1; j <= newCharLen; j++) {
	        positions.push([i - (shift - j), shift - j]);
	      }
	      shift -= newCharLen;
	      shiftOrigin += newCharLen;
	    }
	    return p9;
	  });
	  positions.push([normalized.length, shift]);
	  return [normalized, positions, hasDiacritics];
	}
	function getOriginalIndex(diffs, pos, len) {
	  if (!diffs) {
	    return [pos, len];
	  }
	  const start = pos;
	  const end = pos + len - 1;
	  let i = binarySearchFirstItem(diffs, x => x[0] >= start);
	  if (diffs[i][0] > start) {
	    --i;
	  }
	  let j = binarySearchFirstItem(diffs, x => x[0] >= end, i);
	  if (diffs[j][0] > end) {
	    --j;
	  }
	  const oldStart = start + diffs[i][1];
	  const oldEnd = end + diffs[j][1];
	  const oldLen = oldEnd + 1 - oldStart;
	  return [oldStart, oldLen];
	}
	var _state = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("state");
	var _updateMatchesCountOnProgress = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("updateMatchesCountOnProgress");
	var _visitedPagesCount = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("visitedPagesCount");
	var _onFind = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onFind");
	var _reset3 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("reset");
	var _query = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("query");
	var _shouldDirtyMatch = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("shouldDirtyMatch");
	var _isEntireWord = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isEntireWord");
	var _convertToRegExpString = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("convertToRegExpString");
	var _calculateMatch = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("calculateMatch");
	var _extractText = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("extractText");
	var _updatePage = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("updatePage");
	var _updateAllPages = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("updateAllPages");
	var _nextMatch = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("nextMatch");
	var _matchesReady = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("matchesReady");
	var _nextPageMatch = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("nextPageMatch");
	var _advanceOffsetPage = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("advanceOffsetPage");
	var _updateMatch = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("updateMatch");
	var _onFindBarClose = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onFindBarClose");
	var _requestMatchesCount = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("requestMatchesCount");
	var _updateUIResultsCount = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("updateUIResultsCount");
	var _updateUIState3 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("updateUIState");
	class PDFFindController {
	  constructor({
	    linkService: _linkService,
	    eventBus,
	    updateMatchesCountOnProgress = true
	  }) {
	    Object.defineProperty(this, _updateUIState3, {
	      value: _updateUIState4
	    });
	    Object.defineProperty(this, _updateUIResultsCount, {
	      value: _updateUIResultsCount2
	    });
	    Object.defineProperty(this, _requestMatchesCount, {
	      value: _requestMatchesCount2
	    });
	    Object.defineProperty(this, _onFindBarClose, {
	      value: _onFindBarClose2
	    });
	    Object.defineProperty(this, _updateMatch, {
	      value: _updateMatch2
	    });
	    Object.defineProperty(this, _advanceOffsetPage, {
	      value: _advanceOffsetPage2
	    });
	    Object.defineProperty(this, _nextPageMatch, {
	      value: _nextPageMatch2
	    });
	    Object.defineProperty(this, _matchesReady, {
	      value: _matchesReady2
	    });
	    Object.defineProperty(this, _nextMatch, {
	      value: _nextMatch2
	    });
	    Object.defineProperty(this, _updateAllPages, {
	      value: _updateAllPages2
	    });
	    Object.defineProperty(this, _updatePage, {
	      value: _updatePage2
	    });
	    Object.defineProperty(this, _extractText, {
	      value: _extractText2
	    });
	    Object.defineProperty(this, _calculateMatch, {
	      value: _calculateMatch2
	    });
	    Object.defineProperty(this, _convertToRegExpString, {
	      value: _convertToRegExpString2
	    });
	    Object.defineProperty(this, _isEntireWord, {
	      value: _isEntireWord2
	    });
	    Object.defineProperty(this, _shouldDirtyMatch, {
	      value: _shouldDirtyMatch2
	    });
	    Object.defineProperty(this, _query, {
	      get: _get_query,
	      set: void 0
	    });
	    Object.defineProperty(this, _reset3, {
	      value: _reset4
	    });
	    Object.defineProperty(this, _onFind, {
	      value: _onFind2
	    });
	    Object.defineProperty(this, _state, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _updateMatchesCountOnProgress, {
	      writable: true,
	      value: true
	    });
	    Object.defineProperty(this, _visitedPagesCount, {
	      writable: true,
	      value: 0
	    });
	    this._linkService = _linkService;
	    this._eventBus = eventBus;
	    babelHelpers.classPrivateFieldLooseBase(this, _updateMatchesCountOnProgress)[_updateMatchesCountOnProgress] = updateMatchesCountOnProgress;
	    this.onIsPageVisible = null;
	    babelHelpers.classPrivateFieldLooseBase(this, _reset3)[_reset3]();
	    eventBus._on("find", babelHelpers.classPrivateFieldLooseBase(this, _onFind)[_onFind].bind(this));
	    eventBus._on("findbarclose", babelHelpers.classPrivateFieldLooseBase(this, _onFindBarClose)[_onFindBarClose].bind(this));
	  }
	  get highlightMatches() {
	    return this._highlightMatches;
	  }
	  get pageMatches() {
	    return this._pageMatches;
	  }
	  get pageMatchesLength() {
	    return this._pageMatchesLength;
	  }
	  get selected() {
	    return this._selected;
	  }
	  get state() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _state)[_state];
	  }
	  setDocument(pdfDocument) {
	    if (this._pdfDocument) {
	      babelHelpers.classPrivateFieldLooseBase(this, _reset3)[_reset3]();
	    }
	    if (!pdfDocument) {
	      return;
	    }
	    this._pdfDocument = pdfDocument;
	    this._firstPageCapability.resolve();
	  }
	  scrollMatchIntoView({
	    element = null,
	    selectedLeft = 0,
	    pageIndex = -1,
	    matchIndex = -1
	  }) {
	    if (!this._scrollMatches || !element) {
	      return;
	    } else if (matchIndex === -1 || matchIndex !== this._selected.matchIdx) {
	      return;
	    } else if (pageIndex === -1 || pageIndex !== this._selected.pageIdx) {
	      return;
	    }
	    this._scrollMatches = false;
	    const spot = {
	      top: MATCH_SCROLL_OFFSET_TOP,
	      left: selectedLeft + MATCH_SCROLL_OFFSET_LEFT
	    };
	    scrollIntoView(element, spot, true);
	  }
	  match(query, pageContent, pageIndex) {
	    const hasDiacritics = this._hasDiacritics[pageIndex];
	    let isUnicode = false;
	    if (typeof query === "string") {
	      [isUnicode, query] = babelHelpers.classPrivateFieldLooseBase(this, _convertToRegExpString)[_convertToRegExpString](query, hasDiacritics);
	    } else {
	      query = query.sort().reverse().map(q => {
	        const [isUnicodePart, queryPart] = babelHelpers.classPrivateFieldLooseBase(this, _convertToRegExpString)[_convertToRegExpString](q, hasDiacritics);
	        isUnicode || (isUnicode = isUnicodePart);
	        return `(${queryPart})`;
	      }).join("|");
	    }
	    if (!query) {
	      return undefined;
	    }
	    const {
	      caseSensitive,
	      entireWord
	    } = babelHelpers.classPrivateFieldLooseBase(this, _state)[_state];
	    const flags = `g${isUnicode ? "u" : ""}${caseSensitive ? "" : "i"}`;
	    query = new RegExp(query, flags);
	    const matches = [];
	    let match;
	    while ((match = query.exec(pageContent)) !== null) {
	      if (entireWord && !babelHelpers.classPrivateFieldLooseBase(this, _isEntireWord)[_isEntireWord](pageContent, match.index, match[0].length)) {
	        continue;
	      }
	      matches.push({
	        index: match.index,
	        length: match[0].length
	      });
	    }
	    return matches;
	  }
	}
	function _onFind2(state) {
	  if (!state) {
	    return;
	  }
	  const pdfDocument = this._pdfDocument;
	  const {
	    type
	  } = state;
	  if (babelHelpers.classPrivateFieldLooseBase(this, _state)[_state] === null || babelHelpers.classPrivateFieldLooseBase(this, _shouldDirtyMatch)[_shouldDirtyMatch](state)) {
	    this._dirtyMatch = true;
	  }
	  babelHelpers.classPrivateFieldLooseBase(this, _state)[_state] = state;
	  if (type !== "highlightallchange") {
	    babelHelpers.classPrivateFieldLooseBase(this, _updateUIState3)[_updateUIState3](FindState.PENDING);
	  }
	  this._firstPageCapability.promise.then(() => {
	    if (!this._pdfDocument || pdfDocument && this._pdfDocument !== pdfDocument) {
	      return;
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _extractText)[_extractText]();
	    const findbarClosed = !this._highlightMatches;
	    const pendingTimeout = !!this._findTimeout;
	    if (this._findTimeout) {
	      clearTimeout(this._findTimeout);
	      this._findTimeout = null;
	    }
	    if (!type) {
	      this._findTimeout = setTimeout(() => {
	        babelHelpers.classPrivateFieldLooseBase(this, _nextMatch)[_nextMatch]();
	        this._findTimeout = null;
	      }, FIND_TIMEOUT);
	    } else if (this._dirtyMatch) {
	      babelHelpers.classPrivateFieldLooseBase(this, _nextMatch)[_nextMatch]();
	    } else if (type === "again") {
	      babelHelpers.classPrivateFieldLooseBase(this, _nextMatch)[_nextMatch]();
	      if (findbarClosed && babelHelpers.classPrivateFieldLooseBase(this, _state)[_state].highlightAll) {
	        babelHelpers.classPrivateFieldLooseBase(this, _updateAllPages)[_updateAllPages]();
	      }
	    } else if (type === "highlightallchange") {
	      if (pendingTimeout) {
	        babelHelpers.classPrivateFieldLooseBase(this, _nextMatch)[_nextMatch]();
	      } else {
	        this._highlightMatches = true;
	      }
	      babelHelpers.classPrivateFieldLooseBase(this, _updateAllPages)[_updateAllPages]();
	    } else {
	      babelHelpers.classPrivateFieldLooseBase(this, _nextMatch)[_nextMatch]();
	    }
	  });
	}
	function _reset4() {
	  this._highlightMatches = false;
	  this._scrollMatches = false;
	  this._pdfDocument = null;
	  this._pageMatches = [];
	  this._pageMatchesLength = [];
	  babelHelpers.classPrivateFieldLooseBase(this, _visitedPagesCount)[_visitedPagesCount] = 0;
	  babelHelpers.classPrivateFieldLooseBase(this, _state)[_state] = null;
	  this._selected = {
	    pageIdx: -1,
	    matchIdx: -1
	  };
	  this._offset = {
	    pageIdx: null,
	    matchIdx: null,
	    wrapped: false
	  };
	  this._extractTextPromises = [];
	  this._pageContents = [];
	  this._pageDiffs = [];
	  this._hasDiacritics = [];
	  this._matchesCountTotal = 0;
	  this._pagesToSearch = null;
	  this._pendingFindMatches = new Set();
	  this._resumePageIdx = null;
	  this._dirtyMatch = false;
	  clearTimeout(this._findTimeout);
	  this._findTimeout = null;
	  this._firstPageCapability = Promise.withResolvers();
	}
	function _get_query() {
	  const {
	    query
	  } = babelHelpers.classPrivateFieldLooseBase(this, _state)[_state];
	  if (typeof query === "string") {
	    if (query !== this._rawQuery) {
	      this._rawQuery = query;
	      [this._normalizedQuery] = normalize(query);
	    }
	    return this._normalizedQuery;
	  }
	  return (query || []).filter(q => !!q).map(q => normalize(q)[0]);
	}
	function _shouldDirtyMatch2(state) {
	  var _this$onIsPageVisible, _this$onIsPageVisible2;
	  const newQuery = state.query,
	    prevQuery = babelHelpers.classPrivateFieldLooseBase(this, _state)[_state].query;
	  const newType = typeof newQuery,
	    prevType = typeof prevQuery;
	  if (newType !== prevType) {
	    return true;
	  }
	  if (newType === "string") {
	    if (newQuery !== prevQuery) {
	      return true;
	    }
	  } else if (JSON.stringify(newQuery) !== JSON.stringify(prevQuery)) {
	    return true;
	  }
	  switch (state.type) {
	    case "again":
	      const pageNumber = this._selected.pageIdx + 1;
	      const linkService = this._linkService;
	      return pageNumber >= 1 && pageNumber <= linkService.pagesCount && pageNumber !== linkService.page && !((_this$onIsPageVisible = (_this$onIsPageVisible2 = this.onIsPageVisible) == null ? void 0 : _this$onIsPageVisible2.call(this, pageNumber)) != null ? _this$onIsPageVisible : true);
	    case "highlightallchange":
	      return false;
	  }
	  return true;
	}
	function _isEntireWord2(content, startIdx, length) {
	  let match = content.slice(0, startIdx).match(NOT_DIACRITIC_FROM_END_REG_EXP);
	  if (match) {
	    const first = content.charCodeAt(startIdx);
	    const limit = match[1].charCodeAt(0);
	    if (getCharacterType(first) === getCharacterType(limit)) {
	      return false;
	    }
	  }
	  match = content.slice(startIdx + length).match(NOT_DIACRITIC_FROM_START_REG_EXP);
	  if (match) {
	    const last = content.charCodeAt(startIdx + length - 1);
	    const limit = match[1].charCodeAt(0);
	    if (getCharacterType(last) === getCharacterType(limit)) {
	      return false;
	    }
	  }
	  return true;
	}
	function _convertToRegExpString2(query, hasDiacritics) {
	  const {
	    matchDiacritics
	  } = babelHelpers.classPrivateFieldLooseBase(this, _state)[_state];
	  let isUnicode = false;
	  query = query.replaceAll(SPECIAL_CHARS_REG_EXP, (match, p1, p2, p3, p4, p5) => {
	    if (p1) {
	      return `[ ]*\\${p1}[ ]*`;
	    }
	    if (p2) {
	      return `[ ]*${p2}[ ]*`;
	    }
	    if (p3) {
	      return "[ ]+";
	    }
	    if (matchDiacritics) {
	      return p4 || p5;
	    }
	    if (p4) {
	      return DIACRITICS_EXCEPTION.has(p4.charCodeAt(0)) ? p4 : "";
	    }
	    if (hasDiacritics) {
	      isUnicode = true;
	      return `${p5}\\p{M}*`;
	    }
	    return p5;
	  });
	  const trailingSpaces = "[ ]*";
	  if (query.endsWith(trailingSpaces)) {
	    query = query.slice(0, query.length - trailingSpaces.length);
	  }
	  if (matchDiacritics) {
	    if (hasDiacritics) {
	      DIACRITICS_EXCEPTION_STR || (DIACRITICS_EXCEPTION_STR = String.fromCharCode(...DIACRITICS_EXCEPTION));
	      isUnicode = true;
	      query = `${query}(?=[${DIACRITICS_EXCEPTION_STR}]|[^\\p{M}]|$)`;
	    }
	  }
	  return [isUnicode, query];
	}
	function _calculateMatch2(pageIndex) {
	  const query = babelHelpers.classPrivateFieldLooseBase(this, _query)[_query];
	  if (query.length === 0) {
	    return;
	  }
	  const pageContent = this._pageContents[pageIndex];
	  const matcherResult = this.match(query, pageContent, pageIndex);
	  const matches = this._pageMatches[pageIndex] = [];
	  const matchesLength = this._pageMatchesLength[pageIndex] = [];
	  const diffs = this._pageDiffs[pageIndex];
	  matcherResult == null ? void 0 : matcherResult.forEach(({
	    index,
	    length
	  }) => {
	    const [matchPos, matchLen] = getOriginalIndex(diffs, index, length);
	    if (matchLen) {
	      matches.push(matchPos);
	      matchesLength.push(matchLen);
	    }
	  });
	  if (babelHelpers.classPrivateFieldLooseBase(this, _state)[_state].highlightAll) {
	    babelHelpers.classPrivateFieldLooseBase(this, _updatePage)[_updatePage](pageIndex);
	  }
	  if (this._resumePageIdx === pageIndex) {
	    this._resumePageIdx = null;
	    babelHelpers.classPrivateFieldLooseBase(this, _nextPageMatch)[_nextPageMatch]();
	  }
	  const pageMatchesCount = matches.length;
	  this._matchesCountTotal += pageMatchesCount;
	  if (babelHelpers.classPrivateFieldLooseBase(this, _updateMatchesCountOnProgress)[_updateMatchesCountOnProgress]) {
	    if (pageMatchesCount > 0) {
	      babelHelpers.classPrivateFieldLooseBase(this, _updateUIResultsCount)[_updateUIResultsCount]();
	    }
	  } else if (++babelHelpers.classPrivateFieldLooseBase(this, _visitedPagesCount)[_visitedPagesCount] === this._linkService.pagesCount) {
	    babelHelpers.classPrivateFieldLooseBase(this, _updateUIResultsCount)[_updateUIResultsCount]();
	  }
	}
	function _extractText2() {
	  if (this._extractTextPromises.length > 0) {
	    return;
	  }
	  let deferred = Promise.resolve();
	  const textOptions = {
	    disableNormalization: true
	  };
	  for (let i = 0, ii = this._linkService.pagesCount; i < ii; i++) {
	    const {
	      promise,
	      resolve
	    } = Promise.withResolvers();
	    this._extractTextPromises[i] = promise;
	    deferred = deferred.then(() => {
	      return this._pdfDocument.getPage(i + 1).then(pdfPage => pdfPage.getTextContent(textOptions)).then(textContent => {
	        const strBuf = [];
	        for (const textItem of textContent.items) {
	          strBuf.push(textItem.str);
	          if (textItem.hasEOL) {
	            strBuf.push("\n");
	          }
	        }
	        [this._pageContents[i], this._pageDiffs[i], this._hasDiacritics[i]] = normalize(strBuf.join(""));
	        resolve();
	      }, reason => {
	        console.error(`Unable to get text content for page ${i + 1}`, reason);
	        this._pageContents[i] = "";
	        this._pageDiffs[i] = null;
	        this._hasDiacritics[i] = false;
	        resolve();
	      });
	    });
	  }
	}
	function _updatePage2(index) {
	  if (this._scrollMatches && this._selected.pageIdx === index) {
	    this._linkService.page = index + 1;
	  }
	  this._eventBus.dispatch("updatetextlayermatches", {
	    source: this,
	    pageIndex: index
	  });
	}
	function _updateAllPages2() {
	  this._eventBus.dispatch("updatetextlayermatches", {
	    source: this,
	    pageIndex: -1
	  });
	}
	function _nextMatch2() {
	  const previous = babelHelpers.classPrivateFieldLooseBase(this, _state)[_state].findPrevious;
	  const currentPageIndex = this._linkService.page - 1;
	  const numPages = this._linkService.pagesCount;
	  this._highlightMatches = true;
	  if (this._dirtyMatch) {
	    this._dirtyMatch = false;
	    this._selected.pageIdx = this._selected.matchIdx = -1;
	    this._offset.pageIdx = currentPageIndex;
	    this._offset.matchIdx = null;
	    this._offset.wrapped = false;
	    this._resumePageIdx = null;
	    this._pageMatches.length = 0;
	    this._pageMatchesLength.length = 0;
	    babelHelpers.classPrivateFieldLooseBase(this, _visitedPagesCount)[_visitedPagesCount] = 0;
	    this._matchesCountTotal = 0;
	    babelHelpers.classPrivateFieldLooseBase(this, _updateAllPages)[_updateAllPages]();
	    for (let i = 0; i < numPages; i++) {
	      if (this._pendingFindMatches.has(i)) {
	        continue;
	      }
	      this._pendingFindMatches.add(i);
	      this._extractTextPromises[i].then(() => {
	        this._pendingFindMatches.delete(i);
	        babelHelpers.classPrivateFieldLooseBase(this, _calculateMatch)[_calculateMatch](i);
	      });
	    }
	  }
	  const query = babelHelpers.classPrivateFieldLooseBase(this, _query)[_query];
	  if (query.length === 0) {
	    babelHelpers.classPrivateFieldLooseBase(this, _updateUIState3)[_updateUIState3](FindState.FOUND);
	    return;
	  }
	  if (this._resumePageIdx) {
	    return;
	  }
	  const offset = this._offset;
	  this._pagesToSearch = numPages;
	  if (offset.matchIdx !== null) {
	    const numPageMatches = this._pageMatches[offset.pageIdx].length;
	    if (!previous && offset.matchIdx + 1 < numPageMatches || previous && offset.matchIdx > 0) {
	      offset.matchIdx = previous ? offset.matchIdx - 1 : offset.matchIdx + 1;
	      babelHelpers.classPrivateFieldLooseBase(this, _updateMatch)[_updateMatch](true);
	      return;
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _advanceOffsetPage)[_advanceOffsetPage](previous);
	  }
	  babelHelpers.classPrivateFieldLooseBase(this, _nextPageMatch)[_nextPageMatch]();
	}
	function _matchesReady2(matches) {
	  const offset = this._offset;
	  const numMatches = matches.length;
	  const previous = babelHelpers.classPrivateFieldLooseBase(this, _state)[_state].findPrevious;
	  if (numMatches) {
	    offset.matchIdx = previous ? numMatches - 1 : 0;
	    babelHelpers.classPrivateFieldLooseBase(this, _updateMatch)[_updateMatch](true);
	    return true;
	  }
	  babelHelpers.classPrivateFieldLooseBase(this, _advanceOffsetPage)[_advanceOffsetPage](previous);
	  if (offset.wrapped) {
	    offset.matchIdx = null;
	    if (this._pagesToSearch < 0) {
	      babelHelpers.classPrivateFieldLooseBase(this, _updateMatch)[_updateMatch](false);
	      return true;
	    }
	  }
	  return false;
	}
	function _nextPageMatch2() {
	  if (this._resumePageIdx !== null) {
	    console.error("There can only be one pending page.");
	  }
	  let matches = null;
	  do {
	    const pageIdx = this._offset.pageIdx;
	    matches = this._pageMatches[pageIdx];
	    if (!matches) {
	      this._resumePageIdx = pageIdx;
	      break;
	    }
	  } while (!babelHelpers.classPrivateFieldLooseBase(this, _matchesReady)[_matchesReady](matches));
	}
	function _advanceOffsetPage2(previous) {
	  const offset = this._offset;
	  const numPages = this._linkService.pagesCount;
	  offset.pageIdx = previous ? offset.pageIdx - 1 : offset.pageIdx + 1;
	  offset.matchIdx = null;
	  this._pagesToSearch--;
	  if (offset.pageIdx >= numPages || offset.pageIdx < 0) {
	    offset.pageIdx = previous ? numPages - 1 : 0;
	    offset.wrapped = true;
	  }
	}
	function _updateMatch2(found = false) {
	  let state = FindState.NOT_FOUND;
	  const wrapped = this._offset.wrapped;
	  this._offset.wrapped = false;
	  if (found) {
	    const previousPage = this._selected.pageIdx;
	    this._selected.pageIdx = this._offset.pageIdx;
	    this._selected.matchIdx = this._offset.matchIdx;
	    state = wrapped ? FindState.WRAPPED : FindState.FOUND;
	    if (previousPage !== -1 && previousPage !== this._selected.pageIdx) {
	      babelHelpers.classPrivateFieldLooseBase(this, _updatePage)[_updatePage](previousPage);
	    }
	  }
	  babelHelpers.classPrivateFieldLooseBase(this, _updateUIState3)[_updateUIState3](state, babelHelpers.classPrivateFieldLooseBase(this, _state)[_state].findPrevious);
	  if (this._selected.pageIdx !== -1) {
	    this._scrollMatches = true;
	    babelHelpers.classPrivateFieldLooseBase(this, _updatePage)[_updatePage](this._selected.pageIdx);
	  }
	}
	function _onFindBarClose2(evt) {
	  const pdfDocument = this._pdfDocument;
	  this._firstPageCapability.promise.then(() => {
	    if (!this._pdfDocument || pdfDocument && this._pdfDocument !== pdfDocument) {
	      return;
	    }
	    if (this._findTimeout) {
	      clearTimeout(this._findTimeout);
	      this._findTimeout = null;
	    }
	    if (this._resumePageIdx) {
	      this._resumePageIdx = null;
	      this._dirtyMatch = true;
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _updateUIState3)[_updateUIState3](FindState.FOUND);
	    this._highlightMatches = false;
	    babelHelpers.classPrivateFieldLooseBase(this, _updateAllPages)[_updateAllPages]();
	  });
	}
	function _requestMatchesCount2() {
	  const {
	    pageIdx,
	    matchIdx
	  } = this._selected;
	  let current = 0,
	    total = this._matchesCountTotal;
	  if (matchIdx !== -1) {
	    for (let i = 0; i < pageIdx; i++) {
	      var _this$_pageMatches$i;
	      current += ((_this$_pageMatches$i = this._pageMatches[i]) == null ? void 0 : _this$_pageMatches$i.length) || 0;
	    }
	    current += matchIdx + 1;
	  }
	  if (current < 1 || current > total) {
	    current = total = 0;
	  }
	  return {
	    current,
	    total
	  };
	}
	function _updateUIResultsCount2() {
	  this._eventBus.dispatch("updatefindmatchescount", {
	    source: this,
	    matchesCount: babelHelpers.classPrivateFieldLooseBase(this, _requestMatchesCount)[_requestMatchesCount]()
	  });
	}
	function _updateUIState4(state, previous = false) {
	  var _babelHelpers$classPr45, _babelHelpers$classPr46, _babelHelpers$classPr47, _babelHelpers$classPr48;
	  if (!babelHelpers.classPrivateFieldLooseBase(this, _updateMatchesCountOnProgress)[_updateMatchesCountOnProgress] && (babelHelpers.classPrivateFieldLooseBase(this, _visitedPagesCount)[_visitedPagesCount] !== this._linkService.pagesCount || state === FindState.PENDING)) {
	    return;
	  }
	  this._eventBus.dispatch("updatefindcontrolstate", {
	    source: this,
	    state,
	    previous,
	    entireWord: (_babelHelpers$classPr45 = (_babelHelpers$classPr46 = babelHelpers.classPrivateFieldLooseBase(this, _state)[_state]) == null ? void 0 : _babelHelpers$classPr46.entireWord) != null ? _babelHelpers$classPr45 : null,
	    matchesCount: babelHelpers.classPrivateFieldLooseBase(this, _requestMatchesCount)[_requestMatchesCount](),
	    rawQuery: (_babelHelpers$classPr47 = (_babelHelpers$classPr48 = babelHelpers.classPrivateFieldLooseBase(this, _state)[_state]) == null ? void 0 : _babelHelpers$classPr48.query) != null ? _babelHelpers$classPr47 : null
	  });
	}

	const MATCHES_COUNT_LIMIT = 1000;
	var _mainContainer2 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("mainContainer");
	var _resizeObserver = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("resizeObserver");
	var _resizeObserverCallback = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("resizeObserverCallback");
	class PDFFindBar {
	  constructor(options, mainContainer, eventBus) {
	    Object.defineProperty(this, _resizeObserverCallback, {
	      value: _resizeObserverCallback2
	    });
	    Object.defineProperty(this, _mainContainer2, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _resizeObserver, {
	      writable: true,
	      value: new ResizeObserver(babelHelpers.classPrivateFieldLooseBase(this, _resizeObserverCallback)[_resizeObserverCallback].bind(this))
	    });
	    this.opened = false;
	    this.bar = options.bar;
	    this.toggleButton = options.toggleButton;
	    this.findField = options.findField;
	    this.highlightAll = options.highlightAllCheckbox;
	    this.caseSensitive = options.caseSensitiveCheckbox;
	    this.matchDiacritics = options.matchDiacriticsCheckbox;
	    this.entireWord = options.entireWordCheckbox;
	    this.findMsg = options.findMsg;
	    this.findResultsCount = options.findResultsCount;
	    this.findPreviousButton = options.findPreviousButton;
	    this.findNextButton = options.findNextButton;
	    this.eventBus = eventBus;
	    babelHelpers.classPrivateFieldLooseBase(this, _mainContainer2)[_mainContainer2] = mainContainer;
	    this.toggleButton.addEventListener("click", () => {
	      this.toggle();
	    });
	    this.findField.addEventListener("input", () => {
	      this.dispatchEvent("");
	    });
	    this.bar.addEventListener("keydown", e => {
	      switch (e.keyCode) {
	        case 13:
	          if (e.target === this.findField) {
	            this.dispatchEvent("again", e.shiftKey);
	          }
	          break;
	        case 27:
	          this.close();
	          break;
	      }
	    });
	    this.findPreviousButton.addEventListener("click", () => {
	      this.dispatchEvent("again", true);
	    });
	    this.findNextButton.addEventListener("click", () => {
	      this.dispatchEvent("again", false);
	    });
	    this.highlightAll.addEventListener("click", () => {
	      this.dispatchEvent("highlightallchange");
	    });
	    this.caseSensitive.addEventListener("click", () => {
	      this.dispatchEvent("casesensitivitychange");
	    });
	    this.entireWord.addEventListener("click", () => {
	      this.dispatchEvent("entirewordchange");
	    });
	    this.matchDiacritics.addEventListener("click", () => {
	      this.dispatchEvent("diacriticmatchingchange");
	    });
	  }
	  reset() {
	    this.updateUIState();
	  }
	  dispatchEvent(type, findPrev = false) {
	    this.eventBus.dispatch("find", {
	      source: this,
	      type,
	      query: this.findField.value,
	      caseSensitive: this.caseSensitive.checked,
	      entireWord: this.entireWord.checked,
	      highlightAll: this.highlightAll.checked,
	      findPrevious: findPrev,
	      matchDiacritics: this.matchDiacritics.checked
	    });
	  }
	  updateUIState(state, previous, matchesCount) {
	    const {
	      findField,
	      findMsg
	    } = this;
	    let findMsgId = "",
	      status = "";
	    switch (state) {
	      case FindState.FOUND:
	        break;
	      case FindState.PENDING:
	        status = "pending";
	        break;
	      case FindState.NOT_FOUND:
	        findMsgId = "pdfjs-find-not-found";
	        status = "notFound";
	        break;
	      case FindState.WRAPPED:
	        findMsgId = previous ? "pdfjs-find-reached-top" : "pdfjs-find-reached-bottom";
	        break;
	    }
	    findField.setAttribute("data-status", status);
	    findField.setAttribute("aria-invalid", state === FindState.NOT_FOUND);
	    findMsg.setAttribute("data-status", status);
	    if (findMsgId) {
	      findMsg.setAttribute("data-l10n-id", findMsgId);
	    } else {
	      findMsg.removeAttribute("data-l10n-id");
	      findMsg.textContent = "";
	    }
	    this.updateResultsCount(matchesCount);
	  }
	  updateResultsCount({
	    current = 0,
	    total = 0
	  } = {}) {
	    const {
	      findResultsCount
	    } = this;
	    if (total > 0) {
	      const limit = MATCHES_COUNT_LIMIT;
	      findResultsCount.setAttribute("data-l10n-id", total > limit ? "pdfjs-find-match-count-limit" : "pdfjs-find-match-count");
	      findResultsCount.setAttribute("data-l10n-args", JSON.stringify({
	        limit,
	        current,
	        total
	      }));
	    } else {
	      findResultsCount.removeAttribute("data-l10n-id");
	      findResultsCount.textContent = "";
	    }
	  }
	  open() {
	    if (!this.opened) {
	      babelHelpers.classPrivateFieldLooseBase(this, _resizeObserver)[_resizeObserver].observe(babelHelpers.classPrivateFieldLooseBase(this, _mainContainer2)[_mainContainer2]);
	      babelHelpers.classPrivateFieldLooseBase(this, _resizeObserver)[_resizeObserver].observe(this.bar);
	      this.opened = true;
	      toggleExpandedBtn(this.toggleButton, true, this.bar);
	    }
	    this.findField.select();
	    this.findField.focus();
	  }
	  close() {
	    if (!this.opened) {
	      return;
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _resizeObserver)[_resizeObserver].disconnect();
	    this.opened = false;
	    toggleExpandedBtn(this.toggleButton, false, this.bar);
	    this.eventBus.dispatch("findbarclose", {
	      source: this
	    });
	  }
	  toggle() {
	    if (this.opened) {
	      this.close();
	    } else {
	      this.open();
	    }
	  }
	}
	function _resizeObserverCallback2() {
	  const {
	    bar
	  } = this;
	  bar.classList.remove("wrapContainers");
	  const findbarHeight = bar.clientHeight;
	  const inputContainerHeight = bar.firstElementChild.clientHeight;
	  if (findbarHeight > inputContainerHeight) {
	    bar.classList.add("wrapContainers");
	  }
	}

	const HASH_CHANGE_TIMEOUT = 1000;
	const POSITION_UPDATED_THRESHOLD = 50;
	const UPDATE_VIEWAREA_TIMEOUT = 1000;
	function getCurrentHash() {
	  return document.location.hash;
	}
	var _eventAbortController = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("eventAbortController");
	var _pushOrReplaceState = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("pushOrReplaceState");
	var _tryPushCurrentPosition = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("tryPushCurrentPosition");
	var _isValidPage = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isValidPage");
	var _isValidState = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isValidState");
	var _updateInternalState = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("updateInternalState");
	var _parseCurrentHash = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("parseCurrentHash");
	var _updateViewarea = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("updateViewarea");
	var _popState = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("popState");
	var _pageHide = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("pageHide");
	var _bindEvents = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("bindEvents");
	var _unbindEvents = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("unbindEvents");
	class PDFHistory {
	  constructor({
	    linkService,
	    eventBus
	  }) {
	    Object.defineProperty(this, _unbindEvents, {
	      value: _unbindEvents2
	    });
	    Object.defineProperty(this, _bindEvents, {
	      value: _bindEvents2
	    });
	    Object.defineProperty(this, _pageHide, {
	      value: _pageHide2
	    });
	    Object.defineProperty(this, _popState, {
	      value: _popState2
	    });
	    Object.defineProperty(this, _updateViewarea, {
	      value: _updateViewarea2
	    });
	    Object.defineProperty(this, _parseCurrentHash, {
	      value: _parseCurrentHash2
	    });
	    Object.defineProperty(this, _updateInternalState, {
	      value: _updateInternalState2
	    });
	    Object.defineProperty(this, _isValidState, {
	      value: _isValidState2
	    });
	    Object.defineProperty(this, _isValidPage, {
	      value: _isValidPage2
	    });
	    Object.defineProperty(this, _tryPushCurrentPosition, {
	      value: _tryPushCurrentPosition2
	    });
	    Object.defineProperty(this, _pushOrReplaceState, {
	      value: _pushOrReplaceState2
	    });
	    Object.defineProperty(this, _eventAbortController, {
	      writable: true,
	      value: null
	    });
	    this.linkService = linkService;
	    this.eventBus = eventBus;
	    this._initialized = false;
	    this._fingerprint = "";
	    this.reset();
	    this.eventBus._on("pagesinit", () => {
	      this._isPagesLoaded = false;
	      this.eventBus._on("pagesloaded", evt => {
	        this._isPagesLoaded = !!evt.pagesCount;
	      }, {
	        once: true
	      });
	    });
	  }
	  initialize({
	    fingerprint,
	    resetHistory = false,
	    updateUrl = false
	  }) {
	    if (!fingerprint || typeof fingerprint !== "string") {
	      console.error('PDFHistory.initialize: The "fingerprint" must be a non-empty string.');
	      return;
	    }
	    if (this._initialized) {
	      this.reset();
	    }
	    const reInitialized = this._fingerprint !== "" && this._fingerprint !== fingerprint;
	    this._fingerprint = fingerprint;
	    this._updateUrl = updateUrl === true;
	    this._initialized = true;
	    babelHelpers.classPrivateFieldLooseBase(this, _bindEvents)[_bindEvents]();
	    const state = window.history.state;
	    this._popStateInProgress = false;
	    this._blockHashChange = 0;
	    this._currentHash = getCurrentHash();
	    this._numPositionUpdates = 0;
	    this._uid = this._maxUid = 0;
	    this._destination = null;
	    this._position = null;
	    if (!babelHelpers.classPrivateFieldLooseBase(this, _isValidState)[_isValidState](state, true) || resetHistory) {
	      const {
	        hash,
	        page,
	        rotation
	      } = babelHelpers.classPrivateFieldLooseBase(this, _parseCurrentHash)[_parseCurrentHash](true);
	      if (!hash || reInitialized || resetHistory) {
	        babelHelpers.classPrivateFieldLooseBase(this, _pushOrReplaceState)[_pushOrReplaceState](null, true);
	        return;
	      }
	      babelHelpers.classPrivateFieldLooseBase(this, _pushOrReplaceState)[_pushOrReplaceState]({
	        hash,
	        page,
	        rotation
	      }, true);
	      return;
	    }
	    const destination = state.destination;
	    babelHelpers.classPrivateFieldLooseBase(this, _updateInternalState)[_updateInternalState](destination, state.uid, true);
	    if (destination.rotation !== undefined) {
	      this._initialRotation = destination.rotation;
	    }
	    if (destination.dest) {
	      this._initialBookmark = JSON.stringify(destination.dest);
	      this._destination.page = null;
	    } else if (destination.hash) {
	      this._initialBookmark = destination.hash;
	    } else if (destination.page) {
	      this._initialBookmark = `page=${destination.page}`;
	    }
	  }
	  reset() {
	    if (this._initialized) {
	      babelHelpers.classPrivateFieldLooseBase(this, _pageHide)[_pageHide]();
	      this._initialized = false;
	      babelHelpers.classPrivateFieldLooseBase(this, _unbindEvents)[_unbindEvents]();
	    }
	    if (this._updateViewareaTimeout) {
	      clearTimeout(this._updateViewareaTimeout);
	      this._updateViewareaTimeout = null;
	    }
	    this._initialBookmark = null;
	    this._initialRotation = null;
	  }
	  push({
	    namedDest = null,
	    explicitDest,
	    pageNumber
	  }) {
	    if (!this._initialized) {
	      return;
	    }
	    if (namedDest && typeof namedDest !== "string") {
	      console.error("PDFHistory.push: " + `"${namedDest}" is not a valid namedDest parameter.`);
	      return;
	    } else if (!Array.isArray(explicitDest)) {
	      console.error("PDFHistory.push: " + `"${explicitDest}" is not a valid explicitDest parameter.`);
	      return;
	    } else if (!babelHelpers.classPrivateFieldLooseBase(this, _isValidPage)[_isValidPage](pageNumber)) {
	      if (pageNumber !== null || this._destination) {
	        console.error("PDFHistory.push: " + `"${pageNumber}" is not a valid pageNumber parameter.`);
	        return;
	      }
	    }
	    const hash = namedDest || JSON.stringify(explicitDest);
	    if (!hash) {
	      return;
	    }
	    let forceReplace = false;
	    if (this._destination && (isDestHashesEqual(this._destination.hash, hash) || isDestArraysEqual(this._destination.dest, explicitDest))) {
	      if (this._destination.page) {
	        return;
	      }
	      forceReplace = true;
	    }
	    if (this._popStateInProgress && !forceReplace) {
	      return;
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _pushOrReplaceState)[_pushOrReplaceState]({
	      dest: explicitDest,
	      hash,
	      page: pageNumber,
	      rotation: this.linkService.rotation
	    }, forceReplace);
	    if (!this._popStateInProgress) {
	      this._popStateInProgress = true;
	      Promise.resolve().then(() => {
	        this._popStateInProgress = false;
	      });
	    }
	  }
	  pushPage(pageNumber) {
	    var _this$_destination;
	    if (!this._initialized) {
	      return;
	    }
	    if (!babelHelpers.classPrivateFieldLooseBase(this, _isValidPage)[_isValidPage](pageNumber)) {
	      console.error(`PDFHistory.pushPage: "${pageNumber}" is not a valid page number.`);
	      return;
	    }
	    if (((_this$_destination = this._destination) == null ? void 0 : _this$_destination.page) === pageNumber) {
	      return;
	    }
	    if (this._popStateInProgress) {
	      return;
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _pushOrReplaceState)[_pushOrReplaceState]({
	      dest: null,
	      hash: `page=${pageNumber}`,
	      page: pageNumber,
	      rotation: this.linkService.rotation
	    });
	    if (!this._popStateInProgress) {
	      this._popStateInProgress = true;
	      Promise.resolve().then(() => {
	        this._popStateInProgress = false;
	      });
	    }
	  }
	  pushCurrentPosition() {
	    if (!this._initialized || this._popStateInProgress) {
	      return;
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _tryPushCurrentPosition)[_tryPushCurrentPosition]();
	  }
	  back() {
	    if (!this._initialized || this._popStateInProgress) {
	      return;
	    }
	    const state = window.history.state;
	    if (babelHelpers.classPrivateFieldLooseBase(this, _isValidState)[_isValidState](state) && state.uid > 0) {
	      window.history.back();
	    }
	  }
	  forward() {
	    if (!this._initialized || this._popStateInProgress) {
	      return;
	    }
	    const state = window.history.state;
	    if (babelHelpers.classPrivateFieldLooseBase(this, _isValidState)[_isValidState](state) && state.uid < this._maxUid) {
	      window.history.forward();
	    }
	  }
	  get popStateInProgress() {
	    return this._initialized && (this._popStateInProgress || this._blockHashChange > 0);
	  }
	  get initialBookmark() {
	    return this._initialized ? this._initialBookmark : null;
	  }
	  get initialRotation() {
	    return this._initialized ? this._initialRotation : null;
	  }
	}
	function _pushOrReplaceState2(destination, forceReplace = false) {
	  const shouldReplace = forceReplace || !this._destination;
	  const newState = {
	    fingerprint: this._fingerprint,
	    uid: shouldReplace ? this._uid : this._uid + 1,
	    destination
	  };
	  babelHelpers.classPrivateFieldLooseBase(this, _updateInternalState)[_updateInternalState](destination, newState.uid);
	  let newUrl;
	  if (this._updateUrl && destination != null && destination.hash) {
	    const baseUrl = document.location.href.split("#", 1)[0];
	    if (!baseUrl.startsWith("file://")) {
	      newUrl = `${baseUrl}#${destination.hash}`;
	    }
	  }
	  if (shouldReplace) {
	    window.history.replaceState(newState, "", newUrl);
	  } else {
	    window.history.pushState(newState, "", newUrl);
	  }
	}
	function _tryPushCurrentPosition2(temporary = false) {
	  if (!this._position) {
	    return;
	  }
	  let position = this._position;
	  if (temporary) {
	    position = Object.assign(Object.create(null), this._position);
	    position.temporary = true;
	  }
	  if (!this._destination) {
	    babelHelpers.classPrivateFieldLooseBase(this, _pushOrReplaceState)[_pushOrReplaceState](position);
	    return;
	  }
	  if (this._destination.temporary) {
	    babelHelpers.classPrivateFieldLooseBase(this, _pushOrReplaceState)[_pushOrReplaceState](position, true);
	    return;
	  }
	  if (this._destination.hash === position.hash) {
	    return;
	  }
	  if (!this._destination.page && (this._numPositionUpdates <= POSITION_UPDATED_THRESHOLD)) {
	    return;
	  }
	  let forceReplace = false;
	  if (this._destination.page >= position.first && this._destination.page <= position.page) {
	    if (this._destination.dest !== undefined || !this._destination.first) {
	      return;
	    }
	    forceReplace = true;
	  }
	  babelHelpers.classPrivateFieldLooseBase(this, _pushOrReplaceState)[_pushOrReplaceState](position, forceReplace);
	}
	function _isValidPage2(val) {
	  return Number.isInteger(val) && val > 0 && val <= this.linkService.pagesCount;
	}
	function _isValidState2(state, checkReload = false) {
	  if (!state) {
	    return false;
	  }
	  if (state.fingerprint !== this._fingerprint) {
	    if (checkReload) {
	      if (typeof state.fingerprint !== "string" || state.fingerprint.length !== this._fingerprint.length) {
	        return false;
	      }
	      const [perfEntry] = performance.getEntriesByType("navigation");
	      if ((perfEntry == null ? void 0 : perfEntry.type) !== "reload") {
	        return false;
	      }
	    } else {
	      return false;
	    }
	  }
	  if (!Number.isInteger(state.uid) || state.uid < 0) {
	    return false;
	  }
	  if (state.destination === null || typeof state.destination !== "object") {
	    return false;
	  }
	  return true;
	}
	function _updateInternalState2(destination, uid, removeTemporary = false) {
	  if (this._updateViewareaTimeout) {
	    clearTimeout(this._updateViewareaTimeout);
	    this._updateViewareaTimeout = null;
	  }
	  if (removeTemporary && destination != null && destination.temporary) {
	    delete destination.temporary;
	  }
	  this._destination = destination;
	  this._uid = uid;
	  this._maxUid = Math.max(this._maxUid, uid);
	  this._numPositionUpdates = 0;
	}
	function _parseCurrentHash2(checkNameddest = false) {
	  const hash = unescape(getCurrentHash()).substring(1);
	  const params = parseQueryString(hash);
	  const nameddest = params.get("nameddest") || "";
	  let page = params.get("page") | 0;
	  if (!babelHelpers.classPrivateFieldLooseBase(this, _isValidPage)[_isValidPage](page) || checkNameddest && nameddest.length > 0) {
	    page = null;
	  }
	  return {
	    hash,
	    page,
	    rotation: this.linkService.rotation
	  };
	}
	function _updateViewarea2({
	  location
	}) {
	  if (this._updateViewareaTimeout) {
	    clearTimeout(this._updateViewareaTimeout);
	    this._updateViewareaTimeout = null;
	  }
	  this._position = {
	    hash: location.pdfOpenParams.substring(1),
	    page: this.linkService.page,
	    first: location.pageNumber,
	    rotation: location.rotation
	  };
	  if (this._popStateInProgress) {
	    return;
	  }
	  if (this._isPagesLoaded && this._destination && !this._destination.page) {
	    this._numPositionUpdates++;
	  }
	  {
	    this._updateViewareaTimeout = setTimeout(() => {
	      if (!this._popStateInProgress) {
	        babelHelpers.classPrivateFieldLooseBase(this, _tryPushCurrentPosition)[_tryPushCurrentPosition](true);
	      }
	      this._updateViewareaTimeout = null;
	    }, UPDATE_VIEWAREA_TIMEOUT);
	  }
	}
	function _popState2({
	  state
	}) {
	  const newHash = getCurrentHash(),
	    hashChanged = this._currentHash !== newHash;
	  this._currentHash = newHash;
	  if (!state) {
	    this._uid++;
	    const {
	      hash,
	      page,
	      rotation
	    } = babelHelpers.classPrivateFieldLooseBase(this, _parseCurrentHash)[_parseCurrentHash]();
	    babelHelpers.classPrivateFieldLooseBase(this, _pushOrReplaceState)[_pushOrReplaceState]({
	      hash,
	      page,
	      rotation
	    }, true);
	    return;
	  }
	  if (!babelHelpers.classPrivateFieldLooseBase(this, _isValidState)[_isValidState](state)) {
	    return;
	  }
	  this._popStateInProgress = true;
	  if (hashChanged) {
	    this._blockHashChange++;
	    waitOnEventOrTimeout({
	      target: window,
	      name: "hashchange",
	      delay: HASH_CHANGE_TIMEOUT
	    }).then(() => {
	      this._blockHashChange--;
	    });
	  }
	  const destination = state.destination;
	  babelHelpers.classPrivateFieldLooseBase(this, _updateInternalState)[_updateInternalState](destination, state.uid, true);
	  if (isValidRotation(destination.rotation)) {
	    this.linkService.rotation = destination.rotation;
	  }
	  if (destination.dest) {
	    this.linkService.goToDestination(destination.dest);
	  } else if (destination.hash) {
	    this.linkService.setHash(destination.hash);
	  } else if (destination.page) {
	    this.linkService.page = destination.page;
	  }
	  Promise.resolve().then(() => {
	    this._popStateInProgress = false;
	  });
	}
	function _pageHide2() {
	  if (!this._destination || this._destination.temporary) {
	    babelHelpers.classPrivateFieldLooseBase(this, _tryPushCurrentPosition)[_tryPushCurrentPosition]();
	  }
	}
	function _bindEvents2() {
	  if (babelHelpers.classPrivateFieldLooseBase(this, _eventAbortController)[_eventAbortController]) {
	    return;
	  }
	  babelHelpers.classPrivateFieldLooseBase(this, _eventAbortController)[_eventAbortController] = new AbortController();
	  const {
	    signal
	  } = babelHelpers.classPrivateFieldLooseBase(this, _eventAbortController)[_eventAbortController];
	  this.eventBus._on("updateviewarea", babelHelpers.classPrivateFieldLooseBase(this, _updateViewarea)[_updateViewarea].bind(this), {
	    signal
	  });
	  window.addEventListener("popstate", babelHelpers.classPrivateFieldLooseBase(this, _popState)[_popState].bind(this), {
	    signal
	  });
	  window.addEventListener("pagehide", babelHelpers.classPrivateFieldLooseBase(this, _pageHide)[_pageHide].bind(this), {
	    signal
	  });
	}
	function _unbindEvents2() {
	  var _babelHelpers$classPr49;
	  (_babelHelpers$classPr49 = babelHelpers.classPrivateFieldLooseBase(this, _eventAbortController)[_eventAbortController]) == null ? void 0 : _babelHelpers$classPr49.abort();
	  babelHelpers.classPrivateFieldLooseBase(this, _eventAbortController)[_eventAbortController] = null;
	}
	function isDestHashesEqual(destHash, pushHash) {
	  if (typeof destHash !== "string" || typeof pushHash !== "string") {
	    return false;
	  }
	  if (destHash === pushHash) {
	    return true;
	  }
	  const nameddest = parseQueryString(destHash).get("nameddest");
	  if (nameddest === pushHash) {
	    return true;
	  }
	  return false;
	}
	function isDestArraysEqual(firstDest, secondDest) {
	  function isEntryEqual(first, second) {
	    if (typeof first !== typeof second) {
	      return false;
	    }
	    if (Array.isArray(first) || Array.isArray(second)) {
	      return false;
	    }
	    if (first !== null && typeof first === "object" && second !== null) {
	      if (Object.keys(first).length !== Object.keys(second).length) {
	        return false;
	      }
	      for (const key in first) {
	        if (!isEntryEqual(first[key], second[key])) {
	          return false;
	        }
	      }
	      return true;
	    }
	    return first === second || Number.isNaN(first) && Number.isNaN(second);
	  }
	  if (!(Array.isArray(firstDest) && Array.isArray(secondDest))) {
	    return false;
	  }
	  if (firstDest.length !== secondDest.length) {
	    return false;
	  }
	  for (let i = 0, ii = firstDest.length; i < ii; i++) {
	    if (!isEntryEqual(firstDest[i], secondDest[i])) {
	      return false;
	    }
	  }
	  return true;
	}
	var _updateLayers = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("updateLayers");
	class PDFLayerViewer extends BaseTreeViewer {
	  constructor(options) {
	    super(options);
	    Object.defineProperty(this, _updateLayers, {
	      value: _updateLayers2
	    });
	    this.eventBus._on("optionalcontentconfigchanged", evt => {
	      babelHelpers.classPrivateFieldLooseBase(this, _updateLayers)[_updateLayers](evt.promise);
	    });
	    this.eventBus._on("resetlayers", () => {
	      babelHelpers.classPrivateFieldLooseBase(this, _updateLayers)[_updateLayers]();
	    });
	    this.eventBus._on("togglelayerstree", this._toggleAllTreeItems.bind(this));
	  }
	  reset() {
	    var _this$_optionalConten;
	    super.reset();
	    this._optionalContentConfig = null;
	    (_this$_optionalConten = this._optionalContentVisibility) == null ? void 0 : _this$_optionalConten.clear();
	    this._optionalContentVisibility = null;
	  }
	  _dispatchEvent(layersCount) {
	    this.eventBus.dispatch("layersloaded", {
	      source: this,
	      layersCount
	    });
	  }
	  _bindLink(element, {
	    groupId,
	    input
	  }) {
	    const setVisibility = () => {
	      const visible = input.checked;
	      this._optionalContentConfig.setVisibility(groupId, visible);
	      const cached = this._optionalContentVisibility.get(groupId);
	      if (cached) {
	        cached.visible = visible;
	      }
	      this.eventBus.dispatch("optionalcontentconfig", {
	        source: this,
	        promise: Promise.resolve(this._optionalContentConfig)
	      });
	    };
	    element.onclick = evt => {
	      if (evt.target === input) {
	        setVisibility();
	        return true;
	      } else if (evt.target !== element) {
	        return true;
	      }
	      input.checked = !input.checked;
	      setVisibility();
	      return false;
	    };
	  }
	  _setNestedName(element, {
	    name = null
	  }) {
	    if (typeof name === "string") {
	      element.textContent = this._normalizeTextContent(name);
	      return;
	    }
	    element.setAttribute("data-l10n-id", "pdfjs-additional-layers");
	    element.style.fontStyle = "italic";
	    this._l10n.translateOnce(element);
	  }
	  _addToggleButton(div, {
	    name = null
	  }) {
	    super._addToggleButton(div, name === null);
	  }
	  _toggleAllTreeItems() {
	    if (!this._optionalContentConfig) {
	      return;
	    }
	    super._toggleAllTreeItems();
	  }
	  render({
	    optionalContentConfig,
	    pdfDocument
	  }) {
	    if (this._optionalContentConfig) {
	      this.reset();
	    }
	    this._optionalContentConfig = optionalContentConfig || null;
	    this._pdfDocument = pdfDocument || null;
	    const groups = optionalContentConfig == null ? void 0 : optionalContentConfig.getOrder();
	    if (!groups) {
	      this._dispatchEvent(0);
	      return;
	    }
	    this._optionalContentVisibility = new Map();
	    const fragment = document.createDocumentFragment(),
	      queue = [{
	        parent: fragment,
	        groups
	      }];
	    let layersCount = 0,
	      hasAnyNesting = false;
	    while (queue.length > 0) {
	      const levelData = queue.shift();
	      for (const groupId of levelData.groups) {
	        const div = document.createElement("div");
	        div.className = "treeItem";
	        const element = document.createElement("a");
	        div.append(element);
	        if (typeof groupId === "object") {
	          hasAnyNesting = true;
	          this._addToggleButton(div, groupId);
	          this._setNestedName(element, groupId);
	          const itemsDiv = document.createElement("div");
	          itemsDiv.className = "treeItems";
	          div.append(itemsDiv);
	          queue.push({
	            parent: itemsDiv,
	            groups: groupId.order
	          });
	        } else {
	          const group = optionalContentConfig.getGroup(groupId);
	          const input = document.createElement("input");
	          this._bindLink(element, {
	            groupId,
	            input
	          });
	          input.type = "checkbox";
	          input.checked = group.visible;
	          this._optionalContentVisibility.set(groupId, {
	            input,
	            visible: input.checked
	          });
	          const label = document.createElement("label");
	          label.textContent = this._normalizeTextContent(group.name);
	          label.append(input);
	          element.append(label);
	          layersCount++;
	        }
	        levelData.parent.append(div);
	      }
	    }
	    this._finishRendering(fragment, layersCount, hasAnyNesting);
	  }
	}
	async function _updateLayers2(promise = null) {
	  if (!this._optionalContentConfig) {
	    return;
	  }
	  const pdfDocument = this._pdfDocument;
	  const optionalContentConfig = await (promise || pdfDocument.getOptionalContentConfig({
	    intent: "display"
	  }));
	  if (pdfDocument !== this._pdfDocument) {
	    return;
	  }
	  if (promise) {
	    for (const [groupId, cached] of this._optionalContentVisibility) {
	      const group = optionalContentConfig.getGroup(groupId);
	      if (group && cached.visible !== group.visible) {
	        cached.input.checked = cached.visible = !cached.visible;
	      }
	    }
	    return;
	  }
	  this.eventBus.dispatch("optionalcontentconfig", {
	    source: this,
	    promise: Promise.resolve(optionalContentConfig)
	  });
	  this.render({
	    optionalContentConfig,
	    pdfDocument: this._pdfDocument
	  });
	}

	class PDFOutlineViewer extends BaseTreeViewer {
	  constructor(options) {
	    super(options);
	    this.linkService = options.linkService;
	    this.downloadManager = options.downloadManager;
	    this.eventBus._on("toggleoutlinetree", this._toggleAllTreeItems.bind(this));
	    this.eventBus._on("currentoutlineitem", this._currentOutlineItem.bind(this));
	    this.eventBus._on("pagechanging", evt => {
	      this._currentPageNumber = evt.pageNumber;
	    });
	    this.eventBus._on("pagesloaded", evt => {
	      var _this$_currentOutline;
	      this._isPagesLoaded = !!evt.pagesCount;
	      (_this$_currentOutline = this._currentOutlineItemCapability) == null ? void 0 : _this$_currentOutline.resolve(this._isPagesLoaded);
	    });
	    this.eventBus._on("sidebarviewchanged", evt => {
	      this._sidebarView = evt.view;
	    });
	  }
	  reset() {
	    var _this$_currentOutline2;
	    super.reset();
	    this._outline = null;
	    this._pageNumberToDestHashCapability = null;
	    this._currentPageNumber = 1;
	    this._isPagesLoaded = null;
	    (_this$_currentOutline2 = this._currentOutlineItemCapability) == null ? void 0 : _this$_currentOutline2.resolve(false);
	    this._currentOutlineItemCapability = null;
	  }
	  _dispatchEvent(outlineCount) {
	    var _this$_pdfDocument;
	    this._currentOutlineItemCapability = Promise.withResolvers();
	    if (outlineCount === 0 || (_this$_pdfDocument = this._pdfDocument) != null && _this$_pdfDocument.loadingParams.disableAutoFetch) {
	      this._currentOutlineItemCapability.resolve(false);
	    } else if (this._isPagesLoaded !== null) {
	      this._currentOutlineItemCapability.resolve(this._isPagesLoaded);
	    }
	    this.eventBus.dispatch("outlineloaded", {
	      source: this,
	      outlineCount,
	      currentOutlineItemPromise: this._currentOutlineItemCapability.promise
	    });
	  }
	  _bindLink(element, {
	    url,
	    newWindow,
	    action,
	    attachment,
	    dest,
	    setOCGState
	  }) {
	    const {
	      linkService
	    } = this;
	    if (url) {
	      linkService.addLinkAttributes(element, url, newWindow);
	      return;
	    }
	    if (action) {
	      element.href = linkService.getAnchorUrl("");
	      element.onclick = () => {
	        linkService.executeNamedAction(action);
	        return false;
	      };
	      return;
	    }
	    if (attachment) {
	      element.href = linkService.getAnchorUrl("");
	      element.onclick = () => {
	        this.downloadManager.openOrDownloadData(attachment.content, attachment.filename);
	        return false;
	      };
	      return;
	    }
	    if (setOCGState) {
	      element.href = linkService.getAnchorUrl("");
	      element.onclick = () => {
	        linkService.executeSetOCGState(setOCGState);
	        return false;
	      };
	      return;
	    }
	    element.href = linkService.getDestinationHash(dest);
	    element.onclick = evt => {
	      this._updateCurrentTreeItem(evt.target.parentNode);
	      if (dest) {
	        linkService.goToDestination(dest);
	      }
	      return false;
	    };
	  }
	  _setStyles(element, {
	    bold,
	    italic
	  }) {
	    if (bold) {
	      element.style.fontWeight = "bold";
	    }
	    if (italic) {
	      element.style.fontStyle = "italic";
	    }
	  }
	  _addToggleButton(div, {
	    count,
	    items
	  }) {
	    let hidden = false;
	    if (count < 0) {
	      let totalCount = items.length;
	      if (totalCount > 0) {
	        const queue = [...items];
	        while (queue.length > 0) {
	          const {
	            count: nestedCount,
	            items: nestedItems
	          } = queue.shift();
	          if (nestedCount > 0 && nestedItems.length > 0) {
	            totalCount += nestedItems.length;
	            queue.push(...nestedItems);
	          }
	        }
	      }
	      if (Math.abs(count) === totalCount) {
	        hidden = true;
	      }
	    }
	    super._addToggleButton(div, hidden);
	  }
	  _toggleAllTreeItems() {
	    if (!this._outline) {
	      return;
	    }
	    super._toggleAllTreeItems();
	  }
	  render({
	    outline,
	    pdfDocument
	  }) {
	    if (this._outline) {
	      this.reset();
	    }
	    this._outline = outline || null;
	    this._pdfDocument = pdfDocument || null;
	    if (!outline) {
	      this._dispatchEvent(0);
	      return;
	    }
	    const fragment = document.createDocumentFragment();
	    const queue = [{
	      parent: fragment,
	      items: outline
	    }];
	    let outlineCount = 0,
	      hasAnyNesting = false;
	    while (queue.length > 0) {
	      const levelData = queue.shift();
	      for (const item of levelData.items) {
	        const div = document.createElement("div");
	        div.className = "treeItem";
	        const element = document.createElement("a");
	        this._bindLink(element, item);
	        this._setStyles(element, item);
	        element.textContent = this._normalizeTextContent(item.title);
	        div.append(element);
	        if (item.items.length > 0) {
	          hasAnyNesting = true;
	          this._addToggleButton(div, item);
	          const itemsDiv = document.createElement("div");
	          itemsDiv.className = "treeItems";
	          div.append(itemsDiv);
	          queue.push({
	            parent: itemsDiv,
	            items: item.items
	          });
	        }
	        levelData.parent.append(div);
	        outlineCount++;
	      }
	    }
	    this._finishRendering(fragment, outlineCount, hasAnyNesting);
	  }
	  async _currentOutlineItem() {
	    if (!this._isPagesLoaded) {
	      throw new Error("_currentOutlineItem: All pages have not been loaded.");
	    }
	    if (!this._outline || !this._pdfDocument) {
	      return;
	    }
	    const pageNumberToDestHash = await this._getPageNumberToDestHash(this._pdfDocument);
	    if (!pageNumberToDestHash) {
	      return;
	    }
	    this._updateCurrentTreeItem(null);
	    if (this._sidebarView !== SidebarView.OUTLINE) {
	      return;
	    }
	    for (let i = this._currentPageNumber; i > 0; i--) {
	      const destHash = pageNumberToDestHash.get(i);
	      if (!destHash) {
	        continue;
	      }
	      const linkElement = this.container.querySelector(`a[href="${destHash}"]`);
	      if (!linkElement) {
	        continue;
	      }
	      this._scrollToCurrentTreeItem(linkElement.parentNode);
	      break;
	    }
	  }
	  async _getPageNumberToDestHash(pdfDocument) {
	    if (this._pageNumberToDestHashCapability) {
	      return this._pageNumberToDestHashCapability.promise;
	    }
	    this._pageNumberToDestHashCapability = Promise.withResolvers();
	    const pageNumberToDestHash = new Map(),
	      pageNumberNesting = new Map();
	    const queue = [{
	      nesting: 0,
	      items: this._outline
	    }];
	    while (queue.length > 0) {
	      const levelData = queue.shift(),
	        currentNesting = levelData.nesting;
	      for (const {
	        dest,
	        items
	      } of levelData.items) {
	        let explicitDest, pageNumber;
	        if (typeof dest === "string") {
	          explicitDest = await pdfDocument.getDestination(dest);
	          if (pdfDocument !== this._pdfDocument) {
	            return null;
	          }
	        } else {
	          explicitDest = dest;
	        }
	        if (Array.isArray(explicitDest)) {
	          const [destRef] = explicitDest;
	          if (destRef && typeof destRef === "object") {
	            pageNumber = pdfDocument.cachedPageNumber(destRef);
	          } else if (Number.isInteger(destRef)) {
	            pageNumber = destRef + 1;
	          }
	          if (Number.isInteger(pageNumber) && (!pageNumberToDestHash.has(pageNumber) || currentNesting > pageNumberNesting.get(pageNumber))) {
	            const destHash = this.linkService.getDestinationHash(dest);
	            pageNumberToDestHash.set(pageNumber, destHash);
	            pageNumberNesting.set(pageNumber, currentNesting);
	          }
	        }
	        if (items.length > 0) {
	          queue.push({
	            nesting: currentNesting + 1,
	            items
	          });
	        }
	      }
	    }
	    this._pageNumberToDestHashCapability.resolve(pageNumberToDestHash.size > 0 ? pageNumberToDestHash : null);
	    return this._pageNumberToDestHashCapability.promise;
	  }
	}

	const DELAY_BEFORE_HIDING_CONTROLS = 3000;
	const ACTIVE_SELECTOR = "pdfPresentationMode";
	const CONTROLS_SELECTOR = "pdfPresentationModeControls";
	const MOUSE_SCROLL_COOLDOWN_TIME = 50;
	const PAGE_SWITCH_THRESHOLD = 0.1;
	const SWIPE_MIN_DISTANCE_THRESHOLD = 50;
	const SWIPE_ANGLE_THRESHOLD = Math.PI / 6;
	var _state2 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("state");
	var _args = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("args");
	var _fullscreenChangeAbortController = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("fullscreenChangeAbortController");
	var _windowAbortController = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("windowAbortController");
	var _mouseWheel = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("mouseWheel");
	var _notifyStateChange = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("notifyStateChange");
	var _enter = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("enter");
	var _exit = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("exit");
	var _mouseDown = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("mouseDown");
	var _contextMenu = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("contextMenu");
	var _showControls = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("showControls");
	var _hideControls = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("hideControls");
	var _resetMouseScrollState = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("resetMouseScrollState");
	var _touchSwipe = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("touchSwipe");
	var _addWindowListeners = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("addWindowListeners");
	var _removeWindowListeners = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("removeWindowListeners");
	var _addFullscreenChangeListeners = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("addFullscreenChangeListeners");
	var _removeFullscreenChangeListeners = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("removeFullscreenChangeListeners");
	class PDFPresentationMode {
	  constructor({
	    container,
	    pdfViewer,
	    eventBus
	  }) {
	    Object.defineProperty(this, _removeFullscreenChangeListeners, {
	      value: _removeFullscreenChangeListeners2
	    });
	    Object.defineProperty(this, _addFullscreenChangeListeners, {
	      value: _addFullscreenChangeListeners2
	    });
	    Object.defineProperty(this, _removeWindowListeners, {
	      value: _removeWindowListeners2
	    });
	    Object.defineProperty(this, _addWindowListeners, {
	      value: _addWindowListeners2
	    });
	    Object.defineProperty(this, _touchSwipe, {
	      value: _touchSwipe2
	    });
	    Object.defineProperty(this, _resetMouseScrollState, {
	      value: _resetMouseScrollState2
	    });
	    Object.defineProperty(this, _hideControls, {
	      value: _hideControls2
	    });
	    Object.defineProperty(this, _showControls, {
	      value: _showControls2
	    });
	    Object.defineProperty(this, _contextMenu, {
	      value: _contextMenu2
	    });
	    Object.defineProperty(this, _mouseDown, {
	      value: _mouseDown2
	    });
	    Object.defineProperty(this, _exit, {
	      value: _exit2
	    });
	    Object.defineProperty(this, _enter, {
	      value: _enter2
	    });
	    Object.defineProperty(this, _notifyStateChange, {
	      value: _notifyStateChange2
	    });
	    Object.defineProperty(this, _mouseWheel, {
	      value: _mouseWheel2
	    });
	    Object.defineProperty(this, _state2, {
	      writable: true,
	      value: PresentationModeState.UNKNOWN
	    });
	    Object.defineProperty(this, _args, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _fullscreenChangeAbortController, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _windowAbortController, {
	      writable: true,
	      value: null
	    });
	    this.container = container;
	    this.pdfViewer = pdfViewer;
	    this.eventBus = eventBus;
	    this.contextMenuOpen = false;
	    this.mouseScrollTimeStamp = 0;
	    this.mouseScrollDelta = 0;
	    this.touchSwipeState = null;
	  }
	  async request() {
	    const {
	      container,
	      pdfViewer
	    } = this;
	    if (this.active || !pdfViewer.pagesCount || !container.requestFullscreen) {
	      return false;
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _addFullscreenChangeListeners)[_addFullscreenChangeListeners]();
	    babelHelpers.classPrivateFieldLooseBase(this, _notifyStateChange)[_notifyStateChange](PresentationModeState.CHANGING);
	    const promise = container.requestFullscreen();
	    babelHelpers.classPrivateFieldLooseBase(this, _args)[_args] = {
	      pageNumber: pdfViewer.currentPageNumber,
	      scaleValue: pdfViewer.currentScaleValue,
	      scrollMode: pdfViewer.scrollMode,
	      spreadMode: null,
	      annotationEditorMode: null
	    };
	    if (pdfViewer.spreadMode !== SpreadMode.NONE && !(pdfViewer.pageViewsReady && pdfViewer.hasEqualPageSizes)) {
	      console.warn("Ignoring Spread modes when entering PresentationMode, " + "since the document may contain varying page sizes.");
	      babelHelpers.classPrivateFieldLooseBase(this, _args)[_args].spreadMode = pdfViewer.spreadMode;
	    }
	    if (pdfViewer.annotationEditorMode !== AnnotationEditorType.DISABLE) {
	      babelHelpers.classPrivateFieldLooseBase(this, _args)[_args].annotationEditorMode = pdfViewer.annotationEditorMode;
	    }
	    try {
	      await promise;
	      pdfViewer.focus();
	      return true;
	    } catch {
	      babelHelpers.classPrivateFieldLooseBase(this, _removeFullscreenChangeListeners)[_removeFullscreenChangeListeners]();
	      babelHelpers.classPrivateFieldLooseBase(this, _notifyStateChange)[_notifyStateChange](PresentationModeState.NORMAL);
	    }
	    return false;
	  }
	  get active() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _state2)[_state2] === PresentationModeState.CHANGING || babelHelpers.classPrivateFieldLooseBase(this, _state2)[_state2] === PresentationModeState.FULLSCREEN;
	  }
	}
	function _mouseWheel2(evt) {
	  if (!this.active) {
	    return;
	  }
	  evt.preventDefault();
	  const delta = normalizeWheelEventDelta(evt);
	  const currentTime = Date.now();
	  const storedTime = this.mouseScrollTimeStamp;
	  if (currentTime > storedTime && currentTime - storedTime < MOUSE_SCROLL_COOLDOWN_TIME) {
	    return;
	  }
	  if (this.mouseScrollDelta > 0 && delta < 0 || this.mouseScrollDelta < 0 && delta > 0) {
	    babelHelpers.classPrivateFieldLooseBase(this, _resetMouseScrollState)[_resetMouseScrollState]();
	  }
	  this.mouseScrollDelta += delta;
	  if (Math.abs(this.mouseScrollDelta) >= PAGE_SWITCH_THRESHOLD) {
	    const totalDelta = this.mouseScrollDelta;
	    babelHelpers.classPrivateFieldLooseBase(this, _resetMouseScrollState)[_resetMouseScrollState]();
	    const success = totalDelta > 0 ? this.pdfViewer.previousPage() : this.pdfViewer.nextPage();
	    if (success) {
	      this.mouseScrollTimeStamp = currentTime;
	    }
	  }
	}
	function _notifyStateChange2(state) {
	  babelHelpers.classPrivateFieldLooseBase(this, _state2)[_state2] = state;
	  this.eventBus.dispatch("presentationmodechanged", {
	    source: this,
	    state
	  });
	}
	function _enter2() {
	  babelHelpers.classPrivateFieldLooseBase(this, _notifyStateChange)[_notifyStateChange](PresentationModeState.FULLSCREEN);
	  this.container.classList.add(ACTIVE_SELECTOR);
	  setTimeout(() => {
	    this.pdfViewer.scrollMode = ScrollMode.PAGE;
	    if (babelHelpers.classPrivateFieldLooseBase(this, _args)[_args].spreadMode !== null) {
	      this.pdfViewer.spreadMode = SpreadMode.NONE;
	    }
	    this.pdfViewer.currentPageNumber = babelHelpers.classPrivateFieldLooseBase(this, _args)[_args].pageNumber;
	    this.pdfViewer.currentScaleValue = "page-fit";
	    if (babelHelpers.classPrivateFieldLooseBase(this, _args)[_args].annotationEditorMode !== null) {
	      this.pdfViewer.annotationEditorMode = {
	        mode: AnnotationEditorType.NONE
	      };
	    }
	  }, 0);
	  babelHelpers.classPrivateFieldLooseBase(this, _addWindowListeners)[_addWindowListeners]();
	  babelHelpers.classPrivateFieldLooseBase(this, _showControls)[_showControls]();
	  this.contextMenuOpen = false;
	  document.getSelection().empty();
	}
	function _exit2() {
	  const pageNumber = this.pdfViewer.currentPageNumber;
	  this.container.classList.remove(ACTIVE_SELECTOR);
	  setTimeout(() => {
	    babelHelpers.classPrivateFieldLooseBase(this, _removeFullscreenChangeListeners)[_removeFullscreenChangeListeners]();
	    babelHelpers.classPrivateFieldLooseBase(this, _notifyStateChange)[_notifyStateChange](PresentationModeState.NORMAL);
	    this.pdfViewer.scrollMode = babelHelpers.classPrivateFieldLooseBase(this, _args)[_args].scrollMode;
	    if (babelHelpers.classPrivateFieldLooseBase(this, _args)[_args].spreadMode !== null) {
	      this.pdfViewer.spreadMode = babelHelpers.classPrivateFieldLooseBase(this, _args)[_args].spreadMode;
	    }
	    this.pdfViewer.currentScaleValue = babelHelpers.classPrivateFieldLooseBase(this, _args)[_args].scaleValue;
	    this.pdfViewer.currentPageNumber = pageNumber;
	    if (babelHelpers.classPrivateFieldLooseBase(this, _args)[_args].annotationEditorMode !== null) {
	      this.pdfViewer.annotationEditorMode = {
	        mode: babelHelpers.classPrivateFieldLooseBase(this, _args)[_args].annotationEditorMode
	      };
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _args)[_args] = null;
	  }, 0);
	  babelHelpers.classPrivateFieldLooseBase(this, _removeWindowListeners)[_removeWindowListeners]();
	  babelHelpers.classPrivateFieldLooseBase(this, _hideControls)[_hideControls]();
	  babelHelpers.classPrivateFieldLooseBase(this, _resetMouseScrollState)[_resetMouseScrollState]();
	  this.contextMenuOpen = false;
	}
	function _mouseDown2(evt) {
	  var _evt$target$parentNod;
	  if (this.contextMenuOpen) {
	    this.contextMenuOpen = false;
	    evt.preventDefault();
	    return;
	  }
	  if (evt.button !== 0) {
	    return;
	  }
	  if (evt.target.href && (_evt$target$parentNod = evt.target.parentNode) != null && _evt$target$parentNod.hasAttribute("data-internal-link")) {
	    return;
	  }
	  evt.preventDefault();
	  if (evt.shiftKey) {
	    this.pdfViewer.previousPage();
	  } else {
	    this.pdfViewer.nextPage();
	  }
	}
	function _contextMenu2() {
	  this.contextMenuOpen = true;
	}
	function _showControls2() {
	  if (this.controlsTimeout) {
	    clearTimeout(this.controlsTimeout);
	  } else {
	    this.container.classList.add(CONTROLS_SELECTOR);
	  }
	  this.controlsTimeout = setTimeout(() => {
	    this.container.classList.remove(CONTROLS_SELECTOR);
	    delete this.controlsTimeout;
	  }, DELAY_BEFORE_HIDING_CONTROLS);
	}
	function _hideControls2() {
	  if (!this.controlsTimeout) {
	    return;
	  }
	  clearTimeout(this.controlsTimeout);
	  this.container.classList.remove(CONTROLS_SELECTOR);
	  delete this.controlsTimeout;
	}
	function _resetMouseScrollState2() {
	  this.mouseScrollTimeStamp = 0;
	  this.mouseScrollDelta = 0;
	}
	function _touchSwipe2(evt) {
	  if (!this.active) {
	    return;
	  }
	  if (evt.touches.length > 1) {
	    this.touchSwipeState = null;
	    return;
	  }
	  switch (evt.type) {
	    case "touchstart":
	      this.touchSwipeState = {
	        startX: evt.touches[0].pageX,
	        startY: evt.touches[0].pageY,
	        endX: evt.touches[0].pageX,
	        endY: evt.touches[0].pageY
	      };
	      break;
	    case "touchmove":
	      if (this.touchSwipeState === null) {
	        return;
	      }
	      this.touchSwipeState.endX = evt.touches[0].pageX;
	      this.touchSwipeState.endY = evt.touches[0].pageY;
	      evt.preventDefault();
	      break;
	    case "touchend":
	      if (this.touchSwipeState === null) {
	        return;
	      }
	      let delta = 0;
	      const dx = this.touchSwipeState.endX - this.touchSwipeState.startX;
	      const dy = this.touchSwipeState.endY - this.touchSwipeState.startY;
	      const absAngle = Math.abs(Math.atan2(dy, dx));
	      if (Math.abs(dx) > SWIPE_MIN_DISTANCE_THRESHOLD && (absAngle <= SWIPE_ANGLE_THRESHOLD || absAngle >= Math.PI - SWIPE_ANGLE_THRESHOLD)) {
	        delta = dx;
	      } else if (Math.abs(dy) > SWIPE_MIN_DISTANCE_THRESHOLD && Math.abs(absAngle - Math.PI / 2) <= SWIPE_ANGLE_THRESHOLD) {
	        delta = dy;
	      }
	      if (delta > 0) {
	        this.pdfViewer.previousPage();
	      } else if (delta < 0) {
	        this.pdfViewer.nextPage();
	      }
	      break;
	  }
	}
	function _addWindowListeners2() {
	  if (babelHelpers.classPrivateFieldLooseBase(this, _windowAbortController)[_windowAbortController]) {
	    return;
	  }
	  babelHelpers.classPrivateFieldLooseBase(this, _windowAbortController)[_windowAbortController] = new AbortController();
	  const {
	    signal
	  } = babelHelpers.classPrivateFieldLooseBase(this, _windowAbortController)[_windowAbortController];
	  const touchSwipeBind = babelHelpers.classPrivateFieldLooseBase(this, _touchSwipe)[_touchSwipe].bind(this);
	  window.addEventListener("mousemove", babelHelpers.classPrivateFieldLooseBase(this, _showControls)[_showControls].bind(this), {
	    signal
	  });
	  window.addEventListener("mousedown", babelHelpers.classPrivateFieldLooseBase(this, _mouseDown)[_mouseDown].bind(this), {
	    signal
	  });
	  window.addEventListener("wheel", babelHelpers.classPrivateFieldLooseBase(this, _mouseWheel)[_mouseWheel].bind(this), {
	    passive: false,
	    signal
	  });
	  window.addEventListener("keydown", babelHelpers.classPrivateFieldLooseBase(this, _resetMouseScrollState)[_resetMouseScrollState].bind(this), {
	    signal
	  });
	  window.addEventListener("contextmenu", babelHelpers.classPrivateFieldLooseBase(this, _contextMenu)[_contextMenu].bind(this), {
	    signal
	  });
	  window.addEventListener("touchstart", touchSwipeBind, {
	    signal
	  });
	  window.addEventListener("touchmove", touchSwipeBind, {
	    signal
	  });
	  window.addEventListener("touchend", touchSwipeBind, {
	    signal
	  });
	}
	function _removeWindowListeners2() {
	  var _babelHelpers$classPr50;
	  (_babelHelpers$classPr50 = babelHelpers.classPrivateFieldLooseBase(this, _windowAbortController)[_windowAbortController]) == null ? void 0 : _babelHelpers$classPr50.abort();
	  babelHelpers.classPrivateFieldLooseBase(this, _windowAbortController)[_windowAbortController] = null;
	}
	function _addFullscreenChangeListeners2() {
	  if (babelHelpers.classPrivateFieldLooseBase(this, _fullscreenChangeAbortController)[_fullscreenChangeAbortController]) {
	    return;
	  }
	  babelHelpers.classPrivateFieldLooseBase(this, _fullscreenChangeAbortController)[_fullscreenChangeAbortController] = new AbortController();
	  window.addEventListener("fullscreenchange", () => {
	    if (document.fullscreenElement) {
	      babelHelpers.classPrivateFieldLooseBase(this, _enter)[_enter]();
	    } else {
	      babelHelpers.classPrivateFieldLooseBase(this, _exit)[_exit]();
	    }
	  }, {
	    signal: babelHelpers.classPrivateFieldLooseBase(this, _fullscreenChangeAbortController)[_fullscreenChangeAbortController].signal
	  });
	}
	function _removeFullscreenChangeListeners2() {
	  var _babelHelpers$classPr51;
	  (_babelHelpers$classPr51 = babelHelpers.classPrivateFieldLooseBase(this, _fullscreenChangeAbortController)[_fullscreenChangeAbortController]) == null ? void 0 : _babelHelpers$classPr51.abort();
	  babelHelpers.classPrivateFieldLooseBase(this, _fullscreenChangeAbortController)[_fullscreenChangeAbortController] = null;
	}

	class XfaLayerBuilder {
	  constructor({
	    pdfPage,
	    annotationStorage = null,
	    linkService,
	    xfaHtml = null
	  }) {
	    this.pdfPage = pdfPage;
	    this.annotationStorage = annotationStorage;
	    this.linkService = linkService;
	    this.xfaHtml = xfaHtml;
	    this.div = null;
	    this._cancelled = false;
	  }
	  async render(viewport, intent = "display") {
	    if (intent === "print") {
	      const parameters = {
	        viewport: viewport.clone({
	          dontFlip: true
	        }),
	        div: this.div,
	        xfaHtml: this.xfaHtml,
	        annotationStorage: this.annotationStorage,
	        linkService: this.linkService,
	        intent
	      };
	      this.div = document.createElement("div");
	      parameters.div = this.div;
	      return XfaLayer.render(parameters);
	    }
	    const xfaHtml = await this.pdfPage.getXfa();
	    if (this._cancelled || !xfaHtml) {
	      return {
	        textDivs: []
	      };
	    }
	    const parameters = {
	      viewport: viewport.clone({
	        dontFlip: true
	      }),
	      div: this.div,
	      xfaHtml,
	      annotationStorage: this.annotationStorage,
	      linkService: this.linkService,
	      intent
	    };
	    if (this.div) {
	      return XfaLayer.update(parameters);
	    }
	    this.div = document.createElement("div");
	    parameters.div = this.div;
	    return XfaLayer.render(parameters);
	  }
	  cancel() {
	    this._cancelled = true;
	  }
	  hide() {
	    if (!this.div) {
	      return;
	    }
	    this.div.hidden = true;
	  }
	}

	function getXfaHtmlForPrinting(printContainer, pdfDocument) {
	  const xfaHtml = pdfDocument.allXfaHtml;
	  const linkService = new SimpleLinkService();
	  const scale = Math.round(PixelsPerInch.PDF_TO_CSS_UNITS * 100) / 100;
	  for (const xfaPage of xfaHtml.children) {
	    const page = document.createElement("div");
	    page.className = "xfaPrintedPage";
	    printContainer.append(page);
	    const builder = new XfaLayerBuilder({
	      pdfPage: null,
	      annotationStorage: pdfDocument.annotationStorage,
	      linkService,
	      xfaHtml: xfaPage
	    });
	    const viewport = getXfaPageViewport(xfaPage, {
	      scale
	    });
	    builder.render(viewport, "print");
	    page.append(builder.div);
	  }
	}

	let activeService = null;
	let dialog = null;
	let overlayManager = null;
	let viewerApp = {
	  initialized: false
	};
	function renderPage(activeServiceOnEntry, pdfDocument, pageNumber, size, printResolution, optionalContentConfigPromise, printAnnotationStoragePromise) {
	  const scratchCanvas = activeService.scratchCanvas;
	  const PRINT_UNITS = printResolution / PixelsPerInch.PDF;
	  scratchCanvas.width = Math.floor(size.width * PRINT_UNITS);
	  scratchCanvas.height = Math.floor(size.height * PRINT_UNITS);
	  const ctx = scratchCanvas.getContext("2d");
	  ctx.save();
	  ctx.fillStyle = "rgb(255, 255, 255)";
	  ctx.fillRect(0, 0, scratchCanvas.width, scratchCanvas.height);
	  ctx.restore();
	  return Promise.all([pdfDocument.getPage(pageNumber), printAnnotationStoragePromise]).then(function ([pdfPage, printAnnotationStorage]) {
	    const renderContext = {
	      canvasContext: ctx,
	      transform: [PRINT_UNITS, 0, 0, PRINT_UNITS, 0, 0],
	      viewport: pdfPage.getViewport({
	        scale: 1,
	        rotation: size.rotation
	      }),
	      intent: "print",
	      annotationMode: AnnotationMode.ENABLE_STORAGE,
	      optionalContentConfigPromise,
	      printAnnotationStorage
	    };
	    const renderTask = pdfPage.render(renderContext);
	    return renderTask.promise.catch(reason => {
	      if (!(reason instanceof RenderingCancelledException)) {
	        console.error(reason);
	      }
	      throw reason;
	    });
	  });
	}
	class PDFPrintService {
	  constructor({
	    pdfDocument,
	    pagesOverview,
	    printContainer,
	    printResolution,
	    printAnnotationStoragePromise = null
	  }) {
	    this.pdfDocument = pdfDocument;
	    this.pagesOverview = pagesOverview;
	    this.printContainer = printContainer;
	    this._printResolution = printResolution || 150;
	    this._optionalContentConfigPromise = pdfDocument.getOptionalContentConfig({
	      intent: "print"
	    });
	    this._printAnnotationStoragePromise = printAnnotationStoragePromise || Promise.resolve();
	    this.currentPage = -1;
	    this.scratchCanvas = document.createElement("canvas");
	  }
	  layout() {
	    this.throwIfInactive();
	    const body = document.querySelector("body");
	    body.setAttribute("data-pdfjsprinting", true);
	    const {
	      width,
	      height
	    } = this.pagesOverview[0];
	    const hasEqualPageSizes = this.pagesOverview.every(size => size.width === width && size.height === height);
	    if (!hasEqualPageSizes) {
	      console.warn("Not all pages have the same size. The printed result may be incorrect!");
	    }
	    this.pageStyleSheet = document.createElement("style");
	    this.pageStyleSheet.textContent = `@page { size: ${width}pt ${height}pt;}`;
	    body.append(this.pageStyleSheet);
	  }
	  destroy() {
	    if (activeService !== this) {
	      return;
	    }
	    this.printContainer.textContent = "";
	    const body = document.querySelector("body");
	    body.removeAttribute("data-pdfjsprinting");
	    if (this.pageStyleSheet) {
	      this.pageStyleSheet.remove();
	      this.pageStyleSheet = null;
	    }
	    this.scratchCanvas.width = this.scratchCanvas.height = 0;
	    this.scratchCanvas = null;
	    activeService = null;
	    ensureOverlay().then(function () {
	      if (overlayManager.active === dialog) {
	        overlayManager.close(dialog);
	      }
	    });
	  }
	  renderPages() {
	    if (this.pdfDocument.isPureXfa) {
	      getXfaHtmlForPrinting(this.printContainer, this.pdfDocument);
	      return Promise.resolve();
	    }
	    const pageCount = this.pagesOverview.length;
	    const renderNextPage = (resolve, reject) => {
	      this.throwIfInactive();
	      if (++this.currentPage >= pageCount) {
	        renderProgress(pageCount, pageCount);
	        resolve();
	        return;
	      }
	      const index = this.currentPage;
	      renderProgress(index, pageCount);
	      renderPage(this, this.pdfDocument, index + 1, this.pagesOverview[index], this._printResolution, this._optionalContentConfigPromise, this._printAnnotationStoragePromise).then(this.useRenderedPage.bind(this)).then(function () {
	        renderNextPage(resolve, reject);
	      }, reject);
	    };
	    return new Promise(renderNextPage);
	  }
	  useRenderedPage() {
	    this.throwIfInactive();
	    const img = document.createElement("img");
	    this.scratchCanvas.toBlob(blob => {
	      img.src = URL.createObjectURL(blob);
	    });
	    const wrapper = document.createElement("div");
	    wrapper.className = "printedPage";
	    wrapper.append(img);
	    this.printContainer.append(wrapper);
	    const {
	      promise,
	      resolve,
	      reject
	    } = Promise.withResolvers();
	    img.onload = resolve;
	    img.onerror = reject;
	    promise.catch(() => {}).then(() => {
	      URL.revokeObjectURL(img.src);
	    });
	    return promise;
	  }
	  performPrint() {
	    this.throwIfInactive();
	    return new Promise(resolve => {
	      setTimeout(() => {
	        if (!this.active) {
	          resolve();
	          return;
	        }
	        print.call(window);
	        setTimeout(resolve, 20);
	      }, 0);
	    });
	  }
	  get active() {
	    return this === activeService;
	  }
	  throwIfInactive() {
	    if (!this.active) {
	      throw new Error("This print request was cancelled or completed.");
	    }
	  }
	}
	const print = window.print;
	window.print = function () {
	  if (activeService) {
	    console.warn("Ignored window.print() because of a pending print job.");
	    return;
	  }
	  ensureOverlay().then(function () {
	    if (activeService) {
	      overlayManager.open(dialog);
	    }
	  });
	  try {
	    dispatchEvent("beforeprint");
	  } finally {
	    if (!activeService) {
	      console.error("Expected print service to be initialized.");
	      ensureOverlay().then(function () {
	        if (overlayManager.active === dialog) {
	          overlayManager.close(dialog);
	        }
	      });
	      return;
	    }
	    const activeServiceOnEntry = activeService;
	    activeService.renderPages().then(function () {
	      return activeServiceOnEntry.performPrint();
	    }).catch(function () {}).then(function () {
	      if (activeServiceOnEntry.active) {
	        abort();
	      }
	    });
	  }
	};
	function dispatchEvent(eventType) {
	  const event = new CustomEvent(eventType, {
	    bubbles: false,
	    cancelable: false,
	    detail: "custom"
	  });
	  window.dispatchEvent(event);
	}
	function abort() {
	  if (activeService) {
	    activeService.destroy();
	    dispatchEvent("afterprint");
	  }
	}
	function renderProgress(index, total) {
	  dialog || (dialog = document.getElementById("printServiceDialog"));
	  const progress = Math.round(100 * index / total);
	  const progressBar = dialog.querySelector("progress");
	  const progressPerc = dialog.querySelector(".relative-progress");
	  progressBar.value = progress;
	  progressPerc.setAttribute("data-l10n-args", JSON.stringify({
	    progress
	  }));
	}
	window.addEventListener("keydown", function (event) {
	  if (event.keyCode === 80 && (event.ctrlKey || event.metaKey) && !event.altKey && (!event.shiftKey || window.chrome || window.opera)) {
	    window.print();
	    event.preventDefault();
	    event.stopImmediatePropagation();
	  }
	}, true);
	if ("onbeforeprint" in window) {
	  const stopPropagationIfNeeded = function (event) {
	    if (event.detail !== "custom") {
	      event.stopImmediatePropagation();
	    }
	  };
	  window.addEventListener("beforeprint", stopPropagationIfNeeded);
	  window.addEventListener("afterprint", stopPropagationIfNeeded);
	}
	let overlayPromise;
	function ensureOverlay() {
	  if (!overlayPromise) {
	    overlayManager = viewerApp.overlayManager;
	    if (!overlayManager) {
	      throw new Error("The overlay manager has not yet been initialized.");
	    }
	    dialog || (dialog = document.getElementById("printServiceDialog"));
	    overlayPromise = overlayManager.register(dialog, true);
	    document.getElementById("printCancel").onclick = abort;
	    dialog.addEventListener("close", abort);
	  }
	  return overlayPromise;
	}
	class PDFPrintServiceFactory {
	  static initGlobals(app) {
	    viewerApp = app;
	  }
	  static get supportsPrinting() {
	    return shadow(this, "supportsPrinting", true);
	  }
	  static createPrintService(params) {
	    if (activeService) {
	      throw new Error("The print service is created and active.");
	    }
	    return activeService = new PDFPrintService(params);
	  }
	}

	const CLEANUP_TIMEOUT = 30000;
	class PDFRenderingQueue {
	  constructor() {
	    this.pdfViewer = null;
	    this.pdfThumbnailViewer = null;
	    this.onIdle = null;
	    this.highestPriorityPage = null;
	    this.idleTimeout = null;
	    this.printing = false;
	    this.isThumbnailViewEnabled = false;
	    Object.defineProperty(this, "hasViewer", {
	      value: () => !!this.pdfViewer
	    });
	  }
	  setViewer(pdfViewer) {
	    this.pdfViewer = pdfViewer;
	  }
	  setThumbnailViewer(pdfThumbnailViewer) {
	    this.pdfThumbnailViewer = pdfThumbnailViewer;
	  }
	  isHighestPriority(view) {
	    return this.highestPriorityPage === view.renderingId;
	  }
	  renderHighestPriority(currentlyVisiblePages) {
	    var _this$pdfThumbnailVie;
	    if (this.idleTimeout) {
	      clearTimeout(this.idleTimeout);
	      this.idleTimeout = null;
	    }
	    if (this.pdfViewer.forceRendering(currentlyVisiblePages)) {
	      return;
	    }
	    if (this.isThumbnailViewEnabled && (_this$pdfThumbnailVie = this.pdfThumbnailViewer) != null && _this$pdfThumbnailVie.forceRendering()) {
	      return;
	    }
	    if (this.printing) {
	      return;
	    }
	    if (this.onIdle) {
	      this.idleTimeout = setTimeout(this.onIdle.bind(this), CLEANUP_TIMEOUT);
	    }
	  }
	  getHighestPriority(visible, views, scrolledDown, preRenderExtra = false) {
	    const visibleViews = visible.views,
	      numVisible = visibleViews.length;
	    if (numVisible === 0) {
	      return null;
	    }
	    for (let i = 0; i < numVisible; i++) {
	      const view = visibleViews[i].view;
	      if (!this.isViewFinished(view)) {
	        return view;
	      }
	    }
	    const firstId = visible.first.id,
	      lastId = visible.last.id;
	    if (lastId - firstId + 1 > numVisible) {
	      const visibleIds = visible.ids;
	      for (let i = 1, ii = lastId - firstId; i < ii; i++) {
	        const holeId = scrolledDown ? firstId + i : lastId - i;
	        if (visibleIds.has(holeId)) {
	          continue;
	        }
	        const holeView = views[holeId - 1];
	        if (!this.isViewFinished(holeView)) {
	          return holeView;
	        }
	      }
	    }
	    let preRenderIndex = scrolledDown ? lastId : firstId - 2;
	    let preRenderView = views[preRenderIndex];
	    if (preRenderView && !this.isViewFinished(preRenderView)) {
	      return preRenderView;
	    }
	    if (preRenderExtra) {
	      preRenderIndex += scrolledDown ? 1 : -1;
	      preRenderView = views[preRenderIndex];
	      if (preRenderView && !this.isViewFinished(preRenderView)) {
	        return preRenderView;
	      }
	    }
	    return null;
	  }
	  isViewFinished(view) {
	    return view.renderingState === RenderingStates.FINISHED;
	  }
	  renderView(view) {
	    switch (view.renderingState) {
	      case RenderingStates.FINISHED:
	        return false;
	      case RenderingStates.PAUSED:
	        this.highestPriorityPage = view.renderingId;
	        view.resume();
	        break;
	      case RenderingStates.RUNNING:
	        this.highestPriorityPage = view.renderingId;
	        break;
	      case RenderingStates.INITIAL:
	        this.highestPriorityPage = view.renderingId;
	        view.draw().finally(() => {
	          this.renderHighestPriority();
	        }).catch(reason => {
	          if (reason instanceof RenderingCancelledException) {
	            return;
	          }
	          console.error(`renderView: "${reason}"`);
	        });
	        break;
	    }
	    return true;
	  }
	}
	var _closeCapability = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("closeCapability");
	var _destroyCapability = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("destroyCapability");
	var _docProperties = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("docProperties");
	var _eventAbortController2 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("eventAbortController");
	var _eventBus4 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("eventBus");
	var _externalServices2 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("externalServices");
	var _pdfDocument = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("pdfDocument");
	var _pdfViewer = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("pdfViewer");
	var _ready = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("ready");
	var _scripting = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("scripting");
	var _willPrintCapability = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("willPrintCapability");
	var _updateFromSandbox = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("updateFromSandbox");
	var _dispatchPageOpen = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("dispatchPageOpen");
	var _dispatchPageClose = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("dispatchPageClose");
	var _initScripting = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("initScripting");
	var _destroyScripting = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("destroyScripting");
	class PDFScriptingManager {
	  constructor({
	    eventBus,
	    externalServices = null,
	    docProperties = null
	  }) {
	    Object.defineProperty(this, _destroyScripting, {
	      value: _destroyScripting2
	    });
	    Object.defineProperty(this, _initScripting, {
	      value: _initScripting2
	    });
	    Object.defineProperty(this, _dispatchPageClose, {
	      value: _dispatchPageClose2
	    });
	    Object.defineProperty(this, _dispatchPageOpen, {
	      value: _dispatchPageOpen2
	    });
	    Object.defineProperty(this, _updateFromSandbox, {
	      value: _updateFromSandbox2
	    });
	    Object.defineProperty(this, _closeCapability, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _destroyCapability, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _docProperties, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _eventAbortController2, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _eventBus4, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _externalServices2, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _pdfDocument, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _pdfViewer, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _ready, {
	      writable: true,
	      value: false
	    });
	    Object.defineProperty(this, _scripting, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _willPrintCapability, {
	      writable: true,
	      value: null
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _eventBus4)[_eventBus4] = eventBus;
	    babelHelpers.classPrivateFieldLooseBase(this, _externalServices2)[_externalServices2] = externalServices;
	    babelHelpers.classPrivateFieldLooseBase(this, _docProperties)[_docProperties] = docProperties;
	  }
	  setViewer(pdfViewer) {
	    babelHelpers.classPrivateFieldLooseBase(this, _pdfViewer)[_pdfViewer] = pdfViewer;
	  }
	  async setDocument(pdfDocument) {
	    var _babelHelpers$classPr8;
	    if (babelHelpers.classPrivateFieldLooseBase(this, _pdfDocument)[_pdfDocument]) {
	      await babelHelpers.classPrivateFieldLooseBase(this, _destroyScripting)[_destroyScripting]();
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _pdfDocument)[_pdfDocument] = pdfDocument;
	    if (!pdfDocument) {
	      return;
	    }
	    const [objects, calculationOrder, docActions] = await Promise.all([pdfDocument.getFieldObjects(), pdfDocument.getCalculationOrderIds(), pdfDocument.getJSActions()]);
	    if (!objects && !docActions) {
	      await babelHelpers.classPrivateFieldLooseBase(this, _destroyScripting)[_destroyScripting]();
	      return;
	    }
	    if (pdfDocument !== babelHelpers.classPrivateFieldLooseBase(this, _pdfDocument)[_pdfDocument]) {
	      return;
	    }
	    try {
	      babelHelpers.classPrivateFieldLooseBase(this, _scripting)[_scripting] = babelHelpers.classPrivateFieldLooseBase(this, _initScripting)[_initScripting]();
	    } catch (error) {
	      console.error(`setDocument: "${error.message}".`);
	      await babelHelpers.classPrivateFieldLooseBase(this, _destroyScripting)[_destroyScripting]();
	      return;
	    }
	    const eventBus = babelHelpers.classPrivateFieldLooseBase(this, _eventBus4)[_eventBus4];
	    babelHelpers.classPrivateFieldLooseBase(this, _eventAbortController2)[_eventAbortController2] = new AbortController();
	    const {
	      signal
	    } = babelHelpers.classPrivateFieldLooseBase(this, _eventAbortController2)[_eventAbortController2];
	    eventBus._on("updatefromsandbox", event => {
	      if ((event == null ? void 0 : event.source) === window) {
	        babelHelpers.classPrivateFieldLooseBase(this, _updateFromSandbox)[_updateFromSandbox](event.detail);
	      }
	    }, {
	      signal
	    });
	    eventBus._on("dispatcheventinsandbox", event => {
	      var _babelHelpers$classPr5;
	      (_babelHelpers$classPr5 = babelHelpers.classPrivateFieldLooseBase(this, _scripting)[_scripting]) == null ? void 0 : _babelHelpers$classPr5.dispatchEventInSandbox(event.detail);
	    }, {
	      signal
	    });
	    eventBus._on("pagechanging", ({
	      pageNumber,
	      previous
	    }) => {
	      if (pageNumber === previous) {
	        return;
	      }
	      babelHelpers.classPrivateFieldLooseBase(this, _dispatchPageClose)[_dispatchPageClose](previous);
	      babelHelpers.classPrivateFieldLooseBase(this, _dispatchPageOpen)[_dispatchPageOpen](pageNumber);
	    }, {
	      signal
	    });
	    eventBus._on("pagerendered", ({
	      pageNumber
	    }) => {
	      if (!this._pageOpenPending.has(pageNumber)) {
	        return;
	      }
	      if (pageNumber !== babelHelpers.classPrivateFieldLooseBase(this, _pdfViewer)[_pdfViewer].currentPageNumber) {
	        return;
	      }
	      babelHelpers.classPrivateFieldLooseBase(this, _dispatchPageOpen)[_dispatchPageOpen](pageNumber);
	    }, {
	      signal
	    });
	    eventBus._on("pagesdestroy", async () => {
	      var _babelHelpers$classPr6, _babelHelpers$classPr7;
	      await babelHelpers.classPrivateFieldLooseBase(this, _dispatchPageClose)[_dispatchPageClose](babelHelpers.classPrivateFieldLooseBase(this, _pdfViewer)[_pdfViewer].currentPageNumber);
	      await ((_babelHelpers$classPr6 = babelHelpers.classPrivateFieldLooseBase(this, _scripting)[_scripting]) == null ? void 0 : _babelHelpers$classPr6.dispatchEventInSandbox({
	        id: "doc",
	        name: "WillClose"
	      }));
	      (_babelHelpers$classPr7 = babelHelpers.classPrivateFieldLooseBase(this, _closeCapability)[_closeCapability]) == null ? void 0 : _babelHelpers$classPr7.resolve();
	    }, {
	      signal
	    });
	    try {
	      const docProperties = await babelHelpers.classPrivateFieldLooseBase(this, _docProperties)[_docProperties](pdfDocument);
	      if (pdfDocument !== babelHelpers.classPrivateFieldLooseBase(this, _pdfDocument)[_pdfDocument]) {
	        return;
	      }
	      await babelHelpers.classPrivateFieldLooseBase(this, _scripting)[_scripting].createSandbox({
	        objects,
	        calculationOrder,
	        appInfo: {
	          platform: navigator.platform,
	          language: navigator.language
	        },
	        docInfo: {
	          ...docProperties,
	          actions: docActions
	        }
	      });
	      eventBus.dispatch("sandboxcreated", {
	        source: this
	      });
	    } catch (error) {
	      console.error(`setDocument: "${error.message}".`);
	      await babelHelpers.classPrivateFieldLooseBase(this, _destroyScripting)[_destroyScripting]();
	      return;
	    }
	    await ((_babelHelpers$classPr8 = babelHelpers.classPrivateFieldLooseBase(this, _scripting)[_scripting]) == null ? void 0 : _babelHelpers$classPr8.dispatchEventInSandbox({
	      id: "doc",
	      name: "Open"
	    }));
	    await babelHelpers.classPrivateFieldLooseBase(this, _dispatchPageOpen)[_dispatchPageOpen](babelHelpers.classPrivateFieldLooseBase(this, _pdfViewer)[_pdfViewer].currentPageNumber, true);
	    Promise.resolve().then(() => {
	      if (pdfDocument === babelHelpers.classPrivateFieldLooseBase(this, _pdfDocument)[_pdfDocument]) {
	        babelHelpers.classPrivateFieldLooseBase(this, _ready)[_ready] = true;
	      }
	    });
	  }
	  async dispatchWillSave() {
	    var _babelHelpers$classPr9;
	    return (_babelHelpers$classPr9 = babelHelpers.classPrivateFieldLooseBase(this, _scripting)[_scripting]) == null ? void 0 : _babelHelpers$classPr9.dispatchEventInSandbox({
	      id: "doc",
	      name: "WillSave"
	    });
	  }
	  async dispatchDidSave() {
	    var _babelHelpers$classPr10;
	    return (_babelHelpers$classPr10 = babelHelpers.classPrivateFieldLooseBase(this, _scripting)[_scripting]) == null ? void 0 : _babelHelpers$classPr10.dispatchEventInSandbox({
	      id: "doc",
	      name: "DidSave"
	    });
	  }
	  async dispatchWillPrint() {
	    var _babelHelpers$classPr11;
	    if (!babelHelpers.classPrivateFieldLooseBase(this, _scripting)[_scripting]) {
	      return;
	    }
	    await ((_babelHelpers$classPr11 = babelHelpers.classPrivateFieldLooseBase(this, _willPrintCapability)[_willPrintCapability]) == null ? void 0 : _babelHelpers$classPr11.promise);
	    babelHelpers.classPrivateFieldLooseBase(this, _willPrintCapability)[_willPrintCapability] = Promise.withResolvers();
	    try {
	      await babelHelpers.classPrivateFieldLooseBase(this, _scripting)[_scripting].dispatchEventInSandbox({
	        id: "doc",
	        name: "WillPrint"
	      });
	    } catch (ex) {
	      babelHelpers.classPrivateFieldLooseBase(this, _willPrintCapability)[_willPrintCapability].resolve();
	      babelHelpers.classPrivateFieldLooseBase(this, _willPrintCapability)[_willPrintCapability] = null;
	      throw ex;
	    }
	    await babelHelpers.classPrivateFieldLooseBase(this, _willPrintCapability)[_willPrintCapability].promise;
	  }
	  async dispatchDidPrint() {
	    var _babelHelpers$classPr12;
	    return (_babelHelpers$classPr12 = babelHelpers.classPrivateFieldLooseBase(this, _scripting)[_scripting]) == null ? void 0 : _babelHelpers$classPr12.dispatchEventInSandbox({
	      id: "doc",
	      name: "DidPrint"
	    });
	  }
	  get destroyPromise() {
	    var _babelHelpers$classPr13;
	    return ((_babelHelpers$classPr13 = babelHelpers.classPrivateFieldLooseBase(this, _destroyCapability)[_destroyCapability]) == null ? void 0 : _babelHelpers$classPr13.promise) || null;
	  }
	  get ready() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _ready)[_ready];
	  }
	  get _pageOpenPending() {
	    return shadow(this, "_pageOpenPending", new Set());
	  }
	  get _visitedPages() {
	    return shadow(this, "_visitedPages", new Map());
	  }
	}
	async function _updateFromSandbox2(detail) {
	  var _babelHelpers$classPr52;
	  const pdfViewer = babelHelpers.classPrivateFieldLooseBase(this, _pdfViewer)[_pdfViewer];
	  const isInPresentationMode = pdfViewer.isInPresentationMode || pdfViewer.isChangingPresentationMode;
	  const {
	    id,
	    siblings,
	    command,
	    value
	  } = detail;
	  if (!id) {
	    switch (command) {
	      case "clear":
	        console.clear();
	        break;
	      case "error":
	        console.error(value);
	        break;
	      case "layout":
	        if (!isInPresentationMode) {
	          const modes = apiPageLayoutToViewerModes(value);
	          pdfViewer.spreadMode = modes.spreadMode;
	        }
	        break;
	      case "page-num":
	        pdfViewer.currentPageNumber = value + 1;
	        break;
	      case "print":
	        await pdfViewer.pagesPromise;
	        babelHelpers.classPrivateFieldLooseBase(this, _eventBus4)[_eventBus4].dispatch("print", {
	          source: this
	        });
	        break;
	      case "println":
	        console.log(value);
	        break;
	      case "zoom":
	        if (!isInPresentationMode) {
	          pdfViewer.currentScaleValue = value;
	        }
	        break;
	      case "SaveAs":
	        babelHelpers.classPrivateFieldLooseBase(this, _eventBus4)[_eventBus4].dispatch("download", {
	          source: this
	        });
	        break;
	      case "FirstPage":
	        pdfViewer.currentPageNumber = 1;
	        break;
	      case "LastPage":
	        pdfViewer.currentPageNumber = pdfViewer.pagesCount;
	        break;
	      case "NextPage":
	        pdfViewer.nextPage();
	        break;
	      case "PrevPage":
	        pdfViewer.previousPage();
	        break;
	      case "ZoomViewIn":
	        if (!isInPresentationMode) {
	          pdfViewer.increaseScale();
	        }
	        break;
	      case "ZoomViewOut":
	        if (!isInPresentationMode) {
	          pdfViewer.decreaseScale();
	        }
	        break;
	      case "WillPrintFinished":
	        (_babelHelpers$classPr52 = babelHelpers.classPrivateFieldLooseBase(this, _willPrintCapability)[_willPrintCapability]) == null ? void 0 : _babelHelpers$classPr52.resolve();
	        babelHelpers.classPrivateFieldLooseBase(this, _willPrintCapability)[_willPrintCapability] = null;
	        break;
	    }
	    return;
	  }
	  if (isInPresentationMode && detail.focus) {
	    return;
	  }
	  delete detail.id;
	  delete detail.siblings;
	  const ids = siblings ? [id, ...siblings] : [id];
	  for (const elementId of ids) {
	    const element = document.querySelector(`[data-element-id="${elementId}"]`);
	    if (element) {
	      element.dispatchEvent(new CustomEvent("updatefromsandbox", {
	        detail
	      }));
	    } else {
	      var _babelHelpers$classPr53;
	      (_babelHelpers$classPr53 = babelHelpers.classPrivateFieldLooseBase(this, _pdfDocument)[_pdfDocument]) == null ? void 0 : _babelHelpers$classPr53.annotationStorage.setValue(elementId, detail);
	    }
	  }
	}
	async function _dispatchPageOpen2(pageNumber, initialize = false) {
	  const pdfDocument = babelHelpers.classPrivateFieldLooseBase(this, _pdfDocument)[_pdfDocument],
	    visitedPages = this._visitedPages;
	  if (initialize) {
	    babelHelpers.classPrivateFieldLooseBase(this, _closeCapability)[_closeCapability] = Promise.withResolvers();
	  }
	  if (!babelHelpers.classPrivateFieldLooseBase(this, _closeCapability)[_closeCapability]) {
	    return;
	  }
	  const pageView = babelHelpers.classPrivateFieldLooseBase(this, _pdfViewer)[_pdfViewer].getPageView(pageNumber - 1);
	  if ((pageView == null ? void 0 : pageView.renderingState) !== RenderingStates.FINISHED) {
	    this._pageOpenPending.add(pageNumber);
	    return;
	  }
	  this._pageOpenPending.delete(pageNumber);
	  const actionsPromise = (async () => {
	    var _pageView$pdfPage, _babelHelpers$classPr54;
	    const actions = await (!visitedPages.has(pageNumber) ? (_pageView$pdfPage = pageView.pdfPage) == null ? void 0 : _pageView$pdfPage.getJSActions() : null);
	    if (pdfDocument !== babelHelpers.classPrivateFieldLooseBase(this, _pdfDocument)[_pdfDocument]) {
	      return;
	    }
	    await ((_babelHelpers$classPr54 = babelHelpers.classPrivateFieldLooseBase(this, _scripting)[_scripting]) == null ? void 0 : _babelHelpers$classPr54.dispatchEventInSandbox({
	      id: "page",
	      name: "PageOpen",
	      pageNumber,
	      actions
	    }));
	  })();
	  visitedPages.set(pageNumber, actionsPromise);
	}
	async function _dispatchPageClose2(pageNumber) {
	  var _babelHelpers$classPr55;
	  const pdfDocument = babelHelpers.classPrivateFieldLooseBase(this, _pdfDocument)[_pdfDocument],
	    visitedPages = this._visitedPages;
	  if (!babelHelpers.classPrivateFieldLooseBase(this, _closeCapability)[_closeCapability]) {
	    return;
	  }
	  if (this._pageOpenPending.has(pageNumber)) {
	    return;
	  }
	  const actionsPromise = visitedPages.get(pageNumber);
	  if (!actionsPromise) {
	    return;
	  }
	  visitedPages.set(pageNumber, null);
	  await actionsPromise;
	  if (pdfDocument !== babelHelpers.classPrivateFieldLooseBase(this, _pdfDocument)[_pdfDocument]) {
	    return;
	  }
	  await ((_babelHelpers$classPr55 = babelHelpers.classPrivateFieldLooseBase(this, _scripting)[_scripting]) == null ? void 0 : _babelHelpers$classPr55.dispatchEventInSandbox({
	    id: "page",
	    name: "PageClose",
	    pageNumber
	  }));
	}
	function _initScripting2() {
	  babelHelpers.classPrivateFieldLooseBase(this, _destroyCapability)[_destroyCapability] = Promise.withResolvers();
	  if (babelHelpers.classPrivateFieldLooseBase(this, _scripting)[_scripting]) {
	    throw new Error("#initScripting: Scripting already exists.");
	  }
	  return babelHelpers.classPrivateFieldLooseBase(this, _externalServices2)[_externalServices2].createScripting();
	}
	async function _destroyScripting2() {
	  var _babelHelpers$classPr57, _babelHelpers$classPr58, _babelHelpers$classPr59;
	  if (!babelHelpers.classPrivateFieldLooseBase(this, _scripting)[_scripting]) {
	    var _babelHelpers$classPr56;
	    babelHelpers.classPrivateFieldLooseBase(this, _pdfDocument)[_pdfDocument] = null;
	    (_babelHelpers$classPr56 = babelHelpers.classPrivateFieldLooseBase(this, _destroyCapability)[_destroyCapability]) == null ? void 0 : _babelHelpers$classPr56.resolve();
	    return;
	  }
	  if (babelHelpers.classPrivateFieldLooseBase(this, _closeCapability)[_closeCapability]) {
	    await Promise.race([babelHelpers.classPrivateFieldLooseBase(this, _closeCapability)[_closeCapability].promise, new Promise(resolve => {
	      setTimeout(resolve, 1000);
	    })]).catch(() => {});
	    babelHelpers.classPrivateFieldLooseBase(this, _closeCapability)[_closeCapability] = null;
	  }
	  babelHelpers.classPrivateFieldLooseBase(this, _pdfDocument)[_pdfDocument] = null;
	  try {
	    await babelHelpers.classPrivateFieldLooseBase(this, _scripting)[_scripting].destroySandbox();
	  } catch {}
	  (_babelHelpers$classPr57 = babelHelpers.classPrivateFieldLooseBase(this, _willPrintCapability)[_willPrintCapability]) == null ? void 0 : _babelHelpers$classPr57.reject(new Error("Scripting destroyed."));
	  babelHelpers.classPrivateFieldLooseBase(this, _willPrintCapability)[_willPrintCapability] = null;
	  (_babelHelpers$classPr58 = babelHelpers.classPrivateFieldLooseBase(this, _eventAbortController2)[_eventAbortController2]) == null ? void 0 : _babelHelpers$classPr58.abort();
	  babelHelpers.classPrivateFieldLooseBase(this, _eventAbortController2)[_eventAbortController2] = null;
	  this._pageOpenPending.clear();
	  this._visitedPages.clear();
	  babelHelpers.classPrivateFieldLooseBase(this, _scripting)[_scripting] = null;
	  babelHelpers.classPrivateFieldLooseBase(this, _ready)[_ready] = false;
	  (_babelHelpers$classPr59 = babelHelpers.classPrivateFieldLooseBase(this, _destroyCapability)[_destroyCapability]) == null ? void 0 : _babelHelpers$classPr59.resolve();
	}

	const SIDEBAR_WIDTH_VAR = "--sidebar-width";
	const SIDEBAR_MIN_WIDTH = 200;
	const SIDEBAR_RESIZING_CLASS = "sidebarResizing";
	const UI_NOTIFICATION_CLASS = "pdfSidebarNotification";
	var _isRTL3 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isRTL");
	var _mouseAC = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("mouseAC");
	var _outerContainerWidth = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("outerContainerWidth");
	var _width = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("width");
	var _dispatchEvent = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("dispatchEvent");
	var _showUINotification = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("showUINotification");
	var _hideUINotification = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("hideUINotification");
	var _addEventListeners3 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("addEventListeners");
	var _updateWidth = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("updateWidth");
	var _mouseMove = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("mouseMove");
	var _mouseUp = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("mouseUp");
	class PDFSidebar {
	  constructor({
	    elements,
	    eventBus: _eventBus5,
	    l10n
	  }) {
	    Object.defineProperty(this, _mouseUp, {
	      value: _mouseUp2
	    });
	    Object.defineProperty(this, _mouseMove, {
	      value: _mouseMove2
	    });
	    Object.defineProperty(this, _updateWidth, {
	      value: _updateWidth2
	    });
	    Object.defineProperty(this, _addEventListeners3, {
	      value: _addEventListeners4
	    });
	    Object.defineProperty(this, _hideUINotification, {
	      value: _hideUINotification2
	    });
	    Object.defineProperty(this, _showUINotification, {
	      value: _showUINotification2
	    });
	    Object.defineProperty(this, _dispatchEvent, {
	      value: _dispatchEvent2
	    });
	    Object.defineProperty(this, _isRTL3, {
	      writable: true,
	      value: false
	    });
	    Object.defineProperty(this, _mouseAC, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _outerContainerWidth, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _width, {
	      writable: true,
	      value: null
	    });
	    this.isOpen = false;
	    this.active = SidebarView.THUMBS;
	    this.isInitialViewSet = false;
	    this.isInitialEventDispatched = false;
	    this.onToggled = null;
	    this.onUpdateThumbnails = null;
	    this.outerContainer = elements.outerContainer;
	    this.sidebarContainer = elements.sidebarContainer;
	    this.toggleButton = elements.toggleButton;
	    this.resizer = elements.resizer;
	    this.thumbnailButton = elements.thumbnailButton;
	    this.outlineButton = elements.outlineButton;
	    this.attachmentsButton = elements.attachmentsButton;
	    this.layersButton = elements.layersButton;
	    this.thumbnailView = elements.thumbnailView;
	    this.outlineView = elements.outlineView;
	    this.attachmentsView = elements.attachmentsView;
	    this.layersView = elements.layersView;
	    this._currentOutlineItemButton = elements.currentOutlineItemButton;
	    this.eventBus = _eventBus5;
	    babelHelpers.classPrivateFieldLooseBase(this, _isRTL3)[_isRTL3] = l10n.getDirection() === "rtl";
	    babelHelpers.classPrivateFieldLooseBase(this, _addEventListeners3)[_addEventListeners3]();
	  }
	  reset() {
	    this.isInitialViewSet = false;
	    this.isInitialEventDispatched = false;
	    babelHelpers.classPrivateFieldLooseBase(this, _hideUINotification)[_hideUINotification](true);
	    this.switchView(SidebarView.THUMBS);
	    this.outlineButton.disabled = false;
	    this.attachmentsButton.disabled = false;
	    this.layersButton.disabled = false;
	    this._currentOutlineItemButton.disabled = true;
	  }
	  get visibleView() {
	    return this.isOpen ? this.active : SidebarView.NONE;
	  }
	  setInitialView(view = SidebarView.NONE) {
	    if (this.isInitialViewSet) {
	      return;
	    }
	    this.isInitialViewSet = true;
	    if (view === SidebarView.NONE || view === SidebarView.UNKNOWN) {
	      babelHelpers.classPrivateFieldLooseBase(this, _dispatchEvent)[_dispatchEvent]();
	      return;
	    }
	    this.switchView(view, true);
	    if (!this.isInitialEventDispatched) {
	      babelHelpers.classPrivateFieldLooseBase(this, _dispatchEvent)[_dispatchEvent]();
	    }
	  }
	  switchView(view, forceOpen = false) {
	    const isViewChanged = view !== this.active;
	    let forceRendering = false;
	    switch (view) {
	      case SidebarView.NONE:
	        if (this.isOpen) {
	          this.close();
	        }
	        return;
	      case SidebarView.THUMBS:
	        if (this.isOpen && isViewChanged) {
	          forceRendering = true;
	        }
	        break;
	      case SidebarView.OUTLINE:
	        if (this.outlineButton.disabled) {
	          return;
	        }
	        break;
	      case SidebarView.ATTACHMENTS:
	        if (this.attachmentsButton.disabled) {
	          return;
	        }
	        break;
	      case SidebarView.LAYERS:
	        if (this.layersButton.disabled) {
	          return;
	        }
	        break;
	      default:
	        console.error(`PDFSidebar.switchView: "${view}" is not a valid view.`);
	        return;
	    }
	    this.active = view;
	    toggleCheckedBtn(this.thumbnailButton, view === SidebarView.THUMBS, this.thumbnailView);
	    toggleCheckedBtn(this.outlineButton, view === SidebarView.OUTLINE, this.outlineView);
	    toggleCheckedBtn(this.attachmentsButton, view === SidebarView.ATTACHMENTS, this.attachmentsView);
	    toggleCheckedBtn(this.layersButton, view === SidebarView.LAYERS, this.layersView);
	    if (forceOpen && !this.isOpen) {
	      this.open();
	      return;
	    }
	    if (forceRendering) {
	      this.onUpdateThumbnails();
	      this.onToggled();
	    }
	    if (isViewChanged) {
	      babelHelpers.classPrivateFieldLooseBase(this, _dispatchEvent)[_dispatchEvent]();
	    }
	  }
	  open() {
	    if (this.isOpen) {
	      return;
	    }
	    this.isOpen = true;
	    toggleExpandedBtn(this.toggleButton, true);
	    this.outerContainer.classList.add("sidebarMoving", "sidebarOpen");
	    if (this.active === SidebarView.THUMBS) {
	      this.onUpdateThumbnails();
	    }
	    this.onToggled();
	    babelHelpers.classPrivateFieldLooseBase(this, _dispatchEvent)[_dispatchEvent]();
	    babelHelpers.classPrivateFieldLooseBase(this, _hideUINotification)[_hideUINotification]();
	  }
	  close(evt = null) {
	    if (!this.isOpen) {
	      return;
	    }
	    this.isOpen = false;
	    toggleExpandedBtn(this.toggleButton, false);
	    this.outerContainer.classList.add("sidebarMoving");
	    this.outerContainer.classList.remove("sidebarOpen");
	    this.onToggled();
	    babelHelpers.classPrivateFieldLooseBase(this, _dispatchEvent)[_dispatchEvent]();
	    if ((evt == null ? void 0 : evt.detail) > 0) {
	      this.toggleButton.blur();
	    }
	  }
	  toggle(evt = null) {
	    if (this.isOpen) {
	      this.close(evt);
	    } else {
	      this.open();
	    }
	  }
	  get outerContainerWidth() {
	    var _babelHelpers$classPr14;
	    return (_babelHelpers$classPr14 = babelHelpers.classPrivateFieldLooseBase(this, _outerContainerWidth))[_outerContainerWidth] || (_babelHelpers$classPr14[_outerContainerWidth] = this.outerContainer.clientWidth);
	  }
	}
	function _dispatchEvent2() {
	  if (this.isInitialViewSet) {
	    this.isInitialEventDispatched || (this.isInitialEventDispatched = true);
	  }
	  this.eventBus.dispatch("sidebarviewchanged", {
	    source: this,
	    view: this.visibleView
	  });
	}
	function _showUINotification2() {
	  this.toggleButton.setAttribute("data-l10n-id", "pdfjs-toggle-sidebar-notification-button");
	  if (!this.isOpen) {
	    this.toggleButton.classList.add(UI_NOTIFICATION_CLASS);
	  }
	}
	function _hideUINotification2(reset = false) {
	  if (this.isOpen || reset) {
	    this.toggleButton.classList.remove(UI_NOTIFICATION_CLASS);
	  }
	  if (reset) {
	    this.toggleButton.setAttribute("data-l10n-id", "pdfjs-toggle-sidebar-button");
	  }
	}
	function _addEventListeners4() {
	  const {
	    eventBus,
	    outerContainer
	  } = this;
	  this.sidebarContainer.addEventListener("transitionend", evt => {
	    if (evt.target === this.sidebarContainer) {
	      outerContainer.classList.remove("sidebarMoving");
	      eventBus.dispatch("resize", {
	        source: this
	      });
	    }
	  });
	  this.toggleButton.addEventListener("click", evt => {
	    this.toggle(evt);
	  });
	  this.thumbnailButton.addEventListener("click", () => {
	    this.switchView(SidebarView.THUMBS);
	  });
	  this.outlineButton.addEventListener("click", () => {
	    this.switchView(SidebarView.OUTLINE);
	  });
	  this.outlineButton.addEventListener("dblclick", () => {
	    eventBus.dispatch("toggleoutlinetree", {
	      source: this
	    });
	  });
	  this.attachmentsButton.addEventListener("click", () => {
	    this.switchView(SidebarView.ATTACHMENTS);
	  });
	  this.layersButton.addEventListener("click", () => {
	    this.switchView(SidebarView.LAYERS);
	  });
	  this.layersButton.addEventListener("dblclick", () => {
	    eventBus.dispatch("resetlayers", {
	      source: this
	    });
	  });
	  this._currentOutlineItemButton.addEventListener("click", () => {
	    eventBus.dispatch("currentoutlineitem", {
	      source: this
	    });
	  });
	  const onTreeLoaded = (count, button, view) => {
	    button.disabled = !count;
	    if (count) {
	      babelHelpers.classPrivateFieldLooseBase(this, _showUINotification)[_showUINotification]();
	    } else if (this.active === view) {
	      this.switchView(SidebarView.THUMBS);
	    }
	  };
	  eventBus._on("outlineloaded", evt => {
	    onTreeLoaded(evt.outlineCount, this.outlineButton, SidebarView.OUTLINE);
	    evt.currentOutlineItemPromise.then(enabled => {
	      if (!this.isInitialViewSet) {
	        return;
	      }
	      this._currentOutlineItemButton.disabled = !enabled;
	    });
	  });
	  eventBus._on("attachmentsloaded", evt => {
	    onTreeLoaded(evt.attachmentsCount, this.attachmentsButton, SidebarView.ATTACHMENTS);
	  });
	  eventBus._on("layersloaded", evt => {
	    onTreeLoaded(evt.layersCount, this.layersButton, SidebarView.LAYERS);
	  });
	  eventBus._on("presentationmodechanged", evt => {
	    if (evt.state === PresentationModeState.NORMAL && this.visibleView === SidebarView.THUMBS) {
	      this.onUpdateThumbnails();
	    }
	  });
	  this.resizer.addEventListener("mousedown", evt => {
	    if (evt.button !== 0) {
	      return;
	    }
	    outerContainer.classList.add(SIDEBAR_RESIZING_CLASS);
	    babelHelpers.classPrivateFieldLooseBase(this, _mouseAC)[_mouseAC] = new AbortController();
	    const opts = {
	      signal: babelHelpers.classPrivateFieldLooseBase(this, _mouseAC)[_mouseAC].signal
	    };
	    window.addEventListener("mousemove", babelHelpers.classPrivateFieldLooseBase(this, _mouseMove)[_mouseMove].bind(this), opts);
	    window.addEventListener("mouseup", babelHelpers.classPrivateFieldLooseBase(this, _mouseUp)[_mouseUp].bind(this), opts);
	    window.addEventListener("blur", babelHelpers.classPrivateFieldLooseBase(this, _mouseUp)[_mouseUp].bind(this), opts);
	  });
	  eventBus._on("resize", evt => {
	    if (evt.source !== window) {
	      return;
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _outerContainerWidth)[_outerContainerWidth] = null;
	    if (!babelHelpers.classPrivateFieldLooseBase(this, _width)[_width]) {
	      return;
	    }
	    if (!this.isOpen) {
	      babelHelpers.classPrivateFieldLooseBase(this, _updateWidth)[_updateWidth](babelHelpers.classPrivateFieldLooseBase(this, _width)[_width]);
	      return;
	    }
	    outerContainer.classList.add(SIDEBAR_RESIZING_CLASS);
	    const updated = babelHelpers.classPrivateFieldLooseBase(this, _updateWidth)[_updateWidth](babelHelpers.classPrivateFieldLooseBase(this, _width)[_width]);
	    Promise.resolve().then(() => {
	      outerContainer.classList.remove(SIDEBAR_RESIZING_CLASS);
	      if (updated) {
	        eventBus.dispatch("resize", {
	          source: this
	        });
	      }
	    });
	  });
	}
	function _updateWidth2(width = 0) {
	  const maxWidth = Math.floor(this.outerContainerWidth / 2);
	  if (width > maxWidth) {
	    width = maxWidth;
	  }
	  if (width < SIDEBAR_MIN_WIDTH) {
	    width = SIDEBAR_MIN_WIDTH;
	  }
	  if (width === babelHelpers.classPrivateFieldLooseBase(this, _width)[_width]) {
	    return false;
	  }
	  babelHelpers.classPrivateFieldLooseBase(this, _width)[_width] = width;
	  docStyle.setProperty(SIDEBAR_WIDTH_VAR, `${width}px`);
	  return true;
	}
	function _mouseMove2(evt) {
	  let width = evt.clientX;
	  if (babelHelpers.classPrivateFieldLooseBase(this, _isRTL3)[_isRTL3]) {
	    width = this.outerContainerWidth - width;
	  }
	  babelHelpers.classPrivateFieldLooseBase(this, _updateWidth)[_updateWidth](width);
	}
	function _mouseUp2(evt) {
	  var _babelHelpers$classPr60;
	  this.outerContainer.classList.remove(SIDEBAR_RESIZING_CLASS);
	  this.eventBus.dispatch("resize", {
	    source: this
	  });
	  (_babelHelpers$classPr60 = babelHelpers.classPrivateFieldLooseBase(this, _mouseAC)[_mouseAC]) == null ? void 0 : _babelHelpers$classPr60.abort();
	  babelHelpers.classPrivateFieldLooseBase(this, _mouseAC)[_mouseAC] = null;
	}

	const DRAW_UPSCALE_FACTOR = 2;
	const MAX_NUM_SCALING_STEPS = 3;
	const THUMBNAIL_WIDTH = 98;
	var _tempCanvas = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("tempCanvas");
	class TempImageFactory {
	  static getCanvas(width, height) {
	    var _babelHelpers$classPr15;
	    const tempCanvas = (_babelHelpers$classPr15 = babelHelpers.classPrivateFieldLooseBase(this, _tempCanvas))[_tempCanvas] || (_babelHelpers$classPr15[_tempCanvas] = document.createElement("canvas"));
	    tempCanvas.width = width;
	    tempCanvas.height = height;
	    const ctx = tempCanvas.getContext("2d", {
	      alpha: false
	    });
	    ctx.save();
	    ctx.fillStyle = "rgb(255, 255, 255)";
	    ctx.fillRect(0, 0, width, height);
	    ctx.restore();
	    return [tempCanvas, tempCanvas.getContext("2d")];
	  }
	  static destroyCanvas() {
	    const tempCanvas = babelHelpers.classPrivateFieldLooseBase(this, _tempCanvas)[_tempCanvas];
	    if (tempCanvas) {
	      tempCanvas.width = 0;
	      tempCanvas.height = 0;
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _tempCanvas)[_tempCanvas] = null;
	  }
	}
	Object.defineProperty(TempImageFactory, _tempCanvas, {
	  writable: true,
	  value: null
	});
	var _updateDims = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("updateDims");
	var _getPageDrawContext = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getPageDrawContext");
	var _convertCanvasToImage = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("convertCanvasToImage");
	var _finishRenderTask = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("finishRenderTask");
	var _reduceImage = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("reduceImage");
	var _pageL10nArgs = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("pageL10nArgs");
	class PDFThumbnailView {
	  constructor({
	    container,
	    eventBus,
	    id,
	    defaultViewport,
	    optionalContentConfigPromise,
	    linkService,
	    renderingQueue,
	    pageColors,
	    enableHWA: _enableHWA
	  }) {
	    Object.defineProperty(this, _pageL10nArgs, {
	      get: _get_pageL10nArgs,
	      set: void 0
	    });
	    Object.defineProperty(this, _reduceImage, {
	      value: _reduceImage2
	    });
	    Object.defineProperty(this, _finishRenderTask, {
	      value: _finishRenderTask2
	    });
	    Object.defineProperty(this, _convertCanvasToImage, {
	      value: _convertCanvasToImage2
	    });
	    Object.defineProperty(this, _getPageDrawContext, {
	      value: _getPageDrawContext2
	    });
	    Object.defineProperty(this, _updateDims, {
	      value: _updateDims2
	    });
	    this.id = id;
	    this.renderingId = "thumbnail" + id;
	    this.pageLabel = null;
	    this.pdfPage = null;
	    this.rotation = 0;
	    this.viewport = defaultViewport;
	    this.pdfPageRotate = defaultViewport.rotation;
	    this._optionalContentConfigPromise = optionalContentConfigPromise || null;
	    this.pageColors = pageColors || null;
	    this.enableHWA = _enableHWA || false;
	    this.eventBus = eventBus;
	    this.linkService = linkService;
	    this.renderingQueue = renderingQueue;
	    this.renderTask = null;
	    this.renderingState = RenderingStates.INITIAL;
	    this.resume = null;
	    const anchor = document.createElement("a");
	    anchor.href = linkService.getAnchorUrl("#page=" + id);
	    anchor.setAttribute("data-l10n-id", "pdfjs-thumb-page-title");
	    anchor.setAttribute("data-l10n-args", babelHelpers.classPrivateFieldLooseBase(this, _pageL10nArgs)[_pageL10nArgs]);
	    anchor.onclick = function () {
	      linkService.goToPage(id);
	      return false;
	    };
	    this.anchor = anchor;
	    const div = document.createElement("div");
	    div.className = "thumbnail";
	    div.setAttribute("data-page-number", this.id);
	    this.div = div;
	    babelHelpers.classPrivateFieldLooseBase(this, _updateDims)[_updateDims]();
	    const _img = document.createElement("div");
	    _img.className = "thumbnailImage";
	    this._placeholderImg = _img;
	    div.append(_img);
	    anchor.append(div);
	    container.append(anchor);
	  }
	  setPdfPage(pdfPage) {
	    this.pdfPage = pdfPage;
	    this.pdfPageRotate = pdfPage.rotate;
	    const totalRotation = (this.rotation + this.pdfPageRotate) % 360;
	    this.viewport = pdfPage.getViewport({
	      scale: 1,
	      rotation: totalRotation
	    });
	    this.reset();
	  }
	  reset() {
	    var _this$image;
	    this.cancelRendering();
	    this.renderingState = RenderingStates.INITIAL;
	    this.div.removeAttribute("data-loaded");
	    (_this$image = this.image) == null ? void 0 : _this$image.replaceWith(this._placeholderImg);
	    babelHelpers.classPrivateFieldLooseBase(this, _updateDims)[_updateDims]();
	    if (this.image) {
	      this.image.removeAttribute("src");
	      delete this.image;
	    }
	  }
	  update({
	    rotation = null
	  }) {
	    if (typeof rotation === "number") {
	      this.rotation = rotation;
	    }
	    const totalRotation = (this.rotation + this.pdfPageRotate) % 360;
	    this.viewport = this.viewport.clone({
	      scale: 1,
	      rotation: totalRotation
	    });
	    this.reset();
	  }
	  cancelRendering() {
	    if (this.renderTask) {
	      this.renderTask.cancel();
	      this.renderTask = null;
	    }
	    this.resume = null;
	  }
	  async draw() {
	    if (this.renderingState !== RenderingStates.INITIAL) {
	      console.error("Must be in new state before drawing");
	      return undefined;
	    }
	    const {
	      pdfPage
	    } = this;
	    if (!pdfPage) {
	      this.renderingState = RenderingStates.FINISHED;
	      throw new Error("pdfPage is not loaded");
	    }
	    this.renderingState = RenderingStates.RUNNING;
	    const {
	      ctx,
	      canvas,
	      transform
	    } = babelHelpers.classPrivateFieldLooseBase(this, _getPageDrawContext)[_getPageDrawContext](DRAW_UPSCALE_FACTOR);
	    const drawViewport = this.viewport.clone({
	      scale: DRAW_UPSCALE_FACTOR * this.scale
	    });
	    const renderContinueCallback = cont => {
	      if (!this.renderingQueue.isHighestPriority(this)) {
	        this.renderingState = RenderingStates.PAUSED;
	        this.resume = () => {
	          this.renderingState = RenderingStates.RUNNING;
	          cont();
	        };
	        return;
	      }
	      cont();
	    };
	    const renderContext = {
	      canvasContext: ctx,
	      transform,
	      viewport: drawViewport,
	      optionalContentConfigPromise: this._optionalContentConfigPromise,
	      pageColors: this.pageColors
	    };
	    const renderTask = this.renderTask = pdfPage.render(renderContext);
	    renderTask.onContinue = renderContinueCallback;
	    const resultPromise = renderTask.promise.then(() => babelHelpers.classPrivateFieldLooseBase(this, _finishRenderTask)[_finishRenderTask](renderTask, canvas), error => babelHelpers.classPrivateFieldLooseBase(this, _finishRenderTask)[_finishRenderTask](renderTask, canvas, error));
	    resultPromise.finally(() => {
	      canvas.width = 0;
	      canvas.height = 0;
	      this.eventBus.dispatch("thumbnailrendered", {
	        source: this,
	        pageNumber: this.id,
	        pdfPage: this.pdfPage
	      });
	    });
	    return resultPromise;
	  }
	  setImage(pageView) {
	    if (this.renderingState !== RenderingStates.INITIAL) {
	      return;
	    }
	    const {
	      thumbnailCanvas: canvas,
	      pdfPage,
	      scale
	    } = pageView;
	    if (!canvas) {
	      return;
	    }
	    if (!this.pdfPage) {
	      this.setPdfPage(pdfPage);
	    }
	    if (scale < this.scale) {
	      return;
	    }
	    this.renderingState = RenderingStates.FINISHED;
	    babelHelpers.classPrivateFieldLooseBase(this, _convertCanvasToImage)[_convertCanvasToImage](canvas);
	  }
	  setPageLabel(label) {
	    var _this$image2;
	    this.pageLabel = typeof label === "string" ? label : null;
	    this.anchor.setAttribute("data-l10n-args", babelHelpers.classPrivateFieldLooseBase(this, _pageL10nArgs)[_pageL10nArgs]);
	    if (this.renderingState !== RenderingStates.FINISHED) {
	      return;
	    }
	    (_this$image2 = this.image) == null ? void 0 : _this$image2.setAttribute("data-l10n-args", babelHelpers.classPrivateFieldLooseBase(this, _pageL10nArgs)[_pageL10nArgs]);
	  }
	}
	function _updateDims2() {
	  const {
	    width,
	    height
	  } = this.viewport;
	  const ratio = width / height;
	  this.canvasWidth = THUMBNAIL_WIDTH;
	  this.canvasHeight = this.canvasWidth / ratio | 0;
	  this.scale = this.canvasWidth / width;
	  const {
	    style
	  } = this.div;
	  style.setProperty("--thumbnail-width", `${this.canvasWidth}px`);
	  style.setProperty("--thumbnail-height", `${this.canvasHeight}px`);
	}
	function _getPageDrawContext2(upscaleFactor = 1, enableHWA = this.enableHWA) {
	  const canvas = document.createElement("canvas");
	  const ctx = canvas.getContext("2d", {
	    alpha: false,
	    willReadFrequently: !enableHWA
	  });
	  const outputScale = new OutputScale();
	  canvas.width = upscaleFactor * this.canvasWidth * outputScale.sx | 0;
	  canvas.height = upscaleFactor * this.canvasHeight * outputScale.sy | 0;
	  const transform = outputScale.scaled ? [outputScale.sx, 0, 0, outputScale.sy, 0, 0] : null;
	  return {
	    ctx,
	    canvas,
	    transform
	  };
	}
	function _convertCanvasToImage2(canvas) {
	  if (this.renderingState !== RenderingStates.FINISHED) {
	    throw new Error("#convertCanvasToImage: Rendering has not finished.");
	  }
	  const reducedCanvas = babelHelpers.classPrivateFieldLooseBase(this, _reduceImage)[_reduceImage](canvas);
	  const image = document.createElement("img");
	  image.className = "thumbnailImage";
	  image.setAttribute("data-l10n-id", "pdfjs-thumb-page-canvas");
	  image.setAttribute("data-l10n-args", babelHelpers.classPrivateFieldLooseBase(this, _pageL10nArgs)[_pageL10nArgs]);
	  image.src = reducedCanvas.toDataURL();
	  this.image = image;
	  this.div.setAttribute("data-loaded", true);
	  this._placeholderImg.replaceWith(image);
	  reducedCanvas.width = 0;
	  reducedCanvas.height = 0;
	}
	async function _finishRenderTask2(renderTask, canvas, error = null) {
	  if (renderTask === this.renderTask) {
	    this.renderTask = null;
	  }
	  if (error instanceof RenderingCancelledException) {
	    return;
	  }
	  this.renderingState = RenderingStates.FINISHED;
	  babelHelpers.classPrivateFieldLooseBase(this, _convertCanvasToImage)[_convertCanvasToImage](canvas);
	  if (error) {
	    throw error;
	  }
	}
	function _reduceImage2(img) {
	  const {
	    ctx,
	    canvas
	  } = babelHelpers.classPrivateFieldLooseBase(this, _getPageDrawContext)[_getPageDrawContext](1, true);
	  if (img.width <= 2 * canvas.width) {
	    ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, canvas.width, canvas.height);
	    return canvas;
	  }
	  let reducedWidth = canvas.width << MAX_NUM_SCALING_STEPS;
	  let reducedHeight = canvas.height << MAX_NUM_SCALING_STEPS;
	  const [reducedImage, reducedImageCtx] = TempImageFactory.getCanvas(reducedWidth, reducedHeight);
	  while (reducedWidth > img.width || reducedHeight > img.height) {
	    reducedWidth >>= 1;
	    reducedHeight >>= 1;
	  }
	  reducedImageCtx.drawImage(img, 0, 0, img.width, img.height, 0, 0, reducedWidth, reducedHeight);
	  while (reducedWidth > 2 * canvas.width) {
	    reducedImageCtx.drawImage(reducedImage, 0, 0, reducedWidth, reducedHeight, 0, 0, reducedWidth >> 1, reducedHeight >> 1);
	    reducedWidth >>= 1;
	    reducedHeight >>= 1;
	  }
	  ctx.drawImage(reducedImage, 0, 0, reducedWidth, reducedHeight, 0, 0, canvas.width, canvas.height);
	  return canvas;
	}
	function _get_pageL10nArgs() {
	  var _this$pageLabel2;
	  return JSON.stringify({
	    page: (_this$pageLabel2 = this.pageLabel) != null ? _this$pageLabel2 : this.id
	  });
	}

	const THUMBNAIL_SCROLL_MARGIN = -19;
	const THUMBNAIL_SELECTED_CLASS = "selected";
	var _scrollUpdated = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("scrollUpdated");
	var _getVisibleThumbs = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getVisibleThumbs");
	var _resetView = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("resetView");
	var _cancelRendering = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("cancelRendering");
	var _ensurePdfPageLoaded = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("ensurePdfPageLoaded");
	var _getScrollAhead = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getScrollAhead");
	class PDFThumbnailViewer {
	  constructor({
	    container,
	    eventBus,
	    linkService,
	    renderingQueue,
	    pageColors,
	    abortSignal,
	    enableHWA
	  }) {
	    Object.defineProperty(this, _getScrollAhead, {
	      value: _getScrollAhead2
	    });
	    Object.defineProperty(this, _ensurePdfPageLoaded, {
	      value: _ensurePdfPageLoaded2
	    });
	    Object.defineProperty(this, _cancelRendering, {
	      value: _cancelRendering2
	    });
	    Object.defineProperty(this, _resetView, {
	      value: _resetView2
	    });
	    Object.defineProperty(this, _getVisibleThumbs, {
	      value: _getVisibleThumbs2
	    });
	    Object.defineProperty(this, _scrollUpdated, {
	      value: _scrollUpdated2
	    });
	    this.container = container;
	    this.eventBus = eventBus;
	    this.linkService = linkService;
	    this.renderingQueue = renderingQueue;
	    this.pageColors = pageColors || null;
	    this.enableHWA = enableHWA || false;
	    this.scroll = watchScroll(this.container, babelHelpers.classPrivateFieldLooseBase(this, _scrollUpdated)[_scrollUpdated].bind(this), abortSignal);
	    babelHelpers.classPrivateFieldLooseBase(this, _resetView)[_resetView]();
	  }
	  getThumbnail(index) {
	    return this._thumbnails[index];
	  }
	  scrollThumbnailIntoView(pageNumber) {
	    if (!this.pdfDocument) {
	      return;
	    }
	    const thumbnailView = this._thumbnails[pageNumber - 1];
	    if (!thumbnailView) {
	      console.error('scrollThumbnailIntoView: Invalid "pageNumber" parameter.');
	      return;
	    }
	    if (pageNumber !== this._currentPageNumber) {
	      const prevThumbnailView = this._thumbnails[this._currentPageNumber - 1];
	      prevThumbnailView.div.classList.remove(THUMBNAIL_SELECTED_CLASS);
	      thumbnailView.div.classList.add(THUMBNAIL_SELECTED_CLASS);
	    }
	    const {
	      first,
	      last,
	      views
	    } = babelHelpers.classPrivateFieldLooseBase(this, _getVisibleThumbs)[_getVisibleThumbs]();
	    if (views.length > 0) {
	      let shouldScroll = false;
	      if (pageNumber <= first.id || pageNumber >= last.id) {
	        shouldScroll = true;
	      } else {
	        for (const {
	          id,
	          percent
	        } of views) {
	          if (id !== pageNumber) {
	            continue;
	          }
	          shouldScroll = percent < 100;
	          break;
	        }
	      }
	      if (shouldScroll) {
	        scrollIntoView(thumbnailView.div, {
	          top: THUMBNAIL_SCROLL_MARGIN
	        });
	      }
	    }
	    this._currentPageNumber = pageNumber;
	  }
	  get pagesRotation() {
	    return this._pagesRotation;
	  }
	  set pagesRotation(rotation) {
	    if (!isValidRotation(rotation)) {
	      throw new Error("Invalid thumbnails rotation angle.");
	    }
	    if (!this.pdfDocument) {
	      return;
	    }
	    if (this._pagesRotation === rotation) {
	      return;
	    }
	    this._pagesRotation = rotation;
	    const updateArgs = {
	      rotation
	    };
	    for (const thumbnail of this._thumbnails) {
	      thumbnail.update(updateArgs);
	    }
	  }
	  cleanup() {
	    for (const thumbnail of this._thumbnails) {
	      if (thumbnail.renderingState !== RenderingStates.FINISHED) {
	        thumbnail.reset();
	      }
	    }
	    TempImageFactory.destroyCanvas();
	  }
	  setDocument(pdfDocument) {
	    if (this.pdfDocument) {
	      babelHelpers.classPrivateFieldLooseBase(this, _cancelRendering)[_cancelRendering]();
	      babelHelpers.classPrivateFieldLooseBase(this, _resetView)[_resetView]();
	    }
	    this.pdfDocument = pdfDocument;
	    if (!pdfDocument) {
	      return;
	    }
	    const firstPagePromise = pdfDocument.getPage(1);
	    const optionalContentConfigPromise = pdfDocument.getOptionalContentConfig({
	      intent: "display"
	    });
	    firstPagePromise.then(firstPdfPage => {
	      var _this$_thumbnails$;
	      const pagesCount = pdfDocument.numPages;
	      const viewport = firstPdfPage.getViewport({
	        scale: 1
	      });
	      for (let pageNum = 1; pageNum <= pagesCount; ++pageNum) {
	        const thumbnail = new PDFThumbnailView({
	          container: this.container,
	          eventBus: this.eventBus,
	          id: pageNum,
	          defaultViewport: viewport.clone(),
	          optionalContentConfigPromise,
	          linkService: this.linkService,
	          renderingQueue: this.renderingQueue,
	          pageColors: this.pageColors,
	          enableHWA: this.enableHWA
	        });
	        this._thumbnails.push(thumbnail);
	      }
	      (_this$_thumbnails$ = this._thumbnails[0]) == null ? void 0 : _this$_thumbnails$.setPdfPage(firstPdfPage);
	      const thumbnailView = this._thumbnails[this._currentPageNumber - 1];
	      thumbnailView.div.classList.add(THUMBNAIL_SELECTED_CLASS);
	    }).catch(reason => {
	      console.error("Unable to initialize thumbnail viewer", reason);
	    });
	  }
	  setPageLabels(labels) {
	    if (!this.pdfDocument) {
	      return;
	    }
	    if (!labels) {
	      this._pageLabels = null;
	    } else if (!(Array.isArray(labels) && this.pdfDocument.numPages === labels.length)) {
	      this._pageLabels = null;
	      console.error("PDFThumbnailViewer_setPageLabels: Invalid page labels.");
	    } else {
	      this._pageLabels = labels;
	    }
	    for (let i = 0, ii = this._thumbnails.length; i < ii; i++) {
	      var _this$_pageLabels$i, _this$_pageLabels;
	      this._thumbnails[i].setPageLabel((_this$_pageLabels$i = (_this$_pageLabels = this._pageLabels) == null ? void 0 : _this$_pageLabels[i]) != null ? _this$_pageLabels$i : null);
	    }
	  }
	  forceRendering() {
	    const visibleThumbs = babelHelpers.classPrivateFieldLooseBase(this, _getVisibleThumbs)[_getVisibleThumbs]();
	    const scrollAhead = babelHelpers.classPrivateFieldLooseBase(this, _getScrollAhead)[_getScrollAhead](visibleThumbs);
	    const thumbView = this.renderingQueue.getHighestPriority(visibleThumbs, this._thumbnails, scrollAhead);
	    if (thumbView) {
	      babelHelpers.classPrivateFieldLooseBase(this, _ensurePdfPageLoaded)[_ensurePdfPageLoaded](thumbView).then(() => {
	        this.renderingQueue.renderView(thumbView);
	      });
	      return true;
	    }
	    return false;
	  }
	}
	function _scrollUpdated2() {
	  this.renderingQueue.renderHighestPriority();
	}
	function _getVisibleThumbs2() {
	  return getVisibleElements({
	    scrollEl: this.container,
	    views: this._thumbnails
	  });
	}
	function _resetView2() {
	  this._thumbnails = [];
	  this._currentPageNumber = 1;
	  this._pageLabels = null;
	  this._pagesRotation = 0;
	  this.container.textContent = "";
	}
	function _cancelRendering2() {
	  for (const thumbnail of this._thumbnails) {
	    thumbnail.cancelRendering();
	  }
	}
	async function _ensurePdfPageLoaded2(thumbView) {
	  if (thumbView.pdfPage) {
	    return thumbView.pdfPage;
	  }
	  try {
	    const pdfPage = await this.pdfDocument.getPage(thumbView.id);
	    if (!thumbView.pdfPage) {
	      thumbView.setPdfPage(pdfPage);
	    }
	    return pdfPage;
	  } catch (reason) {
	    console.error("Unable to get page for thumb view", reason);
	    return null;
	  }
	}
	function _getScrollAhead2(visible) {
	  var _visible$first, _visible$last;
	  if (((_visible$first = visible.first) == null ? void 0 : _visible$first.id) === 1) {
	    return true;
	  } else if (((_visible$last = visible.last) == null ? void 0 : _visible$last.id) === this._thumbnails.length) {
	    return false;
	  }
	  return this.scroll.down;
	}
	var _annotationLayer = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("annotationLayer");
	var _drawLayer = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("drawLayer");
	var _onAppend = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onAppend");
	var _structTreeLayer = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("structTreeLayer");
	var _textLayer = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("textLayer");
	var _uiManager3 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("uiManager");
	class AnnotationEditorLayerBuilder {
	  constructor(options) {
	    Object.defineProperty(this, _annotationLayer, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _drawLayer, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _onAppend, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _structTreeLayer, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _textLayer, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _uiManager3, {
	      writable: true,
	      value: void 0
	    });
	    this.pdfPage = options.pdfPage;
	    this.accessibilityManager = options.accessibilityManager;
	    this.l10n = options.l10n;
	    this.l10n || (this.l10n = new genericl10n_GenericL10n());
	    this.annotationEditorLayer = null;
	    this.div = null;
	    this._cancelled = false;
	    babelHelpers.classPrivateFieldLooseBase(this, _uiManager3)[_uiManager3] = options.uiManager;
	    babelHelpers.classPrivateFieldLooseBase(this, _annotationLayer)[_annotationLayer] = options.annotationLayer || null;
	    babelHelpers.classPrivateFieldLooseBase(this, _textLayer)[_textLayer] = options.textLayer || null;
	    babelHelpers.classPrivateFieldLooseBase(this, _drawLayer)[_drawLayer] = options.drawLayer || null;
	    babelHelpers.classPrivateFieldLooseBase(this, _onAppend)[_onAppend] = options.onAppend || null;
	    babelHelpers.classPrivateFieldLooseBase(this, _structTreeLayer)[_structTreeLayer] = options.structTreeLayer || null;
	  }
	  async render(viewport, intent = "display") {
	    var _babelHelpers$classPr16, _babelHelpers$classPr17;
	    if (intent !== "display") {
	      return;
	    }
	    if (this._cancelled) {
	      return;
	    }
	    const clonedViewport = viewport.clone({
	      dontFlip: true
	    });
	    if (this.div) {
	      this.annotationEditorLayer.update({
	        viewport: clonedViewport
	      });
	      this.show();
	      return;
	    }
	    const div = this.div = document.createElement("div");
	    div.className = "annotationEditorLayer";
	    div.hidden = true;
	    div.dir = babelHelpers.classPrivateFieldLooseBase(this, _uiManager3)[_uiManager3].direction;
	    (_babelHelpers$classPr16 = (_babelHelpers$classPr17 = babelHelpers.classPrivateFieldLooseBase(this, _onAppend))[_onAppend]) == null ? void 0 : _babelHelpers$classPr16.call(_babelHelpers$classPr17, div);
	    this.annotationEditorLayer = new AnnotationEditorLayer({
	      uiManager: babelHelpers.classPrivateFieldLooseBase(this, _uiManager3)[_uiManager3],
	      div,
	      structTreeLayer: babelHelpers.classPrivateFieldLooseBase(this, _structTreeLayer)[_structTreeLayer],
	      accessibilityManager: this.accessibilityManager,
	      pageIndex: this.pdfPage.pageNumber - 1,
	      l10n: this.l10n,
	      viewport: clonedViewport,
	      annotationLayer: babelHelpers.classPrivateFieldLooseBase(this, _annotationLayer)[_annotationLayer],
	      textLayer: babelHelpers.classPrivateFieldLooseBase(this, _textLayer)[_textLayer],
	      drawLayer: babelHelpers.classPrivateFieldLooseBase(this, _drawLayer)[_drawLayer]
	    });
	    const parameters = {
	      viewport: clonedViewport,
	      div,
	      annotations: null,
	      intent
	    };
	    this.annotationEditorLayer.render(parameters);
	    this.show();
	  }
	  cancel() {
	    this._cancelled = true;
	    if (!this.div) {
	      return;
	    }
	    this.annotationEditorLayer.destroy();
	  }
	  hide() {
	    if (!this.div) {
	      return;
	    }
	    this.div.hidden = true;
	  }
	  show() {
	    if (!this.div || this.annotationEditorLayer.isInvisible) {
	      return;
	    }
	    this.div.hidden = false;
	  }
	}
	var _onAppend2 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onAppend");
	var _eventAbortController3 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("eventAbortController");
	var _updatePresentationModeState = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("updatePresentationModeState");
	class AnnotationLayerBuilder {
	  constructor({
	    pdfPage,
	    linkService,
	    downloadManager,
	    annotationStorage = null,
	    imageResourcesPath = "",
	    renderForms = true,
	    enableScripting = false,
	    hasJSActionsPromise = null,
	    fieldObjectsPromise = null,
	    annotationCanvasMap = null,
	    accessibilityManager = null,
	    annotationEditorUIManager = null,
	    onAppend = null
	  }) {
	    Object.defineProperty(this, _updatePresentationModeState, {
	      value: _updatePresentationModeState2
	    });
	    Object.defineProperty(this, _onAppend2, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _eventAbortController3, {
	      writable: true,
	      value: null
	    });
	    this.pdfPage = pdfPage;
	    this.linkService = linkService;
	    this.downloadManager = downloadManager;
	    this.imageResourcesPath = imageResourcesPath;
	    this.renderForms = renderForms;
	    this.annotationStorage = annotationStorage;
	    this.enableScripting = enableScripting;
	    this._hasJSActionsPromise = hasJSActionsPromise || Promise.resolve(false);
	    this._fieldObjectsPromise = fieldObjectsPromise || Promise.resolve(null);
	    this._annotationCanvasMap = annotationCanvasMap;
	    this._accessibilityManager = accessibilityManager;
	    this._annotationEditorUIManager = annotationEditorUIManager;
	    babelHelpers.classPrivateFieldLooseBase(this, _onAppend2)[_onAppend2] = onAppend;
	    this.annotationLayer = null;
	    this.div = null;
	    this._cancelled = false;
	    this._eventBus = linkService.eventBus;
	  }
	  async render(viewport, options, intent = "display") {
	    var _babelHelpers$classPr18, _babelHelpers$classPr19;
	    if (this.div) {
	      if (this._cancelled || !this.annotationLayer) {
	        return;
	      }
	      this.annotationLayer.update({
	        viewport: viewport.clone({
	          dontFlip: true
	        })
	      });
	      return;
	    }
	    const [annotations, hasJSActions, fieldObjects] = await Promise.all([this.pdfPage.getAnnotations({
	      intent
	    }), this._hasJSActionsPromise, this._fieldObjectsPromise]);
	    if (this._cancelled) {
	      return;
	    }
	    const div = this.div = document.createElement("div");
	    div.className = "annotationLayer";
	    (_babelHelpers$classPr18 = (_babelHelpers$classPr19 = babelHelpers.classPrivateFieldLooseBase(this, _onAppend2))[_onAppend2]) == null ? void 0 : _babelHelpers$classPr18.call(_babelHelpers$classPr19, div);
	    if (annotations.length === 0) {
	      this.hide();
	      return;
	    }
	    this.annotationLayer = new AnnotationLayer({
	      div,
	      accessibilityManager: this._accessibilityManager,
	      annotationCanvasMap: this._annotationCanvasMap,
	      annotationEditorUIManager: this._annotationEditorUIManager,
	      page: this.pdfPage,
	      viewport: viewport.clone({
	        dontFlip: true
	      }),
	      structTreeLayer: (options == null ? void 0 : options.structTreeLayer) || null
	    });
	    await this.annotationLayer.render({
	      annotations,
	      imageResourcesPath: this.imageResourcesPath,
	      renderForms: this.renderForms,
	      linkService: this.linkService,
	      downloadManager: this.downloadManager,
	      annotationStorage: this.annotationStorage,
	      enableScripting: this.enableScripting,
	      hasJSActions,
	      fieldObjects
	    });
	    if (this.linkService.isInPresentationMode) {
	      babelHelpers.classPrivateFieldLooseBase(this, _updatePresentationModeState)[_updatePresentationModeState](PresentationModeState.FULLSCREEN);
	    }
	    if (!babelHelpers.classPrivateFieldLooseBase(this, _eventAbortController3)[_eventAbortController3]) {
	      var _this$_eventBus;
	      babelHelpers.classPrivateFieldLooseBase(this, _eventAbortController3)[_eventAbortController3] = new AbortController();
	      (_this$_eventBus = this._eventBus) == null ? void 0 : _this$_eventBus._on("presentationmodechanged", evt => {
	        babelHelpers.classPrivateFieldLooseBase(this, _updatePresentationModeState)[_updatePresentationModeState](evt.state);
	      }, {
	        signal: babelHelpers.classPrivateFieldLooseBase(this, _eventAbortController3)[_eventAbortController3].signal
	      });
	    }
	  }
	  cancel() {
	    var _babelHelpers$classPr20;
	    this._cancelled = true;
	    (_babelHelpers$classPr20 = babelHelpers.classPrivateFieldLooseBase(this, _eventAbortController3)[_eventAbortController3]) == null ? void 0 : _babelHelpers$classPr20.abort();
	    babelHelpers.classPrivateFieldLooseBase(this, _eventAbortController3)[_eventAbortController3] = null;
	  }
	  hide() {
	    if (!this.div) {
	      return;
	    }
	    this.div.hidden = true;
	  }
	  hasEditableAnnotations() {
	    var _this$annotationLayer;
	    return !!((_this$annotationLayer = this.annotationLayer) != null && _this$annotationLayer.hasEditableAnnotations());
	  }
	}
	function _updatePresentationModeState2(state) {
	  if (!this.div) {
	    return;
	  }
	  let disableFormElements = false;
	  switch (state) {
	    case PresentationModeState.FULLSCREEN:
	      disableFormElements = true;
	      break;
	    case PresentationModeState.NORMAL:
	      break;
	    default:
	      return;
	  }
	  for (const section of this.div.childNodes) {
	    if (section.hasAttribute("data-internal-link")) {
	      continue;
	    }
	    section.inert = disableFormElements;
	  }
	}
	var _drawLayer2 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("drawLayer");
	class DrawLayerBuilder {
	  constructor(options) {
	    Object.defineProperty(this, _drawLayer2, {
	      writable: true,
	      value: null
	    });
	    this.pageIndex = options.pageIndex;
	  }
	  async render(intent = "display") {
	    if (intent !== "display" || babelHelpers.classPrivateFieldLooseBase(this, _drawLayer2)[_drawLayer2] || this._cancelled) {
	      return;
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _drawLayer2)[_drawLayer2] = new DrawLayer({
	      pageIndex: this.pageIndex
	    });
	  }
	  cancel() {
	    this._cancelled = true;
	    if (!babelHelpers.classPrivateFieldLooseBase(this, _drawLayer2)[_drawLayer2]) {
	      return;
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _drawLayer2)[_drawLayer2].destroy();
	    babelHelpers.classPrivateFieldLooseBase(this, _drawLayer2)[_drawLayer2] = null;
	  }
	  setParent(parent) {
	    var _babelHelpers$classPr21;
	    (_babelHelpers$classPr21 = babelHelpers.classPrivateFieldLooseBase(this, _drawLayer2)[_drawLayer2]) == null ? void 0 : _babelHelpers$classPr21.setParent(parent);
	  }
	  getDrawLayer() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _drawLayer2)[_drawLayer2];
	  }
	}

	const PDF_ROLE_TO_HTML_ROLE = {
	  Document: null,
	  DocumentFragment: null,
	  Part: "group",
	  Sect: "group",
	  Div: "group",
	  Aside: "note",
	  NonStruct: "none",
	  P: null,
	  H: "heading",
	  Title: null,
	  FENote: "note",
	  Sub: "group",
	  Lbl: null,
	  Span: null,
	  Em: null,
	  Strong: null,
	  Link: "link",
	  Annot: "note",
	  Form: "form",
	  Ruby: null,
	  RB: null,
	  RT: null,
	  RP: null,
	  Warichu: null,
	  WT: null,
	  WP: null,
	  L: "list",
	  LI: "listitem",
	  LBody: null,
	  Table: "table",
	  TR: "row",
	  TH: "columnheader",
	  TD: "cell",
	  THead: "columnheader",
	  TBody: null,
	  TFoot: null,
	  Caption: null,
	  Figure: "figure",
	  Formula: null,
	  Artifact: null
	};
	const HEADING_PATTERN = /^H(\d+)$/;
	var _promise = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("promise");
	var _treeDom = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("treeDom");
	var _treePromise = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("treePromise");
	var _elementAttributes = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("elementAttributes");
	var _rawDims = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("rawDims");
	var _elementsToAddToTextLayer = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("elementsToAddToTextLayer");
	var _setAttributes = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("setAttributes");
	var _addImageInTextLayer = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("addImageInTextLayer");
	var _walk = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("walk");
	class StructTreeLayerBuilder {
	  constructor(pdfPage, rawDims) {
	    Object.defineProperty(this, _walk, {
	      value: _walk2
	    });
	    Object.defineProperty(this, _addImageInTextLayer, {
	      value: _addImageInTextLayer2
	    });
	    Object.defineProperty(this, _setAttributes, {
	      value: _setAttributes2
	    });
	    Object.defineProperty(this, _promise, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _treeDom, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _treePromise, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _elementAttributes, {
	      writable: true,
	      value: new Map()
	    });
	    Object.defineProperty(this, _rawDims, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _elementsToAddToTextLayer, {
	      writable: true,
	      value: null
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _promise)[_promise] = pdfPage.getStructTree();
	    babelHelpers.classPrivateFieldLooseBase(this, _rawDims)[_rawDims] = rawDims;
	  }
	  async render() {
	    var _babelHelpers$classPr22;
	    if (babelHelpers.classPrivateFieldLooseBase(this, _treePromise)[_treePromise]) {
	      return babelHelpers.classPrivateFieldLooseBase(this, _treePromise)[_treePromise];
	    }
	    const {
	      promise,
	      resolve,
	      reject
	    } = Promise.withResolvers();
	    babelHelpers.classPrivateFieldLooseBase(this, _treePromise)[_treePromise] = promise;
	    try {
	      babelHelpers.classPrivateFieldLooseBase(this, _treeDom)[_treeDom] = babelHelpers.classPrivateFieldLooseBase(this, _walk)[_walk](await babelHelpers.classPrivateFieldLooseBase(this, _promise)[_promise]);
	    } catch (ex) {
	      reject(ex);
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _promise)[_promise] = null;
	    (_babelHelpers$classPr22 = babelHelpers.classPrivateFieldLooseBase(this, _treeDom)[_treeDom]) == null ? void 0 : _babelHelpers$classPr22.classList.add("structTree");
	    resolve(babelHelpers.classPrivateFieldLooseBase(this, _treeDom)[_treeDom]);
	    return promise;
	  }
	  async getAriaAttributes(annotationId) {
	    await this.render();
	    return babelHelpers.classPrivateFieldLooseBase(this, _elementAttributes)[_elementAttributes].get(annotationId);
	  }
	  hide() {
	    if (babelHelpers.classPrivateFieldLooseBase(this, _treeDom)[_treeDom] && !babelHelpers.classPrivateFieldLooseBase(this, _treeDom)[_treeDom].hidden) {
	      babelHelpers.classPrivateFieldLooseBase(this, _treeDom)[_treeDom].hidden = true;
	    }
	  }
	  show() {
	    var _babelHelpers$classPr23;
	    if ((_babelHelpers$classPr23 = babelHelpers.classPrivateFieldLooseBase(this, _treeDom)[_treeDom]) != null && _babelHelpers$classPr23.hidden) {
	      babelHelpers.classPrivateFieldLooseBase(this, _treeDom)[_treeDom].hidden = false;
	    }
	  }
	  addElementsToTextLayer() {
	    if (!babelHelpers.classPrivateFieldLooseBase(this, _elementsToAddToTextLayer)[_elementsToAddToTextLayer]) {
	      return;
	    }
	    for (const [id, img] of babelHelpers.classPrivateFieldLooseBase(this, _elementsToAddToTextLayer)[_elementsToAddToTextLayer]) {
	      var _document$getElementB;
	      (_document$getElementB = document.getElementById(id)) == null ? void 0 : _document$getElementB.append(img);
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _elementsToAddToTextLayer)[_elementsToAddToTextLayer].clear();
	    babelHelpers.classPrivateFieldLooseBase(this, _elementsToAddToTextLayer)[_elementsToAddToTextLayer] = null;
	  }
	}
	function _setAttributes2(structElement, htmlElement) {
	  const {
	    alt,
	    id,
	    lang
	  } = structElement;
	  if (alt !== undefined) {
	    let added = false;
	    const label = removeNullCharacters(alt);
	    for (const child of structElement.children) {
	      if (child.type === "annotation") {
	        let attrs = babelHelpers.classPrivateFieldLooseBase(this, _elementAttributes)[_elementAttributes].get(child.id);
	        if (!attrs) {
	          attrs = new Map();
	          babelHelpers.classPrivateFieldLooseBase(this, _elementAttributes)[_elementAttributes].set(child.id, attrs);
	        }
	        attrs.set("aria-label", label);
	        added = true;
	      }
	    }
	    if (!added) {
	      htmlElement.setAttribute("aria-label", label);
	    }
	  }
	  if (id !== undefined) {
	    htmlElement.setAttribute("aria-owns", id);
	  }
	  if (lang !== undefined) {
	    htmlElement.setAttribute("lang", removeNullCharacters(lang, true));
	  }
	}
	function _addImageInTextLayer2(node, element) {
	  var _babelHelpers$classPr61;
	  const {
	    alt,
	    bbox,
	    children
	  } = node;
	  const child = children == null ? void 0 : children[0];
	  if (!babelHelpers.classPrivateFieldLooseBase(this, _rawDims)[_rawDims] || !alt || !bbox || (child == null ? void 0 : child.type) !== "content") {
	    return false;
	  }
	  const {
	    id
	  } = child;
	  if (!id) {
	    return false;
	  }
	  element.setAttribute("aria-owns", id);
	  const img = document.createElement("span");
	  ((_babelHelpers$classPr61 = babelHelpers.classPrivateFieldLooseBase(this, _elementsToAddToTextLayer))[_elementsToAddToTextLayer] || (_babelHelpers$classPr61[_elementsToAddToTextLayer] = new Map())).set(id, img);
	  img.setAttribute("role", "img");
	  img.setAttribute("aria-label", removeNullCharacters(alt));
	  const {
	    pageHeight,
	    pageX,
	    pageY
	  } = babelHelpers.classPrivateFieldLooseBase(this, _rawDims)[_rawDims];
	  const calc = "calc(var(--scale-factor)*";
	  const {
	    style
	  } = img;
	  style.width = `${calc}${bbox[2] - bbox[0]}px)`;
	  style.height = `${calc}${bbox[3] - bbox[1]}px)`;
	  style.left = `${calc}${bbox[0] - pageX}px)`;
	  style.top = `${calc}${pageHeight - bbox[3] + pageY}px)`;
	  return true;
	}
	function _walk2(node) {
	  if (!node) {
	    return null;
	  }
	  const element = document.createElement("span");
	  if ("role" in node) {
	    const {
	      role
	    } = node;
	    const match = role.match(HEADING_PATTERN);
	    if (match) {
	      element.setAttribute("role", "heading");
	      element.setAttribute("aria-level", match[1]);
	    } else if (PDF_ROLE_TO_HTML_ROLE[role]) {
	      element.setAttribute("role", PDF_ROLE_TO_HTML_ROLE[role]);
	    }
	    if (role === "Figure" && babelHelpers.classPrivateFieldLooseBase(this, _addImageInTextLayer)[_addImageInTextLayer](node, element)) {
	      return element;
	    }
	  }
	  babelHelpers.classPrivateFieldLooseBase(this, _setAttributes)[_setAttributes](node, element);
	  if (node.children) {
	    if (node.children.length === 1 && "id" in node.children[0]) {
	      babelHelpers.classPrivateFieldLooseBase(this, _setAttributes)[_setAttributes](node.children[0], element);
	    } else {
	      for (const kid of node.children) {
	        element.append(babelHelpers.classPrivateFieldLooseBase(this, _walk)[_walk](kid));
	      }
	    }
	  }
	  return element;
	}
	var _enabled2 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("enabled");
	var _textChildren = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("textChildren");
	var _textNodes = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("textNodes");
	var _waitingElements = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("waitingElements");
	var _compareElementPositions = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("compareElementPositions");
	var _addIdToAriaOwns = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("addIdToAriaOwns");
	class TextAccessibilityManager {
	  constructor() {
	    Object.defineProperty(this, _addIdToAriaOwns, {
	      value: _addIdToAriaOwns2
	    });
	    Object.defineProperty(this, _enabled2, {
	      writable: true,
	      value: false
	    });
	    Object.defineProperty(this, _textChildren, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _textNodes, {
	      writable: true,
	      value: new Map()
	    });
	    Object.defineProperty(this, _waitingElements, {
	      writable: true,
	      value: new Map()
	    });
	  }
	  setTextMapping(textDivs) {
	    babelHelpers.classPrivateFieldLooseBase(this, _textChildren)[_textChildren] = textDivs;
	  }
	  enable() {
	    if (babelHelpers.classPrivateFieldLooseBase(this, _enabled2)[_enabled2]) {
	      throw new Error("TextAccessibilityManager is already enabled.");
	    }
	    if (!babelHelpers.classPrivateFieldLooseBase(this, _textChildren)[_textChildren]) {
	      throw new Error("Text divs and strings have not been set.");
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _enabled2)[_enabled2] = true;
	    babelHelpers.classPrivateFieldLooseBase(this, _textChildren)[_textChildren] = babelHelpers.classPrivateFieldLooseBase(this, _textChildren)[_textChildren].slice();
	    babelHelpers.classPrivateFieldLooseBase(this, _textChildren)[_textChildren].sort(babelHelpers.classPrivateFieldLooseBase(TextAccessibilityManager, _compareElementPositions)[_compareElementPositions]);
	    if (babelHelpers.classPrivateFieldLooseBase(this, _textNodes)[_textNodes].size > 0) {
	      const textChildren = babelHelpers.classPrivateFieldLooseBase(this, _textChildren)[_textChildren];
	      for (const [id, nodeIndex] of babelHelpers.classPrivateFieldLooseBase(this, _textNodes)[_textNodes]) {
	        const element = document.getElementById(id);
	        if (!element) {
	          babelHelpers.classPrivateFieldLooseBase(this, _textNodes)[_textNodes].delete(id);
	          continue;
	        }
	        babelHelpers.classPrivateFieldLooseBase(this, _addIdToAriaOwns)[_addIdToAriaOwns](id, textChildren[nodeIndex]);
	      }
	    }
	    for (const [element, isRemovable] of babelHelpers.classPrivateFieldLooseBase(this, _waitingElements)[_waitingElements]) {
	      this.addPointerInTextLayer(element, isRemovable);
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _waitingElements)[_waitingElements].clear();
	  }
	  disable() {
	    if (!babelHelpers.classPrivateFieldLooseBase(this, _enabled2)[_enabled2]) {
	      return;
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _waitingElements)[_waitingElements].clear();
	    babelHelpers.classPrivateFieldLooseBase(this, _textChildren)[_textChildren] = null;
	    babelHelpers.classPrivateFieldLooseBase(this, _enabled2)[_enabled2] = false;
	  }
	  removePointerInTextLayer(element) {
	    var _owns;
	    if (!babelHelpers.classPrivateFieldLooseBase(this, _enabled2)[_enabled2]) {
	      babelHelpers.classPrivateFieldLooseBase(this, _waitingElements)[_waitingElements].delete(element);
	      return;
	    }
	    const children = babelHelpers.classPrivateFieldLooseBase(this, _textChildren)[_textChildren];
	    if (!children || children.length === 0) {
	      return;
	    }
	    const {
	      id
	    } = element;
	    const nodeIndex = babelHelpers.classPrivateFieldLooseBase(this, _textNodes)[_textNodes].get(id);
	    if (nodeIndex === undefined) {
	      return;
	    }
	    const node = children[nodeIndex];
	    babelHelpers.classPrivateFieldLooseBase(this, _textNodes)[_textNodes].delete(id);
	    let owns = node.getAttribute("aria-owns");
	    if ((_owns = owns) != null && _owns.includes(id)) {
	      owns = owns.split(" ").filter(x => x !== id).join(" ");
	      if (owns) {
	        node.setAttribute("aria-owns", owns);
	      } else {
	        node.removeAttribute("aria-owns");
	        node.setAttribute("role", "presentation");
	      }
	    }
	  }
	  addPointerInTextLayer(element, isRemovable) {
	    const {
	      id
	    } = element;
	    if (!id) {
	      return null;
	    }
	    if (!babelHelpers.classPrivateFieldLooseBase(this, _enabled2)[_enabled2]) {
	      babelHelpers.classPrivateFieldLooseBase(this, _waitingElements)[_waitingElements].set(element, isRemovable);
	      return null;
	    }
	    if (isRemovable) {
	      this.removePointerInTextLayer(element);
	    }
	    const children = babelHelpers.classPrivateFieldLooseBase(this, _textChildren)[_textChildren];
	    if (!children || children.length === 0) {
	      return null;
	    }
	    const index = binarySearchFirstItem(children, node => babelHelpers.classPrivateFieldLooseBase(TextAccessibilityManager, _compareElementPositions)[_compareElementPositions](element, node) < 0);
	    const nodeIndex = Math.max(0, index - 1);
	    const child = children[nodeIndex];
	    babelHelpers.classPrivateFieldLooseBase(this, _addIdToAriaOwns)[_addIdToAriaOwns](id, child);
	    babelHelpers.classPrivateFieldLooseBase(this, _textNodes)[_textNodes].set(id, nodeIndex);
	    const parent = child.parentNode;
	    return parent != null && parent.classList.contains("markedContent") ? parent.id : null;
	  }
	  moveElementInDOM(container, element, contentElement, isRemovable) {
	    const id = this.addPointerInTextLayer(contentElement, isRemovable);
	    if (!container.hasChildNodes()) {
	      container.append(element);
	      return id;
	    }
	    const children = Array.from(container.childNodes).filter(node => node !== element);
	    if (children.length === 0) {
	      return id;
	    }
	    const elementToCompare = contentElement || element;
	    const index = binarySearchFirstItem(children, node => babelHelpers.classPrivateFieldLooseBase(TextAccessibilityManager, _compareElementPositions)[_compareElementPositions](elementToCompare, node) < 0);
	    if (index === 0) {
	      children[0].before(element);
	    } else {
	      children[index - 1].after(element);
	    }
	    return id;
	  }
	}
	function _compareElementPositions2(e1, e2) {
	  const rect1 = e1.getBoundingClientRect();
	  const rect2 = e2.getBoundingClientRect();
	  if (rect1.width === 0 && rect1.height === 0) {
	    return +1;
	  }
	  if (rect2.width === 0 && rect2.height === 0) {
	    return -1;
	  }
	  const top1 = rect1.y;
	  const bot1 = rect1.y + rect1.height;
	  const mid1 = rect1.y + rect1.height / 2;
	  const top2 = rect2.y;
	  const bot2 = rect2.y + rect2.height;
	  const mid2 = rect2.y + rect2.height / 2;
	  if (mid1 <= top2 && mid2 >= bot1) {
	    return -1;
	  }
	  if (mid2 <= top1 && mid1 >= bot2) {
	    return +1;
	  }
	  const centerX1 = rect1.x + rect1.width / 2;
	  const centerX2 = rect2.x + rect2.width / 2;
	  return centerX1 - centerX2;
	}
	function _addIdToAriaOwns2(id, node) {
	  const owns = node.getAttribute("aria-owns");
	  if (!(owns != null && owns.includes(id))) {
	    node.setAttribute("aria-owns", owns ? `${owns} ${id}` : id);
	  }
	  node.removeAttribute("role");
	}
	Object.defineProperty(TextAccessibilityManager, _compareElementPositions, {
	  value: _compareElementPositions2
	});
	var _eventAbortController4 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("eventAbortController");
	class TextHighlighter {
	  constructor({
	    findController,
	    eventBus,
	    pageIndex
	  }) {
	    Object.defineProperty(this, _eventAbortController4, {
	      writable: true,
	      value: null
	    });
	    this.findController = findController;
	    this.matches = [];
	    this.eventBus = eventBus;
	    this.pageIdx = pageIndex;
	    this.textDivs = null;
	    this.textContentItemsStr = null;
	    this.enabled = false;
	  }
	  setTextMapping(divs, texts) {
	    this.textDivs = divs;
	    this.textContentItemsStr = texts;
	  }
	  enable() {
	    if (!this.textDivs || !this.textContentItemsStr) {
	      throw new Error("Text divs and strings have not been set.");
	    }
	    if (this.enabled) {
	      throw new Error("TextHighlighter is already enabled.");
	    }
	    this.enabled = true;
	    if (!babelHelpers.classPrivateFieldLooseBase(this, _eventAbortController4)[_eventAbortController4]) {
	      babelHelpers.classPrivateFieldLooseBase(this, _eventAbortController4)[_eventAbortController4] = new AbortController();
	      this.eventBus._on("updatetextlayermatches", evt => {
	        if (evt.pageIndex === this.pageIdx || evt.pageIndex === -1) {
	          this._updateMatches();
	        }
	      }, {
	        signal: babelHelpers.classPrivateFieldLooseBase(this, _eventAbortController4)[_eventAbortController4].signal
	      });
	    }
	    this._updateMatches();
	  }
	  disable() {
	    var _babelHelpers$classPr24;
	    if (!this.enabled) {
	      return;
	    }
	    this.enabled = false;
	    (_babelHelpers$classPr24 = babelHelpers.classPrivateFieldLooseBase(this, _eventAbortController4)[_eventAbortController4]) == null ? void 0 : _babelHelpers$classPr24.abort();
	    babelHelpers.classPrivateFieldLooseBase(this, _eventAbortController4)[_eventAbortController4] = null;
	    this._updateMatches(true);
	  }
	  _convertMatches(matches, matchesLength) {
	    if (!matches) {
	      return [];
	    }
	    const {
	      textContentItemsStr
	    } = this;
	    let i = 0,
	      iIndex = 0;
	    const end = textContentItemsStr.length - 1;
	    const result = [];
	    for (let m = 0, mm = matches.length; m < mm; m++) {
	      let matchIdx = matches[m];
	      while (i !== end && matchIdx >= iIndex + textContentItemsStr[i].length) {
	        iIndex += textContentItemsStr[i].length;
	        i++;
	      }
	      if (i === textContentItemsStr.length) {
	        console.error("Could not find a matching mapping");
	      }
	      const match = {
	        begin: {
	          divIdx: i,
	          offset: matchIdx - iIndex
	        }
	      };
	      matchIdx += matchesLength[m];
	      while (i !== end && matchIdx > iIndex + textContentItemsStr[i].length) {
	        iIndex += textContentItemsStr[i].length;
	        i++;
	      }
	      match.end = {
	        divIdx: i,
	        offset: matchIdx - iIndex
	      };
	      result.push(match);
	    }
	    return result;
	  }
	  _renderMatches(matches) {
	    if (matches.length === 0) {
	      return;
	    }
	    const {
	      findController,
	      pageIdx
	    } = this;
	    const {
	      textContentItemsStr,
	      textDivs
	    } = this;
	    const isSelectedPage = pageIdx === findController.selected.pageIdx;
	    const selectedMatchIdx = findController.selected.matchIdx;
	    const highlightAll = findController.state.highlightAll;
	    let prevEnd = null;
	    const infinity = {
	      divIdx: -1,
	      offset: undefined
	    };
	    function beginText(begin, className) {
	      const divIdx = begin.divIdx;
	      textDivs[divIdx].textContent = "";
	      return appendTextToDiv(divIdx, 0, begin.offset, className);
	    }
	    function appendTextToDiv(divIdx, fromOffset, toOffset, className) {
	      let div = textDivs[divIdx];
	      if (div.nodeType === Node.TEXT_NODE) {
	        const span = document.createElement("span");
	        div.before(span);
	        span.append(div);
	        textDivs[divIdx] = span;
	        div = span;
	      }
	      const content = textContentItemsStr[divIdx].substring(fromOffset, toOffset);
	      const node = document.createTextNode(content);
	      if (className) {
	        const span = document.createElement("span");
	        span.className = `${className} appended`;
	        span.append(node);
	        div.append(span);
	        return className.includes("selected") ? span.offsetLeft : 0;
	      }
	      div.append(node);
	      return 0;
	    }
	    let i0 = selectedMatchIdx,
	      i1 = i0 + 1;
	    if (highlightAll) {
	      i0 = 0;
	      i1 = matches.length;
	    } else if (!isSelectedPage) {
	      return;
	    }
	    let lastDivIdx = -1;
	    let lastOffset = -1;
	    for (let i = i0; i < i1; i++) {
	      const match = matches[i];
	      const begin = match.begin;
	      if (begin.divIdx === lastDivIdx && begin.offset === lastOffset) {
	        continue;
	      }
	      lastDivIdx = begin.divIdx;
	      lastOffset = begin.offset;
	      const end = match.end;
	      const isSelected = isSelectedPage && i === selectedMatchIdx;
	      const highlightSuffix = isSelected ? " selected" : "";
	      let selectedLeft = 0;
	      if (!prevEnd || begin.divIdx !== prevEnd.divIdx) {
	        if (prevEnd !== null) {
	          appendTextToDiv(prevEnd.divIdx, prevEnd.offset, infinity.offset);
	        }
	        beginText(begin);
	      } else {
	        appendTextToDiv(prevEnd.divIdx, prevEnd.offset, begin.offset);
	      }
	      if (begin.divIdx === end.divIdx) {
	        selectedLeft = appendTextToDiv(begin.divIdx, begin.offset, end.offset, "highlight" + highlightSuffix);
	      } else {
	        selectedLeft = appendTextToDiv(begin.divIdx, begin.offset, infinity.offset, "highlight begin" + highlightSuffix);
	        for (let n0 = begin.divIdx + 1, n1 = end.divIdx; n0 < n1; n0++) {
	          textDivs[n0].className = "highlight middle" + highlightSuffix;
	        }
	        beginText(end, "highlight end" + highlightSuffix);
	      }
	      prevEnd = end;
	      if (isSelected) {
	        findController.scrollMatchIntoView({
	          element: textDivs[begin.divIdx],
	          selectedLeft,
	          pageIndex: pageIdx,
	          matchIndex: selectedMatchIdx
	        });
	      }
	    }
	    if (prevEnd) {
	      appendTextToDiv(prevEnd.divIdx, prevEnd.offset, infinity.offset);
	    }
	  }
	  _updateMatches(reset = false) {
	    if (!this.enabled && !reset) {
	      return;
	    }
	    const {
	      findController,
	      matches,
	      pageIdx
	    } = this;
	    const {
	      textContentItemsStr,
	      textDivs
	    } = this;
	    let clearedUntilDivIdx = -1;
	    for (const match of matches) {
	      const begin = Math.max(clearedUntilDivIdx, match.begin.divIdx);
	      for (let n = begin, end = match.end.divIdx; n <= end; n++) {
	        const div = textDivs[n];
	        div.textContent = textContentItemsStr[n];
	        div.className = "";
	      }
	      clearedUntilDivIdx = match.end.divIdx + 1;
	    }
	    if (!(findController != null && findController.highlightMatches) || reset) {
	      return;
	    }
	    const pageMatches = findController.pageMatches[pageIdx] || null;
	    const pageMatchesLength = findController.pageMatchesLength[pageIdx] || null;
	    this.matches = this._convertMatches(pageMatches, pageMatchesLength);
	    this._renderMatches(this.matches);
	  }
	}
	var _enablePermissions = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("enablePermissions");
	var _onAppend3 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onAppend");
	var _renderingDone = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("renderingDone");
	var _textLayer2 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("textLayer");
	var _textLayers = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("textLayers");
	var _selectionChangeAbortController = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("selectionChangeAbortController");
	var _bindMouse = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("bindMouse");
	var _removeGlobalSelectionListener = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("removeGlobalSelectionListener");
	var _enableGlobalSelectionListener = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("enableGlobalSelectionListener");
	class TextLayerBuilder {
	  constructor({
	    pdfPage,
	    highlighter = null,
	    accessibilityManager = null,
	    enablePermissions = false,
	    onAppend = null
	  }) {
	    Object.defineProperty(this, _bindMouse, {
	      value: _bindMouse2
	    });
	    Object.defineProperty(this, _enablePermissions, {
	      writable: true,
	      value: false
	    });
	    Object.defineProperty(this, _onAppend3, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _renderingDone, {
	      writable: true,
	      value: false
	    });
	    Object.defineProperty(this, _textLayer2, {
	      writable: true,
	      value: null
	    });
	    this.pdfPage = pdfPage;
	    this.highlighter = highlighter;
	    this.accessibilityManager = accessibilityManager;
	    babelHelpers.classPrivateFieldLooseBase(this, _enablePermissions)[_enablePermissions] = enablePermissions === true;
	    babelHelpers.classPrivateFieldLooseBase(this, _onAppend3)[_onAppend3] = onAppend;
	    this.div = document.createElement("div");
	    this.div.tabIndex = 0;
	    this.div.className = "textLayer";
	  }
	  async render(viewport, textContentParams = null) {
	    var _this$highlighter, _this$accessibilityMa, _babelHelpers$classPr25, _babelHelpers$classPr26, _this$highlighter2, _this$accessibilityMa2;
	    if (babelHelpers.classPrivateFieldLooseBase(this, _renderingDone)[_renderingDone] && babelHelpers.classPrivateFieldLooseBase(this, _textLayer2)[_textLayer2]) {
	      babelHelpers.classPrivateFieldLooseBase(this, _textLayer2)[_textLayer2].update({
	        viewport,
	        onBefore: this.hide.bind(this)
	      });
	      this.show();
	      return;
	    }
	    this.cancel();
	    babelHelpers.classPrivateFieldLooseBase(this, _textLayer2)[_textLayer2] = new TextLayer({
	      textContentSource: this.pdfPage.streamTextContent(textContentParams || {
	        includeMarkedContent: true,
	        disableNormalization: true
	      }),
	      container: this.div,
	      viewport
	    });
	    const {
	      textDivs,
	      textContentItemsStr
	    } = babelHelpers.classPrivateFieldLooseBase(this, _textLayer2)[_textLayer2];
	    (_this$highlighter = this.highlighter) == null ? void 0 : _this$highlighter.setTextMapping(textDivs, textContentItemsStr);
	    (_this$accessibilityMa = this.accessibilityManager) == null ? void 0 : _this$accessibilityMa.setTextMapping(textDivs);
	    await babelHelpers.classPrivateFieldLooseBase(this, _textLayer2)[_textLayer2].render();
	    babelHelpers.classPrivateFieldLooseBase(this, _renderingDone)[_renderingDone] = true;
	    const endOfContent = document.createElement("div");
	    endOfContent.className = "endOfContent";
	    this.div.append(endOfContent);
	    babelHelpers.classPrivateFieldLooseBase(this, _bindMouse)[_bindMouse](endOfContent);
	    (_babelHelpers$classPr25 = (_babelHelpers$classPr26 = babelHelpers.classPrivateFieldLooseBase(this, _onAppend3))[_onAppend3]) == null ? void 0 : _babelHelpers$classPr25.call(_babelHelpers$classPr26, this.div);
	    (_this$highlighter2 = this.highlighter) == null ? void 0 : _this$highlighter2.enable();
	    (_this$accessibilityMa2 = this.accessibilityManager) == null ? void 0 : _this$accessibilityMa2.enable();
	  }
	  hide() {
	    if (!this.div.hidden && babelHelpers.classPrivateFieldLooseBase(this, _renderingDone)[_renderingDone]) {
	      var _this$highlighter3;
	      (_this$highlighter3 = this.highlighter) == null ? void 0 : _this$highlighter3.disable();
	      this.div.hidden = true;
	    }
	  }
	  show() {
	    if (this.div.hidden && babelHelpers.classPrivateFieldLooseBase(this, _renderingDone)[_renderingDone]) {
	      var _this$highlighter4;
	      this.div.hidden = false;
	      (_this$highlighter4 = this.highlighter) == null ? void 0 : _this$highlighter4.enable();
	    }
	  }
	  cancel() {
	    var _babelHelpers$classPr27, _this$highlighter5, _this$accessibilityMa3;
	    (_babelHelpers$classPr27 = babelHelpers.classPrivateFieldLooseBase(this, _textLayer2)[_textLayer2]) == null ? void 0 : _babelHelpers$classPr27.cancel();
	    babelHelpers.classPrivateFieldLooseBase(this, _textLayer2)[_textLayer2] = null;
	    (_this$highlighter5 = this.highlighter) == null ? void 0 : _this$highlighter5.disable();
	    (_this$accessibilityMa3 = this.accessibilityManager) == null ? void 0 : _this$accessibilityMa3.disable();
	    babelHelpers.classPrivateFieldLooseBase(TextLayerBuilder, _removeGlobalSelectionListener)[_removeGlobalSelectionListener](this.div);
	  }
	}
	function _bindMouse2(end) {
	  const {
	    div
	  } = this;
	  div.addEventListener("mousedown", () => {
	    div.classList.add("selecting");
	  });
	  div.addEventListener("copy", event => {
	    if (!babelHelpers.classPrivateFieldLooseBase(this, _enablePermissions)[_enablePermissions]) {
	      const selection = document.getSelection();
	      event.clipboardData.setData("text/plain", removeNullCharacters(normalizeUnicode(selection.toString())));
	    }
	    event.preventDefault();
	    event.stopPropagation();
	  });
	  babelHelpers.classPrivateFieldLooseBase(TextLayerBuilder, _textLayers)[_textLayers].set(div, end);
	  babelHelpers.classPrivateFieldLooseBase(TextLayerBuilder, _enableGlobalSelectionListener)[_enableGlobalSelectionListener]();
	}
	function _removeGlobalSelectionListener2(textLayerDiv) {
	  babelHelpers.classPrivateFieldLooseBase(this, _textLayers)[_textLayers].delete(textLayerDiv);
	  if (babelHelpers.classPrivateFieldLooseBase(this, _textLayers)[_textLayers].size === 0) {
	    var _babelHelpers$classPr62;
	    (_babelHelpers$classPr62 = babelHelpers.classPrivateFieldLooseBase(this, _selectionChangeAbortController)[_selectionChangeAbortController]) == null ? void 0 : _babelHelpers$classPr62.abort();
	    babelHelpers.classPrivateFieldLooseBase(this, _selectionChangeAbortController)[_selectionChangeAbortController] = null;
	  }
	}
	function _enableGlobalSelectionListener2() {
	  if (babelHelpers.classPrivateFieldLooseBase(this, _selectionChangeAbortController)[_selectionChangeAbortController]) {
	    return;
	  }
	  babelHelpers.classPrivateFieldLooseBase(this, _selectionChangeAbortController)[_selectionChangeAbortController] = new AbortController();
	  const {
	    signal
	  } = babelHelpers.classPrivateFieldLooseBase(this, _selectionChangeAbortController)[_selectionChangeAbortController];
	  const reset = (end, textLayer) => {
	    textLayer.append(end);
	    end.style.width = "";
	    end.style.height = "";
	    textLayer.classList.remove("selecting");
	  };
	  let isPointerDown = false;
	  document.addEventListener("pointerdown", () => {
	    isPointerDown = true;
	  }, {
	    signal
	  });
	  document.addEventListener("pointerup", () => {
	    isPointerDown = false;
	    babelHelpers.classPrivateFieldLooseBase(this, _textLayers)[_textLayers].forEach(reset);
	  }, {
	    signal
	  });
	  window.addEventListener("blur", () => {
	    isPointerDown = false;
	    babelHelpers.classPrivateFieldLooseBase(this, _textLayers)[_textLayers].forEach(reset);
	  }, {
	    signal
	  });
	  document.addEventListener("keyup", () => {
	    if (!isPointerDown) {
	      babelHelpers.classPrivateFieldLooseBase(this, _textLayers)[_textLayers].forEach(reset);
	    }
	  }, {
	    signal
	  });
	  var isFirefox, prevRange;
	  document.addEventListener("selectionchange", () => {
	    var _isFirefox, _anchor$parentElement;
	    const selection = document.getSelection();
	    if (selection.rangeCount === 0) {
	      babelHelpers.classPrivateFieldLooseBase(this, _textLayers)[_textLayers].forEach(reset);
	      return;
	    }
	    const activeTextLayers = new Set();
	    for (let i = 0; i < selection.rangeCount; i++) {
	      const range = selection.getRangeAt(i);
	      for (const textLayerDiv of babelHelpers.classPrivateFieldLooseBase(this, _textLayers)[_textLayers].keys()) {
	        if (!activeTextLayers.has(textLayerDiv) && range.intersectsNode(textLayerDiv)) {
	          activeTextLayers.add(textLayerDiv);
	        }
	      }
	    }
	    for (const [textLayerDiv, endDiv] of babelHelpers.classPrivateFieldLooseBase(this, _textLayers)[_textLayers]) {
	      if (activeTextLayers.has(textLayerDiv)) {
	        textLayerDiv.classList.add("selecting");
	      } else {
	        reset(endDiv, textLayerDiv);
	      }
	    }
	    (_isFirefox = isFirefox) != null ? _isFirefox : isFirefox = getComputedStyle(babelHelpers.classPrivateFieldLooseBase(this, _textLayers)[_textLayers].values().next().value).getPropertyValue("-moz-user-select") === "none";
	    if (isFirefox) {
	      return;
	    }
	    const range = selection.getRangeAt(0);
	    const modifyStart = prevRange && (range.compareBoundaryPoints(Range.END_TO_END, prevRange) === 0 || range.compareBoundaryPoints(Range.START_TO_END, prevRange) === 0);
	    let anchor = modifyStart ? range.startContainer : range.endContainer;
	    if (anchor.nodeType === Node.TEXT_NODE) {
	      anchor = anchor.parentNode;
	    }
	    const parentTextLayer = (_anchor$parentElement = anchor.parentElement) == null ? void 0 : _anchor$parentElement.closest(".textLayer");
	    const endDiv = babelHelpers.classPrivateFieldLooseBase(this, _textLayers)[_textLayers].get(parentTextLayer);
	    if (endDiv) {
	      endDiv.style.width = parentTextLayer.style.width;
	      endDiv.style.height = parentTextLayer.style.height;
	      anchor.parentElement.insertBefore(endDiv, modifyStart ? anchor : anchor.nextSibling);
	    }
	    prevRange = range.cloneRange();
	  }, {
	    signal
	  });
	}
	Object.defineProperty(TextLayerBuilder, _enableGlobalSelectionListener, {
	  value: _enableGlobalSelectionListener2
	});
	Object.defineProperty(TextLayerBuilder, _removeGlobalSelectionListener, {
	  value: _removeGlobalSelectionListener2
	});
	Object.defineProperty(TextLayerBuilder, _textLayers, {
	  writable: true,
	  value: new Map()
	});
	Object.defineProperty(TextLayerBuilder, _selectionChangeAbortController, {
	  writable: true,
	  value: null
	});

	const DEFAULT_LAYER_PROPERTIES = null;
	const LAYERS_ORDER = new Map([["canvasWrapper", 0], ["textLayer", 1], ["annotationLayer", 2], ["annotationEditorLayer", 3], ["xfaLayer", 3]]);
	var _annotationMode = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("annotationMode");
	var _enableHWA2 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("enableHWA");
	var _hasRestrictedScaling = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("hasRestrictedScaling");
	var _isEditing2 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isEditing");
	var _layerProperties = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("layerProperties");
	var _loadingId = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("loadingId");
	var _previousRotation = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("previousRotation");
	var _scaleRoundX = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("scaleRoundX");
	var _scaleRoundY = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("scaleRoundY");
	var _renderError = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("renderError");
	var _renderingState = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("renderingState");
	var _textLayerMode = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("textLayerMode");
	var _useThumbnailCanvas = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("useThumbnailCanvas");
	var _viewportMap = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("viewportMap");
	var _layers = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("layers");
	var _addLayer = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("addLayer");
	var _setDimensions = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("setDimensions");
	var _dispatchLayerRendered = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("dispatchLayerRendered");
	var _renderAnnotationLayer = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("renderAnnotationLayer");
	var _renderAnnotationEditorLayer = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("renderAnnotationEditorLayer");
	var _renderDrawLayer = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("renderDrawLayer");
	var _renderXfaLayer = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("renderXfaLayer");
	var _renderTextLayer = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("renderTextLayer");
	var _renderStructTreeLayer = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("renderStructTreeLayer");
	var _buildXfaTextContentItems = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("buildXfaTextContentItems");
	var _finishRenderTask3 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("finishRenderTask");
	class PDFPageView {
	  constructor(options) {
	    var _options$textLayerMod, _options$annotationMo, _options$maxCanvasPix, _this$renderingQueue;
	    Object.defineProperty(this, _finishRenderTask3, {
	      value: _finishRenderTask4
	    });
	    Object.defineProperty(this, _buildXfaTextContentItems, {
	      value: _buildXfaTextContentItems2
	    });
	    Object.defineProperty(this, _renderStructTreeLayer, {
	      value: _renderStructTreeLayer2
	    });
	    Object.defineProperty(this, _renderTextLayer, {
	      value: _renderTextLayer2
	    });
	    Object.defineProperty(this, _renderXfaLayer, {
	      value: _renderXfaLayer2
	    });
	    Object.defineProperty(this, _renderDrawLayer, {
	      value: _renderDrawLayer2
	    });
	    Object.defineProperty(this, _renderAnnotationEditorLayer, {
	      value: _renderAnnotationEditorLayer2
	    });
	    Object.defineProperty(this, _renderAnnotationLayer, {
	      value: _renderAnnotationLayer2
	    });
	    Object.defineProperty(this, _dispatchLayerRendered, {
	      value: _dispatchLayerRendered2
	    });
	    Object.defineProperty(this, _setDimensions, {
	      value: _setDimensions2
	    });
	    Object.defineProperty(this, _addLayer, {
	      value: _addLayer2
	    });
	    Object.defineProperty(this, _annotationMode, {
	      writable: true,
	      value: AnnotationMode.ENABLE_FORMS
	    });
	    Object.defineProperty(this, _enableHWA2, {
	      writable: true,
	      value: false
	    });
	    Object.defineProperty(this, _hasRestrictedScaling, {
	      writable: true,
	      value: false
	    });
	    Object.defineProperty(this, _isEditing2, {
	      writable: true,
	      value: false
	    });
	    Object.defineProperty(this, _layerProperties, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _loadingId, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _previousRotation, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _scaleRoundX, {
	      writable: true,
	      value: 1
	    });
	    Object.defineProperty(this, _scaleRoundY, {
	      writable: true,
	      value: 1
	    });
	    Object.defineProperty(this, _renderError, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _renderingState, {
	      writable: true,
	      value: RenderingStates.INITIAL
	    });
	    Object.defineProperty(this, _textLayerMode, {
	      writable: true,
	      value: TextLayerMode.ENABLE
	    });
	    Object.defineProperty(this, _useThumbnailCanvas, {
	      writable: true,
	      value: {
	        directDrawing: true,
	        initialOptionalContent: true,
	        regularAnnotations: true
	      }
	    });
	    Object.defineProperty(this, _viewportMap, {
	      writable: true,
	      value: new WeakMap()
	    });
	    Object.defineProperty(this, _layers, {
	      writable: true,
	      value: [null, null, null, null]
	    });
	    const container = options.container;
	    const defaultViewport = options.defaultViewport;
	    this.id = options.id;
	    this.renderingId = "page" + this.id;
	    babelHelpers.classPrivateFieldLooseBase(this, _layerProperties)[_layerProperties] = options.layerProperties || DEFAULT_LAYER_PROPERTIES;
	    this.pdfPage = null;
	    this.pageLabel = null;
	    this.rotation = 0;
	    this.scale = options.scale || DEFAULT_SCALE;
	    this.viewport = defaultViewport;
	    this.pdfPageRotate = defaultViewport.rotation;
	    this._optionalContentConfigPromise = options.optionalContentConfigPromise || null;
	    babelHelpers.classPrivateFieldLooseBase(this, _textLayerMode)[_textLayerMode] = (_options$textLayerMod = options.textLayerMode) != null ? _options$textLayerMod : TextLayerMode.ENABLE;
	    babelHelpers.classPrivateFieldLooseBase(this, _annotationMode)[_annotationMode] = (_options$annotationMo = options.annotationMode) != null ? _options$annotationMo : AnnotationMode.ENABLE_FORMS;
	    this.imageResourcesPath = options.imageResourcesPath || "";
	    this.maxCanvasPixels = (_options$maxCanvasPix = options.maxCanvasPixels) != null ? _options$maxCanvasPix : AppOptions.get("maxCanvasPixels");
	    this.pageColors = options.pageColors || null;
	    babelHelpers.classPrivateFieldLooseBase(this, _enableHWA2)[_enableHWA2] = options.enableHWA || false;
	    this.eventBus = options.eventBus;
	    this.renderingQueue = options.renderingQueue;
	    this.l10n = options.l10n;
	    this.l10n || (this.l10n = new genericl10n_GenericL10n());
	    this.renderTask = null;
	    this.resume = null;
	    this._isStandalone = !((_this$renderingQueue = this.renderingQueue) != null && _this$renderingQueue.hasViewer());
	    this._container = container;
	    this._annotationCanvasMap = null;
	    this.annotationLayer = null;
	    this.annotationEditorLayer = null;
	    this.textLayer = null;
	    this.zoomLayer = null;
	    this.xfaLayer = null;
	    this.structTreeLayer = null;
	    this.drawLayer = null;
	    const _div = document.createElement("div");
	    _div.className = "page";
	    _div.setAttribute("data-page-number", this.id);
	    _div.setAttribute("role", "region");
	    _div.setAttribute("data-l10n-id", "pdfjs-page-landmark");
	    _div.setAttribute("data-l10n-args", JSON.stringify({
	      page: this.id
	    }));
	    this.div = _div;
	    babelHelpers.classPrivateFieldLooseBase(this, _setDimensions)[_setDimensions]();
	    container == null ? void 0 : container.append(_div);
	    if (this._isStandalone) {
	      var _this$pageColors;
	      container == null ? void 0 : container.style.setProperty("--scale-factor", this.scale * PixelsPerInch.PDF_TO_CSS_UNITS);
	      if ((_this$pageColors = this.pageColors) != null && _this$pageColors.background) {
	        container == null ? void 0 : container.style.setProperty("--page-bg-color", this.pageColors.background);
	      }
	      const {
	        optionalContentConfigPromise
	      } = options;
	      if (optionalContentConfigPromise) {
	        optionalContentConfigPromise.then(optionalContentConfig => {
	          if (optionalContentConfigPromise !== this._optionalContentConfigPromise) {
	            return;
	          }
	          babelHelpers.classPrivateFieldLooseBase(this, _useThumbnailCanvas)[_useThumbnailCanvas].initialOptionalContent = optionalContentConfig.hasInitialVisibility;
	        });
	      }
	      if (!options.l10n) {
	        this.l10n.translate(this.div);
	      }
	    }
	  }
	  get renderingState() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _renderingState)[_renderingState];
	  }
	  set renderingState(state) {
	    if (state === babelHelpers.classPrivateFieldLooseBase(this, _renderingState)[_renderingState]) {
	      return;
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _renderingState)[_renderingState] = state;
	    if (babelHelpers.classPrivateFieldLooseBase(this, _loadingId)[_loadingId]) {
	      clearTimeout(babelHelpers.classPrivateFieldLooseBase(this, _loadingId)[_loadingId]);
	      babelHelpers.classPrivateFieldLooseBase(this, _loadingId)[_loadingId] = null;
	    }
	    switch (state) {
	      case RenderingStates.PAUSED:
	        this.div.classList.remove("loading");
	        break;
	      case RenderingStates.RUNNING:
	        this.div.classList.add("loadingIcon");
	        babelHelpers.classPrivateFieldLooseBase(this, _loadingId)[_loadingId] = setTimeout(() => {
	          this.div.classList.add("loading");
	          babelHelpers.classPrivateFieldLooseBase(this, _loadingId)[_loadingId] = null;
	        }, 0);
	        break;
	      case RenderingStates.INITIAL:
	      case RenderingStates.FINISHED:
	        this.div.classList.remove("loadingIcon", "loading");
	        break;
	    }
	  }
	  setPdfPage(pdfPage) {
	    var _this$pageColors2, _this$pageColors3;
	    if (this._isStandalone && (((_this$pageColors2 = this.pageColors) == null ? void 0 : _this$pageColors2.foreground) === "CanvasText" || ((_this$pageColors3 = this.pageColors) == null ? void 0 : _this$pageColors3.background) === "Canvas")) {
	      var _this$_container, _this$_container2;
	      (_this$_container = this._container) == null ? void 0 : _this$_container.style.setProperty("--hcm-highlight-filter", pdfPage.filterFactory.addHighlightHCMFilter("highlight", "CanvasText", "Canvas", "HighlightText", "Highlight"));
	      (_this$_container2 = this._container) == null ? void 0 : _this$_container2.style.setProperty("--hcm-highlight-selected-filter", pdfPage.filterFactory.addHighlightHCMFilter("highlight_selected", "CanvasText", "Canvas", "HighlightText", "Highlight"));
	    }
	    this.pdfPage = pdfPage;
	    this.pdfPageRotate = pdfPage.rotate;
	    const totalRotation = (this.rotation + this.pdfPageRotate) % 360;
	    this.viewport = pdfPage.getViewport({
	      scale: this.scale * PixelsPerInch.PDF_TO_CSS_UNITS,
	      rotation: totalRotation
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _setDimensions)[_setDimensions]();
	    this.reset();
	  }
	  destroy() {
	    var _this$pdfPage;
	    this.reset();
	    (_this$pdfPage = this.pdfPage) == null ? void 0 : _this$pdfPage.cleanup();
	  }
	  hasEditableAnnotations() {
	    var _this$annotationLayer2;
	    return !!((_this$annotationLayer2 = this.annotationLayer) != null && _this$annotationLayer2.hasEditableAnnotations());
	  }
	  get _textHighlighter() {
	    return shadow(this, "_textHighlighter", new TextHighlighter({
	      pageIndex: this.id - 1,
	      eventBus: this.eventBus,
	      findController: babelHelpers.classPrivateFieldLooseBase(this, _layerProperties)[_layerProperties].findController
	    }));
	  }
	  _resetZoomLayer(removeFromDOM = false) {
	    if (!this.zoomLayer) {
	      return;
	    }
	    const zoomLayerCanvas = this.zoomLayer.firstChild;
	    babelHelpers.classPrivateFieldLooseBase(this, _viewportMap)[_viewportMap].delete(zoomLayerCanvas);
	    zoomLayerCanvas.width = 0;
	    zoomLayerCanvas.height = 0;
	    if (removeFromDOM) {
	      this.zoomLayer.remove();
	    }
	    this.zoomLayer = null;
	  }
	  reset({
	    keepZoomLayer = false,
	    keepAnnotationLayer = false,
	    keepAnnotationEditorLayer = false,
	    keepXfaLayer = false,
	    keepTextLayer = false
	  } = {}) {
	    var _this$annotationLayer3, _this$annotationEdito, _this$xfaLayer, _this$textLayer, _this$structTreeLayer;
	    this.cancelRendering({
	      keepAnnotationLayer,
	      keepAnnotationEditorLayer,
	      keepXfaLayer,
	      keepTextLayer
	    });
	    this.renderingState = RenderingStates.INITIAL;
	    const div = this.div;
	    const childNodes = div.childNodes,
	      zoomLayerNode = keepZoomLayer && this.zoomLayer || null,
	      annotationLayerNode = keepAnnotationLayer && ((_this$annotationLayer3 = this.annotationLayer) == null ? void 0 : _this$annotationLayer3.div) || null,
	      annotationEditorLayerNode = keepAnnotationEditorLayer && ((_this$annotationEdito = this.annotationEditorLayer) == null ? void 0 : _this$annotationEdito.div) || null,
	      xfaLayerNode = keepXfaLayer && ((_this$xfaLayer = this.xfaLayer) == null ? void 0 : _this$xfaLayer.div) || null,
	      textLayerNode = keepTextLayer && ((_this$textLayer = this.textLayer) == null ? void 0 : _this$textLayer.div) || null;
	    for (let i = childNodes.length - 1; i >= 0; i--) {
	      const node = childNodes[i];
	      switch (node) {
	        case zoomLayerNode:
	        case annotationLayerNode:
	        case annotationEditorLayerNode:
	        case xfaLayerNode:
	        case textLayerNode:
	          continue;
	      }
	      node.remove();
	      const layerIndex = babelHelpers.classPrivateFieldLooseBase(this, _layers)[_layers].indexOf(node);
	      if (layerIndex >= 0) {
	        babelHelpers.classPrivateFieldLooseBase(this, _layers)[_layers][layerIndex] = null;
	      }
	    }
	    div.removeAttribute("data-loaded");
	    if (annotationLayerNode) {
	      this.annotationLayer.hide();
	    }
	    if (annotationEditorLayerNode) {
	      this.annotationEditorLayer.hide();
	    }
	    if (xfaLayerNode) {
	      this.xfaLayer.hide();
	    }
	    if (textLayerNode) {
	      this.textLayer.hide();
	    }
	    (_this$structTreeLayer = this.structTreeLayer) == null ? void 0 : _this$structTreeLayer.hide();
	    if (!zoomLayerNode) {
	      if (this.canvas) {
	        babelHelpers.classPrivateFieldLooseBase(this, _viewportMap)[_viewportMap].delete(this.canvas);
	        this.canvas.width = 0;
	        this.canvas.height = 0;
	        delete this.canvas;
	      }
	      this._resetZoomLayer();
	    }
	  }
	  toggleEditingMode(isEditing) {
	    if (!this.hasEditableAnnotations()) {
	      return;
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _isEditing2)[_isEditing2] = isEditing;
	    this.reset({
	      keepZoomLayer: true,
	      keepAnnotationLayer: true,
	      keepAnnotationEditorLayer: true,
	      keepXfaLayer: true,
	      keepTextLayer: true
	    });
	  }
	  update({
	    scale = 0,
	    rotation = null,
	    optionalContentConfigPromise = null,
	    drawingDelay = -1
	  }) {
	    this.scale = scale || this.scale;
	    if (typeof rotation === "number") {
	      this.rotation = rotation;
	    }
	    if (optionalContentConfigPromise instanceof Promise) {
	      this._optionalContentConfigPromise = optionalContentConfigPromise;
	      optionalContentConfigPromise.then(optionalContentConfig => {
	        if (optionalContentConfigPromise !== this._optionalContentConfigPromise) {
	          return;
	        }
	        babelHelpers.classPrivateFieldLooseBase(this, _useThumbnailCanvas)[_useThumbnailCanvas].initialOptionalContent = optionalContentConfig.hasInitialVisibility;
	      });
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _useThumbnailCanvas)[_useThumbnailCanvas].directDrawing = true;
	    const totalRotation = (this.rotation + this.pdfPageRotate) % 360;
	    this.viewport = this.viewport.clone({
	      scale: this.scale * PixelsPerInch.PDF_TO_CSS_UNITS,
	      rotation: totalRotation
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _setDimensions)[_setDimensions]();
	    if (this._isStandalone) {
	      var _this$_container3;
	      (_this$_container3 = this._container) == null ? void 0 : _this$_container3.style.setProperty("--scale-factor", this.viewport.scale);
	    }
	    if (this.canvas) {
	      let onlyCssZoom = false;
	      if (babelHelpers.classPrivateFieldLooseBase(this, _hasRestrictedScaling)[_hasRestrictedScaling]) {
	        if (this.maxCanvasPixels === 0) {
	          onlyCssZoom = true;
	        } else if (this.maxCanvasPixels > 0) {
	          const {
	            width,
	            height
	          } = this.viewport;
	          const {
	            sx,
	            sy
	          } = this.outputScale;
	          onlyCssZoom = (Math.floor(width) * sx | 0) * (Math.floor(height) * sy | 0) > this.maxCanvasPixels;
	        }
	      }
	      const postponeDrawing = drawingDelay >= 0 && drawingDelay < 1000;
	      if (postponeDrawing || onlyCssZoom) {
	        if (postponeDrawing && !onlyCssZoom && this.renderingState !== RenderingStates.FINISHED) {
	          this.cancelRendering({
	            keepZoomLayer: true,
	            keepAnnotationLayer: true,
	            keepAnnotationEditorLayer: true,
	            keepXfaLayer: true,
	            keepTextLayer: true,
	            cancelExtraDelay: drawingDelay
	          });
	          this.renderingState = RenderingStates.FINISHED;
	          babelHelpers.classPrivateFieldLooseBase(this, _useThumbnailCanvas)[_useThumbnailCanvas].directDrawing = false;
	        }
	        this.cssTransform({
	          target: this.canvas,
	          redrawAnnotationLayer: true,
	          redrawAnnotationEditorLayer: true,
	          redrawXfaLayer: true,
	          redrawTextLayer: !postponeDrawing,
	          hideTextLayer: postponeDrawing
	        });
	        if (postponeDrawing) {
	          return;
	        }
	        this.eventBus.dispatch("pagerendered", {
	          source: this,
	          pageNumber: this.id,
	          cssTransform: true,
	          timestamp: performance.now(),
	          error: babelHelpers.classPrivateFieldLooseBase(this, _renderError)[_renderError]
	        });
	        return;
	      }
	      if (!this.zoomLayer && !this.canvas.hidden) {
	        this.zoomLayer = this.canvas.parentNode;
	        this.zoomLayer.style.position = "absolute";
	      }
	    }
	    if (this.zoomLayer) {
	      this.cssTransform({
	        target: this.zoomLayer.firstChild
	      });
	    }
	    this.reset({
	      keepZoomLayer: true,
	      keepAnnotationLayer: true,
	      keepAnnotationEditorLayer: true,
	      keepXfaLayer: true,
	      keepTextLayer: true
	    });
	  }
	  cancelRendering({
	    keepAnnotationLayer = false,
	    keepAnnotationEditorLayer = false,
	    keepXfaLayer = false,
	    keepTextLayer = false,
	    cancelExtraDelay = 0
	  } = {}) {
	    if (this.renderTask) {
	      this.renderTask.cancel(cancelExtraDelay);
	      this.renderTask = null;
	    }
	    this.resume = null;
	    if (this.textLayer && (!keepTextLayer || !this.textLayer.div)) {
	      this.textLayer.cancel();
	      this.textLayer = null;
	    }
	    if (this.annotationLayer && (!keepAnnotationLayer || !this.annotationLayer.div)) {
	      this.annotationLayer.cancel();
	      this.annotationLayer = null;
	      this._annotationCanvasMap = null;
	    }
	    if (this.structTreeLayer && !this.textLayer) {
	      this.structTreeLayer = null;
	    }
	    if (this.annotationEditorLayer && (!keepAnnotationEditorLayer || !this.annotationEditorLayer.div)) {
	      if (this.drawLayer) {
	        this.drawLayer.cancel();
	        this.drawLayer = null;
	      }
	      this.annotationEditorLayer.cancel();
	      this.annotationEditorLayer = null;
	    }
	    if (this.xfaLayer && (!keepXfaLayer || !this.xfaLayer.div)) {
	      var _this$_textHighlighte;
	      this.xfaLayer.cancel();
	      this.xfaLayer = null;
	      (_this$_textHighlighte = this._textHighlighter) == null ? void 0 : _this$_textHighlighte.disable();
	    }
	  }
	  cssTransform({
	    target,
	    redrawAnnotationLayer = false,
	    redrawAnnotationEditorLayer = false,
	    redrawXfaLayer = false,
	    redrawTextLayer = false,
	    hideTextLayer = false
	  }) {
	    if (!target.hasAttribute("zooming")) {
	      target.setAttribute("zooming", true);
	      const {
	        style
	      } = target;
	      style.width = style.height = "";
	    }
	    const originalViewport = babelHelpers.classPrivateFieldLooseBase(this, _viewportMap)[_viewportMap].get(target);
	    if (this.viewport !== originalViewport) {
	      const relativeRotation = this.viewport.rotation - originalViewport.rotation;
	      const absRotation = Math.abs(relativeRotation);
	      let scaleX = 1,
	        scaleY = 1;
	      if (absRotation === 90 || absRotation === 270) {
	        const {
	          width,
	          height
	        } = this.viewport;
	        scaleX = height / width;
	        scaleY = width / height;
	      }
	      target.style.transform = `rotate(${relativeRotation}deg) scale(${scaleX}, ${scaleY})`;
	    }
	    if (redrawAnnotationLayer && this.annotationLayer) {
	      babelHelpers.classPrivateFieldLooseBase(this, _renderAnnotationLayer)[_renderAnnotationLayer]();
	    }
	    if (redrawAnnotationEditorLayer && this.annotationEditorLayer) {
	      if (this.drawLayer) {
	        babelHelpers.classPrivateFieldLooseBase(this, _renderDrawLayer)[_renderDrawLayer]();
	      }
	      babelHelpers.classPrivateFieldLooseBase(this, _renderAnnotationEditorLayer)[_renderAnnotationEditorLayer]();
	    }
	    if (redrawXfaLayer && this.xfaLayer) {
	      babelHelpers.classPrivateFieldLooseBase(this, _renderXfaLayer)[_renderXfaLayer]();
	    }
	    if (this.textLayer) {
	      if (hideTextLayer) {
	        var _this$structTreeLayer2;
	        this.textLayer.hide();
	        (_this$structTreeLayer2 = this.structTreeLayer) == null ? void 0 : _this$structTreeLayer2.hide();
	      } else if (redrawTextLayer) {
	        babelHelpers.classPrivateFieldLooseBase(this, _renderTextLayer)[_renderTextLayer]();
	      }
	    }
	  }
	  get width() {
	    return this.viewport.width;
	  }
	  get height() {
	    return this.viewport.height;
	  }
	  getPagePoint(x, y) {
	    return this.viewport.convertToPdfPoint(x, y);
	  }
	  async draw() {
	    if (this.renderingState !== RenderingStates.INITIAL) {
	      console.error("Must be in new state before drawing");
	      this.reset();
	    }
	    const {
	      div,
	      l10n,
	      pageColors,
	      pdfPage,
	      viewport
	    } = this;
	    if (!pdfPage) {
	      this.renderingState = RenderingStates.FINISHED;
	      throw new Error("pdfPage is not loaded");
	    }
	    this.renderingState = RenderingStates.RUNNING;
	    const canvasWrapper = document.createElement("div");
	    canvasWrapper.classList.add("canvasWrapper");
	    babelHelpers.classPrivateFieldLooseBase(this, _addLayer)[_addLayer](canvasWrapper, "canvasWrapper");
	    if (!this.textLayer && babelHelpers.classPrivateFieldLooseBase(this, _textLayerMode)[_textLayerMode] !== TextLayerMode.DISABLE && !pdfPage.isPureXfa) {
	      this._accessibilityManager || (this._accessibilityManager = new TextAccessibilityManager());
	      this.textLayer = new TextLayerBuilder({
	        pdfPage,
	        highlighter: this._textHighlighter,
	        accessibilityManager: this._accessibilityManager,
	        enablePermissions: babelHelpers.classPrivateFieldLooseBase(this, _textLayerMode)[_textLayerMode] === TextLayerMode.ENABLE_PERMISSIONS,
	        onAppend: textLayerDiv => {
	          this.l10n.pause();
	          babelHelpers.classPrivateFieldLooseBase(this, _addLayer)[_addLayer](textLayerDiv, "textLayer");
	          this.l10n.resume();
	        }
	      });
	    }
	    if (!this.annotationLayer && babelHelpers.classPrivateFieldLooseBase(this, _annotationMode)[_annotationMode] !== AnnotationMode.DISABLE) {
	      const {
	        annotationStorage,
	        annotationEditorUIManager,
	        downloadManager,
	        enableScripting,
	        fieldObjectsPromise,
	        hasJSActionsPromise,
	        linkService
	      } = babelHelpers.classPrivateFieldLooseBase(this, _layerProperties)[_layerProperties];
	      this._annotationCanvasMap || (this._annotationCanvasMap = new Map());
	      this.annotationLayer = new AnnotationLayerBuilder({
	        pdfPage,
	        annotationStorage,
	        imageResourcesPath: this.imageResourcesPath,
	        renderForms: babelHelpers.classPrivateFieldLooseBase(this, _annotationMode)[_annotationMode] === AnnotationMode.ENABLE_FORMS,
	        linkService,
	        downloadManager,
	        enableScripting,
	        hasJSActionsPromise,
	        fieldObjectsPromise,
	        annotationCanvasMap: this._annotationCanvasMap,
	        accessibilityManager: this._accessibilityManager,
	        annotationEditorUIManager,
	        onAppend: annotationLayerDiv => {
	          babelHelpers.classPrivateFieldLooseBase(this, _addLayer)[_addLayer](annotationLayerDiv, "annotationLayer");
	        }
	      });
	    }
	    const renderContinueCallback = cont => {
	      showCanvas == null ? void 0 : showCanvas(false);
	      if (this.renderingQueue && !this.renderingQueue.isHighestPriority(this)) {
	        this.renderingState = RenderingStates.PAUSED;
	        this.resume = () => {
	          this.renderingState = RenderingStates.RUNNING;
	          cont();
	        };
	        return;
	      }
	      cont();
	    };
	    const {
	      width,
	      height
	    } = viewport;
	    const canvas = document.createElement("canvas");
	    canvas.setAttribute("role", "presentation");
	    canvas.hidden = true;
	    const hasHCM = !!(pageColors != null && pageColors.background && pageColors != null && pageColors.foreground);
	    let showCanvas = isLastShow => {
	      if (!hasHCM || isLastShow) {
	        canvas.hidden = false;
	        showCanvas = null;
	      }
	    };
	    canvasWrapper.append(canvas);
	    this.canvas = canvas;
	    const ctx = canvas.getContext("2d", {
	      alpha: false,
	      willReadFrequently: !babelHelpers.classPrivateFieldLooseBase(this, _enableHWA2)[_enableHWA2]
	    });
	    const outputScale = this.outputScale = new OutputScale();
	    if (this.maxCanvasPixels === 0) {
	      const invScale = 1 / this.scale;
	      outputScale.sx *= invScale;
	      outputScale.sy *= invScale;
	      babelHelpers.classPrivateFieldLooseBase(this, _hasRestrictedScaling)[_hasRestrictedScaling] = true;
	    } else if (this.maxCanvasPixels > 0) {
	      const pixelsInViewport = width * height;
	      const maxScale = Math.sqrt(this.maxCanvasPixels / pixelsInViewport);
	      if (outputScale.sx > maxScale || outputScale.sy > maxScale) {
	        outputScale.sx = maxScale;
	        outputScale.sy = maxScale;
	        babelHelpers.classPrivateFieldLooseBase(this, _hasRestrictedScaling)[_hasRestrictedScaling] = true;
	      } else {
	        babelHelpers.classPrivateFieldLooseBase(this, _hasRestrictedScaling)[_hasRestrictedScaling] = false;
	      }
	    }
	    const sfx = approximateFraction(outputScale.sx);
	    const sfy = approximateFraction(outputScale.sy);
	    const canvasWidth = canvas.width = floorToDivide(calcRound(width * outputScale.sx), sfx[0]);
	    const canvasHeight = canvas.height = floorToDivide(calcRound(height * outputScale.sy), sfy[0]);
	    const pageWidth = floorToDivide(calcRound(width), sfx[1]);
	    const pageHeight = floorToDivide(calcRound(height), sfy[1]);
	    outputScale.sx = canvasWidth / pageWidth;
	    outputScale.sy = canvasHeight / pageHeight;
	    if (babelHelpers.classPrivateFieldLooseBase(this, _scaleRoundX)[_scaleRoundX] !== sfx[1]) {
	      div.style.setProperty("--scale-round-x", `${sfx[1]}px`);
	      babelHelpers.classPrivateFieldLooseBase(this, _scaleRoundX)[_scaleRoundX] = sfx[1];
	    }
	    if (babelHelpers.classPrivateFieldLooseBase(this, _scaleRoundY)[_scaleRoundY] !== sfy[1]) {
	      div.style.setProperty("--scale-round-y", `${sfy[1]}px`);
	      babelHelpers.classPrivateFieldLooseBase(this, _scaleRoundY)[_scaleRoundY] = sfy[1];
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _viewportMap)[_viewportMap].set(canvas, viewport);
	    const transform = outputScale.scaled ? [outputScale.sx, 0, 0, outputScale.sy, 0, 0] : null;
	    const renderContext = {
	      canvasContext: ctx,
	      transform,
	      viewport,
	      annotationMode: babelHelpers.classPrivateFieldLooseBase(this, _annotationMode)[_annotationMode],
	      optionalContentConfigPromise: this._optionalContentConfigPromise,
	      annotationCanvasMap: this._annotationCanvasMap,
	      pageColors,
	      isEditing: babelHelpers.classPrivateFieldLooseBase(this, _isEditing2)[_isEditing2]
	    };
	    const renderTask = this.renderTask = pdfPage.render(renderContext);
	    renderTask.onContinue = renderContinueCallback;
	    const resultPromise = renderTask.promise.then(async () => {
	      var _this$annotationLayer4;
	      showCanvas == null ? void 0 : showCanvas(true);
	      await babelHelpers.classPrivateFieldLooseBase(this, _finishRenderTask3)[_finishRenderTask3](renderTask);
	      this.structTreeLayer || (this.structTreeLayer = new StructTreeLayerBuilder(pdfPage, viewport.rawDims));
	      babelHelpers.classPrivateFieldLooseBase(this, _renderTextLayer)[_renderTextLayer]();
	      if (this.annotationLayer) {
	        await babelHelpers.classPrivateFieldLooseBase(this, _renderAnnotationLayer)[_renderAnnotationLayer]();
	      }
	      const {
	        annotationEditorUIManager
	      } = babelHelpers.classPrivateFieldLooseBase(this, _layerProperties)[_layerProperties];
	      if (!annotationEditorUIManager) {
	        return;
	      }
	      this.drawLayer || (this.drawLayer = new DrawLayerBuilder({
	        pageIndex: this.id
	      }));
	      await babelHelpers.classPrivateFieldLooseBase(this, _renderDrawLayer)[_renderDrawLayer]();
	      this.drawLayer.setParent(canvasWrapper);
	      this.annotationEditorLayer || (this.annotationEditorLayer = new AnnotationEditorLayerBuilder({
	        uiManager: annotationEditorUIManager,
	        pdfPage,
	        l10n,
	        structTreeLayer: this.structTreeLayer,
	        accessibilityManager: this._accessibilityManager,
	        annotationLayer: (_this$annotationLayer4 = this.annotationLayer) == null ? void 0 : _this$annotationLayer4.annotationLayer,
	        textLayer: this.textLayer,
	        drawLayer: this.drawLayer.getDrawLayer(),
	        onAppend: annotationEditorLayerDiv => {
	          babelHelpers.classPrivateFieldLooseBase(this, _addLayer)[_addLayer](annotationEditorLayerDiv, "annotationEditorLayer");
	        }
	      }));
	      babelHelpers.classPrivateFieldLooseBase(this, _renderAnnotationEditorLayer)[_renderAnnotationEditorLayer]();
	    }, error => {
	      if (!(error instanceof RenderingCancelledException)) {
	        showCanvas == null ? void 0 : showCanvas(true);
	      }
	      return babelHelpers.classPrivateFieldLooseBase(this, _finishRenderTask3)[_finishRenderTask3](renderTask, error);
	    });
	    if (pdfPage.isPureXfa) {
	      if (!this.xfaLayer) {
	        const {
	          annotationStorage,
	          linkService
	        } = babelHelpers.classPrivateFieldLooseBase(this, _layerProperties)[_layerProperties];
	        this.xfaLayer = new XfaLayerBuilder({
	          pdfPage,
	          annotationStorage,
	          linkService
	        });
	      }
	      babelHelpers.classPrivateFieldLooseBase(this, _renderXfaLayer)[_renderXfaLayer]();
	    }
	    div.setAttribute("data-loaded", true);
	    this.eventBus.dispatch("pagerender", {
	      source: this,
	      pageNumber: this.id
	    });
	    return resultPromise;
	  }
	  setPageLabel(label) {
	    var _this$pageLabel;
	    this.pageLabel = typeof label === "string" ? label : null;
	    this.div.setAttribute("data-l10n-args", JSON.stringify({
	      page: (_this$pageLabel = this.pageLabel) != null ? _this$pageLabel : this.id
	    }));
	    if (this.pageLabel !== null) {
	      this.div.setAttribute("data-page-label", this.pageLabel);
	    } else {
	      this.div.removeAttribute("data-page-label");
	    }
	  }
	  get thumbnailCanvas() {
	    const {
	      directDrawing,
	      initialOptionalContent,
	      regularAnnotations
	    } = babelHelpers.classPrivateFieldLooseBase(this, _useThumbnailCanvas)[_useThumbnailCanvas];
	    return directDrawing && initialOptionalContent && regularAnnotations ? this.canvas : null;
	  }
	}
	function _addLayer2(div, name) {
	  const pos = LAYERS_ORDER.get(name);
	  const oldDiv = babelHelpers.classPrivateFieldLooseBase(this, _layers)[_layers][pos];
	  babelHelpers.classPrivateFieldLooseBase(this, _layers)[_layers][pos] = div;
	  if (oldDiv) {
	    oldDiv.replaceWith(div);
	    return;
	  }
	  for (let i = pos - 1; i >= 0; i--) {
	    const layer = babelHelpers.classPrivateFieldLooseBase(this, _layers)[_layers][i];
	    if (layer) {
	      layer.after(div);
	      return;
	    }
	  }
	  this.div.prepend(div);
	}
	function _setDimensions2() {
	  const {
	    viewport
	  } = this;
	  if (this.pdfPage) {
	    if (babelHelpers.classPrivateFieldLooseBase(this, _previousRotation)[_previousRotation] === viewport.rotation) {
	      return;
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _previousRotation)[_previousRotation] = viewport.rotation;
	  }
	  setLayerDimensions(this.div, viewport, true, false);
	}
	function _dispatchLayerRendered2(name, error) {
	  this.eventBus.dispatch(name, {
	    source: this,
	    pageNumber: this.id,
	    error
	  });
	}
	async function _renderAnnotationLayer2() {
	  let error = null;
	  try {
	    await this.annotationLayer.render(this.viewport, {
	      structTreeLayer: this.structTreeLayer
	    }, "display");
	  } catch (ex) {
	    console.error(`#renderAnnotationLayer: "${ex}".`);
	    error = ex;
	  } finally {
	    babelHelpers.classPrivateFieldLooseBase(this, _dispatchLayerRendered)[_dispatchLayerRendered]("annotationlayerrendered", error);
	  }
	}
	async function _renderAnnotationEditorLayer2() {
	  let error = null;
	  try {
	    await this.annotationEditorLayer.render(this.viewport, "display");
	  } catch (ex) {
	    console.error(`#renderAnnotationEditorLayer: "${ex}".`);
	    error = ex;
	  } finally {
	    babelHelpers.classPrivateFieldLooseBase(this, _dispatchLayerRendered)[_dispatchLayerRendered]("annotationeditorlayerrendered", error);
	  }
	}
	async function _renderDrawLayer2() {
	  try {
	    await this.drawLayer.render("display");
	  } catch (ex) {
	    console.error(`#renderDrawLayer: "${ex}".`);
	  }
	}
	async function _renderXfaLayer2() {
	  let error = null;
	  try {
	    const result = await this.xfaLayer.render(this.viewport, "display");
	    if (result != null && result.textDivs && this._textHighlighter) {
	      babelHelpers.classPrivateFieldLooseBase(this, _buildXfaTextContentItems)[_buildXfaTextContentItems](result.textDivs);
	    }
	  } catch (ex) {
	    console.error(`#renderXfaLayer: "${ex}".`);
	    error = ex;
	  } finally {
	    var _this$xfaLayer2;
	    if ((_this$xfaLayer2 = this.xfaLayer) != null && _this$xfaLayer2.div) {
	      this.l10n.pause();
	      babelHelpers.classPrivateFieldLooseBase(this, _addLayer)[_addLayer](this.xfaLayer.div, "xfaLayer");
	      this.l10n.resume();
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _dispatchLayerRendered)[_dispatchLayerRendered]("xfalayerrendered", error);
	  }
	}
	async function _renderTextLayer2() {
	  if (!this.textLayer) {
	    return;
	  }
	  let error = null;
	  try {
	    await this.textLayer.render(this.viewport);
	  } catch (ex) {
	    if (ex instanceof AbortException) {
	      return;
	    }
	    console.error(`#renderTextLayer: "${ex}".`);
	    error = ex;
	  }
	  babelHelpers.classPrivateFieldLooseBase(this, _dispatchLayerRendered)[_dispatchLayerRendered]("textlayerrendered", error);
	  babelHelpers.classPrivateFieldLooseBase(this, _renderStructTreeLayer)[_renderStructTreeLayer]();
	}
	async function _renderStructTreeLayer2() {
	  var _this$structTreeLayer3, _this$structTreeLayer5;
	  if (!this.textLayer) {
	    return;
	  }
	  const treeDom = await ((_this$structTreeLayer3 = this.structTreeLayer) == null ? void 0 : _this$structTreeLayer3.render());
	  if (treeDom) {
	    var _this$structTreeLayer4;
	    this.l10n.pause();
	    (_this$structTreeLayer4 = this.structTreeLayer) == null ? void 0 : _this$structTreeLayer4.addElementsToTextLayer();
	    if (this.canvas && treeDom.parentNode !== this.canvas) {
	      this.canvas.append(treeDom);
	    }
	    this.l10n.resume();
	  }
	  (_this$structTreeLayer5 = this.structTreeLayer) == null ? void 0 : _this$structTreeLayer5.show();
	}
	async function _buildXfaTextContentItems2(textDivs) {
	  const text = await this.pdfPage.getTextContent();
	  const items = [];
	  for (const item of text.items) {
	    items.push(item.str);
	  }
	  this._textHighlighter.setTextMapping(textDivs, items);
	  this._textHighlighter.enable();
	}
	async function _finishRenderTask4(renderTask, error = null) {
	  if (renderTask === this.renderTask) {
	    this.renderTask = null;
	  }
	  if (error instanceof RenderingCancelledException) {
	    babelHelpers.classPrivateFieldLooseBase(this, _renderError)[_renderError] = null;
	    return;
	  }
	  babelHelpers.classPrivateFieldLooseBase(this, _renderError)[_renderError] = error;
	  this.renderingState = RenderingStates.FINISHED;
	  this._resetZoomLayer(true);
	  babelHelpers.classPrivateFieldLooseBase(this, _useThumbnailCanvas)[_useThumbnailCanvas].regularAnnotations = !renderTask.separateAnnots;
	  this.eventBus.dispatch("pagerendered", {
	    source: this,
	    pageNumber: this.id,
	    cssTransform: false,
	    timestamp: performance.now(),
	    error: babelHelpers.classPrivateFieldLooseBase(this, _renderError)[_renderError]
	  });
	  if (error) {
	    throw error;
	  }
	}

	const DEFAULT_CACHE_SIZE = 10;
	const PagesCountLimit = {
	  FORCE_SCROLL_MODE_PAGE: 10000,
	  FORCE_LAZY_PAGE_INIT: 5000,
	  PAUSE_EAGER_PAGE_INIT: 250
	};
	function isValidAnnotationEditorMode(mode) {
	  return Object.values(AnnotationEditorType).includes(mode) && mode !== AnnotationEditorType.DISABLE;
	}
	var _buf = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("buf");
	var _size = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("size");
	var _destroyFirstView = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("destroyFirstView");
	_Symbol$iterator = Symbol.iterator;
	class PDFPageViewBuffer {
	  constructor(size) {
	    Object.defineProperty(this, _destroyFirstView, {
	      value: _destroyFirstView2
	    });
	    Object.defineProperty(this, _buf, {
	      writable: true,
	      value: new Set()
	    });
	    Object.defineProperty(this, _size, {
	      writable: true,
	      value: 0
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _size)[_size] = size;
	  }
	  push(view) {
	    const buf = babelHelpers.classPrivateFieldLooseBase(this, _buf)[_buf];
	    if (buf.has(view)) {
	      buf.delete(view);
	    }
	    buf.add(view);
	    if (buf.size > babelHelpers.classPrivateFieldLooseBase(this, _size)[_size]) {
	      babelHelpers.classPrivateFieldLooseBase(this, _destroyFirstView)[_destroyFirstView]();
	    }
	  }
	  resize(newSize, idsToKeep = null) {
	    babelHelpers.classPrivateFieldLooseBase(this, _size)[_size] = newSize;
	    const buf = babelHelpers.classPrivateFieldLooseBase(this, _buf)[_buf];
	    if (idsToKeep) {
	      const ii = buf.size;
	      let i = 1;
	      for (const view of buf) {
	        if (idsToKeep.has(view.id)) {
	          buf.delete(view);
	          buf.add(view);
	        }
	        if (++i > ii) {
	          break;
	        }
	      }
	    }
	    while (buf.size > babelHelpers.classPrivateFieldLooseBase(this, _size)[_size]) {
	      babelHelpers.classPrivateFieldLooseBase(this, _destroyFirstView)[_destroyFirstView]();
	    }
	  }
	  has(view) {
	    return babelHelpers.classPrivateFieldLooseBase(this, _buf)[_buf].has(view);
	  }
	  [_Symbol$iterator]() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _buf)[_buf].keys();
	  }
	}
	function _destroyFirstView2() {
	  const firstView = babelHelpers.classPrivateFieldLooseBase(this, _buf)[_buf].keys().next().value;
	  firstView == null ? void 0 : firstView.destroy();
	  babelHelpers.classPrivateFieldLooseBase(this, _buf)[_buf].delete(firstView);
	}
	var _buffer = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("buffer");
	var _altTextManager = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("altTextManager");
	var _annotationEditorHighlightColors = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("annotationEditorHighlightColors");
	var _annotationEditorMode = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("annotationEditorMode");
	var _annotationEditorUIManager = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("annotationEditorUIManager");
	var _annotationMode2 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("annotationMode");
	var _containerTopLeft = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("containerTopLeft");
	var _enableHWA3 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("enableHWA");
	var _enableHighlightFloatingButton = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("enableHighlightFloatingButton");
	var _enablePermissions2 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("enablePermissions");
	var _enableUpdatedAddImage = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("enableUpdatedAddImage");
	var _enableNewAltTextWhenAddingImage = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("enableNewAltTextWhenAddingImage");
	var _eventAbortController5 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("eventAbortController");
	var _mlManager3 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("mlManager");
	var _switchAnnotationEditorModeAC = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("switchAnnotationEditorModeAC");
	var _switchAnnotationEditorModeTimeoutId = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("switchAnnotationEditorModeTimeoutId");
	var _getAllTextInProgress = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getAllTextInProgress");
	var _hiddenCopyElement = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("hiddenCopyElement");
	var _interruptCopyCondition = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("interruptCopyCondition");
	var _previousContainerHeight = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("previousContainerHeight");
	var _resizeObserver2 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("resizeObserver");
	var _scrollModePageState = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("scrollModePageState");
	var _scaleTimeoutId = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("scaleTimeoutId");
	var _textLayerMode2 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("textLayerMode");
	var _initializePermissions = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("initializePermissions");
	var _onePageRenderedOrForceFetch = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onePageRenderedOrForceFetch");
	var _copyCallback = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("copyCallback");
	var _ensurePageViewVisible = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("ensurePageViewVisible");
	var _scrollIntoView = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("scrollIntoView");
	var _isSameScale = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isSameScale");
	var _setScaleUpdatePages = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("setScaleUpdatePages");
	var _pageWidthScaleFactor = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("pageWidthScaleFactor");
	var _setScale = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("setScale");
	var _resetCurrentPageView = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("resetCurrentPageView");
	var _switchToEditAnnotationMode = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("switchToEditAnnotationMode");
	var _ensurePdfPageLoaded3 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("ensurePdfPageLoaded");
	var _getScrollAhead3 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getScrollAhead");
	var _updateContainerHeightCss = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("updateContainerHeightCss");
	var _resizeObserverCallback3 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("resizeObserverCallback");
	var _cleanupSwitchAnnotationEditorMode = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("cleanupSwitchAnnotationEditorMode");
	class PDFViewer {
	  constructor(_options) {
	    var _this$container, _this$viewer, _options$textLayerMod2, _options$annotationMo2, _options$annotationEd;
	    Object.defineProperty(this, _cleanupSwitchAnnotationEditorMode, {
	      value: _cleanupSwitchAnnotationEditorMode2
	    });
	    Object.defineProperty(this, _resizeObserverCallback3, {
	      value: _resizeObserverCallback4
	    });
	    Object.defineProperty(this, _updateContainerHeightCss, {
	      value: _updateContainerHeightCss2
	    });
	    Object.defineProperty(this, _getScrollAhead3, {
	      value: _getScrollAhead4
	    });
	    Object.defineProperty(this, _ensurePdfPageLoaded3, {
	      value: _ensurePdfPageLoaded4
	    });
	    Object.defineProperty(this, _switchToEditAnnotationMode, {
	      value: _switchToEditAnnotationMode2
	    });
	    Object.defineProperty(this, _resetCurrentPageView, {
	      value: _resetCurrentPageView2
	    });
	    Object.defineProperty(this, _setScale, {
	      value: _setScale2
	    });
	    Object.defineProperty(this, _pageWidthScaleFactor, {
	      get: _get_pageWidthScaleFactor,
	      set: void 0
	    });
	    Object.defineProperty(this, _setScaleUpdatePages, {
	      value: _setScaleUpdatePages2
	    });
	    Object.defineProperty(this, _isSameScale, {
	      value: _isSameScale2
	    });
	    Object.defineProperty(this, _scrollIntoView, {
	      value: _scrollIntoView2
	    });
	    Object.defineProperty(this, _ensurePageViewVisible, {
	      value: _ensurePageViewVisible2
	    });
	    Object.defineProperty(this, _copyCallback, {
	      value: _copyCallback2
	    });
	    Object.defineProperty(this, _onePageRenderedOrForceFetch, {
	      value: _onePageRenderedOrForceFetch2
	    });
	    Object.defineProperty(this, _initializePermissions, {
	      value: _initializePermissions2
	    });
	    Object.defineProperty(this, _buffer, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _altTextManager, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _annotationEditorHighlightColors, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _annotationEditorMode, {
	      writable: true,
	      value: AnnotationEditorType.NONE
	    });
	    Object.defineProperty(this, _annotationEditorUIManager, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _annotationMode2, {
	      writable: true,
	      value: AnnotationMode.ENABLE_FORMS
	    });
	    Object.defineProperty(this, _containerTopLeft, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _enableHWA3, {
	      writable: true,
	      value: false
	    });
	    Object.defineProperty(this, _enableHighlightFloatingButton, {
	      writable: true,
	      value: false
	    });
	    Object.defineProperty(this, _enablePermissions2, {
	      writable: true,
	      value: false
	    });
	    Object.defineProperty(this, _enableUpdatedAddImage, {
	      writable: true,
	      value: false
	    });
	    Object.defineProperty(this, _enableNewAltTextWhenAddingImage, {
	      writable: true,
	      value: false
	    });
	    Object.defineProperty(this, _eventAbortController5, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _mlManager3, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _switchAnnotationEditorModeAC, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _switchAnnotationEditorModeTimeoutId, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _getAllTextInProgress, {
	      writable: true,
	      value: false
	    });
	    Object.defineProperty(this, _hiddenCopyElement, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _interruptCopyCondition, {
	      writable: true,
	      value: false
	    });
	    Object.defineProperty(this, _previousContainerHeight, {
	      writable: true,
	      value: 0
	    });
	    Object.defineProperty(this, _resizeObserver2, {
	      writable: true,
	      value: new ResizeObserver(babelHelpers.classPrivateFieldLooseBase(this, _resizeObserverCallback3)[_resizeObserverCallback3].bind(this))
	    });
	    Object.defineProperty(this, _scrollModePageState, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _scaleTimeoutId, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _textLayerMode2, {
	      writable: true,
	      value: TextLayerMode.ENABLE
	    });
	    const viewerVersion = "4.10.38";
	    if (version !== viewerVersion) {
	      throw new Error(`The API version "${version}" does not match the Viewer version "${viewerVersion}".`);
	    }
	    this.container = _options.container;
	    this.viewer = _options.viewer || _options.container.firstElementChild;
	    if (((_this$container = this.container) == null ? void 0 : _this$container.tagName) !== "DIV" || ((_this$viewer = this.viewer) == null ? void 0 : _this$viewer.tagName) !== "DIV") {
	      throw new Error("Invalid `container` and/or `viewer` option.");
	    }
	    if (this.container.offsetParent && getComputedStyle(this.container).position !== "absolute") {
	      throw new Error("The `container` must be absolutely positioned.");
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _resizeObserver2)[_resizeObserver2].observe(this.container);
	    this.eventBus = _options.eventBus;
	    this.linkService = _options.linkService || new SimpleLinkService();
	    this.downloadManager = _options.downloadManager || null;
	    this.findController = _options.findController || null;
	    babelHelpers.classPrivateFieldLooseBase(this, _altTextManager)[_altTextManager] = _options.altTextManager || null;
	    if (this.findController) {
	      this.findController.onIsPageVisible = pageNumber => this._getVisiblePages().ids.has(pageNumber);
	    }
	    this._scriptingManager = _options.scriptingManager || null;
	    babelHelpers.classPrivateFieldLooseBase(this, _textLayerMode2)[_textLayerMode2] = (_options$textLayerMod2 = _options.textLayerMode) != null ? _options$textLayerMod2 : TextLayerMode.ENABLE;
	    babelHelpers.classPrivateFieldLooseBase(this, _annotationMode2)[_annotationMode2] = (_options$annotationMo2 = _options.annotationMode) != null ? _options$annotationMo2 : AnnotationMode.ENABLE_FORMS;
	    babelHelpers.classPrivateFieldLooseBase(this, _annotationEditorMode)[_annotationEditorMode] = (_options$annotationEd = _options.annotationEditorMode) != null ? _options$annotationEd : AnnotationEditorType.NONE;
	    babelHelpers.classPrivateFieldLooseBase(this, _annotationEditorHighlightColors)[_annotationEditorHighlightColors] = _options.annotationEditorHighlightColors || null;
	    babelHelpers.classPrivateFieldLooseBase(this, _enableHighlightFloatingButton)[_enableHighlightFloatingButton] = _options.enableHighlightFloatingButton === true;
	    babelHelpers.classPrivateFieldLooseBase(this, _enableUpdatedAddImage)[_enableUpdatedAddImage] = _options.enableUpdatedAddImage === true;
	    babelHelpers.classPrivateFieldLooseBase(this, _enableNewAltTextWhenAddingImage)[_enableNewAltTextWhenAddingImage] = _options.enableNewAltTextWhenAddingImage === true;
	    this.imageResourcesPath = _options.imageResourcesPath || "";
	    this.enablePrintAutoRotate = _options.enablePrintAutoRotate || false;
	    this.removePageBorders = _options.removePageBorders || false;
	    this.maxCanvasPixels = _options.maxCanvasPixels;
	    this.l10n = _options.l10n;
	    this.l10n || (this.l10n = new genericl10n_GenericL10n());
	    babelHelpers.classPrivateFieldLooseBase(this, _enablePermissions2)[_enablePermissions2] = _options.enablePermissions || false;
	    this.pageColors = _options.pageColors || null;
	    babelHelpers.classPrivateFieldLooseBase(this, _mlManager3)[_mlManager3] = _options.mlManager || null;
	    babelHelpers.classPrivateFieldLooseBase(this, _enableHWA3)[_enableHWA3] = _options.enableHWA || false;
	    this.defaultRenderingQueue = !_options.renderingQueue;
	    if (this.defaultRenderingQueue) {
	      this.renderingQueue = new PDFRenderingQueue();
	      this.renderingQueue.setViewer(this);
	    } else {
	      this.renderingQueue = _options.renderingQueue;
	    }
	    const {
	      abortSignal
	    } = _options;
	    abortSignal == null ? void 0 : abortSignal.addEventListener("abort", () => {
	      babelHelpers.classPrivateFieldLooseBase(this, _resizeObserver2)[_resizeObserver2].disconnect();
	      babelHelpers.classPrivateFieldLooseBase(this, _resizeObserver2)[_resizeObserver2] = null;
	    }, {
	      once: true
	    });
	    this.scroll = watchScroll(this.container, this._scrollUpdate.bind(this), abortSignal);
	    this.presentationModeState = PresentationModeState.UNKNOWN;
	    this._resetView();
	    if (this.removePageBorders) {
	      this.viewer.classList.add("removePageBorders");
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _updateContainerHeightCss)[_updateContainerHeightCss]();
	    this.eventBus._on("thumbnailrendered", ({
	      pageNumber,
	      pdfPage
	    }) => {
	      const pageView = this._pages[pageNumber - 1];
	      if (!babelHelpers.classPrivateFieldLooseBase(this, _buffer)[_buffer].has(pageView)) {
	        pdfPage == null ? void 0 : pdfPage.cleanup();
	      }
	    });
	    if (!_options.l10n) {
	      this.l10n.translate(this.container);
	    }
	  }
	  get pagesCount() {
	    return this._pages.length;
	  }
	  getPageView(index) {
	    return this._pages[index];
	  }
	  getCachedPageViews() {
	    return new Set(babelHelpers.classPrivateFieldLooseBase(this, _buffer)[_buffer]);
	  }
	  get pageViewsReady() {
	    return this._pages.every(pageView => pageView == null ? void 0 : pageView.pdfPage);
	  }
	  get renderForms() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _annotationMode2)[_annotationMode2] === AnnotationMode.ENABLE_FORMS;
	  }
	  get enableScripting() {
	    return !!this._scriptingManager;
	  }
	  get currentPageNumber() {
	    return this._currentPageNumber;
	  }
	  set currentPageNumber(val) {
	    if (!Number.isInteger(val)) {
	      throw new Error("Invalid page number.");
	    }
	    if (!this.pdfDocument) {
	      return;
	    }
	    if (!this._setCurrentPageNumber(val, true)) {
	      console.error(`currentPageNumber: "${val}" is not a valid page.`);
	    }
	  }
	  _setCurrentPageNumber(val, resetCurrentPageView = false) {
	    var _this$_pageLabels2, _this$_pageLabels3;
	    if (this._currentPageNumber === val) {
	      if (resetCurrentPageView) {
	        babelHelpers.classPrivateFieldLooseBase(this, _resetCurrentPageView)[_resetCurrentPageView]();
	      }
	      return true;
	    }
	    if (!(0 < val && val <= this.pagesCount)) {
	      return false;
	    }
	    const previous = this._currentPageNumber;
	    this._currentPageNumber = val;
	    this.eventBus.dispatch("pagechanging", {
	      source: this,
	      pageNumber: val,
	      pageLabel: (_this$_pageLabels2 = (_this$_pageLabels3 = this._pageLabels) == null ? void 0 : _this$_pageLabels3[val - 1]) != null ? _this$_pageLabels2 : null,
	      previous
	    });
	    if (resetCurrentPageView) {
	      babelHelpers.classPrivateFieldLooseBase(this, _resetCurrentPageView)[_resetCurrentPageView]();
	    }
	    return true;
	  }
	  get currentPageLabel() {
	    var _this$_pageLabels4, _this$_pageLabels5;
	    return (_this$_pageLabels4 = (_this$_pageLabels5 = this._pageLabels) == null ? void 0 : _this$_pageLabels5[this._currentPageNumber - 1]) != null ? _this$_pageLabels4 : null;
	  }
	  set currentPageLabel(val) {
	    if (!this.pdfDocument) {
	      return;
	    }
	    let page = val | 0;
	    if (this._pageLabels) {
	      const i = this._pageLabels.indexOf(val);
	      if (i >= 0) {
	        page = i + 1;
	      }
	    }
	    if (!this._setCurrentPageNumber(page, true)) {
	      console.error(`currentPageLabel: "${val}" is not a valid page.`);
	    }
	  }
	  get currentScale() {
	    return this._currentScale !== UNKNOWN_SCALE ? this._currentScale : DEFAULT_SCALE;
	  }
	  set currentScale(val) {
	    if (isNaN(val)) {
	      throw new Error("Invalid numeric scale.");
	    }
	    if (!this.pdfDocument) {
	      return;
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _setScale)[_setScale](val, {
	      noScroll: false
	    });
	  }
	  get currentScaleValue() {
	    return this._currentScaleValue;
	  }
	  set currentScaleValue(val) {
	    if (!this.pdfDocument) {
	      return;
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _setScale)[_setScale](val, {
	      noScroll: false
	    });
	  }
	  get pagesRotation() {
	    return this._pagesRotation;
	  }
	  set pagesRotation(rotation) {
	    if (!isValidRotation(rotation)) {
	      throw new Error("Invalid pages rotation angle.");
	    }
	    if (!this.pdfDocument) {
	      return;
	    }
	    rotation %= 360;
	    if (rotation < 0) {
	      rotation += 360;
	    }
	    if (this._pagesRotation === rotation) {
	      return;
	    }
	    this._pagesRotation = rotation;
	    const pageNumber = this._currentPageNumber;
	    this.refresh(true, {
	      rotation
	    });
	    if (this._currentScaleValue) {
	      babelHelpers.classPrivateFieldLooseBase(this, _setScale)[_setScale](this._currentScaleValue, {
	        noScroll: true
	      });
	    }
	    this.eventBus.dispatch("rotationchanging", {
	      source: this,
	      pagesRotation: rotation,
	      pageNumber
	    });
	    if (this.defaultRenderingQueue) {
	      this.update();
	    }
	  }
	  get firstPagePromise() {
	    return this.pdfDocument ? this._firstPageCapability.promise : null;
	  }
	  get onePageRendered() {
	    return this.pdfDocument ? this._onePageRenderedCapability.promise : null;
	  }
	  get pagesPromise() {
	    return this.pdfDocument ? this._pagesCapability.promise : null;
	  }
	  get _layerProperties() {
	    const self = this;
	    return shadow(this, "_layerProperties", {
	      get annotationEditorUIManager() {
	        return babelHelpers.classPrivateFieldLooseBase(self, _annotationEditorUIManager)[_annotationEditorUIManager];
	      },
	      get annotationStorage() {
	        var _self$pdfDocument;
	        return (_self$pdfDocument = self.pdfDocument) == null ? void 0 : _self$pdfDocument.annotationStorage;
	      },
	      get downloadManager() {
	        return self.downloadManager;
	      },
	      get enableScripting() {
	        return !!self._scriptingManager;
	      },
	      get fieldObjectsPromise() {
	        var _self$pdfDocument2;
	        return (_self$pdfDocument2 = self.pdfDocument) == null ? void 0 : _self$pdfDocument2.getFieldObjects();
	      },
	      get findController() {
	        return self.findController;
	      },
	      get hasJSActionsPromise() {
	        var _self$pdfDocument3;
	        return (_self$pdfDocument3 = self.pdfDocument) == null ? void 0 : _self$pdfDocument3.hasJSActions();
	      },
	      get linkService() {
	        return self.linkService;
	      }
	    });
	  }
	  async getAllText() {
	    const texts = [];
	    const buffer = [];
	    for (let pageNum = 1, pagesCount = this.pdfDocument.numPages; pageNum <= pagesCount; ++pageNum) {
	      if (babelHelpers.classPrivateFieldLooseBase(this, _interruptCopyCondition)[_interruptCopyCondition]) {
	        return null;
	      }
	      buffer.length = 0;
	      const page = await this.pdfDocument.getPage(pageNum);
	      const {
	        items
	      } = await page.getTextContent();
	      for (const item of items) {
	        if (item.str) {
	          buffer.push(item.str);
	        }
	        if (item.hasEOL) {
	          buffer.push("\n");
	        }
	      }
	      texts.push(removeNullCharacters(buffer.join("")));
	    }
	    return texts.join("\n");
	  }
	  setDocument(pdfDocument) {
	    if (this.pdfDocument) {
	      var _this$findController, _this$_scriptingManag, _babelHelpers$classPr28;
	      this.eventBus.dispatch("pagesdestroy", {
	        source: this
	      });
	      this._cancelRendering();
	      this._resetView();
	      (_this$findController = this.findController) == null ? void 0 : _this$findController.setDocument(null);
	      (_this$_scriptingManag = this._scriptingManager) == null ? void 0 : _this$_scriptingManag.setDocument(null);
	      (_babelHelpers$classPr28 = babelHelpers.classPrivateFieldLooseBase(this, _annotationEditorUIManager)[_annotationEditorUIManager]) == null ? void 0 : _babelHelpers$classPr28.destroy();
	      babelHelpers.classPrivateFieldLooseBase(this, _annotationEditorUIManager)[_annotationEditorUIManager] = null;
	    }
	    this.pdfDocument = pdfDocument;
	    if (!pdfDocument) {
	      return;
	    }
	    const pagesCount = pdfDocument.numPages;
	    const firstPagePromise = pdfDocument.getPage(1);
	    const optionalContentConfigPromise = pdfDocument.getOptionalContentConfig({
	      intent: "display"
	    });
	    const permissionsPromise = babelHelpers.classPrivateFieldLooseBase(this, _enablePermissions2)[_enablePermissions2] ? pdfDocument.getPermissions() : Promise.resolve();
	    const {
	      eventBus,
	      pageColors,
	      viewer
	    } = this;
	    babelHelpers.classPrivateFieldLooseBase(this, _eventAbortController5)[_eventAbortController5] = new AbortController();
	    const {
	      signal
	    } = babelHelpers.classPrivateFieldLooseBase(this, _eventAbortController5)[_eventAbortController5];
	    if (pagesCount > PagesCountLimit.FORCE_SCROLL_MODE_PAGE) {
	      console.warn("Forcing PAGE-scrolling for performance reasons, given the length of the document.");
	      const mode = this._scrollMode = ScrollMode.PAGE;
	      eventBus.dispatch("scrollmodechanged", {
	        source: this,
	        mode
	      });
	    }
	    this._pagesCapability.promise.then(() => {
	      eventBus.dispatch("pagesloaded", {
	        source: this,
	        pagesCount
	      });
	    }, () => {});
	    const onBeforeDraw = evt => {
	      const pageView = this._pages[evt.pageNumber - 1];
	      if (!pageView) {
	        return;
	      }
	      babelHelpers.classPrivateFieldLooseBase(this, _buffer)[_buffer].push(pageView);
	    };
	    eventBus._on("pagerender", onBeforeDraw, {
	      signal
	    });
	    const onAfterDraw = evt => {
	      if (evt.cssTransform) {
	        return;
	      }
	      this._onePageRenderedCapability.resolve({
	        timestamp: evt.timestamp
	      });
	      eventBus._off("pagerendered", onAfterDraw);
	    };
	    eventBus._on("pagerendered", onAfterDraw, {
	      signal
	    });
	    Promise.all([firstPagePromise, permissionsPromise]).then(([firstPdfPage, permissions]) => {
	      var _this$_pages$;
	      if (pdfDocument !== this.pdfDocument) {
	        return;
	      }
	      this._firstPageCapability.resolve(firstPdfPage);
	      this._optionalContentConfigPromise = optionalContentConfigPromise;
	      const {
	        annotationEditorMode,
	        annotationMode,
	        textLayerMode
	      } = babelHelpers.classPrivateFieldLooseBase(this, _initializePermissions)[_initializePermissions](permissions);
	      if (textLayerMode !== TextLayerMode.DISABLE) {
	        const element = babelHelpers.classPrivateFieldLooseBase(this, _hiddenCopyElement)[_hiddenCopyElement] = document.createElement("div");
	        element.id = "hiddenCopyElement";
	        viewer.before(element);
	      }
	      if (typeof AbortSignal.any === "function" && annotationEditorMode !== AnnotationEditorType.DISABLE) {
	        const mode = annotationEditorMode;
	        if (pdfDocument.isPureXfa) {
	          console.warn("Warning: XFA-editing is not implemented.");
	        } else if (isValidAnnotationEditorMode(mode)) {
	          babelHelpers.classPrivateFieldLooseBase(this, _annotationEditorUIManager)[_annotationEditorUIManager] = new AnnotationEditorUIManager(this.container, viewer, babelHelpers.classPrivateFieldLooseBase(this, _altTextManager)[_altTextManager], eventBus, pdfDocument, pageColors, babelHelpers.classPrivateFieldLooseBase(this, _annotationEditorHighlightColors)[_annotationEditorHighlightColors], babelHelpers.classPrivateFieldLooseBase(this, _enableHighlightFloatingButton)[_enableHighlightFloatingButton], babelHelpers.classPrivateFieldLooseBase(this, _enableUpdatedAddImage)[_enableUpdatedAddImage], babelHelpers.classPrivateFieldLooseBase(this, _enableNewAltTextWhenAddingImage)[_enableNewAltTextWhenAddingImage], babelHelpers.classPrivateFieldLooseBase(this, _mlManager3)[_mlManager3]);
	          eventBus.dispatch("annotationeditoruimanager", {
	            source: this,
	            uiManager: babelHelpers.classPrivateFieldLooseBase(this, _annotationEditorUIManager)[_annotationEditorUIManager]
	          });
	          if (mode !== AnnotationEditorType.NONE) {
	            if (mode === AnnotationEditorType.STAMP) {
	              var _babelHelpers$classPr29;
	              (_babelHelpers$classPr29 = babelHelpers.classPrivateFieldLooseBase(this, _mlManager3)[_mlManager3]) == null ? void 0 : _babelHelpers$classPr29.loadModel("altText");
	            }
	            babelHelpers.classPrivateFieldLooseBase(this, _annotationEditorUIManager)[_annotationEditorUIManager].updateMode(mode);
	          }
	        } else {
	          console.error(`Invalid AnnotationEditor mode: ${mode}`);
	        }
	      }
	      const viewerElement = this._scrollMode === ScrollMode.PAGE ? null : viewer;
	      const scale = this.currentScale;
	      const viewport = firstPdfPage.getViewport({
	        scale: scale * PixelsPerInch.PDF_TO_CSS_UNITS
	      });
	      viewer.style.setProperty("--scale-factor", viewport.scale);
	      if (pageColors != null && pageColors.background) {
	        viewer.style.setProperty("--page-bg-color", pageColors.background);
	      }
	      if ((pageColors == null ? void 0 : pageColors.foreground) === "CanvasText" || (pageColors == null ? void 0 : pageColors.background) === "Canvas") {
	        viewer.style.setProperty("--hcm-highlight-filter", pdfDocument.filterFactory.addHighlightHCMFilter("highlight", "CanvasText", "Canvas", "HighlightText", "Highlight"));
	        viewer.style.setProperty("--hcm-highlight-selected-filter", pdfDocument.filterFactory.addHighlightHCMFilter("highlight_selected", "CanvasText", "Canvas", "HighlightText", "ButtonText"));
	      }
	      for (let pageNum = 1; pageNum <= pagesCount; ++pageNum) {
	        const pageView = new PDFPageView({
	          container: viewerElement,
	          eventBus,
	          id: pageNum,
	          scale,
	          defaultViewport: viewport.clone(),
	          optionalContentConfigPromise,
	          renderingQueue: this.renderingQueue,
	          textLayerMode,
	          annotationMode,
	          imageResourcesPath: this.imageResourcesPath,
	          maxCanvasPixels: this.maxCanvasPixels,
	          pageColors,
	          l10n: this.l10n,
	          layerProperties: this._layerProperties,
	          enableHWA: babelHelpers.classPrivateFieldLooseBase(this, _enableHWA3)[_enableHWA3]
	        });
	        this._pages.push(pageView);
	      }
	      (_this$_pages$ = this._pages[0]) == null ? void 0 : _this$_pages$.setPdfPage(firstPdfPage);
	      if (this._scrollMode === ScrollMode.PAGE) {
	        babelHelpers.classPrivateFieldLooseBase(this, _ensurePageViewVisible)[_ensurePageViewVisible]();
	      } else if (this._spreadMode !== SpreadMode.NONE) {
	        this._updateSpreadMode();
	      }
	      babelHelpers.classPrivateFieldLooseBase(this, _onePageRenderedOrForceFetch)[_onePageRenderedOrForceFetch](signal).then(async () => {
	        var _this$findController2, _this$_scriptingManag2;
	        if (pdfDocument !== this.pdfDocument) {
	          return;
	        }
	        (_this$findController2 = this.findController) == null ? void 0 : _this$findController2.setDocument(pdfDocument);
	        (_this$_scriptingManag2 = this._scriptingManager) == null ? void 0 : _this$_scriptingManag2.setDocument(pdfDocument);
	        if (babelHelpers.classPrivateFieldLooseBase(this, _hiddenCopyElement)[_hiddenCopyElement]) {
	          document.addEventListener("copy", babelHelpers.classPrivateFieldLooseBase(this, _copyCallback)[_copyCallback].bind(this, textLayerMode), {
	            signal
	          });
	        }
	        if (babelHelpers.classPrivateFieldLooseBase(this, _annotationEditorUIManager)[_annotationEditorUIManager]) {
	          eventBus.dispatch("annotationeditormodechanged", {
	            source: this,
	            mode: babelHelpers.classPrivateFieldLooseBase(this, _annotationEditorMode)[_annotationEditorMode]
	          });
	        }
	        if (pdfDocument.loadingParams.disableAutoFetch || pagesCount > PagesCountLimit.FORCE_LAZY_PAGE_INIT) {
	          this._pagesCapability.resolve();
	          return;
	        }
	        let getPagesLeft = pagesCount - 1;
	        if (getPagesLeft <= 0) {
	          this._pagesCapability.resolve();
	          return;
	        }
	        for (let pageNum = 2; pageNum <= pagesCount; ++pageNum) {
	          const promise = pdfDocument.getPage(pageNum).then(pdfPage => {
	            const pageView = this._pages[pageNum - 1];
	            if (!pageView.pdfPage) {
	              pageView.setPdfPage(pdfPage);
	            }
	            if (--getPagesLeft === 0) {
	              this._pagesCapability.resolve();
	            }
	          }, reason => {
	            console.error(`Unable to get page ${pageNum} to initialize viewer`, reason);
	            if (--getPagesLeft === 0) {
	              this._pagesCapability.resolve();
	            }
	          });
	          if (pageNum % PagesCountLimit.PAUSE_EAGER_PAGE_INIT === 0) {
	            await promise;
	          }
	        }
	      });
	      eventBus.dispatch("pagesinit", {
	        source: this
	      });
	      pdfDocument.getMetadata().then(({
	        info
	      }) => {
	        if (pdfDocument !== this.pdfDocument) {
	          return;
	        }
	        if (info.Language) {
	          viewer.lang = info.Language;
	        }
	      });
	      if (this.defaultRenderingQueue) {
	        this.update();
	      }
	    }).catch(reason => {
	      console.error("Unable to initialize viewer", reason);
	      this._pagesCapability.reject(reason);
	    });
	  }
	  setPageLabels(labels) {
	    if (!this.pdfDocument) {
	      return;
	    }
	    if (!labels) {
	      this._pageLabels = null;
	    } else if (!(Array.isArray(labels) && this.pdfDocument.numPages === labels.length)) {
	      this._pageLabels = null;
	      console.error(`setPageLabels: Invalid page labels.`);
	    } else {
	      this._pageLabels = labels;
	    }
	    for (let i = 0, ii = this._pages.length; i < ii; i++) {
	      var _this$_pageLabels$i2, _this$_pageLabels6;
	      this._pages[i].setPageLabel((_this$_pageLabels$i2 = (_this$_pageLabels6 = this._pageLabels) == null ? void 0 : _this$_pageLabels6[i]) != null ? _this$_pageLabels$i2 : null);
	    }
	  }
	  _resetView() {
	    var _babelHelpers$classPr30, _babelHelpers$classPr31;
	    this._pages = [];
	    this._currentPageNumber = 1;
	    this._currentScale = UNKNOWN_SCALE;
	    this._currentScaleValue = null;
	    this._pageLabels = null;
	    babelHelpers.classPrivateFieldLooseBase(this, _buffer)[_buffer] = new PDFPageViewBuffer(DEFAULT_CACHE_SIZE);
	    this._location = null;
	    this._pagesRotation = 0;
	    this._optionalContentConfigPromise = null;
	    this._firstPageCapability = Promise.withResolvers();
	    this._onePageRenderedCapability = Promise.withResolvers();
	    this._pagesCapability = Promise.withResolvers();
	    this._scrollMode = ScrollMode.VERTICAL;
	    this._previousScrollMode = ScrollMode.UNKNOWN;
	    this._spreadMode = SpreadMode.NONE;
	    babelHelpers.classPrivateFieldLooseBase(this, _scrollModePageState)[_scrollModePageState] = {
	      previousPageNumber: 1,
	      scrollDown: true,
	      pages: []
	    };
	    (_babelHelpers$classPr30 = babelHelpers.classPrivateFieldLooseBase(this, _eventAbortController5)[_eventAbortController5]) == null ? void 0 : _babelHelpers$classPr30.abort();
	    babelHelpers.classPrivateFieldLooseBase(this, _eventAbortController5)[_eventAbortController5] = null;
	    this.viewer.textContent = "";
	    this._updateScrollMode();
	    this.viewer.removeAttribute("lang");
	    (_babelHelpers$classPr31 = babelHelpers.classPrivateFieldLooseBase(this, _hiddenCopyElement)[_hiddenCopyElement]) == null ? void 0 : _babelHelpers$classPr31.remove();
	    babelHelpers.classPrivateFieldLooseBase(this, _hiddenCopyElement)[_hiddenCopyElement] = null;
	    babelHelpers.classPrivateFieldLooseBase(this, _cleanupSwitchAnnotationEditorMode)[_cleanupSwitchAnnotationEditorMode]();
	  }
	  _scrollUpdate() {
	    if (this.pagesCount === 0) {
	      return;
	    }
	    this.update();
	  }
	  pageLabelToPageNumber(label) {
	    if (!this._pageLabels) {
	      return null;
	    }
	    const i = this._pageLabels.indexOf(label);
	    if (i < 0) {
	      return null;
	    }
	    return i + 1;
	  }
	  scrollPageIntoView({
	    pageNumber,
	    destArray = null,
	    allowNegativeOffset = false,
	    ignoreDestinationZoom = false
	  }) {
	    if (!this.pdfDocument) {
	      return;
	    }
	    const pageView = Number.isInteger(pageNumber) && this._pages[pageNumber - 1];
	    if (!pageView) {
	      console.error(`scrollPageIntoView: "${pageNumber}" is not a valid pageNumber parameter.`);
	      return;
	    }
	    if (this.isInPresentationMode || !destArray) {
	      this._setCurrentPageNumber(pageNumber, true);
	      return;
	    }
	    let x = 0,
	      y = 0;
	    let width = 0,
	      height = 0,
	      widthScale,
	      heightScale;
	    const changeOrientation = pageView.rotation % 180 !== 0;
	    const pageWidth = (changeOrientation ? pageView.height : pageView.width) / pageView.scale / PixelsPerInch.PDF_TO_CSS_UNITS;
	    const pageHeight = (changeOrientation ? pageView.width : pageView.height) / pageView.scale / PixelsPerInch.PDF_TO_CSS_UNITS;
	    let scale = 0;
	    switch (destArray[1].name) {
	      case "XYZ":
	        x = destArray[2];
	        y = destArray[3];
	        scale = destArray[4];
	        x = x !== null ? x : 0;
	        y = y !== null ? y : pageHeight;
	        break;
	      case "Fit":
	      case "FitB":
	        scale = "page-fit";
	        break;
	      case "FitH":
	      case "FitBH":
	        y = destArray[2];
	        scale = "page-width";
	        if (y === null && this._location) {
	          x = this._location.left;
	          y = this._location.top;
	        } else if (typeof y !== "number" || y < 0) {
	          y = pageHeight;
	        }
	        break;
	      case "FitV":
	      case "FitBV":
	        x = destArray[2];
	        width = pageWidth;
	        height = pageHeight;
	        scale = "page-height";
	        break;
	      case "FitR":
	        x = destArray[2];
	        y = destArray[3];
	        width = destArray[4] - x;
	        height = destArray[5] - y;
	        let hPadding = SCROLLBAR_PADDING,
	          vPadding = VERTICAL_PADDING;
	        if (this.removePageBorders) {
	          hPadding = vPadding = 0;
	        }
	        widthScale = (this.container.clientWidth - hPadding) / width / PixelsPerInch.PDF_TO_CSS_UNITS;
	        heightScale = (this.container.clientHeight - vPadding) / height / PixelsPerInch.PDF_TO_CSS_UNITS;
	        scale = Math.min(Math.abs(widthScale), Math.abs(heightScale));
	        break;
	      default:
	        console.error(`scrollPageIntoView: "${destArray[1].name}" is not a valid destination type.`);
	        return;
	    }
	    if (!ignoreDestinationZoom) {
	      if (scale && scale !== this._currentScale) {
	        this.currentScaleValue = scale;
	      } else if (this._currentScale === UNKNOWN_SCALE) {
	        this.currentScaleValue = DEFAULT_SCALE_VALUE;
	      }
	    }
	    if (scale === "page-fit" && !destArray[4]) {
	      babelHelpers.classPrivateFieldLooseBase(this, _scrollIntoView)[_scrollIntoView](pageView);
	      return;
	    }
	    const boundingRect = [pageView.viewport.convertToViewportPoint(x, y), pageView.viewport.convertToViewportPoint(x + width, y + height)];
	    let left = Math.min(boundingRect[0][0], boundingRect[1][0]);
	    let top = Math.min(boundingRect[0][1], boundingRect[1][1]);
	    if (!allowNegativeOffset) {
	      left = Math.max(left, 0);
	      top = Math.max(top, 0);
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _scrollIntoView)[_scrollIntoView](pageView, {
	      left,
	      top
	    });
	  }
	  _updateLocation(firstPage) {
	    const currentScale = this._currentScale;
	    const currentScaleValue = this._currentScaleValue;
	    const normalizedScaleValue = parseFloat(currentScaleValue) === currentScale ? Math.round(currentScale * 10000) / 100 : currentScaleValue;
	    const pageNumber = firstPage.id;
	    const currentPageView = this._pages[pageNumber - 1];
	    const container = this.container;
	    const topLeft = currentPageView.getPagePoint(container.scrollLeft - firstPage.x, container.scrollTop - firstPage.y);
	    const intLeft = Math.round(topLeft[0]);
	    const intTop = Math.round(topLeft[1]);
	    let pdfOpenParams = `#page=${pageNumber}`;
	    if (!this.isInPresentationMode) {
	      pdfOpenParams += `&zoom=${normalizedScaleValue},${intLeft},${intTop}`;
	    }
	    this._location = {
	      pageNumber,
	      scale: normalizedScaleValue,
	      top: intTop,
	      left: intLeft,
	      rotation: this._pagesRotation,
	      pdfOpenParams
	    };
	  }
	  update() {
	    const visible = this._getVisiblePages();
	    const visiblePages = visible.views,
	      numVisiblePages = visiblePages.length;
	    if (numVisiblePages === 0) {
	      return;
	    }
	    const newCacheSize = Math.max(DEFAULT_CACHE_SIZE, 2 * numVisiblePages + 1);
	    babelHelpers.classPrivateFieldLooseBase(this, _buffer)[_buffer].resize(newCacheSize, visible.ids);
	    this.renderingQueue.renderHighestPriority(visible);
	    const isSimpleLayout = this._spreadMode === SpreadMode.NONE && (this._scrollMode === ScrollMode.PAGE || this._scrollMode === ScrollMode.VERTICAL);
	    const currentId = this._currentPageNumber;
	    let stillFullyVisible = false;
	    for (const page of visiblePages) {
	      if (page.percent < 100) {
	        break;
	      }
	      if (page.id === currentId && isSimpleLayout) {
	        stillFullyVisible = true;
	        break;
	      }
	    }
	    this._setCurrentPageNumber(stillFullyVisible ? currentId : visiblePages[0].id);
	    this._updateLocation(visible.first);
	    this.eventBus.dispatch("updateviewarea", {
	      source: this,
	      location: this._location
	    });
	  }
	  containsElement(element) {
	    return this.container.contains(element);
	  }
	  focus() {
	    this.container.focus();
	  }
	  get _isContainerRtl() {
	    return getComputedStyle(this.container).direction === "rtl";
	  }
	  get isInPresentationMode() {
	    return this.presentationModeState === PresentationModeState.FULLSCREEN;
	  }
	  get isChangingPresentationMode() {
	    return this.presentationModeState === PresentationModeState.CHANGING;
	  }
	  get isHorizontalScrollbarEnabled() {
	    return this.isInPresentationMode ? false : this.container.scrollWidth > this.container.clientWidth;
	  }
	  get isVerticalScrollbarEnabled() {
	    return this.isInPresentationMode ? false : this.container.scrollHeight > this.container.clientHeight;
	  }
	  _getVisiblePages() {
	    const views = this._scrollMode === ScrollMode.PAGE ? babelHelpers.classPrivateFieldLooseBase(this, _scrollModePageState)[_scrollModePageState].pages : this._pages,
	      horizontal = this._scrollMode === ScrollMode.HORIZONTAL,
	      rtl = horizontal && this._isContainerRtl;
	    return getVisibleElements({
	      scrollEl: this.container,
	      views,
	      sortByVisibility: true,
	      horizontal,
	      rtl
	    });
	  }
	  cleanup() {
	    for (const pageView of this._pages) {
	      if (pageView.renderingState !== RenderingStates.FINISHED) {
	        pageView.reset();
	      }
	    }
	  }
	  _cancelRendering() {
	    for (const pageView of this._pages) {
	      pageView.cancelRendering();
	    }
	  }
	  forceRendering(currentlyVisiblePages) {
	    const visiblePages = currentlyVisiblePages || this._getVisiblePages();
	    const scrollAhead = babelHelpers.classPrivateFieldLooseBase(this, _getScrollAhead3)[_getScrollAhead3](visiblePages);
	    const preRenderExtra = this._spreadMode !== SpreadMode.NONE && this._scrollMode !== ScrollMode.HORIZONTAL;
	    const pageView = this.renderingQueue.getHighestPriority(visiblePages, this._pages, scrollAhead, preRenderExtra);
	    if (pageView) {
	      babelHelpers.classPrivateFieldLooseBase(this, _ensurePdfPageLoaded3)[_ensurePdfPageLoaded3](pageView).then(() => {
	        this.renderingQueue.renderView(pageView);
	      });
	      return true;
	    }
	    return false;
	  }
	  get hasEqualPageSizes() {
	    const firstPageView = this._pages[0];
	    for (let i = 1, ii = this._pages.length; i < ii; ++i) {
	      const pageView = this._pages[i];
	      if (pageView.width !== firstPageView.width || pageView.height !== firstPageView.height) {
	        return false;
	      }
	    }
	    return true;
	  }
	  getPagesOverview() {
	    let initialOrientation;
	    return this._pages.map(pageView => {
	      const viewport = pageView.pdfPage.getViewport({
	        scale: 1
	      });
	      const orientation = isPortraitOrientation(viewport);
	      if (initialOrientation === undefined) {
	        initialOrientation = orientation;
	      } else if (this.enablePrintAutoRotate && orientation !== initialOrientation) {
	        return {
	          width: viewport.height,
	          height: viewport.width,
	          rotation: (viewport.rotation - 90) % 360
	        };
	      }
	      return {
	        width: viewport.width,
	        height: viewport.height,
	        rotation: viewport.rotation
	      };
	    });
	  }
	  get optionalContentConfigPromise() {
	    if (!this.pdfDocument) {
	      return Promise.resolve(null);
	    }
	    if (!this._optionalContentConfigPromise) {
	      console.error("optionalContentConfigPromise: Not initialized yet.");
	      return this.pdfDocument.getOptionalContentConfig({
	        intent: "display"
	      });
	    }
	    return this._optionalContentConfigPromise;
	  }
	  set optionalContentConfigPromise(promise) {
	    if (!(promise instanceof Promise)) {
	      throw new Error(`Invalid optionalContentConfigPromise: ${promise}`);
	    }
	    if (!this.pdfDocument) {
	      return;
	    }
	    if (!this._optionalContentConfigPromise) {
	      return;
	    }
	    this._optionalContentConfigPromise = promise;
	    this.refresh(false, {
	      optionalContentConfigPromise: promise
	    });
	    this.eventBus.dispatch("optionalcontentconfigchanged", {
	      source: this,
	      promise
	    });
	  }
	  get scrollMode() {
	    return this._scrollMode;
	  }
	  set scrollMode(mode) {
	    if (this._scrollMode === mode) {
	      return;
	    }
	    if (!isValidScrollMode(mode)) {
	      throw new Error(`Invalid scroll mode: ${mode}`);
	    }
	    if (this.pagesCount > PagesCountLimit.FORCE_SCROLL_MODE_PAGE) {
	      return;
	    }
	    this._previousScrollMode = this._scrollMode;
	    this._scrollMode = mode;
	    this.eventBus.dispatch("scrollmodechanged", {
	      source: this,
	      mode
	    });
	    this._updateScrollMode(this._currentPageNumber);
	  }
	  _updateScrollMode(pageNumber = null) {
	    const scrollMode = this._scrollMode,
	      viewer = this.viewer;
	    viewer.classList.toggle("scrollHorizontal", scrollMode === ScrollMode.HORIZONTAL);
	    viewer.classList.toggle("scrollWrapped", scrollMode === ScrollMode.WRAPPED);
	    if (!this.pdfDocument || !pageNumber) {
	      return;
	    }
	    if (scrollMode === ScrollMode.PAGE) {
	      babelHelpers.classPrivateFieldLooseBase(this, _ensurePageViewVisible)[_ensurePageViewVisible]();
	    } else if (this._previousScrollMode === ScrollMode.PAGE) {
	      this._updateSpreadMode();
	    }
	    if (this._currentScaleValue && isNaN(this._currentScaleValue)) {
	      babelHelpers.classPrivateFieldLooseBase(this, _setScale)[_setScale](this._currentScaleValue, {
	        noScroll: true
	      });
	    }
	    this._setCurrentPageNumber(pageNumber, true);
	    this.update();
	  }
	  get spreadMode() {
	    return this._spreadMode;
	  }
	  set spreadMode(mode) {
	    if (this._spreadMode === mode) {
	      return;
	    }
	    if (!isValidSpreadMode(mode)) {
	      throw new Error(`Invalid spread mode: ${mode}`);
	    }
	    this._spreadMode = mode;
	    this.eventBus.dispatch("spreadmodechanged", {
	      source: this,
	      mode
	    });
	    this._updateSpreadMode(this._currentPageNumber);
	  }
	  _updateSpreadMode(pageNumber = null) {
	    if (!this.pdfDocument) {
	      return;
	    }
	    const viewer = this.viewer,
	      pages = this._pages;
	    if (this._scrollMode === ScrollMode.PAGE) {
	      babelHelpers.classPrivateFieldLooseBase(this, _ensurePageViewVisible)[_ensurePageViewVisible]();
	    } else {
	      viewer.textContent = "";
	      if (this._spreadMode === SpreadMode.NONE) {
	        for (const pageView of this._pages) {
	          viewer.append(pageView.div);
	        }
	      } else {
	        const parity = this._spreadMode - 1;
	        let spread = null;
	        for (let i = 0, ii = pages.length; i < ii; ++i) {
	          if (spread === null) {
	            spread = document.createElement("div");
	            spread.className = "spread";
	            viewer.append(spread);
	          } else if (i % 2 === parity) {
	            spread = spread.cloneNode(false);
	            viewer.append(spread);
	          }
	          spread.append(pages[i].div);
	        }
	      }
	    }
	    if (!pageNumber) {
	      return;
	    }
	    if (this._currentScaleValue && isNaN(this._currentScaleValue)) {
	      babelHelpers.classPrivateFieldLooseBase(this, _setScale)[_setScale](this._currentScaleValue, {
	        noScroll: true
	      });
	    }
	    this._setCurrentPageNumber(pageNumber, true);
	    this.update();
	  }
	  _getPageAdvance(currentPageNumber, previous = false) {
	    switch (this._scrollMode) {
	      case ScrollMode.WRAPPED:
	        {
	          const {
	              views
	            } = this._getVisiblePages(),
	            pageLayout = new Map();
	          for (const {
	            id,
	            y,
	            percent,
	            widthPercent
	          } of views) {
	            if (percent === 0 || widthPercent < 100) {
	              continue;
	            }
	            let yArray = pageLayout.get(y);
	            if (!yArray) {
	              pageLayout.set(y, yArray || (yArray = []));
	            }
	            yArray.push(id);
	          }
	          for (const yArray of pageLayout.values()) {
	            const currentIndex = yArray.indexOf(currentPageNumber);
	            if (currentIndex === -1) {
	              continue;
	            }
	            const numPages = yArray.length;
	            if (numPages === 1) {
	              break;
	            }
	            if (previous) {
	              for (let i = currentIndex - 1, ii = 0; i >= ii; i--) {
	                const currentId = yArray[i],
	                  expectedId = yArray[i + 1] - 1;
	                if (currentId < expectedId) {
	                  return currentPageNumber - expectedId;
	                }
	              }
	            } else {
	              for (let i = currentIndex + 1, ii = numPages; i < ii; i++) {
	                const currentId = yArray[i],
	                  expectedId = yArray[i - 1] + 1;
	                if (currentId > expectedId) {
	                  return expectedId - currentPageNumber;
	                }
	              }
	            }
	            if (previous) {
	              const firstId = yArray[0];
	              if (firstId < currentPageNumber) {
	                return currentPageNumber - firstId + 1;
	              }
	            } else {
	              const lastId = yArray[numPages - 1];
	              if (lastId > currentPageNumber) {
	                return lastId - currentPageNumber + 1;
	              }
	            }
	            break;
	          }
	          break;
	        }
	      case ScrollMode.HORIZONTAL:
	        {
	          break;
	        }
	      case ScrollMode.PAGE:
	      case ScrollMode.VERTICAL:
	        {
	          if (this._spreadMode === SpreadMode.NONE) {
	            break;
	          }
	          const parity = this._spreadMode - 1;
	          if (previous && currentPageNumber % 2 !== parity) {
	            break;
	          } else if (!previous && currentPageNumber % 2 === parity) {
	            break;
	          }
	          const {
	              views
	            } = this._getVisiblePages(),
	            expectedId = previous ? currentPageNumber - 1 : currentPageNumber + 1;
	          for (const {
	            id,
	            percent,
	            widthPercent
	          } of views) {
	            if (id !== expectedId) {
	              continue;
	            }
	            if (percent > 0 && widthPercent === 100) {
	              return 2;
	            }
	            break;
	          }
	          break;
	        }
	    }
	    return 1;
	  }
	  nextPage() {
	    const currentPageNumber = this._currentPageNumber,
	      pagesCount = this.pagesCount;
	    if (currentPageNumber >= pagesCount) {
	      return false;
	    }
	    const advance = this._getPageAdvance(currentPageNumber, false) || 1;
	    this.currentPageNumber = Math.min(currentPageNumber + advance, pagesCount);
	    return true;
	  }
	  previousPage() {
	    const currentPageNumber = this._currentPageNumber;
	    if (currentPageNumber <= 1) {
	      return false;
	    }
	    const advance = this._getPageAdvance(currentPageNumber, true) || 1;
	    this.currentPageNumber = Math.max(currentPageNumber - advance, 1);
	    return true;
	  }
	  updateScale({
	    drawingDelay,
	    scaleFactor = null,
	    steps = null,
	    origin
	  }) {
	    if (steps === null && scaleFactor === null) {
	      throw new Error("Invalid updateScale options: either `steps` or `scaleFactor` must be provided.");
	    }
	    if (!this.pdfDocument) {
	      return;
	    }
	    let newScale = this._currentScale;
	    if (scaleFactor > 0 && scaleFactor !== 1) {
	      newScale = Math.round(newScale * scaleFactor * 100) / 100;
	    } else if (steps) {
	      const delta = steps > 0 ? DEFAULT_SCALE_DELTA : 1 / DEFAULT_SCALE_DELTA;
	      const round = steps > 0 ? Math.ceil : Math.floor;
	      steps = Math.abs(steps);
	      do {
	        newScale = round((newScale * delta).toFixed(2) * 10) / 10;
	      } while (--steps > 0);
	    }
	    newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale));
	    babelHelpers.classPrivateFieldLooseBase(this, _setScale)[_setScale](newScale, {
	      noScroll: false,
	      drawingDelay,
	      origin
	    });
	  }
	  increaseScale(options = {}) {
	    var _options$steps;
	    this.updateScale({
	      ...options,
	      steps: (_options$steps = options.steps) != null ? _options$steps : 1
	    });
	  }
	  decreaseScale(options = {}) {
	    var _options$steps2;
	    this.updateScale({
	      ...options,
	      steps: -((_options$steps2 = options.steps) != null ? _options$steps2 : 1)
	    });
	  }
	  get containerTopLeft() {
	    var _babelHelpers$classPr32;
	    return (_babelHelpers$classPr32 = babelHelpers.classPrivateFieldLooseBase(this, _containerTopLeft))[_containerTopLeft] || (_babelHelpers$classPr32[_containerTopLeft] = [this.container.offsetTop, this.container.offsetLeft]);
	  }
	  get annotationEditorMode() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _annotationEditorUIManager)[_annotationEditorUIManager] ? babelHelpers.classPrivateFieldLooseBase(this, _annotationEditorMode)[_annotationEditorMode] : AnnotationEditorType.DISABLE;
	  }
	  set annotationEditorMode({
	    mode,
	    editId = null,
	    isFromKeyboard = false
	  }) {
	    if (!babelHelpers.classPrivateFieldLooseBase(this, _annotationEditorUIManager)[_annotationEditorUIManager]) {
	      throw new Error(`The AnnotationEditor is not enabled.`);
	    }
	    if (babelHelpers.classPrivateFieldLooseBase(this, _annotationEditorMode)[_annotationEditorMode] === mode) {
	      return;
	    }
	    if (!isValidAnnotationEditorMode(mode)) {
	      throw new Error(`Invalid AnnotationEditor mode: ${mode}`);
	    }
	    if (!this.pdfDocument) {
	      return;
	    }
	    if (mode === AnnotationEditorType.STAMP) {
	      var _babelHelpers$classPr33;
	      (_babelHelpers$classPr33 = babelHelpers.classPrivateFieldLooseBase(this, _mlManager3)[_mlManager3]) == null ? void 0 : _babelHelpers$classPr33.loadModel("altText");
	    }
	    const {
	      eventBus
	    } = this;
	    const updater = () => {
	      babelHelpers.classPrivateFieldLooseBase(this, _cleanupSwitchAnnotationEditorMode)[_cleanupSwitchAnnotationEditorMode]();
	      babelHelpers.classPrivateFieldLooseBase(this, _annotationEditorMode)[_annotationEditorMode] = mode;
	      babelHelpers.classPrivateFieldLooseBase(this, _annotationEditorUIManager)[_annotationEditorUIManager].updateMode(mode, editId, isFromKeyboard);
	      eventBus.dispatch("annotationeditormodechanged", {
	        source: this,
	        mode
	      });
	    };
	    if (mode === AnnotationEditorType.NONE || babelHelpers.classPrivateFieldLooseBase(this, _annotationEditorMode)[_annotationEditorMode] === AnnotationEditorType.NONE) {
	      const isEditing = mode !== AnnotationEditorType.NONE;
	      if (!isEditing) {
	        this.pdfDocument.annotationStorage.resetModifiedIds();
	      }
	      for (const pageView of this._pages) {
	        pageView.toggleEditingMode(isEditing);
	      }
	      const idsToRefresh = babelHelpers.classPrivateFieldLooseBase(this, _switchToEditAnnotationMode)[_switchToEditAnnotationMode]();
	      if (isEditing && idsToRefresh) {
	        babelHelpers.classPrivateFieldLooseBase(this, _cleanupSwitchAnnotationEditorMode)[_cleanupSwitchAnnotationEditorMode]();
	        babelHelpers.classPrivateFieldLooseBase(this, _switchAnnotationEditorModeAC)[_switchAnnotationEditorModeAC] = new AbortController();
	        const signal = AbortSignal.any([babelHelpers.classPrivateFieldLooseBase(this, _eventAbortController5)[_eventAbortController5].signal, babelHelpers.classPrivateFieldLooseBase(this, _switchAnnotationEditorModeAC)[_switchAnnotationEditorModeAC].signal]);
	        eventBus._on("pagerendered", ({
	          pageNumber
	        }) => {
	          idsToRefresh.delete(pageNumber);
	          if (idsToRefresh.size === 0) {
	            babelHelpers.classPrivateFieldLooseBase(this, _switchAnnotationEditorModeTimeoutId)[_switchAnnotationEditorModeTimeoutId] = setTimeout(updater, 0);
	          }
	        }, {
	          signal
	        });
	        return;
	      }
	    }
	    updater();
	  }
	  refresh(noUpdate = false, updateArgs = Object.create(null)) {
	    if (!this.pdfDocument) {
	      return;
	    }
	    for (const pageView of this._pages) {
	      pageView.update(updateArgs);
	    }
	    if (babelHelpers.classPrivateFieldLooseBase(this, _scaleTimeoutId)[_scaleTimeoutId] !== null) {
	      clearTimeout(babelHelpers.classPrivateFieldLooseBase(this, _scaleTimeoutId)[_scaleTimeoutId]);
	      babelHelpers.classPrivateFieldLooseBase(this, _scaleTimeoutId)[_scaleTimeoutId] = null;
	    }
	    if (!noUpdate) {
	      this.update();
	    }
	  }
	}
	function _initializePermissions2(permissions) {
	  const params = {
	    annotationEditorMode: babelHelpers.classPrivateFieldLooseBase(this, _annotationEditorMode)[_annotationEditorMode],
	    annotationMode: babelHelpers.classPrivateFieldLooseBase(this, _annotationMode2)[_annotationMode2],
	    textLayerMode: babelHelpers.classPrivateFieldLooseBase(this, _textLayerMode2)[_textLayerMode2]
	  };
	  if (!permissions) {
	    return params;
	  }
	  if (!permissions.includes(PermissionFlag.COPY) && babelHelpers.classPrivateFieldLooseBase(this, _textLayerMode2)[_textLayerMode2] === TextLayerMode.ENABLE) {
	    params.textLayerMode = TextLayerMode.ENABLE_PERMISSIONS;
	  }
	  if (!permissions.includes(PermissionFlag.MODIFY_CONTENTS)) {
	    params.annotationEditorMode = AnnotationEditorType.DISABLE;
	  }
	  if (!permissions.includes(PermissionFlag.MODIFY_ANNOTATIONS) && !permissions.includes(PermissionFlag.FILL_INTERACTIVE_FORMS) && babelHelpers.classPrivateFieldLooseBase(this, _annotationMode2)[_annotationMode2] === AnnotationMode.ENABLE_FORMS) {
	    params.annotationMode = AnnotationMode.ENABLE;
	  }
	  return params;
	}
	async function _onePageRenderedOrForceFetch2(signal) {
	  if (document.visibilityState === "hidden" || !this.container.offsetParent || this._getVisiblePages().views.length === 0) {
	    return;
	  }
	  const hiddenCapability = Promise.withResolvers(),
	    ac = new AbortController();
	  document.addEventListener("visibilitychange", () => {
	    if (document.visibilityState === "hidden") {
	      hiddenCapability.resolve();
	    }
	  }, {
	    signal: typeof AbortSignal.any === "function" ? AbortSignal.any([signal, ac.signal]) : signal
	  });
	  await Promise.race([this._onePageRenderedCapability.promise, hiddenCapability.promise]);
	  ac.abort();
	}
	function _copyCallback2(textLayerMode, event) {
	  const selection = document.getSelection();
	  const {
	    focusNode,
	    anchorNode
	  } = selection;
	  if (anchorNode && focusNode && selection.containsNode(babelHelpers.classPrivateFieldLooseBase(this, _hiddenCopyElement)[_hiddenCopyElement])) {
	    if (babelHelpers.classPrivateFieldLooseBase(this, _getAllTextInProgress)[_getAllTextInProgress] || textLayerMode === TextLayerMode.ENABLE_PERMISSIONS) {
	      event.preventDefault();
	      event.stopPropagation();
	      return;
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _getAllTextInProgress)[_getAllTextInProgress] = true;
	    const {
	      classList
	    } = this.viewer;
	    classList.add("copyAll");
	    const ac = new AbortController();
	    window.addEventListener("keydown", ev => babelHelpers.classPrivateFieldLooseBase(this, _interruptCopyCondition)[_interruptCopyCondition] = ev.key === "Escape", {
	      signal: ac.signal
	    });
	    this.getAllText().then(async text => {
	      if (text !== null) {
	        await navigator.clipboard.writeText(text);
	      }
	    }).catch(reason => {
	      console.warn(`Something goes wrong when extracting the text: ${reason.message}`);
	    }).finally(() => {
	      babelHelpers.classPrivateFieldLooseBase(this, _getAllTextInProgress)[_getAllTextInProgress] = false;
	      babelHelpers.classPrivateFieldLooseBase(this, _interruptCopyCondition)[_interruptCopyCondition] = false;
	      ac.abort();
	      classList.remove("copyAll");
	    });
	    event.preventDefault();
	    event.stopPropagation();
	  }
	}
	function _ensurePageViewVisible2() {
	  if (this._scrollMode !== ScrollMode.PAGE) {
	    throw new Error("#ensurePageViewVisible: Invalid scrollMode value.");
	  }
	  const pageNumber = this._currentPageNumber,
	    state = babelHelpers.classPrivateFieldLooseBase(this, _scrollModePageState)[_scrollModePageState],
	    viewer = this.viewer;
	  viewer.textContent = "";
	  state.pages.length = 0;
	  if (this._spreadMode === SpreadMode.NONE && !this.isInPresentationMode) {
	    const pageView = this._pages[pageNumber - 1];
	    viewer.append(pageView.div);
	    state.pages.push(pageView);
	  } else {
	    const pageIndexSet = new Set(),
	      parity = this._spreadMode - 1;
	    if (parity === -1) {
	      pageIndexSet.add(pageNumber - 1);
	    } else if (pageNumber % 2 !== parity) {
	      pageIndexSet.add(pageNumber - 1);
	      pageIndexSet.add(pageNumber);
	    } else {
	      pageIndexSet.add(pageNumber - 2);
	      pageIndexSet.add(pageNumber - 1);
	    }
	    const spread = document.createElement("div");
	    spread.className = "spread";
	    if (this.isInPresentationMode) {
	      const dummyPage = document.createElement("div");
	      dummyPage.className = "dummyPage";
	      spread.append(dummyPage);
	    }
	    for (const i of pageIndexSet) {
	      const pageView = this._pages[i];
	      if (!pageView) {
	        continue;
	      }
	      spread.append(pageView.div);
	      state.pages.push(pageView);
	    }
	    viewer.append(spread);
	  }
	  state.scrollDown = pageNumber >= state.previousPageNumber;
	  state.previousPageNumber = pageNumber;
	}
	function _scrollIntoView2(pageView, pageSpot = null) {
	  const {
	    div,
	    id
	  } = pageView;
	  if (this._currentPageNumber !== id) {
	    this._setCurrentPageNumber(id);
	  }
	  if (this._scrollMode === ScrollMode.PAGE) {
	    babelHelpers.classPrivateFieldLooseBase(this, _ensurePageViewVisible)[_ensurePageViewVisible]();
	    this.update();
	  }
	  if (!pageSpot && !this.isInPresentationMode) {
	    const left = div.offsetLeft + div.clientLeft,
	      right = left + div.clientWidth;
	    const {
	      scrollLeft,
	      clientWidth
	    } = this.container;
	    if (this._scrollMode === ScrollMode.HORIZONTAL || left < scrollLeft || right > scrollLeft + clientWidth) {
	      pageSpot = {
	        left: 0,
	        top: 0
	      };
	    }
	  }
	  scrollIntoView(div, pageSpot);
	  if (!this._currentScaleValue && this._location) {
	    this._location = null;
	  }
	}
	function _isSameScale2(newScale) {
	  return newScale === this._currentScale || Math.abs(newScale - this._currentScale) < 1e-15;
	}
	function _setScaleUpdatePages2(newScale, newValue, {
	  noScroll = false,
	  preset = false,
	  drawingDelay = -1,
	  origin = null
	}) {
	  this._currentScaleValue = newValue.toString();
	  if (babelHelpers.classPrivateFieldLooseBase(this, _isSameScale)[_isSameScale](newScale)) {
	    if (preset) {
	      this.eventBus.dispatch("scalechanging", {
	        source: this,
	        scale: newScale,
	        presetValue: newValue
	      });
	    }
	    return;
	  }
	  this.viewer.style.setProperty("--scale-factor", newScale * PixelsPerInch.PDF_TO_CSS_UNITS);
	  const postponeDrawing = drawingDelay >= 0 && drawingDelay < 1000;
	  this.refresh(true, {
	    scale: newScale,
	    drawingDelay: postponeDrawing ? drawingDelay : -1
	  });
	  if (postponeDrawing) {
	    babelHelpers.classPrivateFieldLooseBase(this, _scaleTimeoutId)[_scaleTimeoutId] = setTimeout(() => {
	      babelHelpers.classPrivateFieldLooseBase(this, _scaleTimeoutId)[_scaleTimeoutId] = null;
	      this.refresh();
	    }, drawingDelay);
	  }
	  const previousScale = this._currentScale;
	  this._currentScale = newScale;
	  if (!noScroll) {
	    let page = this._currentPageNumber,
	      dest;
	    if (this._location && !(this.isInPresentationMode || this.isChangingPresentationMode)) {
	      page = this._location.pageNumber;
	      dest = [null, {
	        name: "XYZ"
	      }, this._location.left, this._location.top, null];
	    }
	    this.scrollPageIntoView({
	      pageNumber: page,
	      destArray: dest,
	      allowNegativeOffset: true
	    });
	    if (Array.isArray(origin)) {
	      const scaleDiff = newScale / previousScale - 1;
	      const [top, left] = this.containerTopLeft;
	      this.container.scrollLeft += (origin[0] - left) * scaleDiff;
	      this.container.scrollTop += (origin[1] - top) * scaleDiff;
	    }
	  }
	  this.eventBus.dispatch("scalechanging", {
	    source: this,
	    scale: newScale,
	    presetValue: preset ? newValue : undefined
	  });
	  if (this.defaultRenderingQueue) {
	    this.update();
	  }
	}
	function _get_pageWidthScaleFactor() {
	  if (this._spreadMode !== SpreadMode.NONE && this._scrollMode !== ScrollMode.HORIZONTAL) {
	    return 2;
	  }
	  return 1;
	}
	function _setScale2(value, options) {
	  let scale = parseFloat(value);
	  if (scale > 0) {
	    options.preset = false;
	    babelHelpers.classPrivateFieldLooseBase(this, _setScaleUpdatePages)[_setScaleUpdatePages](scale, value, options);
	  } else {
	    const currentPage = this._pages[this._currentPageNumber - 1];
	    if (!currentPage) {
	      return;
	    }
	    let hPadding = SCROLLBAR_PADDING,
	      vPadding = VERTICAL_PADDING;
	    if (this.isInPresentationMode) {
	      hPadding = vPadding = 4;
	      if (this._spreadMode !== SpreadMode.NONE) {
	        hPadding *= 2;
	      }
	    } else if (this.removePageBorders) {
	      hPadding = vPadding = 0;
	    } else if (this._scrollMode === ScrollMode.HORIZONTAL) {
	      [hPadding, vPadding] = [vPadding, hPadding];
	    }
	    const pageWidthScale = (this.container.clientWidth - hPadding) / currentPage.width * currentPage.scale / babelHelpers.classPrivateFieldLooseBase(this, _pageWidthScaleFactor)[_pageWidthScaleFactor];
	    const pageHeightScale = (this.container.clientHeight - vPadding) / currentPage.height * currentPage.scale;
	    switch (value) {
	      case "page-actual":
	        scale = 1;
	        break;
	      case "page-width":
	        scale = pageWidthScale;
	        break;
	      case "page-height":
	        scale = pageHeightScale;
	        break;
	      case "page-fit":
	        scale = Math.min(pageWidthScale, pageHeightScale);
	        break;
	      case "auto":
	        const horizontalScale = isPortraitOrientation(currentPage) ? pageWidthScale : Math.min(pageHeightScale, pageWidthScale);
	        scale = Math.min(MAX_AUTO_SCALE, horizontalScale);
	        break;
	      default:
	        console.error(`#setScale: "${value}" is an unknown zoom value.`);
	        return;
	    }
	    options.preset = true;
	    babelHelpers.classPrivateFieldLooseBase(this, _setScaleUpdatePages)[_setScaleUpdatePages](scale, value, options);
	  }
	}
	function _resetCurrentPageView2() {
	  const pageView = this._pages[this._currentPageNumber - 1];
	  if (this.isInPresentationMode) {
	    babelHelpers.classPrivateFieldLooseBase(this, _setScale)[_setScale](this._currentScaleValue, {
	      noScroll: true
	    });
	  }
	  babelHelpers.classPrivateFieldLooseBase(this, _scrollIntoView)[_scrollIntoView](pageView);
	}
	function _switchToEditAnnotationMode2() {
	  const visible = this._getVisiblePages();
	  const pagesToRefresh = [];
	  const {
	    ids,
	    views
	  } = visible;
	  for (const page of views) {
	    const {
	      view
	    } = page;
	    if (!view.hasEditableAnnotations()) {
	      ids.delete(view.id);
	      continue;
	    }
	    pagesToRefresh.push(page);
	  }
	  if (pagesToRefresh.length === 0) {
	    return null;
	  }
	  this.renderingQueue.renderHighestPriority({
	    first: pagesToRefresh[0],
	    last: pagesToRefresh.at(-1),
	    views: pagesToRefresh,
	    ids
	  });
	  return ids;
	}
	async function _ensurePdfPageLoaded4(pageView) {
	  if (pageView.pdfPage) {
	    return pageView.pdfPage;
	  }
	  try {
	    const pdfPage = await this.pdfDocument.getPage(pageView.id);
	    if (!pageView.pdfPage) {
	      pageView.setPdfPage(pdfPage);
	    }
	    return pdfPage;
	  } catch (reason) {
	    console.error("Unable to get page for page view", reason);
	    return null;
	  }
	}
	function _getScrollAhead4(visible) {
	  var _visible$first2, _visible$last2;
	  if (((_visible$first2 = visible.first) == null ? void 0 : _visible$first2.id) === 1) {
	    return true;
	  } else if (((_visible$last2 = visible.last) == null ? void 0 : _visible$last2.id) === this.pagesCount) {
	    return false;
	  }
	  switch (this._scrollMode) {
	    case ScrollMode.PAGE:
	      return babelHelpers.classPrivateFieldLooseBase(this, _scrollModePageState)[_scrollModePageState].scrollDown;
	    case ScrollMode.HORIZONTAL:
	      return this.scroll.right;
	  }
	  return this.scroll.down;
	}
	function _updateContainerHeightCss2(height = this.container.clientHeight) {
	  if (height !== babelHelpers.classPrivateFieldLooseBase(this, _previousContainerHeight)[_previousContainerHeight]) {
	    babelHelpers.classPrivateFieldLooseBase(this, _previousContainerHeight)[_previousContainerHeight] = height;
	    docStyle.setProperty("--viewer-container-height", `${height}px`);
	  }
	}
	function _resizeObserverCallback4(entries) {
	  for (const entry of entries) {
	    if (entry.target === this.container) {
	      babelHelpers.classPrivateFieldLooseBase(this, _updateContainerHeightCss)[_updateContainerHeightCss](Math.floor(entry.borderBoxSize[0].blockSize));
	      babelHelpers.classPrivateFieldLooseBase(this, _containerTopLeft)[_containerTopLeft] = null;
	      break;
	    }
	  }
	}
	function _cleanupSwitchAnnotationEditorMode2() {
	  var _babelHelpers$classPr63;
	  (_babelHelpers$classPr63 = babelHelpers.classPrivateFieldLooseBase(this, _switchAnnotationEditorModeAC)[_switchAnnotationEditorModeAC]) == null ? void 0 : _babelHelpers$classPr63.abort();
	  babelHelpers.classPrivateFieldLooseBase(this, _switchAnnotationEditorModeAC)[_switchAnnotationEditorModeAC] = null;
	  if (babelHelpers.classPrivateFieldLooseBase(this, _switchAnnotationEditorModeTimeoutId)[_switchAnnotationEditorModeTimeoutId] !== null) {
	    clearTimeout(babelHelpers.classPrivateFieldLooseBase(this, _switchAnnotationEditorModeTimeoutId)[_switchAnnotationEditorModeTimeoutId]);
	    babelHelpers.classPrivateFieldLooseBase(this, _switchAnnotationEditorModeTimeoutId)[_switchAnnotationEditorModeTimeoutId] = null;
	  }
	}
	var _opts2 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("opts");
	var _updateUIState5 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("updateUIState");
	var _bindListeners3 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("bindListeners");
	var _cursorToolChanged = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("cursorToolChanged");
	var _scrollModeChanged = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("scrollModeChanged");
	var _spreadModeChanged = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("spreadModeChanged");
	class SecondaryToolbar {
	  constructor(options, _eventBus6) {
	    Object.defineProperty(this, _spreadModeChanged, {
	      value: _spreadModeChanged2
	    });
	    Object.defineProperty(this, _scrollModeChanged, {
	      value: _scrollModeChanged2
	    });
	    Object.defineProperty(this, _cursorToolChanged, {
	      value: _cursorToolChanged2
	    });
	    Object.defineProperty(this, _bindListeners3, {
	      value: _bindListeners4
	    });
	    Object.defineProperty(this, _updateUIState5, {
	      value: _updateUIState6
	    });
	    Object.defineProperty(this, _opts2, {
	      writable: true,
	      value: void 0
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _opts2)[_opts2] = options;
	    const _buttons = [{
	      element: options.presentationModeButton,
	      eventName: "presentationmode",
	      close: true
	    }, {
	      element: options.printButton,
	      eventName: "print",
	      close: true
	    }, {
	      element: options.downloadButton,
	      eventName: "download",
	      close: true
	    }, {
	      element: options.viewBookmarkButton,
	      eventName: null,
	      close: true
	    }, {
	      element: options.firstPageButton,
	      eventName: "firstpage",
	      close: true
	    }, {
	      element: options.lastPageButton,
	      eventName: "lastpage",
	      close: true
	    }, {
	      element: options.pageRotateCwButton,
	      eventName: "rotatecw",
	      close: false
	    }, {
	      element: options.pageRotateCcwButton,
	      eventName: "rotateccw",
	      close: false
	    }, {
	      element: options.cursorSelectToolButton,
	      eventName: "switchcursortool",
	      eventDetails: {
	        tool: CursorTool.SELECT
	      },
	      close: true
	    }, {
	      element: options.cursorHandToolButton,
	      eventName: "switchcursortool",
	      eventDetails: {
	        tool: CursorTool.HAND
	      },
	      close: true
	    }, {
	      element: options.scrollPageButton,
	      eventName: "switchscrollmode",
	      eventDetails: {
	        mode: ScrollMode.PAGE
	      },
	      close: true
	    }, {
	      element: options.scrollVerticalButton,
	      eventName: "switchscrollmode",
	      eventDetails: {
	        mode: ScrollMode.VERTICAL
	      },
	      close: true
	    }, {
	      element: options.scrollHorizontalButton,
	      eventName: "switchscrollmode",
	      eventDetails: {
	        mode: ScrollMode.HORIZONTAL
	      },
	      close: true
	    }, {
	      element: options.scrollWrappedButton,
	      eventName: "switchscrollmode",
	      eventDetails: {
	        mode: ScrollMode.WRAPPED
	      },
	      close: true
	    }, {
	      element: options.spreadNoneButton,
	      eventName: "switchspreadmode",
	      eventDetails: {
	        mode: SpreadMode.NONE
	      },
	      close: true
	    }, {
	      element: options.spreadOddButton,
	      eventName: "switchspreadmode",
	      eventDetails: {
	        mode: SpreadMode.ODD
	      },
	      close: true
	    }, {
	      element: options.spreadEvenButton,
	      eventName: "switchspreadmode",
	      eventDetails: {
	        mode: SpreadMode.EVEN
	      },
	      close: true
	    }, {
	      element: options.imageAltTextSettingsButton,
	      eventName: "imagealttextsettings",
	      close: true
	    }, {
	      element: options.documentPropertiesButton,
	      eventName: "documentproperties",
	      close: true
	    }];
	    _buttons.push({
	      element: options.openFileButton,
	      eventName: "openfile",
	      close: true
	    });
	    this.eventBus = _eventBus6;
	    this.opened = false;
	    babelHelpers.classPrivateFieldLooseBase(this, _bindListeners3)[_bindListeners3](_buttons);
	    this.reset();
	  }
	  get isOpen() {
	    return this.opened;
	  }
	  setPageNumber(pageNumber) {
	    this.pageNumber = pageNumber;
	    babelHelpers.classPrivateFieldLooseBase(this, _updateUIState5)[_updateUIState5]();
	  }
	  setPagesCount(pagesCount) {
	    this.pagesCount = pagesCount;
	    babelHelpers.classPrivateFieldLooseBase(this, _updateUIState5)[_updateUIState5]();
	  }
	  reset() {
	    this.pageNumber = 0;
	    this.pagesCount = 0;
	    babelHelpers.classPrivateFieldLooseBase(this, _updateUIState5)[_updateUIState5]();
	    this.eventBus.dispatch("switchcursortool", {
	      source: this,
	      reset: true
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _scrollModeChanged)[_scrollModeChanged]({
	      mode: ScrollMode.VERTICAL
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _spreadModeChanged)[_spreadModeChanged]({
	      mode: SpreadMode.NONE
	    });
	  }
	  open() {
	    if (this.opened) {
	      return;
	    }
	    this.opened = true;
	    const {
	      toggleButton,
	      toolbar
	    } = babelHelpers.classPrivateFieldLooseBase(this, _opts2)[_opts2];
	    toggleExpandedBtn(toggleButton, true, toolbar);
	  }
	  close() {
	    if (!this.opened) {
	      return;
	    }
	    this.opened = false;
	    const {
	      toggleButton,
	      toolbar
	    } = babelHelpers.classPrivateFieldLooseBase(this, _opts2)[_opts2];
	    toggleExpandedBtn(toggleButton, false, toolbar);
	  }
	  toggle() {
	    if (this.opened) {
	      this.close();
	    } else {
	      this.open();
	    }
	  }
	}
	function _updateUIState6() {
	  const {
	    firstPageButton,
	    lastPageButton,
	    pageRotateCwButton,
	    pageRotateCcwButton
	  } = babelHelpers.classPrivateFieldLooseBase(this, _opts2)[_opts2];
	  firstPageButton.disabled = this.pageNumber <= 1;
	  lastPageButton.disabled = this.pageNumber >= this.pagesCount;
	  pageRotateCwButton.disabled = this.pagesCount === 0;
	  pageRotateCcwButton.disabled = this.pagesCount === 0;
	}
	function _bindListeners4(buttons) {
	  const {
	    eventBus
	  } = this;
	  const {
	    toggleButton
	  } = babelHelpers.classPrivateFieldLooseBase(this, _opts2)[_opts2];
	  toggleButton.addEventListener("click", this.toggle.bind(this));
	  for (const {
	    element,
	    eventName,
	    close,
	    eventDetails
	  } of buttons) {
	    element.addEventListener("click", evt => {
	      if (eventName !== null) {
	        eventBus.dispatch(eventName, {
	          source: this,
	          ...eventDetails
	        });
	      }
	      if (close) {
	        this.close();
	      }
	      eventBus.dispatch("reporttelemetry", {
	        source: this,
	        details: {
	          type: "buttons",
	          data: {
	            id: element.id
	          }
	        }
	      });
	    });
	  }
	  eventBus._on("cursortoolchanged", babelHelpers.classPrivateFieldLooseBase(this, _cursorToolChanged)[_cursorToolChanged].bind(this));
	  eventBus._on("scrollmodechanged", babelHelpers.classPrivateFieldLooseBase(this, _scrollModeChanged)[_scrollModeChanged].bind(this));
	  eventBus._on("spreadmodechanged", babelHelpers.classPrivateFieldLooseBase(this, _spreadModeChanged)[_spreadModeChanged].bind(this));
	}
	function _cursorToolChanged2({
	  tool,
	  disabled
	}) {
	  const {
	    cursorSelectToolButton,
	    cursorHandToolButton
	  } = babelHelpers.classPrivateFieldLooseBase(this, _opts2)[_opts2];
	  toggleCheckedBtn(cursorSelectToolButton, tool === CursorTool.SELECT);
	  toggleCheckedBtn(cursorHandToolButton, tool === CursorTool.HAND);
	  cursorSelectToolButton.disabled = disabled;
	  cursorHandToolButton.disabled = disabled;
	}
	function _scrollModeChanged2({
	  mode
	}) {
	  const {
	    scrollPageButton,
	    scrollVerticalButton,
	    scrollHorizontalButton,
	    scrollWrappedButton,
	    spreadNoneButton,
	    spreadOddButton,
	    spreadEvenButton
	  } = babelHelpers.classPrivateFieldLooseBase(this, _opts2)[_opts2];
	  toggleCheckedBtn(scrollPageButton, mode === ScrollMode.PAGE);
	  toggleCheckedBtn(scrollVerticalButton, mode === ScrollMode.VERTICAL);
	  toggleCheckedBtn(scrollHorizontalButton, mode === ScrollMode.HORIZONTAL);
	  toggleCheckedBtn(scrollWrappedButton, mode === ScrollMode.WRAPPED);
	  const forceScrollModePage = this.pagesCount > PagesCountLimit.FORCE_SCROLL_MODE_PAGE;
	  scrollPageButton.disabled = forceScrollModePage;
	  scrollVerticalButton.disabled = forceScrollModePage;
	  scrollHorizontalButton.disabled = forceScrollModePage;
	  scrollWrappedButton.disabled = forceScrollModePage;
	  const isHorizontal = mode === ScrollMode.HORIZONTAL;
	  spreadNoneButton.disabled = isHorizontal;
	  spreadOddButton.disabled = isHorizontal;
	  spreadEvenButton.disabled = isHorizontal;
	}
	function _spreadModeChanged2({
	  mode
	}) {
	  const {
	    spreadNoneButton,
	    spreadOddButton,
	    spreadEvenButton
	  } = babelHelpers.classPrivateFieldLooseBase(this, _opts2)[_opts2];
	  toggleCheckedBtn(spreadNoneButton, mode === SpreadMode.NONE);
	  toggleCheckedBtn(spreadOddButton, mode === SpreadMode.ODD);
	  toggleCheckedBtn(spreadEvenButton, mode === SpreadMode.EVEN);
	}
	var _opts3 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("opts");
	var _updateToolbarDensity = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("updateToolbarDensity");
	var _setAnnotationEditorUIManager = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("setAnnotationEditorUIManager");
	var _bindListeners5 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("bindListeners");
	var _editorModeChanged = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("editorModeChanged");
	var _updateUIState7 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("updateUIState");
	class Toolbar {
	  constructor(options, _eventBus7, toolbarDensity = 0) {
	    Object.defineProperty(this, _updateUIState7, {
	      value: _updateUIState8
	    });
	    Object.defineProperty(this, _editorModeChanged, {
	      value: _editorModeChanged2
	    });
	    Object.defineProperty(this, _bindListeners5, {
	      value: _bindListeners6
	    });
	    Object.defineProperty(this, _setAnnotationEditorUIManager, {
	      value: _setAnnotationEditorUIManager2
	    });
	    Object.defineProperty(this, _updateToolbarDensity, {
	      value: _updateToolbarDensity2
	    });
	    Object.defineProperty(this, _opts3, {
	      writable: true,
	      value: void 0
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _opts3)[_opts3] = options;
	    this.eventBus = _eventBus7;
	    const _buttons2 = [{
	      element: options.previous,
	      eventName: "previouspage"
	    }, {
	      element: options.next,
	      eventName: "nextpage"
	    }, {
	      element: options.zoomIn,
	      eventName: "zoomin"
	    }, {
	      element: options.zoomOut,
	      eventName: "zoomout"
	    }, {
	      element: options.print,
	      eventName: "print"
	    }, {
	      element: options.download,
	      eventName: "download"
	    }, {
	      element: options.editorFreeTextButton,
	      eventName: "switchannotationeditormode",
	      eventDetails: {
	        get mode() {
	          const {
	            classList
	          } = options.editorFreeTextButton;
	          return classList.contains("toggled") ? AnnotationEditorType.NONE : AnnotationEditorType.FREETEXT;
	        }
	      }
	    }, {
	      element: options.editorHighlightButton,
	      eventName: "switchannotationeditormode",
	      eventDetails: {
	        get mode() {
	          const {
	            classList
	          } = options.editorHighlightButton;
	          return classList.contains("toggled") ? AnnotationEditorType.NONE : AnnotationEditorType.HIGHLIGHT;
	        }
	      }
	    }, {
	      element: options.editorInkButton,
	      eventName: "switchannotationeditormode",
	      eventDetails: {
	        get mode() {
	          const {
	            classList
	          } = options.editorInkButton;
	          return classList.contains("toggled") ? AnnotationEditorType.NONE : AnnotationEditorType.INK;
	        }
	      }
	    }, {
	      element: options.editorStampButton,
	      eventName: "switchannotationeditormode",
	      eventDetails: {
	        get mode() {
	          const {
	            classList
	          } = options.editorStampButton;
	          return classList.contains("toggled") ? AnnotationEditorType.NONE : AnnotationEditorType.STAMP;
	        }
	      },
	      telemetry: {
	        type: "editing",
	        data: {
	          action: "pdfjs.image.icon_click"
	        }
	      }
	    }];
	    babelHelpers.classPrivateFieldLooseBase(this, _bindListeners5)[_bindListeners5](_buttons2);
	    babelHelpers.classPrivateFieldLooseBase(this, _updateToolbarDensity)[_updateToolbarDensity]({
	      value: toolbarDensity
	    });
	    this.reset();
	  }
	  setPageNumber(pageNumber, pageLabel) {
	    this.pageNumber = pageNumber;
	    this.pageLabel = pageLabel;
	    babelHelpers.classPrivateFieldLooseBase(this, _updateUIState7)[_updateUIState7](false);
	  }
	  setPagesCount(pagesCount, hasPageLabels) {
	    this.pagesCount = pagesCount;
	    this.hasPageLabels = hasPageLabels;
	    babelHelpers.classPrivateFieldLooseBase(this, _updateUIState7)[_updateUIState7](true);
	  }
	  setPageScale(pageScaleValue, pageScale) {
	    this.pageScaleValue = (pageScaleValue || pageScale).toString();
	    this.pageScale = pageScale;
	    babelHelpers.classPrivateFieldLooseBase(this, _updateUIState7)[_updateUIState7](false);
	  }
	  reset() {
	    this.pageNumber = 0;
	    this.pageLabel = null;
	    this.hasPageLabels = false;
	    this.pagesCount = 0;
	    this.pageScaleValue = DEFAULT_SCALE_VALUE;
	    this.pageScale = DEFAULT_SCALE;
	    babelHelpers.classPrivateFieldLooseBase(this, _updateUIState7)[_updateUIState7](true);
	    this.updateLoadingIndicatorState();
	    babelHelpers.classPrivateFieldLooseBase(this, _editorModeChanged)[_editorModeChanged]({
	      mode: AnnotationEditorType.DISABLE
	    });
	  }
	  updateLoadingIndicatorState(loading = false) {
	    const {
	      pageNumber
	    } = babelHelpers.classPrivateFieldLooseBase(this, _opts3)[_opts3];
	    pageNumber.classList.toggle("loading", loading);
	  }
	}
	function _updateToolbarDensity2({
	  value
	}) {
	  let name = "normal";
	  switch (value) {
	    case 1:
	      name = "compact";
	      break;
	    case 2:
	      name = "touch";
	      break;
	  }
	  document.documentElement.setAttribute("data-toolbar-density", name);
	}
	function _setAnnotationEditorUIManager2(uiManager, parentContainer) {
	  const colorPicker = new ColorPicker({
	    uiManager
	  });
	  uiManager.setMainHighlightColorPicker(colorPicker);
	  parentContainer.append(colorPicker.renderMainDropdown());
	}
	function _bindListeners6(buttons) {
	  const {
	    eventBus
	  } = this;
	  const {
	    editorHighlightColorPicker,
	    editorHighlightButton,
	    pageNumber,
	    scaleSelect
	  } = babelHelpers.classPrivateFieldLooseBase(this, _opts3)[_opts3];
	  const self = this;
	  for (const {
	    element,
	    eventName,
	    eventDetails,
	    telemetry
	  } of buttons) {
	    element.addEventListener("click", evt => {
	      if (eventName !== null) {
	        eventBus.dispatch(eventName, {
	          source: this,
	          ...eventDetails,
	          isFromKeyboard: evt.detail === 0
	        });
	      }
	      if (telemetry) {
	        eventBus.dispatch("reporttelemetry", {
	          source: this,
	          details: telemetry
	        });
	      }
	    });
	  }
	  pageNumber.addEventListener("click", function () {
	    this.select();
	  });
	  pageNumber.addEventListener("change", function () {
	    eventBus.dispatch("pagenumberchanged", {
	      source: self,
	      value: this.value
	    });
	  });
	  scaleSelect.addEventListener("change", function () {
	    if (this.value === "custom") {
	      return;
	    }
	    eventBus.dispatch("scalechanged", {
	      source: self,
	      value: this.value
	    });
	  });
	  scaleSelect.addEventListener("click", function ({
	    target
	  }) {
	    if (this.value === self.pageScaleValue && target.tagName.toUpperCase() === "OPTION") {
	      this.blur();
	    }
	  });
	  scaleSelect.oncontextmenu = noContextMenu;
	  eventBus._on("annotationeditormodechanged", babelHelpers.classPrivateFieldLooseBase(this, _editorModeChanged)[_editorModeChanged].bind(this));
	  eventBus._on("showannotationeditorui", ({
	    mode
	  }) => {
	    switch (mode) {
	      case AnnotationEditorType.HIGHLIGHT:
	        editorHighlightButton.click();
	        break;
	    }
	  });
	  eventBus._on("toolbardensity", babelHelpers.classPrivateFieldLooseBase(this, _updateToolbarDensity)[_updateToolbarDensity].bind(this));
	  if (editorHighlightColorPicker) {
	    eventBus._on("annotationeditoruimanager", ({
	      uiManager
	    }) => {
	      babelHelpers.classPrivateFieldLooseBase(this, _setAnnotationEditorUIManager)[_setAnnotationEditorUIManager](uiManager, editorHighlightColorPicker);
	    }, {
	      once: true
	    });
	  }
	}
	function _editorModeChanged2({
	  mode
	}) {
	  const {
	    editorFreeTextButton,
	    editorFreeTextParamsToolbar,
	    editorHighlightButton,
	    editorHighlightParamsToolbar,
	    editorInkButton,
	    editorInkParamsToolbar,
	    editorStampButton,
	    editorStampParamsToolbar
	  } = babelHelpers.classPrivateFieldLooseBase(this, _opts3)[_opts3];
	  toggleExpandedBtn(editorFreeTextButton, mode === AnnotationEditorType.FREETEXT, editorFreeTextParamsToolbar);
	  toggleExpandedBtn(editorHighlightButton, mode === AnnotationEditorType.HIGHLIGHT, editorHighlightParamsToolbar);
	  toggleExpandedBtn(editorInkButton, mode === AnnotationEditorType.INK, editorInkParamsToolbar);
	  toggleExpandedBtn(editorStampButton, mode === AnnotationEditorType.STAMP, editorStampParamsToolbar);
	  const isDisable = mode === AnnotationEditorType.DISABLE;
	  editorFreeTextButton.disabled = isDisable;
	  editorHighlightButton.disabled = isDisable;
	  editorInkButton.disabled = isDisable;
	  editorStampButton.disabled = isDisable;
	}
	function _updateUIState8(resetNumPages = false) {
	  const {
	    pageNumber,
	    pagesCount,
	    pageScaleValue,
	    pageScale
	  } = this;
	  const opts = babelHelpers.classPrivateFieldLooseBase(this, _opts3)[_opts3];
	  if (resetNumPages) {
	    if (this.hasPageLabels) {
	      opts.pageNumber.type = "text";
	      opts.numPages.setAttribute("data-l10n-id", "pdfjs-page-of-pages");
	    } else {
	      opts.pageNumber.type = "number";
	      opts.numPages.setAttribute("data-l10n-id", "pdfjs-of-pages");
	      opts.numPages.setAttribute("data-l10n-args", JSON.stringify({
	        pagesCount
	      }));
	    }
	    opts.pageNumber.max = pagesCount;
	  }
	  if (this.hasPageLabels) {
	    opts.pageNumber.value = this.pageLabel;
	    opts.numPages.setAttribute("data-l10n-args", JSON.stringify({
	      pageNumber,
	      pagesCount
	    }));
	  } else {
	    opts.pageNumber.value = pageNumber;
	  }
	  opts.previous.disabled = pageNumber <= 1;
	  opts.next.disabled = pageNumber >= pagesCount;
	  opts.zoomOut.disabled = pageScale <= MIN_SCALE;
	  opts.zoomIn.disabled = pageScale >= MAX_SCALE;
	  let predefinedValueFound = false;
	  for (const option of opts.scaleSelect.options) {
	    if (option.value !== pageScaleValue) {
	      option.selected = false;
	      continue;
	    }
	    option.selected = true;
	    predefinedValueFound = true;
	  }
	  if (!predefinedValueFound) {
	    opts.customScaleOption.selected = true;
	    opts.customScaleOption.setAttribute("data-l10n-args", JSON.stringify({
	      scale: Math.round(pageScale * 10000) / 100
	    }));
	  }
	}
	const DEFAULT_VIEW_HISTORY_CACHE_SIZE = 20;
	class ViewHistory {
	  constructor(fingerprint, cacheSize = DEFAULT_VIEW_HISTORY_CACHE_SIZE) {
	    this.fingerprint = fingerprint;
	    this.cacheSize = cacheSize;
	    this._initializedPromise = this._readFromStorage().then(databaseStr => {
	      const database = JSON.parse(databaseStr || "{}");
	      let index = -1;
	      if (!Array.isArray(database.files)) {
	        database.files = [];
	      } else {
	        while (database.files.length >= this.cacheSize) {
	          database.files.shift();
	        }
	        for (let i = 0, ii = database.files.length; i < ii; i++) {
	          const branch = database.files[i];
	          if (branch.fingerprint === this.fingerprint) {
	            index = i;
	            break;
	          }
	        }
	      }
	      if (index === -1) {
	        index = database.files.push({
	          fingerprint: this.fingerprint
	        }) - 1;
	      }
	      this.file = database.files[index];
	      this.database = database;
	    });
	  }
	  async _writeToStorage() {
	    const databaseStr = JSON.stringify(this.database);
	    localStorage.setItem("pdfjs.history", databaseStr);
	  }
	  async _readFromStorage() {
	    return localStorage.getItem("pdfjs.history");
	  }
	  async set(name, val) {
	    await this._initializedPromise;
	    this.file[name] = val;
	    return this._writeToStorage();
	  }
	  async setMultiple(properties) {
	    await this._initializedPromise;
	    for (const name in properties) {
	      this.file[name] = properties[name];
	    }
	    return this._writeToStorage();
	  }
	  async get(name, defaultValue) {
	    await this._initializedPromise;
	    const val = this.file[name];
	    return val !== undefined ? val : defaultValue;
	  }
	  async getMultiple(properties) {
	    await this._initializedPromise;
	    const values = Object.create(null);
	    for (const name in properties) {
	      const val = this.file[name];
	      values[name] = val !== undefined ? val : properties[name];
	    }
	    return values;
	  }
	}

	const FORCE_PAGES_LOADED_TIMEOUT = 10000;
	const ViewOnLoad = {
	  UNKNOWN: -1,
	  PREVIOUS: 0,
	  INITIAL: 1
	};
	const PDFViewerApplication = {
	  initialBookmark: document.location.hash.substring(1),
	  _initializedCapability: {
	    ...Promise.withResolvers(),
	    settled: false
	  },
	  appConfig: null,
	  pdfDocument: null,
	  pdfLoadingTask: null,
	  printService: null,
	  pdfViewer: null,
	  pdfThumbnailViewer: null,
	  pdfRenderingQueue: null,
	  pdfPresentationMode: null,
	  pdfDocumentProperties: null,
	  pdfLinkService: null,
	  pdfHistory: null,
	  pdfSidebar: null,
	  pdfOutlineViewer: null,
	  pdfAttachmentViewer: null,
	  pdfLayerViewer: null,
	  pdfCursorTools: null,
	  pdfScriptingManager: null,
	  store: null,
	  downloadManager: null,
	  overlayManager: null,
	  preferences: new Preferences(),
	  toolbar: null,
	  secondaryToolbar: null,
	  eventBus: null,
	  l10n: null,
	  annotationEditorParams: null,
	  imageAltTextSettings: null,
	  isInitialViewSet: false,
	  isViewerEmbedded: window.parent !== window,
	  url: "",
	  baseUrl: "",
	  mlManager: null,
	  _downloadUrl: "",
	  _eventBusAbortController: null,
	  _windowAbortController: null,
	  _globalAbortController: new AbortController(),
	  documentInfo: null,
	  metadata: null,
	  _contentDispositionFilename: null,
	  _contentLength: null,
	  _saveInProgress: false,
	  _wheelUnusedTicks: 0,
	  _wheelUnusedFactor: 1,
	  _touchUnusedTicks: 0,
	  _touchUnusedFactor: 1,
	  _PDFBug: null,
	  _hasAnnotationEditors: false,
	  _title: document.title,
	  _printAnnotationStoragePromise: null,
	  _touchInfo: null,
	  _isCtrlKeyDown: false,
	  _caretBrowsing: null,
	  _isScrolling: false,
	  async initialize(appConfig) {
	    this.appConfig = appConfig;
	    try {
	      await this.preferences.initializedPromise;
	    } catch (ex) {
	      console.error(`initialize: "${ex.message}".`);
	    }
	    if (AppOptions.get("pdfBugEnabled")) {
	      await this._parseHashParams();
	    }
	    let mode;
	    switch (AppOptions.get("viewerCssTheme")) {
	      case 1:
	        mode = "is-light";
	        break;
	      case 2:
	        mode = "is-dark";
	        break;
	    }
	    if (mode) {
	      document.documentElement.classList.add(mode);
	    }
	    this.l10n = await this.externalServices.createL10n();
	    document.getElementsByTagName("html")[0].dir = this.l10n.getDirection();
	    this.l10n.translate(appConfig.appContainer || document.documentElement);
	    if (this.isViewerEmbedded && AppOptions.get("externalLinkTarget") === LinkTarget.NONE) {
	      AppOptions.set("externalLinkTarget", LinkTarget.TOP);
	    }
	    await this._initializeViewerComponents();
	    this.bindEvents();
	    this.bindWindowEvents();
	    this._initializedCapability.settled = true;
	    this._initializedCapability.resolve();
	  },
	  async _parseHashParams() {
	    const hash = document.location.hash.substring(1);
	    if (!hash) {
	      return;
	    }
	    const {
	        mainContainer,
	        viewerContainer
	      } = this.appConfig,
	      params = parseQueryString(hash);
	    const loadPDFBug = async () => {
	      if (this._PDFBug) {
	        return;
	      }
	      const {
	        PDFBug
	      } = await import( /*webpackIgnore: true*/AppOptions.get("debuggerSrc"));
	      this._PDFBug = PDFBug;
	    };
	    if (params.get("disableworker") === "true") {
	      try {
	        GlobalWorkerOptions.workerSrc || (GlobalWorkerOptions.workerSrc = AppOptions.get("workerSrc"));
	        await import( /*webpackIgnore: true*/PDFWorker.workerSrc);
	      } catch (ex) {
	        console.error(`_parseHashParams: "${ex.message}".`);
	      }
	    }
	    if (params.has("textlayer")) {
	      switch (params.get("textlayer")) {
	        case "off":
	          AppOptions.set("textLayerMode", TextLayerMode.DISABLE);
	          break;
	        case "visible":
	        case "shadow":
	        case "hover":
	          viewerContainer.classList.add(`textLayer-${params.get("textlayer")}`);
	          try {
	            await loadPDFBug();
	            this._PDFBug.loadCSS();
	          } catch (ex) {
	            console.error(`_parseHashParams: "${ex.message}".`);
	          }
	          break;
	      }
	    }
	    if (params.has("pdfbug")) {
	      AppOptions.setAll({
	        pdfBug: true,
	        fontExtraProperties: true
	      });
	      const enabled = params.get("pdfbug").split(",");
	      try {
	        await loadPDFBug();
	        this._PDFBug.init(mainContainer, enabled);
	      } catch (ex) {
	        console.error(`_parseHashParams: "${ex.message}".`);
	      }
	    }
	    if (params.has("locale")) {
	      AppOptions.set("localeProperties", {
	        lang: params.get("locale")
	      });
	    }
	    const opts = {
	      disableAutoFetch: x => x === "true",
	      disableFontFace: x => x === "true",
	      disableHistory: x => x === "true",
	      disableRange: x => x === "true",
	      disableStream: x => x === "true",
	      verbosity: x => x | 0
	    };
	    for (const name in opts) {
	      const check = opts[name],
	        key = name.toLowerCase();
	      if (params.has(key)) {
	        AppOptions.set(name, check(params.get(key)));
	      }
	    }
	  },
	  async _initializeViewerComponents() {
	    var _this$mlManager, _appConfig$sidebar, _appConfig$secondaryT, _appConfig$secondaryT2, _appConfig$secondaryT5, _appConfig$sidebar2, _appConfig$sidebar3, _appConfig$sidebar4;
	    const {
	      appConfig,
	      externalServices,
	      l10n
	    } = this;
	    const eventBus = new EventBus();
	    this.eventBus = AppOptions.eventBus = eventBus;
	    (_this$mlManager = this.mlManager) == null ? void 0 : _this$mlManager.setEventBus(eventBus, this._globalAbortController.signal);
	    this.overlayManager = new OverlayManager();
	    const pdfRenderingQueue = new PDFRenderingQueue();
	    pdfRenderingQueue.onIdle = this._cleanup.bind(this);
	    this.pdfRenderingQueue = pdfRenderingQueue;
	    const pdfLinkService = new PDFLinkService({
	      eventBus,
	      externalLinkTarget: AppOptions.get("externalLinkTarget"),
	      externalLinkRel: AppOptions.get("externalLinkRel"),
	      ignoreDestinationZoom: AppOptions.get("ignoreDestinationZoom")
	    });
	    this.pdfLinkService = pdfLinkService;
	    const downloadManager = this.downloadManager = new DownloadManager();
	    const findController = new PDFFindController({
	      linkService: pdfLinkService,
	      eventBus,
	      updateMatchesCountOnProgress: true
	    });
	    this.findController = findController;
	    const pdfScriptingManager = new PDFScriptingManager({
	      eventBus,
	      externalServices,
	      docProperties: this._scriptingDocProperties.bind(this)
	    });
	    this.pdfScriptingManager = pdfScriptingManager;
	    const container = appConfig.mainContainer,
	      viewer = appConfig.viewerContainer;
	    const annotationEditorMode = AppOptions.get("annotationEditorMode");
	    const pageColors = AppOptions.get("forcePageColors") || window.matchMedia("(forced-colors: active)").matches ? {
	      background: AppOptions.get("pageColorsBackground"),
	      foreground: AppOptions.get("pageColorsForeground")
	    } : null;
	    let altTextManager;
	    if (AppOptions.get("enableUpdatedAddImage")) {
	      altTextManager = appConfig.newAltTextDialog ? new NewAltTextManager(appConfig.newAltTextDialog, this.overlayManager, eventBus) : null;
	    } else {
	      altTextManager = appConfig.altTextDialog ? new AltTextManager(appConfig.altTextDialog, container, this.overlayManager, eventBus) : null;
	    }
	    const enableHWA = AppOptions.get("enableHWA");
	    const pdfViewer = new PDFViewer({
	      container,
	      viewer,
	      eventBus,
	      renderingQueue: pdfRenderingQueue,
	      linkService: pdfLinkService,
	      downloadManager,
	      altTextManager,
	      findController,
	      scriptingManager: AppOptions.get("enableScripting") && pdfScriptingManager,
	      l10n,
	      textLayerMode: AppOptions.get("textLayerMode"),
	      annotationMode: AppOptions.get("annotationMode"),
	      annotationEditorMode,
	      annotationEditorHighlightColors: AppOptions.get("highlightEditorColors"),
	      enableHighlightFloatingButton: AppOptions.get("enableHighlightFloatingButton"),
	      enableUpdatedAddImage: AppOptions.get("enableUpdatedAddImage"),
	      enableNewAltTextWhenAddingImage: AppOptions.get("enableNewAltTextWhenAddingImage"),
	      imageResourcesPath: AppOptions.get("imageResourcesPath"),
	      enablePrintAutoRotate: AppOptions.get("enablePrintAutoRotate"),
	      maxCanvasPixels: AppOptions.get("maxCanvasPixels"),
	      enablePermissions: AppOptions.get("enablePermissions"),
	      pageColors,
	      mlManager: this.mlManager,
	      abortSignal: this._globalAbortController.signal,
	      enableHWA
	    });
	    this.pdfViewer = pdfViewer;
	    pdfRenderingQueue.setViewer(pdfViewer);
	    pdfLinkService.setViewer(pdfViewer);
	    pdfScriptingManager.setViewer(pdfViewer);
	    if ((_appConfig$sidebar = appConfig.sidebar) != null && _appConfig$sidebar.thumbnailView) {
	      this.pdfThumbnailViewer = new PDFThumbnailViewer({
	        container: appConfig.sidebar.thumbnailView,
	        eventBus,
	        renderingQueue: pdfRenderingQueue,
	        linkService: pdfLinkService,
	        pageColors,
	        abortSignal: this._globalAbortController.signal,
	        enableHWA
	      });
	      pdfRenderingQueue.setThumbnailViewer(this.pdfThumbnailViewer);
	    }
	    if (!this.isViewerEmbedded && !AppOptions.get("disableHistory")) {
	      this.pdfHistory = new PDFHistory({
	        linkService: pdfLinkService,
	        eventBus
	      });
	      pdfLinkService.setHistory(this.pdfHistory);
	    }
	    if (!this.supportsIntegratedFind && appConfig.findBar) {
	      this.findBar = new PDFFindBar(appConfig.findBar, appConfig.principalContainer, eventBus);
	    }
	    if (appConfig.annotationEditorParams) {
	      if (typeof AbortSignal.any === "function" && annotationEditorMode !== AnnotationEditorType.DISABLE) {
	        this.annotationEditorParams = new AnnotationEditorParams(appConfig.annotationEditorParams, eventBus);
	      } else {
	        for (const id of ["editorModeButtons", "editorModeSeparator"]) {
	          var _document$getElementB2;
	          (_document$getElementB2 = document.getElementById(id)) == null ? void 0 : _document$getElementB2.classList.add("hidden");
	        }
	      }
	    }
	    if (this.mlManager && (_appConfig$secondaryT = appConfig.secondaryToolbar) != null && _appConfig$secondaryT.imageAltTextSettingsButton) {
	      this.imageAltTextSettings = new ImageAltTextSettings(appConfig.altTextSettingsDialog, this.overlayManager, eventBus, this.mlManager);
	    }
	    if (appConfig.documentProperties) {
	      this.pdfDocumentProperties = new PDFDocumentProperties(appConfig.documentProperties, this.overlayManager, eventBus, l10n, () => this._docFilename);
	    }
	    if ((_appConfig$secondaryT2 = appConfig.secondaryToolbar) != null && _appConfig$secondaryT2.cursorHandToolButton) {
	      this.pdfCursorTools = new PDFCursorTools({
	        container,
	        eventBus,
	        cursorToolOnLoad: AppOptions.get("cursorToolOnLoad")
	      });
	    }
	    if (appConfig.toolbar) {
	      this.toolbar = new Toolbar(appConfig.toolbar, eventBus, AppOptions.get("toolbarDensity"));
	    }
	    if (appConfig.secondaryToolbar) {
	      if (AppOptions.get("enableAltText")) {
	        var _appConfig$secondaryT3, _appConfig$secondaryT4;
	        (_appConfig$secondaryT3 = appConfig.secondaryToolbar.imageAltTextSettingsButton) == null ? void 0 : _appConfig$secondaryT3.classList.remove("hidden");
	        (_appConfig$secondaryT4 = appConfig.secondaryToolbar.imageAltTextSettingsSeparator) == null ? void 0 : _appConfig$secondaryT4.classList.remove("hidden");
	      }
	      this.secondaryToolbar = new SecondaryToolbar(appConfig.secondaryToolbar, eventBus);
	    }
	    if (this.supportsFullscreen && (_appConfig$secondaryT5 = appConfig.secondaryToolbar) != null && _appConfig$secondaryT5.presentationModeButton) {
	      this.pdfPresentationMode = new PDFPresentationMode({
	        container,
	        pdfViewer,
	        eventBus
	      });
	    }
	    if (appConfig.passwordOverlay) {
	      this.passwordPrompt = new PasswordPrompt(appConfig.passwordOverlay, this.overlayManager, this.isViewerEmbedded);
	    }
	    if ((_appConfig$sidebar2 = appConfig.sidebar) != null && _appConfig$sidebar2.outlineView) {
	      this.pdfOutlineViewer = new PDFOutlineViewer({
	        container: appConfig.sidebar.outlineView,
	        eventBus,
	        l10n,
	        linkService: pdfLinkService,
	        downloadManager
	      });
	    }
	    if ((_appConfig$sidebar3 = appConfig.sidebar) != null && _appConfig$sidebar3.attachmentsView) {
	      this.pdfAttachmentViewer = new PDFAttachmentViewer({
	        container: appConfig.sidebar.attachmentsView,
	        eventBus,
	        l10n,
	        downloadManager
	      });
	    }
	    if ((_appConfig$sidebar4 = appConfig.sidebar) != null && _appConfig$sidebar4.layersView) {
	      this.pdfLayerViewer = new PDFLayerViewer({
	        container: appConfig.sidebar.layersView,
	        eventBus,
	        l10n
	      });
	    }
	    if (appConfig.sidebar) {
	      this.pdfSidebar = new PDFSidebar({
	        elements: appConfig.sidebar,
	        eventBus,
	        l10n
	      });
	      this.pdfSidebar.onToggled = this.forceRendering.bind(this);
	      this.pdfSidebar.onUpdateThumbnails = () => {
	        for (const pageView of pdfViewer.getCachedPageViews()) {
	          if (pageView.renderingState === RenderingStates.FINISHED) {
	            var _this$pdfThumbnailVie2;
	            (_this$pdfThumbnailVie2 = this.pdfThumbnailViewer.getThumbnail(pageView.id - 1)) == null ? void 0 : _this$pdfThumbnailVie2.setImage(pageView);
	          }
	        }
	        this.pdfThumbnailViewer.scrollThumbnailIntoView(pdfViewer.currentPageNumber);
	      };
	    }
	  },
	  async run(config) {
	    var _params$get;
	    await this.initialize(config);
	    const {
	      appConfig,
	      eventBus
	    } = this;
	    let file;
	    const queryString = document.location.search.substring(1);
	    const params = parseQueryString(queryString);
	    file = (_params$get = params.get("file")) != null ? _params$get : AppOptions.get("defaultUrl");
	    validateFileURL(file);
	    const fileInput = this._openFileInput = document.createElement("input");
	    fileInput.id = "fileInput";
	    fileInput.hidden = true;
	    fileInput.type = "file";
	    fileInput.value = null;
	    document.body.append(fileInput);
	    fileInput.addEventListener("change", function (evt) {
	      const {
	        files
	      } = evt.target;
	      if (!files || files.length === 0) {
	        return;
	      }
	      eventBus.dispatch("fileinputchange", {
	        source: this,
	        fileInput: evt.target
	      });
	    });
	    appConfig.mainContainer.addEventListener("dragover", function (evt) {
	      for (const item of evt.dataTransfer.items) {
	        if (item.type === "application/pdf") {
	          evt.dataTransfer.dropEffect = evt.dataTransfer.effectAllowed === "copy" ? "copy" : "move";
	          evt.preventDefault();
	          evt.stopPropagation();
	          return;
	        }
	      }
	    });
	    appConfig.mainContainer.addEventListener("drop", function (evt) {
	      var _evt$dataTransfer$fil;
	      if (((_evt$dataTransfer$fil = evt.dataTransfer.files) == null ? void 0 : _evt$dataTransfer$fil[0].type) !== "application/pdf") {
	        return;
	      }
	      evt.preventDefault();
	      evt.stopPropagation();
	      eventBus.dispatch("fileinputchange", {
	        source: this,
	        fileInput: evt.dataTransfer
	      });
	    });
	    if (!AppOptions.get("supportsDocumentFonts")) {
	      AppOptions.set("disableFontFace", true);
	      this.l10n.get("pdfjs-web-fonts-disabled").then(msg => {
	        console.warn(msg);
	      });
	    }
	    if (!this.supportsPrinting) {
	      var _appConfig$toolbar, _appConfig$toolbar$pr, _appConfig$secondaryT6;
	      (_appConfig$toolbar = appConfig.toolbar) == null ? void 0 : (_appConfig$toolbar$pr = _appConfig$toolbar.print) == null ? void 0 : _appConfig$toolbar$pr.classList.add("hidden");
	      (_appConfig$secondaryT6 = appConfig.secondaryToolbar) == null ? void 0 : _appConfig$secondaryT6.printButton.classList.add("hidden");
	    }
	    if (!this.supportsFullscreen) {
	      var _appConfig$secondaryT7;
	      (_appConfig$secondaryT7 = appConfig.secondaryToolbar) == null ? void 0 : _appConfig$secondaryT7.presentationModeButton.classList.add("hidden");
	    }
	    if (this.supportsIntegratedFind) {
	      var _appConfig$findBar, _appConfig$findBar$to;
	      (_appConfig$findBar = appConfig.findBar) == null ? void 0 : (_appConfig$findBar$to = _appConfig$findBar.toggleButton) == null ? void 0 : _appConfig$findBar$to.classList.add("hidden");
	    }
	    if (file) {
	      this.open({
	        url: file
	      });
	    } else {
	      this._hideViewBookmark();
	    }
	  },
	  get externalServices() {
	    return shadow(this, "externalServices", new ExternalServices());
	  },
	  get initialized() {
	    return this._initializedCapability.settled;
	  },
	  get initializedPromise() {
	    return this._initializedCapability.promise;
	  },
	  updateZoom(steps, scaleFactor, origin) {
	    if (this.pdfViewer.isInPresentationMode) {
	      return;
	    }
	    this.pdfViewer.updateScale({
	      drawingDelay: AppOptions.get("defaultZoomDelay"),
	      steps,
	      scaleFactor,
	      origin
	    });
	  },
	  zoomIn() {
	    this.updateZoom(1);
	  },
	  zoomOut() {
	    this.updateZoom(-1);
	  },
	  zoomReset() {
	    if (this.pdfViewer.isInPresentationMode) {
	      return;
	    }
	    this.pdfViewer.currentScaleValue = DEFAULT_SCALE_VALUE;
	  },
	  get pagesCount() {
	    return this.pdfDocument ? this.pdfDocument.numPages : 0;
	  },
	  get page() {
	    return this.pdfViewer.currentPageNumber;
	  },
	  set page(val) {
	    this.pdfViewer.currentPageNumber = val;
	  },
	  get supportsPrinting() {
	    return PDFPrintServiceFactory.supportsPrinting;
	  },
	  get supportsFullscreen() {
	    return shadow(this, "supportsFullscreen", document.fullscreenEnabled);
	  },
	  get supportsPinchToZoom() {
	    return shadow(this, "supportsPinchToZoom", AppOptions.get("supportsPinchToZoom"));
	  },
	  get supportsIntegratedFind() {
	    return shadow(this, "supportsIntegratedFind", AppOptions.get("supportsIntegratedFind"));
	  },
	  get loadingBar() {
	    const barElement = document.getElementById("loadingBar");
	    const bar = barElement ? new ProgressBar(barElement) : null;
	    return shadow(this, "loadingBar", bar);
	  },
	  get supportsMouseWheelZoomCtrlKey() {
	    return shadow(this, "supportsMouseWheelZoomCtrlKey", AppOptions.get("supportsMouseWheelZoomCtrlKey"));
	  },
	  get supportsMouseWheelZoomMetaKey() {
	    return shadow(this, "supportsMouseWheelZoomMetaKey", AppOptions.get("supportsMouseWheelZoomMetaKey"));
	  },
	  get supportsCaretBrowsingMode() {
	    return AppOptions.get("supportsCaretBrowsingMode");
	  },
	  moveCaret(isUp, select) {
	    var _this$appConfig$toolb;
	    this._caretBrowsing || (this._caretBrowsing = new CaretBrowsingMode(this._globalAbortController.signal, this.appConfig.mainContainer, this.appConfig.viewerContainer, (_this$appConfig$toolb = this.appConfig.toolbar) == null ? void 0 : _this$appConfig$toolb.container));
	    this._caretBrowsing.moveCaret(isUp, select);
	  },
	  setTitleUsingUrl(url = "", downloadUrl = null) {
	    this.url = url;
	    this.baseUrl = url.split("#", 1)[0];
	    if (downloadUrl) {
	      this._downloadUrl = downloadUrl === url ? this.baseUrl : downloadUrl.split("#", 1)[0];
	    }
	    if (isDataScheme(url)) {
	      this._hideViewBookmark();
	    }
	    let title = pdfjs_getPdfFilenameFromUrl(url, "");
	    if (!title) {
	      try {
	        title = decodeURIComponent(getFilenameFromUrl(url));
	      } catch {}
	    }
	    this.setTitle(title || url);
	  },
	  setTitle(title = this._title) {
	    this._title = title;
	    if (this.isViewerEmbedded) {
	      return;
	    }
	    const editorIndicator = this._hasAnnotationEditors && !this.pdfRenderingQueue.printing;
	    document.title = `${editorIndicator ? "* " : ""}${title}`;
	  },
	  get _docFilename() {
	    return this._contentDispositionFilename || pdfjs_getPdfFilenameFromUrl(this.url);
	  },
	  _hideViewBookmark() {
	    const {
	      secondaryToolbar
	    } = this.appConfig;
	    secondaryToolbar == null ? void 0 : secondaryToolbar.viewBookmarkButton.classList.add("hidden");
	    if (secondaryToolbar != null && secondaryToolbar.presentationModeButton.classList.contains("hidden")) {
	      var _document$getElementB3;
	      (_document$getElementB3 = document.getElementById("viewBookmarkSeparator")) == null ? void 0 : _document$getElementB3.classList.add("hidden");
	    }
	  },
	  async close() {
	    var _this$pdfDocument, _this$pdfSidebar, _this$pdfOutlineViewe, _this$pdfAttachmentVi, _this$pdfLayerViewer, _this$pdfHistory3, _this$findBar, _this$toolbar, _this$secondaryToolba, _this$_PDFBug;
	    this._unblockDocumentLoadEvent();
	    this._hideViewBookmark();
	    if (!this.pdfLoadingTask) {
	      return;
	    }
	    if (((_this$pdfDocument = this.pdfDocument) == null ? void 0 : _this$pdfDocument.annotationStorage.size) > 0 && this._annotationStorageModified) {
	      try {
	        await this.save();
	      } catch {}
	    }
	    const promises = [];
	    promises.push(this.pdfLoadingTask.destroy());
	    this.pdfLoadingTask = null;
	    if (this.pdfDocument) {
	      var _this$pdfThumbnailVie3, _this$pdfDocumentProp;
	      this.pdfDocument = null;
	      (_this$pdfThumbnailVie3 = this.pdfThumbnailViewer) == null ? void 0 : _this$pdfThumbnailVie3.setDocument(null);
	      this.pdfViewer.setDocument(null);
	      this.pdfLinkService.setDocument(null);
	      (_this$pdfDocumentProp = this.pdfDocumentProperties) == null ? void 0 : _this$pdfDocumentProp.setDocument(null);
	    }
	    this.pdfLinkService.externalLinkEnabled = true;
	    this.store = null;
	    this.isInitialViewSet = false;
	    this.url = "";
	    this.baseUrl = "";
	    this._downloadUrl = "";
	    this.documentInfo = null;
	    this.metadata = null;
	    this._contentDispositionFilename = null;
	    this._contentLength = null;
	    this._saveInProgress = false;
	    this._hasAnnotationEditors = false;
	    promises.push(this.pdfScriptingManager.destroyPromise, this.passwordPrompt.close());
	    this.setTitle();
	    (_this$pdfSidebar = this.pdfSidebar) == null ? void 0 : _this$pdfSidebar.reset();
	    (_this$pdfOutlineViewe = this.pdfOutlineViewer) == null ? void 0 : _this$pdfOutlineViewe.reset();
	    (_this$pdfAttachmentVi = this.pdfAttachmentViewer) == null ? void 0 : _this$pdfAttachmentVi.reset();
	    (_this$pdfLayerViewer = this.pdfLayerViewer) == null ? void 0 : _this$pdfLayerViewer.reset();
	    (_this$pdfHistory3 = this.pdfHistory) == null ? void 0 : _this$pdfHistory3.reset();
	    (_this$findBar = this.findBar) == null ? void 0 : _this$findBar.reset();
	    (_this$toolbar = this.toolbar) == null ? void 0 : _this$toolbar.reset();
	    (_this$secondaryToolba = this.secondaryToolbar) == null ? void 0 : _this$secondaryToolba.reset();
	    (_this$_PDFBug = this._PDFBug) == null ? void 0 : _this$_PDFBug.cleanup();
	    await Promise.all(promises);
	  },
	  async open(args) {
	    if (this.pdfLoadingTask) {
	      await this.close();
	    }
	    const workerParams = AppOptions.getAll(OptionKind.WORKER);
	    Object.assign(GlobalWorkerOptions, workerParams);
	    if (args.url) {
	      this.setTitleUsingUrl(args.originalUrl || args.url, args.url);
	    }
	    const apiParams = AppOptions.getAll(OptionKind.API);
	    const loadingTask = getDocument({
	      ...apiParams,
	      ...args
	    });
	    this.pdfLoadingTask = loadingTask;
	    loadingTask.onPassword = (updateCallback, reason) => {
	      if (this.isViewerEmbedded) {
	        this._unblockDocumentLoadEvent();
	      }
	      this.pdfLinkService.externalLinkEnabled = false;
	      this.passwordPrompt.setUpdateCallback(updateCallback, reason);
	      this.passwordPrompt.open();
	    };
	    loadingTask.onProgress = ({
	      loaded,
	      total
	    }) => {
	      this.progress(loaded / total);
	    };
	    return loadingTask.promise.then(pdfDocument => {
	      this.load(pdfDocument);
	    }, reason => {
	      if (loadingTask !== this.pdfLoadingTask) {
	        return undefined;
	      }
	      let key = "pdfjs-loading-error";
	      if (reason instanceof InvalidPDFException) {
	        key = "pdfjs-invalid-file-error";
	      } else if (reason instanceof MissingPDFException) {
	        key = "pdfjs-missing-file-error";
	      } else if (reason instanceof UnexpectedResponseException) {
	        key = "pdfjs-unexpected-response-error";
	      }
	      return this._documentError(key, {
	        message: reason.message
	      }).then(() => {
	        throw reason;
	      });
	    });
	  },
	  async download() {
	    let data;
	    try {
	      data = await this.pdfDocument.getData();
	    } catch {}
	    this.downloadManager.download(data, this._downloadUrl, this._docFilename);
	  },
	  async save() {
	    if (this._saveInProgress) {
	      return;
	    }
	    this._saveInProgress = true;
	    await this.pdfScriptingManager.dispatchWillSave();
	    try {
	      const data = await this.pdfDocument.saveDocument();
	      this.downloadManager.download(data, this._downloadUrl, this._docFilename);
	    } catch (reason) {
	      console.error(`Error when saving the document: ${reason.message}`);
	      await this.download();
	    } finally {
	      await this.pdfScriptingManager.dispatchDidSave();
	      this._saveInProgress = false;
	    }
	    if (this._hasAnnotationEditors) {
	      var _this$pdfDocument2;
	      this.externalServices.reportTelemetry({
	        type: "editing",
	        data: {
	          type: "save",
	          stats: (_this$pdfDocument2 = this.pdfDocument) == null ? void 0 : _this$pdfDocument2.annotationStorage.editorStats
	        }
	      });
	    }
	  },
	  async downloadOrSave() {
	    var _this$pdfDocument3;
	    const {
	      classList
	    } = this.appConfig.appContainer;
	    classList.add("wait");
	    await (((_this$pdfDocument3 = this.pdfDocument) == null ? void 0 : _this$pdfDocument3.annotationStorage.size) > 0 ? this.save() : this.download());
	    classList.remove("wait");
	  },
	  async _documentError(key, moreInfo = null) {
	    var _moreInfo$message;
	    this._unblockDocumentLoadEvent();
	    const message = await this._otherError(key || "pdfjs-loading-error", moreInfo);
	    this.eventBus.dispatch("documenterror", {
	      source: this,
	      message,
	      reason: (_moreInfo$message = moreInfo == null ? void 0 : moreInfo.message) != null ? _moreInfo$message : null
	    });
	  },
	  async _otherError(key, moreInfo = null) {
	    const message = await this.l10n.get(key);
	    const moreInfoText = [`PDF.js v${version || "?"} (build: ${build || "?"})`];
	    if (moreInfo) {
	      moreInfoText.push(`Message: ${moreInfo.message}`);
	      if (moreInfo.stack) {
	        moreInfoText.push(`Stack: ${moreInfo.stack}`);
	      } else {
	        if (moreInfo.filename) {
	          moreInfoText.push(`File: ${moreInfo.filename}`);
	        }
	        if (moreInfo.lineNumber) {
	          moreInfoText.push(`Line: ${moreInfo.lineNumber}`);
	        }
	      }
	    }
	    console.error(`${message}\n\n${moreInfoText.join("\n")}`);
	    return message;
	  },
	  progress(level) {
	    var _this$pdfDocument$loa, _this$pdfDocument4;
	    const percent = Math.round(level * 100);
	    if (!this.loadingBar || percent <= this.loadingBar.percent) {
	      return;
	    }
	    this.loadingBar.percent = percent;
	    if ((_this$pdfDocument$loa = (_this$pdfDocument4 = this.pdfDocument) == null ? void 0 : _this$pdfDocument4.loadingParams.disableAutoFetch) != null ? _this$pdfDocument$loa : AppOptions.get("disableAutoFetch")) {
	      this.loadingBar.setDisableAutoFetch();
	    }
	  },
	  load(pdfDocument) {
	    var _this$toolbar2, _this$secondaryToolba2, _this$pdfDocumentProp2, _this$pdfThumbnailVie4;
	    this.pdfDocument = pdfDocument;
	    pdfDocument.getDownloadInfo().then(({
	      length
	    }) => {
	      var _this$loadingBar;
	      this._contentLength = length;
	      (_this$loadingBar = this.loadingBar) == null ? void 0 : _this$loadingBar.hide();
	      firstPagePromise.then(() => {
	        this.eventBus.dispatch("documentloaded", {
	          source: this
	        });
	      });
	    });
	    const pageLayoutPromise = pdfDocument.getPageLayout().catch(() => {});
	    const pageModePromise = pdfDocument.getPageMode().catch(() => {});
	    const openActionPromise = pdfDocument.getOpenAction().catch(() => {});
	    (_this$toolbar2 = this.toolbar) == null ? void 0 : _this$toolbar2.setPagesCount(pdfDocument.numPages, false);
	    (_this$secondaryToolba2 = this.secondaryToolbar) == null ? void 0 : _this$secondaryToolba2.setPagesCount(pdfDocument.numPages);
	    this.pdfLinkService.setDocument(pdfDocument);
	    (_this$pdfDocumentProp2 = this.pdfDocumentProperties) == null ? void 0 : _this$pdfDocumentProp2.setDocument(pdfDocument);
	    const pdfViewer = this.pdfViewer;
	    pdfViewer.setDocument(pdfDocument);
	    const {
	      firstPagePromise,
	      onePageRendered,
	      pagesPromise
	    } = pdfViewer;
	    (_this$pdfThumbnailVie4 = this.pdfThumbnailViewer) == null ? void 0 : _this$pdfThumbnailVie4.setDocument(pdfDocument);
	    const storedPromise = (this.store = new ViewHistory(pdfDocument.fingerprints[0])).getMultiple({
	      page: null,
	      zoom: DEFAULT_SCALE_VALUE,
	      scrollLeft: "0",
	      scrollTop: "0",
	      rotation: null,
	      sidebarView: SidebarView.UNKNOWN,
	      scrollMode: ScrollMode.UNKNOWN,
	      spreadMode: SpreadMode.UNKNOWN
	    }).catch(() => {});
	    firstPagePromise.then(pdfPage => {
	      var _this$loadingBar2;
	      (_this$loadingBar2 = this.loadingBar) == null ? void 0 : _this$loadingBar2.setWidth(this.appConfig.viewerContainer);
	      this._initializeAnnotationStorageCallbacks(pdfDocument);
	      Promise.all([animationStarted, storedPromise, pageLayoutPromise, pageModePromise, openActionPromise]).then(async ([timeStamp, stored, pageLayout, pageMode, openAction]) => {
	        const viewOnLoad = AppOptions.get("viewOnLoad");
	        this._initializePdfHistory({
	          fingerprint: pdfDocument.fingerprints[0],
	          viewOnLoad,
	          initialDest: openAction == null ? void 0 : openAction.dest
	        });
	        const initialBookmark = this.initialBookmark;
	        const zoom = AppOptions.get("defaultZoomValue");
	        let hash = zoom ? `zoom=${zoom}` : null;
	        let rotation = null;
	        let sidebarView = AppOptions.get("sidebarViewOnLoad");
	        let scrollMode = AppOptions.get("scrollModeOnLoad");
	        let spreadMode = AppOptions.get("spreadModeOnLoad");
	        if (stored != null && stored.page && viewOnLoad !== ViewOnLoad.INITIAL) {
	          hash = `page=${stored.page}&zoom=${zoom || stored.zoom},` + `${stored.scrollLeft},${stored.scrollTop}`;
	          rotation = parseInt(stored.rotation, 10);
	          if (sidebarView === SidebarView.UNKNOWN) {
	            sidebarView = stored.sidebarView | 0;
	          }
	          if (scrollMode === ScrollMode.UNKNOWN) {
	            scrollMode = stored.scrollMode | 0;
	          }
	          if (spreadMode === SpreadMode.UNKNOWN) {
	            spreadMode = stored.spreadMode | 0;
	          }
	        }
	        if (pageMode && sidebarView === SidebarView.UNKNOWN) {
	          sidebarView = apiPageModeToSidebarView(pageMode);
	        }
	        if (pageLayout && scrollMode === ScrollMode.UNKNOWN && spreadMode === SpreadMode.UNKNOWN) {
	          const modes = apiPageLayoutToViewerModes(pageLayout);
	          spreadMode = modes.spreadMode;
	        }
	        this.setInitialView(hash, {
	          rotation,
	          sidebarView,
	          scrollMode,
	          spreadMode
	        });
	        this.eventBus.dispatch("documentinit", {
	          source: this
	        });
	        if (!this.isViewerEmbedded) {
	          pdfViewer.focus();
	        }
	        await Promise.race([pagesPromise, new Promise(resolve => {
	          setTimeout(resolve, FORCE_PAGES_LOADED_TIMEOUT);
	        })]);
	        if (!initialBookmark && !hash) {
	          return;
	        }
	        if (pdfViewer.hasEqualPageSizes) {
	          return;
	        }
	        this.initialBookmark = initialBookmark;
	        pdfViewer.currentScaleValue = pdfViewer.currentScaleValue;
	        this.setInitialView(hash);
	      }).catch(() => {
	        this.setInitialView();
	      }).then(function () {
	        pdfViewer.update();
	      });
	    });
	    pagesPromise.then(() => {
	      this._unblockDocumentLoadEvent();
	      this._initializeAutoPrint(pdfDocument, openActionPromise);
	    }, reason => {
	      this._documentError("pdfjs-loading-error", {
	        message: reason.message
	      });
	    });
	    onePageRendered.then(data => {
	      this.externalServices.reportTelemetry({
	        type: "pageInfo",
	        timestamp: data.timestamp
	      });
	      if (this.pdfOutlineViewer) {
	        pdfDocument.getOutline().then(outline => {
	          if (pdfDocument !== this.pdfDocument) {
	            return;
	          }
	          this.pdfOutlineViewer.render({
	            outline,
	            pdfDocument
	          });
	        });
	      }
	      if (this.pdfAttachmentViewer) {
	        pdfDocument.getAttachments().then(attachments => {
	          if (pdfDocument !== this.pdfDocument) {
	            return;
	          }
	          this.pdfAttachmentViewer.render({
	            attachments
	          });
	        });
	      }
	      if (this.pdfLayerViewer) {
	        pdfViewer.optionalContentConfigPromise.then(optionalContentConfig => {
	          if (pdfDocument !== this.pdfDocument) {
	            return;
	          }
	          this.pdfLayerViewer.render({
	            optionalContentConfig,
	            pdfDocument
	          });
	        });
	      }
	    });
	    this._initializePageLabels(pdfDocument);
	    this._initializeMetadata(pdfDocument);
	  },
	  async _scriptingDocProperties(pdfDocument) {
	    var _this$metadata, _this$metadata2;
	    if (!this.documentInfo) {
	      await new Promise(resolve => {
	        this.eventBus._on("metadataloaded", resolve, {
	          once: true
	        });
	      });
	      if (pdfDocument !== this.pdfDocument) {
	        return null;
	      }
	    }
	    if (!this._contentLength) {
	      await new Promise(resolve => {
	        this.eventBus._on("documentloaded", resolve, {
	          once: true
	        });
	      });
	      if (pdfDocument !== this.pdfDocument) {
	        return null;
	      }
	    }
	    return {
	      ...this.documentInfo,
	      baseURL: this.baseUrl,
	      filesize: this._contentLength,
	      filename: this._docFilename,
	      metadata: (_this$metadata = this.metadata) == null ? void 0 : _this$metadata.getRaw(),
	      authors: (_this$metadata2 = this.metadata) == null ? void 0 : _this$metadata2.get("dc:creator"),
	      numPages: this.pagesCount,
	      URL: this.url
	    };
	  },
	  async _initializeAutoPrint(pdfDocument, openActionPromise) {
	    const [openAction, jsActions] = await Promise.all([openActionPromise, this.pdfViewer.enableScripting ? null : pdfDocument.getJSActions()]);
	    if (pdfDocument !== this.pdfDocument) {
	      return;
	    }
	    let triggerAutoPrint = (openAction == null ? void 0 : openAction.action) === "Print";
	    if (jsActions) {
	      console.warn("Warning: JavaScript support is not enabled");
	      for (const name in jsActions) {
	        if (triggerAutoPrint) {
	          break;
	        }
	        switch (name) {
	          case "WillClose":
	          case "WillSave":
	          case "DidSave":
	          case "WillPrint":
	          case "DidPrint":
	            continue;
	        }
	        triggerAutoPrint = jsActions[name].some(js => AutoPrintRegExp.test(js));
	      }
	    }
	    if (triggerAutoPrint) {
	      this.triggerPrinting();
	    }
	  },
	  async _initializeMetadata(pdfDocument) {
	    var _this$_contentDisposi, _this$_contentLength;
	    const {
	      info,
	      metadata,
	      contentDispositionFilename,
	      contentLength
	    } = await pdfDocument.getMetadata();
	    if (pdfDocument !== this.pdfDocument) {
	      return;
	    }
	    this.documentInfo = info;
	    this.metadata = metadata;
	    (_this$_contentDisposi = this._contentDispositionFilename) != null ? _this$_contentDisposi : this._contentDispositionFilename = contentDispositionFilename;
	    (_this$_contentLength = this._contentLength) != null ? _this$_contentLength : this._contentLength = contentLength;
	    console.log(`PDF ${pdfDocument.fingerprints[0]} [${info.PDFFormatVersion} ` + `${(info.Producer || "-").trim()} / ${(info.Creator || "-").trim()}] ` + `(PDF.js: ${version || "?"} [${build || "?"}])`);
	    let pdfTitle = info.Title;
	    const metadataTitle = metadata == null ? void 0 : metadata.get("dc:title");
	    if (metadataTitle) {
	      if (metadataTitle !== "Untitled" && !/[\uFFF0-\uFFFF]/g.test(metadataTitle)) {
	        pdfTitle = metadataTitle;
	      }
	    }
	    if (pdfTitle) {
	      this.setTitle(`${pdfTitle} - ${this._contentDispositionFilename || this._title}`);
	    } else if (this._contentDispositionFilename) {
	      this.setTitle(this._contentDispositionFilename);
	    }
	    if (info.IsXFAPresent && !info.IsAcroFormPresent && !pdfDocument.isPureXfa) {
	      if (pdfDocument.loadingParams.enableXfa) {
	        console.warn("Warning: XFA Foreground documents are not supported");
	      } else {
	        console.warn("Warning: XFA support is not enabled");
	      }
	    } else if ((info.IsAcroFormPresent || info.IsXFAPresent) && !this.pdfViewer.renderForms) {
	      console.warn("Warning: Interactive form support is not enabled");
	    }
	    if (info.IsSignaturesPresent) {
	      console.warn("Warning: Digital signatures validation is not supported");
	    }
	    this.eventBus.dispatch("metadataloaded", {
	      source: this
	    });
	  },
	  async _initializePageLabels(pdfDocument) {
	    const labels = await pdfDocument.getPageLabels();
	    if (pdfDocument !== this.pdfDocument) {
	      return;
	    }
	    if (!labels || AppOptions.get("disablePageLabels")) {
	      return;
	    }
	    const numLabels = labels.length;
	    let standardLabels = 0,
	      emptyLabels = 0;
	    for (let i = 0; i < numLabels; i++) {
	      const label = labels[i];
	      if (label === (i + 1).toString()) {
	        standardLabels++;
	      } else if (label === "") {
	        emptyLabels++;
	      } else {
	        break;
	      }
	    }
	    if (standardLabels >= numLabels || emptyLabels >= numLabels) {
	      return;
	    }
	    const {
	      pdfViewer,
	      pdfThumbnailViewer,
	      toolbar
	    } = this;
	    pdfViewer.setPageLabels(labels);
	    pdfThumbnailViewer == null ? void 0 : pdfThumbnailViewer.setPageLabels(labels);
	    toolbar == null ? void 0 : toolbar.setPagesCount(numLabels, true);
	    toolbar == null ? void 0 : toolbar.setPageNumber(pdfViewer.currentPageNumber, pdfViewer.currentPageLabel);
	  },
	  _initializePdfHistory({
	    fingerprint,
	    viewOnLoad,
	    initialDest = null
	  }) {
	    if (!this.pdfHistory) {
	      return;
	    }
	    this.pdfHistory.initialize({
	      fingerprint,
	      resetHistory: viewOnLoad === ViewOnLoad.INITIAL,
	      updateUrl: AppOptions.get("historyUpdateUrl")
	    });
	    if (this.pdfHistory.initialBookmark) {
	      this.initialBookmark = this.pdfHistory.initialBookmark;
	      this.initialRotation = this.pdfHistory.initialRotation;
	    }
	    if (initialDest && !this.initialBookmark && viewOnLoad === ViewOnLoad.UNKNOWN) {
	      this.initialBookmark = JSON.stringify(initialDest);
	      this.pdfHistory.push({
	        explicitDest: initialDest,
	        pageNumber: null
	      });
	    }
	  },
	  _initializeAnnotationStorageCallbacks(pdfDocument) {
	    if (pdfDocument !== this.pdfDocument) {
	      return;
	    }
	    const {
	      annotationStorage
	    } = pdfDocument;
	    annotationStorage.onSetModified = () => {
	      window.addEventListener("beforeunload", beforeUnload);
	      this._annotationStorageModified = true;
	    };
	    annotationStorage.onResetModified = () => {
	      window.removeEventListener("beforeunload", beforeUnload);
	      delete this._annotationStorageModified;
	    };
	    annotationStorage.onAnnotationEditor = typeStr => {
	      this._hasAnnotationEditors = !!typeStr;
	      this.setTitle();
	    };
	  },
	  setInitialView(storedHash, {
	    rotation,
	    sidebarView,
	    scrollMode,
	    spreadMode
	  } = {}) {
	    var _this$pdfSidebar2, _this$toolbar3, _this$secondaryToolba3;
	    const setRotation = angle => {
	      if (isValidRotation(angle)) {
	        this.pdfViewer.pagesRotation = angle;
	      }
	    };
	    const setViewerModes = (scroll, spread) => {
	      if (isValidScrollMode(scroll)) {
	        this.pdfViewer.scrollMode = scroll;
	      }
	      if (isValidSpreadMode(spread)) {
	        this.pdfViewer.spreadMode = spread;
	      }
	    };
	    this.isInitialViewSet = true;
	    (_this$pdfSidebar2 = this.pdfSidebar) == null ? void 0 : _this$pdfSidebar2.setInitialView(sidebarView);
	    setViewerModes(scrollMode, spreadMode);
	    if (this.initialBookmark) {
	      setRotation(this.initialRotation);
	      delete this.initialRotation;
	      this.pdfLinkService.setHash(this.initialBookmark);
	      this.initialBookmark = null;
	    } else if (storedHash) {
	      setRotation(rotation);
	      this.pdfLinkService.setHash(storedHash);
	    }
	    (_this$toolbar3 = this.toolbar) == null ? void 0 : _this$toolbar3.setPageNumber(this.pdfViewer.currentPageNumber, this.pdfViewer.currentPageLabel);
	    (_this$secondaryToolba3 = this.secondaryToolbar) == null ? void 0 : _this$secondaryToolba3.setPageNumber(this.pdfViewer.currentPageNumber);
	    if (!this.pdfViewer.currentScaleValue) {
	      this.pdfViewer.currentScaleValue = DEFAULT_SCALE_VALUE;
	    }
	  },
	  _cleanup() {
	    var _this$pdfThumbnailVie5;
	    if (!this.pdfDocument) {
	      return;
	    }
	    this.pdfViewer.cleanup();
	    (_this$pdfThumbnailVie5 = this.pdfThumbnailViewer) == null ? void 0 : _this$pdfThumbnailVie5.cleanup();
	    this.pdfDocument.cleanup(AppOptions.get("fontExtraProperties"));
	  },
	  forceRendering() {
	    var _this$pdfSidebar3;
	    this.pdfRenderingQueue.printing = !!this.printService;
	    this.pdfRenderingQueue.isThumbnailViewEnabled = ((_this$pdfSidebar3 = this.pdfSidebar) == null ? void 0 : _this$pdfSidebar3.visibleView) === SidebarView.THUMBS;
	    this.pdfRenderingQueue.renderHighestPriority();
	  },
	  beforePrint() {
	    this._printAnnotationStoragePromise = this.pdfScriptingManager.dispatchWillPrint().catch(() => {}).then(() => {
	      var _this$pdfDocument5;
	      return (_this$pdfDocument5 = this.pdfDocument) == null ? void 0 : _this$pdfDocument5.annotationStorage.print;
	    });
	    if (this.printService) {
	      return;
	    }
	    if (!this.supportsPrinting) {
	      this._otherError("pdfjs-printing-not-supported");
	      return;
	    }
	    if (!this.pdfViewer.pageViewsReady) {
	      this.l10n.get("pdfjs-printing-not-ready").then(msg => {
	        window.alert(msg);
	      });
	      return;
	    }
	    this.printService = PDFPrintServiceFactory.createPrintService({
	      pdfDocument: this.pdfDocument,
	      pagesOverview: this.pdfViewer.getPagesOverview(),
	      printContainer: this.appConfig.printContainer,
	      printResolution: AppOptions.get("printResolution"),
	      printAnnotationStoragePromise: this._printAnnotationStoragePromise
	    });
	    this.forceRendering();
	    this.setTitle();
	    this.printService.layout();
	    if (this._hasAnnotationEditors) {
	      var _this$pdfDocument6;
	      this.externalServices.reportTelemetry({
	        type: "editing",
	        data: {
	          type: "print",
	          stats: (_this$pdfDocument6 = this.pdfDocument) == null ? void 0 : _this$pdfDocument6.annotationStorage.editorStats
	        }
	      });
	    }
	  },
	  afterPrint() {
	    if (this._printAnnotationStoragePromise) {
	      this._printAnnotationStoragePromise.then(() => {
	        this.pdfScriptingManager.dispatchDidPrint();
	      });
	      this._printAnnotationStoragePromise = null;
	    }
	    if (this.printService) {
	      var _this$pdfDocument7;
	      this.printService.destroy();
	      this.printService = null;
	      (_this$pdfDocument7 = this.pdfDocument) == null ? void 0 : _this$pdfDocument7.annotationStorage.resetModified();
	    }
	    this.forceRendering();
	    this.setTitle();
	  },
	  rotatePages(delta) {
	    this.pdfViewer.pagesRotation += delta;
	  },
	  requestPresentationMode() {
	    var _this$pdfPresentation;
	    (_this$pdfPresentation = this.pdfPresentationMode) == null ? void 0 : _this$pdfPresentation.request();
	  },
	  triggerPrinting() {
	    if (this.supportsPrinting) {
	      window.print();
	    }
	  },
	  bindEvents() {
	    if (this._eventBusAbortController) {
	      return;
	    }
	    const ac = this._eventBusAbortController = new AbortController();
	    const opts = {
	      signal: ac.signal
	    };
	    const {
	      eventBus,
	      externalServices,
	      pdfDocumentProperties,
	      pdfViewer,
	      preferences
	    } = this;
	    eventBus._on("resize", onResize.bind(this), opts);
	    eventBus._on("hashchange", onHashchange.bind(this), opts);
	    eventBus._on("beforeprint", this.beforePrint.bind(this), opts);
	    eventBus._on("afterprint", this.afterPrint.bind(this), opts);
	    eventBus._on("pagerender", onPageRender.bind(this), opts);
	    eventBus._on("pagerendered", onPageRendered.bind(this), opts);
	    eventBus._on("updateviewarea", onUpdateViewarea.bind(this), opts);
	    eventBus._on("pagechanging", onPageChanging.bind(this), opts);
	    eventBus._on("scalechanging", onScaleChanging.bind(this), opts);
	    eventBus._on("rotationchanging", onRotationChanging.bind(this), opts);
	    eventBus._on("sidebarviewchanged", onSidebarViewChanged.bind(this), opts);
	    eventBus._on("pagemode", onPageMode.bind(this), opts);
	    eventBus._on("namedaction", onNamedAction.bind(this), opts);
	    eventBus._on("presentationmodechanged", evt => pdfViewer.presentationModeState = evt.state, opts);
	    eventBus._on("presentationmode", this.requestPresentationMode.bind(this), opts);
	    eventBus._on("switchannotationeditormode", evt => pdfViewer.annotationEditorMode = evt, opts);
	    eventBus._on("print", this.triggerPrinting.bind(this), opts);
	    eventBus._on("download", this.downloadOrSave.bind(this), opts);
	    eventBus._on("firstpage", () => this.page = 1, opts);
	    eventBus._on("lastpage", () => this.page = this.pagesCount, opts);
	    eventBus._on("nextpage", () => pdfViewer.nextPage(), opts);
	    eventBus._on("previouspage", () => pdfViewer.previousPage(), opts);
	    eventBus._on("zoomin", this.zoomIn.bind(this), opts);
	    eventBus._on("zoomout", this.zoomOut.bind(this), opts);
	    eventBus._on("zoomreset", this.zoomReset.bind(this), opts);
	    eventBus._on("pagenumberchanged", onPageNumberChanged.bind(this), opts);
	    eventBus._on("scalechanged", evt => pdfViewer.currentScaleValue = evt.value, opts);
	    eventBus._on("rotatecw", this.rotatePages.bind(this, 90), opts);
	    eventBus._on("rotateccw", this.rotatePages.bind(this, -90), opts);
	    eventBus._on("optionalcontentconfig", evt => pdfViewer.optionalContentConfigPromise = evt.promise, opts);
	    eventBus._on("switchscrollmode", evt => pdfViewer.scrollMode = evt.mode, opts);
	    eventBus._on("scrollmodechanged", onViewerModesChanged.bind(this, "scrollMode"), opts);
	    eventBus._on("switchspreadmode", evt => pdfViewer.spreadMode = evt.mode, opts);
	    eventBus._on("spreadmodechanged", onViewerModesChanged.bind(this, "spreadMode"), opts);
	    eventBus._on("imagealttextsettings", onImageAltTextSettings.bind(this), opts);
	    eventBus._on("documentproperties", () => pdfDocumentProperties == null ? void 0 : pdfDocumentProperties.open(), opts);
	    eventBus._on("findfromurlhash", onFindFromUrlHash.bind(this), opts);
	    eventBus._on("updatefindmatchescount", onUpdateFindMatchesCount.bind(this), opts);
	    eventBus._on("updatefindcontrolstate", onUpdateFindControlState.bind(this), opts);
	    eventBus._on("fileinputchange", onFileInputChange.bind(this), opts);
	    eventBus._on("openfile", onOpenFile.bind(this), opts);
	  },
	  bindWindowEvents() {
	    if (this._windowAbortController) {
	      return;
	    }
	    this._windowAbortController = new AbortController();
	    const {
	      eventBus,
	      appConfig: {
	        mainContainer
	      },
	      pdfViewer,
	      _windowAbortController: {
	        signal
	      }
	    } = this;
	    function addWindowResolutionChange(evt = null) {
	      if (evt) {
	        pdfViewer.refresh();
	      }
	      const mediaQueryList = window.matchMedia(`(resolution: ${window.devicePixelRatio || 1}dppx)`);
	      mediaQueryList.addEventListener("change", addWindowResolutionChange, {
	        once: true,
	        signal
	      });
	    }
	    addWindowResolutionChange();
	    window.addEventListener("wheel", onWheel.bind(this), {
	      passive: false,
	      signal
	    });
	    window.addEventListener("touchstart", onTouchStart.bind(this), {
	      passive: false,
	      signal
	    });
	    window.addEventListener("touchmove", onTouchMove.bind(this), {
	      passive: false,
	      signal
	    });
	    window.addEventListener("touchend", onTouchEnd.bind(this), {
	      passive: false,
	      signal
	    });
	    window.addEventListener("click", onClick.bind(this), {
	      signal
	    });
	    window.addEventListener("keydown", onKeyDown.bind(this), {
	      signal
	    });
	    window.addEventListener("keyup", onKeyUp.bind(this), {
	      signal
	    });
	    window.addEventListener("resize", () => eventBus.dispatch("resize", {
	      source: window
	    }), {
	      signal
	    });
	    window.addEventListener("hashchange", () => {
	      eventBus.dispatch("hashchange", {
	        source: window,
	        hash: document.location.hash.substring(1)
	      });
	    }, {
	      signal
	    });
	    window.addEventListener("beforeprint", () => eventBus.dispatch("beforeprint", {
	      source: window
	    }), {
	      signal
	    });
	    window.addEventListener("afterprint", () => eventBus.dispatch("afterprint", {
	      source: window
	    }), {
	      signal
	    });
	    window.addEventListener("updatefromsandbox", evt => {
	      eventBus.dispatch("updatefromsandbox", {
	        source: window,
	        detail: evt.detail
	      });
	    }, {
	      signal
	    });
	    if (!("onscrollend" in document.documentElement)) {
	      return;
	    }
	    ({
	      scrollTop: this._lastScrollTop,
	      scrollLeft: this._lastScrollLeft
	    } = mainContainer);
	    const scrollend = () => {
	      ({
	        scrollTop: this._lastScrollTop,
	        scrollLeft: this._lastScrollLeft
	      } = mainContainer);
	      this._isScrolling = false;
	      mainContainer.addEventListener("scroll", scroll, {
	        passive: true,
	        signal
	      });
	      mainContainer.removeEventListener("scrollend", scrollend);
	      mainContainer.removeEventListener("blur", scrollend);
	    };
	    const scroll = () => {
	      if (this._isCtrlKeyDown) {
	        return;
	      }
	      if (this._lastScrollTop === mainContainer.scrollTop && this._lastScrollLeft === mainContainer.scrollLeft) {
	        return;
	      }
	      mainContainer.removeEventListener("scroll", scroll);
	      this._isScrolling = true;
	      mainContainer.addEventListener("scrollend", scrollend, {
	        signal
	      });
	      mainContainer.addEventListener("blur", scrollend, {
	        signal
	      });
	    };
	    mainContainer.addEventListener("scroll", scroll, {
	      passive: true,
	      signal
	    });
	  },
	  unbindEvents() {
	    var _this$_eventBusAbortC;
	    (_this$_eventBusAbortC = this._eventBusAbortController) == null ? void 0 : _this$_eventBusAbortC.abort();
	    this._eventBusAbortController = null;
	  },
	  unbindWindowEvents() {
	    var _this$_windowAbortCon;
	    (_this$_windowAbortCon = this._windowAbortController) == null ? void 0 : _this$_windowAbortCon.abort();
	    this._windowAbortController = null;
	  },
	  async testingClose() {
	    var _this$_globalAbortCon, _this$findBar2, _this$l10n;
	    this.unbindEvents();
	    this.unbindWindowEvents();
	    (_this$_globalAbortCon = this._globalAbortController) == null ? void 0 : _this$_globalAbortCon.abort();
	    this._globalAbortController = null;
	    (_this$findBar2 = this.findBar) == null ? void 0 : _this$findBar2.close();
	    await Promise.all([(_this$l10n = this.l10n) == null ? void 0 : _this$l10n.destroy(), this.close()]);
	  },
	  _accumulateTicks(ticks, prop) {
	    if (this[prop] > 0 && ticks < 0 || this[prop] < 0 && ticks > 0) {
	      this[prop] = 0;
	    }
	    this[prop] += ticks;
	    const wholeTicks = Math.trunc(this[prop]);
	    this[prop] -= wholeTicks;
	    return wholeTicks;
	  },
	  _accumulateFactor(previousScale, factor, prop) {
	    if (factor === 1) {
	      return 1;
	    }
	    if (this[prop] > 1 && factor < 1 || this[prop] < 1 && factor > 1) {
	      this[prop] = 1;
	    }
	    const newFactor = Math.floor(previousScale * factor * this[prop] * 100) / (100 * previousScale);
	    this[prop] = factor / newFactor;
	    return newFactor;
	  },
	  _unblockDocumentLoadEvent() {
	    document.blockUnblockOnload == null ? void 0 : document.blockUnblockOnload(false);
	    this._unblockDocumentLoadEvent = () => {};
	  },
	  get scriptingReady() {
	    return this.pdfScriptingManager.ready;
	  }
	};
	{
	  PDFPrintServiceFactory.initGlobals(PDFViewerApplication);
	}
	{
	  const HOSTED_VIEWER_ORIGINS = ["null", "http://mozilla.github.io", "https://mozilla.github.io"];
	  var validateFileURL = function (file) {
	    if (!file) {
	      return;
	    }
	    try {
	      const viewerOrigin = new URL(window.location.href).origin || "null";
	      if (HOSTED_VIEWER_ORIGINS.includes(viewerOrigin)) {
	        return;
	      }
	      const fileOrigin = new URL(file, window.location.href).origin;
	      if (fileOrigin !== viewerOrigin) {
	        throw new Error("file origin does not match viewer's");
	      }
	    } catch (ex) {
	      PDFViewerApplication._documentError("pdfjs-loading-error", {
	        message: ex.message
	      });
	      throw ex;
	    }
	  };
	  var onFileInputChange = function (evt) {
	    var _this$pdfViewer;
	    if ((_this$pdfViewer = this.pdfViewer) != null && _this$pdfViewer.isInPresentationMode) {
	      return;
	    }
	    const file = evt.fileInput.files[0];
	    this.open({
	      url: URL.createObjectURL(file),
	      originalUrl: file.name
	    });
	  };
	  var onOpenFile = function (evt) {
	    var _this$_openFileInput;
	    (_this$_openFileInput = this._openFileInput) == null ? void 0 : _this$_openFileInput.click();
	  };
	}
	function onPageRender({
	  pageNumber
	}) {
	  if (pageNumber === this.page) {
	    var _this$toolbar4;
	    (_this$toolbar4 = this.toolbar) == null ? void 0 : _this$toolbar4.updateLoadingIndicatorState(true);
	  }
	}
	function onPageRendered({
	  pageNumber,
	  error
	}) {
	  var _this$pdfSidebar4;
	  if (pageNumber === this.page) {
	    var _this$toolbar5;
	    (_this$toolbar5 = this.toolbar) == null ? void 0 : _this$toolbar5.updateLoadingIndicatorState(false);
	  }
	  if (((_this$pdfSidebar4 = this.pdfSidebar) == null ? void 0 : _this$pdfSidebar4.visibleView) === SidebarView.THUMBS) {
	    var _this$pdfThumbnailVie6;
	    const pageView = this.pdfViewer.getPageView(pageNumber - 1);
	    const thumbnailView = (_this$pdfThumbnailVie6 = this.pdfThumbnailViewer) == null ? void 0 : _this$pdfThumbnailVie6.getThumbnail(pageNumber - 1);
	    if (pageView) {
	      thumbnailView == null ? void 0 : thumbnailView.setImage(pageView);
	    }
	  }
	  if (error) {
	    this._otherError("pdfjs-rendering-error", error);
	  }
	}
	function onPageMode({
	  mode
	}) {
	  var _this$pdfSidebar5;
	  let view;
	  switch (mode) {
	    case "thumbs":
	      view = SidebarView.THUMBS;
	      break;
	    case "bookmarks":
	    case "outline":
	      view = SidebarView.OUTLINE;
	      break;
	    case "attachments":
	      view = SidebarView.ATTACHMENTS;
	      break;
	    case "layers":
	      view = SidebarView.LAYERS;
	      break;
	    case "none":
	      view = SidebarView.NONE;
	      break;
	    default:
	      console.error('Invalid "pagemode" hash parameter: ' + mode);
	      return;
	  }
	  (_this$pdfSidebar5 = this.pdfSidebar) == null ? void 0 : _this$pdfSidebar5.switchView(view, true);
	}
	function onNamedAction(evt) {
	  var _this$appConfig$toolb2;
	  switch (evt.action) {
	    case "GoToPage":
	      (_this$appConfig$toolb2 = this.appConfig.toolbar) == null ? void 0 : _this$appConfig$toolb2.pageNumber.select();
	      break;
	    case "Find":
	      if (!this.supportsIntegratedFind) {
	        var _this$findBar3;
	        (_this$findBar3 = this.findBar) == null ? void 0 : _this$findBar3.toggle();
	      }
	      break;
	    case "Print":
	      this.triggerPrinting();
	      break;
	    case "SaveAs":
	      this.downloadOrSave();
	      break;
	  }
	}
	function onSidebarViewChanged({
	  view
	}) {
	  this.pdfRenderingQueue.isThumbnailViewEnabled = view === SidebarView.THUMBS;
	  if (this.isInitialViewSet) {
	    var _this$store;
	    (_this$store = this.store) == null ? void 0 : _this$store.set("sidebarView", view).catch(() => {});
	  }
	}
	function onUpdateViewarea({
	  location
	}) {
	  if (this.isInitialViewSet) {
	    var _this$store2;
	    (_this$store2 = this.store) == null ? void 0 : _this$store2.setMultiple({
	      page: location.pageNumber,
	      zoom: location.scale,
	      scrollLeft: location.left,
	      scrollTop: location.top,
	      rotation: location.rotation
	    }).catch(() => {});
	  }
	  if (this.appConfig.secondaryToolbar) {
	    this.appConfig.secondaryToolbar.viewBookmarkButton.href = this.pdfLinkService.getAnchorUrl(location.pdfOpenParams);
	  }
	}
	function onViewerModesChanged(name, evt) {
	  if (this.isInitialViewSet && !this.pdfViewer.isInPresentationMode) {
	    var _this$store3;
	    (_this$store3 = this.store) == null ? void 0 : _this$store3.set(name, evt.mode).catch(() => {});
	  }
	}
	function onResize() {
	  const {
	    pdfDocument,
	    pdfViewer,
	    pdfRenderingQueue
	  } = this;
	  if (pdfRenderingQueue.printing && window.matchMedia("print").matches) {
	    return;
	  }
	  if (!pdfDocument) {
	    return;
	  }
	  const currentScaleValue = pdfViewer.currentScaleValue;
	  if (currentScaleValue === "auto" || currentScaleValue === "page-fit" || currentScaleValue === "page-width") {
	    pdfViewer.currentScaleValue = currentScaleValue;
	  }
	  pdfViewer.update();
	}
	function onHashchange(evt) {
	  var _this$pdfHistory4;
	  const hash = evt.hash;
	  if (!hash) {
	    return;
	  }
	  if (!this.isInitialViewSet) {
	    this.initialBookmark = hash;
	  } else if (!((_this$pdfHistory4 = this.pdfHistory) != null && _this$pdfHistory4.popStateInProgress)) {
	    this.pdfLinkService.setHash(hash);
	  }
	}
	function onPageNumberChanged(evt) {
	  const {
	    pdfViewer
	  } = this;
	  if (evt.value !== "") {
	    this.pdfLinkService.goToPage(evt.value);
	  }
	  if (evt.value !== pdfViewer.currentPageNumber.toString() && evt.value !== pdfViewer.currentPageLabel) {
	    var _this$toolbar6;
	    (_this$toolbar6 = this.toolbar) == null ? void 0 : _this$toolbar6.setPageNumber(pdfViewer.currentPageNumber, pdfViewer.currentPageLabel);
	  }
	}
	function onImageAltTextSettings() {
	  var _this$imageAltTextSet;
	  (_this$imageAltTextSet = this.imageAltTextSettings) == null ? void 0 : _this$imageAltTextSet.open({
	    enableGuessAltText: AppOptions.get("enableGuessAltText"),
	    enableNewAltTextWhenAddingImage: AppOptions.get("enableNewAltTextWhenAddingImage")
	  });
	}
	function onFindFromUrlHash(evt) {
	  this.eventBus.dispatch("find", {
	    source: evt.source,
	    type: "",
	    query: evt.query,
	    caseSensitive: false,
	    entireWord: false,
	    highlightAll: true,
	    findPrevious: false,
	    matchDiacritics: true
	  });
	}
	function onUpdateFindMatchesCount({
	  matchesCount
	}) {
	  if (this.supportsIntegratedFind) {
	    this.externalServices.updateFindMatchesCount(matchesCount);
	  } else {
	    var _this$findBar4;
	    (_this$findBar4 = this.findBar) == null ? void 0 : _this$findBar4.updateResultsCount(matchesCount);
	  }
	}
	function onUpdateFindControlState({
	  state,
	  previous,
	  entireWord,
	  matchesCount,
	  rawQuery
	}) {
	  if (this.supportsIntegratedFind) {
	    this.externalServices.updateFindControlState({
	      result: state,
	      findPrevious: previous,
	      entireWord,
	      matchesCount,
	      rawQuery
	    });
	  } else {
	    var _this$findBar5;
	    (_this$findBar5 = this.findBar) == null ? void 0 : _this$findBar5.updateUIState(state, previous, matchesCount);
	  }
	}
	function onScaleChanging(evt) {
	  var _this$toolbar7;
	  (_this$toolbar7 = this.toolbar) == null ? void 0 : _this$toolbar7.setPageScale(evt.presetValue, evt.scale);
	  this.pdfViewer.update();
	}
	function onRotationChanging(evt) {
	  if (this.pdfThumbnailViewer) {
	    this.pdfThumbnailViewer.pagesRotation = evt.pagesRotation;
	  }
	  this.forceRendering();
	  this.pdfViewer.currentPageNumber = evt.pageNumber;
	}
	function onPageChanging({
	  pageNumber,
	  pageLabel
	}) {
	  var _this$toolbar8, _this$secondaryToolba4, _this$pdfSidebar6, _this$toolbar9;
	  (_this$toolbar8 = this.toolbar) == null ? void 0 : _this$toolbar8.setPageNumber(pageNumber, pageLabel);
	  (_this$secondaryToolba4 = this.secondaryToolbar) == null ? void 0 : _this$secondaryToolba4.setPageNumber(pageNumber);
	  if (((_this$pdfSidebar6 = this.pdfSidebar) == null ? void 0 : _this$pdfSidebar6.visibleView) === SidebarView.THUMBS) {
	    var _this$pdfThumbnailVie7;
	    (_this$pdfThumbnailVie7 = this.pdfThumbnailViewer) == null ? void 0 : _this$pdfThumbnailVie7.scrollThumbnailIntoView(pageNumber);
	  }
	  const currentPage = this.pdfViewer.getPageView(pageNumber - 1);
	  (_this$toolbar9 = this.toolbar) == null ? void 0 : _this$toolbar9.updateLoadingIndicatorState((currentPage == null ? void 0 : currentPage.renderingState) === RenderingStates.RUNNING);
	}
	function onWheel(evt) {
	  const {
	    pdfViewer,
	    supportsMouseWheelZoomCtrlKey,
	    supportsMouseWheelZoomMetaKey,
	    supportsPinchToZoom
	  } = this;
	  if (pdfViewer.isInPresentationMode) {
	    return;
	  }
	  const deltaMode = evt.deltaMode;
	  let scaleFactor = Math.exp(-evt.deltaY / 100);
	  const isBuiltInMac = false;
	  const isPinchToZoom = evt.ctrlKey && !this._isCtrlKeyDown && deltaMode === WheelEvent.DOM_DELTA_PIXEL && evt.deltaX === 0 && (Math.abs(scaleFactor - 1) < 0.05 || isBuiltInMac) && evt.deltaZ === 0;
	  const origin = [evt.clientX, evt.clientY];
	  if (isPinchToZoom || evt.ctrlKey && supportsMouseWheelZoomCtrlKey || evt.metaKey && supportsMouseWheelZoomMetaKey) {
	    evt.preventDefault();
	    if (this._isScrolling || document.visibilityState === "hidden" || this.overlayManager.active) {
	      return;
	    }
	    if (isPinchToZoom && supportsPinchToZoom) {
	      scaleFactor = this._accumulateFactor(pdfViewer.currentScale, scaleFactor, "_wheelUnusedFactor");
	      this.updateZoom(null, scaleFactor, origin);
	    } else {
	      const delta = normalizeWheelEventDirection(evt);
	      let ticks = 0;
	      if (deltaMode === WheelEvent.DOM_DELTA_LINE || deltaMode === WheelEvent.DOM_DELTA_PAGE) {
	        ticks = Math.abs(delta) >= 1 ? Math.sign(delta) : this._accumulateTicks(delta, "_wheelUnusedTicks");
	      } else {
	        const PIXELS_PER_LINE_SCALE = 30;
	        ticks = this._accumulateTicks(delta / PIXELS_PER_LINE_SCALE, "_wheelUnusedTicks");
	      }
	      this.updateZoom(ticks, null, origin);
	    }
	  }
	}
	function onTouchStart(evt) {
	  if (this.pdfViewer.isInPresentationMode || evt.touches.length < 2) {
	    return;
	  }
	  evt.preventDefault();
	  if (evt.touches.length !== 2 || this.overlayManager.active) {
	    this._touchInfo = null;
	    return;
	  }
	  let [touch0, touch1] = evt.touches;
	  if (touch0.identifier > touch1.identifier) {
	    [touch0, touch1] = [touch1, touch0];
	  }
	  this._touchInfo = {
	    touch0X: touch0.pageX,
	    touch0Y: touch0.pageY,
	    touch1X: touch1.pageX,
	    touch1Y: touch1.pageY
	  };
	}
	function onTouchMove(evt) {
	  if (!this._touchInfo || evt.touches.length !== 2) {
	    return;
	  }
	  const {
	    pdfViewer,
	    _touchInfo,
	    supportsPinchToZoom
	  } = this;
	  let [touch0, touch1] = evt.touches;
	  if (touch0.identifier > touch1.identifier) {
	    [touch0, touch1] = [touch1, touch0];
	  }
	  const {
	    pageX: page0X,
	    pageY: page0Y
	  } = touch0;
	  const {
	    pageX: page1X,
	    pageY: page1Y
	  } = touch1;
	  const {
	    touch0X: pTouch0X,
	    touch0Y: pTouch0Y,
	    touch1X: pTouch1X,
	    touch1Y: pTouch1Y
	  } = _touchInfo;
	  if (Math.abs(pTouch0X - page0X) <= 1 && Math.abs(pTouch0Y - page0Y) <= 1 && Math.abs(pTouch1X - page1X) <= 1 && Math.abs(pTouch1Y - page1Y) <= 1) {
	    return;
	  }
	  _touchInfo.touch0X = page0X;
	  _touchInfo.touch0Y = page0Y;
	  _touchInfo.touch1X = page1X;
	  _touchInfo.touch1Y = page1Y;
	  if (pTouch0X === page0X && pTouch0Y === page0Y) {
	    const v1X = pTouch1X - page0X;
	    const v1Y = pTouch1Y - page0Y;
	    const v2X = page1X - page0X;
	    const v2Y = page1Y - page0Y;
	    const det = v1X * v2Y - v1Y * v2X;
	    if (Math.abs(det) > 0.02 * Math.hypot(v1X, v1Y) * Math.hypot(v2X, v2Y)) {
	      return;
	    }
	  } else if (pTouch1X === page1X && pTouch1Y === page1Y) {
	    const v1X = pTouch0X - page1X;
	    const v1Y = pTouch0Y - page1Y;
	    const v2X = page0X - page1X;
	    const v2Y = page0Y - page1Y;
	    const det = v1X * v2Y - v1Y * v2X;
	    if (Math.abs(det) > 0.02 * Math.hypot(v1X, v1Y) * Math.hypot(v2X, v2Y)) {
	      return;
	    }
	  } else {
	    const diff0X = page0X - pTouch0X;
	    const diff1X = page1X - pTouch1X;
	    const diff0Y = page0Y - pTouch0Y;
	    const diff1Y = page1Y - pTouch1Y;
	    const dotProduct = diff0X * diff1X + diff0Y * diff1Y;
	    if (dotProduct >= 0) {
	      return;
	    }
	  }
	  evt.preventDefault();
	  const origin = [(page0X + page1X) / 2, (page0Y + page1Y) / 2];
	  const distance = Math.hypot(page0X - page1X, page0Y - page1Y) || 1;
	  const pDistance = Math.hypot(pTouch0X - pTouch1X, pTouch0Y - pTouch1Y) || 1;
	  if (supportsPinchToZoom) {
	    const newScaleFactor = this._accumulateFactor(pdfViewer.currentScale, distance / pDistance, "_touchUnusedFactor");
	    this.updateZoom(null, newScaleFactor, origin);
	  } else {
	    const PIXELS_PER_LINE_SCALE = 30;
	    const ticks = this._accumulateTicks((distance - pDistance) / PIXELS_PER_LINE_SCALE, "_touchUnusedTicks");
	    this.updateZoom(ticks, null, origin);
	  }
	}
	function onTouchEnd(evt) {
	  if (!this._touchInfo) {
	    return;
	  }
	  evt.preventDefault();
	  this._touchInfo = null;
	  this._touchUnusedTicks = 0;
	  this._touchUnusedFactor = 1;
	}
	function onClick(evt) {
	  var _this$secondaryToolba5, _appConfig$toolbar2, _appConfig$secondaryT8;
	  if (!((_this$secondaryToolba5 = this.secondaryToolbar) != null && _this$secondaryToolba5.isOpen)) {
	    return;
	  }
	  const appConfig = this.appConfig;
	  if (this.pdfViewer.containsElement(evt.target) || (_appConfig$toolbar2 = appConfig.toolbar) != null && _appConfig$toolbar2.container.contains(evt.target) && !((_appConfig$secondaryT8 = appConfig.secondaryToolbar) != null && _appConfig$secondaryT8.toggleButton.contains(evt.target))) {
	    this.secondaryToolbar.close();
	  }
	}
	function onKeyUp(evt) {
	  if (evt.key === "Control") {
	    this._isCtrlKeyDown = false;
	  }
	}
	function onKeyDown(evt) {
	  var _this$secondaryToolba6, _this$findBar7, _this$pdfCursorTools, _this$pdfCursorTools2, _this$pdfSidebar7;
	  this._isCtrlKeyDown = evt.key === "Control";
	  if (this.overlayManager.active) {
	    return;
	  }
	  const {
	    eventBus,
	    pdfViewer
	  } = this;
	  const isViewerInPresentationMode = pdfViewer.isInPresentationMode;
	  let handled = false,
	    ensureViewerFocused = false;
	  const cmd = (evt.ctrlKey ? 1 : 0) | (evt.altKey ? 2 : 0) | (evt.shiftKey ? 4 : 0) | (evt.metaKey ? 8 : 0);
	  if (cmd === 1 || cmd === 8 || cmd === 5 || cmd === 12) {
	    switch (evt.keyCode) {
	      case 70:
	        if (!this.supportsIntegratedFind && !evt.shiftKey) {
	          var _this$findBar6;
	          (_this$findBar6 = this.findBar) == null ? void 0 : _this$findBar6.open();
	          handled = true;
	        }
	        break;
	      case 71:
	        if (!this.supportsIntegratedFind) {
	          const {
	            state
	          } = this.findController;
	          if (state) {
	            const newState = {
	              source: window,
	              type: "again",
	              findPrevious: cmd === 5 || cmd === 12
	            };
	            eventBus.dispatch("find", {
	              ...state,
	              ...newState
	            });
	          }
	          handled = true;
	        }
	        break;
	      case 61:
	      case 107:
	      case 187:
	      case 171:
	        this.zoomIn();
	        handled = true;
	        break;
	      case 173:
	      case 109:
	      case 189:
	        this.zoomOut();
	        handled = true;
	        break;
	      case 48:
	      case 96:
	        if (!isViewerInPresentationMode) {
	          setTimeout(() => {
	            this.zoomReset();
	          });
	          handled = false;
	        }
	        break;
	      case 38:
	        if (isViewerInPresentationMode || this.page > 1) {
	          this.page = 1;
	          handled = true;
	          ensureViewerFocused = true;
	        }
	        break;
	      case 40:
	        if (isViewerInPresentationMode || this.page < this.pagesCount) {
	          this.page = this.pagesCount;
	          handled = true;
	          ensureViewerFocused = true;
	        }
	        break;
	    }
	  }
	  if (cmd === 1 || cmd === 8) {
	    switch (evt.keyCode) {
	      case 83:
	        eventBus.dispatch("download", {
	          source: window
	        });
	        handled = true;
	        break;
	      case 79:
	        {
	          eventBus.dispatch("openfile", {
	            source: window
	          });
	          handled = true;
	        }
	        break;
	    }
	  }
	  if (cmd === 3 || cmd === 10) {
	    switch (evt.keyCode) {
	      case 80:
	        this.requestPresentationMode();
	        handled = true;
	        this.externalServices.reportTelemetry({
	          type: "buttons",
	          data: {
	            id: "presentationModeKeyboard"
	          }
	        });
	        break;
	      case 71:
	        if (this.appConfig.toolbar) {
	          this.appConfig.toolbar.pageNumber.select();
	          handled = true;
	        }
	        break;
	    }
	  }
	  if (handled) {
	    if (ensureViewerFocused && !isViewerInPresentationMode) {
	      pdfViewer.focus();
	    }
	    evt.preventDefault();
	    return;
	  }
	  const curElement = getActiveOrFocusedElement();
	  const curElementTagName = curElement == null ? void 0 : curElement.tagName.toUpperCase();
	  if (curElementTagName === "INPUT" || curElementTagName === "TEXTAREA" || curElementTagName === "SELECT" || curElementTagName === "BUTTON" && (evt.keyCode === 13 || evt.keyCode === 32) || curElement != null && curElement.isContentEditable) {
	    if (evt.keyCode !== 27) {
	      return;
	    }
	  }
	  if (cmd === 0) {
	    let turnPage = 0,
	      turnOnlyIfPageFit = false;
	    switch (evt.keyCode) {
	      case 38:
	        if (this.supportsCaretBrowsingMode) {
	          this.moveCaret(true, false);
	          handled = true;
	          break;
	        }
	      case 33:
	        if (pdfViewer.isVerticalScrollbarEnabled) {
	          turnOnlyIfPageFit = true;
	        }
	        turnPage = -1;
	        break;
	      case 8:
	        if (!isViewerInPresentationMode) {
	          turnOnlyIfPageFit = true;
	        }
	        turnPage = -1;
	        break;
	      case 37:
	        if (this.supportsCaretBrowsingMode) {
	          return;
	        }
	        if (pdfViewer.isHorizontalScrollbarEnabled) {
	          turnOnlyIfPageFit = true;
	        }
	      case 75:
	      case 80:
	        turnPage = -1;
	        break;
	      case 27:
	        if ((_this$secondaryToolba6 = this.secondaryToolbar) != null && _this$secondaryToolba6.isOpen) {
	          this.secondaryToolbar.close();
	          handled = true;
	        }
	        if (!this.supportsIntegratedFind && (_this$findBar7 = this.findBar) != null && _this$findBar7.opened) {
	          this.findBar.close();
	          handled = true;
	        }
	        break;
	      case 40:
	        if (this.supportsCaretBrowsingMode) {
	          this.moveCaret(false, false);
	          handled = true;
	          break;
	        }
	      case 34:
	        if (pdfViewer.isVerticalScrollbarEnabled) {
	          turnOnlyIfPageFit = true;
	        }
	        turnPage = 1;
	        break;
	      case 13:
	      case 32:
	        if (!isViewerInPresentationMode) {
	          turnOnlyIfPageFit = true;
	        }
	        turnPage = 1;
	        break;
	      case 39:
	        if (this.supportsCaretBrowsingMode) {
	          return;
	        }
	        if (pdfViewer.isHorizontalScrollbarEnabled) {
	          turnOnlyIfPageFit = true;
	        }
	      case 74:
	      case 78:
	        turnPage = 1;
	        break;
	      case 36:
	        if (isViewerInPresentationMode || this.page > 1) {
	          this.page = 1;
	          handled = true;
	          ensureViewerFocused = true;
	        }
	        break;
	      case 35:
	        if (isViewerInPresentationMode || this.page < this.pagesCount) {
	          this.page = this.pagesCount;
	          handled = true;
	          ensureViewerFocused = true;
	        }
	        break;
	      case 83:
	        (_this$pdfCursorTools = this.pdfCursorTools) == null ? void 0 : _this$pdfCursorTools.switchTool(CursorTool.SELECT);
	        break;
	      case 72:
	        (_this$pdfCursorTools2 = this.pdfCursorTools) == null ? void 0 : _this$pdfCursorTools2.switchTool(CursorTool.HAND);
	        break;
	      case 82:
	        this.rotatePages(90);
	        break;
	      case 115:
	        (_this$pdfSidebar7 = this.pdfSidebar) == null ? void 0 : _this$pdfSidebar7.toggle();
	        break;
	    }
	    if (turnPage !== 0 && (!turnOnlyIfPageFit || pdfViewer.currentScaleValue === "page-fit")) {
	      if (turnPage > 0) {
	        pdfViewer.nextPage();
	      } else {
	        pdfViewer.previousPage();
	      }
	      handled = true;
	    }
	  }
	  if (cmd === 4) {
	    switch (evt.keyCode) {
	      case 13:
	      case 32:
	        if (!isViewerInPresentationMode && pdfViewer.currentScaleValue !== "page-fit") {
	          break;
	        }
	        pdfViewer.previousPage();
	        handled = true;
	        break;
	      case 38:
	        this.moveCaret(true, true);
	        handled = true;
	        break;
	      case 40:
	        this.moveCaret(false, true);
	        handled = true;
	        break;
	      case 82:
	        this.rotatePages(-90);
	        break;
	    }
	  }
	  if (!handled && !isViewerInPresentationMode) {
	    if (evt.keyCode >= 33 && evt.keyCode <= 40 || evt.keyCode === 32 && curElementTagName !== "BUTTON") {
	      ensureViewerFocused = true;
	    }
	  }
	  if (ensureViewerFocused && !pdfViewer.containsElement(curElement)) {
	    pdfViewer.focus();
	  }
	  if (handled) {
	    evt.preventDefault();
	  }
	}
	function beforeUnload(evt) {
	  evt.preventDefault();
	  evt.returnValue = "";
	  return false;
	}

	Object.keys(ui_pdfjs).forEach(function (key) { exports[key] = ui_pdfjs[key]; });
	exports.PDFViewerApplication = PDFViewerApplication;
	exports.AppOptions = AppOptions;

}((this.BX.UI.Pdfjs = this.BX.UI.Pdfjs || {}),BX.UI.Pdfjs));
//# sourceMappingURL=pdfjs-viewer.bundle.js.map

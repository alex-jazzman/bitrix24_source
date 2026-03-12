/* eslint-disable */
this.BX = this.BX || {};
(function (exports,main_core) {
	'use strict';

	function _classPrivateMethodInitSpec(obj, privateSet) { _checkPrivateRedeclaration(obj, privateSet); privateSet.add(obj); }
	function _classPrivateFieldInitSpec(obj, privateMap, value) { _checkPrivateRedeclaration(obj, privateMap); privateMap.set(obj, value); }
	function _checkPrivateRedeclaration(obj, privateCollection) { if (privateCollection.has(obj)) { throw new TypeError("Cannot initialize the same private elements twice on an object"); } }
	function _classPrivateMethodGet(receiver, privateSet, fn) { if (!privateSet.has(receiver)) { throw new TypeError("attempted to get private field on non-instance"); } return fn; }
	var _container = /*#__PURE__*/new WeakMap();
	var _messageId = /*#__PURE__*/new WeakMap();
	var _prefix = /*#__PURE__*/new WeakMap();
	var _iframeResizeHandler = /*#__PURE__*/new WeakMap();
	var _iframe = /*#__PURE__*/new WeakMap();
	var _bindIframeEvents = /*#__PURE__*/new WeakSet();
	var _buildIframeContent = /*#__PURE__*/new WeakSet();
	var _buildStyles = /*#__PURE__*/new WeakSet();
	var _buildScript = /*#__PURE__*/new WeakSet();
	var MessageBody = /*#__PURE__*/function () {
	  function MessageBody(options) {
	    babelHelpers.classCallCheck(this, MessageBody);
	    _classPrivateMethodInitSpec(this, _buildScript);
	    _classPrivateMethodInitSpec(this, _buildStyles);
	    _classPrivateMethodInitSpec(this, _buildIframeContent);
	    _classPrivateMethodInitSpec(this, _bindIframeEvents);
	    _classPrivateFieldInitSpec(this, _container, {
	      writable: true,
	      value: void 0
	    });
	    _classPrivateFieldInitSpec(this, _messageId, {
	      writable: true,
	      value: void 0
	    });
	    _classPrivateFieldInitSpec(this, _prefix, {
	      writable: true,
	      value: void 0
	    });
	    _classPrivateFieldInitSpec(this, _iframeResizeHandler, {
	      writable: true,
	      value: null
	    });
	    _classPrivateFieldInitSpec(this, _iframe, {
	      writable: true,
	      value: null
	    });
	    babelHelpers.classPrivateFieldSet(this, _container, options === null || options === void 0 ? void 0 : options.container);
	    babelHelpers.classPrivateFieldSet(this, _messageId, options === null || options === void 0 ? void 0 : options.messageId);
	    if (!babelHelpers.classPrivateFieldGet(this, _container) || !babelHelpers.classPrivateFieldGet(this, _messageId)) {
	      return;
	    }
	    babelHelpers.classPrivateFieldSet(this, _prefix, options.prefix || 'mail-msg');
	  }
	  babelHelpers.createClass(MessageBody, [{
	    key: "getIframeId",
	    value: function getIframeId() {
	      return "".concat(babelHelpers.classPrivateFieldGet(this, _prefix), "-iframe-").concat(babelHelpers.classPrivateFieldGet(this, _messageId));
	    }
	  }, {
	    key: "getMessageType",
	    value: function getMessageType() {
	      return "".concat(babelHelpers.classPrivateFieldGet(this, _prefix), "-resize-iframe");
	    }
	  }, {
	    key: "getStylesMessageType",
	    value: function getStylesMessageType() {
	      return "".concat(babelHelpers.classPrivateFieldGet(this, _prefix), "-set-styles");
	    }
	  }, {
	    key: "getBodyClass",
	    value: function getBodyClass() {
	      return "".concat(babelHelpers.classPrivateFieldGet(this, _prefix), "-view-body");
	    }
	  }, {
	    key: "getQuoteUnfoldedClass",
	    value: function getQuoteUnfoldedClass() {
	      return "".concat(babelHelpers.classPrivateFieldGet(this, _prefix), "-quote-unfolded");
	    }
	  }, {
	    key: "getIframe",
	    value: function getIframe() {
	      return babelHelpers.classPrivateFieldGet(this, _iframe);
	    }
	  }, {
	    key: "renderTo",
	    value: function renderTo(html) {
	      var iframeId = this.getIframeId();
	      if (document.getElementById(iframeId)) {
	        return;
	      }
	      var iframeContent = _classPrivateMethodGet(this, _buildIframeContent, _buildIframeContent2).call(this, html);
	      var blob = new Blob([iframeContent], {
	        type: 'text/html'
	      });
	      var blobUrl = URL.createObjectURL(blob);
	      var iframe = document.createElement('iframe');
	      iframe.id = iframeId;
	      iframe.src = blobUrl;
	      iframe.width = '100%';
	      iframe.sandbox = 'allow-popups allow-popups-to-escape-sandbox allow-scripts';
	      iframe.referrerPolicy = 'no-referrer';
	      main_core.Dom.addClass(iframe, "".concat(babelHelpers.classPrivateFieldGet(this, _prefix), "-iframe"));
	      main_core.Event.bind(iframe, 'load', function () {
	        URL.revokeObjectURL(blobUrl);
	      });
	      main_core.Dom.clean(babelHelpers.classPrivateFieldGet(this, _container));
	      main_core.Dom.append(iframe, babelHelpers.classPrivateFieldGet(this, _container));
	      babelHelpers.classPrivateFieldSet(this, _iframe, iframe);
	      _classPrivateMethodGet(this, _bindIframeEvents, _bindIframeEvents2).call(this, iframe);
	    }
	  }, {
	    key: "destroy",
	    value: function destroy() {
	      if (babelHelpers.classPrivateFieldGet(this, _iframeResizeHandler)) {
	        main_core.Event.unbind(window, 'message', babelHelpers.classPrivateFieldGet(this, _iframeResizeHandler));
	        babelHelpers.classPrivateFieldSet(this, _iframeResizeHandler, null);
	      }
	      if (babelHelpers.classPrivateFieldGet(this, _iframe)) {
	        main_core.Dom.remove(babelHelpers.classPrivateFieldGet(this, _iframe));
	        babelHelpers.classPrivateFieldSet(this, _iframe, null);
	      }
	    }
	  }]);
	  return MessageBody;
	}();
	function _bindIframeEvents2(iframe) {
	  var _this = this;
	  var sendStylesToIframe = function sendStylesToIframe() {
	    if (!iframe || !iframe.contentWindow) {
	      return;
	    }
	    var computedStyle = getComputedStyle(document.body);
	    iframe.contentWindow.postMessage({
	      type: _this.getStylesMessageType(),
	      styles: {
	        '--ui-font-family-primary': computedStyle.getPropertyValue('--ui-font-family-primary'),
	        '--ui-font-family-helvetica': computedStyle.getPropertyValue('--ui-font-family-helvetica'),
	        '--ui-font-weight-bold': computedStyle.getPropertyValue('--ui-font-weight-bold'),
	        '--ui-font-size-md': computedStyle.getPropertyValue('--ui-font-size-md')
	      }
	    }, '*');
	  };
	  main_core.Event.bind(iframe, 'load', sendStylesToIframe);
	  sendStylesToIframe();
	  if (!babelHelpers.classPrivateFieldGet(this, _iframeResizeHandler)) {
	    babelHelpers.classPrivateFieldSet(this, _iframeResizeHandler, function (event) {
	      if (event.data && event.data.type === _this.getMessageType()) {
	        var targetIframe = document.getElementById(_this.getIframeId());
	        if (targetIframe && event.data.id === babelHelpers.classPrivateFieldGet(_this, _messageId)) {
	          var newHeight = event.data.height;
	          main_core.Dom.style(targetIframe, 'height', "".concat(newHeight, "px"));
	        }
	      }
	    });
	    main_core.Event.bind(window, 'message', babelHelpers.classPrivateFieldGet(this, _iframeResizeHandler));
	  }
	}
	function _buildIframeContent2(html) {
	  var styles = _classPrivateMethodGet(this, _buildStyles, _buildStyles2).call(this);
	  var script = _classPrivateMethodGet(this, _buildScript, _buildScript2).call(this);
	  var bodyClass = this.getBodyClass();
	  return "\n\t\t\t<!DOCTYPE html>\n\t\t\t<html>\n\t\t\t\t<head>\n\t\t\t\t\t<meta charset=\"UTF-8\">\n\t\t\t\t\t<meta name=\"referrer\" content=\"no-referrer\">\n\t\t\t\t\t<base target=\"_blank\">\n\t\t\t\t\t<style>".concat(styles, "</style>\n\t\t\t\t\t<script>").concat(script, "</script>\n\t\t\t\t</head>\n\t\t\t\t<body>\n\t\t\t\t\t<div class=\"").concat(bodyClass, "\">").concat(html, "</div>\n\t\t\t\t</body>\n\t\t\t</html>\n\t\t");
	}
	function _buildStyles2() {
	  var bodyClass = this.getBodyClass();
	  var quoteUnfoldedClass = this.getQuoteUnfoldedClass();
	  return "\n\t\t\tbody {\n\t\t\t\tmargin: 0;\n\t\t\t\tpadding: 0;\n\t\t\t\tfont-family: var(--ui-font-family-primary, var(--ui-font-family-helvetica)), sans-serif;\n\t\t\t\tfont-size: var(--ui-font-size-md, 14px);\n\t\t\t}\n\t\t\timg { max-width: 100%; height: auto; }\n\t\t\t.".concat(bodyClass, " h1 {\n\t\t\t\tcolor: black;\n\t\t\t\tdisplay: block;\n\t\t\t\tfont-size: 2em;\n\t\t\t\tfont-weight: var(--ui-font-weight-bold);\n\t\t\t}\n\t\t\t.").concat(bodyClass, " a:-webkit-any-link {\n\t\t\t\tcolor: -webkit-link;\n\t\t\t\ttext-decoration: underline;\n\t\t\t\tcursor: pointer;\n\t\t\t}\n\t\t\t.").concat(bodyClass, " {\n\t\t\t\tposition: relative;\n\t\t\t\tpadding: 10px 20px 33px 20px;\n\t\t\t\tcolor: #535c69;\n\t\t\t\toverflow-x: auto;\n\t\t\t\tword-wrap: break-word;\n\t\t\t}\n\t\t\t.").concat(bodyClass, " blockquote {\n\t\t\t\tmargin: 0 0 0 5px;\n\t\t\t\tpadding: 5px 5px 5px 8px;\n\t\t\t\tborder-left: 4px solid #e2e3e5;\n\t\t\t}\n\t\t\t.").concat(bodyClass, " blockquote:not(.").concat(quoteUnfoldedClass, ") {\n\t\t\t\tposition: relative;\n\t\t\t\toverflow: hidden;\n\t\t\t\tbox-sizing: border-box;\n\t\t\t\twidth: 32px;\n\t\t\t\theight: 12px;\n\t\t\t\tmargin: 0 0 0 10px;\n\t\t\t\tborder: none;\n\t\t\t\tcursor: pointer;\n\t\t\t}\n\t\t\t.").concat(bodyClass, " blockquote:not(.").concat(quoteUnfoldedClass, "):after {\n\t\t\t\tcontent: \"...\";\n\t\t\t\tdisplay: block;\n\t\t\t\tposition: absolute;\n\t\t\t\ttop: 0;\n\t\t\t\tleft: 0;\n\t\t\t\tright: 0;\n\t\t\t\tbottom: 0;\n\t\t\t\tcolor: #535c69;\n\t\t\t\ttext-align: center;\n\t\t\t\tline-height: 12px;\n\t\t\t\tfont-size: 10px;\n\t\t\t\tbackground: #e2e3e5;\n\t\t\t}\n\t\t");
	}
	function _buildScript2() {
	  var messageType = this.getMessageType();
	  var stylesMessageType = this.getStylesMessageType();
	  var quoteUnfoldedClass = this.getQuoteUnfoldedClass();
	  return "\n\t\t\tconst MESSAGE_ID = ".concat(babelHelpers.classPrivateFieldGet(this, _messageId), ";\n\t\t\tconst MESSAGE_TYPE = \"").concat(messageType, "\";\n\t\t\tconst STYLES_MESSAGE_TYPE = \"").concat(stylesMessageType, "\";\n\t\t\tconst QUOTE_UNFOLDED_CLASS = \"").concat(quoteUnfoldedClass, "\";\n\n\t\t\tfunction sendHeight()\n\t\t\t{\n\t\t\t\tconst body = document.body;\n\t\t\t\tconst html = document.documentElement;\n\t\t\t\tconst height = Math.max(\n\t\t\t\t\tbody.scrollHeight, body.offsetHeight,\n\t\t\t\t\thtml.clientHeight, html.scrollHeight, html.offsetHeight\n\t\t\t\t);\n\t\t\t\tparent.postMessage({ type: MESSAGE_TYPE, height: height, id: MESSAGE_ID }, '*');\n\t\t\t}\n\n\t\t\twindow.addEventListener(\"message\", function(event) {\n\t\t\t\tif (event.data && event.data.type === STYLES_MESSAGE_TYPE)\n\t\t\t\t{\n\t\t\t\t\tconst styles = event.data.styles;\n\t\t\t\t\tconst root = document.documentElement;\n\t\t\t\t\tfor (let key in styles)\n\t\t\t\t\t{\n\t\t\t\t\t\tif (styles.hasOwnProperty(key))\n\t\t\t\t\t\t{\n\t\t\t\t\t\t\troot.style.setProperty(key, styles[key]);\n\t\t\t\t\t\t}\n\t\t\t\t\t}\n\n\t\t\t\t\twindow.requestAnimationFrame(sendHeight);\n\t\t\t\t}\n\t\t\t});\n\n\t\t\twindow.addEventListener(\"load\", function() {\n\t\t\t\tconst quotes = document.querySelectorAll(\"blockquote\");\n\t\t\t\tfor (let i = 0; i < quotes.length; i++)\n\t\t\t\t{\n\t\t\t\t\tquotes[i].addEventListener(\"click\", function() {\n\t\t\t\t\t\tthis.classList.add(QUOTE_UNFOLDED_CLASS);\n\t\t\t\t\t\tsendHeight();\n\t\t\t\t\t});\n\t\t\t\t}\n\n\t\t\t\tsendHeight();\n\t\t\t});\n\n\t\t\tconst resizeObserver = new ResizeObserver(() => {\n\t\t\t\tsendHeight();\n\t\t\t});\n\n\t\t\tif (document.body)\n\t\t\t{\n\t\t\t\tresizeObserver.observe(document.body);\n\t\t\t}\n\t\t\telse\n\t\t\t{\n\t\t\t\twindow.addEventListener('DOMContentLoaded', () => resizeObserver.observe(document.body));\n\t\t\t}\n\t\t");
	}

	exports.MessageBody = MessageBody;

}((this.BX.Mail = this.BX.Mail || {}),BX));
//# sourceMappingURL=message-body.bundle.js.map

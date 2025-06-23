/* eslint-disable */
this.BX = this.BX || {};
this.BX.Landing = this.BX.Landing || {};
(function (exports,main_core,landing_metrika) {
	'use strict';

	var DiskFile = /*#__PURE__*/function () {
	  /**
	   * Constructor.
	   */
	  function DiskFile() {
	    babelHelpers.classCallCheck(this, DiskFile);
	    document.addEventListener('click', this.onClick.bind(this));
	  }

	  /**
	   * Click callback.
	   *
	   * @return {void}
	   */
	  babelHelpers.createClass(DiskFile, [{
	    key: "onClick",
	    value: function onClick(event) {
	      var target = event.target;
	      var href = target.getAttribute('href') || target.getAttribute('data-pseudo-url') && JSON.parse(target.getAttribute('data-pseudo-url')).href;
	      if (!href) {
	        var parentNode = target.parentNode;
	        if (parentNode.nodeName === 'A') {
	          href = parentNode.getAttribute('href');
	          target = parentNode;
	        } else {
	          var grandParentNode = parentNode.parentNode;
	          if (grandParentNode.nodeName === 'A') {
	            href = grandParentNode.getAttribute('href');
	            target = grandParentNode;
	          }
	        }
	      }
	      if (target.getAttribute('data-viewer-type')) {
	        return;
	      }
	      if (href && href.indexOf('/bitrix/services/main/ajax.php?action=landing.api.diskFile.download') === 0) {
	        BX.ajax.get(href.replace('landing.api.diskFile.download', 'landing.api.diskFile.view'), function (data) {
	          if (typeof data === 'string') {
	            data = JSON.parse(data);
	          }
	          if (!data.data) {
	            return;
	          }
	          Object.keys(data.data).map(function (key) {
	            target.setAttribute(key, data.data[key]);
	          });
	          target.click();
	        });
	        event.preventDefault();
	        event.stopPropagation();
	        return false;
	      }
	    }
	  }]);
	  return DiskFile;
	}();

	var Analytics = /*#__PURE__*/function () {
	  /**
	   * Constructor.
	   */
	  function Analytics(options) {
	    var _this = this;
	    babelHelpers.classCallCheck(this, Analytics);
	    this.isPublished = options.isPublished;
	    var blocks = [].slice.call(document.getElementsByClassName('block-wrapper'));
	    if (main_core.Type.isArray(blocks) && blocks.length > 0) {
	      blocks.forEach(function (block) {
	        block.addEventListener('click', _this.onClick.bind(_this));
	      });
	    }
	  }

	  /**
	   * Click callback.
	   *
	   * @param {MouseEvent} event
	   * @return {void}
	   */
	  babelHelpers.createClass(Analytics, [{
	    key: "onClick",
	    value: function onClick(event) {
	      var target = event.target;
	      if (!(target.tagName.toLowerCase() === 'a' || target.parentNode && target.parentNode.tagName.toLowerCase() === 'a' || target.firstElementChild && target.firstElementChild.tagName.toLowerCase() === 'a' || target.tagName.toLowerCase() === 'button' || target.hasAttribute('data-pseudo-url'))) {
	        return;
	      }
	      var widgetId = '';
	      var blockWrapper = event.currentTarget;
	      blockWrapper.classList.forEach(function (className) {
	        if (className !== 'block-wrapper') {
	          widgetId += className;
	        }
	      });
	      widgetId = widgetId.replace('block-', '');
	      var metrika = new landing_metrika.Metrika(true);
	      metrika.sendData({
	        category: 'vibe',
	        event: 'click_on_button',
	        c_section: this.isPublished ? 'active_page' : 'preview_page',
	        params: {
	          'widget-id': widgetId
	        }
	      });
	    }
	  }]);
	  return Analytics;
	}();

	var Pseudolinks = /*#__PURE__*/function () {
	  /**
	   * Constructor.
	   */
	  function Pseudolinks() {
	    var _this = this;
	    babelHelpers.classCallCheck(this, Pseudolinks);
	    var checkPageLoaded = setInterval(function () {
	      if (document.readyState === 'complete') {
	        _this.initPseudoLinks();
	        clearInterval(checkPageLoaded);
	      }
	    }, 500);
	  }

	  /**
	   * Click callback.
	   *
	   * @return {void}
	   */
	  babelHelpers.createClass(Pseudolinks, [{
	    key: "initPseudoLinks",
	    value: function initPseudoLinks() {
	      var _this2 = this;
	      var pseudoLinks = [].slice.call(document.querySelectorAll('[data-pseudo-url*="{"]'));
	      if (pseudoLinks.length > 0) {
	        pseudoLinks.forEach(function (link) {
	          var linkOptionsJson = link.getAttribute('data-pseudo-url');
	          var linkOptions = JSON.parse(linkOptionsJson);
	          if (linkOptions.href && linkOptions.enabled && linkOptions.href.indexOf('/bitrix/services/main/ajax.php?action=landing.api.diskFile.download') !== 0) {
	            if (linkOptions.target === '_self' || linkOptions.target === '_blank') {
	              link.addEventListener('click', function (event) {
	                event.preventDefault();
	                var url = null;
	                try {
	                  url = new URL(linkOptions.href);
	                } catch (error) {
	                  console.error(error);
	                }
	                if (url) {
	                  var isSameHost = url.hostname === window.location.hostname;
	                  var isIframe = url.searchParams.get('IFRAME') === 'Y';
	                  if (isSameHost && !isIframe) {
	                    var isDifferentPath = url.pathname !== window.location.pathname;
	                    if (isDifferentPath) {
	                      BX.addClass(document.body, 'landing-page-transition');
	                      linkOptions.href = url.href;
	                      setTimeout(function () {
	                        _this2.openPseudoLinks(linkOptions, event);
	                      }, 400);
	                      setTimeout(function () {
	                        BX.removeClass(document.body, 'landing-page-transition');
	                      }, 3000);
	                    }
	                  } else {
	                    _this2.openPseudoLinks(linkOptions, event);
	                  }
	                }
	              });
	            }
	          }
	        });
	      }
	    }
	  }, {
	    key: "openPseudoLinks",
	    value: function openPseudoLinks(linkOptions, event) {
	      if (linkOptions.href.indexOf('/bitrix/services/main/ajax.php?action=landing.api.diskFile.download') === 0) {
	        return;
	      }
	      if (linkOptions.query) {
	        linkOptions.href += linkOptions.href.indexOf('?') === -1 ? '?' : '&';
	        linkOptions.href += linkOptions.query;
	      }
	      if (this.isValidURL(linkOptions.href)) {
	        top.open(linkOptions.href, linkOptions.target);
	      }
	    }
	  }, {
	    key: "isValidURL",
	    value: function isValidURL(url) {
	      try {
	        new URL(url);
	        return true;
	      } catch (_unused) {
	        return false;
	      }
	    }
	  }]);
	  return Pseudolinks;
	}();

	exports.DiskFile = DiskFile;
	exports.Analytics = Analytics;
	exports.Pseudolinks = Pseudolinks;

}((this.BX.Landing.Pub = this.BX.Landing.Pub || {}),BX,BX.Landing));
//# sourceMappingURL=script.js.map

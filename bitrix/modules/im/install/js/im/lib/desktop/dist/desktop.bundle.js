/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
(function (exports, main_core) {
	'use strict';

	class Desktop {
		clientVersion = 0;
		eventHandlers = {};
		htmlWrapperHead = null;
		addCustomEvent(eventName, eventHandler) {
			const realHandler = event => {
				eventHandler.apply(window, [...Object.values(event.detail)]);
			};
			if (!this.eventHandlers[eventName]) {
				this.eventHandlers[eventName] = [];
			}
			this.eventHandlers[eventName].push(realHandler);
			window.addEventListener(eventName, realHandler);
			return true;
		}
		removeCustomEvents(eventName) {
			if (!this.eventHandlers[eventName]) {
				return false;
			}
			this.eventHandlers[eventName].forEach(eventHandler => {
				window.removeEventListener(eventName, eventHandler);
			});
			this.eventHandlers[eventName] = [];
			return true;
		}
		onCustomEvent(windowTarget, eventName, eventParams) {
			if (arguments.length === 2) {
				eventParams = eventName;
				eventName = windowTarget;
				windowTarget = 'all';
			} else if (arguments.length < 2) {
				return false;
			}
			const convertedEventParams = {
				...eventParams
			};
			if (windowTarget === 'all') {
				const mainWindow = opener ? opener : top;
				mainWindow.BXWindows.forEach(windowItem => {
					if (windowItem && windowItem.name !== '' && windowItem.BXDesktopWindow && windowItem.BXDesktopWindow.DispatchCustomEvent) {
						windowItem.BXDesktopWindow.DispatchCustomEvent(eventName, convertedEventParams);
					}
				});
				mainWindow.BXDesktopWindow.DispatchCustomEvent(eventName, convertedEventParams);
			} else if (main_core.Type.isObject(windowTarget) && windowTarget.hasOwnProperty("BXDesktopWindow")) {
				windowTarget.BXDesktopWindow.DispatchCustomEvent(eventName, convertedEventParams);
			} else {
				const existingWindow = this.findWindow(windowTarget);
				if (existingWindow) {
					existingWindow.BXDesktopWindow.DispatchCustomEvent(eventName, convertedEventParams);
				}
			}
			return true;
		}
		findWindow(name = 'main') {
			const mainWindow = opener ? opener : top;
			if (name === 'main') {
				return mainWindow;
			} else {
				return mainWindow.BXWindows.find(windowItem => {
					return windowItem.name === name;
				});
			}
		}
		setWindowResizable(enabled = true) {
			BXDesktopWindow.SetProperty("resizable", enabled);
			return true;
		}
		setWindowClosable(enabled = true) {
			BXDesktopWindow.SetProperty("closable", enabled);
			return true;
		}
		setWindowTitle(title) {
			if (main_core.Type.isUndefined(title)) {
				return false;
			}
			title = title.trim();
			if (title.length <= 0) {
				return false;
			}
			BXDesktopWindow.SetProperty("title", title);
			return true;
		}
		setWindowPosition(params) {
			BXDesktopWindow.SetProperty("position", params);
			return true;
		}
		setWindowMinSize(params) {
			if (!params.Width || !params.Height) {
				return false;
			}
			BXDesktopWindow.SetProperty("minClientSize", params);
			return true;
		}
		getHtmlPage(content, jsContent, initImJs, bodyClass = '') {
			if (window.BXIM) {
				return window.BXIM.desktop.getHtmlPage(content, jsContent, initImJs, bodyClass);
			}
			content = content || '';
			jsContent = jsContent || '';
			bodyClass = bodyClass || '';
			if (main_core.Type.isDomNode(content)) {
				content = content.outerHTML;
			}
			if (main_core.Type.isDomNode(jsContent)) {
				jsContent = jsContent.outerHTML;
			}
			if (jsContent !== '') {
				jsContent = '<script>BX.ready(function(){' + jsContent + '});</script>';
			}
			if (this.isPopupPageLoaded()) {
				return '<div class="im-desktop im-desktop-popup ' + bodyClass + '">' + content + jsContent + '</div>';
			} else {
				if (this.htmlWrapperHead == null) {
					this.htmlWrapperHead = document.head.outerHTML.replace(/BX\.PULL\.start\([^)]*\);/g, '');
				}
				return '<!DOCTYPE html><html>' + this.htmlWrapperHead + '<body class="im-desktop im-desktop-popup ' + bodyClass + '">' + content + jsContent + '</body></html>';
			}
		}
		isPopupPageLoaded() {
			if (!this.enableInVersion(45)) {
				return false;
			}
			if (window.BXIM && !window.BXIM.isUtfMode) {
				return false;
			}
			if (!BXInternals) {
				return false;
			}
			if (!BXInternals.PopupTemplate) {
				return false;
			}
			if (BXInternals.PopupTemplate === '#PLACEHOLDER#') {
				return false;
			}
			return true;
		}
		enableInVersion(version) {
			if (main_core.Type.isUndefined(BXDesktopSystem)) {
				return false;
			}
			return this.getApiVersion() >= parseInt(version);
		}
		getApiVersion() {
			if (main_core.Type.isUndefined(BXDesktopSystem)) {
				return 0;
			}
			if (!this.clientVersion) {
				this.clientVersion = BXDesktopSystem.GetProperty('versionParts');
			}
			return this.clientVersion[3];
		}
		isReady() {
			return typeof BXDesktopSystem != "undefined";
		}
	}

	exports.Desktop = Desktop;

})(this.BX.Messenger.Lib = this.BX.Messenger.Lib || {}, BX);
//# sourceMappingURL=desktop.bundle.js.map

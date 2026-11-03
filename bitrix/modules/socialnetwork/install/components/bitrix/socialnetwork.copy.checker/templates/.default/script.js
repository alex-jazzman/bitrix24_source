/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core) {
	'use strict';

	class RequestSender extends main_core.Event.EventEmitter {
		constructor(options) {
			super(options);
			options = {
				...{
					signedParameters: ""
				},
				...options
			};
			this.signedParameters = options.signedParameters;
		}
		deleteErrorOption() {
			return new Promise((resolve, reject) => {
				main_core.ajax.runComponentAction("bitrix:socialnetwork.copy.checker", "deleteErrorOption", {
					mode: "class",
					signedParameters: this.signedParameters,
					data: {}
				}).then(resolve, reject);
			});
		}
	}

	class CopyChecker {
		constructor(options) {
			options = {
				...{
					signedParameters: "",
					errorAlertContainerId: "",
					errorAlertCloseButtonId: ""
				},
				...options
			};
			this.signedParameters = options.signedParameters;
			this.errorAlertContainerId = options.errorAlertContainerId;
			this.errorAlertCloseButtonId = options.errorAlertCloseButtonId;
			this.init();
		}
		init() {
			this.requestSender = new RequestSender({
				signedParameters: this.signedParameters
			});
			this.errorAlertContainer = document.getElementById(this.errorAlertContainerId);
			this.errorAlertCloseButton = document.getElementById(this.errorAlertCloseButtonId);
			if (this.errorAlertCloseButton) {
				main_core.Event.bind(this.errorAlertCloseButton, "click", this.onCloseAlert.bind(this));
			}
		}
		onCloseAlert() {
			this.requestSender.deleteErrorOption().then(response => {
				this.errorAlertContainer.remove();
			}).catch(response => {});
		}
	}

	exports.CopyChecker = CopyChecker;

})(this.BX.Socialnetwork = this.BX.Socialnetwork || {}, BX);
//# sourceMappingURL=script.js.map

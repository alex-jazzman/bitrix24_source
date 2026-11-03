import {Event} from "main.core";
import {RequestSender} from "./request.sender";

export class CopyChecker
{
	constructor(options)
	{
		options = {...{
			signedParameters: "",
			errorAlertContainerId: "",
			errorAlertCloseButtonId: ""
		}, ...options};

		this.signedParameters = options.signedParameters;

		this.errorAlertContainerId = options.errorAlertContainerId;
		this.errorAlertCloseButtonId = options.errorAlertCloseButtonId;

		this.init();
	}

	init()
	{
		this.requestSender = new RequestSender({
			signedParameters: this.signedParameters,
		});

		this.errorAlertContainer = document.getElementById(this.errorAlertContainerId);
		this.errorAlertCloseButton = document.getElementById(this.errorAlertCloseButtonId);
		if (this.errorAlertCloseButton)
		{
			Event.bind(this.errorAlertCloseButton, "click", this.onCloseAlert.bind(this));
		}
	}

	onCloseAlert()
	{
		this.requestSender.deleteErrorOption()
		.then((response) => {
			this.errorAlertContainer.remove();
		}).catch((response) => {});
	}
}

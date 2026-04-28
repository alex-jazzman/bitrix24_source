import { Type, ajax } from 'main.core';
import { Analytics } from './analytics';

export class Transport
{
	#componentName: string;
	#signedParameters: string;
	#onSuccess: Function;
	onError: Function;
	#analytics: Analytics;

	constructor(options)
	{
		this.#componentName = options.componentName;
		this.#signedParameters = options.signedParameters;
		this.#analytics = options.analytics;
		this.#onSuccess = options.onSuccess;
		this.onError = options.onError;
	}

	send(request, onError: ?Function = null, analyticsData: Object = null): Promise
	{
		request.data.analyticsData = analyticsData ?? this.#analytics.getDataForAction();

		return ajax.runComponentAction(this.#componentName, request.action, {
			signedParameters: this.#signedParameters,
			mode: Type.isStringFilled(request.mode) ? request.mode : 'ajax',
			method: Type.isStringFilled(request.method) ? request.method : 'post',
			data: request.data,
			analyticsLabel: request.analyticsLabel,
		})
			.then((response) => {
				this.#onSuccess(response);

				return response;
			})
			.catch((reject) => {
				if (onError)
				{
					onError(reject);
				}
				else
				{
					this.onError(reject);
				}
			});
	}

	sendAction(request, onError: ?Function = null, analyticsData: Object = null): Promise
	{
		request.data.analyticsData = analyticsData ?? this.#analytics.getDataForAction();

		return ajax.runAction(request.action, {
			signedParameters: this.#signedParameters,
			mode: Type.isStringFilled(request.mode) ? request.mode : 'ajax',
			method: Type.isStringFilled(request.method) ? request.method : 'post',
			data: request.data,
			analytics: request.analytics,
		})
			.then((response) => {
				this.#onSuccess(response);

				return response;
			})
			.catch((reject) => {
				if (onError)
				{
					onError(reject);
				}
				else
				{
					this.onError(reject);
				}
			});
	}
}

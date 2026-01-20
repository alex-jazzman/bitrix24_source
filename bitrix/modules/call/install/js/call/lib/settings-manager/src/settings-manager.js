import { Extension } from 'main.core';

export type CallSettingsType = {
	jwtCallsEnabled?: boolean,
	plainCallsUseJwt?: boolean,
	plainCallFollowUpEnabled ?: boolean,
	plainCallCloudRecordingEnabled ?: boolean,
	callBalancerUrl?: string,
};

class CallSettings
{
	constructor()
	{
		this.jwtCallsEnabled = false;
		this.plainCallsUseJwt = false;
		this.plainCallFollowUpEnabled = false;
		this.plainCallCloudRecordingEnabled = false;
		this.callBalancerUrl = '';

		if (Extension.getSettings('call.core').call)
		{
			this.setup(Extension.getSettings('call.core').call);
		}
	}

	setup(settings: CallSettingsType)
	{
		if (settings.jwtCallsEnabled !== undefined)
		{
			this.jwtCallsEnabled = settings.jwtCallsEnabled;
		}

		if (settings.plainCallsUseJwt !== undefined)
		{
			this.plainCallsUseJwt = settings.plainCallsUseJwt;
		}

		if (settings.plainCallFollowUpEnabled !== undefined)
		{
			this.plainCallFollowUpEnabled = settings.plainCallFollowUpEnabled;
		}

		if (settings.plainCallCloudRecordingEnabled !== undefined)
		{
			this.plainCallCloudRecordingEnabled = settings.plainCallCloudRecordingEnabled;
		}

		if (settings.callBalancerUrl !== undefined)
		{
			this.callBalancerUrl = settings.callBalancerUrl;
		}
	}

	get jwtCallsEnabled(): boolean
	{
		return this._jwtCallsEnabled;
	}

	set jwtCallsEnabled(value: boolean)
	{
		this._jwtCallsEnabled = value;
	}

	get plainCallsUseJwt(): boolean
	{
		return this._plainCallsUseJwt;
	}

	set plainCallsUseJwt(value: boolean)
	{
		this._plainCallsUseJwt = value;
	}

	get callBalancerUrl(): string
	{
		return this._callBalancerUrl;
	}

	set callBalancerUrl(value: string)
	{
		this._callBalancerUrl = value;
	}

	get plainCallFollowUpEnabled(): boolean
	{
		return this.isJwtInPlainCallsEnabled && this._plainCallFollowUpEnabled;
	}

	set plainCallFollowUpEnabled(value: boolean)
	{
		this._plainCallFollowUpEnabled = value;
	}

	get plainCallCloudRecordingEnabled(): boolean
	{
		return this.isJwtInPlainCallsEnabled && this._plainCallCloudRecordingEnabled;
	}

	set plainCallCloudRecordingEnabled(value: boolean)
	{
		this._plainCallCloudRecordingEnabled = value;
	}

	isJwtInPlainCallsEnabled(): boolean
	{
		return this.jwtCallsEnabled && this.plainCallsUseJwt;
	}
}

export const CallSettingsManager = new CallSettings();

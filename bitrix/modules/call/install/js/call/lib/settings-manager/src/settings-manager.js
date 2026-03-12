import { Extension, Type } from 'main.core';

export type CallSettingsType = {
	jwtCallsEnabled?: boolean,
	plainCallsUseJwt?: boolean,
	plainCallFollowUpEnabled ?: boolean,
	plainCallCloudRecordingEnabled ?: boolean,
	callBalancerUrl?: string,
	noiseSuppressionEnabled?: boolean,
	accidentLogSendIntervalSecs?: number,
	accidentLogGroupMaxAgeSecs?: number,
};

const defaultNoiseSuppressionEnabled = false;

class CallSettings
{
	#accidentLogSendIntervalSecs = 0;
	#accidentLogGroupMaxAgeSecs = 0;
	#noiseSuppressionEnabled = defaultNoiseSuppressionEnabled;
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

		if (settings.noiseSuppressionEnabled !== undefined)
		{
			this.noiseSuppressionEnabled = settings.noiseSuppressionEnabled;
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

		if (Type.isNumber(settings.accidentLogSendIntervalSecs) && settings.accidentLogSendIntervalSecs > 0)
		{
			this.accidentLogSendIntervalSecs = settings.accidentLogSendIntervalSecs;
		}

		if (Type.isNumber(settings.accidentLogGroupMaxAgeSecs) && settings.accidentLogGroupMaxAgeSecs > 0)
		{
			this.accidentLogGroupMaxAgeSecs = settings.accidentLogGroupMaxAgeSecs;
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

	get noiseSuppressionEnabled(): boolean
	{
		return this.#noiseSuppressionEnabled ?? defaultNoiseSuppressionEnabled;
	}

	set noiseSuppressionEnabled(value: boolean)
	{
		this.#noiseSuppressionEnabled = value;
	}

	get accidentLogSendIntervalSecs(): number
	{
		return this.#accidentLogSendIntervalSecs || 0;
	}

	set accidentLogSendIntervalSecs(value: number)
	{
		this.#accidentLogSendIntervalSecs = value || 0;
	}

	get accidentLogGroupMaxAgeSecs(): number
	{
		return this.#accidentLogGroupMaxAgeSecs || 0;
	}

	set accidentLogGroupMaxAgeSecs(value: number)
	{
		this.#accidentLogGroupMaxAgeSecs = value || 0;
	}
}

export const CallSettingsManager = new CallSettings();

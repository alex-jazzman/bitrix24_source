import { Extension, Type } from 'main.core';

export type CallSettingsType = {
	jwtCallsEnabled?: boolean;
	plainCallsUseJwt?: boolean;
	plainCallFollowUpEnabled?: boolean;
	plainCallCloudRecordingEnabled?: boolean;
	callBalancerUrl?: string;
	noiseSuppressionEnabled?: boolean;
	accidentLogSendIntervalSecs?: number;
	accidentLogGroupMaxAgeSecs?: number;
};

class CallSettings
{
	#accidentLogSendIntervalSecs = 0;
	#accidentLogGroupMaxAgeSecs = 0;
	#noiseSuppressionEnabled = false;
	#jwtCallsEnabled = false;
	#plainCallsUseJwt = false;
	#callBalancerUrl = '';
	#plainCallFollowUpEnabled = false;
	#plainCallCloudRecordingEnabled = false;
	constructor()
	{
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
		return this.#jwtCallsEnabled;
	}

	set jwtCallsEnabled(value: boolean)
	{
		this.#jwtCallsEnabled = value;
	}

	get plainCallsUseJwt(): boolean
	{
		return this.#plainCallsUseJwt;
	}

	set plainCallsUseJwt(value: boolean)
	{
		this.#plainCallsUseJwt = value;
	}

	get callBalancerUrl(): string
	{
		return this.#callBalancerUrl;
	}

	set callBalancerUrl(value: string)
	{
		this.#callBalancerUrl = value;
	}

	get plainCallFollowUpEnabled(): boolean
	{
		// @ts-expect-error [call-ts] isJwtInPlainCallsEnabled is a method, not a getter; add () to fix;
		return this.isJwtInPlainCallsEnabled && this.#plainCallFollowUpEnabled;
	}

	set plainCallFollowUpEnabled(value: boolean)
	{
		this.#plainCallFollowUpEnabled = value;
	}

	get plainCallCloudRecordingEnabled(): boolean
	{
		// @ts-expect-error [call-ts] isJwtInPlainCallsEnabled is a method, not a getter; add () to fix;
		return this.isJwtInPlainCallsEnabled && this.#plainCallCloudRecordingEnabled;
	}

	set plainCallCloudRecordingEnabled(value: boolean)
	{
		this.#plainCallCloudRecordingEnabled = value;
	}

	isJwtInPlainCallsEnabled(): boolean
	{
		return this.jwtCallsEnabled && this.plainCallsUseJwt;
	}

	get noiseSuppressionEnabled(): boolean
	{
		return this.#noiseSuppressionEnabled;
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

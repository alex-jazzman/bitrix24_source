/* eslint-disable */
type CallSettingsType = {
	jwtCallsEnabled?: boolean;
	plainCallsUseJwt?: boolean;
	plainCallFollowUpEnabled?: boolean;
	plainCallCloudRecordingEnabled?: boolean;
	callBalancerUrl?: string;
	noiseSuppressionEnabled?: boolean;
	accidentLogSendIntervalSecs?: number;
	accidentLogGroupMaxAgeSecs?: number;
};

declare namespace BX.Call.Lib {
	const CallSettingsManager: CallSettings;

	class CallSettings {
		constructor();
		setup(settings: CallSettingsType): void;
		get jwtCallsEnabled(): boolean;
		set jwtCallsEnabled(value: boolean);
		get plainCallsUseJwt(): boolean;
		set plainCallsUseJwt(value: boolean);
		get callBalancerUrl(): string;
		set callBalancerUrl(value: string);
		get plainCallFollowUpEnabled(): boolean;
		set plainCallFollowUpEnabled(value: boolean);
		get plainCallCloudRecordingEnabled(): boolean;
		set plainCallCloudRecordingEnabled(value: boolean);
		isJwtInPlainCallsEnabled(): boolean;
		get noiseSuppressionEnabled(): boolean;
		set noiseSuppressionEnabled(value: boolean);
		get accidentLogSendIntervalSecs(): number;
		set accidentLogSendIntervalSecs(value: number);
		get accidentLogGroupMaxAgeSecs(): number;
		set accidentLogGroupMaxAgeSecs(value: number);
	}
}

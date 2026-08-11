/* eslint-disable */
type CurrentDevices = {
	microphoneId: string;
	speakerId: string;
	cameraId: string;
};

declare namespace BX.Call.Lib {
	class HardwareManager extends BX.Event.EventEmitter {
		Events: {
			initialized: string;
			deviceChanged: string;
		};
		initialized: boolean;
		updating: boolean;
		initPromise: Promise<void> | null;
		constructor();
		init(): Promise<void>;
		checkPermissions(): Promise<{
			cameraPermission: PermissionStatus;
			microphonePermission: PermissionStatus;
		}>;
		getUserMedia(constraints: MediaStreamConstraints): Promise<MediaStream>;
		enumerateDevices(): Promise<MediaDeviceInfo[]>;
		get cameraList(): Record<string, string>;
		get microphoneList(): Record<string, string>;
		get audioOutputList(): Record<string, string>;
		get defaultMicrophone(): string;
		set defaultMicrophone(microphoneId: string);
		get defaultCamera(): string;
		set defaultCamera(cameraId: string);
		get defaultSpeaker(): string;
		set defaultSpeaker(speakerId: string);
		hasCamera(): boolean;
		hasMicrophone(): boolean;
		getMicrophoneList(): MediaDeviceInfo[];
		getCameraList(): MediaDeviceInfo[];
		getSpeakerList(): MediaDeviceInfo[];
		canSelectSpeaker(): boolean;
		updateDeviceList(): Promise<void>;
		filterDeviceList(browserDeviceList: MediaDeviceInfo[]): MediaDeviceInfo[];
		isDeviceInBlackList(device: MediaDeviceInfo): boolean;
		onNavigatorDeviceChanged(): void;
		getDefaultDeviceIdByGroupId(groupId: string | undefined, deviceKind: string): string | undefined;
		getDeviceGroupIdByDeviceId(deviceId: string, deviceKind: string): string | undefined;
		getCurrentDeviceList(): Promise<MediaDeviceInfo[]>;
		getRemovedUsedDevices(devices: MediaDeviceInfo[], currentDevices: CurrentDevices): MediaDeviceInfo[];
		checkMicrophonePermission(): Promise<void>;
	}
}

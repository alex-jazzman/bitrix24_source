import { Type } from 'main.core';
import { EventEmitter } from 'main.core.events';

const lsKey = {
	defaultMicrophone: 'bx-im-settings-default-microphone',
	defaultCamera: 'bx-im-settings-default-camera',
	defaultSpeaker: 'bx-im-settings-default-speaker',
};

const Events = {
	initialized: 'initialized',
	deviceChanged: 'deviceChange',
};

type CodedError = Error & { code: string };

type CurrentDevices = { microphoneId: string; speakerId: string; cameraId: string };

export class HardwareManager extends EventEmitter
{
	Events = Events;

	initialized = false;
	updating = false;
	initPromise: Promise<void> | null = null;

	#currentDeviceList: MediaDeviceInfo[] = [];

	constructor()
	{
		super();

		this.setEventNamespace('BX.Call.HardwareManager');
	}

	init()
	{
		if (this.initialized)
		{
			return Promise.resolve();
		}

		if (this.initPromise)
		{
			return this.initPromise;
		}

		void this.checkPermissions();

		this.initPromise = new Promise((resolve, reject) => {
			this.enumerateDevices()
				.then((deviceList) => {
					this.#currentDeviceList = this.filterDeviceList(deviceList);

					// TODO: to think
					// eslint-disable-next-line @bitrix24/bitrix24-rules/no-native-events-binding
					navigator.mediaDevices.addEventListener(
						'devicechange',
						// @ts-expect-error [call-ts] wait BX.debounce to ts
						// eslint-disable-next-line @bitrix24/bitrix24-rules/no-bx
						BX.debounce(this.onNavigatorDeviceChanged.bind(this), 500),
					);
					this.initialized = true;
					this.initPromise = null;
					this.emit(Events.initialized, {});
					resolve();
				})
				.catch((e) => {
					this.initPromise = null;
					reject(e);
				});
		});

		return this.initPromise;
	}

	async checkPermissions()
	{
		const cameraPermission = await navigator.permissions.query({ name: 'camera' });
		const microphonePermission = await navigator.permissions.query({ name: 'microphone' });

		cameraPermission.onchange = () => {
			this.getCurrentDeviceList();
		};

		microphonePermission.onchange = () => {
			this.getCurrentDeviceList();
		};

		return { cameraPermission, microphonePermission };
	}

	async getUserMedia(constraints: MediaStreamConstraints): Promise<MediaStream>
	{
		if (!navigator.mediaDevices?.getUserMedia)
		{
			const error = new Error('NO_WEBRTC') as CodedError;
			error.code = 'NO_WEBRTC';
			throw error;
		}

		const attemptGetUserMedia = async (mediaConstraints: MediaStreamConstraints): Promise<MediaStream> => {
			const stream = await navigator.mediaDevices.getUserMedia(mediaConstraints);
			if (this.initialized)
			{
				void this.updateDeviceList();
			}

			return stream;
		};

		try
		{
			return await attemptGetUserMedia(constraints);
		}
		catch (err)
		{
			if (err instanceof Error && err.name === 'OverconstrainedError')
			{
				const relaxed = this.#relaxExactToIdeal(constraints, (err as any).constraint);
				if (relaxed !== constraints)
				{
					console.warn(`[Hardware] OverconstrainedError on "${(err as any).constraint}", retrying with ideal`);

					return attemptGetUserMedia(relaxed);
				}
			}
			throw err;
		}
	}

	#relaxExactToIdeal(constraints: MediaStreamConstraints, constraintName: string)
	{
		let changed = false;

		const relax = (trackConstraints: MediaTrackConstraints | boolean | undefined) => {
			if (!trackConstraints || !Type.isObject(trackConstraints))
			{
				return trackConstraints;
			}

			const prop = (trackConstraints as Record<string, unknown>)[constraintName];
			if (prop && Type.isObject(prop) && 'exact' in prop)
			{
				changed = true;
				const { exact, ...rest } = prop;

				return { ...trackConstraints, [constraintName]: { ...rest, ideal: exact } };
			}

			return trackConstraints;
		};

		const result = {
			...constraints,
			audio: relax(constraints.audio),
			video: relax(constraints.video),
		};

		return changed ? result : constraints;
	}

	async enumerateDevices()
	{
		if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices)
		{
			const error = new Error('NO_WEBRTC') as CodedError;
			error.code = 'NO_WEBRTC';
			throw error;
		}

		return navigator.mediaDevices.enumerateDevices();
	}

	get cameraList()
	{
		return this.#getDeviceMap('videoinput');
	}

	get microphoneList()
	{
		return this.#getDeviceMap('audioinput');
	}

	get audioOutputList()
	{
		return this.#getDeviceMap('audiooutput');
	}

	get defaultMicrophone()
	{
		let microphoneId = localStorage?.getItem(lsKey.defaultMicrophone) ?? '';

		if ((!microphoneId || !this.microphoneList[microphoneId]) && Object.keys(this.microphoneList).length > 0)
		{
			// previous solution with ternary operator
			// has been replaced with two separate conditions
			// because some systems / browsers don't create a duplicate for the default audio device
			if (Object.keys(this.microphoneList).includes('default'))
			{
				microphoneId = this.getDefaultDeviceIdByGroupId(
					this.getDeviceGroupIdByDeviceId('default', 'audioinput'),
					'audioinput',
				) ?? '';
			}

			if (!microphoneId)
			{
				microphoneId = Object.keys(this.microphoneList)[0];
			}

			return microphoneId;
		}

		return this.microphoneList[microphoneId] ? microphoneId : '';
	}

	set defaultMicrophone(microphoneId)
	{
		if (localStorage)
		{
			localStorage.setItem(lsKey.defaultMicrophone, microphoneId);
		}
	}

	get defaultCamera()
	{
		const cameraId = localStorage?.getItem(lsKey.defaultCamera) ?? '';

		if ((!cameraId || !this.cameraList[cameraId]) && Object.keys(this.cameraList).length > 0)
		{
			return Object.keys(this.cameraList)[0];
		}

		return this.cameraList[cameraId] ? cameraId : '';
	}

	set defaultCamera(cameraId)
	{
		if (localStorage)
		{
			localStorage.setItem(lsKey.defaultCamera, cameraId);
		}
	}

	get defaultSpeaker()
	{
		let speakerId = localStorage?.getItem(lsKey.defaultSpeaker) ?? '';

		const audioOutputList = this.audioOutputList;
		const outputDeviceIds = Object.keys(audioOutputList);

		const speakerNotFound = !speakerId || !(speakerId in audioOutputList);

		if (speakerNotFound && outputDeviceIds.length > 0)
		{
			if (outputDeviceIds.includes('default'))
			{
				const groupId = this.getDeviceGroupIdByDeviceId('default', 'audiooutput');
				speakerId = this.getDefaultDeviceIdByGroupId(groupId, 'audiooutput') ?? '';
			}
			else
			{
				speakerId = outputDeviceIds[0];
			}

			return speakerId;
		}

		return speakerId in audioOutputList ? speakerId : '';
	}

	set defaultSpeaker(speakerId: string)
	{
		if (localStorage)
		{
			localStorage.setItem(lsKey.defaultSpeaker, speakerId);
		}
	}

	hasCamera()
	{
		if (!this.initialized)
		{
			throw new Error('HardwareManager is not initialized yet');
		}

		return Object.keys(this.cameraList).length > 0;
	}

	hasMicrophone()
	{
		if (!this.initialized)
		{
			throw new Error('HardwareManager is not initialized yet');
		}

		return Object.keys(this.microphoneList).length > 0;
	}

	getMicrophoneList()
	{
		if (!this.initialized)
		{
			throw new Error('HardwareManager is not initialized yet');
		}

		return Object.values(this.#currentDeviceList).filter(
			(deviceInfo) => deviceInfo.kind === 'audioinput' && deviceInfo.deviceId !== 'default',
		);
	}

	getCameraList()
	{
		if (!this.initialized)
		{
			throw new Error('HardwareManager is not initialized yet');
		}

		return Object.values(this.#currentDeviceList).filter((deviceInfo) => deviceInfo.kind === 'videoinput');
	}

	getSpeakerList()
	{
		if (!this.initialized)
		{
			throw new Error('HardwareManager is not initialized yet');
		}

		return Object.values(this.#currentDeviceList).filter(
			(deviceInfo) => deviceInfo.kind === 'audiooutput' && deviceInfo.deviceId !== 'default',
		);
	}

	canSelectSpeaker()
	{
		return 'setSinkId' in HTMLMediaElement.prototype;
	}

	async updateDeviceList()
	{
		if (this.updating)
		{
			return;
		}
		this.updating = true;
		const removedDevices = this.#currentDeviceList;
		const addedDevices: MediaDeviceInfo[] = [];

		const shouldSkipDeviceChangedEvent = this.#currentDeviceList.every(
			(deviceInfo) => deviceInfo.deviceId === '' && deviceInfo.label === '',
		);

		try
		{
			const devices = await this.enumerateDevices();
			const filteredDevices = this.filterDeviceList(devices);
			filteredDevices.forEach((deviceInfo) => {
				const index = removedDevices.findIndex((dev) => dev.kind === deviceInfo.kind
					&& dev.deviceId === deviceInfo.deviceId
					&& dev.groupId === deviceInfo.groupId);
				if (index === -1)
				{
					addedDevices.push(deviceInfo);
				}
				else
				{
					removedDevices.splice(index, 1);
				}
			});

			this.#currentDeviceList = filteredDevices;

			if (!shouldSkipDeviceChangedEvent)
			{
				this.emit(Events.deviceChanged, {
					added: addedDevices,
					removed: removedDevices,
				});
			}
		}
		finally
		{
			this.updating = false;
		}
	}

	filterDeviceList(browserDeviceList: MediaDeviceInfo[])
	{
		return browserDeviceList.filter((device) => {
			switch (device.kind)
			{
				case 'audioinput':
					return device.deviceId !== 'communications' && !this.isDeviceInBlackList(device);
				case 'audiooutput':
					return device.deviceId !== 'communications' && !this.isDeviceInBlackList(device);
				default:
					return true;
			}
		});
	}

	isDeviceInBlackList(device: MediaDeviceInfo): boolean
	{
		const deviceBlackList = ['(virtual)', 'zoomaudiodevice', 'microsoft teams audio', 'bitrixaudio'];

		return deviceBlackList.some((item) => device.label.toLowerCase().includes(item));
	}

	onNavigatorDeviceChanged()
	{
		if (!this.initialized)
		{
			return;
		}

		void this.updateDeviceList();
	}

	#getDeviceMap(deviceKind: string)
	{
		const result: Record<string, string> = {};

		if (!this.initialized)
		{
			throw new Error('HardwareManager is not initialized yet');
		}

		for (let i = 0; i < this.#currentDeviceList.length; i++)
		{
			if (this.#currentDeviceList[i].kind === deviceKind)
			{
				result[this.#currentDeviceList[i].deviceId] = this.#currentDeviceList[i].label;
			}
		}

		return result;
	}

	getDefaultDeviceIdByGroupId(groupId: string | undefined, deviceKind: string): string | undefined
	{
		return this.#currentDeviceList.find(
			(device) => device.groupId === groupId && device.deviceId !== 'default' && device.kind === deviceKind,
		)?.deviceId;
	}

	getDeviceGroupIdByDeviceId(deviceId: string, deviceKind: string): string | undefined
	{
		return this.#currentDeviceList.find(
			(device) => device.deviceId === deviceId && device.kind === deviceKind,
		)?.groupId;
	}

	async getCurrentDeviceList()
	{
		const deviceList = await this.enumerateDevices();
		this.#currentDeviceList = this.filterDeviceList(deviceList);

		return this.#currentDeviceList;
	}

	getRemovedUsedDevices(devices: MediaDeviceInfo[], currentDevices: CurrentDevices)
	{
		return devices.filter((device) => {
			switch (device.kind)
			{
				case 'audioinput':
					return device.deviceId === currentDevices.microphoneId;
				case 'audiooutput':
					return device.deviceId === currentDevices.speakerId;
				case 'videoinput':
					return device.deviceId === currentDevices.cameraId;
				default:
					return false;
			}
		});
	}

	async checkMicrophonePermission()
	{
		if (!navigator.permissions)
		{
			return;
		}

		const micPermissions = await navigator.permissions.query({ name: 'microphone' });
		if (micPermissions.state === 'denied')
		{
			const error = new Error('Permission denied') as CodedError;
			error.code = 'NotAllowedError';
			throw error;
		}
	}
}

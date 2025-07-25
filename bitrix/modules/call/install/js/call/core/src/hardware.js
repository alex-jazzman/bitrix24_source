import {EventEmitter} from 'main.core.events'
import {DesktopApi} from 'im.v2.lib.desktop-api';

const lsKey = {
	defaultMicrophone: 'bx-im-settings-default-microphone',
	defaultCamera: 'bx-im-settings-default-camera',
	defaultSpeaker: 'bx-im-settings-default-speaker',
	enableMicAutoParameters: 'bx-im-settings-enable-mic-auto-parameters',
	preferHd: 'bx-im-settings-camera-prefer-hd',
	enableMirroring: 'bx-im-settings-camera-enable-mirroring'
};

const Events = {
	initialized: "initialized",
	deviceChanged: "deviceChange",
	onChangeMirroringVideo: "onChangeMirroringVideo",
	onChangeMicrophoneMuted: "onChangeMicrophoneMuted",
	onChangeCameraOn: "onChangeCameraOn",
};

class HardwareManager extends EventEmitter
{
	Events = Events

	constructor()
	{
		super();
		this.setEventNamespace('BX.Call.HardwareManager')

		this.initialized = false;
		this._currentDeviceList = [];
		this.updating = false;
		this._isCameraOn = false;
		this._isMicrophoneMuted = false;
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

		this.initPromise = new Promise((resolve, reject) =>
		{
			this.enumerateDevices()
				.then((deviceList) =>
				{
					this._currentDeviceList = this.filterDeviceList(deviceList);

					navigator.mediaDevices.addEventListener('devicechange', BX.debounce(this.onNavigatorDeviceChanged.bind(this), 500));
					this.initialized = true;
					this.initPromise = null;
					this.emit(Events.initialized, {});
					resolve();
				})
				.catch((e) =>
				{
					this.initPromise = null;
					reject(e)
				});
		})

		return this.initPromise;
	}

	enumerateDevices()
	{
		return new Promise((resolve, reject) =>
		{
			if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices)
			{
				return reject("NO_WEBRTC");
			}
			navigator.mediaDevices.enumerateDevices().then(devices => resolve(devices))
		});
	}

	get cameraList()
	{
		return this._getDeviceMap("videoinput");
	}

	get microphoneList()
	{
		return this._getDeviceMap("audioinput");
	}

	get audioOutputList()
	{
		return this._getDeviceMap("audiooutput");
	}

	get defaultMicrophone()
	{
		let microphoneId = localStorage ? localStorage.getItem(lsKey.defaultMicrophone) : '';

		if (
			(!microphoneId || !this.microphoneList[microphoneId])
			&& Object.keys(this.microphoneList).length
		)
		{
			// previous solution with ternary operator
			// has been replaced with two separate conditions
			// because some systems / browsers don't create a duplicate for the default audio device
			if (Object.keys(this.microphoneList).includes('default'))
			{
				microphoneId = this.getDefaultDeviceIdByGroupId(this.getDeviceGroupIdByDeviceId('default', 'audioinput'), 'audioinput');
			}

			if (!microphoneId)
			{
				microphoneId = Object.keys(this.microphoneList)[0];
			}

			return  microphoneId;
		}
		return this.microphoneList[microphoneId] ? microphoneId : '';
	}

	set defaultMicrophone(microphoneId)
	{
		if (localStorage)
		{
			localStorage.setItem(lsKey.defaultMicrophone, microphoneId)
		}
	}

	get defaultCamera()
	{
		const cameraId = localStorage ? localStorage.getItem(lsKey.defaultCamera) : '';

		if (
			(!cameraId || !this.cameraList[cameraId])
			&& Object.keys(this.cameraList).length
		)
		{
			return Object.keys(this.cameraList)[0];
		}

		return this.cameraList[cameraId] ? cameraId : '';
	}

	set defaultCamera(cameraId)
	{
		if (localStorage)
		{
			localStorage.setItem(lsKey.defaultCamera, cameraId)
		}
	}

	get defaultSpeaker()
	{
		let speakerId = localStorage ? localStorage.getItem(lsKey.defaultSpeaker) : '';

		if (
			(!speakerId || this.audioOutputList[speakerId])
			&& Object.keys(this.audioOutputList).length
		)
		{
			speakerId = Object.keys(this.audioOutputList).includes('default')
				? this.getDefaultDeviceIdByGroupId(this.getDeviceGroupIdByDeviceId('default', 'audiooutput'), 'audiooutput')
				: Object.keys(this.audioOutputList)[0]
			;

			return  speakerId;
		}
		return this.audioOutputList[speakerId] ? speakerId : '';
	}

	set defaultSpeaker(speakerId: string)
	{
		if (localStorage)
		{
			localStorage.setItem(lsKey.defaultSpeaker, speakerId)
		}
	}

	get enableMicAutoParameters(): boolean
	{
		return localStorage ? (localStorage.getItem(lsKey.enableMicAutoParameters) !== 'N') : true;
	}

	set enableMicAutoParameters(enableMicAutoParameters: boolean)
	{
		if (localStorage)
		{
			localStorage.setItem(lsKey.enableMicAutoParameters, enableMicAutoParameters ? 'Y' : 'N')
		}
	}

	get preferHdQuality(): boolean
	{
		return localStorage ? (localStorage.getItem(lsKey.preferHd) !== 'N') : true;
	}

	set preferHdQuality(preferHdQuality: boolean)
	{
		if (localStorage)
		{
			localStorage.setItem(lsKey.preferHd, preferHdQuality ? 'Y' : 'N')
		}
	}

	get enableMirroring(): boolean
	{
		return localStorage ? (localStorage.getItem(lsKey.enableMirroring) !== 'N') : true;
	}

	set enableMirroring(enableMirroring: boolean)
	{
		if (this.enableMirroring !== enableMirroring)
		{
			this.emit(Events.onChangeMirroringVideo, {enableMirroring: enableMirroring});

			if (DesktopApi.isDesktop())
			{
				DesktopApi.emit(Events.onChangeMirroringVideo, [enableMirroring]);
			}
			if (localStorage)
			{
				localStorage.setItem(lsKey.enableMirroring, enableMirroring ? 'Y' : 'N');
			}
		}
	}

	get isCameraOn()
	{
		return this._isCameraOn;
	}

	set isCameraOn(isCameraOn)
	{
		if (this._isCameraOn !== isCameraOn)
		{
			this._isCameraOn = isCameraOn;
			this.emit(Events.onChangeCameraOn, {isCameraOn: this._isCameraOn});
		}
	}
	
	/* 
	
	the setter "isCameraOn" is duplicated by that function  
	to emit additional params in "onChangeCameraOn" event
	
	for task-565624 off all participants mic/cam/screenshare
	
	*/
	
	setIsCameraOn(options) 
	{
		if (this._isCameraOn !== options.isCameraOn)
		{
			this._isCameraOn = options.isCameraOn;
			this.emit(Events.onChangeCameraOn, options);
		}
	}

	get isMicrophoneMuted()
	{
		return this._isMicrophoneMuted;
	}

	set isMicrophoneMuted(isMicrophoneMuted)
	{
		if (this._isMicrophoneMuted !== isMicrophoneMuted)
		{
			this._isMicrophoneMuted = isMicrophoneMuted;
			this.emit(Events.onChangeMicrophoneMuted, {isMicrophoneMuted: this._isMicrophoneMuted});
		}
	}
	
	/* 
	
	the setter "isMicrophoneMuted" is duplicated by that function  
	to emit additional params in "onChangeMicrophoneMuted" event
	
	for task-565624 off all participants mic/cam/screenshare
	
	*/
	
	setIsMicrophoneMuted(options) 
	{
		if (this._isMicrophoneMuted !== options.isMicrophoneMuted)
		{
			this._isMicrophoneMuted = options.isMicrophoneMuted;
			this.emit(Events.onChangeMicrophoneMuted, options);
		}
	}

	hasCamera()
	{
		if (!this.initialized)
		{
			throw new Error("HardwareManager is not initialized yet");
		}

		return Object.keys(this.cameraList).length > 0;
	}

	hasMicrophone()
	{
		if (!this.initialized)
		{
			throw new Error("HardwareManager is not initialized yet");
		}

		return Object.keys(this.microphoneList).length > 0;
	}

	getMicrophoneList()
	{
		if (!this.initialized)
		{
			throw new Error("HardwareManager is not initialized yet");
		}

		return Object.values(this._currentDeviceList).filter(deviceInfo => (
			deviceInfo.kind === "audioinput" && deviceInfo.deviceId !== 'default'
		));
	}

	getCameraList()
	{
		if (!this.initialized)
		{
			throw new Error("HardwareManager is not initialized yet");
		}

		return Object.values(this._currentDeviceList).filter(deviceInfo => deviceInfo.kind == "videoinput")
	}

	getSpeakerList()
	{
		if (!this.initialized)
		{
			throw new Error("HardwareManager is not initialized yet");
		}

		return Object.values(this._currentDeviceList).filter(deviceInfo => (
			deviceInfo.kind === "audiooutput" && deviceInfo.deviceId !== 'default'
		));
	}

	canSelectSpeaker()
	{
		return 'setSinkId' in HTMLMediaElement.prototype;
	}

	updateDeviceList(e)
	{
		if (this.updating)
		{
			return;
		}
		this.updating = true;
		let removedDevices = this._currentDeviceList;
		let addedDevices = [];

		const shouldSkipDeviceChangedEvent = this._currentDeviceList.every(deviceInfo => deviceInfo.deviceId == "" && deviceInfo.label == "");

		navigator.mediaDevices.enumerateDevices().then(devices =>
		{
			devices = this.filterDeviceList(devices);
			devices.forEach(deviceInfo =>
			{
				const index = removedDevices.findIndex(dev => (
					dev.kind === deviceInfo.kind
					&& dev.deviceId === deviceInfo.deviceId
					&& dev.groupId === deviceInfo.groupId
				))
				if (index != -1)
				{
					// device found in previous version
					removedDevices.splice(index, 1);
				}
				else
				{
					addedDevices.push(deviceInfo);
				}
			});

			this._currentDeviceList = devices;

			if (!shouldSkipDeviceChangedEvent)
			{
				this.emit(Events.deviceChanged, {
					added: addedDevices,
					removed: removedDevices
				});
			}

			this.updating = false;
		})
	}

	filterDeviceList(browserDeviceList)
	{
		return browserDeviceList.filter(device =>
		{
			switch (device.kind)
			{
				case "audioinput":
					return device.deviceId !== "communications" && !this.isDeviceInBlackList(device);
				case "audiooutput":
					return device.deviceId !== "communications" && !this.isDeviceInBlackList(device);
				default:
					return true;
			}
		})
	}

	isDeviceInBlackList(device)
	{
		const deviceBlackList = [
			'(virtual)',
			'zoomaudiodevice',
			'microsoft teams audio',
			'bitrixaudio',
		];
		let result = false;

		deviceBlackList.forEach(item => {
			if (device.label.toLowerCase().includes(item))
			{
				result = true;
				return false;
			}
		});

		return result;
	}

	onNavigatorDeviceChanged(e)
	{
		if (!this.initialized)
		{
			return;
		}

		this.updateDeviceList();
	}

	_getDeviceMap(deviceKind)
	{
		let result = {};
		if (!this.initialized)
		{
			throw new Error("HardwareManager is not initialized yet");
		}
		for (let i = 0; i < this._currentDeviceList.length; i++)
		{
			if (this._currentDeviceList[i].kind == deviceKind)
			{
				result[this._currentDeviceList[i].deviceId] = this._currentDeviceList[i].label;
			}
		}

		return result;
	}

	getDefaultDeviceIdByGroupId(groupId, deviceKind)
	{
		let deviceId;

		this._currentDeviceList.forEach(device => {
			if (
				device.groupId === groupId
				&& device.deviceId !== 'default'
				&& device.kind === deviceKind
			)
			{
				deviceId = device.deviceId;
				return false;
			}
		});

		return deviceId;
	}

	getDeviceGroupIdByDeviceId(deviceId, deviceKind)
	{
		let groupId;

		this._currentDeviceList.forEach(device => {
			if (device.deviceId === deviceId && device.kind === deviceKind)
			{
				groupId = device.groupId;
				return false;
			}
		});

		return groupId;
	}

	removeDevicesByDefaultGroup(devices)
	{
		let resultDeviceList = devices;

		devices.forEach(device => {
			if (device.deviceId === 'default')
			{
				resultDeviceList = resultDeviceList.filter(item => (
					item.kind !== device.kind
					|| item.groupId !== device.groupId
				));
			}
		});

		return resultDeviceList;
	}

	getCurrentDeviceList()
	{
		return new Promise((resolve, reject) => {
			this.enumerateDevices().then(deviceList => {
				this._currentDeviceList = this.filterDeviceList(deviceList);
				resolve();
			})
		});
	}

	getRemovedUsedDevices(devices, currentDevices)
	{
		return devices.filter(device =>
		{
			switch (device.kind)
			{
				case "audioinput":
					return device.deviceId === currentDevices.microphoneId;
				case "audiooutput":
					return device.deviceId === currentDevices.speakerId;
				case "videoinput":
					return device.deviceId === currentDevices.cameraId;
				default:
					return false;
			}
		})
	}
}

export const Hardware = new HardwareManager();

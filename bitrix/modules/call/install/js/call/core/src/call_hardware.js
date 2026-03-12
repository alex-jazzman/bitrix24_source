import { CallSettingsManager } from '../../lib/settings-manager/src/settings-manager';
import { HardwareManager } from '../../lib/hardware/src/hardware.js'
import { NoiseSuppressionService } from './noiseSuppressionService';

const lsKey = {
	enableMicAutoParameters: 'bx-im-settings-enable-mic-auto-parameters',
	enableMirroring: 'bx-im-settings-camera-enable-mirroring',
};

const CallEvents = {
	onChangeMirroringVideo: 'onChangeMirroringVideo',
	onChangeMicrophoneMuted: 'onChangeMicrophoneMuted',
	onChangeCameraOn: 'onChangeCameraOn',
	onChangeMicrophonePermission: 'onChangeMicrophonePermission',
	onChangeCameraPermission: 'onChangeCameraPermission',
};

const CALL_HARDWARE_PERMISSIONS_STATE = Object.freeze({
	DENIED: 'denied',
	PROMPT: 'prompt',
	GRANTED: 'granted',
});

class CallHardwareManager extends HardwareManager
{
	#noiseSuppression: NoiseSuppressionService;
	constructor()
	{
		super();

		this._isCameraOn = false;
		this._isMicrophoneMuted = false;
		this.Events = Object.assign(this.Events, CallEvents);
		this.#noiseSuppression = new NoiseSuppressionService();
		this.CALL_HARDWARE_PERMISSIONS_STATE = CALL_HARDWARE_PERMISSIONS_STATE;
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

	get enableMirroring(): boolean
	{
		return localStorage ? (localStorage.getItem(lsKey.enableMirroring) !== 'N') : true;
	}

	set enableMirroring(enableMirroring: boolean)
	{
		if (this.enableMirroring !== enableMirroring)
		{
			this.emit(this.Events.onChangeMirroringVideo, {enableMirroring: enableMirroring});

			if (DesktopApi.isDesktop())
			{
				DesktopApi.emit(this.Events.onChangeMirroringVideo, [enableMirroring]);
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
			this.emit(this.Events.onChangeCameraOn, {isCameraOn: this._isCameraOn});
		}
	}

	/*

	the setter 'isCameraOn' is duplicated by that function
	to emit additional params in 'onChangeCameraOn' event

	for task-565624 off all participants mic/cam/screenshare

	*/

	setIsCameraOn(options)
	{
		if (this._isCameraOn !== options.isCameraOn)
		{
			this._isCameraOn = options.isCameraOn;
			this.emit(this.Events.onChangeCameraOn, options);
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
			this.emit(this.Events.onChangeMicrophoneMuted, {isMicrophoneMuted: this._isMicrophoneMuted});
		}
	}

	/*

	the setter 'isMicrophoneMuted' is duplicated by that function
	to emit additional params in 'onChangeMicrophoneMuted' event

	for task-565624 off all participants mic/cam/screenshare

	*/

	setIsMicrophoneMuted(options)
	{
		if (this._isMicrophoneMuted !== options.isMicrophoneMuted)
		{
			this._isMicrophoneMuted = options.isMicrophoneMuted;
			this.emit(this.Events.onChangeMicrophoneMuted, options);
		}
	}

	async getUserMedia(constraints)
	{
		const stream = await super.getUserMedia(constraints);
		if (!stream
			|| stream.getAudioTracks?.()?.length === 0
			|| !CallSettingsManager.noiseSuppressionEnabled)
		{
			return stream;
		}

		return this.addNoiseSuppression(stream);
	}

	async addNoiseSuppression(stream)
	{
		if (this.noiseSuppressionInputStream !== stream)
		{
			this.stopNoiseSuppression();
		}

		await this.turnNoiseSuppression(stream);

		const processedAudioTracks = this.#noiseSuppression.destination.stream.getAudioTracks();
		const videoTracks = stream.getVideoTracks();

		return new MediaStream([...videoTracks, ...processedAudioTracks]);
	}

	async turnNoiseSuppression(stream)
	{
		await this.#noiseSuppression.turn(stream);
	}

	stopNoiseSuppression()
	{
		this.#noiseSuppression.stop();
	}

	get enableNoiseSuppression(): boolean
	{
		return this.#noiseSuppression.enable;
	}

	set enableNoiseSuppression(enableNoiseSuppression: boolean)
	{
		this.#noiseSuppression.enable = enableNoiseSuppression;
	}

	get noiseSuppressionInputStream(): ?MediaStream
	{
		return this.#noiseSuppression.inputStream;
	}

	async _checkPermissions()
	{
		const permissions = await super._checkPermissions();
		const { microphonePermission, cameraPermission } = permissions ?? {};

		const parentMicHandler = microphonePermission.onchange;
		microphonePermission.onchange = (event) => {
			if (parentMicHandler) {
				parentMicHandler.call(microphonePermission, event);
			}

			this.emit(this.Events.onChangeMicrophonePermission, { state: event.target.state });
		};

		const parentCamHandler = cameraPermission.onchange;
		cameraPermission.onchange = (event) => {
			if (parentCamHandler) {
				parentCamHandler.call(cameraPermission, event);
			}

			this.emit(this.Events.onChangeCameraPermission, { state: event.target.state });
		};

		return permissions;
	}
}

export const Hardware = new CallHardwareManager();

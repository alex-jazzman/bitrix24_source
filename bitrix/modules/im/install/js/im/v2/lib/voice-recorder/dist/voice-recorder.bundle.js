/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports, main_core, im_v2_application_core, main_core_events, im_v2_lib_analytics, im_v2_provider_service_uploading) {
	'use strict';

	const Capability = {
		nativeTarget: 'nativeTarget',
		clientEncode: 'clientEncode',
		serverConvert: 'serverConvert',
		unavailable: 'unavailable'
	};

	// m4a with AAC-LC: the mime type is what a recorder is asked for, the codec config - what an encoder is
	// configured with. The aac bitstream format stays at its default - raw frames, what an mp4 container takes
	const TargetFormat = {
		mimeType: 'audio/mp4;codecs=mp4a.40.2',
		codecConfig: {
			codec: 'mp4a.40.2',
			sampleRate: 48000,
			numberOfChannels: 1,
			bitrate: 64000
		}
	};

	class CapabilityResolver {
		// dropped only by a test, to probe again
		static resolved = null;

		// the probes are cheap, but the input field asks on every render - the answer is settled once per page
		static resolve() {
			this.resolved ??= this.#detect();
			return this.resolved;
		}
		static async #detect() {
			// every branch below records through MediaRecorder and differs only in what it does with the
			// fragment afterwards, so a browser without the recorder has no branch of its own
			if (!window.isSecureContext || !navigator.mediaDevices || !main_core.Type.isFunction(window.MediaRecorder)) {
				return Capability.unavailable;
			}
			if (this.#canRecordTargetFormat()) {
				return Capability.nativeTarget;
			}
			if (await this.#canEncodeTargetFormat()) {
				return Capability.clientEncode;
			}
			if (this.#isServerConversionAvailable()) {
				return Capability.serverConvert;
			}
			return Capability.unavailable;
		}
		static #canRecordTargetFormat() {
			return main_core.Type.isFunction(window.MediaRecorder?.isTypeSupported) && window.MediaRecorder.isTypeSupported(TargetFormat.mimeType);
		}
		static async #canEncodeTargetFormat() {
			if (!main_core.Type.isFunction(window.AudioEncoder?.isConfigSupported)) {
				return false;
			}
			try {
				const {
					supported
				} = await window.AudioEncoder.isConfigSupported(TargetFormat.codecConfig);
				return supported === true;
			} catch {
				// a config the engine cannot even parse is refused by throwing, not by answering "no"
				return false;
			}
		}

		// the flag means the stage is switched on and ready on this portal, not that the module is installed
		static #isServerConversionAvailable() {
			const {
				voiceMessage = {}
			} = im_v2_application_core.Core.getApplicationData();
			return voiceMessage.isServerConversionAvailable ?? false;
		}
	}

	const MAX_RECORDS_PER_DIALOG = 3;
	const EVENT_NAMESPACE = 'BX.Messenger.v2.Lib.UnsentVoiceRecords';
	class UnsentVoiceRecords extends main_core_events.EventEmitter {
		static event = {
			onRecordReturned: 'onRecordReturned'
		};
		static instance = null;
		#recordsByDialog = new Map();
		#recordsInFlight = new Map();
		#uploadingService;
		static getInstance() {
			this.instance ??= new this();
			return this.instance;
		}
		constructor(uploadingService = im_v2_provider_service_uploading.UploadingService.getInstance()) {
			super();
			this.setEventNamespace(EVENT_NAMESPACE);
			this.#uploadingService = uploadingService;
			this.#uploadingService.subscribe(im_v2_provider_service_uploading.UploadingService.event.voiceRecordSendFailed, this.#onVoiceRecordSendFailed.bind(this));
			this.#uploadingService.subscribe(im_v2_provider_service_uploading.UploadingService.event.voiceRecordSent, this.#onVoiceRecordSent.bind(this));
		}
		hold(uploaderId, dialogId, record) {
			this.#recordsInFlight.set(uploaderId, {
				dialogId,
				record
			});
		}
		release(uploaderId) {
			const recordInFlight = this.#recordsInFlight.get(uploaderId) ?? null;
			this.#recordsInFlight.delete(uploaderId);
			return recordInFlight;
		}
		push(dialogId, record, failure) {
			const queue = this.#recordsByDialog.get(dialogId) ?? [];
			queue.push({
				record,
				failure
			});
			while (queue.length > MAX_RECORDS_PER_DIALOG) {
				queue.shift();
			}
			this.#recordsByDialog.set(dialogId, queue);
			im_v2_lib_analytics.Analytics.getInstance().voiceRecorder.onSendRecordError(dialogId, failure);
			this.emit(UnsentVoiceRecords.event.onRecordReturned, {
				dialogId
			});
		}
		unshift(dialogId, record, failure) {
			const queue = this.#recordsByDialog.get(dialogId) ?? [];
			queue.unshift({
				record,
				failure
			});
			while (queue.length > MAX_RECORDS_PER_DIALOG) {
				queue.pop();
			}
			this.#recordsByDialog.set(dialogId, queue);
		}
		takeNext(dialogId) {
			const queue = this.#recordsByDialog.get(dialogId);
			if (!queue) {
				return null;
			}
			const record = queue.shift() ?? null;
			if (queue.length === 0) {
				this.#recordsByDialog.delete(dialogId);
			}
			return record;
		}
		hasFor(dialogId) {
			return this.#recordsByDialog.has(dialogId);
		}
		#onVoiceRecordSendFailed(event) {
			const {
				uploaderId,
				failure
			} = event.getData();
			const recordInFlight = this.release(uploaderId);
			if (!recordInFlight) {
				return;
			}
			const {
				dialogId,
				record
			} = recordInFlight;
			this.push(dialogId, record, failure);
		}
		#onVoiceRecordSent(event) {
			this.release(event.getData().uploaderId);
		}
	}

	// whether a call goes on is answered by the call manager; these only tell when to ask it again
	const CallEventName = {
		incomingCall: 'CallEvents::incomingCall',
		callCreated: 'CallEvents::callCreated',
		callLeft: 'BX.Call.Controller:onCallLeft',
		callDestroyed: 'BX.Call.Controller:onCallDestroyed'
	};

	// a call takes the microphone for itself, and it starts both ways: the one the user answers and the
	// one they place themselves
	const CALL_START_EVENTS = [CallEventName.incomingCall, CallEventName.callCreated];
	const CALL_STATE_EVENTS = Object.values(CallEventName);

	exports.CALL_START_EVENTS = CALL_START_EVENTS;
	exports.CALL_STATE_EVENTS = CALL_STATE_EVENTS;
	exports.Capability = Capability;
	exports.CapabilityResolver = CapabilityResolver;
	exports.TargetFormat = TargetFormat;
	exports.UnsentVoiceRecords = UnsentVoiceRecords;

})(this.BX.Messenger.v2.Lib = this.BX.Messenger.v2.Lib || {}, BX, BX.Messenger.v2.Application, BX.Event, BX.Messenger.v2.Lib, BX.Messenger.v2.Service);
//# sourceMappingURL=voice-recorder.bundle.js.map

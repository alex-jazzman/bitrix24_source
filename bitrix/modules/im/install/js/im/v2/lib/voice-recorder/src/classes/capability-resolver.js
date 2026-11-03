import { Type } from 'main.core';

import { Core } from 'im.v2.application.core';

import { Capability, TargetFormat } from '../const/capability';

export type CapabilityValue = $Values<typeof Capability>;

export class CapabilityResolver
{
	// dropped only by a test, to probe again
	static resolved: ?Promise<CapabilityValue> = null;

	// the probes are cheap, but the input field asks on every render - the answer is settled once per page
	static resolve(): Promise<CapabilityValue>
	{
		this.resolved ??= this.#detect();

		return this.resolved;
	}

	static async #detect(): Promise<CapabilityValue>
	{
		// every branch below records through MediaRecorder and differs only in what it does with the
		// fragment afterwards, so a browser without the recorder has no branch of its own
		if (!window.isSecureContext || !navigator.mediaDevices || !Type.isFunction(window.MediaRecorder))
		{
			return Capability.unavailable;
		}

		if (this.#canRecordTargetFormat())
		{
			return Capability.nativeTarget;
		}

		if (await this.#canEncodeTargetFormat())
		{
			return Capability.clientEncode;
		}

		if (this.#isServerConversionAvailable())
		{
			return Capability.serverConvert;
		}

		return Capability.unavailable;
	}

	static #canRecordTargetFormat(): boolean
	{
		return Type.isFunction(window.MediaRecorder?.isTypeSupported)
			&& window.MediaRecorder.isTypeSupported(TargetFormat.mimeType);
	}

	static async #canEncodeTargetFormat(): Promise<boolean>
	{
		if (!Type.isFunction(window.AudioEncoder?.isConfigSupported))
		{
			return false;
		}

		try
		{
			const { supported } = await window.AudioEncoder.isConfigSupported(TargetFormat.codecConfig);

			return supported === true;
		}
		catch
		{
			// a config the engine cannot even parse is refused by throwing, not by answering "no"
			return false;
		}
	}

	// the flag means the stage is switched on and ready on this portal, not that the module is installed
	static #isServerConversionAvailable(): boolean
	{
		const { voiceMessage = {} } = Core.getApplicationData();

		return voiceMessage.isServerConversionAvailable ?? false;
	}
}

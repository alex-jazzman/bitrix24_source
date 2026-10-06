const lsKey = {
	enableNoiseSuppression: 'bx-call-settings-enable-noise-suppression',
};

const NOISE_SUPPRESSION_WORKLET_PATH = '/bitrix/js/call/lib/noise-suppression-worklet/src/noise-suppression-worklet.js?nocache=23022026';

export class NoiseSuppressionService
{
	async turn(stream)
	{
		if (!this.audioCtx)
		{
			this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
			this.destination = this.audioCtx.createMediaStreamDestination();
		}
		else if (!this.#isDestinationLive())
		{
			// The output track was stopped from the outside (a legacy engine tears its local stream down
			// before recapturing). Rebuild the destination only - keeping the context keeps the sample rate
			// the processed stream is clocked by.
			this.inputSource?.disconnect();
			this.noiseSuppressionNode?.disconnect();
			this.destination = this.audioCtx.createMediaStreamDestination();
		}

		if (this.audioCtx.state === 'suspended')
		{
			await this.audioCtx.resume();
		}

		if (stream && (!this.inputSource || this.inputStream !== stream))
		{
			this.inputStream?.getAudioTracks().forEach(track => {
				const trackInNewStream = stream.getTrackById(track.id);
				if (!trackInNewStream)
				{
					track.stop();
				}
			});
			// The replaced source node stays wired into the graph until it is unplugged explicitly.
			this.inputSource?.disconnect();
			this.inputSource = this.audioCtx.createMediaStreamSource(stream);
			this.inputStream = stream;
		}
		else if (!stream && !this.inputSource)
		{
			return;
		}

		if (!this.noiseSuppressionNode)
		{
			await this.audioCtx.audioWorklet.addModule(NOISE_SUPPRESSION_WORKLET_PATH);
			this.noiseSuppressionNode = new AudioWorkletNode(this.audioCtx, 'NoiseSuppressorWorklet');
		}

		if (this.previousEnable === Boolean(this.previousEnable)
			&& this.previousEnable !== this.enable)
		{
			this.inputSource.disconnect();
		}

		if (this.enable)
		{
			this.inputSource.connect(this.noiseSuppressionNode);
			this.noiseSuppressionNode.connect(this.destination);
		}
		else
		{
			this.inputSource.connect(this.destination);
		}

		this.previousEnable = this.enable;
	}

	#isDestinationLive(): boolean
	{
		return Boolean(this.destination?.stream?.getAudioTracks()?.some((track) => track.readyState === 'live'));
	}

	stop()
	{
		if (this.audioCtx)
		{
			this.audioCtx.close();
			this.audioCtx = null;
			this.destination = null;
		}

		if (this.inputSource)
		{
			this.inputSource = null;
			this.inputStream.getAudioTracks().forEach(track => {
				track.stop();
			});
			this.inputStream = null;
		}

		if (this.noiseSuppressionNode)
		{
			this.noiseSuppressionNode = null;
		}

		if (this.previousEnable === Boolean(this.previousEnable))
		{
			this.previousEnable = null;
		}
	}

	get enable(): boolean
	{
		return localStorage ? (localStorage.getItem(lsKey.enableNoiseSuppression) !== 'N') : true;
	}

	set enable(enableNoiseSuppression: boolean)
	{
		if (localStorage)
		{
			localStorage.setItem(lsKey.enableNoiseSuppression, enableNoiseSuppression ? 'Y' : 'N');
		}
	}
}
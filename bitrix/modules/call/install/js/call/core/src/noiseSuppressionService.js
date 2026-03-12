const lsKey = {
	enableNoiseSuppression: 'bx-call-settings-enable-noise-suppression',
};

const NOISE_SUPPRESSION_WORKLET_PATH = '/bitrix/js/call/lib/noise-suppression-worklet/src/noise-suppression-worklet.js';

export class NoiseSuppressionService
{
	async turn(stream)
	{
		if (!this.audioCtx)
		{
			this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
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
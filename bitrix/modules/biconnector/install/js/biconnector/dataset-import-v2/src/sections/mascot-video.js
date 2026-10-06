import '../css/mascot.css';

const MASCOT_SRC = '/bitrix/images/biconnector/dataset-import/mascot-animated.mp4';

export const MascotVideo = {
	props: {
		playing: {
			type: Boolean,
			required: false,
			default: false,
		},
	},
	data()
	{
		return {
			src: MASCOT_SRC,
		};
	},
	watch:
	{
		playing(active)
		{
			this.apply(active);
		},
	},
	mounted()
	{
		if (this.$refs.video)
		{
			this.$refs.video.muted = true;
		}
		this.apply(this.playing);
	},
	beforeUnmount()
	{
		if (this.$refs.video)
		{
			this.$refs.video.pause();
		}
	},
	methods:
	{
		apply(active)
		{
			const video = this.$refs.video;
			if (!video)
			{
				return;
			}

			if (active)
			{
				video.play()?.catch(() => {});
			}
			else
			{
				video.pause();
				video.currentTime = 0;
			}
		},
	},
	// language=Vue
	template: `
		<video
			ref="video"
			class="biconnector-dataset-import-v2-mascot"
			:src="src"
			muted
			loop
			playsinline
			preload="metadata"
		></video>
	`,
};

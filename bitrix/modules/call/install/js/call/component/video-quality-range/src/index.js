import { BitrixVue, ref } from 'ui.vue3';

import { VideoQualitySlider } from './video-quality-slider';

export class VideoQualityRange
{
	#application = null;
	#config;
	#disabled = ref(false);

	constructor(config) {
		this.#config = {
			container: config.container,
			title: config.title,
			videoQualityList: config.videoQualityList,
			defaultHeight: config.defaultHeight,
			onVideoQualityChanged: config.onVideoQualityChanged,
		};

		this.#disabled.value = Boolean(config.disabled);
	}

	init(): HTMLElement
	{
		if (this.#application)
		{
			return this.#config.container;
		}

		this.#application = BitrixVue.createApp({
			name: 'VideoQualityRangeApp',
			components: {
				VideoQualitySlider,
			},
			setup: () => ({
				title: this.#config.title,
				videoQualityList: this.#config.videoQualityList,
				defaultHeight: this.#config.defaultHeight,
				disabled: this.#disabled,
				handleChange: (value) => {
					this.#config.onVideoQualityChanged?.(value);
				},
			}),
			template: `
				<VideoQualitySlider
					:title="title"
					:video-quality-list="videoQualityList"
					:default-height="defaultHeight"
					:disabled="disabled"
					@change="handleChange"
				/>
			`,
		});

		this.#application.mount(this.#config.container);

		return this.#config.container;
	}

	setDisabled(value: boolean) {
		this.#disabled.value = Boolean(value);
	}

	destroy() {
		this.#application?.unmount();
		this.#application = null;
	}
}

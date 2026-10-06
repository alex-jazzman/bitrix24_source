import { BitrixVue, ref, type Ref, type App } from 'ui.vue3';
import { VideoQualitySlider } from './video-quality-slider';

export type VideoQualityItem = {
	label: string;
	height: number;
	value: number;
};

type VideoQualityRangeConfig = {
	container: HTMLElement;
	title: string;
	videoQualityList: VideoQualityItem[];
	defaultHeight: number;
	onVideoQualityChanged?: (value: number) => void;
	disabled?: boolean;
};

export class VideoQualityRange
{
	#application: App | null = null;
	#config: VideoQualityRangeConfig;
	#disabled: Ref<boolean> = ref(false);

	constructor(config: VideoQualityRangeConfig)
	{
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
				handleChange: (value: number) => {
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

	setDisabled(value: boolean): void
	{
		this.#disabled.value = Boolean(value);
	}

	destroy(): void
	{
		this.#application?.unmount();
		this.#application = null;
	}
}

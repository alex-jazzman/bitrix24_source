/* eslint-disable */
type VideoQualityItem = {
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

declare namespace BX.Call.Component {
	class VideoQualityRange {
		constructor(config: VideoQualityRangeConfig);
		init(): HTMLElement;
		setDisabled(value: boolean): void;
		destroy(): void;
	}
}

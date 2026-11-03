/* eslint-disable */
type PeerStats = Partial<Record<number, VideoStats | VideoStats[] | AudioStats>>;

type VideoStats = {
	bitrate?: number;
	frameWidth?: number;
	frameHeight?: number;
	framesPerSecond?: number;
	packetsLost?: PacketsLost;
	codecName?: string;
	qualityLimitationReason?: string;
};

type PacketsLost = {
	totalPacketsLost: number;
};

type AudioStats = {
	bitrate?: number;
	packetsLost?: PacketsLost;
	codecName?: string;
};

type TracksSubscriptionFailed = Record<string, FailedTrackInfo>;

type FailedTrackInfo = {
	source: string;
};

type StatsSection = {
	id: string;
	title: string;
	warning?: string | null;
	tracks: VideoTrackData[] | AudioTrackData[] | FailedTrackData[];
};

type VideoTrackData = {
	Bitrate: string;
	Resolution: string;
	FPS: number;
	PacketsLost: number;
	Codec: string;
};

type AudioTrackData = {
	Bitrate: string;
	PacketsLost: number;
	Codec: string;
};

type FailedTrackData = {
	source: string;
	trackId: string;
};

declare namespace BX.Call.Helper {
	const peerStatsFormatter: PeerStatsFormatter;

	class PeerStatsFormatter {
		formatStats(peerStats?: PeerStats, tracksSubscriptionFailed?: TracksSubscriptionFailed): StatsSection[];
		buildFailedSubscriptionsSection(tracksSubscriptionFailed: TracksSubscriptionFailed): StatsSection | null;
		buildVideoSection(videoStats: VideoStats | VideoStats[] | undefined, title: string): StatsSection;
		buildSingleVideoSection(stats: VideoStats, title: string): StatsSection;
		buildMultiTrackVideoSection(statsArray: VideoStats[], title: string): StatsSection;
		buildEmptyVideoSection(title: string): StatsSection;
		getVideoStatsData(stats: VideoStats): VideoTrackData;
		buildAudioSection(audioStats: AudioStats): StatsSection;
		getQualityLimitationWarning(stats: VideoStats): string | null;
		formatBitrate(bitrate?: number): string;
		formatResolution(width?: number, height?: number): string;
		formatCodecName(codecName?: string): string;
	}
}

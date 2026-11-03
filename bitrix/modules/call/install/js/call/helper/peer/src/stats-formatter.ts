const MediaStreamsKinds = {
	Camera: 1,
	Microphone: 2,
	Screen: 3,
	ScreenAudio: 4,
} as const;

// region Type definitions

type PacketsLost = {
	totalPacketsLost: number;
};

type VideoStats = {
	bitrate?: number;
	frameWidth?: number;
	frameHeight?: number;
	framesPerSecond?: number;
	packetsLost?: PacketsLost;
	codecName?: string;
	qualityLimitationReason?: string;
};

type AudioStats = {
	bitrate?: number;
	packetsLost?: PacketsLost;
	codecName?: string;
};

type PeerStats = Partial<Record<number, VideoStats | VideoStats[] | AudioStats>>;

type FailedTrackInfo = {
	source: string;
};

type TracksSubscriptionFailed = Record<string, FailedTrackInfo>;

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

type StatsSection = {
	id: string;
	title: string;
	warning?: string | null;
	tracks: VideoTrackData[] | AudioTrackData[] | FailedTrackData[];
};

// endregion Type definitions

class PeerStatsFormatter
{
	formatStats(peerStats: PeerStats = {}, tracksSubscriptionFailed: TracksSubscriptionFailed = {}): StatsSection[]
	{
		const sections: StatsSection[] = [];

		const failedSection = this.buildFailedSubscriptionsSection(tracksSubscriptionFailed);
		if (failedSection)
		{
			sections.push(failedSection);
		}

		const cameraStats = peerStats[MediaStreamsKinds.Camera] as VideoStats | VideoStats[] | undefined;
		const screenStats = peerStats[MediaStreamsKinds.Screen] as VideoStats | VideoStats[] | undefined;

		if (cameraStats || !screenStats)
		{
			const videoSection = this.buildVideoSection(cameraStats, 'Video stats');
			if (videoSection)
			{
				sections.push(videoSection);
			}
		}

		if (screenStats)
		{
			const screenSection = this.buildVideoSection(screenStats, 'Screen share stats');
			if (screenSection)
			{
				sections.push(screenSection);
			}
		}

		const audioStats = peerStats[MediaStreamsKinds.Microphone] as AudioStats | undefined;
		if (audioStats)
		{
			const audioSection = this.buildAudioSection(audioStats);
			if (audioSection)
			{
				sections.push(audioSection);
			}
		}

		return sections;
	}

	buildFailedSubscriptionsSection(tracksSubscriptionFailed: TracksSubscriptionFailed): StatsSection | null
	{
		const failedTracks = Object.entries(tracksSubscriptionFailed);

		if (failedTracks.length === 0)
		{
			return null;
		}

		return {
			id: 'failed-subscriptions',
			title: 'Failed subscribe to',
			tracks: failedTracks.map(([trackId, trackInfo]) => ({
				source: trackInfo.source,
				trackId,
			})),
		};
	}

	buildVideoSection(videoStats: VideoStats | VideoStats[] | undefined, title: string): StatsSection
	{
		if (!videoStats)
		{
			return this.buildEmptyVideoSection(title);
		}

		if (Array.isArray(videoStats))
		{
			return this.buildMultiTrackVideoSection(videoStats, title);
		}

		return this.buildSingleVideoSection(videoStats, title);
	}

	buildSingleVideoSection(stats: VideoStats, title: string): StatsSection
	{
		const trackData = this.getVideoStatsData(stats);
		const warning = this.getQualityLimitationWarning(stats);

		return {
			id: this.#generateId('video', title),
			title,
			warning,
			tracks: [trackData],
		};
	}

	buildMultiTrackVideoSection(statsArray: VideoStats[], title: string): StatsSection
	{
		const tracks: VideoTrackData[] = [];
		let warning: string | null = null;

		statsArray.forEach((stats: VideoStats) => {
			const trackData = this.getVideoStatsData(stats);
			tracks.push(trackData);

			if (!warning)
			{
				warning = this.getQualityLimitationWarning(stats);
			}
		});

		return {
			id: this.#generateId('video-multi', title),
			title,
			warning,
			tracks,
		};
	}

	buildEmptyVideoSection(title: string): StatsSection
	{
		return {
			id: this.#generateId('video-empty', title),
			title,
			tracks: [
				{
					Bitrate: '0 Kbps',
					Resolution: '-',
					FPS: 0,
					PacketsLost: 0,
					Codec: '-',
				},
			],
		};
	}

	getVideoStatsData(stats: VideoStats): VideoTrackData
	{
		const resolution = this.formatResolution(stats?.frameWidth, stats?.frameHeight);

		return {
			Bitrate: this.formatBitrate(stats?.bitrate),
			Resolution: resolution,
			FPS: stats?.framesPerSecond || 0,
			PacketsLost: stats?.packetsLost?.totalPacketsLost || 0,
			Codec: this.formatCodecName(stats?.codecName),
		};
	}

	buildAudioSection(audioStats: AudioStats): StatsSection
	{
		return {
			id: 'audio-stats',
			title: 'Audio stats',
			tracks: [
				{
					Bitrate: this.formatBitrate(audioStats?.bitrate),
					PacketsLost: audioStats?.packetsLost?.totalPacketsLost || 0,
					Codec: this.formatCodecName(audioStats?.codecName),
				},
			],
		};
	}

	getQualityLimitationWarning(stats: VideoStats): string | null
	{
		const reason = stats?.qualityLimitationReason;

		if (!reason || reason === 'none')
		{
			return null;
		}

		const reasonMap: Record<string, string> = {
			bandwidth: 'Bandwidth',
			cpu: 'CPU',
			other: 'Other',
		};

		return `⚠️ Quality limited by: ${reasonMap[reason] || reason}`;
	}

	formatBitrate(bitrate?: number): string
	{
		if (!bitrate || bitrate === 0)
		{
			return '0 Kbps';
		}

		if (bitrate >= 1000)
		{
			return `${(bitrate / 1000).toFixed(1)} Mbps`;
		}

		return `${bitrate} Kbps`;
	}

	formatResolution(width?: number, height?: number): string
	{
		if (!width || !height)
		{
			return '-';
		}

		return `${width}x${height}`;
	}

	formatCodecName(codecName?: string): string
	{
		if (!codecName)
		{
			return '-';
		}

		// "video/VP8" -> "VP8"
		// "audio/opus" -> "opus"
		return codecName.split('/')[1] || codecName;
	}

	#generateId(prefix: string, title: string): string
	{
		return `${prefix}-${title.toLowerCase().replaceAll(/\s+/g, '-')}`;
	}
}

export const peerStatsFormatter = new PeerStatsFormatter();

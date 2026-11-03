/* eslint-disable */
this.BX = this.BX || {};
this.BX.Call = this.BX.Call || {};
(function (exports) {
	'use strict';

	const MediaStreamsKinds = {
		Camera: 1,
		Microphone: 2,
		Screen: 3};
	class PeerStatsFormatter {
		formatStats(peerStats = {}, tracksSubscriptionFailed = {}) {
			const sections = [];
			const failedSection = this.buildFailedSubscriptionsSection(tracksSubscriptionFailed);
			if (failedSection) {
				sections.push(failedSection);
			}
			const cameraStats = peerStats[MediaStreamsKinds.Camera];
			const screenStats = peerStats[MediaStreamsKinds.Screen];
			if (cameraStats || !screenStats) {
				const videoSection = this.buildVideoSection(cameraStats, 'Video stats');
				if (videoSection) {
					sections.push(videoSection);
				}
			}
			if (screenStats) {
				const screenSection = this.buildVideoSection(screenStats, 'Screen share stats');
				if (screenSection) {
					sections.push(screenSection);
				}
			}
			const audioStats = peerStats[MediaStreamsKinds.Microphone];
			if (audioStats) {
				const audioSection = this.buildAudioSection(audioStats);
				if (audioSection) {
					sections.push(audioSection);
				}
			}
			return sections;
		}
		buildFailedSubscriptionsSection(tracksSubscriptionFailed) {
			const failedTracks = Object.entries(tracksSubscriptionFailed);
			if (failedTracks.length === 0) {
				return null;
			}
			return {
				id: 'failed-subscriptions',
				title: 'Failed subscribe to',
				tracks: failedTracks.map(([trackId, trackInfo]) => ({
					source: trackInfo.source,
					trackId
				}))
			};
		}
		buildVideoSection(videoStats, title) {
			if (!videoStats) {
				return this.buildEmptyVideoSection(title);
			}
			if (Array.isArray(videoStats)) {
				return this.buildMultiTrackVideoSection(videoStats, title);
			}
			return this.buildSingleVideoSection(videoStats, title);
		}
		buildSingleVideoSection(stats, title) {
			const trackData = this.getVideoStatsData(stats);
			const warning = this.getQualityLimitationWarning(stats);
			return {
				id: this.#generateId('video', title),
				title,
				warning,
				tracks: [trackData]
			};
		}
		buildMultiTrackVideoSection(statsArray, title) {
			const tracks = [];
			let warning = null;
			statsArray.forEach(stats => {
				const trackData = this.getVideoStatsData(stats);
				tracks.push(trackData);
				if (!warning) {
					warning = this.getQualityLimitationWarning(stats);
				}
			});
			return {
				id: this.#generateId('video-multi', title),
				title,
				warning,
				tracks
			};
		}
		buildEmptyVideoSection(title) {
			return {
				id: this.#generateId('video-empty', title),
				title,
				tracks: [{
					Bitrate: '0 Kbps',
					Resolution: '-',
					FPS: 0,
					PacketsLost: 0,
					Codec: '-'
				}]
			};
		}
		getVideoStatsData(stats) {
			const resolution = this.formatResolution(stats?.frameWidth, stats?.frameHeight);
			return {
				Bitrate: this.formatBitrate(stats?.bitrate),
				Resolution: resolution,
				FPS: stats?.framesPerSecond || 0,
				PacketsLost: stats?.packetsLost?.totalPacketsLost || 0,
				Codec: this.formatCodecName(stats?.codecName)
			};
		}
		buildAudioSection(audioStats) {
			return {
				id: 'audio-stats',
				title: 'Audio stats',
				tracks: [{
					Bitrate: this.formatBitrate(audioStats?.bitrate),
					PacketsLost: audioStats?.packetsLost?.totalPacketsLost || 0,
					Codec: this.formatCodecName(audioStats?.codecName)
				}]
			};
		}
		getQualityLimitationWarning(stats) {
			const reason = stats?.qualityLimitationReason;
			if (!reason || reason === 'none') {
				return null;
			}
			const reasonMap = {
				bandwidth: 'Bandwidth',
				cpu: 'CPU',
				other: 'Other'
			};
			return `⚠️ Quality limited by: ${reasonMap[reason] || reason}`;
		}
		formatBitrate(bitrate) {
			if (!bitrate || bitrate === 0) {
				return '0 Kbps';
			}
			if (bitrate >= 1000) {
				return `${(bitrate / 1000).toFixed(1)} Mbps`;
			}
			return `${bitrate} Kbps`;
		}
		formatResolution(width, height) {
			if (!width || !height) {
				return '-';
			}
			return `${width}x${height}`;
		}
		formatCodecName(codecName) {
			if (!codecName) {
				return '-';
			}
			return codecName.split('/')[1] || codecName;
		}
		#generateId(prefix, title) {
			return `${prefix}-${title.toLowerCase().replaceAll(/\s+/g, '-')}`;
		}
	}
	const peerStatsFormatter = new PeerStatsFormatter();

	exports.peerStatsFormatter = peerStatsFormatter;

})(this.BX.Call.Helper = this.BX.Call.Helper || {});
//# sourceMappingURL=peer.bundle.js.map

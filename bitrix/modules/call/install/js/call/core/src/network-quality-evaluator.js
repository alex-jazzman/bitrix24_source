/**
 * Network Quality Evaluator
 *
 * Adaptive video quality balancing based on WebRTC stats.
 * Implements composite score calculation and asymmetric hysteresis.
 *
 * @module call/core/src/network-quality-evaluator
 */
import { Type } from 'main.core';
import { STREAM_QUALITY } from './stream_quality';

/**
 * @class NetworkQualityEvaluator
 */
export class NetworkQualityEvaluator
{
	/**
	 * @param {Object} options - Configuration options from backend
	 * @param {number} [options.nqeDowngradeWindowSec=5] - Downgrade hysteresis window (seconds)
	 * @param {number} [options.nqeUpgradeWindowSec=15] - Upgrade hysteresis window (seconds)
	 * @param {number} [options.nqeWarmupSec=30] - Warmup phase (seconds)
	 *
	 * Quality-specific thresholds (HIGH quality):
	 * @param {number} [options.nqeHighDowngradePacketsLostPct=5] - HIGH→MEDIUM: packets lost threshold (%)
	 * @param {number} [options.nqeHighDowngradeRttMs=100] - HIGH→MEDIUM: RTT threshold (ms)
	 * @param {number} [options.nqeHighDowngradeJitterMs=30] - HIGH→MEDIUM: jitter threshold (ms)
	 *
	 * Quality-specific thresholds (MEDIUM quality):
	 * @param {number} [options.nqeMedDowngradePacketsLostPct=10] - MEDIUM→LOW: packets lost threshold (%)
	 * @param {number} [options.nqeMedDowngradeRttMs=200] - MEDIUM→LOW: RTT threshold (ms)
	 * @param {number} [options.nqeMedDowngradeJitterMs=50] - MEDIUM→LOW: jitter threshold (ms)
	 * @param {number} [options.nqeMedUpgradePacketsLostPct=2] - MEDIUM→HIGH: packets lost threshold (%)
	 * @param {number} [options.nqeMedUpgradeRttMs=80] - MEDIUM→HIGH: RTT threshold (ms)
	 * @param {number} [options.nqeMedUpgradeJitterMs=25] - MEDIUM→HIGH: jitter threshold (ms)
	 *
	 * Quality-specific thresholds (LOW quality):
	 * @param {number} [options.nqeLowUpgradePacketsLostPct=3] - LOW→MEDIUM: packets lost threshold (%)
	 * @param {number} [options.nqeLowUpgradeRttMs=150] - LOW→MEDIUM: RTT threshold (ms)
	 * @param {number} [options.nqeLowUpgradeJitterMs=40] - LOW→MEDIUM: jitter threshold (ms)
	 */
	constructor(options)
	{
		// Default hysteresis windows and warmup (overridable via backend options)
		this.downgradeWindowSec = this.#validatePositiveNumber(options?.nqeDowngradeWindowSec, 5);
		this.upgradeWindowSec = this.#validatePositiveNumber(options?.nqeUpgradeWindowSec, 15);
		this.warmupSec = this.#validatePositiveNumber(options?.nqeWarmupSec, 30);

		// Quality-specific thresholds for each level
		// Allows fine-tuned hysteresis per quality transition
		this.qualityThresholds = this.#getQualityThresholds(options);

		this.state = {
			currentQuality: STREAM_QUALITY.HIGH,
			previousQuality: null, // Store previous quality for comparison
			targetQuality: STREAM_QUALITY.HIGH,
			isWarmup: true,
			warmupStartTime: Date.now(),
			downgradeStartTime: null,
			upgradeStartTime: null,
			pendingAction: null, // 'downgrade' | 'upgrade' | null
		};
	}

	/**
	 * Validate and return a positive number, or default value
	 *
	 * @param {*} value - Value to validate
	 * @param {number} defaultValue - Default value if validation fails
	 * @returns {number}
	 */
	#validatePositiveNumber(value, defaultValue)
	{
		const num = Number(value);
		if (!Number.isFinite(num) || num <= 0)
		{
			return defaultValue;
		}

		return num;
	}

	/**
	 * Get formatted quality thresholds per stream quality
	 *
	 * @param {Object} options - Initial options for NQE
	 * @returns {Object} - Formatted options for NQE
	 */
	#getQualityThresholds(options)
	{
		return {
			[STREAM_QUALITY.HIGH]: {
				downgrade: {
					packetsLostPct: this.#validatePositiveNumber(options?.nqeHighDowngradePacketsLostPct, 5),
					rttMs: this.#validatePositiveNumber(options?.nqeHighDowngradeRttMs, 100),
					jitterMs: this.#validatePositiveNumber(options?.nqeHighDowngradeJitterMs, 30),
				},
			},
			[STREAM_QUALITY.MEDIUM]: {
				downgrade: {
					packetsLostPct: this.#validatePositiveNumber(options?.nqeMedDowngradePacketsLostPct, 10),
					rttMs: this.#validatePositiveNumber(options?.nqeMedDowngradeRttMs, 200),
					jitterMs: this.#validatePositiveNumber(options?.nqeMedDowngradeJitterMs, 50),
				},
				upgrade: {
					packetsLostPct: this.#validatePositiveNumber(options?.nqeMedUpgradePacketsLostPct, 2),
					rttMs: this.#validatePositiveNumber(options?.nqeMedUpgradeRttMs, 80),
					jitterMs: this.#validatePositiveNumber(options?.nqeMedUpgradeJitterMs, 25),
				},
			},
			[STREAM_QUALITY.LOW]: {
				upgrade: {
					packetsLostPct: this.#validatePositiveNumber(options?.nqeLowUpgradePacketsLostPct, 3),
					rttMs: this.#validatePositiveNumber(options?.nqeLowUpgradeRttMs, 150),
					jitterMs: this.#validatePositiveNumber(options?.nqeLowUpgradeJitterMs, 40),
				},
			},
		};
	}

	/**
	 * Check if stats contain actual media traffic (inbound-rtp or outbound-rtp reports).
	 *
	 * @param {RTCStatsReport} stats - RTCStatsReport object (Map-like, iterable)
	 * @returns {boolean}
	 */
	#hasMediaTraffic(stats)
	{
		if (!stats)
		{
			return false;
		}

		// Short-circuit: bail out on the first RTP media report.
		for (const report of stats.values())
		{
			if (report.type === 'inbound-rtp' || report.type === 'outbound-rtp')
			{
				return true;
			}
		}

		return false;
	}

	/**
	 * Reset an unfinished hysteresis window without changing quality or warmup state.
	 */
	resetPendingWindow()
	{
		this.state.downgradeStartTime = null;
		this.state.upgradeStartTime = null;
		this.state.pendingAction = null;
	}

	/**
	 * Process WebRTC stats and evaluate quality actions
	 *
	 * @param {Object} publisherStats - Publisher stats from getStats() (optional, for consume-only users)
	 * @param {Object} subscriberStats - Subscriber stats from getStats()
	 * @returns {string} - Action: 'downgrade' | 'upgrade' | 'stable'
	 */
	processStats(publisherStats, subscriberStats)
	{
		if (!subscriberStats)
		{
			this.resetPendingWindow();

			return 'stable';
		}

		// If no actual media traffic, return stable (no evaluation needed)
		if (!this.#hasMediaTraffic(publisherStats) && !this.#hasMediaTraffic(subscriberStats))
		{
			this.resetPendingWindow();

			return 'stable';
		}

		// Warmup phase
		if (this.state.isWarmup && (Date.now() - this.state.warmupStartTime) < this.warmupSec * 1000)
		{
			return 'stable'; // Still in warmup phase
		}

		// Warmup phase just ended
		if (this.state.isWarmup)
		{
			this.state.isWarmup = false;
		}

		const score = this.#calculateCompositeScore(publisherStats, subscriberStats);
		const action = this.#evaluateHysteresis(score);

		if (action === 'downgrade')
		{
			// Direction switched from upgrade: drop the stale upgrade timer/pending
			// so a fresh downgrade window can start without waiting for a 'stable' tick.
			this.state.upgradeStartTime = null;
			if (this.state.pendingAction === 'upgrade')
			{
				this.state.pendingAction = null;
			}

			// start timer only once per pending downgrade
			if (!this.state.downgradeStartTime)
			{
				this.state.downgradeStartTime = Date.now();
				this.state.pendingAction = 'downgrade';
			}

			// if hysteresis elapsed, apply downgrade now
			if (this.shouldDowngrade() && this.state.pendingAction === 'downgrade')
			{
				this.downgrade();
				this.resetPendingWindow();

				return action;
			}

			return 'stable';
		}

		if (action === 'upgrade')
		{
			// Direction switched from downgrade: drop the stale downgrade timer/pending
			// so a fresh upgrade window can start without waiting for a 'stable' tick.
			this.state.downgradeStartTime = null;
			if (this.state.pendingAction === 'downgrade')
			{
				this.state.pendingAction = null;
			}

			if (!this.state.upgradeStartTime)
			{
				this.state.upgradeStartTime = Date.now();
				this.state.pendingAction = 'upgrade';
			}

			if (this.shouldUpgrade() && this.state.pendingAction === 'upgrade')
			{
				this.upgrade();
				this.resetPendingWindow();

				return action;
			}

			return 'stable';
		}

		if (action === 'stable')
		{
			this.resetPendingWindow();
		}

		return action;
	}

	/**
	 * Check if downgrade should be executed (hysteresis window)
	 *
	 * @returns {boolean}
	 */
	shouldDowngrade()
	{
		if (this.state.pendingAction !== 'downgrade')
		{
			return false;
		}

		if (!this.state.downgradeStartTime)
		{
			return false;
		}

		if (this.state.currentQuality === STREAM_QUALITY.LOW)
		{
			return false;
		}
		const elapsed = (Date.now() - this.state.downgradeStartTime) / 1000;

		return elapsed >= this.downgradeWindowSec;
	}

	/**
	 * Check if upgrade should be executed (hysteresis window)
	 *
	 * @returns {boolean}
	 */
	shouldUpgrade()
	{
		if (this.state.pendingAction !== 'upgrade')
		{
			return false;
		}

		if (!this.state.upgradeStartTime)
		{
			return false;
		}

		if (this.state.currentQuality === STREAM_QUALITY.HIGH)
		{
			return false;
		}

		// Manual selection is a hard ceiling: never auto-upgrade above the target quality.
		if (this.state.currentQuality >= this.state.targetQuality)
		{
			return false;
		}

		const elapsed = (Date.now() - this.state.upgradeStartTime) / 1000;

		return elapsed >= this.upgradeWindowSec;
	}

	/**
	 * Execute downgrade to next quality level
	 */
	downgrade()
	{
		const levels = [STREAM_QUALITY.HIGH, STREAM_QUALITY.MEDIUM, STREAM_QUALITY.LOW];
		const currentIndex = levels.indexOf(this.state.currentQuality);
		if (currentIndex < levels.length - 1)
		{
			this.state.previousQuality = this.state.currentQuality;
			this.state.currentQuality = levels[currentIndex + 1];
		}
	}

	/**
	 * Execute upgrade to previous quality level
	 */
	upgrade()
	{
		const levels = [STREAM_QUALITY.HIGH, STREAM_QUALITY.MEDIUM, STREAM_QUALITY.LOW];
		const currentIndex = levels.indexOf(this.state.currentQuality);
		if (currentIndex > 0)
		{
			this.state.previousQuality = this.state.currentQuality;
			this.state.currentQuality = levels[currentIndex - 1];
		}
	}

	/**
	 * Set manual target quality ceiling
	 *
	 * @param {number} quality - Target quality level (STREAM_QUALITY)
	 */
	setManualTarget(quality)
	{
		// Keep previousQuality consistent with upgrade()/downgrade() semantics so that
		// monitoring events (AUTO_QUALITY_DEGRADED/IMPROVED) compare against the level
		// right before this change, not a stale one.
		this.state.previousQuality = this.state.currentQuality;
		this.state.targetQuality = quality;
		this.state.currentQuality = quality;

		// Restart hysteresis windows: a manual choice must not apply a stale, already
		// elapsed window on the next processStats.
		this.resetPendingWindow();
	}

	/**
	 * Get current quality level
	 *
	 * @returns {number}
	 */
	getCurrentQuality()
	{
		return this.state.currentQuality;
	}

	/**
	 * Get previous quality level (before last change)
	 *
	 * @returns {number|null}
	 */
	getPreviousQuality()
	{
		return this.state.previousQuality;
	}

	/**
	 * Extract relevant metrics from RTCStatsReport
	 *
	 * @param {RTCStatsReport} stats - RTCStatsReport object (Map-like)
	 * @returns {Object} - Extracted metrics { packetsLost, rtt, jitter }
	 */
	#extractMetricsFromStats(stats)
	{
		if (!stats)
		{
			return { packetsLost: null, rtt: null, jitter: null };
		}

		let packetsLost = null;
		let rtt = null;
		let jitter = null;
		let totalPacketsLost = 0;
		let packetsLostCount = 0;
		let totalJitter = 0;
		let jitterCount = 0;
		let totalRtt = 0;
		let rttCount = 0;

		// RTCStatsReport is array-like, iterate through reports
		stats.forEach((rawReport) => {
			const report = { ...rawReport };

			// Use pre-calculated packet loss percentage from packetsLostData
			if (
				report.type === 'inbound-rtp'
				&& report.packetsLostData
				&& Type.isNumber(report.packetsLostData.currentPercentPacketLost)
			)
			{
				totalPacketsLost += report.packetsLostData.currentPercentPacketLost;
				packetsLostCount++;
			}

			// Extract jitter from inbound-rtp reports for consume-only users
			if (report.type === 'inbound-rtp' && Type.isNumber(report.jitter))
			{
				totalJitter += report.jitter * 1000; // Convert to milliseconds;
				jitterCount++;
			}

			// Extract jitter from remote-inbound-rtp reports (publisher side)
			if (report.type === 'remote-inbound-rtp' && report.active === true && Type.isNumber(report.jitter))
			{
				totalJitter += report.jitter * 1000; // Convert to milliseconds
				jitterCount++;
			}

			// Extract RTT from remote-inbound-rtp reports (more accurate)
			if (report.type === 'remote-inbound-rtp' && report.active === true && Type.isNumber(report.roundTripTime))
			{
				totalRtt += report.roundTripTime * 1000; // Convert to milliseconds
				rttCount++;
			}
		});

		// Calculate average packetsLost
		if (packetsLostCount > 0)
		{
			packetsLost = totalPacketsLost / packetsLostCount;
		}

		// Calculate average jitter
		if (jitterCount > 0)
		{
			jitter = totalJitter / jitterCount;
		}

		// Calculate average rtt
		if (rttCount > 0)
		{
			rtt = totalRtt / rttCount;
		}

		return { packetsLost, rtt, jitter };
	}

	/**
	 * Calculate composite score from stats
	 *
	 * @param {RTCStatsReport} publisherStats - Publisher stats
	 * @param {RTCStatsReport} subscriberStats - Subscriber stats
	 * @returns {Object} - Composite score { packetsLost, rtt, jitter, hasValidData }
	 */
	#calculateCompositeScore(publisherStats, subscriberStats)
	{
		// Extract metrics from stats
		const publisherMetrics = this.#extractMetricsFromStats(publisherStats);
		const subscriberMetrics = this.#extractMetricsFromStats(subscriberStats);

		// Select by Type.isNumber so a measured 0 is kept, not discarded as falsy.
		// Packet loss and jitter come from the subscriber side, RTT from the publisher
		// (with a subscriber fallback for consume-only users without publisher stats).
		const packetsLost = Type.isNumber(subscriberMetrics.packetsLost)
			? subscriberMetrics.packetsLost
			: null;

		const rtt = Type.isNumber(publisherMetrics.rtt)
			? publisherMetrics.rtt
			: (Type.isNumber(subscriberMetrics.rtt) ? subscriberMetrics.rtt : null);

		const jitter = Type.isNumber(publisherMetrics.jitter)
			? publisherMetrics.jitter
			: (Type.isNumber(subscriberMetrics.jitter) ? subscriberMetrics.jitter : null);

		// At least one real measurement is required to trust the score. When every
		// metric is absent everything coalesces to 0, which must NOT be read as
		// "perfect network" and trigger an upgrade (see #evaluateHysteresis).
		const hasValidData = Type.isNumber(packetsLost) || Type.isNumber(rtt) || Type.isNumber(jitter);

		return {
			packetsLost: Type.isNumber(packetsLost) ? packetsLost : 0,
			rtt: Type.isNumber(rtt) ? rtt : 0,
			jitter: Type.isNumber(jitter) ? jitter : 0,
			hasValidData,
		};
	}

	/**
	 * Evaluate hysteresis conditions
	 *
	 * @param {Object} score - Composite score { packetsLost, rtt, jitter, hasValidData }
	 * @returns {string} - 'downgrade' | 'upgrade' | 'stable'
	 */
	#evaluateHysteresis(score)
	{
		// Get quality-specific thresholds based on current quality level
		const thresholds = this.qualityThresholds[this.state.currentQuality];
		if (!thresholds)
		{
			return 'stable';
		}

		// No real measurement this tick: metrics are coalesced to 0. Upgrade must never
		// be granted on absence of data (all `0 < threshold` would look like a perfect
		// link). Downgrade uses `>=` against positive thresholds, so all-zero cannot
		// trigger it either; returning 'stable' keeps the state put.
		if (!score.hasValidData)
		{
			return 'stable';
		}

		const shouldDowngrade = score.packetsLost >= thresholds.downgrade?.packetsLostPct
			|| score.rtt >= thresholds.downgrade?.rttMs
			|| score.jitter >= thresholds.downgrade?.jitterMs;

		if (shouldDowngrade)
		{
			return 'downgrade';
		}

		const shouldUpgrade = score.packetsLost < thresholds.upgrade?.packetsLostPct
			&& score.rtt < thresholds.upgrade?.rttMs
			&& score.jitter < thresholds.upgrade?.jitterMs;

		if (shouldUpgrade)
		{
			return 'upgrade';
		}

		return 'stable';
	}
}

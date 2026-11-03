/**
 * @module call/network-quality-evaluator
 */
jn.define('call/network-quality-evaluator', (require, exports, module) => {
	const { StreamQuality } = require('call/const');

	/**
	 * NetworkQualityEvaluator - evaluates network quality for video streams in group calls
	 * Implements automatic quality balancing with hysteresis for subscriber streams
	 */
	class NetworkQualityEvaluator
	{
		constructor(options = {})
		{
			// Hysteresis state
			this.state = {
				currentQuality: StreamQuality.high,
				previousQuality: null,
				isWarmup: true,
				warmupStartTime: Date.now(),
				downgradeStartTime: null,
				upgradeStartTime: null,
				pendingAction: null,
			};

			// Common hysteresis parameters
			this.downgradeWindowSec = this.#validatePositiveNumber(options.downgradeWindowSec, 5);
			this.upgradeWindowSec = this.#validatePositiveNumber(options.upgradeWindowSec, 15);
			this.warmupSec = this.#validatePositiveNumber(options.warmupSec, 30);

			// Quality-specific thresholds for downgrade/upgrade.
			// Keyed by the numeric StreamQuality values held in state.currentQuality.
			this.qualityThresholds = {
				[StreamQuality.high]: {
					downgrade: {
						packetsLostPct: this.#validatePositiveNumber(options.highToMedium?.downgrade?.packetsLostPct, 5),
						rttMs: this.#validatePositiveNumber(options.highToMedium?.downgrade?.rttMs, 100),
						jitterMs: this.#validatePositiveNumber(options.highToMedium?.downgrade?.jitterMs, 30),
					},
					upgrade: null, // Cannot go above HIGH (1080p)
				},
				[StreamQuality.medium]: {
					downgrade: {
						packetsLostPct: this.#validatePositiveNumber(options.mediumToLow?.downgrade?.packetsLostPct, 10),
						rttMs: this.#validatePositiveNumber(options.mediumToLow?.downgrade?.rttMs, 200),
						jitterMs: this.#validatePositiveNumber(options.mediumToLow?.downgrade?.jitterMs, 50),
					},
					upgrade: {
						packetsLostPct: this.#validatePositiveNumber(options.mediumToHigh?.upgrade?.packetsLostPct, 2),
						rttMs: this.#validatePositiveNumber(options.mediumToHigh?.upgrade?.rttMs, 80),
						jitterMs: this.#validatePositiveNumber(options.mediumToHigh?.upgrade?.jitterMs, 25),
					},
				},
				[StreamQuality.low]: {
					downgrade: null, // Cannot go below LOW (180p)
					upgrade: {
						packetsLostPct: this.#validatePositiveNumber(options.lowToMedium?.upgrade?.packetsLostPct, 3),
						rttMs: this.#validatePositiveNumber(options.lowToMedium?.upgrade?.rttMs, 150),
						jitterMs: this.#validatePositiveNumber(options.lowToMedium?.upgrade?.jitterMs, 40),
					},
				},
			};
		}

		/**
		 * Process WebRTC stats and evaluate quality actions
		 *
		 * @param {Object} publisherStats - Publisher stats (SENDER section, { trackStats: [...] }) from getPeerConnectionStats() (optional, for consume-only users)
		 * @param {Object} subscriberStats - Subscriber stats (RECEIVER section, { trackStats: [...] }) from getPeerConnectionStats()
		 * @returns {string} - Action: 'downgrade' | 'upgrade' | 'stable'
		 */
		processStats(publisherStats, subscriberStats)
		{
			if (!subscriberStats)
			{
				this.resetPendingWindow();

				return 'stable';
			}

			if (this.state.isWarmup && (Date.now() - this.state.warmupStartTime) < this.warmupSec * 1000)
			{
				return 'stable';
			}

			if (this.state.isWarmup)
			{
				this.state.isWarmup = false;
			}

			const score = this.#calculateCompositeScore(publisherStats, subscriberStats);
			const action = this.#evaluateHysteresis(score);

			if (action === 'downgrade')
			{
				// Switching intent: drop any pending upgrade timer so a stale
				// counter cannot block or mis-fire the downgrade decision
				this.state.upgradeStartTime = null;
				if (!this.state.downgradeStartTime)
				{
					this.state.downgradeStartTime = Date.now();
				}
				this.state.pendingAction = 'downgrade';

				if (this.shouldDowngrade())
				{
					this.downgradeSubscription();
					// clear pending state
					this.state.downgradeStartTime = null;
					this.state.pendingAction = null;

					return action;
				}

				return 'stable';
			}

			if (action === 'upgrade')
			{
				// Switching intent: drop any pending downgrade timer
				this.state.downgradeStartTime = null;
				if (!this.state.upgradeStartTime)
				{
					this.state.upgradeStartTime = Date.now();
				}
				this.state.pendingAction = 'upgrade';

				if (this.shouldUpgrade())
				{
					this.upgradeSubscription();
					this.state.upgradeStartTime = null;
					this.state.pendingAction = null;

					return action;
				}

				return 'stable';
			}

			if (action === 'stable')
			{
				this.state.downgradeStartTime = null;
				this.state.upgradeStartTime = null;
				this.state.pendingAction = null;
			}

			return action;
		}

		/**
		 * Resets an unfinished hysteresis window without changing the quality.
		 */
		resetPendingWindow()
		{
			this.state.downgradeStartTime = null;
			this.state.upgradeStartTime = null;
			this.state.pendingAction = null;
		}

		/**
		 * Checks if downgrade should be performed based on hysteresis window
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

			// Cannot go below LOW
			if (this.state.currentQuality === StreamQuality.low)
			{
				return false;
			}

			const elapsed = (Date.now() - this.state.downgradeStartTime) / 1000;

			return elapsed >= this.downgradeWindowSec;
		}

		/**
		 * Checks if upgrade should be performed based on hysteresis window
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

			// Cannot go above HIGH
			if (this.state.currentQuality === StreamQuality.high)
			{
				return false;
			}

			const elapsed = (Date.now() - this.state.upgradeStartTime) / 1000;

			return elapsed >= this.upgradeWindowSec;
		}

		/**
		 * Upgrades subscription quality
		 * @returns {number} - new quality level (StreamQuality)
		 */
		upgradeSubscription()
		{
			const levels = [StreamQuality.high, StreamQuality.medium, StreamQuality.low];
			const currentIndex = levels.indexOf(this.state.currentQuality);
			if (currentIndex > 0)
			{
				this.state.previousQuality = this.state.currentQuality;
				this.state.currentQuality = levels[currentIndex - 1];
			}

			return this.state.currentQuality;
		}

		/**
		 * Downgrades subscription quality
		 * @returns {number} - new quality level (StreamQuality)
		 */
		downgradeSubscription()
		{
			const levels = [StreamQuality.high, StreamQuality.medium, StreamQuality.low];
			const currentIndex = levels.indexOf(this.state.currentQuality);
			if (currentIndex < levels.length - 1)
			{
				this.state.previousQuality = this.state.currentQuality;
				this.state.currentQuality = levels[currentIndex + 1];
			}

			return this.state.currentQuality;
		}

		/**
		 * Gets current quality level
		 * @returns {number} - StreamQuality value
		 */
		getCurrentQuality()
		{
			return this.state.currentQuality;
		}

		/**
		 * Extract relevant metrics from a native stats section (trackStats[])
		 *
		 * @param {Object} stats - Native stats section ({ trackStats: [...] }) from getPeerConnectionStats()
		 * @returns {Object} - Extracted metrics { packetsLost, rtt, jitter, qualityLimitationReason }
		 */
		#extractMetricsFromStats(stats)
		{
			if (!stats)
			{
				return { packetsLost: null, rtt: null, jitter: null, qualityLimitationReason: 'none' };
			}

			let packetsLost = null;
			let rtt = null;
			let jitter = null;
			let qualityLimitationReason = 'none';
			let totalPacketsLost = 0;
			let packetsLostCount = 0;
			let totalJitter = 0;
			let jitterCount = 0;
			let totalRtt = 0;
			let rttCount = 0;

			stats.trackStats?.forEach((report) => {
				if (report.qualityLimitationReason && report.qualityLimitationReason !== 'none')
				{
					qualityLimitationReason = report.qualityLimitationReason;
				}

				if (Number.isFinite(report.averagePacketLoss))
				{
					totalPacketsLost += report.averagePacketLoss;
					packetsLostCount++;
				}

				if (Number.isFinite(report.averageJitter))
				{
					// Native reports jitter in seconds, thresholds are in milliseconds
					totalJitter += report.averageJitter * 1000;
					jitterCount++;
				}

				if (Number.isFinite(report.averageRtt) && report.active === true)
				{
					// Native reports RTT in seconds, thresholds are in milliseconds
					totalRtt += report.averageRtt * 1000;
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

			return { packetsLost, rtt, jitter, qualityLimitationReason };
		}

		/**
		 * Gets previous quality level
		 * @returns {number|null} - StreamQuality value or null
		 */
		getPreviousQuality()
		{
			return this.state.previousQuality;
		}

		/**
		 * Validates positive number and returns default if invalid
		 * @private
		 * @param {number} value - value to validate
		 * @param {number} defaultValue - default value if validation fails
		 * @returns {number}
		 */
		#validatePositiveNumber(value, defaultValue)
		{
			const numValue = Number(value);

			return Number.isFinite(numValue) && numValue > 0 ? numValue : defaultValue;
		}

		/**
		 * Calculate composite score from stats
		 *
		 * @param {Object} publisherStats - Publisher stats
		 * @param {Object} subscriberStats - Subscriber stats
		 * @returns {Object} - Composite score { packetsLost, rtt, jitter, qualityLimitationReason }
		 */
		#calculateCompositeScore(publisherStats, subscriberStats)
		{
			const publisherMetrics = this.#extractMetricsFromStats(publisherStats);
			const subscriberMetrics = this.#extractMetricsFromStats(subscriberStats);

			const packetsLost = Number.isFinite(subscriberMetrics.packetsLost)
				? subscriberMetrics.packetsLost
				: null;
			// RTT: publisher (outbound) stats are the primary source — per SDD (Q-1) averageRtt is
			// usually present only on outbound tracks, and publisher-RTT reflects the sender's uplink
			// round-trip to the media server. The fallback to subscriberMetrics.rtt is intentional as
			// a safety net: if publisher-RTT is unavailable but the receiving side reported a value,
			// we still account for the RTT signal instead of losing it.
			const rtt = Number.isFinite(publisherMetrics.rtt)
				? publisherMetrics.rtt
				: (Number.isFinite(subscriberMetrics.rtt) ? subscriberMetrics.rtt : null);
			const jitter = Number.isFinite(subscriberMetrics.jitter)
				? subscriberMetrics.jitter
				: null;
			const qualityLimitationReason = publisherMetrics.qualityLimitationReason || 'none';
			const hasValidData = Number.isFinite(packetsLost)
				|| Number.isFinite(rtt)
				|| Number.isFinite(jitter)
				|| qualityLimitationReason !== 'none';

			return {
				packetsLost: Number.isFinite(packetsLost) ? packetsLost : 0,
				rtt: Number.isFinite(rtt) ? rtt : 0,
				jitter: Number.isFinite(jitter) ? jitter : 0,
				qualityLimitationReason,
				hasValidData,
			};
		}

		/**
		 * Evaluates hysteresis based on composite score
		 * @private
		 * @param {Object} score - composite score
		 * @returns {string} - 'downgrade', 'upgrade', or 'stable'
		 */
		#evaluateHysteresis(score)
		{
			const thresholds = this.qualityThresholds[this.state.currentQuality];
			if (!thresholds)
			{
				return 'stable';
			}

			if (!score.hasValidData)
			{
				return 'stable';
			}

			// Downgrade: any metric exceeds threshold OR there's quality limitation
			if (thresholds.downgrade)
			{
				const shouldDowngrade = score.packetsLost >= thresholds.downgrade.packetsLostPct
					|| score.rtt >= thresholds.downgrade.rttMs
					|| score.jitter >= thresholds.downgrade.jitterMs
					|| score.qualityLimitationReason !== 'none';

				if (shouldDowngrade)
				{
					return 'downgrade';
				}
			}

			// Upgrade: all metrics below thresholds AND no quality limitation
			if (thresholds.upgrade)
			{
				const shouldUpgrade = score.packetsLost < thresholds.upgrade.packetsLostPct
					&& score.rtt < thresholds.upgrade.rttMs
					&& score.jitter < thresholds.upgrade.jitterMs
					&& score.qualityLimitationReason === 'none';

				if (shouldUpgrade)
				{
					return 'upgrade';
				}
			}

			return 'stable';
		}
	}

	module.exports = { NetworkQualityEvaluator };
});

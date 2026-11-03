/**
 * @module call/settings-manager
 */
jn.define('call/settings-manager', (require, exports, module) => {
	class CallSettings
	{
		constructor()
		{
			this.jwtCallsEnabled = BX.componentParameters.get('jwtCallsEnabled');
			this.plainCallsUseJwt = BX.componentParameters.get('jwtInPlainCallsEnabled');
			this.plainCallFollowUpEnabled = BX.componentParameters.get('plainCallFollowUpEnabled');
			this.plainCallCloudRecordingEnabled = BX.componentParameters.get('plainCallCloudRecordingEnabled');
			this.callBalancerUrl = BX.componentParameters.get('callBalancerUrl');
			this.optionsForTestingEnabled = BX.componentParameters.get('optionsForTestingEnabled');
			this.gridViewEnabled = BX.componentParameters.get('gridViewEnabled');
			this.finishForAllEnabled = BX.componentParameters.get('finishForAllEnabled', false);
			this.viewToggleEnabled = BX.componentParameters.get('viewToggleEnabled');
			this.mobileCallUIVisibilityTimer = BX.componentParameters.get('mobileCallUIVisibilityTimer');
			this.callInvitePeriod = BX.componentParameters.get('callInvitePeriod');
			this.isLargeMobileCallEnabled = BX.componentParameters.get('isLargeMobileCallEnabled');
			this.syncCallInvitePeriod = BX.componentParameters.get('syncCallInvitePeriod');
			this.autoBalanceEnabled = BX.componentParameters.get('autoBalanceEnabled');
			this.nqeDowngradeWindowSec = BX.componentParameters.get('nqeDowngradeWindowSec');
			this.nqeUpgradeWindowSec = BX.componentParameters.get('nqeUpgradeWindowSec');
			this.nqeWarmupSec = BX.componentParameters.get('nqeWarmupSec');
			this.nqeHighDowngradePacketsLostPct = BX.componentParameters.get('nqeHighDowngradePacketsLostPct');
			this.nqeHighDowngradeRttMs = BX.componentParameters.get('nqeHighDowngradeRttMs');
			this.nqeHighDowngradeJitterMs = BX.componentParameters.get('nqeHighDowngradeJitterMs');
			this.nqeMedDowngradePacketsLostPct = BX.componentParameters.get('nqeMedDowngradePacketsLostPct');
			this.nqeMedDowngradeRttMs = BX.componentParameters.get('nqeMedDowngradeRttMs');
			this.nqeMedDowngradeJitterMs = BX.componentParameters.get('nqeMedDowngradeJitterMs');
			this.nqeMedUpgradePacketsLostPct = BX.componentParameters.get('nqeMedUpgradePacketsLostPct');
			this.nqeMedUpgradeRttMs = BX.componentParameters.get('nqeMedUpgradeRttMs');
			this.nqeMedUpgradeJitterMs = BX.componentParameters.get('nqeMedUpgradeJitterMs');
			this.nqeLowUpgradePacketsLostPct = BX.componentParameters.get('nqeLowUpgradePacketsLostPct');
			this.nqeLowUpgradeRttMs = BX.componentParameters.get('nqeLowUpgradeRttMs');
			this.nqeLowUpgradeJitterMs = BX.componentParameters.get('nqeLowUpgradeJitterMs');
		}

		/**
		 * @param {CallSettingsType} settings
		 */
		setup(settings)
		{
			if (settings.jwtCallsEnabled !== undefined)
			{
				this.jwtCallsEnabled = settings.jwtCallsEnabled;
			}

			if (settings.plainCallsUseJwt !== undefined)
			{
				this.plainCallsUseJwt = settings.plainCallsUseJwt;
			}

			if (settings.plainCallFollowUpEnabled !== undefined)
			{
				this.plainCallFollowUpEnabled = settings.plainCallFollowUpEnabled;
			}

			if (settings.plainCallCloudRecordingEnabled !== undefined)
			{
				this.plainCallCloudRecordingEnabled = settings.plainCallCloudRecordingEnabled;
			}

			if (settings.callBalancerUrl !== undefined)
			{
				this.callBalancerUrl = settings.callBalancerUrl;
			}

			if (settings.optionsForTestingEnabled !== undefined)
			{
				this.optionsForTestingEnabled = settings.optionsForTestingEnabled;
			}

			if (settings.gridViewEnabled !== undefined)
			{
				this.gridViewEnabled = settings.gridViewEnabled;
			}

			if (settings.finishForAllEnabled !== undefined)
			{
				this.finishForAllEnabled = settings.finishForAllEnabled;
			}

			if (settings.viewToggleEnabled !== undefined)
			{
				this.viewToggleEnabled = settings.viewToggleEnabled;
			}

			if (settings.mobileCallUIVisibilityTimer !== undefined)
			{
				this.mobileCallUIVisibilityTimer = settings.mobileCallUIVisibilityTimer;
			}

			if (settings.callInvitePeriod !== undefined)
			{
				this.callInvitePeriod = settings.callInvitePeriod;
			}

			if (settings.isLargeMobileCallEnabled !== undefined)
			{
				this.isLargeMobileCallEnabled = settings.isLargeMobileCallEnabled;
			}

			if (settings.syncCallInvitePeriod !== undefined)
			{
				this.syncCallInvitePeriod = settings.syncCallInvitePeriod;
			}

			if (settings.autoBalanceEnabled !== undefined)
			{
				this.autoBalanceEnabled = settings.autoBalanceEnabled;
			}
		}

		/**
		 * @return {boolean}
		 */
		get jwtCallsEnabled()
		{
			return this._jwtCallsEnabled;
		}

		/**
		 * @param {boolean} flag
		 */
		set jwtCallsEnabled(flag)
		{
			this._jwtCallsEnabled = flag;
		}

		/**
		 * @return {boolean}
		 */
		get plainCallsUseJwt()
		{
			return this._plainCallsUseJwt;
		}

		/**
		 * @param {boolean} flag
		 */
		set plainCallsUseJwt(flag)
		{
			this._plainCallsUseJwt = flag;
		}

		/**
		 * @return {boolean}
		 */
		get plainCallFollowUpEnabled()
		{
			return this.isJwtInPlainCallsEnabled && this._plainCallFollowUpEnabled;
		}

		/**
		 * @param {boolean} flag
		 */
		set plainCallFollowUpEnabled(flag)
		{
			this._plainCallFollowUpEnabled = flag;
		}

		/**
		 * @return {boolean}
		 */
		get plainCallCloudRecordingEnabled()
		{
			return this.isJwtInPlainCallsEnabled && this._plainCallCloudRecordingEnabled;
		}

		/**
		 * @param {boolean} flag
		 */
		set plainCallCloudRecordingEnabled(flag)
		{
			this._plainCallCloudRecordingEnabled = flag;
		}

		get mobileCallUIVisibilityTimer()
		{
			return this._mobileCallUIVisibilityTimer;
		}

		set mobileCallUIVisibilityTimer(flag)
		{
			this._mobileCallUIVisibilityTimer = flag;
		}

		get callInvitePeriod()
		{
			return this._callInvitePeriod;
		}

		set callInvitePeriod(value)
		{
			if (Number.isFinite(value) && value > 0)
			{
				this._callInvitePeriod = value;
			}
		}

		get optionsForTestingEnabled()
		{
			return this._optionsForTestingEnabled;
		}

		set optionsForTestingEnabled(flag)
		{
			this._optionsForTestingEnabled = flag;
		}

		set gridViewEnabled(flag)
		{
			this._gridViewEnabled = flag;
		}

		get gridViewEnabled()
		{
			return this._gridViewEnabled;
		}

		/**
		 * @return {boolean}
		 */
		get finishForAllEnabled()
		{
			return this._finishForAllEnabled;
		}

		/**
		 * @param {boolean} flag
		 */
		set finishForAllEnabled(flag)
		{
			this._finishForAllEnabled = flag;
		}

		set viewToggleEnabled(flag)
		{
			this._viewToggleEnabled = flag;
		}

		get viewToggleEnabled()
		{
			return this._viewToggleEnabled;
		}

		/**
		 * @return {string}
		 */
		get callBalancerUrl()
		{
			return this._callBalancerUrl;
		}

		/**
		 * @param {string} value
		 */
		set callBalancerUrl(value)
		{
			this._callBalancerUrl = value;
		}

		/**
		 * @return {boolean}
		 */
		get isLargeMobileCallEnabled()
		{
			return this._isLargeMobileCallEnabled;
		}

		/**
		 * @param {boolean} flag
		 */
		set isLargeMobileCallEnabled(flag)
		{
			this._isLargeMobileCallEnabled = flag;
		}

		get syncCallInvitePeriod()
		{
			return this._syncCallInvitePeriod;
		}

		set syncCallInvitePeriod(value)
		{
			this._syncCallInvitePeriod = value;
		}

		/**
		 * @return {boolean}
		 */
		isJwtInPlainCallsEnabled()
		{
			return this.isJwtCallsEnabled() && this.plainCallsUseJwt;
		}

		/**
		 * @return {boolean}
		 */
		isJwtCallsEnabled()
		{
			return this.isJwtCallsSupported() && this.jwtCallsEnabled;
		}

		/**
		 * @return {boolean}
		 */
		isJwtCallsSupported()
		{
			// Old app builds have no JWT bridge: the global may be undeclared, empty or hold no instance.
			if (typeof BXClient === 'undefined')
			{
				return false;
			}

			const client = BXClient?.getInstance?.();

			return Boolean(client) && 'startCall' in client;
		}

		/**
		 * Checks if auto-balance feature is available (server-side gating only)
		 * @return {boolean}
		 */
		isAutoBalanceAvailable()
		{
			// Check server-side flag only
			return this.autoBalanceEnabled === true;
		}
	}

	module.exports = {
		CallSettingsManager: new CallSettings(),
	};
});

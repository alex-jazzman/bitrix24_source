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
		isJwtInPlainCallsEnabled()
		{
			return this.isJwtCallsEnabled() && this.plainCallsUseJwt;
		}

		/**
		 * @return {boolean}
		 */
		isJwtCallsEnabled()
		{
			return this.isJwtCallsSupported && this.jwtCallsEnabled;
		}

		/**
		 * @return {boolean}
		 */
		isJwtCallsSupported()
		{
			return 'startCall' in BXClient.getInstance();
		}
	}

	module.exports = {
		CallSettingsManager: new CallSettings(),
	};
});

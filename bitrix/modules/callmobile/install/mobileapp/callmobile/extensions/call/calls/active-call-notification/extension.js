jn.define('call/calls/active-call-notification', (require, exports, module) => {

	class ActiveCallNotification
	{
		constructor(params = {})
		{
			this.callbacks = {
				onSwitchMicrophonesStatus: BX.type.isFunction(params.onSwitchMicrophonesStatus) ? params.onSwitchMicrophonesStatus : BX.DoNothing,
				onHangup: BX.type.isFunction(params.onHangup) ? params.onHangup : BX.DoNothing,
			};

			this.bxNotification = null;

			this.onActiveCallNotificationSwitchMicrophoneStatusHandler = this.#onActiveCallNotificationSwitchMicrophonesStatus.bind(this);
			this.onActiveCallNotificationHangupHandler = this.#onActiveCallNotificationHangup.bind(this);
		}


		show(notificationParams)
		{
			try
			{
				if (this.bxNotification == null)
				{
					this.bxNotification = BXActiveCallNotification.getInstance();
					this.bxNotification.on(BXActiveCallNotification.Events.SwitchMicrophoneStatus, this.onActiveCallNotificationSwitchMicrophoneStatusHandler);
					this.bxNotification.on(BXActiveCallNotification.Events.Hangup, this.onActiveCallNotificationHangupHandler);

					this.bxNotification.show(notificationParams);
				}
			}
			catch (e)
			{
				console.error("Unable to create notification", e);
			}
		}

		update(notificationParams)
		{
			try
			{
				if (this.bxNotification != null)
				{
					this.bxNotification.update(notificationParams);
				}
			}
			catch (e)
			{
				console.error("Unable to update microphone status", e);
			}
		}

		dismiss()
		{
			if (Application.getPlatform() === 'android' && this.bxNotification != null)
			{
				try
				{
					this.bxNotification.off(BXActiveCallNotification.Events.SwitchMicrophoneStatus, this.onActiveCallNotificationSwitchMicrophoneStatusHandler);
					this.bxNotification.off(BXActiveCallNotification.Events.Hangup, this.onActiveCallNotificationHangupHandler);

					this.bxNotification.dismiss();
					this.bxNotification = null;
				}
				catch (e)
				{
					console.error("Unable to dismiss notification", e);
				}
			}
		}

		destroy()
		{
			this.dismiss();
			this.callbacks.onSwitchMicrophonesStatus = BX.DoNothing;
			this.callbacks.onHangup = BX.DoNothing;
		}

		#onActiveCallNotificationSwitchMicrophonesStatus()
		{
			this.callbacks.onSwitchMicrophonesStatus();
		}

		#onActiveCallNotificationHangup()
		{
			this.callbacks.onHangup();
		}
	}

	module.exports = {
		ActiveCallNotification
	};
});

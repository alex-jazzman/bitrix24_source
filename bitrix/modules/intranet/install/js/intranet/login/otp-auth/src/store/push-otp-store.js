import { defineStore } from 'ui.vue3.pinia';

export const usePushOtpStore = defineStore('pushOtp', {
	state: () => ({
		isPushDisabled: true,
		cooldownSecondsLeft: 0,
		cooldownIntervalId: null,
	}),
	getters: {
		isCountdownVisible: (state) => state.isPushDisabled && state.cooldownSecondsLeft > 0,
	},
	actions: {
		startCooldown(seconds)
		{
			const cooldown = Number(seconds);

			if (!cooldown || cooldown <= 0)
			{
				this.stopCooldown();

				return;
			}

			this.cooldownSecondsLeft = Math.floor(cooldown);
			this.isPushDisabled = true;

			this.stopCooldownTimer();
			this.cooldownIntervalId = setInterval(() => {
				if (this.cooldownSecondsLeft <= 1)
				{
					this.stopCooldown();

					return;
				}

				this.cooldownSecondsLeft -= 1;
			}, 1000);
		},
		stopCooldown()
		{
			this.stopCooldownTimer();
			this.isPushDisabled = false;
			this.cooldownSecondsLeft = 0;
		},
		stopCooldownTimer()
		{
			if (this.cooldownIntervalId)
			{
				clearInterval(this.cooldownIntervalId);
				this.cooldownIntervalId = null;
			}
		},
		initCooldown(defaultCooldown)
		{
			if (defaultCooldown > 0)
			{
				this.startCooldown(defaultCooldown);
			}
			else
			{
				this.isPushDisabled = false;
				this.cooldownSecondsLeft = 0;
			}
		},
		getCooldownSeconds(config, defaultCooldown = 5): number
		{
			const seconds = Number(config?.cooldownSeconds);

			return Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : defaultCooldown;
		},
	},
});

import { AudioPlayer } from 'crm.audio-player';
import { LogoType } from '../enums/logo-type';

// @vue/component
export const TimelineAudio = AudioPlayer.getComponent({
	methods: {
		changeLogoIcon(icon: String)
		{
			if (!this.$root || !this.$root.getLogo)
			{
				return;
			}

			const logo = this.$root.getLogo();
			if (!logo)
			{
				return;
			}

			logo.setIcon(icon);
		},

		audioEventRouterWrapper(eventName: String, event)
		{
			this.audioEventRouter(eventName, event);

			if (eventName === 'play')
			{
				this.changeLogoIcon(LogoType.CALL_AUDIO_PAUSE);
			}

			if (eventName === 'pause')
			{
				this.changeLogoIcon(LogoType.CALL_AUDIO_PLAY);
			}
		},
	},
});

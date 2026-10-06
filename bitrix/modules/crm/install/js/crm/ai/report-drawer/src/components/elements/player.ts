import { defineComponent, PropType } from 'ui.vue3';
import { Outline } from 'ui.icon-set.api.core';
import { AirButtonStyle, Button, ButtonIcon, ButtonSize } from 'ui.vue3.components.button';
import { AudioPlayerComponent } from 'crm.audio-player';

import { type CallRecordData } from '../../types';

export const Player = defineComponent({
	name: 'Player',

	components: {
		AudioPlayerComponent,
		Button,
	},

	props: {
		recordData: {
			type: Object as PropType<CallRecordData>,
			required: true,
		},
	},

	setup(): Object
	{
		return {
			AirButtonStyle,
			ButtonIcon,
			ButtonSize,
		};
	},

	data(): any
	{
		return {
			isPlayerVisible: false,
			isPlaying: false,
			playerButtonText: '00:00 / --:--',
		};
	},

	computed: {
		playerIcon(): string
		{
			return this.isPlaying ? Outline.PAUSE_L : Outline.PLAY_L;
		},
	},

	methods: {
		togglePlayback(): void
		{
			this.isPlayerVisible = true;

			void this.$nextTick(() => {
				const player = this.getAudioPlayer();
				if (!player)
				{
					return;
				}

				if (String(player.state) === 'play')
				{
					player.pause();
				}
				else
				{
					player.play();
				}
			});
		},

		hidePlayer(): void
		{
			this.isPlayerVisible = false;

			const player = this.getAudioPlayer();
			if (!player)
			{
				return;
			}

			player.pause();
		},

		getAudioPlayer(): any
		{
			return this.$refs.audioPlayer as any;
		},

		syncTimes(): void
		{
			const audioPlayer = this.getAudioPlayer();
			if (!audioPlayer)
			{
				return;
			}

			const timeCurrent = Number(audioPlayer.timeCurrent) || 0;
			const timeTotal = Number(audioPlayer.timeTotal) || 0;

			this.playerButtonText = `${this.formatTime(timeCurrent)} / ${this.formatTotalTime(timeTotal)}`;
			this.isPlaying = String(audioPlayer.state) === 'play';
		},

		formatTotalTime(seconds: number): string
		{
			if (!seconds)
			{
				return '--:--';
			}

			return this.formatTime(seconds);
		},

		formatTime(seconds: number): string
		{
			seconds = Math.floor(seconds);

			const hour = Math.floor(seconds / 60 / 60);
			if (hour > 0)
			{
				seconds -= hour * 60 * 60;
			}

			const minute = Math.floor(seconds / 60);
			if (minute > 0)
			{
				seconds -= minute * 60;
			}

				return (hour > 0 ? `${hour}:` : '')
					+ (hour > 0 ? `${minute.toString().padStart(2, '0')}:` : `${minute}:`)
					+ seconds.toString().padStart(2, '0')
				;
		},
	},

	mounted(): void
	{
		void this.$nextTick(() => {
			const audioPlayer = this.getAudioPlayer();
			audioPlayer?.loadFile?.(false);
			this.syncTimes();

			this.$watch(
				() => {
					const player = this.getAudioPlayer();
					if (!player)
					{
						return '';
					}

					return `${player.state}:${player.timeCurrent}:${player.timeTotal}`;
				},
				() => this.syncTimes(),
			);
		});
	},

	template: `
		<div class="crm-ai-report-drawer__toolbar-player-button">
			<Button
				:text="playerButtonText"
				:style="AirButtonStyle.OUTLINE"
				:size="ButtonSize.SMALL"
				:leftIcon="playerIcon"
				class="ui-btn-round"
				@click="togglePlayback"
			/>
		</div>
		<div class="crm-ai-report-drawer__bottom-player" v-show="isPlayerVisible">
			<AudioPlayerComponent :id="recordData.recordId" :src="recordData.recordSrc" ref="audioPlayer" />
			<span
				class="crm-ai-report-drawer__bottom-player-close"
				role="button"
				@click="hidePlayer"
			/>
		</div>
	`,
});

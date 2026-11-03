import { Dom } from 'main.core';
import { type EventEmitter } from 'main.core.events';
import { FocusMonitor, FocusNavigator } from 'ui.a11y';
import { Outline } from 'ui.icon-set.api.core';
import 'ui.icon-set.outline';
import { TextXs } from 'ui.system.typography.vue';
import { AirButtonStyle, Button as UiButton, ButtonSize } from 'ui.vue3.components.button';

import { Timeline } from 'im.v2.component.elements.player';
import { EventType, PlaybackTrackState } from 'im.v2.const';
import 'im.v2.css.classes';
import {
	PlaybackPauseReason,
	PlaybackRate,
	PlaybackService,
	type PlaybackSnapshot,
	type PlaybackState,
} from 'im.v2.lib.playback';
import { Utils } from 'im.v2.lib.utils';

import { TrackInfo } from './components/track-info';
import { TrackState } from './components/track-state';

import './css/player-bar.css';

const PlayableStates = new Set([PlaybackTrackState.playing, PlaybackTrackState.paused]);

const LostSourceStates = new Set([
	PlaybackTrackState.accessDenied,
	PlaybackTrackState.messageDeleted,
	PlaybackTrackState.fileDeleted,
]);

const ControlTestId = {
	play: 'im-player-bar-play',
	rate: 'im-player-bar-rate',
	goToMessage: 'im-player-bar-go-to-message',
	close: 'im-player-bar-close',
};

const ControlDataset = {
	play: { testid: ControlTestId.play },
	rate: { testid: ControlTestId.rate },
	goToMessage: { testid: ControlTestId.goToMessage },
	close: { testid: ControlTestId.close },
};

const SeekStepSeconds = 5;
const SeekBackwardKeys = new Set(['ArrowLeft', 'ArrowDown']);
const SeekForwardKeys = new Set(['ArrowRight', 'ArrowUp']);

const isNamedControl = (element: HTMLElement): boolean => {
	return element.hasAttribute('aria-label') || element.textContent.trim() !== '';
};

// @vue/component
export const PlayerBar = {
	name: 'PlayerBar',
	components: { TextXs, Timeline, TrackInfo, TrackState, UiButton },
	setup(): Object
	{
		return { AirButtonStyle, ButtonSize, ControlDataset, Outline };
	},
	data(): Object
	{
		return { announcedPosition: 0 };
	},
	computed:
	{
		playbackService(): PlaybackService
		{
			return PlaybackService.getInstance();
		},
		snapshot(): ?PlaybackSnapshot
		{
			return this.playbackService.getSnapshot();
		},
		playbackState(): PlaybackState
		{
			return this.playbackService.getState();
		},
		trackState(): string
		{
			return this.playbackState.trackState;
		},
		isPlaying(): boolean
		{
			return this.trackState === PlaybackTrackState.playing;
		},
		isPlayable(): boolean
		{
			return PlayableStates.has(this.trackState);
		},
		isLoading(): boolean
		{
			return this.trackState === PlaybackTrackState.loading;
		},
		isSourceReachable(): boolean
		{
			return !LostSourceStates.has(this.trackState);
		},
		duration(): number
		{
			return this.snapshot?.duration ?? 0;
		},
		position(): number
		{
			return this.playbackState.position;
		},
		rate(): number
		{
			return this.playbackState.rate;
		},
		chatTitle(): string
		{
			return this.$store.getters['chats/get'](this.snapshot?.dialogId)?.name ?? '';
		},
		trackTypeText(): string
		{
			return this.snapshot?.isVideoNote
				? this.loc('IM_PLAYER_BAR_TRACK_TYPE_VIDEO_NOTE')
				: this.loc('IM_PLAYER_BAR_TRACK_TYPE_AUDIO');
		},
		timeText(): string
		{
			const time = this.isPlaying ? this.duration - this.position : this.duration;

			return Utils.date.formatMediaDurationTime(time);
		},
		playbackActionText(): string
		{
			return this.isPlaying
				? this.loc('IM_PLAYER_BAR_ACTION_PAUSE')
				: this.loc('IM_PLAYER_BAR_ACTION_PLAY');
		},
		rateText(): string
		{
			return `${this.rate}x`;
		},
		rateActionText(): string
		{
			return this.loc('IM_PLAYER_BAR_ACTION_RATE', { '#RATE#': this.rateText });
		},
		progressValue(): number
		{
			return Math.round(this.announcedPosition);
		},
		progressMax(): number
		{
			return Math.round(this.duration);
		},
		progressText(): string
		{
			return this.loc('IM_PLAYER_BAR_PROGRESS_VALUE', {
				'#CURRENT#': Utils.date.formatMediaDurationTime(this.announcedPosition),
				'#TOTAL#': Utils.date.formatMediaDurationTime(this.duration),
			});
		},
		controlNames(): {[string]: string}
		{
			return {
				[ControlTestId.play]: this.playbackActionText,
				[ControlTestId.rate]: this.rateActionText,
				[ControlTestId.goToMessage]: this.loc('IM_PLAYER_BAR_ACTION_GO_TO_MESSAGE'),
				[ControlTestId.close]: this.loc('IM_PLAYER_BAR_ACTION_CLOSE'),
			};
		},
		controlsLayout(): string
		{
			return [Boolean(this.snapshot), this.trackState, this.rate].join('/');
		},
	},
	watch:
	{
		snapshot()
		{
			this.syncAnnouncedPosition();
		},
		trackState(state: string)
		{
			if (state === PlaybackTrackState.paused)
			{
				this.syncAnnouncedPosition();
			}
		},
	},
	created()
	{
		this.focusedControl = null;
		this.appliedControlsLayout = null;
		this.syncAnnouncedPosition();
	},
	mounted()
	{
		this.applyControlsLayout();
	},
	beforeUpdate()
	{
		if (this.appliedControlsLayout === this.controlsLayout)
		{
			return;
		}

		this.focusedControl = this.getFocusedControl();
	},
	updated()
	{
		if (this.appliedControlsLayout === this.controlsLayout)
		{
			return;
		}

		this.applyControlsLayout();
		this.moveFocusOffTheGoneControl();
	},
	methods:
	{
		syncAnnouncedPosition()
		{
			this.announcedPosition = this.position;
		},
		applyControlsLayout()
		{
			this.appliedControlsLayout = this.controlsLayout;
			this.nameControls();
		},
		nameControls()
		{
			Object.entries(this.controlNames).forEach(([testId, name]) => {
				const control = this.$refs.container?.querySelector(`[data-testid="${testId}"]`);

				if (!control || control.getAttribute('aria-label') === name)
				{
					return;
				}

				Dom.attr(control, 'aria-label', name);
			});
		},
		getFocusedControl(): ?HTMLElement
		{
			const container = this.$refs.container;
			const focused = FocusNavigator.getActiveElement(container);

			return container?.contains(focused) ? focused : null;
		},
		moveFocusOffTheGoneControl()
		{
			const goneControl = this.focusedControl;

			this.focusedControl = null;

			if (!goneControl || !FocusNavigator.isFocusLost())
			{
				return;
			}

			const container = this.$refs.container;

			if (!container)
			{
				FocusMonitor.Instance.restoreFocus();

				return;
			}

			FocusNavigator.focusFirst(container, { preventScroll: true, accept: isNamedControl });
		},
		togglePlayback()
		{
			if (this.isPlaying)
			{
				this.playbackService.pause(PlaybackPauseReason.manual);

				return;
			}

			this.playbackService.resume();
		},
		retryPlayback()
		{
			this.playbackService.resume();
		},
		changeRate()
		{
			this.playbackService.setRate(PlaybackRate.getNext(this.rate));
		},
		seek(progress: number)
		{
			this.seekTo(this.duration / 100 * progress);
		},
		seekTo(time: number)
		{
			if (this.duration <= 0)
			{
				return;
			}

			this.announcedPosition = Math.min(Math.max(time, 0), this.duration);
			this.playbackService.seek(this.announcedPosition);
		},
		handleProgressKeydown(event: KeyboardEvent)
		{
			const time = this.getTimeByKey(event.key);

			if (time === null)
			{
				return;
			}

			event.preventDefault();
			this.seekTo(time);
		},
		getTimeByKey(key: string): ?number
		{
			if (SeekBackwardKeys.has(key))
			{
				return this.position - SeekStepSeconds;
			}

			if (SeekForwardKeys.has(key))
			{
				return this.position + SeekStepSeconds;
			}

			if (key === 'Home')
			{
				return 0;
			}

			if (key === 'End')
			{
				return this.duration;
			}

			return null;
		},
		goToSource()
		{
			const { messageId, dialogId } = this.snapshot;

			this.getEmitter().emit(EventType.dialog.goToMessageContext, { messageId, dialogId });
		},
		close()
		{
			this.playbackService.close();
		},
		getEmitter(): EventEmitter
		{
			return this.$Bitrix.eventEmitter;
		},
		loc(phraseCode: string, replacements: {[string]: string} = {}): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
		},
	},
	template: `
		<div
			v-if="snapshot"
			ref="container"
			class="bx-im-player-bar__container"
			role="region"
			:aria-label="trackTypeText"
			data-testid="im-player-bar"
		>
			<TrackInfo :authorName="snapshot.authorName" :chatTitle="chatTitle" />
			<div class="bx-im-player-bar__playback">
				<div
					v-if="isPlayable"
					class="bx-im-player-bar__progress --focus-visible"
					role="slider"
					tabindex="0"
					:aria-label="loc('IM_PLAYER_BAR_PROGRESS')"
					aria-valuemin="0"
					:aria-valuemax="progressMax"
					:aria-valuenow="progressValue"
					:aria-valuetext="progressText"
					data-testid="im-player-bar-progress"
					@focus="syncAnnouncedPosition"
					@keydown="handleProgressKeydown"
				>
					<Timeline
						stretched
						:loaded="duration > 0"
						:timeCurrent="position"
						:timeTotal="duration"
						:waveformIndex="snapshot.waveformIndex"
						@change="seek"
					/>
				</div>
				<TrackState
					:state="trackState"
					:src="snapshot.src"
					@retry="retryPlayback"
				/>
			</div>
			<TextXs
				v-if="isPlayable"
				class="bx-im-player-bar__time"
				data-testid="im-player-bar-time"
			>{{ timeText }}</TextXs>
			<div class="bx-im-player-bar__controls">
				<UiButton
					collapsed
					:leftIcon="isPlaying ? Outline.PAUSE_M : Outline.PLAY_M"
					:size="ButtonSize.SMALL"
					:style="AirButtonStyle.PLAIN"
					:disabled="!isPlayable && !isLoading"
					:dataset="ControlDataset.play"
					@click="togglePlayback"
				/>
				<UiButton
					:text="rateText"
					:size="ButtonSize.EXTRA_SMALL"
					:style="AirButtonStyle.PLAIN_NO_ACCENT"
					:dataset="ControlDataset.rate"
					@click="changeRate"
				/>
				<UiButton
					collapsed
					:leftIcon="Outline.GO_TO_MESSAGE"
					:size="ButtonSize.SMALL"
					:style="AirButtonStyle.PLAIN_NO_ACCENT"
					:disabled="!isSourceReachable"
					:dataset="ControlDataset.goToMessage"
					@click="goToSource"
				/>
				<UiButton
					collapsed
					:leftIcon="Outline.CROSS_M"
					:size="ButtonSize.SMALL"
					:style="AirButtonStyle.PLAIN_NO_ACCENT"
					:dataset="ControlDataset.close"
					@click="close"
				/>
			</div>
		</div>
	`,
};

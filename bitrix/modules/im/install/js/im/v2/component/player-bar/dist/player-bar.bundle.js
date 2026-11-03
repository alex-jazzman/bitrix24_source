/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports, main_core, ui_a11y, ui_iconSet_api_core, ui_iconSet_outline, ui_system_typography_vue, ui_vue3_components_button, im_v2_component_elements_player, im_v2_const, im_v2_css_classes, im_v2_lib_playback, im_v2_lib_utils) {
	'use strict';

	// @vue/component
	const TrackInfo = {
		name: 'PlayerBarTrackInfo',
		components: {
			TextSm: ui_system_typography_vue.TextSm,
			TextXs: ui_system_typography_vue.TextXs
		},
		props: {
			authorName: {
				type: String,
				default: ''
			},
			chatTitle: {
				type: String,
				default: ''
			}
		},
		template: `
		<div class="bx-im-player-bar__track-info" data-testid="im-player-bar-track-info">
			<TextSm
				class="bx-im-player-bar__track-info_author"
				wrap="truncate"
				data-testid="im-player-bar-author"
			>
				{{ authorName }}
			</TextSm>
			<TextXs
				v-if="chatTitle"
				class="bx-im-player-bar__track-info_chat"
				wrap="truncate"
				data-testid="im-player-bar-chat"
			>
				{{ chatTitle }}
			</TextXs>
		</div>
	`
	};

	const StatePhraseCodeByTrackState = {
		[im_v2_const.PlaybackTrackState.loading]: 'IM_PLAYER_BAR_STATE_LOADING',
		[im_v2_const.PlaybackTrackState.loadingError]: 'IM_PLAYER_BAR_STATE_LOADING_ERROR',
		[im_v2_const.PlaybackTrackState.unsupportedFormat]: 'IM_PLAYER_BAR_STATE_UNSUPPORTED_FORMAT',
		[im_v2_const.PlaybackTrackState.fileProcessing]: 'IM_PLAYER_BAR_STATE_FILE_PROCESSING',
		[im_v2_const.PlaybackTrackState.accessDenied]: 'IM_PLAYER_BAR_STATE_ACCESS_DENIED',
		[im_v2_const.PlaybackTrackState.messageDeleted]: 'IM_PLAYER_BAR_STATE_MESSAGE_DELETED',
		[im_v2_const.PlaybackTrackState.fileDeleted]: 'IM_PLAYER_BAR_STATE_FILE_DELETED',
		default: ''
	};

	// @vue/component
	const TrackState = {
		name: 'PlayerBarTrackState',
		components: {
			TextSm: ui_system_typography_vue.TextSm,
			UiButton: ui_vue3_components_button.Button
		},
		props: {
			state: {
				type: String,
				required: true
			},
			src: {
				type: String,
				default: ''
			}
		},
		emits: ['retry'],
		setup() {
			return {
				AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
				ButtonSize: ui_vue3_components_button.ButtonSize
			};
		},
		computed: {
			statePhraseCode() {
				return StatePhraseCodeByTrackState[this.state] ?? StatePhraseCodeByTrackState.default;
			},
			stateText() {
				return this.statePhraseCode === '' ? '' : this.loc(this.statePhraseCode);
			},
			isRetryAvailable() {
				return this.state === im_v2_const.PlaybackTrackState.loadingError;
			},
			isDownloadAvailable() {
				return this.state === im_v2_const.PlaybackTrackState.unsupportedFormat && this.src !== '';
			}
		},
		mounted() {
			if (this.stateText === '') {
				return;
			}
			ui_a11y.LiveAnnouncer.announce(this.stateText);
		},
		methods: {
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<div
			class="bx-im-player-bar__track-state"
			role="status"
			aria-live="polite"
			data-testid="im-player-bar-track-state"
		>
			<TextSm class="bx-im-player-bar__track-state_text" wrap="truncate">
				{{ stateText }}
			</TextSm>
			<UiButton
				v-if="isRetryAvailable"
				:text="loc('IM_PLAYER_BAR_ACTION_RETRY')"
				:size="ButtonSize.EXTRA_SMALL"
				:style="AirButtonStyle.PLAIN_ACCENT"
				:dataset="{ testid: 'im-player-bar-retry' }"
				@click="$emit('retry')"
			/>
			<UiButton
				v-if="isDownloadAvailable"
				:text="loc('IM_PLAYER_BAR_ACTION_DOWNLOAD')"
				:size="ButtonSize.EXTRA_SMALL"
				:style="AirButtonStyle.PLAIN_ACCENT"
				:link="src"
				:dataset="{ testid: 'im-player-bar-download' }"
			/>
		</div>
	`
	};

	const PlayableStates = new Set([im_v2_const.PlaybackTrackState.playing, im_v2_const.PlaybackTrackState.paused]);
	const LostSourceStates = new Set([im_v2_const.PlaybackTrackState.accessDenied, im_v2_const.PlaybackTrackState.messageDeleted, im_v2_const.PlaybackTrackState.fileDeleted]);
	const ControlTestId = {
		play: 'im-player-bar-play',
		rate: 'im-player-bar-rate',
		goToMessage: 'im-player-bar-go-to-message',
		close: 'im-player-bar-close'
	};
	const ControlDataset = {
		play: {
			testid: ControlTestId.play
		},
		rate: {
			testid: ControlTestId.rate
		},
		goToMessage: {
			testid: ControlTestId.goToMessage
		},
		close: {
			testid: ControlTestId.close
		}
	};
	const SeekStepSeconds = 5;
	const SeekBackwardKeys = new Set(['ArrowLeft', 'ArrowDown']);
	const SeekForwardKeys = new Set(['ArrowRight', 'ArrowUp']);
	const isNamedControl = element => {
		return element.hasAttribute('aria-label') || element.textContent.trim() !== '';
	};

	// @vue/component
	const PlayerBar = {
		name: 'PlayerBar',
		components: {
			TextXs: ui_system_typography_vue.TextXs,
			Timeline: im_v2_component_elements_player.Timeline,
			TrackInfo,
			TrackState,
			UiButton: ui_vue3_components_button.Button
		},
		setup() {
			return {
				AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
				ButtonSize: ui_vue3_components_button.ButtonSize,
				ControlDataset,
				Outline: ui_iconSet_api_core.Outline
			};
		},
		data() {
			return {
				announcedPosition: 0
			};
		},
		computed: {
			playbackService() {
				return im_v2_lib_playback.PlaybackService.getInstance();
			},
			snapshot() {
				return this.playbackService.getSnapshot();
			},
			playbackState() {
				return this.playbackService.getState();
			},
			trackState() {
				return this.playbackState.trackState;
			},
			isPlaying() {
				return this.trackState === im_v2_const.PlaybackTrackState.playing;
			},
			isPlayable() {
				return PlayableStates.has(this.trackState);
			},
			isLoading() {
				return this.trackState === im_v2_const.PlaybackTrackState.loading;
			},
			isSourceReachable() {
				return !LostSourceStates.has(this.trackState);
			},
			duration() {
				return this.snapshot?.duration ?? 0;
			},
			position() {
				return this.playbackState.position;
			},
			rate() {
				return this.playbackState.rate;
			},
			chatTitle() {
				return this.$store.getters['chats/get'](this.snapshot?.dialogId)?.name ?? '';
			},
			trackTypeText() {
				return this.snapshot?.isVideoNote ? this.loc('IM_PLAYER_BAR_TRACK_TYPE_VIDEO_NOTE') : this.loc('IM_PLAYER_BAR_TRACK_TYPE_AUDIO');
			},
			timeText() {
				const time = this.isPlaying ? this.duration - this.position : this.duration;
				return im_v2_lib_utils.Utils.date.formatMediaDurationTime(time);
			},
			playbackActionText() {
				return this.isPlaying ? this.loc('IM_PLAYER_BAR_ACTION_PAUSE') : this.loc('IM_PLAYER_BAR_ACTION_PLAY');
			},
			rateText() {
				return `${this.rate}x`;
			},
			rateActionText() {
				return this.loc('IM_PLAYER_BAR_ACTION_RATE', {
					'#RATE#': this.rateText
				});
			},
			progressValue() {
				return Math.round(this.announcedPosition);
			},
			progressMax() {
				return Math.round(this.duration);
			},
			progressText() {
				return this.loc('IM_PLAYER_BAR_PROGRESS_VALUE', {
					'#CURRENT#': im_v2_lib_utils.Utils.date.formatMediaDurationTime(this.announcedPosition),
					'#TOTAL#': im_v2_lib_utils.Utils.date.formatMediaDurationTime(this.duration)
				});
			},
			controlNames() {
				return {
					[ControlTestId.play]: this.playbackActionText,
					[ControlTestId.rate]: this.rateActionText,
					[ControlTestId.goToMessage]: this.loc('IM_PLAYER_BAR_ACTION_GO_TO_MESSAGE'),
					[ControlTestId.close]: this.loc('IM_PLAYER_BAR_ACTION_CLOSE')
				};
			},
			controlsLayout() {
				return [Boolean(this.snapshot), this.trackState, this.rate].join('/');
			}
		},
		watch: {
			snapshot() {
				this.syncAnnouncedPosition();
			},
			trackState(state) {
				if (state === im_v2_const.PlaybackTrackState.paused) {
					this.syncAnnouncedPosition();
				}
			}
		},
		created() {
			this.focusedControl = null;
			this.appliedControlsLayout = null;
			this.syncAnnouncedPosition();
		},
		mounted() {
			this.applyControlsLayout();
		},
		beforeUpdate() {
			if (this.appliedControlsLayout === this.controlsLayout) {
				return;
			}
			this.focusedControl = this.getFocusedControl();
		},
		updated() {
			if (this.appliedControlsLayout === this.controlsLayout) {
				return;
			}
			this.applyControlsLayout();
			this.moveFocusOffTheGoneControl();
		},
		methods: {
			syncAnnouncedPosition() {
				this.announcedPosition = this.position;
			},
			applyControlsLayout() {
				this.appliedControlsLayout = this.controlsLayout;
				this.nameControls();
			},
			nameControls() {
				Object.entries(this.controlNames).forEach(([testId, name]) => {
					const control = this.$refs.container?.querySelector(`[data-testid="${testId}"]`);
					if (!control || control.getAttribute('aria-label') === name) {
						return;
					}
					main_core.Dom.attr(control, 'aria-label', name);
				});
			},
			getFocusedControl() {
				const container = this.$refs.container;
				const focused = ui_a11y.FocusNavigator.getActiveElement(container);
				return container?.contains(focused) ? focused : null;
			},
			moveFocusOffTheGoneControl() {
				const goneControl = this.focusedControl;
				this.focusedControl = null;
				if (!goneControl || !ui_a11y.FocusNavigator.isFocusLost()) {
					return;
				}
				const container = this.$refs.container;
				if (!container) {
					ui_a11y.FocusMonitor.Instance.restoreFocus();
					return;
				}
				ui_a11y.FocusNavigator.focusFirst(container, {
					preventScroll: true,
					accept: isNamedControl
				});
			},
			togglePlayback() {
				if (this.isPlaying) {
					this.playbackService.pause(im_v2_lib_playback.PlaybackPauseReason.manual);
					return;
				}
				this.playbackService.resume();
			},
			retryPlayback() {
				this.playbackService.resume();
			},
			changeRate() {
				this.playbackService.setRate(im_v2_lib_playback.PlaybackRate.getNext(this.rate));
			},
			seek(progress) {
				this.seekTo(this.duration / 100 * progress);
			},
			seekTo(time) {
				if (this.duration <= 0) {
					return;
				}
				this.announcedPosition = Math.min(Math.max(time, 0), this.duration);
				this.playbackService.seek(this.announcedPosition);
			},
			handleProgressKeydown(event) {
				const time = this.getTimeByKey(event.key);
				if (time === null) {
					return;
				}
				event.preventDefault();
				this.seekTo(time);
			},
			getTimeByKey(key) {
				if (SeekBackwardKeys.has(key)) {
					return this.position - SeekStepSeconds;
				}
				if (SeekForwardKeys.has(key)) {
					return this.position + SeekStepSeconds;
				}
				if (key === 'Home') {
					return 0;
				}
				if (key === 'End') {
					return this.duration;
				}
				return null;
			},
			goToSource() {
				const {
					messageId,
					dialogId
				} = this.snapshot;
				this.getEmitter().emit(im_v2_const.EventType.dialog.goToMessageContext, {
					messageId,
					dialogId
				});
			},
			close() {
				this.playbackService.close();
			},
			getEmitter() {
				return this.$Bitrix.eventEmitter;
			},
			loc(phraseCode, replacements = {}) {
				return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
			}
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
	`
	};

	exports.PlayerBar = PlayerBar;

})(this.BX.Messenger.v2.Component = this.BX.Messenger.v2.Component || {}, BX, BX.UI.Accessibility, BX.UI.IconSet, window, BX.UI.System.Typography.Vue, BX.Vue3.Components, BX.Messenger.v2.Component.Elements, BX.Messenger.v2.Const, BX.Messenger.v2.Css, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib);
//# sourceMappingURL=player-bar.bundle.js.map

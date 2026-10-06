/* eslint-disable */
this.BX = this.BX || {};
this.BX.UI = this.BX.UI || {};
this.BX.UI.Reaction = this.BX.UI.Reaction || {};
(function (exports, main_core, main_core_events, ui_vue3) {
	'use strict';

	const ReactionName = Object.freeze({
		like: 'like',
		faceWithTearsOfJoy: 'faceWithTearsOfJoy',
		redHeart: 'redHeart',
		neutralFace: 'neutralFace',
		fire: 'fire',
		cry: 'cry',
		slightlySmilingFace: 'slightlySmilingFace',
		handshake: 'handshake',
		hundredPoints: 'hundredPoints',
		sleepingSymbol: 'sleepingSymbol',
		crossMark: 'crossMark',
		whiteHeavyCheckMark: 'whiteHeavyCheckMark',
		eyes: 'eyes',
		winkingFace: 'winkingFace',
		laugh: 'laugh',
		kiss: 'kiss',
		wonder: 'wonder',
		slightlyFrowningFace: 'slightlyFrowningFace',
		loudlyCryingFace: 'loudlyCryingFace',
		faceWithStuckOutTongue: 'faceWithStuckOutTongue',
		faceWithStuckOutTongueAndWinkingEye: 'faceWithStuckOutTongueAndWinkingEye',
		smilingFaceWithSunglasses: 'smilingFaceWithSunglasses',
		confusedFace: 'confusedFace',
		flushedFace: 'flushedFace',
		thinkingFace: 'thinkingFace',
		angry: 'angry',
		smilingFaceWithHorns: 'smilingFaceWithHorns',
		faceWithThermometer: 'faceWithThermometer',
		facepalm: 'facepalm',
		poo: 'poo',
		flexedBiceps: 'flexedBiceps',
		clappingHands: 'clappingHands',
		raisedHand: 'raisedHand',
		dislike: 'dislike',
		smilingFaceWithHeartEyes: 'smilingFaceWithHeartEyes',
		smilingFaceWithHearts: 'smilingFaceWithHearts',
		pleadingFace: 'pleadingFace',
		relievedFace: 'relievedFace',
		foldedHands: 'foldedHands',
		okHand: 'okHand',
		signHorns: 'signHorns',
		loveYouGesture: 'loveYouGesture',
		clownFace: 'clownFace',
		partyingFace: 'partyingFace',
		questionMark: 'questionMark',
		exclamationMark: 'exclamationMark',
		lightBulb: 'lightBulb',
		bomb: 'bomb'
	});

	const e1 = '/bitrix/js/ui/reaction/item/animations/emoji_01.json';
	const e2 = '/bitrix/js/ui/reaction/item/animations/emoji_02.json';
	const e3 = '/bitrix/js/ui/reaction/item/animations/emoji_03.json';
	const e4 = '/bitrix/js/ui/reaction/item/animations/emoji_04.json';
	const e5 = '/bitrix/js/ui/reaction/item/animations/emoji_05.json';
	const e6 = '/bitrix/js/ui/reaction/item/animations/emoji_06.json';
	const e7 = '/bitrix/js/ui/reaction/item/animations/emoji_07.json';
	const e8 = '/bitrix/js/ui/reaction/item/animations/emoji_08.json';
	const e9 = '/bitrix/js/ui/reaction/item/animations/emoji_09.json';
	const e10 = '/bitrix/js/ui/reaction/item/animations/emoji_10.json';
	const e11 = '/bitrix/js/ui/reaction/item/animations/emoji_11.json';
	const e12 = '/bitrix/js/ui/reaction/item/animations/emoji_12.json';
	const e13 = '/bitrix/js/ui/reaction/item/animations/emoji_13.json';
	const e14 = '/bitrix/js/ui/reaction/item/animations/emoji_14.json';
	const e15 = '/bitrix/js/ui/reaction/item/animations/emoji_15.json';
	const e16 = '/bitrix/js/ui/reaction/item/animations/emoji_16.json';
	const e17 = '/bitrix/js/ui/reaction/item/animations/emoji_17.json';
	const e18 = '/bitrix/js/ui/reaction/item/animations/emoji_18.json';
	const e19 = '/bitrix/js/ui/reaction/item/animations/emoji_19.json';
	const e20 = '/bitrix/js/ui/reaction/item/animations/emoji_20.json';
	const e21 = '/bitrix/js/ui/reaction/item/animations/emoji_21.json';
	const e22 = '/bitrix/js/ui/reaction/item/animations/emoji_22.json';
	const e23 = '/bitrix/js/ui/reaction/item/animations/emoji_23.json';
	const e24 = '/bitrix/js/ui/reaction/item/animations/emoji_24.json';
	const e25 = '/bitrix/js/ui/reaction/item/animations/emoji_25.json';
	const e26 = '/bitrix/js/ui/reaction/item/animations/emoji_26.json';
	const e27 = '/bitrix/js/ui/reaction/item/animations/emoji_27.json';
	const e28 = '/bitrix/js/ui/reaction/item/animations/emoji_28.json';
	const e29 = '/bitrix/js/ui/reaction/item/animations/emoji_29.json';
	const e30 = '/bitrix/js/ui/reaction/item/animations/emoji_30.json';
	const e31 = '/bitrix/js/ui/reaction/item/animations/emoji_31.json';
	const e32 = '/bitrix/js/ui/reaction/item/animations/emoji_32.json';
	const e33 = '/bitrix/js/ui/reaction/item/animations/emoji_33.json';
	const e34 = '/bitrix/js/ui/reaction/item/animations/emoji_34.json';
	const e35 = '/bitrix/js/ui/reaction/item/animations/emoji_35.json';
	const e36 = '/bitrix/js/ui/reaction/item/animations/emoji_36.json';
	const e37 = '/bitrix/js/ui/reaction/item/animations/emoji_37.json';
	const e38 = '/bitrix/js/ui/reaction/item/animations/emoji_38.json';
	const e39 = '/bitrix/js/ui/reaction/item/animations/emoji_39.json';
	const e40 = '/bitrix/js/ui/reaction/item/animations/emoji_40.json';
	const e41 = '/bitrix/js/ui/reaction/item/animations/emoji_41.json';
	const e42 = '/bitrix/js/ui/reaction/item/animations/emoji_42.json';
	const e43 = '/bitrix/js/ui/reaction/item/animations/emoji_43.json';
	const e44 = '/bitrix/js/ui/reaction/item/animations/emoji_44.json';
	const e45 = '/bitrix/js/ui/reaction/item/animations/emoji_45.json';
	const e46 = '/bitrix/js/ui/reaction/item/animations/emoji_46.json';
	const e47 = '/bitrix/js/ui/reaction/item/animations/emoji_47.json';
	const e48 = '/bitrix/js/ui/reaction/item/animations/emoji_48.json';
	const LottieAnimation = {
		[ReactionName.like]: e28,
		[ReactionName.faceWithTearsOfJoy]: e5,
		[ReactionName.redHeart]: e25,
		[ReactionName.neutralFace]: e14,
		[ReactionName.fire]: e24,
		[ReactionName.cry]: e8,
		[ReactionName.slightlySmilingFace]: e1,
		[ReactionName.winkingFace]: e2,
		[ReactionName.laugh]: e3,
		[ReactionName.kiss]: e4,
		[ReactionName.wonder]: e6,
		[ReactionName.slightlyFrowningFace]: e7,
		[ReactionName.loudlyCryingFace]: e9,
		[ReactionName.faceWithStuckOutTongue]: e10,
		[ReactionName.faceWithStuckOutTongueAndWinkingEye]: e11,
		[ReactionName.smilingFaceWithSunglasses]: e12,
		[ReactionName.confusedFace]: e13,
		[ReactionName.flushedFace]: e15,
		[ReactionName.thinkingFace]: e16,
		[ReactionName.angry]: e17,
		[ReactionName.smilingFaceWithHorns]: e18,
		[ReactionName.faceWithThermometer]: e19,
		[ReactionName.facepalm]: e20,
		[ReactionName.poo]: e21,
		[ReactionName.flexedBiceps]: e22,
		[ReactionName.clappingHands]: e26,
		[ReactionName.raisedHand]: e27,
		[ReactionName.dislike]: e29,
		[ReactionName.smilingFaceWithHeartEyes]: e30,
		[ReactionName.smilingFaceWithHearts]: e31,
		[ReactionName.pleadingFace]: e32,
		[ReactionName.relievedFace]: e33,
		[ReactionName.foldedHands]: e34,
		[ReactionName.okHand]: e35,
		[ReactionName.signHorns]: e36,
		[ReactionName.loveYouGesture]: e37,
		[ReactionName.clownFace]: e38,
		[ReactionName.partyingFace]: e39,
		[ReactionName.questionMark]: e40,
		[ReactionName.exclamationMark]: e41,
		[ReactionName.lightBulb]: e42,
		[ReactionName.bomb]: e23,
		[ReactionName.eyes]: e43,
		[ReactionName.crossMark]: e44,
		[ReactionName.whiteHeavyCheckMark]: e45,
		[ReactionName.sleepingSymbol]: e46,
		[ReactionName.hundredPoints]: e47,
		[ReactionName.handshake]: e48
	};

	const ReactionTitle = {
		[ReactionName.like]: main_core.Loc.getMessage('UI_REACTIONS_LIKE'),
		[ReactionName.faceWithTearsOfJoy]: main_core.Loc.getMessage('UI_REACTIONS_LAUGH_AND_CRY'),
		[ReactionName.redHeart]: main_core.Loc.getMessage('UI_REACTIONS_HEART'),
		[ReactionName.neutralFace]: main_core.Loc.getMessage('UI_REACTIONS_INDIFFERENT'),
		[ReactionName.fire]: main_core.Loc.getMessage('UI_REACTIONS_FIRE'),
		[ReactionName.cry]: main_core.Loc.getMessage('UI_REACTIONS_SORRY'),
		[ReactionName.slightlySmilingFace]: main_core.Loc.getMessage('UI_REACTIONS_SMILE'),
		[ReactionName.winkingFace]: main_core.Loc.getMessage('UI_REACTIONS_WINK'),
		[ReactionName.laugh]: main_core.Loc.getMessage('UI_REACTIONS_LAUGH'),
		[ReactionName.kiss]: main_core.Loc.getMessage('UI_REACTIONS_ADMIRE'),
		[ReactionName.wonder]: main_core.Loc.getMessage('UI_REACTIONS_SHOCK'),
		[ReactionName.slightlyFrowningFace]: main_core.Loc.getMessage('UI_REACTIONS_SAD'),
		[ReactionName.loudlyCryingFace]: main_core.Loc.getMessage('UI_REACTIONS_CRY'),
		[ReactionName.faceWithStuckOutTongue]: main_core.Loc.getMessage('UI_REACTIONS_TONGUE'),
		[ReactionName.faceWithStuckOutTongueAndWinkingEye]: main_core.Loc.getMessage('UI_REACTIONS_TEASING'),
		[ReactionName.smilingFaceWithSunglasses]: main_core.Loc.getMessage('UI_REACTIONS_COOL'),
		[ReactionName.confusedFace]: main_core.Loc.getMessage('UI_REACTIONS_DONT_KNOW'),
		[ReactionName.flushedFace]: main_core.Loc.getMessage('UI_REACTIONS_EMBARRASSMENT'),
		[ReactionName.thinkingFace]: main_core.Loc.getMessage('UI_REACTIONS_DOUBT'),
		[ReactionName.angry]: main_core.Loc.getMessage('UI_REACTIONS_ANGRY'),
		[ReactionName.smilingFaceWithHorns]: main_core.Loc.getMessage('UI_REACTIONS_MALEVOLENCE'),
		[ReactionName.faceWithThermometer]: main_core.Loc.getMessage('UI_REACTIONS_ILL'),
		[ReactionName.facepalm]: main_core.Loc.getMessage('UI_REACTIONS_NONSENSE_2'),
		[ReactionName.poo]: main_core.Loc.getMessage('UI_REACTIONS_POO'),
		[ReactionName.flexedBiceps]: main_core.Loc.getMessage('UI_REACTIONS_POWERFUL'),
		[ReactionName.clappingHands]: main_core.Loc.getMessage('UI_REACTIONS_GREAT'),
		[ReactionName.raisedHand]: main_core.Loc.getMessage('UI_REACTIONS_UP_FIVE'),
		[ReactionName.dislike]: main_core.Loc.getMessage('UI_REACTIONS_DISLIKE'),
		[ReactionName.smilingFaceWithHeartEyes]: main_core.Loc.getMessage('UI_REACTIONS_BEAUTIFUL'),
		[ReactionName.smilingFaceWithHearts]: main_core.Loc.getMessage('UI_REACTIONS_ADORE'),
		[ReactionName.pleadingFace]: main_core.Loc.getMessage('UI_REACTIONS_BEG'),
		[ReactionName.relievedFace]: main_core.Loc.getMessage('UI_REACTIONS_ZEN'),
		[ReactionName.foldedHands]: main_core.Loc.getMessage('UI_REACTIONS_THANKS'),
		[ReactionName.okHand]: main_core.Loc.getMessage('UI_REACTIONS_ОК'),
		[ReactionName.signHorns]: main_core.Loc.getMessage('UI_REACTIONS_ROCK'),
		[ReactionName.loveYouGesture]: main_core.Loc.getMessage('UI_REACTIONS_ALL_COOL'),
		[ReactionName.clownFace]: main_core.Loc.getMessage('UI_REACTIONS_CLOWN'),
		[ReactionName.partyingFace]: main_core.Loc.getMessage('UI_REACTIONS_CONGRATS'),
		[ReactionName.questionMark]: main_core.Loc.getMessage('UI_REACTIONS_QUESTION'),
		[ReactionName.exclamationMark]: main_core.Loc.getMessage('UI_REACTIONS_ATTENTION'),
		[ReactionName.lightBulb]: main_core.Loc.getMessage('UI_REACTIONS_IDEA'),
		[ReactionName.bomb]: main_core.Loc.getMessage('UI_REACTIONS_BOMB'),
		[ReactionName.sleepingSymbol]: main_core.Loc.getMessage('UI_REACTIONS_SLEEPING'),
		[ReactionName.crossMark]: main_core.Loc.getMessage('UI_REACTIONS_CROSS_MARK'),
		[ReactionName.whiteHeavyCheckMark]: main_core.Loc.getMessage('UI_REACTIONS_CHECK_MARK'),
		[ReactionName.eyes]: main_core.Loc.getMessage('UI_REACTIONS_EYES'),
		[ReactionName.handshake]: main_core.Loc.getMessage('UI_REACTIONS_HANDSHAKE'),
		[ReactionName.hundredPoints]: main_core.Loc.getMessage('UI_REACTIONS_HUNDRED_POINTS')
	};

	const ReactionEvent = Object.freeze({
		animationFinish: 'animationFinish'
	});
	let Reaction$1 = class Reaction extends main_core_events.EventEmitter {
		static #LottieInstance = null;
		#name;
		#size;
		#animate;
		#infiniteAnimate;
		#id;
		#lottieAnimation = null;
		#wrapper;
		#animatedReaction;
		#staticReaction;
		#isAnimationPaused = false;
		constructor(options = {}) {
			super(options);
			this.setEventNamespace('UI.Reaction.Item');
			this.#name = options.name;
			this.#size = main_core.Type.isNumber(options.size) ? options.size : null;
			this.#animate = options.animation?.animate === true;
			this.#infiniteAnimate = options.animation?.infinite === true;
			this.#id = `${this.#name}_${Math.round(Math.random() * 1_000_000_000)}`;
			this.#lottieAnimation = null;
			this.#wrapper = null;
			this.#animatedReaction = null;
		}
		render() {
			this.#wrapper = this.#renderEmojiWrapper();
			main_core.Dom.append(this.#renderStatic(), this.#wrapper);
			if (this.#animate) {
				this.#switchStaticToAnimated();
			}
			return this.#wrapper;
		}

		/**
		 * @deprecated used only for a vue component
		 */
		renderOnNode(node) {
			const wrapper = this.#renderEmojiWrapper();
			main_core.Dom.attr(node, {
				class: main_core.Dom.attr(wrapper, 'class'),
				title: main_core.Dom.attr(wrapper, 'title')
			});
			main_core.Dom.append(this.#renderStatic(), node);
			this.#wrapper = node;
			if (this.#animate) {
				this.#switchStaticToAnimated();
			}
		}
		#renderEmojiWrapper() {
			const title = ReactionTitle[this.#name];
			const wrapper = main_core.Tag.render`<span class="ui-reaction" title="${title}"></span>`;
			if (main_core.Type.isNumber(this.#size)) {
				main_core.Dom.style(wrapper, '--ui-reaction-size', `${this.#size}px`);
			}
			return wrapper;
		}
		#renderStatic() {
			if (!this.#staticReaction) {
				const reaction = main_core.Tag.render`<span class="ui-reaction__inner --${this.#name}"></span>`;
				main_core.Dom.style(reaction, 'color-scheme', 'only light');
				this.#staticReaction = reaction;
			}
			return this.#staticReaction;
		}
		async #renderAnimated() {
			if (!this.#animatedReaction) {
				await this.#initAnimatedReaction();
			}
			return this.#animatedReaction;
		}
		async #initAnimatedReaction() {
			return new Promise((resolve, reject) => {
				main_core.Runtime.loadExtension(['ui.lottie']).then(({
					Lottie
				}) => {
					Reaction.#LottieInstance = Lottie;
					if (!this.#lottieAnimation) {
						const wrapper = main_core.Tag.render`<span class="ui-reaction__animation-wrapper"></span>`;
						main_core.Dom.style(wrapper, 'color-scheme', 'only light');
						this.#lottieAnimation = Lottie.loadAnimation({
							container: wrapper,
							path: LottieAnimation[this.#name],
							loop: true,
							name: this.#id,
							autoplay: true,
							renderer: 'svg',
							rendererSettings: {
								viewBoxOnly: true,
								className: `ui-reaction__lottie-animation --${this.#name}`
							}
						});

						// eslint-disable-next-line @bitrix24/bitrix24-rules/no-native-events-binding
						this.#lottieAnimation.addEventListener('DOMLoaded', () => {
							this.#animatedReaction = wrapper;
							resolve();
						});

						// eslint-disable-next-line @bitrix24/bitrix24-rules/no-native-events-binding
						this.#lottieAnimation.addEventListener('data_failed', () => {
							reject(new Error('UI.ReactionsSelect: V2: Lottie animation data failed to load:'));
						});

						// eslint-disable-next-line @bitrix24/bitrix24-rules/no-native-events-binding
						this.#lottieAnimation.addEventListener('loopComplete', () => {
							if (this.#infiniteAnimate === false || this.#isAnimationPaused) {
								this.#lottieAnimation.pause();
								this.#switchAnimatedToStatic();
								this.emit(ReactionEvent.animationFinish);
								this.#destroyAnimation();
							}
						});
					}
				}).catch(error => {
					console.error(error);
					reject(error);
				});
			});
		}
		#switchAnimatedToStatic() {
			const staticReaction = this.#renderStatic();
			main_core.Dom.clean(this.#wrapper);
			main_core.Dom.append(staticReaction, this.#wrapper);
		}
		#switchStaticToAnimated() {
			this.#renderAnimated().then(wrapper => {
				main_core.Dom.clean(this.#wrapper);
				main_core.Dom.append(wrapper, this.#wrapper);
			}).catch(error => {
				console.error(error);
			});
		}
		setSize(size) {
			this.#size = size;
			if (this.#wrapper) {
				main_core.Dom.style(this.#wrapper, '--ui-reaction-size', `${this.#size}px`);
			}
		}
		setInfiniteAnimate(value) {
			this.#infiniteAnimate = value === true;
			if (this.#infiniteAnimate) {
				this.playAnimation();
			}
		}
		playAnimation() {
			this.#isAnimationPaused = false;
			this.#switchStaticToAnimated();
			this.#lottieAnimation?.play();
		}
		pauseAnimation() {
			this.#isAnimationPaused = true;
		}
		destroy() {
			this.#destroyAnimation();
			main_core.Dom.remove(this.#wrapper);
			this.#wrapper = null;
		}
		#destroyAnimation() {
			Reaction.#LottieInstance?.destroy(this.#id);
			this.#lottieAnimation = null;
			main_core.Dom.remove(this.#animatedReaction);
			this.#animatedReaction = null;
		}
	};

	// @vue/component
	const Reaction = {
		emits: ['animationFinish'],
		props: {
			name: {
				required: true,
				type: String,
				validator: value => Object.values(ReactionName).includes(value)
			},
			size: {
				type: Number,
				required: false,
				default: 16
			},
			animate: {
				type: Boolean,
				required: false,
				default: false
			},
			infiniteAnimate: {
				type: Boolean,
				required: false,
				default: false
			}
		},
		data() {
			return {
				reaction: null
			};
		},
		watch: {
			animate(newValue) {
				if (newValue) {
					this.reaction?.playAnimation();
				} else {
					this.reaction?.pauseAnimation();
				}
			},
			infiniteAnimate(newValue) {
				this.reaction.setInfiniteAnimate(newValue);
			},
			size(newSize) {
				this.reaction?.setSize(newSize);
			}
		},
		mounted() {
			this.reaction = ui_vue3.markRaw(new Reaction$1({
				name: this.name,
				size: this.size,
				animation: {
					animate: this.animate,
					infinite: this.infiniteAnimate
				}
			}));
			this.reaction.subscribe(ReactionEvent.animationFinish, () => {
				this.$emit(ReactionEvent.animationFinish);
			});
			this.reaction.renderOnNode(this.$el);
		},
		unmounted() {
			if (this.reaction) {
				this.reaction.destroy();
				this.reaction = null;
			}
		},
		methods: {
			playAnimation() {
				this.reaction?.playAnimation();
			},
			pauseAnimation() {
				this.reaction?.pauseAnimation();
			}
		},
		template: `
		<span></span>
	`
	};

	var vue = /*#__PURE__*/Object.freeze({
		__proto__: null,
		Reaction: Reaction
	});

	exports.LottieAnimation = LottieAnimation;
	exports.Reaction = Reaction$1;
	exports.ReactionEvent = ReactionEvent;
	exports.ReactionName = ReactionName;
	exports.ReactionTitle = ReactionTitle;
	exports.Vue = vue;

})(this.BX.UI.Reaction.Item = this.BX.UI.Reaction.Item || {}, BX, BX.Event, BX.Vue3);
//# sourceMappingURL=reaction.bundle.js.map

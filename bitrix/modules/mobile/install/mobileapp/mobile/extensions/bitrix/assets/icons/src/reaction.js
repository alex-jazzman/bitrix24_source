/**
 * @module assets/icons/src/reaction
 */
jn.define('assets/icons/src/reaction', (require, exports, module) => {
	const { BaseIcon } = require('assets/icons/src/base');
	const { Feature } = require('feature');
	const { withCurrentDomain } = require('utils/url');

	const BaseDir = '/bitrix/mobileapp/mobile/extensions/bitrix/assets/reactions';
	/**
	 * @class ReactionIcon
	 * @extends {BaseIcon}
	 */
	class ReactionIcon extends BaseIcon
	{
		static FACE_WITH_TEARS_OF_JOY = new ReactionIcon('FACE_WITH_TEARS_OF_JOY', {
			name: 'faceWithTearsOfJoy',
			testId: 'MESSAGE_MENU_REACTION_FACE_WITH_TEARS_OF_JOY',
			path: `${BaseDir}/icons/face-with-tears-of-joy.svg`,
			imageUrl: `${BaseDir}/images/face-with-tears-of-joy.png`,
			imageWithAnimationPaddingUrl: `${BaseDir}/template-images/face-with-tears-of-joy.png`,
			lottieUrl: `${BaseDir}/lotties/face-with-tears-of-joy.json`,
			content: '',
		});

		static RED_HEART = new ReactionIcon('RED_HEART', {
			name: 'redHeart',
			testId: 'MESSAGE_MENU_REACTION_RED_HEART',
			path: `${BaseDir}/icons/red-heart.svg`,
			imageUrl: `${BaseDir}/images/red-heart.png`,
			imageWithAnimationPaddingUrl: `${BaseDir}/template-images/red-heart.png`,
			lottieUrl: `${BaseDir}/lotties/red-heart.json`,
			content: '',
		});

		static WONDER = new ReactionIcon('WONDER', {
			name: 'wonder',
			testId: 'MESSAGE_MENU_REACTION_WONDER',
			path: `${BaseDir}/icons/wonder.svg`,
			imageUrl: `${BaseDir}/images/wonder.png`,
			imageWithAnimationPaddingUrl: `${BaseDir}/template-images/wonder.png`,
			lottieUrl: `${BaseDir}/lotties/wonder.json`,
			content: '',
		});

		static FIRE = new ReactionIcon('FIRE', {
			name: 'fire',
			testId: 'MESSAGE_MENU_REACTION_FIRE',
			path: `${BaseDir}/icons/fire.svg`,
			imageUrl: `${BaseDir}/images/fire.png`,
			imageWithAnimationPaddingUrl: `${BaseDir}/template-images/fire.png`,
			lottieUrl: `${BaseDir}/lotties/fire.json`,
			content: '',
		});

		static CRY = new ReactionIcon('CRY', {
			name: 'cry',
			testId: 'MESSAGE_MENU_REACTION_CRY',
			path: `${BaseDir}/icons/cry.svg`,
			imageUrl: `${BaseDir}/images/cry.png`,
			imageWithAnimationPaddingUrl: `${BaseDir}/template-images/cry.png`,
			lottieUrl: `${BaseDir}/lotties/cry.json`,
			content: '',
		});

		static SLEEPING_SYMBOL = new ReactionIcon('SLEEPING_SYMBOL', {
			name: 'sleepingSymbol',
			testId: 'MESSAGE_MENU_SLEEPING_SYMBOL',
			path: `${BaseDir}/icons/sleeping-symbol.svg`,
			imageUrl: `${BaseDir}/images/sleeping-symbol.png`,
			imageWithAnimationPaddingUrl: `${BaseDir}/template-images/sleeping-symbol.png`,
			lottieUrl: `${BaseDir}/lotties/sleeping-symbol.json`,
			content: '',
		});

		static CROSS_MARK = new ReactionIcon('CROSS_MARK', {
			name: 'crossMark',
			testId: 'MESSAGE_MENU_CROSS_MARK',
			path: `${BaseDir}/icons/cross-mark.svg`,
			imageUrl: `${BaseDir}/images/cross-mark.png`,
			imageWithAnimationPaddingUrl: `${BaseDir}/template-images/cross-mark.png`,
			lottieUrl: `${BaseDir}/lotties/cross-mark.json`,
			content: '',
		});

		static WHITE_HEAVY_CHECK_MARK = new ReactionIcon('WHITE_HEAVY_CHECK_MARK', {
			name: 'whiteHeavyCheckMark',
			testId: 'MESSAGE_MENU_WHITE_HEAVY_CHECK_MARK',
			path: `${BaseDir}/icons/white-heavy-check-mark.svg`,
			imageUrl: `${BaseDir}/images/white-heavy-check-mark.png`,
			imageWithAnimationPaddingUrl: `${BaseDir}/template-images/white-heavy-check-mark.png`,
			lottieUrl: `${BaseDir}/lotties/white-heavy-check-mark.json`,
			content: '',
		});

		static EYES = new ReactionIcon('EYES', {
			name: 'eyes',
			testId: 'MESSAGE_MENU_EYES',
			path: `${BaseDir}/icons/eyes.svg`,
			imageUrl: `${BaseDir}/images/eyes.png`,
			imageWithAnimationPaddingUrl: `${BaseDir}/template-images/eyes.png`,
			lottieUrl: `${BaseDir}/lotties/eyes.json`,
			content: '',
		});

		static HANDSHAKE = new ReactionIcon('HANDSHAKE', {
			name: 'handshake',
			testId: 'MESSAGE_MENU_HANDSHAKE',
			path: `${BaseDir}/icons/handshake.svg`,
			imageUrl: `${BaseDir}/images/handshake.png`,
			imageWithAnimationPaddingUrl: `${BaseDir}/template-images/handshake.png`,
			lottieUrl: `${BaseDir}/lotties/handshake.json`,
			content: '',
		});

		static HUNDRED_POINTS = new ReactionIcon('HUNDRED_POINTS', {
			name: 'hundredPoints',
			testId: 'MESSAGE_MENU_HUNDRED_POINTS',
			path: `${BaseDir}/icons/hundred-points.svg`,
			imageUrl: `${BaseDir}/images/hundred-points.png`,
			imageWithAnimationPaddingUrl: `${BaseDir}/template-images/hundred-points.png`,
			lottieUrl: `${BaseDir}/lotties/hundred-points.json`,
			content: '',
		});

		static LIKE = new ReactionIcon('LIKE', {
			name: 'like',
			testId: 'MESSAGE_MENU_REACTION_LIKE',
			path: `${BaseDir}/icons/like.svg`,
			imageUrl: `${BaseDir}/images/like.png`,
			imageWithAnimationPaddingUrl: `${BaseDir}/template-images/like.png`,
			lottieUrl: `${BaseDir}/lotties/like.json`,
			content: '',
		});

		static KISS = new ReactionIcon('KISS', {
			name: 'kiss',
			testId: 'MESSAGE_MENU_REACTION_KISS',
			path: `${BaseDir}/icons/kiss.svg`,
			imageUrl: `${BaseDir}/images/kiss.png`,
			imageWithAnimationPaddingUrl: `${BaseDir}/template-images/kiss.png`,
			lottieUrl: `${BaseDir}/lotties/kiss.json`,
			content: '',
		});

		static LAUGH = new ReactionIcon('LAUGH', {
			name: 'laugh',
			testId: 'MESSAGE_MENU_REACTION_LAUGH',
			path: `${BaseDir}/icons/laugh.svg`,
			imageUrl: `${BaseDir}/images/laugh.png`,
			imageWithAnimationPaddingUrl: `${BaseDir}/template-images/laugh.png`,
			lottieUrl: `${BaseDir}/lotties/laugh.json`,
			content: '',
		});

		static ANGRY = new ReactionIcon('ANGRY', {
			name: 'angry',
			testId: 'MESSAGE_MENU_REACTION_ANGRY',
			path: `${BaseDir}/icons/angry.svg`,
			imageUrl: `${BaseDir}/images/angry.png`,
			imageWithAnimationPaddingUrl: `${BaseDir}/template-images/angry.png`,
			lottieUrl: `${BaseDir}/lotties/angry.json`,
			content: '',
		});

		static FACEPALM = new ReactionIcon('FACEPALM', {
			name: 'facepalm',
			testId: 'MESSAGE_MENU_REACTION_FACEPALM',
			path: `${BaseDir}/icons/facepalm.svg`,
			imageUrl: `${BaseDir}/images/facepalm.png`,
			imageWithAnimationPaddingUrl: `${BaseDir}/template-images/facepalm.png`,
			lottieUrl: `${BaseDir}/lotties/facepalm.json`,
			content: '',
		});

		static CLAPPING_HANDS = new ReactionIcon('CLAPPING_HANDS', {
			name: 'clappingHands',
			testId: 'MESSAGE_MENU_REACTION_CLAPPING_HANDS',
			path: `${BaseDir}/icons/clapping-hands.svg`,
			imageUrl: `${BaseDir}/images/clapping-hands.png`,
			imageWithAnimationPaddingUrl: `${BaseDir}/template-images/clapping-hands.png`,
			lottieUrl: `${BaseDir}/lotties/clapping-hands.json`,
			content: '',
		});

		static FLEXED_BICEPS = new ReactionIcon('flexedBiceps', {
			name: 'flexedBiceps',
			testId: 'MESSAGE_MENU_REACTION_FLEXED_BICEPS',
			path: `${BaseDir}/icons/flexed-biceps.svg`,
			imageUrl: `${BaseDir}/images/flexed-biceps.png`,
			imageWithAnimationPaddingUrl: `${BaseDir}/template-images/flexed-biceps.png`,
			lottieUrl: `${BaseDir}/lotties/flexed-biceps.json`,
			content: '',
		});

		static BOMB = new ReactionIcon('BOMB', {
			name: 'bomb',
			testId: 'MESSAGE_MENU_REACTION_BOMB',
			path: `${BaseDir}/icons/bomb.svg`,
			imageUrl: `${BaseDir}/images/bomb.png`,
			imageWithAnimationPaddingUrl: `${BaseDir}/template-images/bomb.png`,
			lottieUrl: `${BaseDir}/lotties/bomb.json`,
			content: '',
		});

		static CLOWN_FACE = new ReactionIcon('CLOWN_FACE', {
			name: 'clownFace',
			testId: 'MESSAGE_MENU_REACTION_CLOWN_FACE',
			path: `${BaseDir}/icons/clown-face.svg`,
			imageUrl: `${BaseDir}/images/clown-face.png`,
			imageWithAnimationPaddingUrl: `${BaseDir}/template-images/clown-face.png`,
			lottieUrl: `${BaseDir}/lotties/clown-face.json`,
			content: '',
		});

		static CONFUSED_FACE = new ReactionIcon('CONFUSED_FACE', {
			name: 'confusedFace',
			testId: 'MESSAGE_MENU_REACTION_CONFUSED_FACE',
			path: `${BaseDir}/icons/confused-face.svg`,
			imageUrl: `${BaseDir}/images/confused-face.png`,
			imageWithAnimationPaddingUrl: `${BaseDir}/template-images/confused-face.png`,
			lottieUrl: `${BaseDir}/lotties/confused-face.json`,
			content: '',
		});

		static SMILING_FACE_WITH_SUNGLASSES = new ReactionIcon('SMILING_FACE_WITH_SUNGLASSES', {
			name: 'smilingFaceWithSunglasses',
			testId: 'MESSAGE_MENU_REACTION_SMILING_FACE_WITH_SUNGLASSES',
			path: `${BaseDir}/icons/smiling-face-with-sunglasses.svg`,
			imageUrl: `${BaseDir}/images/smiling-face-with-sunglasses.png`,
			imageWithAnimationPaddingUrl: `${BaseDir}/template-images/smiling-face-with-sunglasses.png`,
			lottieUrl: `${BaseDir}/lotties/smiling-face-with-sunglasses.json`,
			content: '',
		});

		static DISLIKE = new ReactionIcon('DISLIKE', {
			name: 'dislike',
			testId: 'MESSAGE_MENU_REACTION_DISLIKE',
			path: `${BaseDir}/icons/dislike.svg`,
			imageUrl: `${BaseDir}/images/dislike.png`,
			imageWithAnimationPaddingUrl: `${BaseDir}/template-images/dislike.png`,
			lottieUrl: `${BaseDir}/lotties/dislike.json`,
			content: '',
		});

		static FLUSHED_FACE = new ReactionIcon('FLUSHED_FACE', {
			name: 'flushedFace',
			testId: 'MESSAGE_MENU_REACTION_FLUSHED_FACE',
			path: `${BaseDir}/icons/flushed-face.svg`,
			imageUrl: `${BaseDir}/images/flushed-face.png`,
			imageWithAnimationPaddingUrl: `${BaseDir}/template-images/flushed-face.png`,
			lottieUrl: `${BaseDir}/lotties/flushed-face.json`,
			content: '',
		});

		static EXCLAMATION_MARK = new ReactionIcon('EXCLAMATION_MARK', {
			name: 'exclamationMark',
			testId: 'MESSAGE_MENU_REACTION_EXCLAMATION_MARK',
			path: `${BaseDir}/icons/exclamation-mark.svg`,
			imageUrl: `${BaseDir}/images/exclamation-mark.png`,
			imageWithAnimationPaddingUrl: `${BaseDir}/template-images/exclamation-mark.png`,
			lottieUrl: `${BaseDir}/lotties/exclamation-mark.json`,
			content: '',
		});

		static FOLDED_HANDS = new ReactionIcon('FOLDED_HANDS', {
			name: 'foldedHands',
			testId: 'MESSAGE_MENU_REACTION_FOLDED_HANDS',
			path: `${BaseDir}/icons/folded-hands.svg`,
			imageUrl: `${BaseDir}/images/folded-hands.png`,
			imageWithAnimationPaddingUrl: `${BaseDir}/template-images/folded-hands.png`,
			lottieUrl: `${BaseDir}/lotties/folded-hands.json`,
			content: '',
		});

		static SMILING_FACE_WITH_HEART_EYES = new ReactionIcon('SMILING_FACE_WITH_HEART_EYES', {
			name: 'smilingFaceWithHeartEyes',
			testId: 'MESSAGE_MENU_REACTION_SMILING_FACE_WITH_HEART_EYES',
			path: `${BaseDir}/icons/smiling-face-with-heart-eyes.svg`,
			imageUrl: `${BaseDir}/images/smiling-face-with-heart-eyes.png`,
			imageWithAnimationPaddingUrl: `${BaseDir}/template-images/smiling-face-with-heart-eyes.png`,
			lottieUrl: `${BaseDir}/lotties/smiling-face-with-heart-eyes.json`,
			content: '',
		});

		static LIGHT_BULB = new ReactionIcon('LIGHT_BULB', {
			name: 'lightBulb',
			testId: 'MESSAGE_MENU_REACTION_LIGHT_BULB',
			path: `${BaseDir}/icons/light-bulb.svg`,
			imageUrl: `${BaseDir}/images/light-bulb.png`,
			imageWithAnimationPaddingUrl: `${BaseDir}/template-images/light-bulb.png`,
			lottieUrl: `${BaseDir}/lotties/light-bulb.json`,
			content: '',
		});

		static FACE_WITH_THERMOMETER = new ReactionIcon('FACE_WITH_THERMOMETER', {
			name: 'faceWithThermometer',
			testId: 'MESSAGE_MENU_REACTION_FACE_WITH_THERMOMETER',
			path: `${BaseDir}/icons/face-with-thermometer.svg`,
			imageUrl: `${BaseDir}/images/face-with-thermometer.png`,
			imageWithAnimationPaddingUrl: `${BaseDir}/template-images/face-with-thermometer.png`,
			lottieUrl: `${BaseDir}/lotties/face-with-thermometer.json`,
			content: '',
		});

		static LOUDLY_CRYING_FACE = new ReactionIcon('LOUDLY_CRYING_FACE', {
			name: 'loudlyCryingFace',
			testId: 'MESSAGE_MENU_REACTION_LOUDLY_CRYING_FACE',
			path: `${BaseDir}/icons/loudly-crying-face.svg`,
			imageUrl: `${BaseDir}/images/loudly-crying-face.png`,
			imageWithAnimationPaddingUrl: `${BaseDir}/template-images/loudly-crying-face.png`,
			lottieUrl: `${BaseDir}/lotties/loudly-crying-face.json`,
			content: '',
		});

		static LOVE_YOU_GESTURE = new ReactionIcon('LOVE_YOU_GESTURE', {
			name: 'loveYouGesture',
			testId: 'MESSAGE_MENU_REACTION_LOVE_YOU_GESTURE',
			path: `${BaseDir}/icons/love-you-gesture.svg`,
			imageUrl: `${BaseDir}/images/love-you-gesture.png`,
			imageWithAnimationPaddingUrl: `${BaseDir}/template-images/love-you-gesture.png`,
			lottieUrl: `${BaseDir}/lotties/love-you-gesture.json`,
			content: '',
		});

		static NEUTRAL_FACE = new ReactionIcon('NEUTRAL_FACE', {
			name: 'neutralFace',
			testId: 'MESSAGE_MENU_REACTION_NEUTRAL_FACE',
			path: `${BaseDir}/icons/neutral-face.svg`,
			imageUrl: `${BaseDir}/images/neutral-face.png`,
			imageWithAnimationPaddingUrl: `${BaseDir}/template-images/neutral-face.png`,
			lottieUrl: `${BaseDir}/lotties/neutral-face.json`,
			content: '',
		});

		static OK_HAND = new ReactionIcon('OK_HAND', {
			name: 'okHand',
			testId: 'MESSAGE_MENU_REACTION_OK_HAND',
			path: `${BaseDir}/icons/ok-hand.svg`,
			imageUrl: `${BaseDir}/images/ok-hand.png`,
			imageWithAnimationPaddingUrl: `${BaseDir}/template-images/ok-hand.png`,
			lottieUrl: `${BaseDir}/lotties/ok-hand.json`,
			content: '',
		});

		static PARTYING_FACE = new ReactionIcon('PARTYING_FACE', {
			name: 'partyingFace',
			testId: 'MESSAGE_MENU_REACTION_PARTYING_FACE',
			path: `${BaseDir}/icons/partying-face.svg`,
			imageUrl: `${BaseDir}/images/partying-face.png`,
			imageWithAnimationPaddingUrl: `${BaseDir}/template-images/partying-face.png`,
			lottieUrl: `${BaseDir}/lotties/partying-face.json`,
			content: '',
		});

		static PLEADING_FACE = new ReactionIcon('PLEADING_FACE', {
			name: 'pleadingFace',
			testId: 'MESSAGE_MENU_REACTION_PLEADING_FACE',
			path: `${BaseDir}/icons/pleading-face.svg`,
			imageUrl: `${BaseDir}/images/pleading-face.png`,
			imageWithAnimationPaddingUrl: `${BaseDir}/template-images/pleading-face.png`,
			lottieUrl: `${BaseDir}/lotties/pleading-face.json`,
			content: '',
		});

		static POO = new ReactionIcon('POO', {
			name: 'poo',
			testId: 'MESSAGE_MENU_REACTION_POO',
			path: `${BaseDir}/icons/poo.svg`,
			imageUrl: `${BaseDir}/images/poo.png`,
			imageWithAnimationPaddingUrl: `${BaseDir}/template-images/poo.png`,
			lottieUrl: `${BaseDir}/lotties/poo.json`,
			content: '',
		});

		static QUESTION_MARK = new ReactionIcon('QUESTION_MARK', {
			name: 'questionMark',
			testId: 'MESSAGE_MENU_REACTION_QUESTION_MARK',
			path: `${BaseDir}/icons/question-mark.svg`,
			imageUrl: `${BaseDir}/images/question-mark.png`,
			imageWithAnimationPaddingUrl: `${BaseDir}/template-images/question-mark.png`,
			lottieUrl: `${BaseDir}/lotties/question-mark.json`,
			content: '',
		});

		static RELIEVED_FACE = new ReactionIcon('RELIEVED_FACE', {
			name: 'relievedFace',
			testId: 'MESSAGE_MENU_REACTION_RELIEVED_FACE',
			path: `${BaseDir}/icons/relieved-face.svg`,
			imageUrl: `${BaseDir}/images/relieved-face.png`,
			imageWithAnimationPaddingUrl: `${BaseDir}/template-images/relieved-face.png`,
			lottieUrl: `${BaseDir}/lotties/relieved-face.json`,
			content: '',
		});

		static SLIGHTLY_FROWNING_FACE = new ReactionIcon('SLIGHTLY_FROWNING_FACE', {
			name: 'slightlyFrowningFace',
			testId: 'MESSAGE_MENU_REACTION_SLIGHTLY_FROWNING_FACE',
			path: `${BaseDir}/icons/slightly-frowning-face.svg`,
			imageUrl: `${BaseDir}/images/slightly-frowning-face.png`,
			imageWithAnimationPaddingUrl: `${BaseDir}/template-images/slightly-frowning-face.png`,
			lottieUrl: `${BaseDir}/lotties/slightly-frowning-face.json`,
			content: '',
		});

		static SMILING_FACE_WITH_HEARTS = new ReactionIcon('SMILING_FACE_WITH_HEARTS', {
			name: 'smilingFaceWithHearts',
			testId: 'MESSAGE_MENU_REACTION_SMILING_FACE_WITH_HEARTS',
			path: `${BaseDir}/icons/smiling-face-with-hearts.svg`,
			imageUrl: `${BaseDir}/images/smiling-face-with-hearts.png`,
			imageWithAnimationPaddingUrl: `${BaseDir}/template-images/smiling-face-with-hearts.png`,
			lottieUrl: `${BaseDir}/lotties/smiling-face-with-hearts.json`,
			content: '',
		});

		static SMILING_FACE_WITH_HORNS = new ReactionIcon('SMILING_FACE_WITH_HORNS', {
			name: 'smilingFaceWithHorns',
			testId: 'MESSAGE_MENU_REACTION_SMILING_FACE_WITH_HORNS',
			path: `${BaseDir}/icons/smiling-face-with-horns.svg`,
			imageUrl: `${BaseDir}/images/smiling-face-with-horns.png`,
			imageWithAnimationPaddingUrl: `${BaseDir}/template-images/smiling-face-with-horns.png`,
			lottieUrl: `${BaseDir}/lotties/smiling-face-with-horns.json`,
			content: '',
		});

		static SLIGHTLY_SMILING_FACE = new ReactionIcon('SLIGHTLY_SMILING_FACE', {
			name: 'slightlySmilingFace',
			testId: 'MESSAGE_MENU_REACTION_SLIGHTLY_SMILING_FACE',
			path: `${BaseDir}/icons/slightly-smiling-face.svg`,
			imageUrl: `${BaseDir}/images/slightly-smiling-face.png`,
			imageWithAnimationPaddingUrl: `${BaseDir}/template-images/slightly-smiling-face.png`,
			lottieUrl: `${BaseDir}/lotties/slightly-smiling-face.json`,
			content: '',
		});

		static RAISED_HAND = new ReactionIcon('RAISED_HAND', {
			name: 'raisedHand',
			testId: 'MESSAGE_MENU_REACTION_RAISED_HAND',
			path: `${BaseDir}/icons/raised-hand.svg`,
			imageUrl: `${BaseDir}/images/raised-hand.png`,
			imageWithAnimationPaddingUrl: `${BaseDir}/template-images/raised-hand.png`,
			lottieUrl: `${BaseDir}/lotties/raised-hand.json`,
			content: '',
		});

		static THINKING_FACE = new ReactionIcon('THINKING_FACE', {
			name: 'thinkingFace',
			testId: 'MESSAGE_MENU_REACTION_THINKING_FACE',
			path: `${BaseDir}/icons/thinking-face.svg`,
			imageUrl: `${BaseDir}/images/thinking-face.png`,
			imageWithAnimationPaddingUrl: `${BaseDir}/template-images/thinking-face.png`,
			lottieUrl: `${BaseDir}/lotties/thinking-face.json`,
			content: '',
		});

		static FACE_WITH_STUCK_OUT_TONGUE_AND_WINK = new ReactionIcon('FACE_WITH_STUCK_OUT_TONGUE_AND_WINK', {
			name: 'faceWithStuckOutTongueAndWinkingEye',
			testId: 'MESSAGE_MENU_REACTION_FACE_WITH_STUCK_OUT_TONGUE_AND_WINKING_EYE',
			path: `${BaseDir}/icons/face-with-stuck-out-tongue-and-wink.svg`,
			imageUrl: `${BaseDir}/images/face-with-stuck-out-tongue-and-wink.png`,
			imageWithAnimationPaddingUrl: `${BaseDir}/template-images/face-with-stuck-out-tongue-and-wink.png`,
			lottieUrl: `${BaseDir}/lotties/face-with-stuck-out-tongue-and-wink.json`,
			content: '',
		});

		static WINKING_FACE = new ReactionIcon('WINKING_FACE', {
			name: 'winkingFace',
			testId: 'MESSAGE_MENU_REACTION_WINK',
			path: `${BaseDir}/icons/winking-face.svg`,
			imageUrl: `${BaseDir}/images/winking-face.png`,
			imageWithAnimationPaddingUrl: `${BaseDir}/template-images/winking-face.png`,
			lottieUrl: `${BaseDir}/lotties/winking-face.json`,
			content: '',
		});

		static WHATS_NEW_FIRE = new ReactionIcon('WHATS_NEW_FIRE', {
			name: 'fire',
			testId: 'MESSAGE_MENU_REACTION_FIRE',
			path: `${BaseDir}/icons/whats-new-fire.svg`,
			imageUrl: `${BaseDir}/images/whats-new-fire.png`,
			imageWithAnimationPaddingUrl: '',
			lottieUrl: null,
			content: '',
		});

		static WHATS_NEW_LIKE = new ReactionIcon('WHATS_NEW_LIKE', {
			name: 'sad',
			testId: 'MESSAGE_MENU_REACTION_SAD',
			path: `${BaseDir}/icons/whats-new-like.svg`,
			imageUrl: `${BaseDir}/images/whats-new-like.png`,
			imageWithAnimationPaddingUrl: '',
			lottieUrl: null,
			content: '',
		});

		static WHATS_NEW_DISLIKE = new ReactionIcon('WHATS_NEW_DISLIKE', {
			name: 'heart-eyes',
			testId: 'MESSAGE_MENU_REACTION_HEART_EYES',
			path: `${BaseDir}/icons/whats-new-dislike.svg`,
			imageUrl: `${BaseDir}/images/whats-new-dislike.png`,
			imageWithAnimationPaddingUrl: '',
			lottieUrl: null,
			content: '',
		});

		static LEGACY_LIKE = new ReactionIcon('LEGACY_LIKE', {
			name: 'like',
			testId: 'MESSAGE_MENU_REACTION_LIKE',
			path: `${BaseDir}/icons/legacy-like.svg`,
			imageUrl: `${BaseDir}/images/legacy-like.png`,
			imageWithAnimationPaddingUrl: '',
			lottieUrl: `${BaseDir}/lotties/legacy-like.json`,
			content: '',
		});

		static LEGACY_KISS = new ReactionIcon('LEGACY_KISS', {
			name: 'kiss',
			testId: 'MESSAGE_MENU_REACTION_KISS',
			path: `${BaseDir}/icons/legacy-kiss.svg`,
			imageUrl: `${BaseDir}/images/legacy-kiss.png`,
			imageWithAnimationPaddingUrl: '',
			lottieUrl: `${BaseDir}/lotties/legacy-kiss.json`,
			content: '',
		});

		static LEGACY_LAUGH = new ReactionIcon('LEGACY_LAUGH', {
			name: 'laugh',
			testId: 'MESSAGE_MENU_REACTION_LAUGH',
			path: `${BaseDir}/icons/legacy-laugh.svg`,
			imageUrl: `${BaseDir}/images/legacy-laugh.png`,
			imageWithAnimationPaddingUrl: '',
			lottieUrl: `${BaseDir}/lotties/legacy-laugh.json`,
			content: '',
		});

		static LEGACY_WONDER = new ReactionIcon('LEGACY_WONDER', {
			name: 'wonder',
			testId: 'MESSAGE_MENU_REACTION_WONDER',
			path: `${BaseDir}/icons/legacy-wonder.svg`,
			imageUrl: `${BaseDir}/images/legacy-wonder.png`,
			imageWithAnimationPaddingUrl: '',
			lottieUrl: `${BaseDir}/lotties/legacy-wonder.json`,
			content: '',
		});

		static LEGACY_CRY = new ReactionIcon('LEGACY_CRY', {
			name: 'cry',
			testId: 'MESSAGE_MENU_REACTION_CRY',
			path: `${BaseDir}/icons/legacy-cry.svg`,
			imageUrl: `${BaseDir}/images/legacy-cry.png`,
			imageWithAnimationPaddingUrl: '',
			lottieUrl: `${BaseDir}/lotties/legacy-cry.json`,
			content: '',
		});

		static LEGACY_ANGRY = new ReactionIcon('LEGACY_ANGRY', {
			name: 'angry',
			testId: 'MESSAGE_MENU_REACTION_ANGRY',
			path: `${BaseDir}/icons/legacy-angry.svg`,
			imageUrl: `${BaseDir}/images/legacy-angry.png`,
			imageWithAnimationPaddingUrl: '',
			lottieUrl: `${BaseDir}/lotties/legacy-angry.json`,
			content: '',
		});

		static LEGACY_FACEPALM = new ReactionIcon('LEGACY_FACEPALM', {
			name: 'facepalm',
			testId: 'MESSAGE_MENU_REACTION_FACEPALM',
			path: `${BaseDir}/icons/legacy-facepalm.svg`,
			imageUrl: `${BaseDir}/images/legacy-facepalm.png`,
			imageWithAnimationPaddingUrl: '',
			lottieUrl: `${BaseDir}/lotties/legacy-facepalm.json`,
			content: '',
		});

		static LEGACY_FACE_WITH_STUCK_OUT_TONGUE = new ReactionIcon('LEGACY_FACE_WITH_STUCK_OUT_TONGUE', {
			name: 'faceWithStuckOutTongue',
			testId: 'MESSAGE_MENU_REACTION_FACE_WITH_STUCK_OUT_TONGUE',
			path: `${BaseDir}/icons/face-with-stuck-out-tongue.svg`,
			imageUrl: `${BaseDir}/images/face-with-stuck-out-tongue.png`,
			imageWithAnimationPaddingUrl: `${BaseDir}/template-images/face-with-stuck-out-tongue.png`,
			lottieUrl: '',
			content: '',
		});

		static LEGACY_SIGN_HORNS = new ReactionIcon('LEGACY_SIGN_HORNS', {
			name: 'signHorns',
			testId: 'MESSAGE_MENU_REACTION_SIGN_HORNS',
			path: `${BaseDir}/icons/sign-horns.svg`,
			imageUrl: `${BaseDir}/images/sign-horns.png`,
			imageWithAnimationPaddingUrl: `${BaseDir}/template-images/sign-horns.png`,
			lottieUrl: '',
			content: '',
		});

		/**
		 * @public
		 * @param {string} reactionId
		 * @return {ReactionIcon|null}
		 */
		static getIconByReactionId(reactionId)
		{
			return Object.values(ReactionIcon).find((reaction) => {
				return reaction.getIconName() === reactionId;
			}) ?? null;
		}

		/**
		 * @public
		 * @param {string} reactionId
		 * @return {string|null}
		 */
		static getPathByReactionId(reactionId)
		{
			const icon = ReactionIcon.getIconByReactionId(reactionId);

			return icon?.value?.path ?? null;
		}

		static #getReactionListForContextMenu()
		{
			if (!Feature.isNewReactionVersionSupported())
			{
				return [
					this.LEGACY_LIKE.getValue(),
					this.LEGACY_KISS.getValue(),
					this.LEGACY_LAUGH.getValue(),
					this.LEGACY_WONDER.getValue(),
					this.LEGACY_CRY.getValue(),
					this.LEGACY_ANGRY.getValue(),
					this.LEGACY_FACEPALM.getValue(),
				];
			}

			return [
				this.LIKE.getValue(),
				this.KISS.getValue(),
				this.LAUGH.getValue(),
				this.WONDER.getValue(),
				this.CRY.getValue(),
				this.ANGRY.getValue(),
				this.FACEPALM.getValue(),
			];
		}

		/**
		 * Returns a mapping of reaction IDs to their corresponding Lottie animation URLs
		 * @public
		 * @returns {Object}
		 */
		static getLottieAnimationList()
		{
			return Object.entries(ReactionIcon)
				.filter(([key]) => {
					const up = String(key).toUpperCase();

					return !up.startsWith('WHATS_NEW_') && !up.startsWith('LEGACY_');
				})
				.map(([, value]) => value.getValue())
				.reduce((animations, reaction) => {
					return {
						...animations,
						[reaction.name]: withCurrentDomain(reaction.lottieUrl),
					};
				}, {});
		}

		/**
		 * Returns the animation URL for chosen reactionId
		 * @public
		 * @param {string} reactionId
		 * @returns {string|null}
		 */
		static getLottieAnimationById(reactionId)
		{
			const animation = Object.entries(ReactionIcon)
				.filter(([key]) => {
					const up = String(key).toUpperCase();

					return !up.startsWith('WHATS_NEW_') && !up.startsWith('LEGACY_');
				})
				.map(([, value]) => value.getValue())
				.find((reaction) => reaction.name === reactionId) ?? null;

			return animation ? withCurrentDomain(animation.lottieUrl) : null;
		}

		/**
		 * Returns an array of reaction formatted for use in native contextMenuModule
		 * @public
		 * @returns {Array<Object>}
		 */
		static getPackForContextMenu()
		{
			return this.#getReactionListForContextMenu().map((reaction) => ({
				id: reaction.name,
				testId: reaction.testId,
				imageUrl: withCurrentDomain(reaction.imageUrl),
				lottieUrl: withCurrentDomain(reaction.lottieUrl),
				svgUrl: withCurrentDomain(reaction.path),
			}));
		}

		/**
		 * @see ReactionPack
		 * @public
		 * @returns {Array<Object>}
		 */
		static getPackForReactionPicker(setPngPadding = false)
		{
			return Object.entries(ReactionIcon)
				.filter(([key]) => {
					const up = String(key).toUpperCase();

					return !up.startsWith('WHATS_NEW_') && !up.startsWith('LEGACY_');
				})
				.map(([key, value]) => {
					const reaction = value.getValue();

					return {
						id: reaction.name,
						testId: reaction.testId,
						svgUrl: withCurrentDomain(reaction.path),
						imageUrl: setPngPadding
							? withCurrentDomain(reaction.imageWithAnimationPaddingUrl)
							: withCurrentDomain(reaction.imageUrl),
						lottieUrl: withCurrentDomain(reaction.lottieUrl),
					};
				});
		}
	}

	module.exports = { ReactionIcon };
});

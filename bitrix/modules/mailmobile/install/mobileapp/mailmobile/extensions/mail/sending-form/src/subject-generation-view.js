/**
 * @module mail/sending-form/src/subject-generation-view
 */
jn.define('mail/sending-form/src/subject-generation-view', (require, exports, module) => {
	const AppTheme = require('apptheme');
	const { Loc } = require('loc');
	const { Color } = require('tokens');
	const { Text3 } = require('ui-system/typography/text');

	const GENERATING_MESSAGE = 'MESSAGE_SEND_AI_SUBJECT_GENERATING';
	const TEXT_TEST_ID = 'message-sending-form-subject-generation-text';
	const LOADER_TEST_ID = 'message-sending-form-subject-generation-loader';
	const ANIMATION_DURATION = 1400;
	const BRIGHTNESS_ANIMATION_DURATION = ANIMATION_DURATION / 2;
	const DIMMED_OPACITY = 0.45;
	const LOADER_SIZE = 24;
	const LOADER_FRAMES = 84;
	const FIELD_CONTENT_PADDING_TOP = 8;
	const LEGACY_GRADIENT_COLORS = {
		light: ['#0098EA', '#3F68FF', '#9D48FF', '#F046B7', '#F96269'],
		dark: ['#28B4FF', '#7D98FF', '#BD82FF', '#FF67CC', '#FF8A90'],
	};

	function resolveSubjectGenerationGradient(colors, themeId)
	{
		const isLegacyWhiteFallback = colors.every((color) => color.toLowerCase() === '#ffffff');
		if (!isLegacyWhiteFallback)
		{
			return colors;
		}

		return LEGACY_GRADIENT_COLORS[themeId] ?? LEGACY_GRADIENT_COLORS.light;
	}

	function getGradientColors()
	{
		const colors = [
			Color.textBitrixGptGradient1.toHex(),
			Color.textBitrixGptGradient2.toHex(),
			Color.textBitrixGptGradient3.toHex(),
			Color.textBitrixGptGradient4.toHex(),
			Color.textBitrixGptGradient5.toHex(),
		];

		return resolveSubjectGenerationGradient(colors, AppTheme.id);
	}

	function hexToLottieColor(hex)
	{
		const channels = hex.slice(1, 7).match(/.{2}/g) ?? [];

		return [...channels.map((channel) => parseInt(channel, 16) / 255), 1];
	}

	function createLoaderAnimation(colors)
	{
		return {
			v: '5.9.6',
			fr: 60,
			ip: 0,
			op: LOADER_FRAMES,
			w: LOADER_SIZE,
			h: LOADER_SIZE,
			nm: 'BitrixGPT subject loader',
			ddd: 0,
			assets: [],
			layers: colors.map((color, index) => ({
				ddd: 0,
				ind: index + 1,
				ty: 4,
				nm: color,
				sr: 1,
				ks: {
					o: { a: 0, k: 100 },
					r: {
						a: 1,
						k: [
							{ t: 0, s: [0], e: [360] },
							{ t: LOADER_FRAMES, s: [360] },
						],
					},
					p: { a: 0, k: [12, 12, 0] },
					a: { a: 0, k: [0, 0, 0] },
					s: { a: 0, k: [100, 100, 100] },
				},
				shapes: [
					{
						ty: 'gr',
						nm: `segment-${index + 1}`,
						it: [
							{ ty: 'el', d: 1, s: { a: 0, k: [18, 18] }, p: { a: 0, k: [0, 0] } },
							{
								ty: 'st',
								c: { a: 0, k: hexToLottieColor(color) },
								o: { a: 0, k: 82 },
								w: { a: 0, k: 2.5 },
								lc: 2,
								lj: 2,
							},
							{
								ty: 'tm',
								s: { a: 0, k: index * 20 + 2 },
								e: { a: 0, k: index * 20 + 18 },
								o: { a: 0, k: 0 },
								m: 1,
							},
							{
								ty: 'tr',
								p: { a: 0, k: [0, 0] },
								a: { a: 0, k: [0, 0] },
								s: { a: 0, k: [100, 100] },
								r: { a: 0, k: 0 },
								o: { a: 0, k: 100 },
							},
						],
					},
				],
				ip: 0,
				op: LOADER_FRAMES,
				st: 0,
				bm: 0,
			})),
			markers: [],
		};
	}

	function getSubjectGenerationFieldProps({ field, inProgress })
	{
		if (!inProgress)
		{
			return { field, readOnly: false };
		}

		return { field, readOnly: true };
	}

	class SubjectGenerationText extends LayoutComponent
	{
		constructor(props = {})
		{
			super(props);
			this.ref = null;
			this.mounted = false;
			this.animationStarted = false;
			this.bindRef = this.bindRef.bind(this);
		}

		componentDidMount()
		{
			this.mounted = true;
			this.startAnimation();
		}

		componentWillUnmount()
		{
			this.mounted = false;
			this.animationStarted = false;
			this.ref = null;
		}

		bindRef(ref)
		{
			this.ref = ref;
			this.startAnimation();
		}

		startAnimation()
		{
			if (!this.mounted || !this.ref?.animate || this.animationStarted)
			{
				return;
			}

			this.animationStarted = true;
			this.animateTo(1);
		}

		animateTo(opacity)
		{
			if (!this.mounted || !this.ref?.animate)
			{
				this.animationStarted = false;

				return;
			}

			this.ref.animate(
				{
					opacity,
					duration: BRIGHTNESS_ANIMATION_DURATION,
					option: 'easeInOut',
				},
				() => {
					if (this.mounted)
					{
						this.animateTo(opacity === 1 ? DIMMED_OPACITY : 1);
					}
				},
			);
		}

		render()
		{
			return View(
				{
					testId: `${TEXT_TEST_ID}-wave`,
					ref: this.bindRef,
					style: {
						opacity: DIMMED_OPACITY,
						paddingTop: FIELD_CONTENT_PADDING_TOP,
					},
				},
				Text3({
					testId: TEXT_TEST_ID,
					text: Loc.getMessage(GENERATING_MESSAGE),
					numberOfLines: 1,
					colorGradient: {
						colors: getGradientColors(),
						angle: 90,
					},
					shadow: {
						color: Color.textBitrixGptGradient3.toHex(0.24),
						radius: 2.5,
						offset: { x: 0, y: 0 },
					},
				}),
			);
		}
	}

	function renderSubjectGenerationText()
	{
		return new SubjectGenerationText();
	}

	function renderSubjectGenerationLoader()
	{
		if (typeof LottieView !== 'function')
		{
			if (typeof Loader !== 'function')
			{
				return null;
			}

			return Loader({
				testId: LOADER_TEST_ID,
				style: {
					width: LOADER_SIZE,
					height: LOADER_SIZE,
				},
				animating: true,
				size: 'small',
				tintColor: getGradientColors()[2],
			});
		}

		return LottieView({
			testId: LOADER_TEST_ID,
			style: {
				width: LOADER_SIZE,
				height: LOADER_SIZE,
			},
			data: {
				content: JSON.stringify(createLoaderAnimation(getGradientColors())),
			},
			params: {
				loopMode: 'loop',
			},
			autoPlay: true,
		});
	}

	module.exports = {
		getSubjectGenerationFieldProps,
		resolveSubjectGenerationGradient,
		SubjectGenerationText,
		renderSubjectGenerationText,
		renderSubjectGenerationLoader,
	};
});

(() => {
	const require = (ext) => jn.require(ext);

	const { describe, it, expect } = require('testing');
	const { ReactionIcon } = require('ui-system/blocks/reaction/icon');
	const { Feature } = require('feature');
	const { withCurrentDomain } = require('utils/url');

	const UNKNOWN_REACTION_ID = 'he-he-he';
	const LIKE = 'like';

	function testContextMenuPackNativeFeature(flagValue, checkFn)
	{
		const originalFeature = Feature.isNewReactionVersionSupported;

		try
		{
			Feature.isNewReactionVersionSupported = () => flagValue;

			const pack = ReactionIcon.getPackForContextMenu();
			const expectedIds = [
				'like',
				'kiss',
				'laugh',
				'wonder',
				'cry',
				'angry',
				'facepalm',
			];

			expect(pack.map((r) => r.id)).toEqual(expectedIds);

			checkFn(pack);
		}
		finally
		{
			Feature.isNewReactionVersionSupported = originalFeature;
		}
	}

	describe('ReactionIcon', () => {
		it('returns LEGACY reactions when feature is disabled', () => {
			testContextMenuPackNativeFeature(false, (pack) => {
				pack.forEach((reaction) => {
					expect(reaction.imageUrl).toContain('legacy');
				});
			});
		});

		it('returns normal reactions when feature is enabled', () => {
			testContextMenuPackNativeFeature(true, (pack) => {
				pack.forEach((reaction) => {
					expect(reaction.imageUrl).not.toContain('legacy');
				});
			});
		});

		it('returns ReactionIcon instance by reactionId', () => {
			const icon = ReactionIcon.getIconByReactionId(LIKE);
			expect(icon).toBeInstanceOf(ReactionIcon);
			expect(icon.getIconName()).toBe(LIKE);
		});

		it('returns null if reaction is not an instance of ReactionIcon', () => {
			const icon = ReactionIcon.getIconByReactionId(UNKNOWN_REACTION_ID);
			expect(icon).toBeNull();
		});

		it('returns correct path for existing reaction', () => {
			const path = ReactionIcon.getPathByReactionId(LIKE);
			expect(path).toBe(ReactionIcon.LIKE.getValue().path);
		});

		it('returns null instead of path for unknown reaction', () => {
			const path = ReactionIcon.getPathByReactionId(UNKNOWN_REACTION_ID);
			expect(path).toBeNull();
		});

		it('returns correct lottie URL for existing reaction', () => {
			const lottie = ReactionIcon.getLottieAnimationById(LIKE);
			const expectedLottieUrl = withCurrentDomain(ReactionIcon.LIKE.getValue().lottieUrl);

			expect(lottie).toBe(expectedLottieUrl);
		});

		it('returns null instead of lottie for unknown reaction', () => {
			const lottie = ReactionIcon.getLottieAnimationById(UNKNOWN_REACTION_ID);
			expect(lottie).toBeNull();
		});

		it('returns only non-LEGACY and non-WHATS_NEW reactions', () => {
			const pack = ReactionIcon.getPackForReactionPicker();

			pack.forEach((r) => {
				const iconKey = Object.keys(ReactionIcon).find((k) => ReactionIcon[k].getValue().name === r.id);
				expect(iconKey).toBeDefined();
				expect(iconKey.startsWith('LEGACY_')).toBe(false);
				expect(iconKey.startsWith('WHATS_NEW_')).toBe(false);
			});
		});

		it('returns correct imageUrl based on setPngPadding', () => {
			const packWithPadding = ReactionIcon.getPackForReactionPicker(true);
			const packWithoutPadding = ReactionIcon.getPackForReactionPicker(false);

			packWithPadding.forEach((r) => {
				expect(r.imageUrl).toContain('/template-images/');
			});
			packWithoutPadding.forEach((r) => {
				expect(r.imageUrl).toContain('/images/');
			});
		});
	});
})();

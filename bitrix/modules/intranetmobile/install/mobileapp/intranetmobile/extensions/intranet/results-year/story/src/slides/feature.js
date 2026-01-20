/**
 * @module intranet/results-year/story/src/slides/feature
 */
jn.define('intranet/results-year/story/src/slides/feature', (require, exports, module) => {
	const { Loc } = require('loc');
	const { Color } = require('tokens');
	const { Feature } = require('feature');
	const { withCurrentDomain } = require('utils/url');
	const { showSafeToast, showErrorToast } = require('toast');
	const { fetchResultsYearLink } = require('intranet/results-year/rest');
	const { ASSET_PATH } = require('intranet/results-year/story/src/constants');
	const { BaseSlider } = require('intranet/results-year/story/src/slides/base');
	const { BannersEnum } = require('intranet/results-year/story/src/banners-enum');

	/**
	 * @class FeatureSlider
	 */
	class FeatureSlider extends BaseSlider
	{
		/** @type {BannersEnum} */
		#banner = null;

		constructor(props)
		{
			super(props);

			this.#banner = BannersEnum.getBannerByType(this.getSlideType());
		}

		get #parentWidget()
		{
			const { getParentWidget } = this.props;

			return getParentWidget?.();
		}

		getTitle()
		{
			return this.getMessage('title');
		}

		getDescription()
		{
			return this.getMessage('description');
		}

		getMessage(type)
		{
			const { message } = this.props;

			return message?.[type];
		}

		getSlideType()
		{
			const { id } = this.props;

			return id;
		}

		getButtonText()
		{
			return Loc.getMessage('M_INTRANET_RESULTS_YEAR_BASE_SLIDER_BUTTON_TEXT');
		}

		getImage()
		{
			const { image } = this.getBannerValue();

			return Image({
				style: {
					position: 'absolute',
					width: '100%',
					right: 0,
					bottom: 0,
					...image?.style,
				},
				uri: this.getSlideImage(),
			});
		}

		getSlideImage()
		{
			const { image } = this.getBannerValue();

			return `${ASSET_PATH}/images/${image?.name}`;
		}

		getColorGradient()
		{
			const { backgroundColorGradient } = this.getBannerValue();

			return backgroundColorGradient;
		}

		getThemeColor(opacity)
		{
			const bannerColor = this.#banner.isLight() ? Color.baseBlackFixed : Color.baseWhiteFixed;

			return bannerColor.toHex(opacity);
		}

		getBannerValue()
		{
			return this.#banner?.getValue();
		}

		async handleOnButtonClick()
		{
			if (Feature.isNativeSnapshotApiSupported())
			{
				void this.#createSnapshot();

				return;
			}

			void this.#copySliderLinkToClipboard();
		}

		async #withLoadingState(callback)
		{
			try
			{
				await this.asyncSetState({ loadingButton: true });
				await callback();
			}
			finally
			{
				await this.asyncSetState({ loadingButton: false });
			}
		}

		async #createSnapshot()
		{
			const { onBeforeSharing, onAfterSharing } = this.props;

			onBeforeSharing?.();

			await this.#withLoadingState(async () => {
				try
				{
					await this.#showSharingDialog();
					this.sendAnalytics({ event: 'save_click' });
				}
				catch (error)
				{
					await this.#copySliderLinkToClipboard();
					console.error(error);
				}
				finally
				{
					onAfterSharing?.();
				}
			});
		}

		async #copySliderLinkToClipboard()
		{
			const { signedUserId, signedId } = this.props;

			await this.#withLoadingState(async () => {
				try
				{
					const { data } = await fetchResultsYearLink({
						signedId,
						signedUserId,
					});

					await this.#copyToClipboard(data?.link);
					this.sendAnalytics({ event: 'share_click' });
				}
				catch (error)
				{
					showErrorToast({}, this.#parentWidget);
					console.error(error);
				}
			});
		}

		async #copyToClipboard(link)
		{
			await Application.copyToClipboard(withCurrentDomain(link), true);

			showSafeToast({
				message: Loc.getMessage('M_INTRANET_RESULTS_YEAR_FEATURE_SLIDER_LINK_COPIED_NOTIFICATION'),
			}, this.#parentWidget);
		}

		async #showSharingDialog()
		{
			const path = await this.rootViewRef.takeSnapshot();

			return dialogs.showSharingDialog({ uri: path }, this.#parentWidget);
		}
	}

	module.exports = {
		FeatureSlider,
	};
});

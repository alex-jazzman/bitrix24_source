/**
 * @module settings-v2/ui/items/src/cache-info
 */

jn.define('settings-v2/ui/items/src/cache-info', (require, exports, module) => {
	const { SettingSelector, SettingMode } = require('ui-system/blocks/setting-selector');
	const { createTestIdGenerator } = require('utils/test');
	const { EventType, NativeSettingsId } = require('settings-v2/const');
	const { formatFileSize } = require('utils/file');
	const { NativeCacheService } = require('settings-v2/services/native');
	const { Color } = require('tokens');

	class CacheInfoItem extends LayoutComponent
	{
		constructor(props)
		{
			super(props);

			this.getTestId = createTestIdGenerator({
				testId: props.testId || 'settings-info-item',
				context: this,
			});

			this.state = {
				value: props.value,
			};
		}

		getText()
		{
			const { modeText } = this.props;
			if (modeText)
			{
				return modeText;
			}
			const GB_SIZE = 1024 * 1024 * 1024;
			const precision = this.state.value > GB_SIZE ? 2 : 0;

			return formatFileSize(this.state.value, precision);
		}

		componentDidMount()
		{
			BX.addCustomEvent(EventType.changeCacheSize, this.changeInfoText);
			this.changeInfoText();
		}

		componentWillUnmount()
		{
			BX.removeCustomEvent(EventType.changeCacheSize, this.changeInfoText);
		}

		changeInfoText = (text) => {
			const { controller } = this.props;

			controller?.get()
				.then((value) => {
					// todo hack to exclude media size from file cache size
					if (controller.settingId === NativeSettingsId.CACHE_FILES)
					{
						NativeCacheService.getSettingValueById(NativeSettingsId.CACHE_MEDIA).then(
							(mediaSize) => {
								value -= mediaSize;
								this.setState({
									value,
								});
							},
						);

						return;
					}

					this.setState({
						value,
					});
				}).catch((e) => {
					console.error(e);
				})
			;
		};

		render()
		{
			const { id, modeColor = Color.base4 } = this.props;

			return SettingSelector({
				...this.props,
				testId: this.getTestId(id),
				mode: SettingMode.PARAMETER,
				modeParams: {
					chevron: false,
					text: this.getText(),
					color: modeColor,
				},
			});
		}
	}

	module.exports = {
		CacheInfoItem,
	};
});

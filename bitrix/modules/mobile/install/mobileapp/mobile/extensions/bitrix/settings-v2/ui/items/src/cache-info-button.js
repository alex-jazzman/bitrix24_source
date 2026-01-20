/**
 * @module settings-v2/ui/items/src/cache-info-button
 */
jn.define('settings-v2/ui/items/src/cache-info-button', (require, exports, module) => {
	const { Button, ButtonDesign, ButtonSize } = require('ui-system/form/buttons');
	const { Color } = require('tokens');
	const { createTestIdGenerator } = require('utils/test');
	const { NativeCacheService } = require('settings-v2/services/native');
	const { formatFileSize } = require('utils/file');
	const { EventType, NativeSettingsId } = require('settings-v2/const');
	const { SettingEmitter } = require('settings-v2/emitter');
	const { showToast } = require('toast');
	const { Loc } = require('loc');
	const { Icon } = require('assets/icons');

	class CacheInfoButtonItem extends LayoutComponent
	{
		constructor(props)
		{
			super(props);

			this.getTestId = createTestIdGenerator({
				prefix: 'settings-cache-info-button-item',
				context: this,
			});
		}

		componentDidMount()
		{
			BX.addCustomEvent(EventType.changeCacheSize, this.onChangeCacheSize);

			this.loadCacheSize();
		}

		componentWillUnmount()
		{
			BX.removeCustomEvent(EventType.changeCacheSize, this.onChangeCacheSize);
		}

		onChangeCacheSize = () => {
			this.loadCacheSize();
		};

		loadCacheSize = async () => {
			const fileSize = await NativeCacheService.getSettingValueById(NativeSettingsId.CACHE_FILES);
			this.setState({
				fileSize,
			});
		};

		render()
		{
			const { fileSize } = this.state;
			const totalSize = fileSize;
			const GB_SIZE = 1024 * 1024 * 1024;
			const precision = totalSize > GB_SIZE ? 2 : 0;
			const cacheSizeText = formatFileSize(totalSize, precision);

			return Button({
				testId: this.getTestId(),
				design: ButtonDesign.OUTLINE_ACCENT_1,
				size: ButtonSize.MEDIUM,
				color: Color.base1,
				stretched: true,
				text: Loc.getMessage('SETTINGS_V2_STRUCTURE_MEMORY_CACHE_CLEAR_BUTTON', {
					'#CACHE_SIZE#': cacheSizeText,
				}),
				onClick: this.onClick,
			});
		}

		onClick = async () => {
			await NativeCacheService.clearFiles();
			SettingEmitter.emit(EventType.changeCacheSize);
			showToast({
				icon: Icon.CHECK,
				message: Loc.getMessage('SETTINGS_V2_STRUCTURE_MEMORY_CACHE_CLEAR_TOAST_MESSAGE'),
			});
			this.loadCacheSize();
		};
	}

	module.exports = {
		CacheInfoButtonItem,
	};
});

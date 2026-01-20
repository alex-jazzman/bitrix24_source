<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Main\Localization\Loc;
use Bitrix\Main\UI\Extension;
use Bitrix\Main\Web;

$this->setFrameMode(true);

if (isset($arResult['config']['notify']) && !empty($arResult['config']['notify']))
{
	Extension::load(['intranet.license-notify', 'ui.banner-dispatcher']);
	?>
	<script>
		BX.ready(() => {
			BX.message(<?= Web\Json::encode(Loc::loadLanguageFile(__FILE__)) ?>);
			const manager = new BX.Intranet.LicenseNotify(<?= \CUtil::PhpToJSObject($arResult['config']) ?>);
			manager.getProvider().show();
		});
	</script>
	<?php
}
if (isset($arResult['annualSummary'])):
	Extension::load(['ui.banner-dispatcher', 'intranet.notify-banner.annual-summary']);
?>
	<script>
		const features = <?= Web\Json::encode($arResult['annualSummary']['features'])?>;
		const options = <?= Web\Json::encode($arResult['annualSummary']['options'])?>;
		const annualSummary = new BX.Intranet.NotifyBanner.AnnualSummary(features, options);
		BX.UI.BannerDispatcher.high.toQueue(async (onDone) => {
			annualSummary.subscribe('onClose', onDone);
			annualSummary.subscribe('onShow', () => BX.userOptions.save('intranet', 'annual_summary_25_last_show', null, Math.floor(Date.now() / 1000)));
			annualSummary.show();
		});
	</script>
<?php endif; ?>

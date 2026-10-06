<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die;
}

use Bitrix\Crm\Integration\Rest\EInvoiceApp\InstallerSlider;
use Bitrix\Main\UI\Extension;
use Bitrix\Main\Web\Json;

Extension::load([
	'crm.einvoice.promo',
	'ui.banner-dispatcher',
]);

/** @var array $arParams */
$options = $arParams['OPTIONS'];
$showCountNext = (int)$options['numberOfViews'] + 1;
$showTimeNext = strtotime('+1 days');

$sliderJs = (new InstallerSlider())->buildSlider() ?? '';
?>
<script>
BX.ready(function() {
	const promo = new BX.Crm.EInvoice.Promo({
		analytics: <?= Json::encode($options['analytics'] ?? []) ?>,
		events: {
			onPrimaryClick: () => {
				<?= $sliderJs ?>
				promo.hide();
			},
			onRemindLater: () => promo.hide(),
		},
	});

	promo.subscribe('onAfterHide', () => {
		BX.userOptions.save(
			'<?= $options['optionCategory'] ?>',
			'<?= $options['optionNameShowTime'] ?>',
			null,
			<?= $showTimeNext ?>,
		);
		BX.userOptions.save(
			'<?= $options['optionCategory'] ?>',
			'<?= $options['optionNameShowCount'] ?>',
			null,
			<?= $showCountNext ?>,
		);
	});

	BX.UI.BannerDispatcher.high.toQueue((onDone) => {
		promo.subscribe('onAfterHide', () => onDone());
		promo.show();
	});
});
</script>

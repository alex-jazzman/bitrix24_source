<?php
/** @var array $arResult */

use Bitrix\Main\UI\Extension;
use Bitrix\Main\Web\Json;
use Bitrix\Intranet\License;

if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

Extension::load(['intranet.license-widget']);
$frame = $this->createFrame()->begin();
$mainButton = new License\Widget\Content\MainButton();
?>

<span data-id="licenseWidgetWrapper">
	<button class="<?= $mainButton->getClassName() ?>">
		<span class="license-btn-icon"></span>
		<span class="license-btn-counter"></span>
		<span class="license-btn-name"><?= $mainButton->getText() ?></span>
	</button>
</span>

<script>
	BX.ready(() => {
		const buttonWrapper = document.querySelector("[data-id='licenseWidgetWrapper']");
		const data = <?= Json::encode($arResult['CONTENT']) ?>;
		new BX.Intranet.LicenseWidget({
			buttonWrapper: buttonWrapper,
			action: 'intranet.license.widget.getDynamicContent',
			...data,
		});
	});
</script>

<?php
$frame->beginStub();
?>

<span data-id="licenseWidgetWrapper">
	<button class="<?= $mainButton->getClassName() ?>">
		<span class="license-btn-icon"></span>
		<span class="license-btn-counter"></span>
		<span class="license-btn-name"><?= $mainButton->getText() ?></span>
	</button>
</span>

<?php
$frame->end();
?>
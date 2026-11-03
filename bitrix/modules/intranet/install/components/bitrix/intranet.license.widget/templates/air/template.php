<?php
/** @var array $arResult */

use Bitrix\Main\UI\Extension;
use Bitrix\Intranet\License;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\Web\Json;

if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

Extension::load(['intranet.widget-loader', 'ui.a11y']);

$mainButton = new License\Widget\Content\MainButton();
$mainButtonText = $mainButton->getText();
?>

<div class="air-header__button" data-id="licenseWidgetWrapper">
	<button
		class="air-header-button"
		type="button"
		aria-label="<?= htmlspecialcharsbx(Loc::getMessage('INTRANET_LICENSE_WIDGET_TRIGGER_LABEL', [
			'#TARIFF#' => $mainButtonText,
		])) ?>"
		aria-haspopup="dialog"
		aria-expanded="false"
		aria-controls="bx-license-header-popup"
	>
		<i class="ui-icon-set --o-tariff-scaner air-header-button__icon" aria-hidden="true"></i>
		<span class="air-header-button__text"><?= htmlspecialcharsbx($mainButtonText) ?></span>
		<span class="air-header-button__counter" aria-hidden="true"></span>
	</button>
</div>

<?php
$frame = $this->createFrame()->begin('');
?>
<script>
	BX.ready(() => {
		BX.Intranet.Bitrix24.LicenseButton.init({
			messages: <?= Json::encode(Loc::loadLanguageFile(__FILE__)) ?>,
			isAdmin: true,
			isCloud: false,
			skeleton: <?= Json::encode($arResult['skeleton']) ?>,
		});
	});
</script>

<?php
$frame->end();

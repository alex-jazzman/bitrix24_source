<?php
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true) die;

use Bitrix\Main\Localization\Loc;
use Bitrix\Main\Web\Json;

/**
 * @var $arResult array
 * @var $arParams array
 */

\Bitrix\Main\UI\Extension::load([
	'ui.system.typography',
	'ui.alerts',
]);

$codes = array_filter($arResult['CODES'] ?? [], fn ($code) => $code['USED'] === 'N');
$codes = array_values($codes);

?>

<li id="recovery-code-container" class="intranet-user-otp-list__section-row"></li>

<script>
	BX.ready(() => {
		BX.message(<?= Json::encode(Loc::loadLanguageFile(__FILE__)) ?>);
		(new BX.Intranet.Security.RecoveryCodes({
			codes: <?= Json::encode($codes) ?>,
			downloadLink: '<?= \CUtil::JSEscape($arParams["PATH_TO_CODES"] . "?codesAction=download&ncc=1") ?>',
		})).renderTo(BX('recovery-code-container'));
	});
</script>

<?php
declare(strict_types=1);

use Bitrix\Main\Localization\Loc;
use Bitrix\Main\UI\Extension;
use Bitrix\Main\Web\Json;

if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

/**
 * Bitrix vars
 *
 * @var array $arResult
 */

Extension::load([
	'ui.buttons',
]);

if (!empty($arResult['APP']['SUPPORT'])): ?>
	<div class="market-detail__support-block">
		<div class="market-detail__support-title"><?= htmlspecialcharsbx(Loc::getMessage('MARKET_DETAIL_ERROR_OPEN_APP')) ?></div>
		<div class="market-detail__support-content"><?=(new CBXSanitizer())->sanitizeHtml($arResult['APP']['SUPPORT']) ?></div>

	</div>
<?php else: ?>
	<div class="market-detail__error-block">
		<img class="market-detail__image" src="/bitrix/js/market/images/no-apps.svg" alt="">
		<div class="market-detail__error-title"><?= htmlspecialcharsbx(Loc::getMessage('MARKET_DETAIL_APP_NOT_FOUND')) ?></div>
		<div class="market-detail__error-description"><?= htmlspecialcharsbx(Loc::getMessage('MARKET_DETAIL_FIND_ALTERNATIVE')) ?></div>
		<div class="market-catalog__elements_no-updates-button">
			<button class="ui-btn --air --style-outline-accent-2" id="market-detail-go-to-catalog"><?= htmlspecialcharsbx(Loc::getMessage('MARKET_DETAIL_GO_TO_CATALOG')) ?></button>
		</div>
	</div>
<?php endif ?>

<script>
	BX.ready(function() {
		top.console.warn(<?=Json::encode($arResult['EXCEPTION']->getMessage())?>);
	})
</script>
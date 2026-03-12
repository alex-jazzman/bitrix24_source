<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

\Bitrix\Main\UI\Extension::load('ui.sidepanel-content');

/**
 * @var array $arResult
 */

?>

<div class="ui-slider-no-access" style="height: 100vh;background: var(--ui-color-bg-content-tertiary, #eef2f4);">
	<div class="ui-slider-no-access-inner">
		<div class="ui-slider-no-access-title"><?= htmlspecialcharsbx($arResult['ERROR_TITLE']) ?></div>
		<div class="ui-slider-no-access-subtitle"><?= htmlspecialcharsbx($arResult['ERROR_SUBTITLE']) ?></div>
		<div class="ui-slider-no-access-img">
			<div class="ui-slider-no-access-img-inner"></div>
		</div>
	</div>
</div>
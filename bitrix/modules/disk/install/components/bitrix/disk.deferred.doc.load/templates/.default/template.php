<?php

declare(strict_types=1);


if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Main\UI\Extension;

/** @var array $arParams */
/** @var array $arResult */
/** @global CMain $APPLICATION */
/** @var CBitrixComponent $component */
/** @var CBitrixComponentTemplate $this */

Extension::load([
	$arResult['extension'],
]);

?>
<script>
	BX.ready(() => {
		BX.loadCSS(<?= $arResult['css'] ?>);
		BX.Disk.DeferredDocLoad.render('#deferred-doc-load-container');
	});
</script>

<div id="deferred-doc-load-container"></div>
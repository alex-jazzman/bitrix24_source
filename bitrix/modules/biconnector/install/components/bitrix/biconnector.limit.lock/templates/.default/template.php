<?php
/**
 * @var array $arResult
 */

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

\Bitrix\Main\UI\Extension::load([
	'biconnector.lock-popup',
]);

$buttons = [];
if ($arResult['IS_LICENCE_LIMIT'] === 'Y')
{
	$buttons = [
		[
			'text' => $arResult['LICENSE_BUTTON_TEXT'],
			'url' => $arResult['LICENSE_URL'],
			'style' => 'filled',
			'closesPopup' => false,
		],
		[
			'text' => $arResult['LATER_BUTTON_TEXT'],
			'style' => 'plain',
		],
	];
}

$popupParams = [
	'title' => $arResult['TITLE'],
	'content' => $arResult['CONTENT'],
	'buttons' => $buttons,
	'closeSidePanelOnClose' => $arResult['FULL_LOCK'] === 'Y',
	'emitOnClose' => (
		$arResult['FULL_LOCK'] === 'Y'
			? 'BiConnector:LimitPopup.Lock.onClose'
			: 'BiConnector:LimitPopup.Warning.onClose'
	),
];

?>
<script>
	BX.ready(() => {
		BX.BIConnector.LockPopup.show(<?= \CUtil::PhpToJSObject($popupParams) ?>);
	});
</script>

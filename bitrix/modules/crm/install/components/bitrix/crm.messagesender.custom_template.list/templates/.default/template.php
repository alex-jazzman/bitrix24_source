<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

/** @var array $arResult */
/** @var CMain $APPLICATION */
global $APPLICATION;

\Bitrix\Main\UI\Extension::load([
	'crm.messagesender.custom-template.list',
]);

$APPLICATION->IncludeComponent(
	'bitrix:messageservice.custom-template.list',
	'',
	[
		'ZONE' => $arResult['ZONE'],
		'SCENE' => $arResult['SCENE'],
		'TARGET_ID' => $arResult['TARGET_ID'],
	],
);
?>
<script>
	BX.ready(() => {
		BX.Crm.MessageSender.CustomTemplate.List.init();
	});
</script>
<?php

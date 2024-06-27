<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}
/** @var array $arResult */

\Bitrix\Main\UI\Extension::load("crm.perms.edit");

?>

<div id="crm-config-perms-role-edit-v2"></div>

<script>
	BX.ready(function() {

		const appData = <?=CUtil::PhpToJSObject($arResult['APP_DATA'])?>

		const permissionEditApp = (new BX.Crm.Perms.EditApp({containerId: 'crm-config-perms-role-edit-v2'}));
		permissionEditApp.start(appData);
	});
</script>

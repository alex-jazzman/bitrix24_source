<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Intranet\Integration\Templates\Air\ChatMenu;
use Bitrix\Main\Web\Json;

\Bitrix\Main\UI\Extension::load([
	'ls',
	'ui.design-tokens',
	'im.v2.application.messenger',
	'im.v2.application.launch',
]);

$dialogId = $arResult['DIALOG_ID'] ?? '';
$isWelcome = $arResult['IS_GUEST_WELCOME'] ?? false;

$messengerApplication = \Bitrix\Im\V2\Service\Locator::getMessenger()->getApplication();
$configJson = Json::encode($messengerApplication->getConfig());
?>
<div id="messenger-guest-application"></div>
<script>
BX.ready(function() {
	var config = <?= $configJson ?>;
	config.dialogId = '<?= CUtil::JSEscape($dialogId) ?>';
	config.isGuestWelcome = <?= $isWelcome ? 'true' : 'false' ?>;
	BX.Messenger.v2.Application.Launch('messenger', config)
		.then(function(application) {
			application.initComponent('#messenger-guest-application');
		})
	;
});
</script>
<?php
$this->setViewTarget('above_pagetitle', 100);

if (\Bitrix\Main\Loader::includeModule('intranet'))
{
	$APPLICATION->includeComponent(
		'bitrix:main.interface.buttons',
		'',
		[
			'ID' => 'chat-menu',
			'ITEMS' => ChatMenu::getMenuItems(),
			'THEME' => 'air',
		]
	);
}

$this->endViewTarget();

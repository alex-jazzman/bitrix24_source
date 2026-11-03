<?php

use Bitrix\Main\UI\Extension;
use Bitrix\Main\Web\Json;
use Bitrix\UI\Toolbar\Facade\Toolbar;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

/** @var \CMain $APPLICATION */
/** @var array $arResult */

Extension::load([
	'ui.design-tokens',
	'ui.design-tokens.air',
	'sidepanel',
	'ui.forms',
	'ui.buttons',
	'mail.client.vacation-auto-reply',
]);

if (isset($_REQUEST['IFRAME']) && $_REQUEST['IFRAME'] === 'Y')
{
	Toolbar::deleteFavoriteStar();
}

$bodyClass = (string)$APPLICATION->getPageProperty('BodyClass', false);
$screenBodyClass = 'pagetitle-toolbar-field-view pagetitle-mail-view no-background';
$APPLICATION->setPageProperty('BodyClass', trim($bodyClass . ' ' . $screenBodyClass));
?>
<div class="mail-vacation-auto-reply" data-testid="mail-vacation-auto-reply">
	<div
		id="<?= htmlspecialcharsbx($arResult['SCREEN_PARAMS']['containerId']) ?>"
		class="mail-vacation-auto-reply__form"
		data-testid="mail-vacation-auto-reply-form"
	></div>
	<div
		class="mail-vacation-auto-reply__editor"
		data-role="mail-vacation-auto-reply-editor"
		data-testid="mail-vacation-auto-reply-editor"
	>
		<?php
		if ((int)($arResult['SCREEN_PARAMS']['mailboxId'] ?? 0) > 0)
		{
			$editor = new CHTMLEditor();
			$editor->show($arResult['EDITOR_CONFIG']);
		}
		?>
	</div>
</div>

<script>
	BX.ready(function() {
		BX.Mail.Client.VacationAutoReply.Screen.init(<?= Json::encode($arResult['SCREEN_PARAMS']) ?>);
	});
</script>

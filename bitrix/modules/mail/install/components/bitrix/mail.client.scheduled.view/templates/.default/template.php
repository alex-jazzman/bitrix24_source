<?php

use Bitrix\Main\Web\Json;
use Bitrix\Main\Web\Uri;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

/** @var array $arParams */
/** @var array $arResult */

// Both transitions of the screen are routes of the mail client, and the router of the parent screen owns their
// templates: outside SEF mode they read as '?page=...', and the SEF folder can be moved.
$editPath = new Uri(\CComponentEngine::makePathFromTemplate(
	(string)($arParams['~PATH_TO_MAIL_MSG_NEW'] ?? $arParams['PATH_TO_MAIL_MSG_NEW'] ?? ''),
));
$editPath->addParams([
	'id' => (int)$arResult['MAILBOX_ID'],
	'scheduledId' => (int)$arResult['SCHEDULED_ID'],
]);
$draftsPath = \CComponentEngine::makePathFromTemplate(
	(string)($arParams['~PATH_TO_MAIL_DRAFTS'] ?? $arParams['PATH_TO_MAIL_DRAFTS'] ?? ''),
);

\Bitrix\Main\UI\Extension::load('mail.client.scheduled-view');
?>
<div id="mail-scheduled-view-root"></div>
<script>
	BX.Runtime.loadExtension('mail.client.scheduled-view').then(function(extension)
	{
		new extension.ScheduledViewApplication({
			containerId: 'mail-scheduled-view-root',
			messageId: <?= (int)$arResult['SCHEDULED_ID'] ?>,
			mailboxId: <?= (int)$arResult['MAILBOX_ID'] ?>,
			editPath: <?= Json::encode($editPath->getUri()) ?>,
			editWidth: <?= \Bitrix\Mail\Helper\Config\Feature::getMessageSliderWidth() ?>,
			draftsPath: <?= Json::encode($draftsPath) ?>,
		}).start();
	}).catch(function()
	{
		// The own slider of the screen and no other: the one on top may belong to somebody else by now.
		BX.SidePanel.Instance.getSliderByWindow(window)?.close();
	});
</script>

<?php

use Bitrix\MessageService\Public\UI\MessageEditor\Context;
use Bitrix\MessageService\Public\UI\MessageEditor\NotificationTemplate;
use Bitrix\MessageService\Public\UI\MessageEditor\NotificationTemplate\Placeholder;

if(!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

\Bitrix\Main\UI\Extension::load([
	"ui.buttons",
	"ui.buttons.icons",
	'crm.messagesender.editor',
]);
\CJSCore::init(["loader", "popup", "sidepanel"]);
$this->IncludeLangFile();


$entityTypeId = $arResult['ownerTypeId'];
$entityId = $arResult['ownerId'];
if (!\Bitrix\Main\Loader::includeModule('messageservice'))
{
	ShowError('Module messageservice is not installed');
	return;
}

$resolvedScene = \Bitrix\Crm\MessageSender\UI\Factory::getInstance()->getScene($arResult['messageSenderSceneId']);
$scene = $resolvedScene ?? new \Bitrix\MessageService\Public\UI\MessageEditor\Scene\NullScene();
$editor = \Bitrix\Crm\MessageSender\UI\Factory::getInstance()->createEditor(
	$scene,
	new Context(customData: [
		'entityTypeId' => $entityTypeId,
		'entityId' => $entityId,
	]),
);
$editor
	->setRenderTo('#' . \CUtil::JSEscape($arResult['containerId']))
	->setDynamicLoad(false)
	->setMessageText($arResult['text'])
	->setAnalytics($arResult['analytics']);

// Only the document scene exposes the template selector, and it hides the in-selector
// "create" CTA: pre-filling a literal document link into a template body would be
// meaningless, so document templates are authored only from the templates list page.
if (
	$resolvedScene instanceof \Bitrix\Crm\MessageSender\UI\Editor\Scene\DocumentView
	&& \Bitrix\Crm\MessageSender\CustomTemplate\CrmZone::isSupportedByMessageService()
)
{
	$editor->getLayout()
		->setCustomTemplateSelectorShown(true)
		->setCustomTemplateCreateInSelectorShown(false)
	;
}

if (isset($arResult['templateCode']))
{
	$notificationTemplate = new NotificationTemplate($arResult['templateCode']);

	foreach ($arResult['templatePlaceholders'] as $placeholder)
	{
		$notificationTemplate->setPlaceholder(
			(new Placeholder($placeholder['name']))
				->setValue($placeholder['value']),
		);
	}

	$editor->setNotificationTemplates([$notificationTemplate]);
}

?>
<div id='<?=\CUtil::JSEscape($arResult['containerId']);?>'></div>
<script>
	BX.ready(() => {
		const editor = new BX.Crm.MessageSender.Editor.Editor(<?= \Bitrix\Main\Web\Json::encode($editor) ?>);
		editor.render();

		const slider = top.BX && top.BX.SidePanel && top.BX.SidePanel.Instance.getSliderByWindow(window);
		if(slider)
		{
			BX.Event.EventEmitter.subscribe('BX.Crm.MessageSender.Editor:onCancel', () => slider.close());
			BX.Event.EventEmitter.subscribe('BX.Crm.MessageSender.Editor:onSendSuccess', () => slider.close())
		}
	});
</script>

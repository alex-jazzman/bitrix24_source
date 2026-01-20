<?php

if(!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Main\UI\Extension;
use Bitrix\Main\UI\FileInputUtility;
use Bitrix\Main\Web\Json;

/**
 * @var $arResult array
 * @var $component FileUfComponent
 */

Extension::load(
	[
		'main.core',
		'ui.vue3',
		'ui.uploader.tile-widget',
	]
);

$postfix = $this->randString();
if ($component->isAjaxRequest())
{
	$postfix .= time();
}

if (isset($arResult['value']) && is_array($arResult['value']))
{
	$arResult['value'] = array_filter(
		$arResult['value'],
		fn($key) => ($arResult['value'][$key] > 0),
		ARRAY_FILTER_USE_KEY
	);
}
$fileIds = $arResult['value'] ?? [];
$fileIds = array_values(array_map('intval', $fileIds));

$fileUploaderSession = \Bitrix\Main\UserField\File\UploadSession::getInstance();

foreach ($fileIds as $fileId)
{
	if ($fileId > 0)
	{
		$fileUploaderSession->registerFile(
			$fileId,
			[
				'FIELD_ID' => $arResult['userField']['ID'] ?? 0,
				'ENTITY_VALUE_ID' => $arResult['userField']['ENTITY_VALUE_ID'] ?? 0,
			]
		);
	}
}

$uploaderContextGenerator = (new \Bitrix\Main\UserField\File\UploaderContextGenerator($arResult['userField']));

$controlId = $uploaderContextGenerator->getControlId();
$containerId = 'field-item-' . $controlId . '-' . $postfix;

$context = $uploaderContextGenerator->getContextInEditMode($fileUploaderSession);

?>

<span class='field-wrap'>
	<span id="<?=$containerId?>" class='field-item'>
	</span>
</span>

<script>
	BX.ready(() => {
		new BX.Main.Field.File.App(<?= Json::encode([
			'fieldName' => $arResult['userField']['FIELD_NAME'],
			'controlId' => $controlId,
			'containerId' => $containerId,
			'context'=> $context,
			'value'=> $fileIds,
		]) ?>);
	});
</script>

<?php

use Bitrix\Main\Config\Option;

require($_SERVER["DOCUMENT_ROOT"] . '/bitrix/header.php');

global $APPLICATION;

if (!\Bitrix\Main\Loader::includeModule('bizproc'))
{
	ShowError('bizproc module is not installed');

	return null;
}

if (Option::get('bizproc', 'designer_v2', 'N') !== 'Y')
{
	ShowError('Access denied');

	return null;
}

if (!\Bitrix\Main\Loader::includeModule('bizprocdesigner'))
{
	ShowError('bizprocdesigner module is not installed');

	return null;
}

$request = \Bitrix\Main\Application::getInstance()->getContext()->getRequest();

$componentParams = [
	'SET_TITLE' => 'Y',
	'ID' => (int)$request->get('ID'),
	'START_TRIGGER' => (string)$request->get('START_TRIGGER'),
];

if ($request->get('DOCUMENT_TYPE') && is_string($request->get('DOCUMENT_TYPE')))
{
	$complexDocumentType = \CBPDocument::unSignDocumentType($request->get('DOCUMENT_TYPE'));
	if ($complexDocumentType)
	{
		[$moduleId, $entity, $documentType] = $complexDocumentType;

		$componentParams['MODULE_ID'] = $moduleId;
		$componentParams['ENTITY'] = $entity;
		$componentParams['DOCUMENT_TYPE'] = $documentType;
	}
}

$APPLICATION->restartBuffer();

?>
<!DOCTYPE html>
<html lang="<?=LANGUAGE_ID?>">
<head>
	<?php $APPLICATION->showHead() ?>
	<title><?php $APPLICATION->showTitle() ?></title>
</head>
<body>
<?php

$APPLICATION->IncludeComponent(
	'bitrix:bizprocdesigner.editor',
	'',
	$componentParams
);
?>
</body>
</html>
<?php

require($_SERVER['DOCUMENT_ROOT'].'/bitrix/modules/main/include/epilog_after.php');

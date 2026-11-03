<?php
/**
 * Bitrix vars
 * @var array $arParams
 * @var array $arResult
 * @var CMain $APPLICATION
 * @var CUser $USER
 * @var CDatabase $DB
 * @var CBitrixComponentTemplate $this
 * @var string $templateName
 * @var string $templateFile
 * @var string $templateFolder
 * @var string $componentPath
 * @var CBitrixComponent $component
 */

use Bitrix\Main\Localization\Loc;
use Bitrix\Main\UI\Extension;
use Bitrix\Main\Web\Json;
use Bitrix\UI\Buttons;
use Bitrix\UI\Toolbar\ButtonLocation;
use Bitrix\UI\Toolbar\Facade\Toolbar;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

CModule::includeModule('biconnector');

if (!empty($arResult['ERROR_MESSAGES']))
{
	$APPLICATION->IncludeComponent(
		'bitrix:ui.info.error',
		'',
		[
			'TITLE' => $arResult['ERROR_MESSAGES'][0],
			'DESCRIPTION' => $arResult['ERROR_DESCRIPTIONS'][0] ?? null,
		]
	);

	return;
}

CJSCore::init(['translit']);

$APPLICATION->SetPageProperty('BodyClass', 'biconnector-dataset-import-v2-page');

Extension::load([
	'ui.design-tokens',
	'ui.icon-set.outline',
	'ui.icon-set.actions',
	'ui.hint',
	'ui.notification',
	'biconnector.file-export',
	'biconnector.dataset-import-v2',
]);

Toolbar::deleteFavoriteStar();

$isSystem = ($arParams['sourceId'] === 'system');
$datasetProperties = $arResult['initialData']['config']['datasetProperties'] ?? [];
$canEdit = (bool)($datasetProperties['canEdit'] ?? true);
$canExport = (bool)($datasetProperties['canExport'] ?? true);
$saveButtonText = Loc::getMessage('DATASET_IMPORT_V2_SAVE_BUTTON_CREATE');

$getReadonlyChip = static fn(string $text, string $hint): string =>
	'<span class="biconnector-dataset-import-v2-readonly-chip">'
	. '<span class="biconnector-dataset-import-v2-readonly-chip__text">' . htmlspecialcharsbx($text) . '</span>'
	. '<span data-hint="' . htmlspecialcharsbx($hint) . '" data-hint-outline></span>'
	. '</span>'
;

if ($isSystem)
{
	$systemName = (string)($arResult['initialData']['config']['datasetProperties']['name'] ?? '');
	$systemDisplayName = (string)($arResult['initialData']['config']['datasetProperties']['displayName'] ?? '');
	$systemTitle = $systemName;
	if ($systemDisplayName !== '' && $systemDisplayName !== $systemName)
	{
		$systemTitle = $systemDisplayName . ' (' . $systemName . ')';
	}
	$APPLICATION->SetTitle($systemTitle !== '' ? $systemTitle : Loc::getMessage('DATASET_IMPORT_TITLE_MSGVER_1'));

	Toolbar::addAfterTitleHtml($getReadonlyChip(
		(string)Loc::getMessage('DATASET_IMPORT_V2_SYSTEM_READONLY_CHIP'),
		(string)Loc::getMessage('DATASET_IMPORT_V2_SYSTEM_READONLY_HINT'),
	));
}
elseif ($arParams['datasetId'])
{
	$APPLICATION->SetTitle(Loc::getMessage('DATASET_IMPORT_EDIT_TITLE_MSGVER_1'));
	$saveButtonText = Loc::getMessage('DATASET_IMPORT_V2_SAVE_BUTTON_EDIT');

	if (!$canEdit)
	{
		Toolbar::addAfterTitleHtml($getReadonlyChip(
			(string)Loc::getMessage('DATASET_IMPORT_V2_TABLE_READONLY_CHIP'),
			(string)Loc::getMessage('DATASET_IMPORT_V2_TABLE_READONLY_HINT'),
		));
	}
}
else
{
	$APPLICATION->SetTitle(Loc::getMessage('DATASET_IMPORT_TITLE_MSGVER_1'));
}

if ($arParams['sourceId'] === 'csv' && $arParams['datasetId'] > 0 && $canExport)
{
	Toolbar::addButton(
		new Buttons\Button([
			'color' => Buttons\Color::LIGHT_BORDER,
			'size' => Buttons\Size::MEDIUM,
			'text' => Loc::getMessage('DATASET_IMPORT_V2_EXPORT_FILE'),
			'classList' => ['biconnector-dataset-import-v2-export-file-btn'],
			'click' => new Buttons\JsCode(
				"BX.Event.EventEmitter.emit('biconnector:dataset-import-v2:export-file');"
			),
		]),
		ButtonLocation::AFTER_TITLE
	);
}

if (!$isSystem && $canEdit)
{
	Toolbar::addButton(
		new Buttons\Button([
			'color' => Buttons\Color::PRIMARY,
			'style' => Buttons\AirButtonStyle::FILLED,
			'size' => Buttons\Size::MEDIUM,
			'text' => $saveButtonText,
			'disabled' => !$arParams['datasetId'],
			'classList' => ['biconnector-dataset-import-v2-save-btn'],
			'click' => new Buttons\JsCode(
				"BX.Event.EventEmitter.emit('biconnector:dataset-import-v2:save');"
			),
		]),
		ButtonLocation::RIGHT
	);
}
?>
<div id="biconnector-dataset-import-v2-root"></div>
<script>
	BX.ready(() => {
		const initialData = <?= Json::encode($arResult['initialData']) ?>;
		const appParams = <?= Json::encode($arResult['appParams']) ?>;
		const sourceId = <?= Json::encode($arParams['sourceId']) ?>;
		const helpdeskCode = <?= Json::encode($arResult['helpdeskCode'] ?? null) ?>;

		const app = BX.BIConnector.DatasetImportV2.AppFactory.getApp(sourceId, initialData, appParams, { helpdeskCode });
		if (app)
		{
			app.mount('#biconnector-dataset-import-v2-root');
		}
	});
</script>

<?php

use Bitrix\Main\Localization\Loc;
use Bitrix\Main\UI\Extension;
use Bitrix\Main\Web\Json;
use Bitrix\UI\Buttons\Color;
use Bitrix\UI\Buttons\CreateButton;
use Bitrix\UI\Buttons\JsCode;
use Bitrix\UI\Buttons\SettingsButton;
use Bitrix\UI\Toolbar\ButtonLocation;
use Bitrix\UI\Toolbar\Facade\Toolbar;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

Loc::loadMessages(__FILE__);
Extension::load('crm.config.locations');

foreach ($arResult['ERRORS']['FATAL'] as $error)
{
	ShowError($error);
}

if (!empty($arResult['ERRORS']['FATAL']))
{
	return;
}

foreach ($arResult['ERRORS']['NONFATAL'] as $error)
{
	ShowError($error);
}

foreach ($arResult['grid']['ROWS'] as &$row)
{
	$id = (int)($row['id'] ?? 0);
	if (!is_array($row['actions'] ?? null))
	{
		$row['actions'] = [];
	}

	foreach ($row['actions'] as &$action)
	{
		if (!empty($action['HREF']))
		{
			$url = (string)$action['HREF'];
			unset($action['HREF']);
			$action['ONCLICK'] = "BX.Event.EventEmitter.emit('BX.Crm.Config.LocationGrid:edit', { url: "
				. Json::encode($url)
				. ' });';
		}
	}
	unset($action);

	if ($id > 0)
	{
		$row['actions'][] = [
			'TITLE' => Loc::getMessage('CRM_CLL2_VIEW_SUBTREE_TITLE'),
			'TEXT' => Loc::getMessage('CRM_CLL2_VIEW_SUBTREE'),
			'ONCLICK' => "BX.Event.EventEmitter.emit('BX.Crm.Config.LocationGrid:showChildren', "
				. "{ parentId: {$id} });",
			'DEFAULT' => true,
		];
	}
}
unset($row);

Toolbar::addFilter($arResult['filter']);
Toolbar::addButton(
	CreateButton::create([
		'text' => Loc::getMessage('CRM_CLL2_ADD'),
		'color' => Color::SUCCESS,
		'onclick' => new JsCode('BX.Crm.Config.LocationGridManager.Instance.openAdd()'),
		'dataset' => ['testid' => 'crm-locations-add'],
	]),
	ButtonLocation::AFTER_TITLE,
);
Toolbar::addButton(
	new SettingsButton([
		'dataset' => ['testid' => 'crm-locations-settings'],
		'menu' => [
			'id' => 'crm-config-locations-settings-menu',
			'items' => [
				[
					'text' => Loc::getMessage('CRM_CLL2_IMPORT'),
					'onclick' => new JsCode('BX.Crm.Config.LocationGridManager.Instance.openImport()'),
					'dataset' => ['testid' => 'crm-locations-import'],
				],
			],
		],
	]),
);

$arResult['grid']['USE_CHECKBOX_LIST_FOR_SETTINGS_POPUP'] = true;

$APPLICATION->IncludeComponent(
	'bitrix:main.ui.grid',
	'',
	$arResult['grid'],
	$component,
);
?>
<script>
	BX.ready(() => {
		const gridContainer = document.getElementById(<?= Json::encode($arResult['clientConfig']['gridId']) ?>);
		if (gridContainer !== null)
		{
			gridContainer.dataset.testid = 'crm-locations-grid';
		}

		BX.Crm.Config.LocationGridManager.Instance = new BX.Crm.Config.LocationGridManager(
			<?= Json::encode($arResult['clientConfig']) ?>,
		);
		BX.Crm.Config.LocationGridManager.Instance.init();
	});
</script>

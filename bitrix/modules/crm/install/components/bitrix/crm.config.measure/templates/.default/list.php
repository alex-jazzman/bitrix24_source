<?php

use Bitrix\Main\Context;
use Bitrix\UI\Buttons\AddButton;
use Bitrix\UI\Toolbar\ButtonLocation;
use Bitrix\UI\Toolbar\Facade\Toolbar;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die;
}

global $APPLICATION;

$request = Context::getCurrent()->getRequest();
$isSuccessfulSliderSave = (
	$arResult['IS_SIDE_PANEL']
	&& $request->getQuery('SIDE_PANEL_SAVE') === 'Y'
);
if ($isSuccessfulSliderSave)
{
	?>
	<script>
		BX.ready(() => {
			if (!top.BX || !top.BX.SidePanel || !top.BX.SidePanel.Instance)
			{
				return;
			}

			const slider = top.BX.SidePanel.Instance.getSliderByWindow(window);
			if (slider)
			{
				slider.getData().set('crmMeasureSaveSucceeded', true);
				slider.close(false);
			}
		});
	</script>
	<?php
	return;
}

Toolbar::addButton(
	new AddButton([
		'link' => CComponentEngine::MakePathFromTemplate(
			$arResult['PATH_TO_MEASURE_EDIT'],
			['measure_id' => 0],
		),
		'dataset' => [
			'testid' => 'crm-measure-list-add-button',
		],
	]),
	ButtonLocation::AFTER_TITLE,
);

$listComponentParams = [
	'PATH_TO_MEASURE_LIST' => $arResult['PATH_TO_MEASURE_LIST'],
	'PATH_TO_MEASURE_EDIT' => $arResult['PATH_TO_MEASURE_EDIT'],
	'IS_SIDE_PANEL' => $arResult['IS_SIDE_PANEL'],
];

if ($arResult['IS_SIDE_PANEL'])
{
	$APPLICATION->IncludeComponent(
		'bitrix:ui.sidepanel.wrapper',
		'',
		[
			'POPUP_COMPONENT_NAME' => 'bitrix:crm.config.measure.list',
			'POPUP_COMPONENT_TEMPLATE_NAME' => '',
			'POPUP_COMPONENT_PARAMS' => $listComponentParams,
			'USE_UI_TOOLBAR' => 'Y',
			'USE_PADDING' => false,
		],
		$component,
	);
}
else
{
	$APPLICATION->IncludeComponent(
		'bitrix:crm.config.measure.list',
		'',
		$listComponentParams,
		$component,
	);
}

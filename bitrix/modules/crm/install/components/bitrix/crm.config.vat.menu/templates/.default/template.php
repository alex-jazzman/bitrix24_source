<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) die();?>

<?
	if (!empty($arResult['BUTTONS']))
	{
		if (($arParams['IS_SETTINGS_HUB'] ?? false) === true)
		{
			$buttonActions = [
				'btn-list' => 'list',
				'btn-new' => 'create',
				'btn-settings' => 'settings',
				'btn-edit' => 'edit',
				'btn-delete' => 'delete',
			];
			foreach ($arResult['BUTTONS'] as $index => $button)
			{
				$arResult['BUTTONS'][$index]['LINK_PARAM'] = ($button['LINK_PARAM'] ?? '')
					. ' data-slider-ignore-autobinding="true" target="_self"'
				;
				$action = $buttonActions[$button['ICON'] ?? ''] ?? null;
				if ($action !== null)
				{
					$arResult['BUTTONS'][$index]['LINK_PARAM'] .= ' data-testid="crm-config-vat-menu-' . $action . '-button"';
				}
			}
		}

		$APPLICATION->IncludeComponent(
			'bitrix:main.interface.toolbar',
			'',
			array(
				'BUTTONS' => $arResult['BUTTONS']
			),
			$component,
			array(
				'HIDE_ICONS' => 'Y'
			)
		);
	}
?>
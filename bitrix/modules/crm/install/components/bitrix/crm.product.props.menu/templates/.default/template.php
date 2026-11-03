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
			];
			foreach ($arResult['BUTTONS'] as $key => $button)
			{
				if (!empty($button['LINK']))
				{
					$arResult['BUTTONS'][$key]['LINK_PARAM'] = ($button['LINK_PARAM'] ?? '')
						. ' data-slider-ignore-autobinding="true" target="_self"';
					$action = $buttonActions[$button['ICON'] ?? ''] ?? null;
					if ($action !== null)
					{
						$arResult['BUTTONS'][$key]['LINK_PARAM'] .= ' data-testid="crm-product-props-menu-' . $action . '-button"';
					}
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
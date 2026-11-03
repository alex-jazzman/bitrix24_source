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
			foreach ($arResult['BUTTONS'] as &$button)
			{
				$button['LINK_PARAM'] = trim(
					($button['LINK_PARAM'] ?? '') . ' data-slider-ignore-autobinding="true" target="_self"'
				);
				$action = $buttonActions[$button['ICON'] ?? ''] ?? null;
				if ($action !== null)
				{
					$button['LINK_PARAM'] .= ' data-testid="crm-config-tax-menu-' . $action . '-button"';
				}
			}
			unset($button);
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
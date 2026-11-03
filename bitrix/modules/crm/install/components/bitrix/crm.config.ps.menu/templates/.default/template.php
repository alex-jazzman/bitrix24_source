<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) die();

if (($arParams['IS_SETTINGS_HUB'] ?? false) === true && !empty($arResult['BUTTONS']))
{
	$buttonActions = [
		'btn-list' => 'list',
		'btn-new' => 'create',
		'btn-delete' => 'delete',
	];
	foreach ($arResult['BUTTONS'] as $index => $button)
	{
		if (!empty($button['LINK']))
		{
			$arResult['BUTTONS'][$index]['LINK_PARAM'] = trim(
				($button['LINK_PARAM'] ?? '') . ' data-slider-ignore-autobinding="true" target="_self"',
			);
			$action = $buttonActions[$button['ICON'] ?? ''] ?? null;
			if ($action !== null)
			{
				$arResult['BUTTONS'][$index]['LINK_PARAM'] .= ' data-testid="crm-config-ps-menu-' . $action . '-button"';
			}
		}
	}
}

if (!empty($arResult['BUTTONS']))
{
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

<script>
	function ps_delete(title, message, btnTitle, path)
	{
		var d;
		d = new BX.CDialog({
			title: title,
			head: '',
			content: message,
			resizable: false,
			draggable: true,
			height: 70,
			width: 300
		});

		var _BTN = [
			{
				title: btnTitle,
				id: 'crmOk',
				'action': function ()
				{
					window.location.href = path;
					BX.WindowManager.Get().Close();
				}
			},
			BX.CDialog.btnCancel
		];
		d.ClearButtons();
		d.SetButtons(_BTN);
		d.Show();
	}
</script>

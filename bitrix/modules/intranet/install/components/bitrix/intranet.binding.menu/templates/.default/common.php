<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

/** @var array $arParams */
/** @var array $arResult */

use \Bitrix\Main\Localization\Loc;
use \Bitrix\Main\UI\Extension;
use \Bitrix\UI\Buttons\AirButtonStyle;
use Bitrix\UI\Buttons\Size;
use \Bitrix\UI\Buttons\Split\Button;
use \Bitrix\UI\Toolbar\Facade\Toolbar;

Loc::loadMessages(__DIR__ . '/template.php');
Extension::load(['marketplace', 'ui.fonts.opensans']);

global $APPLICATION;
$bodyClass = $APPLICATION->GetPageProperty("BodyClass");
$APPLICATION->SetPageProperty("BodyClass", ($bodyClass ? $bodyClass." " : "")."intranet-binding-menu-page");

$id = 'intranet_binding_menu_' . $arParams['SECTION_CODE'];
$frequency = $arResult['FREQUENCY_MENU_ITEM'];
$isSwitcher = in_array($this->getPageName(), ['crm_switcher', 'tasks_switcher']);

$button = new Button([
	'color' => \Bitrix\UI\Buttons\Color::LIGHT_BORDER,
	'text' => $arResult['FREQUENCY_MENU_ITEM']
		? TruncateText($arResult['FREQUENCY_MENU_ITEM']['text'], 50)
		: Loc::getMessage('INTRANET_CMP_BIND_MENU_BUTTON_NAME'),
	'className' => 'intranet-binding-menu-btn',
	'collapsedIcon' => \Bitrix\UI\Buttons\Icon::DOTS,
]);

$button->setMaxWidth('300px');
if ($frequency && isset($frequency['href']))
{
	$button->getMainButton()->setLink(htmlspecialcharsbx($frequency['href']));
}

if (!$frequency)
{
	$button->getMainButton()->addDataAttribute('slider-ignore-autobinding', 'true');
}

if (isset($frequency['onclick']))
{
	$button->getMainButton()->bindEvent('click', htmlspecialcharsbx($frequency['onclick']) . '; return false;');
}

if (defined('AIR_SITE_TEMPLATE'))
{
	$button->setAirDesign();
	$button->setNoCaps();
	$button->setStyle(AirButtonStyle::OUTLINE);
	$button->setSize(Size::SMALL);
}
else
{
	$button->addClass('ui-btn-themes');
	if ($isSwitcher)
	{
		$button->addClass('intranet-binding-menu-btn-round');
	}
}

$button->getMainButton()->addAttribute('id', $id . '_top');
$button->getMenuButton()->addAttribute('id', $id);

if (isset($arParams['USE_UI_TOOLBAR']) && $arParams['USE_UI_TOOLBAR'] === 'Y')
{
	Toolbar::addButton($button);
}
else
{
	echo $button->render();
}
?>
<script>
	BX.ready(function()
	{
		(new BX.Intranet.Binding.Menu(
			'<?= $id ?>',
			<?= \CUtil::phpToJSObject($arResult['ITEMS']);?>,
			{
				bindingId: '<?= \CUtil::jsEscape($arResult['BINDING_ID']);?>',
				ajaxPath: '<?= \CUtil::jsEscape($this->getComponent()->getPath());?>/ajax.php',
				frequencyItem: <?= \CUtil::phpToJSObject($frequency);?>
			}
		)).binding();
	});
</script>

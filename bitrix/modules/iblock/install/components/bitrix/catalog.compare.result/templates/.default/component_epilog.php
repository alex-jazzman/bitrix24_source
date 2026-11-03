<?if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)die();
/** @var array $templateData */
/** @var @global CMain $APPLICATION */
global $APPLICATION;
if (isset($templateData['TEMPLATE_THEME']))
	$APPLICATION->SetAdditionalCSS($templateData['TEMPLATE_THEME']);

// The ajax answer of the component prints the innards of the compare block alone, so the
// accessibility primitives are declared here, where every answer of the template goes through.
if (\Bitrix\Main\Loader::includeModule('ui'))
{
	\Bitrix\Main\UI\Extension::load(['ui.a11y']);
}

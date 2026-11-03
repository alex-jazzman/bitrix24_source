<?if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)die();
/** @var array $templateData */
/** @var @global CMain $APPLICATION */

CJSCore::Init(array('fx', 'popup', 'ui.fonts.opensans'));

// The component caches its result whole, so the body of the template is not executed on a cache
// hit: the accessibility primitives are declared here, where every answer goes through.
if (\Bitrix\Main\Loader::includeModule('ui'))
{
	\Bitrix\Main\UI\Extension::load(['ui.a11y']);
}
?>
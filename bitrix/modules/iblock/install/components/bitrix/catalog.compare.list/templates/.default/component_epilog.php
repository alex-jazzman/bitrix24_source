<?if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)die();
/** @var array $templateData */
/** @var @global CMain $APPLICATION */

// The body of the template lives in a composite frame, so a declaration made there would go into
// the dynamic area: the accessibility primitives are declared here, where every answer goes through.
if (\Bitrix\Main\Loader::includeModule('ui'))
{
	\Bitrix\Main\UI\Extension::load(['ui.a11y']);
}

<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED!==true)
{
	die();
}

/**
 * @global \CMain $APPLICATION
 */

global $APPLICATION;

use \Bitrix\Main\Localization\Loc;

Loc::loadMessages(__FILE__);

$strReturn = '';

// if isset main page - unlink
if (
	!empty($arResult) &&
	$arResult[0]['LINK'] == '/'
)
{
	unset($arResult[0]);
}

// insert custom main page
$arResult = array_merge(array(array(
	'LINK' => '#system_mainpage',
	'TITLE' => Loc::getMessage('LANDING_TPL_CHAIN_TPL_MAIN')
)), (array) $arResult);

$arResult = array_values($arResult);

// No query to the database here: the template runs on every public page of every site.
$mainLandingId = (int)(
	(class_exists('LandingPubComponent', false) ? \LandingPubComponent::getMainInstance() : null)['LANDING_ID'] ?? 0
);
// A page also answers the addresses below its own (catalog sections) and with a query (search):
// there its crumb leads elsewhere.
$isOwnAddress = (!class_exists(\Bitrix\Landing\Landing::class) || empty(\Bitrix\Landing\Landing::getVariables()['sef']))
	&& (!($APPLICATION instanceof \CMain) || (string)$APPLICATION->GetCurParam() === '')
;

// Whether a crumb leads to the page being shown; when in doubt, it does not.
$isCurrent = static function (string $link) use ($APPLICATION, $mainLandingId, $isOwnAddress): bool
{
	if (preg_match('/^#landing(\d+)$/', $link, $matches))
	{
		return $mainLandingId > 0 && (int)$matches[1] === $mainLandingId && $isOwnAddress;
	}

	if ($link === '' || $link[0] === '#' || !($APPLICATION instanceof \CMain))
	{
		return false;
	}

	$url = parse_url(htmlspecialcharsback($link));
	if (!is_array($url) || ($url['path'] ?? '') === '')
	{
		return false;
	}

	$withoutIndex = static fn (string $path): string => preg_replace('#/index\.php$#', '/', $path);

	// The application keeps the address of the request decoded (GetPagePath), the crumb keeps it as written.
	return $withoutIndex(urldecode($url['path'])) === $withoutIndex((string)$APPLICATION->GetCurPage(false))
		&& ($url['query'] ?? '') === (string)$APPLICATION->GetCurParam()
	;
};

$itemSize = count($arResult);

$lastOutputIndex = null;
for ($index = 0; $index < $itemSize; $index++)
{
	if ($arResult[$index]["TITLE"] && $arResult[$index]["LINK"] <> "")
	{
		$lastOutputIndex = $index;
	}
}

$strReturn .= '<nav aria-label="' . htmlspecialcharsbx(Loc::getMessage('LANDING_TPL_CHAIN_TPL_NAV_LABEL')) . '">';
$strReturn .= '<ul class="landing-breadcrumb u-list-inline">';

$outputItems = 0;

for($index = 0; $index < $itemSize; $index++)
{
	if (!$arResult[$index]["TITLE"])
	{
		continue;
	}

	$title = htmlspecialcharsex($arResult[$index]["TITLE"]);
	// $nextRef = ($index < $itemSize-2 && $arResult[$index+1]["LINK"] <> ""? ' itemref="bx_breadcrumb_'.($index+1).'"' : '');
	// $child = ($index > 0? ' itemprop="child"' : '');
	$arrow = ($index > 0? '<i class="landing-breadcrumb-arrow fa g-mx-5" aria-hidden="true"></i>' : '');

	if ($arResult[$index]["LINK"] <> "")// && $index != $itemSize-1
	{
		$outputItems++;
		$current = ($index === $lastOutputIndex && $isCurrent((string)$arResult[$index]["LINK"]))
			? ' aria-current="page"'
			: ''
		;
		$strReturn .= '
			<li class="landing-breadcrumb-item list-inline-item mr-0"
				itemprop="itemListElement" itemscope itemtype="http://schema.org/ListItem">
				'.$arrow.'
				<a class="landing-breadcrumb-link u-link-v5"
					href="'.$arResult[$index]["LINK"].'" title="'.$title.'" itemprop="url"'.$current.'>
					<span class="landing-breadcrumb-name" itemprop="name">'.$title.'</span>
				</a>
				<meta itemprop="position" content="'.($index + 1).'" />
			</li>';
	}
}

$strReturn .= '</ul></nav>';

if ($outputItems <= 1)
{
	$strReturn = '';
}

return $strReturn;

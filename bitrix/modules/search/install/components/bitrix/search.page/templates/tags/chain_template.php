<?php
//Navigation chain template
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}
/** @var array $arCHAIN */

$arChainBody = [];
foreach ($arCHAIN as $item)
{
	if (mb_strlen($item['LINK']) < mb_strlen(SITE_DIR))
	{
		continue;
	}
	if ($item['LINK'] <> '')
	{
		$arChainBody[] = '<a href="' . $item['LINK'] . '">' . htmlspecialcharsEx($item['TITLE']) . '</a>';
	}
	else
	{
		$arChainBody[] = htmlspecialcharsEx($item['TITLE']);
	}
}
return implode('&nbsp;/&nbsp;', $arChainBody);

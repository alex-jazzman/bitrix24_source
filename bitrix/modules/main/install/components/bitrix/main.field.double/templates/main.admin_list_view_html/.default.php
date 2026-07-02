<?php

if(!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) die();

/**
 * @var array $arResult
 */

if($arResult['additionalParameters']['VALUE'] <> '')
{
	print round(
		(double)$arResult['additionalParameters']['VALUE'],
		$arResult['userField']['SETTINGS']['PRECISION']
	);
}
else
{
	print '&nbsp;';
}


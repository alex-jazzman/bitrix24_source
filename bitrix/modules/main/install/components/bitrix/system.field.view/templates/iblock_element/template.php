<?php
if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)die();

/**
 * @var array $arResult
 */

$bFirst = true;

	foreach ($arResult["VALUE"] as $ID => $res):
		$surl = GetIBlockElementLinkById($ID);
		if ($surl && $surl <> '')
			$res = '<a href="'.$surl.'">'.$res.'</a>';
	
		if (!$bFirst):
			?>, <?php
		else:
			$bFirst = false;
		endif;

		?><span class="fields enumeration"><?=$res?></span><?php
	endforeach;

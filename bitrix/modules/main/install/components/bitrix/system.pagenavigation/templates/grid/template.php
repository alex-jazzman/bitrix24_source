<?php
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true) die();

/**
 * @var array $arResult
 * @var array $arParam
 * @var CBitrixComponentTemplate $this
 */

$this->setFrameMode(true);
$this->addExternalCss("/bitrix/css/main/grid/pagenavigation.css");

if(!$arResult["NavShowAlways"])
{
	if ($arResult["NavRecordCount"] == 0 || ($arResult["NavPageCount"] == 1 && $arResult["NavShowAll"] == false))
		return;
}
?>
<div class="main-ui-pagination">
<?php
$strNavQueryString = ($arResult["NavQueryString"] != "" ? $arResult["NavQueryString"]."&amp;" : "");
$strNavQueryStringFull = ($arResult["NavQueryString"] != "" ? "?".$arResult["NavQueryString"] : "");
?>

<?php
if($arResult["bDescPageNumbering"] === true):
?>
	<div class="main-ui-pagination-pages">
		<div class="main-ui-pagination-label"><?=GetMessage("MAIN_UI_PAGINATION__PAGES")?></div>
		<div class="main-ui-pagination-pages-list">
<?php
	if ($arResult["NavPageNomer"] < $arResult["NavPageCount"]):
		if ($arResult["nStartPage"] < $arResult["NavPageCount"]):
			if($arResult["bSavePage"]):
?>
				<a class="main-ui-pagination-page" href="<?=$arResult["sUrlPath"]?>?<?=$strNavQueryString?>PAGEN_<?=$arResult["NavNum"]?>=<?=$arResult["NavPageCount"]?>">1</a>
<?php
			else:
?>
				<a class="main-ui-pagination-page" href="<?=$arResult["sUrlPath"]?><?=$strNavQueryStringFull?>">1</a>
<?php
			endif;
			if ($arResult["nStartPage"] < ($arResult["NavPageCount"] - 1)):
?>
				<a class="main-ui-pagination-page main-ui-pagination-dots" href="<?=$arResult["sUrlPath"]?>?<?=$strNavQueryString?>PAGEN_<?=$arResult["NavNum"]?>=<?=intval($arResult["nStartPage"] + ($arResult["NavPageCount"] - $arResult["nStartPage"]) / 2)?>">...</a>
<?php
			endif;
		endif;
	endif;

	do
	{
		$NavRecordGroupPrint = $arResult["NavPageCount"] - $arResult["nStartPage"] + 1;

		if ($arResult["nStartPage"] == $arResult["NavPageNomer"]):
?>
			<span class="main-ui-pagination-page main-ui-pagination-active"><?=$NavRecordGroupPrint?></span>
<?php
		elseif($arResult["nStartPage"] == $arResult["NavPageCount"] && $arResult["bSavePage"] == false):
?>
			<a class="main-ui-pagination-page" href="<?=$arResult["sUrlPath"]?><?=$strNavQueryStringFull?>"><?=$NavRecordGroupPrint?></a>
<?php
		else:
?>
			<a class="main-ui-pagination-page" href="<?=$arResult["sUrlPath"]?>?<?=$strNavQueryString?>PAGEN_<?=$arResult["NavNum"]?>=<?=$arResult["nStartPage"]?>"><?=$NavRecordGroupPrint?></a>
<?php
		endif;

		$arResult["nStartPage"]--;
	}
	while($arResult["nStartPage"] >= $arResult["nEndPage"]);

	if ($arResult["NavPageNomer"] > 1):
		if ($arResult["nEndPage"] > 1):
			if ($arResult["nEndPage"] > 2):
?>
				<a class="main-ui-pagination-page main-ui-pagination-dots" href="<?=$arResult["sUrlPath"]?>?<?=$strNavQueryString?>PAGEN_<?=$arResult["NavNum"]?>=<?=round($arResult["nEndPage"] / 2)?>">...</a>
<?php
			endif;
?>
			<a class="main-ui-pagination-page" href="<?=$arResult["sUrlPath"]?>?<?=$strNavQueryString?>PAGEN_<?=$arResult["NavNum"]?>=1"><?=$arResult["NavPageCount"]?></a>
<?php
		endif;
	endif;
?>
		</div>
	</div>

	<div class="main-ui-pagination-arrows">
<?php
	if ($arResult["NavPageNomer"] < $arResult["NavPageCount"]):
		if($arResult["bSavePage"]):
?>
			<a class="main-ui-pagination-arrow main-ui-pagination-prev" href="<?=$arResult["sUrlPath"]?>?<?=$strNavQueryString?>PAGEN_<?=$arResult["NavNum"]?>=<?=($arResult["NavPageNomer"]+1)?>"><?=GetMessage("MAIN_UI_PAGINATION__PREV")?></a>
<?php
		else:
			if ($arResult["NavPageCount"] == ($arResult["NavPageNomer"]+1) ):
?>
				<a class="main-ui-pagination-arrow main-ui-pagination-prev" href="<?=$arResult["sUrlPath"]?><?=$strNavQueryStringFull?>"><?=GetMessage("MAIN_UI_PAGINATION__PREV")?></a>
<?php
			else:
?>
				<a class="main-ui-pagination-arrow main-ui-pagination-prev" href="<?=$arResult["sUrlPath"]?>?<?=$strNavQueryString?>PAGEN_<?=$arResult["NavNum"]?>=<?=($arResult["NavPageNomer"]+1)?>"><?=GetMessage("MAIN_UI_PAGINATION__PREV")?></a>
<?php
			endif;
		endif;
	else:
?>
		<span class="main-ui-pagination-arrow main-ui-pagination-prev"><?=GetMessage("MAIN_UI_PAGINATION__PREV")?></span>
<?php
	endif;

	if ($arResult["bShowAll"]):
		if ($arResult["NavShowAll"]):
?>
			<a class="main-ui-pagination-arrow" href="<?=$arResult["sUrlPath"]?>?<?=$strNavQueryString?>SHOWALL_<?=$arResult["NavNum"]?>=0"><?=GetMessage("MAIN_UI_PAGINATION__PAGED")?></a>
<?php
		else:
?>
			<a class="main-ui-pagination-arrow" href="<?=$arResult["sUrlPath"]?>?<?=$strNavQueryString?>SHOWALL_<?=$arResult["NavNum"]?>=1"><?=GetMessage("MAIN_UI_PAGINATION__ALL")?></a>
<?php
		endif;
	endif;

	if ($arResult["NavPageNomer"] > 1):
?>
		<a class="main-ui-pagination-arrow main-ui-pagination-next" href="<?=$arResult["sUrlPath"]?>?<?=$strNavQueryString?>PAGEN_<?=$arResult["NavNum"]?>=<?=($arResult["NavPageNomer"]-1)?>"><?=GetMessage("MAIN_UI_PAGINATION__NEXT")?></a>
<?php
	else:
?>
		<span class="main-ui-pagination-arrow main-ui-pagination-next"><?=GetMessage("MAIN_UI_PAGINATION__NEXT")?></span>
<?php
	endif;
?>
	</div>
<?php
else:
?>
	<div class="main-ui-pagination-pages">
		<div class="main-ui-pagination-label"><?=GetMessage("MAIN_UI_PAGINATION__PAGES")?></div>
		<div class="main-ui-pagination-pages-list">
<?php
	if ($arResult["NavPageNomer"] > 1):
		if ($arResult["nStartPage"] > 1):
			if($arResult["bSavePage"]):
?>
				<a class="main-ui-pagination-page" href="<?=$arResult["sUrlPath"]?>?<?=$strNavQueryString?>PAGEN_<?=$arResult["NavNum"]?>=1">1</a>
<?php
			else:
?>
				<a class="main-ui-pagination-page" href="<?=$arResult["sUrlPath"]?><?=$strNavQueryStringFull?>">1</a>
<?php
			endif;
			if ($arResult["nStartPage"] > 2):
?>
				<a class="main-ui-pagination-page main-ui-pagination-dots" href="<?=$arResult["sUrlPath"]?>?<?=$strNavQueryString?>PAGEN_<?=$arResult["NavNum"]?>=<?=round($arResult["nStartPage"] / 2)?>">...</a>
<?php
			endif;
		endif;
	endif;

	do
	{
		if ($arResult["nStartPage"] == $arResult["NavPageNomer"]):
?>
			<span class="main-ui-pagination-page main-ui-pagination-active"><?=$arResult["nStartPage"]?></span>
<?php
		elseif($arResult["nStartPage"] == 1 && $arResult["bSavePage"] == false):
?>
			<a class="main-ui-pagination-page" href="<?=$arResult["sUrlPath"]?><?=$strNavQueryStringFull?>"><?=$arResult["nStartPage"]?></a>
<?php
		else:
?>
			<a class="main-ui-pagination-page" href="<?=$arResult["sUrlPath"]?>?<?=$strNavQueryString?>PAGEN_<?=$arResult["NavNum"]?>=<?=$arResult["nStartPage"]?>"><?=$arResult["nStartPage"]?></a>
<?php
		endif;
		$arResult["nStartPage"]++;
	}
	while($arResult["nStartPage"] <= $arResult["nEndPage"]);

	if($arResult["NavPageNomer"] < $arResult["NavPageCount"]):
		if ($arResult["nEndPage"] < $arResult["NavPageCount"]):
			if ($arResult["nEndPage"] < ($arResult["NavPageCount"] - 1)):
?>
				<a class="main-ui-pagination-page main-ui-pagination-dots" href="<?=$arResult["sUrlPath"]?>?<?=$strNavQueryString?>PAGEN_<?=$arResult["NavNum"]?>=<?=round($arResult["nEndPage"] + ($arResult["NavPageCount"] - $arResult["nEndPage"]) / 2)?>">...</a>
<?php
			endif;
?>
				<a class="main-ui-pagination-page" href="<?=$arResult["sUrlPath"]?>?<?=$strNavQueryString?>PAGEN_<?=$arResult["NavNum"]?>=<?=$arResult["NavPageCount"]?>"><?=$arResult["NavPageCount"]?></a>
<?php
		endif;
	endif;
?>
		</div>
	</div>

	<div class="main-ui-pagination-arrows">
<?php
	if ($arResult["NavPageNomer"] > 1):
		if($arResult["bSavePage"]):
?>
			<a class="main-ui-pagination-arrow main-ui-pagination-prev" href="<?=$arResult["sUrlPath"]?>?<?=$strNavQueryString?>PAGEN_<?=$arResult["NavNum"]?>=<?=($arResult["NavPageNomer"]-1)?>"><?=GetMessage("MAIN_UI_PAGINATION__PREV")?></a>
<?php
		else:
			if ($arResult["NavPageNomer"] > 2):
?>
				<a class="main-ui-pagination-arrow main-ui-pagination-prev" href="<?=$arResult["sUrlPath"]?>?<?=$strNavQueryString?>PAGEN_<?=$arResult["NavNum"]?>=<?=($arResult["NavPageNomer"]-1)?>"><?=GetMessage("MAIN_UI_PAGINATION__PREV")?></a>
<?php
			else:
?>
				<a class="main-ui-pagination-arrow main-ui-pagination-prev" href="<?=$arResult["sUrlPath"]?><?=$strNavQueryStringFull?>"><?=GetMessage("MAIN_UI_PAGINATION__PREV")?></a>
<?php
			endif;

		endif;
	else:
?>
		<span class="main-ui-pagination-arrow main-ui-pagination-prev"><?=GetMessage("MAIN_UI_PAGINATION__PREV")?></span>
<?php
	endif;

	if ($arResult["bShowAll"]):
		if ($arResult["NavShowAll"]):
?>
			<a class="main-ui-pagination-arrow" href="<?=$arResult["sUrlPath"]?>?<?=$strNavQueryString?>SHOWALL_<?=$arResult["NavNum"]?>=0"><?=GetMessage("MAIN_UI_PAGINATION__PAGED")?></a>
<?php
		else:
?>
			<a class="main-ui-pagination-arrow" href="<?=$arResult["sUrlPath"]?>?<?=$strNavQueryString?>SHOWALL_<?=$arResult["NavNum"]?>=1"><?=GetMessage("MAIN_UI_PAGINATION__ALL")?></a>
<?php
		endif;
	endif;

	if($arResult["NavPageNomer"] < $arResult["NavPageCount"]):
?>
		<a class="main-ui-pagination-arrow main-ui-pagination-next" href="<?=$arResult["sUrlPath"]?>?<?=$strNavQueryString?>PAGEN_<?=$arResult["NavNum"]?>=<?=($arResult["NavPageNomer"]+1)?>"><?=GetMessage("MAIN_UI_PAGINATION__NEXT")?></a>
<?php
	else:
?>
		<span class="main-ui-pagination-arrow main-ui-pagination-next"><?=GetMessage("MAIN_UI_PAGINATION__NEXT")?></span>
<?php
	endif;
?>
	</div>
<?php
endif;
?>
</div>
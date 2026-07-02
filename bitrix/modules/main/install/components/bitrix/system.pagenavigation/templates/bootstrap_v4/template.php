<?php
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true) die();

/**
 * @var array $arResult
 * @var array $arParam
 * @var CBitrixComponentTemplate $this
 */

$this->setFrameMode(true);

if(!$arResult["NavShowAlways"])
{
	if ($arResult["NavRecordCount"] == 0 || ($arResult["NavPageCount"] == 1 && $arResult["NavShowAll"] == false))
		return;
}
?><nav class="pagination-container d-flex justify-content-between"><?php
	$strNavQueryString = ($arResult["NavQueryString"] != "" ? $arResult["NavQueryString"]."&amp;" : "");
	$strNavQueryStringFull = ($arResult["NavQueryString"] != "" ? "?".$arResult["NavQueryString"] : "");

	if($arResult["bDescPageNumbering"] === true):
		?><ul class="pagination pagination-sm">
			<li class="page-item disabled"><span class="page-link"><?=GetMessage("MAIN_UI_PAGINATION__PAGES")?></span></li><?php
			if ($arResult["NavPageNomer"] < $arResult["NavPageCount"]):
				if ($arResult["nStartPage"] < $arResult["NavPageCount"]):
					if($arResult["bSavePage"]):
						?><li class="page-item"><a class="main-ui-pagination-page" href="<?=$arResult["sUrlPath"]?>?<?=$strNavQueryString?>PAGEN_<?=$arResult["NavNum"]?>=<?=$arResult["NavPageCount"]?>">1</a></li><?php
					else:
						?><li class="page-item"><a class="main-ui-pagination-page" href="<?=$arResult["sUrlPath"]?><?=$strNavQueryStringFull?>">1</a></li><?php
					endif;

					if ($arResult["nStartPage"] < ($arResult["NavPageCount"] - 1)):
						?><a class="main-ui-pagination-page main-ui-pagination-dots" href="<?=$arResult["sUrlPath"]?>?<?=$strNavQueryString?>PAGEN_<?=$arResult["NavNum"]?>=<?=intval($arResult["nStartPage"] + ($arResult["NavPageCount"] - $arResult["nStartPage"]) / 2)?>">...</a><?php
					endif;
				endif;
			endif;

			do
			{
				$NavRecordGroupPrint = $arResult["NavPageCount"] - $arResult["nStartPage"] + 1;

				if ($arResult["nStartPage"] == $arResult["NavPageNomer"]):
					?><li class="page-item active"><span class="page-link"><?=$NavRecordGroupPrint?></span></li><?php
				elseif($arResult["nStartPage"] == $arResult["NavPageCount"] && $arResult["bSavePage"] == false):
					?><li class="page-item"><a class="page-link" href="<?=$arResult["sUrlPath"]?><?=$strNavQueryStringFull?>"><?=$NavRecordGroupPrint?></a></li><?php
				else:
					?><li class="page-item"><a class="page-link" href="<?=$arResult["sUrlPath"]?>?<?=$strNavQueryString?>PAGEN_<?=$arResult["NavNum"]?>=<?=$arResult["nStartPage"]?>"><?=$NavRecordGroupPrint?></a></li><?php
				endif;

				$arResult["nStartPage"]--;
			}

			while($arResult["nStartPage"] >= $arResult["nEndPage"]);

			if ($arResult["NavPageNomer"] > 1):
				if ($arResult["nEndPage"] > 1):
					if ($arResult["nEndPage"] > 2):
						?><li class="page-item"><a class="page-link" href="<?=$arResult["sUrlPath"]?>?<?=$strNavQueryString?>PAGEN_<?=$arResult["NavNum"]?>=<?=round($arResult["nEndPage"] / 2)?>">...</a></li><?php
					endif;
					?><li class="page-item"><a class="page-link" href="<?=$arResult["sUrlPath"]?>?<?=$strNavQueryString?>PAGEN_<?=$arResult["NavNum"]?>=1"><?=$arResult["NavPageCount"]?></a></li><?php
				endif;
			endif;
			?>
		</ul>

		<ul class="pagination pagination-sm"><?php
			if ($arResult["NavPageNomer"] < $arResult["NavPageCount"]):
				if($arResult["bSavePage"]):
					?><li class="page-item"><a class="page-link" href="<?=$arResult["sUrlPath"]?>?<?=$strNavQueryString?>PAGEN_<?=$arResult["NavNum"]?>=<?=($arResult["NavPageNomer"]+1)?>"><?=GetMessage("MAIN_UI_PAGINATION__PREV")?></a></li><?php
				else:
					if ($arResult["NavPageCount"] == ($arResult["NavPageNomer"]+1) ):
						?><li class="page-item"><a class="page-link" href="<?=$arResult["sUrlPath"]?><?=$strNavQueryStringFull?>"><?=GetMessage("MAIN_UI_PAGINATION__PREV")?></a></li><?php
					else:
						?><li class="page-item"><a class="page-link" href="<?=$arResult["sUrlPath"]?>?<?=$strNavQueryString?>PAGEN_<?=$arResult["NavNum"]?>=<?=($arResult["NavPageNomer"]+1)?>"><?=GetMessage("MAIN_UI_PAGINATION__PREV")?></a></li><?php
					endif;
				endif;
			else:
				?><li class="page-item disabled"><span class="page-link"><?=GetMessage("MAIN_UI_PAGINATION__PREV")?></span></li><?php
			endif;

			if ($arResult["bShowAll"]):
				if ($arResult["NavShowAll"]):
					?><li class="page-item"><a class="page-link" href="<?=$arResult["sUrlPath"]?>?<?=$strNavQueryString?>SHOWALL_<?=$arResult["NavNum"]?>=0"><?=GetMessage("MAIN_UI_PAGINATION__PAGED")?></a></li><?php
				else:
					?><li class="page-item"><a class="page-link" href="<?=$arResult["sUrlPath"]?>?<?=$strNavQueryString?>SHOWALL_<?=$arResult["NavNum"]?>=1"><?=GetMessage("MAIN_UI_PAGINATION__ALL")?></a></li><?php
				endif;
			endif;

			if ($arResult["NavPageNomer"] > 1):
				?><li class="page-item"><a class="page-link" href="<?=$arResult["sUrlPath"]?>?<?=$strNavQueryString?>PAGEN_<?=$arResult["NavNum"]?>=<?=($arResult["NavPageNomer"]-1)?>"><?=GetMessage("MAIN_UI_PAGINATION__NEXT")?></a></li><?php
			else:
				?><li class="page-item disabled"><span class="page-link"><?=GetMessage("MAIN_UI_PAGINATION__NEXT")?></span></li><?php
			endif;
		?></ul><?php
	else:
		?><ul class="pagination pagination-sm">
			<li class="page-item disabled"><span class="page-link"><?=GetMessage("MAIN_UI_PAGINATION__PAGES")?></span></li><?php
			if ($arResult["NavPageNomer"] > 1):
				if ($arResult["nStartPage"] > 1):
					if($arResult["bSavePage"]):
						?><li class="page-item"><a class="page-link" href="<?=$arResult["sUrlPath"]?>?<?=$strNavQueryString?>PAGEN_<?=$arResult["NavNum"]?>=1">1</a></li><?php
					else:
						?><li class="page-item"><a class="page-link" href="<?=$arResult["sUrlPath"]?><?=$strNavQueryStringFull?>">1</a></li><?php
					endif;

					if ($arResult["nStartPage"] > 2):
						?><li class="page-item"><a class="page-link" href="<?=$arResult["sUrlPath"]?>?<?=$strNavQueryString?>PAGEN_<?=$arResult["NavNum"]?>=<?=round($arResult["nStartPage"] / 2)?>">...</a></li><?php
					endif;
				endif;
			endif;

			do
			{
				if ($arResult["nStartPage"] == $arResult["NavPageNomer"]):
					?><li class="page-item active"><span class="page-link"><?=$arResult["nStartPage"]?></span></li><?php
				elseif($arResult["nStartPage"] == 1 && $arResult["bSavePage"] == false):
					?><li class="page-item"><a class="page-link" href="<?=$arResult["sUrlPath"]?><?=$strNavQueryStringFull?>"><?=$arResult["nStartPage"]?></a></li><?php
				else:
					?><li class="page-item"><a class="page-link" href="<?=$arResult["sUrlPath"]?>?<?=$strNavQueryString?>PAGEN_<?=$arResult["NavNum"]?>=<?=$arResult["nStartPage"]?>"><?=$arResult["nStartPage"]?></a></li><?php
				endif;
				$arResult["nStartPage"]++;
			}

			while($arResult["nStartPage"] <= $arResult["nEndPage"]);

			if($arResult["NavPageNomer"] < $arResult["NavPageCount"]):
				if ($arResult["nEndPage"] < $arResult["NavPageCount"]):
					if ($arResult["nEndPage"] < ($arResult["NavPageCount"] - 1)):
						?><li class="page-item"><a class="page-link" href="<?=$arResult["sUrlPath"]?>?<?=$strNavQueryString?>PAGEN_<?=$arResult["NavNum"]?>=<?=round($arResult["nEndPage"] + ($arResult["NavPageCount"] - $arResult["nEndPage"]) / 2)?>">...</a></li><?php
					endif;
					?><li class="page-item"><a class="page-link" href="<?=$arResult["sUrlPath"]?>?<?=$strNavQueryString?>PAGEN_<?=$arResult["NavNum"]?>=<?=$arResult["NavPageCount"]?>"><?=$arResult["NavPageCount"]?></a></li><?php
				endif;
			endif;

			?>
		</ul>

		<ul class="pagination pagination-sm"><?php
			if ($arResult["NavPageNomer"] > 1):
				if($arResult["bSavePage"]):
					?><li class="page-item"><a class="page-link" href="<?=$arResult["sUrlPath"]?>?<?=$strNavQueryString?>PAGEN_<?=$arResult["NavNum"]?>=<?=($arResult["NavPageNomer"]-1)?>"><?=GetMessage("MAIN_UI_PAGINATION__PREV")?></a></li><?php
				else:
					if ($arResult["NavPageNomer"] > 2):
						?><li class="page-item"><a class="page-link" href="<?=$arResult["sUrlPath"]?>?<?=$strNavQueryString?>PAGEN_<?=$arResult["NavNum"]?>=<?=($arResult["NavPageNomer"]-1)?>"><?=GetMessage("MAIN_UI_PAGINATION__PREV")?></a></li><?php
					else:
						?><li class="page-item"><a class="page-link" href="<?=$arResult["sUrlPath"]?><?=$strNavQueryStringFull?>"><?=GetMessage("MAIN_UI_PAGINATION__PREV")?></a></li><?php
					endif;
				endif;
			else:
				?><li class="page-item"><span class="page-link"><?=GetMessage("MAIN_UI_PAGINATION__PREV")?></span><?php
			endif;

			if ($arResult["bShowAll"]):
				if ($arResult["NavShowAll"]):
					?><li class="page-item"><a class="page-link" href="<?=$arResult["sUrlPath"]?>?<?=$strNavQueryString?>SHOWALL_<?=$arResult["NavNum"]?>=0"><?=GetMessage("MAIN_UI_PAGINATION__PAGED")?></a></li><?php
				else:
					?><li class="page-item"><a class="page-link" href="<?=$arResult["sUrlPath"]?>?<?=$strNavQueryString?>SHOWALL_<?=$arResult["NavNum"]?>=1"><?=GetMessage("MAIN_UI_PAGINATION__ALL")?></a></li><?php
				endif;
			endif;

			if($arResult["NavPageNomer"] < $arResult["NavPageCount"]):
				?><li class="page-item"><a class="page-link" href="<?=$arResult["sUrlPath"]?>?<?=$strNavQueryString?>PAGEN_<?=$arResult["NavNum"]?>=<?=($arResult["NavPageNomer"]+1)?>"><?=GetMessage("MAIN_UI_PAGINATION__NEXT")?></a></li><?php
			else:
				?><li class="page-item"><span class="page-link"><?=GetMessage("MAIN_UI_PAGINATION__NEXT")?></span></li><?php
			endif;
			?>
	</ul><?php
	endif;
	?></nav>
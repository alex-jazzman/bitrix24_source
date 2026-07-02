<?php
if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)
{
	die();
}

/**
 * @var array $arResult
 * @var array $arParam
 * @var CBitrixComponentTemplate $this
 */

/** @var PageNavigationComponent $component */
$component = $this->getComponent();

$this->setFrameMode(true);
$this->addExternalCss("/bitrix/css/main/grid/pagenavigation.css");
?>
<div class="main-ui-pagination">
	<?php
if($arResult["REVERSED_PAGES"] === true):
?>
	<div class="main-ui-pagination-pages">
		<div class="main-ui-pagination-label"><?=GetMessage("grid_pages")?></div>
		<div class="main-ui-pagination-pages-list">
			<?php
	if ($arResult["CURRENT_PAGE"] < $arResult["PAGE_COUNT"]):
		if ($arResult["START_PAGE"] < $arResult["PAGE_COUNT"]):
?>
			<a data-slider-ignore-autobinding="true" class="main-ui-pagination-page" href="<?=htmlspecialcharsbx($arResult["URL"])?>">1</a>
			<?php
			if ($arResult["START_PAGE"] < ($arResult["PAGE_COUNT"] - 1)):
?>
				<a data-slider-ignore-autobinding="true" class="main-ui-pagination-page main-ui-pagination-dots" href="<?=htmlspecialcharsbx($component->replaceUrlTemplate($arResult["START_PAGE"] + ($arResult["PAGE_COUNT"] - $arResult["START_PAGE"]) / 2))?>">...</a>
			<?php
			endif;
		endif;
	endif;

	$page = $arResult["START_PAGE"];
	do
	{
		$pageNumber = $arResult["PAGE_COUNT"] - $page + 1;
		
		if ($page == $arResult["CURRENT_PAGE"]):
?>
			<span class="main-ui-pagination-page main-ui-pagination-active"><?=$pageNumber?></span>
		<?php
		elseif($page == $arResult["PAGE_COUNT"]):
?>
			<a data-slider-ignore-autobinding="true" class="main-ui-pagination-page" href="<?=htmlspecialcharsbx($arResult["URL"])?>"><?=$pageNumber?></a>
		<?php
		else:
?>
			<a data-slider-ignore-autobinding="true" class="main-ui-pagination-page" href="<?=htmlspecialcharsbx($component->replaceUrlTemplate($page))?>"><?=$pageNumber?></a>
		<?php
		endif;
		
		$page--;
	}
	while($page >= $arResult["END_PAGE"]);
	
	if ($arResult["CURRENT_PAGE"] > 1):
		if ($arResult["END_PAGE"] > 1):
			if ($arResult["END_PAGE"] > 2):
?>
				<a data-slider-ignore-autobinding="true" class="main-ui-pagination-page main-ui-pagination-dots" href="<?=htmlspecialcharsbx($component->replaceUrlTemplate(round($arResult["END_PAGE"] / 2)))?>">...</a>
			<?php
			endif;
?>
			<a data-slider-ignore-autobinding="true" class="main-ui-pagination-page" href="<?=htmlspecialcharsbx($component->replaceUrlTemplate(1))?>"><?=$arResult["PAGE_COUNT"]?></a>
		<?php
		endif;
	endif;
?>
		</div>
	</div>

	<div class="main-ui-pagination-arrows">
		<?php
	if ($arResult["CURRENT_PAGE"] < $arResult["PAGE_COUNT"]):
		if (($arResult["CURRENT_PAGE"]+1) == $arResult["PAGE_COUNT"]):
?>
			<a data-slider-ignore-autobinding="true" class="main-ui-pagination-arrow main-ui-pagination-prev" href="<?=htmlspecialcharsbx($arResult["URL"])?>"><?=GetMessage("grid_nav_prev")?></a>
		<?php
		else:
?>
			<a data-slider-ignore-autobinding="true" class="main-ui-pagination-arrow main-ui-pagination-prev" href="<?=htmlspecialcharsbx($component->replaceUrlTemplate($arResult["CURRENT_PAGE"]+1))?>"><?=GetMessage("grid_nav_prev")?></a>
		<?php
		endif;
	else:
?>
		<span class="main-ui-pagination-arrow main-ui-pagination-prev"><?=GetMessage("grid_nav_prev")?></span>
	<?php
	endif;

	if ($arResult["SHOW_ALL"]):
		if ($arResult["ALL_RECORDS"]):
?>
		<a data-slider-ignore-autobinding="true" class="main-ui-pagination-arrow" href="<?=htmlspecialcharsbx($arResult["URL"])?>"><?=GetMessage("grid_nav_paged")?></a>
		<?php
		else:
?>
		<a data-slider-ignore-autobinding="true" class="main-ui-pagination-arrow" href="<?=htmlspecialcharsbx($component->replaceUrlTemplate("all"))?>"><?=GetMessage("grid_nav_all")?></a>
		<?php
		endif;
	endif;

	if ($arResult["CURRENT_PAGE"] > 1):
?>
		<a data-slider-ignore-autobinding="true" class="main-ui-pagination-arrow main-ui-pagination-next" href="<?=htmlspecialcharsbx($component->replaceUrlTemplate($arResult["CURRENT_PAGE"]-1))?>"><?=GetMessage("grid_nav_next")?></a>
	<?php
	else:
?>
		<span class="main-ui-pagination-arrow main-ui-pagination-next"><?=GetMessage("grid_nav_next")?></span>
	<?php
	endif;
?>
	</div>

<?php
else:
?>
	<div class="main-ui-pagination-pages">
		<div class="main-ui-pagination-label"><?=GetMessage("grid_pages")?></div>
		<div class="main-ui-pagination-pages-list">
			<?php
	if ($arResult["CURRENT_PAGE"] > 1):
		if ($arResult["START_PAGE"] > 1):
?>
			<a data-slider-ignore-autobinding="true" class="main-ui-pagination-page" href="<?=htmlspecialcharsbx($arResult["URL"])?>">1</a>
			<?php
			if ($arResult["START_PAGE"] > 2):
?>
				<a data-slider-ignore-autobinding="true" class="main-ui-pagination-page main-ui-pagination-dots" href="<?=htmlspecialcharsbx($component->replaceUrlTemplate(round($arResult["START_PAGE"] / 2)))?>">...</a>
			<?php
			endif;
		endif;
	endif;

	$page = $arResult["START_PAGE"];
	do
	{
		if ($page == $arResult["CURRENT_PAGE"]):
?>
			<span class="main-ui-pagination-page main-ui-pagination-active"><?=$page?></span>
		<?php
		elseif($page == 1):
?>
			<a data-slider-ignore-autobinding="true" class="main-ui-pagination-page" href="<?=htmlspecialcharsbx($arResult["URL"])?>">1</a>
		<?php
		else:
?>
			<a data-slider-ignore-autobinding="true" class="main-ui-pagination-page" href="<?=htmlspecialcharsbx($component->replaceUrlTemplate($page))?>"><?=$page?></a>
		<?php
		endif;

		$page++;
	}
	while($page <= $arResult["END_PAGE"]);

	if($arResult["CURRENT_PAGE"] < $arResult["PAGE_COUNT"]):
		if ($arResult["END_PAGE"] < $arResult["PAGE_COUNT"]):
			if ($arResult["END_PAGE"] < ($arResult["PAGE_COUNT"] - 1)):
?>
				<a data-slider-ignore-autobinding="true" class="main-ui-pagination-page main-ui-pagination-dots" href="<?=htmlspecialcharsbx($component->replaceUrlTemplate(round($arResult["END_PAGE"] + ($arResult["PAGE_COUNT"] - $arResult["END_PAGE"]) / 2)))?>">...</a>
			<?php
			endif;
?>
			<a data-slider-ignore-autobinding="true" class="main-ui-pagination-page" href="<?=htmlspecialcharsbx($component->replaceUrlTemplate($arResult["PAGE_COUNT"]))?>"><?=$arResult["PAGE_COUNT"]?></a>
		<?php
		endif;
	endif;
?>
		</div>
	</div>

	<div class="main-ui-pagination-arrows">
		<?php
	if ($arResult["CURRENT_PAGE"] > 1):
		if ($arResult["CURRENT_PAGE"] > 2):
?>
			<a data-slider-ignore-autobinding="true" class="main-ui-pagination-arrow main-ui-pagination-prev" href="<?=htmlspecialcharsbx($component->replaceUrlTemplate($arResult["CURRENT_PAGE"]-1))?>"><?=GetMessage("grid_nav_prev")?></a>
		<?php
		else:
?>
			<a data-slider-ignore-autobinding="true" class="main-ui-pagination-arrow main-ui-pagination-prev" href="<?=htmlspecialcharsbx($arResult["URL"])?>"><?=GetMessage("grid_nav_prev")?></a>
		<?php
		endif;
	else:
?>
		<span class="main-ui-pagination-arrow main-ui-pagination-prev"><?=GetMessage("grid_nav_prev")?></span>
	<?php
	endif;

	if ($arResult["SHOW_ALL"]):
		if ($arResult["ALL_RECORDS"]):
?>
		<a data-slider-ignore-autobinding="true" class="main-ui-pagination-arrow" href="<?=htmlspecialcharsbx($arResult["URL"])?>"><?=GetMessage("grid_nav_paged")?></a>
		<?php
		else:
?>
		<a data-slider-ignore-autobinding="true" class="main-ui-pagination-arrow" href="<?=htmlspecialcharsbx($component->replaceUrlTemplate("all"))?>"><?=GetMessage("grid_nav_all")?></a>
		<?php
		endif;
	endif;

	if($arResult["CURRENT_PAGE"] < $arResult["PAGE_COUNT"]):
?>
		<a data-slider-ignore-autobinding="true" class="main-ui-pagination-arrow main-ui-pagination-next" href="<?=htmlspecialcharsbx($component->replaceUrlTemplate($arResult["CURRENT_PAGE"]+1))?>"><?=GetMessage("grid_nav_next")?></a>
	<?php
	else:
?>
		<span class="main-ui-pagination-arrow main-ui-pagination-next"><?=GetMessage("grid_nav_next")?></span>
	<?php
	endif;
?>
	</div>
<?php
endif;
?>
</div>
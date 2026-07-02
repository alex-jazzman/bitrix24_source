<?php if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)die();

/** @var array $arParams */
/** @var array $arResult */
/** @var CBitrixComponentTemplate $this */

/** @var PageNavigationComponent $component */
$component = $this->getComponent();

$this->setFrameMode(true);

$colorSchemes = array(
	"green" => "bx-green",
	"yellow" => "bx-yellow",
	"red" => "bx-red",
	"blue" => "bx-blue",
);
if(isset($arParams["TEMPLATE_THEME"]) && isset($colorSchemes[$arParams["TEMPLATE_THEME"]]))
{
	$colorScheme = $colorSchemes[$arParams["TEMPLATE_THEME"]];
}
else
{
	$colorScheme = "";
}
?>

<div class="bx-pagination <?=$colorScheme?>">
	<div class="bx-pagination-container">
		<ul>
<?php if($arResult["REVERSED_PAGES"] === true):?>

	<?php if ($arResult["CURRENT_PAGE"] < $arResult["PAGE_COUNT"]):?>
		<?php if (($arResult["CURRENT_PAGE"]+1) == $arResult["PAGE_COUNT"]):?>
			<li class="bx-pag-prev"><a href="<?=htmlspecialcharsbx($arResult["URL"])?>"><span><?= GetMessage("round_nav_back")?></span></a></li>
		<?php else:?>
			<li class="bx-pag-prev"><a href="<?=htmlspecialcharsbx($component->replaceUrlTemplate($arResult["CURRENT_PAGE"]+1))?>"><span><?= GetMessage("round_nav_back")?></span></a></li>
		<?php endif?>
			<li class=""><a href="<?=htmlspecialcharsbx($arResult["URL"])?>"><span>1</span></a></li>
	<?php else:?>
			<li class="bx-pag-prev"><span><?= GetMessage("round_nav_back")?></span></li>
			<li class="bx-active"><span>1</span></li>
	<?php endif?>

	<?php
	$page = $arResult["START_PAGE"] - 1;
	while($page >= $arResult["END_PAGE"] + 1):
	?>
		<?php if ($page == $arResult["CURRENT_PAGE"]):?>
			<li class="bx-active"><span><?=($arResult["PAGE_COUNT"] - $page + 1)?></span></li>
		<?php else:?>
			<li class=""><a href="<?=htmlspecialcharsbx($component->replaceUrlTemplate($page))?>"><span><?=($arResult["PAGE_COUNT"] - $page + 1)?></span></a></li>
		<?php endif?>

		<?php $page--?>
	<?php endwhile?>

	<?php if ($arResult["CURRENT_PAGE"] > 1):?>
		<?php if($arResult["PAGE_COUNT"] > 1):?>
			<li class=""><a href="<?=htmlspecialcharsbx($component->replaceUrlTemplate(1))?>"><span><?=$arResult["PAGE_COUNT"]?></span></a></li>
		<?php endif?>
			<li class="bx-pag-next"><a href="<?=htmlspecialcharsbx($component->replaceUrlTemplate($arResult["CURRENT_PAGE"]-1))?>"><span><?= GetMessage("round_nav_forward")?></span></a></li>
	<?php else:?>
		<?php if($arResult["PAGE_COUNT"] > 1):?>
			<li class="bx-active"><span><?=$arResult["PAGE_COUNT"]?></span></li>
		<?php endif?>
			<li class="bx-pag-next"><span><?= GetMessage("round_nav_forward")?></span></li>
	<?php endif?>

<?php else:?>

	<?php if ($arResult["CURRENT_PAGE"] > 1):?>
		<?php if ($arResult["CURRENT_PAGE"] > 2):?>
			<li class="bx-pag-prev"><a href="<?=htmlspecialcharsbx($component->replaceUrlTemplate($arResult["CURRENT_PAGE"]-1))?>"><span><?= GetMessage("round_nav_back")?></span></a></li>
		<?php else:?>
			<li class="bx-pag-prev"><a href="<?=htmlspecialcharsbx($arResult["URL"])?>"><span><?= GetMessage("round_nav_back")?></span></a></li>
		<?php endif?>
			<li class=""><a href="<?=htmlspecialcharsbx($arResult["URL"])?>"><span>1</span></a></li>
	<?php else:?>
			<li class="bx-pag-prev"><span><?= GetMessage("round_nav_back")?></span></li>
			<li class="bx-active"><span>1</span></li>
	<?php endif?>

	<?php
	$page = $arResult["START_PAGE"] + 1;
	while($page <= $arResult["END_PAGE"]-1):
	?>
		<?php if ($page == $arResult["CURRENT_PAGE"]):?>
			<li class="bx-active"><span><?=$page?></span></li>
		<?php else:?>
			<li class=""><a href="<?=htmlspecialcharsbx($component->replaceUrlTemplate($page))?>"><span><?=$page?></span></a></li>
		<?php endif?>
		<?php $page++?>
	<?php endwhile?>

	<?php if($arResult["CURRENT_PAGE"] < $arResult["PAGE_COUNT"]):?>
		<?php if($arResult["PAGE_COUNT"] > 1):?>
			<li class=""><a href="<?=htmlspecialcharsbx($component->replaceUrlTemplate($arResult["PAGE_COUNT"]))?>"><span><?=$arResult["PAGE_COUNT"]?></span></a></li>
		<?php endif?>
			<li class="bx-pag-next"><a href="<?=htmlspecialcharsbx($component->replaceUrlTemplate($arResult["CURRENT_PAGE"]+1))?>"><span><?= GetMessage("round_nav_forward")?></span></a></li>
	<?php else:?>
		<?php if($arResult["PAGE_COUNT"] > 1):?>
			<li class="bx-active"><span><?=$arResult["PAGE_COUNT"]?></span></li>
		<?php endif?>
			<li class="bx-pag-next"><span><?= GetMessage("round_nav_forward")?></span></li>
	<?php endif?>
<?php endif?>

<?php if ($arResult["SHOW_ALL"]):?>
	<?php if ($arResult["ALL_RECORDS"]):?>
			<li class="bx-pag-all"><a href="<?=htmlspecialcharsbx($arResult["URL"])?>" rel="nofollow"><span><?= GetMessage("round_nav_pages")?></span></a></li>
	<?php else:?>
			<li class="bx-pag-all"><a href="<?=htmlspecialcharsbx($component->replaceUrlTemplate("all"))?>" rel="nofollow"><span><?= GetMessage("round_nav_all")?></span></a></li>
	<?php endif?>
<?php endif?>
		</ul>
		<div style="clear:both"></div>
	</div>
</div>

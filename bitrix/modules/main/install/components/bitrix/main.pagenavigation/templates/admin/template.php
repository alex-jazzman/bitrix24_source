<?php if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)die();

/** @var array $arParams */
/** @var array $arResult */
/** @var CBitrixComponentTemplate $this */

/** @var PageNavigationComponent $component */
$component = $this->getComponent();

if($arParams["POST"])
{
	$navFunction = $arParams["TABLE_ID"].'.PostAdminList';
}
else
{
	$navFunction = $arParams["TABLE_ID"].'.GetAdminList';
}

$showWait = "BX.addClass(this,'adm-nav-page-active');setTimeout(BX.delegate(function(){BX.addClass(this,'adm-nav-page-loading');this.innerHTML='';},this),500);";
?>

<?php if($arResult["RECORD_COUNT"] > 0):?>

<div class="adm-navigation">
	<div class="adm-nav-pages-block">
	<?php if($arResult["CURRENT_PAGE"] > 1):?>
		<a class="adm-nav-page adm-nav-page-prev" href="javascript:void(0)" <?='onclick="'.htmlspecialcharsbx($navFunction."('".CUtil::JSEscape($component->replaceUrlTemplate($arResult["CURRENT_PAGE"]-1, $arResult["PAGE_SIZE"]))."');".$showWait).'"'?>></a>
	<?php else:?>
		<span class="adm-nav-page adm-nav-page-prev"></span>
	<?php endif;?>
		<?php
	$page = 1;
	while($page <= $arResult["PAGE_COUNT"]):
	?>
		<?php if($page == $arResult["CURRENT_PAGE"]):?>
			<span class="adm-nav-page-active adm-nav-page"><?=$page?></span>
		<?php else:?>
			<a href="javascript:void(0)" <?='onclick="'.htmlspecialcharsbx($navFunction."('".CUtil::JSEscape($component->replaceUrlTemplate($page, $arResult["PAGE_SIZE"]))."');".$showWait).'"'?> class="adm-nav-page"><?=$page?></a>
		<?php endif;?>

		<?php
		if($page == 2 && $arResult["START_PAGE"] > 3):
			if($arResult["START_PAGE"] - $page > 1):
				$middlePage = ceil(($arResult["START_PAGE"] + $page)/2);
		?>
		<a href="javascript:void(0)" <?='onclick="'.htmlspecialcharsbx($navFunction."('".CUtil::JSEscape($component->replaceUrlTemplate($middlePage, $arResult["PAGE_SIZE"]))."');".$showWait).'"'?> class="adm-nav-page-separator"><?=$middlePage?></a>
			<?php
			endif;
			$page = $arResult["START_PAGE"];
		elseif($page == $arResult["END_PAGE"] && $arResult["END_PAGE"] < $arResult["PAGE_COUNT"] - 2):
			if($arResult["PAGE_COUNT"]-1 - $page > 1):
				$middlePage = floor(($arResult["PAGE_COUNT"] + $arResult["END_PAGE"] - 1)/2);
		?>
		<a href="javascript:void(0)" <?='onclick="'.htmlspecialcharsbx($navFunction."('".CUtil::JSEscape($component->replaceUrlTemplate($middlePage, $arResult["PAGE_SIZE"]))."');".$showWait).'"'?> class="adm-nav-page-separator"><?=$middlePage?></a>
			<?php
			endif;
			$page = $arResult["PAGE_COUNT"]-1;
		else:
			$page++;
		endif;
		?>
	<?php endwhile;?>

	<?php if($arResult["CURRENT_PAGE"] < $arResult["PAGE_COUNT"]):?>
		<a class="adm-nav-page adm-nav-page-next" href="javascript:void(0)" <?='onclick="'.htmlspecialcharsbx($navFunction."('".CUtil::JSEscape($component->replaceUrlTemplate($arResult["CURRENT_PAGE"]+1, $arResult["PAGE_SIZE"]))."');".$showWait).'"'?>></a>
	<?php else:?>
		<span class="adm-nav-page adm-nav-page-next"></span>
	<?php endif;?>
	</div>

	<?php if($arResult["RECORD_COUNT"] > 0):?>
	<div class="adm-nav-pages-total-block"><?=$arParams["TITLE"]." ".$arResult["FIRST_RECORD"]." &ndash; ".$arResult["LAST_RECORD"]?><?php if($arParams["SHOW_COUNT"]) echo " ".GetMessage("navigation_records_of")." ".$arResult["RECORD_COUNT"];?></div>
	<?php endif;?>

	<div class="adm-nav-pages-number-block">
		<span class="adm-nav-pages-number">
			<span class="adm-nav-pages-number-text"><?= GetMessage("navigation_records")?></span>
			<span class="adm-select-wrap">
				<select name="" class="adm-select" onchange="
					if(this[selectedIndex].value=='0')
					{
						<?=htmlspecialcharsbx($navFunction."('".CUtil::JSEscape($component->replaceUrlTemplate("all"))."');")?>
					}
					else
					{
						<?=htmlspecialcharsbx($navFunction."('".CUtil::JSEscape($component->replaceUrlTemplate("1", "--size--"))."'.replace('--size--', this[selectedIndex].value));")?>
					}
					">
				<?php foreach($arResult["PAGE_SIZES"] as $size):?>
					<option value="<?= $size?>"<?php if($arResult["PAGE_SIZE"] == $size) echo ' selected="selected"'?>><?= $size?></option>
				<?php endforeach;?>
				<?php if($arResult["SHOW_ALL"]):?>
					<option value="0"<?php if($arResult["ALL_RECORDS"]) echo ' selected="selected"'?>><?= GetMessage("navigation_records_all")?></option>
				<?php endif;?>
				</select>
			</span>
		</span>
	</div>
</div>

<?php endif;?>

<?php if (!isset($_REQUEST['admin_history'])):?>
	<?php if (isset($_REQUEST["IFRAME"]) && $_REQUEST["IFRAME"] === "Y"): ?>
		<script>
			BX.adminHistory.put(
				'<?=CUtil::JSEscape($component->replaceUrlTemplate(($arResult["ALL_RECORDS"]? "all" : $arResult["CURRENT_PAGE"]), $arResult["PAGE_SIZE"]))?>',
				BX.proxy((<?=$navFunction?>)?<?=$navFunction?>:<?=$navFunction?>,parent.<?=$arParams["TABLE_ID"]?>),
				['mode', 'table_id']
			);
		</script>
	<?php else: ?>
		<script>
			top.BX.adminHistory.put(
				'<?=CUtil::JSEscape($component->replaceUrlTemplate(($arResult["ALL_RECORDS"]? "all" : $arResult["CURRENT_PAGE"]), $arResult["PAGE_SIZE"]))?>',
				top.BX.proxy((top.<?=$navFunction?>)?top.<?=$navFunction?>:<?=$navFunction?>,parent.<?=$arParams["TABLE_ID"]?>),
				['mode', 'table_id']
			);
		</script>
	<?php endif; ?>
<?php endif;?>

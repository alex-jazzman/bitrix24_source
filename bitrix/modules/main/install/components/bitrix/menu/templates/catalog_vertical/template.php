<?php if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)die();

/**
 * @global CMain $APPLICATION
 * @var array $arParams
 */

if (empty($arResult["ALL_ITEMS"]))
	return;

if (file_exists($_SERVER["DOCUMENT_ROOT"].$this->GetFolder().'/themes/'.$arParams["MENU_THEME"].'/colors.css'))
	$APPLICATION->SetAdditionalCSS($this->GetFolder().'/themes/'.$arParams["MENU_THEME"].'/colors.css');

CJSCore::Init();

$menuBlockId = "catalog_menu_".$this->randString();
?>
<div class="bx_vertical_menu_advanced bx_<?=$arParams["MENU_THEME"]?>" id="<?=$menuBlockId?>">
	<ul id="ul_<?=$menuBlockId?>">
	<?php foreach($arResult["MENU_STRUCTURE"] as $itemID => $arColumns):?>     <!-- first level-->
		<?php $existPictureDescColomn = ($arResult["ALL_ITEMS"][$itemID]["PARAMS"]["picture_src"] || $arResult["ALL_ITEMS"][$itemID]["PARAMS"]["description"]) ? true : false;?>
		<li onmouseover="BX.CatalogVertMenu.itemOver(this);" onmouseout="BX.CatalogVertMenu.itemOut(this)" class="bx_hma_one_lvl <?php if($arResult["ALL_ITEMS"][$itemID]["SELECTED"]):?>current<?php endif?><?php if (is_array($arColumns) && !empty($arColumns)):?> dropdown<?php endif?>">
			<a href="<?=$arResult["ALL_ITEMS"][$itemID]["LINK"]?>" <?php if (is_array($arColumns) && !empty($arColumns) && $existPictureDescColomn):?>onmouseover="BX.CatalogVertMenu.changeSectionPicture(this);"<?php endif?>>
				<?=$arResult["ALL_ITEMS"][$itemID]["TEXT"]?>
				<span class="bx_shadow_fix"></span>
			</a>
		<?php if (is_array($arColumns) && !empty($arColumns)):?>
			<span style="display: none">
				<?=$arResult["ALL_ITEMS"][$itemID]["PARAMS"]["description"]?>
			</span>
			<span class="bx_children_advanced_panel">
				<img src="<?=$arResult["ALL_ITEMS"][$itemID]["PARAMS"]["picture_src"]?>" alt="">
			</span>
			<div class="bx_children_container b<?=($existPictureDescColomn) ? count($arColumns)+1 : count($arColumns)?>">
				<?php foreach($arColumns as $key=>$arRow):?>
				<div class="bx_children_block">
					<ul>
					<?php foreach($arRow as $itemIdLevel_2=>$arLevel_3):?>  <!-- second level-->
						<li class="parent">
							<a href="<?=$arResult["ALL_ITEMS"][$itemIdLevel_2]["LINK"]?>" <?php if ($existPictureDescColomn):?>ontouchstart="document.location.href = '<?=$arResult["ALL_ITEMS"][$itemIdLevel_2]["LINK"]?>';" onmouseover="BX.CatalogVertMenu.changeSectionPicture(this);"<?php endif?> data-picture="<?=$arResult["ALL_ITEMS"][$itemIdLevel_2]["PARAMS"]["picture_src"]?>">
								<?=$arResult["ALL_ITEMS"][$itemIdLevel_2]["TEXT"]?>
							</a>
							<span style="display: none">
								<?=$arResult["ALL_ITEMS"][$itemIdLevel_2]["PARAMS"]["description"]?>
							</span>
							<span class="bx_children_advanced_panel">
								<img src="<?=$arResult["ALL_ITEMS"][$itemIdLevel_2]["PARAMS"]["picture_src"]?>" alt="">
							</span>
						<?php if (is_array($arLevel_3) && !empty($arLevel_3)):?>
							<ul>
							<?php foreach($arLevel_3 as $itemIdLevel_3):?>	<!-- third level-->
								<li>
									<a href="<?=$arResult["ALL_ITEMS"][$itemIdLevel_3]["LINK"]?>" <?php if ($existPictureDescColomn):?>ontouchstart="document.location.href = '<?=$arResult["ALL_ITEMS"][$itemIdLevel_2]["LINK"]?>';return false;" onmouseover="BX.CatalogVertMenu.changeSectionPicture(this);return false;"<?php endif?> data-picture="<?=$arResult["ALL_ITEMS"][$itemIdLevel_3]["PARAMS"]["picture_src"]?>">
										<?=$arResult["ALL_ITEMS"][$itemIdLevel_3]["TEXT"]?>
									</a>
									<span style="display: none">
										<?=$arResult["ALL_ITEMS"][$itemIdLevel_3]["PARAMS"]["description"]?>
									</span>
									<span class="bx_children_advanced_panel">
										<img src="<?=$arResult["ALL_ITEMS"][$itemIdLevel_3]["PARAMS"]["picture_src"]?>" alt="">
									</span>
								</li>
							<?php endforeach;?>
							</ul>
						<?php endif?>
						</li>
					<?php endforeach;?>
					</ul>
				</div>
				<?php endforeach;?>
				<?php if ($existPictureDescColomn):?>
				<div class="bx_children_block advanced">
					<div class="bx_children_advanced_panel">
						<span class="bx_children_advanced_panel">
							<a href="<?=$arResult["ALL_ITEMS"][$itemID]["LINK"]?>"><span class="bx_section_picture">
								<img src="<?=$arResult["ALL_ITEMS"][$itemID]["PARAMS"]["picture_src"]?>"  alt="">
							</span></a>
							<img src="<?=$this->GetFolder()?>/images/spacer.png" alt="" style="border: none;">
							<strong style="display:block" class="bx_item_title"><?=$arResult["ALL_ITEMS"][$itemID]["TEXT"]?></strong>
							<span class="bx_section_description bx_item_description"><?=$arResult["ALL_ITEMS"][$itemID]["PARAMS"]["description"]?></span>
						</span>
					</div>
				</div>
				<?php endif?>
				<div style="clear: both;"></div>
			</div>
		<?php endif?>
		</li>
	<?php endforeach;?>
	</ul>
	<div style="clear: both;"></div>
</div>
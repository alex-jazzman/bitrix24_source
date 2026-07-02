<?php if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)die();

/**
 * @var array $arResult
 */

\Bitrix\Main\UI\Extension::load(['ui.design-tokens']);

$this->addExternalCss("/bitrix/css/main/font-awesome.css");
?>

<div class="urlpreview">
	<?php if(isset($arResult['DYNAMIC_PREVIEW'])): ?>
		<div class="urlpreview__frame-inner">
			<?= $arResult['DYNAMIC_PREVIEW'] ?>
			<div class="urlpreview__clearfix"></div>
			<div class="urlpreview__bottom">
				<a href="<?= $arResult['METADATA']['URL']?>" target="_blank"><?= GetMessage("URLPREVIEW_DETAILS")?>	</a>
			</div>
		</div>
	<?php else: ?>
		<div class="urlpreview__frame">
			<?php if($arResult['SHOW_CONTAINER']): ?>
				<div class="urlpreview__container <?=$arResult['METADATA']['CONTAINER']['CLASSES']?>">
					<?php if(isset($arResult['METADATA']['IMAGE'])):?>
						<div class="urlpreview__image">
							<?php if(isset($arResult['METADATA']['EMBED'])):?>
								<img src="<?=$arResult['METADATA']['IMAGE']?>" onerror="this.style.display='none';" class="urlpreview__image-not-inited">
								<div class="urlpreview__play">
									<i class="fa fa-play"></i>
								</div>
							<?php else:?>
								<a href="<?= $arResult['METADATA']['URL']?>" target="_blank">
									<img src="<?=$arResult['METADATA']['IMAGE']?>" onerror="this.style.display='none';" class="urlpreview__image-not-inited">
								</a>
							<?php endif?>
						</div>
					<?php endif?>
					<?php if(isset($arResult['METADATA']['EMBED'])):?>
						<div class="urlpreview__embed">
							<?=$arResult['METADATA']['EMBED']?>
						</div>
					<?php endif?>
				</div>
			<?php endif ?>

			<?php if(isset($arResult['METADATA']['TITLE']) && $arResult['METADATA']['TITLE'] != ''): ?>
				<div class="urlpreview__title">	<?= $arResult['METADATA']['TITLE'] ?></div>
			<?php endif ?>
			<?php if(isset($arResult['METADATA']['DESCRIPTION']) && $arResult['METADATA']['DESCRIPTION'] != ''): ?>
				<div class="urlpreview__description"><?= $arResult['METADATA']['DESCRIPTION'] ?></div>
			<?php endif ?>
			<div class="urlpreview__clearfix"></div>
			<div class="urlpreview__bottom">
				<a href="<?= $arResult['METADATA']['URL']?>" target="_blank"><?= GetMessage("URLPREVIEW_DETAILS")?>	</a>
			</div>
		</div>
	<?php endif ?>
</div>
<script>
	if(BXUrlPreview)
	{
		BXUrlPreview.bindEmbedHandler();
	}
</script>

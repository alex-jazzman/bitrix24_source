<?php if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)die();

/**
 * @var array $arResult
 */

\Bitrix\Main\UI\Extension::load(['ui.design-tokens']);

$this->addExternalCss("/bitrix/css/main/font-awesome.css");
?>

<div
	class="urlpreview urlpreview__edit"
	<?= $arResult['STYLE'] <> '' ? 'style="'.$arResult['STYLE'].'"' : '' ?>
	id="<?= $arResult['ELEMENT_ID']?>"
	data-field-id="<?= $arResult['FIELD_ID']?>"
	<?= isset($arResult['SELECTED_IMAGE']) ? 'data-image-id="'.$arResult['SELECTED_IMAGE'].'"' : ''?>
>
	<input type="hidden" class="urlpreview__ufvalue" name="<?= htmlspecialcharsbx($arResult['FIELD_NAME'])?>" value="<?= $arResult['FIELD_VALUE']?>">
	<div class="urlpreview__detach"><i class="fa fa-times"></i></div>
	<?php if(isset($arResult['DYNAMIC_PREVIEW'])): ?>
		<div class="urlpreview__frame-inner">
			<?= $arResult['DYNAMIC_PREVIEW'] ?>
		</div>
	<?php else: ?>
		<div class="urlpreview__frame">
			<?php if($arResult['SHOW_CONTAINER']): ?>
				<div class="urlpreview__container <?=$arResult['METADATA']['CONTAINER']['CLASSES']?>">
					<?php if(isset($arResult['METADATA']['IMAGE'])):?>
						<div class="urlpreview__image">
							<?php if(isset($arResult['METADATA']['EMBED'])):?>
								<img src="<?=$arResult['METADATA']['IMAGE']?>" onerror="this.style.display='none';">
								<div class="urlpreview__play">
									<i class="fa fa-play"></i>
								</div>
							<?php else:?>
								<a href="<?= $arResult['METADATA']['URL']?>" target="_blank">
									<img src="<?=$arResult['METADATA']['IMAGE']?>" onerror="this.style.display='none';">
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
			<?php if($arResult['SELECT_IMAGE']): ?>
				<div class="urlpreview__container">
					<div class="urlpreview__carousel" style="display: none;">
						<?php foreach($arResult['METADATA']['EXTRA']['IMAGES'] as $imageUrl): ?>
							<div class="urlpreview__image">
								<img src="<?=$imageUrl?>">
							</div>
						<?php endforeach ?>
						<div class="urlpreview__button urlpreview__button-prev"></div>
						<div class="urlpreview__button urlpreview__button-next"></div>
					</div>
				</div>
			<?php endif ?>
			<?php if(isset($arResult['METADATA']['TITLE']) && $arResult['METADATA']['TITLE'] != ''): ?>
				<div class="urlpreview__title">	<?= $arResult['METADATA']['TITLE'] ?></div>
			<?php endif ?>
			<?php if(isset($arResult['METADATA']['DESCRIPTION']) && $arResult['METADATA']['DESCRIPTION'] != ''): ?>
				<div class="urlpreview__description"><?= $arResult['METADATA']['DESCRIPTION'] ?></div>
			<?php endif ?>
		</div>
	<?php endif ?>
	<div class="urlpreview__clearfix"></div>
</div>


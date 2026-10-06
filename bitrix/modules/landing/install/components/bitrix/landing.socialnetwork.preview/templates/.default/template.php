<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use \Bitrix\Landing\Sanitizer;
use \Bitrix\Main\Localization\Loc;

Loc::loadMessages(__FILE__);

$preview = $arResult['PREVIEW'];
$this->addExternalCss('/bitrix/css/main/font-awesome.css');

// the picture is a resource load, not a navigation: the scheme allow-list is what matters,
// while a protocol-relative ref has to stay - the REST read of METAOG.IMAGE returns exactly
// that form (Manager::getUrlFromFile), so cutting it would blank a legitimate picture.
// The url below is a navigation and keeps the stricter href policy.
$previewPicture = Sanitizer::hasDisallowedScheme($preview['PICTURE']) ? '' : $preview['PICTURE'];
?>

<div class="urlpreview_landing">
	<div class="urlpreview_landing__frame">
		<div class="urlpreview_landing__container">
			<?if ($preview['PICTURE']):?>
				<div class="urlpreview_landing__image">
					<a href="<?= \htmlspecialcharsbx(Sanitizer::sanitizeHrefScheme($preview['URL']));?>" target="_blank">
						<img src="<?= \htmlspecialcharsbx($previewPicture);?>" style="max-width: 300px; max-height: 300px;" alt="<?= \htmlspecialcharsbx($preview['TITLE']);?>" >
					</a>
				</div>
			<?endif?>
		</div>
		<div class="urlpreview_landing__title">
			<?= \htmlspecialcharsbx($preview['TITLE']);?>
		</div>
		<?if ($preview['DESCRIPTION']):?>
			<div class="urlpreview_landing__description">
				<?= \htmlspecialcharsbx($preview['DESCRIPTION']);?>
			</div>
		<?endif;?>
		<div class="urlpreview_landing__clearfix"></div>
		<div class="urlpreview_landing__bottom">
			<a href="<?= \htmlspecialcharsbx(Sanitizer::sanitizeHrefScheme($preview['URL']));?>">
				<?= Loc::getMessage('LANDING_TPL_MORE');?>
			</a>
		</div>
	</div>
</div>
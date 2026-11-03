<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use \Bitrix\Landing\Sanitizer;
use \Bitrix\Main\Security\Random;

$preview = $arResult['PREVIEW'];
$this->addExternalCss('/bitrix/css/main/font-awesome.css');

// the card is named by its title, so the reference needs an id unique within the rendered page
$titleId = 'urlpreview-landing-title-' . Random::getString(8);

// the picture is a resource load, not a navigation: the scheme allow-list is what matters,
// while a protocol-relative ref has to stay - the REST read of METAOG.IMAGE returns exactly
// that form (Manager::getUrlFromFile), so cutting it would blank a legitimate picture.
// The url below is a navigation and keeps the stricter href policy.
$previewPicture = Sanitizer::hasDisallowedScheme($preview['PICTURE']) ? '' : $preview['PICTURE'];
?>

<article class="urlpreview_landing" aria-labelledby="<?= $titleId;?>">
	<div class="urlpreview_landing__frame">
		<div class="urlpreview_landing__container">
			<?if ($preview['PICTURE']):?>
				<div class="urlpreview_landing__image">
					<a href="<?= \htmlspecialcharsbx(Sanitizer::sanitizeHrefScheme($preview['URL']));?>" target="_blank" tabindex="-1" aria-hidden="true">
						<img src="<?= \htmlspecialcharsbx($previewPicture);?>" style="max-width: 300px; max-height: 300px;" alt="" >
					</a>
				</div>
			<?endif?>
		</div>
		<div class="urlpreview_landing__title" id="<?= $titleId;?>">
			<?= \htmlspecialcharsbx($preview['TITLE']);?>
		</div>
		<?if ($preview['DESCRIPTION']):?>
			<div class="urlpreview_landing__description">
				<?= \htmlspecialcharsbx($preview['DESCRIPTION']);?>
			</div>
		<?endif;?>
		<div class="urlpreview_landing__clearfix"></div>
	</div>
</article>

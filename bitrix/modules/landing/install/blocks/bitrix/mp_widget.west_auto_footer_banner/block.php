<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

/**
 * @var \CMain $APPLICATION
 */
?>

<section
	class="landing-block g-bg --ui-context-content-light"
	style="--bg: #032b6e;">
	<?php
	$APPLICATION->IncludeComponent(
		'bitrix:landing.blocks.mp_widget.west_auto_footer_banner',
		'.default',
		[],
	);
	?>
</section>


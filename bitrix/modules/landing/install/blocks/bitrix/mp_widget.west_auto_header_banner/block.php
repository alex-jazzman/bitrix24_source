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
	class="landing-block g-bg-image --ui-context-content-light"
	style="
		--bg-url: url(https://cdn.bitrix24.site/bitrix/images/landing/vibe/ent-west-v2/header/bg.jpg);
		--bg-size: cover;
		--bg-attachment: scroll;
		--bg-url-2x: url(https://cdn.bitrix24.site/bitrix/images/landing/vibe/ent-west-v2/header/bg.jpg);
		background-repeat: no-repeat;
">
	<?php
	$APPLICATION->IncludeComponent(
		'bitrix:landing.blocks.mp_widget.west_auto_header_banner',
		'.default',
		[],
	);
	?>
</section>


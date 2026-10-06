<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

?>
<div class="g-min-height-200 g-flex-centered g-height-100">
	<div class="g-landing-alert" role="<?= $arParams['MESSAGE_TYPE'] ?>" data-testid="landing-blocks-message">
		<p><?= $arParams['~MESSAGE'] ?></p>
	</div>
</div>

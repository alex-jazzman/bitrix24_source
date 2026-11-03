<?php

use Bitrix\Main\Web\Uri;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

$avatarSize = (int)$arResult['avatarSize'];
$fallbackClass = 'mail-contact-avatar-default';
$fallbackContent = '';
$fallbackStyle = '';
if (!empty($arResult['image']['src']))
{
	$fallbackClass = '';
	$fallbackStyle = sprintf(
		'background-image: url(\'%s\');',
		Uri::urnEncode(htmlspecialcharsbx((string)$arResult['image']['src'])),
	);
}
elseif (!empty($arResult['COLOR']) && !empty($arResult['INITIALS']))
{
	$fallbackClass = 'mail-contact-avatar-icon';
	$fallbackStyle = sprintf('background-color: %s;', htmlspecialcharsbx((string)$arResult['COLOR']));
	$fallbackContent = htmlspecialcharsbx((string)$arResult['INITIALS']);
}
?>
<span
	class="mail-contact-avatar mail-contact-avatar-protected"
	<?php if ($arResult['testId'] !== ''): ?>data-testid="<?= htmlspecialcharsbx($arResult['testId']) ?>"<?php endif ?>
	style="min-width: <?= $avatarSize ?>px; width: <?= $avatarSize ?>px; min-height: <?= $avatarSize ?>px;
		height: <?= $avatarSize ?>px; font-size: <?= (int)$arResult['initialsFontSize'] ?>px;
		line-height: <?= $avatarSize ?>px;"
>
	<span class="mail-contact-avatar-protected-fallback <?= $fallbackClass ?>" style="<?= $fallbackStyle ?>"><?= $fallbackContent ?></span>
	<img
		class="mail-contact-avatar-protected-image"
		data-mailbox-avatar-image
		src="<?= htmlspecialcharsbx((string)$arResult['imageUrl']) ?>"
		alt=""
	>
</span>

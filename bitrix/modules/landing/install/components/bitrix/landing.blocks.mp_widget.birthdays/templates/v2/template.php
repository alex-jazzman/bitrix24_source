<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

/** @var array $arParams */
/** @var array $arResult */

use Bitrix\Landing\Sanitizer;
use \Bitrix\Main\Localization\Loc;

Loc::loadMessages(__FILE__);

\Bitrix\Main\UI\Extension::load([
	// the focus ring of the stylesheet is built from the tokens of this one
	'ui.design-tokens.air',
]);

$title = \htmlspecialcharsbx($arResult['TITLE']);
$id = 'widget-' . htmlspecialcharsbx(bin2hex(random_bytes(5)));
$isShowEmptyState = $arResult['SHOW_EMPTY_STATE'];
$emptyStateText = Loc::getMessage('BLOCK_MP_WIDGET_BIRTHDAY_V2_EMPTY_STATE_TEXT');
$sidebarUsers = array_slice($arResult['USERS'], 0, 4);

// a bare day and month beside a name does not tell what the date is about, so the context stands
// beside it as text of its own: hidden from sight, read in order with the date, and left out
// entirely when the locale has no phrase for it
$dateHintPhrase = \htmlspecialcharsbx((string)Loc::getMessage('BLOCK_MP_WIDGET_BIRTHDAY_V2_DATE_HINT'));
$dateHint = $dateHintPhrase === ''
	? ''
	: '<span class="landing-widget-visually-hidden">' . $dateHintPhrase . '</span> ';
?>

<div class="landing-widget-birthdays-v2" id="<?= $id ?>" data-testid="mainpage-widget-birthdays-v2-root">
	<div class="landing-widget-view-main">
		<h2 class="w-color-h landing-widget-birthdays-v2-title">
			<?= $title ?>
		</h2>
		<?php if ($isShowEmptyState): ?>
			<div class="landing-widget-birthdays-v2-empty-state">
				<div class="landing-widget-birthdays-v2-empty-state-icon"></div>
				<div class="landing-widget-birthdays-v2-empty-state-text">
					<?= $emptyStateText ?>
				</div>
			</div>
		<?php else: ?>
			<div class="landing-widget-birthdays-v2-content-box">
				<div class="landing-widget-birthdays-v2-content">
					<?php
					foreach ($arResult['USERS'] as $user)
					{
						$img = $user['PERSONAL_PHOTO_PATH'] ?? '';
						$name = \htmlspecialcharsbx($user['NAME']);
						$position = \htmlspecialcharsbx($user['WORK_POSITION']);
						$birthdayDate = \htmlspecialcharsbx($user['PERSONAL_BIRTHDAY']);
						// no profile address: plain text, not a link that is announced but cannot be used
						$hasUserLink = (int)($user['ID'] ?? 0) > 0;
						$userTag = $hasUserLink ? 'a' : 'div';
						$userLinkAttr = $hasUserLink ? ' href="/company/personal/user/' . (int)$user['ID'] . '/"' : '';
						$userLinkClass = $hasUserLink ? ' --link' : '';
						// the avatar duplicates the profile link beside it: it stays clickable, but leaves
						// the accessibility tree and the keyboard path
						$userPicHiddenAttr = ' aria-hidden="true"' . ($hasUserLink ? ' tabindex="-1"' : '');
						echo '<div class="landing-widget-birthdays-v2-content-item" data-testid="mainpage-widget-birthdays-v2-item">';
						echo '<' . $userTag . $userLinkAttr . ' class="landing-widget-birthdays-v2-content-item-img' . $userLinkClass . '"' . $userPicHiddenAttr . '>';
						if ($img !== '')
						{
							?>
							<div class="landing-widget-birthdays-v2-content-item-img-wrapper">
								<div style="background-image: url('<?= \htmlspecialcharsbx(Sanitizer::sanitizeCssUrl((string)$img)) ?>');" class="landing-widget-birthdays-v2-content-item-img-inner"></div>
							</div>
							<?php
						}
						else
						{
							echo '<div class="landing-widget-birthdays-v2-content-item-img-default-inner"></div>';
						}
						echo '</' . $userTag . '>';
						echo '<div class="landing-widget-birthdays-v2-content-item-text-box">';
						echo '<' . $userTag . $userLinkAttr . ' class="landing-widget-birthdays-v2-content-item-text-name' . $userLinkClass . '" data-testid="mainpage-widget-birthdays-v2-user">' . $name . '</' . $userTag . '>';
						echo '<div class="landing-widget-birthdays-v2-content-item-text-work-position">' . $position .'</div>';
						echo '<div class="landing-widget-birthdays-v2-content-item-text-date">' . $dateHint . $birthdayDate . '</div>';
						echo '</div>';
						echo '</div>';
					}
					?>
				</div>
			</div>
		<?php endif; ?>
	</div>
	<?php if ($isShowEmptyState): ?>
	<div class="landing-widget-view-sidebar landing-widget-view-sidebar-empty-state">
	<?php else: ?>
	<div class="landing-widget-view-sidebar">
	<?php endif; ?>
		<h2 class="w-color-h landing-widget-birthdays-v2-title">
			<?= $title ?>
		</h2>
		<?php if ($isShowEmptyState): ?>
			<div class="landing-widget-birthdays-v2-empty-state">
				<div class="landing-widget-birthdays-v2-empty-state-icon"></div>
				<div class="landing-widget-birthdays-v2-empty-state-text">
					<?= $emptyStateText ?>
				</div>
			</div>
		<?php else: ?>
			<div class="landing-widget-birthdays-v2-content-box">
				<div class="landing-widget-birthdays-v2-content">
					<?php
					foreach ($sidebarUsers as $user)
					{
						$img = $user['PERSONAL_PHOTO_PATH'] ?? '';
						$name = \htmlspecialcharsbx($user['NAME']);
						$position = \htmlspecialcharsbx($user['WORK_POSITION']);
						$birthdayDate = \htmlspecialcharsbx($user['PERSONAL_BIRTHDAY']);
						// no profile address: plain text, not a link that is announced but cannot be used
						$hasUserLink = (int)($user['ID'] ?? 0) > 0;
						$userTag = $hasUserLink ? 'a' : 'div';
						$userLinkAttr = $hasUserLink ? ' href="/company/personal/user/' . (int)$user['ID'] . '/"' : '';
						$userLinkClass = $hasUserLink ? ' --link' : '';
						// the avatar duplicates the profile link beside it: it stays clickable, but leaves
						// the accessibility tree and the keyboard path
						$userPicHiddenAttr = ' aria-hidden="true"' . ($hasUserLink ? ' tabindex="-1"' : '');
						echo '<div class="landing-widget-birthdays-v2-content-item" data-testid="mainpage-widget-birthdays-v2-item">';
						echo '<' . $userTag . $userLinkAttr . ' class="landing-widget-birthdays-v2-content-item-img' . $userLinkClass . '"' . $userPicHiddenAttr . '>';
						if ($img !== '')
						{
							?>
							<div class="landing-widget-birthdays-v2-content-item-img-wrapper">
								<div style="background-image: url('<?= \htmlspecialcharsbx(Sanitizer::sanitizeCssUrl((string)$img)) ?>');" class="landing-widget-birthdays-v2-content-item-img-inner"></div>
							</div>
							<?php
						}
						else
						{
							echo '<div class="landing-widget-birthdays-v2-content-item-img-default-inner"></div>';
						}
						echo '</' . $userTag . '>';
						echo '<div class="landing-widget-birthdays-v2-content-item-text-box">';
						echo '<' . $userTag . $userLinkAttr . ' class="landing-widget-birthdays-v2-content-item-text-name' . $userLinkClass . '" data-testid="mainpage-widget-birthdays-v2-user">' . $name . '</' . $userTag . '>';
						echo '<div class="landing-widget-birthdays-v2-content-item-text-work-position">' . $position .'</div>';
						echo '<div class="landing-widget-birthdays-v2-content-item-text-date">' . $dateHint . $birthdayDate . '</div>';
						echo '</div>';
						echo '</div>';
					}
					?>
				</div>
			</div>
		<?php endif; ?>
	</div>
</div>

<script>
	BX.ready(function()
	{
		const editModeElement = document.querySelector('main.landing-edit-mode');
		if (!editModeElement)
		{
			const widgetElement = document.querySelector('#<?= $id ?>');
			if (widgetElement)
			{
				new BX.Landing.Widget.BirthdaysV2(widgetElement);
			}
		}
	});
</script>

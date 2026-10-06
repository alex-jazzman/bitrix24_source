<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) die();

/**
 * Shared external-page header fragment (see HDR-01 contract).
 * Renders the logo (left) and the signup action (right). Both lead to the same signup page, so a
 * portal without one (not Bitrix24, or no intranet module) keeps the logo as plain text.
 * Included by external.link / error.page templates from $_SERVER['DOCUMENT_ROOT']
 * only when the page is shown to an anonymous recipient (see access-page.php).
 *
 * Requires in the caller scope:
 * @var string $langId  Language of the page: the external link keeps the owner language.
 *
 * The caller must have run Extension::load(['ui.buttons']) before the head output.
 */

use Bitrix\Main\Localization\Loc;
use Bitrix\UI\Buttons\AirButtonStyle;
use Bitrix\UI\Buttons\Button;
use Bitrix\UI\Buttons\Size;
use Bitrix\UI\Buttons\Tag;

Loc::loadMessages(__DIR__ . '/template.php');

$showSignup = isModuleInstalled('bitrix24') && \Bitrix\Main\Loader::includeModule('intranet');
$signupUrl = $showSignup
	? CIntranetUtils::getB24Link('file') . '&utm_source=fileshare_button&utm_medium=referral&utm_campaign=fileshare_button'
	: '';

// The phrase carries markup of its own, so the clock mark joins it instead of nesting inside it.
$logoHtml = Loc::getMessage('DISK_EXT_LINK_B24', null, $langId)
	. '<span class="disk-ext-header__logo-clock" aria-hidden="true"></span>'
;

$signupButton = null;
if ($showSignup)
{
	/** @var callable $applyAirStyle */
	include $_SERVER['DOCUMENT_ROOT'] . '/bitrix/components/bitrix/disk.external.link/templates/.default/access-button.php';

	$signupButton = new Button([
		'text' => Loc::getMessage('DISK_EXT_LINK_ACTION_SIGNUP', null, $langId),
		'tag' => Tag::LINK,
		'link' => $signupUrl,
		'size' => Size::MEDIUM,
	]);
	$applyAirStyle($signupButton, AirButtonStyle::FILLED_SUCCESS);
	$signupButton->addAttribute('target', '_blank');
	$signupButton->addAttribute('rel', 'noopener');
	$signupButton->addAttribute('data-testid', 'disk-ext-header-signup-btn');
}
?>
<div class="bx-shared-header">
	<?php if ($signupButton): ?>
		<a
			class="bx-shared-logo"
			href="<?= htmlspecialcharsbx($signupUrl) ?>"
			target="_blank"
			rel="noopener"
			data-testid="disk-ext-header-logo"
		><?= $logoHtml ?></a>
		<div class="disk-ext-header__actions">
			<?= $signupButton->render(false) ?>
		</div>
	<?php else: ?>
		<div class="bx-shared-logo" data-testid="disk-ext-header-logo"><?= $logoHtml ?></div>
	<?php endif; ?>
</div>

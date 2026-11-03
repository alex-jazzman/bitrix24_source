<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) die();

/**
 * Shared access card fragment (see TPL-01 contract).
 * Included by external.link / error.page templates from $_SERVER['DOCUMENT_ROOT'].
 *
 * @var string $illustration Path to the card illustration.
 * @var string $title        Localized card title (trusted text).
 * @var string $description  Localized card subtitle (trusted text).
 * @var string $mode         'denied' (text only) or 'password' (text + controls slot).
 * @var string $titleTag     Tag of the card title: 'div' by default, 'h1' when the card owns the page heading.
 * @var string $slotHtml     Ready HTML for the controls zone in password mode.
 * @var string $cardTestId   Optional data-testid for the root card (empty = attribute omitted).
 */

$illustration = $illustration ?? '';
$title = $title ?? '';
$description = $description ?? '';
$mode = ($mode ?? 'denied') === 'password' ? 'password' : 'denied';
$titleTag = ($titleTag ?? 'div') === 'h1' ? 'h1' : 'div';
$slotHtml = $slotHtml ?? '';
$cardTestId = $cardTestId ?? '';
?>
<div class="disk-access-card --<?= $mode ?>"<?= $cardTestId !== '' ? ' data-testid="' . htmlspecialcharsbx($cardTestId) . '"' : '' ?>>
	<div class="disk-access-card__illustration">
		<img class="disk-access-card__image" src="<?= htmlspecialcharsbx($illustration) ?>" alt="">
	</div>
	<div class="disk-access-card__content">
		<div class="disk-access-card__info">
			<<?= $titleTag ?> class="disk-access-card__title"><?= htmlspecialcharsbx($title) ?></<?= $titleTag ?>>
			<div class="disk-access-card__description"><?= htmlspecialcharsbx($description) ?></div>
		</div>
		<?php if ($mode === 'password'): ?>
			<div class="disk-access-card__controls"><?= $slotHtml ?></div>
		<?php endif; ?>
	</div>
</div>

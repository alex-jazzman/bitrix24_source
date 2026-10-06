<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

/**
 * Head shared by the public pages of a link: the heading names the object the link was made for, the
 * line under it describes that object, and the actions of the link sit on the right of both. The
 * folder page puts its crumbs between the heading and the line, the file page has nothing to put there.
 * Each page builds the parts itself and this fragment only lays them out, so both look the same.
 *
 * @var string $headerTitle         plain text of the heading, escaped here
 * @var array $headerMetaParts      plain strings of the meta line, joined by bullets and escaped here
 * @var string $headerNavHtml       markup between the heading and the meta line, empty when there is none
 * @var string $headerActionsHtml   rendered by the page, which owns the air look of the buttons
 * @var string $headerTestIdPrefix  tells the marks of the two pages apart
 */
?>
<div class="disk-ext-object-header" data-testid="<?= $headerTestIdPrefix ?>-header">
	<div class="disk-ext-object-header__nav">
		<h1 class="disk-ext-object-header__title" data-testid="<?= $headerTestIdPrefix ?>-name">
			<?= htmlspecialcharsbx($headerTitle) ?>
		</h1>
		<?= $headerNavHtml ?>
		<p class="disk-ext-object-header__meta" data-testid="<?= $headerTestIdPrefix ?>-meta">
			<?php foreach ($headerMetaParts as $index => $part): ?>
				<?php if ($index > 0): ?>
					<span class="disk-ext-object-header__meta-separator" aria-hidden="true">&bull;</span>
				<?php endif; ?>
				<span class="disk-ext-object-header__meta-item"><?= htmlspecialcharsbx($part) ?></span>
			<?php endforeach; ?>
		</p>
	</div>
	<div class="disk-ext-object-header__actions">
		<?= $headerActionsHtml ?>
	</div>
</div>

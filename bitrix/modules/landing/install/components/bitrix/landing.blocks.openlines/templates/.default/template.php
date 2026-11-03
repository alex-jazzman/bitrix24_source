<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

/**
 * @param array $arParams
 */

if (!empty($arParams['ERRORS']))
{
	if ($arParams['EDIT_MODE'] === 'Y') :?>
		<div class="g-landing-alert-v2">
			<?php foreach ($arParams['ERRORS'] as $error) : ?>
				<?php
				$title = $error['title'] ?: $error['text'];
				$text = $error['text'] ?: '';
				?>
				<div class="g-landing-alert-title"><?= $title ?></div>
				<div class="g-landing-alert-text"><?= $text ?></div>
				<?php if (isset(
					$error['button'],
					$error['button']['href'],
					$error['button']['text']
				)): ?>
					<?php
					$onclick = isset($error['button']['onclick'])
						? ' onclick="'.$error['button']['onclick'].'" '
						: '';
					?>
					<a class="landing-trusted-link ui-btn g-mt-15"
						href="<?= $error['button']['href'] ?>"
						<?=$onclick?>
					>
						<?= $error['button']['text'] ?>
					</a>
				<?php endif ?>
			<?php endforeach; ?>
		</div>
	<?php endif;

	return;
}

// The block is not operated in the editor: the click is already stopped there by
// `g-pointer-events-none--edit-mode`, and a real button would otherwise add stops to the keyboard
// path of the editor that the `div` before it never had. The public page keeps them all.
$editModeTabIndex = $arParams['EDIT_MODE'] === 'Y' ? ' tabindex="-1"' : '';

foreach ($arParams['WIDGETS'] as $widget) :?>
	<?php if (is_array($widget['show']) && isset($widget['show']['url'])): ?>
		<?php if (is_array($widget['show']['url'])): ?>
			<?php if ($arParams['IS_MOBILE']): ?>
				<a class="<?= $widget['classList'] ?> g-pointer-events-none--edit-mode" target="_blank" href="<?= $widget['show']['url']['mobile'] ?>">
					<?= $widget['title'] ?>
				</a>
			<?php else: ?>
				<button
					type="button"
					class="g-cursor-pointer g-pointer-events-none--edit-mode <?= $widget['classList'] ?>"
					onclick='<?= $widget['show']['js']['desktop'] ?>'
					<?= $editModeTabIndex ?>
				>
					<?= $widget['title'] ?>
				</button>
			<?php endif; ?>
		<?php else: ?>
			<a class="<?= $widget['classList'] ?> g-pointer-events-none--edit-mode" target="_blank" href="<?= $widget['show']['url'] ?>">
				<?= $widget['title'] ?>
			</a>
		<?php endif; ?>

	<?php else: ?>
		<button
			type="button"
			class="g-cursor-pointer g-pointer-events-none--edit-mode <?= $widget['classList'] ?>"
			onclick="<?= $widget['show'] ?>"
			<?= $editModeTabIndex ?>
		>
			<?= $widget['title'] ?>
		</button>
	<?php endif; ?>
<?php endforeach;






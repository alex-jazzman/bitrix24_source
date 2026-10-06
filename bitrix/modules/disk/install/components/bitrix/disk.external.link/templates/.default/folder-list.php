<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

/** @var array $arResult */
/** @var CDiskExternalLinkComponent $component */

use Bitrix\Main\Application;
use Bitrix\Main\HttpRequest;
use Bitrix\Main\Web\Uri;

$items = $arResult['FOLDER_LIST']['ITEMS'];
$currentPage = (int)$arResult['FOLDER_LIST']['CURRENT_PAGE'];
$hasNextPage = (bool)$arResult['FOLDER_LIST']['HAS_NEXT_PAGE'];

$pageUri = new Uri(Application::getInstance()->getContext()->getRequest()->getRequestUri());
$pageUri->deleteParams(HttpRequest::getSystemParameters());
$pageUrl = static fn(int $pageNumber): string => (clone $pageUri)
	->addParams(['pageNumber' => $pageNumber])
	->getPathQuery()
;

// Total pages are unknown: the query asks for one item over the page size, which tells about the
// next page only. So the trail holds the pages already passed and the current one.
$firstPageInTrail = max(1, $currentPage - 2);
?>
<div class="disk-ext-folder-list" data-testid="disk-ext-folder-list">
	<div class="disk-ext-folder-list__scroll" data-testid="disk-ext-folder-list-scroll">
		<?php if (empty($items)): ?>
			<div class="disk-ext-folder-list__empty" data-testid="disk-ext-folder-list-empty">
				<span class="disk-ext-folder-list__empty-icon ui-icon-set --o-folder" aria-hidden="true"></span>
				<span class="disk-ext-folder-list__empty-text">
					<?= $component->getMessage('DISK_EXT_LINK_FOLDER_EMPTY') ?>
				</span>
			</div>
		<?php else: ?>
			<table class="disk-ext-folder-list__table">
				<thead>
					<tr>
						<th class="disk-ext-folder-list__cell --name" scope="col">
							<?= $component->getMessage('DISK_EXT_LINK_FOLDER_COLUMN_NAME') ?>
						</th>
						<th class="disk-ext-folder-list__cell --changed" scope="col">
							<?= $component->getMessage('DISK_EXT_LINK_FILE_UPDATE_TIME') ?>
						</th>
						<th class="disk-ext-folder-list__cell --size" scope="col">
							<?= $component->getMessage('DISK_EXT_LINK_FILE_SIZE') ?>
						</th>
						<th class="disk-ext-folder-list__cell --action" scope="col">
							<span class="disk-ext-folder-list__hidden-label">
								<?= $component->getMessage('DISK_EXT_LINK_FOLDER_COLUMN_ACTIONS') ?>
							</span>
						</th>
					</tr>
				</thead>
				<tbody>
					<?php foreach ($items as $item):
						$name = htmlspecialcharsbx($item['NAME']);
						?>
						<tr class="disk-ext-folder-list__row" data-testid="disk-ext-folder-list-row">
							<td class="disk-ext-folder-list__cell --name">
								<span class="disk-ext-folder-list__object">
									<span
										class="disk-ext-folder-list__icon ui-icon-set --<?= htmlspecialcharsbx($item['ICON_NAME']) ?> --fixed-color"
										aria-hidden="true"
									></span>
									<a
										class="disk-ext-folder-list__link"
										href="<?= htmlspecialcharsbx($item['URL']) ?>"
										title="<?= $name ?>"
										data-testid="disk-ext-folder-list-name"
										<?= $item['VIEWER_ATTRIBUTES'] ?>
									><?= $name ?></a>
								</span>
							</td>
							<td class="disk-ext-folder-list__cell --changed">
								<?= htmlspecialcharsbx($item['UPDATE_TIME']) ?>
							</td>
							<td class="disk-ext-folder-list__cell --size">
								<?= htmlspecialcharsbx($item['FORMATTED_SIZE']) ?>
							</td>
							<td class="disk-ext-folder-list__cell --action">
								<?php if (!$item['IS_FOLDER']): ?>
									<a
										class="disk-ext-folder-list__download ui-icon-set --o-download"
										href="<?= htmlspecialcharsbx($item['URL']) ?>"
										aria-label="<?= htmlspecialcharsbx(
											$component->getMessage(
												'DISK_EXT_LINK_FOLDER_ITEM_DOWNLOAD',
												['#NAME#' => $item['NAME']]
											)
										) ?>"
										data-testid="disk-ext-folder-list-download"
									></a>
								<?php endif; ?>
							</td>
						</tr>
					<?php endforeach; ?>
				</tbody>
			</table>
		<?php endif; ?>
	</div>
	<div class="disk-ext-folder-list__footer">
		<span class="disk-ext-folder-list__total" data-testid="disk-ext-folder-list-total">
			<?= $component->getMessage('DISK_LABEL_GRID_TOTAL') ?>:
			<span class="disk-ext-folder-list__total-value"><?= (int)$arResult['FOLDER_LIST']['TOTAL_COUNT'] ?></span>
		</span>
		<?php if ($currentPage > 1 || $hasNextPage): ?>
			<nav
				class="disk-ext-folder-list__pages"
				aria-label="<?= htmlspecialcharsbx($component->getMessage('DISK_EXT_LINK_FOLDER_PAGES')) ?>"
				data-testid="disk-ext-folder-list-pages"
			>
				<?php if ($currentPage > 1): ?>
					<a
						class="disk-ext-folder-list__page --nav"
						href="<?= htmlspecialcharsbx($pageUrl($currentPage - 1)) ?>"
						rel="prev"
						data-testid="disk-ext-folder-list-page-prev"
					><?= $component->getMessage('DISK_EXT_LINK_FOLDER_PAGE_PREV') ?></a>
				<?php endif; ?>
				<?php if ($firstPageInTrail > 1): ?>
					<a
						class="disk-ext-folder-list__page"
						href="<?= htmlspecialcharsbx($pageUrl(1)) ?>"
						data-testid="disk-ext-folder-list-page"
					>1</a>
					<?php if ($firstPageInTrail > 2): ?>
						<span class="disk-ext-folder-list__page-gap" aria-hidden="true">&hellip;</span>
					<?php endif; ?>
				<?php endif; ?>
				<?php for ($pageNumber = $firstPageInTrail; $pageNumber < $currentPage; $pageNumber++): ?>
					<a
						class="disk-ext-folder-list__page"
						href="<?= htmlspecialcharsbx($pageUrl($pageNumber)) ?>"
						data-testid="disk-ext-folder-list-page"
					><?= $pageNumber ?></a>
				<?php endfor; ?>
				<span
					class="disk-ext-folder-list__page --current"
					data-testid="disk-ext-folder-list-page-current"
					aria-current="page"
				><?= $currentPage ?></span>
				<?php if ($hasNextPage): ?>
					<a
						class="disk-ext-folder-list__page --nav"
						href="<?= htmlspecialcharsbx($pageUrl($currentPage + 1)) ?>"
						rel="next"
						data-testid="disk-ext-folder-list-page-next"
					><?= $component->getMessage('DISK_EXT_LINK_FOLDER_PAGE_NEXT') ?></a>
				<?php endif; ?>
			</nav>
		<?php endif; ?>
	</div>
</div>

<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

/** @var array $arParams */
/** @var array $arResult */

use \Bitrix\Main\Localization\Loc;

Loc::loadMessages(__FILE__);

\Bitrix\Main\UI\Extension::load([
	'ui.icon-set.main',
]);

const DEFAULT_PREVIEW_PATH = 'https://cdn.bitrix24.site/bitrix/images/landing/widget/livefeed/default.jpg';
const USER_LINK_PATH = '/company/personal/user/';

$id = 'widget-' . htmlspecialcharsbx(bin2hex(random_bytes(5)));
if ($arParams['SOCNET_GROUP_ID'] > 0)
{
	$groupLink = '/workgroups/group/' . $arParams['SOCNET_GROUP_ID'] . '/';
}
else
{
	$groupLink = '/workgroups/';
}
$texts = [
	'demoData' => Loc::getMessage('LANDING_WIDGET_LIVEFEED_DEMO_DATA'),
];
$sidebarPosts = array_slice($arResult['POSTS'], 0, 3);
$useDemoData = $arResult['USE_DEMO_DATA'];
$phraseNavigatorButtonViewAll = $arResult['PHRASES']['NAVIGATOR_BUTTON']['VIEW_ALL'];
$phraseNavigatorButtonExtend = $arResult['PHRASES']['NAVIGATOR_BUTTON']['EXTEND'];
?>

<div
	class="landing-widget-livefeed<?= $useDemoData ? ' --demo-data' : '' ?>"
	id="<?= $id ?>"
>
	<div class="landing-widget-view-main">
		<div class="landing-widget-livefeed-title">
			<?= \htmlspecialcharsbx($arResult['TITLE']) ?>
			<?php
			if ($useDemoData): ?>
				<div class="landing-widget-livefeed-badge --yellow">
					<?= $texts['demoData'] ?>
				</div>
			<?php
			endif; ?>
		</div>
		<div class="landing-widget-livefeed-grid landing-widget-content-grid">
			<?php
			foreach ($arResult['POSTS'] as $post): ?>
				<?php
				$user = $arResult['USERS'][$post['AUTHOR_ID']] ?? [];
				$likes = $post['RATING_TOTAL_VOTES'] ?? 0;
				$comments = $post['NUM_COMMENTS'] ?? 0;
				$previewImg = $post['IMG_SRC'] ?? DEFAULT_PREVIEW_PATH;
				$postUrl = $post['PATH'] ?? null;
				$userHrefAttr = '';
				if ($post['AUTHOR_ID'] > 0)
				{
					$userLink = USER_LINK_PATH . $post['AUTHOR_ID'] . '/';
					$userHrefAttr = 'href="' . $userLink . '"';
					$userHrefAttr = 'href="' . $userLink . '"';
				}
				?>
				<div class="landing-widget-livefeed-item">
					<div class="landing-widget-livefeed-preview-box">
						<?php
						if ($post['IMPORTANT'] === true): ?>
							<div class="landing-widget-livefeed-badge"><?= $arResult['PHRASES']['POST_IMPORTANT'] ?></div>
						<?php
						endif; ?>
						<img
							class="landing-widget-livefeed-preview"
							src="<?= $previewImg ?>" alt="<?= \htmlspecialcharsbx($user['NAME']) ?>"
						/>
					</div>
					<div class="landing-widget-livefeed-body">
						<?php if ($postUrl): ?>
							<div class="landing-widget-livefeed-title">
								<a href="<?= $postUrl ?>" target="_blank">
									<?= \htmlspecialcharsbx($post['TITLE']) ?>
								</a>
							</div>
						<?php else: ?>
							<div class="landing-widget-livefeed-title"><?= \htmlspecialcharsbx($post['TITLE']) ?></div>
						<?php endif; ?>
						<div class="landing-widget-livefeed-user-box">
							<?php
								$imgSrc = $user['PERSONAL_PHOTO']['IMG']['src'] ?? '';
							?>
							<?php if ($imgSrc !== ''): ?>
								<a <?= $userHrefAttr ?>>
									<img class="landing-widget-livefeed-user-pic"
										src="<?= $user['PERSONAL_PHOTO']['IMG']['src'] ?>"
										alt="<?= \htmlspecialcharsbx($user['NAME']) ?>"
									>
								</a>
							<?php else: ?>
								<div class="landing-widget-livefeed-user-pic-default"></div>
							<?php endif; ?>
							<a <?= $userHrefAttr ?> class="landing-widget-livefeed-user-text"><?= \htmlspecialcharsbx($user['NAME']) ?></a>
						</div>
						<div class="landing-widget-livefeed-bottom">
							<div class="landing-widget-livefeed-reaction-box">
								<div class="landing-widget-livefeed-reaction-like">
									<div class="ui-icon-set --like landing-widget-livefeed-reaction-like-icon"></div>
									<?= $likes ?>
								</div>
								<div class="landing-widget-livefeed-comments-box">
									<div class="ui-icon-set --chat-message landing-widget-livefeed-comments-icon"></div>
									<div><?= $comments ?></div>
								</div>
							</div>
							<div class="landing-widget-livefeed-date"><?= \htmlspecialcharsbx($post['DATE_PUBLISH']) ?></div>
						</div>
					</div>
				</div>
			<?php
			endforeach; ?>
		</div>
		<div class="landing-widget-livefeed-button-box">
			<button class="landing-widget-button extend-list-button">
				<?= $phraseNavigatorButtonExtend ?>
			</button>
			<button class="landing-widget-button view-all-button hide">
				<?php if (!$useDemoData): ?>
					<a href="<?= $groupLink ?>" target="_blank">
						<?= $phraseNavigatorButtonViewAll ?>
					</a>
				<?php else: ?>
					<div>
						<?= $phraseNavigatorButtonViewAll ?>
					</div>
				<?php endif; ?>
			</button>
		</div>
	</div>

	<div class="landing-widget-view-sidebar">
		<div class="landing-widget-livefeed-title">
			<?= \htmlspecialcharsbx($arResult['TITLE']) ?>
			<?php
			if ($useDemoData): ?>
				<div class="landing-widget-livefeed-badge --yellow">
					<?= $texts['demoData'] ?>
				</div>
			<?php
			endif; ?>
		</div>
		<div class="landing-widget-livefeed-grid landing-widget-content-grid">
			<?php
			foreach ($sidebarPosts as $post): ?>
				<?php
				$user = $arResult['USERS'][$post['AUTHOR_ID']] ?? [];
				$likes = $post['RATING_TOTAL_VOTES'] ?? 0;
				$comments = $post['NUM_COMMENTS'] ?? 0;
				$previewImg = $post['IMG_SRC'] ?? DEFAULT_PREVIEW_PATH;
				$postUrl = $post['PATH'] ?? null;
				$userHrefAttr = '';
				if ($post['AUTHOR_ID'] > 0)
				{
					$userLink = USER_LINK_PATH . $post['AUTHOR_ID'] . '/';
					$userHrefAttr = 'href="' . $userLink . '"';
				}
				?>
				<div class="landing-widget-livefeed-item">
					<div class="landing-widget-livefeed-preview-box">
						<?php
						if ($post['IMPORTANT'] === true): ?>
							<div class="landing-widget-livefeed-badge"><?= $arResult['PHRASES']['POST_IMPORTANT'] ?></div>
						<?php
						endif; ?>
						<div class="landing-widget-livefeed-reaction-box">
							<div class="landing-widget-livefeed-reaction-like">
								<div class="ui-icon-set --like landing-widget-livefeed-reaction-like-icon"></div>
								<?= $likes ?>
							</div>
							<div class="landing-widget-livefeed-comments-box">
								<div class="ui-icon-set --chat-message landing-widget-livefeed-comments-icon"></div>
								<div><?= $comments ?></div>
							</div>
						</div>
						<div class="landing-widget-livefeed-date"><?= \htmlspecialcharsbx($post['DATE_PUBLISH_SHORT']) ?></div>
						<img
							class="landing-widget-livefeed-preview"
							src="<?= $previewImg ?>" alt="<?= \htmlspecialcharsbx($user['NAME']) ?>"
						/>
					</div>
					<div class="landing-widget-livefeed-body">
						<?php if ($postUrl): ?>
							<div class="landing-widget-livefeed-title">
								<a href="<?= $postUrl ?>" target="_blank">
									<?= \htmlspecialcharsbx($post['TITLE']) ?>
								</a>
							</div>
						<?php else: ?>
							<div class="landing-widget-livefeed-title"><?= \htmlspecialcharsbx($post['TITLE']) ?></div>
						<?php endif; ?>
						<div class="landing-widget-livefeed-user-box">
							<?php
							$imgSrc = $user['PERSONAL_PHOTO']['IMG']['src'] ?? '';
							?>
							<?php if ($imgSrc !== ''): ?>
								<a <?= $userHrefAttr ?>>
									<img class="landing-widget-livefeed-user-pic" src="<?= $user['PERSONAL_PHOTO']['IMG']['src'] ?>" alt="<?= \htmlspecialcharsbx($user['NAME']) ?>">
								</a>
							<?php else: ?>
								<div class="landing-widget-livefeed-user-pic-default"></div>
							<?php endif; ?>
							<a <?= $userHrefAttr ?> class="landing-widget-livefeed-user-text"><?= \htmlspecialcharsbx($user['NAME']) ?></a>
						</div>
					</div>
				</div>
			<?php
			endforeach; ?>
		</div>
		<div class="landing-widget-livefeed-button-box">
			<button class="landing-widget-button view-all-button">
				<?php if (!$useDemoData): ?>
					<a href="<?= $groupLink ?>" target="_blank">
						<?= $phraseNavigatorButtonViewAll ?>
					</a>
				<?php else: ?>
					<div>
						<?= $phraseNavigatorButtonViewAll ?>
					</div>
				<?php endif; ?>
			</button>
		</div>
	</div>
</div>

<script>
	BX.ready(function() {
		const editModeElement = document.querySelector('main.landing-edit-mode');
		if (!editModeElement)
		{
			const widgetElement = document.querySelector('#<?= $id ?>');
			if (widgetElement)
			{
				const options = {
					isShowExtendButton: '<?= $arResult['IS_SHOW_EXTEND_BUTTON'] ?>',
				};
				new BX.Landing.Widget.Livefeed(widgetElement, options);
			}
		}
	});
</script>

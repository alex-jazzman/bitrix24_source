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
	// the focus ring of the stylesheet is built from the tokens of this one
	'ui.design-tokens.air',
	'ui.icon-set.main',
]);

const DEFAULT_PREVIEW_PATH = 'https://cdn.bitrix24.site/bitrix/images/landing/widget/livefeed/default.jpg';
const USER_LINK_PATH = '/company/personal/user/';

$id = 'widget-' . htmlspecialcharsbx(bin2hex(random_bytes(5)));
if ((int)($arParams['SOCNET_GROUP_ID'] ?? 0) > 0)
{
	$groupLink = '/workgroups/group/' . (int)$arParams['SOCNET_GROUP_ID'] . '/';
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
$phraseNavigatorButtonViewAll = htmlspecialcharsbx($arResult['PHRASES']['NAVIGATOR_BUTTON']['VIEW_ALL']);
$phraseNavigatorButtonExtend = htmlspecialcharsbx($arResult['PHRASES']['NAVIGATOR_BUTTON']['EXTEND']);

// the locale picks the plural form, and the count - an integer - goes into the encoded phrase;
// a form once encoded is kept for the rest of the list, so the phrase of a counter is read and
// encoded once and not anew on every post; a phrase the locale has none of prints no attributes
// at all: a role over a number with an empty name hides the number instead of naming it
$countNameAttr = function(string $phraseCode, $count): string
{
	static $encodedForms = [];

	$count = (int)$count;
	$form = Loc::getPluralForm($count);
	$phrase = $encodedForms[$phraseCode][$form]
		??= \htmlspecialcharsbx((string)Loc::getMessagePlural($phraseCode, $count));
	if ($phrase === '')
	{
		return '';
	}

	return ' role="img" aria-label="' . \str_replace('#COUNT#', (string)$count, $phrase) . '"';
};

// the warning stands inside the link as text of its own, so it is encoded as text
$newTabHint = \htmlspecialcharsbx((string)Loc::getMessage('LANDING_WIDGET_LIVEFEED_LINK_NEW_TAB'));
?>

<div
	class="landing-widget-livefeed<?= $useDemoData ? ' --demo-data' : '' ?>"
	id="<?= $id ?>"
	data-testid="mainpage-widget-livefeed-root"
>
	<div class="landing-widget-view-main">
		<h2 class="landing-widget-livefeed-title" data-testid="mainpage-widget-livefeed-title">
			<?= \htmlspecialcharsbx($arResult['TITLE']) ?>
			<?php
			if ($useDemoData): ?>
				<span class="landing-widget-livefeed-badge --yellow" data-testid="mainpage-widget-livefeed-demo-badge">
					<?= $texts['demoData'] ?>
				</span>
			<?php
			endif; ?>
		</h2>
		<div class="landing-widget-livefeed-grid landing-widget-content-grid">
			<?php
			foreach ($arResult['POSTS'] as $post): ?>
				<?php
				$user = $arResult['USERS'][$post['AUTHOR_ID']] ?? [];
				$likes = $post['RATING_TOTAL_VOTES'] ?? 0;
				$comments = $post['NUM_COMMENTS'] ?? 0;
				// an icon and a number carry the meaning of a counter by sight alone, so each of
				// them is named for the reader who never sees the icon
				$likesNameAttr = $countNameAttr('LANDING_WIDGET_LIVEFEED_LIKES', $likes);
				$commentsNameAttr = $countNameAttr('LANDING_WIDGET_LIVEFEED_COMMENTS', $comments);
				// the preview only illustrates the post, its text says nothing new: decorative
				$previewImg = \htmlspecialcharsbx((string)($post['IMG_SRC'] ?? DEFAULT_PREVIEW_PATH));
				$postUrl = \htmlspecialcharsbx((string)($post['PATH'] ?? ''));
				// no profile address: plain text, not a link that is announced but cannot be used
				$hasUserLink = (int)($post['AUTHOR_ID'] ?? 0) > 0;
				$userTag = $hasUserLink ? 'a' : 'div';
				$userLinkAttr = $hasUserLink ? ' href="' . USER_LINK_PATH . (int)$post['AUTHOR_ID'] . '/"' : '';
				// the avatar duplicates the profile link beside it: it stays clickable, but leaves
				// the accessibility tree and the keyboard path
				$userPicHiddenAttr = ' aria-hidden="true"' . ($hasUserLink ? ' tabindex="-1"' : '');
				?>
				<div class="landing-widget-livefeed-item" data-testid="mainpage-widget-livefeed-post-item">
					<div class="landing-widget-livefeed-preview-box">
						<?php
						if ($post['IMPORTANT'] === true): ?>
							<div class="landing-widget-livefeed-badge" data-testid="mainpage-widget-livefeed-important-badge">
								<?= $arResult['PHRASES']['POST_IMPORTANT'] ?>
							</div>
						<?php
						endif; ?>
						<img
							class="landing-widget-livefeed-preview"
							src="<?= $previewImg ?>" alt=""
						/>
					</div>
					<div class="landing-widget-livefeed-body">
						<?php if ($postUrl): ?>
							<h3 class="landing-widget-livefeed-body-title">
								<a href="<?= $postUrl ?>" target="_blank" data-testid="mainpage-widget-livefeed-post-link">
									<?= \htmlspecialcharsbx($post['TITLE']) ?>
									<span class="landing-widget-visually-hidden"><?= $newTabHint ?></span>
								</a>
							</h3>
						<?php else: ?>
							<h3 class="landing-widget-livefeed-body-title"><?= \htmlspecialcharsbx($post['TITLE']) ?></h3>
						<?php endif; ?>
						<div class="landing-widget-livefeed-user-box">
							<?php
								$imgSrc = $user['PERSONAL_PHOTO']['IMG']['src'] ?? '';
							?>
							<?php if ($imgSrc !== ''): ?>
								<?= '<' . $userTag . $userLinkAttr . $userPicHiddenAttr . '>' ?>
									<img class="landing-widget-livefeed-user-pic"
										src="<?= \htmlspecialcharsbx($imgSrc) ?>"
										alt="<?= \htmlspecialcharsbx($user['NAME']) ?>"
									>
								<?= '</' . $userTag . '>' ?>
							<?php else: ?>
								<div class="landing-widget-livefeed-user-pic-default"></div>
							<?php endif; ?>
							<?= '<' . $userTag . $userLinkAttr . ' class="landing-widget-livefeed-user-text" data-testid="mainpage-widget-livefeed-author">' . \htmlspecialcharsbx($user['NAME']) . '</' . $userTag . '>' ?>
						</div>
						<div class="landing-widget-livefeed-bottom">
							<div class="landing-widget-livefeed-reaction-box">
								<div class="landing-widget-livefeed-reaction-like"<?= $likesNameAttr ?>>
									<div class="ui-icon-set --like landing-widget-livefeed-reaction-like-icon"></div>
									<?= $likes ?>
								</div>
								<div class="landing-widget-livefeed-comments-box"<?= $commentsNameAttr ?>>
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
			<button type="button" class="landing-widget-button extend-list-button" data-testid="mainpage-widget-livefeed-extend-btn">
				<?= $phraseNavigatorButtonExtend ?>
			</button>
			<?php if (!$useDemoData): ?>
				<a
					class="landing-widget-button view-all-button hide"
					href="<?= $groupLink ?>"
					target="_blank"
					data-testid="mainpage-widget-livefeed-view-all-btn"
				>
					<?= $phraseNavigatorButtonViewAll ?>
					<span class="landing-widget-visually-hidden"><?= $newTabHint ?></span>
				</a>
			<?php endif; ?>
		</div>
	</div>

	<div class="landing-widget-view-sidebar">
		<h2 class="landing-widget-livefeed-title" data-testid="mainpage-widget-livefeed-title">
			<?= \htmlspecialcharsbx($arResult['TITLE']) ?>
			<?php
			if ($useDemoData): ?>
				<span class="landing-widget-livefeed-badge --yellow" data-testid="mainpage-widget-livefeed-demo-badge">
					<?= $texts['demoData'] ?>
				</span>
			<?php
			endif; ?>
		</h2>
		<div class="landing-widget-livefeed-grid landing-widget-content-grid">
			<?php
			foreach ($sidebarPosts as $post): ?>
				<?php
				$user = $arResult['USERS'][$post['AUTHOR_ID']] ?? [];
				$likes = $post['RATING_TOTAL_VOTES'] ?? 0;
				$comments = $post['NUM_COMMENTS'] ?? 0;
				// an icon and a number carry the meaning of a counter by sight alone, so each of
				// them is named for the reader who never sees the icon
				$likesNameAttr = $countNameAttr('LANDING_WIDGET_LIVEFEED_LIKES', $likes);
				$commentsNameAttr = $countNameAttr('LANDING_WIDGET_LIVEFEED_COMMENTS', $comments);
				// the preview only illustrates the post, its text says nothing new: decorative
				$previewImg = \htmlspecialcharsbx((string)($post['IMG_SRC'] ?? DEFAULT_PREVIEW_PATH));
				$postUrl = \htmlspecialcharsbx((string)($post['PATH'] ?? ''));
				// no profile address: plain text, not a link that is announced but cannot be used
				$hasUserLink = (int)($post['AUTHOR_ID'] ?? 0) > 0;
				$userTag = $hasUserLink ? 'a' : 'div';
				$userLinkAttr = $hasUserLink ? ' href="' . USER_LINK_PATH . (int)$post['AUTHOR_ID'] . '/"' : '';
				// the avatar duplicates the profile link beside it: it stays clickable, but leaves
				// the accessibility tree and the keyboard path
				$userPicHiddenAttr = ' aria-hidden="true"' . ($hasUserLink ? ' tabindex="-1"' : '');
				?>
				<div class="landing-widget-livefeed-item" data-testid="mainpage-widget-livefeed-post-item">
					<div class="landing-widget-livefeed-preview-box">
						<?php
						if ($post['IMPORTANT'] === true): ?>
							<div class="landing-widget-livefeed-badge" data-testid="mainpage-widget-livefeed-important-badge">
								<?= $arResult['PHRASES']['POST_IMPORTANT'] ?>
							</div>
						<?php
						endif; ?>
						<div class="landing-widget-livefeed-reaction-box">
							<div class="landing-widget-livefeed-reaction-like"<?= $likesNameAttr ?>>
								<div class="ui-icon-set --like landing-widget-livefeed-reaction-like-icon"></div>
								<?= $likes ?>
							</div>
							<div class="landing-widget-livefeed-comments-box"<?= $commentsNameAttr ?>>
								<div class="ui-icon-set --chat-message landing-widget-livefeed-comments-icon"></div>
								<div><?= $comments ?></div>
							</div>
						</div>
						<div class="landing-widget-livefeed-date"><?= \htmlspecialcharsbx($post['DATE_PUBLISH_SHORT']) ?></div>
						<img
							class="landing-widget-livefeed-preview"
							src="<?= $previewImg ?>" alt=""
						/>
					</div>
					<div class="landing-widget-livefeed-body">
						<?php if ($postUrl): ?>
							<h3 class="landing-widget-livefeed-body-title">
								<a href="<?= $postUrl ?>" target="_blank" data-testid="mainpage-widget-livefeed-post-link">
									<?= \htmlspecialcharsbx($post['TITLE']) ?>
									<span class="landing-widget-visually-hidden"><?= $newTabHint ?></span>
								</a>
							</h3>
						<?php else: ?>
							<h3 class="landing-widget-livefeed-body-title"><?= \htmlspecialcharsbx($post['TITLE']) ?></h3>
						<?php endif; ?>
						<div class="landing-widget-livefeed-user-box">
							<?php
							$imgSrc = $user['PERSONAL_PHOTO']['IMG']['src'] ?? '';
							?>
							<?php if ($imgSrc !== ''): ?>
								<?= '<' . $userTag . $userLinkAttr . $userPicHiddenAttr . '>' ?>
									<img class="landing-widget-livefeed-user-pic" src="<?= \htmlspecialcharsbx($imgSrc) ?>" alt="<?= \htmlspecialcharsbx($user['NAME']) ?>">
								<?= '</' . $userTag . '>' ?>
							<?php else: ?>
								<div class="landing-widget-livefeed-user-pic-default"></div>
							<?php endif; ?>
							<?= '<' . $userTag . $userLinkAttr . ' class="landing-widget-livefeed-user-text" data-testid="mainpage-widget-livefeed-author">' . \htmlspecialcharsbx($user['NAME']) . '</' . $userTag . '>' ?>
						</div>
					</div>
				</div>
			<?php
			endforeach; ?>
		</div>
		<div class="landing-widget-livefeed-button-box">
			<?php if (!$useDemoData): ?>
				<a
					class="landing-widget-button view-all-button"
					href="<?= $groupLink ?>"
					target="_blank"
					data-testid="mainpage-widget-livefeed-view-all-btn"
				>
					<?= $phraseNavigatorButtonViewAll ?>
					<span class="landing-widget-visually-hidden"><?= $newTabHint ?></span>
				</a>
			<?php else: ?>
				<div class="landing-widget-button view-all-button">
					<?= $phraseNavigatorButtonViewAll ?>
				</div>
			<?php endif; ?>
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

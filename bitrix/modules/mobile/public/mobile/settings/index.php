<?php

use Bitrix\Mobile\Feedback\FeedbackFormProvider;

require($_SERVER["DOCUMENT_ROOT"]."/mobile/headers.php");
require($_SERVER["DOCUMENT_ROOT"]."/bitrix/header.php");

$formData = FeedbackFormProvider::getFormData($_REQUEST["formId"]);

$hiddenFields = FeedbackFormProvider::getHiddenFieldsParams($_REQUEST['hiddenFields']);

if (empty($formData)) : ?>
	<span>Form not found</span>
<?php else : ?>
	<script data-b24-form="<?=$formData["data-b24-form"]?>" data-skip-moving="true"> (function (w, d, u) {
			var s = d.createElement('script');
			s.async = false;
			s.src = u + '?' + (Date.now() / 180000 | 0);
			var h = d.getElementsByTagName('script')[0];
			h.parentNode.insertBefore(s, h);
		})(window, document, '<?=$formData["uri"]?>');
	</script>

	<script data-skip-moving="true">
		window.addEventListener('b24:form:init', function(event) {
			let form = event.detail.object;

			<?php if (!empty($hiddenFields)): ?>
			const fieldValues = <?=json_encode($hiddenFields, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_QUOT)?>;
			Object.entries(fieldValues).forEach(([field, value]) => {
				form.setProperty(field, value);
			});
			<?php endif; ?>
		});
		window.addEventListener('b24:form:submit', function(event) {
			let form = event.detail.object;
			const senderPage = 'mobile_rating_drawer';

			if (
				Number(form.identification.id) === <?= $formData['formId'] ?>
				&& '<?= $hiddenFields['sender_page'] ?>' === senderPage
			)
			{
				BXMobileApp.Events.postToComponent('app-feedback:onFeedbackSend', [], 'background');
			}
		});
		window.addEventListener('b24:form:send:success', function(event) {
			let form = event.detail.object;

			if (Number(form.identification.id) === <?= $formData['formId'] ?>)
			{
				setTimeout(() => {
					app.closeModalDialog({ drop: true });
				}, 1000);
			}
		});
	</script>
<?php endif;

require($_SERVER["DOCUMENT_ROOT"]."/bitrix/footer.php");

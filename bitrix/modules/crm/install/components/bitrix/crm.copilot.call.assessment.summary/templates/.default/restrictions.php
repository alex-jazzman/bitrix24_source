<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Crm\Integration\AI\AIManager;
use Bitrix\Crm\Integration\Bitrix24Manager;

if (!Bitrix24Manager::isFeatureEnabled(AIManager::AI_COPILOT_FEATURE_NAME)):
	?>
	<script>
		BX.ready(() => {
			<?= Bitrix24Manager::prepareLicenseInfoHelperScript(['ID' => AIManager::AI_COPILOT_FEATURE_RESTRICTED_SLIDER_CODE]) ?>;

			const slider = top?.BX?.SidePanel?.Instance.getSliderByWindow(window);
			if (slider)
			{
				slider.close();
			}
		});
	</script>
<?php
endif;

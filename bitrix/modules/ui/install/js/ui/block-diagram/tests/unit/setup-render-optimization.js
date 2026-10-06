/**
 * Сеет настройки экстеншна так, как их отдаёт config.php при
 * `Option::get('ui', 'block_diagram_render_optimization') === 'Y'`.
 *
 * `Extension.getSettings()` читает их из `script[data-extension]` в документе и кеширует,
 * а `src/composables/state.js` вычисляет `isRenderOptimizationAvailable` один раз на
 * загрузке модуля. Поэтому посев должен произойти ДО первого импорта state.js — модуль
 * импортируется первой строкой теста ради этого побочного эффекта, restore не нужен.
 */

const EXTENSION_NAME = 'ui.block-diagram';

if (!document.querySelector(`script[data-extension="${EXTENSION_NAME}"]`))
{
	const settingsNode = document.createElement('script');
	settingsNode.type = 'application/json';
	settingsNode.dataset.extension = EXTENSION_NAME;
	settingsNode.textContent = JSON.stringify({ isRenderOptimizationAvailable: 'Y' });
	document.head.append(settingsNode);
}

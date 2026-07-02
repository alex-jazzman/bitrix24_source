import 'im.v2.test';

import { Core } from 'im.v2.application.core';
import { ThemeManager } from 'im.v2.lib.theme';
import {
	SelectableBackgroundId,
	SpecialBackgroundId,
} from '../src/color-scheme';

const IMAGE_FOLDER_PATH = '/bitrix/js/im/images/chat-v2-background';

describe('Lib:ThemeManager', () => {
	describe('getBackgroundStyleById', () => {
		it('should fallback to current background for unknown backgroundId', () => {
			const fakeStore = {
				getters: {
					'application/settings/get': () => SpecialBackgroundId.collab,
				},
			};
			sinon.stub(Core, 'getStore').returns(fakeStore);

			const result = ThemeManager.getBackgroundStyleById('unknownId');
			sinon.restore();

			assert.equal(result.backgroundColor, '#76c68b');
			assert.ok(result.backgroundImage.includes('collab-v2.png'));
		});

		it('should return only backgroundColor for transparent background', () => {
			const result = ThemeManager.getBackgroundStyleById(SpecialBackgroundId.transparent);

			assert.deepStrictEqual(result, {
				backgroundColor: 'transparent',
			});
		});

		it('should return color with pattern and highlight for dark selectable background', () => {
			const result = ThemeManager.getBackgroundStyleById(SelectableBackgroundId.azure);

			assert.equal(result.backgroundColor, '#9fcfff');
			assert.ok(result.backgroundImage.includes('pattern-white-default.svg'));
			assert.ok(result.backgroundImage.includes(`${IMAGE_FOLDER_PATH}/1.png`));
			assert.equal(result.backgroundRepeat, 'repeat, no-repeat');
			assert.equal(result.backgroundSize, 'auto, cover');
		});

		it('should return color with pattern and highlight for light selectable background', () => {
			const result = ThemeManager.getBackgroundStyleById(SelectableBackgroundId.sky);

			assert.equal(result.backgroundColor, '#cfeefa');
			assert.ok(result.backgroundImage.includes('pattern-gray-default.svg'));
			assert.ok(result.backgroundImage.includes(`${IMAGE_FOLDER_PATH}/7.png`));
		});

		it('should use white pattern color for dark theme', () => {
			const result = ThemeManager.getBackgroundStyleById(SelectableBackgroundId.azure);

			assert.ok(result.backgroundImage.includes('pattern-white-'));
		});

		it('should use gray pattern color for light theme', () => {
			const result = ThemeManager.getBackgroundStyleById(SelectableBackgroundId.frost);

			assert.ok(result.backgroundImage.includes('pattern-gray-'));
		});

		it('should use ai-assistant pattern for martaAI background', () => {
			const result = ThemeManager.getBackgroundStyleById(SpecialBackgroundId.martaAI);

			assert.equal(result.backgroundColor, '#0277ff');
			assert.ok(result.backgroundImage.includes('pattern-white-ai-assistant.svg'));
			assert.ok(result.backgroundImage.includes('ai-assistant.png'));
		});

		it('should return correct style for collab background', () => {
			const result = ThemeManager.getBackgroundStyleById(SpecialBackgroundId.collab);

			assert.equal(result.backgroundColor, '#76c68b');
			assert.ok(result.backgroundImage.includes('collab-v2.png'));
		});

		it('should return correct style for aiAssistant background', () => {
			const result = ThemeManager.getBackgroundStyleById(SpecialBackgroundId.aiAssistant);

			assert.equal(result.backgroundColor, '#9294D1');
			assert.ok(result.backgroundImage.includes('ai-assistant-v2.png'));
		});

		it('should have two background layers for backgrounds with pattern and highlight', () => {
			const result = ThemeManager.getBackgroundStyleById(SelectableBackgroundId.azure);

			const images = result.backgroundImage.split(', ');
			const positions = result.backgroundPosition.split(', ');
			const repeats = result.backgroundRepeat.split(', ');
			const sizes = result.backgroundSize.split(', ');

			assert.equal(images.length, 2);
			assert.equal(positions.length, 2);
			assert.equal(repeats.length, 2);
			assert.equal(sizes.length, 2);
		});

		it('should always include backgroundColor', () => {
			const allIds = [
				...Object.values(SelectableBackgroundId),
				...Object.values(SpecialBackgroundId),
			];

			for (const id of allIds)
			{
				const result = ThemeManager.getBackgroundStyleById(id);
				assert.ok(
					result.backgroundColor !== undefined,
					`backgroundColor should be defined for ${id}`,
				);
			}
		});
	});
});

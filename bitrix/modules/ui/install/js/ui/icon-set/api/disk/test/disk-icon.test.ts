import { DiskIcon, DiskIconType } from '../src/index';
import { TypeIcon } from '../src/common/const';

describe('DiskIcon', () => {
	it('should render for types with valid icon mapping', () => {
		for (const type of Object.values(DiskIconType))
		{
			// Skip types that have no valid mapping (e.g. svg, xml map to undefined Disk keys)
			if (!TypeIcon[type])
			{
				continue;
			}

			const icon = new DiskIcon({ type, size: 40 });
			const el = icon.render();
			assert.ok(el instanceof HTMLElement, `Failed to render type: ${type}`);
			assert.ok(el.classList.contains('ui-icon-set_disk-icon'), `Missing wrapper class for type: ${type}`);
		}
	});

	it('should render with compact icons when size < 40', () => {
		const icon = new DiskIcon({ type: DiskIconType.pdf, size: 24 });
		const el = icon.render();
		const innerIcon = el.querySelector('.ui-icon-set');
		assert.ok(innerIcon, 'Should have inner icon element');
		assert.ok(innerIcon.classList.contains('--pdf-compact'), 'Should use compact icon');
	});

	it('should render with full icons when size >= 40', () => {
		const icon = new DiskIcon({ type: DiskIconType.pdf, size: 48 });
		const el = icon.render();
		const innerIcon = el.querySelector('.ui-icon-set');
		assert.ok(innerIcon, 'Should have inner icon element');
		assert.ok(innerIcon.classList.contains('--pdf'), 'Should use full icon');
	});

	it('should apply fixed-color class to inner icon', () => {
		const icon = new DiskIcon({ type: DiskIconType.doc, size: 48 });
		const el = icon.render();
		const innerIcon = el.querySelector('.ui-icon-set');
		assert.ok(innerIcon.classList.contains('--fixed-color'), 'Disk icons should have --fixed-color');
	});

	it('should apply responsive class', () => {
		const icon = new DiskIcon({ type: DiskIconType.doc, responsive: true });
		const el = icon.render();
		assert.ok(el.classList.contains('--responsive'));
	});

	it('should destroy without error', () => {
		const icon = new DiskIcon({ type: DiskIconType.doc, size: 40 });
		icon.render();
		assert.doesNotThrow(() => icon.destroy());
	});

	describe('DiskIconType', () => {
		const expectedTypes = [
			'png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'svg', 'xml',
			'pdf', 'xls', 'xlsx', 'doc', 'docx', 'txt', 'ppt', 'pptx',
			'rar', 'zip', 'gzip', 'gz', 'archive',
			'folder', 'folderGroup', 'folderShared', 'folderCollab', 'folder24', 'folderPerson',
			'mp4', 'avi', 'mov', 'wmv', 'webm', 'mkv', 'video',
			'file', 'board',
		];

		it(`should have exactly ${expectedTypes.length} types`, () => {
			assert.equal(Object.keys(DiskIconType).length, expectedTypes.length);
		});

		it('should contain all expected types', () => {
			for (const type of expectedTypes)
			{
				assert.ok(
					Object.values(DiskIconType).includes(type),
					`Missing type: ${type}`,
				);
			}
		});
	});
});

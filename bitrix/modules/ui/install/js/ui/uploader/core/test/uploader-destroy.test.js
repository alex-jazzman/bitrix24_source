import Uploader from '../src/uploader';

describe('Uploader destroy', () => {
	it('should be destroyed after destroy()', () => {
		const uploader = new Uploader();

		assert.equal(uploader.isDestroyed(), false);
		uploader.destroy();
		assert.equal(uploader.isDestroyed(), true);
	});
});

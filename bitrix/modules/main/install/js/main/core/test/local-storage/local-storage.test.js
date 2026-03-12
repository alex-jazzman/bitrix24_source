import { localStorage } from '../../src/lib/local-storage';

const getNative = (key) => {
	const value = window.localStorage.getItem(localStorage.getPrefix() + key);

	return value ? value.split(':').slice(1).join(':') : null;
};

describe('Local Storage', () => {
	it('Should set values', () => {
		localStorage.set('string', 'my string');
		localStorage.set('number', 456);
		localStorage.set('object', { a: 1, b: '2' });
		localStorage.set('bool', false);
		localStorage.set('bool2', true);
		localStorage.set('array', [1, 2, 3]);
		localStorage.set('array2', [
			{ a: 1, b: '2' },
			{ c: 1, d: true },
			{ e: [1, 2, 3] },
			{ f: { a: 'name' } },
		]);

		assert.equal(localStorage.get('string'), 'my string');
		assert.equal(localStorage.get('number'), 456);
		assert.deepEqual(localStorage.get('object'), { a: 1, b: '2' });
		assert.equal(localStorage.get('bool'), false);
		assert.equal(localStorage.get('bool2'), true);
		assert.deepEqual(localStorage.get('array'), [1, 2, 3]);
		assert.deepEqual(localStorage.get('array2'), [
			{ a: 1, b: '2' },
			{ c: 1, d: true },
			{ e: [1, 2, 3] },
			{ f: { a: 'name' } },
		]);
	});

	it('Should remove values', () => {
		localStorage.set('string2', 'my string2');
		localStorage.set('number2', 1000);
		localStorage.set('object2', { a: 2, c: '32' });

		assert.equal(localStorage.get('string2'), 'my string2');
		assert.equal(localStorage.get('number2'), 1000);
		assert.deepEqual(localStorage.get('object2'), { a: 2, c: '32' });

		localStorage.remove('string2');
		localStorage.remove('number2');
		localStorage.remove('object2');

		assert.equal(localStorage.get('string2'), null);
		assert.equal(localStorage.get('number2'), null);
		assert.deepEqual(localStorage.get('object2'), null);
	});

	it('Should use ttl', function(done) {
		this.timeout(13000);

		localStorage.set('my-ttl-2', 'my-ttl-2', 2);
		localStorage.set('my-ttl-6', 'my-ttl-6', 6);
		localStorage.set('my-ttl-11', 'my-ttl-11', 11);

		assert.equal(localStorage.get('my-ttl-2'), 'my-ttl-2');
		assert.equal(localStorage.get('my-ttl-6'), 'my-ttl-6');
		assert.equal(localStorage.get('my-ttl-11'), 'my-ttl-11');

		assert.equal(getNative('my-ttl-2'), '"my-ttl-2"');
		assert.equal(getNative('my-ttl-6'), '"my-ttl-6"');
		assert.equal(getNative('my-ttl-11'), '"my-ttl-11"');

		setTimeout(() => {
			assert.equal(localStorage.get('my-ttl-2'), null);
			assert.equal(localStorage.get('my-ttl-6'), 'my-ttl-6');
			assert.equal(localStorage.get('my-ttl-11'), 'my-ttl-11');
		}, 4000);

		setTimeout(() => {
			assert.equal(localStorage.get('my-ttl-2'), null);
			assert.equal(getNative('my-ttl-6'), '"my-ttl-6"');
			assert.equal(getNative('my-ttl-11'), '"my-ttl-11"');
		}, 5000);

		setTimeout(() => {
			assert.equal(getNative('my-ttl-2'), null);
			assert.equal(getNative('my-ttl-6'), null);
			assert.equal(getNative('my-ttl-11'), '"my-ttl-11"');
		}, 10500);

		setTimeout(() => {
			assert.equal(localStorage.get('my-ttl-2'), null);
			assert.equal(localStorage.get('my-ttl-6'), null);
			assert.equal(localStorage.get('my-ttl-11'), null);

			done();
		}, 12000);
	});
});

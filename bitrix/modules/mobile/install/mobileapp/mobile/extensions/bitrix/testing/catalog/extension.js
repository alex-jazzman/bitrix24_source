/**
 * @module testing/catalog
 */
jn.define('testing/catalog', (require, exports, module) => {
	const { Type } = require('type');

	function createTestingGroupTestId(groupId)
	{
		const encodedGroupId = Array.from(groupId)
			.map((character) => `c${character.codePointAt(0).toString(16)}`)
			.join('-')
		;

		return `unit-tests-group-${encodedGroupId}`;
	}

	class TestingCatalog
	{
		#manifests = new Map();
		#groups = null;

		registerManifest(manifest)
		{
			const normalizedManifest = this.#normalizeManifest(manifest);
			this.#validateManifest(normalizedManifest);
			this.#validateAgainstRegisteredManifests(normalizedManifest);

			this.#manifests.set(normalizedManifest.module.id, normalizedManifest);
			this.#groups = null;
		}

		getGroups()
		{
			if (this.#groups)
			{
				return this.#groups;
			}

			const manifests = [...this.#manifests.values()];
			const moduleGroups = manifests.map((manifest) => this.#createGroup({
				id: `module:${manifest.module.id}`,
				type: 'module',
				title: manifest.module.title,
				sortOrder: manifest.module.sortOrder,
				tests: manifest.tests,
			}));

			const features = new Map();
			for (const manifest of manifests)
			{
				for (const feature of manifest.features)
				{
					if (!features.has(feature.id))
					{
						features.set(feature.id, { ...feature, tests: [] });
					}

					const featureTests = manifest.tests.filter((test) => test.featureIds.includes(feature.id));
					features.get(feature.id).tests.push(...featureTests);
				}
			}

			const featureGroups = [...features.values()].map((feature) => this.#createGroup({
				id: `feature:${feature.id}`,
				type: 'feature',
				title: feature.title,
				sortOrder: feature.sortOrder,
				tests: feature.tests,
			}));

			const basicTests = manifests.flatMap((manifest) => manifest.tests.filter((test) => test.basic));
			const groups = [...moduleGroups, ...featureGroups];
			if (basicTests.length > 0)
			{
				groups.push(this.#createGroup({
					id: 'basic',
					type: 'basic',
					title: 'Basic',
					sortOrder: 0,
					tests: basicTests,
				}));
			}

			this.#groups = Object.freeze(groups.sort((first, second) => this.#compare(first, second)));

			return this.#groups;
		}

		getGroupsByType(type)
		{
			return this.getGroups().filter((group) => group.type === type);
		}

		getGroup(groupId)
		{
			return this.getGroups().find((group) => group.id === groupId) ?? null;
		}

		#normalizeManifest(manifest)
		{
			if (
				!Type.isPlainObject(manifest)
				|| !Type.isArray(manifest.features)
				|| !Type.isArray(manifest.tests)
			)
			{
				throw new TypeError('Testing manifest must contain feature and test arrays.');
			}

			const moduleData = Type.isPlainObject(manifest.module) ? manifest.module : {};

			return Object.freeze({
				module: Object.freeze({ ...moduleData }),
				features: Object.freeze(manifest.features.map((feature) => Object.freeze({ ...feature }))),
				tests: Object.freeze(manifest.tests.map((test) => Object.freeze({
					...test,
					featureIds: Type.isArray(test.featureIds)
						? Object.freeze([...test.featureIds])
						: test.featureIds,
				}))),
			});
		}

		#validateManifest(manifest)
		{
			this.#validateCatalogItem(manifest.module, 'module');

			const featureIds = new Set();
			for (const feature of manifest.features)
			{
				this.#validateCatalogItem(feature, 'feature');
				this.#assertUnique(featureIds, feature.id, 'feature');
			}

			const testIds = new Set();
			const extensionNames = new Set();
			for (const test of manifest.tests)
			{
				this.#validateTest(test);
				this.#assertUnique(testIds, test.id, 'test');
				this.#assertUnique(extensionNames, test.extensionName, 'extension');

				for (const featureId of test.featureIds)
				{
					if (!featureIds.has(featureId))
					{
						throw new Error(`Unknown feature id: ${featureId}.`);
					}
				}
			}
		}

		#validateAgainstRegisteredManifests(manifest)
		{
			if (this.#manifests.has(manifest.module.id))
			{
				throw new Error(`Module manifest is already registered: ${manifest.module.id}.`);
			}

			for (const registeredManifest of this.#manifests.values())
			{
				for (const test of manifest.tests)
				{
					if (registeredManifest.tests.some((registeredTest) => registeredTest.id === test.id))
					{
						throw new Error(`Test id is already registered: ${test.id}.`);
					}

					if (registeredManifest.tests.some(
						(registeredTest) => registeredTest.extensionName === test.extensionName,
					))
					{
						throw new Error(`Extension is already registered: ${test.extensionName}.`);
					}
				}

				for (const feature of manifest.features)
				{
					const registeredFeature = registeredManifest.features.find((item) => item.id === feature.id);
					if (
						registeredFeature
						&& (
							registeredFeature.title !== feature.title
							|| registeredFeature.sortOrder !== feature.sortOrder
						)
					)
					{
						throw new Error(`Feature metadata conflict: ${feature.id}.`);
					}
				}
			}
		}

		#validateCatalogItem(item, itemType)
		{
			if (
				!Type.isPlainObject(item)
				|| !Type.isStringFilled(item.id)
				|| !Type.isStringFilled(item.title)
				|| !Type.isNumber(item.sortOrder)
			)
			{
				throw new TypeError(`Invalid ${itemType} catalog item.`);
			}
		}

		#validateTest(test)
		{
			if (
				!Type.isPlainObject(test)
				|| !Type.isStringFilled(test.id)
				|| !Type.isStringFilled(test.title)
				|| !Type.isStringFilled(test.extensionName)
				|| !Type.isArray(test.featureIds)
				|| !Type.isBoolean(test.basic)
				|| !Type.isNumber(test.sortOrder)
			)
			{
				throw new TypeError('Invalid test catalog item.');
			}
		}

		#assertUnique(values, value, valueType)
		{
			if (values.has(value))
			{
				throw new Error(`Duplicate ${valueType} id: ${value}.`);
			}

			values.add(value);
		}

		#createGroup({ id, type, title, sortOrder, tests })
		{
			const uniqueTests = [...new Map(tests.map((test) => [test.extensionName, test])).values()]
				.sort((first, second) => this.#compare(first, second))
			;

			return Object.freeze({
				id,
				type,
				title,
				sortOrder,
				tests: Object.freeze(uniqueTests),
				extensionNames: Object.freeze(uniqueTests.map((test) => test.extensionName)),
			});
		}

		#compare(first, second)
		{
			return first.sortOrder - second.sortOrder || first.id.localeCompare(second.id);
		}
	}

	const testingCatalog = new TestingCatalog();

	module.exports = { TestingCatalog, createTestingGroupTestId, testingCatalog };
});

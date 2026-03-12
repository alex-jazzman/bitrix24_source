import 'tasks.v2.test';
import { CheckListChangeTracker } from '../src/lib/check-list-change-tracker';
import { CheckListManager } from '../src/lib/check-list-manager';

import {
	createCheckListItem,
	createDemoCheckLists,
} from './check-list-data';

describe('CheckListChangeTracker', () => {
	it('Should be a function', () => {
		assert(typeof CheckListChangeTracker === 'function');
	});

	describe('Create without data', () => {
		let tracker;

		beforeEach(() => {
			tracker = new CheckListChangeTracker();
		});

		it('Should not throw if data is not object', () => {
			assert.doesNotThrow(() => {
				tracker = new CheckListChangeTracker();
			});
		});

		it('Should not be initialized by default', () => {
			assert.strictEqual(tracker.isInitialized(), false);
		});

		it('Should return false for hasChanges when not initialized', () => {
			assert.strictEqual(tracker.hasChanges(), false);
		});

		it('Should return 0 for getLastUpdatedCheckListId when not initialized', () => {
			const mockGetRootParent = () => null;
			assert.strictEqual(tracker.getLastUpdatedCheckListId(mockGetRootParent), 0);
		});
	});

	describe('Create with data', () => {
		let tracker;
		let checkLists;
		let manager;

		beforeEach(() => {
			checkLists = createDemoCheckLists();
			tracker = new CheckListChangeTracker({
				computed: {
					checkLists: () => checkLists,
				},
			});
			manager = new CheckListManager({
				computed: {
					checkLists: () => checkLists,
				},
			});
		});

		describe('createSnapshot and isInitialized', () => {
			it('should initialize tracker after createSnapshot', () => {
				tracker.createSnapshot();
				assert.strictEqual(tracker.isInitialized(), true);
			});

			it('should create snapshot with all items', () => {
				tracker.createSnapshot();
				assert.strictEqual(tracker.hasChanges(), false);
			});

			it('should handle empty checkLists', () => {
				const emptyTracker = new CheckListChangeTracker({
					computed: {
						checkLists: () => [],
					},
				});
				emptyTracker.createSnapshot();
				assert.strictEqual(emptyTracker.isInitialized(), true);
				assert.strictEqual(emptyTracker.hasChanges(), false);
			});
		});

		describe('hasChanges - no changes', () => {
			beforeEach(() => {
				tracker.createSnapshot();
			});

			it('should return false when no changes made', () => {
				assert.strictEqual(tracker.hasChanges(), false);
			});

			it('should return false when snapshot is recreated with same data', () => {
				tracker.createSnapshot();
				assert.strictEqual(tracker.hasChanges(), false);
			});
		});

		describe('hasChanges - item addition', () => {
			beforeEach(() => {
				tracker.createSnapshot();
			});

			it('should detect new root item added', () => {
				const newItem = createCheckListItem(0, { title: 'New Root Item' });
				checkLists.push(newItem);

				assert.strictEqual(tracker.hasChanges(), true);
			});

			it('should detect new child item added', () => {
				const rootItem = checkLists.find(item => item.parentId === 0);
				const newChild = createCheckListItem(rootItem.id, { title: 'New Child' });
				checkLists.push(newChild);

				assert.strictEqual(tracker.hasChanges(), true);
			});
		});

		describe('hasChanges - item removal', () => {
			beforeEach(() => {
				tracker.createSnapshot();
			});

			it('should detect root item removed', () => {
				const rootItem = checkLists.find(item => item.parentId === 0);
				const index = checkLists.indexOf(rootItem);
				checkLists.splice(index, 1);

				assert.strictEqual(tracker.hasChanges(), true);
			});

			it('should detect child item removed', () => {
				const childItem = checkLists.find(item => item.parentId !== 0);
				const index = checkLists.indexOf(childItem);
				checkLists.splice(index, 1);

				assert.strictEqual(tracker.hasChanges(), true);
			});
		});

		describe('hasChanges - property changes', () => {
			beforeEach(() => {
				tracker.createSnapshot();
			});

			it('should detect title change', () => {
				const item = checkLists[0];
				item.title = 'Changed Title';

				assert.strictEqual(tracker.hasChanges(), true);
			});

			it('should detect parentId change', () => {
				const rootItem = checkLists.find(item => item.parentId === 0);
				const childItem = checkLists.find(item => item.parentId !== 0);
				if (childItem && rootItem)
				{
					const newParentId = checkLists.find(
						item => item.parentId === 0 && item.id !== rootItem.id,
					)?.id;
					if (newParentId)
					{
						childItem.parentId = newParentId;
						assert.strictEqual(tracker.hasChanges(), true);
					}
				}
			});

			it('should detect sortIndex change', () => {
				const item = checkLists[0];
				item.sortIndex = 999;

				assert.strictEqual(tracker.hasChanges(), true);
			});

			it('should detect isImportant change', () => {
				const item = checkLists[0];
				item.isImportant = !item.isImportant;

				assert.strictEqual(tracker.hasChanges(), true);
			});

			it('should detect isComplete change', () => {
				const item = checkLists[0];
				item.isComplete = !item.isComplete;

				assert.strictEqual(tracker.hasChanges(), true);
			});
		});

		describe('hasChanges - array changes', () => {
			beforeEach(() => {
				tracker.createSnapshot();
			});

			it('should detect accomplices addition', () => {
				const item = checkLists[0];
				item.accomplices = [
					{ id: 123, name: 'Test User', image: '', type: 'employee' },
				];

				assert.strictEqual(tracker.hasChanges(), true);
			});

			it('should detect accomplices removal', () => {
				const item = checkLists[0];
				item.accomplices = [
					{ id: 123, name: 'Test User', image: '', type: 'employee' },
				];
				tracker.createSnapshot();

				item.accomplices = [];

				assert.strictEqual(tracker.hasChanges(), true);
			});

			it('should detect accomplices change', () => {
				const item = checkLists[0];
				item.accomplices = [
					{ id: 123, name: 'Test User', image: '', type: 'employee' },
				];
				tracker.createSnapshot();

				item.accomplices = [
					{ id: 456, name: 'Other User', image: '', type: 'employee' },
				];

				assert.strictEqual(tracker.hasChanges(), true);
			});

			it('should detect auditors addition', () => {
				const item = checkLists[0];
				item.auditors = [
					{ id: 123, name: 'Test User', image: '', type: 'employee' },
				];

				assert.strictEqual(tracker.hasChanges(), true);
			});

			it('should detect auditors removal', () => {
				const item = checkLists[0];
				item.auditors = [
					{ id: 123, name: 'Test User', image: '', type: 'employee' },
				];
				tracker.createSnapshot();

				item.auditors = [];

				assert.strictEqual(tracker.hasChanges(), true);
			});

			it('should detect attachments addition', () => {
				const item = checkLists[0];
				item.attachments = [
					{ id: 1, name: 'file.pdf', size: 1024 },
				];

				assert.strictEqual(tracker.hasChanges(), true);
			});

			it('should detect attachments removal', () => {
				const item = checkLists[0];
				item.attachments = [
					{ id: 1, name: 'file.pdf', size: 1024 },
				];
				tracker.createSnapshot();

				item.attachments = [];

				assert.strictEqual(tracker.hasChanges(), true);
			});

			it('should not detect changes when arrays are same', () => {
				const item = checkLists[0];
				item.accomplices = [
					{ id: 123, name: 'Test User', image: '', type: 'employee' },
				];
				tracker.createSnapshot();

				// Same array content
				item.accomplices = [
					{ id: 123, name: 'Test User', image: '', type: 'employee' },
				];

				assert.strictEqual(tracker.hasChanges(), false);
			});
		});

		describe('hasChanges - structure changes', () => {
			beforeEach(() => {
				tracker.createSnapshot();
			});

			it('should detect when child is added to item', () => {
				const rootItem = checkLists.find(item => item.parentId === 0);
				const newChild = createCheckListItem(rootItem.id, { title: 'New Child' });
				checkLists.push(newChild);

				assert.strictEqual(tracker.hasChanges(), true);
			});

			it('should detect when child is removed from item', () => {
				const rootItem = checkLists.find(item => item.parentId === 0);
				const childItem = checkLists.find(item => item.parentId === rootItem.id);
				if (childItem)
				{
					const index = checkLists.indexOf(childItem);
					checkLists.splice(index, 1);

					assert.strictEqual(tracker.hasChanges(), true);
				}
			});

			it('should detect when child is moved to different parent', () => {
				const rootItems = checkLists.filter(item => item.parentId === 0);
				if (rootItems.length >= 2)
				{
					const childItem = checkLists.find(item => item.parentId === rootItems[0].id);
					if (childItem)
					{
						childItem.parentId = rootItems[1].id;
						assert.strictEqual(tracker.hasChanges(), true);
					}
				}
			});
		});

		describe('getLastUpdatedCheckListId', () => {
			beforeEach(() => {
				tracker.createSnapshot();
			});

			it('should return 0 when no changes', () => {
				const getRootParent = (id) => manager.getRootParentByChildId(id);
				assert.strictEqual(tracker.getLastUpdatedCheckListId(getRootParent), 0);
			});

			it('should return root parent id when child item changed', () => {
				const rootItem = checkLists.find(item => item.parentId === 0);
				const childItem = checkLists.find(item => item.parentId === rootItem.id);
				if (childItem)
				{
					childItem.title = 'Changed Title';

					const getRootParent = (id) => manager.getRootParentByChildId(id);
					const result = tracker.getLastUpdatedCheckListId(getRootParent);

					assert.strictEqual(result, rootItem.id);
				}
			});

			it('should return root item id when root item changed', () => {
				const rootItem = checkLists.find(item => item.parentId === 0);
				rootItem.title = 'Changed Title';

				const getRootParent = (id) => manager.getRootParentByChildId(id);
				const result = tracker.getLastUpdatedCheckListId(getRootParent);

				assert.strictEqual(result, rootItem.id);
			});

			it('should return 0 when changed item has no root parent', () => {
				const orphanItem = createCheckListItem('non-existent', { id: 'orphan' });
				checkLists.push(orphanItem);
				tracker.createSnapshot();

				orphanItem.title = 'Changed';

				const getRootParent = (id) => {
					if (id === 'orphan')
					{
						return null;
					}

					return manager.getRootParentByChildId(id);
				};
				const result = tracker.getLastUpdatedCheckListId(getRootParent);

				assert.strictEqual(result, 0);
			});

			it('should return first changed item root parent', () => {
				const rootItems = checkLists.filter(item => item.parentId === 0);
				if (rootItems.length >= 2)
				{
					rootItems[0].title = 'Changed 1';
					rootItems[1].title = 'Changed 2';

					const getRootParent = (id) => manager.getRootParentByChildId(id);
					const result = tracker.getLastUpdatedCheckListId(getRootParent);

					// Should return first changed item's root parent
					assert(result === rootItems[0].id || result === rootItems[1].id);
				}
			});
		});

		describe('reset', () => {
			beforeEach(() => {
				tracker.createSnapshot();
			});

			it('should reset snapshot and clear changes', () => {
				const item = checkLists[0];
				item.title = 'Changed Title';

				assert.strictEqual(tracker.hasChanges(), true);

				tracker.reset();

				assert.strictEqual(tracker.hasChanges(), false);
				assert.strictEqual(tracker.isInitialized(), true);
			});

			it('should create new snapshot after reset', () => {
				const item = checkLists[0];
				item.title = 'Changed Title';

				tracker.reset();

				// After reset, snapshot contains 'Changed Title', so changing it again should be detected
				item.title = 'Another Changed Title';
				assert.strictEqual(tracker.hasChanges(), true);

				// Reset again and verify no changes
				tracker.reset();
				assert.strictEqual(tracker.hasChanges(), false);
			});

			it('should handle reset with new items added', () => {
				const newItem = createCheckListItem(0, { title: 'New Item' });
				checkLists.push(newItem);

				assert.strictEqual(tracker.hasChanges(), true);

				tracker.reset();

				assert.strictEqual(tracker.hasChanges(), false);
			});
		});

		describe('edge cases', () => {
			beforeEach(() => {
				tracker.createSnapshot();
			});

			it('should handle undefined/null values in properties', () => {
				const item = checkLists[0];
				item.title = undefined;
				item.parentId = null;

				assert.strictEqual(tracker.hasChanges(), true);
			});

			it('should handle empty strings', () => {
				const item = checkLists[0];
				const originalTitle = item.title;
				item.title = '';

				assert.strictEqual(tracker.hasChanges(), true);

				item.title = originalTitle;
				tracker.createSnapshot();

				item.title = '';
				assert.strictEqual(tracker.hasChanges(), true);
			});

			it('should handle multiple property changes', () => {
				const item = checkLists[0];
				item.title = 'New Title';
				item.isImportant = true;
				item.isComplete = true;
				item.sortIndex = 999;

				assert.strictEqual(tracker.hasChanges(), true);
			});

			it('should handle complex nested structure changes', () => {
				const rootItem = checkLists.find(item => item.parentId === 0);
				const childItem = checkLists.find(item => item.parentId === rootItem.id);
				if (childItem)
				{
					// Change child
					childItem.title = 'Changed Child';
					// Add new child to root
					const newChild = createCheckListItem(rootItem.id, { title: 'New Child' });
					checkLists.push(newChild);
					// Change root
					rootItem.title = 'Changed Root';

					assert.strictEqual(tracker.hasChanges(), true);
				}
			});

			it('should handle items with same properties but different order', () => {
				const rootItem = checkLists.find(item => item.parentId === 0);
				const children = checkLists.filter(item => item.parentId === rootItem.id);
				if (children.length >= 2)
				{
					// Ensure children have different sortIndex values
					children[0].sortIndex = 0;
					children[1].sortIndex = 1;
					tracker.createSnapshot();

					// Swap sortIndex - both items change their sortIndex
					children[0].sortIndex = 1;
					children[1].sortIndex = 0;

					// Both items have changed their sortIndex, so changes should be detected
					assert.strictEqual(tracker.hasChanges(), true);
				}
			});

			it('should handle arrays with same IDs but different order', () => {
				const item = checkLists[0];
				item.accomplices = [
					{ id: 123, name: 'User 1', image: '', type: 'employee' },
					{ id: 456, name: 'User 2', image: '', type: 'employee' },
				];
				tracker.createSnapshot();

				// Same IDs, different order
				item.accomplices = [
					{ id: 456, name: 'User 2', image: '', type: 'employee' },
					{ id: 123, name: 'User 1', image: '', type: 'employee' },
				];

				// Should not detect as change (we compare by IDs only)
				assert.strictEqual(tracker.hasChanges(), false);
			});
		});

		describe('integration with CheckListManager', () => {
			beforeEach(() => {
				tracker.createSnapshot();
			});

			it('should work correctly with getRootParentByChildId from manager', () => {
				const rootItem = checkLists.find(item => item.parentId === 0);
				const childItem = checkLists.find(item => item.parentId === rootItem.id);
				if (childItem)
				{
					childItem.title = 'Changed';

					const getRootParent = (id) => manager.getRootParentByChildId(id);
					const result = tracker.getLastUpdatedCheckListId(getRootParent);

					assert.strictEqual(result, rootItem.id);
				}
			});

			it('should handle deep nesting correctly', () => {
				const rootItem = checkLists.find(item => item.parentId === 0);
				const childItem = checkLists.find(item => item.parentId === rootItem.id);
				const nestedItem = checkLists.find(item => item.parentId === childItem?.id);

				if (nestedItem)
				{
					nestedItem.title = 'Changed Nested';

					const getRootParent = (id) => manager.getRootParentByChildId(id);
					const result = tracker.getLastUpdatedCheckListId(getRootParent);

					assert.strictEqual(result, rootItem.id);
				}
			});
		});
	});
});

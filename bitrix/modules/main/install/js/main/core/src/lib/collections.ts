import OrderedArray from './collections/ordered-array';
import SettingsCollection from './extension/internal/settings-collection';
import WeakRefMap from './collections/weak-ref-map';

type CollectionsLibrary = {
	OrderedArray: typeof OrderedArray,
	SettingsCollection: typeof SettingsCollection,
	WeakRefMap: typeof WeakRefMap,
};

const collections: CollectionsLibrary = {
	OrderedArray,
	SettingsCollection,
	WeakRefMap,
};

export default collections;

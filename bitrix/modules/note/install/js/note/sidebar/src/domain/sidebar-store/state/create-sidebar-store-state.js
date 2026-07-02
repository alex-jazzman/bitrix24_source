import { reactive, ref } from 'ui.vue3';

export class SidebarStoreState
{
	constructor()
	{
		this.collections = ref([]);
		this.collectionsLoading = ref(false);
		this.collectionsCursor = ref(null);
		this.collectionsHasNextPage = ref(true);
		this.globalPermissions = reactive({
			canEditCollections: false,
			canEditGlobalPermissions: false,
			canImport: false,
			hasManageableCollection: false,
		});
		this.selectedCollectionId = ref(null);
		this.selectedDocId = ref(null);
		this.selectedSharedView = ref(false);
		this.selectedArchiveView = ref(false);
		this.selectedRecycleBinView = ref(false);
		this.expandedDocs = reactive({});
		this.docsByParent = reactive({});
		this.docsLoadingByParent = reactive({});
		this.docsHasNextPageByParent = reactive({});
		this.docsOffsetByParent = reactive({});
		this.docsCursorByParent = reactive({});
		this.docsHydratedByParent = reactive({});
		this.docsStaleByParent = reactive({});
		this.docsRequestByParent = {};
	}
}

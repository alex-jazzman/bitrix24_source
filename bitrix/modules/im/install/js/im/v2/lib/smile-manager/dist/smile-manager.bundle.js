/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports, main_core, ui_dexie, im_v2_application_core, im_v2_const, im_v2_lib_localStorage) {
	'use strict';

	const sets = ['id', 'parentId', 'name', 'type', 'image', 'selected'].join(',');
	const smiles = ['id', 'setId', 'name', 'image', 'typing', 'width', 'height', 'definition', 'alternative'].join(',');
	const CACHE_VERSION = 4;
	class SmileManager {
		static #instance;
		#smileList;
		#db;
		#restClient;
		#localStorageManager;
		#lastUpdateTime;
		#recentEmoji;
		static getInstance() {
			SmileManager.#instance = SmileManager.#instance ?? new SmileManager();
			return SmileManager.#instance;
		}
		static init() {
			SmileManager.getInstance().initSmileList();
		}
		constructor() {
			this.#db = new ui_dexie.Dexie('bx-im-smiles');
			this.#db.version(2).stores({
				sets,
				smiles,
				recentEmoji: ',symbols'
			});
			this.#restClient = im_v2_application_core.Core.getRestClient();
			this.#localStorageManager = im_v2_lib_localStorage.LocalStorageManager.getInstance();
			const {
				lastUpdate
			} = main_core.Extension.getSettings('im.v2.lib.smile-manager');
			this.#lastUpdateTime = Date.parse(lastUpdate) + CACHE_VERSION;
			// for debug purpose only
			// this.#lastUpdateTime = Date.now();
			this.#recentEmoji = new Set();
		}
		async #fetchDataFromServer() {
			const result = await this.#restClient.callMethod(im_v2_const.RestMethod.imSmilesGet, {
				FULL_TYPINGS: 'Y'
			});
			const data = result.data();
			const smileList = [];
			data.smiles.forEach(smile => {
				const list = smile.typing.split(' ');
				let alternative = true;
				list.forEach(code => {
					smileList.push({
						...smile,
						typing: code,
						id: smileList.length,
						alternative
					});
					alternative = false;
				});
			});
			const setList = data.sets.map(set => {
				const firstSmileInSet = smileList.find(smile => smile.setId === set.id);
				const {
					image
				} = firstSmileInSet;
				return {
					...set,
					image
				};
			});
			return {
				sets: setList,
				smiles: smileList
			};
		}
		async #fetchDataFromStorage() {
			const {
				sets: setsTbl,
				smiles: smilesTbl
			} = this.#db;
			const data = await this.#db.transaction('r', setsTbl, smilesTbl, async () => {
				const [sets, smiles] = await Promise.all([setsTbl.toArray(), smilesTbl.toArray()]);
				return {
					sets,
					smiles
				};
			});
			return data;
		}
		async #fillStorage(smileList) {
			const {
				sets,
				smiles
			} = smileList;
			const setsToSave = sets.map(set => ({
				...set,
				selected: 0
			}));
			setsToSave[0].selected = 1;
			await Promise.all([this.#db.smiles.clear(), this.#db.sets.clear()]);
			await Promise.all([this.#db.sets.bulkAdd(setsToSave), this.#db.smiles.bulkAdd(smiles)]);
			this.#smileList = {
				...this.#smileList,
				sets: setsToSave
			};
		}
		#shouldRequestFromServer() {
			const lastUpdateTimeFromStorage = this.#localStorageManager.get(im_v2_const.LocalStorageKey.smileLastUpdateTime);
			const shouldRequestFromServer = this.#lastUpdateTime !== lastUpdateTimeFromStorage;
			return shouldRequestFromServer;
		}
		async #loadRecentEmoji() {
			const storageData = await this.#db.recentEmoji.get(0);
			this.#recentEmoji = storageData?.symbols ?? this.#recentEmoji;
		}
		async initSmileList() {
			try {
				const shouldRequestFromServer = this.#shouldRequestFromServer();
				if (shouldRequestFromServer) {
					this.#smileList = await this.#fetchDataFromServer();
					await this.#fillStorage(this.#smileList);
					this.#localStorageManager.set(im_v2_const.LocalStorageKey.smileLastUpdateTime, this.#lastUpdateTime);
				} else {
					this.#smileList = await this.#fetchDataFromStorage();
				}
				await this.#loadRecentEmoji();
			} catch (err) {
				console.error('Smile Manager data fetch error:', err);
				this.#localStorageManager.remove(im_v2_const.LocalStorageKey.smileLastUpdateTime);
			}
		}
		async updateSelectedSet(selectedSetId) {
			const setsDB = this.#db.sets;
			await setsDB.toCollection().modify(set => {
				set.selected = set.id === selectedSetId ? 1 : 0;
			});
			const sets = this.#smileList.sets;
			this.#smileList.sets = sets.map(set => {
				if (set.id === selectedSetId) {
					return {
						...set,
						selected: 1
					};
				}
				return {
					...set,
					selected: 0
				};
			});
		}
		async updateRecentEmoji(symbols) {
			await this.#db.recentEmoji.put({
				symbols
			}, 0);
			this.#recentEmoji = symbols;
		}
		get smileList() {
			return this.#smileList;
		}
		get recentEmoji() {
			return this.#recentEmoji;
		}
	}

	exports.SmileManager = SmileManager;

})(this.BX.Messenger.v2.Lib = this.BX.Messenger.v2.Lib || {}, BX, BX.DexieExport, BX.Messenger.v2.Application, BX.Messenger.v2.Const, BX.Messenger.v2.Lib);
//# sourceMappingURL=smile-manager.bundle.js.map

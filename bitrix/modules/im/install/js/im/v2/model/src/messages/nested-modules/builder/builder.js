import { Type, type JsonObject } from 'main.core';
import { BuilderModel, type Store, type ActionTree, type GetterTree, type MutationTree } from 'ui.vue3.vuex';

import { MessageBuilderBackgroundPlainToken } from 'im.v2.const';
import { formatFieldsWithConfig } from 'im.v2.model';

import { builderFieldsConfig, blocksBuilderFieldsConfig } from './field-config';

type RawBuilderMessage = {
	id: number,
	block: {
		config: BlocksBuilderParams,
		elements: Block[],
	},
};

type BlocksBuilderParams = {
	background: MessageBuilderBackgroundPlainToken | null,
};

type Block = {
	id: string | number,
	type: string,
	text: string,
};

type BuilderState = {
	builderCollection: Map<number, BlocksBuilderParams>,
	blockCollection: Map<number, Block[]>,
};

export class MessageBuilderModel extends BuilderModel
{
	getName(): string
	{
		return 'messageBuilder';
	}

	getState(): BuilderState
	{
		return {
			builderCollection: new Map(),
			blockCollection: new Map(),
		};
	}

	getBuilderElementState(): BlocksBuilderParams
	{
		return {
			background: null,
		};
	}

	getBlockElementState(): Block
	{
		return {
			id: '',
			type: '',
			text: '',
		};
	}

	getGetters(): GetterTree
	{
		return {
			/** @function messages/builder/hasBlocks */
			hasBlocks: (state: BuilderState) => (messageId: number): boolean => {
				return Type.isArrayFilled(state.blockCollection.get(messageId));
			},
			/** @function messages/builder/getBlocks */
			getBlocks: (state: BuilderState) => (messageId: number): Block[] => {
				return state.blockCollection.get(messageId) ?? [];
			},
			/** @function messages/builder/getParams */
			getParams: (state: BuilderState) => (messageId: number): BlocksBuilderParams => {
				return state.builderCollection.get(messageId) ?? { background: null };
			},
			/** @function messages/builder/forceBackground */
			forceBackground: (state: BuilderState) => (messageId: number): boolean => {
				const params = state.builderCollection.get(messageId);

				return params?.background === MessageBuilderBackgroundPlainToken;
			},
		};
	}

	getActions(): ActionTree
	{
		return {
			/** @function messages/builder/set */
			set: (store: Store, rawMessages: RawBuilderMessage | RawBuilderMessage[]) => {
				const messages = Type.isArray(rawMessages) ? rawMessages : [rawMessages];
				const builderMessages = messages.filter((message) => message.block);

				builderMessages.forEach((builderMessage) => {
					const { id: messageId, block } = builderMessage;
					const preparedBuilder = this.#formatFields(block);
					const { elements, config } = preparedBuilder;

					store.commit('addBuilder', {
						messageId,
						params: { ...this.getBuilderElementState(), ...config },
					});

					const preparedBlocks = elements.map((element) => {
						return { ...this.getBlockElementState(), ...element };
					});

					store.commit('addBlocks', { messageId, blocks: preparedBlocks });
				});
			},
			/** @function messages/builder/appendBlock */
			appendBlock: (store: Store, payload: { messageId: number, block: Block }) => {
				const { messageId, block } = payload;
				const preparedBlock = this.#formatBlock(block);
				store.commit('appendBlock', { messageId, block: preparedBlock });
			},
			/** @function messages/builder/updateBlock */
			updateBlock: (store: Store, payload: { messageId: number, blockId: Block['id'], block: Block }) => {
				const { messageId, blockId, block } = payload;
				const preparedBlock = this.#formatBlock(block);
				store.commit('updateBlock', { messageId, blockId, block: preparedBlock });
			},
			/** @function messages/builder/deleteBlock */
			deleteBlock: (store: Store, payload: { messageId: number, blockId: Block['id'] }) => {
				const { messageId, blockId } = payload;
				store.commit('deleteBlock', { messageId, blockId });
			},
			/** @function messages/builder/updateWithId */
			updateWithId: (store: Store, payload: { oldId: number | string, newId: number | string }) => {
				const { oldId, newId } = payload;
				if (!store.state.blockCollection.has(oldId) && !store.state.builderCollection.has(oldId))
				{
					return;
				}

				store.commit('updateWithId', { oldId, newId });
			},
		};
	}

	getMutations(): MutationTree
	{
		return {
			addBuilder: (state: BuilderState, payload: { messageId: number, params: BlocksBuilderParams }) => {
				const { messageId, params } = payload;
				state.builderCollection.set(messageId, params);
			},
			addBlocks: (state: BuilderState, payload: { messageId: number, blocks: Block[] }) => {
				const { messageId, blocks } = payload;
				state.blockCollection.set(messageId, blocks);
			},
			appendBlock: (state: BuilderState, payload: { messageId: number, block: Block }) => {
				const { messageId, block } = payload;
				const blocks = state.blockCollection.get(messageId) ?? [];
				blocks.push(block);
				state.blockCollection.set(messageId, blocks);
			},
			updateBlock: (state: BuilderState, payload: { messageId: number, blockId: Block['id'], block: Block }) => {
				const { messageId, blockId, block } = payload;
				const blocks = state.blockCollection.get(messageId);
				if (!blocks)
				{
					return;
				}

				const index = blocks.findIndex((item) => item.id === blockId);
				if (index === -1)
				{
					return;
				}

				blocks.splice(index, 1, block);
			},
			deleteBlock: (state: BuilderState, payload: { messageId: number, blockId: Block['id'] }) => {
				const { messageId, blockId } = payload;
				const blocks = state.blockCollection.get(messageId);
				if (!blocks)
				{
					return;
				}

				const filtered = blocks.filter((item) => item.id !== blockId);
				state.blockCollection.set(messageId, filtered);
			},
			updateWithId: (state: BuilderState, payload: { oldId: number | string, newId: number | string }) => {
				const { oldId, newId } = payload;

				if (state.blockCollection.has(oldId))
				{
					state.blockCollection.set(newId, state.blockCollection.get(oldId));
					state.blockCollection.delete(oldId);
				}

				if (state.builderCollection.has(oldId))
				{
					state.builderCollection.set(newId, state.builderCollection.get(oldId));
					state.builderCollection.delete(oldId);
				}
			},
		};
	}

	#formatFields(item: JsonObject): JsonObject
	{
		return formatFieldsWithConfig(item, builderFieldsConfig);
	}

	#formatBlock(block: JsonObject): Block
	{
		return { ...this.getBlockElementState(), ...formatFieldsWithConfig(block, blocksBuilderFieldsConfig) };
	}
}

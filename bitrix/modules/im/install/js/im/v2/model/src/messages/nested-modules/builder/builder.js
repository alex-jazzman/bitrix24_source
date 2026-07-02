import { Type, type JsonObject } from 'main.core';
import { BuilderModel, type Store, type ActionTree, type GetterTree, type MutationTree } from 'ui.vue3.vuex';

import { formatFieldsWithConfig } from 'im.v2.model';

import { builderFieldsConfig, blocksBuilderFieldsConfig } from './field-config';

type RawBuilderMessage = {
	id: number,
	builder: {
		blocks: Block[]
	},
};

type BlocksBuilderParams = {
	// here can be some params for builder, for example, background color, side line color etc.
};

type RawBlocksBuilder = {
	messageId: number,
	blocks: Block,
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

/* eslint-disable no-param-reassign */
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
		return {};
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
		};
	}

	getActions(): ActionTree
	{
		return {
			/** @function messages/builder/set */
			set: (store: Store, rawMessages: RawBuilderMessage | RawBuilderMessage[]) => {
				const messages = Type.isArray(rawMessages) ? rawMessages : [rawMessages];
				const builderMessages = messages.filter((message) => message.builder);

				builderMessages.forEach((builderMessage) => {
					const { id: messageId, builder } = builderMessage;
					const preparedBuilder = this.#formatFields(builder);
					const { blocks } = preparedBuilder;
					delete preparedBuilder.blocks;

					store.commit('addBuilder', {
						messageId,
						params: { ...this.getBuilderElementState(), ...preparedBuilder },
					});

					const preparedBlocks = blocks.map((block) => {
						return { ...this.getBlockElementState(), ...block };
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

import { Type } from 'main.core';
import { useBlockDiagram } from 'ui.block-diagram';
import { computed, defineComponent, getCurrentInstance, toValue, type Ref } from 'ui.vue3';

import {
	createConnectionIndex,
	resolveMarkerPosition,
	useNotesStore,
	type NoteConnectionIndex,
	type NoteSchemaConnection,
	type NoteSchemaRect,
	type NotesSchema,
	type TemplateNote,
} from '../../../../entities/notes';
import { NoteMarker } from '../note-marker/note-marker';

import './notes-layer.css';

/**
 * The camera of the canvas as the layer reads it. A marker lives in the coordinates of the canvas, so
 * the same camera that moves the schema is what puts the marker over its place on the screen.
 */
export type MarkerCamera = {
	x: number,
	y: number,
	zoom: number,
};

/** The area the canvas draws into, in screen pixels. */
export type MarkerViewport = {
	width: number,
	height: number,
};

/** A marker ready to be drawn: the note it stands for and the point of the screen it sits at. */
export type NoteMarkerView = {
	note: TemplateNote,
	x: number,
	y: number,
};

const LAYER_TEST_ID = 'bizprocdesigner-notes-layer';

// Markers just outside the drawn area are kept, so panning does not add and drop them pixel by pixel.
const VIEWPORT_MARGIN = 96;

function isPositive(value: mixed): boolean
{
	return Type.isNumber(value) && value > 0;
}

/**
 * The markers of the visible part of the schema in one pass: a camera that moved needs the whole set
 * counted anew, and the 200 notes of the limit may not cost 200 passes.
 *
 * The canvas draws its own content with the same translation, so a marker keeps its place on the
 * schema while the camera moves. A note whose anchor is missing from the drawn schema falls back to
 * its own coordinates - that is the doing of the anchor utility, and no data of the note changes over
 * it. Nothing travels the other way either: a marker never becomes a part of the graph.
 */
export function selectVisibleMarkers(
	notes: TemplateNote[],
	schema: NotesSchema,
	camera: MarkerCamera,
	viewport: MarkerViewport,
): NoteMarkerView[]
{
	// The canvas has not measured itself yet, so there is no screen to put a marker on.
	if (!isPositive(camera?.zoom) || !isPositive(viewport?.width) || !isPositive(viewport?.height))
	{
		return [];
	}

	const markers: NoteMarkerView[] = [];

	for (const note of notes)
	{
		const point = resolveMarkerPosition(note, schema);
		const x = Math.round((point.x - camera.x) * camera.zoom);
		const y = Math.round((point.y - camera.y) * camera.zoom);

		const isVisible = x >= -VIEWPORT_MARGIN
			&& x <= viewport.width + VIEWPORT_MARGIN
			&& y >= -VIEWPORT_MARGIN
			&& y <= viewport.height + VIEWPORT_MARGIN
		;

		if (isVisible)
		{
			markers.push({ note, x, y });
		}
	}

	return markers;
}

/** The part of the state of the canvas the layer reads: the geometry it draws by and the camera. */
type CanvasState = {
	blocksRectMap: Ref<{ [blockId: string]: NoteSchemaRect }>,
	portsRectMap: Ref<{ [blockId: string]: { [portId: string]: NoteSchemaRect } }>,
	connections: Ref<NoteSchemaConnection[]>,
	transform: Ref<MarkerCamera>,
	canvasWidth: Ref<number>,
	canvasHeight: Ref<number>,
};

/**
 * The state of the canvas, and only once the canvas itself has built it. It lives in the global
 * properties of the application, and whoever asks for it first is who creates it - a later caller
 * gets what is already there. So asking ahead of the canvas would leave it with a state built without
 * its own options, and its blocks and connections would be dropped without a word. The layer reads a
 * state that exists and draws nothing until it does; the section of the layer therefore belongs after
 * the canvas in the markup of the editor.
 */
function useCanvasState(): CanvasState | null
{
	const app = getCurrentInstance()?.appContext?.app;

	if (!app?.config?.globalProperties?.$blockDiagram)
	{
		return null;
	}

	return useBlockDiagram();
}

/**
 * The layer of the markers above the schema. It lives beside the canvas and not inside it, but within
 * the same application: the geometry of the nodes and the ports is only reachable from there.
 */
export const NotesLayer = defineComponent({
	name: 'BizprocdesignerNotesLayer',
	components: { NoteMarker },
	setup(): Object
	{
		const notesStore = useNotesStore();
		const canvas = useCanvasState();

		/**
		 * The index of the connections is owed to the set of the connections and to nothing else: a
		 * camera that moved leaves it as it is, so a frame of a drag pays for the notes alone.
		 */
		const connectionIndex = computed((): NoteConnectionIndex => (
			canvas === null ? createConnectionIndex([]) : createConnectionIndex(toValue(canvas.connections))
		));

		const markers = computed((): NoteMarkerView[] => {
			if (canvas === null)
			{
				return [];
			}

			return selectVisibleMarkers(
				notesStore.notes,
				{
					nodeRects: toValue(canvas.blocksRectMap),
					portRects: toValue(canvas.portsRectMap),
					connections: toValue(canvas.connections),
					connectionIndex: connectionIndex.value,
				},
				toValue(canvas.transform),
				{ width: toValue(canvas.canvasWidth), height: toValue(canvas.canvasHeight) },
			);
		});

		return { notesStore, markers };
	},
	computed: {
		openedNoteId(): number | null
		{
			return this.notesStore.openedNoteId;
		},
		layerTestId(): string
		{
			return this.$testId(LAYER_TEST_ID);
		},
	},
	methods: {
		/**
		 * One thread is open at a time (AC-012), and the store is what holds that - a marker only asks
		 * for its own. A conversation that could not be read leaves no thread open: naming the refusal
		 * belongs to the thread itself, which the layer gains later.
		 */
		async handleToggleThread(noteId: number): Promise<void>
		{
			if (this.openedNoteId === noteId)
			{
				this.notesStore.closeThread();

				return;
			}

			try
			{
				await this.notesStore.openThread(noteId);
			}
			catch
			{
				if (this.notesStore.openedNoteId === noteId)
				{
					this.notesStore.closeThread();
				}
			}
		},
	},
	template: `
		<div class="editor-chart-notes-layer" :data-testid="layerTestId">
			<NoteMarker
				v-for="marker in markers"
				:key="marker.note.id"
				:note="marker.note"
				:x="marker.x"
				:y="marker.y"
				:isOpened="marker.note.id === openedNoteId"
				@toggle="handleToggleThread(marker.note.id)"
			/>
		</div>
	`,
});

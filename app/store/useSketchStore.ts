// app/store/useSketchStore.ts
import { create } from 'zustand';


export const Tools = {
  pan: "pan",
  selection: "selection",
  rectangle: "rectangle",
  line: "line",
  pencil: "pencil",
  text: "text",
  circle:"circle"
};

export type Tool = typeof Tools[keyof typeof Tools];

// export const TOOLS: Tool[] = Object.keys(Tools) as Tool[];
export const TOOLS: Tool[] = Object.values(Tools);


export type ActionsType =
  | "writing"
  | "drawing"
  | "moving"
  | "panning"
  | "resizing"
  | "none";

export type ElementType = {
    id: number;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    type: Tool;
    roughElement?: any;
    offsetX?: number;
    offsetY?: number;
    position?: string | null;
    points?: { x: number; y: number }[];
    text?: string;
};

type SketchState = {
  tool: Tool;
  setTool: (tool: Tool) => void;
  elements: ElementType[];
  setElements:(elements:ElementType[])=>void;
  addElement: (el: ElementType) => void;
  updateElement:(id:number,updates:Partial<ElementType>)=>void;
  clearElements: () => void;

  selectedElement:ElementType | null;
  setSelectedElement:(el:ElementType | null)=>void;

  action:ActionsType;
  setAction:(action:ActionsType)=>void;
  
};

export const useSketchStore = create<SketchState>((set) => ({
  tool: TOOLS[0],
  setTool: (tool) => set({ tool }),
  elements: [],
  setElements: (elements) => set({ elements }),
  addElement: (el) => set((state) => ({ elements: [...state.elements, el] })),
  updateElement:(id,updates) =>
    set((state) => ({
      elements:state.elements.map((el) => 
      el.id === id ? {...el,...updates}:el),
    })),
  clearElements: () => set({ elements: [] }),

  selectedElement: null,
  setSelectedElement: (el) => set({ selectedElement: el }),

  action: "none",
  setAction: (action) => set({ action }),
}));

export type PointType = {x:number,y:number}

"use client"
import { ActionBar } from "./components/action-bar/action-bar";
import { Canvas } from "./components/canvas/canvas";
import { useSketchStore } from "./store/useSketchStore";


export default function HomePage(){
    const tool = useSketchStore((state) => state.tool);
    const setTool = useSketchStore((state) => state.setTool);
    return(
        <main>
            <ActionBar tool={tool} setTool={setTool}/>
            <Canvas/>
        </main>
    )
}
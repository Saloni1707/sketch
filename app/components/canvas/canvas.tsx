"use client"

import {useEffect, useRef, useState} from "react"
import {useSketchStore} from "../../store/useSketchStore"
import styles from "./Canvas.module.css"

export function Canvas(){
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [size,setSize] = useState({width:800,height:600})
    const elements = useSketchStore((state) => state.elements);
    const tool = useSketchStore((state) => state.tool);

    useEffect(() => {
        setSize({
            width: window.innerWidth,
            height: window.innerHeight
        });
    },[])

    return(
        <div className={styles.canvasWrapper}>
            <canvas ref={canvasRef} width={size.width} height={size.height}/>
            <div className={styles.overlay}>
                {/* <p>Selected tool : {tool}</p> */}
                {/* <p>Elements: {elements.length}</p> */}
            </div>
        </div>
    )
}
"use client"

import {
    MouseEvent,
    useEffect,
    useState,
    useLayoutEffect,
    useRef,
    useCallback,
    useMemo,
    useReducer
} from "react";

import rough from "roughjs";
import { useHistory } from "./Hooks/useHistory";
import { usePressedKeys } from "./Hooks/usePressedKeys";

import {
    ElementType,
    Tool,
    Tools,
    ActionsType,
    ExtendedElementType,
    SelectedElementType,
} from "./store/useSketchStore";

import {ActionBar} from "./components/action-bar/action-bar";
import {Canvas} from "./components/canvas/canvas";
//import {ColorPalette} from "./components/ColorPalette/ColorPalette"

import {
    adjustElementCoordinates,
    adjustRequired,
    createElement,
    cursorPosition as getCursorStyle,
    drawElement,
    getElementPos,
    resizedCoordinates,
    nearPoint,
  } from "./utilities";

  export default function App(){
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    useEffect(() => {
        // Only run on client side
        const updateDimensions = () => {
          setDimensions({
            width: window.innerWidth,
            height: window.innerHeight
          });
        };

        // Set initial dimensions
        updateDimensions();

        // Add event listener for window resize
        window.addEventListener('resize', updateDimensions);

        // Cleanup
        return () => window.removeEventListener('resize', updateDimensions);
    }, []);

    const initialTool:Tool = Tools.selection;
    const { elements,setElements,undo,redo} = useHistory([]);
    const[panOffset,setPanOffset] = useState({x:0,y:0});
    const[startPanMousePosition,setStartPanMousePosition] = useState({x:0,y:0});
    const[action,setAction] = useState<ActionsType>("none");
    const[tool,setTool] = useState<Tool>(initialTool);
    const[selectedElement,setSelectedElement] = useState<ElementType | null>(null);
    const [scale, setScale] = useState(1);
    const [scaleOffset, setScaleOffset] = useState({ x: 0, y: 0 });
    const [cursorPosition, setCursorPosition] = useState({x:0,y:0});
    const [textInputPosition, setTextInputPosition] = useState({ x: 0, y: 0 });
    const [showTextPreview, setShowTextPreview] = useState(false);
    const prevScaleRef = useRef(scale);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const textAreaRef = useRef<HTMLTextAreaElement>(null);
    const pressedKeys = usePressedKeys();

    // Update scale offset when scale changes
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const scaledWidth = canvas.width * scale;
        const scaledHeight = canvas.height * scale;
        const scaledOffsetX = (scaledWidth - canvas.width) / 2;
        const scaledOffsetY = (scaledHeight - canvas.height) / 2;
        
        // Only update if scale has actually changed
        if (prevScaleRef.current !== scale) {
            setScaleOffset({ x: scaledOffsetX, y: scaledOffsetY });
            prevScaleRef.current = scale;
        }
    }, [scale]);

    useLayoutEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const context = canvas.getContext("2d");
        if (!context) return;
        
        const roughCanvas = rough.canvas(canvas);
        context.clearRect(0, 0, canvas.width, canvas.height);

        const scaledWidth = canvas.width * scale;
        const scaledHeight = canvas.height * scale;
        const scaledOffsetX = (scaledWidth - canvas.width) / 2;
        const scaledOffsetY = (scaledHeight - canvas.height) / 2;

        context.save();
        context.translate(
            panOffset.x * scale - scaledOffsetX,
            panOffset.y * scale - scaledOffsetY
        );
        context.scale(scale, scale);

        elements.forEach((element) => {
            if ((action === "writing" || (tool === 'text' && showTextPreview)) && selectedElement?.id === element.id) {
                return;
            }
            drawElement(roughCanvas, context, element);
        });
        
        context.restore();
    }, [elements, action, selectedElement, scale, panOffset, scaleOffset]);

    useEffect(() => {
        const undoRedoFunction = (event:KeyboardEvent) => {
            if(event.key === "z"){
                if(event.shiftKey){
                    redo();
                }else{
                    undo();
                }
            }else if(event.key === "y"){
                redo();
            }
        }
        document.addEventListener("keydown",undoRedoFunction);
        return () => {
            document.removeEventListener("keydown",undoRedoFunction);
        }
    },[undo,redo])

    useEffect(()=>{
        const panOrZoomFunction = (event:WheelEvent) => {
            if(pressedKeys.has("Meta") || pressedKeys.has("Control")){
                onZoom(event.deltaY*-0.01);
            }else{
                setPanOffset((prevState) => ({
                    x:prevState.x - event.deltaX,
                    y:prevState.y - event.deltaY,
                }));
            }    
        };
        document.addEventListener("wheel",panOrZoomFunction);
        return () => {
            document.removeEventListener("wheel",panOrZoomFunction);
        };
    },[pressedKeys]);

    useEffect(() => {
        const textArea = textAreaRef.current;
        if(action === "writing" && textArea && selectedElement){
            setTimeout(() => {
                textArea.focus();
                textArea.value = selectedElement.text || "";
            },0);
        }
    },[action,selectedElement]);

    type UpdateElementOptions = {
        text?: string;
        points?: Array<{x: number; y: number}>;
    };

    const updateElement = (
        id: number,
        x1: number,
        y1: number,
        x2: number,
        y2: number,
        type: Tool,
        options?: UpdateElementOptions
    ) => {
        const elementsCopy = [...elements];
        switch(type){
            case Tools.line:
            case Tools.rectangle:{
                elementsCopy[id] = createElement(id, x1, y1, x2, y2, type);
                break;
            }
            case Tools.pencil: {
                const existingElement = elementsCopy[id];
                if (options?.points) {
                    // If points are provided in options, use them
                    elementsCopy[id] = {
                        ...existingElement,
                        points: options.points,
                        x1: Math.min(...options.points.map(p => p.x)),
                        y1: Math.min(...options.points.map(p => p.y)),
                        x2: Math.max(...options.points.map(p => p.x)),
                        y2: Math.max(...options.points.map(p => p.y))
                    };
                } else {
                    // Otherwise, add a new point to the existing points
                    const existingPoints = existingElement.points || [];
                    elementsCopy[id] = {
                        ...existingElement,
                        points: [...existingPoints, { x: x2, y: y2 }],
                        x1: Math.min(existingElement.x1 || x1, x2),
                        y1: Math.min(existingElement.y1 || y1, y2),
                        x2: Math.max(existingElement.x2 || x1, x2),
                        y2: Math.max(existingElement.y2 || y1, y2)
                    };
                }
                break;
            }
            case Tools.text: {
                const canvas = document.getElementById("canvas");
                if (!(canvas instanceof HTMLCanvasElement)) {
                    throw new Error("Canvas element not found");
                }
                const context = canvas.getContext("2d");
                if (!context) {
                    throw new Error("Could not get 2d context");
                }
                
                const text = options?.text || "";
                const textWidth = context.measureText(text).width;
                const textHeight = 24;
                
                elementsCopy[id] = createElement(id, x1, y1, x1 + textWidth, y1 + textHeight, type);
                
                // If we have text options, update the element with the text
                if (options) {
                    elementsCopy[id] = {
                        ...elementsCopy[id],
                        text: options.text || ""
                    };
                }
                break;
            }
            case Tools.circle: {
                elementsCopy[id] = createElement(id, x1, y1, x2, y2, type);
                break;
              }
            default:
                throw new Error("Invalid tool type");
        }
        setElements(elementsCopy,true);
    };

    const getMouseCoordinates = (event:MouseEvent)=>{
        const clientX = 
        (event.clientX - panOffset.x*scale + scaleOffset.x)/scale;
        const clientY = 
        (event.clientY - panOffset.y*scale + scaleOffset.y)/scale;
        return {clientX,clientY};
    };
    const handleMouseDown = (event: MouseEvent<HTMLCanvasElement>) => {
        if(action === "writing") return;
        const {clientX,clientY} = getMouseCoordinates(event);
        
        // Handle panning
        if(tool === Tools.pan || event.button === 1 || pressedKeys.has(" ")){
            setAction("panning");
            setStartPanMousePosition({x:clientX,y:clientY});
            document.body.style.cursor = "grabbing";
            return;
        }
        
        // Check if we're clicking on an existing element
        const element = getElementPos(clientX, clientY, elements);
        
        if (element) {
            // If we have a selected element and we're in selection mode
            setSelectedElement({
                ...element,
                offsetX: clientX - element.x1,
                offsetY: clientY - element.y1
            });
            setAction("moving");
            return;
        }
        
        // Handle drawing tools
        if (tool !== Tools.selection) {
            const id = elements.length;
            
            if (tool === Tools.text) {
                // For text tool, create a text element at the click position
                const adjustedX = (clientX - panOffset.x * scale + scaleOffset.x) / scale;
                const adjustedY = (clientY - panOffset.y * scale + scaleOffset.y) / scale;
                
                const newElement = createElement(
                    id,
                    adjustedX,
                    adjustedY,
                    adjustedX + 100, // Default width
                    adjustedY + 24,  // Default height for one line of text
                    tool
                );
                
                // Add the new element to the elements array
                const newElements = [...elements, newElement];
                setElements(newElements);
                
                // Set the selected element with proper offsets
                setSelectedElement({
                    ...newElement,
                    offsetX: 0,
                    offsetY: 0
                });
                
                // Set action to writing to show the text input
                setAction("writing");
                
                // Focus the textarea after a small delay to ensure it's rendered
                setTimeout(() => {
                    textAreaRef.current?.focus();
                }, 10);
                return;
            } else {
                // For other drawing tools
                const newElement = createElement(id, clientX, clientY, clientX, clientY, tool);
                setElements([...elements, newElement]);
                setSelectedElement({
                    ...newElement,
                    offsetX: 0,
                    offsetY: 0
                });
                setAction("drawing");
            }
        } else {
            // If in selection mode and clicked on empty space, clear selection
            setSelectedElement(null);
        }
        if(tool === Tools.selection){
            const element = getElementPos(clientX,clientY,elements);
            if(element){
                let selectedElement:SelectedElementType = {...element};
                if(element.type === "pencil" && element.points){
                    const xOffsets = element.points.map((point) => clientX - point.x);
                    const yOffsets = element.points.map((point) => clientY - point.y);
                    selectedElement = {...selectedElement,xOffsets,yOffsets};
                }else{
                    const offsetX = clientX - element.x1;
                    const offsetY = clientY - element.y1;
                    selectedElement = {...selectedElement,offsetX,offsetY};
                }
                setSelectedElement(selectedElement);
                // No need to update elements when just selecting
                if(element.position === "inside"){
                    setAction("moving");
                }else{
                    setAction("resizing");
                }
            }

        }
    };

    const handleMouseMove = (event:MouseEvent<HTMLCanvasElement>) => {
        const {clientX, clientY} = getMouseCoordinates(event);
        
        // Update cursor position for text preview
        if (tool === 'text' && action !== 'writing') {
            setCursorPosition({ x: clientX, y: clientY });
            setShowTextPreview(true);
        }
        
        // Always update cursor position when moving the mouse
        setCursorPosition({ x: clientX, y: clientY });
        
        if (action === "panning") {
            const deltaX = clientX - startPanMousePosition.x;
            const deltaY = clientY - startPanMousePosition.y;
            setPanOffset({
                x: panOffset.x + deltaX,
                y: panOffset.y + deltaY,
            });
            setStartPanMousePosition({ x: clientX, y: clientY });
            return;
        }
        
        if (tool === Tools.selection) {
            const element = getElementPos(clientX, clientY, elements);
            if (element) {
                if (element.position) {
                    (event.target as HTMLElement).style.cursor = getCursorStyle(element.position);
                } else {
                    (event.target as HTMLElement).style.cursor = 'move';
                }
            } else {
                (event.target as HTMLElement).style.cursor = 'default';
            }
        }
        
        if (action === "drawing" && selectedElement) {
            if (tool === Tools.pencil) {
                // For pencil tool, add the current point to the points array
                const elementsCopy = [...elements];
                const elementIndex = elementsCopy.findIndex(el => el.id === selectedElement.id);
                
                if (elementIndex !== -1) {
                    const element = elementsCopy[elementIndex];
                    if (element.type === Tools.pencil && element.points) {
                        // Add the new point to the points array
                        elementsCopy[elementIndex] = {
                            ...element,
                            points: [...element.points, { x: clientX, y: clientY }],
                            x1: Math.min(element.x1 || clientX, clientX),
                            y1: Math.min(element.y1 || clientY, clientY),
                            x2: Math.max(element.x2 || clientX, clientX),
                            y2: Math.max(element.y2 || clientY, clientY)
                        };
                        setElements(elementsCopy, true);
                    }
                }
            } else {
                // For other tools, update the end coordinates
                const { id, x1, y1 } = selectedElement;
                updateElement(id, x1, y1, clientX, clientY, tool);
            }
        }else if(action === "moving" && selectedElement){
            if(
                selectedElement.type === "pencil" &&
                "points" in selectedElement &&
                "xOffsets" in selectedElement &&
                "yOffsets" in selectedElement
            ){
                const extendedElement = selectedElement as ExtendedElementType;
                const newPoints = extendedElement.points!.map((_,index)=>({
                    x:clientX - extendedElement.xOffsets![index],
                    y:clientY - extendedElement.yOffsets![index],
                }));
                const elementsCopy = [...elements];
                elementsCopy[extendedElement.id] = {
                  ...elementsCopy[extendedElement.id],
                  points: newPoints,
                };
                setElements(elementsCopy, true);
            }else {
                const { id, x1, x2, y1, y2, type, offsetX, offsetY } =
                    selectedElement as ExtendedElementType;
                    const safeOffsetX = offsetX ?? 0;
                    const safeOffsetY = offsetY ?? 0;
                    const newX1 = clientX - safeOffsetX;
                    const newY1 = clientY - safeOffsetY;
                    const newX2 = newX1 + (x2 - x1);
                    const newY2 = newY1 + (y2 - y1);
                    const options =
                        type === "text" && selectedElement.text
                            ? { text: selectedElement.text }
                            : undefined;
                    updateElement(id, newX1, newY1, newX2, newY2, type, options);
            }
        }else if(
            action === "resizing" &&
            selectedElement &&
            selectedElement.position
        ){
            const {id , type , position , ...coordinates} = selectedElement as ExtendedElementType;
            if(typeof position === "string"){
                const {x1,y1,x2,y2} = resizedCoordinates(clientX,clientY,position,coordinates);
                updateElement(id,x1,y1,x2,y2,type);
            }
        }
    };

    const handleMouseUp = (event: MouseEvent<HTMLCanvasElement>) => {
        const {clientX, clientY} = getMouseCoordinates(event);
        if (selectedElement) {
            const index = elements.findIndex(el => el.id === selectedElement.id);
            if (index === -1) {
                setAction("none");
                setSelectedElement(null);
                return;
            }
            
            const element = elements[index];
            const {id, type} = element;
            
            if (type === Tools.pencil) {
                if (element.points && element.points.length < 2) {
                    // If only one point, convert it to a small circle
                    const point = element.points[0];
                    updateElement(id, point.x - 2, point.y - 2, point.x + 2, point.y + 2, Tools.circle);
                } else {
                    // For pencil tool with multiple points, ensure we have valid bounds
                    const bounds = element.points?.reduce((acc, point) => ({
                        minX: Math.min(acc.minX, point.x),
                        minY: Math.min(acc.minY, point.y),
                        maxX: Math.max(acc.maxX, point.x),
                        maxY: Math.max(acc.maxY, point.y)
                    }), { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity });
                    
                    if (bounds && element.points && element.points.length > 1) {
                        updateElement(
                            id,
                            bounds.minX,
                            bounds.minY,
                            bounds.maxX,
                            bounds.maxY,
                            type,
                            { points: element.points }
                        );
                    }
                }
            } else if (action === "drawing" || action === "resizing") {
                const {x1, y1, x2, y2} = adjustElementCoordinates(element);
                updateElement(id, x1, y1, x2, y2, type);
            }
            const offsetX = selectedElement.offsetX || 0;
            const offsetY = selectedElement.offsetY || 0;
            if(
                selectedElement.type === "text" &&
                clientX - offsetX === selectedElement.x1 &&
                clientY - offsetY === selectedElement.y1
            ){
                setAction("writing");
                return;
            }

            if(action === "writing"){
                return;
            }
            if(action === "panning"){
                document.body.style.cursor = "default";
            }
            
        };
        setAction("none");
        setSelectedElement(null);
    };

    const handleBlur = (event: React.FocusEvent<HTMLTextAreaElement>) => {
        if (selectedElement && textAreaRef.current) {
            const { id, x1, y1, type } = selectedElement;
            const text = event.target.value.trim();
            
            // Always update the element with the current text, even if it's empty
            const context = canvasRef.current?.getContext('2d');
            if (context) {
                context.font = '24px sans-serif';
                const metrics = context.measureText(text || ' ');
                const textWidth = Math.max(metrics.width, 20); // Minimum width of 20px
                const textHeight = 32; // Slightly larger to accommodate the text
                
                // Update the element with the text and proper dimensions
                updateElement(
                    id, 
                    x1, 
                    y1, 
                    x1 + textWidth, 
                    y1 + textHeight, 
                    type, 
                    { text: text || ' ' } // Store text or space if empty
                );
                
                // Only reset the action if we're not in drawing mode
                if (action !== 'drawing') {
                    setAction("none");
                }
            }
        }
    };

    const onZoom = (delta:number) => {
        setScale((prevState) => Math.min(Math.max(prevState + delta,0.1),20));
    };

    return (
        <div>
            <ActionBar tool={tool} setTool={setTool}/>
            {/* <ControlPanel/> */}

            {(action === "writing" || tool === 'text') && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100vw',
                        height: '100vh',
                        pointerEvents: 'none',
                        zIndex: 1000,
                    }}
                >
                    <div
                        style={{
                            position: 'absolute',
                            top: `${action === 'writing' && selectedElement 
                                ? selectedElement.y1 * scale + panOffset.y 
                                : textInputPosition.y}px`,
                            left: `${action === 'writing' && selectedElement 
                                ? selectedElement.x1 * scale + panOffset.x 
                                : textInputPosition.x}px`,
                            transform: action === 'writing' ? `scale(${scale})` : 'none',
                            transformOrigin: 'top left',
                            opacity: action === 'writing' ? 1 : 0.7,
                            transition: 'opacity 0.1s ease',
                        }}
                    >
                        {action === 'writing' ? (
                            <textarea
                                ref={textAreaRef}
                                onBlur={handleBlur}
                                autoFocus
                                className="textArea"
                                style={{
                                    fontSize: '24px',
                                    padding: '4px',
                                    margin: 0,
                                    // border: '1px solid #000',
                                    background: '#ffffff',
                                    color: '#000000',
                                    outline: 'none',
                                    resize: 'none',
                                    overflow: 'hidden',
                                    fontFamily: 'sans-serif',
                                    lineHeight: 1,
                                    whiteSpace: 'nowrap',
                                    pointerEvents: 'auto',
                                    minWidth: '200px',
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        textAreaRef.current?.blur();
                                    }
                                }}
                            />
                        ) : (
                            <div 
                                onClick={(e) => {
                                    if (tool === 'text') {
                                        // Store the current cursor position for the text input
                                        setTextInputPosition({
                                            x: cursorPosition.x,
                                            y: cursorPosition.y
                                        });
                                        setAction('writing');
                                        // Focus the textarea after a small delay to ensure it's rendered
                                        setTimeout(() => {
                                            textAreaRef.current?.focus();
                                        }, 0);
                                    }
                                }}
                                style={{
                                    fontSize: '24px',
                                    padding: '4px',
                                    margin: 0,
                                    fontFamily: 'sans-serif',
                                    lineHeight: 1,
                                    whiteSpace: 'nowrap',
                                    color: '#00000033',
                                    cursor: tool === 'text' ? 'pointer' : 'default',
                                    pointerEvents: tool === 'text' ? 'auto' : 'none',
                                    minWidth: '200px',
                                    borderBottom: '2px dashed #00000033',
                                }}
                            />
                        )}
                    </div>
                </div>
            )}
            <canvas 
              ref={canvasRef}
              id="canvas"
              width={dimensions.width}
              height={dimensions.height}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              style={{ 
                position: "absolute", 
                zIndex: 1,
                width: '100%',
                height: '100%',
                cursor: tool === Tools.text ? 'text' : tool === Tools.selection ? 'default' : 'crosshair'
              }}
            />
            
        </div>
    )
}
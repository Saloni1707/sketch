"use client"
import { useSearchParams } from "next/navigation";
import Collaborators from "./components/Collaborator";
import NamePrompt from "./components/NamePrompt";
import type { MouseEvent } from "react";
import {
    useEffect,
    useState,
    useLayoutEffect,
    useRef,
    useCallback,
} from "react";
import { useSocket } from "./Hooks/useSocket";
import rough from "roughjs";
import { useHistory } from "./Hooks/useHistory";
import { usePressedKeys } from "./Hooks/usePressedKeys";
import { DrawAction } from './Hooks/useSocket';
import {
    ElementType,
    Tool,
    Tools,
    ActionsType,
    ExtendedElementType,
    SelectedElementType,
} from "./store/useSketchStore";

import { ActionBar } from "./components/action-bar/action-bar";
import { Canvas } from "./components/canvas/canvas";
import ColorPalette from "./components/ColorPalette/ColorPalette";

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

export default function App() {
    // Dimensions state
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    
    // Room and user states
    const [room, setRoom] = useState<string | null>(null);
    const [displayName, setDisplayName] = useState<string | null>(null);
    const [showNamePrompt, setShowNamePrompt] = useState(false);

    // Initialize room from URL params
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const roomParam = params.get("room");
        
        if (!roomParam) {
            const newRoom = Math.random().toString(36).slice(2, 9);
            params.set("room", newRoom);
            const newUrl = `${window.location.pathname}?${params.toString()}`;
            window.history.replaceState({}, "", newUrl);
            setRoom(newRoom);
        } else {
            setRoom(roomParam);
        }
        
        //display name in session storage
        const storedName = sessionStorage.getItem("displayName");
        if (storedName) {
            setDisplayName(storedName);
        } else {
            setShowNamePrompt(true);
        }
    }, []);

    const lastEmittedElementRef = useRef<ElementType | null>(null);
    const { elements, setElements, undo, redo } = useHistory([]);
    const handleRemoteDraw = useCallback((action: DrawAction) => {
        switch (action.type) {
            case 'add':
                if (action.elements) {
                    setElements(prev => [...prev, action.elements], false); // false = don't record in history
                }
                break;
            case 'update':
                if (action.elements) {
                    setElements(prev => {
                        const index = prev.findIndex(el => el.id === action.elements.id);
                        if (index !== -1) {
                            const newElements = [...prev];
                            newElements[index] = action.elements;
                            return newElements;
                        }
                        return prev;
                    }, false);
                }
                break;
            case 'delete':
                if (action.elementId !== undefined) {
                    setElements(prev => prev.filter(el => el.id !== action.elementId), false);
                }
                break;
            case 'batch':
                if (action.elements) {
                    setElements(action.elements, false);
                }
                break;
        }
    }, [setElements]);

    // Presence handler
    const handlePresence = useCallback((users: string[]) => {
        console.log("Users in room:", users);
    }, []);

    // Socket connection
    const { emitDrawAction, requestState, connected, presence, leaveRoom } = useSocket(
        room,
        displayName,
        handleRemoteDraw,
        handlePresence
    );
    useEffect(() => {
        if(room && connected){
            requestState();
        }
    }, [room, connected]);

    // Handle name submission
    const handleNameSubmit = (name: string) => {
        setDisplayName(name);
        sessionStorage.setItem("displayName", name);
        setShowNamePrompt(false);
    };

    // Window dimensions
    useEffect(() => {
        const updateDimensions = () => {
            setDimensions({
                width: window.innerWidth,
                height: window.innerHeight
            });
        };

        updateDimensions();
        window.addEventListener('resize', updateDimensions);
        return () => window.removeEventListener('resize', updateDimensions);
    }, []);

    // Drawing states
    
    const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
    const [startPanMousePosition, setStartPanMousePosition] = useState({ x: 0, y: 0 });
    const [action, setAction] = useState<ActionsType>("none");
    const [tool, setTool] = useState<Tool>(Tools.selection);
    const [currentColor, setCurrentColor] = useState<string>('#000000');
    const [selectedElement, setSelectedElement] = useState<ElementType | null>(null);
    const [scale, setScale] = useState(1);
    const [scaleOffset, setScaleOffset] = useState({ x: 0, y: 0 });
    const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
    const [showTextPreview, setShowTextPreview] = useState(false);
    
    // Refs
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

        if (prevScaleRef.current !== scale) {
            setScaleOffset({ x: scaledOffsetX, y: scaledOffsetY });
            prevScaleRef.current = scale;
        }
    }, [scale]);

    // Canvas rendering
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
    }, [elements, action, selectedElement, scale, panOffset, scaleOffset, tool, showTextPreview]);

    // Undo/Redo keyboard shortcuts
    useEffect(() => {
        const undoRedoFunction = (event: KeyboardEvent) => {
            if ((event.metaKey || event.ctrlKey) && event.key === "z") {
                event.preventDefault();
                if (event.shiftKey) {
                    redo();
                } else {
                    undo();
                }
            } else if ((event.metaKey || event.ctrlKey) && event.key === "y") {
                event.preventDefault();
                redo();
            }
        };
        document.addEventListener("keydown", undoRedoFunction);
        return () => {
            document.removeEventListener("keydown", undoRedoFunction);
        };
    }, [undo, redo]);

    // Pan/Zoom with mouse wheel
    useEffect(() => {
        const panOrZoomFunction = (event: WheelEvent) => {
            if (pressedKeys.has("Meta") || pressedKeys.has("Control")) {
                event.preventDefault();
                onZoom(event.deltaY * -0.01);
            } else {
                setPanOffset((prevState) => ({
                    x: prevState.x - event.deltaX,
                    y: prevState.y - event.deltaY,
                }));
            }
        };
        document.addEventListener("wheel", panOrZoomFunction, { passive: false });
        return () => {
            document.removeEventListener("wheel", panOrZoomFunction);
        };
    }, [pressedKeys]);

    // Focus textarea when writing
    useEffect(() => {
        const textArea = textAreaRef.current;
        if (action === "writing" && textArea && selectedElement) {
            setTimeout(() => {
                textArea.focus();
                textArea.value = selectedElement.text || "";
            }, 0);
        }
    }, [action, selectedElement]);

    type UpdateElementOptions = {
        text?: string;
        points?: Array<{ x: number; y: number }>;
    };

    const updateElement = useCallback((
        id: number,
        x1: number,
        y1: number,
        x2: number,
        y2: number,
        type: Tool,
        options?: UpdateElementOptions
    ) => {
        const elementsCopy = [...elements];
        switch (type) {
            case Tools.line:
            case Tools.arrow:
            case Tools.rectangle: {
                const originalColor = elementsCopy[id]?.color || currentColor;
                elementsCopy[id] = createElement(id, x1, y1, x2, y2, type, originalColor);
                break;
            }
            case Tools.pencil: {
                const existingElement = elementsCopy[id];
                if (options?.points) {
                    elementsCopy[id] = {
                        ...existingElement,
                        points: options.points,
                        x1: Math.min(...options.points.map(p => p.x)),
                        y1: Math.min(...options.points.map(p => p.y)),
                        x2: Math.max(...options.points.map(p => p.x)),
                        y2: Math.max(...options.points.map(p => p.y))
                    };
                } else {
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
                context.font = '24px sans-serif';
                const textWidth = context.measureText(text).width;
                const textHeight = 24;

                elementsCopy[id] = createElement(id, x1, y1, x1 + textWidth, y1 + textHeight, type, currentColor);

                if (options) {
                    elementsCopy[id] = {
                        ...elementsCopy[id],
                        text: options.text || ""
                    };
                }
                break;
            }
            case Tools.circle: {
                const originalColor = elementsCopy[id]?.color || currentColor;
                elementsCopy[id] = createElement(id, x1, y1, x2, y2, type, originalColor);
                break;
            }
            default:
                throw new Error("Invalid tool type");
        }
        setElements(elementsCopy, true);
    }, [elements, currentColor, setElements]);

    const getMouseCoordinates = useCallback((event: MouseEvent) => {
        const clientX = (event.clientX - panOffset.x * scale + scaleOffset.x) / scale;
        const clientY = (event.clientY - panOffset.y * scale + scaleOffset.y) / scale;
        return { clientX, clientY };
    }, [panOffset, scale, scaleOffset]);

    const handleMouseDown = useCallback((event: MouseEvent<HTMLCanvasElement>) => {
        if (action === "writing") return;
        const { clientX, clientY } = getMouseCoordinates(event);

        // Handle panning
        if (tool === Tools.pan || event.button === 1 || pressedKeys.has(" ")) {
            setAction("panning");
            setStartPanMousePosition({ x: clientX, y: clientY });
            document.body.style.cursor = "grabbing";
            return;
        }

        // Handle selection tool
        if (tool === Tools.selection) {
            const element = getElementPos(clientX, clientY, elements);
            if (element) {
                let selectedElement: SelectedElementType = { ...element };
                if (element.type === "pencil" && element.points) {
                    const xOffsets = element.points.map((point) => clientX - point.x);
                    const yOffsets = element.points.map((point) => clientY - point.y);
                    selectedElement = { ...selectedElement, xOffsets, yOffsets };
                } else {
                    const offsetX = clientX - element.x1;
                    const offsetY = clientY - element.y1;
                    selectedElement = { ...selectedElement, offsetX, offsetY };
                }
                setSelectedElement(selectedElement);

                if (element.position === "inside") {
                    setAction("moving");
                } else {
                    setAction("resizing");
                }
            } else {
                setSelectedElement(null);
            }
            return;
        }

        // Handle drawing tools
        if (tool !== Tools.selection) {
            const id = elements.length;

            if (tool === Tools.text) {
                const newElement = createElement(
                    id,
                    clientX,
                    clientY,
                    clientX + 200,
                    clientY + 50,
                    tool,
                    currentColor
                );

                setElements([...elements, newElement], true);
                setSelectedElement(newElement);
                setAction("writing");

                setTimeout(() => {
                    textAreaRef.current?.focus();
                }, 10);
                return;
            } else {
                const newElement = createElement(id, clientX, clientY, clientX, clientY, tool, currentColor);
                setElements([...elements, newElement], true);
                setSelectedElement({
                    ...newElement,
                    offsetX: 0,
                    offsetY: 0
                });
                setAction("drawing");
            }
        }
    }, [action, tool, pressedKeys, elements, currentColor, getMouseCoordinates, setElements]);

    const handleMouseMove = useCallback((event: MouseEvent<HTMLCanvasElement>) => {
        const { clientX, clientY } = getMouseCoordinates(event);

        // Update cursor position for text preview
        if (tool === 'text' && action !== 'writing') {
            setCursorPosition({ x: clientX, y: clientY });
            setShowTextPreview(true);
        } else {
            setShowTextPreview(false);
        }

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
            const target = event.target as HTMLElement | null;
            if (target?.style) {
                if (element?.position) {
                    target.style.cursor = getCursorStyle(element.position);
                } else if (element) {
                    target.style.cursor = 'move';
                } else {
                    target.style.cursor = 'default';
                }
            }
        }

        if (action === "drawing" && selectedElement) {
            if (tool === Tools.pencil) {
                const elementsCopy = [...elements];
                const elementIndex = elementsCopy.findIndex(el => el.id === selectedElement.id);

                if (elementIndex !== -1) {
                    const element = elementsCopy[elementIndex];
                    if (element.type === Tools.pencil && element.points) {
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
                const { id, x1, y1 } = selectedElement;
                updateElement(id, x1, y1, clientX, clientY, tool);
            }
        } else if (action === "moving" && selectedElement) {
            if (
                selectedElement.type === "pencil" &&
                "points" in selectedElement &&
                "xOffsets" in selectedElement &&
                "yOffsets" in selectedElement
            ) {
                const extendedElement = selectedElement as ExtendedElementType;
                const newPoints = extendedElement.points!.map((_, index) => ({
                    x: clientX - extendedElement.xOffsets![index],
                    y: clientY - extendedElement.yOffsets![index],
                }));
                const elementsCopy = [...elements];
                elementsCopy[extendedElement.id] = {
                    ...elementsCopy[extendedElement.id],
                    points: newPoints,
                };
                setElements(elementsCopy, true);
            } else {
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
        } else if (
            action === "resizing" &&
            selectedElement &&
            selectedElement.position
        ) {
            const { id, type, position, ...coordinates } = selectedElement as ExtendedElementType;
            if (typeof position === "string") {
                const { x1, y1, x2, y2 } = resizedCoordinates(clientX, clientY, position, coordinates);
                updateElement(id, x1, y1, x2, y2, type);
            }
        }
    }, [action, tool, selectedElement, elements, panOffset, startPanMousePosition, getMouseCoordinates, updateElement, setElements]);

    const handleMouseUp = useCallback((event: MouseEvent<HTMLCanvasElement>) => {
        const { clientX, clientY } = getMouseCoordinates(event);
        
        if (selectedElement) {
            const index = elements.findIndex(el => el.id === selectedElement.id);
            if (index === -1) {
                setAction("none");
                setSelectedElement(null);
                return;
            }

            const element = elements[index];
            const { id, type } = element;

            if (type === Tools.pencil) {
                if (element.points && element.points.length < 2) {
                    const point = element.points[0];
                    updateElement(id, point.x - 2, point.y - 2, point.x + 2, point.y + 2, Tools.circle);
                } else {
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
                const { x1, y1, x2, y2 } = adjustElementCoordinates(element);
                updateElement(id, x1, y1, x2, y2, type);
            }
            
            const offsetX = selectedElement.offsetX || 0;
            const offsetY = selectedElement.offsetY || 0;
            if (
                selectedElement.type === "text" &&
                clientX - offsetX === selectedElement.x1 &&
                clientY - offsetY === selectedElement.y1
            ) {
                setAction("writing");
                return;
            }

            if (action === "writing") {
                return;
            }
            
            if (action === "panning") {
                document.body.style.cursor = "default";
            }
        }
        
        setAction("none");
        setSelectedElement(null);
    }, [action, selectedElement, elements, connected, emitDrawAction, getMouseCoordinates, updateElement]);

    const handleBlur = useCallback((event: React.FocusEvent<HTMLTextAreaElement>) => {
        if (selectedElement && textAreaRef.current) {
            const { id, x1, y1, type } = selectedElement;
            const text = event.target.value.trim();

            const context = canvasRef.current?.getContext('2d');
            if (context) {
                context.font = '24px sans-serif';
                const metrics = context.measureText(text || ' ');
                const textWidth = Math.max(metrics.width, 20);
                const textHeight = 32;

                updateElement(
                    id,
                    x1,
                    y1,
                    x1 + textWidth,
                    y1 + textHeight,
                    type,
                    { text: text || ' ' }
                );

                if (action !== 'drawing') {
                    setAction("none");
                }
                setSelectedElement(null);
            }
        }
    }, [selectedElement, action, updateElement]);

    const onZoom = useCallback((delta: number) => {
        setScale((prevState) => Math.min(Math.max(prevState + delta, 0.1), 20));
    }, []);

    const handleTouchStart = useCallback((event: React.TouchEvent<HTMLCanvasElement>) => {
        if (event.touches.length !== 1) return;
        const touch = event.touches[0];
        const mouseEvent = new MouseEvent('mousedown', {
            clientX: touch.clientX,
            clientY: touch.clientY,
            button: 0
        });
        handleMouseDown(mouseEvent as unknown as MouseEvent<HTMLCanvasElement>);
    }, [handleMouseDown]);

    const handleTouchMove = useCallback((event: React.TouchEvent<HTMLCanvasElement>) => {
        if (event.touches.length !== 1) return;
        const touch = event.touches[0];
        requestAnimationFrame(() => {
            const mouseEvent = new MouseEvent('mousemove', {
                clientX: touch.clientX,
                clientY: touch.clientY,
                view: window,
                cancelable: true
            });
            handleMouseMove(mouseEvent as unknown as MouseEvent<HTMLCanvasElement>);
        });
        return false;
    }, [handleMouseMove]);

    const handleTouchEnd = useCallback((event: React.TouchEvent<HTMLCanvasElement>) => {
        if (event.touches.length > 0) return;
        const touch = event.changedTouches[0];
        const mouseEvent = new MouseEvent('mouseup', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        handleMouseUp(mouseEvent as unknown as MouseEvent<HTMLCanvasElement>);
    }, [handleMouseUp]);

    // Touch event listener with proper cleanup
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const passiveOption = { passive: false };
        const handleTouchMoveWrapper = (e: TouchEvent) => {
            e.preventDefault();
            handleTouchMove(e as unknown as React.TouchEvent<HTMLCanvasElement>);
        };
        
        canvas.addEventListener('touchmove', handleTouchMoveWrapper, passiveOption);
        return () => {
            canvas.removeEventListener('touchmove', handleTouchMoveWrapper);
        };
    }, [handleTouchMove]);

    return (
        <div>
            {/* Name Prompt Modal */}
            {showNamePrompt && (
                <NamePrompt onSubmit={handleNameSubmit} />
            )}

            {/* Connection Status */}
            {room && displayName && (
                <div style={{
                    position: 'fixed',
                    top: 10,
                    right: 10,
                    zIndex: 100,
                    background: connected ? '#4CAF50' : '#f44336',
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    fontSize: '14px'
                }}>
                    {connected ? ' Connected' : 'Disconnected'}
                </div>
            )}

            {/* Collaborators */}
            {connected && presence.length > 0 && (
                <Collaborators users={presence} />
            )}

            {/* Action Bar */}
            <ActionBar
                tool={tool}
                setTool={setTool}
                currentColor={currentColor}
                onColorChange={setCurrentColor}
            />

            {/* Text Input */}
            {action === "writing" && selectedElement && (
                <textarea
                    ref={textAreaRef}
                    onBlur={handleBlur}
                    className="textArea"
                    style={{
                        position: 'absolute',
                        zIndex: 10,
                        top:
                            (selectedElement.y1 - 2) * scale +
                            panOffset.y * scale -
                            scaleOffset.y,
                        left:
                            selectedElement.x1 * scale +
                            panOffset.x * scale -
                            scaleOffset.x,
                        font: `${24 * scale}px sans-serif`,
                        padding: '4px',
                        margin: 0,
                        background: 'transparent',
                        color: '#000',
                        outline: 'none',
                        resize: 'none',
                        overflow: 'hidden',
                        lineHeight: 1,
                        whiteSpace: 'nowrap',
                        pointerEvents: 'auto',
                        minWidth: '200px',
                    }}
                    onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            textAreaRef.current?.blur();
                        }
                    }}
                    autoFocus
                />
            )}

            {/* Canvas */}
            <canvas
                ref={canvasRef}
                id="canvas"
                width={dimensions.width}
                height={dimensions.height}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    zIndex: 1,
                    width: '100vw',
                    height: '100vh',
                    cursor: tool === Tools.text ? 'text' : tool === Tools.selection ? 'default' : 'crosshair',
                    touchAction: 'none',
                    msTouchAction: 'none',
                    WebkitTouchCallout: 'none',
                    WebkitUserSelect: 'none',
                    KhtmlUserSelect: 'none',
                    MozUserSelect: 'none',
                    msUserSelect: 'none',
                    userSelect: 'none',
                    WebkitTapHighlightColor: 'rgba(0,0,0,0)'
                }}
            />
        </div>
    )
}
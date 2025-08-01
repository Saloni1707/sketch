"use client"

import {useState} from "react";
import { ElementType} from "../store/useSketchStore";

export const useHistory = (initialState:ElementType[] = []) => {
    const [index, setIndex] = useState(0);
    const [history, setHistory] = useState<ElementType[][]>([Array.isArray(initialState) ? initialState : []]);

    const setState = (
        action: ElementType[] | ((current: ElementType[]) => ElementType[]),
        overWrite = false 
    ) => {
        const newState = 
        typeof action === "function" ? action(history[index]) : action;
        if(overWrite){
            const historyCopy = [...history];
            historyCopy[index] = newState;
            setHistory(historyCopy);
        }else{
            const updatedState = [...history].slice(0,index + 1);
            setHistory([...updatedState,newState]);
            setIndex((prevState) => prevState + 1);
        }
    };

    const undo = () => index > 0 && setIndex((prevState) => prevState - 1);
    const redo = () =>
        index < history.length - 1 && setIndex((prevState) => prevState + 1);

    // Ensure we always return an array, even if history[index] is undefined
    const elements = Array.isArray(history[index]) ? history[index] : [];
    
    return {
        elements,
        setElements: setState,
        undo,
        redo,
    };
};
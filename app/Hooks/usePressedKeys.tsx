"use client"

import { useEffect, useState } from "react";


export const usePressedKeys = () => {
    const [ pressedKeys ,setPressedKeys] = useState<Set<string>>(new Set());    //ensures tht key appears ek baar hi in <Set<string>>

    const handleKeyDown = (event: KeyboardEvent) => {
        setPressedKeys((prevKeys) => new Set(prevKeys).add(event.key));
    }
    const handleKeyUp = (event:KeyboardEvent) => {
        setPressedKeys((prevKeys) => {
            const updatedKeys = new Set(prevKeys);
            updatedKeys.delete(event.key.toLowerCase());
            return updatedKeys;
        });
    };

    useEffect(() => {
        window.addEventListener("keydown",handleKeyDown);
        window.addEventListener("keyup",handleKeyUp);

        return () => {
            window.removeEventListener("keydown",handleKeyDown);
            window.removeEventListener("keyup",handleKeyUp);
        };
    },[])

    return pressedKeys; 
}

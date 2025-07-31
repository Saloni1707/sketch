import React from "react";

interface ColorPaletteProps{
    currentColor: string;
    onChange: (color: string) => void;
}

export default function ColorPalette({currentColor,onChange}:ColorPaletteProps){
    const colors=[
    // Basic colors
    "#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16", "#22c55e", "#10b981",
    "#14b8a6", "#06b6d4", "#0ea5e9", "#3b82f6", "#6366f1", "#8b5cf6", "#a855f7",
    "#d946ef", "#ec4899", "#f43f5e",
    // Neutral tones
    "#000000", "#171717", "#262626", "#404040", "#525252", "#737373", "#a3a3a3",
    "#d4d4d4", "#e5e5e5", "#f5f5f5", "#ffffff",
    ];

    return(
        <div className="color-palette">
            {colors.map(color => (
                <button
                    key={color}
                    className={currentColor === color ? "selected":" "}
                    style={{backgroundColor:color,width:24,height:24,border:'1px solid #ccc',margin:2}}
                    //onClick={e => onChange(e.target.value)}                
                />
            ))
            }

        </div>
    )
}
// components/action-bar/action-bar.tsx
"use client";

import { TOOLS, Tool } from "../../store/useSketchStore";
import { LuPencil } from "react-icons/lu";
import { FiCircle, FiMinus, FiMousePointer, FiSquare, FiType } from "react-icons/fi";
import { IoHandRightOutline } from "react-icons/io5";
import styles from "./ActionBar.module.css";
import ColorPalette from "../ColorPalette/ColorPalette";

type ActionBarProps = {
  tool: Tool;
  setTool: (tool: Tool) => void;
  currentColor: string;
  onColorChange: (color: string) => void;
};

export function ActionBar({ tool, setTool, currentColor, onColorChange }: ActionBarProps) {
  return (
    <div className={styles.actionBarWrapper}>
      <div className={styles.actionBar}>
        {/* Tools */}
        <div className={styles.toolsGroup}>
          {TOOLS.map((t) => (
            <div
              key={t}
              className={`${styles.inputWrapper} ${tool === t ? styles.selected : ""}`}
              onClick={() => setTool(t)}
            >
              <input
                type="radio"
                id={t}
                checked={tool === t}
                onChange={() => setTool(t)}
                readOnly
              />
              <label htmlFor={t}>
                {t === "pan" && <IoHandRightOutline />}
                {t === "selection" && <FiMousePointer />}
                {t === "rectangle" && <FiSquare />}
                {t === "line" && <FiMinus />}
                {t === "pencil" && <LuPencil />}
                {t === "text" && <FiType />}
                {t === "circle" && <FiCircle />}
              </label>
            </div>
          ))}
          
          {/* Separator */}
          <div className={styles.separator}></div>
          
          {/* Color Picker */}
          <div className={styles.colorPickerGroup}>
            <ColorPalette currentColor={currentColor} onChange={onColorChange} />
          </div>
        </div>
      </div>
    </div>
  );
}
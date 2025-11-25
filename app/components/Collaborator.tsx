//live collabarators on the project here
import React from "react";

type Props = {
    users:string[];
}

export default function Collabarators({users}:Props){
    return(
        <div style={{
            position: "absolute",
            top: 12,
            right: 12,
            zIndex: 20,
            background: "rgba(255,255,255,0.9)",
            padding: "8px 12px",
            borderRadius: 8,
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            minWidth: 160
        }}>

        <div style={{ fontWeight: 600, marginBottom: 6 }}>Collaborators</div>
        {users.length === 0 ? <div style={{ fontSize: 13, color: "#666" }}>No one else</div> :
          <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
            {users.map((u, i) => (
              <li key={i} style={{ fontSize: 13, padding: "4px 0" }}>{u}</li>
            ))}
          </ul>
        }
        </div>
    )
}

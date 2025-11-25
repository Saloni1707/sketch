import React,{useState} from "react";

type Props = {
    onSubmit:(name:string)=>void;
    initialName?:string;
};

export default function NamePrompt({onSubmit,initialName}:Props){
    const [name,setName] = useState(initialName);

    return(
        <div style={{
            position:"fixed",
            inset:0,
            display:"flex",
            justifyContent:"center",
            alignItems:"center",
            zIndex:1000,
            backgroundColor:"rgba(0,0,0,0.4)",
        }}>

            <div style={{
                background:"white",
                padding:"20px",
                borderRadius:"8px",
                boxShadow:"0 4px 12px rgba(0,0,0,0.1)",
            }}>
                <h3>Enter your name</h3>
                <input 
                value={name}
                onChange={(e)=>setName(e.target.value)}
                placeholder="Your name"
                style={{width:"100%",padding:"8px",marginBottom:12}}
                />
                <div style={{display:"flex",justifyContent:"flex-end",marginTop:12}}>
                    <button onClick={()=>onSubmit(name?.trim() || "Anonymous")} style={{padding:"8px 12px"}}>
                        Join
                    </button>
                </div>
            </div>
        </div>
    );
}
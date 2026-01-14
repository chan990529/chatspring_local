import React, { useEffect, useState } from "react";
import { Button } from "@mui/material";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw"; // 추가된 부분
import "./markdown.css"; // 새로 추가된 CSS 파일


import scalping_tutoral from "./Scalping_tutorial.md"


export default function Tutorial() {
    const [markdown, setMarkdown] = useState("");

    useEffect(() => {
        fetch(scalping_tutoral)
            .then((response) => response.text())
            .then((text) => setMarkdown(text));
    }, []);

    return (
        <div style={{ width: "100%", justifyContent: "center", display: "flex" }}>
            <div style={{maxWidth: "768px", width: "100%"}}>
                <ReactMarkdown rehypePlugins={[rehypeHighlight, rehypeRaw]}>
                    {markdown}
                </ReactMarkdown>
            </div>

        </div>
    );
}
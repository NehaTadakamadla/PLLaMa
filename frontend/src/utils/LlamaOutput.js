import React from "react";
import ReactMarkdown from "react-markdown";

export function LlamaOutput({ content }){
    // content = content.replace(/^([^\s#])([#]+)([^\s#])/gm, '$1 $2 $3'); // Add space after markdown headers

    // text = text.replace(/([^\n])([#]{1,6})([^\s#])/g, '$1\n$2 $3');
  
    // // Step 2: For proper line-start headings without space after #, add the space
    // // This handles cases like "\n#Heading" -> "\n# Heading"
    // text = text.replace(/^([#]+)([^\s#])/gm, '$1 $2');

    // content = content.replace(/^([#]+)([^\s#])/gm, '$1 $2');
    // console.log("LlamaOutput content:", content);
    return <p className="text-[15px] leading-relaxed whitespace-pre-wrap">
        <ReactMarkdown
        components={{
            h1: ({ children }) => (
                <h1 className="text-4xl font-bold mb-4 mt-6 text-gray-900">
                {children}
                </h1>
            ),
            h2: ({ children }) => (
                <h2 className="text-3xl font-bold mb-3 mt-4 text-gray-900">
                {children}
                </h2>
            ),
            h3: ({ children }) => (
                <h3 className="text-2xl font-bold mb-3 mt-4 text-gray-900">
                {children}
                </h3>
            ),
            p: ({ children }) => (
                <p className="mb-3 leading-relaxed">{children}</p>
            ),
            ol: ({ children }) => (
                <ol className="list-decimal list-inside mb-3">{children}</ol>
            ),
            ul: ({ children }) => (
                <ul className="list-disc list-inside mb-3">{children}</ul>
            ),
            }}
        >
        {content}
        </ReactMarkdown>
    </p>
}
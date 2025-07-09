"use client";

import React, { useRef, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { motion } from "framer-motion";

type MarkdownMessageProps = {
  content: string;
  isAI?: boolean;
  animated?: boolean; // New prop to enable streaming animation
  onRender?: () => void;
};

export function MarkdownMessage({
  content,
  isAI = false,
  animated = false,
  onRender,
}: MarkdownMessageProps) {
  const messageRef = useRef<HTMLDivElement>(null);
  const [displayedText, setDisplayedText] = useState(animated ? "" : content);

  useEffect(() => {
    if (onRender) onRender();
    if (!animated) {
      setDisplayedText(content);
      messageRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
      return;
    }

    let i = 0;
    let timer: NodeJS.Timeout;

    function type() {
      if (i <= content.length) {
        setDisplayedText(content.slice(0, i));
        i++;
        timer = setTimeout(type, 12);
      } else {
        // After finished typing scroll into view again
        messageRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "end",
        });
      }
    }

    type();

    return () => clearTimeout(timer);
  }, [content, animated, onRender]);

  return (
    <motion.div
      ref={messageRef}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={
        isAI ? "bg-[#343541] text-white p-4 rounded-xl max-w-2xl shadow-md" : ""
      }
    >
      <div className="prose dark:prose-invert max-w-none prose-headings:font-semibold prose-h1:text-3xl prose-h2:text-2xl prose-p:leading-relaxed">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight]}
          components={{
            code({ inline, className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || "");
              const codeString = String(children).replace(/\n$/, "");

              if (!inline) {
                return (
                  <div className="relative group my-4">
                    <pre className="overflow-x-auto rounded-lg p-4 text-sm font-mono shadow-md">
                      <code
                        className={`language-${match?.[1] || "plaintext"}`}
                        {...props}
                      >
                        {codeString}
                      </code>
                    </pre>
                  </div>
                );
              }

              return (
                <code className="px-1 py-0.5 rounded text-sm font-mono">
                  {children}
                </code>
              );
            },
            h1: ({ children }) => (
              <h1 className="text-3xl font-bold mt-6 mb-3 text-white">
                {children}
              </h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-2xl font-semibold mt-5 mb-3 text-gray-100">
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-xl font-medium mt-4 mb-2 text-gray-200">
                {children}
              </h3>
            ),
            p: ({ children }) => {
              const isOnlyText = React.Children.toArray(children).every(
                (child: any) => typeof child === "string"
              );
              if (!isOnlyText) {
                return (
                  <div className="my-2 leading-relaxed text-gray-300">
                    {children}
                  </div>
                );
              }
              return (
                <p className="text-base leading-relaxed text-gray-300 my-2">
                  {children}
                </p>
              );
            },
            ul: ({ children }) => (
              <ul className="list-disc pl-6 my-2 text-gray-300">{children}</ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal pl-6 my-2 text-gray-300">
                {children}
              </ol>
            ),
            li: ({ children }) => (
              <li className="my-1 text-gray-300">{children}</li>
            ),
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-gray-600 pl-4 italic my-4 text-gray-400">
                {children}
              </blockquote>
            ),
            a: ({ children, href }) => (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 underline hover:text-blue-300"
              >
                {children}
              </a>
            ),
            table: ({ children }) => (
              <table className="min-w-full border-collapse my-4">
                {children}
              </table>
            ),
            th: ({ children }) => (
              <th className="border-b border-gray-600 px-3 py-2 text-left font-semibold text-gray-200">
                {children}
              </th>
            ),
            td: ({ children }) => (
              <td className="border-b border-gray-700 px-3 py-2 text-gray-300">
                {children}
              </td>
            ),
          }}
        >
          {displayedText}
        </ReactMarkdown>
      </div>
    </motion.div>
  );
}

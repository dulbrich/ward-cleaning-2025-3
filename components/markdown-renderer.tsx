import fs from 'fs';
import path from 'path';
import React from 'react';

function parseMarkdown(markdown: string): React.ReactNode[] {
  const lines = markdown.split(/\r?\n/);
  const elements: React.ReactNode[] = [];
  let paragraph: string[] = [];
  let list: string[] | null = null;

  const pushParagraph = (key: number) => {
    if (paragraph.length) {
      elements.push(<p key={key}>{paragraph.join(' ')}</p>);
      paragraph = [];
    }
  };

  const pushList = (key: number) => {
    if (list) {
      elements.push(
        <ul key={key}>
          {list.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      );
      list = null;
    }
  };

  lines.forEach((line, idx) => {
    if (line.startsWith('# ')) {
      pushParagraph(idx);
      pushList(idx);
      elements.push(<h1 key={idx}>{line.slice(2)}</h1>);
    } else if (line.startsWith('## ')) {
      pushParagraph(idx);
      pushList(idx);
      elements.push(<h2 key={idx}>{line.slice(3)}</h2>);
    } else if (line.startsWith('### ')) {
      pushParagraph(idx);
      pushList(idx);
      elements.push(<h3 key={idx}>{line.slice(4)}</h3>);
    } else if (line.startsWith('- ')) {
      pushParagraph(idx);
      if (!list) list = [];
      list.push(line.slice(2));
    } else if (line.match(/^\d+\. /)) {
      pushParagraph(idx);
      if (!list) list = [];
      list.push(line.replace(/^\d+\. /, ''));
    } else if (line.trim() === '') {
      pushParagraph(idx);
      pushList(idx);
    } else {
      paragraph.push(line);
    }
  });

  pushParagraph(lines.length);
  pushList(lines.length + 1);
  return elements;
}

interface MarkdownRendererProps {
  filePath: string;
}

export default function MarkdownRenderer({ filePath }: MarkdownRendererProps) {
  const fullPath = path.join(process.cwd(), filePath);
  let markdown = '';
  try {
    markdown = fs.readFileSync(fullPath, 'utf8');
  } catch (error) {
    console.error('Could not load markdown file:', fullPath, error);
    return <p className="text-destructive">Failed to load documentation.</p>;
  }
  return <>{parseMarkdown(markdown)}</>;
}

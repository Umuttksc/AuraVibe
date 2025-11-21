import { Link } from "react-router-dom";

interface HashtagTextProps {
  text: string;
  className?: string;
}

export default function HashtagText({ text, className = "" }: HashtagTextProps) {
  // Regular expression to match hashtags
  const hashtagRegex = /#[a-zA-ZğüşıöçĞÜŞİÖÇ0-9_]+/g;
  
  // Split text into parts (text and hashtags)
  const parts = [];
  let lastIndex = 0;
  let match;
  
  while ((match = hashtagRegex.exec(text)) !== null) {
    // Add text before hashtag
    if (match.index > lastIndex) {
      parts.push({
        type: "text" as const,
        content: text.substring(lastIndex, match.index),
      });
    }
    
    // Add hashtag
    parts.push({
      type: "hashtag" as const,
      content: match[0],
    });
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add remaining text
  if (lastIndex < text.length) {
    parts.push({
      type: "text" as const,
      content: text.substring(lastIndex),
    });
  }
  
  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (part.type === "hashtag") {
          return (
            <Link
              key={index}
              to={`/hashtag/${part.content.substring(1)}`}
              className="text-primary hover:underline font-medium"
              onClick={(e) => e.stopPropagation()}
            >
              {part.content}
            </Link>
          );
        }
        return <span key={index}>{part.content}</span>;
      })}
    </span>
  );
}

"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { Check, ClipboardCopy } from "lucide-react";
import { useCallback, useState } from "react";

interface CopyUrlButtonProps {
  url: string;
}

export function CopyUrlButton({ url }: CopyUrlButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = url;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  }, [url]);

  return (
    <Button
      className="shrink-0 gap-1.5"
      onClick={handleCopy}
      size="sm"
      type="button"
      variant={copied ? "secondary" : "outline"}
    >
      {copied ? (
        <>
          <Check className="size-3.5" />
          Copied
        </>
      ) : (
        <>
          <ClipboardCopy className="size-3.5" />
          Copy
        </>
      )}
    </Button>
  );
}

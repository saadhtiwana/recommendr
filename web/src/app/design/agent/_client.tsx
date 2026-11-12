"use client";

import { SquarePen } from "lucide-react";
import { AnimatePresence } from "motion/react";
import { useCallback, useState } from "react";
import { AppShell, NavItem } from "@/components/app/app-shell";
import { cn } from "@/lib/cn";
import { ArtifactView, Chat, type Artifact } from "./_chat";

const HISTORY = [
  { group: "Today", items: ["Sources citing Prospect Pie", "Gluten-free prompt on Gemini"] },
  { group: "Yesterday", items: ["Delivery false fact fix", "Late-night hours on Gemini"] },
  { group: "Last 7 days", items: ["Large group prompts", "Weekly report", "robots.txt and OAI-SearchBot"] },
];

export function AgentPreview() {
  const [artifact, setArtifact] = useState<Artifact | null>(null);
  const [chat, setChat] = useState(0);
  const [current, setCurrent] = useState<string | null>(null);
  const close = useCallback(() => setArtifact(null), []);
  const reset = () => {
    setChat((c) => c + 1);
    setCurrent(null);
    setArtifact(null);
  };

  // Recent chats sit under the main nav in the sidebar.
  const sidebar = (
    <div className="flex flex-col">
      <NavItem icon={SquarePen} label="New chat" onClick={reset} />
      {HISTORY.map((g) => (
        <div key={g.group} className="mt-4">
          <p className="px-3 text-[12px] font-semibold text-ink-3">{g.group}</p>
          <ul className="mt-1 flex flex-col">
            {(g.group === "Today" && current ? [current, ...g.items] : g.items).map((item, i) => (
              <li key={item}>
                <button
                  type="button"
                  className={cn(
                    "block h-9 w-full truncate rounded-full px-3 text-left text-small text-ink-2 hover:bg-fill hover:text-ink focus-visible:focus-ring",
                    g.group === "Today" && i === 0 && current && "bg-fill text-ink",
                  )}
                >
                  {item}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );

  return (
    <AppShell active="agent" sidebar={sidebar} footer={false}>
      <div className="flex min-w-0 items-start">
        <Chat key={chat} variant="page" onArtifact={setArtifact} onStart={setCurrent} />
        <AnimatePresence>{artifact ? <ArtifactView key="artifact" artifact={artifact} onClose={close} /> : null}</AnimatePresence>
      </div>
    </AppShell>
  );
}

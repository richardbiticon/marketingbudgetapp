"use client";
import * as React from "react";
import { UserRound } from "lucide-react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "./ui/select";
import { TEAM, getActor, setActor } from "@/lib/actor";

// Interim "who am I" picker. Becomes a real Google sign-in in the next phase.
export function Identity({ onChange }: { onChange?: (name: string) => void }) {
  const [name, setName] = React.useState(TEAM[0]);
  React.useEffect(() => { setName(getActor()); }, []);

  function pick(v: string) {
    setActor(v);
    setName(v);
    onChange?.(v);
  }

  return (
    <div className="flex items-center gap-2">
      <span className="hidden font-mono text-[10px] uppercase tracking-wider text-dim sm:inline">You</span>
      <Select value={name} onValueChange={pick}>
        <SelectTrigger className="h-9 w-36">
          <span className="flex items-center gap-2">
            <UserRound className="h-3.5 w-3.5 text-red" />
            <SelectValue />
          </span>
        </SelectTrigger>
        <SelectContent>
          {TEAM.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

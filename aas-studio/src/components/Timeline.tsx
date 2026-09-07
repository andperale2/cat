"use client";

import React from "react";
import { Crosshair, Trash2 } from "lucide-react";

export interface Shot {
  id: number;
  timecode: string;
  shot_type: string;
  motion_prompt: string;
  anchorImage?: string; // e.g. "@1.jpg" or blob URL
}

interface TimelineProps {
  shots: Shot[];
  onUpdatePrompt: (id: number, newPrompt: string) => void;
  onDeleteShot: (id: number) => void;
}

export default function Timeline({ shots, onUpdatePrompt, onDeleteShot }: TimelineProps) {
  if (shots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-zinc-600 space-y-4">
        <Crosshair size={48} className="opacity-20" />
        <p className="text-xs font-mono text-center max-w-[250px]">
          NO SEQUENCE LOADED. RUN VIDEO ANALYSIS OR BUILD CLIPS MANUALLY.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {shots.map((shot, index) => (
        <div key={shot.id} className="panel-glass border-l-4 border-l-[#FF7B00] p-4 group hover:border-zinc-700 transition-colors">
          <div className="flex justify-between items-center mb-3">
            <span className="bg-black text-[#FF7B00] font-mono text-[10px] px-2 py-1 rounded border border-zinc-800 font-bold">
              TOMA {index + 1} ({shot.timecode})
            </span>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-zinc-500 font-mono">{shot.shot_type}</span>
              <button
                onClick={() => onDeleteShot(shot.id)}
                className="text-zinc-600 hover:text-[#FF2A2A] transition-colors"
                title="Eliminar Toma"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          <div className="flex gap-4">
            {/* Linked Asset Slot (Dropzone for startframe) */}
            <div className="w-24 h-24 bg-black/50 border border-dashed border-zinc-700 rounded-lg flex flex-col items-center justify-center shrink-0 group-hover:border-[#00E5FF]/50 transition-colors cursor-pointer relative overflow-hidden">
              {shot.anchorImage ? (
                <>
                  <div className="absolute inset-0 bg-zinc-800 flex items-center justify-center text-[10px] text-zinc-500">
                    Image
                  </div>
                  <div className="absolute bottom-0 w-full bg-black/80 text-[#00E5FF] text-[8px] font-mono text-center py-0.5">
                    {shot.anchorImage}
                  </div>
                </>
              ) : (
                <>
                  <Crosshair size={16} className="text-zinc-600 mb-2" />
                  <span className="text-[9px] text-zinc-500 font-mono text-center px-2">DROP STARTFRAME</span>
                </>
              )}
            </div>

            {/* Prompt & Config */}
            <div className="flex-1 flex flex-col gap-2">
              <textarea
                className="input-studio flex-1 resize-none leading-relaxed"
                placeholder="Animate strictly from @startframe..."
                value={shot.motion_prompt}
                onChange={(e) => onUpdatePrompt(shot.id, e.target.value)}
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  className="input-studio !mb-0 !w-1/3 text-zinc-500"
                  placeholder="Output File (ej. 01_shot)"
                  value={`${String(index + 1).padStart(2, '0')}_shot`}
                  readOnly
                />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

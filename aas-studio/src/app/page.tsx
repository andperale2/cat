"use client";

import React, { useState } from "react";
import { Image as ImageIcon, Play, Save, Download, Video, Crosshair, Search, Loader2 } from "lucide-react";
import Timeline, { Shot } from "@/components/Timeline";
import { assemblePrompt } from "@/lib/engine";

export default function Home() {
  const [activeTab, setActiveTab] = useState("MEDIA");
  const [shots, setShots] = useState<Shot[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setVideoFile(e.target.files[0]);
    }
  };

  const analyzeVideo = async () => {
    if (!videoFile) return;
    setIsAnalyzing(true);

    try {
      const formData = new FormData();
      formData.append("file", videoFile);

      const res = await fetch("/api/analyze", {
        method: "POST",
        body: formData
      });

      if (!res.ok) throw new Error("Analysis failed");

      const data = await res.json();
      if (data.shots) {
        // Automatically assemble the strict 7-block formatting for every shot upon load
        const assembledShots = data.shots.map((shot: Shot) => ({
          ...shot,
          finalPrompt: assemblePrompt(shot, data.entities_detected)
        }));
        setShots(assembledShots);
      }
    } catch (error) {
      console.error(error);
      alert("Error analyzing video");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleUpdatePrompt = (slotId: number, newPrompt: string) => {
    setShots(shots.map(s => s.slot_id === slotId ? { ...s, finalPrompt: newPrompt } : s));
  };

  const handleDeleteShot = (slotId: number) => {
    setShots(shots.filter(s => s.slot_id !== slotId));
  };

  return (
    <div className="h-screen w-screen bg-[#09090b] text-zinc-200 flex flex-col font-sans overflow-hidden">

      {/* HEADER / TOOLBAR */}
      <header className="h-14 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-[11px] font-bold tracking-widest text-zinc-400">
            <div className="w-2 h-2 rounded-full bg-[#FF2A2A] shadow-[0_0_8px_#FF2A2A] animate-pulse" />
            AAS LIVE-ACTION STUDIO
          </div>
          <div className="bg-black/80 text-[#00E5FF] font-mono text-xs px-3 py-1 rounded border border-zinc-800 shadow-[0_0_10px_rgba(0,229,255,0.1)]">
            TC [00:00:00:00]
          </div>
        </div>
        <div className="flex gap-2">
          <button className="text-zinc-500 hover:text-white transition-colors"><Save size={16} /></button>
          <button className="text-zinc-500 hover:text-white transition-colors"><Download size={16} /></button>
        </div>
      </header>

      {/* MAIN WORKSPACE */}
      <main className="flex-1 flex overflow-hidden">

        {/* LEFT COLUMN: Media & Analysis */}
        <section className="w-[350px] shrink-0 border-r border-zinc-800 flex flex-col bg-[#101014]">
          {/* Switcher */}
          <div className="flex bg-black/40 border-b border-zinc-800 shrink-0">
            <button
              className={`flex-1 py-3 text-[10px] font-bold tracking-wider border-b-2 transition-all ${activeTab === 'MEDIA' ? 'border-[#00E5FF] text-[#00E5FF] bg-zinc-900/50' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
              onClick={() => setActiveTab('MEDIA')}
            >
              BANCO DE MEDIOS
            </button>
            <button
              className={`flex-1 py-3 text-[10px] font-bold tracking-wider border-b-2 transition-all ${activeTab === 'DIRECTOR' ? 'border-[#FF7B00] text-[#FF7B00] bg-zinc-900/50' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
              onClick={() => setActiveTab('DIRECTOR')}
            >
              DIRECTOR IA
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">

            {activeTab === 'DIRECTOR' && (
              <div className="panel-glass p-4 border-[#FF7B00]/30">
                <div className="flex items-center gap-2 mb-3 text-[#FF7B00] text-xs font-bold uppercase tracking-wider">
                  <Video size={14} /> Video Analysis
                </div>
                <label className="border border-dashed border-[#FF7B00]/50 bg-[#FF7B00]/5 rounded-lg p-6 text-center cursor-pointer hover:bg-[#FF7B00]/10 transition-colors block">
                  <input type="file" accept="video/mp4,video/webm" className="hidden" onChange={handleVideoUpload} />
                  {videoFile ? (
                     <p className="text-xs text-zinc-300 font-mono">{videoFile.name}</p>
                  ) : (
                     <React.Fragment>
                        <p className="text-xs text-[#FF7B00] font-semibold mb-2">Drop Reference Clip</p>
                        <p className="text-[10px] text-zinc-500">MP4, WEBM (Max 15s)</p>
                     </React.Fragment>
                  )}
                </label>
                <button
                  onClick={analyzeVideo}
                  disabled={!videoFile || isAnalyzing}
                  className="btn-studio bg-[#FF7B00] text-black w-full mt-3 hover:bg-[#ff9533] hover:shadow-[0_0_15px_rgba(255,123,0,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAnalyzing ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                  {isAnalyzing ? "ANALIZANDO..." : "ANALIZAR CON GEMINI"}
                </button>
              </div>
            )}

            {activeTab === 'MEDIA' && (
              <React.Fragment>
                <div className="border border-dashed border-[#00E5FF]/50 bg-[#00E5FF]/5 rounded-lg p-5 text-center">
                  <ImageIcon size={20} className="mx-auto text-[#00E5FF] mb-2 opacity-80" />
                  <p className="text-xs text-[#00E5FF] font-semibold mb-1">Upload Keyframes</p>
                  <p className="text-[10px] text-zinc-500">JPEG, PNG</p>
                </div>

                <div>
                  <h3 className="text-[10px] font-bold text-zinc-500 mb-2 tracking-wider">ASSETS EN CACHÉ</h3>
                  <div className="space-y-2">
                    {/* Placeholder Asset */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded p-2 flex items-center gap-3">
                      <div className="w-10 h-10 bg-zinc-800 rounded shrink-0 border border-zinc-700" />
                      <div className="flex-1 min-w-0">
                        <div className="inline-block bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/20 px-2 py-0.5 rounded-full font-mono text-[9px] mb-1">
                          @1.jpg
                        </div>
                        <p className="text-[10px] text-zinc-500 truncate">todoroki_crouch.jpg</p>
                      </div>
                    </div>
                  </div>
                </div>
              </React.Fragment>
            )}

          </div>
        </section>

        {/* MIDDLE COLUMN: Timeline & Orchestrator */}
        <section className="flex-[2] flex flex-col border-r border-zinc-800 bg-[#09090b]">
          <div className="h-10 border-b border-zinc-800 bg-zinc-900/50 flex items-center px-4 shrink-0">
            <span className="text-[10px] font-bold tracking-wider text-zinc-400">LÍNEA DE TIEMPO (SHOT CONNECTOR)</span>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <Timeline
              shots={shots}
              onUpdatePrompt={handleUpdatePrompt}
              onDeleteShot={handleDeleteShot}
            />
          </div>
        </section>

        {/* RIGHT COLUMN: Master Monitor */}
        <section className="flex-[1.5] flex flex-col bg-black">
          {/* Monitor Viewport */}
          <div className="aspect-video bg-zinc-900 border-b border-zinc-800 relative flex items-center justify-center">
            <span className="text-zinc-700 font-mono text-xs font-bold tracking-widest">NO MEDIA LOADED</span>

            {/* Overlay Timecode */}
            <div className="absolute top-4 right-4 bg-black/60 text-[#00E5FF] font-mono text-xs px-2 py-1 rounded">
              00:00:00:00
            </div>
          </div>

          {/* Deck Controls */}
          <div className="p-6 flex-1 flex flex-col justify-end bg-gradient-to-b from-[#09090b] to-[#101014]">

            <div className="space-y-2 mb-6">
              <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                <span>ESTADO</span>
                <span className="text-[#00E5FF]">IDLE</span>
              </div>
              <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-[#00E5FF] w-0 transition-all duration-300" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
               <button className="btn-secondary">COMPILAR ZIP</button>
               <button className="btn-secondary">RENDERIZAR FINAL</button>
            </div>
            <button className="btn-primary w-full py-4 text-sm">
              <Play fill="currentColor" size={16} /> MASTER RENDER
            </button>
          </div>
        </section>

      </main>
    </div>
  );
}

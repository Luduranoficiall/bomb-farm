import React, { useState } from 'react';
import { PassiveNode } from '../game/types';
import { Language, translations } from '../game/localization';
import { soundEngine } from '../game/audio';
import { Sparkles, Check, Lock, RotateCcw } from 'lucide-react';

interface SkillTreeModalProps {
  lang: Language;
  skillNodes: PassiveNode[];
  skillPointsAvailable: number;
  onAllocateNode: (nodeId: string) => void;
  onResetSkillTree: () => void;
}

export const SkillTreeModal: React.FC<SkillTreeModalProps> = ({
  lang,
  skillNodes,
  skillPointsAvailable,
  onAllocateNode,
  onResetSkillTree,
}) => {
  const t = translations[lang];
  const [selectedNodeId, setSelectedNodeId] = useState<string>('p_core');

  const selectedNode = skillNodes.find((n) => n.id === selectedNodeId) || skillNodes[0];

  // Helper to check if node can be allocated
  const canAllocate = (node: PassiveNode) => {
    if (node.allocated) return false;
    if (skillPointsAvailable < node.cost) return false;
    if (node.requires.length === 0) return true;
    return node.requires.some((reqId) => {
      const parent = skillNodes.find((n) => n.id === reqId);
      return parent && parent.allocated;
    });
  };

  return (
    <div className="w-full h-full p-4 lg:p-6 overflow-hidden bg-[#0a0d14] text-slate-100 flex flex-col gap-4 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-3">
        <div>
          <h2 className="text-xl font-black font-display tracking-wide text-amber-400 uppercase">
            🌳 {t.skillTreeTitle}
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            {t.skillTreeSubtitle}.
          </p>
        </div>

        {/* Skill Points & Reset */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-700/80">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-mono">
              <span className="text-slate-400">{t.skillPointsAvailable}:</span>{' '}
              <span className="text-amber-400 font-bold text-sm tabular-nums">
                {skillPointsAvailable}
              </span>
            </span>
          </div>

          <button
            onClick={() => {
              soundEngine.playForgeClink(false);
              onResetSkillTree();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-medium text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t.resetTree}</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Skill Web Canvas / SVG */}
      <div className="relative flex-1 w-full bg-[#0d1117] rounded-xl border border-slate-800/80 overflow-hidden flex flex-col lg:flex-row">
        {/* Visual Constellation Viewport */}
        <div className="relative flex-1 h-[450px] lg:h-full overflow-auto flex items-center justify-center p-6 bg-radial from-slate-900/60 via-[#0d1117] to-[#0a0d14]">
          <svg className="w-[800px] h-[700px] shrink-0" viewBox="0 0 800 700">
            {/* Draw connecting lines between nodes */}
            {skillNodes.map((node) => {
              return node.requires.map((reqId) => {
                const parent = skillNodes.find((n) => n.id === reqId);
                if (!parent) return null;

                const isPathActive = parent.allocated && node.allocated;
                return (
                  <line
                    key={`${reqId}-${node.id}`}
                    x1={parent.x}
                    y1={parent.y}
                    x2={node.x}
                    y2={node.y}
                    stroke={isPathActive ? '#f59e0b' : '#334155'}
                    strokeWidth={isPathActive ? 3 : 1.5}
                    strokeDasharray={isPathActive ? 'none' : '4 4'}
                    className="transition-all duration-300"
                  />
                );
              });
            })}

            {/* Draw nodes */}
            {skillNodes.map((node) => {
              const isSelected = node.id === selectedNodeId;
              const isAvailable = canAllocate(node);

              let nodeColor = '#334155'; // locked
              if (node.allocated) nodeColor = '#f59e0b'; // allocated
              else if (isAvailable) nodeColor = '#38bdf8'; // ready to unlock

              return (
                <g
                  key={node.id}
                  onClick={() => setSelectedNodeId(node.id)}
                  className="cursor-pointer group"
                >
                  {/* Glow circle if allocated or selected */}
                  {(node.allocated || isSelected) && (
                    <circle
                      cx={node.x}
                      y={node.y}
                      r={24}
                      fill={node.allocated ? 'rgba(245, 158, 11, 0.25)' : 'rgba(56, 189, 248, 0.25)'}
                    />
                  )}

                  {/* Outer ring */}
                  <circle
                    cx={node.x}
                    y={node.y}
                    r={18}
                    fill="#161b22"
                    stroke={isSelected ? '#ffffff' : nodeColor}
                    strokeWidth={isSelected ? 3 : 2}
                  />

                  {/* Inner icon / dot */}
                  <circle
                    cx={node.x}
                    y={node.y}
                    r={8}
                    fill={nodeColor}
                  />

                  {/* Node Title in SVG */}
                  <text
                    x={node.x}
                    y={node.y + 30}
                    fill={node.allocated ? '#fde68a' : '#94a3b8'}
                    fontSize="10"
                    fontWeight="600"
                    fontFamily="Outfit, sans-serif"
                    textAnchor="middle"
                  >
                    {lang === 'pt' ? node.namePt : node.nameEn}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Selected Node Details Panel (Right Sidebar) */}
        {selectedNode && (
          <div className="w-full lg:w-80 bg-slate-950/90 border-t lg:border-t-0 lg:border-l border-slate-800 p-5 flex flex-col justify-between gap-4 shrink-0">
            <div>
              <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
                <span className="uppercase tracking-wider">Cluster: {selectedNode.cluster}</span>
                <span className={`font-bold ${selectedNode.allocated ? 'text-amber-400' : 'text-slate-400'}`}>
                  {selectedNode.allocated ? t.allocated : t.locked}
                </span>
              </div>

              <h3 className="text-lg font-black text-white font-display">
                {lang === 'pt' ? selectedNode.namePt : selectedNode.nameEn}
              </h3>

              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800/80 mt-3 text-xs text-slate-300 leading-relaxed">
                {lang === 'pt' ? selectedNode.descriptionPt : selectedNode.descriptionEn}
              </div>

              <div className="mt-4 flex flex-col gap-1.5 text-xs font-mono">
                <div className="flex justify-between text-slate-400">
                  <span>Custo em Pontos:</span>
                  <span className="text-amber-400 font-bold">{selectedNode.cost} Pts</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Status:</span>
                  <span className={selectedNode.allocated ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                    {selectedNode.allocated ? 'ATIVADO' : canAllocate(selectedNode) ? 'DISPONÍVEL' : 'BLOQUEADO'}
                  </span>
                </div>
              </div>
            </div>

            {/* Allocate Action Button */}
            <button
              onClick={() => {
                if (canAllocate(selectedNode)) {
                  soundEngine.playFanfare();
                  onAllocateNode(selectedNode.id);
                }
              }}
              disabled={selectedNode.allocated || !canAllocate(selectedNode)}
              className={`w-full py-2.5 rounded-lg text-xs font-bold font-display uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                selectedNode.allocated
                  ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30 cursor-default'
                  : canAllocate(selectedNode)
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20 cursor-pointer'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              {selectedNode.allocated ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>{t.allocated}</span>
                </>
              ) : canAllocate(selectedNode) ? (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>{t.allocateNode} ({selectedNode.cost} Pts)</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>{t.locked}</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

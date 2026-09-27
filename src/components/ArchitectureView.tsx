/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { parseDependencyGraph, GraphNode } from '../utils/dependencyGraph';
import { Network, Cpu, Database, Server, FileCode, Sparkles, Layers } from 'lucide-react';

interface ArchitectureViewProps {
  code: string;
  language: string;
  projectName: string;
}

interface SimNode extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  type: 'function' | 'class' | 'service' | 'api' | 'database';
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

interface SimLink extends d3.SimulationLinkDatum<SimNode> {
  source: string | SimNode;
  target: string | SimNode;
}

export const ArchitectureView: React.FC<ArchitectureViewProps> = ({ code, language, projectName }) => {
  const graphData = parseDependencyGraph(code, language);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(graphData.nodes[0] || null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = svgRef.current.clientWidth || 800;
    const height = svgRef.current.clientHeight || 600;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const g = svg.append('g');

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    const nodes: SimNode[] = graphData.nodes.map(n => ({ ...n }));
    const links: SimLink[] = graphData.links.map(l => ({ source: l.source, target: l.target }));

    const simulation = d3.forceSimulation<SimNode>(nodes)
      .force('link', d3.forceLink<SimNode, SimLink>(links).id(d => (d as SimNode).id).distance(120))
      .force('charge', d3.forceManyBody().strength(-350))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(45));

    const link = g.append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', '#475569')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', 2);

    const nodeGroup = g.append('g')
      .selectAll<SVGGElement, SimNode>('g')
      .data(nodes)
      .join('g')
      .call(
        d3.drag<SVGGElement, SimNode>()
          .on('start', (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on('drag', (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on('end', (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      );

    nodeGroup.append('circle')
      .attr('r', 24)
      .attr('fill', d => {
        if (d.type === 'database') return '#0e7490';
        if (d.type === 'service') return '#059669';
        if (d.type === 'api') return '#d97706';
        if (d.type === 'class') return '#4f46e5';
        return '#7c3aed';
      })
      .attr('stroke', '#cbd5e1')
      .attr('stroke-width', 2)
      .on('click', (_, d) => {
        const found = graphData.nodes.find(n => n.id === d.id);
        if (found) setSelectedNode(found);
      });

    nodeGroup.append('text')
      .text(d => d.name)
      .attr('x', 0)
      .attr('y', 38)
      .attr('text-anchor', 'middle')
      .attr('fill', '#e2e8f0')
      .attr('font-size', '11px')
      .attr('font-family', 'monospace');

    simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as SimNode).x || 0)
        .attr('y1', d => (d.source as SimNode).y || 0)
        .attr('x2', d => (d.target as SimNode).x || 0)
        .attr('y2', d => (d.target as SimNode).y || 0);

      nodeGroup
        .attr('transform', d => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, [code, language]);

  const getNodeIcon = (type: GraphNode['type']) => {
    switch (type) {
      case 'class':
        return <Layers className="w-5 h-5 text-indigo-400" />;
      case 'service':
        return <Server className="w-5 h-5 text-emerald-400" />;
      case 'database':
        return <Database className="w-5 h-5 text-cyan-400" />;
      case 'api':
        return <Cpu className="w-5 h-5 text-amber-400" />;
      default:
        return <FileCode className="w-5 h-5 text-purple-400" />;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 text-slate-100 overflow-hidden">
      <div className="h-16 border-b border-slate-800 px-6 flex items-center justify-between bg-slate-900/50 backdrop-blur flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
            <Network className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-100">D3 Force-Directed Architecture Graph</h1>
            <p className="text-xs text-slate-400">Interactive dependency visualization for {projectName}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
            {graphData.nodes.length} Nodes Mapped
          </span>
          <span className="px-3 py-1 rounded-lg bg-indigo-950 border border-indigo-800 text-indigo-300">
            {graphData.links.length} Relations
          </span>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        <div className="absolute top-4 left-4 z-10 bg-slate-900/90 border border-slate-800 rounded-xl p-3 text-xs text-slate-400 max-w-xs shadow-lg backdrop-blur">
          <div className="font-semibold text-slate-200 mb-1 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> D3 Force Simulator
          </div>
          Drag nodes to explore layout physics. Click a node to view relationships.
        </div>

        <svg ref={svgRef} className="w-full h-full cursor-grab active:cursor-grabbing bg-slate-950" />

        {selectedNode && (
          <div className="w-full lg:w-80 bg-slate-900 border-l border-slate-800 p-6 flex flex-col gap-6 overflow-y-auto flex-shrink-0 z-20">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-slate-800 border border-slate-700">
                {getNodeIcon(selectedNode.type)}
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100">{selectedNode.name}</h3>
                <span className="text-[10px] font-mono text-indigo-400 uppercase">{selectedNode.type} Node</span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Used By (Incoming)</h4>
                <div className="space-y-1.5">
                  {graphData.links.filter(l => l.target === selectedNode.id).length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No incoming references</p>
                  ) : (
                    graphData.links
                      .filter(l => l.target === selectedNode.id)
                      .map((l, i) => (
                        <div key={i} className="text-xs font-mono bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-300">
                          {l.source}
                        </div>
                      ))
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Calls / Depends On (Outgoing)</h4>
                <div className="space-y-1.5">
                  {graphData.links.filter(l => l.source === selectedNode.id).length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No outgoing dependencies</p>
                  ) : (
                    graphData.links
                      .filter(l => l.source === selectedNode.id)
                      .map((l, i) => (
                        <div key={i} className="text-xs font-mono bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-300">
                          {l.target}
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

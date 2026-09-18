"use client";

import * as React from "react";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { GraphNode, GraphLink } from "@/actions/concepts";
import { MASTERY_LEVELS } from "./concept-types";

interface KnowledgeGraphVisualizerProps {
  nodes: GraphNode[];
  links: GraphLink[];
  onSelectNode: (nodeId: string) => void;
  selectedNodeId?: string | null;
  searchQuery?: string;
}

interface SimNode extends GraphNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

export function KnowledgeGraphVisualizer({
  nodes,
  links,
  onSelectNode,
  selectedNodeId,
  searchQuery = "",
}: KnowledgeGraphVisualizerProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  // Transform state for pan and zoom
  const [transform, setTransform] = React.useState({ x: 0, y: 0, scale: 1 });
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 });
  const [hoveredNodeId, setHoveredNodeId] = React.useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  // Simulation node positions state
  const simNodesRef = React.useRef<SimNode[]>([]);
  const draggedNodeIdRef = React.useRef<string | null>(null);

  // Initialize simulation nodes with radial/force layout
  React.useEffect(() => {
    const width = containerRef.current?.clientWidth || 800;
    const height = containerRef.current?.clientHeight || 550;
    const centerX = width / 2;
    const centerY = height / 2;

    const angleStep = (2 * Math.PI) / Math.max(nodes.length, 1);

    simNodesRef.current = nodes.map((node, i) => {
      // Find existing position if available
      const existing = simNodesRef.current.find((n) => n.id === node.id);
      if (existing) {
        return {
          ...node,
          x: existing.x,
          y: existing.y,
          vx: existing.vx,
          vy: existing.vy,
          radius: 22 + Math.min(node.dependentsCount * 3, 16),
        };
      }

      // Arrange in layered circles or spiral by category level
      const radiusDist = 120 + (node.categoryLevel || 1) * 70 + (i % 3) * 35;
      const angle = i * angleStep;

      return {
        ...node,
        x: centerX + Math.cos(angle) * radiusDist + (Math.random() - 0.5) * 40,
        y: centerY + Math.sin(angle) * radiusDist + (Math.random() - 0.5) * 40,
        vx: 0,
        vy: 0,
        radius: 22 + Math.min(node.dependentsCount * 3, 16),
      };
    });
  }, [nodes]);

  // Main Canvas Render Loop with Force Simulation
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const dpr = window.devicePixelRatio || 1;

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      // Apply Pan & Zoom Transform
      ctx.save();
      ctx.translate(transform.x, transform.y);
      ctx.scale(transform.scale, transform.scale);

      const simNodes = simNodesRef.current;
      const isDark = document.documentElement.classList.contains("dark");

      // Apply light repulsive physics step between nodes
      const kRepulsion = 1600;
      const kDamping = 0.88;

      for (let i = 0; i < simNodes.length; i++) {
        const n1 = simNodes[i];
        if (draggedNodeIdRef.current === n1.id) continue;

        for (let j = i + 1; j < simNodes.length; j++) {
          const n2 = simNodes[j];
          const dx = n2.x - n1.x;
          const dy = n2.y - n1.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const minDist = n1.radius + n2.radius + 50;

          if (dist < minDist) {
            const force = (kRepulsion / (dist * dist)) * 0.1;
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;

            if (draggedNodeIdRef.current !== n1.id) {
              n1.vx -= fx;
              n1.vy -= fy;
            }
            if (draggedNodeIdRef.current !== n2.id) {
              n2.vx += fx;
              n2.vy += fy;
            }
          }
        }
      }

      // Spring forces along links (prerequisites)
      const nodeMap = new Map(simNodes.map((n) => [n.id, n]));
      for (const link of links) {
        const source = nodeMap.get(link.source);
        const target = nodeMap.get(link.target);
        if (source && target) {
          const dx = target.x - source.x;
          const dy = target.y - source.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const targetDist = 140;
          const force = (dist - targetDist) * 0.003;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;

          if (draggedNodeIdRef.current !== source.id) {
            source.vx += fx;
            source.vy += fy;
          }
          if (draggedNodeIdRef.current !== target.id) {
            target.vx -= fx;
            target.vy -= fy;
          }
        }
      }

      // Update positions with damping
      for (const n of simNodes) {
        if (draggedNodeIdRef.current === n.id) continue;
        n.x += n.vx;
        n.y += n.vy;
        n.vx *= kDamping;
        n.vy *= kDamping;
      }

      // Draw Directed Relationship Links (Edges)
      for (const link of links) {
        const source = nodeMap.get(link.source);
        const target = nodeMap.get(link.target);
        if (!source || !target) continue;

        const isHighlight =
          selectedNodeId === source.id ||
          selectedNodeId === target.id ||
          hoveredNodeId === source.id ||
          hoveredNodeId === target.id;

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);

        if (isHighlight) {
          ctx.strokeStyle = "#007AFF";
          ctx.lineWidth = 2.5;
          ctx.shadowColor = "rgba(0, 122, 255, 0.4)";
          ctx.shadowBlur = 8;
        } else {
          ctx.strokeStyle = isDark
            ? "rgba(255, 255, 255, 0.12)"
            : "rgba(0, 0, 0, 0.12)";
          ctx.lineWidth = 1.5;
        }
        ctx.stroke();

        // Draw directional arrow pointer
        const angle = Math.atan2(target.y - source.y, target.x - source.x);
        const arrowDist = target.radius + 6;
        const arrowX = target.x - Math.cos(angle) * arrowDist;
        const arrowY = target.y - Math.sin(angle) * arrowDist;
        const arrowLen = 9;

        ctx.beginPath();
        ctx.moveTo(arrowX, arrowY);
        ctx.lineTo(
          arrowX - arrowLen * Math.cos(angle - Math.PI / 6),
          arrowY - arrowLen * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
          arrowX - arrowLen * Math.cos(angle + Math.PI / 6),
          arrowY - arrowLen * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fillStyle = isHighlight
          ? "#007AFF"
          : isDark
          ? "rgba(255, 255, 255, 0.25)"
          : "rgba(0, 0, 0, 0.25)";
        ctx.fill();
        ctx.restore();
      }

      // Draw Nodes
      for (const node of simNodes) {
        const isSelected = selectedNodeId === node.id;
        const isHovered = hoveredNodeId === node.id;
        const matchesSearch =
          searchQuery.trim() !== "" &&
          node.title.toLowerCase().includes(searchQuery.toLowerCase().trim());
        const masteryCfg =
          MASTERY_LEVELS[node.masteryLevel] || MASTERY_LEVELS.NOVICE;

        ctx.save();

        // Outer Glowing Mastery Ring
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius + 4, 0, Math.PI * 2);
        if (isSelected || isHovered) {
          ctx.strokeStyle = masteryCfg.ringColor;
          ctx.lineWidth = 3.5;
          ctx.shadowColor = masteryCfg.ringColor;
          ctx.shadowBlur = 14;
        } else if (matchesSearch) {
          ctx.strokeStyle = "#FF9500";
          ctx.lineWidth = 3;
          ctx.shadowColor = "#FF9500";
          ctx.shadowBlur = 12;
        } else {
          ctx.strokeStyle = masteryCfg.ringColor;
          ctx.lineWidth = 2;
          ctx.shadowBlur = 0;
        }
        ctx.stroke();

        // Node Circle Body
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = isSelected
          ? "#007AFF"
          : isDark
          ? "#1C1C1E"
          : "#FFFFFF";
        ctx.shadowColor = isDark
          ? "rgba(0, 0, 0, 0.5)"
          : "rgba(0, 0, 0, 0.08)";
        ctx.shadowBlur = 10;
        ctx.fill();

        ctx.strokeStyle = isDark
          ? "rgba(255, 255, 255, 0.15)"
          : "rgba(0, 0, 0, 0.08)";
        ctx.lineWidth = 1;
        ctx.stroke();

        // Inner Dot Indicator for Mastery Level
        ctx.beginPath();
        ctx.arc(node.x, node.y - 4, 4, 0, Math.PI * 2);
        ctx.fillStyle = isSelected ? "#FFFFFF" : masteryCfg.ringColor;
        ctx.fill();

        // Node Title Label (Formatted Text Below or Centered)
        ctx.font = isSelected
          ? "600 12px -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif"
          : "500 11.5px -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "top";

        const textY = node.y + node.radius + 6;

        // Label Background Pill for readability
        const metrics = ctx.measureText(node.title);
        const textWidth = metrics.width;
        const pillHeight = 18;
        const pillWidth = textWidth + 14;

        ctx.fillStyle = isDark
          ? "rgba(28, 28, 30, 0.85)"
          : "rgba(255, 255, 255, 0.85)";
        ctx.beginPath();
        ctx.roundRect(
          node.x - pillWidth / 2,
          textY - 2,
          pillWidth,
          pillHeight,
          6
        );
        ctx.fill();
        ctx.strokeStyle = isDark
          ? "rgba(255, 255, 255, 0.1)"
          : "rgba(0, 0, 0, 0.06)";
        ctx.stroke();

        // Label Text
        ctx.fillStyle = isSelected
          ? "#FFFFFF"
          : isDark
          ? "#F5F5F7"
          : "#1D1D1F";
        ctx.fillText(node.title, node.x, textY);

        ctx.restore();
      }

      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [links, transform, selectedNodeId, hoveredNodeId, searchQuery]);

  // Mouse / Pointer Event Handlers for Panning & Node Dragging
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left - transform.x) / transform.scale;
    const mouseY = (e.clientY - rect.top - transform.y) / transform.scale;

    // Check if clicked a node
    for (const node of simNodesRef.current) {
      const dx = mouseX - node.x;
      const dy = mouseY - node.y;
      if (Math.sqrt(dx * dx + dy * dy) <= node.radius + 10) {
        draggedNodeIdRef.current = node.id;
        onSelectNode(node.id);
        return;
      }
    }

    // Otherwise start canvas panning
    setIsDragging(true);
    setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left - transform.x) / transform.scale;
    const mouseY = (e.clientY - rect.top - transform.y) / transform.scale;

    if (draggedNodeIdRef.current) {
      const dragged = simNodesRef.current.find(
        (n) => n.id === draggedNodeIdRef.current
      );
      if (dragged) {
        dragged.x = mouseX;
        dragged.y = mouseY;
      }
      return;
    }

    if (isDragging) {
      setTransform((prev) => ({
        ...prev,
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      }));
      return;
    }

    // Detect Hovered Node
    let foundId: string | null = null;
    for (const node of simNodesRef.current) {
      const dx = mouseX - node.x;
      const dy = mouseY - node.y;
      if (Math.sqrt(dx * dx + dy * dy) <= node.radius + 10) {
        foundId = node.id;
        break;
      }
    }
    setHoveredNodeId(foundId);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    draggedNodeIdRef.current = null;
  };

  // Zoom controls
  const handleZoom = (factor: number) => {
    setTransform((prev) => {
      const newScale = Math.min(Math.max(prev.scale * factor, 0.3), 3);
      return {
        ...prev,
        scale: newScale,
      };
    });
  };

  const handleCenter = () => {
    setTransform({ x: 0, y: 0, scale: 1 });
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full h-[580px] rounded-[24px] border border-border bg-surface overflow-hidden shadow-sm transition-all",
        isFullscreen && "fixed inset-0 z-50 h-screen w-screen rounded-none"
      )}
    >
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="w-full h-full cursor-grab active:cursor-grabbing block"
      />

      {/* Floating Graph Controls Bar */}
      <div className="absolute bottom-5 right-5 flex items-center gap-1.5 p-1.5 rounded-2xl bg-surface/85 backdrop-blur-xl border border-border shadow-xl z-10">
        <button
          type="button"
          onClick={() => handleZoom(1.2)}
          className="p-2 rounded-xl text-secondary hover:text-foreground hover:bg-muted-bg transition-colors cursor-pointer"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => handleZoom(0.8)}
          className="p-2 rounded-xl text-secondary hover:text-foreground hover:bg-muted-bg transition-colors cursor-pointer"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleCenter}
          className="p-2 rounded-xl text-secondary hover:text-foreground hover:bg-muted-bg transition-colors cursor-pointer"
          title="Reset View"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
        <div className="w-[1px] h-4 bg-border my-auto mx-0.5" />
        <button
          type="button"
          onClick={() => setIsFullscreen((prev) => !prev)}
          className="p-2 rounded-xl text-secondary hover:text-foreground hover:bg-muted-bg transition-colors cursor-pointer"
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
        >
          {isFullscreen ? (
            <Minimize2 className="w-4 h-4" />
          ) : (
            <Maximize2 className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Legend & Stats Overlay */}
      <div className="absolute top-5 left-5 pointer-events-none flex flex-col gap-2">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface/80 backdrop-blur-xl border border-border shadow-md text-[12px] font-medium text-secondary">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          <span>{nodes.length} Concepts · {links.length} Relations</span>
        </div>
      </div>
    </div>
  );
}

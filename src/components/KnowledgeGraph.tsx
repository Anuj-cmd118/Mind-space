import { useMemo, useRef, useEffect, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { MindItem } from '../types';

interface GraphProps {
  items: MindItem[];
  onNodeClick: (node: any) => void;
}

export default function KnowledgeGraph({ items, onNodeClick }: GraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  useEffect(() => {
    if (containerRef.current) {
      const { clientWidth, clientHeight } = containerRef.current;
      setDimensions({ width: clientWidth, height: clientHeight || 600 });
    }
    
    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight || 600
        });
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const graphData = useMemo(() => {
    const nodes = items.map(item => ({
      id: item.id,
      name: item.title,
      val: 1,
      type: item.type,
      color: item.type === 'note' ? '#5A5A40' : 
             item.type === 'link' ? '#A7B09E' : 
             item.type === 'quote' ? '#D9C5B2' : '#7D6B5D'
    }));

    const links: any[] = [];
    
    // Create links based on shared tags
    items.forEach((item, i) => {
      items.slice(i + 1).forEach(other => {
        const sharedTags = item.tags.filter(t => other.tags.includes(t));
        if (sharedTags.length > 0) {
          links.push({
            source: item.id,
            target: other.id,
            value: sharedTags.length
          });
        }
      });
      
      // Explicit links
      if (item.linkedItemIds) {
        item.linkedItemIds.forEach(linkedId => {
          if (items.some(it => it.id === linkedId)) {
            links.push({
              source: item.id,
              target: linkedId,
              value: 2
            });
          }
        });
      }
    });

    return { nodes, links };
  }, [items]);

  return (
    <div ref={containerRef} className="w-full h-full bg-white/40 backdrop-blur-sm rounded-[40px] border border-surface-container overflow-hidden">
      <ForceGraph2D
        graphData={graphData}
        width={dimensions.width}
        height={dimensions.height}
        nodeLabel="name"
        nodeColor={node => (node as any).color}
        nodeRelSize={6}
        linkDirectionalParticles={1}
        linkDirectionalParticleSpeed={0.01}
        linkColor={() => '#D9C5B2'}
        onNodeClick={onNodeClick}
        backgroundColor="rgba(255,255,255,0)"
      />
    </div>
  );
}

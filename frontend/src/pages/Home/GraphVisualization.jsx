import React, { useEffect, useRef, useCallback } from 'react';
import { DataSet, Network } from 'vis-network/standalone';

const GraphVisualization = ({ data, onNodeSelect, onEdgeSelect }) => {
  const containerRef = useRef(null);
  const networkRef = useRef(null);

  const processGraphData = useCallback((rawData) => {
    if (!rawData || typeof rawData !== 'object') {
      console.error('Invalid rawData:', rawData);
      return { nodes: [], edges: [] };
    }

    const colorPalette = [
      '#c33149ff', '#7b5c60ff', '#338776ff', '#46ac67ff', '#a8c256ff',
      '#cece84ff', '#f3d9b1ff', '#c29979ff', '#b25f4eff', '#863936ff'
    ];

    const entityColorMap = new Map();

    const getColorFromType = (nodeType) => {
      const type = String(nodeType || 'Unknown');
      
      if (!entityColorMap.has(type)) {
        let hash = 0;
        for (let i = 0; i < type.length; i++) {
          hash = type.charCodeAt(i) + ((hash << 5) - hash);
        }
        const colorIndex = Math.abs(hash) % colorPalette.length;
        entityColorMap.set(type, colorIndex);
      }

      const colorIndex = entityColorMap.get(type);
      const baseColor = colorPalette[colorIndex];

      // Функция для генерации highlight цвета (упрощена для краткости)
      // ... (ваш код hexToHsl можно оставить здесь или вынести)
      return {
        background: baseColor,
        border: baseColor,
        highlight: { background: baseColor, border: baseColor }, // Упростил для примера
        hover: { background: baseColor, border: baseColor }
      };
    };

    const shortenLabel = (label, maxLength = 8) => {
      const str = String(label || 'Unknown');
      if (str.length > maxLength) {
        return str.substring(0, maxLength - 3) + '...';
      }
      return str;
    };

    // 1. Обработка узлов с дедупликацией
    const rawNodes = Array.isArray(rawData.nodes) ? rawData.nodes : [];
    const uniqueNodesMap = new Map();

    rawNodes.forEach((node, index) => {
      // Определяем ID
      const id = String(node?.key || node?.id || `node-${index}`);

      // Если такой ID уже обработан, пропускаем его (избавляемся от дублей)
      if (uniqueNodesMap.has(id)) return;

      const nodeType = 
        node?.attributes?.label || 
        node?.labels?.[0] || 
        node?.label || 
        node?.type ||
        'Unknown';
      
      const colorConfig = getColorFromType(nodeType);
      
      const originalLabel = 
        node?.attributes?.name || 
        node?.properties?.name || 
        node?.name || 
        node?.id || 
        `Node-${index}`;

      uniqueNodesMap.set(id, {
        id: id,
        label: shortenLabel(originalLabel),
        title: String(originalLabel),
        group: String(nodeType),
        color: colorConfig,
        shape: 'circle',
        size: 20,
        font: {
          color: '#ffffff', // Упростил цвет шрифта для примера
          size: 14,
          face: 'arial',
          strokeWidth: 5,
          strokeColor: '#2e2b2aff',
          align: 'center'
        },
        widthConstraint: { maximum: 100 },
        heightConstraint: { maximum: 60 }
      });
    });

    // 2. Обработка ребер с дедупликацией
    const rawEdges = Array.isArray(rawData.edges) ? rawData.edges : 
                     Array.isArray(rawData.relationships) ? rawData.relationships : [];
    
    const uniqueEdgesMap = new Map();

    rawEdges.forEach((edge, index) => {
      const id = String(edge?.key || edge?.id || `edge-${index}`);

      // Если такое ребро уже есть, пропускаем
      if (uniqueEdgesMap.has(id)) return;

      const sourceId = String(edge?.source || edge?.from || '');
      const targetId = String(edge?.target || edge?.to || '');

      // Проверяем, существуют ли узлы для этого ребра (чтобы не было висячих связей)
      if (!uniqueNodesMap.has(sourceId) || !uniqueNodesMap.has(targetId)) return;

      uniqueEdgesMap.set(id, {
        id: id,
        from: sourceId,
        to: targetId,
        label: String(edge?.attributes?.label || edge?.type || edge?.label || ''),
        color: { color: '#b2a18c88' },
        arrows: 'to',
        smooth: { enabled: true, type: 'curvedCW', roundness: 0.2 }
      });
    });

    return { 
      nodes: Array.from(uniqueNodesMap.values()), 
      edges: Array.from(uniqueEdgesMap.values()) 
    };
  }, []);

  useEffect(() => {
    // ... остальной код useEffect без изменений ...
    if (networkRef.current) {
      networkRef.current.destroy();
      networkRef.current = null;
    }

    if (!data || !data.nodes || !data.edges) return;

    const processedData = processGraphData(data);
    
    // Проверка на пустоту
    if (processedData.nodes.length === 0) return;

    // ВАЖНО: try-catch вокруг создания DataSet для отлова скрытых ошибок данных
    try {
      const nodesDataset = new DataSet(processedData.nodes);
      const edgesDataset = new DataSet(processedData.edges);

      const networkData = {
        nodes: nodesDataset,
        edges: edgesDataset
      };

      const options = {
         // ... ваши опции ...
         autoResize: true,
         height: '100%',
         width: '100%',
         physics: {
            stabilization: false,
            barnesHut: { gravitationalConstant: -30000 } // Подкрутил для стабильности
         }
      };

      networkRef.current = new Network(containerRef.current, networkData, options);

      networkRef.current.on('click', function(params) {
         // ... ваш обработчик клика ...
         if (params.nodes.length > 0) {
            const nodeId = params.nodes[0];
            // Ищем в исходных данных, но учитываем, что там могут быть дубли
            const node = data.nodes.find(n => String(n?.key || n?.id) === nodeId);
            if (node) onNodeSelect?.(node);
         } else if (params.edges.length > 0) {
            const edgeId = params.edges[0];
            const edge = data.edges.find(e => String(e?.key || e?.id) === edgeId);
            if (edge) onEdgeSelect?.(edge);
         } else {
            onNodeSelect?.(null);
         }
      });

    } catch (error) {
      console.error("Error initializing Network:", error);
    }

    return () => {
      if (networkRef.current) {
        networkRef.current.destroy();
        networkRef.current = null;
      }
    };
  }, [data, processGraphData, onNodeSelect, onEdgeSelect]);

  return <div ref={containerRef} className="network-container" style={{ height: '100%', width: '100%' }} />;
};

export default GraphVisualization;
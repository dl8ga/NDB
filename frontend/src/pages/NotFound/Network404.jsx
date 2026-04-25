import { useState, useEffect, useRef } from 'react'

function Network404() {
  const canvasRef = useRef(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const nodesRef = useRef([])
  const highlightedRef = useRef(new Set())
  const pulseRef = useRef(0)  
  const animationRef = useRef(null)

  // Настройки сети
  const NODE_RADIUS = 3
  const CONNECTION_DISTANCE = 150
  const NODE_COUNT = 100

  // Инициализация размеров
  useEffect(() => {
    const updateSize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      })
    }
    
    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  // Создание узлов
  useEffect(() => {
    if (dimensions.width === 0) return

    const nodes = []
    for (let i = 0; i < NODE_COUNT; i++) {
      nodes.push({
        id: i,
        x: Math.random() * dimensions.width,
        y: Math.random() * dimensions.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3
      })
    }
    nodesRef.current = nodes
  }, [dimensions])

  // Подсветка случайных узлов (3 узла каждые 10 секунд)
  useEffect(() => {
    const highlightInterval = setInterval(() => {
      const nodes = nodesRef.current
      if (nodes.length === 0) return

      // Выбираем 3 случайных узла
      const newHighlighted = new Set()
      for (let i = 0; i < 5; i++) {
        const randomIndex = Math.floor(Math.random() * nodes.length)
        newHighlighted.add(randomIndex)
      }
      
      highlightedRef.current = newHighlighted
      
      // Сбрасываем подсветку через 3 секунды
      setTimeout(() => {
        highlightedRef.current = new Set()
      }, 3100)
    }, 6000)

    return () => clearInterval(highlightInterval)
  }, [])

  // Анимация
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')

    const animate = () => {
      const nodes = nodesRef.current
      const highlighted = highlightedRef.current

      // Обновляем пульсацию (плавное изменение от 0 до 1)
      pulseRef.current += 0.02
      const pulse = (Math.sin(pulseRef.current) + 1) / 2  // 0 → 1 → 0

      // Очистка
      ctx.fillStyle = '#0a0a1a'
      ctx.fillRect(0, 0, dimensions.width, dimensions.height)

      // Обновление позиций узлов
      nodes.forEach(node => {
        node.x += node.vx
        node.y += node.vy

        if (node.x < 0 || node.x > dimensions.width) node.vx *= -1
        if (node.y < 0 || node.y > dimensions.height) node.vy *= -1
      })

      // Рисуем связи (тонкие, полупрозрачные)
      ctx.strokeStyle = 'rgba(100, 150, 255, 0.12)'
      ctx.lineWidth = 0.8
      
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x
          const dy = nodes[i].y - nodes[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)

          if (dist < CONNECTION_DISTANCE) {
            ctx.beginPath()
            ctx.moveTo(nodes[i].x, nodes[i].y)
            ctx.lineTo(nodes[j].x, nodes[j].y)
            ctx.stroke()
          }
        }
      }

      // Рисуем узлы
      nodes.forEach((node, index) => {
        const isHighlighted = highlighted.has(index)
        
        if (isHighlighted) {
          // Плавная пульсирующая подсветка
          const baseRadius = 5
          const maxRadius = 15
          const radius = baseRadius + (maxRadius - baseRadius) * pulse
          
          // Внешнее свечение (более размытое)
          const outerGradient = ctx.createRadialGradient(
            node.x, node.y, 0,
            node.x, node.y, radius * 1.5
          )
          outerGradient.addColorStop(0, `rgba(255, 80, 80, ${0.3 * pulse})`)
          outerGradient.addColorStop(0.5, `rgba(255, 60, 60, ${0.15 * pulse})`)
          outerGradient.addColorStop(1, 'rgba(255, 60, 60, 0)')
          
          ctx.fillStyle = outerGradient
          ctx.beginPath()
          ctx.arc(node.x, node.y, radius * 1.5, 0, Math.PI * 2)
          ctx.fill()

          // Внутреннее свечение (яркое)
          const innerGradient = ctx.createRadialGradient(
            node.x, node.y, 0,
            node.x, node.y, radius
          )
          innerGradient.addColorStop(0, `rgba(255, 100, 100, ${0.8 + 0.2 * pulse})`)
          innerGradient.addColorStop(0.4, `rgba(255, 70, 70, ${0.4 + 0.3 * pulse})`)
          innerGradient.addColorStop(1, 'rgba(255, 70, 70, 0)')
          
          ctx.fillStyle = innerGradient
          ctx.beginPath()
          ctx.arc(node.x, node.y, radius, 0, Math.PI * 2)
          ctx.fill()
        }

        // Сам узел (сердцевина)
        ctx.fillStyle = isHighlighted ? '#ff5050' : '#4dabf7'
        ctx.beginPath()
        ctx.arc(node.x, node.y, NODE_RADIUS, 0, Math.PI * 2)
        ctx.fill()

        // Белая точка в центре для объёма
        if (isHighlighted) {
          ctx.fillStyle = `rgba(255, 200, 200, ${0.5 + 0.5 * pulse})`
          ctx.beginPath()
          ctx.arc(node.x - 1, node.y - 1, 1, 0, Math.PI * 2)
          ctx.fill()
        }
      })

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [dimensions])

  return (
    <div style={styles.container}>
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        style={styles.canvas}
      />
      
      <div style={styles.content}>
        <h1 style={styles.title}>404</h1>
        <p style={styles.subtitle}>Соединение потеряно</p>
        <p style={styles.description}>
          Узел не найден в сети. Возможно, он был перемещён или удалён.
        </p>
        <button 
          style={styles.button}
          onClick={() => window.location.href = '/'}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#ff5050'
            e.target.style.borderColor = '#ff5050'
            e.target.style.color = '#0a0a1a'
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = 'transparent'
            e.target.style.borderColor = '#ff5050'
            e.target.style.color = '#fff'
          }}
        >
          Вернуться на главную
        </button>
      </div>
    </div>
  )
}

const styles = {
  container: {
    position: 'relative',
    width: '100vw',
    height: '100vh',
    overflow: 'hidden',
    backgroundColor: '#0a0a1a',
  },
  canvas: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 1,
  },
  content: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    textAlign: 'center',
    zIndex: 2,
    color: '#fff',
    fontFamily: 'Arial, sans-serif',
    pointerEvents: 'none',
  },
  title: {
    fontSize: '120px',
    margin: '0',
    fontWeight: 'bold',
    textShadow: '0 0 40px rgba(255, 80, 80, 0.4)',
    letterSpacing: '15px',
    background: 'linear-gradient(45deg, #ff5050, #ff8080)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  subtitle: {
    fontSize: '24px',
    margin: '10px 0',
    color: '#ff5050',
    textTransform: 'uppercase',
    letterSpacing: '4px',
  },
  description: {
    fontSize: '16px',
    margin: '20px 0',
    color: '#888',
    maxWidth: '400px',
    lineHeight: '1.6',
  },
  button: {
    marginTop: '30px',
    padding: '14px 32px',
    fontSize: '14px',
    color: '#fff',
    backgroundColor: 'transparent',
    border: '2px solid #ff5050',
    borderRadius: '30px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    textTransform: 'uppercase',
    letterSpacing: '2px',
    pointerEvents: 'auto',
    fontWeight: 'bold',
  },
}

export default Network404
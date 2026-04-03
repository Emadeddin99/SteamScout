import { useMemo, useState } from 'react'
import './Calculator.css'

const operations = ['+', '-', '*', '/']

export default function Calculator() {
  const [showModal, setShowModal] = useState(false)
  const [x, setX] = useState(20)
  const [y, setY] = useState(20)
  const [dragging, setDragging] = useState(false)
  const [start, setStart] = useState({ x: 0, y: 0 })
  const [expression, setExpression] = useState('')
  const [result, setResult] = useState('0')
  const [error, setError] = useState(null)

  const evalResult = () => {
    try {
      const safe = expression.replace(/[^0-9.+\-*/() ]/g, '')
      // eslint-disable-next-line no-eval
      const value = eval(safe)
      setResult(String(value))
      setError(null)
    } catch (err) {
      setResult('0')
      setError('Invalid expression')
    }
  }

  const onMouseDown = (e) => {
    setDragging(true)
    setStart({ x: e.clientX - x, y: e.clientY - y })
  }

  const onMouseMove = (e) => {
    if (!dragging) return
    setX(e.clientX - start.x)
    setY(e.clientY - start.y)
  }

  const onMouseUp = () => setDragging(false)

  useMemo(() => {
    if (!dragging) return
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [dragging, onMouseMove])

  return (
    <section className="page calc-page">
      <h2>Floating Calculator</h2>
      <p>
        Click button to open the movable calculator panel. Works great in mobile
        sized windows.
      </p>
      <button onClick={() => setShowModal(true)} className="open-modal">
        Open Calculator
      </button>

      {showModal && (
        <div className="calc-overlay" onClick={() => setShowModal(false)}>
          <div
            className="calc-window"
            style={{ transform: `translate(${x}px, ${y}px)` }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="calc-header" onMouseDown={onMouseDown}>
              <span>Move Me</span>
              <button onClick={() => setShowModal(false)}>X</button>
            </div>
            <div className="calc-body">
              <input
                type="text"
                value={expression}
                onChange={(e) => setExpression(e.target.value)}
                placeholder="0 + 0"
              />
              <div className="calc-actions">
                {operations.map((op) => (
                  <button key={op} onClick={() => setExpression((v) => v + op)}>
                    {op}
                  </button>
                ))}
               
                <button onClick={evalResult}>Calc</button>
              </div>
              <div className="calc-result">Result: {result}</div>
              {error && <div className="calc-error">{error}</div>}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

import {useEffect, useState} from 'preact/hooks'
import './app.css'
import {BoardManager, SquareState} from "./BoardManager.ts";

const numberColors = [
  "#3bdb32",
  "#32db9a",
  "#587ffa",
  "#ae2acc",
  "#ff0099",
  "#fc4646",
  "#caff0c",
  "#ff9000"
]

export function App() {
  const [manager, setManager] = useState<BoardManager>()
  const [click, setClick] = useState(0)
  const [tick, setTick] = useState(0)
  const [flags, setFlags] = useState(0)
  const [won, setWon] = useState(false)
  const [showReset, setShowReset] = useState(false)
  useEffect(() => {
    let localManager = new BoardManager(20, 20)

    let interval = setInterval(() => {
      setTick((c) => ++c)
      if (!localManager!.Running) {
        setShowReset(true)
      }
    }, 1000 / 60)

    setManager(localManager)

    return () => clearInterval(interval)
  }, []);

  return (
    <main class={"container"}>
      <div class={"inner-container"} style={{
        "--board-scale": manager ? Math.min((35 / manager!.Width), 4) + "vw" : ""
      }}>
        <div class={"won-container"} style={{
          display: won ? "block" : "none"
        }}>You Won!</div>
        <div class={"top-container"}>
          <div>
            <span title={"Clicks"}>👆</span>
            {click}
          </div>
          <div>
            <span title={"Flags placed"}>🚩</span>
            {flags}
          </div>
          <div>
            <span title={"Bombs"}>💣</span>
            {manager?.BombCount}
          </div>
        </div>
        {manager != undefined ? <div className={"game-board"} style={{
          "--grid-rows": manager.Width,
          "--grid-columns": manager.Height,
          backgroundColor: won ? "#007c27" : ""
        }}>
          {manager.map((square) => {

            return <div onMouseDown={(ev) => {
              if (manager!.Running) {
                if (ev.button == 0 && square.state == SquareState.Hidden) {
                  if (click == 0) {
                    let iterations = 0;
                    while (manager!.GetSquare(square.x, square.y)!.nearbyBomb != 0 && iterations < 20) {
                      manager!.SetupBoard()
                      iterations++
                    }
                  }
                  setClick((c) => ++c)
                  manager!.ShowSquare(square.x, square.y)
                } else if (ev.button == 2 && square.state != SquareState.Shown) {
                  manager!.ChangeFlag(square.x, square.y)
                }
                setFlags(() => {
                  let out = 0
                  for (const square of manager!.Squares) {
                    out += square.state == SquareState.Flagged ? 1 : 0
                  }
                  return out
                })
              }
              if (manager!.TestWinGame()) {
                setWon(true)
                setShowReset(true)
              }
              ev.preventDefault()
            }} onContextMenu={(ev) => ev.preventDefault()} data-correct={square.state == SquareState.Correct} data-incorrect={square.state == SquareState.Incorrect} data-flagged={square.state == SquareState.Flagged || square.state == SquareState.Correct} data-shown={square.state == SquareState.Shown} style={{
              color: !square.isBomb && square.nearbyBomb != 0 ? numberColors[square.nearbyBomb-1] : ""
            }}>{square.state != SquareState.Hidden ? square.isBomb ? "💣" : square.nearbyBomb == 0 ? "" : square.nearbyBomb : ""}</div>
          })}
        </div> : <></>}
        <div className={"reset-button"} style={{
          opacity: showReset ? "1" : '0',
          pointerEvents: showReset ? "all" : "none"
        }} onClick={() => {
          manager!.SetupBoard()
          setClick(0)
          setTick(0)
          setWon(false)
          setShowReset(false)
        }}>Reset</div>
      </div>
    </main>
  )
}

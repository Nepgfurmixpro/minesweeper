import SimplexNoise from "./perlin.ts";

enum SquareState {
  Hidden,
  Shown,
  Flagged,
  Correct,
  Incorrect
}

interface Square {
  nearbyBomb: number,
  isBomb: boolean,
  state: SquareState,
  x: number,
  y: number
}

function genArr<T>(el: number, func: (i: number) => T): T[] {
  let out: T[] = [];
  for (let i = 0; i < el; i++) {
    out.push(func(i));
  }
  return out;
}

function fisherYatesShuffle<T>(arr1: T[], iter: number = 25): T[] {
  let arr = [...arr1];
  let nums = genArr(arr.length, (i) => {
    return i
  })
  for (let i = 0; i < arr.length; i++) {
    let flip = nums[Math.floor(Math.random() * nums.length)]
    let tmp = arr[0]
    arr[0] = arr[flip]
    arr[flip] = tmp
    nums = nums.filter((val) => val != flip)
  }
  if (iter > 30) {
    return arr;
  } else {
    return fisherYatesShuffle(arr, ++iter)
  }
}

class BoardManager {
  constructor(width: number, height: number) {
    this._width = width;
    this._height = height;
    this._squares = [];
    this._running = false
    this.SetupBoard()
  }

  SetupBoard() {
    this._squares = [];
    let noise = new SimplexNoise()
    let bombs = Math.round((this._width * this._height) / 6.65) - Math.floor(Math.random() * Math.round((this._width * this._height) / 18))
    this._bombCount = bombs
    for (let x = 0; x < this._width; x++) {
      for (let y = 0; y < this._height; y++) {
        this._squares.push({
          nearbyBomb: 0,
          isBomb: false,
          state: SquareState.Hidden,
          x, y
        })
      }
    }
    // for (let i = 0; i < bombs; i++) {
    //   let x = Math.floor(Math.random() * this._height);
    //   let y = Math.floor(Math.random() * this._width);
    //
    //   let square = this.GetSquare(x, y)
    //   if (square && !square.isBomb) {
    //     square.isBomb = true
    //   } else {
    //     i--
    //   }
    // }
    // let currentBombs = 0
    // let requiredValue = 0.8
    // while (currentBombs < bombs) {
    //   for (let x = 0; x < this._width; x++) {
    //     for (let y = 0; y < this._height; y++) {
    //       if (this.GetSquare(x, y)!.isBomb) continue;
    //       if (noise.noise(x, y) > requiredValue) {
    //         if (currentBombs >= bombs) {
    //           break
    //         }
    //         currentBombs++
    //         this.GetSquare(x, y)!.isBomb = true
    //       }
    //     }
    //   }
    //   noise = new SimplexNoise()
    // }

    let shuffled = fisherYatesShuffle(this._squares)
    for (let i = 0; i < bombs; i++) {
      shuffled[i].isBomb = true
    }

    for (const square of this._squares) {
      if (square.isBomb) {
        square.nearbyBomb = 999;
        continue
      }
      let squares = this.GetNearby(square)
      let bombs = 0
      for (const possibleBomb of squares) {
        if (possibleBomb.isBomb) {
          bombs += 1
        }
      }
      square.nearbyBomb = bombs
    }
    this._running = true
  }

  ChangeFlag(x: number, y: number) {
    let state = this.GetSquare(x, y)!.state
    if (state == SquareState.Flagged) {
      state = SquareState.Hidden
    } else {
      state = SquareState.Flagged
    }
    this.GetSquare(x, y)!.state = state
  }

  private RecursiveShow(square: Square) {
    this.GetSquare(square.x, square.y)!.state = SquareState.Shown
    if (square.nearbyBomb == 0 && !square.isBomb) {
      let nearby = this.GetNearby(square, true)
      for (const s of nearby) {
        if (s.state == SquareState.Hidden) {
          this.RecursiveShow(s)
        }
      }
    }
  }

  get Running() {
    return this._running
  }

  ShowSquare(x: number, y: number) {
    let square = this.GetSquare(x, y)
    if (square) {
      if (square.nearbyBomb == 0) {
        this.RecursiveShow(square)
      } else if (!square.isBomb) {
        square.state = SquareState.Shown
      } else if (square.isBomb) {
        this.FailGame()
      }
    }
  }

  FailGame() {
    let flagged: Square[] = [];
    for (const square of this._squares) {
      if (square.state != SquareState.Flagged) {
        square.state = SquareState.Shown
      } else {
        flagged.push(square)
      }
    }
    let i = 0;
    flagged = fisherYatesShuffle(flagged)
    for (const flaggedSquare of flagged) {
      setTimeout(() => {
        if (!flaggedSquare.isBomb) {
          flaggedSquare.state = SquareState.Incorrect
        } else {
          flaggedSquare.state = SquareState.Correct
        }
      }, 2500 + (350 * i))
      i++
    }
    this._running = false
  }

  TestWinGame() {
    let won = true
    let allBombsFlagged = true
    for (const square of this._squares) {
      if (square.isBomb && square.state != SquareState.Flagged) {
        allBombsFlagged = false
        break
      }
    }
    if (allBombsFlagged) {
      for (const square of this._squares) {
        if (square.state == SquareState.Hidden) {
          won = false
          break
        }
      }
    }
    if (won && allBombsFlagged) {
      this._running = false
    }
    return won && allBombsFlagged
  }

  GetNearby(square: Square, cross: boolean = false): Square[] {
    let out: Square[] = [];
    for (let x = 0; x < 3; x++) {
      for (let y = 0; y < 3; y++) {
        let ox = square.x + (x - 1);
        let oy = square.y + (y - 1);

        if (cross) {
          if (x == 0 && y == 0) continue;
          if (x == 2 && y == 2) continue;
          if (x == 0 && y == 2) continue;
          if (x == 2 && y == 0)  continue;
        }

        if (!(ox == square.x && oy == square.y)) {
          let s = this.GetSquare(ox, oy)
          if (s != null) {
            out.push(s)
          }
        }
      }
    }
    return out
  }

  GetSquare(x: number, y: number) {
    if (x < 0 || y < 0 || x >= this._width || y >= this._height) return null
    return this._squares.find((square) => square.x == x && square.y == y)!
  }

  get Squares(): Square[] {
    return this._squares
  }

  get Width() {
    return this._width
  }

  get Height() {
    return this._height
  }

  map<T>(fn: (square: Square) => T): T[] {
    let out: T[] = [];
    for (let x = 0; x < this._width; x++) {
      for (let y = 0; y < this._height; y++) {
        out.push(fn(this.GetSquare(x, y)!))
      }
    }
    return out;
  }

  get BombCount() {
    return this._bombCount
  }

  private _width
  private _height

  private _squares: Square[]
  private _running: boolean
  private _bombCount: number
}

export {
  BoardManager,
  SquareState
}

export type {
  Square,
}

"use strict";

class GridCell {
  constructor(host, r, c, content=null) {
    this._host = host;
    this._r = r;
    this._c = c;
    this._content = content;
  }

  get host() { return this._host; }
  get row() { return this._r; }
  get col() { return this._c; }
  get x() { return this._c; }
  get y() { return this._r; }

  get value() { return this._content; }
  set value(v) { this._content = v; }

  get above() { return this.host.tryGetCell(this._r-1, this._c); }
  get hasAbove() { return this.above !== null; }
  get below() { return this.host.tryGetCell(this._r+1, this._c); }
  get hasBelow() { return this.below !== null; }
  get left() { return this.host.tryGetCell(this._r, this._c-1); }
  get hasLeft() { return this.left !== null; }
  get right() { return this.host.tryGetCell(this._r, this._c+1); }
  get hasRight() { return this.right !== null; }

  get neighbors() {
    let result = [];
    if (this.hasAbove) result.push(this.above);
    if (this.hasBelow) result.push(this.below);
    if (this.hasLeft) result.push(this.left);
    if (this.hasRight) result.push(this.right);
    return result;
  }
}

class Grid {
  constructor(cellsWide, cellsTall) {
    this._width = cellsWide;
    this._height = cellsTall;
    this._cells = [];
    for (let r = 0; r < this._height; ++r) {
      let tempRow = [];
      for (let c = 0; c < this._width; ++c) {
        tempRow.push(new GridCell(this, r, c));
      }
      this._cells.push(tempRow);
    }
  }

  /* Private: assure row, col refer to a valid cell */
  _assertBounds(row, col) {
    if (row < 0 || row > this._height) {
      throw new Error("Invalid row", row);
    }
    if (col < 0 || col > this._width) {
      throw new Error("Invalid column", col);
    }
  }

  /* Size getters */
  get width() { return this._width; }
  get height() { return this._height; }
  get rows() { return this._height; }
  get cols() { return this._width; }

  /* Return the requested cell, or null */
  tryGetCell(r, c) {
    if (r >= 0 && r < this._height) {
      if (c >= 0 && c <= this._width) {
        return this._cells[r][c];
      }
    }
    return null;
  }

  /* Get a cell at the given row and column */
  getCell(r, c) {
    this._assertBounds(r, c);
    return this._cells[r][c];
  }

  /* Set a cell's value at the given row and column */
  setCell(r, c, v) {
    this._assertBounds(r, c);
    this._cells[r][c] = v;
  }

  /* Call fn on every cell (row-major) */
  map(fn) {
    for (let r = 0; r < this._width; ++r) {
      for (let c = 0; c < this._height; ++c) {
        fn(this.getCell(r, c));
      }
    }
  }
}

/* Grid object for use on a canvas */
class CanvasGrid extends Grid {
  constructor(canvas, ctx, cellsWide, cellsTall) {
    super(cellsWide, cellsTall);
    this._canvas = canvas;
    this._ctx = ctx;
    this._showGrid = true;
  }

  /* Bind an event listener to the canvas */
  addEventListener(ev, func) {
    this._canvas.addEventListener(ev, func);
  }

  /* Canvas's bounding box */
  get _box() {
    /* Canvases only have one rect */
    return this._canvas.getClientRects()[0];
  }

  /* Show or hide the axes */
  showGrid() { this._showGrid = true; }
  hideGrid() { this._showGrid = false; }
  hasGrid() { return this._showGrid; }

  /* Size of the canvas in pixels */
  get totalWidth() { return this._box.right - this._box.left; }
  get totalHeight() { return this._box.bottom - this._box.top; }

  /* Draw all cells and then the grid */
  draw() {
    this._ctx.fillStyle = "white";
    this._ctx.fillRect(0, 0, this._canvas.width, this._canvas.height);
    this.map((c) => this._drawCell(c));
    if (this._showGrid) {
      this._drawAxes();
    }
  }

  /* Draw a cell */
  _drawCell(cell) {
    const cellWidth = this._canvas.width / this.width;
    const cellHeight = this._canvas.height / this.height;
    const cellX = cell.x * cellWidth;
    const cellY = cell.y * cellHeight;
    if (cell.value) {
      if (cell.value instanceof tinycolor) {
        this._ctx.fillStyle = cell.value.toHex8String();
        this._ctx.fillRect(cellX, cellY, cellWidth, cellHeight);
      } else if (typeof(cell.value.draw) === "function") {
        cell.value.draw(this._ctx, cellX, cellY, cellWidth, cellHeight);
      }
    }
  }

  /* Draw axes to the given context */
  _drawAxes() {
    const cw = this.totalWidth / this.width;
    const ch = this.totalHeight / this.height;
    this._ctx.fillStyle = "black";
    /* Draw vertical axes */
    for (let i = 0; i <= this.width; ++i) {
      this._ctx.beginPath();
      this._ctx.moveTo(i * cw, 0);
      this._ctx.lineTo(i * cw, this.totalHeight);
      this._ctx.stroke();
    }
    /* Draw horizontal axes */
    for (let i = 0; i <= this.height; ++i) {
      this._ctx.beginPath();
      this._ctx.moveTo(0, i * ch);
      this._ctx.lineTo(this.totalWidth, i * ch);
      this._ctx.stroke();
    }
  }

  /* Convert a pixel pair to a row and column; returns null on error */
  pointToEntry(x, y) {
    const w = this.totalWidth;
    const h = this.totalHeight;
    if (x < 0 || x > w || y < 0 || y > h) {
      return null;
    } else {
      const cc = Math.floor(x / (this._canvas.width / this.width));
      const cr = Math.floor(y / (this._canvas.height / this.height));
      return [cr, cc];
    }
  }

  /* Obtain the cell containing the specific coordinates */
  getContainingCell(x, y) {
    const rc = this.pointToEntry(x, y);
    if (rc !== null) {
      const [r, c] = rc;
      return this.getCell(r, c);
    }
    return null;
  }
}

/* exported Grid GridCell CanvasGrid */
/* globals tinycolor */


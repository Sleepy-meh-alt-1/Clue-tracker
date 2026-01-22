(function (global) {
  "use strict";

  var a1lib = global.a1lib || global.A1lib || global.alt1lib;
  var OCR = global.OCR || {};

  function negmod(a, b) {
    return ((a % b) + b) % b;
  }

  // ----------------------
  // Buff class
  // ----------------------
  function Buff(buffer, x, y, isdebuff, reader) {
    this.buffer = buffer;
    this.bufferx = x;
    this.buffery = y;
    this.isdebuff = isdebuff;
    this._reader = reader; // reference to BuffReader instance
  }

  Buff.prototype.readArg = function (type) {
    return BuffReader.readArg(
      this.buffer,
      this.bufferx + 2,
      this.buffery + 23,
      type
    );
  };

  Buff.prototype.readTime = function () {
    return BuffReader.readTime(
      this.buffer,
      this.bufferx + 2,
      this.buffery + 23
    );
  };

  Buff.prototype.compareBuffer = function (img) {
    return BuffReader.compareBuffer(
      this.buffer,
      this.bufferx + 1,
      this.buffery + 1,
      img
    );
  };

  Buff.prototype.countMatch = function (img, aggressive) {
    return BuffReader.countMatch(
      this.buffer,
      this.bufferx + 1,
      this.buffery + 1,
      img,
      aggressive
    );
  };

  // ----------------------
  // BuffReader "constructor"
  // ----------------------
  function BuffReader(options) {
    options = options || {};
    this.pos = null;
    this.debuffs = !!options.debuffs; // if true, use debuff border
    this.buffBorder = options.buffBorder || null;   // ImageData for buff border
    this.debuffBorder = options.debuffBorder || null; // ImageData for debuff border
  }

  BuffReader.buffsize = 27;
  BuffReader.gridsize = 30;

  // allow setting border images later
  BuffReader.prototype.setBorders = function (buffBorder, debuffBorder) {
    this.buffBorder = buffBorder || this.buffBorder;
    this.debuffBorder = debuffBorder || this.debuffBorder;
  };

  // Find buff bar position
  BuffReader.prototype.find = function (img) {
    if (!img && a1lib && a1lib.captureHoldFullRs) {
      img = a1lib.captureHoldFullRs();
    }
    if (!img) { return null; }

    var border = this.debuffs ? this.debuffBorder : this.buffBorder;
    if (!border) {
      console.warn("BuffReader: no border image set (buffBorder / debuffBorder)");
      return null;
    }

    var poslist = img.findSubimage(border);
    if (!poslist || poslist.length === 0) { return null; }

    var grids = [];
    for (var i = 0; i < poslist.length; i++) {
      var p = poslist[i];
      var ongrid = false;
      for (var j = 0; j < grids.length; j++) {
        var g = grids[j];
        if (
          negmod(g.x - p.x, BuffReader.gridsize) === 0 &&
          negmod(g.y - p.y, BuffReader.gridsize) === 0
        ) {
          g.x = Math.min(g.x, p.x);
          g.y = Math.min(g.y, p.y);
          g.n++;
          ongrid = true;
          break;
        }
      }
      if (!ongrid) {
        grids.push({ x: p.x, y: p.y, n: 1 });
      }
    }

    var max = 0;
    var above2 = 0;
    var best = null;
    for (var k = 0; k < grids.length; k++) {
      var g2 = grids[k];
      // console.log("buff grid [" + g2.x + "," + g2.y + "], n:" + g2.n);
      if (g2.n > max) {
        max = g2.n;
        best = g2;
      }
      if (g2.n >= 2) { above2++; }
    }
    if (above2 > 1) {
      console.log("BuffReader: Warning, more than one possible buff bar location");
    }
    if (!best) { return null; }

    this.pos = { x: best.x, y: best.y, maxhor: 5, maxver: 1 };
    return true;
  };

  BuffReader.prototype.getCaptRect = function () {
    if (!this.pos) { return null; }
    return new a1lib.Rect(
      this.pos.x,
      this.pos.y,
      (this.pos.maxhor + 1) * BuffReader.gridsize,
      (this.pos.maxver + 1) * BuffReader.gridsize
    );
  };

  // Read all visible buffs into Buff[]
  BuffReader.prototype.read = function (buffer) {
    if (!this.pos) { throw new Error("BuffReader.read: no pos (call find() first)"); }

    var r = [];
    var rect = this.getCaptRect();
    if (!rect) { return null; }

    if (!buffer && a1lib && a1lib.capture) {
      buffer = a1lib.capture(rect.x, rect.y, rect.width, rect.height);
    }
    if (!buffer) { return null; }

    var maxhor = 0;
    var maxver = 0;
    var border = this.debuffs ? this.debuffBorder : this.buffBorder;

    for (var ix = 0; ix <= this.pos.maxhor; ix++) {
      for (var iy = 0; iy <= this.pos.maxver; iy++) {
        var x = ix * BuffReader.gridsize;
        var y = iy * BuffReader.gridsize;

        // require exact match for border
        var match = buffer.pixelCompare(border, x, y) === 0;
        if (!match) { break; }
        r.push(new Buff(buffer, x, y, this.debuffs, this));
        maxhor = Math.max(maxhor, ix);
        maxver = Math.max(maxver, iy);
      }
    }
    this.pos.maxhor = Math.max(5, maxhor + 2);
    this.pos.maxver = Math.max(1, maxver + 1);
    return r;
  };

  // ----------------------
  // Static helpers
  // ----------------------
  BuffReader.compareBuffer = function (buffer, ox, oy, buffimg) {
    var r = BuffReader.countMatch(buffer, ox, oy, buffimg, true);
    if (r.failed > 0) { return false; }
    if (r.tested < 50) { return false; }
    return true;
  };

  BuffReader.countMatch = function (buffer, ox, oy, buffimg, aggressive) {
    var r = { tested: 0, failed: 0, skipped: 0, passed: 0 };
    var data1 = buffer.data;
    var data2 = buffimg.data;

    console.log(data1)
    console.log(data2)

    for (var y = 0; y < buffimg.height; y++) {
      for (var x = 0; x < buffimg.width; x++) {
        var i1 = buffer.pixelOffset(ox + x, oy + y);
        var i2 = buffimg.pixelOffset(x, y);

        if (data2[i2 + 3] !== 255) { r.skipped++; continue; } // transparent
        if (data1[i1] === 255 && data1[i1 + 1] === 255 && data1[i1 + 2] === 255) { r.skipped++; continue; } // white text
        if (data1[i1] === 0 && data1[i1 + 1] === 0 && data1[i1 + 2] === 0) { r.skipped++; continue; } // black text

        var d = a1lib.ImageDetect.coldif(
          data1[i1],
          data1[i1 + 1],
          data1[i1 + 2],
          data2[i2],
          data2[i2 + 1],
          data2[i2 + 2],
          255
        );
        r.tested++;
        if (d > 35) {
          r.failed++;
          if (aggressive) { return r; }
        } else {
          r.passed++;
        }
      }
    }
    return r;
  };

  BuffReader.isolateBuffer = function (buffer, ox, oy, buffimg) {
    var count = BuffReader.countMatch(buffer, ox, oy, buffimg);
    if (count.passed < 50) { return; }

    var removed = 0;
    var data1 = buffer.data;
    var data2 = buffimg.data;

    for (var y = 0; y < buffimg.height; y++) {
      for (var x = 0; x < buffimg.width; x++) {
        var i1 = buffer.pixelOffset(ox + x, oy + y);
        var i2 = buffimg.pixelOffset(x, y);

        if (data2[i2 + 3] !== 255) { continue; } // transparent

        // new buffer has text on it
        if (
          (data1[i1] === 255 && data1[i1 + 1] === 255 && data1[i1 + 2] === 255) ||
          (data1[i1] === 0 && data1[i1 + 1] === 0 && data1[i1 + 2] === 0)
        ) {
          continue;
        }

        // old buffer has text on it, use new one
        if (
          (data2[i2] === 255 && data2[i2 + 1] === 255 && data2[i2 + 2] === 255) ||
          (data2[i2] === 0 && data2[i2 + 1] === 0 && data2[i2 + 2] === 0)
        ) {
          data2[i2 + 0] = data1[i1 + 0];
          data2[i2 + 1] = data1[i1 + 1];
          data2[i2 + 2] = data1[i1 + 2];
          data2[i2 + 3] = data1[i1 + 3];
          removed++;
        }

        var d = a1lib.ImageDetect.coldif(
          data1[i1],
          data1[i1 + 1],
          data1[i1 + 2],
          data2[i2],
          data2[i2 + 1],
          data2[i2 + 2],
          255
        );
        if (d > 5) {
          data2[i2 + 0] = 0;
          data2[i2 + 1] = 0;
          data2[i2 + 2] = 0;
          data2[i2 + 3] = 0;
          removed++;
        }
      }
    }
    if (removed > 0) {
      console.log(removed + " pixels removed from buff template image");
    }
  };

  // OCR helpers
  // You must provide BuffReader.font = <fontmeta> if you want readTime/readArg to work
  BuffReader.font = null;

  BuffReader.readArg = function (buffer, ox, oy, type) {
    var lines = [];
    if (!OCR || !OCR.readLine || !BuffReader.font) {
      return { time: 0, arg: "" };
    }

    for (var dy = -10; dy < 10; dy += 10) {
      var result = OCR.readLine(buffer, BuffReader.font, [255, 255, 255], ox, oy + dy, true);
      if (result.text) { lines.push(result.text); }
    }

    var r = { time: 0, arg: "" };
    if (type === "timearg" && lines.length > 1) {
      r.arg = lines.pop();
    }
    var str = lines.join("");
    var m;
    if (type === "arg") {
      r.arg = str;
    } else {
      if ((m = str.match(/^(\d+)hr($|\s?\()/i))) { r.time = +m[1] * 60 * 60; }
      else if ((m = str.match(/^(\d+)m($|\s?\()/i))) { r.time = +m[1] * 60; }
      else if ((m = str.match(/^(\d+)($|\s?\()/))) { r.time = +m[1]; }
    }
    return r;
  };

  BuffReader.readTime = function (buffer, ox, oy) {
    return BuffReader.readArg(buffer, ox, oy, "time").time;
  };

  BuffReader.matchBuff = function (state, buffimg) {
    for (var i = 0; i < state.length; i++) {
      if (state[i].compareBuffer(buffimg)) { return state[i]; }
    }
    return null;
  };

  BuffReader.matchBuffMulti = function (state, buffinfo) {
    if (buffinfo.final) {
      return BuffReader.matchBuff(state, buffinfo.imgdata);
    } else {
      var bestindex = -1;
      var bestscore = 0;
      if (buffinfo.imgdata) {
        for (var i = 0; i < state.length; i++) {
          var count = BuffReader.countMatch(
            state[i].buffer,
            state[i].bufferx + 1,
            state[i].buffery + 1,
            buffinfo.imgdata,
            false
          );
          if (count.passed > bestscore) {
            bestscore = count.passed;
            bestindex = i;
          }
        }
      }
      if (bestscore < 50) { return null; }

      if (buffinfo.canimprove) {
        BuffReader.isolateBuffer(
          state[bestindex].buffer,
          state[bestindex].bufferx + 1,
          state[bestindex].buffery + 1,
          buffinfo.imgdata
        );
      }
      return state[bestindex];
    }
  };

  // ----------------------
  // BuffInfo
  // ----------------------
  function BuffInfo(imgdata, debuff, id, canimprove) {
    this.imgdata = imgdata;
    this.isdebuff = debuff;
    this.buffid = id;
    this.final = !!id && !canimprove;
    this.canimprove = !!canimprove;
  }

  // Expose to global
  global.BuffReader = BuffReader;
  global.BuffInfo = BuffInfo;
  global.Buff = Buff;

})(window);

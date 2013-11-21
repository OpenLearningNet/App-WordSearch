
var alphabetDistribution = {
    'A': 8.167,
    'B': 1.492,
    'C': 2.780, 
    'D': 4.253,
    'E': 12.702,
    'F': 2.288,
    'G': 2.022,
    'H': 6.094,
    'I': 6.973,
    'J': 0.153,
    'K': 0.747,
    'L': 4.025,
    'M': 2.517,
    'N': 6.749,
    'O': 7.507,
    'P': 1.929,
    'Q': 0.098,
    'R': 5.987,
    'S': 6.333,
    'T': 9.056,
    'U': 2.758,
    'V': 1.037,
    'W': 2.465,
    'X': 0.150,
    'Y': 1.971,
    'Z': 0.074
};

var groups = [];
var selection = null;
var currentLoop = null;
var currentHighlights = {};

function randomLetter() {
    var p = Math.random() * 100.0;
    for (var letter in alphabetDistribution) {
        p -= alphabetDistribution[letter];
        if (p <= 0) {
            return letter;
        }
    }
    return 'Z';
};

function drawLoop(ctx, data, fill) {
    var loopRadius = 12;
    var dx = data.x1 - data.x0;
    var dy = data.y1 - data.y0;
    var len = Math.sqrt((dx*dx) + (dy*dy));

    if (len == 0) {
        return;
    }

    var px = dy/len;
    var py = -dx/len;
    var ux = dx/len;
    var uy = dy/len;

    var angle = Math.atan2(dy, dx);

    ctx.lineWidth = 2;

    ctx.fillStyle = fill || 'rgba(200, 255, 200, 0.8)';
    ctx.strokeStyle = '#aaa';
    ctx.beginPath();

    // start position, topside
    ctx.moveTo(data.x0 + px*loopRadius, data.y0 + py*loopRadius);

    ctx.lineTo(data.x1 + px*loopRadius, data.y1 + py*loopRadius);
    ctx.arc(data.x1, data.y1, loopRadius, angle-Math.PI/2, angle+Math.PI/2);
    ctx.lineTo(data.x0 - px*loopRadius, data.y0 - py*loopRadius);
    ctx.arc(data.x0, data.y0, loopRadius, angle+Math.PI/2, angle-Math.PI/2);

    ctx.fill();
    ctx.stroke(); 
};

function newLoop(selection) {
    return {
        x0: selection.x0,
        y0: selection.y0,
        x1: selection.x1,
        y1: selection.y1,
        word: selection.word
    };
};

function isValidLoop(loop) {
    if (!loop) return false;
    if (!loop.x0 || isNaN(loop.x0)) return false;
    if (!loop.y0 || isNaN(loop.y0)) return false;
    if (!loop.x1 || isNaN(loop.x1)) return false;
    if (!loop.y1 || isNaN(loop.y1)) return false;

    return true;
};

function loopMatches(loopA, loopB) {
    if (loopA == null && loopB == null) {
        return true;
    } else if (loopA == null || loopB == null) {
        return false;
    }

    return (
           (Math.abs(loopA.x0 - loopB.x0) < 0.01)
        && (Math.abs(loopA.y0 - loopB.y0) < 0.01)
        && (Math.abs(loopA.x1 - loopB.x1) < 0.01)
        && (Math.abs(loopA.y1 - loopB.y1) < 0.01)
    );
}

function redraw(ctx, $canvas) {
    ctx.clearRect(0, 0, $canvas.width(), $canvas.height());

    var i;
    for (i = 0; i !== groups.length; ++i) {
        drawLoop(ctx, groups[i], 'rgba(20, 255, 20, 0.5)');
    }

    if (selection) {
        if (currentLoop == null && isValidLoop(selection)) {
            currentLoop = newLoop(selection);
        }

        if (currentLoop) {
            var a = 0.5;
            currentLoop.x0 = a * currentLoop.x0 + (1-a) * selection.x0;
            currentLoop.y0 = a * currentLoop.y0 + (1-a) * selection.y0;
            currentLoop.x1 = a * currentLoop.x1 + (1-a) * selection.x1;
            currentLoop.y1 = a * currentLoop.y1 + (1-a) * selection.y1;
            drawLoop(ctx, currentLoop);
        }
    } else {
        currentLoop = null;
    }

    if (loopMatches(currentLoop, selection)) { 
        if (selection !== null) {
            currentLoop = newLoop(selection);   
        }
        return false;
    } else {
        return true;
    }
};


function allocateBoard(squareSize) {
    var i;
    var matrix = new Array(squareSize);

    for (i = 0; i !== squareSize; ++i) {
        matrix[i] = new Array(squareSize);
    }

    return {
        matrix: matrix,
        size: squareSize
    };
};

function addWord(board, word, position, direction) {
    var x, y, i;

    x = position.x;
    y = position.y;

    for (i = 0; i !== word.length; ++i) {
        board.matrix[x][y] = word.charAt(i);

        x += direction.x;
        y += direction.y;
    }

    board.words = board.words || [];
    board.words.push(word);
};

function canAddWord(board, word, position, direction) {
    var size = board.size;

    var x, y, i, cell;

    var isSuccess = true;

    x = position.x;
    y = position.y;

    // can the word be placed here?
    for (i = 0; i !== word.length; ++i) {
        cell = board.matrix[x][y];

        if (cell && cell !== word.charAt(i)) {
            isSuccess = false;
            break;
        }

        x += direction.x;
        y += direction.y;
    }

    return isSuccess;
};

function randInt(x) {
    return Math.floor(Math.random() * x);
};

function populateBoard(board, words, directions) {
    var maxAttempts = 150;

    if (!directions) {
        directions = [
            {x: 1, y: 0},
            {x: 0, y: 1},
            {x: 1, y: 1},
            {x: 1, y: -1}
        ];
    }

    var couldntFitIn = [];
    var usedWords = [];
    $.each(words, function(i, word) {
        word = word.toLowerCase();
        var direction;
        var position;
        var xMin, xMax, yMin, yMax;
        var attempt = 0;
        var canBePositioned = false;

        while (attempt < maxAttempts && !canBePositioned) {
            direction = directions[randInt(directions.length)];

            // determine where on the board this word can fit,
            // given the direction
            xMin = -Math.min(direction.x, 0) * word.length;
            yMin = -Math.min(direction.y, 0) * word.length;
            xMax = board.size - Math.max(direction.x, 0) * word.length;
            yMax = board.size - Math.max(direction.y, 0) * word.length;

            // place it randomly in this position
            position = {
                x: xMin + randInt(xMax-xMin),
                y: yMin + randInt(yMax-yMin)
            };

            canBePositioned = canAddWord(board, word, position, direction);

            if (canBePositioned) {
                addWord(board, word, position, direction);
            }

            ++attempt;
        }

        if (!canBePositioned) {
            couldntFitIn.push(word);
        } else {
            usedWords.push(word);
        }
    });

    return {
        board: board,
        couldntFit: couldntFitIn,
        usedWords: usedWords
    };
};

function fillBoard(board) {
    var x, y;

    for (y = 0; y !== board.size; ++y) {
        for (x = 0; x !== board.size; ++x) {
            if (!board.matrix[x][y]) {
                board.matrix[x][y] = randomLetter().toLowerCase();
            }
        }
    }
};

function buildBoard(words, callback, directions) {
    var maxLength = 0;

    $.each(words, function(i, word) {
        if (word.length > maxLength) {
            maxLength = word.length;
        }
    });

    board = allocateBoard(maxLength * 2);
    var generation = populateBoard(board, words, directions);
    fillBoard(generation.board);

    if (callback) {
        callback(generation.board, generation.usedWords, generation.couldntFit);
    }

    return generation.board;
};

function coordOfElt($elt) {
    var offset = $elt.position();
    var width = $elt.width();
    var height = $elt.height();

    return {
        x: offset.left + width/2,
        y: offset.top + height/2
    };
};

function checkLoop(board, selection, callback) {
    var startRow = selection.startCell.row;
    var startCol = selection.startCell.col;

    var endRow = selection.endCell.row;
    var endCol = selection.endCell.col;

    var dx = startCol - endCol;
    var dy = startRow - endRow;

    if (Math.abs(dx) < Math.abs(dy)/2) {
        dx = 0;
    } else if (Math.abs(dy) < Math.abs(dx)/2) {
        dy = 0;
    } else if (Math.abs(dx) > Math.abs(dy)) {
        if (dy !== 0) {
            dy = Math.abs(dx) * (dy/Math.abs(dy));   
        }
    } else {
        if (dx !== 0) {
            dx = Math.abs(dy) * (dx/Math.abs(dx));   
        }
    }

    var endCol = startCol - dx;
    var endRow = startRow - dy;

    var row = startRow;
    var col = startCol;

    var dist = Math.max(Math.abs(endRow - startRow), Math.abs(endCol - startCol));

    var dir;

    if (dist == 0) {
        dir = {x: 0, y: 0};
    } else {
        dir = {
            x: Math.floor((endCol - startCol)/dist),
            y: Math.floor((endRow - startRow)/dist)
        };        
    }

    var word = '';

    var i;

    if (dist > 0) {
        i = 0;
        while (row !== endRow || col !== endCol) {
            word += board.matrix[col][row];

            if (row !== endRow) {
                row += dir.y;
            }
            if (col !== endCol) {
                col += dir.x;
            }

            if (i === board.size) {
                break;
            }

            i++;
        }
        word += board.matrix[col][row];            
    }
    var revWord = word.split('').reverse().join('');

    var isFound = false;
    var foundWord;
    var removalIndex = -1;
    for (i = 0; i !== board.words.length; ++i) {
        if (word === board.words[i].toLowerCase()) {
            foundWord = word;
            isFound = true;
        } else if (revWord === board.words[i].toLowerCase()) {
            foundWord = revWord;
            isFound = true;
        }

        if (isFound) {
            if (callback) {
                callback(foundWord);
            }
            selection.word = foundWord;
            currentHighlights[foundWord] = 1.0;
            removalIndex = i;
            break;
        }
    }

    if (removalIndex >= 0) {
        board.words.splice(removalIndex, 1);
    };

    return isFound;
};

function drawBoard(board, $container, onFound) {
    var $canvas = $('<canvas>');
    var $board = $('<table>');
    var $row;
    var $cell;
    var x, y;

    var ctx = $canvas[0].getContext('2d');

    for (y = 0; y !== board.size; ++y) {
        $row = $('<tr>');
        for (x = 0; x !== board.size; ++x) {
            $cell = $('<td>');
            $cell.text(board.matrix[x][y]);
            $cell.attr('data-row', y);
            $cell.attr('data-col', x);
            $row.append($cell);
        }
        $board.append($row);
    }

    var selectionStart = {x: 0, y: 0};

    var requiresRedraw = false;

    window.requestAnimFrame = (function(){
      return  window.requestAnimationFrame       ||
              window.webkitRequestAnimationFrame ||
              window.mozRequestAnimationFrame    ||
              function(callback){
                window.setTimeout(callback, 1000 / 60);
              };
    })();

    (function animloop() {
      requestAnimFrame(animloop);

      if (requiresRedraw) {
        requiresRedraw = redraw(ctx, $canvas);
      }
    })();

    $board.on('mousedown', 'td', function(evt) {
        var $startTD = $(this);
        selectionStart = coordOfElt($startTD);
        selectionStart.cell = {
            row: parseInt($startTD.attr('data-row'), 10),
            col: parseInt($startTD.attr('data-col'), 10)
        };
        
        $board.on('mousemove', 'td', function(moveEvt) {
            var $this = $(this);
            var pos = coordOfElt($this);
            var cell = {
                row: parseInt($this.attr('data-row'), 10),
                col: parseInt($this.attr('data-col'), 10)
            };
            var dx = selectionStart.x - pos.x;
            var dy = selectionStart.y - pos.y;

            if (Math.abs(dx) < Math.abs(dy)/2) {
                dx = 0;
            } else if (Math.abs(dy) < Math.abs(dx)/2) {
                dy = 0;
            } else if (Math.abs(dx) > Math.abs(dy)) {
                dy = Math.abs(dx) * (dy/Math.abs(dy));
            } else {
                dx = Math.abs(dy) * (dx/Math.abs(dx));
            }

            selection = {
                startCell: selectionStart.cell,
                endCell: cell,
                x0: selectionStart.x,
                y0: selectionStart.y,
                x1: selectionStart.x - dx,
                y1: selectionStart.y - dy
            };

            requiresRedraw = true;
        });
        
        evt.preventDefault();
    }).on('mouseup', 'td', function(evt) {
        $board.off('mousemove');

        if (selection && checkLoop(board, selection, onFound)) {
            groups.push({
                word: selection.word,
                x0: selection.x0,
                y0: selection.y0,
                x1: selection.x1,
                y1: selection.y1
            });
        }

        selection = null;
        requiresRedraw = true;
    });

    $canvas.css({
        'position': 'absolute',
        'top': '0px',
        'left': '0px',
        'z-index': '1'
    });

    $board.css({
        'position': 'absolute',
        'top': '0px',
        'left': '0px',
        'z-index': '10'
    });

    $container.css({
        'position': 'inherit',
        'width': 'auto',
        'height': 'auto'
    });
    $container.empty().append($board).append($canvas);

    $canvas[0].width = $board.width();
    $canvas[0].height = $board.height();

    $container.css({
        'position': 'relative',
        'width': $board.width() + 'px',
        'height': $board.height() + 'px'
    });

    return $container;
};
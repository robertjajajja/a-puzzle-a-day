const targets = [];
const boardNames = [
  ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  [  '1',   '2',   '3',   '4',   '5',   '6',   '7'],
  [  '8',   '9',  '10',  '11',  '12',  '13',  '14'],
  [ '15',  '16',  '17',  '18',  '19',  '20',  '21'],
  [ '22',  '23',  '24',  '25',  '26',  '27',  '28'],
  [ '29',  '30',  '31'],
];
const boardNameMap = {};
boardNames.forEach((r, i) => r.forEach((v, j) => boardNameMap[v] = [i, j]));
let targetPositions;

const pieces = [
  [[[0, 0], [1, 0], [2, 0], [2, 1], [3, 1]]],          // purple
  [[[0, 2], [1, 0], [1, 1], [1, 2], [2, 0]]],          // green
  [[[0, 0], [0, 1], [0, 2], [1, 0], [2, 0]]],          // yellow
  [[[0, 0], [1, 0], [1, 1], [2, 0], [3, 0]]],          // red
  [[[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2]]],  // blue
  [[[0, 0], [0, 1], [1, 0], [1, 1], [2, 0]]],          // pink
  [[[0, 3], [1, 0], [1, 1], [1, 2], [1, 3]]],          // orange
  [[[0, 0], [0, 2], [1, 0], [1, 1], [1, 2]]],          // gray
];
generatePieces();

const pieceColors = [
  'purple', 'green', 'yellow', 'red', 'blue', 'pink', 'orange', 'gray'
];

let combinations;
let count = 0;
let startTime;

let stop = true;
let immiExit = true;

function init() {
  targets[0] = document.querySelector('#month').value;
  targets[1] = document.querySelector('#day').value;
  targetPositions = targets.map(t => boardNameMap[t]);
  combinations = [];
  generateCombinations();
  removeTargetsFromCombinations();
  count = 0;
  startTime = undefined;
}

function main() {
  if (!stop) {
    init();
    const stacks = [
      getNextPossibleSelections([], 0),
      [],
      [],
      [],
      [],
      [],
      [],
      [],
    ];
    let currentIndexes = [];
    requestAnimationFrame(step);
    function step(timestamp) {
      if (!startTime) {
        startTime = timestamp;
      }
      const lastIndex = _.findLastIndex(stacks, stack => stack.length !== 0);
      currentIndexes[lastIndex] = stacks[lastIndex].shift();
      currentIndexes = currentIndexes.slice(0, lastIndex + 1);
      colorBoard(currentIndexes);

      if (lastIndex !== 7) {
        stacks[lastIndex + 1] = getNextPossibleSelections(currentIndexes, lastIndex + 1);
      }

      if (currentIndexes.length !== 8 && !stop) {
        requestAnimationFrame(step);
      } else {
        stop = true;
        document.querySelector('.result').innerHTML += ' tries + ' + Math.round(timestamp - startTime) + 'ms spent';
      }
    }
  }
}

function getNextPossibleSelections(currentIndexes, pieceIndex) {
  const baseSelections = _.flatten(currentIndexes.map((c, i) => combinations[i][c]));
  return combinations[pieceIndex].reduce((acc, value, index) => {
    const combinedSelections = _.uniqWith([...baseSelections, ...value], _.isEqual);
    if (combinedSelections.length !== baseSelections.length + value.length) {
      return acc;
    }

    if (pieceIndex !== 7) {
      if (!advancedCut(combinedSelections, pieceIndex + 1)) {
        return acc;
      }
    }

    acc.push(index);
    return acc;
  }, []);
}

function advancedCut(selections, nextIndex) {
  // find empty sections
  const checkedBoard = boardNames.map(r => _.fill(Array(r.length), 0));
  selections.forEach(p => checkedBoard[p[0]][p[1]] = 1);
  targetPositions.forEach(p => checkedBoard[p[0]][p[1]] = 1);
  let x = y = 0;
  const sections = [];

  while (checkedBoard.some(r => r.some(i => i === 0))) {
    if (checkedBoard[x][y] === 0) {
      checkedBoard[x][y] = 1;
      const section = [];
      sections.push(section);
      // check 4 directions
      const stack = [[x, y]];
      section.push([x, y]);
      let point;
      while (point = stack.pop()) {
        // left
        if (point[1] !== 0) {
          if (checkedBoard[point[0]][point[1] - 1] === 0) {
            checkedBoard[point[0]][point[1] - 1] = 1;
            stack.push([point[0], point[1] - 1]);
            section.push([point[0], point[1] - 1]);
          }
        }
        // up
        if (point[0] !== 0 && (point[0] !== 2 || point[1] !== 6)) {
          if (checkedBoard[point[0] - 1][point[1]] === 0) {
            checkedBoard[point[0] - 1][point[1]] = 1;
            stack.push([point[0] - 1, point[1]]);
            section.push([point[0] - 1, point[1]]);
          }
        }
        // right
        if (point[1] !== checkedBoard[point[0]].length - 1) {
          if (checkedBoard[point[0]][point[1] + 1] === 0) {
            checkedBoard[point[0]][point[1] + 1] = 1;
            stack.push([point[0], point[1] + 1]);
            section.push([point[0], point[1] + 1]);
          }
        }
        // down
        if (point[0] !== 6 && (point[0] !== 5 || (point[1] >= 0 && point[1] <= 2))) {
          if (checkedBoard[point[0] + 1][point[1]] === 0) {
            checkedBoard[point[0] + 1][point[1]] = 1;
            stack.push([point[0] + 1, point[1]]);
            section.push([point[0] + 1, point[1]]);
          }
        }
      }
    }
    y++;
    if (y === checkedBoard[x].length) {
      x++;
      y = 0;
    }
  }

  // if the any section's length is smaller than 5, return false
  if (sections.some(sec => sec.length < 5)) {
    return false;
  }

  // the section has to have at least one of the 0 ~ currentIndex - 1 piece fits 
  // (sec includes all positions of that piece)
  if (sections.some(
    sec => !_.flatten(combinations.slice(nextIndex)).some(
      c => _.uniqWith([...sec, ...c], _.isEqual).length === sec.length
    )
  )) {
    return false;
  }

  return true;
}

function colorBoard(indexes) {
  document.querySelectorAll('.block').forEach(node => node.classList.remove(...pieceColors));
  document.querySelectorAll('.combination').forEach(node => {
    node.classList.remove('invalid');
    node.innerHTML = '';
  });
  document.querySelector('#color' + (indexes.length - 1)).classList.add('invalid');
  count++;
  document.querySelector('.result').innerHTML = count;
  for (let i = 0; i < indexes.length; i++) {
    document.querySelector('#color' + i).innerHTML = indexes[i];

    const positions = combinations[i][indexes[i]];
    for (const position of positions) {
      const node = document.querySelector('#block' + position[0].toString() + position[1].toString());
      node.classList.add(pieceColors[i]);
    }
  }
}

function removeTargetsFromCombinations() {
  targetPositions.forEach(
    target => combinations.forEach(
      c => _.remove(c,
        i => i.some(
            co => _.isEqual(co, target)
          )
        )
      )
    );
}

function generateCombinations() {
  pieces.forEach(piece => {
    const combination = [];
    combinations.push(combination);
    piece.forEach(startingPosition => {
      let rowStart = startingPosition;
      do {
        combination.push(rowStart);
        let current = moveRight(rowStart);
        while (current) {
          combination.push(current);
          current = moveRight(current);
        }
        rowStart = moveDown(rowStart);
      } while (rowStart);
    });
  });
}

function moveRight(coordinates) {
  return validatePosition(coordinates.map(coordinate => ([coordinate[0], coordinate[1] + 1])));
}

function moveDown(coordinates) {
  return validatePosition(coordinates.map(coordinate => ([coordinate[0] + 1, coordinate[1]])));
}

function validatePosition(coordinates) {
  for (const coordinate of coordinates) {
    if (
      coordinate[0] >= boardNames.length ||
      coordinate[1] >= boardNames[coordinate[0]].length
    ) {
      return null;
    }
  }

  return coordinates;
}

function generatePieces() {
  pieces.forEach(piece => {
    const originalPiece = _.head(piece);

    const newPieces = [];
    let newPiece = originalPiece;
    let mirroredNewPiece = mirror(newPiece);

    if (!_.isEqual(mirroredNewPiece, originalPiece)) {
      newPieces.push(mirroredNewPiece);
    }

    [0, 1, 2].forEach(() => {
      newPiece = rotateClockwise(newPiece);
      mirroredNewPiece = mirror(newPiece);
      if (!_.isEqual(newPiece, originalPiece)) {
        newPieces.push(newPiece);
      }
      if (!_.isEqual(mirroredNewPiece, originalPiece)) {
        newPieces.push(mirroredNewPiece);
      }
    });

    piece.push(..._.uniqWith(newPieces, _.isEqual));
  });
}

function rotateClockwise(coordinates) {
  const maxX = Math.max(...coordinates.map(coordinate => coordinate[0]));

  return coordinates
          .map(coordinate => ([coordinate[1], maxX - coordinate[0]]))
          .sort((a, b) => {
            if (a[0] === b[0]) {
              return a[1] - b[1];
            }
            return a[0] - b[0];
          });
}

function mirror(coordinates) {
  const maxY = Math.max(...coordinates.map(coordinate => coordinate[1]));

  return coordinates
          .map(coordinate => ([coordinate[0], maxY - coordinate[1]]))
          .sort((a, b) => {
            if (a[0] === b[0]) {
              return a[1] - b[1];
            }
            return a[0] - b[0];
          });
}
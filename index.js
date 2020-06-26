const { Engine, Render, Runner, World, Bodies, Body, Events } = Matter;

const renderGame = (setting = 10) => {
  const cellsHorizontal = setting;
  const cellsVertical = Math.round(cellsHorizontal / 1.618);
  const width = window.innerWidth;
  const height = window.innerHeight;

  const unitLengthX = width / cellsHorizontal;
  const unitLengthY = height / cellsVertical;

  const engine = Engine.create();
  engine.world.gravity.y = 0;
  const { world } = engine;
  const render = Render.create({
    element: document.body,
    engine,
    options: {
      wireframes: false,
      width,
      height,
    },
  });

  Render.run(render);
  Runner.run(Runner.create(), engine);

  // Walls
  const walls = [
    Bodies.rectangle(width / 2, 0, width, 2, { isStatic: true }),
    Bodies.rectangle(width / 2, height, width, 2, { isStatic: true }),
    Bodies.rectangle(0, height / 2, 2, height, { isStatic: true }),
    Bodies.rectangle(width, height / 2, 2, height, { isStatic: true }),
  ];
  World.add(world, walls);

  // Maze Generation

  const shuffle = (arr) => {
    let counter = arr.length;

    while (counter > 0) {
      const index = Math.floor(Math.random() * counter);

      counter--;

      [arr[counter], arr[index]] = [arr[index], arr[counter]];
    }
    return arr;
  };

  const grid = Array(cellsVertical)
    .fill(null)
    .map(() => Array(cellsHorizontal).fill(false));

  const verticals = Array(cellsVertical)
    .fill(null)
    .map(() => Array(cellsHorizontal - 1).fill(false));

  const horizontals = Array(cellsVertical - 1)
    .fill(null)
    .map(() => Array(cellsHorizontal).fill(false));

  const startRow = Math.floor(Math.random() * cellsVertical);
  const startColumn = Math.floor(Math.random() * cellsHorizontal);

  const stepThroughCell = (row, column) => {
    // If I have visited the cell at [row, column], then return
    if (grid[row][column]) return;

    // Mark this cell as being visited
    grid[row][column] = true;

    // Assemble randomly-ordered list of neighbors
    const neighbors = shuffle([
      [row - 1, column, "up"],
      [row, column + 1, "right"],
      [row + 1, column, "down"],
      [row, column - 1, "left"],
    ]);

    // For each neighbor...
    for (let neighbor of neighbors) {
      const [nextRow, nextColumn, direction] = neighbor;

      // See if that neihbor is out of bounds
      if (
        nextRow < 0 ||
        nextRow >= cellsVertical ||
        nextColumn < 0 ||
        nextColumn >= cellsHorizontal
      ) {
        continue;
      }

      // If we have visited that neighbor, continue to next neighbor
      if (grid[nextRow][nextColumn]) {
        continue;
      }

      // Remove a wall from either horizaontals or verticals
      switch (direction) {
        case "left":
          verticals[row][column - 1] = true;
          break;
        case "right":
          verticals[row][column] = true;
          break;
        case "up":
          horizontals[row - 1][column] = true;
          break;
        case "down":
          horizontals[row][column] = true;
          break;
      }
      // Visit that next cell
      stepThroughCell(nextRow, nextColumn);
    }
  };

  stepThroughCell(startRow, startColumn);

  horizontals.forEach((row, rowIndex) => {
    row.forEach((open, columnIndex) => {
      if (open) return;

      const wall = Bodies.rectangle(
        columnIndex * unitLengthX + unitLengthX / 2,
        rowIndex * unitLengthY + unitLengthY,
        unitLengthX,
        5,
        { label: "wall", isStatic: true, render: { fillStyle: "red" } }
      );

      World.add(world, wall);
    });
  });

  verticals.forEach((row, rowIndex) => {
    row.forEach((open, columnIndex) => {
      if (open) return;

      const wall = Bodies.rectangle(
        columnIndex * unitLengthX + unitLengthX,
        rowIndex * unitLengthY + unitLengthY / 2,
        5,
        unitLengthY,
        { label: "wall", isStatic: true, render: { fillStyle: "red" } }
      );

      World.add(world, wall);
    });
  });

  // Goal
  const goal = Bodies.rectangle(
    width - unitLengthX / 2,
    height - unitLengthY / 2,
    unitLengthX * 0.7,
    unitLengthY * 0.7,
    { label: "goal", isStatic: true, render: { fillStyle: "green" } }
  );
  World.add(world, goal);

  // Ball
  const ballRadius = Math.min(unitLengthX, unitLengthY) / 4;
  const ball = Bodies.circle(unitLengthX / 2, unitLengthY / 2, ballRadius, {
    label: "ball",
    render: { fillStyle: "#0288d1" },
  });
  World.add(world, ball);

  document.addEventListener("keydown", (event) => {
    const { x, y } = ball.velocity;

    switch (event.keyCode) {
      case 87:
        // Move Ball Up
        Body.setVelocity(ball, { x, y: y - 5 });
        break;
      case 68:
        // Move Ball Right
        Body.setVelocity(ball, { x: x + 5, y });
        break;
      case 83:
        // Move Ball Down
        Body.setVelocity(ball, { x, y: y + 5 });
        break;
      case 65:
        // Move Ball Left
        Body.setVelocity(ball, { x: x - 5, y });
        break;
    }
  });

  // Win Condition
  Events.on(engine, "collisionStart", (event) => {
    const labels = ["goal", "ball"];
    const { bodyA, bodyB } = event.pairs[0];

    if (labels.includes(bodyA.label) && labels.includes(bodyB.label)) {
      document.querySelector(".winner").classList.remove("hidden");
      world.gravity.y = 1;
      world.bodies.forEach((wall) => {
        if (wall.label === "wall") Body.setStatic(wall, false);
      });
    }
  });
};

document.querySelectorAll(".setting").forEach((button) => {
  button.addEventListener("click", function () {
    renderGame(parseInt(this.value));
    document.querySelector(".start").classList.add("hidden");
  });
});

document
  .querySelector("#restart")
  .addEventListener("click", () => (document.location.href = ""));

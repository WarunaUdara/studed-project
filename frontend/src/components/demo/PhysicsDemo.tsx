import Matter from "matter-js";
import { useEffect, useRef } from "react";

export function PhysicsDemo() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const { Engine, Render, Runner, Bodies, Composite, Mouse, MouseConstraint } = Matter;

    const width = containerRef.current.clientWidth;
    const height = 600;

    const engine = Engine.create();
    const world = engine.world;

    const render = Render.create({
      element: containerRef.current,
      engine,
      options: {
        width,
        height,
        background: "#f8fafc",
        wireframes: false,
      },
    });

    const wallOptions = { isStatic: true, render: { fillStyle: "#334155" } };
    const ground = Bodies.rectangle(width / 2, height + 30, width, 60, wallOptions);
    const leftWall = Bodies.rectangle(-30, height / 2, 60, height, wallOptions);
    const rightWall = Bodies.rectangle(width + 30, height / 2, 60, height, wallOptions);

    Composite.add(world, [ground, leftWall, rightWall]);

    for (let i = 0; i < 12; i++) {
      const x = 100 + Math.random() * (width - 200);
      const y = -Math.random() * 400;
      if (i % 3 === 0) {
        Composite.add(
          world,
          Bodies.circle(x, y, 20 + Math.random() * 20, {
            restitution: 0.8,
            render: { fillStyle: "#3b82f6" },
          }),
        );
      } else if (i % 3 === 1) {
        Composite.add(
          world,
          Bodies.rectangle(x, y, 40 + Math.random() * 40, 40 + Math.random() * 40, {
            restitution: 0.6,
            render: { fillStyle: "#f59e0b" },
          }),
        );
      } else {
        Composite.add(
          world,
          Bodies.polygon(x, y, 3 + Math.floor(Math.random() * 3), 25 + Math.random() * 20, {
            restitution: 0.7,
            render: { fillStyle: "#10b981" },
          }),
        );
      }
    }

    const mouse = Mouse.create(render.canvas);
    const mouseConstraint = MouseConstraint.create(engine, {
      mouse,
      constraint: {
        stiffness: 0.2,
        render: { visible: false },
      },
    });
    Composite.add(world, mouseConstraint);
    render.mouse = mouse;

    const runner = Runner.create();
    Runner.run(runner, engine);
    Render.run(render);

    return () => {
      Render.stop(render);
      Runner.stop(runner);
      if (render.canvas) {
        render.canvas.remove();
      }
      Composite.clear(world, false);
      Engine.clear(engine);
    };
  }, []);

  return (
    <div className="w-full rounded-lg border bg-card p-1">
      <div ref={containerRef} className="w-full" />
    </div>
  );
}

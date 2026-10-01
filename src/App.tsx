import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Award,
  CircleHelp,
  Clock3,
  Gamepad2,
  Keyboard,
  Medal,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Target,
  Trophy,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';

type Point = { x: number; y: number };
type Direction = Point;
type GameStatus = 'ready' | 'playing' | 'paused' | 'gameover';
type Food = Point & { value: number; color: 'orange' | 'violet' | 'lime' };

const BOARD_WIDTH = 24;
const BOARD_HEIGHT = 18;
const INITIAL_SNAKE: Point[] = [
  { x: 8, y: 9 },
  { x: 7, y: 9 },
  { x: 6, y: 9 },
  { x: 5, y: 9 },
];

const DIRECTIONS: Record<string, Direction> = {
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  w: { x: 0, y: -1 },
  s: { x: 0, y: 1 },
  a: { x: -1, y: 0 },
  d: { x: 1, y: 0 },
};

const FOOD_COLORS: Food['color'][] = ['orange', 'violet', 'lime'];

function samePoint(a: Point, b: Point) {
  return a.x === b.x && a.y === b.y;
}

function randomFood(occupied: Point[]): Food {
  const available: Point[] = [];
  for (let y = 0; y < BOARD_HEIGHT; y += 1) {
    for (let x = 0; x < BOARD_WIDTH; x += 1) {
      if (!occupied.some((point) => point.x === x && point.y === y)) available.push({ x, y });
    }
  }
  const point = available[Math.floor(Math.random() * available.length)] ?? { x: 18, y: 8 };
  const color = FOOD_COLORS[Math.floor(Math.random() * FOOD_COLORS.length)];
  return { ...point, color, value: color === 'lime' ? 20 : color === 'violet' ? 15 : 10 };
}

function initialHighScore() {
  if (typeof window === 'undefined') return 0;
  return Number(window.localStorage.getItem('neon-snake-high-score') ?? 0);
}

function App() {
  const [snake, setSnake] = useState<Point[]>(INITIAL_SNAKE);
  const [food, setFood] = useState<Food>(() => randomFood(INITIAL_SNAKE));
  const [direction, setDirection] = useState<Direction>(DIRECTIONS.ArrowRight);
  const directionRef = useRef<Direction>(DIRECTIONS.ArrowRight);
  const [status, setStatus] = useState<GameStatus>('ready');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(initialHighScore);
  const [foodsEaten, setFoodsEaten] = useState(0);
  const [soundOn, setSoundOn] = useState(true);
  const [eatFlash, setEatFlash] = useState(false);
  const [lastRunScore, setLastRunScore] = useState(0);

  const level = Math.floor(score / 50) + 1;
  const speed = Math.max(68, 142 - (level - 1) * 11);
  const progress = Math.min(100, (foodsEaten / 5) * 100);

  const cells = useMemo(() => {
    const boardCells: Point[] = [];
    for (let y = 0; y < BOARD_HEIGHT; y += 1) {
      for (let x = 0; x < BOARD_WIDTH; x += 1) boardCells.push({ x, y });
    }
    return boardCells;
  }, []);

  const startGame = useCallback(() => {
    const firstSnake = [...INITIAL_SNAKE];
    directionRef.current = DIRECTIONS.ArrowRight;
    setDirection(DIRECTIONS.ArrowRight);
    setSnake(firstSnake);
    setFood(randomFood(firstSnake));
    setScore(0);
    setFoodsEaten(0);
    setLastRunScore(0);
    setStatus('playing');
  }, []);

  const changeDirection = useCallback((next: Direction) => {
    const current = directionRef.current;
    const isReverse = next.x === -current.x && next.y === -current.y;
    if (isReverse) return;
    directionRef.current = next;
    setDirection(next);
    if (status === 'ready') setStatus('playing');
  }, [status]);

  const finishGame = useCallback(() => {
    setLastRunScore(score);
    setStatus('gameover');
    setHighScore((current) => {
      const next = Math.max(current, score);
      window.localStorage.setItem('neon-snake-high-score', String(next));
      return next;
    });
  }, [score]);

  useEffect(() => {
    if (status !== 'playing') return undefined;

    const timer = window.setTimeout(() => {
      const head = snake[0];
      const nextHead = { x: head.x + direction.x, y: head.y + direction.y };
      const willEat = samePoint(nextHead, food);
      const bodyToCheck = willEat ? snake : snake.slice(0, -1);
      const hitWall = nextHead.x < 0 || nextHead.x >= BOARD_WIDTH || nextHead.y < 0 || nextHead.y >= BOARD_HEIGHT;
      const hitSelf = bodyToCheck.some((part) => samePoint(part, nextHead));

      if (hitWall || hitSelf) {
        finishGame();
        return;
      }

      const nextSnake = willEat ? [nextHead, ...snake] : [nextHead, ...snake.slice(0, -1)];
      setSnake(nextSnake);

      if (willEat) {
        setScore((current) => current + food.value);
        setFoodsEaten((current) => current + 1);
        setFood(randomFood(nextSnake));
        setEatFlash(true);
        window.setTimeout(() => setEatFlash(false), 260);
      }
    }, speed);

    return () => window.clearTimeout(timer);
  }, [direction, finishGame, food, score, snake, speed, status]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const next = DIRECTIONS[event.key] ?? DIRECTIONS[event.key.toLowerCase()];
      if (next) {
        event.preventDefault();
        changeDirection(next);
      }
      if (event.key === ' ' || event.key.toLowerCase() === 'p') {
        event.preventDefault();
        if (status === 'playing') setStatus('paused');
        else if (status === 'paused') setStatus('playing');
      }
      if (event.key.toLowerCase() === 'r') startGame();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [changeDirection, startGame, status]);

  const handlePause = () => {
    if (status === 'ready' || status === 'gameover') startGame();
    else setStatus((current) => current === 'playing' ? 'paused' : 'playing');
  };

  const statusCopy = {
    ready: { eyebrow: 'READY WHEN YOU ARE', title: 'Feed the signal.', body: 'Use the arrows or WASD to steer. Eat the energy cells and do not hit the walls.', action: 'START GAME' },
    paused: { eyebrow: 'GAME PAUSED', title: 'Take a breath.', body: 'Your snake is frozen in the grid. Jump back in when you are ready.', action: 'RESUME' },
    gameover: { eyebrow: 'RUN TERMINATED', title: 'Signal lost.', body: `You scored ${lastRunScore} points this run. The grid is waiting for a rematch.`, action: 'PLAY AGAIN' },
  }[status === 'playing' ? 'ready' : status];

  return (
    <div className="snake-app">
      <header className="snake-header">
        <div className="snake-brand" onClick={startGame} role="button" tabIndex={0}>
          <div className="snake-brand-mark"><span /><span /><span /><span /></div>
          <div><strong>NEON</strong><b>SNAKE</b></div>
        </div>
        <div className="header-center"><span className="online-dot" /> ARCADE MODE <i /> GRID 24 × 18</div>
        <div className="header-actions"><span className="header-best">BEST <strong>{String(highScore).padStart(5, '0')}</strong></span><button className="sound-button" onClick={() => setSoundOn((current) => !current)} aria-label="Toggle sound">{soundOn ? <Volume2 size={16} /> : <VolumeX size={16} />}</button></div>
      </header>

      <main className="snake-layout">
        <aside className="snake-side left-side">
          <section className="side-intro"><div className="eyebrow"><Sparkles size={13} /> HOW TO PLAY</div><h1>Grow<br /><em>fearlessly.</em></h1><p>Every cell you eat makes you longer, faster, and harder to control.</p></section>
          <section className="info-card controls-card"><div className="card-title"><Keyboard size={14} /> CONTROLS</div><div className="control-display"><div className="arrow-cluster"><span className="key-spacer" /><button onClick={() => changeDirection(DIRECTIONS.ArrowUp)} aria-label="Move up"><ArrowUp size={14} /></button><span className="key-spacer" /><button onClick={() => changeDirection(DIRECTIONS.ArrowLeft)} aria-label="Move left"><ArrowLeft size={14} /></button><button onClick={() => changeDirection(DIRECTIONS.ArrowDown)} aria-label="Move down"><ArrowDown size={14} /></button><button onClick={() => changeDirection(DIRECTIONS.ArrowRight)} aria-label="Move right"><ArrowRight size={14} /></button></div><div className="control-labels"><span>ARROW KEYS</span><span>OR WASD</span></div></div><div className="small-control"><kbd>SPACE</kbd><span>Pause / resume</span></div><div className="small-control"><kbd>R</kbd><span>Restart run</span></div></section>
          <section className="info-card score-card"><div className="card-title"><Trophy size={14} /> PERSONAL BEST</div><strong>{String(highScore).padStart(5, '0')}</strong><span>KEEP YOUR CHAIN ALIVE</span><div className="score-lines"><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /></div></section>
        </aside>

        <section className="game-column">
          <div className="game-heading"><div><div className="game-kicker"><span className="pulse-dot" /> LIVE GRID / {status === 'playing' ? 'RUNNING' : status.toUpperCase()}</div><h2>Eat. Grow. <em>Repeat.</em></h2></div><div className="heading-level"><span>LEVEL</span><strong>{String(level).padStart(2, '0')}</strong></div></div>
          <div className={`game-frame ${eatFlash ? 'eat-flash' : ''}`}>
            <div className="frame-top"><span><i className="frame-dot dot-red" /><i className="frame-dot dot-yellow" /><i className="frame-dot dot-green" /></span><b>NEON_GRID.exe</b><span className="frame-coords">{String(snake[0].x).padStart(2, '0')} : {String(snake[0].y).padStart(2, '0')}</span></div>
            <div className="game-board" style={{ '--board-columns': BOARD_WIDTH, '--board-rows': BOARD_HEIGHT } as React.CSSProperties}>
              <div className="board-glow" />
              {cells.map((cell) => {
                const snakeIndex = snake.findIndex((part) => samePoint(part, cell));
                const isFood = samePoint(food, cell);
                const isHead = snakeIndex === 0;
                return <div className={`board-cell ${snakeIndex >= 0 ? 'snake-cell' : ''} ${isHead ? 'snake-head' : ''} ${snakeIndex > 0 ? 'snake-body' : ''} ${isFood ? `food-cell food-${food.color}` : ''}`} key={`${cell.x}-${cell.y}`}><span /></div>;
              })}
            </div>
            {status !== 'playing' && <div className={`game-overlay overlay-${status}`}><div className="overlay-icon">{status === 'gameover' ? <Target size={25} /> : <Gamepad2 size={25} />}</div><span className="overlay-eyebrow">{statusCopy.eyebrow}</span><h3>{statusCopy.title}</h3><p>{statusCopy.body}</p><button className="overlay-button" onClick={status === 'paused' ? handlePause : startGame}>{status === 'paused' ? <Play size={15} fill="currentColor" /> : <RotateCcw size={15} />} {statusCopy.action}</button></div>}
            <div className="board-corner corner-tl" /><div className="board-corner corner-tr" /><div className="board-corner corner-bl" /><div className="board-corner corner-br" />
          </div>
          <div className="game-stats"><div><span>SCORE</span><strong>{String(score).padStart(5, '0')}</strong></div><div><span>CELLS EATEN</span><strong>{String(foodsEaten).padStart(2, '0')}</strong></div><div><span>PACE</span><strong>{speed}<small>MS</small></strong></div><button className="pause-button" onClick={handlePause}>{status === 'playing' ? <Pause size={15} /> : <Play size={15} fill="currentColor" />} {status === 'playing' ? 'PAUSE' : status === 'paused' ? 'RESUME' : 'START'}</button></div>
        </section>

        <aside className="snake-side right-side">
          <section className="info-card mission-card"><div className="card-title"><Target size={14} /> CURRENT MISSION</div><h3>Consume 5 cells</h3><p>Complete the objective to unlock a new grid skin.</p><div className="mission-progress"><span style={{ width: `${progress}%` }} /></div><div className="mission-foot"><span>{foodsEaten} / 5 COMPLETE</span><em>+50 XP</em></div></section>
          <section className="info-card live-card"><div className="card-title"><Zap size={14} /> RUN TELEMETRY</div><div className="telemetry-item"><div className="telemetry-icon orange"><Clock3 size={15} /></div><span>SESSION TIME</span><strong>{status === 'playing' ? 'LIVE' : '—'}</strong></div><div className="telemetry-item"><div className="telemetry-icon violet"><Medal size={15} /></div><span>HIGH SCORE</span><strong>{String(highScore).padStart(5, '0')}</strong></div><div className="telemetry-item"><div className="telemetry-icon lime"><Award size={15} /></div><span>RANKING</span><strong>TOP 12%</strong></div></section>
          <section className="tip-card"><div className="tip-icon"><CircleHelp size={17} /></div><div><strong>PRO TIP</strong><p>Use the edges to make sharp turns, but never box yourself in.</p></div></section>
        </aside>
      </main>
      <footer className="snake-footer"><span><i className="online-dot" /> ALL SYSTEMS NOMINAL</span><span>NEON SNAKE / ARCADE PROTOCOL 01</span><span>PRESS <b>R</b> TO RESTART</span></footer>
    </div>
  );
}

export default App;

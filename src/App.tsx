import { useEffect, useRef, useState, useCallback } from 'react';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [position, setPosition] = useState({ x: 5, y: 0 });
  const [offsetY, setOffsetY] = useState(0);

  // 게임 상수 정의
  const TILE_SIZE = 40; // 타일 하나의 크기 (픽셀)
  const MAP_WIDTH = 10; // 맵의 가로 타일 개수
  const MAP_HEIGHT = 20; // 맵의 세로 타일 개수

  // 꼬순이 캐릭터 이미지 로드
  const kosooniImage = new Image();
  kosooniImage.src = "/kosooni_character_40x40.png";

  // 타일 종류별 색상 정의 (폭탄 색상 추가)
  const tileColors: Record<string, string> = {
    dirt: "#8B4513",
    copper: "#B87333",
    silver: "#C0C0C0",
    gold: "#FFD700",
    diamond: "#00FFFF",
    sweetpotato: "#FFA07A",
    bomb: "#FF0000",
  };

  const BOMB_INITIAL_COUNTDOWN = 3;
  const BOMB_EXPLOSION_RADIUS = 1;

  type MineralTileType = "dirt" | "copper" | "silver" | "gold" | "diamond" | "sweetpotato";
  interface BombTileObject {
    type: 'bomb';
    countdown: number;
  }
  type MapTile = MineralTileType | BombTileObject | null;

  const generateMap = useCallback(() => {
    const tiles: MineralTileType[] = ["dirt", "copper", "silver", "gold", "diamond", "sweetpotato"];
    const map: MapTile[][] = [];
    for (let y = 0; y < MAP_HEIGHT; y++) {
      const row: MapTile[] = [];
      for (let x = 0; x < MAP_WIDTH; x++) {
        let tile: MapTile = null;
        if (y >= 2) {
          const random = Math.random();
          if (random < 0.05) {
            tile = { type: 'bomb', countdown: BOMB_INITIAL_COUNTDOWN } as BombTileObject;
          } else {
            tile = tiles[Math.floor(Math.random() * tiles.length)];
          }
        }
        row.push(tile);
      }
      map.push(row);
    }
    return map;
  }, []);

  const [tileMap, setTileMap] = useState<MapTile[][]>(generateMap);
  const [blinkingState, setBlinkingState] = useState(false);

  const explodeBomb = useCallback((bombX: number, bombY: number, currentMap: MapTile[][]) => {
    const newMap = currentMap.map(row => [...row]);
    for (let dy = -BOMB_EXPLOSION_RADIUS; dy <= BOMB_EXPLOSION_RADIUS; dy++) {
      for (let dx = -BOMB_EXPLOSION_RADIUS; dx <= BOMB_EXPLOSION_RADIUS; dx++) {
        const targetY = bombY + dy;
        const targetX = bombX + dx;

        if (targetY >= 0 && targetY < MAP_HEIGHT && targetX >= 0 && targetX < MAP_WIDTH) {
          newMap[targetY][targetX] = null;
        }
      }
    }
    return newMap;
  }, [BOMB_EXPLOSION_RADIUS, MAP_HEIGHT, MAP_WIDTH]);

  // 점프 모션 틱을 위한 새로운 상태 및 상수 추가
  const JUMP_OFFSET_DURATION = 100; // 낙하 애니메이션 지속 시간 (ms)
  const GAME_TICK_INTERVAL = 500; // 게임 루프 실행 간격 (ms) - 원래 1000ms에서 500ms로 변경

  useEffect(() => {
    const gameInterval = setInterval(() => {
      setOffsetY(-5); // 캐릭터가 살짝 위로 올라가는 듯한 애니메이션 효과 시작
      setTimeout(() => {
        setOffsetY(0); // 오프셋 초기화 (원래 위치로 돌아옴)

        setTileMap((prevMap) => {
          let currentMap = prevMap.map(row => [...row]);

          let bombsToExplode: { x: number; y: number; }[] = [];
          for (let y = 0; y < MAP_HEIGHT; y++) {
            for (let x = 0; x < MAP_WIDTH; x++) {
              const tile = currentMap[y][x];
              if (typeof tile === 'object' && tile !== null && tile.type === 'bomb') {
                if (tile.countdown > 0) {
                  currentMap[y][x] = { ...tile, countdown: tile.countdown - 1 };
                } else {
                  bombsToExplode.push({ x, y });
                }
              }
            }
          }

          bombsToExplode.forEach(({ x, y }) => {
            currentMap = explodeBomb(x, y, currentMap);
          });

          let newPlayerY = position.y;
          const tileBelowPlayer = currentMap[newPlayerY + 1]?.[position.x];

          if (newPlayerY + 1 < MAP_HEIGHT) {
            if (tileBelowPlayer === null) {
              newPlayerY++;
            } else if (typeof tileBelowPlayer === 'string') {
              currentMap[newPlayerY + 1][position.x] = null;
              newPlayerY++;
            } else if (typeof tileBelowPlayer === 'object' && tileBelowPlayer.type === 'bomb') {
              // 폭탄 위에서는 멈춤
            }
          }

          if (newPlayerY !== position.y) {
            setPosition((prev) => ({ x: prev.x, y: newPlayerY }));
          }

          return currentMap;
        });
      }, JUMP_OFFSET_DURATION); // 낙하 애니메이션을 위한 짧은 지연 (JUMP_OFFSET_DURATION으로 변경)
    }, GAME_TICK_INTERVAL); // 게임 루프 실행 간격 (GAME_TICK_INTERVAL으로 변경)

    return () => clearInterval(gameInterval);
  }, [position, explodeBomb, MAP_HEIGHT, JUMP_OFFSET_DURATION, GAME_TICK_INTERVAL]); // 의존성 배열에 JUMP_OFFSET_DURATION, GAME_TICK_INTERVAL 추가

  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlinkingState(prev => !prev);
    }, 200);
    return () => clearInterval(blinkInterval);
  }, []);

  const movePlayer = useCallback((direction: "left" | "right") => {
    setPosition((prev) => {
      let { x } = prev;
      let newX = x;

      if (direction === "left") newX = Math.max(0, x - 1);
      else if (direction === "right") newX = Math.min(MAP_WIDTH - 1, x + 1);

      return { x: newX, y: prev.y };
    });
  }, [MAP_WIDTH]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "ArrowLeft") movePlayer("left");
    else if (e.key === "ArrowRight") movePlayer("right");
  }, [movePlayer]);

  // Canvas 그리기 로직
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    // 반응형 캔버스 크기 조정
    const screenWidth = window.innerWidth * 0.9; // 화면 너비의 90% 사용
    const newCanvasWidth = Math.min(screenWidth, TILE_SIZE * MAP_WIDTH); // 최대 맵 너비 제한
    const newCanvasHeight = (newCanvasWidth / (TILE_SIZE * MAP_WIDTH)) * (TILE_SIZE * MAP_HEIGHT);

    canvas.width = newCanvasWidth;
    canvas.height = newCanvasHeight;

    const scale = newCanvasWidth / (TILE_SIZE * MAP_WIDTH); // 스케일 비율 계산

    const draw = () => {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = "#222";
      context.fillRect(0, 0, canvas.width, canvas.height);

      context.save(); // 현재 변환 상태 저장
      context.scale(scale, scale); // 스케일 적용

      for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
          const tile = tileMap[y][x];

          if (tile === null) {
            continue;
          }

          if (typeof tile === 'string') {
            context.fillStyle = tileColors[tile] || "gray";
            context.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
          }
          else if (typeof tile === 'object' && tile.type === 'bomb') {
            if (tile.countdown <= 1 || blinkingState) {
              context.fillStyle = tileColors.bomb;
              context.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);

              context.fillStyle = "white";
              context.font = `${TILE_SIZE * 0.6}px Arial`;
              context.textAlign = "center";
              context.textBaseline = "middle";
              context.fillText(
                tile.countdown.toString(),
                x * TILE_SIZE + TILE_SIZE / 2,
                y * TILE_SIZE + TILE_SIZE / 2
              );
            } else {
              context.fillStyle = "#800000";
              context.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            }
          }
        }
      }

      context.drawImage(
        kosooniImage,
        position.x * TILE_SIZE,
        position.y * TILE_SIZE + offsetY,
        TILE_SIZE,
        TILE_SIZE
      );

      context.restore(); // 저장된 변환 상태 복원 (스케일 초기화)
    };

    draw();
  }, [position, tileMap, offsetY, blinkingState, TILE_SIZE, MAP_HEIGHT, MAP_WIDTH, tileColors, kosooniImage]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // 모바일 터치 이벤트 핸들러
  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault(); // 기본 스크롤 방지
    const touchX = e.touches[0].clientX; // 첫 번째 터치의 X 좌표
    const screenWidth = window.innerWidth;

    if (touchX < screenWidth / 2) {
      movePlayer("left"); // 화면 좌측 터치 시 좌측 이동
    } else {
      movePlayer("right"); // 화면 우측 터치 시 우측 이동
    }
  }, [movePlayer]);

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4 relative overflow-hidden" // overflow-hidden 추가
      onTouchStart={handleTouchMove} // 터치 시작 시 이동 처리
      onTouchMove={handleTouchMove} // 터치 이동 시에도 이동 처리 (계속 누르고 있을 때)
    >
      <h1 className="text-xl mb-4">꼬순이의 고구마 왕국 탐험기</h1>
      <canvas
        ref={canvasRef}
        className="border-4 border-yellow-400 mb-4 rounded-lg shadow-lg"
      ></canvas>
      {/* 기존 버튼 유지, 터치 영역과 겹치지 않도록 조정 */}
      <div className="flex gap-4 text-black mt-4">
        <button
          className="bg-yellow-300 px-6 py-2 rounded-lg shadow-md hover:bg-yellow-400 transition-colors text-lg font-bold"
          onClick={() => movePlayer("left")}
        >
          ←
        </button>
        <button
          className="bg-yellow-300 px-6 py-2 rounded-lg shadow-md hover:bg-yellow-400 transition-colors text-lg font-bold"
          onClick={() => movePlayer("right")}
        >
          →
        </button>
      </div>
    </div>
  );
}
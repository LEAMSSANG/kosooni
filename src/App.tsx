import { useEffect, useRef, useState, useCallback } from 'react';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [position, setPosition] = useState({ x: 5, y: 0 }); // 꼬순이의 논리적(절대) Y 위치
  const [offsetY, setOffsetY] = useState(0); // 낙하 애니메이션을 위한 Y축 오프셋
  const [scrollOffset, setScrollOffset] = useState(0); // 맵 스크롤을 위한 Y축 오프셋

  // 게임 상수 정의
  const TILE_SIZE = 40; // 타일 하나의 크기 (픽셀)
  const MAP_WIDTH = 10; // 맵의 가로 타일 개수
  const MAP_HEIGHT = 20; // 화면에 보이는 맵의 세로 타일 개수

  // 꼬순이 캐릭터 이미지 로드
  const kosooniImage = new Image();
  kosooniImage.src = "/kosooni_character_40x40.png"; // 꼬순이 캐릭터 이미지 (public 폴더 경로)

  // 타일 종류별 색상 정의 (폭탄 색상 추가)
  const tileColors: Record<string, string> = {
    dirt: "#8B4513", // 흙
    copper: "#B87333", // 구리
    silver: "#C0C0C0", // 은
    gold: "#FFD700", // 금
    diamond: "#00FFFF", // 다이아몬드
    sweetpotato: "#FFA07A", // 고구마 (특수 광물)
    bomb: "#FF0000", // 폭탄 (빨간색)
  };

  const BOMB_INITIAL_COUNTDOWN = 3; // 폭탄 초기 카운트다운 시간 (초)
  const BOMB_EXPLOSION_RADIUS = 0; // 폭탄 폭발 시 제거되는 타일 범위 (0: 자신만 제거)

  // 타일 타입 정의: 일반 광물은 문자열, 폭탄은 객체로 표현
  type MineralTileType = "dirt" | "copper" | "silver" | "gold" | "diamond" | "sweetpotato";
  interface BombTileObject {
    type: 'bomb';
    countdown: number;
  }
  // 맵에 들어갈 수 있는 타일의 최종 타입 (null 포함)
  type MapTile = MineralTileType | BombTileObject | null;

  // 새로운 타일 행을 생성하는 함수
  const generateNewRow = useCallback(() => {
    const tiles: MineralTileType[] = ["dirt", "copper", "silver", "gold", "diamond", "sweetpotato"];
    const row: MapTile[] = [];
    for (let x = 0; x < MAP_WIDTH; x++) {
      let tile: MapTile = null;
      const random = Math.random();
      if (random < 0.05) { // 5% 확률로 폭탄 타일 배치
        tile = { type: 'bomb', countdown: BOMB_INITIAL_COUNTDOWN } as BombTileObject;
      } else {
        // 나머지 95% 확률로 일반 광물 타일 배치
        tile = tiles[Math.floor(Math.random() * tiles.length)];
      }
      row.push(tile);
    }
    return row;
  }, [MAP_WIDTH, BOMB_INITIAL_COUNTDOWN]);

  // 초기 맵 생성 함수
  const generateInitialMap = useCallback(() => {
    const map: MapTile[][] = [];
    // 초기 맵은 화면 높이의 2배 정도로 생성하여 시작 시 충분한 공간 제공
    for (let y = 0; y < MAP_HEIGHT * 2; y++) {
      map.push(generateNewRow());
    }
    // 플레이어 시작 위치의 상단 두 줄은 비워둠
    map[0] = Array(MAP_WIDTH).fill(null);
    map[1] = Array(MAP_WIDTH).fill(null);
    return map;
  }, [MAP_HEIGHT, MAP_WIDTH, generateNewRow]);

  const [tileMap, setTileMap] = useState<MapTile[][]>(generateInitialMap);
  const [blinkingState, setBlinkingState] = useState(false);

  const explodeBomb = useCallback((bombX: number, bombY: number, currentMap: MapTile[][]) => {
    const newMap = currentMap.map(row => [...row]);
    for (let dy = -BOMB_EXPLOSION_RADIUS; dy <= BOMB_EXPLOSION_RADIUS; dy++) {
      for (let dx = -BOMB_EXPLOSION_RADIUS; dx <= BOMB_EXPLOSION_RADIUS; dx++) {
        const targetY = bombY + dy;
        const targetX = bombX + dx;

        // 맵 범위 내에 있는 타일만 제거
        if (targetY >= 0 && targetY < newMap.length && targetX >= 0 && targetX < MAP_WIDTH) {
          newMap[targetY][targetX] = null;
        }
      }
    }
    return newMap;
  }, [BOMB_EXPLOSION_RADIUS, MAP_WIDTH]);

  // 점프 모션 틱을 위한 새로운 상태 및 상수 추가
  const JUMP_OFFSET_DURATION = 100; // 낙하 애니메이션 지속 시간 (ms)
  const GAME_TICK_INTERVAL = 500; // 게임 루프 실행 간격 (ms)

  // 캐릭터가 화면 중앙에 고정되기 시작하는 Y 좌표 (타일 기준)
  const SCROLL_THRESHOLD_Y = Math.floor(MAP_HEIGHT / 3); // 예를 들어, 화면 높이의 1/3 지점

  useEffect(() => {
    const gameInterval = setInterval(() => {
      setOffsetY(-5); // 캐릭터가 살짝 위로 올라가는 듯한 애니메이션 효과 시작
      setTimeout(() => {
        setOffsetY(0); // 오프셋 초기화 (원래 위치로 돌아옴)

        setTileMap((prevMap) => {
          let currentMap = prevMap.map(row => [...row]);

          let bombsToExplode: { x: number; y: number; }[] = [];
          for (let y = 0; y < currentMap.length; y++) {
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

          if (newPlayerY + 1 < currentMap.length) {
            if (tileBelowPlayer === null) {
              newPlayerY++;
            } else if (typeof tileBelowPlayer === 'string') {
              currentMap[newPlayerY + 1][position.x] = null;
              newPlayerY++;
            } else if (typeof tileBelowPlayer === 'object' && tileBelowPlayer.type === 'bomb') {
              // 폭탄 위에서는 멈춤
            }
          }

          // 무한 맵 로직: 플레이어가 맵의 끝에 가까워지면 새로운 행 추가
          const MAP_GENERATE_THRESHOLD = currentMap.length - MAP_HEIGHT; // 맵의 끝에서 MAP_HEIGHT만큼 남았을 때
          if (newPlayerY >= MAP_GENERATE_THRESHOLD) {
            // 새로운 행을 추가
            currentMap.push(generateNewRow());
          }

          if (newPlayerY !== position.y) {
            setPosition((prev) => ({ x: prev.x, y: newPlayerY }));
            // 스크롤 오프셋 계산
            if (newPlayerY >= SCROLL_THRESHOLD_Y) {
              setScrollOffset((newPlayerY - SCROLL_THRESHOLD_Y) * TILE_SIZE);
            } else {
              setScrollOffset(0);
            }
          }

          return currentMap;
        });
      }, JUMP_OFFSET_DURATION);
    }, GAME_TICK_INTERVAL);

    return () => clearInterval(gameInterval);
  }, [position, explodeBomb, MAP_HEIGHT, JUMP_OFFSET_DURATION, GAME_TICK_INTERVAL, SCROLL_THRESHOLD_Y, generateNewRow]);

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

    // 반응형 캔버스 크기 조정 로직 개선
    const availableWidth = window.innerWidth * 0.9; // 화면 너비의 90% 사용
    const availableHeight = window.innerHeight - 100; // 대략적인 타이틀, 패딩, 여백 제외

    const mapAspectRatio = (TILE_SIZE * MAP_WIDTH) / (TILE_SIZE * MAP_HEIGHT); // 맵의 가로세로 비율 (WIDTH / HEIGHT)

    let newCanvasWidth = availableWidth;
    let newCanvasHeight = availableWidth / mapAspectRatio;

    if (newCanvasHeight > availableHeight) {
      newCanvasHeight = availableHeight;
      newCanvasWidth = availableHeight * mapAspectRatio;
    }

    // 최종 캔버스 크기는 맵의 실제 크기를 넘지 않도록 제한
    newCanvasWidth = Math.min(newCanvasWidth, TILE_SIZE * MAP_WIDTH);
    newCanvasHeight = Math.min(newCanvasHeight, TILE_SIZE * MAP_HEIGHT);

    canvas.width = newCanvasWidth;
    canvas.height = newCanvasHeight;

    const scale = newCanvasWidth / (TILE_SIZE * MAP_WIDTH); // 스케일 비율 계산

    const draw = () => {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = "#222";
      context.fillRect(0, 0, canvas.width, canvas.height);

      context.save(); // 현재 변환 상태 저장
      context.scale(scale, scale); // 스케일 적용

      // 맵 그리기 (스크롤 오프셋 적용)
      // 화면에 보이는 MAP_HEIGHT만큼만 그림
      // 시작 Y 좌표는 scrollOffset을 TILE_SIZE로 나눈 값
      const startDrawY = Math.floor(scrollOffset / TILE_SIZE);
      for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
          // 실제 맵 데이터의 y 좌표는 스크롤된 부분부터 시작
          const actualMapY = startDrawY + y;
          const tile = tileMap[actualMapY]?.[x]; // 실제 맵 데이터에서 타일 가져오기

          if (tile === null || tile === undefined) {
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

      // 꼬순이 캐릭터 그리기 (스크롤 오프셋에 따라 화면 Y 위치 고정)
      const kosooniDisplayY = position.y >= SCROLL_THRESHOLD_Y
        ? SCROLL_THRESHOLD_Y * TILE_SIZE
        : position.y * TILE_SIZE;

      context.drawImage(
        kosooniImage,
        position.x * TILE_SIZE,
        kosooniDisplayY + offsetY,
        TILE_SIZE,
        TILE_SIZE
      );

      context.restore(); // 저장된 변환 상태 복원 (스케일 초기화)
    };

    draw();
  }, [position, tileMap, offsetY, blinkingState, TILE_SIZE, MAP_HEIGHT, MAP_WIDTH, tileColors, kosooniImage, scrollOffset, SCROLL_THRESHOLD_Y]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const availableWidth = window.innerWidth * 0.9;
        const availableHeight = window.innerHeight - 100;
        const mapAspectRatio = (TILE_SIZE * MAP_WIDTH) / (TILE_SIZE * MAP_HEIGHT);

        let newCanvasWidth = availableWidth;
        let newCanvasHeight = availableWidth / mapAspectRatio;

        if (newCanvasHeight > availableHeight) {
          newCanvasHeight = availableHeight;
          newCanvasWidth = availableHeight * mapAspectRatio;
        }

        canvas.width = Math.min(newCanvasWidth, TILE_SIZE * MAP_WIDTH);
        canvas.height = Math.min(newCanvasHeight, TILE_SIZE * MAP_HEIGHT);
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleResize);
    };
  }, [handleKeyDown, TILE_SIZE, MAP_WIDTH, MAP_HEIGHT]);

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
      {/* 하단 화살표 버튼 제거됨 */}
    </div>
  );
}

import { useEffect, useRef, useState, useCallback } from 'react'; // React는 직접 사용하지 않으므로 제거

export default function App() {
  // Canvas 요소에 접근하기 위한 ref
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // 꼬순이 캐릭터의 현재 위치 (x, y 좌표)
  const [position, setPosition] = useState({ x: 5, y: 0 });
  // 낙하 애니메이션을 위한 Y축 오프셋
  const [offsetY, setOffsetY] = useState(0);

  // 게임 상수 정의
  const TILE_SIZE = 40; // 타일 하나의 크기 (픽셀)
  const MAP_WIDTH = 10; // 맵의 가로 타일 개수
  const MAP_HEIGHT = 20; // 맵의 세로 타일 개수

  // 꼬순이 캐릭터 이미지 로드
  // 실제 이미지 경로가 주어지지 않아 임시 플레이스홀더 이미지를 사용합니다.
  // 실제 이미지 파일을 사용하시려면 kosooni_character_40x40.png 경로를 여기에 넣어주세요.
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

  // 폭탄 관련 상수 정의
  const BOMB_INITIAL_COUNTDOWN = 3; // 폭탄 초기 카운트다운 시간 (초)
  const BOMB_EXPLOSION_RADIUS = 1; // 폭탄 폭발 시 제거되는 타일 범위 (중심으로부터 1칸, 총 3x3 영역)

  // 타일 타입 정의: 일반 광물은 문자열, 폭탄은 객체로 표현
  type MineralTileType = "dirt" | "copper" | "silver" | "gold" | "diamond" | "sweetpotato";
  interface BombTileObject {
    type: 'bomb';
    countdown: number;
  }
  // 맵에 들어갈 수 있는 타일의 최종 타입 (null 포함)
  type MapTile = MineralTileType | BombTileObject | null;

  // 맵 생성 함수
  const generateMap = useCallback(() => {
    const tiles: MineralTileType[] = ["dirt", "copper", "silver", "gold", "diamond", "sweetpotato"];
    const map: MapTile[][] = []; // 맵 타입 명시
    for (let y = 0; y < MAP_HEIGHT; y++) {
      const row: MapTile[] = []; // 행 타입 명시
      for (let x = 0; x < MAP_WIDTH; x++) {
        let tile: MapTile = null; // 타일 변수 타입 명시 및 초기화
        if (y >= 2) { // 상단 두 줄은 플레이어 시작 영역이므로 타일을 배치하지 않음
          const random = Math.random();
          if (random < 0.05) { // 5% 확률로 폭탄 타일 배치
            tile = { type: 'bomb', countdown: BOMB_INITIAL_COUNTDOWN } as BombTileObject; // 타입 단언 추가
          } else {
            // 나머지 95% 확률로 일반 광물 타일 배치
            tile = tiles[Math.floor(Math.random() * tiles.length)];
          }
        }
        row.push(tile);
      }
      map.push(row);
    }
    return map;
  }, []); // 의존성 배열이 비어있으므로 컴포넌트 마운트 시 한 번만 생성

  // 게임 맵 상태
  const [tileMap, setTileMap] = useState<MapTile[][]>(generateMap);
  // 폭탄 점멸 효과를 위한 전역 상태 (모든 폭탄에 동일하게 적용)
  const [blinkingState, setBlinkingState] = useState(false);

  // 폭탄 폭발 처리 함수
  const explodeBomb = useCallback((bombX: number, bombY: number, currentMap: MapTile[][]) => {
    // 맵의 불변성을 유지하기 위해 깊은 복사 수행
    const newMap = currentMap.map(row => [...row]);
    // 폭발 반경 내의 모든 타일 제거
    for (let dy = -BOMB_EXPLOSION_RADIUS; dy <= BOMB_EXPLOSION_RADIUS; dy++) {
      for (let dx = -BOMB_EXPLOSION_RADIUS; dx <= BOMB_EXPLOSION_RADIUS; dx++) {
        const targetY = bombY + dy;
        const targetX = bombX + dx;

        // 맵 범위 내에 있는 타일만 제거
        if (targetY >= 0 && targetY < MAP_HEIGHT && targetX >= 0 && targetX < MAP_WIDTH) {
          newMap[targetY][targetX] = null; // 타일을 빈 공간으로 만듦
        }
      }
    }
    return newMap; // 업데이트된 맵 반환
  }, [BOMB_EXPLOSION_RADIUS, MAP_HEIGHT, MAP_WIDTH]); // 폭발 반경, 맵 높이/너비를 의존성 배열에 추가

  // 게임 루프: 중력, 폭탄 카운트다운 및 폭발 처리
  useEffect(() => {
    const gameInterval = setInterval(() => {
      setOffsetY(-5); // 캐릭터가 살짝 위로 올라가는 듯한 애니메이션 효과 시작
      setTimeout(() => {
        setOffsetY(0); // 오프셋 초기화 (원래 위치로 돌아옴)

        setTileMap((prevMap) => {
          let currentMap = prevMap.map(row => [...row]); // 현재 맵 상태 복사 (불변성 유지)

          // 1. 폭탄 카운트다운 및 폭발 처리
          let bombsToExplode: { x: number; y: number; }[] = [];
          for (let y = 0; y < MAP_HEIGHT; y++) {
            for (let x = 0; x < MAP_WIDTH; x++) {
              const tile = currentMap[y][x];
              // 타일이 객체이고, 폭탄 타입인지 명확히 확인
              if (typeof tile === 'object' && tile !== null && tile.type === 'bomb') {
                if (tile.countdown > 0) {
                  // 폭탄 카운트다운 감소
                  currentMap[y][x] = { ...tile, countdown: tile.countdown - 1 };
                } else {
                  // 카운트다운이 0이 되면 폭발 예정 목록에 추가
                  bombsToExplode.push({ x, y });
                }
              }
            }
          }

          // 폭발 예정인 폭탄들 처리
          bombsToExplode.forEach(({ x, y }) => {
            currentMap = explodeBomb(x, y, currentMap); // 폭탄 폭발 및 주변 타일 제거
          });

          // 2. 플레이어 낙하 (중력) 및 타일 상호작용 처리
          let newPlayerY = position.y;
          // 플레이어 바로 아래 타일 확인 (맵 경계를 벗어나지 않도록 안전하게 접근)
          const tileBelowPlayer = currentMap[newPlayerY + 1]?.[position.x];

          if (newPlayerY + 1 < MAP_HEIGHT) { // 플레이어 아래에 공간이 있는지 확인
            if (tileBelowPlayer === null) {
              // 아래 타일이 비어있으면 플레이어 낙하
              newPlayerY++;
            } else if (typeof tileBelowPlayer === 'string') {
              // 아래 타일이 일반 광물 타일이면 파괴하고 그 자리로 낙하
              currentMap[newPlayerY + 1][position.x] = null;
              newPlayerY++;
            } else if (typeof tileBelowPlayer === 'object' && tileBelowPlayer.type === 'bomb') {
              // 아래 타일이 폭탄이면 플레이어는 그 위에 멈춤. 폭탄은 독립적으로 카운트다운 진행.
              // 플레이어 위치나 폭탄 상태에 변화 없음.
            }
          }

          // 플레이어 위치가 변경되었으면 상태 업데이트
          if (newPlayerY !== position.y) {
            setPosition((prev) => ({ x: prev.x, y: newPlayerY }));
          }

          return currentMap; // 업데이트된 맵 반환
        });
      }, 200); // 낙하 애니메이션을 위한 짧은 지연 (0.2초)
    }, 1000); // 1초마다 게임 루프 실행

    return () => clearInterval(gameInterval); // 컴포넌트 언마운트 시 인터벌 정리
  }, [position, explodeBomb, MAP_HEIGHT]); // 의존성 배열에 position, explodeBomb, MAP_HEIGHT 추가

  // 폭탄 점멸 효과를 위한 인터벌 (시각적 효과)
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlinkingState(prev => !prev); // 200ms마다 점멸 상태 토글
    }, 200);
    return () => clearInterval(blinkInterval); // 컴포넌트 언마운트 시 인터벌 정리
  }, []);

  // 플레이어 좌우 이동 함수
  const movePlayer = useCallback((direction: "left" | "right") => {
    setPosition((prev) => {
      let { x } = prev; // 현재 x 좌표
      let newX = x; // 새로운 x 좌표

      if (direction === "left") newX = Math.max(0, x - 1); // 왼쪽으로 이동 (최소 0)
      else if (direction === "right") newX = Math.min(MAP_WIDTH - 1, x + 1); // 오른쪽으로 이동 (최대 MAP_WIDTH-1)

      // 플레이어는 자유롭게 좌우 이동 가능. 중력이 아래로 당김.
      return { x: newX, y: prev.y }; // y 좌표는 유지하고 x 좌표만 업데이트
    });
  }, [MAP_WIDTH]); // MAP_WIDTH를 의존성 배열에 추가

  // 키보드 입력 핸들러
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "ArrowLeft") movePlayer("left"); // 왼쪽 화살표 키
    else if (e.key === "ArrowRight") movePlayer("right"); // 오른쪽 화살표 키
  }, [movePlayer]); // movePlayer 함수를 의존성 배열에 추가

  // Canvas 그리기 로직
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return; // canvas 요소가 없으면 함수 종료
    const context = canvas.getContext("2d");
    if (!context) return; // 2D 컨텍스트를 가져오지 못하면 함수 종료

    const draw = () => {
      context.clearRect(0, 0, canvas.width, canvas.height); // 캔버스 초기화
      context.fillStyle = "#222"; // 배경색 설정
      context.fillRect(0, 0, canvas.width, canvas.height); // 배경 채우기

      // 타일 맵 그리기
      for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
          const tile = tileMap[y][x]; // 현재 타일 (MapTile 타입)

          if (tile === null) { // 타일이 비어있으면 그리지 않고 다음으로
            continue;
          }

          // 타일이 문자열(광물) 타입인 경우
          if (typeof tile === 'string') {
            context.fillStyle = tileColors[tile] || "gray"; // 타일 색상 설정
            context.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE); // 타일 그리기
          }
          // 타일이 객체이고 폭탄 타입인 경우
          else if (typeof tile === 'object' && tile.type === 'bomb') {
            // 폭탄 점멸 효과: 카운트다운이 1 이하이거나 전역 점멸 상태일 때만 그림
            if (tile.countdown <= 1 || blinkingState) {
              context.fillStyle = tileColors.bomb; // 폭탄 색상 설정
              context.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE); // 폭탄 그리기

              // 카운트다운 숫자 그리기
              context.fillStyle = "white"; // 텍스트 색상
              context.font = `${TILE_SIZE * 0.6}px Arial`; // 폰트 크기
              context.textAlign = "center"; // 텍스트 중앙 정렬
              context.textBaseline = "middle"; // 텍스트 수직 중앙 정렬
              context.fillText(
                tile.countdown.toString(), // 카운트다운 숫자
                x * TILE_SIZE + TILE_SIZE / 2, // 텍스트 X 위치 (타일 중앙)
                y * TILE_SIZE + TILE_SIZE / 2 // 텍스트 Y 위치 (타일 중앙)
              );
            } else {
              // 점멸 상태가 아니면 약간 어두운 색으로 그림 (폭탄이 활성 상태가 아님을 시각적으로 표현)
              context.fillStyle = "#800000"; // 어두운 빨강
              context.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            }
          }
        }
      }

      // 꼬순이 캐릭터 그리기
      context.drawImage(
        kosooniImage, // 꼬순이 이미지 객체
        position.x * TILE_SIZE, // 꼬순이 X 위치
        position.y * TILE_SIZE + offsetY, // 꼬순이 Y 위치 (낙하 애니메이션 오프셋 적용)
        TILE_SIZE, // 꼬순이 너비
        TILE_SIZE // 꼬순이 높이
      );
    };

    draw(); // 그리기 함수 호출
  }, [position, tileMap, offsetY, blinkingState, TILE_SIZE, MAP_HEIGHT, MAP_WIDTH, tileColors, kosooniImage]); // 의존성 배열에 모든 관련 상태 및 prop 추가

  // 키보드 이벤트 리스너 등록 및 해제
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]); // handleKeyDown 함수를 의존성 배열에 추가

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4">
      <h1 className="text-xl mb-4">꼬순이의 고구마 왕국 탐험기</h1>
      <canvas
        ref={canvasRef}
        width={TILE_SIZE * MAP_WIDTH}
        height={TILE_SIZE * MAP_HEIGHT}
        className="border-4 border-yellow-400 mb-4 rounded-lg shadow-lg" // 캔버스 스타일
      ></canvas>
      <div className="flex gap-4 text-black">
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

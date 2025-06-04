import { useEffect, useRef, useState, useCallback } from 'react';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [position, setPosition] = useState({ x: 5, y: 0 }); // 꼬순이의 논리적(절대) Y 위치
  const [offsetY, setOffsetY] = useState(0); // 낙하 애니메이션을 위한 Y축 오프셋
  const [scrollOffset, setScrollOffset] = useState(0); // 맵 스크롤을 위한 Y축 오프셋

  // 게임 진행 단계 관리: 'opening' -> 'story' -> 'game'
  const [gamePhase, setGamePhase] = useState<'opening' | 'story' | 'game'>('opening');

  // 이미지 로딩 상태를 관리하는 State 추가
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [loadedImageCount, setLoadedImageCount] = useState(0);
  const totalImagesToLoad = 4; // 꼬순이, 고구마, 폭탄, 타이틀 배너 이미지

  // 이미지 Ref들
  const kosooniImage = useRef(new Image());
  const sweetpotatoImage = useRef(new Image());
  const bombImage = useRef(new Image());
  const kosooniTitleBannerImage = useRef(new Image()); // 타이틀 배너 이미지 Ref 추가

  // 이미지 로딩 처리 useEffect
  useEffect(() => {
    const handleImageLoad = () => {
      setLoadedImageCount(prev => prev + 1);
    };

    // 각 이미지의 onload 이벤트 핸들러 등록
    kosooniImage.current.onload = handleImageLoad;
    sweetpotatoImage.current.onload = handleImageLoad;
    bombImage.current.onload = handleImageLoad;
    kosooniTitleBannerImage.current.onload = handleImageLoad; // 타이틀 배너 이미지 로드 핸들러

    // 이미지 src 설정 (public 폴더 경로)
    kosooniImage.current.src = "/kosooni_character_40x40.png";
    sweetpotatoImage.current.src = "/sweetpotato_better.png";
    bombImage.current.src = "/bomb.png";
    kosooniTitleBannerImage.current.src = "/kosooni_title_banner_eng_v2.png"; // 타이틀 배너 이미지 경로

    // 컴포넌트 언마운트 시 onload 핸들러 정리
    return () => {
      kosooniImage.current.onload = null;
      sweetpotatoImage.current.onload = null;
      bombImage.current.onload = null;
      kosooniTitleBannerImage.current.onload = null;
    };
  }, []); // 컴포넌트 마운트 시 한 번만 실행

  // 모든 이미지가 로드되었는지 확인
  useEffect(() => {
    if (loadedImageCount === totalImagesToLoad) {
      setImagesLoaded(true);
    }
  }, [loadedImageCount]);

  // 게임 상수 정의
  const TILE_SIZE = 40; // 타일 하나의 크기 (픽셀)
  const MAP_WIDTH = 10; // 맵의 가로 타일 개수
  const MAP_HEIGHT = 20; // 화면에 보이는 맵의 세로 타일 개수

  // 타일 종류별 색상 정의 (이미지를 사용할 타일은 여기서 제거)
  const tileColors: Record<string, string> = {
    dirt: "#8B4513", // 흙
    copper: "#B87333", // 구리
    silver: "#C0C0C0", // 은
    gold: "#FFD700", // 금
    diamond: "#00FFFF", // 다이아몬드
    // sweetpotato와 bomb는 이제 이미지로 그릴 것이므로 여기서 색상 정의는 사용하지 않음
  };

  const BOMB_INITIAL_COUNTDOWN = 3; // 폭탄 초기 카운트다운 시간 (초)
  const BOMB_EXPLOSION_RADIUS = 2; // 폭탄 폭발 시 제거되는 타일 범위 (2: 5x5 영역)
  const DRILL_ATTACK_POWER = 1; // 드릴의 기본 공격력

  // 캐릭터 체력 관련 상수
  const PLAYER_INITIAL_HEALTH = 3; // 꼬순이 초기 체력
  const PLAYER_MAX_HEALTH = 5;     // 꼬순이 최대 체력

  // 타일 타입 정의: 광물 타일은 체력을 가짐
  type MineralTileType = "dirt" | "copper" | "silver" | "gold" | "diamond" | "sweetpotato";
  interface MineralTileObject {
    type: MineralTileType;
    health: number;
  }
  interface BombTileObject {
    type: 'bomb';
    countdown: number | null; // 카운트다운이 시작되지 않았을 때는 null
  }
  // 맵에 들어갈 수 있는 타일의 최종 타입 (null 포함)
  type MapTile = MineralTileObject | BombTileObject | null;

  // 각 광물 타입별 기본 체력 정의
  const MINERAL_HEALTH: Record<MineralTileType, number> = {
    dirt: 1,
    copper: 2,
    silver: 3,
    gold: 4,
    diamond: 5,
    sweetpotato: 1, // 고구마는 특수 광물이지만, 현재는 쉽게 채굴 가능하도록 체력 1
  };

  // 새로운 타일 행을 생성하는 함수
  const generateNewRow = useCallback(() => {
    const tiles: MineralTileType[] = ["dirt", "copper", "silver", "gold", "diamond"]; // 고구마 제외
    const row: MapTile[] = [];
    for (let x = 0; x < MAP_WIDTH; x++) {
      let tile: MapTile = null;
      const random = Math.random();
      const BOMB_PROBABILITY = 0.05; // 폭탄 생성 확률 5%
      const SWEETPOTATO_PROBABILITY = 0.01; // 고구마 생성 확률 1% (낮춤)

      if (random < BOMB_PROBABILITY) {
        tile = { type: 'bomb', countdown: null } as BombTileObject; // 초기 카운트다운은 null (비활성)
      } else if (random < BOMB_PROBABILITY + SWEETPOTATO_PROBABILITY) {
        tile = { type: 'sweetpotato', health: MINERAL_HEALTH.sweetpotato } as MineralTileObject;
      } else {
        // 나머지 광물 타일 생성
        const selectedTileType = tiles[Math.floor(Math.random() * tiles.length)];
        tile = { type: selectedTileType, health: MINERAL_HEALTH[selectedTileType] } as MineralTileObject;
      }
      row.push(tile);
    }
    return row;
  }, [MAP_WIDTH]);

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
  const [currentHealth, setCurrentHealth] = useState(PLAYER_INITIAL_HEALTH); // 꼬순이 현재 체력 상태

  const explodeBomb = useCallback((bombX: number, bombY: number, currentMap: MapTile[][]) => {
    const newMap = currentMap.map(row => [...row]);
    // 폭발 범위 내의 모든 타일 제거
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

    // 캐릭터가 폭발 범위 내에 있는지 확인하고 체력 감소
    const playerDistX = Math.abs(position.x - bombX);
    const playerDistY = Math.abs(position.y - bombY);
    if (playerDistX <= BOMB_EXPLOSION_RADIUS && playerDistY <= BOMB_EXPLOSION_RADIUS) {
      setCurrentHealth(prev => Math.max(0, prev - 1)); // 체력 1 감소, 0 미만으로 내려가지 않음
    }

    return newMap;
  }, [BOMB_EXPLOSION_RADIUS, MAP_WIDTH, position.x, position.y]);

  // 점프 모션 틱을 위한 새로운 상태 및 상수 추가
  const JUMP_OFFSET_DURATION = 100; // 낙하 애니메이션 지속 시간 (ms)
  const GAME_TICK_INTERVAL = 500; // 게임 루프 실행 간격 (ms)

  // 캐릭터가 화면 중간에 고정되기 시작하는 Y 좌표 (타일 기준)
  const SCROLL_THRESHOLD_Y = Math.floor(MAP_HEIGHT / 3); // 예를 들어, 화면 높이의 1/3 지점

  useEffect(() => {
    if (!imagesLoaded || gamePhase !== 'game') return; // 이미지가 로드되지 않았거나 게임 단계가 아니면 게임 루프 시작 안 함

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
                // 폭탄 활성화 로직: 캐릭터가 3타일 이내에 있으면 카운트다운 시작
                const distance = Math.max(
                  Math.abs(x - position.x),
                  Math.abs(y - position.y)
                );

                if (tile.countdown === null && distance <= 3) {
                  currentMap[y][x] = { ...tile, countdown: BOMB_INITIAL_COUNTDOWN };
                } else if (typeof tile.countdown === 'number' && tile.countdown > 0) {
                  currentMap[y][x] = { ...tile, countdown: tile.countdown - 1 };
                } else if (typeof tile.countdown === 'number' && tile.countdown === 0) {
                  bombsToExplode.push({ x, y });
                }
              }
            }
          }

          bombsToExplode.forEach(({ x, y }) => {
            currentMap = explodeBomb(x, y, currentMap);
          });

          let newPlayerY = position.y;
          let didMoveDown = false; // 플레이어가 아래로 이동했는지 여부 플래그

          // 플레이어 바로 아래 타일 확인
          const tileBelowPlayer = currentMap[newPlayerY + 1]?.[position.x];

          if (newPlayerY + 1 < currentMap.length) { // 맵의 실제 높이(currentMap.length)를 기준으로 확인
            if (tileBelowPlayer === null) {
              // 아래 타일이 비어있으면 플레이어 낙하
              newPlayerY++;
              didMoveDown = true;
            } else if (typeof tileBelowPlayer === 'object' && tileBelowPlayer.type !== 'bomb') { // 광물 타일인 경우
              const mineralTile = tileBelowPlayer as MineralTileObject;
              if (mineralTile.health > DRILL_ATTACK_POWER) {
                // 체력 감소, 플레이어는 현재 위치 유지
                currentMap[newPlayerY + 1][position.x] = { ...mineralTile, health: mineralTile.health - DRILL_ATTACK_POWER };
              } else {
                // 체력이 0 이하가 되면 타일 파괴, 플레이어 낙하
                currentMap[newPlayerY + 1][position.x] = null;
                newPlayerY++;
                didMoveDown = true;
                // 고구마 타일 파괴 시 체력 회복
                if (mineralTile.type === 'sweetpotato') {
                  setCurrentHealth(prev => Math.min(prev + 1, PLAYER_MAX_HEALTH));
                }
              }
            } else if (typeof tileBelowPlayer === 'object' && tileBelowPlayer.type === 'bomb') {
              // 폭탄 위에서는 멈춤. 폭탄은 독립적으로 카운트다운 진행.
              // 플레이어 위치나 폭탄 상태에 변화 없음.
            }
          }

          // 무한 맵 로직: 플레이어가 맵의 끝에 가까워지면 새로운 행 추가
          const MAP_GENERATE_THRESHOLD = currentMap.length - MAP_HEIGHT;
          if (newPlayerY >= MAP_GENERATE_THRESHOLD) {
            currentMap.push(generateNewRow());
          }

          // 빈 공간으로 떨어지는 로직 (폭탄 폭발 후 빈 공간으로 떨어지는 경우 포함)
          // 현재 위치의 타일이 null이거나, 아래 타일이 null인데 플레이어가 이동하지 않았다면 강제 낙하 시도
          const currentTile = currentMap[newPlayerY]?.[position.x];
          if (currentTile === null && !didMoveDown) { // 현재 위치가 빈 공간인데 아래로 이동하지 않았다면
              // 강제로 한 칸 아래로 이동 시도
              if (newPlayerY + 1 < currentMap.length) {
                  newPlayerY++;
                  didMoveDown = true;
              }
          }


          if (didMoveDown) { // 플레이어가 실제로 아래로 이동했을 때만 위치 업데이트
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
  }, [position, explodeBomb, MAP_HEIGHT, JUMP_OFFSET_DURATION, GAME_TICK_INTERVAL, SCROLL_THRESHOLD_Y, generateNewRow, BOMB_INITIAL_COUNTDOWN, DRILL_ATTACK_POWER, PLAYER_MAX_HEALTH, imagesLoaded, gamePhase]); // gamePhase 의존성 추가

  useEffect(() => {
    if (gamePhase !== 'game') return; // 게임 단계가 아니면 점멸 효과 시작 안 함
    const blinkInterval = setInterval(() => {
      setBlinkingState(prev => !prev);
    }, 200);
    return () => clearInterval(blinkInterval);
  }, [gamePhase]); // gamePhase 의존성 추가

  // 플레이어 좌우 이동 및 타일 상호작용 (공격) 함수
  const movePlayer = useCallback((direction: "left" | "right") => {
    if (gamePhase !== 'game') return; // 게임 단계가 아니면 이동 안 함

    setTileMap((prevMap) => {
      const currentMap = prevMap.map(row => [...row]); // 맵 불변성 유지
      let { x, y } = position; // 현재 플레이어 위치

      let targetX = x;
      if (direction === "left") targetX = Math.max(0, x - 1);
      else if (direction === "right") targetX = Math.min(MAP_WIDTH - 1, x + 1);

      // 이동하려는 위치에 타일이 있는지 확인
      const tileAtTarget = currentMap[y]?.[targetX];

      let playerMoved = false;

      if (tileAtTarget !== undefined && tileAtTarget !== null) { // 타일이 존재하면
        if (typeof tileAtTarget === 'object' && tileAtTarget.type !== 'bomb') { // 광물 타일인 경우
          const mineralTile = tileAtTarget as MineralTileObject;
          if (mineralTile.health > DRILL_ATTACK_POWER) {
            // 체력 감소, 플레이어는 현재 위치 유지
            currentMap[y][targetX] = { ...mineralTile, health: mineralTile.health - DRILL_ATTACK_POWER };
          } else {
            // 체력이 0 이하가 되면 타일 파괴, 플레이어 이동
            currentMap[y][targetX] = null;
            playerMoved = true;
            // 고구마 타일 파괴 시 체력 회복
            if (mineralTile.type === 'sweetpotato') {
              setCurrentHealth(prev => Math.min(prev + 1, PLAYER_MAX_HEALTH));
            }
          }
        } else if (typeof tileAtTarget === 'object' && tileAtTarget.type === 'bomb') { // 폭탄 타일인 경우
          // 폭탄 타일인 경우, 비활성 상태면 활성화
          if (tileAtTarget.countdown === null) {
            currentMap[y][targetX] = { ...tileAtTarget, countdown: BOMB_INITIAL_COUNTDOWN };
          }
          // 활성 상태면 그대로 둠 (터치해도 바로 터지지 않음)
          // 폭탄 타일 위로 이동하지 않음
        }
      } else { // 목표 위치가 비어있는 공간 (null)인 경우
        playerMoved = true;
      }

      if (playerMoved) {
        setPosition({ x: targetX, y: y });
      }

      return currentMap; // 업데이트된 맵 반환
    });
  }, [position, MAP_WIDTH, BOMB_INITIAL_COUNTDOWN, DRILL_ATTACK_POWER, PLAYER_MAX_HEALTH, gamePhase]); // gamePhase 의존성 추가

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (gamePhase !== 'game') return; // 게임 단계가 아니면 키보드 입력 무시
    if (e.key === "ArrowLeft") movePlayer("left");
    else if (e.key === "ArrowRight") movePlayer("right");
  }, [movePlayer, gamePhase]); // gamePhase 의존성 추가

  // Canvas 그리기 로직
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    // 이미지가 로드되지 않았거나 게임 단계가 아니면 로딩 메시지 또는 빈 화면 표시
    if (!imagesLoaded) {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = "#000"; // 검은색 배경
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = "#FFF"; // 흰색 텍스트
      context.font = "20px Arial";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText("로딩 중...", canvas.width / 2, canvas.height / 2);
      return;
    }

    // 게임 단계가 아니면 캔버스 내용 지우기
    if (gamePhase !== 'game') {
      context.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    // 반응형 캔버스 크기 조정 로직 개선
    // 화면 너비에 꽉 차도록 100vw를 기준으로 계산
    const availableWidth = window.innerWidth;
    // 맵의 가로세로 비율
    const mapAspectRatio = (TILE_SIZE * MAP_WIDTH) / (TILE_SIZE * MAP_HEIGHT); 

    let newCanvasWidth = availableWidth;
    let newCanvasHeight = availableWidth / mapAspectRatio;

    // 캔버스 높이가 화면 높이를 초과하지 않도록 조정
    // 게임 화면일 때는 상단 여백을 없애고, 스토리/오프닝 화면일 때는 기존 여백을 유지
    const maxCanvasHeight = window.innerHeight - (gamePhase === 'game' ? 0 : window.innerHeight * 0.1); 
    if (newCanvasHeight > maxCanvasHeight) {
      newCanvasHeight = maxCanvasHeight;
      newCanvasWidth = newCanvasHeight * mapAspectRatio;
    }

    // 캔버스 크기를 타일 크기의 배수로 유지하여 픽셀 깨짐 방지
    newCanvasWidth = Math.floor(newCanvasWidth / TILE_SIZE) * TILE_SIZE;
    newCanvasHeight = Math.floor(newCanvasHeight / TILE_SIZE) * TILE_SIZE;

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
      const startDrawY = Math.floor(scrollOffset / TILE_SIZE);
      for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
          const actualMapY = startDrawY + y;
          const tile = tileMap[actualMapY]?.[x];

          if (tile === null || tile === undefined) {
            continue;
          }

          // 광물 타일 그리기
          if (typeof tile === 'object' && tile.type !== 'bomb') {
            const mineralTile = tile as MineralTileObject;
            // 고구마 타일은 이미지로 그리기
            if (mineralTile.type === 'sweetpotato') {
              context.drawImage(sweetpotatoImage.current, x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            } else {
              // 나머지 광물 타일은 색상으로 그리기
              context.fillStyle = tileColors[mineralTile.type] || "gray";
              context.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            }

            // 체력 숫자 그리기
            context.fillStyle = "white";
            context.font = `${TILE_SIZE * 0.4}px Arial`; // 더 작은 폰트
            context.textAlign = "center";
            context.textBaseline = "top"; // 타일 상단에 위치
            context.fillText(
              mineralTile.health.toString(),
              x * TILE_SIZE + TILE_SIZE / 2,
              y * TILE_SIZE + TILE_SIZE * 0.1 // 상단에서 약간 오프셋
            );
          }
          // 폭탄 타일 그리기
          else if (typeof tile === 'object' && tile.type === 'bomb') {
            // 폭탄이 비활성 상태일 때는 어둡게, 활성 상태일 때만 점멸 및 카운트다운 표시
            if (tile.countdown === null) {
              // 비활성 폭탄: 어둡게 그리기
              context.globalAlpha = 0.5; // 투명도 조절
              context.drawImage(bombImage.current, x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
              context.globalAlpha = 1.0; // 투명도 원복
            } else if (tile.countdown <= 1 || blinkingState) {
              // 활성 폭탄 (점멸): 이미지 그리기
              context.drawImage(bombImage.current, x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            } else {
              // 활성 폭탄이지만 점멸 상태가 아닐 때 (어둡게)
              context.globalAlpha = 0.5; // 투명도 조절
              context.drawImage(bombImage.current, x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
              context.globalAlpha = 1.0; // 투명도 원복
            }

            // 카운트다운 숫자 그리기 (활성 상태일 때만)
            if (typeof tile.countdown === 'number') {
              context.fillStyle = "white"; // 텍스트 색상
              context.font = `${TILE_SIZE * 0.6}px Arial`; // 폰트 크기
              context.textAlign = "center"; // 텍스트 중앙 정렬
              context.textBaseline = "middle"; // 텍스트 수직 중앙 정렬
              context.fillText(
                tile.countdown.toString(),
                x * TILE_SIZE + TILE_SIZE / 2,
                y * TILE_SIZE + TILE_SIZE / 2
              );
            }
          }
        }
      }

      // 꼬순이 캐릭터 그리기 (스크롤 오프셋에 따라 화면 Y 위치 고정)
      const kosooniDisplayY = position.y >= SCROLL_THRESHOLD_Y
        ? SCROLL_THRESHOLD_Y * TILE_SIZE
        : position.y * TILE_SIZE;

      context.drawImage(
        kosooniImage.current,
        position.x * TILE_SIZE,
        kosooniDisplayY + offsetY,
        TILE_SIZE,
        TILE_SIZE
      );

      context.restore(); // 저장된 변환 상태 복원 (스케일 초기화)

      // 체력 하트 그리기 (캔버스 스케일과 별개로 고정 위치에)
      context.save();
      // 스케일이 적용된 상태에서 하트가 그려지지 않도록 스케일 복원
      context.scale(1 / scale, 1 / scale); // 스케일 되돌리기

      const heartSize = 25 * 0.7; // 하트 크기 (70%로 줄임)
      const heartSpacing = 5; // 하트 간 간격
      const startX = 10; // 좌상단 시작 X 위치
      const startY = 10; // 좌상단 시작 Y 위치

      for (let i = 0; i < PLAYER_MAX_HEALTH; i++) {
        const heartX = (startX + i * (heartSize + heartSpacing)) * scale; // 스케일 적용된 좌표
        const heartY = startY * scale; // 스케일 적용된 좌표

        if (i < currentHealth) {
          // 채워진 하트 (빨간색)
          context.fillStyle = "#FF0000"; // 빨간색 하트
          context.beginPath();
          context.moveTo(heartX + heartSize * 0.5, heartY + heartSize * 0.3);
          context.bezierCurveTo(heartX + heartSize * 0.1, heartY, heartX, heartY + heartSize * 0.6, heartX + heartSize * 0.5, heartY + heartSize);
          context.bezierCurveTo(heartX + heartSize, heartY + heartSize * 0.6, heartX + heartSize * 0.9, heartY, heartX + heartSize * 0.5, heartY + heartSize * 0.3);
          context.closePath();
          context.fill();
        } else {
          // 비어있는 하트 (회색 테두리)
          context.strokeStyle = "#888888"; // 회색 테두리
          context.lineWidth = 2;
          context.beginPath();
          context.moveTo(heartX + heartSize * 0.5, heartY + heartSize * 0.3);
          context.bezierCurveTo(heartX + heartSize * 0.1, heartY, heartX, heartY + heartSize * 0.6, heartX + heartSize * 0.5, heartY + heartSize);
          context.bezierCurveTo(heartX + heartSize, heartY + heartSize * 0.6, heartX + heartSize * 0.9, heartY, heartX + heartSize * 0.5, heartY + heartSize * 0.3);
          context.closePath();
          context.stroke();
        }
      }
      context.restore(); // 저장된 변환 상태 복원
    };

    draw();
  }, [position, tileMap, offsetY, blinkingState, TILE_SIZE, MAP_HEIGHT, MAP_WIDTH, tileColors, kosooniImage, sweetpotatoImage, bombImage, scrollOffset, SCROLL_THRESHOLD_Y, currentHealth, PLAYER_MAX_HEALTH, imagesLoaded, gamePhase]); // gamePhase 의존성 추가

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        // 반응형 캔버스 크기 조정 로직 개선 (좌우폭 최적화)
        const availableWidth = window.innerWidth; // 화면 전체 너비 사용
        // 게임 화면일 때는 상단 여백을 없애고, 스토리/오프닝 화면일 때는 기존 여백을 유지
        const availableHeight = window.innerHeight - (gamePhase === 'game' ? 0 : window.innerHeight * 0.1); 

        const mapAspectRatio = (TILE_SIZE * MAP_WIDTH) / (TILE_SIZE * MAP_HEIGHT); 

        let newCanvasWidth = availableWidth;
        let newCanvasHeight = availableWidth / mapAspectRatio;

        if (newCanvasHeight > availableHeight) {
          newCanvasHeight = availableHeight;
          newCanvasWidth = newCanvasHeight * mapAspectRatio;
        }
        
        // 캔버스 크기를 타일 크기의 배수로 유지하여 픽셀 깨짐 방지
        newCanvasWidth = Math.floor(newCanvasWidth / TILE_SIZE) * TILE_SIZE;
        newCanvasHeight = Math.floor(newCanvasHeight / TILE_SIZE) * TILE_SIZE;

        // 최종 캔버스 크기는 맵의 실제 크기를 넘지 않도록 제한 (선택 사항, 필요 시 활성화)
        // newCanvasWidth = Math.min(newCanvasWidth, TILE_SIZE * MAP_WIDTH);
        // newCanvasHeight = Math.min(newCanvasHeight, TILE_SIZE * MAP_HEIGHT);

        canvas.width = newCanvasWidth;
        canvas.height = newCanvasHeight;
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleResize);
    };
  }, [handleKeyDown, TILE_SIZE, MAP_WIDTH, MAP_HEIGHT, gamePhase]); // gamePhase 의존성 추가

  // 모바일 터치 이벤트 핸들러
  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (gamePhase !== 'game') return; // 게임 단계가 아니면 터치 이동 무시
    // 이 핸들러는 전체 화면 터치 영역을 담당하므로, 버튼 클릭과 겹치지 않도록 주의
    // 버튼 클릭은 별도의 onClick 핸들러로 처리됨
    e.preventDefault(); // 기본 스크롤 방지
  }, [gamePhase]); // gamePhase 의존성 추가

  // 오프닝 화면 클릭 핸들러
  const handleOpeningClick = useCallback(() => {
    if (imagesLoaded) { // 이미지가 모두 로드된 후에만 전환
      setGamePhase('story');
    }
  }, [imagesLoaded]);

  // 스토리 화면 완료 핸들러
  const handleStoryComplete = useCallback(() => {
    setGamePhase('game');
  }, []);

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen bg-black text-white relative overflow-hidden" // p-4 제거
      // 게임 단계일 때만 터치 이벤트 활성화 (전체 화면 터치 영역)
      onTouchStart={gamePhase === 'game' ? handleTouchMove : undefined}
      onTouchMove={gamePhase === 'game' ? handleTouchMove : undefined}
    >
      {/* 오프닝 화면 */}
      {gamePhase === 'opening' && (
        <div className="flex flex-col items-center justify-center w-full h-full cursor-pointer" onClick={handleOpeningClick}>
          {!imagesLoaded ? (
            <p className="text-xl">로딩 중...</p>
          ) : (
            <img
              src={kosooniTitleBannerImage.current.src} // Ref의 src 사용
              alt="꼬순이의 대모험"
              className="max-w-full h-auto rounded-lg shadow-lg"
              style={{ maxWidth: '80vw', maxHeight: '80vh' }} // 반응형 크기 조절
            />
          )}
        </div>
      )}

      {/* 스토리 화면 */}
      {gamePhase === 'story' && (
        <div className="flex flex-col items-center justify-center text-center p-8 bg-gray-800 rounded-lg shadow-xl max-w-lg mx-auto">
          <h2 className="text-3xl font-bold mb-6 text-yellow-400">꼬순이의 고구마 왕국 탐험기</h2>
          <p className="text-lg mb-4 leading-relaxed">
            산책을 나간 꼬순이는
          </p>
          <p className="text-lg mb-4 leading-relaxed">
            우연히 노견들 사이의 수상한 대화를 듣게 돼.
          </p>
          <p className="text-lg mb-4 leading-relaxed">
            그들은 오래전 사라졌다는
          </p>
          <p className="text-lg mb-4 leading-relaxed">
            ‘고구마 왕국’과
          </p>
          <p className="text-lg mb-4 leading-relaxed">
            그곳의 욕심 많은 황제에 대한 이야기를 나누고 있었어.
          </p>
          <p className="text-lg mb-4 leading-relaxed">
            황제는 고구마를 독차지하기 위해
          </p>
          <p className="text-lg mb-4 leading-relaxed">
            왕국 전체를 지하로 워프시켰다는 전설이 있었지.
          </p>
          <p className="text-lg mb-4 leading-relaxed">
            이야기를 들은 꼬순이는
          </p>
          <p className="text-lg mb-4 leading-relaxed">
            "내가 그 왕국을 찾아낼 거야!"
          </p>
          <p className="text-lg mb-4 leading-relaxed">
            라고 결심하고,
          </p>
          <p className="text-lg mb-8 leading-relaxed">
            아끼는 삑삑이 공으로 맞바꾼 드릴을 입에 물고
            전설의 왕국을 향해 지하로 내려가기 시작해!
          </p>
          <button
            className="bg-yellow-500 text-black px-8 py-3 rounded-lg shadow-md hover:bg-yellow-600 transition-colors text-xl font-bold"
            onClick={handleStoryComplete}
          >
            모험 시작!
          </button>
        </div>
      )}

      {/* 게임 화면 */}
      {gamePhase === 'game' && (
        <div className="relative w-full h-full flex items-center justify-center"> {/* 캔버스 및 버튼을 감싸는 컨테이너 */}
          <canvas
            ref={canvasRef}
            className="border-4 border-yellow-400 rounded-lg shadow-lg" // mb-4 제거
          ></canvas>

          {/* 좌우 화살표 아이콘 (캔버스 위에 오버레이) */}
          <div className="absolute inset-0 flex justify-between items-center w-full h-full pointer-events-none"> {/* pointer-events-none 추가 */}
            <button
              className="bg-gray-700 bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-75 transition-opacity focus:outline-none pointer-events-auto" // pointer-events-auto 추가
              onClick={() => movePlayer("left")}
              aria-label="Move Left"
              style={{ marginLeft: '10px' }} // 캔버스 가장자리에서 약간 안쪽으로
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              className="bg-gray-700 bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-75 transition-opacity focus:outline-none pointer-events-auto" // pointer-events-auto 추가
              onClick={() => movePlayer("right")}
              aria-label="Move Right"
              style={{ marginRight: '10px' }} // 캔버스 가장자리에서 약간 안쪽으로
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

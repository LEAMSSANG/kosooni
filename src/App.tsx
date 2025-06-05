import { useEffect, useRef, useState, useCallback } from 'react';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [position, setPosition] = useState({ x: 5, y: 0 }); // 꼬순이의 논리적(절대) Y 위치
  const [offsetY, setOffsetY] = useState(0); // 낙하 애니메이션을 위한 Y축 오프셋
  const [scrollOffset, setScrollOffset] = useState(0); // 맵 스크롤을 위한 Y축 오프셋
  const [onLava, setOnLava] = useState(false); // 플레이어가 용암 위에 있는지 추적하는 상태 (피해 한 번만 적용)

  // 게임 진행 단계 관리: 'opening' -> 'story' -> 'game'
  const [gamePhase, setGamePhase] = useState<'opening' | 'story' | 'game'>('opening');

  // 이미지 로딩 상태를 관리하는 State 추가
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [loadedImageCount, setLoadedImageCount] = useState(0);
  const totalImagesToLoad = 10; // 기존 5개 + 새로운 5개(dirt, copper, silver, gold, diamond) = 10

  // 이미지 Ref들
  const kosooniImage = useRef(new Image());
  const sweetpotatoImage = useRef(new Image());
  const bombImage = useRef(new Image());
  const kosooniTitleBannerImage = useRef(new Image()); // 타이틀 배너 이미지 Ref 추가
  const lavaImage = useRef(new Image()); // 용암 이미지 Ref 추가
  // 새로운 광물 이미지 Ref들 추가
  const dirtImage = useRef(new Image());
  const copperImage = useRef(new Image());
  const silverImage = useRef(new Image());
  const goldImage = useRef(new Image());
  const diamondImage = useRef(new Image());

  // 꼬순이 레벨 시스템 상태
  const [playerLevel, setPlayerLevel] = useState(1);
  const [currentXP, setCurrentXP] = useState(0);
  const XP_BASE_REQUIRED = 10; // 레벨 1 -> 2에 필요한 기본 경험치
  const XP_MULTIPLIER = 2; // 다음 레벨에 필요한 경험치 배율
  const ATTACK_POWER_INCREASE_PER_LEVEL = 1; // 레벨업당 공격력 증가량

  // 레벨업 메시지 및 효과 관련 상태
  const [levelUpMessage, setLevelUpMessage] = useState('');
  const [isLevelingUp, setIsLevelingUp] = useState(false);


  // 다음 레벨에 필요한 경험치를 계산하는 함수
  const getXpNeededForLevel = useCallback((level: number) => {
      // 레벨 1 -> 2: 10, 레벨 2 -> 3: 20, 레벨 3 -> 4: 40 ...
      return XP_BASE_REQUIRED * (XP_MULTIPLIER ** (level - 1));
  }, []);

  const [xpToNextLevel, setXpToNextLevel] = useState(getXpNeededForLevel(playerLevel)); // 초기 레벨에 필요한 경험치 (레벨 1 -> 2)

  // 현재 드릴 공격력 (레벨에 따라 증가)
  const DRILL_ATTACK_POWER = 1 + (playerLevel - 1) * ATTACK_POWER_INCREASE_PER_LEVEL;


  // 이미지 로딩 처리 useEffect
  useEffect(() => {
    const handleImageLoad = () => {
      setLoadedImageCount(prev => prev + 1);
    };

    // 이미지 로딩 실패 시 콘솔에 로그 출력
    const handleImageError = (imageName: string, src: string) => {
      console.error(`Failed to load image: "${imageName}" from path: "${src}". Please ensure the file exists in your public folder and the filename (including case) is correct.`, { isTrusted: true });
    };

    // 각 이미지의 onload 및 onerror 이벤트 핸들러 등록
    kosooniImage.current.onload = handleImageLoad;
    kosooniImage.current.onerror = () => handleImageError("kosooni_character_40x40.png", kosooniImage.current.src);

    sweetpotatoImage.current.onload = handleImageLoad;
    sweetpotatoImage.current.onerror = () => handleImageError("sweetpotato_better.png", sweetpotatoImage.current.src);

    bombImage.current.onload = handleImageLoad;
    bombImage.current.onerror = () => handleImageError("bomb.png", bombImage.current.src);

    kosooniTitleBannerImage.current.onload = handleImageLoad;
    kosooniTitleBannerImage.current.onerror = () => handleImageError("kosooni_title_banner_eng_v2.png", kosooniTitleBannerImage.current.src);

    lavaImage.current.onload = handleImageLoad;
    lavaImage.current.onerror = () => handleImageError("lava.png", lavaImage.current.src);

    // 새로운 광물 이미지 로드 핸들러 등록
    dirtImage.current.onload = handleImageLoad;
    dirtImage.current.onerror = () => handleImageError("dirt.png", dirtImage.current.src);
    copperImage.current.onload = handleImageLoad;
    copperImage.current.onerror = () => handleImageError("copper.png", copperImage.current.src);
    silverImage.current.onload = handleImageLoad;
    silverImage.current.onerror = () => handleImageError("silver.png", silverImage.current.src);
    goldImage.current.onload = handleImageLoad;
    goldImage.current.onerror = () => handleImageError("gold.png", goldImage.current.src);
    diamondImage.current.onload = handleImageLoad;
    diamondImage.current.onerror = () => handleImageError("diamond.png", diamondImage.current.src);

    // 이미지 src 설정 (public 폴더 경로)
    kosooniImage.current.src = "/kosooni_character_40x40.png";
    console.log("Attempting to load:", kosooniImage.current.src);
    sweetpotatoImage.current.src = "/sweetpotato_better.png";
    console.log("Attempting to load:", sweetpotatoImage.current.src);
    bombImage.current.src = "/bomb.png";
    console.log("Attempting to load:", bombImage.current.src);
    kosooniTitleBannerImage.current.src = "/kosooni_title_banner_eng_v2.png";
    console.log("Attempting to load:", kosooniTitleBannerImage.current.src);
    lavaImage.current.src = "/lava.png"; // 용암 이미지 경로
    console.log("Attempting to load:", lavaImage.current.src);
    // 새로운 광물 이미지 src 설정
    dirtImage.current.src = "/dirt.png";
    console.log("Attempting to load:", dirtImage.current.src);
    copperImage.current.src = "/copper.png";
    console.log("Attempting to load:", copperImage.current.src);
    silverImage.current.src = "/silver.png";
    console.log("Attempting to load:", silverImage.current.src);
    goldImage.current.src = "/gold.png";
    console.log("Attempting to load:", goldImage.current.src);
    diamondImage.current.src = "/diamond.png";
    console.log("Attempting to load:", diamondImage.current.src);


    // 컴포넌트 언마운트 시 onload/onerror 핸들러 정리 (메모리 누수 방지)
    return () => {
      kosooniImage.current.onload = null; kosooniImage.current.onerror = null;
      sweetpotatoImage.current.onload = null; sweetpotatoImage.current.onerror = null;
      bombImage.current.onload = null; bombImage.current.onerror = null;
      kosooniTitleBannerImage.current.onload = null; kosooniTitleBannerImage.current.onerror = null;
      lavaImage.current.onload = null; lavaImage.current.onerror = null;
      dirtImage.current.onload = null; dirtImage.current.onerror = null;
      copperImage.current.onload = null; copperImage.current.onerror = null;
      silverImage.current.onload = null; silverImage.current.onerror = null;
      goldImage.current.onload = null; goldImage.current.onerror = null;
      diamondImage.current.onload = null; diamondImage.current.onerror = null;
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
  const MAP_WIDTH = 15; // 맵의 가로 타일 개수 (10 -> 15로 변경: 좌우 빈 공간 감소 목적)
  const MAP_HEIGHT = 20; // 화면에 보이는 맵의 세로 타일 개수

  // 타일 종류별 색상 정의 (이제는 이미지를 사용할 것이므로, 사용하지 않는 색상 정의는 삭제)
  const tileColors: Record<string, string> = {
    // dirt, copper, silver, gold, diamond는 이제 이미지로 그릴 것이므로 여기서 색상 정의는 사용하지 않음
    // 필요하다면 다른 타일 색상을 정의할 수 있음
  };

  const BOMB_INITIAL_COUNTDOWN = 3; // 폭탄 초기 카운트다운 시간 (초)
  const BOMB_EXPLOSION_RADIUS = 2; // 폭탄 폭발 시 제거되는 타일 범위 (2: 5x5 영역)
  // DRILL_ATTACK_POWER는 playerLevel에 따라 동적으로 계산됩니다.

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
  interface LavaTileObject { // 용암 타일 타입 추가
    type: 'lava';
  }
  // 맵에 들어갈 수 있는 타일의 최종 타입 (null 포함)
  type MapTile = MineralTileObject | BombTileObject | LavaTileObject | null;

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

  const explodeBomb = useCallback((bombX: number, bombY: number, currentMap: MapTile[][], currentPlayerX: number, currentPlayerY: number) => {
    const newMap = currentMap.map(row => [...row]);
    let pushedPlayerX = currentPlayerX;

    // 폭발 범위 내의 모든 타일 제거 -> 용암으로 변경
    for (let dy = -BOMB_EXPLOSION_RADIUS; dy <= BOMB_EXPLOSION_RADIUS; dy++) {
      for (let dx = -BOMB_EXPLOSION_RADIUS; dx <= BOMB_EXPLOSION_RADIUS; dx++) {
        const targetY = bombY + dy;
        const targetX = bombX + dx;

        // 맵 범위 내에 있는 타일만 변경
        if (targetY >= 0 && targetY < newMap.length && targetX >= 0 && targetX < MAP_WIDTH) {
          newMap[targetY][targetX] = { type: 'lava' } as LavaTileObject; // 용암 타일로 변경
        }
      }
    }

    // 캐릭터가 폭발 범위 내에 있는지 확인하고 체력 감소 및 밀려남 처리
    const playerDistX = Math.abs(currentPlayerX - bombX);
    const playerDistY = Math.abs(currentPlayerY - bombY);

    if (playerDistX <= BOMB_EXPLOSION_RADIUS && playerDistY <= BOMB_EXPLOSION_RADIUS) {
      // 체력 1 감소
      setCurrentHealth(prev => Math.max(0, prev - 1));

      // 밀려나는 방향 결정 (폭탄의 중앙에서 멀어지는 방향)
      let pushDir = 0;
      if (currentPlayerX < bombX) { // 폭탄이 캐릭터의 오른쪽에 있음
        pushDir = -1; // 캐릭터를 왼쪽으로 밀기
      } else if (currentPlayerX > bombX) { // 폭탄이 캐릭터의 왼쪽에 있음
        pushDir = 1; // 캐릭터를 오른쪽으로 밀기
      } else { // 같은 X축에 있을 경우 (정확히 위/아래)
        // 임의로 오른쪽으로 밀거나, 양옆 중 빈 공간이 있는 곳으로 밀기
        if (currentPlayerX + 1 < MAP_WIDTH && newMap[currentPlayerY]?.[currentPlayerX + 1] === null) {
          pushDir = 1;
        } else if (currentPlayerX - 1 >= 0 && newMap[currentPlayerY]?.[currentPlayerX - 1] === null) {
          pushDir = -1;
        }
      }

      const potentialNewX = currentPlayerX + pushDir;
      // 밀려날 위치가 맵 범위 내에 있고 비어있거나 (새로운 용암 타일 포함)
      // 용암 타일 위로 밀려나는 것은 허용
      if (pushDir !== 0 && potentialNewX >= 0 && potentialNewX < MAP_WIDTH) {
          const tileAtPotentialNewX = newMap[currentPlayerY]?.[potentialNewX];
          if (tileAtPotentialNewX === null || (typeof tileAtPotentialNewX === 'object' && tileAtPotentialNewX.type === 'lava')) {
            pushedPlayerX = potentialNewX;
          }
      }
      // 밀려날 위치가 막혀있으면 현재 X 위치 유지. (이후 낙하 로직이 처리)
    }

    return { newMap, pushedPlayerX }; // 업데이트된 맵과 밀려난 X 위치 반환
  }, [BOMB_EXPLOSION_RADIUS, MAP_WIDTH, setCurrentHealth]);

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
          let newPlayerX = position.x; // 현재 꼬순이 X 위치에서 시작
          let newPlayerY = position.y; // 현재 꼬순이 Y 위치에서 시작

          // Debugging: Log initial player position and surrounding tiles
          console.log(`--- Game Tick Start ---`);
          console.log(`Initial Player Position: (${position.x}, ${position.y})`);
          console.log(`Tile at Player Pos:`, currentMap[position.y]?.[position.x]);
          if (position.y + 1 < currentMap.length) {
              console.log(`Tile below Player:`, currentMap[position.y + 1]?.[position.x]);
          }


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

          // 폭탄 폭발 처리 및 플레이어 밀림 로직
          bombsToExplode.forEach(({ x: bombX, y: bombY }) => {
            const { newMap: mapAfterExplosion, pushedPlayerX: tempPushedX } = explodeBomb(bombX, bombY, currentMap, newPlayerX, newPlayerY);
            currentMap = mapAfterExplosion; // 맵 업데이트
            newPlayerX = tempPushedX; // 폭탄에 의해 밀려난 새로운 X 위치 적용
            console.log(`Bomb exploded at (${bombX}, ${bombY}). Player pushed to X: ${newPlayerX}`);
          });

          // 낙하 로직:
          // 현재 플레이어 Y 위치에서 시작하여 최종 Y 위치 계산
          let finalPlayerY = newPlayerY; 
          let hasFallenThisTick = false; // 플레이어가 이번 틱에 실제로 낙하했는지 여부

          // Step 1: 플레이어가 현재 서 있는 타일이 null이거나 용암인 경우
          // 또는 바로 아래 타일이 null인 경우, 바닥에 닿을 때까지 연속 낙하
          while (finalPlayerY + 1 < currentMap.length) {
              const tileBelowCheck = currentMap[finalPlayerY + 1]?.[newPlayerX];
              console.log(`Fall Check loop: CurrentY: ${finalPlayerY}, Tile below:`, tileBelowCheck);

              if (tileBelowCheck === null || (typeof tileBelowCheck === 'object' && tileBelowCheck.type === 'lava')) {
                  finalPlayerY++; // Fall one more step
                  hasFallenThisTick = true;
              } else {
                  // 빈 공간이나 용암이 아닌 타일을 만났으니 연속 낙하 중단
                  break; 
              }
          }

          // Step 2: 연속 낙하 후 최종적으로 멈춘 위치에서, 바로 아래 타일과 상호작용
          const tileDirectlyBelowFinalY = currentMap[finalPlayerY + 1]?.[newPlayerX];
          console.log(`Fall Check final: Player finalY: ${finalPlayerY}, Tile directly below:`, tileDirectlyBelowFinalY);

          if (finalPlayerY + 1 < currentMap.length) { // 맵의 실제 높이(currentMap.length)를 기준으로 확인
            if (tileDirectlyBelowFinalY === null) {
              // 위 while 루프에서 처리되었어야 하지만, 만약의 경우를 위한 한 칸 추가 낙하
              finalPlayerY++;
              hasFallenThisTick = true;
            } else if (typeof tileDirectlyBelowFinalY === 'object' && tileDirectlyBelowFinalY.type !== 'bomb' && tileDirectlyBelowFinalY.type !== 'lava') { // 광물 타일인 경우
              const mineralTile = tileDirectlyBelowFinalY as MineralTileObject; 
              console.log(`Hitting mineral at (${newPlayerX}, ${finalPlayerY + 1}) with health: ${mineralTile.health}`);
              if (mineralTile.health > DRILL_ATTACK_POWER) {
                // 체력 감소, 플레이어는 현재 위치 유지 (낙하하지 않음)
                currentMap[finalPlayerY + 1][newPlayerX] = { ...mineralTile, health: mineralTile.health - DRILL_ATTACK_POWER };
                // hasFallenThisTick은 변하지 않음 (낙하하지 않았으므로)
              } else {
                // 체력이 0 이하가 되면 타일 파괴, 플레이어 낙하
                currentMap[finalPlayerY + 1][newPlayerX] = null;
                finalPlayerY++; // 파괴된 빈 공간으로 낙하
                hasFallenThisTick = true; // 낙하 발생
                // 고구마 타일 파괴 시 체력 회복
                if (mineralTile.type === 'sweetpotato') {
                  setCurrentHealth(prev => Math.min(prev + 1, PLAYER_MAX_HEALTH));
                }
                // 타일 파괴 시 경험치 획득 (타일의 원래 체력만큼)
                setCurrentXP(prev => prev + MINERAL_HEALTH[mineralTile.type]);
              }
            } else if (typeof tileDirectlyBelowFinalY === 'object' && tileDirectlyBelowFinalY.type === 'bomb') {
              // 폭탄 위에서는 멈춤. 폭탄은 독립적으로 카운트다운 진행.
              console.log(`Landed on bomb at (${newPlayerX}, ${finalPlayerY + 1})`);
            } else if (typeof tileDirectlyBelowFinalY === 'object' && tileDirectlyBelowFinalY.type === 'lava') {
              // 용암 위에서는 멈춤. (데미지는 아래 별도 로직에서 처리)
              console.log(`Landed on lava at (${newPlayerX}, ${finalPlayerY + 1})`);
            }
          }
          // 만약 맵의 가장 아래에 도달했거나, 아래에 타일이 없으면 더 이상 낙하하지 않음.

          // 무한 맵 로직: 플레이어가 맵의 끝에 가까워지면 새로운 행 추가
          const MAP_GENERATE_THRESHOLD = currentMap.length - MAP_HEIGHT;
          if (finalPlayerY >= MAP_GENERATE_THRESHOLD) {
            currentMap.push(generateNewRow());
          }

          // 플레이어 위치가 변경되었거나, 이번 틱에 낙하가 발생했을 경우에만 상태 업데이트
          if (newPlayerX !== position.x || finalPlayerY !== position.y || hasFallenThisTick) {
            setPosition({ x: newPlayerX, y: finalPlayerY });
            console.log(`New Player Position after tick update: (${newPlayerX}, ${finalPlayerY})`);

            // 스크롤 오프셋 계산
            if (finalPlayerY >= SCROLL_THRESHOLD_Y) {
              setScrollOffset((finalPlayerY - SCROLL_THRESHOLD_Y) * TILE_SIZE);
            } else {
              setScrollOffset(0);
            }
            
            // 용암 타일 진입 시 피해 적용 (한 번만)
            const tileAtNewPosition = currentMap[finalPlayerY]?.[newPlayerX];
            if (tileAtNewPosition && typeof tileAtNewPosition === 'object' && tileAtNewPosition.type === 'lava') {
                if (!onLava) { // 용암에 새로 진입했을 때만
                    setCurrentHealth(prev => Math.max(0, prev - 1));
                    setOnLava(true);
                    console.log("Player entered lava, health -1. onLava set to true.");
                }
            } else { // 용암 타일이 아니면 onLava 상태 초기화
                if (onLava) { // 용암에서 벗어났을 때만 초기화
                    setOnLava(false);
                    console.log("Player left lava, onLava set to false.");
                }
            }

          } else { // 플레이어가 움직이지 않았을 경우 (낙하도, 좌우 이동도 없음)
            // 용암 타일에서 벗어났는지 확인하여 onLava 상태 초기화
            const tileAtCurrentPos = currentMap[position.y]?.[position.x];
            if (!(tileAtCurrentPos && typeof tileAtCurrentPos === 'object' && tileAtCurrentPos.type === 'lava')) {
                if (onLava) {
                    setOnLava(false);
                    console.log("Player stayed, but not on lava anymore. onLava set to false.");
                }
            }
          }

          console.log(`--- Game Tick End ---`);
          return currentMap;
        });
      }, JUMP_OFFSET_DURATION);
    }, GAME_TICK_INTERVAL);

    return () => clearInterval(gameInterval);
  }, [position, explodeBomb, MAP_HEIGHT, JUMP_OFFSET_DURATION, GAME_TICK_INTERVAL, SCROLL_THRESHOLD_Y, generateNewRow, BOMB_INITIAL_COUNTDOWN, DRILL_ATTACK_POWER, PLAYER_MAX_HEALTH, imagesLoaded, gamePhase, onLava, MINERAL_HEALTH]); // MINERAL_HEALTH 의존성 추가

  // 레벨업 처리 useEffect (currentXP 또는 xpToNextLevel이 변경될 때마다 실행)
  useEffect(() => {
    if (currentXP >= xpToNextLevel && playerLevel < 99) { // 최대 레벨 제한 (예: 99)
      setLevelUpMessage('LEVEL UP!');
      setIsLevelingUp(true);
      
      const nextLevel = playerLevel + 1;
      const remainingXP = currentXP - xpToNextLevel; // 초과 경험치 이월

      setPlayerLevel(nextLevel);
      setXpToNextLevel(getXpNeededForLevel(nextLevel));
      setCurrentXP(remainingXP); // 이월된 경험치로 설정

      // 레벨업 메시지 및 반짝임 효과 타이머
      const messageTimer = setTimeout(() => {
        setLevelUpMessage('');
      }, 1500); // 1.5초 후 메시지 사라짐

      const blinkingTimer = setTimeout(() => {
        setIsLevelingUp(false);
      }, 2000); // 2초 후 반짝임 효과 종료

      return () => {
        clearTimeout(messageTimer);
        clearTimeout(blinkingTimer);
      };
    }
  }, [currentXP, xpToNextLevel, playerLevel, getXpNeededForLevel]);


  useEffect(() => {
    if (gamePhase !== 'game') return; // 게임 단계가 아니면 점멸 효과 시작 안 함
    const blinkInterval = setInterval(() => {
      setBlinkingState(prev => !prev);
    }, 200);
    return () => clearInterval(blinkInterval);
  }, [gamePhase]);

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
        if (typeof tileAtTarget === 'object' && tileAtTarget.type !== 'bomb' && tileAtTarget.type !== 'lava') { // 광물 타일인 경우
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
            // 타일 파괴 시 경험치 획득 (타일의 원래 체력만큼)
            setCurrentXP(prev => prev + MINERAL_HEALTH[mineralTile.type]);
          }
        } else if (typeof tileAtTarget === 'object' && tileAtTarget.type === 'bomb') { // 폭탄 타일인 경우
          // 폭탄 타일인 경우, 비활성 상태면 활성화
          if (tileAtTarget.countdown === null) {
            currentMap[y][targetX] = { ...tileAtTarget, countdown: BOMB_INITIAL_COUNTDOWN };
          }
          // 활성 상태면 그대로 둠 (터치해도 바로 터지지 않음)
          // 폭탄 타일 위로 이동하지 않음
        } else if (typeof tileAtTarget === 'object' && tileAtTarget.type === 'lava') { // 용암 타일인 경우 (NEW)
            playerMoved = true; // 용암 위로는 공격 없이 이동 가능
        }
      } else { // 목표 위치가 비어있는 공간 (null)인 경우
        playerMoved = true;
      }

      if (playerMoved) {
        setPosition({ x: targetX, y: y });
        // 용암 타일 진입 시 피해 적용 (좌우 이동 시)
        const tileAtNewPosition = currentMap[y]?.[targetX];
        if (tileAtNewPosition && typeof tileAtNewPosition === 'object' && tileAtNewPosition.type === 'lava') {
            if (!onLava) { // 용암에 새로 진입했을 때만
                setCurrentHealth(prev => Math.max(0, prev - 1));
                setOnLava(true);
                console.log("Player entered lava (sideways), health -1. onLava set to true.");
            }
        } else { // 용암 타일이 아니면 onLava 상태 초기화
            if (onLava) {
                setOnLava(false);
                console.log("Player left lava (sideways), onLava set to false.");
            }
        }
      }

      return currentMap; // 업데이트된 맵 반환
    });
  }, [position, MAP_WIDTH, BOMB_INITIAL_COUNTDOWN, DRILL_ATTACK_POWER, PLAYER_MAX_HEALTH, gamePhase, onLava, MINERAL_HEALTH]); // MINERAL_HEALTH 의존성 추가

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (gamePhase !== 'game') return; // 게임 단계가 아니면 키보드 입력 무시
    if (e.key === "ArrowLeft") movePlayer("left");
    else if (e.key === "ArrowRight") movePlayer("right");
  }, [movePlayer, gamePhase]);

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

    // 캔버스 크기 조정 로직: CSS 크기를 기반으로 내부 해상도 설정
    const parentDiv = canvas.parentElement;
    const canvasCssWidth = parentDiv ? parentDiv.clientWidth : window.innerWidth;
    const canvasCssHeight = parentDiv ? parentDiv.clientHeight : window.innerHeight;

    // Set the internal drawing buffer resolution to match the CSS size
    canvas.width = canvasCssWidth;
    canvas.height = canvasCssHeight;

    // 맵의 실제 픽셀 너비와 높이
    const mapPixelWidth = TILE_SIZE * MAP_WIDTH;
    const mapPixelHeight = TILE_SIZE * MAP_HEIGHT;

    // 캔버스의 너비와 높이 설정.
    // 캔버스를 꽉 채우도록 하면서도, 비율을 유지하도록 계산.
    let scale;
    let offsetX = 0;
    let offsetY_draw = 0;

    const canvasAspectRatio = canvas.width / canvas.height;
    const mapAspectRatio = mapPixelWidth / mapPixelHeight;

    if (canvasAspectRatio > mapAspectRatio) {
      // 캔버스가 맵보다 가로로 넓을 때: 높이를 기준으로 스케일
      scale = canvas.height / mapPixelHeight;
      offsetX = (canvas.width - (mapPixelWidth * scale)) / 2;
    } else {
      // 캔버스가 맵보다 세로로 길거나 같을 때: 너비를 기준으로 스케일
      scale = canvas.width / mapPixelWidth;
      offsetY_draw = (canvas.height - (mapPixelHeight * scale)) / 2;
    }
    
    const draw = () => {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = "#222";
      context.fillRect(0, 0, canvas.width, canvas.height);

      context.save(); // 현재 변환 상태 저장
      context.translate(offsetX, offsetY_draw); // 중앙 정렬을 위한 이동
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
          if (typeof tile === 'object' && tile.type !== 'bomb' && tile.type !== 'lava') {
            const mineralTile = tile as MineralTileObject;
            let imageToDraw: HTMLImageElement | null = null;

            switch (mineralTile.type) {
              case 'dirt':
                imageToDraw = dirtImage.current;
                break;
              case 'copper':
                imageToDraw = copperImage.current;
                break;
              case 'silver':
                imageToDraw = silverImage.current;
                break;
              case 'gold':
                imageToDraw = goldImage.current;
                break;
              case 'diamond':
                imageToDraw = diamondImage.current;
                break;
              case 'sweetpotato':
                imageToDraw = sweetpotatoImage.current;
                break;
              default:
                // 기본값으로 회색 사각형을 그립니다 (이미지가 없는 경우)
                context.fillStyle = "gray";
                context.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                break;
            }
            
            // 이미지가 있으면 이미지를 그립니다.
            if (imageToDraw) {
                context.drawImage(imageToDraw, x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            }

            // 이제 체력 숫자는 그리지 않습니다.
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
          // 용암 타일 그리기 (NEW)
          else if (typeof tile === 'object' && tile.type === 'lava') {
            context.drawImage(lavaImage.current, x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            console.log(`Drawing lava tile at (${x}, ${y})`); // 용암 타일이 그려지고 있는지 확인
          }
        }
      }

      // 꼬순이 캐릭터 그리기 (스크롤 오프셋에 따라 화면 Y 위치 고정)
      const kosooniDisplayY = position.y >= SCROLL_THRESHOLD_Y
        ? SCROLL_THRESHOLD_Y * TILE_SIZE
        : position.y * TILE_SIZE;

      // 레벨업 중 반짝임 효과 적용
      if (isLevelingUp && blinkingState) {
        context.globalAlpha = 0.4; // 반투명하게 (반짝임 효과)
      } else {
        context.globalAlpha = 1.0; // 원래대로 불투명하게
      }

      context.drawImage(
        kosooniImage.current,
        position.x * TILE_SIZE,
        kosooniDisplayY + offsetY,
        TILE_SIZE,
        TILE_SIZE
      );
      context.globalAlpha = 1.0; // 알파값 원복

      context.restore(); // 저장된 변환 상태 복원 (스케일 초기화)

      // 체력 하트 그리기 (캔버스 스케일과 별개로 고정 위치에)
      context.save();
      const heartSize = 25 * 0.7; // 하트 크기 (70%로 줄임)
      const heartSpacing = 5; // 하트 간 간격
      const startX = 10; // 좌상단 시작 X 위치
      const startY = 10; // 좌상단 시작 Y 위치

      for (let i = 0; i < PLAYER_MAX_HEALTH; i++) {
        const heartX = startX + i * (heartSize + heartSpacing);
        const heartY = startY;

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

      // 레벨 및 경험치 정보 표시 (상단 중앙)
      context.fillStyle = "white";
      context.font = "20px Arial";
      context.textAlign = "center";
      context.textBaseline = "top";
      context.fillText(`Level: ${playerLevel} | XP: ${currentXP}/${xpToNextLevel}`, canvas.width / 2, 10);

      // 레벨업 메시지 표시 (꼬순이 위에)
      if (levelUpMessage) {
        context.fillStyle = "gold";
        context.font = "30px Arial";
        context.textAlign = "center";
        context.textBaseline = "middle";
        // 꼬순이 위치를 기준으로 메시지 Y 좌표 계산
        const messageY = kosooniDisplayY + offsetY - TILE_SIZE; // 꼬순이 타일 위쪽으로
        context.fillText(levelUpMessage, position.x * TILE_SIZE + TILE_SIZE / 2, messageY);
      }
    };

    draw();
  }, [position, tileMap, offsetY, blinkingState, TILE_SIZE, MAP_HEIGHT, MAP_WIDTH, tileColors, kosooniImage, sweetpotatoImage, bombImage, lavaImage, dirtImage, copperImage, silverImage, goldImage, diamondImage, scrollOffset, SCROLL_THRESHOLD_Y, currentHealth, PLAYER_MAX_HEALTH, imagesLoaded, gamePhase, playerLevel, currentXP, xpToNextLevel, levelUpMessage, isLevelingUp]); // 새로운 이미지 Ref들과 레벨 관련 상태들을 의존성 배열에 추가

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        // Canvas의 CSS 크기를 부모 컨테이너에 꽉 차도록 설정
        canvas.style.width = '100%';
        canvas.style.height = '100%';

        // 실제 렌더링된 CSS 크기를 가져와 내부 드로잉 버퍼 해상도 설정
        const canvasCssWidth = canvas.clientWidth;
        const canvasCssHeight = canvas.clientHeight;

        canvas.width = canvasCssWidth;
        canvas.height = canvasCssHeight;
      }
    };
    window.addEventListener("resize", handleResize);
    // 초기 로드 시에도 크기 조정 적용
    handleResize();

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleResize);
    };
  }, [handleKeyDown, gamePhase]); 

  // 모바일 터치 이벤트 핸들러 (전체 화면 터치 유지)
  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (gamePhase !== 'game') return; // 게임 단계가 아니면 터치 이동 무시
    e.preventDefault(); // 기본 스크롤 방지
    const touchX = e.touches[0].clientX; // 첫 번째 터치의 X 좌표
    const screenWidth = window.innerWidth;

    if (touchX < screenWidth / 2) {
      movePlayer("left"); // 화면 좌측 터치 시 좌측 이동
    } else {
      movePlayer("right"); // 화면 우측 터치 시 우측 이동
    }
  }, [movePlayer, gamePhase]);

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
      className="flex flex-col items-center justify-center min-h-screen bg-black text-white relative overflow-hidden" 
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
              src={kosooniTitleBannerImage.current.src} 
              alt="꼬순이의 대모험"
              className="max-w-full h-auto rounded-lg shadow-lg"
              style={{ maxWidth: '80vw', maxHeight: '80vh' }} 
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
            style={{ display: 'block' }} 
          ></canvas>
        </div>
      )}
    </div>
  );
}

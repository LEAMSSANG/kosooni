import { useEffect, useRef, useState, useCallback } from 'react';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [position, setPosition] = useState({ x: 5, y: 1 }); // 꼬순이의 논리적(절대) Y 위치를 0 -> 1로 수정하여 둘째 줄에서 시작
  const [offsetY, setOffsetY] = useState(0); // 낙하 애니메이션을 위한 Y축 오프셋
  const [scrollOffset, setScrollOffset] = useState(0); // 맵 스크롤을 위한 Y축 오프셋
  const [onLava, setOnLava] = useState(false); // 플레이어가 용암 위에 있는지 추적하는 상태 (피해 한 번만 적용)
  const [isAttacking, setIsAttacking] = useState(false); // 점프 공격 애니메이션을 위한 상태 추가

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
      diamondImage.current.onerror = null; diamondImage.current.onerror = null;
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

  // tileColors 변수 제거 (더 이상 사용되지 않음)

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
    // 플레이어가 처음 몇 칸은 자유롭게 낙하할 수 있도록, 초기 4줄을 비워둠
    for (let y = 0; y < 4; y++) {
        const row: MapTile[] = Array(MAP_WIDTH).fill(null); // 명시적으로 null 값으로 채움
        map.push(row);
    }
    // 그 다음부터 무작위 광물 행 생성
    for (let y = 4; y < MAP_HEIGHT * 2; y++) {
        map.push(generateNewRow());
    }
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
  const ATTACK_JUMP_DURATION = 150; // 공격 점프 애니메이션 지속 시간 (ms)
  const ATTACK_JUMP_OFFSET = -10; // 공격 점프 시 오프셋

  // 캐릭터가 화면 중간에 고정되기 시작하는 Y 좌표 (타일 기준)
  const SCROLL_THRESHOLD_Y = Math.floor(MAP_HEIGHT / 3); // 예를 들어, 화면 높이의 1/3 지점

  // 사용자 정의 타입 가드 함수
  const isMineralTile = (tile: MapTile): tile is MineralTileObject => {
    return tile !== null && (tile.type === 'dirt' || tile.type === 'copper' || tile.type === 'silver' || tile.type === 'gold' || tile.type === 'diamond' || tile.type === 'sweetpotato');
  };

  // 점프 공격 애니메이션 useEffect
  useEffect(() => {
    if (isAttacking) {
        setOffsetY(ATTACK_JUMP_OFFSET); // 공격 시 짧게 점프
        const timer = setTimeout(() => {
            setOffsetY(0); // 원위치
            setIsAttacking(false); // 공격 상태 해제
        }, ATTACK_JUMP_DURATION);
        return () => clearTimeout(timer);
    }
  }, [isAttacking, ATTACK_JUMP_OFFSET, ATTACK_JUMP_DURATION]);


  // 게임 틱 로직 (낙하, 폭탄, 경험치 획득 등)
  useEffect(() => {
    if (!imagesLoaded || gamePhase !== 'game') {
      console.log(`Game tick useEffect: Not active. imagesLoaded: ${imagesLoaded}, gamePhase: ${gamePhase}`);
      return;
    }

    console.log("Game tick useEffect started. Current game phase:", gamePhase);

    const gameInterval = setInterval(() => {
      console.log("Game tick running. Current position:", position.x, position.y);

      // 공격 애니메이션 중이 아니면 일반적인 낙하/움직임 바운스 적용
      if (!isAttacking) {
        setOffsetY(-5); 
        setTimeout(() => {
          setOffsetY(0);
        }, JUMP_OFFSET_DURATION);
      }

      setTileMap((prevMap) => {
          let currentMap = prevMap.map(row => [...row]);
          let newPlayerX = position.x;
          let newPlayerY = position.y;

          let bombsToExplode: { x: number; y: number; }[] = [];
          for (let y = 0; y < currentMap.length; y++) {
            for (let x = 0; x < MAP_WIDTH; x++) {
              const tile = currentMap[y][x];
              if (typeof tile === 'object' && tile !== null && tile.type === 'bomb') {
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

          bombsToExplode.forEach(({ x: bombX, y: bombY }) => {
            const { newMap: mapAfterExplosion, pushedPlayerX: tempPushedX } = explodeBomb(bombX, bombY, currentMap, newPlayerX, newPlayerY);
            currentMap = mapAfterExplosion;
            newPlayerX = tempPushedX;
          });

          let movedDownThisTick = false;
          const nextPlayerYCandidate = newPlayerY + 1;

          console.log(`[Falling Check] PlayerY: ${newPlayerY}, NextYCandidate: ${nextPlayerYCandidate}`);
          if (nextPlayerYCandidate < currentMap.length) {
              const tileBelowCurrentPos = currentMap[nextPlayerYCandidate][newPlayerX];
              console.log(`[Falling Check] Tile below (${newPlayerX}, ${nextPlayerYCandidate}):`, tileBelowCurrentPos);

              if (tileBelowCurrentPos === null) {
                  newPlayerY++;
                  movedDownThisTick = true;
                  console.log(`[Falling Result] Fell to Y: ${newPlayerY} (empty space)`);
              } else if (tileBelowCurrentPos === undefined) {
                  console.warn(`[Falling Logic] Tile below is unexpectedly undefined at [${nextPlayerYCandidate}][${newPlayerX}]. This suggests a map indexing problem.`);
              } else if (tileBelowCurrentPos.type === 'lava') {
                  newPlayerY++;
                  movedDownThisTick = true;
                  console.log(`[Falling Result] Fell to Y: ${newPlayerY} (lava)`);
              } else if (tileBelowCurrentPos.type === 'bomb') {
                  console.log(`[Falling Result] Landed on bomb at (${newPlayerX}, ${nextPlayerYCandidate})`);
                  // 폭탄 위에서는 멈춤
              } else if (isMineralTile(tileBelowCurrentPos)) {
                  const mineralTile = tileBelowCurrentPos;
                  console.log(`[Falling Result] Hitting mineral at (${newPlayerX}, ${nextPlayerYCandidate}) with health: ${mineralTile.health}, drill power: ${DRILL_ATTACK_POWER}`);
                  if (mineralTile.health > DRILL_ATTACK_POWER) {
                      currentMap[nextPlayerYCandidate][newPlayerX] = { ...mineralTile, health: mineralTile.health - DRILL_ATTACK_POWER };
                      console.log(`[Falling Result] Mineral health reduced to: ${mineralTile.health - DRILL_ATTACK_POWER}. Player stays.`);
                  } else {
                      currentMap[nextPlayerYCandidate][newPlayerX] = null;
                      newPlayerY++;
                      movedDownThisTick = true;
                      console.log(`[Falling Result] Mineral broken (was health ${mineralTile.health}), player fell to Y: ${newPlayerY}`);
                      if (mineralTile.type === 'sweetpotato') {
                          setCurrentHealth(prev => Math.min(prev + 1, PLAYER_MAX_HEALTH));
                      }
                      setCurrentXP(prev => prev + MINERAL_HEALTH[mineralTile.type]);
                  }
              }
          } else {
              console.log(`[Falling Check] Player is at the bottom edge (or beyond) of the current map segment. Max map Y: ${currentMap.length - 1}`);
          }

          const MAP_GENERATE_THRESHOLD = currentMap.length - MAP_HEIGHT;
          if (newPlayerY >= MAP_GENERATE_THRESHOLD) {
            currentMap.push(generateNewRow());
          }

          if (newPlayerX !== position.x || newPlayerY !== position.y || movedDownThisTick) {
            console.log(`[Position Update] Updating position from (${position.x}, ${position.y}) to (${newPlayerX}, ${newPlayerY}). Moved Down: ${movedDownThisTick}`);
            setPosition({ x: newPlayerX, y: newPlayerY });

            if (newPlayerY >= SCROLL_THRESHOLD_Y) {
              setScrollOffset((newPlayerY - SCROLL_THRESHOLD_Y) * TILE_SIZE);
            } else {
              setScrollOffset(0);
            }
            
            const tileAtNewPosition = currentMap[newPlayerY]?.[newPlayerX];
            if (tileAtNewPosition && typeof tileAtNewPosition === 'object' && tileAtNewPosition.type === 'lava') {
                if (!onLava) {
                    setCurrentHealth(prev => Math.max(0, prev - 1));
                    setOnLava(true);
                }
            } else {
                if (onLava) {
                    setOnLava(false);
                }
            }
          } else {
            console.log(`[Position Update] Position remained (${position.x}, ${position.y}). No move.`);
            const tileAtCurrentPos = currentMap[position.y]?.[position.x];
            if (!(tileAtCurrentPos && typeof tileAtCurrentPos === 'object' && tileAtCurrentPos.type === 'lava')) {
                if (onLava) {
                    setOnLava(false);
                }
            }
          }
          return currentMap;
      });
    }, GAME_TICK_INTERVAL);

    return () => clearInterval(gameInterval);
  }, [
    position, explodeBomb, generateNewRow, DRILL_ATTACK_POWER,
    imagesLoaded, gamePhase, onLava, isMineralTile, isAttacking,
    JUMP_OFFSET_DURATION, SCROLL_THRESHOLD_Y, TILE_SIZE,
    MAP_WIDTH, MAP_HEIGHT,
    BOMB_INITIAL_COUNTDOWN, PLAYER_MAX_HEALTH, MINERAL_HEALTH
  ]);


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

      let playerMoved = false;

      // 목표 X 위치가 유효한 맵 범위 내에 있는지 먼저 확인
      if (targetX >= 0 && targetX < MAP_WIDTH) {
        const currentRow = currentMap[y];
        if (currentRow) { // 현재 플레이어 Y 위치의 행이 존재하는지 확인
          const tileAtTarget = currentRow[targetX]; // MapTile 또는 undefined

          if (tileAtTarget === undefined) {
             console.warn(`[MovePlayer] Tile at target (${targetX}, ${y}) is unexpectedly undefined.`);
          } else if (tileAtTarget === null) { // 목표 위치가 비어있는 공간 (null)인 경우
            playerMoved = true;
          } else if (tileAtTarget.type === 'lava') { // 용암 타일인 경우
            playerMoved = true; // 용암 위로는 공격 없이 이동 가능
          } else if (tileAtTarget.type === 'bomb') { // 폭탄 타일인 경우
            if (tileAtTarget.countdown === null) {
              currentRow[targetX] = { ...tileAtTarget, countdown: BOMB_INITIAL_COUNTDOWN };
            }
            // 플레이어는 폭탄 위로 이동하지 않음
          } else if (isMineralTile(tileAtTarget)) { // 사용자 정의 타입 가드 사용
            const mineralTile = tileAtTarget; // 이제 TypeScript가 MineralTileObject임을 앎
            if (mineralTile.health > DRILL_ATTACK_POWER) {
              // 체력 감소, 플레이어는 현재 위치 유지
              currentRow[targetX] = { ...mineralTile, health: mineralTile.health - DRILL_ATTACK_POWER };
              setIsAttacking(true); // 공격 발생 시 점프 애니메이션 트리거
            } else {
              // 체력이 0 이하가 되면 타일 파괴, 플레이어 이동
              currentRow[targetX] = null;
              playerMoved = true;
              setIsAttacking(true); // 타일 파괴 시에도 점프 애니메이션 트리거
              // 고구마 타일 파괴 시 체력 회복
              if (mineralTile.type === 'sweetpotato') {
                setCurrentHealth(prev => Math.min(prev + 1, PLAYER_MAX_HEALTH));
              }
              // 타일 파괴 시 경험치 획득 (타일의 원래 체력만큼)
              setCurrentXP(prev => prev + MINERAL_HEALTH[mineralTile.type]);
            }
          }
        } else {
            console.warn(`[MovePlayer] Current row (Y: ${y}) is undefined. Player cannot move.`);
        }
      } // else (targetX가 맵 범위를 벗어난 경우) playerMoved는 false로 유지

      if (playerMoved) {
        setPosition({ x: targetX, y: y });
        // 용암 타일 진입 시 피해 적용 (좌우 이동 시)
        // 이동 후에 다시 해당 위치의 타일을 확인해야 정확한 상태를 반영함
        const tileAtNewPosition = currentMap[y]?.[targetX]; 
        if (tileAtNewPosition && typeof tileAtNewPosition === 'object' && tileAtNewPosition.type === 'lava') {
            if (!onLava) { // 용암에 새로 진입했을 때만
                setCurrentHealth(prev => Math.max(0, prev - 1));
                setOnLava(true);
            }
        } else { // 용암 타일이 아니면 onLava 상태 초기화
            if (onLava) {
                setOnLava(false);
            }
        }
      }

      return currentMap; // 업데이트된 맵 반환
    });
  }, [position, MAP_WIDTH, BOMB_INITIAL_COUNTDOWN, DRILL_ATTACK_POWER, PLAYER_MAX_HEALTH, gamePhase, onLava, MINERAL_HEALTH, isMineralTile]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (gamePhase !== 'game') return; // 게임 단계가 아니면 키보드 입력 무시
    if (e.key === "ArrowLeft") movePlayer("left");
    else if (e.key === "ArrowRight") movePlayer("right");
  }, [movePlayer, gamePhase]);

  // Canvas 그리기 로직
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    // 이미지가 로드되지 않았으면 로딩 메시지 표시 후 바로 종료
    if (!imagesLoaded) {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = "#000"; // 검은색 배경
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = "#FFF"; // 흰색 텍스트
      context.font = "20px Arial";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(`로딩 중... (${loadedImageCount}/${totalImagesToLoad})`, canvas.width / 2, canvas.height / 2);
      return;
    }

    // 게임 단계가 'game'이 아니면 캔버스 내용 지우고 바로 종료
    if (gamePhase !== 'game') {
      context.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    // 캔버스 내부 해상도를 게임 월드 크기에 고정
    canvas.width = TILE_SIZE * MAP_WIDTH;  // 600px
    canvas.height = TILE_SIZE * MAP_HEIGHT; // 800px

    const draw = () => {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = "#222";
      context.fillRect(0, 0, canvas.width, canvas.height);

      // 맵 그리기 (스크롤 오프셋 적용)
      for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
          const actualMapY = Math.floor(scrollOffset / TILE_SIZE) + y; // startDrawY를 여기서 직접 계산
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

      // 체력 하트 그리기 (캔버스 스케일과 별개로 고정 위치에)
      context.restore(); // 저장된 변환 상태 복원 (이전 save에서 translate/scale 복원)
      context.save(); // 새로운 변환 상태 저장 (HUD용)

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
      // 레벨 및 경험치 정보 표시 (상단 중앙) - 이제 캔버스 크기가 고정되므로, canvas.width / 2 사용 가능
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
        // 꼬순이 위치를 기준으로 메시지 Y 좌표 계산 (이전 스케일링이 없으므로 직접 계산)
        // 꼬순이 타일의 Y 위치(px) + 캔버스의 실제 CSS 스케일 비율을 고려해야 함
        // 현재는 캔버스 내부 해상도가 고정되어 있으므로, 직접 픽셀 좌표 사용
        const messageY = (position.y >= SCROLL_THRESHOLD_Y ? SCROLL_THRESHOLD_Y : position.y) * TILE_SIZE + offsetY - TILE_SIZE; 
        context.fillText(levelUpMessage, position.x * TILE_SIZE + TILE_SIZE / 2, messageY);
      }
      
      context.restore(); // HUD용 변환 상태 복원
    };

    draw();
  }, [position, tileMap, offsetY, blinkingState, TILE_SIZE, MAP_HEIGHT, MAP_WIDTH, kosooniImage, sweetpotatoImage, bombImage, lavaImage, dirtImage, copperImage, silverImage, goldImage, diamondImage, scrollOffset, SCROLL_THRESHOLD_Y, currentHealth, PLAYER_MAX_HEALTH, imagesLoaded, gamePhase, playerLevel, currentXP, xpToNextLevel, levelUpMessage, isLevelingUp, loadedImageCount, totalImagesToLoad, isMineralTile]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown, gamePhase]); 

  // 모바일 터치 이벤트 핸들러 (React.TouchEvent로 롤백)
  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (gamePhase !== 'game') return; // 게임 단계가 아니면 터치 이동 무시
    // e.preventDefault(); // 기본 스크롤 방지 -> 필요시 주석 해제 (단, passive listener 오류에 주의)
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
      console.log('Story complete, setting gamePhase to "story".');
      setGamePhase('story');
    }
  }, [imagesLoaded]);

  // 스토리 화면 완료 핸들러
  const handleStoryComplete = useCallback(() => {
    console.log('Story complete, setting gamePhase to "game".');
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
            // 이미지 로딩 진행 상황을 표시
            <p className="text-xl">
              로딩 중... ({loadedImageCount}/{totalImagesToLoad})
            </p>
          ) : (
            <img
              src={kosooniTitleBannerImage.current.src} 
              alt="꼬순이의 대모험"
              className="max-w-full h-auto object-contain mx-auto rounded-lg shadow-lg" // max-w-full, mx-auto 추가
              style={{ width: '100%', maxWidth: '1000px' }} // 이미지 너비 100%로 설정하되, 최대 너비 1000px 제한
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
        <div className="relative w-full h-full flex items-center justify-center p-4"> {/* 캔버스 및 버튼을 감싸는 컨테이너, padding 추가 */}
          <canvas
            ref={canvasRef}
            // 캔버스 내부 해상도를 게임 월드 크기에 고정
            width={TILE_SIZE * MAP_WIDTH}  // 600px
            height={TILE_SIZE * MAP_HEIGHT} // 800px
            // CSS로 캔버스 스케일되도록 설정
            style={{ 
              display: 'block', 
              maxWidth: '100%', 
              maxHeight: 'calc(100vh - 80px)', // 화면 높이에서 상하 여백을 고려하여 최대 높이 제한 (예: 80px)
              width: 'auto', // 가로세로 비율 유지하면서 자동으로 너비 조절
              height: 'auto', // 가로세로 비율 유지하면서 자동으로 높이 조절
              objectFit: 'contain', // 내용이 잘리지 않고 비율 유지하며 확대/축소
              border: '4px solid #FACC15', // 기존 border 추가
              borderRadius: '0.5rem', // 기존 rounded-lg 추가
              boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)' // 기존 shadow-lg 추가
            }} 
          ></canvas>
        </div>
      )}
    </div>
  );
}

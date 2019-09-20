module Mahjong where

import Data.List

data Tile = M1 | M2 | M3 | M4 | M5 | M5A | M6 | M7 | M8 | M9
           | P1 | P2 | P3 | P4 | P5 | P5A | P6 | P7 | P8 | P9
           | S1 | S2 | S3 | S4 | S5 | S5A | S6 | S7 | S8 | S9
           | Haku | Hatsu | Chun
           | Ton | Nan | Shaa | Pei
           | VoidTile deriving (Eq, Ord, Show, Read, Bounded, Enum)

data TileCategory = Akapai | Shuupai | Tanyaohai | Manzu | Pinzu | Souzu | Jihai | Kazehai | Sangenpai | Routouhai | Yaochuuhai deriving (Eq, Show, Read)
type Hand = [Tile]


toTiles :: TileCategory -> [Tile]
toTiles Akapai = [M5A, P5A, S5A]
toTiles Tanyaohai = concat [[M2 .. M8], [P2 .. P8], [S2 .. S8]]
toTiles Manzu = [M1 .. M9]
toTiles Pinzu = [P1 .. P9]
toTiles Souzu = [S1 .. S9]
toTiles Shuupai = concat $ map toTiles [Manzu, Pinzu, Souzu]
toTiles Kazehai = [Ton .. Pei]
toTiles Sangenpai = [Haku .. Chun]
toTiles Jihai = toTiles Kazehai ++ toTiles Sangenpai
toTiles Routouhai = [M1, M9, P1, P9, S1, S9]
toTiles Yaochuuhai = toTiles Routouhai ++ toTiles Jihai

tileIs :: TileCategory -> Tile -> Bool
tileIs = (flip elem) . toTiles

next :: Tile -> Tile
next tile
  | elem tile [M9, P9, S9] = toEnum $ fromEnum tile - 9
  | tile == Chun = Haku
  | tile == Pei = Ton
  | elem tile [M5, P5, S5] = succ $ succ tile -- skip akadora
  | tile /= VoidTile = succ tile
  | otherwise = VoidTile

nextShuntsu :: Tile -> Maybe Tile
nextShuntsu tile
  | elem tile [M9, P9, S9, Haku, Hatsu, Chun, Ton, Nan, Shaa, Pei] = Nothing
  | otherwise = Just $ next tile

data Group = Group Tile Tile Tile deriving (Show, Eq, Ord, Read)

toGroup :: [Tile] -> Group
toGroup (t1:t2:t3:_) = Group t1 t2 t3
toGroup _ = error "rip" -- FIXME

groupShanten :: Group -> Int
groupShanten (Group t1' t2' t3')
  | t2 == VoidTile = 2
  | nextShuntsu t1 == Just t2 = if nextShuntsu t2 == Just t3
                                then 0
                                else 1
  | t1 == t2 = if t2 == t3
               then 0
               else 1
  | nextShuntsu t2 == Just t3 = 1
  | elem (nextShuntsu t1 >>= nextShuntsu) [Just t2, Just t3] = 1
  | (nextShuntsu t2 >>= nextShuntsu) == Just t3 = 1
  | otherwise = 2
    where
    (t1:t2:t3:_) = sort [t1', t2', t3']

sepRaise :: (Ord a) => [a] -> [([[a]],[a])]
sepRaise l = [([], l)]

separate :: (Ord a) => Int -> [([[a]],[a])] -> [[([[a]],[a])]]
separate n lst = map (\(cur, rem) -> (map (\(newCur, newRem) -> (newCur:cur, newRem)) (pickNs rem n))) lst

pickOne :: Ord a => ([a], [a]) -> [([a], [a])]
pickOne lst = [(new:current, delete new left) |
                    let current = fst lst
                        left = snd lst,
                    new <- left,
  (null current) || new > current !! 0
                     ]
pickNs :: (Num t, Ord a, Eq t) => [a] -> t -> [([a], [a])]
pickNs lst n = pickN' [([head lst], (tail lst))] (n - 1)

pickN :: (Num t, Ord a, Eq t) => [a] -> t -> [([a], [a])]
pickN lst n = pickN' (pickOne ([], lst)) (n - 1)

pickN' lst' n'
  | n' == 0 = lst'
  | otherwise = pickN' (lst' >>= pickOne) (n' - 1)

decompose :: (Ord a) => Int -> [a] -> [[[a]]]
decompose n lst = decompose' $ separate n $ sepRaise lst
  where
    decompose' s
      | null $ snd $ s !! 0 !! 0 = map fst $ concat s
      | otherwise = decompose' (s >>= separate n)

--shanten :: Hand -> Int
shanten h =
  let atama = pickN h 2 -- [([pair], [rest of hand])]
      ayy = [(a, gr, sum $ map groupShanten gr) | (a, b) <- atama, gr <- map (map toGroup) (decompose 3 b)] 
  in ayy

hnd = sort [M1, M2, M3,
     S3, S5, S6,
     P5, P8, Hatsu,
     Haku, Haku, Pei,
     Chun, VoidTile]

x = shanten hnd

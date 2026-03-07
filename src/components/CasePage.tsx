import { useMemo, useState } from 'react';
import { HeaderBar } from './HeaderBar';
import { ResultPanel } from './ResultPanel';
import { Roulette, type SkinItem } from './Roulette';
import { initTelegram, getTelegramUser, openExternalLink, triggerKnifeDropHaptic, triggerWinHaptic } from '../lib/tg';
import { buildFinalRedirectUrl, getIncomingParams } from '../lib/tracking';
import { loadState, saveState } from '../lib/storage';

const ITEMS: SkinItem[] = [
  {
    id: 'trash-a',
    name: 'P90 | Desert Halftone',
    rarity: 'gray',
    rarityLabel: 'Consumer Grade',
    image: new URL('../../images/P90_Desert_Halftone_gray.webp', import.meta.url).href,
  },
  {
    id: 'nova-rust',
    name: 'Nova | Marsh Grass',
    rarity: 'gray',
    rarityLabel: 'Consumer Grade',
    image: new URL('../../images/Nova_Marsh_Grass_gray.webp', import.meta.url).href,
  },
  {
    id: 'g3-red',
    name: 'G3SG1 | Red Jasper',
    rarity: 'gray',
    rarityLabel: 'Consumer Grade',
    image: new URL('../../images/G3SG1_Red_Jasper_gray.webp', import.meta.url).href,
  },
  {
    id: 'r8-cobalt',
    name: 'R8 Revolver | Cobalt Grip',
    rarity: 'gray',
    rarityLabel: 'Consumer Grade',
    image: new URL('../../images/R8_Revolver_Cobalt_Grip_gray.webp', import.meta.url).href,
  },
  {
    id: 'awp-green',
    name: 'AWP | Green Energy',
    rarity: 'pink',
    rarityLabel: 'Classified',
    image: new URL('../../images/AWP_Green_Energy_pink.webp', import.meta.url).href,
  },
  {
    id: 'pp-bizoom',
    name: 'PP-Bizon | Bizoom',
    rarity: 'gray',
    rarityLabel: 'Consumer Grade',
    image: new URL('../../images/PP-Bizon_Bizoom_gray.webp', import.meta.url).href,
  },
  {
    id: 'knife-nomad-gold',
    name: '★ Nomad Knife | Marble Fade',
    rarity: 'gold',
    rarityLabel: 'Rare Special Item',
    image: new URL('../../images/Nomad_Marble_Fade_gold.png', import.meta.url).href,
    isKnife: true,
  },
  {
    id: 'ak-rouge',
    name: 'AK-47 | Nouveau Rouge',
    rarity: 'pink',
    rarityLabel: 'Classified',
    image: new URL('../../images/AK-47_Nouveau_Rouge_pink.webp', import.meta.url).href,
  },
  {
    id: 'deagle-mint',
    name: 'Desert Eagle | Mint Fan',
    rarity: 'blue',
    rarityLabel: 'Mil-Spec',
    image: new URL('../../images/Desert_Eagle_Mint_Fan_blue.webp', import.meta.url).href,
  },
  {
    id: 'scar-zinc',
    name: 'SCAR-20 | Zinc',
    rarity: 'gray',
    rarityLabel: 'Consumer Grade',
    image: new URL('../../images/SCAR-20_Zinc_gray.webp', import.meta.url).href,
  },
  {
    id: 'ssg-comic',
    name: 'SSG 08 | Sans Comic',
    rarity: 'gray',
    rarityLabel: 'Consumer Grade',
    image: new URL('../../images/SSG_08_Sans_Comic_gray.webp', import.meta.url).href,
  },
  {
    id: 'p250-sed',
    name: 'P250 | Sedimentary',
    rarity: 'blue',
    rarityLabel: 'Mil-Spec',
    image: new URL('../../images/P250_Sedimentary_blue.webp', import.meta.url).href,
  },
  {
    id: 'knife-win',
    name: '★ Karambit | Tiger Tooth',
    rarity: 'gold',
    rarityLabel: 'Rare Special Item',
    image: new URL('../../images/Karambit_Tiger_Tooth_gold.png', import.meta.url).href,
    isKnife: true,
  },
];

const SCRIPTED_OUTCOMES = ['trash-a', 'nova-rust', 'knife-win'];

export function CasePage() {
  const persisted = useMemo(() => loadState(), []);
  const [spinCount, setSpinCount] = useState(persisted.spinCount);
  const [hasWon, setHasWon] = useState(persisted.hasWon);
  const [lastWonItemId, setLastWonItemId] = useState<string | null>(persisted.lastWonItemId);
  const [spinToken, setSpinToken] = useState(0);
  const [targetItemId, setTargetItemId] = useState<string | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);

  const tg = useMemo(() => initTelegram(), []);
  const user = useMemo(() => getTelegramUser(tg), [tg]);
  const incomingParams = useMemo(() => getIncomingParams(), []);

  const firstName = user?.first_name || 'there';
  const tgId = user?.id;

  const redirectBase = 'https://hellca.se/kiqisun/';
  const lastWonItem = lastWonItemId ? ITEMS.find((item) => item.id === lastWonItemId) ?? null : null;

  const persist = (next: { spinCount: number; lastWonItemId: string | null; hasWon: boolean }) => {
    saveState(next);
  };

  const handleOpenCase = () => {
    if (isSpinning || hasWon) return;
    if (spinCount >= 3) return;

    const nextOutcomeId = SCRIPTED_OUTCOMES[spinCount];
    setTargetItemId(nextOutcomeId);
    setSpinToken((prev) => prev + 1);
  };

  const handleSpinEnd = (item: SkinItem) => {
    const nextSpinCount = Math.min(spinCount + 1, 3);
    const won = nextSpinCount >= 3 && item.id === 'knife-win';

    setIsSpinning(false);
    setSpinCount(nextSpinCount);
    setLastWonItemId(item.id);
    setHasWon(won);

    if (item.isKnife) triggerKnifeDropHaptic(tg);
    if (won) triggerWinHaptic(tg);

    persist({
      spinCount: nextSpinCount,
      lastWonItemId: item.id,
      hasWon: won,
    });
  };

  const handleActivateBonus = () => {
    const finalUrl = buildFinalRedirectUrl({
      base: redirectBase,
      incoming: incomingParams,
      tgId,
    });

    openExternalLink(tg, finalUrl);
  };

  return (
    <main className="page-wrap">
      <div className="bg-noise" aria-hidden="true" />
      <HeaderBar firstName={firstName} />

      {hasWon ? (
        <ResultPanel hasWon={hasWon} item={lastWonItem} />
      ) : (
        <Roulette
          items={ITEMS}
          targetItemId={targetItemId}
          spinToken={spinToken}
          onSpinStart={() => setIsSpinning(true)}
          onSpinEnd={handleSpinEnd}
        />
      )}

      <div className="cta-row panel">
        <button
          className={`cta-button ${hasWon ? 'bonus' : ''}`}
          type="button"
          onClick={hasWon ? handleActivateBonus : handleOpenCase}
          disabled={isSpinning}
        >
          {hasWon ? 'Activate Bonus' : isSpinning ? 'Opening...' : 'Open Case'}
        </button>
        {!hasWon && (
          <div className="tries-indicator" aria-label={`Tries used: ${spinCount} of 3`}>
            {[0, 1, 2].map((idx) => (
              <span key={idx} className={`try-dot ${spinCount > idx ? 'used' : ''}`} />
            ))}
          </div>
        )}
      </div>

      {!hasWon && <ResultPanel hasWon={hasWon} item={lastWonItem} />}
    </main>
  );
}

import { useEffect, useState } from 'react';
import { Game } from './components/Game';
import { Menu } from './components/Menu';
import { loadSettings, saveSettings } from './settings';
import { setSoundEnabled, sounds, unlockAudio } from './sounds';
import { other, type GameConfig, type Settings } from './types';

export default function App() {
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const [config, setConfig] = useState<GameConfig | null>(null);
  const [gameKey, setGameKey] = useState(0);

  useEffect(() => {
    saveSettings(settings);
    setSoundEnabled(settings.sound);
  }, [settings]);

  // Los navegadores táctiles solo permiten sonido tras un gesto del usuario.
  useEffect(() => {
    const unlock = () => unlockAudio();
    window.addEventListener('pointerdown', unlock, { once: true });
    return () => window.removeEventListener('pointerdown', unlock);
  }, []);

  const startGame = (c: GameConfig) => {
    setConfig(c);
    setGameKey((k) => k + 1);
    sounds.start();
  };

  const restart = () => {
    setGameKey((k) => k + 1);
    sounds.start();
  };

  // Revancha: contra la máquina se cambian los colores; entre dos jugadores se repite igual.
  const rematch = () => {
    setConfig((c) => (c && c.mode === 'cpu' ? { ...c, humanColor: other(c.humanColor) } : c));
    restart();
  };

  if (!config) {
    return <Menu settings={settings} onSettings={setSettings} onStart={startGame} />;
  }

  return (
    <Game
      key={gameKey}
      config={config}
      settings={settings}
      onSettings={setSettings}
      onExit={() => setConfig(null)}
      onRestart={restart}
      onRematch={rematch}
    />
  );
}

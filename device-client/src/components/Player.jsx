import { useCallback, useEffect, useState } from 'react';
import { PUSH_DURATION_SEC } from '../lib/config.js';
import Stage from './Stage.jsx';

const SKIP_DELAY_MS = 2000; // jeda sebelum melewati content yang gagal dimuat

/**
 * Memutar playlist berurutan. Content hasil "push" (`pushed`) menimpa playlist
 * selama PUSH_DURATION_SEC (video: sampai selesai), lalu playlist dilanjutkan.
 */
export default function Player({ playlist, pushed, onPushEnd }) {
  const [index, setIndex] = useState(0);

  const current = pushed ?? (playlist.length ? playlist[index % playlist.length] : null);
  const advance = useCallback(() => setIndex((i) => i + 1), []);
  const isVideo = current?.tipe === 'video';
  const canAdvance = Boolean(pushed) || playlist.length > 1;
  const finish = pushed ? onPushEnd : advance;

  // Content non-video berganti sesuai durasinya; video berganti saat selesai (onEnded)
  const slideKey = current ? `${pushed ? 'push' : 'list'}-${current.id}-${index}` : 'idle';
  useEffect(() => {
    if (!current || isVideo || !canAdvance) return;
    const seconds = pushed ? PUSH_DURATION_SEC : current.duration_sec || 10;
    const timer = setTimeout(finish, seconds * 1000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slideKey, isVideo, canAdvance]);

  const skipBroken = () => setTimeout(finish, SKIP_DELAY_MS);

  if (!current) return null;
  return (
    <div className="stage" key={slideKey}>
      <Stage
        content={current}
        loop={!canAdvance}
        onEnded={canAdvance ? finish : undefined}
        onError={canAdvance ? skipBroken : undefined}
      />
    </div>
  );
}

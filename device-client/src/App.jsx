import { useCallback, useState } from 'react';
import { clearDeviceId, loadDeviceId, saveDeviceId } from './lib/deviceId.js';
import { useDeviceSocket } from './lib/useDeviceSocket.js';
import { usePlaylist } from './lib/usePlaylist.js';
import Player from './components/Player.jsx';
import Setup from './components/Setup.jsx';
import StatusOverlay from './components/StatusOverlay.jsx';

export default function App() {
  const [deviceId, setDeviceId] = useState(loadDeviceId);

  const connect = (id) => {
    saveDeviceId(id);
    setDeviceId(id);
  };
  const reset = () => {
    clearDeviceId();
    setDeviceId(null);
  };

  if (!deviceId) return <Setup onSubmit={connect} />;
  // key = deviceId: pindah device me-reset seluruh state player & koneksi
  return <DeviceScreen key={deviceId} deviceId={deviceId} onReset={reset} />;
}

function DeviceScreen({ deviceId, onReset }) {
  const { device, playlist, notFound, refresh } = usePlaylist(deviceId);
  const [pushed, setPushed] = useState(null);

  const onMessage = useCallback(
    (msg) => {
      if (msg.type === 'playlist_updated') refresh();
      if (msg.type === 'push_content') setPushed(msg.content);
    },
    [refresh],
  );

  // refresh saat (re)connect: menangkap perubahan playlist yang terlewat selama terputus
  const status = useDeviceSocket(deviceId, { onMessage, onOpen: refresh });

  if (notFound || status === 'unregistered') {
    return (
      <Setup
        initialError="Device tidak ditemukan. Periksa ID-nya di dashboard."
        onSubmit={(id) => {
          saveDeviceId(id);
          location.assign(location.pathname);
        }}
      />
    );
  }

  const hasContent = pushed || playlist.length > 0;
  return (
    <div className="screen">
      {hasContent ? (
        <Player playlist={playlist} pushed={pushed} onPushEnd={() => setPushed(null)} />
      ) : (
        <div className="center-screen idle">
          <h1>{device?.nama ?? 'Signage Player'}</h1>
          <p className="muted">Belum ada content. Atur playlist di dashboard.</p>
        </div>
      )}
      <StatusOverlay status={status} deviceName={device?.nama} onReset={onReset} />
    </div>
  );
}

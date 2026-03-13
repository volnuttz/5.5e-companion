// PeerJS communication layer for DnD Companion
// DM acts as host, players connect via WebRTC data channels

const DND_PEER_PREFIX = 'dnd-companion-';

// --- DM (Host) Side ---

function createDMPeer(roomId) {
  const peerId = DND_PEER_PREFIX + roomId;
  const connections = new Map(); // peerId -> { conn, playerName, characterId }
  let peer = null;
  let _onPlayerConnect = null;
  let _onPlayerDisconnect = null;
  let _onPlayerMessage = null;

  function init() {
    return new Promise((resolve, reject) => {
      peer = new Peer(peerId);
      peer.on('open', (id) => {
        console.log('[Peer] DM peer open:', id);
        resolve(id);
      });
      peer.on('error', (err) => {
        console.error('[Peer] DM error:', err);
        reject(new Error(err.type === 'unavailable-id' ? 'Room ID already in use. Try refreshing the page.' : 'Connection error: ' + err.type));
      });
      peer.on('connection', (conn) => {
        conn.on('open', () => {
          connections.set(conn.peer, { conn, playerName: null, characterId: null });
          if (_onPlayerConnect) _onPlayerConnect(conn.peer);
        });
        conn.on('data', (data) => {
          if (_onPlayerMessage) _onPlayerMessage(conn.peer, data);
        });
        conn.on('close', () => {
          const info = connections.get(conn.peer);
          connections.delete(conn.peer);
          if (_onPlayerDisconnect) _onPlayerDisconnect(conn.peer, info);
        });
        conn.on('error', () => {
          const info = connections.get(conn.peer);
          connections.delete(conn.peer);
          if (_onPlayerDisconnect) _onPlayerDisconnect(conn.peer, info);
        });
      });
    });
  }

  function broadcastToAll(message) {
    for (const { conn } of connections.values()) {
      try { conn.send(message); } catch (e) {}
    }
  }

  function sendToPlayer(peerId, message) {
    const entry = connections.get(peerId);
    if (entry) {
      try { entry.conn.send(message); } catch (e) {}
    }
  }

  function setPlayerInfo(peerId, playerName, characterId) {
    const entry = connections.get(peerId);
    if (entry) {
      entry.playerName = playerName;
      entry.characterId = characterId;
    }
  }

  function getConnectedPlayers() {
    const players = [];
    for (const [id, entry] of connections) {
      players.push({ peerId: id, playerName: entry.playerName, characterId: entry.characterId });
    }
    return players;
  }

  function broadcastToCharacter(characterId, message) {
    for (const { conn, characterId: cid } of connections.values()) {
      if (cid === characterId) {
        try { conn.send(message); } catch (e) {}
      }
    }
  }

  function destroy() {
    if (peer) {
      peer.destroy();
      peer = null;
    }
    connections.clear();
  }

  return {
    init,
    broadcastToAll,
    sendToPlayer,
    setPlayerInfo,
    getConnectedPlayers,
    broadcastToCharacter,
    destroy,
    onPlayerConnect(cb) { _onPlayerConnect = cb; },
    onPlayerDisconnect(cb) { _onPlayerDisconnect = cb; },
    onPlayerMessage(cb) { _onPlayerMessage = cb; }
  };
}

// --- Player Side ---

function createPlayerPeer(roomId) {
  const hostPeerId = DND_PEER_PREFIX + roomId;
  let peer = null;
  let conn = null;
  let _onMessage = null;
  let _onDisconnect = null;
  let _onConnect = null;

  function connect() {
    return new Promise((resolve, reject) => {
      peer = new Peer();
      peer.on('open', () => {
        conn = peer.connect(hostPeerId, { reliable: true });
        conn.on('open', () => {
          console.log('[Peer] Connected to DM');
          if (_onConnect) _onConnect();
          resolve();
        });
        conn.on('data', (data) => {
          if (_onMessage) _onMessage(data);
        });
        conn.on('close', () => {
          console.log('[Peer] Disconnected from DM');
          if (_onDisconnect) _onDisconnect();
        });
        conn.on('error', (err) => {
          console.error('[Peer] Connection error:', err);
          if (_onDisconnect) _onDisconnect();
        });
      });
      peer.on('error', (err) => {
        console.error('[Peer] Player error:', err);
        reject(err);
      });
    });
  }

  function sendToDM(message) {
    if (conn && conn.open) {
      conn.send(message);
    }
  }

  function destroy() {
    if (peer) {
      peer.destroy();
      peer = null;
    }
    conn = null;
  }

  return {
    connect,
    sendToDM,
    destroy,
    onMessage(cb) { _onMessage = cb; },
    onDisconnect(cb) { _onDisconnect = cb; },
    onConnect(cb) { _onConnect = cb; }
  };
}

window.peerManager = { createDMPeer, createPlayerPeer };

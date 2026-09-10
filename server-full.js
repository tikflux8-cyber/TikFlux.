/**
 * TikFlux Desktop - Unified Server
 * Combines static file serving, API endpoints, and TikTok LIVE service
 */

const express = require('express');
const http = require('http');
const { WebSocketServer, WebSocket } = require('ws');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

// === Configuration ===
const PORT = parseInt(process.env.PORT || '3000', 10);
const APP_DATA = process.env.APP_DATA || path.join(__dirname, 'public');
const USER_DATA = process.env.USER_DATA || path.join(__dirname, 'data');
const SUPPORTERS_FILE = path.join(USER_DATA, 'supporters_data.json');
const ALERT_CATALOG_FILE = path.join(APP_DATA, 'alert_catalog.json');

// === Express App ===
const app = express();
app.use(express.json());

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// === Data Store ===
const widgetSettingsStore = {};
const WIDGET_SETTINGS_KEYS = new Set([
  'top_likes', 'top_gifters', 'social-rotator', 'latest-events',
  'like-overlay', 'follow-overlay', 'like-goal', 'follow-goal',
  'gift-goal', 'donation-goal', 'heart-me-goal',
]);

const SPA_ROUTES = new Set([
  'top-likes', 'top-gifters', 'overlays', 'goals', 'actions',
  'donation-alerts', 'tts', 'chat', 'bot-chat', 'music-player',
  'supporters-leaderboard', 'social-media', 'challenges',
  'link-scenes', 'latest-events', 'stats', 'account', 'app',
  'store', 'alert-store',
  'features', 'pricing', 'guides', 'faq', 'terms', 'privacy',
]);

function loadSupporters() {
  try {
    if (fs.existsSync(SUPPORTERS_FILE)) {
      const data = fs.readFileSync(SUPPORTERS_FILE, 'utf-8');
      // Remove BOM if present
      const clean = data.charCodeAt(0) === 0xFEFF ? data.slice(1) : data;
      return JSON.parse(clean);
    }
  } catch (e) {
    console.error('[DATA] Error loading supporters:', e.message);
  }
  return [];
}

function saveSupporters(data) {
  fs.writeFileSync(SUPPORTERS_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

function loadAlertCatalog() {
  try {
    if (fs.existsSync(ALERT_CATALOG_FILE)) {
      return JSON.parse(fs.readFileSync(ALERT_CATALOG_FILE, 'utf-8'));
    }
  } catch (e) {
    console.error('[DATA] Error loading alerts:', e.message);
  }
  return [];
}

// === API Routes ===

// Config endpoint
app.get('/config', (req, res) => {
  res.json({
    supabaseUrl: 'https://placeholder.supabase.co',
    supabaseAnonKey: 'placeholder-key',
    apiUrl: `http://localhost:${PORT}`,
    edgeWsUrl: `ws://localhost:${PORT}/ws`,
    paypalClientId: '',
    paypalMode: 'sandbox',
    paypalPlanIds: {},
  });
});

// Session/Auth
app.get('/api/session', (req, res) => {
  res.json({
    ok: true,
    session: {
      authenticated: true,
      user: { id: '550e8400-e29b-41d4-a716-446655440000', email: 'local@tikflux.local' }
    }
  });
});

app.get('/api/dashboard/session', (req, res) => {
  res.json({
    ok: true,
    authenticated: true,
    userId: '550e8400-e29b-41d4-a716-446655440000',
    session: {
      user: { id: '550e8400-e29b-41d4-a716-446655440000', email: 'local@tikflux.local' },
      access_token: 'mock-access-token'
    }
  });
});

app.get('/api/subscriptions/status', (req, res) => {
  res.json({
    ok: true,
    hasActiveSubscription: true,
    subscription: { id: 'local', plan: 'pro', status: 'active' }
  });
});

app.get('/api/user/profile', (req, res) => {
  res.json({
    ok: true,
    user: {
      id: '550e8400-e29b-41d4-a716-446655440000',
      email: 'local@tikflux.local',
      user_metadata: { name: 'TikFlux User' }
    }
  });
});

app.get('/api/ban-status', (req, res) => {
  res.json({ ok: true, banned: false });
});

// Dashboard session endpoints (required by module)
const dashboardSessions = new Map();

app.post('/dashboard/session/start', (req, res) => {
  const sessionId = req.body.sessionId || Date.now().toString(36) + Math.random().toString(36).slice(2);
  dashboardSessions.set(sessionId, {
    id: sessionId,
    userId: '550e8400-e29b-41d4-a716-446655440000',
    startedAt: Date.now(),
    lastHeartbeat: Date.now(),
    active: true
  });
  res.json({ ok: true, success: true, sessionId, isCurrentSessionActive: true, activeSessionId: sessionId });
});

app.get('/dashboard/session/status', (req, res) => {
  const sessionId = req.query.sessionId || '';
  const session = dashboardSessions.get(sessionId);
  if (session) {
    session.lastHeartbeat = Date.now();
    res.json({ ok: true, activeSessionId: sessionId, isCurrentSessionActive: true, active: true });
  } else {
    res.json({ ok: true, activeSessionId: null, isCurrentSessionActive: false, active: false });
  }
});

app.post('/dashboard/session/heartbeat', (req, res) => {
  const sessionId = req.body.sessionId || '';
  const session = dashboardSessions.get(sessionId);
  if (session) {
    session.lastHeartbeat = Date.now();
    res.json({ ok: true, success: true, isCurrentSessionActive: true, activeSessionId: sessionId });
  } else {
    res.json({ ok: true, success: true, isCurrentSessionActive: false });
  }
});

app.post('/dashboard/session/revoke', (req, res) => {
  const sessionId = req.body.sessionId || '';
  dashboardSessions.delete(sessionId);
  res.json({ ok: true, success: true });
});

// Widget settings
app.get('/api/widget/settings', (req, res) => {
  const key = req.query.widget;
  if (key && WIDGET_SETTINGS_KEYS.has(key)) {
    res.json({ ok: true, success: true, key, settings: widgetSettingsStore[key] || {} });
  } else {
    res.json({ ok: true, success: true, settings: {} });
  }
});

app.get('/api/widget/settings/:key', (req, res) => {
  const key = req.params.key;
  res.json({ ok: true, success: true, key, settings: widgetSettingsStore[key] || {} });
});

app.post('/api/widget/settings', (req, res) => {
  const key = req.body.widget || req.body.key;
  if (key) {
    widgetSettingsStore[key] = req.body;
    // Broadcast theme_changed to all connected WebSocket clients
    broadcast('theme_changed', { widget: key, ...req.body });
    res.json({ ok: true, success: true, key });
  } else {
    res.json({ ok: true, success: true });
  }
});

app.post('/api/widget/settings/:key', (req, res) => {
  widgetSettingsStore[req.params.key] = req.body;
  res.json({ ok: true, success: true, key: req.params.key });
});

// Goal progress
app.get('/api/widget/goal-progress', (req, res) => {
  res.json({ ok: true, progress: widgetSettingsStore._goal_progress || {} });
});

app.get('/api/goal-progress', (req, res) => {
  res.json({ ok: true, progress: widgetSettingsStore._goal_progress || {} });
});

app.post('/api/widget/goal-progress', (req, res) => {
  widgetSettingsStore._goal_progress = req.body;
  res.json({ ok: true });
});

app.post('/api/goal-progress', (req, res) => {
  widgetSettingsStore._goal_progress = req.body;
  res.json({ ok: true });
});

app.post('/api/widget/goal-reset', (req, res) => {
  widgetSettingsStore._goal_progress = {};
  res.json({ ok: true });
});

// Supporters leaderboard
app.get('/api/supporters-leaderboard', (req, res) => {
  const page = parseInt(req.query.page || '1', 10);
  const limit = parseInt(req.query.limit || '20', 10);
  const search = (req.query.search || '').toLowerCase();
  let all = loadSupporters();
  if (search) all = all.filter(s => (s.name || '').toLowerCase().includes(search));
  const total = all.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const start = (page - 1) * limit;
  const items = all.slice(start, start + limit);
  res.json({ ok: true, supporters: items, page, totalPages, totalCount: total });
});

app.get('/api/supporters-leaderboard/all', (req, res) => {
  res.json(loadSupporters());
});

app.post('/api/supporters-leaderboard', (req, res) => {
  const supporter = {
    id: Date.now().toString(),
    name: req.body.name || 'Anonymous',
    diamonds: req.body.diamonds || 0,
    avatar: req.body.avatar || '',
    timestamp: req.body.timestamp || Math.floor(Date.now() / 1000),
  };
  const data = loadSupporters();
  data.push(supporter);
  saveSupporters(data);
  res.json({ ok: true, supporter });
});

app.post('/api/supporters-leaderboard/:id', (req, res) => {
  const data = loadSupporters();
  const s = data.find(x => x.id === req.params.id);
  if (s) {
    s.diamonds = (s.diamonds || 0) + (req.body.diamonds || 0);
    saveSupporters(data);
    res.json({ ok: true, supporter: s });
  } else {
    res.status(404).json({ error: 'not found' });
  }
});

app.delete('/api/supporters-leaderboard/all', (req, res) => {
  saveSupporters([]);
  res.json({ ok: true });
});

app.delete('/api/supporters-leaderboard/:id', (req, res) => {
  const data = loadSupporters().filter(s => s.id !== req.params.id);
  saveSupporters(data);
  res.json({ ok: true });
});

// Alert Library (kept: loadAlertCatalog is used for real data)
app.get('/api/alert-library', (req, res) => {
  const category = req.query.category;
  let alerts = loadAlertCatalog();
  if (category && category !== 'all') {
    alerts = alerts.filter(a => a.category === category);
  }
  res.json(alerts);
});

app.get('/api/alert-library/store/owned', (req, res) => {
  const alerts = loadAlertCatalog();
  const owned = alerts.filter(a => a.is_owned).map(a => a.id);
  res.json({ ok: true, owned });
});

app.get('/api/alert-library/store/orders', (req, res) => {
  res.json({ ok: true, orders: [] });
});

app.post('/api/alert-library/attach', (req, res) => {
  const alertId = req.body.alertId;
  const alerts = loadAlertCatalog();
  const alert = alerts.find(a => a.id === alertId);
  if (alert) {
    res.json({
      ok: true, attached: true, alertId,
      library_alert_id: alertId,
      video_filename: alert.name || 'Alert',
      duration_seconds: alert.duration_seconds || 5,
      preview_url: alert.preview_url || '',
      thumbnail_url: alert.thumbnail_url || '',
      name: alert.name || ''
    });
  } else {
    res.json({ ok: true, attached: true, alertId, library_alert_id: alertId });
  }
});

app.get('/api/alert-library/overlay/:id', (req, res) => res.json({ ok: true, overlay: null }));
app.post('/api/alert-library/overlay/:id', (req, res) => res.json({ ok: true, success: true }));

app.get('/api/alert-library/previews/:id', (req, res) => res.json({ ok: true, preview: null }));
app.post('/api/alert-library/store/checkout', (req, res) => res.json({ ok: true, success: true, redirectUrl: '' }));
app.post('/api/alert-library/store/capture', (req, res) => res.json({ ok: true, success: true }));

// Initial data - returns leaderboard data for widgets + connection state
app.get('/api/widget/initial-data/:id/:type', (req, res) => {
  const type = req.params.type;
  const baseData = {
    ok: true,
    success: true,
    connected: connectionState === 'connected',
    streamerId: currentStreamerId,
    stateRevision,
    hasActiveSession: connectionState === 'connected',
  };
  if (type === 'top_likes') {
    const top10 = [...likeLeaderboard.values()].sort((a, b) => b.score - a.score).slice(0, 10);
    return res.json({ ...baseData, data: top10, top10 });
  }
  if (type === 'top_gifters') {
    const top50 = [...giftLeaderboard.values()].sort((a, b) => b.score - a.score).slice(0, 50);
    return res.json({ ...baseData, data: top50, top50 });
  }
  if (type === 'top_supporters') {
    const supporters = loadSupporters().slice(0, 20);
    return res.json({ ...baseData, data: supporters, supporters });
  }
  if (type === 'top_combined') {
    const top10 = [...likeLeaderboard.values()].sort((a, b) => b.score - a.score).slice(0, 10);
    const top50 = [...giftLeaderboard.values()].sort((a, b) => b.score - a.score).slice(0, 50);
    const combined = new Map();
    for (const e of top10) combined.set(e.uniqueId, { ...e, likeScore: e.score, giftScore: 0 });
    for (const e of top50) {
      if (combined.has(e.uniqueId)) combined.get(e.uniqueId).giftScore = e.score;
      else combined.set(e.uniqueId, { ...e, likeScore: 0, giftScore: e.score });
    }
    const top3 = [...combined.values()].sort((a, b) => (b.likeScore + b.giftScore) - (a.likeScore + a.giftScore)).slice(0, 3);
    return res.json({ ...baseData, data: top3, top3, topLikes: top10, topGifters: top50 });
  }
  res.json({ ...baseData, data: null });
});
app.get('/api/widget/initial-data/:id', (req, res) => {
  res.json({ ok: true, connected: connectionState === 'connected', streamerId: currentStreamerId, data: null });
});

// Donation alerts
app.get('/api/donation-alerts/rules', (req, res) => res.json({ ok: true, rules: [] }));
app.post('/api/donation-alerts/rules', (req, res) => res.json({ ok: true, success: true }));
app.get('/api/donation-alerts/video', (req, res) => res.json({ ok: true, video: null }));
app.post('/api/donation-alerts/video', (req, res) => res.json({ ok: true, success: true }));

// AI Action Assistant
app.post('/api/ai/action-assistant/chat', (req, res) => res.json({ ok: true, response: '', message: '' }));
app.post('/api/ai/action-assistant/save', (req, res) => res.json({ ok: true, success: true }));
app.post('/api/ai/action-assistant/delete', (req, res) => res.json({ ok: true, success: true }));

// Streamlabs
app.get('/api/streamlabs/status', (req, res) => res.json({ ok: true, connected: false }));
app.post('/api/streamlabs/connect', (req, res) => res.json({ ok: true, success: true }));
app.post('/api/streamlabs/disconnect', (req, res) => res.json({ ok: true, success: true }));
app.post('/api/streamlabs/respect-tiktok-actions', (req, res) => res.json({ ok: true, success: true }));

// Subscriptions
app.post('/api/subscriptions/activate', (req, res) => res.json({ ok: true, success: true, subscription: { plan: 'pro', status: 'active' } }));
app.post('/api/subscriptions/cancel-auto-renew', (req, res) => res.json({ ok: true, success: true }));

// TikTok service API endpoints (must be before catch-all)
app.get('/api/status', (req, res) => res.json(getStatus()));

app.post('/api/connect', (req, res) => {
  const { uniqueId } = req.body;
  if (!uniqueId) return res.status(400).json({ error: 'uniqueId required' });
  res.json(connectToTikTok(uniqueId));
});

app.post('/api/disconnect', (req, res) => {
  res.json(disconnectFromTikTok());
});

app.post('/api/leaderboard/reset', (req, res) => {
  resetLikeLeaderboard();
  res.json({ success: true });
});

// ======== ACTIONS SYSTEM ========
app.get('/api/actions/screens-status/:uid', (req, res) => {
  res.json({ ok: true, screens: [
    { screen: 'like', online: true },
    { screen: 'follow', online: true },
    { screen: 'gift', online: true },
    { screen: 'subscribe', online: true },
    { screen: 'share', online: true },
    { screen: 'join', online: true }
  ]});
});
app.post('/api/actions/upload-video', (req, res) => res.json({ ok: true, success: true, url: '' }));
app.post('/api/actions/upload-video/sign', (req, res) => res.json({ ok: true, uploadUrl: '', key: '' }));
app.get('/api/internal/actions-dashboard-bundle', (req, res) => res.json({ ok: true, actions: [], settings: {} }));
app.post('/api/internal/actions-overlay/clear', (req, res) => res.json({ ok: true }));
app.post('/api/internal/action-alert-replay', (req, res) => res.json({ ok: true }));
app.post('/api/internal/overlay-test-alert', (req, res) => res.json({ ok: true }));
app.get('/api/internal/country-lookup/search', (req, res) => res.json({ ok: true, country: null }));
app.post('/api/internal/botchat-cache-invalidate', (req, res) => res.json({ ok: true }));
app.get('/api/dashboard/country-lookups', (req, res) => res.json({ ok: true, data: [] }));
app.get('/api/dashboard/action-alert-history', (req, res) => res.json({ ok: true, entries: [] }));
app.post('/api/overlay-settings/actions', (req, res) => res.json({ ok: true, success: true }));

// ======== DONATION ALERTS CRUD (kept: old section has GET/POST rules/video, this adds more) ========
app.get('/api/donation-alerts/rules/:id', (req, res) => res.json({ ok: true, rule: null }));
app.put('/api/donation-alerts/rules/:id', (req, res) => res.json({ ok: true, success: true }));
app.delete('/api/donation-alerts/rules/:id', (req, res) => res.json({ ok: true, success: true }));
app.post('/api/donation-alerts/upload-video', (req, res) => res.json({ ok: true, success: true, url: '' }));
app.delete('/api/donation-alerts/video', (req, res) => res.json({ ok: true, success: true }));
app.get('/api/donation-alerts/overlay-status/:uid', (req, res) => res.json({ ok: true, online: true }));

// ======== WIDGET SETTINGS (all widgets) ========
app.get('/api/widget/social-rotator/settings', (req, res) => res.json({ ok: true, slides: [] }));
app.get('/api/widget/like-goal/:uid/settings', (req, res) => res.json({ ok: true, goal: 1000, current: 0, theme: 'bar', colors: {} }));
app.get('/api/widget/follow-goal/:uid/settings', (req, res) => res.json({ ok: true, goal: 500, current: 0, theme: 'bar', colors: {} }));
app.get('/api/widget/gift-goal/:uid/settings', (req, res) => res.json({ ok: true, goal: 100, current: 0, theme: 'bar', colors: {} }));
app.get('/api/widget/donation-goal/:uid/settings', (req, res) => res.json({ ok: true, goal: 50, current: 0, theme: 'bar', colors: {} }));
app.get('/api/widget/heart-me-goal/:uid/settings', (req, res) => res.json({ ok: true, goal: 500, current: 0, theme: 'bar', colors: {} }));
app.get('/api/widget/like-overlay/settings', (req, res) => res.json({ ok: true, style: 'default', duration: 3 }));
app.get('/api/widget/follow-overlay/settings', (req, res) => res.json({ ok: true, style: 'default', duration: 5 }));
app.get('/api/widget/highest-gift/settings', (req, res) => res.json({ ok: true, enabled: true }));
app.get('/api/widget/heart-fountain/settings', (req, res) => res.json({ ok: true, enabled: true }));
app.get('/api/widget/firework/settings', (req, res) => res.json({ ok: true, enabled: true }));
app.get('/api/widget/latest-events/settings', (req, res) => res.json({ ok: true, maxEvents: 10 }));
app.get('/api/widget/music-player/:uid/settings', (req, res) => res.json({ ok: true, enabled: false, playlist: [] }));
app.get('/api/widget/coin-jar/:uid/settings', (req, res) => res.json({ ok: true, theme: 'classic', goal: 100 }));
app.get('/api/widget/scene/settings', (req, res) => res.json({ ok: true, scenes: [] }));
app.get('/api/widget/total-follow/snapshot', (req, res) => res.json({ ok: true, data: { totalFollowers: 0 } }));
app.get('/api/widget/top-likes/reduction', (req, res) => res.json({ ok: true, percent: 0 }));
app.get('/api/widget/supporters-challenge/settings', (req, res) => res.json({ ok: true, enabled: false }));
app.get('/api/widget/gift-challenge/settings', (req, res) => res.json({ ok: true, enabled: false }));
app.get('/api/widget/team-scores/settings', (req, res) => res.json({ ok: true, teams: [] }));
app.get('/api/widget/subathon/settings', (req, res) => res.json({ ok: true, enabled: false, time: 0 }));
app.get('/api/widget/subathon/snapshot', (req, res) => res.json({ ok: true, time: 0, running: false }));

// ======== WIDGET SETTINGS POST/PUT ========
app.post('/api/widget/reset', (req, res) => res.json({ ok: true, success: true }));
app.post('/api/widget/actions-slider/broadcast', (req, res) => res.json({ ok: true }));
app.put('/api/widget/gift-challenge/settings', (req, res) => res.json({ ok: true, success: true }));
app.put('/api/widget/supporters-challenge/settings', (req, res) => res.json({ ok: true, success: true }));
app.put('/api/widget/team-scores/settings', (req, res) => res.json({ ok: true, success: true }));
app.post('/api/widget/team-scores/control', (req, res) => res.json({ ok: true, success: true }));
app.post('/api/widget/challenge/control', (req, res) => res.json({ ok: true, success: true }));
app.put('/api/widget/subathon/settings', (req, res) => res.json({ ok: true, success: true }));
app.post('/api/widget/subathon/control', (req, res) => res.json({ ok: true, success: true }));

// ======== TEST EVENTS ========
app.get('/api/widget/test-event/:id', (req, res) => res.json({ ok: true, success: true }));
app.post('/api/widget/test-event/:id', (req, res) => {
  const id = req.params.id;
  const user = (req.body && req.body.user && req.body.user.uniqueId) ? req.body.user : generateMockUser();
  if (!user.avatar) user.avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.nickname || user.uniqueId)}&background=random&color=fff&size=128`;
  if (id === 'like') {
    const count = Math.floor(Math.random() * 50) + 1;
    updateLikeLeaderboard(user, count);
    broadcast('like', { user, likeCount: count, total: Math.floor(Math.random() * 10000) });
    broadcastToAll('latest_event_update', { eventType: 'like', event: { uniqueId: user.uniqueId, nickname: user.nickname, avatar: user.avatar } });
    broadcastLeaderboard();
  } else if (id === 'follow') {
    broadcast('follow_overlay_update', { user });
    broadcastToAll('latest_event_update', { eventType: 'follow', event: { uniqueId: user.uniqueId, nickname: user.nickname, avatar: user.avatar } });
  } else if (id.includes('gift') || id === 'coin-jar' || id === 'firework') {
    const diamonds = Math.floor(Math.random() * 100) + 1;
    const giftNames = ['Rose', 'Heart', 'Star', 'Lion', 'Universe', 'Galaxy', 'Diamond'];
    const giftName = giftNames[Math.floor(Math.random() * giftNames.length)];
    updateGiftLeaderboard(user, diamonds);
    broadcast('gift_overlay_update', { user, gift: { name: giftName, diamondCount: diamonds, count: 1 } });
    broadcastToAll('latest_event_update', { eventType: 'gift', event: { uniqueId: user.uniqueId, nickname: user.nickname, avatar: user.avatar, gift: giftName, diamonds: diamonds } });
    broadcastLeaderboard();
  } else if (id === 'latest-event' || id === 'latest-supporter') {
    broadcastToAll('latest_event_update', { eventType: 'like', event: { uniqueId: user.uniqueId, nickname: user.nickname, avatar: user.avatar } });
  } else {
    broadcastToAll('latest_event_update', { eventType: id, event: { uniqueId: user.uniqueId, nickname: user.nickname, avatar: user.avatar } });
  }
  res.json({ ok: true, success: true });
});

// ======== CENTRALIZED STATE ENDPOINT ========
// Any widget can call this to get current connection state, leaderboard, room info
app.get('/api/state', (req, res) => {
  const top10Likes = [...likeLeaderboard.values()].sort((a, b) => b.score - a.score).slice(0, 10);
  const top50Gifts = [...giftLeaderboard.values()].sort((a, b) => b.score - a.score).slice(0, 50);
  const supporters = loadSupporters();
  res.json({
    ok: true,
    connected: connectionState === 'connected',
    state: connectionState,
    streamerId: currentStreamerId,
    profile: streamerProfile,
    stateRevision,
    leaderboards: {
      topLikes: top10Likes,
      topGifters: top50Gifts,
    },
    supporters: supporters.slice(0, 50),
    room: {
      roomId: currentStreamerId,
      connected: connectionState === 'connected',
      state: connectionState,
    },
  });
});

// Stream status (for widgets to check connection state)
app.get('/stream/state', (req, res) => {
  const top10Likes = [...likeLeaderboard.values()].sort((a, b) => b.score - a.score).slice(0, 10);
  const top50Gifts = [...giftLeaderboard.values()].sort((a, b) => b.score - a.score).slice(0, 50);
  res.json({
    ok: true,
    connected: connectionState === 'connected',
    streamerId: currentStreamerId,
    state: connectionState,
    stateRevision,
    topLikes: top10Likes,
    topGifters: top50Gifts,
  });
});
app.get('/api/stats/top-likes', (req, res) => {
  const data = [...likeLeaderboard.values()].sort((a, b) => b.score - a.score).slice(0, 50);
  res.json({ ok: true, data });
});
app.get('/api/stats/top-gifters', (req, res) => {
  const data = [...giftLeaderboard.values()].sort((a, b) => b.score - a.score).slice(0, 50);
  res.json({ ok: true, data });
});
app.get('/api/stats/top-sharers', (req, res) => res.json({ ok: true, data: [] }));
app.get('/api/stats/streamer-profile', (req, res) => res.json({ ok: true, profile: { uniqueId: currentStreamerId || '', nickname: currentStreamerId || '', avatar: '' } }));
app.get('/api/stats/settings', (req, res) => res.json({ ok: true, settings: {} }));
app.post('/api/stats/settings', (req, res) => res.json({ ok: true, success: true }));
app.get('/api/stats/share', (req, res) => res.json({ ok: true, data: {} }));
app.post('/api/stats/share', (req, res) => res.json({ ok: true, success: true }));
app.get('/api/stats/media-proxy', (req, res) => res.json({ ok: true, data: null }));

// ======== SUPPORTERS LEADERBOARD ========
app.get('/api/supporters-leaderboard', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const search = req.query.search || '';
  const all = [...likeLeaderboard.values(), ...giftLeaderboard.values()];
  const filtered = search ? all.filter(s => s.nickname && s.nickname.includes(search)) : all;
  const sorted = filtered.sort((a, b) => (b.score || 0) - (a.score || 0));
  const start = (page - 1) * limit;
  const supporters = sorted.slice(start, start + limit);
  res.json({ ok: true, supporters, page, totalPages: Math.ceil(sorted.length / limit), totalCount: sorted.length });
});
app.get('/api/supporters-leaderboard/all', (req, res) => {
  const all = [...likeLeaderboard.values(), ...giftLeaderboard.values()].sort((a, b) => (b.score || 0) - (a.score || 0));
  res.json({ ok: true, supporters: all, totalCount: all.length });
});
app.post('/api/supporters-leaderboard', (req, res) => res.json({ ok: true, success: true }));
app.post('/api/supporters-leaderboard/:id', (req, res) => res.json({ ok: true, success: true }));

// ======== TIKTOK DATA ========
app.get('/api/tiktok/gifts', (req, res) => res.json({ ok: true, gifts: [
  { id: 1, name: 'Rose', diamondCount: 1, imageUrl: '' },
  { id: 2, name: 'Heart', diamondCount: 5, imageUrl: '' },
  { id: 3, name: 'Star', diamondCount: 10, imageUrl: '' },
  { id: 4, name: 'Lion', diamondCount: 50, imageUrl: '' },
  { id: 5, name: 'Universe', diamondCount: 100, imageUrl: '' }
]}));
app.get('/api/tiktok/emotes', (req, res) => res.json({ ok: true, emotes: [] }));

// ======== TTS ========
app.get('/api/tts/settings', (req, res) => res.json({ ok: true, enabled: true, volume: 80, rate: 1, voice: 'default' }));

// ======== GOAL PROGRESS POST (kept: stores in widgetSettingsStore) ========
app.post('/api/widget/goal-progress', (req, res) => {
  widgetSettingsStore._goal_progress = req.body;
  res.json({ ok: true, success: true });
});
app.post('/api/goal-progress', (req, res) => {
  widgetSettingsStore._goal_progress = req.body;
  res.json({ ok: true, success: true });
});
app.post('/api/widget/goal-reset', (req, res) => {
  widgetSettingsStore._goal_progress = {};
  res.json({ ok: true, success: true });
});

// Catch-all API - return meaningful responses instead of just {ok:true}
app.all('/api/*', (req, res) => {
  const p = req.path;
  if (p.includes('/auth/')) return res.json({ ok: true, session: { user: { id: '550e8400-e29b-41d4-a716-446655440000' } } });
  if (p.includes('/settings')) return res.json({ ok: true, success: true, settings: {} });
  if (p.includes('/widget/')) return res.json({ ok: true, success: true, data: null });
  res.json({ ok: true, success: true });
});

// Catch-all dashboard endpoints
app.all('/dashboard/*', (req, res) => {
  res.json({ ok: true, success: true });
});

// === Avatar Proxy ===
app.get('/proxy/avatar', async (req, res) => {
  const url = req.query.url;
  if (!url) {
    const name = req.query.name || '?';
    const bg = req.query.bg || '6366f1';
    const sz = parseInt(req.query.size) || 128;
    return res.redirect(`https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${bg}&color=fff&size=${sz}&bold=true`);
  }
  try {
    const fetchOptions = {
      headers: {
        'Referer': 'https://www.tiktok.com/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'image',
        'Sec-Fetch-Mode': 'no-cors',
        'Sec-Fetch-Site': 'cross-site',
      }
    };
    let response;
    try {
      response = await fetch(url, fetchOptions);
    } catch (e) {
      response = await fetch(url, { redirect: 'follow' });
    }
    if (!response.ok) {
      return res.status(502).type('image/svg+xml').send('<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48"><circle cx="24" cy="24" r="22" fill="#333"/><text x="24" y="30" text-anchor="middle" fill="#888" font-size="12">?</text></svg>');
    }
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    const buffer = Buffer.from(await response.arrayBuffer());
    res.send(buffer);
  } catch (e) {
    res.status(502).type('image/svg+xml').send('<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48"><circle cx="24" cy="24" r="22" fill="#333"/></svg>');
  }
});

// === Static Files ===
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.webp': 'image/webp',
  '.map': 'application/json',
  '.txt': 'text/plain',
};

// Widget ENV_CONFIG injection script
const WIDGET_ENV_CONFIG = `<script>window.ENV_CONFIG={API_URL:'http://localhost:3000',EDGE_WS_URL:'ws://localhost:3000/ws',SUPABASE_URL:'https://placeholder.supabase.co',SUPABASE_ANON_KEY:'placeholder-key'};</script>`;
const AUTH_BYPASS_SCRIPT = `
<script>
(function(){
  var UID='550e8400-e29b-41d4-a716-446655440000';
  var MOCK_USER={id:UID,email:'user@tikflux.local',user_metadata:{username:'TikFluxUser',full_name:'TikFlux User',avatar_url:''},created_at:'2025-01-01T00:00:00Z'};
  var MOCK_SESSION={user:MOCK_USER,access_token:'mock-access-token',refresh_token:'mock-refresh-token',expires_at:Date.now()+86400000,expires_in:86400,token_type:'bearer'};
  var MOCK_SUB={hasActiveSubscription:true,subscription:{id:'local',plan:'pro',status:'active',created_at:'2025-01-01T00:00:00Z'}};

  window.hasActiveSubscription=true;
  window.TIKOVERLAY_USER_ID=UID;
  window.DEBUG=false;
  window._tikfluxReady=true;
  window._tikfluxUser=MOCK_USER;
  window._tikfluxSession=MOCK_SESSION;

  window.showBannedScreen=function(){};
  window.showToast=function(){};
  window.showToastNotification=function(){};

  // === 1. Global fetch interceptor ===
  var _origFetch=window.fetch;
  window.fetch=function(url,opts){
    var u=typeof url==='string'?url:(url&&url.url?url.url:'');
    if(!u||!u.startsWith('/'))return _origFetch.apply(this,arguments);
    if(u==='/config')return Promise.resolve({ok:true,json:function(){return{supabaseUrl:'https://placeholder.supabase.co',supabaseAnonKey:'placeholder-key',apiUrl:location.origin,edgeWsUrl:'ws://'+location.host+'/ws',paypalClientId:'',paypalMode:'sandbox',paypalPlanIds:{}}}});
    if(u.includes('/stream/status'))return Promise.resolve({ok:true,json:function(){return{ok:true,state:'disconnected',uniqueId:null,reason:null,source:'local',connected:false,mock:false,streamerId:null}}});
    if(u.includes('/api/subscriptions/status')||u.includes('/api/subscription'))return Promise.resolve({ok:true,json:function(){return{ok:true,...MOCK_SUB}}});
    if(u==='/api/session'||u==='/api/dashboard/session'||u.includes('/api/dashboard/session/'))return Promise.resolve({ok:true,json:function(){return{ok:true,authenticated:true,userId:UID,session:MOCK_SESSION,user:MOCK_USER}}});
    if(u.includes('/api/user/profile'))return Promise.resolve({ok:true,json:function(){return{ok:true,user:MOCK_USER}}});
    if(u.includes('/api/ban-status'))return Promise.resolve({ok:true,json:function(){return{ok:true,banned:false}}});
    return _origFetch.apply(this,arguments);
  };

  // === 2. Create Supabase client factory ===
  function makeMockClient(){
    var client={auth:{},from:function(){return{select:function(){return{data:[],error:null}}}}};
    client.auth.getSession=function(){return Promise.resolve({data:{session:MOCK_SESSION},error:null})};
    client.auth.getUser=function(){return Promise.resolve({data:{user:MOCK_USER},error:null})};
    client.auth.signOut=function(){return Promise.resolve({error:null})};
    client.auth.onAuthStateChange=function(cb){
      setTimeout(function(){try{cb('SIGNED_IN',MOCK_SESSION)}catch(e){}},10);
      setTimeout(function(){try{cb('INITIAL_SESSION',MOCK_SESSION)}catch(e){}},30);
      return{data:{subscription:{unsubscribe:function(){}}}};
    };
    client.auth.exchangeCodeForSession=function(){return Promise.resolve({data:{session:MOCK_SESSION},error:null})};
    client.auth.setSession=function(){return Promise.resolve({data:{session:MOCK_SESSION},error:null})};
    client.auth.getSession=function(){return Promise.resolve({data:{session:MOCK_SESSION},error:null})};
    client.auth.updateUser=function(){return Promise.resolve({data:{user:MOCK_USER},error:null})};
    client.auth.signInWithPassword=function(){return Promise.resolve({data:{session:MOCK_SESSION,user:MOCK_USER},error:null})};
    client.auth.signInWithOtp=function(){return Promise.resolve({data:{},error:null})};
    client.auth.signUp=function(){return Promise.resolve({data:{session:MOCK_SESSION,user:MOCK_USER},error:null})};
    client.auth.resetPasswordForEmail=function(){return Promise.resolve({error:null})};
    client.auth.admin={getUserById:function(){return Promise.resolve({data:{user:MOCK_USER},error:null})}};
    return client;
  }

  // === 3. Override createSupabaseBrowserClient ===
  window.createSupabaseBrowserClient=function(){return makeMockClient()};

  // === 4. Patch window.supabase.createClient ===
  function patchSupabase(){
    if(!window.supabase)return;
    if(window.supabase._tikfluxDone)return;
    if(window.supabase.createClient){
      var _orig=window.supabase.createClient.bind(window.supabase);
      window.supabase.createClient=function(url,key,opts){
        return makeMockClient();
      };
      window.supabase._tikfluxDone=true;
    }
  }
  patchSupabase();
  var patchIV=setInterval(function(){patchSupabase()},20);

  // === 5. Patch authManager when it appears ===
  function patchAM(){
    var am=window.authManager;
    if(!am)return;
    if(am._tikfluxDone)return;
    am._tikfluxDone=true;
    am.initialized=true;
    am.supabaseClient=makeMockClient();
    am.cachedSession=MOCK_SESSION;
    am.cachedUser=MOCK_USER;
    am.isAuthenticated=function(){return Promise.resolve(true)};
    am.getSession=function(){return Promise.resolve({session:MOCK_SESSION,error:null})};
    am.getUser=function(){return Promise.resolve({user:MOCK_USER,error:null})};
    am.getAccessToken=function(){return Promise.resolve({token:'mock-access-token',error:null})};
    am.getSubscription=function(){return Promise.resolve(MOCK_SUB)};
    am.hasActiveSubscription=function(){return Promise.resolve(true)};
    am.signOut=function(){return Promise.resolve({error:null})};
    am.onAuthStateChange=function(cb){setTimeout(function(){cb('SIGNED_IN',MOCK_SESSION)},10);return{data:{subscription:{unsubscribe:function(){}}}}};
    am.handleAuthFailure=function(){};
  }
  var amTries=0,amIV=setInterval(function(){amTries++;patchAM();if(amTries>300)clearInterval(amIV)},33);

  // === 6. Define authManager before module loads ===
  // Use Proxy to intercept any property access
  var _amState={initialized:true,supabaseClient:makeMockClient(),cachedSession:MOCK_SESSION,cachedUser:MOCK_USER};
  if(!window.authManager){
    window.authManager=new Proxy(_amState,{
      get:function(t,p){
        if(p==='_tikfluxDone')return false;
        if(p==='isAuthenticated')return function(){return Promise.resolve(true)};
        if(p==='getSession')return function(){return Promise.resolve({session:MOCK_SESSION,error:null})};
        if(p==='getUser')return function(){return Promise.resolve({user:MOCK_USER,error:null})};
        if(p==='getAccessToken')return function(){return Promise.resolve({token:'mock-access-token',error:null})};
        if(p==='getSubscription')return function(){return Promise.resolve(MOCK_SUB)};
        if(p==='hasActiveSubscription')return function(){return Promise.resolve(true)};
        if(p==='signOut')return function(){return Promise.resolve({error:null})};
        if(p==='onAuthStateChange')return function(cb){setTimeout(function(){cb('SIGNED_IN',MOCK_SESSION)},10);return{data:{subscription:{unsubscribe:function(){}}}}};
        if(p==='handleAuthFailure')return function(){};
        if(p==='init')return function(){return Promise.resolve()};
        if(p==='initialized')return true;
        if(p==='supabaseClient')return makeMockClient();
        if(p==='cachedSession')return MOCK_SESSION;
        if(p==='cachedUser')return MOCK_USER;
        if(p==='initPromise')return Promise.resolve();
        return t[p];
      },
      set:function(t,p,v){t[p]=v;return true}
    });
  }

  // === 7. Hide login UI ===
  function hideLogin(){
    ['loginForm','login-form','loginOverlay','loginScreen','authScreen','auth-overlay'].forEach(function(id){
      var el=document.getElementById(id);if(el)el.style.display='none';
    });
    var ac=document.getElementById('accountCardsContainer');if(ac)ac.style.display='';
    var sp=document.getElementById('subscriptionPanel');if(sp)sp.style.display='none';
    document.querySelectorAll('[data-subscription-gate]').forEach(function(el){el.style.pointerEvents='auto';el.style.opacity='1'});
    document.querySelectorAll('.premium-only,.subscription-required,.pro-only').forEach(function(el){el.style.display='';el.style.opacity='1';el.style.pointerEvents='auto'});
  }
  hideLogin();
  for(var d=100;d<=10000;d+=d<1000?200:500)setTimeout(hideLogin,d);
})();
</script>`;

function serveStatic(req, res) {
  let urlPath = decodeURIComponent(req.path).replace(/^\/+/, '');
  
  if (!urlPath || urlPath === '.') urlPath = 'goals.html';
  
  const fullPath = path.join(APP_DATA, urlPath);
  const normalized = path.normalize(fullPath);
  
  if (!normalized.startsWith(APP_DATA)) {
    return res.status(403).end();
  }

  // Check if file exists
  if (fs.existsSync(normalized) && fs.statSync(normalized).isFile()) {
    const ext = path.extname(normalized).toLowerCase();
    const mime = MIME_TYPES[ext] || 'application/octet-stream';
    
    // Inject auth bypass and ENV_CONFIG into HTML files - inject AFTER supabase.min.js
    if (ext === '.html') {
      let html = fs.readFileSync(normalized, 'utf8');
      
      // For widget files: inject ENV_CONFIG and Edge WS script if missing
      // Only skip if ENV_CONFIG is actually ASSIGNED (not just read like window.ENV_CONFIG?.API_URL)
      if (urlPath.startsWith('widgets/') && !html.includes('window.ENV_CONFIG=') && !html.includes('window.ENV_CONFIG =')) {
        html = WIDGET_ENV_CONFIG + '\n' + html;
      }
      
      const supaTag = '<script src="/assets/vendor/supabase/supabase.min.js"></script>';
      if (html.includes(supaTag)) {
        html = html.replace(supaTag, WIDGET_ENV_CONFIG + '\n' + supaTag + '\n' + AUTH_BYPASS_SCRIPT);
      } else if (html.includes('<head>')) {
        html = html.replace('<head>', '<head>' + WIDGET_ENV_CONFIG + AUTH_BYPASS_SCRIPT);
      } else if (html.includes('</body>')) {
        html = html.replace('</body>', WIDGET_ENV_CONFIG + AUTH_BYPASS_SCRIPT + '\n</body>');
      } else {
        html = WIDGET_ENV_CONFIG + AUTH_BYPASS_SCRIPT + html;
      }
      res.setHeader('Content-Type', 'text/html');
      res.send(html);
      return;
    }
    
    res.setHeader('Content-Type', mime);
    fs.createReadStream(normalized).pipe(res);
    return;
  }

  // Special standalone pages (before SPA fallback)
  const segments = urlPath.split('/');
  const SPECIAL_PAGES = { 'top-likes': 'top-likes.html', 'app': 'app.html' };
  // dashboard/terms and dashboard/privacy -> goals.html (SPA handles content)
  if (urlPath === 'dashboard/terms.html' || urlPath === 'dashboard/privacy.html') {
    const goalsPath = path.join(APP_DATA, 'goals.html');
    if (fs.existsSync(goalsPath)) {
      let html = fs.readFileSync(goalsPath, 'utf8');
      const supaTag = '<script src="/assets/vendor/supabase/supabase.min.js"></script>';
      if (html.includes(supaTag)) html = html.replace(supaTag, WIDGET_ENV_CONFIG + '\n' + supaTag + '\n' + AUTH_BYPASS_SCRIPT);
      else if (html.includes('</body>')) html = html.replace('</body>', WIDGET_ENV_CONFIG + AUTH_BYPASS_SCRIPT + '\n</body>');
      res.setHeader('Content-Type', 'text/html');
      res.send(html);
      return;
    }
  }
  if (SPECIAL_PAGES[segments[0]]) {
    const specialPath = path.join(APP_DATA, SPECIAL_PAGES[segments[0]]);
    if (fs.existsSync(specialPath)) {
      let html = fs.readFileSync(specialPath, 'utf8');
      const supaTag = '<script src="/assets/vendor/supabase/supabase.min.js"></script>';
      if (html.includes(supaTag)) html = html.replace(supaTag, WIDGET_ENV_CONFIG + '\n' + supaTag + '\n' + AUTH_BYPASS_SCRIPT);
      else if (html.includes('</body>')) html = html.replace('</body>', WIDGET_ENV_CONFIG + AUTH_BYPASS_SCRIPT + '\n</body>');
      res.setHeader('Content-Type', 'text/html');
      res.send(html);
      return;
    }
  }

  // Download route - serve installer
  if (urlPath === 'download/file') {
    const installerPath = path.join(path.dirname(APP_DATA), 'TikFlux-Setup-1.0.0.exe');
    if (fs.existsSync(installerPath)) {
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Disposition', 'attachment; filename="TikFlux-Setup-1.0.0.exe"');
      fs.createReadStream(installerPath).pipe(res);
      return;
    }
    const desktopPath = path.join(require('os').homedir(), 'Desktop', 'TikFlux-Setup-1.0.0.exe');
    if (fs.existsSync(desktopPath)) {
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Disposition', 'attachment; filename="TikFlux-Setup-1.0.0.exe"');
      fs.createReadStream(desktopPath).pipe(res);
      return;
    }
    res.status(404).json({ error: 'Installer not found' });
    return;
  }

  // SPA routes fallback
  if (SPA_ROUTES.has(urlPath) || SPA_ROUTES.has(urlPath.split('/')[0])) {
    const goalsPath = path.join(APP_DATA, 'goals.html');
    if (fs.existsSync(goalsPath)) {
      let html = fs.readFileSync(goalsPath, 'utf8');
      const supaTag = '<script src="/assets/vendor/supabase/supabase.min.js"></script>';
      if (html.includes(supaTag)) html = html.replace(supaTag, WIDGET_ENV_CONFIG + '\n' + supaTag + '\n' + AUTH_BYPASS_SCRIPT);
      else if (html.includes('</body>')) html = html.replace('</body>', WIDGET_ENV_CONFIG + AUTH_BYPASS_SCRIPT + '\n</body>');
      res.setHeader('Content-Type', 'text/html');
      res.send(html);
      return;
    }
  }

  res.status(404).end();
}

// /stream/* endpoints (frontend expects these - BEFORE static middleware)
app.get('/stream/status', (req, res) => {
  res.json({
    ok: true,
    state: connectionState,
    uniqueId: currentStreamerId || null,
    reason: null,
    source: 'local',
    connected: connectionState === 'connected',
    streamerId: currentStreamerId,
    profile: streamerProfile
  });
});
app.post('/stream/connect', (req, res) => {
  const { uniqueId } = req.body;
  if (!uniqueId) return res.status(400).json({ error: 'uniqueId required' });
  if (connectionState === 'connected' && currentStreamerId === uniqueId) {
    return res.json({ success: true, connected: true, uniqueId, state: 'connected', alreadyConnected: true, streamerId: uniqueId, profile: streamerProfile });
  }
  const result = connectToTikTok(uniqueId);
  res.json({
    ...result,
    state: 'connecting',
    alreadyConnected: false,
    streamerId: uniqueId,
    plan: 'pro',
    subscriptionStatus: 'active'
  });
});
app.post('/stream/disconnect', (req, res) => {
  res.json(disconnectFromTikTok());
});

// Dashboard direct page
app.get('/live', (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.sendFile(path.join(__dirname, 'goals.html'));
});

// Widget direct pages (all with ENV_CONFIG injection)
function serveWidgetPage(widgetPath, res) {
  const fullPath = path.join(APP_DATA, widgetPath);
  if (fs.existsSync(fullPath)) {
    let html = fs.readFileSync(fullPath, 'utf8');
    if (!html.includes('window.ENV_CONFIG=') && !html.includes('window.ENV_CONFIG =')) {
      html = WIDGET_ENV_CONFIG + '\n' + html;
    }
    const supaTag = '<script src="/assets/vendor/supabase/supabase.min.js"></script>';
    if (html.includes(supaTag)) {
      html = html.replace(supaTag, WIDGET_ENV_CONFIG + '\n' + supaTag + '\n' + AUTH_BYPASS_SCRIPT);
    } else if (html.includes('<head>')) {
      html = html.replace('<head>', '<head>' + WIDGET_ENV_CONFIG + AUTH_BYPASS_SCRIPT);
    } else if (html.includes('</body>')) {
      html = html.replace('</body>', WIDGET_ENV_CONFIG + AUTH_BYPASS_SCRIPT + '\n</body>');
    } else {
      html = WIDGET_ENV_CONFIG + AUTH_BYPASS_SCRIPT + html;
    }
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
    return;
  }
  res.status(404).send('Widget not found');
}

app.get('/top-likes', (req, res) => serveWidgetPage('widgets/top-likes/index.html', res));
app.get('/top-gifters', (req, res) => serveWidgetPage('widgets/top-gifters/index.html', res));
app.get('/top-supporters', (req, res) => serveWidgetPage('widgets/top-supporters/index.html', res));
app.get('/top-combined', (req, res) => serveWidgetPage('widgets/top-combined/index.html', res));
app.get('/chat-comments', (req, res) => serveWidgetPage('widgets/chat-comments/index.html', res));
app.get('/like-overlay', (req, res) => serveWidgetPage('widgets/like-overlay/index.html', res));
app.get('/follow-overlay', (req, res) => serveWidgetPage('widgets/follow-overlay/index.html', res));
app.get('/gift-overlay', (req, res) => serveWidgetPage('widgets/gift-overlay/index.html', res));
app.get('/latest-events', (req, res) => serveWidgetPage('widgets/latest-events/index.html', res));
app.get('/coin-jar', (req, res) => serveWidgetPage('widgets/coin-jar/index.html', res));
app.get('/like-goal', (req, res) => serveWidgetPage('widgets/like-goal/index.html', res));
app.get('/follow-goal', (req, res) => serveWidgetPage('widgets/follow-goal/index.html', res));
app.get('/gift-goal', (req, res) => serveWidgetPage('widgets/gift-goal/index.html', res));
app.get('/donation-goal', (req, res) => serveWidgetPage('widgets/goals/donation-goal/index.html', res));
app.get('/heart-me-goal', (req, res) => serveWidgetPage('widgets/heart-me-goal/index.html', res));

// Dashboard direct page (alternative)
app.get('/dashboard-live', (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.sendFile(path.join(__dirname, 'goals.html'));
});

// Serve static files (after all API/dashboard routes)
app.use(serveStatic);

// === HTTP Server + WebSocket ===
const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });

// === TikTok LIVE SDK ===
let TikLiveConnection;
try {
  const sdk = require('@tiktool/live');
  TikLiveConnection = sdk.TikTokLive || sdk.default;
  if (TikLiveConnection) console.log('[SDK] Loaded @tiktool/live');
} catch (e) {
  console.error('[ERROR] @tiktool/live not installed:', e.message);
  TikLiveConnection = null;
}

const API_KEY = process.env.TIKTOK_API_KEY || '';
const LOG_FILE = path.join(USER_DATA, 'events.log');

// === Connection State (REAL ONLY - NO MOCK) ===
let connection = null;
let currentStreamerId = null;
let connectionState = 'disconnected'; // disconnected | connecting | connected | error | offline
let stateRevision = 0;
let reconnectTimer = null;
let liveCheckTimer = null;
let streamerProfile = null; // { uniqueId, nickname, avatar, roomId, viewerCount }

const sessions = new Map();
const likeLeaderboard = new Map();
const giftLeaderboard = new Map();

const avatarFields = ['avatar', 'avatarLargeUrl', 'avatarThumbUrl', 'avatarMediumUrl', 'profilePictureUrl', 'profilePicture', 'avatarUrl', 'roomAvatar'];

function logEvent(type, data) {
  const entry = `[${new Date().toISOString()}] ${type}: ${JSON.stringify(data)}\n`;
  try { fs.appendFileSync(LOG_FILE, entry); } catch (e) {}
  console.log(`[EVENT] ${type}`, JSON.stringify(data).slice(0, 200));
}

function getUserAvatar(user) {
  if (!user) return null;
  if (user.profilePicture) {
    if (typeof user.profilePicture === 'string') return user.profilePicture;
    if (user.profilePicture.url) return user.profilePicture.url;
  }
  for (const field of avatarFields) {
    if (user[field] && typeof user[field] === 'string') return user[field];
  }
  return null;
}

function proxyAvatarUrl(url) {
  if (!url || typeof url !== 'string') return url;
  if (url.includes('tiktokcdn') || url.includes('byteimg')) {
    return `http://localhost:${PORT}/proxy/avatar?url=${encodeURIComponent(url)}`;
  }
  return url;
}

function rewriteAvatars(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(item => rewriteAvatars(item));
  const result = { ...obj };
  for (const field of avatarFields) {
    if (result[field]) {
      if (typeof result[field] === 'string') result[field] = proxyAvatarUrl(result[field]);
      else if (typeof result[field] === 'object') {
        if (result[field].url) result[field].url = proxyAvatarUrl(result[field].url);
        result[field] = rewriteAvatars(result[field]);
      }
    }
  }
  if (result.user) result.user = rewriteAvatars(result.user);
  if (result.sender) result.sender = rewriteAvatars(result.sender);
  if (result.gift) result.gift = rewriteAvatars(result.gift);
  return result;
}

function broadcast(type, data) {
  const msg = JSON.stringify({ type, data: rewriteAvatars(data), ts: Date.now() });
  let sentCount = 0;
  sessions.forEach((clientSet) => {
    clientSet.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        try { client.send(msg); sentCount++; } catch (e) {}
      }
    });
  });
  if (sentCount > 0) console.log(`[BROADCAST] ${type} -> ${sentCount} clients`);
}

function broadcastToAll(type, data) { broadcast(type, data); }

function broadcastStreamState(state, uniqueId) {
  stateRevision++;
  broadcast('stream-state-updated', {
    state, stateRevision, generation: 1, updatedAt: Date.now(), timestamp: Date.now(),
    uniqueId: uniqueId || currentStreamerId, connected: state === 'connected'
  });
}

function broadcastLeaderboard() {
  const top10Likes = [...likeLeaderboard.values()].sort((a, b) => b.score - a.score).slice(0, 10);
  const top50Gifts = [...giftLeaderboard.values()].sort((a, b) => b.score - a.score).slice(0, 50);
  const combined = new Map();
  for (const e of top10Likes) combined.set(e.uniqueId, { ...e, likeScore: e.score, giftScore: 0 });
  for (const e of top50Gifts) {
    if (combined.has(e.uniqueId)) combined.get(e.uniqueId).giftScore = e.score;
    else combined.set(e.uniqueId, { ...e, likeScore: 0, giftScore: e.score });
  }
  const top3 = [...combined.values()].sort((a, b) => (b.likeScore + b.giftScore) - (a.likeScore + a.giftScore)).slice(0, 3);
  broadcastToAll('top_likes_update', { top10: top10Likes });
  broadcastToAll('top_gifters_update', { top50: top50Gifts });
  broadcastToAll('leaderboard_update', { topLikes: top10Likes, topGifts: top50Gifts, topCombined: top3 });
  broadcastToAll('top_rankers_update', { top3 });
}

function updateLikeLeaderboard(user, likeCount) {
  if (!user?.uniqueId) return;
  const entry = likeLeaderboard.get(user.uniqueId) || { uniqueId: user.uniqueId, nickname: user.nickname || user.uniqueId, avatar: getUserAvatar(user), score: 0 };
  entry.score += likeCount || 1;
  if (user.nickname) entry.nickname = user.nickname;
  const avatar = getUserAvatar(user);
  if (avatar) entry.avatar = proxyAvatarUrl(avatar);
  likeLeaderboard.set(user.uniqueId, entry);
}

function updateGiftLeaderboard(user, diamondCount) {
  if (!user?.uniqueId) return;
  const entry = giftLeaderboard.get(user.uniqueId) || { uniqueId: user.uniqueId, nickname: user.nickname || user.uniqueId, avatar: getUserAvatar(user), score: 0 };
  entry.score += diamondCount || 0;
  if (user.nickname) entry.nickname = user.nickname;
  const avatar = getUserAvatar(user);
  if (avatar) entry.avatar = proxyAvatarUrl(avatar);
  giftLeaderboard.set(user.uniqueId, entry);

  // Save to supporters file for persistence
  try {
    let supporters = loadSupporters();
    const idx = supporters.findIndex(s => s.userId === user.uniqueId || s.uniqueId === user.uniqueId);
    const supporterEntry = {
      id: idx >= 0 ? supporters[idx].id : Date.now().toString(),
      userId: user.uniqueId,
      uniqueId: user.uniqueId,
      name: user.nickname || user.uniqueId,
      nickname: user.nickname || user.uniqueId,
      avatar: proxyAvatarUrl(avatar) || '',
      diamonds: entry.score,
      gifts: (idx >= 0 ? (supporters[idx].gifts || 0) : 0) + 1,
      lastGiftAt: new Date().toISOString(),
      createdAt: idx >= 0 ? supporters[idx].createdAt : new Date().toISOString()
    };
    if (idx >= 0) supporters[idx] = supporterEntry;
    else supporters.push(supporterEntry);
    supporters.sort((a, b) => (b.diamonds || 0) - (a.diamonds || 0));
    saveSupporters(supporters);

    // Broadcast supporters update
    broadcastToAll('supporters_update', { supporters: supporters.slice(0, 50) });
  } catch (e) {}
}

function resetLikeLeaderboard() {
  likeLeaderboard.clear();
  broadcastToAll('top_likes_reset', { message: 'Leaderboard reset' });
}

// === TikTok LIVE Connection (REAL ONLY) ===

function checkIfLive(uniqueId) {
  return fetch('https://api.tik.tools/webcast/room_id', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
    body: JSON.stringify({ unique_id: uniqueId }),
    signal: AbortSignal.timeout(8000)
  }).then(r => r.json()).then(d => {
    const alive = d.data?.alive || false;
    const roomId = d.data?.room_id || null;
    const nickname = d.data?.nickname || uniqueId;
    const avatar = d.data?.avatar || null;
    const viewerCount = d.data?.user_count || 0;
    return { alive, roomId, uniqueId, nickname, avatar, viewerCount };
  }).catch(e => {
    console.error(`[LIVE-CHECK] Failed for @${uniqueId}: ${e.message}`);
    return { alive: false, roomId: null, uniqueId, nickname: uniqueId, avatar: null, viewerCount: 0 };
  });
}

function connectReal(uniqueId) {
  if (connection) { try { connection.disconnect(); } catch (e) {} connection = null; }
  connectionState = 'connecting';
  broadcast('connection_status', { connected: false, state: 'connecting', uniqueId });
  broadcastStreamState('connecting', uniqueId);

  console.log(`[REAL] Connecting to @${uniqueId} via sign server...`);
  try {
    connection = new TikLiveConnection({
      uniqueId,
      apiKey: API_KEY,
      autoReconnect: true,
      maxReconnectAttempts: 999
    });

    setupConnectionHandlers(connection, uniqueId);

    connection.connect().then(() => {
      console.log(`[REAL] Connection resolved for @${uniqueId}`);
    }).catch(err => {
      console.error(`[REAL] Connection failed for @${uniqueId}: ${err.message}`);
      connectionState = 'error';
      broadcast('connection_status', { connected: false, state: 'error', uniqueId, error: err.message });
      broadcastStreamState('error', uniqueId);
      connection = null;
      startAutoReconnect(uniqueId);
    });
  } catch (e) {
    console.error(`[REAL] SDK error: ${e.message}`);
    connectionState = 'error';
    broadcast('connection_status', { connected: false, state: 'error', uniqueId, error: e.message });
    broadcastStreamState('error', uniqueId);
    connection = null;
    startAutoReconnect(uniqueId);
  }
}

function startAutoReconnect(uniqueId) {
  if (liveCheckTimer) clearInterval(liveCheckTimer);
  console.log(`[AUTO-RECONNECT] Checking @${uniqueId} every 15s...`);
  liveCheckTimer = setInterval(async () => {
    if (connectionState === 'connected') {
      clearInterval(liveCheckTimer);
      liveCheckTimer = null;
      return;
    }
    const { alive, nickname, avatar, viewerCount } = await checkIfLive(uniqueId);
    if (alive) {
      clearInterval(liveCheckTimer);
      liveCheckTimer = null;
      console.log(`[AUTO-RECONNECT] @${uniqueId} is now LIVE! Connecting...`);
      streamerProfile = { uniqueId, nickname, avatar, viewerCount };
      broadcast('streamer_profile', streamerProfile);
      connectReal(uniqueId);
    } else {
      streamerProfile = { uniqueId, nickname, avatar, viewerCount: 0 };
      broadcast('streamer_profile', streamerProfile);
    }
  }, 15000);
}

function connectToTikTok(uniqueId) {
  if (connection) { try { connection.disconnect(); } catch (e) {} connection = null; }
  if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
  if (liveCheckTimer) { clearInterval(liveCheckTimer); liveCheckTimer = null; }
  currentStreamerId = uniqueId;
  connectionState = 'connecting';

  if (!TikLiveConnection) {
    connectionState = 'error';
    logEvent('connect', { uniqueId, error: 'SDK not available' });
    broadcast('connection_status', { connected: false, state: 'error', uniqueId, error: '@tiktool/live SDK not installed' });
    broadcastStreamState('error', uniqueId);
    return { success: false, uniqueId, state: 'error', error: 'SDK not available' };
  }

  logEvent('connect', { uniqueId, checkingLive: true });
  console.log(`[CONNECT] Checking if @${uniqueId} is live...`);

  checkIfLive(uniqueId).then(({ alive, nickname, avatar, viewerCount }) => {
    streamerProfile = { uniqueId, nickname, avatar, viewerCount };
    broadcast('streamer_profile', streamerProfile);

    if (alive) {
      console.log(`[CONNECT] @${uniqueId} is LIVE! Connecting...`);
      connectReal(uniqueId);
    } else {
      console.log(`[CONNECT] @${uniqueId} is offline. Waiting for stream to start...`);
      connectionState = 'offline';
      broadcast('connection_status', { connected: false, state: 'offline', uniqueId });
      broadcastStreamState('offline', uniqueId);
      startAutoReconnect(uniqueId);
    }
  }).catch(err => {
    console.error(`[CONNECT] Check failed: ${err.message}`);
    connectionState = 'error';
    broadcast('connection_status', { connected: false, state: 'error', uniqueId, error: err.message });
    broadcastStreamState('error', uniqueId);
    startAutoReconnect(uniqueId);
  });

  return { success: true, uniqueId, state: 'connecting' };
}

function setupConnectionHandlers(conn, uniqueId) {
    conn.on('connected', () => {
      connectionState = 'connected';
      if (liveCheckTimer) { clearInterval(liveCheckTimer); liveCheckTimer = null; }
      broadcast('connection_status', { connected: true, state: 'connected', uniqueId });
      broadcastStreamState('connected', uniqueId);
      logEvent('connected', { uniqueId });
      console.log(`[SDK] Connected to @${uniqueId}`);
    });
    conn.on('disconnected', () => {
      connectionState = 'disconnected';
      broadcast('connection_status', { connected: false, state: 'disconnected', uniqueId });
      broadcastStreamState('disconnected', uniqueId);
      console.log(`[SDK] Disconnected from @${uniqueId}`);
      startAutoReconnect(uniqueId);
    });
    conn.on('error', (err) => {
      console.error(`[SDK] Error: ${err.message}`);
      logEvent('error', { message: err.message });
      if (connectionState !== 'connected') {
        try { conn.disconnect(); } catch (e) {}
        connection = null;
        connectionState = 'error';
        broadcast('connection_status', { connected: false, state: 'error', uniqueId, error: err.message });
        broadcastStreamState('error', uniqueId);
        startAutoReconnect(uniqueId);
      }
    });
    conn.on('like', (data) => {
      const user = data.user || data;
      updateLikeLeaderboard(user, data.likeCount || data.like_count || 1);
      broadcast('like', { user: rewriteAvatars(user), likeCount: data.likeCount || 1, total: data.totalLikeCount || 0 });
      broadcastToAll('latest_event_update', { eventType: 'like', event: { uniqueId: user.uniqueId, nickname: user.nickname, avatar: getUserAvatar(user) } });
      broadcastLeaderboard();
    });
    conn.on('chat', (data) => {
      broadcast('chat', rewriteAvatars(data));
      const user = data.user || data;
      broadcastToAll('latest_event_update', { eventType: 'chat', event: { uniqueId: user.uniqueId, nickname: user.nickname, avatar: getUserAvatar(user), comment: data.comment } });
    });
    conn.on('social', (data) => {
      const action = data.action || data.type;
      const user = data.user || data;
      if (action === 'follow' || action === 2) {
        broadcast('follow_overlay_update', rewriteAvatars(data));
        broadcastToAll('latest_event_update', { eventType: 'follow', event: { uniqueId: user.uniqueId, nickname: user.nickname, avatar: getUserAvatar(user) } });
      }
    });
    conn.on('gift', (data) => {
      const user = data.user || data.sender || data;
      const diamonds = data.diamondCount || data.diamond_count || 0;
      updateGiftLeaderboard(user, diamonds);
      broadcast('gift_overlay_update', rewriteAvatars(data));
      broadcastToAll('latest_event_update', { eventType: 'gift', event: { uniqueId: user.uniqueId, nickname: user.nickname, avatar: getUserAvatar(user), gift: data.gift?.name || 'Gift', diamonds } });
      broadcastLeaderboard();
    });
    conn.on('subscribe', (data) => {
      broadcast('subscribe_overlay_update', rewriteAvatars(data));
      const user = data.user || data;
      broadcastToAll('latest_event_update', { eventType: 'subscribe', event: { uniqueId: user.uniqueId, nickname: user.nickname, avatar: getUserAvatar(user) } });
    });
    conn.on('member', (data) => {
      const action = data.action || data.type;
      const user = data.user || data;
      if (action === 'join' || action === 1) {
        broadcast('member_join_overlay_update', rewriteAvatars(data));
        broadcastToAll('latest_event_update', { eventType: 'member', event: { uniqueId: user.uniqueId, nickname: user.nickname, avatar: getUserAvatar(user) } });
      }
    });
    conn.on('roomUserSeq', (data) => {
      broadcastToAll('room_viewers_update', rewriteAvatars(data));
      if (data.totalUserCount) {
        broadcast('viewer_count_update', { viewerCount: data.totalUserCount });
      }
    });
    conn.on('roomInfo', (data) => {
      broadcast('room_info_update', data);
      logEvent('roomInfo', { roomId: data?.roomId || data?.id });
    });
    console.log(`[SDK] Handlers set up for @${uniqueId}`);
}

function disconnectFromTikTok() {
  if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
  if (liveCheckTimer) { clearInterval(liveCheckTimer); liveCheckTimer = null; }
  if (connection) { try { connection.disconnect(); } catch (e) {} connection = null; }
  connectionState = 'disconnected';
  currentStreamerId = null;
  streamerProfile = null;
  broadcast('connection_status', { connected: false, state: 'disconnected' });
  broadcastStreamState('disconnected', null);
  return { success: true };
}

function getStatus() {
  return {
    connected: connectionState === 'connected',
    state: connectionState,
    streamerId: currentStreamerId,
    profile: streamerProfile,
    sessions: sessions.size,
    totalClients: [...sessions.values()].reduce((sum, s) => sum + s.size, 0),
    likeLeaderboardSize: likeLeaderboard.size,
    giftLeaderboardSize: giftLeaderboard.size
  };
}

// === WebSocket connection handling ===
server.on('upgrade', (request, socket, head) => {
  const parsedUrl = new URL(request.url, `http://localhost:${PORT}`);
  if (parsedUrl.pathname !== '/ws') { socket.destroy(); return; }
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});

wss.on('connection', (ws) => {
  const sessionId = Date.now().toString(36) + Math.random().toString(36).slice(2);
  if (!sessions.has(sessionId)) sessions.set(sessionId, new Set());
  sessions.get(sessionId).add(ws);
  const totalClients = [...sessions.values()].reduce((s,c) => s + c.size, 0);
  console.log(`[WS] Client connected. Session: ${sessionId}, Sessions: ${sessions.size}, Total clients: ${totalClients}`);

  ws.send(JSON.stringify({ type: 'connected', data: { sessionId, status: getStatus() }, ts: Date.now() }));

  if (connectionState === 'connected') {
    ws.send(JSON.stringify({ type: 'connection_status', data: { connected: true, state: 'connected', uniqueId: currentStreamerId, profile: streamerProfile }, ts: Date.now() }));
  }

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw.toString());
      console.log(`[WS] Received: ${msg.type}`);
      if (msg.type === 'subscribe' || msg.action === 'subscribe') {
        ws.streamerId = msg.streamerId;
        ws.send(JSON.stringify({ type: 'subscribed', streamerId: msg.streamerId, ts: Date.now() }));
        ws.send(JSON.stringify({
          type: 'stream-state-updated',
          data: {
            state: connectionState,
            stateRevision, generation: 1, updatedAt: Date.now(), timestamp: Date.now(),
            uniqueId: currentStreamerId, connected: connectionState === 'connected'
          },
          ts: Date.now()
        }));
        ws.send(JSON.stringify({ type: 'connection_status', data: { connected: connectionState === 'connected', state: connectionState, uniqueId: currentStreamerId, profile: streamerProfile }, ts: Date.now() }));
        if (streamerProfile) {
          ws.send(JSON.stringify({ type: 'streamer_profile', data: streamerProfile, ts: Date.now() }));
        }
        if (connectionState === 'connected') {
          ws.send(JSON.stringify({ type: 'room_info_update', data: { roomId: currentStreamerId }, ts: Date.now() }));
        }
        broadcastLeaderboard();
        const totalClients = [...sessions.values()].reduce((s,c) => s + c.size, 0);
        console.log(`[WS] Subscribed: ${msg.streamerId}, state=${connectionState}, sessions=${sessions.size}, totalClients=${totalClients}`);
      } else if (msg.type === 'ping' || msg.action === 'ping') {
        ws.send(JSON.stringify({ type: 'pong', ts: Date.now() }));
      } else if (msg.type === 'dashboard-register' || msg.type === 'dashboard_register') {
        ws.send(JSON.stringify({ type: 'SESSION_ACTIVE', sessionId: msg.sessionId, ts: Date.now() }));
        console.log(`[WS] Dashboard registered: ${msg.sessionId}`);
        // Send current state after registration
        if (connectionState === 'connected') {
          ws.send(JSON.stringify({
            type: 'stream-state-updated',
            data: { state: 'connected', stateRevision, generation: 1, updatedAt: Date.now(), timestamp: Date.now(), uniqueId: currentStreamerId, connected: true },
            ts: Date.now()
          }));
          broadcastLeaderboard();
        }
      }
    } catch (e) { console.error('[WS] Message error:', e.message); }
  });

  ws.on('close', () => {
    const clientSet = sessions.get(sessionId);
    if (clientSet) { clientSet.delete(ws); if (clientSet.size === 0) sessions.delete(sessionId); }
  });
});

// === Start Server ===
server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n========================================`);
  console.log(`  TikFlux Desktop Server`);
  console.log(`  Port: ${PORT}`);
  console.log(`  App Data: ${APP_DATA}`);
  console.log(`  User Data: ${USER_DATA}`);
  console.log(`========================================\n`);
  logEvent('server_start', { port: PORT, appData: APP_DATA });

  // Periodic leaderboard broadcast
  setInterval(() => {
    if (connectionState === 'connected') {
      broadcastLeaderboard();
    }
  }, 5000);
});

// Graceful shutdown
process.on('SIGINT', () => {
  disconnectFromTikTok();
  wss.clients.forEach(c => c.close());
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 2000);
});

process.on('uncaughtException', (err) => {
  console.error('[FATAL]', err.message);
  logEvent('uncaught_exception', { message: err.message });
  // Don't exit - recover from SDK errors
});

process.on('unhandledRejection', (reason) => {
  console.error('[UnhandledRejection]', reason?.message || reason);
  logEvent('unhandled_rejection', { message: String(reason?.message || reason) });
});

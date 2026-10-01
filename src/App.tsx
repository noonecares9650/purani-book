import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  ArrowUpRight,
  AudioLines,
  Award,
  Bell,
  Check,
  ChevronRight,
  CircleHelp,
  Clock3,
  Disc3,
  Flame,
  Gamepad2,
  Headphones,
  Keyboard,
  Library,
  ListMusic,
  Lock,
  Music2,
  Pause,
  Play,
  Plus,
  Radio,
  Settings2,
  Shield,
  Sparkles,
  Swords,
  Trophy,
  Users,
  WandSparkles,
  X,
  Zap,
} from 'lucide-react';

type View = 'arena' | 'songs' | 'loadout' | 'ranked';
type HitGrade = 'PERFECT' | 'GOOD' | 'OFFBEAT';

type Song = {
  title: string;
  artist: string;
  genre: string;
  bpm: number;
  key: string;
  energy: string;
  duration: string;
  progress: number;
  color: string;
  secondary: string;
  tag?: string;
  bars: number[];
};

const songs: Song[] = [
  {
    title: 'Neon Genesis',
    artist: 'KIRA//NOVA',
    genre: 'ELECTRO PUNK',
    bpm: 128,
    key: 'F# MIN',
    energy: 'OVERDRIVE',
    duration: '03:42',
    progress: 68,
    color: '#ff613d',
    secondary: '#ffb36a',
    tag: 'FEATURED',
    bars: [35, 58, 42, 78, 48, 66, 93, 52, 74, 44, 62, 86, 38, 69, 49, 80],
  },
  {
    title: 'Glass Cathedral',
    artist: 'MARA VANE',
    genre: 'ALT ROCK',
    bpm: 142,
    key: 'C MIN',
    energy: 'MAXIMUM',
    duration: '04:08',
    progress: 42,
    color: '#a995ff',
    secondary: '#6ee7d4',
    tag: 'NEW',
    bars: [64, 48, 83, 38, 72, 56, 92, 68, 42, 76, 61, 88, 46, 70, 52, 90],
  },
  {
    title: 'Afterimage',
    artist: 'LUNAR ARCHIVE',
    genre: 'DREAM WAVE',
    bpm: 96,
    key: 'A MAJ',
    energy: 'STEADY',
    duration: '05:16',
    progress: 24,
    color: '#63d7d0',
    secondary: '#8aa5ff',
    bars: [32, 48, 36, 60, 42, 54, 68, 46, 34, 57, 44, 72, 39, 52, 31, 61],
  },
  {
    title: 'Static Bloom',
    artist: 'NOISE CTRL',
    genre: 'BASS HOUSE',
    bpm: 150,
    key: 'D# MIN',
    energy: 'UNHINGED',
    duration: '02:58',
    progress: 13,
    color: '#f2ca5b',
    secondary: '#ff7654',
    bars: [82, 42, 96, 52, 76, 93, 44, 88, 59, 97, 46, 80, 62, 94, 51, 86],
  },
];

const leaderboard = [
  { rank: '01', name: 'MINT//CTRL', score: '98,421', tier: 'CHAMPION', accent: 'lime' },
  { rank: '02', name: 'SYNTHWALKER', score: '96,880', tier: 'DIAMOND', accent: 'violet' },
  { rank: '03', name: 'LILAC//RUSH', score: '94,225', tier: 'DIAMOND', accent: 'cyan' },
  { rank: '04', name: 'YOU', score: '91,740', tier: 'PLATINUM', accent: 'orange' },
];

const beatPattern = ['JAB', 'KICK', 'PARRY', 'JAB', 'SPECIAL', 'KICK', 'JAB', 'PARRY'];
function MiniWaveform({ song, active = false }: { song: Song; active?: boolean }) {
  return (
    <div className={`mini-waveform ${active ? 'is-active' : ''}`} style={{ '--wave-color': song.color } as React.CSSProperties}>
      {song.bars.slice(0, 18).map((bar, index) => (
        <i key={`${song.title}-${index}`} style={{ height: `${Math.max(18, bar * 0.64)}%` }} />
      ))}
    </div>
  );
}

function Artwork({ song, large = false }: { song: Song; large?: boolean }) {
  return (
    <div
      className={`song-art ${large ? 'song-art-large' : ''}`}
      style={{ '--art-a': song.color, '--art-b': song.secondary } as React.CSSProperties}
    >
      <div className="art-grid" />
      <span className="art-ring art-ring-one" />
      <span className="art-ring art-ring-two" />
      <span className="art-title">{song.title.split(' ')[0]}</span>
      <span className="art-mark">///</span>
    </div>
  );
}

function ArenaStage({
  song,
  playing,
  beat,
  streak,
  lastHit,
  onTogglePlaying,
}: {
  song: Song;
  playing: boolean;
  beat: number;
  streak: number;
  lastHit: { grade: HitGrade; id: number } | null;
  onTogglePlaying: () => void;
}) {
  return (
    <section className="arena-card">
      <div className="arena-topline">
        <div className="session-label">
          <span className="live-pulse" />
          <span>LIVE SESSION</span>
          <b>/</b>
          <span>RANKED REMIX</span>
        </div>
        <div className="arena-top-actions">
          <span className="session-code">MATCH 04F2-A9</span>
          <button className="icon-button subtle-button" aria-label="Arena settings"><Settings2 size={16} /></button>
        </div>
      </div>

      <div className="arena-stage">
        <div className="stage-orbit orbit-left" />
        <div className="stage-orbit orbit-right" />
        <div className="stage-scanline" />
        <div className="stage-label stage-label-left">P1 / COMBO READY</div>
        <div className="stage-label stage-label-right">CPU / OVERDRIVE</div>

        <div className="fighter fighter-left">
          <div className="fighter-aura" />
          <div className="fighter-portrait portrait-orange">
            <span className="portrait-hair" />
            <span className="portrait-face">R</span>
            <span className="portrait-visor" />
          </div>
          <div className="fighter-limb fighter-limb-back" />
          <div className="fighter-limb fighter-limb-front" />
          <div className="fighter-torso" />
          <div className="fighter-copy">
            <span>PLAYER 01</span>
            <strong>RIOT//SABLE</strong>
          </div>
          <div className="health-row"><span className="health-fill orange-fill" /></div>
        </div>

        <div className="versus-mark">
          <div className="versus-line" />
          <span>VS</span>
          <div className="versus-line" />
        </div>

        <div className="fighter fighter-right">
          <div className="fighter-aura" />
          <div className="fighter-portrait portrait-violet">
            <span className="portrait-hair" />
            <span className="portrait-face">V</span>
            <span className="portrait-visor" />
          </div>
          <div className="fighter-limb fighter-limb-back" />
          <div className="fighter-limb fighter-limb-front" />
          <div className="fighter-torso" />
          <div className="fighter-copy">
            <span>CPU 07</span>
            <strong>VANTA//NULL</strong>
          </div>
          <div className="health-row"><span className="health-fill violet-fill" /></div>
        </div>

        <div className="stage-track">
          <div className="stage-track-meta"><span>NOW PLAYING</span><b>{song.title}</b><em>{song.bpm} BPM</em></div>
          <div className="stage-track-progress"><span style={{ width: `${song.progress}%`, background: song.color }} /></div>
        </div>

        {lastHit && (
          <div key={lastHit.id} className={`hit-callout hit-${lastHit.grade.toLowerCase()}`}>
            <span>{lastHit.grade}</span>
            <small>+{lastHit.grade === 'PERFECT' ? '420' : lastHit.grade === 'GOOD' ? '180' : '40'}</small>
          </div>
        )}

        <button className={`play-stage-button ${playing ? 'is-playing' : ''}`} onClick={onTogglePlaying} aria-label={playing ? 'Pause match' : 'Start match'}>
          {playing ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
        </button>
      </div>

      <div className="arena-footer">
        <div className="track-info">
          <Artwork song={song} />
          <div>
            <span>PLAYING FROM YOUR SETLIST</span>
            <strong>{song.title} <i>·</i> {song.artist}</strong>
          </div>
        </div>
        <div className="streak-readout">
          <span><Flame size={13} fill="currentColor" /> RHYTHM STREAK</span>
          <strong>{String(streak).padStart(2, '0')} <small>x</small></strong>
        </div>
        <div className="beat-readout">
          <span>BEAT</span>
          <strong>{String((beat % 8) + 1).padStart(2, '0')}<small>/08</small></strong>
        </div>
      </div>
    </section>
  );
}

function RhythmMap({ beat, playing, onAction }: { beat: number; playing: boolean; onAction: (action: string) => void }) {
  return (
    <section className="rhythm-panel">
      <div className="section-kicker"><AudioLines size={14} /> RHYTHM MAP <span>•</span> 8-BEAT PHRASE</div>
      <div className="rhythm-header">
        <div><h2>Read the drop.</h2><p>Your next move is always one beat away.</p></div>
        <div className="timing-legend"><span className="legend-perfect" /> PERFECT <span className="legend-good" /> GOOD</div>
      </div>
      <div className="beat-lane">
        {beatPattern.map((action, index) => (
          <button
            key={`${action}-${index}`}
            className={`beat-node ${index === beat % 8 ? 'is-current' : ''} ${index < beat % 8 ? 'is-passed' : ''}`}
            onClick={() => onAction(action)}
          >
            <span className="beat-number">0{index + 1}</span>
            <span className="beat-dot" />
            <strong>{action}</strong>
            <small>{index % 2 === 0 ? 'DOWN' : 'UP'}</small>
          </button>
        ))}
      </div>
      <div className="rhythm-controls">
        <div className="key-hint"><Keyboard size={15} /><span>Hit the lane or use</span><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd><kbd>F</kbd></div>
        <div className={`tempo-status ${playing ? 'tempo-live' : ''}`}><span /> {playing ? 'BEAT CLOCK RUNNING' : 'PRESS PLAY TO START'}</div>
      </div>
    </section>
  );
}

function SongCard({ song, active, onSelect, onPlay }: { song: Song; active: boolean; onSelect: () => void; onPlay: () => void }) {
  return (
    <button className={`song-card ${active ? 'is-selected' : ''}`} onClick={onSelect}>
      <Artwork song={song} />
      <div className="song-card-body">
        <div className="song-card-top"><span>{song.genre}</span>{song.tag && <b>{song.tag}</b>}</div>
        <strong>{song.title}</strong>
        <p>{song.artist}</p>
        <MiniWaveform song={song} active={active} />
        <div className="song-card-meta"><span>{song.bpm} BPM</span><span>{song.key}</span><span>{song.duration}</span><button className="mini-play" onClick={(event) => { event.stopPropagation(); onPlay(); }} aria-label={`Play ${song.title}`}>{active ? <Pause size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" />}</button></div>
      </div>
    </button>
  );
}

function RightRail({ song, playing, onSelectSong, onQueue }: { song: Song; playing: boolean; onSelectSong: (index: number) => void; onQueue: () => void }) {
  return (
    <aside className="right-rail">
      <section className="side-card now-playing-card">
        <div className="side-card-heading"><span>NOW PLAYING</span><div className="playing-bars"><i /><i /><i /><i /></div></div>
        <Artwork song={song} large />
        <div className="now-playing-copy"><h3>{song.title}</h3><p>{song.artist}</p></div>
        <MiniWaveform song={song} active />
        <div className="time-line"><span>02:31</span><div><i style={{ width: `${song.progress}%`, background: song.color }} /></div><span>{song.duration}</span></div>
        <div className="now-playing-stats"><span><Activity size={13} /> {song.bpm} BPM</span><span><Music2 size={13} /> {song.key}</span><span><Zap size={13} /> {song.energy}</span></div>
        <button className="queue-button" onClick={onQueue}>{playing ? <Pause size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" />} {playing ? 'PAUSE FIGHT' : 'QUEUE THIS FIGHT'} <ArrowUpRight size={14} /></button>
      </section>

      <section className="side-card setlist-card">
        <div className="side-card-heading"><span>UP NEXT IN SETLIST</span><button className="text-action">EDIT <ArrowUpRight size={12} /></button></div>
        {songs.filter((item) => item.title !== song.title).slice(0, 3).map((item) => {
          const index = songs.findIndex((songItem) => songItem.title === item.title);
          return <button key={item.title} className="queue-row" onClick={() => onSelectSong(index)}><Artwork song={item} /><span><strong>{item.title}</strong><small>{item.artist}</small></span><em>{item.bpm}</em><ChevronRight size={14} /></button>;
        })}
        <button className="add-song"><Plus size={15} /> ADD SONG TO SETLIST</button>
      </section>

      <section className="side-card rank-card">
        <div className="side-card-heading"><span>SEASON 02 RANK</span><button className="text-action">VIEW <ArrowUpRight size={12} /></button></div>
        <div className="rank-card-main"><div className="rank-emblem"><Trophy size={21} /></div><div><strong>PLATINUM III</strong><span>2,180 RP <i>+120 this week</i></span></div><div className="rank-position">#04</div></div>
        <div className="rank-meter"><span style={{ width: '72%' }} /></div><div className="rank-meter-copy"><span>2,180 RP</span><span>2,400 RP TO DIAMOND</span></div>
      </section>
    </aside>
  );
}

function ArenaView({
  song,
  songIndex,
  playing,
  beat,
  streak,
  lastHit,
  setSongIndex,
  setPlaying,
  onAction,
  onOpenEditor,
}: {
  song: Song;
  songIndex: number;
  playing: boolean;
  beat: number;
  streak: number;
  lastHit: { grade: HitGrade; id: number } | null;
  setSongIndex: (index: number) => void;
  setPlaying: (value: boolean) => void;
  onAction: (action: string) => void;
  onOpenEditor: () => void;
}) {
  return (
    <>
      <div className="content-heading">
        <div><div className="breadcrumb"><span>HOME</span><ChevronRight size={12} /><span className="breadcrumb-current">THE ARENA</span></div><h1>Make some noise.</h1><p>Every beat is a chance to take control.</p></div>
        <div className="heading-actions"><button className="outline-button" onClick={onOpenEditor}><WandSparkles size={15} /> SONG EDITOR</button><button className="primary-button" onClick={() => setPlaying(!playing)}>{playing ? <Pause size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" />} {playing ? 'PAUSE SESSION' : 'START SESSION'}</button></div>
      </div>
      <ArenaStage song={song} playing={playing} beat={beat} streak={streak} lastHit={lastHit} onTogglePlaying={() => setPlaying(!playing)} />
      <RhythmMap beat={beat} playing={playing} onAction={onAction} />
      <div className="lower-grid">
        <div className="song-library-section">
          <div className="section-header"><div><div className="section-kicker"><Disc3 size={14} /> YOUR ROTATION</div><h2>Pick your weapon.</h2></div><button className="text-action">VIEW LIBRARY <ArrowUpRight size={13} /></button></div>
          <div className="song-grid">{songs.map((item, index) => <SongCard key={item.title} song={item} active={songIndex === index} onSelect={() => { setSongIndex(index); setPlaying(false); }} onPlay={() => { setSongIndex(index); setPlaying(true); }} />)}</div>
        </div>
        <section className="stat-card">
          <div className="section-kicker"><Award size={14} /> SESSION RECORD</div><h2>Own the moment.</h2><p>Your best timing is in the top 8% of players on this track.</p>
          <div className="stat-big"><strong>94.8%</strong><span>PERFECT RATE</span></div><div className="stat-breakdown"><span><i className="dot dot-orange" /> PERFECT <b>148</b></span><span><i className="dot dot-violet" /> GOOD <b>32</b></span><span><i className="dot dot-muted" /> MISSED <b>07</b></span></div>
          <div className="stat-sparkline">{[42, 58, 45, 77, 61, 88, 72, 92, 76, 96, 81, 100].map((height, index) => <i key={index} style={{ height: `${height}%` }} />)}</div>
        </section>
      </div>
    </>
  );
}

function SongsView({ selectedIndex, onSelect, onPlay, onOpenEditor }: { selectedIndex: number; onSelect: (index: number) => void; onPlay: (index: number) => void; onOpenEditor: () => void }) {
  const [filter, setFilter] = useState('ALL TRACKS');
  const filters = ['ALL TRACKS', 'ELECTRONIC', 'ROCK', 'CHILL', 'MY MAPS'];
  const filteredSongs = songs.filter((song) => filter === 'ALL TRACKS' || filter === 'MY MAPS' || song.genre.includes(filter === 'ELECTRONIC' ? 'ELECTRO' : filter === 'ROCK' ? 'ROCK' : 'DREAM'));
  return (
    <div className="page-view">
      <div className="content-heading"><div><div className="breadcrumb"><span>LIBRARY</span><ChevronRight size={12} /><span className="breadcrumb-current">SONG SELECT</span></div><h1>Find your rhythm.</h1><p>Choose a track. The arena will build the fight around it.</p></div><button className="primary-button" onClick={onOpenEditor}><Plus size={16} /> CREATE RHYTHM MAP</button></div>
      <div className="library-toolbar"><div className="filter-pills">{filters.map((item) => <button key={item} className={filter === item ? 'is-active' : ''} onClick={() => setFilter(item)}>{item}</button>)}</div><div className="library-sort"><ListMusic size={15} /> SORT: <strong>RECENTLY PLAYED</strong></div></div>
      <div className="full-song-grid">{filteredSongs.map((song) => { const index = songs.indexOf(song); return <SongCard key={song.title} song={song} active={selectedIndex === index} onSelect={() => onSelect(index)} onPlay={() => onPlay(index)} />; })}<button className="import-card" onClick={onOpenEditor}><div><Plus size={22} /></div><strong>Import a song</strong><span>Build your own beat map</span><small><Lock size={11} /> Local files supported</small></button></div>
      <div className="library-footer"><span><Headphones size={15} /> 4 TRACKS IN ROTATION</span><span><Clock3 size={14} /> LAST SYNCED 2 MIN AGO</span></div>
    </div>
  );
}

function LoadoutView({ onOpenEditor }: { onOpenEditor: () => void }) {
  const [selected, setSelected] = useState(0);
  const fighters = [
    { name: 'RIOT//SABLE', role: 'RHYTHM STRIKER', accent: 'orange', quote: 'Hit first. Hit on time.', moves: ['Pulse Jab', 'Sync Kick', 'Aftershock'] },
    { name: 'VANTA//NULL', role: 'COUNTER SPECIALIST', accent: 'violet', quote: 'The silence hits harder.', moves: ['Ghost Step', 'Mute Parry', 'Blackout'] },
    { name: 'KAI//STATIC', role: 'COMBO RUNNER', accent: 'cyan', quote: 'Keep the chain alive.', moves: ['Quickstep', 'Wave Crash', 'Overclock'] },
  ];
  const fighter = fighters[selected];
  return <div className="page-view"><div className="content-heading"><div><div className="breadcrumb"><span>GARAGE</span><ChevronRight size={12} /><span className="breadcrumb-current">LOADOUT</span></div><h1>Build your main.</h1><p>Every fighter brings a different way to hear the beat.</p></div><button className="primary-button" onClick={onOpenEditor}><Sparkles size={15} /> CUSTOMIZE ATTACKS</button></div><div className="loadout-layout"><section className={`fighter-loadout accent-${fighter.accent}`}><div className="loadout-grid" /><div className="loadout-copy"><span>SELECTED FIGHTER / 0{selected + 1}</span><h2>{fighter.name}</h2><p>{fighter.quote}</p><div className="fighter-role">{fighter.role}</div></div><div className="loadout-avatar"><span className="loadout-hair" /><span>{fighter.name.slice(0, 1)}</span><i /></div><div className="loadout-stats"><span><b>92</b> POWER</span><span><b>88</b> FLOW</span><span><b>76</b> GUARD</span></div></section><section className="fighter-roster"><div className="section-kicker"><Users size={14} /> ROSTER <span>03 / 12 UNLOCKED</span></div>{fighters.map((item, index) => <button key={item.name} className={`roster-row accent-${item.accent} ${selected === index ? 'is-selected' : ''}`} onClick={() => setSelected(index)}><div className="roster-avatar">{item.name.slice(0, 1)}</div><div><strong>{item.name}</strong><span>{item.role}</span></div>{selected === index ? <Check size={16} /> : <ChevronRight size={16} />}</button>)}<button className="locked-row"><Lock size={14} /><span>9 fighters locked</span><small>UNLOCK IN CAMPAIGN</small></button></section></div><div className="moves-panel"><div className="section-header"><div><div className="section-kicker"><Swords size={14} /> SIGNATURE KIT</div><h2>{fighter.name}'s rhythm attacks.</h2></div><span className="move-count">{fighter.moves.length} / 4 EQUIPPED</span></div><div className="move-grid">{fighter.moves.map((move, index) => <div className="move-card" key={move}><span className={`move-number move-${index}`}>0{index + 1}</span><div><strong>{move}</strong><p>{['On every downbeat', 'After a perfect parry', 'At 8x streak'][index]}</p></div><ArrowUpRight size={15} /></div>)}<button className="move-card add-move" onClick={onOpenEditor}><Plus size={18} /><strong>Add signature move</strong></button></div></div></div>;
}

function RankedView() {
  return <div className="page-view"><div className="content-heading"><div><div className="breadcrumb"><span>COMPETE</span><ChevronRight size={12} /><span className="breadcrumb-current">RANKED</span></div><h1>Climb the volume.</h1><p>Season 02 ends in 12 days. There is always another beat to chase.</p></div><button className="primary-button"><Swords size={15} /> FIND A MATCH</button></div><div className="rank-hero"><div className="rank-hero-copy"><span className="rank-overline"><Radio size={13} /> SEASON 02 / RANKED LADDER</span><h2>Make your mark<br /><em>in the noise.</em></h2><p>Win rhythm duels, stack RP, and take your place on the global board.</p><button className="outline-button">VIEW SEASON REWARDS <ArrowUpRight size={14} /></button></div><div className="rank-badge-large"><div><Trophy size={44} /></div><span>PLATINUM</span><strong>III</strong><small>2,180 RP</small></div><div className="rank-hero-stat"><span>GLOBAL RANK</span><strong>#04,192</strong><i>↑ 208 this week</i></div></div><section className="leaderboard-panel"><div className="section-header"><div><div className="section-kicker"><Trophy size={14} /> GLOBAL LEADERBOARD</div><h2>The loudest players this week.</h2></div><div className="live-pill"><span /> LIVE</div></div><div className="leaderboard-list">{leaderboard.map((player) => <div className={`leaderboard-row ${player.name === 'YOU' ? 'is-you' : ''}`} key={player.rank}><span className="leaderboard-rank">{player.rank}</span><div className={`leader-avatar avatar-${player.accent}`}>{player.name.slice(0, 1)}</div><div className="leader-name"><strong>{player.name}</strong><span>{player.tier}</span></div><div className="leader-bar"><span style={{ width: `${100 - Number(player.rank) * 9}%` }} /></div><strong className="leader-score">{player.score}</strong><ChevronRight size={15} /></div>)}</div></section></div>;
}

function SongEditor({ onClose }: { onClose: () => void }) {
  const [saved, setSaved] = useState(false);
  return <div className="modal-backdrop" onMouseDown={onClose}><div className="editor-modal" onMouseDown={(event) => event.stopPropagation()}><div className="modal-header"><div><span className="section-kicker"><WandSparkles size={14} /> CREATOR SUITE</span><h2>Build a rhythm map.</h2></div><button className="icon-button" onClick={onClose}><X size={18} /></button></div><div className="editor-track"><Artwork song={songs[0]} /><div><strong>Drop a track to begin</strong><span>MP3, WAV, FLAC · up to 12 minutes</span><button className="outline-button"><Plus size={14} /> CHOOSE AUDIO FILE</button></div></div><div className="editor-form"><label>MAP NAME<input placeholder="Give this map a name" defaultValue="Midnight collision" /></label><label>DIFFICULTY<select defaultValue="EXPERT"><option>BEGINNER</option><option>STANDARD</option><option>EXPERT</option><option>MASTER</option></select></label></div><div className="editor-timeline"><div className="timeline-top"><span>BEAT GRID / AUTO-DETECT</span><b>128 BPM</b><button className="text-action">RE-SCAN <Activity size={13} /></button></div><div className="timeline-bars">{Array.from({ length: 48 }).map((_, index) => <i key={index} className={index % 4 === 0 ? 'strong-beat' : ''} style={{ height: `${25 + ((index * 31) % 55)}%` }} />)}</div><div className="timeline-cues"><span style={{ left: '16%' }}>JAB</span><span style={{ left: '38%' }}>KICK</span><span style={{ left: '62%' }}>PARRY</span><span style={{ left: '82%' }}>SPECIAL</span></div></div><div className="modal-footer"><span><CircleHelp size={14} /> You can fine-tune every cue after auto-detect.</span><button className="primary-button" onClick={() => { setSaved(true); window.setTimeout(onClose, 900); }}>{saved ? <><Check size={15} /> MAP SAVED</> : <>SAVE RHYTHM MAP <ArrowUpRight size={14} /></>}</button></div></div></div>;
}

export default function App() {
  const [activeView, setActiveView] = useState<View>('arena');
  const [songIndex, setSongIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [beat, setBeat] = useState(0);
  const [streak, setStreak] = useState(12);
  const [lastHit, setLastHit] = useState<{ grade: HitGrade; id: number } | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [toast, setToast] = useState('');

  const song = songs[songIndex];

  useEffect(() => {
    if (!playing) return undefined;
    const timer = window.setInterval(() => setBeat((current) => (current + 1) % 8), 468);
    return () => window.clearInterval(timer);
  }, [playing]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement?.tagName ?? '')) return;
      const actionByKey: Record<string, string> = { a: 'JAB', s: 'KICK', d: 'PARRY', f: 'SPECIAL' };
      const action = actionByKey[event.key.toLowerCase()];
      if (action) handleAction(action);
      if (event.code === 'Space') { event.preventDefault(); setPlaying((current) => !current); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  });

  const handleAction = (action: string) => {
    const expected = beatPattern[beat % 8];
    const grade: HitGrade = action === expected ? 'PERFECT' : action === 'PARRY' ? 'GOOD' : 'OFFBEAT';
    setLastHit({ grade, id: Date.now() });
    setStreak((current) => grade === 'OFFBEAT' ? 0 : current + 1);
    if (grade === 'PERFECT') setToast('PERFECT TIMING  +420');
    else if (grade === 'GOOD') setToast('GOOD TIMING  +180');
    else setToast('OFFBEAT  KEEP LISTENING');
    window.setTimeout(() => setToast(''), 1200);
  };

  const selectSong = (index: number) => {
    setSongIndex(index);
    setBeat(0);
    setStreak(0);
    setLastHit(null);
  };

  const navItems: { id: View; label: string; icon: typeof Gamepad2 }[] = useMemo(() => [
    { id: 'arena', label: 'ARENA', icon: Gamepad2 },
    { id: 'songs', label: 'SONGS', icon: Library },
    { id: 'loadout', label: 'LOADOUT', icon: Shield },
    { id: 'ranked', label: 'RANKED', icon: Trophy },
  ], []);

  return (
    <div className="app-shell">
      <header className="top-nav">
        <div className="brand-lockup" onClick={() => setActiveView('arena')} role="button" tabIndex={0}>
          <div className="brand-symbol"><span /><span /><span /></div>
          <div><strong>BEATDOWN</strong><span>ARENA</span></div>
        </div>
        <nav className="main-nav">{navItems.map(({ id, label, icon: Icon }) => <button key={id} className={activeView === id ? 'is-active' : ''} onClick={() => setActiveView(id)}><Icon size={15} />{label}{id === 'ranked' && <i className="nav-live-dot" />}</button>)}</nav>
        <div className="top-actions"><button className="icon-button nav-icon" aria-label="Notifications"><Bell size={17} /><i /></button><div className="profile-chip"><div className="profile-avatar">M</div><div><strong>MIDNIGHT//M</strong><span>LVL 28 <i>•</i> 2,180 RP</span></div><ChevronRight size={14} /></div></div>
      </header>

      <main className="main-layout">
        <div className="main-column">
          {activeView === 'arena' && <ArenaView song={song} songIndex={songIndex} playing={playing} beat={beat} streak={streak} lastHit={lastHit} setSongIndex={selectSong} setPlaying={setPlaying} onAction={handleAction} onOpenEditor={() => setEditorOpen(true)} />}
          {activeView === 'songs' && <SongsView selectedIndex={songIndex} onSelect={selectSong} onPlay={(index) => { selectSong(index); setPlaying(true); setActiveView('arena'); }} onOpenEditor={() => setEditorOpen(true)} />}
          {activeView === 'loadout' && <LoadoutView onOpenEditor={() => setEditorOpen(true)} />}
          {activeView === 'ranked' && <RankedView />}
        </div>
        <RightRail song={song} playing={playing} onSelectSong={(index) => { selectSong(index); setActiveView('arena'); }} onQueue={() => { setActiveView('arena'); setPlaying((current) => !current); }} />
      </main>

      <footer className="app-footer"><span><Radio size={13} /> BEATDOWN ARENA / SEASON 02</span><span>ALL SYSTEMS NOMINAL <i className="status-dot" /></span><span>© 2025 RHYTHM//CORE</span></footer>
      {toast && <div className="toast"><Zap size={15} fill="currentColor" /> {toast}</div>}
      {editorOpen && <SongEditor onClose={() => setEditorOpen(false)} />}
    </div>
  );
}

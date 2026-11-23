# ZORB Songs Directory

Drop `.mp3` audio files into this folder (`public/songs/`) and register them in `src/data/songs.ts` using `addSong()`:

```ts
addSong({
  id: 'my-track',
  title: 'TRACK TITLE',
  artist: 'Artist Name',
  cover: '/src/assets/images/your-cover.jpg',
  fileName: 'my-track.mp3', // served at /songs/my-track.mp3
  duration: 185,
  tags: ['Phonk', 'Drift Phonk'],
  bpm: 140,
})
```

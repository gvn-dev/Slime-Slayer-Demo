# Slime Slayer environment art and audio

Image mode: built-in imagegen, with the four existing splash portraits as title-art references. Final assets are saved in this Art directory.

## Title prompt
Create finished widescreen 16:9 dark-fantasy pixel-art title illustration. Preserve the identities, skin tones, outfits, weapons and proportions in the four reference splash portraits: Ravela, dark-skinned white-haired elf woman with black skull armor and bone bow; Fjord, orange-haired bearded armored dwarf with gold-trimmed fire shield and mace; Aram, black-haired human swordsman with green cloak and silver shortsword; Gavrilta, green-skinned brown-haired tusked orc woman with purple-blue gold-trimmed cloak and green orb staff. All four stand valiantly together facing the viewer in the lower foreground. Behind them a grassy rising hill teems with blue, green, red, yellow and black slimes, with an enormous Roman coliseum atop it. Dramatic golden dusk and indigo sky, carefully clustered visible pixels, polished fantasy RPG key art. Quiet upper sky for a separately rendered heading. No text, logos, watermark or UI.

## Arena prompt
Square orthographic directly overhead pixel-art Roman Colosseum game background. Weathered travertine masonry, concentric seating, radial stairs, four cardinal vaulted entrances, red and gold banners, small braziers and restrained mosaic accents. An enormous low-contrast open sand disk occupies the center, without obstacles or characters. Put walls and seating only around the perimeter and corners. No horizon, isometric perspective, text or UI. The final edit asks for a perfect centered sand circle with diameter 93% of the image dimensions, preserving the style and architecture. The render is calibrated to the existing 1,200-unit world and 560-unit playable radius so gameplay does not extend onto the stands.

## Original audio
Hills of the Colosseum: original synthesized instrumental composition, D minor, 120 BPM, 32 bars, 64 seconds. Sustained string-like layers, low frame drums, plucked lyre-like arpeggios and melody, brass-like swells, and circular stereo reverberation. Entirely instrumental. Circular note tails and delay taps permit a continuous loop. No film recordings, samples or melodies were used.

Slime run start: original 1.15-second synthesized wet squelch, gurgling pitched bubbles and filtered noise. Plays once per new run, including replay; endless continuation keeps the same run.

The reproducible audio composition source is tools/compose-game-audio.js. Music and effects obey their separate Settings sliders and master volume; music fades on pause or when the browser tab is hidden. Browser audio begins after a user gesture.

## Combat sound design

The client synthesizes and caches eight original Web Audio combat cues: Ravela's short string twang and arrow rush; Fjord's bass-heavy mace whoosh; Aram's airy metallic sword slash; Gavrilta's dry grassy rustle; Aram's bright riposte shing; Ravela's ominous reverse-like swell and double heartbeat; Fjord's filtered roaring fire; and Gavrilta's resonant bell toll. Ravela's mark is an original cue with an eerie supernatural mood, with no sampled recording or melody from Re:Zero.

Cues follow authoritative combat effects, are deduplicated by event ID, and use subtle stereo placement in multiplayer. Ravela's persistent bow-shot cue also covers arrows that strike between network polls, with a projectile fallback for servers not yet restarted. Combat voices are bounded and short buffers are cached, avoiding repeated synthesis while fighting. All cues obey the Sound effects and Master volume sliders.

Battle revision: the current loop is 40 bars at 150 BPM (still exactly 64 seconds), with galloping war drums, snare rolls, rhythmic bowed-string figures, a continuous shawm-like melody and hunting-horn responses. Reverb is shorter for a more immediate, combative medieval feel.

Dark dramatic revision: 80 bars at 150 BPM, 128 seconds. Five contrasting 16-bar sections: ominous low-string opening, driving battle development, sparse high-harp interlude, gathering tension, and full battle climax. Each section has its own melodic phrase, chord sequence, instrumental density, percussion accents and harp patterns. Bowed bass, upper-string suspensions, harp tails, horn responses and circular reverb tie the sections into a seamless loop.

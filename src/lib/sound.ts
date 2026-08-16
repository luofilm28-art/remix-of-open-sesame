import { Howl, Howler } from "howler";

import clickAsset from "@/assets/sounds/click.mp3.asset.json";
import crashAsset from "@/assets/sounds/crash.mp3.asset.json";
import engineAsset from "@/assets/sounds/engine.mp3.asset.json";
import musicAsset from "@/assets/sounds/music.mp3.asset.json";
import winAsset from "@/assets/sounds/win.mp3.asset.json";

type Key = "click" | "win" | "crash";

let sfx: Record<Key, Howl> | null = null;
let engine: Howl | null = null;
let music: Howl | null = null;

function ensure() {
  if (typeof window === "undefined") return;
  if (!sfx) {
    sfx = {
      click: new Howl({ src: [clickAsset.url], volume: 0.5 }),
      win: new Howl({ src: [winAsset.url], volume: 0.6 }),
      crash: new Howl({ src: [crashAsset.url], volume: 0.55 }),
    };
  }
  if (!engine) engine = new Howl({ src: [engineAsset.url], loop: true, volume: 0 });
  if (!music) music = new Howl({ src: [musicAsset.url], loop: true, volume: 0 });
}

export const sound = {
  play(key: Key) {
    ensure();
    sfx?.[key].play();
  },
  setSfxMuted(muted: boolean) {
    ensure();
    Howler.mute(muted);
  },
  startEngine() {
    ensure();
    if (!engine) return;
    if (!engine.playing()) engine.play();
    engine.fade(engine.volume(), 0.35, 400);
  },
  stopEngine() {
    if (!engine) return;
    engine.fade(engine.volume(), 0, 350);
  },
  setMusic(on: boolean) {
    ensure();
    if (!music) return;
    if (on) {
      if (!music.playing()) music.play();
      music.fade(music.volume(), 0.18, 800);
    } else {
      music.fade(music.volume(), 0, 500);
    }
  },
};

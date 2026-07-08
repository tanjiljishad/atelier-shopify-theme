/**
 * Click-to-play for the video/brand-story section — poster-first (spec
 * "poster-first for LCP" applies here too, even though this video isn't
 * autoplaying: `preload="none"` plus hiding the <video> until pressed means
 * nothing beyond the poster image downloads unless a visitor asks for it).
 */
export function initVideoSections(root = document) {
  root.querySelectorAll('[data-video-player]').forEach((player) => {
    const playButton = player.querySelector('[data-video-play]');
    const video = player.querySelector('[data-video-element]');
    if (!playButton || !video) return;

    playButton.addEventListener('click', () => {
      playButton.hidden = true;
      video.hidden = false;
      video.play();
    });
  });
}

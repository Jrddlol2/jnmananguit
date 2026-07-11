export interface HeroImageConfig {
  image: string;
  /** CSS object-position value used at md+ (desktop) widths */
  desktopPosition: string;
  /** CSS object-position value used below the md breakpoint (mobile) */
  mobilePosition: string;
}

// object-cover crops differently depending on how the image's aspect ratio
// compares to the viewport's. This photo is landscape (3:2); on a tall
// mobile screen it gets scaled to fill the height and only its center ~30%
// width band stays visible — at plain "center" that band cuts the person
// out of frame entirely and leaves just the mountain. Shifting the mobile
// focal point right keeps both her and Fuji's peak in frame.
//
// To swap in a new hero photo with a different composition, just update
// `image` and re-tune these two position values for where its subject sits.
export const heroImage: HeroImageConfig = {
  image: '/images/hero/homepage-hero.jpg',
  desktopPosition: 'center center',
  mobilePosition: '72% center',
};

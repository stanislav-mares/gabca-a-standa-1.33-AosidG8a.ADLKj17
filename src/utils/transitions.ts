// Délka i easing slidu panelu na jednom místě — směry se liší jen názvem
// keyframes (deklarované v global.css), ne časováním.
const DURATION = "1.2s";
// Symetrická a záměrně plochá křivka — rychlost je po většinu dráhy téměř
// konstantní, jen s měkkým rozjezdem a dosednutím. Silně decelerující křivky
// (typu `cubic-bezier(0.32, 0.72, 0, 1)`) na 1.2s nefungují: ujedou většinu
// dráhy hned a zbývající čas se pak čte jako zaseknutí. Ani `ease-in-out` není
// ideální — má vyšší špičku uprostřed a ostřejší dobrzdění.
const EASING = "cubic-bezier(0.45, 0.05, 0.55, 0.95)";

export const slideTransition = {
  forwards: {
    old: {
      name: "slide-out-right",
      duration: DURATION,
      easing: EASING,
    },
    new: {
      name: "slide-in-left",
      duration: DURATION,
      easing: EASING,
    },
  },
  backwards: {
    old: {
      name: "slide-out-left",
      duration: DURATION,
      easing: EASING,
    },
    new: {
      name: "slide-in-right",
      duration: DURATION,
      easing: EASING,
    },
  },
};

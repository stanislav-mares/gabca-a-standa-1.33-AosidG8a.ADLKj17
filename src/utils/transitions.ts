// Délka i easing slidu panelu na jednom místě — směry se liší jen názvem
// keyframes (deklarované v global.css), ne časováním.
const DURATION = "1.2s";
const EASING = "ease-in-out";

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

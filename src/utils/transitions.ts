export const slideTransition = {
  forwards: {
    old: {
      name: "slide-out-right",
      duration: "0.8s",
      easing: "ease-in-out",
    },
    new: {
      name: "slide-in-left",
      duration: "0.8s",
      easing: "ease-in-out",
    },
  },
  backwards: {
    old: {
      name: "slide-out-left",
      duration: "0.8s",
      easing: "ease-in-out",
    },
    new: {
      name: "slide-in-right",
      duration: "0.8s",
      easing: "ease-in-out",
    },
  },
};

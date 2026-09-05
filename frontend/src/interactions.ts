/** Add buttons here; motion names match groups in kurisu.model3.json. */
export const interactions = {
  shoulder: {
    backendId: 1,
    motion: "TapReaction",
    label: "Touch shoulder",
    // All four values use the shared 600 x 800 character design space.
    // 15% x 7.5% corresponds to 90 x 60 design pixels.
    position: { top: "45%", left: "50%", width: "15%", height: "7.5%" },
  },
};

export type InteractionName = keyof typeof interactions;

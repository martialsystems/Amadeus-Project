/** Add buttons here; motion names match groups in kurisu.model3.json. */
export const interactions = {
  shoulder: {
    backendId: 1,
    motion: "TapReaction",
    label: "Touch shoulder",
    // Percentages are relative to the character viewport.
    position: { top: "45%", left: "50%", width: "90px", height: "60px" },
  },
};

export type InteractionName = keyof typeof interactions;

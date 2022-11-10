export type Style = {
  opacity: number;
  wireframe: boolean;
  is_detailed: boolean;
  lights: {
    ambient: number;
    directional: {
      z: number;
      intensity: number;
      color: number;
    };
  };
};

export const styles: Record<'default' | 'detailed', Style> = {
  default: {
    opacity:     0.7,
    wireframe:   true,
    is_detailed: false,
    lights:      {
      ambient:     0xdfdfdf,
      directional: {
        z:         1.0,
        intensity: 0.15,
        color:     0x555555,
      },
    },
  },
  detailed: {
    opacity:     1.0,
    wireframe:   false,
    is_detailed: true,
    lights:      {
      ambient:     0x444444,
      directional: {
        z:         0.6,
        intensity: 0.25,
        color:     0xffffff,
      },
    },
  },
};

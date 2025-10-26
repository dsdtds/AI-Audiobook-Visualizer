export interface Duration {
  hours: number;
  minutes: number;
  seconds: number;
}

export const imageStyles = ["Fantasy", "Sci-Fi", "Realistic", "Hand-drawn", "Children's Book"] as const;
export type ImageStyle = typeof imageStyles[number];

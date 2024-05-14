export interface Config {
  buzzer: {
    pin: number;
  },
  pinConfig: {
    id: string;
    pin: number;
  }[];
};

export interface Data {
  id: string;
  operation: string;
};
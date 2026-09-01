export type SetupItem = {
  key: string;
  kind: 'secret' | 'env';
  required: boolean;
  present: boolean;
  valid: boolean;
  issue: string | null;
  description: string;
};

export type SetupData = {
  ready: boolean;
  items: SetupItem[];
};

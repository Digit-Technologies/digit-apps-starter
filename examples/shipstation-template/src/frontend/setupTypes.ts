export type SetupItem = {
  key: string;
  kind: 'secret' | 'env' | 'database';
  required: boolean;
  present: boolean;
  valid: boolean;
  issue: string | null;
  where: string;
  description: string;
};

export type SetupData = {
  ready: boolean;
  items: SetupItem[];
};

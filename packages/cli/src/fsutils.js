import fs from 'node:fs/promises';
import path from 'node:path';

const DEFAULT_EXCLUDE = new Set(['node_modules', '.git', '.vite']);

export async function pathExists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

export async function copyPath(src, dest) {
  const stat = await fs.stat(src);
  if (stat.isDirectory()) {
    await copyDir(src, dest);
  } else {
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.copyFile(src, dest);
  }
}

export async function copyDir(src, dest, { exclude = DEFAULT_EXCLUDE } = {}) {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });
  for (const ent of entries) {
    if (exclude.has(ent.name) || ent.name.endsWith('.zip')) continue;
    const from = path.join(src, ent.name);
    const to = path.join(dest, ent.name);
    if (ent.isDirectory()) {
      await copyDir(from, to, { exclude });
    } else if (ent.isFile() || ent.isSymbolicLink()) {
      await fs.copyFile(from, to);
    }
  }
}

export async function rmrf(p) {
  await fs.rm(p, { recursive: true, force: true });
}
